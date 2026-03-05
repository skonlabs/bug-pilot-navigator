import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type OnboardingStep = 'welcome' | 'org-setup' | 'connect-first' | 'test-run' | 'complete';

interface AppState {
  // UI state
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
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
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setActiveIncident: (id: string | null) => void;
  setOnboardingStep: (step: OnboardingStep) => void;
  completeOnboarding: () => void;
  updateSetupProgress: (key: keyof AppState['setupProgress'], value: boolean) => void;
  resetOnboarding: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
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
      toggleMobileSidebar: () => set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setActiveIncident: (id) => set({ activeIncidentId: id }),
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      completeOnboarding: () => set({
        isOnboarded: true,
        onboardingStep: 'complete',
        setupProgress: {
          orgConfigured: true,
          firstConnectorLinked: true,
          firstIncidentCreated: false,
          teamInvited: false,
        },
      }),
      updateSetupProgress: (key, value) =>
        set((s) => ({ setupProgress: { ...s.setupProgress, [key]: value } })),
      resetOnboarding: () => set({
        isOnboarded: false,
        onboardingStep: 'welcome',
        setupProgress: {
          orgConfigured: false,
          firstConnectorLinked: false,
          firstIncidentCreated: false,
          teamInvited: false,
        },
      }),
    }),
    {
      name: 'bugpilot-app-state',
      partialize: (state) => ({
        isOnboarded: state.isOnboarded,
        onboardingStep: state.onboardingStep,
        setupProgress: state.setupProgress,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
