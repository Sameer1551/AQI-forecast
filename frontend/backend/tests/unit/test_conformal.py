import numpy as np
from src.uncertainty.conformal import cqr_calibrate, coverage_rate

def test_coverage_meets_nominal_on_iid_calibration_data():
    """Sanity check on synthetic i.i.d. Gaussian data: split-conformal/CQR SHOULD
    hit close to nominal coverage when the exchangeability assumption genuinely
    holds. This is the control condition for Ch.11's real-data coverage test —
    if this synthetic test fails, the conformal implementation itself is broken,
    independent of any time-series non-stationarity question."""
    rng = np.random.default_rng(42)
    y_calib = rng.normal(0, 1, 5000)
    q_lo_calib, q_hi_calib = np.full(5000, -1.5), np.full(5000, 1.5)  # deliberately miscalibrated raw quantiles
    q_hat = cqr_calibrate(q_lo_calib, q_hi_calib, y_calib, alpha=0.10)

    y_test = rng.normal(0, 1, 5000)
    lower, upper = q_lo_calib[:5000] - q_hat, q_hi_calib[:5000] + q_hat
    cov = coverage_rate(y_test, lower, upper)
    assert 0.87 <= cov <= 0.93  # allow small sampling slack around the 90% nominal target
