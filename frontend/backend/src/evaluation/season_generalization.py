import pandas as pd
from src.evaluation.metrics import rmse, mae

SEASON_MAP_INDIA = {
    "winter":             (12, 2),   # Dec–Feb: inversion season, high PM2.5
    "pre_monsoon":        (3, 5),    # Mar–May: dust, heat waves
    "monsoon":            (6, 9),    # Jun–Sep: rain scavenging, low PM
    "monsoon_withdrawal": (10, 11),  # Oct–Nov: rapid transition, CQR stress period
}

def evaluate_season_generalization(y_true, y_pred, timestamps,
                                    train_seasons: list[str], test_seasons: list[str]) -> pd.DataFrame:
    """
    Runs the model (trained on `train_seasons`) and evaluates on `test_seasons`.
    Use to specifically test: does a model trained on winter+summer generalise to monsoon?
    """
    df = pd.DataFrame({
        "y": y_true, "pred": y_pred,
        "month": pd.to_datetime(timestamps).month
    })
    rows = []
    for season in test_seasons:
        m_start, m_end = SEASON_MAP_INDIA[season]
        if m_start <= m_end:
            mask = df["month"].between(m_start, m_end)
        else:  # wraps year (e.g., winter: Dec–Feb)
            mask = (df["month"] >= m_start) | (df["month"] <= m_end)
        n = mask.sum()
        if n == 0:
            continue
        rows.append({
            "season": season,
            "in_training": season in train_seasons,
            "n": int(n),
            "rmse": rmse(df.loc[mask, "y"].values, df.loc[mask, "pred"].values),
            "mae": mae(df.loc[mask, "y"].values, df.loc[mask, "pred"].values),
        })
    return pd.DataFrame(rows)
