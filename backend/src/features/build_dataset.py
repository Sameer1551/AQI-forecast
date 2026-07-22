import pandas as pd
import numpy as np
from src.ingestion.openmeteo_fetch import get_weather

def load_and_merge(station_id: int) -> pd.DataFrame:
    aq = pd.read_csv(f"data/raw/openaq_{station_id}.csv", parse_dates=["datetime_utc"])
    aq_wide = aq.pivot_table(index="datetime_utc", columns="parameter", values="value", aggfunc="mean")
    aq_wide = aq_wide.resample("1h").mean()  # enforce a strictly hourly grid

    stations = pd.read_csv("data/raw/stations.csv")
    lat = stations.loc[stations.location_id == station_id, "lat"].values[0]
    lon = stations.loc[stations.location_id == station_id, "lon"].values[0]

    start, end = aq_wide.index.min().strftime("%Y-%m-%d"), aq_wide.index.max().strftime("%Y-%m-%d")
    wx = get_weather(lat, lon, start, end).set_index("datetime_utc").resample("1h").mean()

    merged = aq_wide.join(wx, how="inner")
    merged["station_id"] = station_id
    return merged


def clean(df: pd.DataFrame, log_report: bool = True) -> pd.DataFrame:
    """Cleans with an explicit, quantified missing-data policy — the single most
    important methodological decision in the whole pipeline (see the precaution below)."""
    report = {"rows_in": len(df)}

    # 1. Physically impossible values -> NaN (not silently dropped — they become
    #    missing values subject to the same imputation policy as sensor dropouts)
    pollutant_cols = [c for c in ["pm25", "pm10", "no2", "o3", "co", "so2"] if c in df.columns]
    for col in pollutant_cols:
        n_neg = (df[col] < 0).sum()
        cap = df[col].quantile(0.999) * 3
        n_extreme = (df[col] > cap).sum()
        df.loc[df[col] < 0, col] = np.nan
        df.loc[df[col] > cap, col] = np.nan
        report[f"{col}_negative_removed"] = int(n_neg)
        report[f"{col}_extreme_removed"] = int(n_extreme)

    # 2. Short pollutant gaps (<=3h): linear interpolation. Longer gaps: left as NaN
    #    and carried through to the model as an explicit missingness mask (see
    #    multi_task_loss in Ch.9) rather than imputed — imputing multi-hour gaps
    #    during storms would fabricate exactly the extreme values we most need to
    #    predict correctly.
    report["pollutant_missing_before"] = int(df[pollutant_cols].isna().sum().sum())
    df[pollutant_cols] = df[pollutant_cols].interpolate(method="linear", limit=3)
    report["pollutant_missing_after_interp"] = int(df[pollutant_cols].isna().sum().sum())

    # 3. Weather gaps: forward-fill up to 2h (meteorological variables change slowly
    #    and short-gap ffill is a defensible, low-bias choice; document this explicitly)
    weather_cols = [c for c in df.columns if c not in pollutant_cols + ["station_id"]]
    df[weather_cols] = df[weather_cols].ffill(limit=2)

    report["rows_out"] = len(df)
    if log_report:
        pd.Series(report).to_json(f"data/interim/_clean_report_{df['station_id'].iloc[0]}.json")
    return df


if __name__ == "__main__":
    import os
    from src.features.temporal_features import add_temporal_features
    from src.feature_store.offline_store import OfflineFeatureStore

    stations = pd.read_csv("data/raw/stations.csv")
    store = OfflineFeatureStore()
    pollutant_cols = ["pm25", "pm10", "no2", "o3", "co", "so2"]

    for _, row in stations.iterrows():
        sid = row["location_id"]
        raw_path = f"data/raw/openaq_{sid}.csv"
        if not os.path.exists(raw_path):
            print(f"Skipping station {sid} — raw file not found")
            continue
        try:
            df = load_and_merge(sid)
            df = clean(df)
            present_pollutants = [c for c in pollutant_cols if c in df.columns]
            df = add_temporal_features(df, present_pollutants)
            store.materialize(df, "pollutant_temporal", sid)
            print(f"Station {sid}: {len(df)} rows materialized")
        except Exception as e:
            print(f"Station {sid} failed: {e}")
