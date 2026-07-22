import type { PollutantKey } from '@/types/Station';

export interface PollutantConfig {
  key: PollutantKey;
  label: string;
  unit: string;
  safe: number;
  hazardous: number;
  breakpoints: number[];
  breakpointLabels: string[];
}

export const POLLUTANTS: Record<PollutantKey, PollutantConfig> = {
  pm25: {
    key: 'pm25',
    label: 'PM2.5',
    unit: 'µg/m³',
    safe: 12,
    hazardous: 250,
    breakpoints: [12.0, 35.4, 55.4, 150.4, 250.4],
    breakpointLabels: ['Good', 'Moderate', 'USG', 'Unhealthy', 'Very Unhealthy'],
  },
  pm10: {
    key: 'pm10',
    label: 'PM10',
    unit: 'µg/m³',
    safe: 54,
    hazardous: 425,
    breakpoints: [54, 154, 254, 354, 424],
    breakpointLabels: ['Good', 'Moderate', 'USG', 'Unhealthy', 'Very Unhealthy'],
  },
  no2: {
    key: 'no2',
    label: 'NO₂',
    unit: 'ppb',
    safe: 53,
    hazardous: 1250,
    breakpoints: [53, 100, 360, 649, 1249],
    breakpointLabels: ['Good', 'Moderate', 'USG', 'Unhealthy', 'Very Unhealthy'],
  },
  o3: {
    key: 'o3',
    label: 'O₃',
    unit: 'ppb',
    safe: 54,
    hazardous: 105,
    breakpoints: [54, 70, 85, 105, 200],
    breakpointLabels: ['Good', 'Moderate', 'USG', 'Unhealthy', 'Very Unhealthy'],
  },
  co: {
    key: 'co',
    label: 'CO',
    unit: 'ppm',
    safe: 4.4,
    hazardous: 30,
    breakpoints: [4.4, 9.4, 12.4, 15.4, 30.4],
    breakpointLabels: ['Good', 'Moderate', 'USG', 'Unhealthy', 'Very Unhealthy'],
  },
  so2: {
    key: 'so2',
    label: 'SO₂',
    unit: 'ppb',
    safe: 35,
    hazardous: 605,
    breakpoints: [35, 75, 185, 304, 604],
    breakpointLabels: ['Good', 'Moderate', 'USG', 'Unhealthy', 'Very Unhealthy'],
  },
};

export const POLLUTANT_ORDER: PollutantKey[] = ['pm25', 'pm10', 'no2', 'o3', 'co', 'so2'];

export const BREAKPOINT_COLORS = [
  'var(--aqi-good)',
  'var(--aqi-moderate)',
  'var(--aqi-sensitive)',
  'var(--aqi-unhealthy)',
  'var(--aqi-very-unhealthy)',
];

export function concentrationToSubAQI(pollutant: PollutantKey, concentration: number): number {
  const cfg = POLLUTANTS[pollutant];
  const bps = [0, ...cfg.breakpoints, cfg.hazardous * 2];
  const aqiBps = [0, 50, 100, 150, 200, 300, 500];
  for (let i = 0; i < bps.length - 1; i++) {
    if (concentration >= bps[i] && concentration <= bps[i + 1]) {
      const ratio = (concentration - bps[i]) / (bps[i + 1] - bps[i]);
      return Math.round(aqiBps[i] + ratio * (aqiBps[i + 1] - aqiBps[i]));
    }
  }
  return 500;
}
