import streamlit as st
import requests
import pandas as pd
import plotly.graph_objects as go

st.set_page_config(page_title="AQI Forecast Dashboard", layout="wide")
st.title("Real-Time Adaptive AQI Forecast")

API_URL = st.sidebar.text_input("API URL", "http://localhost:8000")
station_id = st.sidebar.number_input("Station ID", value=1, step=1)

if st.sidebar.button("Get Forecast"):
    try:
        resp = requests.post(f"{API_URL}/predict", json={"station_id": station_id, "horizons": [1, 6, 24, 168]})
        resp.raise_for_status()
        df = pd.DataFrame(resp.json())

        for pollutant in df["pollutant"].unique():
            sub = df[df["pollutant"] == pollutant]
            fig = go.Figure()
            fig.add_trace(go.Scatter(x=sub["horizon_hours"], y=sub["prediction"], mode="lines+markers", name="Forecast"))
            fig.add_trace(go.Scatter(x=sub["horizon_hours"], y=sub["upper_90"], mode="lines",
                                       line=dict(width=0), showlegend=False))
            fig.add_trace(go.Scatter(x=sub["horizon_hours"], y=sub["lower_90"], mode="lines",
                                       line=dict(width=0), fill="tonexty", fillcolor="rgba(0,100,255,0.2)",
                                       name="90% interval"))
            fig.update_layout(title=f"{pollutant.upper()} Forecast — Station {station_id}",
                                xaxis_title="Horizon (hours)", yaxis_title="Concentration")
            st.plotly_chart(fig, use_container_width=True)

            with st.expander(f"Why this {pollutant} forecast?"):
                st.write(", ".join(sub.iloc[0]["top_factors"]))
    except Exception as e:
        st.error(f"Error connecting to API: {e}")
