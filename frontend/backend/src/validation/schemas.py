from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional

class PollutantReading(BaseModel):
    """Contract for a single OpenAQ measurement record."""
    location_id: int
    datetime_utc: datetime
    parameter: str = Field(pattern=r"^(pm25|pm10|no2|o3|co|so2)$")
    value: float
    unit: str

    @field_validator("value")
    @classmethod
    def physically_plausible(cls, v: float, info) -> float:
        # Loose sanity bounds per pollutant family; refine per-parameter in production.
        if v < 0 or v > 5000:
            raise ValueError(f"Implausible reading: {v}")
        return v

class WeatherReading(BaseModel):
    """Contract for a single Open-Meteo hourly weather record."""
    datetime_utc: datetime
    temperature_2m: Optional[float] = None
    relative_humidity_2m: Optional[float] = Field(default=None, ge=0, le=100)
    wind_speed_10m: Optional[float] = Field(default=None, ge=0, le=150)
    wind_direction_10m: Optional[float] = Field(default=None, ge=0, le=360)
    surface_pressure: Optional[float] = Field(default=None, ge=800, le=1100)

class Station(BaseModel):
    location_id: int
    name: str
    city: str
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)

class UrbanContext(BaseModel):
    """Static or slowly-changing station-neighborhood features used by MAADG layers."""
    location_id: int
    road_density_km_per_km2: Optional[float] = Field(default=None, ge=0)
    industrial_landuse_pct: Optional[float] = Field(default=None, ge=0, le=1)
    vegetation_pct: Optional[float] = Field(default=None, ge=0, le=1)
    population_density: Optional[float] = Field(default=None, ge=0)
    elevation_m: Optional[float] = None
