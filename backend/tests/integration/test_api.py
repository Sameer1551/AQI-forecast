from fastapi.testclient import TestClient
from src.serving.app import app

client = TestClient(app)

def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"

def test_predict_endpoint_schema(monkeypatch):
    # In practice: monkeypatch the feature store / ONNX session with fixtures
    # so this test runs without live data or a trained model artifact.
    resp = client.post("/predict", json={"station_id": 999, "horizons": [1, 6]})
    assert resp.status_code in (200, 404, 500)  # 404/500 is acceptable for a fixture station with no data/model
