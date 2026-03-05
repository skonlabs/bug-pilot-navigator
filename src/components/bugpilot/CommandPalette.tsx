import { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { useNavigate } from 'react-router-dom';
import { mockIncidents, mockConnectors } from '@/data/mock-data';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from '@/components/ui/command';
import { AlertTriangle, Link2, Gauge, BarChart3, Plus } from 'lucide-react';

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const handleSelect = (path: string) => {
    navigate(path);
    setCommandPaletteOpen(false);
  };

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Search incidents, services, connectors..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => handleSelect('/incidents')}>
            <Plus className="mr-2 h-4 w-4" /> Declare Incident
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Active Incidents">
          {mockIncidents.filter(i => !['closed', 'resolved'].includes(i.status)).map(inc => (
            <CommandItem key={inc.id} onSelect={() => handleSelect(`/incidents/${inc.id}`)}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              <span className="font-mono text-xs mr-2">{inc.short_id}</span>
              {inc.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => handleSelect('/topology')}><Gauge className="mr-2 h-4 w-4" />Topology</CommandItem>
          <CommandItem onSelect={() => handleSelect('/readiness')}><BarChart3 className="mr-2 h-4 w-4" />Readiness</CommandItem>
          <CommandItem onSelect={() => handleSelect('/integrations')}><Link2 className="mr-2 h-4 w-4" />Integrations</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
