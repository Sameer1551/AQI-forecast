import { apiFetch } from './client';
import type { Station } from '@/types/Station';
import { mockStations } from '@/mock/mockStations';

export async function getStations(): Promise<Station[]> {
  return apiFetch<Station[]>('/stations');
}

export async function getStation(id: number): Promise<Station> {
  return apiFetch<Station>(`/stations/${id}`);
}

export { mockStations };
