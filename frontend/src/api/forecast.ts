import { apiPost } from './client';
import type { ForecastPoint } from '@/types/Forecast';
import { getMockForecast } from '@/mock/mockForecast';

export async function getForecast(stationId: number, horizons: number[]): Promise<ForecastPoint[]> {
  return apiPost<ForecastPoint[]>('/predict', { station_id: stationId, horizons });
}

export { getMockForecast };
