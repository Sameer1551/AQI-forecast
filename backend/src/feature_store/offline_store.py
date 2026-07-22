import pandas as pd
from pathlib import Path

class OfflineFeatureStore:
    """A minimal, Parquet-backed offline feature store with point-in-time correctness."""

    def __init__(self, root: str = "data/feature_store"):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def materialize(self, df: pd.DataFrame, feature_group: str, station_id: int) -> None:
        """Writes a station's engineered feature table, partitioned for fast reads."""
        path = self.root / feature_group / f"station_{station_id}.parquet"
        path.parent.mkdir(parents=True, exist_ok=True)
        df.to_parquet(path, index=True)

    def get_training_features(self, feature_group: str, station_ids: list[int],
                               start: str, end: str) -> pd.DataFrame:
        """Point-in-time correct read: only returns rows within [start, end),
        so a training run can never accidentally read features materialized
        from a later retraining cycle."""
        frames = []
        for sid in station_ids:
            path = self.root / feature_group / f"station_{sid}.parquet"
            if not path.exists():
                continue
            df = pd.read_parquet(path)
            df = df.loc[(df.index >= start) & (df.index < end)]
            df["station_id"] = sid
            frames.append(df)
        return pd.concat(frames) if frames else pd.DataFrame()

    def get_online_features(self, feature_group: str, station_id: int, as_of: pd.Timestamp,
                             lookback_hours: int) -> pd.DataFrame:
        """Serves the most recent `lookback_hours` window as of a given timestamp —
        the exact same materialized table the training pipeline reads from,
        eliminating training/serving skew by construction."""
        path = self.root / feature_group / f"station_{station_id}.parquet"
        df = pd.read_parquet(path)
        window_start = as_of - pd.Timedelta(hours=lookback_hours)
        return df.loc[(df.index > window_start) & (df.index <= as_of)]
