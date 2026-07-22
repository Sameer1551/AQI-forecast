import requests
import pandas as pd
import time
import logging
from datetime import datetime, timedelta
from src.validation.schemas import PollutantReading, Station
from src.validation.validate_batch import validate_records
from src.config.secrets import settings

logger = logging.getLogger("ingestion.openaq")
BASE_URL = "https://api.openaq.org/v3"
HEADERS = {"X-API-Key": settings.openaq_api_key}


def get_locations(city: str, country_iso: str, limit: int = 20) -> pd.DataFrame:
    """Discover monitoring stations for a city; validates each against the Station contract."""
    params = {"iso": country_iso, "limit": limit}
    resp = requests.get(f"{BASE_URL}/locations", headers=HEADERS, params=params, timeout=30)
    resp.raise_for_status()
    results = resp.json()["results"]

    raw_rows = []
    for loc in results:
        if city.lower() in loc.get("name", "").lower() or city.lower() in str(loc.get("locality", "")).lower():
            raw_rows.append({
                "location_id": loc["id"], "name": loc["name"], "city": city,
                "lat": loc["coordinates"]["latitude"], "lon": loc["coordinates"]["longitude"],
            })
    valid_df, rejected_df = validate_records(raw_rows, Station)
    if len(rejected_df):
        logger.warning("Rejected %d station records for %s: see data/raw/_rejected/", len(rejected_df), city)
        rejected_df.to_csv(f"data/raw/_rejected/stations_{city}.csv", index=False)
    return valid_df


def get_measurements(location_id: int, date_from: str, date_to: str, max_retries: int = 5) -> pd.DataFrame:
    """Pull hourly measurements with exponential backoff on rate limits."""
    all_rows, page, backoff = [], 1, 2
    while True:
        params = {"locations_id": location_id, "date_from": date_from, "date_to": date_to,
                   "limit": 1000, "page": page}
        for attempt in range(max_retries):
            resp = requests.get(f"{BASE_URL}/measurements", headers=HEADERS, params=params, timeout=30)
            if resp.status_code == 429:
                sleep_s = backoff ** attempt
                logger.info("Rate limited; sleeping %ds (attempt %d/%d)", sleep_s, attempt + 1, max_retries)
                time.sleep(sleep_s)
                continue
            resp.raise_for_status()
            break
        else:
            raise RuntimeError(f"Exceeded retries fetching location {location_id}")

        data = resp.json()["results"]
        if not data:
            break
        for m in data:
            all_rows.append({
                "location_id": location_id,
                "datetime_utc": m["period"]["datetimeFrom"]["utc"],
                "parameter": m["parameter"]["name"],
                "value": m["value"],
                "unit": m["parameter"]["units"],
            })
        page += 1
        time.sleep(0.5)  # polite pacing, independent of the retry backoff above

    valid_df, rejected_df = validate_records(all_rows, PollutantReading)
    if len(rejected_df):
        logger.warning("Rejected %d readings for station %d", len(rejected_df), location_id)
        rejected_df.to_csv(f"data/raw/_rejected/openaq_{location_id}.csv", index=False)
    return valid_df


if __name__ == "__main__":
    cities = {"Delhi": "IN", "Mumbai": "IN", "Bangalore": "IN", "Kolkata": "IN", "Chennai": "IN", "Hyderabad": "IN"}
    all_locs = [get_locations(c, iso) for c, iso in cities.items()]
    stations_df = pd.concat(all_locs, ignore_index=True)
    stations_df.to_csv("data/raw/stations.csv", index=False)

    end = datetime.utcnow()
    start = end - timedelta(days=365)  # 12 months for a seasonal-cycle-aware training set
    for _, row in stations_df.iterrows():
        df = get_measurements(row["location_id"], start.isoformat(), end.isoformat())
        df.to_csv(f"data/raw/openaq_{row['location_id']}.csv", index=False)
        logger.info("Saved %s: %d valid rows", row["name"], len(df))
