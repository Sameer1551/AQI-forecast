"""
EPA AQI breakpoints. Units: PM2.5/PM10 in ug/m3 (24h avg); CO in ppm (8h avg);
SO2/NO2 in ppb (1h avg, except SO2 24h for the top two categories); O3 in ppb (8h avg,
with a separate 1h table for high values — omitted here for brevity; see Appendix A).
"""
BREAKPOINTS = {
    "pm25": [(0.0, 12.0, 0, 50), (12.1, 35.4, 51, 100), (35.5, 55.4, 101, 150),
             (55.5, 150.4, 151, 200), (150.5, 250.4, 201, 300), (250.5, 350.4, 301, 400),
             (350.5, 500.4, 401, 500)],
    "pm10": [(0, 54, 0, 50), (55, 154, 51, 100), (155, 254, 101, 150),
             (255, 354, 151, 200), (355, 424, 201, 300), (425, 504, 301, 400), (505, 604, 401, 500)],
    "co": [(0.0, 4.4, 0, 50), (4.5, 9.4, 51, 100), (9.5, 12.4, 101, 150),
           (12.5, 15.4, 151, 200), (15.5, 30.4, 201, 300), (30.5, 40.4, 301, 400), (40.5, 50.4, 401, 500)],
    "so2": [(0, 35, 0, 50), (36, 75, 51, 100), (76, 185, 101, 150),
            (186, 304, 151, 200), (305, 604, 201, 300), (605, 804, 301, 400), (805, 1004, 401, 500)],
    "no2": [(0, 53, 0, 50), (54, 100, 51, 100), (101, 360, 101, 150),
            (361, 649, 151, 200), (650, 1249, 201, 300), (1250, 1649, 301, 400), (1650, 2049, 401, 500)],
    "o3": [(0, 54, 0, 50), (55, 70, 51, 100), (71, 85, 101, 150),
           (86, 105, 151, 200), (106, 200, 201, 300)],
}

def calc_sub_aqi(conc: float, pollutant: str) -> float | None:
    if conc is None or conc != conc:  # NaN check
        return None
    table = BREAKPOINTS[pollutant]
    for c_lo, c_hi, i_lo, i_hi in table:
        if c_lo <= conc <= c_hi:
            return round((i_hi - i_lo) / (c_hi - c_lo) * (conc - c_lo) + i_lo)
    return 500  # cap at hazardous ceiling

def calc_overall_aqi(readings: dict) -> tuple[float | None, str | None]:
    """readings: {'pm25': 145.0, 'no2': 40.0, ...}. Overall AQI = max of sub-indices
    (EPA convention — the worst pollutant determines the headline number), tagged
    with which pollutant drove it (useful for explainability, Ch.12)."""
    sub_indices = {p: calc_sub_aqi(v, p) for p, v in readings.items() if p in BREAKPOINTS}
    sub_indices = {p: v for p, v in sub_indices.items() if v is not None}
    if not sub_indices:
        return None, None
    dominant = max(sub_indices, key=sub_indices.get)
    return sub_indices[dominant], dominant
