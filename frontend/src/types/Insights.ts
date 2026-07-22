export interface HorizonCoverage {
  empirical: number;
  nominal: number;
}

export interface InsightsResponse {
  model_version: string;
  training_date: string;
  dataset_period: string;
  n_stations: number;
  n_cities: number;
  coverage_by_horizon: {
    '1h': HorizonCoverage;
    '6h': HorizonCoverage;
    '24h': HorizonCoverage;
    '168h': HorizonCoverage;
  };
  rmse_by_pollutant: Record<string, number>;
  extreme_event_precision: number;
  extreme_event_recall: number;
}
