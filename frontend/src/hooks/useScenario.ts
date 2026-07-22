import { useMutation } from '@tanstack/react-query';
import { runScenario } from '@/api/scenario';
import { getMockScenario } from '@/api/scenario';
import { useAppStore } from '@/store/appStore';
import type { ScenarioRequest } from '@/types/Scenario';

export function useScenario() {
  const isDemoMode = useAppStore((s) => s.isDemoMode);
  return useMutation({
    mutationFn: (req: ScenarioRequest) => (isDemoMode ? Promise.resolve(getMockScenario(req)) : runScenario(req)),
  });
}
