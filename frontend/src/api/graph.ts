import { apiFetch } from './client';
import type { GraphData } from '@/types/Graph';
import { getMockGraph } from '@/mock/mockGraph';

export async function getGraph(stationId: number): Promise<GraphData> {
  return apiFetch<GraphData>(`/graph/${stationId}`);
}

export { getMockGraph };
