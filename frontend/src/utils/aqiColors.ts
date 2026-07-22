import type { PollutantKey } from '@/types/Station';

export type AQICategory =
  | 'Good'
  | 'Moderate'
  | 'Unhealthy for Sensitive Groups'
  | 'Unhealthy'
  | 'Very Unhealthy'
  | 'Hazardous';

export function getAQICategory(aqi: number): AQICategory {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

export function getAQIColor(aqi: number): string {
  if (aqi <= 50) return 'var(--aqi-good)';
  if (aqi <= 100) return 'var(--aqi-moderate)';
  if (aqi <= 150) return 'var(--aqi-sensitive)';
  if (aqi <= 200) return 'var(--aqi-unhealthy)';
  if (aqi <= 300) return 'var(--aqi-very-unhealthy)';
  return 'var(--aqi-hazardous)';
}

export function getAQIColorHSL(aqi: number): string {
  if (aqi <= 50) return 'hsl(142, 71%, 45%)';
  if (aqi <= 100) return 'hsl(48, 96%, 53%)';
  if (aqi <= 150) return 'hsl(28, 96%, 53%)';
  if (aqi <= 200) return 'hsl(0, 72%, 51%)';
  if (aqi <= 300) return 'hsl(280, 67%, 44%)';
  return 'hsl(0, 50%, 28%)';
}

export function getAQIColorWithAlpha(aqi: number, alpha: number): string {
  const hsl = getAQIColorHSL(aqi).replace('hsl(', '').replace(')', '');
  const [h, s, l] = hsl.split(',').map((p) => p.trim());
  return `hsla(${h}, ${s}, ${l}, ${alpha})`;
}

export function getEdgeColor(relationType: string): string {
  switch (relationType) {
    case 'transport': return 'var(--edge-transport)';
    case 'weather': return 'var(--edge-weather)';
    case 'traffic_emission': return 'var(--edge-traffic)';
    case 'land_use': return 'var(--edge-land-use)';
    case 'sensor': return 'var(--edge-sensor)';
    default: return 'var(--text-muted)';
  }
}

export function getEdgeColorHSL(relationType: string): string {
  switch (relationType) {
    case 'transport': return 'hsl(190, 90%, 55%)';
    case 'weather': return 'hsl(215, 80%, 60%)';
    case 'traffic_emission': return 'hsl(28, 96%, 53%)';
    case 'land_use': return 'hsl(142, 71%, 45%)';
    case 'sensor': return 'hsl(265, 70%, 65%)';
    default: return 'hsl(210, 12%, 45%)';
  }
}

export function getStationValue(station: import('@/types/Station').Station, key: PollutantKey): number {
  const map: Record<PollutantKey, keyof import('@/types/Station').Station> = {
    pm25: 'current_pm25',
    pm10: 'current_pm10',
    no2: 'current_no2',
    o3: 'current_o3',
    co: 'current_co',
    so2: 'current_so2',
  };
  return station[map[key]] as number;
}
