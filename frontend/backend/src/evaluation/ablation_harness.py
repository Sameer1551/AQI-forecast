import subprocess
import itertools
import pandas as pd

def run_ablation_grid(overrides_grid: dict[str, list], seeds: list[int], base_cmd: str = "python -m src.models.core.train"):
    """overrides_grid: {'graph.type': ['dynamic_wind', 'static_knn'], ...}.
    Cartesian-products the grid and launches one Hydra-config'd training run per
    cell per seed — each run is independently logged to MLflow (Ch.15.1) with its
    full config attached, so the resulting table can be reconstructed later purely
    from MLflow's run history without re-parsing shell logs."""
    keys = list(overrides_grid.keys())
    results = []
    for combo in itertools.product(*overrides_grid.values()):
        for seed in seeds:
            overrides = [f"{k}={v}" for k, v in zip(keys, combo)] + [f"train.seed={seed}"]
            cmd = base_cmd.split() + overrides
            subprocess.run(cmd, check=True)
            results.append(dict(zip(keys, combo), seed=seed))
    return pd.DataFrame(results)


def summarize_ablation(mlflow_runs_df: pd.DataFrame, group_cols: list[str], metric: str = "val_loss"):
    return mlflow_runs_df.groupby(group_cols)[metric].agg(["mean", "std", "count"]).reset_index()
