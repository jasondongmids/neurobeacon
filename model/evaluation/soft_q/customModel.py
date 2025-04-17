import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

import numpy as np
import statistics
import os
import io
import boto3

class QNetworkWithUserEmbedding(nn.Module):
    def __init__(self, num_game_types, num_state_variables, num_actions,
                 user_embedding_dim=4, game_embedding_dim=1):
        super(QNetworkWithUserEmbedding, self).__init__()

        # Game type embedding
        self.game_embedding = nn.Embedding(num_game_types, game_embedding_dim)

        # Combined input: state + user embedding + game type embedding
        input_dim = num_state_variables + user_embedding_dim + game_embedding_dim

        self.fc1 = nn.Linear(input_dim, 128)
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, num_actions)

    def forward(self, state, user_features, game_type):
        # No embedding on user_features — already embedded
        game_embedded = self.game_embedding(game_type)  # (batch, game_embedding_dim)

        x = torch.cat([state, user_features, game_embedded], dim=-1)
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        q_values = self.fc3(x)
        return q_values
    
    def print_model_weights(self):
        # Prints the weights of each layer in the model.
        allWeights = ""
        for name, param in self.named_parameters():
            allWeights += f"Layer: {name}" + "\n"
            allWeights += str(param.data) + "\n"
            allWeights += "-" * 50 + "\n"
        return(allWeights)

def train(model, target_model, replay_buffer, optimizer, criterion, batch_size=64, gamma=0.99, alpha=0):
    model.train()
    target_model.eval()
    total_loss = 0
    total_entropy = 0
    total_q_values = []
    q_value_variances = []

    # if len(replay_buffer) < batch_size:
    #     return 0  # Skip training if not enough data yet

    # Sample random transitions from the buffer
    batch = next(iter(replay_buffer))

    # Unpack batch
    (states, actions, rewards, user_features, game_types, 
        next_states, next_user_features, next_game_types
        # , dones
        ) = batch

    # Ensure correct types
    states = states.float() # 8 states, definitions below
    next_states = next_states.float() # 8 states, definitions below
    actions = actions.long() # 1 value, corresponding to the difficulty
    rewards = rewards.float() # 
    # dones = dones.float()  # 1 if terminal, 0 otherwise
    user_features = user_features.float() # 
    next_user_features = next_user_features.float()

    # Compute current Q-values from primary model
    q_values = model(states, user_features, game_types)  # Shape: (batch_size, num_actions)
    q_value = q_values.gather(1, actions.unsqueeze(1)).squeeze(1)

    # Compute target Q-values from target model (no gradients)
    with torch.no_grad():
        target_q_values = target_model(next_states, next_user_features, next_game_types)
        max_next_q_values = target_q_values.max(1)[0]
        target_q_value = rewards + gamma * max_next_q_values #* (1 - dones)  # Zero out if terminal state

    # Compute Soft Q-Learning entropy regularization / entropy
    action_probs = F.softmax(q_values, dim=-1)
    entropy = -torch.sum(action_probs * torch.log(action_probs + 1e-8), dim=-1) # avoid log 0
    entropy_loss = entropy.mean()
    
    # Store Q-value statistics
    total_q_values.extend(q_value.detach().cpu().numpy().tolist())
    q_value_variances.append(torch.var(q_value).item())

    # Compute loss and backprop
    loss = criterion(q_value, target_q_value) # calculate loss
    if alpha:
        loss = loss + alpha * entropy_loss
    loss.backward() # computes gradients of the loss w.r.t. model parameters
    optimizer.step() # applies those gradients to update model weights

    # Calculate Metrics
    total_loss += loss.item()
    total_entropy += entropy_loss.item()
    avg_q_value = np.mean(total_q_values)
    avg_q_variance = np.mean(q_value_variances)

    metrics = {
        'loss': total_loss,
        'entropy': total_entropy,
        'q_values': avg_q_value,
        'q_value_variance': avg_q_variance
    }

    return model, metrics # Note: since pytorch models are mutable, no need to actually return model


def create_dataloader(states, actions, rewards, users, game_types, next_states, next_users, next_game_types
                    #   , dones
                      , batch_size=64):
    # Convert to tensors
    states_tensor = torch.tensor(states, dtype=torch.float32)
    actions_tensor = torch.tensor(actions, dtype=torch.long)
    rewards_tensor = torch.tensor(rewards, dtype=torch.float32)
    users_tensor = torch.tensor(users, dtype=torch.float32)
    game_types_tensor = torch.tensor(game_types, dtype=torch.long)
    next_states_tensor = torch.tensor(next_states, dtype=torch.float32)
    next_users_tensor = torch.tensor(next_users, dtype=torch.float32)
    next_game_types_tensor = torch.tensor(next_game_types, dtype=torch.long)
    # dones_tensor = torch.tensor(dones, dtype=torch.long)

    dataset = TensorDataset(states_tensor, actions_tensor, rewards_tensor, users_tensor, game_types_tensor, 
                            next_states_tensor, next_users_tensor, next_game_types_tensor
                            # , dones_tensor
                            )
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    
    return dataset, dataloader

def save_obj_in_s3(obj, path):
    # Serialize dataset
    buffer = io.BytesIO()
    torch.save(obj, buffer)
    buffer.seek(0)

    s3 = boto3.client("s3")
    bucket_name = 'neurobeacon'

    # Upload to S3
    s3.upload_fileobj(buffer, bucket_name, path)

def load_s3_object(path):
    buffer = io.BytesIO()
    s3 = boto3.client("s3")
    bucket_name = "neurobeacon"
    s3.download_fileobj(bucket_name, path, buffer)
    buffer.seek(0)

    # Directly return the loaded DataLoader
    dataloader = QNetworkWithUserEmbedding(num_game_types = 3, num_state_variables = 8, num_actions = 3)
    dataloader.load_state_dict(torch.load(buffer))
    return dataloader

class UserEmbeddingModel(nn.Module):
    def __init__(self, input_size, embedding_dim):
        super(UserEmbeddingModel, self).__init__()
        self.fc = nn.Linear(input_size, embedding_dim)

    def forward(self, x):
        return self.fc(x)
    