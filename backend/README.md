# Real-Time Adaptive Spatio-Temporal AQI Prediction System

[![CI](https://github.com/your-org/aqi-forecast/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/aqi-forecast/actions/workflows/ci.yml)

A production-ready, research-grade air quality index (AQI) forecasting system using the **MAADG Transformer** — a Multi-task, Adaptive, Attention-Driven Graph Transformer that jointly models spatio-temporal pollutant dynamics, conformal uncertainty, and counterfactual policy simulation.

## Architecture Overview

```
OpenAQ + Open-Meteo + NASA POWER
         │
         ▼
   Ingestion + Validation (Pydantic)
         │
         ▼
  Feature Engineering + AQI Calc
         │
         ▼
  Offline Feature Store (Parquet)
         │
         ▼
  MAADG Graph Construction
   (dynamic wind-conditioned)
         │
         ▼
  MAADG Transformer Training
  (multi-task, quantile, GATv2)
         │
         ▼
  Conformal Uncertainty (CQR)
         │
   ┌─────┴──────┐
   │            │
FastAPI     Streamlit
  API       Dashboard
```

## Quickstart

### 1. Clone and set up environment

```bash
git clone <repo-url>
cd aqi-forecast
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

pip install -r requirements.txt -r requirements-dev.txt
```

### 2. Configure secrets

```bash
cp .env.example .env
# Edit .env and fill in your OPENAQ_API_KEY
```

### 3. Run data ingestion

```bash
python -m src.ingestion.openaq_fetch      # Fetch AQ data for 6 Indian cities
python -m src.ingestion.openmeteo_fetch   # Fetch meteorological data
```

### 4. Build features

```bash
# DVC pipeline (recommended — tracks all stages):
dvc repro

# Or manually:
python -m src.features.build_dataset
```

### 5. Train the model

```bash
python -m src.models.core.train

# With Hydra overrides:
python -m src.models.core.train model.d_model=128 train.lr=5e-4 train.epochs=50
```

### 6. Run the API + Dashboard

```bash
# Start API server
uvicorn src.serving.app:app --reload --port 8000

# Start dashboard (separate terminal)
streamlit run dashboard/app.py
```

### 7. Docker (production)

```bash
docker-compose up --build
# API:       http://localhost:8000
# Dashboard: http://localhost:8501
```

## Running Tests

```bash
pytest tests/ -v --cov=src --cov-report=html
```

Key test modules:
- `tests/unit/test_graph.py` — Graph directionality, symmetry, edge count
- `tests/unit/test_model.py` — Output shape, quantile monotonicity, loss correctness
- `tests/unit/test_conformal.py` — CQR coverage on synthetic i.i.d. data
- `tests/unit/test_temporal_features.py` — Leakage-free lags, cyclical bounds
- `tests/integration/test_pipeline_end_to_end.py` — Temporal split integrity
- `tests/integration/test_api.py` — FastAPI health endpoint

## Project Structure

```
aqi-forecast/
├── configs/                # Hydra YAML configs
│   ├── model.yaml
│   └── feature_groups.yaml
├── dashboard/              # Streamlit UI
│   ├── app.py              # Forecast dashboard
│   └── ops_view.py         # MLOps ops dashboard
├── data/                   # (gitignored) — managed via DVC
│   ├── raw/
│   ├── interim/
│   └── feature_store/
├── docs/                   # Architecture diagrams, paper figures
├── k8s/                    # Kubernetes manifests (advanced/optional)
├── logs/                   # Structured JSON request logs
├── metrics/                # DVC metrics output
├── models/                 # (gitignored) — model checkpoints
├── notebooks/              # EDA and sanity-check notebooks
├── src/
│   ├── config/             # Hydra + Pydantic settings
│   ├── evaluation/         # Metrics, ablation, statistical tests
│   ├── explainability/     # SHAP, Integrated Gradients, counterfactuals
│   ├── feature_store/      # Parquet-backed offline feature store
│   ├── features/           # Feature engineering + AQI calculator
│   ├── graph/              # MAADG graph construction (dynamic wind + learned)
│   ├── ingestion/          # OpenAQ, Open-Meteo, NASA POWER fetchers
│   ├── mlops/              # Drift monitor, retrain pipeline, logging
│   ├── models/
│   │   ├── baselines/      # Persistence, LR, RF, XGB, LGB, LSTM, PatchTST, iTransformer
│   │   └── core/           # MAADGTransformer, train, HPO, finetune, DDP
│   ├── serving/            # FastAPI app, middleware, security, versioning
│   ├── uncertainty/        # CQR conformal prediction + coverage validation
│   └── validation/         # Pydantic schemas + dataset integrity checks
└── tests/
    ├── unit/
    └── integration/
```

## Key Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Graph attention | GATv2 | Relation-aware; handles asymmetric wind transport |
| Loss function | Pinball + monotonicity penalty | Quantile regression with crossing-prevention |
| Uncertainty | CQR (Conformalized Quantile Regression) | Distribution-free coverage guarantees |
| Explainability | Integrated Gradients (Captum) + SHAP | Theoretically grounded; satisfies sensitivity axiom |
| Drift detection | ADWIN + PSI + KS-test (quorum 2/3) | No single-detector false alarm; early feature-shift warning |
| Serving format | ONNX | Avoids PyTorch dependency in production; ~10× faster cold start |
| Config management | Hydra | Reproducible sweeps; CLI overrides without code changes |
| Data versioning | DVC | `git log` + `dvc checkout` restores any past experiment's exact data |

## API Reference

### `GET /health`
Returns `{"status": "ok", "model_version": "2.0.0", "model_loaded": true}`.

### `POST /predict`
```json
{"station_id": 1, "horizons": [1, 6, 24, 168]}
```
Returns multi-pollutant forecasts with 90% conformal prediction intervals.

### `GET /alert/{station_id}?threshold=300`
Returns `{"alert": true/false, "forecast_upper_bound": 312.5, ...}`.

## Paper Artifacts

This codebase directly supports each claim in the accompanying research paper:
- **Ablation grid**: `src/evaluation/ablation_harness.py` + `python -m src.models.core.train graph.type=static_knn`
- **Statistical tests**: `src/evaluation/statistical_tests.py` (DM, Wilcoxon, bootstrap CI)
- **Conformal coverage table**: `src/uncertainty/coverage_validation.py`
- **Failure mode table**: `src/evaluation/failure_mode_eval.py`
- **Inference latency**: `src/evaluation/runtime_benchmark.py`

## Citation

```bibtex
@article{maadg2026,
  title={Real-Time Adaptive Spatio-Temporal AQI Prediction using Multi-layer Attention-based
         Adaptive Dynamic Graphs and Conformalized Quantile Regression},
  author={...},
  journal={...},
  year={2026}
}
```
