# MAADG AQI: Air Quality Intelligence System

![AQI Forecast Dashboard](https://img.shields.io/badge/Status-Active-brightgreen)
![Python](https://img.shields.io/badge/Backend-FastAPI_Python-3776AB?logo=python)
![React](https://img.shields.io/badge/Frontend-React_TypeScript-61DAFB?logo=react)

MAADG (Meteorology-Aware Adaptive Dynamic Graph) is a research-grade AI system designed for real-time spatio-temporal Air Quality Index (AQI) prediction across major Indian cities.

This repository contains the complete implementation, including a high-performance **FastAPI backend** for model inference and a rich **React + TypeScript frontend** for visualizing atmospheric predictions, graph networks, and policy scenarios.

## 🧠 The AI Model (MAADG)

The core novelty of this system is the MAADG model. Unlike traditional time-series models, MAADG builds a **dynamic graph** between monitoring stations where edge weights update every hour based on live meteorological data.

- **Physics-Informed Transport Prior:** If the wind blows from Station A toward Station B, the model increases the influence of Station A's pollution on Station B's future state.
- **Probabilistic Forecasting:** It uses Conformalized Quantile Regression (CQR) to provide 90% confidence intervals, not just point estimates.
- **Explainability:** Built-in SHAP (SHapley Additive exPlanations) highlights *why* a forecast was made (e.g., "Wind speed below 2 m/s", "Temperature inversion").

## 📂 Repository Structure

The project is structured as a monorepo:

- `/backend` — The Python FastAPI inference engine, data ingestion pipelines, and ML training code.
- `/frontend` — The React + TypeScript dashboard.

## 🚀 Getting Started

### 1. Running the Backend

The backend exposes REST APIs for predictions, digital twin scenario simulations, and graph visualization.

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # Or `.venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
python -m uvicorn src.serving.app:app --host 0.0.0.0 --port 8000 --reload
```
*The backend API will be available at `http://localhost:8000`.*

### 2. Running the Frontend

The frontend is a modern Vite application using a dark glassmorphism design system.

```bash
cd frontend

# Install dependencies
npm install

# Setup environment variable to point to backend
echo "VITE_API_URL=http://localhost:8000" > .env

# Start the Vite development server
npm run dev
```
*The web dashboard will be available at `http://localhost:5173`.*

## 🌟 Key Features

1. **Live Geographic Map:** Real-time AQI monitoring with animated alerts for hazardous conditions.
2. **Multi-Horizon Probabilistic Forecasts:** View predictions for 1h, 6h, 24h, and 168h horizons alongside model confidence bounds.
3. **Graph Explorer:** Visually inspect the MAADG AI's internal transport and weather graphs with animated particle flows.
4. **Digital Twin Policy Simulator:** Simulate the impact of policy decisions (e.g., "Reduce traffic by 50%") and observe counterfactual AQI predictions.
5. **Drift Monitoring:** Built-in MLOps tracking for data drift (PSI/ADWIN) to ensure the AI remains reliable over time.

## 🔬 Research Context

This codebase implements the system proposed in the paper: **"Building the Real-Time Adaptive Spatio-Temporal AQI Prediction System"**. It integrates data from OpenAQ, Open-Meteo, and NASA POWER to construct the spatial graph.
