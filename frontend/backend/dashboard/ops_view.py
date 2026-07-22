import streamlit as st
import pandas as pd
import mlflow

st.title("AQI Forecast — Operations Dashboard")

try:
    client = mlflow.tracking.MlflowClient()
    runs = client.search_runs(experiment_ids=["1"], order_by=["start_time DESC"], max_results=20)
    history = pd.DataFrame([{"run_id": r.info.run_id, "start_time": r.info.start_time,
                              **r.data.metrics} for r in runs])

    st.subheader("Recent Training Runs")
    st.line_chart(history.set_index("start_time")[["val_loss"]] if "val_loss" in history else pd.DataFrame())
except Exception as e:
    st.warning("MLflow not reachable.")

st.subheader("Drift Events (last 30 days)")
# Load src/mlops/drift_monitor.py's DriftMonitor.drift_log, persisted to a small
# JSON/parquet log file by the daily retrain check (Ch.14.3)
try:
    drift_log = pd.read_json("logs/drift_log.jsonl", lines=True)
    st.dataframe(drift_log.tail(20))
except Exception:
    st.info("No drift log found.")

st.subheader("Serving Health")
st.metric("Requests (last hour)", "—")  # wire to your log aggregator / a simple counter endpoint
st.metric("P95 Latency (ms)", "—")
