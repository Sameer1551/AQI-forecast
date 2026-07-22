import { useQuery } from '@tanstack/react-query';
import { getGraph } from '@/api/graph';
import { getMockGraph } from '@/mock/mockGraph';
import { useAppStore } from '@/store/appStore';

export function useGraph(stationId: number | null) {
  const isDemoMode = useAppStore((s) => s.isDemoMode);
  return useQuery({
    queryKey: ['graph', stationId],
    queryFn: () => (isDemoMode ? Promise.resolve(getMockGraph(stationId!)) : getGraph(stationId!)),
    enabled: stationId !== null,
    staleTime: 60000,
  });
}
