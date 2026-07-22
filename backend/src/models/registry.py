import mlflow
from mlflow.tracking import MlflowClient

def register_and_stage(run_id: str, model_name: str = "aqi_forecaster", stage: str = "Staging"):
    client = MlflowClient()
    model_uri = f"runs:/{run_id}/model"
    mv = mlflow.register_model(model_uri, model_name)
    client.transition_model_version_stage(name=model_name, version=mv.version, stage=stage)
    return mv

def promote_to_production(model_name: str, version: int):
    """Manual gate — deliberately not automatic even after Ch.14's champion/challenger
    check passes, so a human reviews the MLflow run (metrics, data version, config)
    before a model reaches the serving layer. Automate this only once you have enough
    production history to trust the gate unattended."""
    client = MlflowClient()
    client.transition_model_version_stage(name=model_name, version=version, stage="Production",
                                           archive_existing_versions=True)
