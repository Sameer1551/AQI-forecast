import type { ForecastPoint } from '@/types/Forecast';
import type { PollutantKey } from '@/types/Station';
import { mockStations } from './mockStations';

const HORIZONS = [1, 6, 24, 168];

function generateForecast(stationId: number, pollutant: PollutantKey, baseValue: number): ForecastPoint[] {
  return HORIZONS.map((h) => {
    const decay = h === 1 ? 1.0 : h === 6 ? 0.94 : h === 24 ? 0.82 : 0.66;
    const prediction = baseValue * decay * (0.95 + Math.random() * 0.1);
    const spread = prediction * (h === 1 ? 0.11 : h === 6 ? 0.15 : h === 24 ? 0.2 : 0.28);
    return {
      station_id: stationId,
      pollutant,
      horizon_hours: h,
      prediction: Math.round(prediction * 10) / 10,
      lower_90: Math.round((prediction - spread) * 10) / 10,
      upper_90: Math.round((prediction + spread) * 10) / 10,
    };
  });
}

const TOP_FACTORS_24H = [
  'Wind speed below 2 m/s (calm — poor dispersion)',
  'Temperature inversion active (boundary layer: 320m, 40% below seasonal mean)',
  'PM2.5 lag-6h: 128 µg/m³ (elevated baseline)',
  'Upwind source: Punjabi Bagh (MAADG transport edge weight: 0.87, wind alignment: 0.92)',
  'Rush hour traffic emission window (7am–9am pattern)',
];

export function getMockForecast(stationId: number, horizons: number[] = HORIZONS): ForecastPoint[] {
  const station = mockStations.find((s) => s.id === stationId) ?? mockStations[0];
  const pollutantMap: Record<PollutantKey, number> = {
    pm25: station.current_pm25,
    pm10: station.current_pm10,
    no2: station.current_no2,
    o3: station.current_o3,
    co: station.current_co,
    so2: station.current_so2,
  };
  const result: ForecastPoint[] = [];
  (Object.keys(pollutantMap) as PollutantKey[]).forEach((p) => {
    const points = generateForecast(stationId, p, pollutantMap[p]);
    points.forEach((pt) => {
      if (horizons.includes(pt.horizon_hours)) {
        if (p === 'pm25' && pt.horizon_hours === 24) {
          pt.top_factors = TOP_FACTORS_24H;
        }
        result.push(pt);
      }
    });
  });
  return result;
}

export const mockForecastStation1: ForecastPoint[] = [
  { station_id: 1, pollutant: 'pm25', horizon_hours: 1, prediction: 148.5, lower_90: 132.1, upper_90: 164.9 },
  { station_id: 1, pollutant: 'pm25', horizon_hours: 6, prediction: 138.2, lower_90: 118.4, upper_90: 158.0 },
  { station_id: 1, pollutant: 'pm25', horizon_hours: 24, prediction: 118.6, lower_90: 95.2, upper_90: 142.0, top_factors: TOP_FACTORS_24H },
  { station_id: 1, pollutant: 'pm25', horizon_hours: 168, prediction: 94.8, lower_90: 68.4, upper_90: 121.2 },
];
