"""
src/uncertainty/deep_ensemble.py — Deep Ensemble uncertainty estimation.

Trains M models with different random seeds (Ch.19.3's multi-seed setup also serves this).
At inference, the disagreement (std) across seeds is a model-uncertainty estimate
complementary to CQR's data-uncertainty coverage guarantee.
"""
import torch
import numpy as np


def ensemble_predict(models: list, x, edge_index, edge_weight, relation_type, n_stations):
    """Runs M models and returns the mean median-quantile forecast plus cross-seed std.
    
    Args:
        models: List of trained MAADGTransformer models (different random seeds).
        x: [n_stations, seq_len, n_features]
        edge_index, edge_weight, relation_type, n_stations: graph inputs.
    
    Returns:
        (median_pred, ensemble_std) — both [n_stations, n_pollutants, n_horizons]
    """
    preds = []
    for m in models:
        m.eval()
        with torch.no_grad():
            out, _ = m(x, edge_index, edge_weight, relation_type, n_stations)
            preds.append(out)
    preds = torch.stack(preds)              # [E, n_stations, n_pollutants, n_horizons, n_quantiles]
    median_pred = preds[..., 2].mean(dim=0)  # mean of the median-quantile predictions
    ensemble_std = preds[..., 2].std(dim=0)  # disagreement across seeds ≈ model uncertainty
    return median_pred, ensemble_std


def ensemble_coverage_check(models: list, x, edge_index, edge_weight, relation_type,
                              n_stations, y_true, q_hat: float, alpha: float = 0.10) -> dict:
    """Checks whether ensemble-aggregated CQR intervals achieve nominal coverage.
    Combines ensemble mean quantiles with the CQR correction from conformal.py.
    """
    from src.uncertainty.conformal import cqr_predict_interval, coverage_rate, interval_width

    preds = []
    for m in models:
        m.eval()
        with torch.no_grad():
            out, _ = m(x, edge_index, edge_weight, relation_type, n_stations)
            preds.append(out)
    preds = torch.stack(preds).numpy()

    # Q_lo and Q_hi: mean of the 5th and 95th quantile across ensemble members
    q_lo = preds[..., 0].mean(axis=0).ravel()
    q_hi = preds[..., -1].mean(axis=0).ravel()
    y_flat = y_true.ravel() if isinstance(y_true, np.ndarray) else y_true.numpy().ravel()

    lower, upper = cqr_predict_interval(q_lo, q_hi, q_hat)
    return {
        "coverage": coverage_rate(y_flat, lower, upper),
        "mean_width": interval_width(lower, upper),
        "nominal_alpha": alpha,
    }
