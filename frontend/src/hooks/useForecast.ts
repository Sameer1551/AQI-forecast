import { useQuery } from '@tanstack/react-query';
import { getForecast } from '@/api/forecast';
import { getMockForecast } from '@/mock/mockForecast';
import { useAppStore } from '@/store/appStore';

export function useForecast(stationId: number | null, horizons: number[] = [1, 6, 24, 168]) {
  const isDemoMode = useAppStore((s) => s.isDemoMode);
  return useQuery({
    queryKey: ['forecast', stationId, horizons],
    queryFn: () => (isDemoMode ? Promise.resolve(getMockForecast(stationId!, horizons)) : getForecast(stationId!, horizons)),
    enabled: stationId !== null,
    staleTime: 60000,
  });
}
