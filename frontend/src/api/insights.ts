import { apiFetch } from './client';
import type { InsightsResponse } from '@/types/Insights';
import { mockInsights } from '@/mock/mockInsights';

export async function getInsights(): Promise<InsightsResponse> {
  return apiFetch<InsightsResponse>('/insights');
}

export { mockInsights };
