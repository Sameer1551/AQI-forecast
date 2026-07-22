import { getAQIColor, getAQIColorHSL } from '@/utils/aqiColors';

export function useAQIColor(aqi: number): string {
  return getAQIColor(aqi);
}

export function useAQIColorHSL(aqi: number): string {
  return getAQIColorHSL(aqi);
}
