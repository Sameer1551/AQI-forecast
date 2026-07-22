import pandas as pd
import numpy as np
from src.features.temporal_features import add_temporal_features

def test_no_leakage_lag_features():
    """Lag features must only ever reference the past, never the current or future row."""
    idx = pd.date_range("2026-01-01", periods=100, freq="1h")
    df = pd.DataFrame({"pm25": np.arange(100, dtype=float)}, index=idx)
    out = add_temporal_features(df, ["pm25"])
    # lag1 at row 50 must equal the raw value at row 49
    assert out["pm25_lag1"].iloc[50] == df["pm25"].iloc[49]

def test_cyclical_encoding_bounds():
    idx = pd.date_range("2026-01-01", periods=48, freq="1h")
    df = pd.DataFrame({"pm25": np.random.rand(48)}, index=idx)
    out = add_temporal_features(df, ["pm25"])
    assert out["hour_sin"].between(-1, 1).all()
    assert out["hour_cos"].between(-1, 1).all()

def test_wind_direction_circularity():
    """0 degrees and 360 degrees must map to (nearly) identical sin/cos encodings —
    the entire point of the circular encoding."""
    idx = pd.date_range("2026-01-01", periods=2, freq="1h")
    df = pd.DataFrame({"pm25": [1.0, 1.0], "wind_direction_10m": [0.0, 360.0]}, index=idx)
    out = add_temporal_features(df, ["pm25"])
    assert np.isclose(out["wind_dir_sin"].iloc[0], out["wind_dir_sin"].iloc[1], atol=1e-6)
