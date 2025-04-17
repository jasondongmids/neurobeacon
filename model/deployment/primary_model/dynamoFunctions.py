import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key
from boto3.dynamodb.types import TypeDeserializer
import time
import datetime
from decimal import Decimal
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from customModel import UserEmbeddingModel, load_s3_object, QNetworkWithUserEmbedding, train, create_dataloader

deserializer = TypeDeserializer()

gameTypeEmbed = {
    'math': 3,
    'memory': 4,
    'reaction': 5
    ,'sudoku': 6
    ,'trivia': 7}

minMaxThresholds = {
    'total_questions': {'min': 1, 'max': 1750},
    'total_correct': {'min': 1, 'max': 1530},
    'average_user_time': {'min': 0, 'max': 45000000},
    }
difficulty_mapping = {"easy": 0, "medium": 1, "hard": 2}


def clean_response(item):
    def wrap_value(v):
        """Wrap values in the appropriate DynamoDB type format before deserialization."""
        if isinstance(v, str):
            return {'S': v}
        elif isinstance(v, bool):
            return {'BOOL': v}
        elif isinstance(v, (int, float)):  # Keep normal numbers unchanged
            return {'N': str(v)}
        elif isinstance(v, Decimal):  # Convert Decimal to float
            return {'N': str(float(v))}
        elif v is None:
            return {'NULL': True}
        elif isinstance(v, dict):  # Recursively wrap dictionary values
            return {'M': {k: wrap_value(sub_v) for k, sub_v in v.items()}}
        elif isinstance(v, list):  # Wrap each list item appropriately
            return {'L': [wrap_value(sub_v) for sub_v in v]}
        else:
            return {'S': str(v)}  # Default case: Convert to string

    deserialized_item = {k: deserializer.deserialize(wrap_value(v)) for k, v in item.items()}

    # Convert all Decimal values to float after deserialization
    def convert_decimals(obj):
        if isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, dict):
            return {k: convert_decimals(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_decimals(v) for v in obj]
        return obj

    return convert_decimals(deserialized_item)

def query_gsi(table, gsi_index, unix_sec_str, limit=1):
    try:
        if limit != -1:
            response = table.query(
                IndexName='state_type_gsi',
                KeyConditionExpression=Key('state_type').eq(gsi_index) & Key('sk').gt(unix_sec_str),
                ScanIndexForward=False,  # Descending order to get most recent values
                Limit=limit
            )
        else:
            response = table.query(
                IndexName='state_type_gsi',
                KeyConditionExpression=Key('state_type').eq(gsi_index) & Key('sk').gt(unix_sec_str),
                ScanIndexForward=False
            )
        items = response.get('Items', [])

        clean_items = []
        for i in items:
            clean_items.append(clean_response(i))
        return clean_items
    except ClientError as err:
        print('Failed to query', err)

def applyMinMaxScaling(data, variable):
    maxVal = minMaxThresholds[variable]['max']
    minVal = minMaxThresholds[variable]['min']

    value = min(data, maxVal)
    if value == minVal:
        return 0
    return ((value - minVal) / (maxVal - minVal))

def processIntoDataframeRolling(newData, currentUserInfo, existingData):
    newData['percent_correct_group_roll'] = newData['category'].apply(lambda x: x['percent_correct'])
    newData['next_user'] = newData['user_embedding'].apply(lambda x: embedder(torch.tensor([[x['easy_percent'], x['medium_percent'], x['hard_percent']]])).tolist()[0])
    newData['next_states'] = newData.apply(lambda x: [
                    int(x['prev_is_correct']), 
                    applyMinMaxScaling(x['total_questions'], 'total_questions'), 
                    applyMinMaxScaling(x['total_correct'],'total_correct'), 
                    x['percent_correct'], 
                    x['percent_correct_group_roll'], 
                    applyMinMaxScaling(x['average_user_time'], 'average_user_time'), 
                    int(x['prev_is_slow']), 
                    x['total_weighted_reward']
                    ], axis = 1)
    newData['next_game_type'] = newData['game_type'].map(gameTypeEmbed)
    newData['next_game_type'] = newData['next_game_type'] - 3
    newData['next_action'] = newData['difficulty'].map(difficulty_mapping)
    newData = newData[['next_states', 'next_action', 'reward', 'user_state_pk', 'next_user',
            'next_game_type', 'created_at'
            ]].rename(columns = {'reward': 'next_reward'})
    if currentUserInfo is not None:
        data = pd.concat([newData, currentUserInfo])
    else:
        data = newData
    
    finalPerUser = data.groupby(['user_state_pk']).head(1)

    data['states'] = data.groupby(['user_state_pk'])['next_states'].shift(-1)
    data['action'] = data.groupby(['user_state_pk'])['next_action'].shift(-1)
    data['reward'] = data.groupby(['user_state_pk'])['next_reward'].shift(-1)
    data['user'] = data.groupby(['user_state_pk'])['next_user'].shift(-1)
    data['game_type'] = data.groupby(['user_state_pk'])['next_game_type'].shift(-1)
    data = data[['user_state_pk', 'states', 'action', 'reward', 'user', 'game_type', 'next_states', 'next_user', 'next_game_type']]
    data = data.dropna()

    if existingData is not None:
        data = pd.concat([data, existingData])
    return data, finalPerUser

def processIntoDataframe(newData, embedder):

    
    newData['percent_correct_group_roll'] = newData['category'].apply(lambda x: x['percent_correct'])
    newData['next_user'] = newData['user_embedding'].apply(lambda x: embedder(torch.tensor([[x['easy_percent'], x['medium_percent'], x['hard_percent']]])).tolist()[0])
    newData['next_states'] = newData.apply(lambda x: [
                    int(x['prev_is_correct']), 
                    applyMinMaxScaling(x['total_questions'], 'total_questions'), 
                    applyMinMaxScaling(x['total_correct'],'total_correct'), 
                    x['percent_correct'], 
                    x['percent_correct_group_roll'], 
                    applyMinMaxScaling(x['average_user_time'], 'average_user_time'), 
                    int(x['prev_is_slow']), 
                    x['total_weighted_reward']
                    ], axis = 1)
    newData['next_game_type'] = newData['game_type'].map(gameTypeEmbed)
    newData['next_game_type'] = newData['next_game_type'] - 3
    newData['next_action'] = newData['difficulty'].map(difficulty_mapping)
    newData = newData[['next_states', 'next_action', 'reward', 'user_state_pk', 'next_user',
            'next_game_type', 'created_at'
            ]].rename(columns = {'reward': 'next_reward'})


    newData['states'] = newData.groupby(['user_state_pk'])['next_states'].shift(-1)
    newData['action'] = newData.groupby(['user_state_pk'])['next_action'].shift(-1)
    newData['reward'] = newData.groupby(['user_state_pk'])['next_reward'].shift(-1)
    newData['user'] = newData.groupby(['user_state_pk'])['next_user'].shift(-1)
    newData['game_type'] = newData.groupby(['user_state_pk'])['next_game_type'].shift(-1)
    newData = newData[['user_state_pk', 'states', 'action', 'reward', 'user', 'game_type', 'next_states', 'next_user', 'next_game_type']]
    newData = newData.dropna()

    return newData

# gameTypeEmbed = {
#     'math': 3,
#     'memory': 4,
#     'reaction': 5
#     ,'sudoku': 6
#     ,'trivia': 7
# }

# minMaxThresholds = {
#     'total_questions': {'min': 1, 'max': 1750},
#     'total_correct': {'min': 1, 'max': 1530},
#     'average_user_time': {'min': 0, 'max': 45000000},
#     }
# difficulty_mapping = {"easy": 0, "medium": 1, "hard": 2}

# user_input_size = 3
# user_embedding_dim = 4
# embedder = UserEmbeddingModel(user_input_size, user_embedding_dim)

# criterion = nn.MSELoss()  # Use MSELoss for Q-value regression
# my_model_path = "tst/models/model.pt" 
# primaryModel = load_s3_object(my_model_path)
# targetModel = load_s3_object(my_model_path)
# primaryModel.game_embedding = nn.Embedding(5, 1)
# targetModel.game_embedding = nn.Embedding(5, 1)

# numInRetrainBatch = 10

# # query database
# table_name = 'UserStateHxPrd'
# dyn_resource = boto3.resource('dynamodb', region_name = 'us-east-1')
# ushx_table = dyn_resource.Table(table_name)
# unix_current = int(time.time())
# unix_1_week_prev = unix_current - (7 * 24 * 60 * 60)
# startTime = time.time()
# test = query_gsi(ushx_table, gsi_index='state', unix_sec_str=str(unix_1_week_prev), limit=-1)

# df = pd.DataFrame(test)

# # saveForTest = df.iloc[:13, :]
# # df = df.iloc[13:, :]
# # print(saveForTest)
# # print(saveForTest['user_state_pk'])
# # print(df)
# # mostRecentTime = df['created_at'].max()
# # df, finalPerUser = processIntoDataframeRolling(df, None, None) #### Original pulling in

# # endTime = time.time()

# # print(f'Time to pull and process {endTime-startTime}')

# # # # print(finalPerUser)
# # # print(df[df['user_state_pk'] == 'TRIVIA#a4e84488-6031-7072-561c-d46922d862f5'])
# # # print(finalPerUser[finalPerUser['user_state_pk'] == 'TRIVIA#a4e84488-6031-7072-561c-d46922d862f5'])
# # df, finalPerUser = processIntoDataframeRolling(saveForTest, finalPerUser, df) ### Adding in additional data
# # # print(finalPerUser)
# # print(df[df['user_state_pk'] == 'TRIVIA#a4e84488-6031-7072-561c-d46922d862f5'])
# # print(finalPerUser[finalPerUser['user_state_pk'] == 'TRIVIA#a4e84488-6031-7072-561c-d46922d862f5'])

# df = processIntoDataframe(df)

# endTime = time.time()

# print(f'Time to pull and process {endTime-startTime}')


# allTimes = []
# for i in range(1):
#     startTime = time.time()
#     currentRetrainBatch = df.sample(numInRetrainBatch)

#     # print(primaryModel.print_model_weights())

#     dataset, dataloader = create_dataloader(currentRetrainBatch['states'].to_list(), currentRetrainBatch['action'].to_list(), currentRetrainBatch['reward'].to_list(), 
#                                             currentRetrainBatch['user'].to_list(), currentRetrainBatch['game_type'].to_list(), 
#                                             currentRetrainBatch['next_states'].to_list(), currentRetrainBatch['next_user'].to_list(), 
#                                             currentRetrainBatch['next_game_type'].to_list(), 
#                                             batch_size=numInRetrainBatch)
#     optimizer = optim.Adam(primaryModel.parameters(), lr=0.0035)
#     train(primaryModel, targetModel, dataloader, optimizer, criterion, batch_size=10, gamma=0.99)
#     endTime = time.time()
#     # print(primaryModel.print_model_weights())
#     allTimes.append(endTime-startTime)


# print(f'Retraining took an average of {sum(allTimes)/len(allTimes)} seconds over 100 experiments')



