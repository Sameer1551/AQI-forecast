import { apiFetch } from './client';
import type { DriftResponse } from '@/types/Drift';
import { mockDrift } from '@/mock/mockDrift';

export async function getDrift(): Promise<DriftResponse> {
  return apiFetch<DriftResponse>('/drift');
}

export { mockDrift };
