import requests
import pandas as pd

def get_nasa_power(lat: float, lon: float, start: str, end: str) -> pd.DataFrame:
    """start/end format: YYYYMMDD. No API key required. Adds solar-radiation and
    altitude-wind features that support temperature-inversion detection (Ch.5)."""
    url = "https://power.larc.nasa.gov/api/temporal/hourly/point"
    params = {
        "parameters": "ALLSKY_SFC_SW_DWN,T2M,WS10M,WS50M,PS",
        "community": "AG", "longitude": lon, "latitude": lat,
        "start": start, "end": end, "format": "JSON",
    }
    resp = requests.get(url, params=params, timeout=60)
    resp.raise_for_status()
    data = resp.json()["properties"]["parameter"]
    df = pd.DataFrame(data)
    df.index = pd.to_datetime(df.index, format="%Y%m%d%H")
    return df.reset_index().rename(columns={"index": "datetime_utc"})
