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
    <header className="h-12 border-b border-border bg-background/60 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between px-5">
      <h1 className="text-[13px] font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-1.5">
        <button onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 h-7 px-2.5 rounded-md bg-secondary/50 border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/20 transition-colors">
          <Search className="h-3 w-3" />
          <span className="text-[11px]">Search...</span>
          <kbd className="text-[9px] font-mono bg-muted px-1 py-0.5 rounded border border-border ml-2">⌘K</kbd>
        </button>

        <Button variant="ghost" size="icon" className="h-7 w-7 relative text-muted-foreground hover:text-foreground">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground flex items-center justify-center ring-2 ring-background">3</span>
        </Button>

        <button className="flex items-center gap-1.5 h-7 pl-1 pr-1.5 rounded-md hover:bg-secondary/50 transition-colors">
          <div className="h-5 w-5 rounded-full gradient-brand flex items-center justify-center">
            <span className="text-[9px] font-bold text-primary-foreground">SC</span>
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
