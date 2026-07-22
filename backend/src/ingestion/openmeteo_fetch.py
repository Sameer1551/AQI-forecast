import requests
import pandas as pd
from src.validation.schemas import WeatherReading
from src.validation.validate_batch import validate_records

def get_weather(lat: float, lon: float, start_date: str, end_date: str) -> pd.DataFrame:
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": lat, "longitude": lon, "start_date": start_date, "end_date": end_date,
        "hourly": ",".join([
            "temperature_2m", "relative_humidity_2m", "dew_point_2m", "surface_pressure",
            "precipitation", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m",
            "cloud_cover", "boundary_layer_height", "uv_index",
        ]),
        "timezone": "UTC",
    }
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    hourly = resp.json()["hourly"]
    df = pd.DataFrame(hourly).rename(columns={"time": "datetime_utc"})
    df["datetime_utc"] = pd.to_datetime(df["datetime_utc"])

    records = df.to_dict("records")
    valid_df, rejected_df = validate_records(records, WeatherReading)
    if len(rejected_df):
        rejected_df.to_csv(f"data/raw/_rejected/weather_{lat}_{lon}.csv", index=False)
    return valid_df


def get_live_forecast(lat: float, lon: float, days: int = 7) -> pd.DataFrame:
    """Forward-looking forecast — feeds both the online inference feature window
    and the counterfactual engine's weather-perturbation baseline (Ch.13)."""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat, "longitude": lon,
        "hourly": "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure",
        "forecast_days": days, "timezone": "UTC",
    }
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    return pd.DataFrame(resp.json()["hourly"])
