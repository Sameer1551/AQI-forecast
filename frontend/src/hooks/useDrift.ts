import { useQuery } from '@tanstack/react-query';
import { getDrift } from '@/api/drift';
import { mockDrift } from '@/mock/mockDrift';
import { useAppStore } from '@/store/appStore';

export function useDrift() {
  const isDemoMode = useAppStore((s) => s.isDemoMode);
  return useQuery({
    queryKey: ['drift'],
    queryFn: () => (isDemoMode ? Promise.resolve(mockDrift) : getDrift()),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}
