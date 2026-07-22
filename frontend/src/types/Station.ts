export interface Station {
  id: number;
  name: string;
  city: string;
  lat: number;
  lon: number;
  current_aqi: number;
  current_category: string;
  current_pm25: number;
  current_pm10: number;
  current_no2: number;
  current_o3: number;
  current_co: number;
  current_so2: number;
  dominant_pollutant: string;
  wind_speed_ms: number;
  wind_direction_deg: number;
  temperature_c: number;
  boundary_layer_height_m: number;
}

export type PollutantKey = 'pm25' | 'pm10' | 'no2' | 'o3' | 'co' | 'so2';
