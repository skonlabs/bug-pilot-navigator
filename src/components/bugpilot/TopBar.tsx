import { useAppStore } from '@/store/app-store';
import { useLocation } from 'react-router-dom';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const routeTitles: Record<string, string> = {
  '/incidents': 'Incidents',
  '/topology': 'Service Topology',
  '/fixes': 'Fix Approvals',
  '/readiness': 'Readiness & Gaps',
  '/reports': 'Reports',
  '/integrations': 'Integrations',
  '/settings': 'Settings',
};

export function TopBar() {
  const { setCommandPaletteOpen } = useAppStore();
  const location = useLocation();
  const title = Object.entries(routeTitles).find(([path]) => location.pathname.startsWith(path))?.[1] || 'BugPilot';

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between px-6">
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-2">
        <button onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 h-8 px-3 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/20 transition-colors">
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">Search...</span>
          <kbd className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
        </button>

        <Button variant="ghost" size="icon" className="h-8 w-8 relative text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center ring-2 ring-background">3</span>
        </Button>

        <button className="flex items-center gap-2 h-8 pl-1.5 pr-2 rounded-lg hover:bg-card transition-colors">
          <div className="h-6 w-6 rounded-full gradient-brand flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary-foreground">SC</span>
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
