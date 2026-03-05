import { mockConnectors } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Clock, Link2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const statusConfig = {
  connected: { border: 'border-confidence-high/30', badge: 'bg-confidence-high/15 text-confidence-high', icon: CheckCircle, label: 'Connected' },
  error: { border: 'border-severity-p0/30', badge: 'bg-severity-p0/15 text-severity-p0', icon: AlertCircle, label: 'Error' },
  stale: { border: 'border-severity-p1/30', badge: 'bg-severity-p1/15 text-severity-p1', icon: Clock, label: 'Stale' },
  not_connected: { border: 'border-border', badge: 'bg-muted text-muted-foreground', icon: Link2, label: 'Not Connected' },
};

export default function IntegrationsPage() {
  const connected = mockConnectors.filter(c => c.status !== 'not_connected');
  const available = mockConnectors.filter(c => c.status === 'not_connected');

  return (
    <div className="space-y-8">
      {/* Connected */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-4">Connected ({connected.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connected.map(c => {
            const config = statusConfig[c.status];
            const StatusIcon = config.icon;
            return (
              <div key={c.id} className={cn('rounded-lg border-2 bg-card p-4 transition-colors', config.border)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-foreground">{c.name}</span>
                  </div>
                  <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', config.badge)}>
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{c.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {c.last_sync && <span>Last sync: {c.last_sync}</span>}
                  {c.items_synced && <span>{c.items_synced.toLocaleString()} items</span>}
                  {c.error_message && <span className="text-severity-p0">{c.error_message}</span>}
                </div>
                <div className="flex gap-2 mt-3">
                  {c.status === 'error' && <Button size="sm" variant="destructive" className="h-7 text-xs">Re-authenticate</Button>}
                  {c.status === 'stale' && <Button size="sm" className="h-7 text-xs">Force Sync</Button>}
                  <Button size="sm" variant="ghost" className="h-7 text-xs">Settings</Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Available */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-4">Available ({available.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {available.map(c => (
            <div key={c.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between mb-3">
                <span className="text-base font-semibold text-foreground">{c.name}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{c.category}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{c.description}</p>
              <Button size="sm" className="h-7 text-xs">Connect</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
