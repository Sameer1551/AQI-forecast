import numpy as np
import pandas as pd
from src.evaluation.metrics import rmse, mae
from sklearn.metrics import roc_auc_score, average_precision_score

def extreme_event_full_protocol(y_true: np.ndarray, y_pred: np.ndarray,
                                  y_pred_extreme_prob: np.ndarray) -> pd.DataFrame:
    """
    Full evaluation at AQI > 150, 200, 300 thresholds.
    y_pred_extreme_prob: the extreme-event head's sigmoid output (§9.4's AQIMultiTaskHead).
    """
    rows = []
    for threshold in [150, 200, 300]:
        mask = y_true > threshold
        n = mask.sum()
        if n < 10:
            continue
        binary_true = mask.astype(int)

        # Regression accuracy on the extreme subset
        rows.append({
            "metric_type": "regression",
            "aqi_threshold": threshold,
            "n_events": int(n),
            "rmse": rmse(y_true[mask], y_pred[mask]),
            "mae": mae(y_true[mask], y_pred[mask]),
            "auroc": None,
            "auprc": None,
        })

        # Classification performance of the extreme-event binary head
        if y_pred_extreme_prob is not None and len(np.unique(binary_true)) == 2:
            rows.append({
                "metric_type": "classification",
                "aqi_threshold": threshold,
                "n_events": int(n),
                "rmse": None,
                "mae": None,
                "auroc": roc_auc_score(binary_true, y_pred_extreme_prob),
                "auprc": average_precision_score(binary_true, y_pred_extreme_prob),
            })
    return pd.DataFrame(rows)
