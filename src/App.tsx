import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAppStore } from "@/store/app-store";
import { OnboardingWizard } from "@/components/bugpilot/OnboardingWizard";
import { DashboardLayout } from "@/components/bugpilot/DashboardLayout";
import IncidentsPage from "@/pages/IncidentsPage";
import InvestigationPage from "@/pages/InvestigationPage";
import ResolutionPacketPage from "@/pages/ResolutionPacketPage";
import PostmortemPage from "@/pages/PostmortemPage";
import TopologyPage from "@/pages/TopologyPage";
import FixesPage from "@/pages/FixesPage";
import ReadinessPage from "@/pages/ReadinessPage";
import ServiceReadinessPage from "@/pages/ServiceReadinessPage";
import ReportsPage from "@/pages/ReportsPage";
import IntegrationsPage from "@/pages/IntegrationsPage";
import ConnectorDetailPage from "@/pages/ConnectorDetailPage";
import SettingsPage from "@/pages/SettingsPage";
import AuditPage from "@/pages/AuditPage";
import GettingStartedPage from "@/pages/GettingStartedPage";
import IndexPage from "@/pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
  },
});

function AppContent() {
  const { isOnboarded } = useAppStore();

  if (!isOnboarded) {
    return <OnboardingWizard />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          {/* Home Dashboard */}
          <Route path="/" element={<IndexPage />} />

          {/* Incidents */}
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/incidents/:id" element={<InvestigationPage />} />
          <Route path="/incidents/:id/packet" element={<ResolutionPacketPage />} />
          <Route path="/incidents/:id/postmortem" element={<PostmortemPage />} />

          {/* System Map */}
          <Route path="/topology" element={<TopologyPage />} />

          {/* Fixes */}
          <Route path="/fixes" element={<FixesPage />} />

          {/* Readiness */}
          <Route path="/readiness" element={<ReadinessPage />} />
          <Route path="/readiness/:serviceId" element={<ServiceReadinessPage />} />

          {/* Reports */}
          <Route path="/reports" element={<ReportsPage />} />

          {/* Integrations */}
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/integrations/:name" element={<ConnectorDetailPage />} />

          {/* Getting Started */}
          <Route path="/getting-started" element={<GettingStartedPage />} />

          {/* Settings */}
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/audit" element={<AuditPage />} />
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
