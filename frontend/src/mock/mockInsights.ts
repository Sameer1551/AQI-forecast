import type { InsightsResponse } from '@/types/Insights';

export const mockInsights: InsightsResponse = {
  model_version: '2.1.0',
  training_date: '2026-07-15',
  dataset_period: '2025-07-01 to 2026-07-14',
  n_stations: 24,
  n_cities: 6,
  coverage_by_horizon: {
    '1h': { empirical: 0.913, nominal: 0.90 },
    '6h': { empirical: 0.908, nominal: 0.90 },
    '24h': { empirical: 0.897, nominal: 0.90 },
    '168h': { empirical: 0.881, nominal: 0.90 },
  },
  rmse_by_pollutant: { pm25: 12.4, pm10: 18.7, no2: 8.3, o3: 6.1, co: 0.4, so2: 5.2 },
  extreme_event_precision: 0.78,
  extreme_event_recall: 0.71,
};
