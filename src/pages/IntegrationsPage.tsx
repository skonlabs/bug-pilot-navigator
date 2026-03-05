import { mockConnectors } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, AlertCircle, Clock, Link2, Search, ArrowRight, ExternalLink, Zap } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

const statusConfig = {
  connected: { border: 'border-success/20', badge: 'bg-success/10 text-success', icon: CheckCircle, label: 'Healthy' },
  error: { border: 'border-severity-p0/20', badge: 'bg-severity-p0/10 text-severity-p0', icon: AlertCircle, label: 'Error' },
  stale: { border: 'border-severity-p1/20', badge: 'bg-severity-p1/10 text-severity-p1', icon: Clock, label: 'Stale' },
  not_connected: { border: 'border-border', badge: '', icon: Link2, label: '' },
};

export default function IntegrationsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const categories = ['all', ...new Set(mockConnectors.map(c => c.category))];
  const connected = mockConnectors.filter(c => c.status !== 'not_connected');
  const available = mockConnectors.filter(c => c.status === 'not_connected');

  const filteredAvailable = available.filter(c => {
    if (category !== 'all' && c.category !== category) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Connected */}
      {connected.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-1">Connected Sources</h2>
          <p className="text-xs text-muted-foreground mb-4">These data sources are actively syncing with BugPilot.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {connected.map((c, i) => {
              const config = statusConfig[c.status];
              const StatusIcon = config.icon;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn('rounded-xl border bg-card p-4 transition-all hover:shadow-lg hover:shadow-primary/5', config.border)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-foreground">{c.name}</span>
                        <p className="text-[10px] text-muted-foreground">{c.category}</p>
                      </div>
                    </div>
                    <span className={cn('inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium', config.badge)}>
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </span>
                  </div>

                  {c.status === 'error' && c.error_message && (
                    <div className="mb-3 p-2 rounded-md bg-severity-p0/5 border border-severity-p0/10">
                      <p className="text-[11px] text-severity-p0">{c.error_message}</p>
                    </div>
                  )}

                  {c.status === 'stale' && (
                    <div className="mb-3 p-2 rounded-md bg-severity-p1/5 border border-severity-p1/10">
                      <p className="text-[11px] text-severity-p1">Last sync {c.last_sync}. Data may be outdated.</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-3">
                    {c.last_sync && c.status !== 'stale' && <span>Synced {c.last_sync}</span>}
                    {c.items_synced && <span>{c.items_synced.toLocaleString()} items</span>}
                  </div>

                  <div className="flex gap-2">
                    {c.status === 'error' && <Button size="sm" className="h-7 text-xs gradient-brand border-0 text-primary-foreground">Re-authenticate</Button>}
                    {c.status === 'stale' && <Button size="sm" className="h-7 text-xs">Force Sync</Button>}
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground">Configure</Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-1">Available Integrations</h2>
        <p className="text-xs text-muted-foreground mb-4">Connect additional data sources to improve investigation quality.</p>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search integrations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 bg-secondary/50 border-border text-sm" />
          </div>
          <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-border/50 overflow-x-auto">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-md transition-all font-medium capitalize whitespace-nowrap',
                  category === cat ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-secondary-foreground'
                )}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAvailable.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all group"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Link2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-foreground">{c.name}</span>
                  <p className="text-[10px] text-muted-foreground">{c.category}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{c.description}</p>
              <Button size="sm" className="w-full h-8 text-xs gap-1.5 gradient-brand border-0 text-primary-foreground hover:opacity-90">
                Connect <ArrowRight className="h-3 w-3" />
              </Button>
            </motion.div>
          ))}
        </div>

        {filteredAvailable.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No integrations match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
