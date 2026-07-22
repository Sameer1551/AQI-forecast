import pandas as pd

def summarize_carbon(mlflow_runs_df: pd.DataFrame) -> dict:
    total_kg = mlflow_runs_df["training_co2_kg"].sum()
    return {
        "total_training_runs": len(mlflow_runs_df),
        "total_co2_kg": round(total_kg, 3),
        "mean_co2_per_run_kg": round(mlflow_runs_df["training_co2_kg"].mean(), 4),
        # Rough equivalence framing readers find intuitive (verify current conversion
        # factors before publishing, since they vary by source/year):
        "approx_km_driven_equivalent": round(total_kg / 0.12, 1),  # ~0.12 kg CO2e/km, avg passenger car
    }
