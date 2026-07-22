export type RelationType = 'transport' | 'weather' | 'traffic_emission' | 'land_use' | 'sensor';

export interface GraphNode {
  id: number;
  name: string;
  lat: number;
  lon: number;
  aqi: number;
}

export interface GraphEdge {
  source: number;
  target: number;
  weight: number;
  relation_type: RelationType;
  wind_alignment: number;
  distance_km: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  wind_speed_ms: number;
  wind_direction_deg: number;
  boundary_layer_height_m: number;
  timestamp: string;
}
