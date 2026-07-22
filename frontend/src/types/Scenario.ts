export interface Perturbation {
  type: 'traffic_reduction' | 'industrial_reduction' | 'vegetation_increase' | 'wind_change';
  value: number;
}

export interface ScenarioRequest {
  station_id: number;
  perturbation: Perturbation;
}

export interface ScenarioResponse {
  baseline: import('./Forecast').ForecastPoint[];
  perturbed: import('./Forecast').ForecastPoint[];
  delta_pm25_24h: number;
  delta_aqi_24h: number;
  aqi_category_change: { from: string; to: string };
}
