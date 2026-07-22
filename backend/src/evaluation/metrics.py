import numpy as np

def rmse(y_true, y_pred):
    return np.sqrt(np.mean((y_true - y_pred) ** 2))

def mae(y_true, y_pred):
    return np.mean(np.abs(y_true - y_pred))

def mape(y_true, y_pred, eps=1e-3):
    return np.mean(np.abs((y_true - y_pred) / (y_true + eps))) * 100

def r2(y_true, y_pred):
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - y_true.mean()) ** 2)
    return 1 - ss_res / ss_tot

def winkler_score(y_true, lower, upper, alpha=0.10):
    """Proper scoring rule for prediction intervals: rewards narrow intervals,
    penalizes both under- and over-coverage. Report alongside coverage_rate
    (Ch.11) since coverage alone can be gamed by making intervals arbitrarily wide."""
    width = upper - lower
    below = (y_true < lower) * (2 / alpha * (lower - y_true))
    above = (y_true > upper) * (2 / alpha * (y_true - upper))
    return np.mean(width + below + above)

def pinball_loss_numpy(y_true, y_pred_quantile, tau):
    diff = y_true - y_pred_quantile
    return np.mean(np.maximum(tau * diff, (tau - 1) * diff))
