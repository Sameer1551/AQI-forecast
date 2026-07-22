import pandas as pd
from src.uncertainty.conformal import coverage_rate, interval_width

def validate_coverage_by_season(y_true, lower, upper, timestamps, season_map: dict) -> pd.DataFrame:
    """season_map: {'monsoon': (start_month, end_month), 'winter': (...), 'summer': (...)}.
    Computes coverage and mean interval width per season — this table IS the
    empirical answer to RQ3/H3, not a theoretical aside."""
    df = pd.DataFrame({"y": y_true, "lo": lower, "hi": upper, "month": pd.to_datetime(timestamps).month})
    rows = []
    for season, (m_start, m_end) in season_map.items():
        mask = df["month"].between(m_start, m_end)
        rows.append({
            "season": season,
            "n": mask.sum(),
            "coverage": coverage_rate(df.loc[mask, "y"], df.loc[mask, "lo"], df.loc[mask, "hi"]),
            "mean_width": interval_width(df.loc[mask, "lo"], df.loc[mask, "hi"]),
        })
    return pd.DataFrame(rows)


def validate_coverage_at_transitions(y_true, lower, upper, timestamps, transition_windows: list) -> pd.DataFrame:
    """transition_windows: list of (start_date, end_date) for known high-nonstationarity
    periods (e.g., monsoon-to-winter onset) — the specific weeks H3 predicts will show
    degraded coverage."""
    df = pd.DataFrame({"y": y_true, "lo": lower, "hi": upper, "date": pd.to_datetime(timestamps)})
    rows = []
    for start, end in transition_windows:
        mask = df["date"].between(start, end)
        rows.append({
            "window": f"{start} to {end}", "n": mask.sum(),
            "coverage": coverage_rate(df.loc[mask, "y"], df.loc[mask, "lo"], df.loc[mask, "hi"]),
        })
    return pd.DataFrame(rows)
