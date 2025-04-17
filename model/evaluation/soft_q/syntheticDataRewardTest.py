import numpy as np
import pandas as pd
import random
import matplotlib.pyplot as plt
import seaborn as sns ####### Kara Added
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import statistics
import os
import io
import boto3
import time
from customModel import UserEmbeddingModel, load_s3_object, QNetworkWithUserEmbedding, train, create_dataloader
import warnings

warnings.filterwarnings("ignore", category=FutureWarning, module="torch")

# logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s", force=True)
# logger = logging.getLogger(__name__)

#### Global variables
difficulty_mapping = {"easy": 0, "medium": 1, "difficult": 2}
difficulty_mapping_rev = {0: "easy", 1: "medium", 2:"difficult"}
state_cols = ['prev_is_correct','questions_roll_ct','correct_answers_roll_sum','percent_correct_roll',
              'percent_correct_group_roll','elapsed_time_cum_avg','prev_is_slow','cumulative_reward']
reward_colums = ['earned_reward', 'possible_reward'] ## to calculate cummilative reward
num_sessions = 50
user_input_size = 3
user_embedding_dim = 4
minMaxDefs = {"Current": {
    'total_questions': {'min': 1, 'max': 1750},
    'total_correct': {'min': 1, 'max': 1530},
    'average_user_time': {'min': 0, 'max': 45000000},
    },
    "EdNet": {
    'total_questions': {'min': 1, 'max': 40157},
    'total_correct': {'min': 1, 'max': 34233},
    'average_user_time': {'min': 0, 'max': 93681000},
    },
    "SLAM": {
    'total_questions': {'min': 1, 'max': 3428},
    'total_correct': {'min': 1, 'max': 2878},
    'average_user_time': {'min': 0, 'max': 43946000},
    }
    }
USER_PROFILES = {
    # "beginner": {"base_accuracy": 0.6, 
    #              "reaction_time": 3.0,
    #              "accuracy_decay": 0.08, 
    #              "fatigue_factor": 0.0002},
    "proficient_beginner": {"base_accuracy": 0.9, 
                 "reaction_time": 3.0,
                 "accuracy_decay": 0.45, 
                 "fatigue_factor": 0.0002},


    "intermediate": {"base_accuracy": 0.7, 
                     "reaction_time": 2.0,
                     "accuracy_decay": 0.05, 
                     "fatigue_factor": 0.0002},

    "expert": {"base_accuracy": 0.9, 
               "reaction_time": 1.5,
               "accuracy_decay": 0.02,
                 "fatigue_factor": 0.0002},
    # user who does not change accuracy at any point
    "steady": {"base_accuracy": 0.7, 
               "reaction_time": 2.0,
                "accuracy_decay": 0.0, 
                "fatigue_factor": 0.0},
    # user who increases accuracy with practice
    "adaptive_learner": {"base_accuracy": 0.6, 
                         "reaction_time": 2.5,
                         "accuracy_decay": 0.06,
                         "fatigue_factor": 0.0002,
                         "learning_rate": 0.01},
    "cognitive_decline": {"base_accuracy": 0.6, 
                          "reaction_time": 3.0,
                          "accuracy_decay": 0.08, 
                          "fatigue_factor": 0.0008}
}

my_model_path = "tst/models/primary_model_Mar_31.pt"
embedder = UserEmbeddingModel(user_input_size, user_embedding_dim)


targetModel = load_s3_object(my_model_path)

criterion = nn.MSELoss()  # Use MSELoss for Q-value regression


#### End Global Variables

#### Model Types
class AlwaysEasy:
    def select_difficulty(self, state, difficulty, reward, user_embedding):
        return 0  # Return easy
class AlwaysMedium:
    def select_difficulty(self, state, difficulty, reward, user_embedding):
        return 1  # Return medium
class AlwaysHard:
    def select_difficulty(self, state, difficulty, reward, user_embedding):
        return 2  # Return difficult
    
class SimpleRLModel:
    def select_difficulty(self, state, difficulty, reward, user_embedding):
        if reward > 0 and difficulty < 2:
            return difficulty + 1  # Increase difficulty if performance is strong
        elif reward == 0 and difficulty > 0:
            return difficulty - 1  # Decrease difficulty if struggling
        return difficulty  # Maintain same difficulty

class RandomRLModel:
    def select_difficulty(self, state, difficulty, reward, user_embedding):
        difficulty = random.randint(0,2)
        return difficulty  # Always return a random difficulty
    
class OurRLModel:

    def select_difficulty(self, state, difficulty, reward, user_embedding):

        state = torch.tensor([[state['prev_is_correct'],
                               state['questions_roll_ct'],
                               state['correct_answers_roll_sum'],
                               state['percent_correct_roll'],
                               state['percent_correct_group_roll'],
                               state['elapsed_time_cum_avg'],
                               state['prev_is_slow'],
                               state['cumulative_reward']]],
                               dtype=torch.float)
        user_features = torch.tensor([user_embedding], dtype=torch.float)
        user_embedding = embedder(user_features)
        game_type = torch.tensor([1])  ## Hardcoded for now

        primaryModel.eval()
        with torch.no_grad():  # Disables gradient computation for inference
            q_values = primaryModel(state, user_embedding, game_type)

        difficulty = torch.Tensor.argmax(q_values).item()

        return difficulty  # Always return a random difficulty
    
    def retrain(self, statesDF, numInRetrainBatch, gammaVal = 0.99, alphaVal=0):
        if len(statesDF.index) <= numInRetrainBatch:
            return None, 'No Retrain Needed'
        ### Create the DF to retrain
        allStatesDf = statesDF.copy()
        allStatesDf = allStatesDf[['scaled_states', 'state', 'action', 'reward', 'User Number', 'Embedding List',
                'game type'
                ]].rename(columns = {'reward': 'next_reward', 'scaled_states': 'next_scaled_states', 'action': 'next_action', 
                                     'Embedding List': 'next Embedding List', 'game type': 'next game type'})
        allStatesDf['next Embedding List'] = allStatesDf['next Embedding List'].apply(lambda x: embedder(torch.tensor([x])).tolist()[0])
        allStatesDf['next_scaled_states'] = allStatesDf['next_scaled_states'].apply(lambda x: [x[col] for col in state_cols])
        allStatesDf['scaled_states'] = allStatesDf.groupby(['User Number'])['next_scaled_states'].shift(1)
        allStatesDf['action'] = allStatesDf.groupby(['User Number'])['next_action'].shift(1)
        allStatesDf['reward'] = allStatesDf.groupby(['User Number'])['next_reward'].shift(1)
        allStatesDf['Embedding List'] = allStatesDf.groupby(['User Number'])['next Embedding List'].shift(1)
        allStatesDf['game type'] = allStatesDf.groupby(['User Number'])['next game type'].shift(1)
        allStatesDf = allStatesDf[['User Number',
                                   'scaled_states',
                                   'action',
                                   'reward',
                                   'Embedding List',
                                   'game type',
                                   'next_scaled_states',
                                   'next Embedding List',
                                   'next game type']]
        allStatesDf = allStatesDf.dropna()
        allStatesDf = allStatesDf.sample(numInRetrainBatch)
        # print(allStatesDf)

        dataset, dataloader = create_dataloader(allStatesDf['scaled_states'].to_list(), allStatesDf['action'].to_list(), allStatesDf['reward'].to_list(), 
                                                allStatesDf['Embedding List'].to_list(), allStatesDf['game type'].to_list(), 
                                                allStatesDf['next_scaled_states'].to_list(), allStatesDf['next Embedding List'].to_list(), 
                                                allStatesDf['next game type'].to_list(), 
                                                batch_size=numInRetrainBatch)
        optimizer = optim.Adam(primaryModel.parameters(), lr=0.0035)
        model_, metrics = train(primaryModel, targetModel, dataloader, optimizer, criterion, batch_size=10, gamma=gammaVal, alpha=alphaVal)

        # logger.debug("Retrain metrics: %s", metrics)
        
        return metrics, pd.unique(allStatesDf['User Number'])
        



        


#### End Model Types

#### Function Definitions

def applyMinMaxScaling(data, variable, minMax):
    maxVal = minMaxDefs[minMax][variable]['max']
    minVal = minMaxDefs[minMax][variable]['min']

    value = min(data, maxVal)
    if value == minVal:
        return 0
    return ((value - minVal) / (maxVal - minVal))

def simulate_user_response(embedding_dict, user_type, difficulty, prev_state, reward_cols, rewardFunction, minMax, difficulty_streak=0):
    profile = USER_PROFILES[user_type]
    newState = prev_state.copy()
    newRewardCol = reward_cols.copy()
    newEmbedding = [embedding_dict[i].copy() for i in range(3)]

    fatigue_effect = float(np.log1p(prev_state['questions_roll_ct']) * profile["fatigue_factor"])

    # Adjust accuracy and reaction time based on difficulty
    # accuracy = np.clip(np.random.normal(profile["base_accuracy"] - (difficulty * profile["accuracy_decay"]), 0.1), 0, 1)
    # reaction_time = max(np.random.normal(profile["reaction_time"]) + (difficulty * 0.2), 0)
    accuracy = np.clip(np.random.normal(profile["base_accuracy"] - (difficulty * profile["accuracy_decay"]) - fatigue_effect, 0.1), 0, 1)
    reaction_time = max(np.random.normal(profile["reaction_time"]) + (difficulty * 0.2) + fatigue_effect, 0.5)

    # Adaptive learning effect: accuracy improves over repeated sessions
    if "learning_rate" in profile:
      accuracy = min(1, accuracy + prev_state['questions_roll_ct'] * profile["learning_rate"])

    # Determine correctness and reward
    is_correct = 1 if accuracy > random.random() else 0
    # reward = compute_reward(is_correct, difficulty)
    if rewardFunction == 'getRewards':
        # reward, possible_reward = get_rewards(is_correct, difficulty)
        reward, possible_reward = get_rewards_corr(is_correct, difficulty)
    # [{'Num Attempted': 0, 'Num Correct': 0, 'Current Percent':0}, {'Num Attempted': 0, 'Num Correct': 0, 'Current Percent':0}, {'Num Attempted': 0, 'Num Correct': 0, 'Current Percent':0}]
    elif rewardFunction == 'constInc':
        reward, possible_reward = get_rewards_const_inc(is_correct, difficulty)
    elif rewardFunction == 'strPenalty':
        reward, possible_reward = get_rewards_streak_penalty(is_correct, difficulty, difficulty_streak)
    newEmbedding[difficulty]['Num Attempted'] += 1
    if is_correct == 1:
        newEmbedding[difficulty]['Num Correct'] += 1

    newEmbedding[difficulty]['Current Percent'] = newEmbedding[difficulty]['Num Correct']/newEmbedding[difficulty]['Num Attempted']

    # Update state variables
    newState["prev_is_correct"] = is_correct
    newState["questions_roll_ct"] += 1
    newState["correct_answers_roll_sum"] += is_correct
    newState["percent_correct_roll"] = newState["correct_answers_roll_sum"] / newState["questions_roll_ct"]
    newState["percent_correct_group_roll"] = newState["percent_correct_roll"]  # Placeholder for grouped metric
    newState["elapsed_time_cum_avg"] = (newState["elapsed_time_cum_avg"] * (newState["questions_roll_ct"] - 1) + reaction_time) / newState["questions_roll_ct"]
    newState["prev_is_slow"] = 1 if reaction_time > profile["reaction_time"] else 0

    newRewardCol['earned_reward'] += reward
    newRewardCol['possible_reward'] += possible_reward

    newState["cumulative_reward"] = newRewardCol['earned_reward']/newRewardCol['possible_reward']

    scaledStates = newState.copy()
    scaledStates["questions_roll_ct"] = applyMinMaxScaling(scaledStates["questions_roll_ct"], "total_questions", minMax)
    scaledStates["correct_answers_roll_sum"] = applyMinMaxScaling(scaledStates["correct_answers_roll_sum"], "total_correct", minMax)
    scaledStates["elapsed_time_cum_avg"] = applyMinMaxScaling(scaledStates["elapsed_time_cum_avg"], "average_user_time", minMax)

    return newState, reward, newRewardCol, newEmbedding, scaledStates

def get_rewards(is_correct, difficulty):
    is_correct_int = is_correct

    reward_weight = (3*((difficulty==2)&(is_correct_int==1))
                                    +2*((difficulty==1)&(is_correct_int==1))
                                    +1*((difficulty==0)&(is_correct_int==1))
                                    +1*((difficulty==2)&(is_correct_int==0))
                                    +2*((difficulty==1)&(is_correct_int==0))
                                    +3*((difficulty==0)&(is_correct_int==0)))

    weighted_reward = is_correct_int * reward_weight

    return weighted_reward, reward_weight

def get_rewards_corr(is_correct, difficulty):
    is_correct_int = is_correct

    reward_weight = (3*((difficulty==2)&(is_correct_int==1))
                                    +2*((difficulty==1)&(is_correct_int==1))
                                    +1*((difficulty==0)&(is_correct_int==1))
                                    +1*((difficulty==2)&(is_correct_int==0))
                                    +2*((difficulty==1)&(is_correct_int==0))
                                    +3*((difficulty==0)&(is_correct_int==0)))

    if is_correct:
        weighted_reward = reward_weight
    else:
        weighted_reward = -1 * reward_weight

    return weighted_reward, reward_weight

def get_rewards_const_inc(is_correct, difficulty): ### Consistent punishment and reward across difficulty types
    is_correct_int = is_correct

    reward_weight = (1*((difficulty==2)&(is_correct_int==1))
                                    +1*((difficulty==1)&(is_correct_int==1))
                                    +1*((difficulty==0)&(is_correct_int==1))
                                    +1*((difficulty==2)&(is_correct_int==0))
                                    +1*((difficulty==1)&(is_correct_int==0))
                                    +1*((difficulty==0)&(is_correct_int==0)))

    if is_correct:
        weighted_reward = reward_weight
    else:
        weighted_reward = -1 * reward_weight
    # weighted_reward = is_correct_int * reward_weight

    return weighted_reward, reward_weight

def get_rewards_streak_penalty(is_correct, difficulty, difficulty_streak):
    is_correct_int = is_correct
    streak_penalty = -1 if difficulty_streak > 3 else 0

    reward_weight = (3*((difficulty==2)&(is_correct_int==1))
                                    +2*((difficulty==1)&(is_correct_int==1))
                                    +1*((difficulty==0)&(is_correct_int==1))
                                    +1*((difficulty==2)&(is_correct_int==0))
                                    +2*((difficulty==1)&(is_correct_int==0))
                                    +3*((difficulty==0)&(is_correct_int==0)))

    if is_correct:
        weighted_reward = reward_weight + streak_penalty
    else:
        weighted_reward = -1 * reward_weight + streak_penalty
    # weighted_reward = is_correct_int * reward_weight
    
    return weighted_reward, reward_weight


def visualize_results(data, titles, numRows = 2, numCols = 2):
    fig, axes = plt.subplots(numRows, numCols, figsize=(18,10))
    for i in range(numRows):
        for j in range(numCols):
            sns.lineplot(data = data[numCols*i+j], x = "Question Number", y = "action", hue = "User Type", units = "User Number", estimator = None, ax=axes[i, j]) ####### Kara Added
            axes[i, j].set_title("Difficulty Progression Over Sessions: " + titles[numRows*i+j], fontsize=10)
    plt.show()

    # # Plot Cumulative Reward
    fig, axes = plt.subplots(numRows, numCols,  figsize=(18,10))
    for i in range(numRows):
        for j in range(numCols):
            sns.lineplot(data = data[numCols*i+j], x = "Question Number", y = "Cumultive Reward", hue = "User Type", units = "User Number", estimator = None, ax=axes[i, j ]) ####### Kara Added
            axes[i, j].set_title("Cumulative Reward Over Sessions: " + titles[numRows*i+j], fontsize=10)
    plt.show()

    # # Plot Accuracy Percen
    fig, axes = plt.subplots(numRows, numCols,  figsize=(18,10))
    for i in range(numRows):
        for j in range(numCols):
            sns.lineplot(data = data[numCols*i+j], x = "Question Number", y = "Accuracy Percent", hue = "User Type", units = "User Number", estimator = None, ax=axes[i, j ]) ####### Kara Added
            axes[i, j].set_title("Accuracy Percent Over Sessions: " + titles[numRows*i+j], fontsize=10)
    plt.show()

def findAvgCumReward(data, expName, modelName, rewardType, minMaxType, minNum, finalAvgCumulativeRewards):
    finalVals = data.groupby('User Number').tail(1)
    avg_cum_reward = finalVals.groupby('User Type')['Cumultive Reward'].mean().reset_index()
    avg_cum_reward['Experiment Type'] = expName
    avg_cum_reward['Model Type'] = modelName
    avg_cum_reward['Reward Type'] = rewardType
    avg_cum_reward['MinMax Type'] = minMaxType
    avg_cum_reward['Num Sessions Per User'] = minNum
    avg_cum_reward['Experiment Run'] = experimentRun
    avg_cum_reward = avg_cum_reward[['Experiment Type', 'Model Type', 'Reward Type', 'MinMax Type', 'Num Sessions Per User', 'Experiment Run', 'User Type', 'Cumultive Reward']]
    if len(finalAvgCumulativeRewards.index) == 0:
        finalAvgCumulativeRewards = avg_cum_reward
    else:
        finalAvgCumulativeRewards = pd.concat([finalAvgCumulativeRewards, avg_cum_reward])
    return finalAvgCumulativeRewards

def avg_question_diff(data, expName, modelName, rewardType, minMaxType, minNum, finalNumServedDifficulties):
    total_questions = data.groupby(['User Number'])['Question Number'].max().reset_index()
    avg_num_each_type = data.groupby(['User Type', 'User Number', 'action']).size().reset_index().merge(total_questions, how = 'inner', on = 'User Number')
    avg_num_each_type['Percent Type'] = avg_num_each_type[0]/avg_num_each_type['Question Number']
    avg_num_each_type = avg_num_each_type.groupby(['User Type', 'action'])['Percent Type'].mean().reset_index().rename(columns={'action': 'Difficulty'})
    avg_num_each_type['Difficulty'] = avg_num_each_type['Difficulty'].map(difficulty_mapping_rev)
    avg_num_each_type['Experiment Type'] = expName
    avg_num_each_type['Model Type'] = modelName
    avg_num_each_type['Reward Type'] = rewardType
    avg_num_each_type['MinMax Type'] = minMaxType
    avg_num_each_type['Num Sessions Per User'] = minNum
    avg_num_each_type['Experiment Run'] = experimentRun
    avg_num_each_type = avg_num_each_type[['Experiment Type', 'Model Type', 'Reward Type', 'MinMax Type', 'Num Sessions Per User', 'Experiment Run', 'User Type', 'Difficulty', 'Percent Type']]

    if len(finalNumServedDifficulties.index) == 0:
        finalNumServedDifficulties = avg_num_each_type
    else:
        finalNumServedDifficulties = pd.concat([finalNumServedDifficulties, avg_num_each_type])
    return finalNumServedDifficulties
    

def runExperiment(modelClass, rewardFunction, minMax, allStates, finalAvgCumulativeRewards, finalNumServedDifficulties, trainingData, minNum = 1):
    experimentName = modelClass + ', ' + rewardFunction + ', ' + minMax
    sessionTrackerName = 'Num Sessions: ' + experimentName
    userInfo[sessionTrackerName] = 0
    if modelClass == 'simple':
        rl_model = SimpleRLModel()
    elif modelClass == 'easy':
        rl_model = AlwaysEasy()
    elif modelClass == 'medium':
        rl_model = AlwaysMedium()
    elif modelClass == 'hard':
        rl_model = AlwaysHard()
    elif modelClass == 'random':
        rl_model = RandomRLModel()
    elif modelClass == 'ours':
        rl_model = OurRLModel()
    elif 'oursRetrain' in modelClass:
        rl_model = OurRLModel()
        values = modelClass.split(':')
        gamma = int(values[1])/100
        alpha = int(values[3])/100
        numRetrains = 0
        print(f"GAMMA: {gamma}, ALPHA: {alpha}")

    stateTable = pd.DataFrame(columns = ['User Number',
                                         'User Type',
                                         'Embedding List',
                                         'state',
                                         'scaled_states',
                                         'action',
                                         'reward',
                                         'reward_cols',
                                         'embedding',
                                         'game type'
                                        ])
    for k in range(minNum):
    # while userInfo[sessionTrackerName].min() < minNum: ## Repeats until all users have had 2 sessions
        # currentUser = userInfo.sample(1).to_dict(orient = 'records')[0]
        for j in range (len(userInfo.index)):
            currentUser = userInfo.iloc[j, :].to_dict()
            for i in range(10): # Mimic the 10 question session
                if currentUser['User Number'] not in list(stateTable['User Number']):
                    currentAction = 0
                    currentRewardCols = {col: 0 for col in reward_colums}
                    currentState = {col: 0 for col in state_cols}
                    currentEmbedding = [{'Num Attempted': 0, 'Num Correct': 0, 'Current Percent':0}, {'Num Attempted': 0, 'Num Correct': 0, 'Current Percent':0}, {'Num Attempted': 0, 'Num Correct': 0, 'Current Percent':0}]
                    currentDiffStreak = 0
                else:
                    mostRecent = stateTable[stateTable['User Number'] == currentUser['User Number']].tail(1).to_dict(orient = 'records')[0]
                    currentRewardCols = mostRecent['reward_cols']
                    currentState = mostRecent['state']
                    currentScaledStates = mostRecent['scaled_states']
                    currentEmbedding = mostRecent['embedding']
                    currentEmbeddingList = [currentEmbedding[i]['Current Percent'] for i in range(3)]
                    currentAction = rl_model.select_difficulty(currentScaledStates, mostRecent['action'], mostRecent['reward'], currentEmbeddingList)
                    tail_n = min(10, stateTable[stateTable['User Number'] == currentUser['User Number']].shape[0])
                    currentDiffStreak = (
                            (stateTable[stateTable['User Number'] == currentUser['User Number']]['action'].tail(tail_n)) == mostRecent['action']
                        ).cumprod().sum()

                newState, reward, currentRewardCols, newEmbedding, scaledStates = simulate_user_response(currentEmbedding,
                                                                                                         currentUser['User Type'],
                                                                                                         currentAction,
                                                                                                         currentState,
                                                                                                         currentRewardCols,
                                                                                                         rewardFunction,
                                                                                                         minMax,
                                                                                                         currentDiffStreak)
                newEmbeddingList = [newEmbedding[i]['Current Percent'] for i in range(3)]
                currentRow = [{'User Number': currentUser['User Number'],
                               'User Type': currentUser['User Type'],
                               'Embedding List': newEmbeddingList,
                               'state': newState,
                               'scaled_states': scaledStates,
                               'action': currentAction, 
                               'reward': reward,
                               'reward_cols': currentRewardCols,
                               'embedding': newEmbedding,
                               'game type': 1}]
                
                stateTable = pd.concat([stateTable, pd.DataFrame(currentRow)])

            userInfo.loc[userInfo['User Number'] == currentUser['User Number'], sessionTrackerName] += 1
            if 'oursRetrain' in modelClass:
                if numRetrains == 0:
                    startingData = pd.DataFrame([{'Experiment': experimentName, 
                                                  'Experiment Run': experimentRun, 
                                                  'Model Type': modelClass, 
                                                  'Reward Type': rewardFunction,
                                                  'MinMax Type': minMax, 
                                                  'Num Sessions Per User': minNum, 
                                                  'Gamma': gamma, 
                                                  'Alpha': alpha,
                                                  'Retrain Num': 0, 
                                                  'Model Weights': primaryModel.print_model_weights()[-100:], 
                                                  'Users in Training': None, 
                                                  'Loss': None,
                                                  'Entropy': None,
                                                  'Avg Q-value': None,
                                                  'Avg Q-value variance': None
                                                 }])
                    trainingData = pd.concat([trainingData, startingData])

                newMetrics, users_In_retrain = rl_model.retrain(stateTable, 10, gammaVal=gamma, alphaVal=alpha)

                # logger.debug("newMetrics debug: %s", newMetrics)e
                
                numRetrains += 1
                newData = pd.DataFrame([{'Experiment': experimentName,
                                         'Experiment Run': experimentRun,
                                         'Model Type': modelClass,
                                         'Reward Type': rewardFunction,
                                         'MinMax Type': minMax,
                                         'Num Sessions Per User': minNum,
                                         'Gamma': gamma,
                                         'Alpha': alpha,
                                         'Retrain Num': numRetrains,
                                         'Model Weights': primaryModel.print_model_weights()[-100:],
                                         'Users in Training': users_In_retrain,
                                         # 'Loss': newMetrics
                                         'Loss': newMetrics['loss'] if newMetrics else None,
                                         'Entropy': newMetrics['entropy'] if newMetrics else None,
                                         'Avg Q-value': newMetrics['q_values'] if newMetrics else None,
                                         'Avg Q-value variance': newMetrics['q_value_variance'] if newMetrics else None
                                        }])
                trainingData = pd.concat([trainingData, newData])


    stateTable['Question Number'] = stateTable['state'].apply(lambda x: x['questions_roll_ct'])
    stateTable['Cumultive Reward'] = stateTable['state'].apply(lambda x: x['cumulative_reward'])
    stateTable['Accuracy Percent'] = stateTable['state'].apply(lambda x: x['percent_correct_roll'])
    stateTable['Experiment Type'] = experimentName
    stateTable['Experiment Run'] = experimentRun
    stateTable['Model Type'] = modelClass
    stateTable['Reward Type'] = rewardFunction
    stateTable['MinMax Type'] = minMax
    stateTable['Num Sessions Per User'] = minNum
    stateTable

    if len(allStates.index) == 0:
        allStates = stateTable
    else:
        allStates = pd.concat([allStates, stateTable])


    # Save Final Avg Cumulative Reward
    finalAvgCumulativeRewards = findAvgCumReward(stateTable, experimentName, modelClass, rewardFunction, minMax, minNum, finalAvgCumulativeRewards)

    finalNumServedDifficulties = avg_question_diff(stateTable, experimentName, modelClass, rewardFunction, minMax, minNum, finalNumServedDifficulties)

    return allStates, sessionTrackerName, finalAvgCumulativeRewards, finalNumServedDifficulties, trainingData






#### End Function Definitions

random_users = False
num_users = 60
model_possibilites = ['simple', 'easy', 'medium', 'hard', 'random', 'ours', 'oursRetrainGamma:99:Alpha:0', 'oursRetrainGamma:90:Alpha:0', 'oursRetrainGamma:50:Alpha:0', 'oursRetrainGamma:10:Alpha:0', 'oursRetrainGamma:90:Alpha:10', 'oursRetrainGamma:90:Alpha:50', 'oursRetrainGamma:90:Alpha:100']
# model_possibilites = ['simple', 'easy', 'medium', 'hard', 'random', 'ours']
# model_possibilites = ['simple', 'easy', 'medium', 'hard', 'random', 'ours', 'oursRetrainGamma:99', 'oursRetrainGamma:90', 'oursRetrainGamma:50', 'oursRetrainGamma:10']
# model_possibilites = ['simple', 'easy', 'medium', 'hard', 'random', 'ours', 'oursRetrainGamma:99']
# model_possibilites = ['simple', 'hard', 'ours', 'oursRetrainGamma:99', 'oursRetrainGamma:90', 'oursRetrainGamma:50', 'oursRetrainGamma:10']
# model_possibilites = ['simple', 'hard', 'ours', 'oursRetrainGamma:90', 'oursRetrainGamma:50']
# min_max_possibilites = ['Current', 'EdNet', 'SLAM']
min_max_possibilites = ['Current']
reward_possibilities = ['getRewards', 'constInc', 'strPenalty']
# reward_possibilities = ['getRewards']

number_of_experiments = 5
min_nums = [5]
# min_nums = [1, 3, 5, 10]
filePath = 'onApr10_Reward_Function_str_update_Corrected_RewardJLD_'

### Start Main Experiment Code
### Random User
if random_users:
    users = random.choices(list(USER_PROFILES.keys()), k=num_users)
else:
    ofEach = int(num_users/len(list(USER_PROFILES.keys())))
    users = []
    for user in USER_PROFILES.keys():
        users += [user] *  ofEach 
    random.shuffle(users)

# userTypes = ['beginner', 'intermediate', 'expert', 'steady', 'adaptive_learner', 'cognitive_decline']
userTypes = ['proficient_beginner', 'intermediate', 'expert', 'steady', 'adaptive_learner', 'cognitive_decline']

userNumber = list(range(1, num_users + 1))

userInfo = pd.DataFrame({'User Number':userNumber, 'User Type':users})
userInfo['True Embedding'] = userInfo['User Type'].apply(lambda x: [USER_PROFILES[x]['base_accuracy'] -  USER_PROFILES[x]['accuracy_decay']*i for i in range(3)])

finalAvgCumulativeRewards = pd.DataFrame(columns=['Experiment Type', 'Model Type', 'Reward Type', 'MinMax Type', 'Num Sessions Per User', 'Experiment Run', 'User Type', 'Cumultive Reward'])
finalNumServedDifficulties = pd.DataFrame(columns=['Experiment Type', 'Model Type', 'Reward Type', 'MinMax Type', 'Num Sessions Per User', 'Experiment Run', 'User Type', 'Difficulty', 'Percent Type'])

allStates = pd.DataFrame(columns=['User Number', 'User Type', 'Embedding List', 'state', 'scaled_states',
       'action', 'reward', 'reward_cols', 'embedding', 'game type',
       'Question Number', 'Cumulative Reward', 'Accuracy Percent',
       'Experiment Type', 'Experiment Run', 'Model Type', 'Reward Type', 'MinMax Type', 'Num Sessions Per User', 'Loss', 'Entropy', 'Avg Q-value', 'Avg Q-value variance'])


trainingData = pd.DataFrame(columns=['Experiment', 'Experiment Run', 'Model Type', 'Reward Type','MinMax Type', 'Num Sessions Per User', 'Gamma', 'Retrain Num', 'Model Weights', 'Users in Training', 'Loss', 'Entropy', 'Avg Q-value', 'Avg Q-value variance'])

startTime = time.time()
for experimentRun in range(1, number_of_experiments + 1):
    for min_num in min_nums:
        for minMaxPos in min_max_possibilites:
            for reward in reward_possibilities:
                for model in model_possibilites:
                    if 'ours' in model:
                        primaryModel = load_s3_object(my_model_path)
                    print(f"Model: {model}, Reward: {reward}")
                    allStates, not_needed, finalAvgCumulativeRewards, finalNumServedDifficulties, trainingData = runExperiment(
                        model,
                        reward,
                        minMaxPos,
                        allStates,
                        finalAvgCumulativeRewards,
                        finalNumServedDifficulties,
                        trainingData,
                        minNum = min_num
                    )
endTime = time.time()

print(finalAvgCumulativeRewards) #### save this
print(allStates) ### Save this
# print(trainingData) #### Save this
allStates.to_csv(filePath + 'allStates.csv', index = False)
# finalAvgCumulativeRewards.to_csv(filePath + 'finalCRewards.csv', index = False)
trainingData.to_csv(filePath + 'trainingData.csv', index = False)
for min_num in min_nums:
    for minmax in min_max_possibilites:
        for reward in reward_possibilities:
            plt.figure(figsize=(12, 6))
            sns.barplot(data = finalAvgCumulativeRewards[(finalAvgCumulativeRewards['Reward Type'] == reward) 
                        & (finalAvgCumulativeRewards['MinMax Type'] == minmax) 
                        & (finalAvgCumulativeRewards['Num Sessions Per User'] == min_num)],
                        x = "User Type",
                        y = "Cumultive Reward",
                        hue = "Model Type",
                        order = userTypes
                       )
            plt.ylabel("Average Final Cumulative Reward")
            plt.title(f"Comparison of Average Final Cumulative Reward By User Type Across Models\nReward Function: {reward}, Scaling Type: {minmax}, Num Sessions Per User: {min_num}")
            plt.legend()
            plt.show()

            plt.figure(figsize=(12, 6))
            sns.barplot(data = finalAvgCumulativeRewards[(finalAvgCumulativeRewards['Reward Type'] == reward) 
                        & (finalAvgCumulativeRewards['MinMax Type'] == minmax) 
                        & (finalAvgCumulativeRewards['Num Sessions Per User'] == min_num
                          )].groupby(['Experiment Type', 'Model Type', 'Reward Type', 'MinMax Type', 'Experiment Run', 'Num Sessions Per User'
                                     ])['Cumultive Reward'].mean().reset_index(), 
                        x = "Model Type",
                        y = "Cumultive Reward",
                        hue = "Model Type",
                        order = model_possibilites
                       )
            plt.ylabel("Average Final Cumulative Reward: Overall")
            plt.title(f"Comparison of Average Final Cumulative Reward Across Models\nReward Function: {reward}, Scaling Type: {minmax}, Num Sessions Per User: {min_num}")
            plt.show()

            num_plots = len(model_possibilites)  # Number of subplots needed
            fig, axes = plt.subplots(1, num_plots, figsize=(3 * num_plots, 2), sharey=True)
            for i in range(num_plots):
                currentData = allStates[(allStates['Model Type'] == model_possibilites[i]) & (allStates['Num Sessions Per User'] == min_num)]
                sns.violinplot(x="action", y="User Type", data=currentData, inner="quartile", hue="User Type", legend=False, ax=axes[i])
                axes[i].set_title(f"Difficulty Distribution Per User Type - {model_possibilites[i]}")
                axes[i].set_ylabel("User Type")
                axes[i].set_xlabel("Difficulty: [0 = Easy, 1 = Medium, 2 = Hard]")

            plt.tight_layout()  # Adjust layout to prevent overlapping
            plt.show()

if len(min_nums) > 1:
    for minmax in min_max_possibilites:
        for reward in reward_possibilities:
            # plt.figure(figsize=(12, 6))
            # sns.barplot(data = finalAvgCumulativeRewards[(finalAvgCumulativeRewards['Reward Type'] == reward) & (finalAvgCumulativeRewards['MinMax Type'] == minmax)], x = "User Type", y = "Cumultive Reward", hue = "Model Type", order = userTypes)
            # plt.ylabel("Average Final Cumulative Reward")
            # plt.title(f"Comparison of Average Final Cumulative Reward By User Type Across Models\nReward Function: {reward}, Scaling Type: {minmax}, Num Sessions Per User: {min_num}")
            # plt.legend()
            # plt.show()

            plt.figure(figsize=(12, 6))
            sns.barplot(data = finalAvgCumulativeRewards[(finalAvgCumulativeRewards['Reward Type'] == reward) & (finalAvgCumulativeRewards['MinMax Type'] == minmax)].groupby(['Experiment Type', 'Model Type', 'Reward Type', 'MinMax Type', 'Experiment Run', 'Num Sessions Per User'])['Cumultive Reward'].mean().reset_index(), x = "Model Type", y = "Cumultive Reward", hue = "Num Sessions Per User", order = model_possibilites)
            plt.ylabel("Average Final Cumulative Reward: Overall")
            plt.title(f"Comparison of Average Final Cumulative Reward Across Models\nReward Function: {reward}, Scaling Type: {minmax}")
            plt.show()

    

print(f'Running that took {(endTime-startTime)/60} minutes')

