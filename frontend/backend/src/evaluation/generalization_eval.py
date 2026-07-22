import pandas as pd
import numpy as np
from src.evaluation.metrics import rmse, mae, r2

def unseen_city_evaluation(
    model_predict_fn,
    finetune_fn,
    held_out_city_data: dict[str, dict],  # city -> {"X": ..., "y": ..., "weather": ..., "urban": ...}
) -> pd.DataFrame:
    """
    Reports zero-shot (no fine-tuning) and fine-tuned (Ch.10.4) performance on held-out cities.
    The gap between the two directly quantifies how much the pretrained backbone generalises
    vs. how much local adaptation helps — a key finding for spatial-generalization claims.
    """
    rows = []
    for city, data in held_out_city_data.items():
        # Zero-shot: apply pretrained model directly
        pred_zs = model_predict_fn(data["X"], data["weather"], data["urban"])
        rows.append({
            "city": city, "mode": "zero_shot",
            "rmse_pm25": rmse(data["y"][:, 0], pred_zs[:, 0]),  # PM2.5
            "mae_pm25": mae(data["y"][:, 0], pred_zs[:, 0]),
            "r2_pm25": r2(data["y"][:, 0], pred_zs[:, 0]),
        })

        # Fine-tuned: adapt output head on a small city-specific training split (e.g., 2 weeks)
        finetuned_model = finetune_fn(data.get("finetune_X"), data.get("finetune_y"))
        pred_ft = finetuned_model(data["X"], data["weather"], data["urban"])
        rows.append({
            "city": city, "mode": "fine_tuned",
            "rmse_pm25": rmse(data["y"][:, 0], pred_ft[:, 0]),
            "mae_pm25": mae(data["y"][:, 0], pred_ft[:, 0]),
            "r2_pm25": r2(data["y"][:, 0], pred_ft[:, 0]),
        })
    return pd.DataFrame(rows)
