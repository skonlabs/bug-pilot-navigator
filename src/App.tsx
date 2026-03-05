import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "@/store/app-store";
import { OnboardingWizard } from "@/components/bugpilot/OnboardingWizard";
import { DashboardLayout } from "@/components/bugpilot/DashboardLayout";
import IncidentsPage from "@/pages/IncidentsPage";
import InvestigationPage from "@/pages/InvestigationPage";
import TopologyPage from "@/pages/TopologyPage";
import FixesPage from "@/pages/FixesPage";
import ReadinessPage from "@/pages/ReadinessPage";
import ReportsPage from "@/pages/ReportsPage";
import IntegrationsPage from "@/pages/IntegrationsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { isOnboarded } = useAppStore();

  if (!isOnboarded) {
    return <OnboardingWizard />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Per spec: / redirects to /incidents */}
        <Route path="/" element={<Navigate to="/incidents" replace />} />
        <Route element={<DashboardLayout />}>
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/incidents/:id" element={<InvestigationPage />} />
          <Route path="/topology" element={<TopologyPage />} />
          <Route path="/fixes" element={<FixesPage />} />
          <Route path="/readiness" element={<ReadinessPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
