import pandas as pd
from src.evaluation.metrics import rmse, mae

def evaluate_by_season(y_true, y_pred, timestamps, season_map: dict) -> pd.DataFrame:
    df = pd.DataFrame({"y": y_true, "pred": y_pred, "month": pd.to_datetime(timestamps).month})
    rows = []
    for season, (m_start, m_end) in season_map.items():
        mask = df["month"].between(m_start, m_end)
        rows.append({"season": season, "n": mask.sum(),
                      "rmse": rmse(df.loc[mask, "y"], df.loc[mask, "pred"]),
                      "mae": mae(df.loc[mask, "y"], df.loc[mask, "pred"])})
    return pd.DataFrame(rows)

def evaluate_extreme_events(y_true, y_pred, aqi_threshold: float = 200) -> dict:
    """Evaluated separately because this is usually where baselines fail hardest
    and the proposed model's value proposition is clearest — an aggregate RMSE
    can look similar between models while extreme-event RMSE differs dramatically."""
    mask = y_true > aqi_threshold
    if mask.sum() == 0:
        return {"n_extreme": 0, "rmse": None}
    return {"n_extreme": int(mask.sum()), "rmse": float(rmse(y_true[mask], y_pred[mask])),
            "mae": float(mae(y_true[mask], y_pred[mask]))}

def evaluate_spatial_generalization(model_predict_fn, held_out_cities_data: dict) -> pd.DataFrame:
    """Train on 5 cities (Ch.10.4's pretrained backbone), evaluate zero-shot (no
    fine-tuning) and fine-tuned (Ch.10.4's finetune_output_head) on 2 held-out
    cities — reports both numbers so the reader can see how much of the gap
    fine-tuning closes."""
    rows = []
    for city, data in held_out_cities_data.items():
        pred_zero_shot = model_predict_fn(data["X"])
        rows.append({"city": city, "mode": "zero_shot", "rmse": rmse(data["y"], pred_zero_shot)})
    return pd.DataFrame(rows)
