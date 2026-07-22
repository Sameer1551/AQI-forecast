import pandas as pd

class DataContractError(Exception):
    pass

def check_chronological(df: pd.DataFrame, time_col: str = "datetime_utc") -> None:
    if not df[time_col].is_monotonic_increasing:
        raise DataContractError(f"{time_col} is not sorted ascending — lag features would be corrupted.")

def check_no_duplicate_timestamps(df: pd.DataFrame, time_col: str = "datetime_utc", group_col: str = "station_id") -> None:
    dupes = df.duplicated(subset=[group_col, time_col]).sum()
    if dupes > 0:
        raise DataContractError(f"{dupes} duplicate (station, timestamp) rows found.")

def check_bounded(df: pd.DataFrame, col: str, lo: float, hi: float, max_violation_frac: float = 0.0) -> None:
    violations = ((df[col] < lo) | (df[col] > hi)).mean()
    if violations > max_violation_frac:
        raise DataContractError(f"{col}: {violations:.2%} of values outside [{lo}, {hi}]")

def check_split_integrity(train_df: pd.DataFrame, test_df: pd.DataFrame, time_col: str = "datetime_utc") -> None:
    """The single most important check: guarantees the temporal split (Ch.10) never
    lets a test-period timestamp leak into training."""
    if train_df[time_col].max() >= test_df[time_col].min():
        raise DataContractError(
            f"Train max ({train_df[time_col].max()}) >= test min ({test_df[time_col].min()}) — leakage."
        )

def run_all_checks(df: pd.DataFrame) -> dict:
    results = {}
    for name, fn, kwargs in [
        ("chronological", check_chronological, {}),
        ("no_duplicates", check_no_duplicate_timestamps, {}),
    ]:
        try:
            fn(df, **kwargs)
            results[name] = "PASS"
        except DataContractError as e:
            results[name] = f"FAIL: {e}"
    return results
