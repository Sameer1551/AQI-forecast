export interface ForecastPoint {
  station_id: number;
  pollutant: string;
  horizon_hours: number;
  prediction: number;
  lower_90: number;
  upper_90: number;
  top_factors?: string[];
}

export type ForecastResponse = ForecastPoint[];
