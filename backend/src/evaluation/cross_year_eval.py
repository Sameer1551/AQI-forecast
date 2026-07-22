import pandas as pd
import numpy as np
from src.evaluation.metrics import rmse, mae

def cross_year_evaluation(y_true_by_year: dict[int, np.ndarray],
                           y_pred_by_year: dict[int, np.ndarray],
                           train_year: int) -> pd.DataFrame:
    """
    y_true_by_year: {2022: array, 2023: array, 2024: array}
    Produces a table: Year | Seen | RMSE | MAE | RMSE_ratio_to_train
    RMSE_ratio > 1.5 in a test year indicates significant inter-annual shift.
    """
    train_rmse = rmse(y_true_by_year[train_year], y_pred_by_year[train_year])
    rows = []
    for year, y_true in y_true_by_year.items():
        r = rmse(y_true, y_pred_by_year[year])
        rows.append({
            "year": year,
            "seen_in_training": year == train_year,
            "rmse": r,
            "mae": mae(y_true, y_pred_by_year[year]),
            "rmse_ratio_to_train": r / (train_rmse + 1e-8),
        })
    return pd.DataFrame(rows)
