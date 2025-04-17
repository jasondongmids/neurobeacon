import argparse
import json
import logging
import sys
import os

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
logger.addHandler(logging.StreamHandler(sys.stdout))

# deep learning model
class QNetwork(nn.Module):
    def __init__(self, state_dim, action_dim):
        super(QNetwork, self).__init__()
        self.fc1 = nn.Linear(state_dim, 64)
        self.fc2 = nn.Linear(64, 64)
        self.fc3 = nn.Linear(64, action_dim)

    def forward(self, state):
        x = torch.relu(self.fc1(state))
        x = torch.relu(self.fc2(x))
        return self.fc3(x)  # Outputs Q-values for each action

def _get_train_data_loader(batch_size, training_dir, **kwargs):
    """
    Arguments:
        batch_size: args.batch_size
        training_dir:
        **kwargs:
    """
    logger.info("Get train data loader")
    dataset = dataset = torch.load(os.path.join(training_dir, 'train_simple.pt'), weights_only=False)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    return dataloader

def _get_test_data_loader(batch_size, training_dir, **kwargs):
    """
    Arguments:
        batch_size: args.batch_size
        training_dir:
        **kwargs:
    """
    logger.info("Get test data loader")
    dataset = dataset = torch.load(os.path.join(training_dir, 'test_simple.pt'), weights_only=False)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    return dataloader

def train(path, batch_size, epochs):
    """
    Arguments:
        path:
        batch_size: args.batch_size
        epochs:
    """
    # Load Data
    train_loader = _get_train_data_loader(batch_size, path)
    test_loader = _get_test_data_loader(batch_size, path)
    
    logger.debug(
        "Processes {}/{} ({:.0f}%) of train data".format(
            len(train_loader.sampler),
            len(train_loader.dataset),
            100.0 * len(train_loader.sampler) / len(train_loader.dataset),
        )
    )
    
    logger.debug(
        "Processes {}/{} ({:.0f}%) of test data".format(
            len(test_loader.sampler),
            len(test_loader.dataset),
            100.0 * len(test_loader.sampler) / len(test_loader.dataset),
        )
    )

    # Train Model
    ## can include as arguments
    # gamma=0.99
    state_dim = 8
    action_dim = 3
    model = QNetwork(state_dim, action_dim)

    optimizer = optim.Adam(model.parameters(), lr=0.01)
    criterion = nn.MSELoss()
    
    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0
    
        for states, actions, rewards in train_loader:
            optimizer.zero_grad()
            q_values = model(states)
            q_values_selection = q_values.gather(1, actions.unsqueeze(1)).squeeze()
    
            loss = criterion(q_values_selection, rewards)
            loss.backward()
            optimizer.step()
    
            total_loss += loss.item()
    
        if epoch % 10 == 0:
            avg_loss = total_loss / len(train_loader)
            print(f"Epoch {epoch}, Loss: {avg_loss:.4f}")

    evaluate(model, test_loader)
    save_model(model, path)

def evaluate(model, test_loader):
    """
    Arguments:
        model:
        test_loader:
    """
    model.eval()
    test_loss = 0
    total_q_values = []
    total_rewards = []
    criterion = nn.MSELoss() # may not be needed

    with torch.no_grad():
        for states, actions, rewards in test_loader:
            # q_values = model(states, users)
            q_values = model(states)
            q_values = q_values.gather(1, actions.unsqueeze(1)).squeeze(1)  # Select Q-value of chosen action

            next_q_values = torch.zeros_like(q_values)

            # PLACEHOLDER FOR USERS

            loss = criterion(q_values, rewards)
            test_loss += loss.item()

            total_q_values.extend(q_values.cpu().numpy())
            total_rewards.extend(rewards.cpu().numpy())

        avg_loss = test_loss / len(test_loader)
        avg_q_value = sum(total_q_values) / len(total_q_values)

        logger.info(
            "Test set: Average loss: {:.4f}, Average q-value: {:.4f}".format(
                avg_loss,  avg_q_value
            )
        )

def model_fn(model_dir):
    """
    Arguments:
        model_dir:
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    state_dim = 8
    action_dim = 3
    model = QNetwork(state_dim, action_dim)
    with open(os.path.join(model_dir, "model.pth"), "rb") as f:
        model.load_state_dict(torch.load(f, weights_only=False))
    return model.to(device)

def save_model(model, model_dir):
    """
    Arguments:
        model:
        model_dir:
    """
    logger.info("Saving the model.")
    path = os.path.join(model_dir, "model.pth")
    torch.save(model.cpu().state_dict(), path)

if __name__ == "__main__"
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--batch-size",
        type=int,
        default=32,
        metavar="N",
        help="input batch size for training (default: 32)",
    )
    parser.add_argument(
    )

    parser.add_argument("--hosts", type=list, default.json.loads(os.environ["SM_HOSTS"]))
    parser.add_argument("--current-host", type=str, default=os.environ["SM_CURRENT_HOST"])
    parser.add_argument("--model-dir", type=str, default=os.environ["SM_MODEL_DIR"])
    parser.add_argument("--data-dir", type=str, default=os.environ["SM_CHANNEL_TRAINING"])
    parser.add_argument("--num-gpus", type=int, default=os.environ["SM_NUM_GPUS"])

    print(f"data_dir; SM_CHANNEL_TRAINING: {os.environ["SM_CHANNEL_TRAINING"]}")
    print(f"val_data_dir; SM_CHANNEL_VALIDATION: {os.environ['SM_CHANNEL_VALIDATION']}")
    print(f"model-dir; SM_MODEL_DIR: {os.environ["SM_MODEL_DIR"]}")

    train(parser.parse_args())

    