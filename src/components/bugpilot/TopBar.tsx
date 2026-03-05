import { useAppStore } from '@/store/app-store';
import { useLocation } from 'react-router-dom';
import { Search, Bell, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
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
    <header className="h-14 border-b border-border bg-background/60 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-[15px] font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 h-8 px-3 rounded-lg bg-secondary/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">Search...</span>
          <kbd className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded border border-border/50">⌘K</kbd>
        </button>

        <Button variant="ghost" size="icon" className="h-8 w-8 relative text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-severity-p0 text-[9px] font-bold text-destructive-foreground flex items-center justify-center ring-2 ring-background">
            3
          </span>
        </Button>

        <button className="flex items-center gap-2 h-8 pl-1.5 pr-2 rounded-lg hover:bg-secondary/60 transition-colors">
          <div className="h-6 w-6 rounded-full gradient-brand flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary-foreground">SC</span>
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
