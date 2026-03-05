import { create } from 'zustand';

interface AppState {
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  activeIncidentId: string | null;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setActiveIncident: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  activeIncidentId: null,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setActiveIncident: (id) => set({ activeIncidentId: id }),
}));
