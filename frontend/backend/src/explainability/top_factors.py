import numpy as np

FEATURE_DESCRIPTIONS = {
    "wind_speed_10m": "low wind speed", "inversion_flag": "temperature inversion",
    "pm25_lag6": "elevated PM2.5 six hours ago", "bl_height_ratio": "shallow boundary layer",
    "is_rush_hour": "rush-hour traffic window", "precipitation": "recent rainfall",
}

def rank_top_factors(attributions: np.ndarray, feature_names: list[str], k: int = 3) -> list[str]:
    """Turns raw IG attributions into the human-readable strings the FastAPI
    /predict endpoint (Ch.16) returns, e.g. ['low wind speed', 'elevated PM2.5
    six hours ago', 'temperature inversion']."""
    idx = np.argsort(-np.abs(attributions))[:k]
    return [FEATURE_DESCRIPTIONS.get(feature_names[i], feature_names[i]) for i in idx]
