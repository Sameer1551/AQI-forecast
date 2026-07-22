from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openaq_api_key: str = ""
    waqi_api_token: str = ""
    mlflow_tracking_uri: str = "./mlruns"
    serving_api_key: str = "changeme-in-production"  # Set via AQI_SERVING_API_KEY env var

    class Config:
        env_file = ".env"
        env_prefix = ""  # reads AQI_SERVING_API_KEY as serving_api_key automatically

settings = Settings()
