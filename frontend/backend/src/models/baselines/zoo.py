import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
import xgboost as xgb
import lightgbm as lgb
import torch
import torch.nn as nn


def train_persistence(y_train: np.ndarray) -> callable:
    """The mandatory sanity-check baseline: predict the last observed value,
    unchanged, for every horizon. Any model that doesn't clearly beat this at
    short horizons (1h) has not learned anything beyond autocorrelation."""
    def predict(X_last_known: np.ndarray, n_horizons: int) -> np.ndarray:
        return np.repeat(X_last_known[:, None], n_horizons, axis=1)
    return predict


def train_linear(X_train, y_train) -> LinearRegression:
    m = LinearRegression()
    m.fit(X_train, y_train)
    return m


def train_rf(X_train, y_train) -> RandomForestRegressor:
    m = RandomForestRegressor(n_estimators=300, max_depth=12, n_jobs=-1, random_state=42)
    m.fit(X_train, y_train)
    return m


def train_xgb(X_train, y_train, X_val, y_val) -> xgb.XGBRegressor:
    m = xgb.XGBRegressor(
        n_estimators=1000, max_depth=6, learning_rate=0.03,
        subsample=0.8, colsample_bytree=0.8, early_stopping_rounds=50,
        eval_metric="rmse", random_state=42,
    )
    m.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
    return m


def train_lgb(X_train, y_train, X_val, y_val) -> lgb.LGBMRegressor:
    m = lgb.LGBMRegressor(
        n_estimators=1000, max_depth=-1, num_leaves=63, learning_rate=0.03,
        subsample=0.8, colsample_bytree=0.8, random_state=42, verbosity=-1,
    )
    m.fit(X_train, y_train, eval_set=[(X_val, y_val)],
          callbacks=[lgb.early_stopping(50, verbose=False)])
    return m


class LSTMBaseline(nn.Module):
    """Strong deep-learning baseline without spatial structure — isolates how much
    of the core model's advantage (if any) comes from the graph vs. from being a
    bigger/deeper temporal model. This comparison is what actually supports H1."""
    def __init__(self, n_features, hidden=64, n_outputs=4, n_layers=2, dropout=0.2):
        super().__init__()
        self.lstm = nn.LSTM(n_features, hidden, num_layers=n_layers, batch_first=True,
                             dropout=dropout if n_layers > 1 else 0.0)
        self.head = nn.Linear(hidden, n_outputs)

    def forward(self, x):  # x: [batch, seq_len, n_features]
        out, _ = self.lstm(x)
        return self.head(out[:, -1, :])
