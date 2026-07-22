import numpy as np

def cqr_calibrate(q_lo_calib: np.ndarray, q_hi_calib: np.ndarray, y_calib: np.ndarray, alpha: float = 0.10) -> float:
    """Computes the CQR conformal correction term Q_hat on a held-out calibration set."""
    scores = np.maximum(q_lo_calib - y_calib, y_calib - q_hi_calib)
    n = len(scores)
    q_level = np.ceil((n + 1) * (1 - alpha)) / n
    return float(np.quantile(scores, min(q_level, 1.0)))


def cqr_predict_interval(q_lo_test: np.ndarray, q_hi_test: np.ndarray, q_hat: float) -> tuple[np.ndarray, np.ndarray]:
    return q_lo_test - q_hat, q_hi_test + q_hat


def coverage_rate(y_true: np.ndarray, lower: np.ndarray, upper: np.ndarray) -> float:
    return float(np.mean((y_true >= lower) & (y_true <= upper)))


def interval_width(lower: np.ndarray, upper: np.ndarray) -> float:
    """Report alongside coverage — a trivially wide interval achieves perfect
    coverage but is useless; both numbers together characterize interval quality."""
    return float(np.mean(upper - lower))
