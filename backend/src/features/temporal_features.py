import numpy as np
import pandas as pd

def add_temporal_features(df: pd.DataFrame, pollutant_cols: list) -> pd.DataFrame:
    df = df.copy()

    # Cyclical time encodings — never feed raw integer hour/month to a model;
    # hour 23 and hour 0 are adjacent, and an untransformed integer implies they're not.
    df["hour"] = df.index.hour
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
    df["dow"] = df.index.dayofweek
    df["dow_sin"] = np.sin(2 * np.pi * df["dow"] / 7)
    df["dow_cos"] = np.cos(2 * np.pi * df["dow"] / 7)
    df["month"] = df.index.month
    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)
    df["is_weekend"] = (df["dow"] >= 5).astype(int)
    df["is_rush_hour"] = df["hour"].isin([7, 8, 9, 17, 18, 19, 20]).astype(int)

    # Lags + rolling statistics, per pollutant
    for col in pollutant_cols:
        for lag in [1, 3, 6, 12, 24, 48]:
            df[f"{col}_lag{lag}"] = df[col].shift(lag)
        for window in [3, 6, 12, 24]:
            df[f"{col}_roll{window}_mean"] = df[col].rolling(window).mean()
            df[f"{col}_roll{window}_std"] = df[col].rolling(window).std()
        df[f"{col}_ewma"] = df[col].ewm(span=12).mean()

    # Wind direction as sin/cos — a circular variable; raw degrees implies 359 deg
    # and 1 deg are maximally different, which is physically false.
    if "wind_direction_10m" in df.columns:
        rad = np.deg2rad(df["wind_direction_10m"])
        df["wind_dir_sin"] = np.sin(rad)
        df["wind_dir_cos"] = np.cos(rad)

    # Temperature-inversion flag: a cooling surface layer combined with low wind
    # traps pollutants near ground level — a well-documented meteorological driver
    # of AQI spikes, especially in winter in Indo-Gangetic-plain cities.
    if "temperature_2m" in df.columns and "wind_speed_10m" in df.columns:
        df["temp_change_3h"] = df["temperature_2m"].diff(3)
        df["inversion_flag"] = ((df["temp_change_3h"] < -1.5) & (df["wind_speed_10m"] < 2)).astype(int)

    # Boundary-layer-height ratio (new in V2): a low boundary layer relative to its
    # own recent mean is a stronger, more direct inversion proxy than temperature
    # alone, when the boundary_layer_height field is available (Open-Meteo provides it).
    if "boundary_layer_height" in df.columns:
        df["bl_height_ratio"] = df["boundary_layer_height"] / (
            df["boundary_layer_height"].rolling(72, min_periods=24).mean() + 1e-6
        )

    # Pollutant ratio features (chemically informative — e.g., NO2/CO ratio shifts
    # with combustion source mix; PM2.5/PM10 ratio shifts with dust vs. combustion origin)
    if "pm25" in df.columns and "pm10" in df.columns:
        df["pm_ratio"] = df["pm25"] / df["pm10"].replace(0, np.nan)
    if "no2" in df.columns and "co" in df.columns:
        df["no2_co_ratio"] = df["no2"] / df["co"].replace(0, np.nan)

    return df
