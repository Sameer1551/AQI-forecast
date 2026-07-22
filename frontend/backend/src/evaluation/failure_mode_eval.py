import pandas as pd
import numpy as np
from src.evaluation.metrics import rmse, mae

# --- Condition detection functions ---

def is_dust_storm(df: pd.DataFrame) -> pd.Series:
    """PM10/PM2.5 ratio spike above 2.0 with high AOD proxy (fire_count_50km=0
    to exclude fire-driven episodes)."""
    ratio = df.get("pm10", pd.Series(0, index=df.index)) / (
        df.get("pm25", pd.Series(1, index=df.index)).replace(0, np.nan) + 1e-6
    )
    return (ratio > 2.0) & (df.get("fire_count_50km", pd.Series(0, index=df.index)) == 0)

def is_heavy_rain(df: pd.DataFrame, threshold_mm: float = 10.0) -> pd.Series:
    """Precipitation > threshold in the past 3 hours."""
    precip = df.get("precipitation", pd.Series(0, index=df.index))
    return precip.rolling(3).sum() > threshold_mm

def is_sensor_outage(df: pd.DataFrame, col: str = "pm25", max_gap_h: int = 3) -> pd.Series:
    """True at each timestep where the pollutant column has been NaN for >= max_gap_h hours."""
    is_nan = df[col].isna()
    consecutive = is_nan.groupby((~is_nan).cumsum()).cumsum()
    return consecutive >= max_gap_h

def is_wildfire_smoke(df: pd.DataFrame, frp_threshold: float = 500.0,
                       radius_km: float = 300.0) -> pd.Series:
    """Uses FIRMS fire radiative power proxy (requires fire_count_50km and fire_frp_50km
    features from the event_context feature group, Ch.6.2)."""
    return df.get("fire_frp_50km", pd.Series(0, index=df.index)) > frp_threshold

def is_inversion(df: pd.DataFrame) -> pd.Series:
    """Boundary-layer height ratio below 0.3 for at least 6 consecutive hours."""
    low_bl = df.get("bl_height_ratio", pd.Series(1.0, index=df.index)) < 0.3
    return low_bl.rolling(6).sum() >= 6

# --- Stratified evaluation ---

def evaluate_by_failure_mode(y_true: np.ndarray, y_pred: np.ndarray,
                               test_df: pd.DataFrame) -> pd.DataFrame:
    """
    Returns a DataFrame with RMSE/MAE for each failure condition, plus 'calm' (none
    of the above) and 'all'. This table IS the paper's Error Analysis results table.
    """
    conditions = {
        "dust_storm": is_dust_storm(test_df),
        "heavy_rain": is_heavy_rain(test_df),
        "sensor_outage": is_sensor_outage(test_df),
        "wildfire_smoke": is_wildfire_smoke(test_df),
        "temperature_inversion": is_inversion(test_df),
    }

    rows = []
    any_flag = pd.Series(False, index=test_df.index)
    for name, mask in conditions.items():
        any_flag = any_flag | mask
        n = mask.sum()
        if n == 0:
            rows.append({"condition": name, "n": 0, "rmse": None, "mae": None})
            continue
        rows.append({
            "condition": name,
            "n": int(n),
            "rmse": rmse(y_true[mask.values], y_pred[mask.values]),
            "mae": mae(y_true[mask.values], y_pred[mask.values]),
        })

    calm_mask = ~any_flag
    rows.append({
        "condition": "calm_baseline",
        "n": int(calm_mask.sum()),
        "rmse": rmse(y_true[calm_mask.values], y_pred[calm_mask.values]),
        "mae": mae(y_true[calm_mask.values], y_pred[calm_mask.values]),
    })
    rows.append({
        "condition": "all",
        "n": len(y_true),
        "rmse": rmse(y_true, y_pred),
        "mae": mae(y_true, y_pred),
    })
    return pd.DataFrame(rows).set_index("condition")
