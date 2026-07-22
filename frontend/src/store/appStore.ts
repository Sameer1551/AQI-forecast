import { create } from 'zustand';
import type { Station } from '@/types/Station';

interface AppState {
  selectedStationId: number | null;
  selectedCity: string;
  isDemoMode: boolean;
  isApiOnline: boolean;
  isSidebarCollapsed: boolean;
  graphOverlayEnabled: boolean;
  activeRelationLayers: string[];
  setSelectedStationId: (id: number | null) => void;
  setSelectedCity: (city: string) => void;
  setDemoMode: (demo: boolean) => void;
  setApiOnline: (online: boolean) => void;
  toggleSidebar: () => void;
  setGraphOverlay: (enabled: boolean) => void;
  toggleRelationLayer: (layer: string) => void;
  setAllRelationLayers: (layers: string[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedStationId: 1,
  selectedCity: 'Delhi',
  isDemoMode: false,
  isApiOnline: false,
  isSidebarCollapsed: false,
  graphOverlayEnabled: false,
  activeRelationLayers: ['transport', 'weather', 'traffic_emission', 'land_use', 'sensor'],
  setSelectedStationId: (id) => set({ selectedStationId: id }),
  setSelectedCity: (city) => set({ selectedCity: city }),
  setDemoMode: (demo) => set({ isDemoMode: demo }),
  setApiOnline: (online) => set({ isApiOnline: online }),
  toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
  setGraphOverlay: (enabled) => set({ graphOverlayEnabled: enabled }),
  toggleRelationLayer: (layer) =>
    set((s) => ({
      activeRelationLayers: s.activeRelationLayers.includes(layer)
        ? s.activeRelationLayers.filter((l) => l !== layer)
        : [...s.activeRelationLayers, layer],
    })),
  setAllRelationLayers: (layers) => set({ activeRelationLayers: layers }),
}));

export function getStationById(stations: Station[], id: number | null): Station | undefined {
  if (id === null) return undefined;
  return stations.find((s) => s.id === id);
}
