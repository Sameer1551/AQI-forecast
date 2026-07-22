import { useQuery } from '@tanstack/react-query';
import { getInsights } from '@/api/insights';
import { mockInsights } from '@/mock/mockInsights';
import { useAppStore } from '@/store/appStore';

export function useInsights() {
  const isDemoMode = useAppStore((s) => s.isDemoMode);
  return useQuery({
    queryKey: ['insights'],
    queryFn: () => (isDemoMode ? Promise.resolve(mockInsights) : getInsights()),
    staleTime: 300000,
  });
}
