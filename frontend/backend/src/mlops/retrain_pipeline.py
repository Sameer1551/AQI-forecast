import mlflow
import torch
import numpy as np
from src.evaluation.metrics import rmse


def evaluate(model, data: dict) -> float:
    """Evaluates RMSE on holdout data.
    
    Args:
        model: A trained MAADGTransformer (or any model with a forward pass).
        data: dict with keys 'X' (tensor), 'y' (tensor), 'edge_index', 'edge_weight',
              'relation_type', 'n_stations'.
    Returns:
        Float RMSE on the PM2.5 median-quantile forecast (index 2 in the quantile dim).
    """
    model.eval()
    with torch.no_grad():
        pred, _ = model(
            data["X"], data["edge_index"], data["edge_weight"],
            data["relation_type"], n_stations=data["n_stations"],
        )
    # Shape: [n_stations, n_pollutants, n_horizons, n_quantiles]
    # We evaluate on PM2.5 (idx 0), 1h horizon (idx 0), median quantile (idx 2)
    pred_np = pred[:, 0, 0, 2].cpu().numpy()
    y_np = data["y"][:, 0, 0].cpu().numpy() if isinstance(data["y"], torch.Tensor) else data["y"]
    return rmse(y_np, pred_np)


def daily_retrain_check(drift_monitor, current_model, new_data: dict,
                         old_rmse: float, retrain_fn, min_improvement: float = 0.0) -> tuple:
    """Champion/challenger pattern: only promotes a retrained model if it strictly
    improves holdout RMSE by at least `min_improvement` — prevents the classic
    MLOps failure mode where an automated retrain silently regresses production
    accuracy because 'newer data' isn't automatically 'better model'.
    
    Args:
        drift_monitor: A DriftMonitor instance.
        current_model: The currently deployed champion model.
        new_data: dict with keys 'monitor_inputs', 'last_30_days', 'holdout'.
        old_rmse: Champion model's last-known holdout RMSE.
        retrain_fn: Callable(data) -> model (triggers a full retrain).
        min_improvement: Minimum absolute RMSE improvement to promote the challenger.
    
    Returns:
        (model, rmse, status) tuple where status is one of 'no_retrain', 'promoted', 'rejected'.
    """
    from src.mlops.safe_drift_check import safe_drift_update
    result = safe_drift_update(drift_monitor, **new_data["monitor_inputs"])
    
    if not result["drift_detected"]:
        print(f"No drift (votes={result.get('votes', 0)}/{drift_monitor.quorum} needed) — keeping current model.")
        return current_model, old_rmse, "no_retrain"

    print(f"Drift detected (votes={result['votes']}) — retraining challenger on last 30 days.")
    challenger = retrain_fn(new_data["last_30_days"])
    challenger_rmse = evaluate(challenger, new_data["holdout"])

    if challenger_rmse <= old_rmse - min_improvement:
        with mlflow.start_run(run_name="challenger_promoted"):
            mlflow.log_metrics({"champion_rmse": old_rmse, "challenger_rmse": challenger_rmse})
            mlflow.pytorch.log_model(challenger, "model", registered_model_name="aqi_forecaster")
        torch.save(challenger.state_dict(), "models/deployed_model.pt")
        print(f"Promoted challenger. RMSE {old_rmse:.4f} -> {challenger_rmse:.4f}")
        return challenger, challenger_rmse, "promoted"
    else:
        with mlflow.start_run(run_name="challenger_rejected"):
            mlflow.log_metrics({"champion_rmse": old_rmse, "challenger_rmse": challenger_rmse})
        print(f"Challenger did not improve ({challenger_rmse:.4f} vs {old_rmse:.4f}) — keeping champion.")
        return current_model, old_rmse, "rejected"
