import { apiPost } from './client';
import type { ScenarioRequest, ScenarioResponse } from '@/types/Scenario';
import { mockStations } from '@/mock/mockStations';
import { getMockForecast } from '@/mock/mockForecast';

export async function runScenario(req: ScenarioRequest): Promise<ScenarioResponse> {
  return apiPost<ScenarioResponse>('/scenario', req);
}

export function getMockScenario(req: ScenarioRequest): ScenarioResponse {
  const station = mockStations.find((s) => s.id === req.station_id) ?? mockStations[0];
  const baseline = getMockForecast(req.station_id, [1, 6, 24, 168]).filter((p) => p.pollutant === 'pm25');
  const perturbed = baseline.map((p) => {
    let factor = 1;
    if (req.perturbation.type === 'traffic_reduction') factor = 1 - req.perturbation.value / 100 * 0.15;
    else if (req.perturbation.type === 'industrial_reduction') factor = 1 - req.perturbation.value / 100 * 0.1;
    else if (req.perturbation.type === 'vegetation_increase') factor = 1 - req.perturbation.value / 100 * 0.05;
    else if (req.perturbation.type === 'wind_change') factor = 0.9;
    return { ...p, prediction: Math.round(p.prediction * factor * 10) / 10, lower_90: Math.round(p.lower_90 * factor * 10) / 10, upper_90: Math.round(p.upper_90 * factor * 10) / 10 };
  });
  const base24 = baseline.find((p) => p.horizon_hours === 24)?.prediction ?? 100;
  const pert24 = perturbed.find((p) => p.horizon_hours === 24)?.prediction ?? 80;
  const deltaPm25 = Math.round((pert24 - base24) * 10) / 10;
  const deltaAqi = Math.round(deltaPm25 * 2.3);
  const fromCat = station.current_category;
  const newAqi = Math.max(0, station.current_aqi + deltaAqi);
  let toCat = 'Good';
  if (newAqi > 300) toCat = 'Hazardous';
  else if (newAqi > 200) toCat = 'Very Unhealthy';
  else if (newAqi > 150) toCat = 'Unhealthy';
  else if (newAqi > 100) toCat = 'Unhealthy for Sensitive Groups';
  else if (newAqi > 50) toCat = 'Moderate';
  return {
    baseline,
    perturbed,
    delta_pm25_24h: deltaPm25,
    delta_aqi_24h: deltaAqi,
    aqi_category_change: { from: fromCat, to: toCat },
  };
}
