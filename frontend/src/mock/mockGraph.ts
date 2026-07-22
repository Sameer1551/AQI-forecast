import type { GraphData } from '@/types/Graph';
import { mockStations } from './mockStations';

export const mockDelhiGraph: GraphData = {
  nodes: mockStations
    .filter((s) => s.city === 'Delhi')
    .map((s) => ({ id: s.id, name: s.name, lat: s.lat, lon: s.lon, aqi: s.current_aqi })),
  edges: [
    { source: 5, target: 1, weight: 0.87, relation_type: 'transport', wind_alignment: 0.92, distance_km: 14.2 },
    { source: 6, target: 2, weight: 0.72, relation_type: 'transport', wind_alignment: 0.68, distance_km: 8.7 },
    { source: 1, target: 2, weight: 0.61, relation_type: 'weather', wind_alignment: 0.55, distance_km: 11.4 },
    { source: 5, target: 6, weight: 0.54, relation_type: 'land_use', wind_alignment: 0.48, distance_km: 6.2 },
    { source: 2, target: 3, weight: 0.43, relation_type: 'traffic_emission', wind_alignment: 0.38, distance_km: 9.8 },
    { source: 3, target: 4, weight: 0.31, relation_type: 'weather', wind_alignment: 0.29, distance_km: 4.5 },
  ],
  wind_speed_ms: 1.2,
  wind_direction_deg: 285,
  boundary_layer_height_m: 320,
  timestamp: '2026-07-22T07:45:00Z',
};

function generateCityGraph(city: string): GraphData {
  const cityStations = mockStations.filter((s) => s.city === city);
  if (city === 'Delhi') return mockDelhiGraph;
  const nodes = cityStations.map((s) => ({ id: s.id, name: s.name, lat: s.lat, lon: s.lon, aqi: s.current_aqi }));
  const relationTypes = ['transport', 'weather', 'traffic_emission', 'land_use', 'sensor'] as const;
  const edges = [];
  for (let i = 0; i < cityStations.length; i++) {
    for (let j = i + 1; j < cityStations.length; j++) {
      const s = cityStations[i];
      const t = cityStations[j];
      const dist = Math.sqrt((s.lat - t.lat) ** 2 + (s.lon - t.lon) ** 2) * 111;
      if (dist < 25) {
        const weight = Math.round((0.3 + Math.random() * 0.5) * 100) / 100;
        edges.push({
          source: s.id,
          target: t.id,
          weight,
          relation_type: relationTypes[Math.floor(Math.random() * relationTypes.length)],
          wind_alignment: Math.round((0.3 + Math.random() * 0.6) * 100) / 100,
          distance_km: Math.round(dist * 10) / 10,
        });
      }
    }
  }
  const ref = cityStations[0];
  return {
    nodes,
    edges,
    wind_speed_ms: ref.wind_speed_ms,
    wind_direction_deg: ref.wind_direction_deg,
    boundary_layer_height_m: ref.boundary_layer_height_m,
    timestamp: '2026-07-22T07:45:00Z',
  };
}

export function getMockGraph(stationId: number): GraphData {
  const station = mockStations.find((s) => s.id === stationId);
  if (!station) return mockDelhiGraph;
  return generateCityGraph(station.city);
}
