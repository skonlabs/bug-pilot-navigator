import { useAppStore } from '@/store/app-store';
import { useLocation } from 'react-router-dom';
import { Search, Bell, User } from 'lucide-react';
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
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between px-6">
      <h1 className="text-base font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 text-muted-foreground"
          onClick={() => setCommandPaletteOpen(true)}
        >
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">Search</span>
          <kbd className="pointer-events-none text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-severity-p0 text-[9px] font-bold text-destructive-foreground flex items-center justify-center">
            3
          </span>
        </Button>

        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
      </div>
    </header>
  );
}
