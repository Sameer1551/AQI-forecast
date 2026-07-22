import { useQuery } from '@tanstack/react-query';
import { getHealth } from '@/api/health';
import { useAppStore } from '@/store/appStore';

export function useHealth() {
  const setDemoMode = useAppStore((s) => s.setDemoMode);
  const setApiOnline = useAppStore((s) => s.setApiOnline);
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      try {
        const res = await getHealth();
        setDemoMode(false);
        setApiOnline(true);
        return res;
      } catch {
        setDemoMode(true);
        setApiOnline(false);
        throw new Error('Backend unavailable');
      }
    },
    retry: 1,
    staleTime: 30000,
  });
}
