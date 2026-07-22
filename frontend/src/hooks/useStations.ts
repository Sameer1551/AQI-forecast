import { useQuery } from '@tanstack/react-query';
import { getStations } from '@/api/stations';
import { mockStations } from '@/mock/mockStations';
import { useAppStore } from '@/store/appStore';

export function useStations() {
  const isDemoMode = useAppStore((s) => s.isDemoMode);
  return useQuery({
    queryKey: ['stations'],
    queryFn: () => (isDemoMode ? Promise.resolve(mockStations) : getStations()),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}
