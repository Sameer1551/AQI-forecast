from fastapi import Depends, HTTPException, Security
from fastapi.security import APIKeyHeader

api_key_header = APIKeyHeader(name="X-API-Key")

def verify_api_key(key: str = Security(api_key_header)):
    from src.config.secrets import settings
    if key != settings.serving_api_key:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return key

# Apply per-route: @app.post("/predict", dependencies=[Depends(verify_api_key)])
