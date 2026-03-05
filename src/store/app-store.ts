import { create } from 'zustand';

type OnboardingStep = 'welcome' | 'org-setup' | 'connect-first' | 'test-run' | 'complete';

interface AppState {
  // UI state
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  activeIncidentId: string | null;
  
  // Onboarding
  isOnboarded: boolean;
  onboardingStep: OnboardingStep;
  
  // Setup progress
  setupProgress: {
    orgConfigured: boolean;
    firstConnectorLinked: boolean;
    firstIncidentCreated: boolean;
    teamInvited: boolean;
  };

  // Actions
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setActiveIncident: (id: string | null) => void;
  setOnboardingStep: (step: OnboardingStep) => void;
  completeOnboarding: () => void;
  updateSetupProgress: (key: keyof AppState['setupProgress'], value: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  activeIncidentId: null,
  isOnboarded: false,
  onboardingStep: 'welcome',
  setupProgress: {
    orgConfigured: false,
    firstConnectorLinked: false,
    firstIncidentCreated: false,
    teamInvited: false,
  },

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setActiveIncident: (id) => set({ activeIncidentId: id }),
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  completeOnboarding: () => set({ isOnboarded: true, onboardingStep: 'complete' }),
  updateSetupProgress: (key, value) =>
    set((s) => ({ setupProgress: { ...s.setupProgress, [key]: value } })),
}));
