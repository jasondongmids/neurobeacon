## Lab 3
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from joblib import load
from pydantic import BaseModel, ConfigDict, Field, field_validator

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import time
import statistics
import os
import io
import boto3
import pandas as pd

from customModel import UserEmbeddingModel, load_s3_object, QNetworkWithUserEmbedding, train, create_dataloader
from dynamoFunctions import query_gsi, processIntoDataframeRolling, processIntoDataframe



from datetime import datetime
import numpy as np
from os import getenv

logger = logging.getLogger(__name__)




## Request Models For Single Prediction
class state_vars(BaseModel):
    model_config = {"extra": "forbid"}

    states: list[float]
    user_features: list[float]
    game_type: int

    @field_validator('states')
    @classmethod
    def validStates(cls, s: list[float]) -> list[float]:
        if len(s) != 8:
            raise ValueError('Incorrect Number of states')
        return s
    
    @field_validator('user_features')
    @classmethod
    def validStates(cls, s: list[float]) -> list[float]:
        if len(s) != 3:
            raise ValueError('Incorrect Number of user features')
        return s


class Difficulty(BaseModel):
    model_config = {"extra": "forbid"}

    prediction: int




@asynccontextmanager
async def lifespan_mechanism(app: FastAPI):
    logging.info("Starting up Lab3 API")


    # Load the Model on Startup
    global primary_model
    global target_model
    global embedder
    global criterion

    my_model_path = "tst/models/primary_model_Mar_31.pt" 
    embedder = UserEmbeddingModel(3, 4)
    primary_model = load_s3_object(my_model_path)
    target_model = load_s3_object(my_model_path)
    primary_model.game_embedding = nn.Embedding(5, 1)
    target_model.game_embedding = nn.Embedding(5, 1)
    criterion = nn.MSELoss()  # Use MSELoss for Q-value regression


    global table_name
    global dyn_resource
    global ushx_table

    table_name = 'UserStateHxPrd'
    dyn_resource = boto3.resource('dynamodb', region_name = 'us-east-1')
    ushx_table = dyn_resource.Table(table_name)


    yield
    # We don't need a shutdown event for our system, but we could put something
    # here after the yield to deal with things during shutdown
    logging.info("Shutting down Lab3 API")


sub_application_pickl_test = FastAPI(lifespan=lifespan_mechanism)

@sub_application_pickl_test.get("/health")
async def health_check():
    """
    This is a method that checks the health of the endpoint, and can be used to determine if the endpoint is running. 
        It takes no parameters as inputs and returns the time of the current date/time in ISO8601 format. 
    """
    return {"time": datetime.now().isoformat()}



@sub_application_pickl_test.post("/predict", response_model=Difficulty)
async def get_prediction(predict_states: state_vars):
    """
    This is a method that predicts the difficulty of the next question based on the states
    
    It takes in a list of 10 floats, to temporarily represent the states.
    It returns a JSON object made up of 1 parameter:
        prediction: int - The predicted difficulty from the model

    """
    state = torch.tensor([predict_states.states])
    user_features = torch.tensor([predict_states.user_features]) 
    user_embedding = embedder(user_features)
    game_type = torch.tensor([predict_states.game_type])  


    # Make a prediction
    with torch.no_grad():  # Disables gradient computation for inference
        q_values = primary_model(state, user_embedding, game_type)

    predictValue = torch.Tensor.argmax(q_values).item()

    returnVal = Difficulty(prediction=predictValue)
    return returnVal

@sub_application_pickl_test.get("/printWeights")
async def get_weights():
    """
    This method prints the current weights of the model

    """
    return {"weights": primary_model.print_model_weights()}


@sub_application_pickl_test.get("/retrain")
async def retrain():
    """
    This method retrains the model

    """
    numInRetrainBatch = 10
    
    unix_current = int(time.time())
    unix_1_week_prev = unix_current - (7 * 24 * 60 * 60)
    current_data = query_gsi(ushx_table, gsi_index='state', unix_sec_str=str(unix_1_week_prev), limit=-1)
    current_data = pd.DataFrame(current_data)
    current_data = processIntoDataframe(current_data, embedder)
    current_data = current_data.sample(numInRetrainBatch)
    dataset, dataloader = create_dataloader(current_data['states'].to_list(), current_data['action'].to_list(), current_data['reward'].to_list(), 
                                            current_data['user'].to_list(), current_data['game_type'].to_list(), 
                                            current_data['next_states'].to_list(), current_data['next_user'].to_list(), 
                                            current_data['next_game_type'].to_list(), 
                                            batch_size=numInRetrainBatch)
    optimizer = optim.Adam(primary_model.parameters(), lr=0.0035)
    train(primary_model, target_model, dataloader, optimizer, criterion, batch_size=10, gamma=0.99)
    return {"Retraining": "Done"}































