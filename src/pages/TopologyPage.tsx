import { mockServices } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';

const healthColors = {
  healthy: 'bg-success',
  degraded: 'bg-severity-p2',
  incident: 'bg-severity-p0',
  unknown: 'bg-muted-foreground',
};

const healthBg = {
  healthy: 'border-success/10 hover:border-success/30',
  degraded: 'border-severity-p2/10 hover:border-severity-p2/30',
  incident: 'border-severity-p0/10 hover:border-severity-p0/30',
  unknown: 'border-border hover:border-border',
};

export default function TopologyPage() {
  const [search, setSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState<string>('all');

  const filtered = mockServices.filter(s => {
    if (healthFilter !== 'all' && s.health !== healthFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 bg-secondary/50 border-border text-sm" />
        </div>
        <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-border/50">
          {['all', 'healthy', 'degraded', 'incident', 'unknown'].map(h => (
            <button key={h} onClick={() => setHealthFilter(h)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all font-medium capitalize',
                healthFilter === h ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-secondary-foreground'
              )}>
              {h !== 'all' && <div className={cn('h-1.5 w-1.5 rounded-full', healthColors[h as keyof typeof healthColors])} />}
              {h}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map((service, i) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className={cn(
              'rounded-xl border bg-card p-4 transition-all cursor-pointer hover:shadow-lg hover:shadow-primary/5',
              healthBg[service.health]
            )}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={cn('h-2 w-2 rounded-full shrink-0', healthColors[service.health],
                service.health === 'incident' && 'animate-pulse-dot'
              )} />
              <span className="text-sm font-semibold text-foreground truncate">{service.name}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Team</span>
                <span className="text-secondary-foreground">{service.team}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Criticality</span>
                <span className={cn(
                  'capitalize font-medium',
                  service.criticality === 'critical' ? 'text-severity-p0' :
                  service.criticality === 'high' ? 'text-severity-p1' :
                  'text-muted-foreground'
                )}>
                  {service.criticality}
                </span>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-muted-foreground">Readiness</span>
                  <span className={cn(
                    'font-mono font-medium',
                    service.readiness_score >= 80 ? 'text-success' :
                    service.readiness_score >= 50 ? 'text-severity-p2' :
                    'text-severity-p0'
                  )}>
                    {service.readiness_score}%
                  </span>
                </div>
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all',
                    service.readiness_score >= 80 ? 'bg-success' :
                    service.readiness_score >= 50 ? 'bg-severity-p2' :
                    'bg-severity-p0'
                  )} style={{ width: `${service.readiness_score}%` }} />
                </div>
              </div>
              {service.active_incidents > 0 && (
                <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-severity-p0/5 border border-severity-p0/10">
                  <div className="h-1.5 w-1.5 rounded-full bg-severity-p0 animate-pulse-dot" />
                  <span className="text-[10px] text-severity-p0 font-medium">{service.active_incidents} active incident{service.active_incidents > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-sm font-medium text-foreground mb-1">No services match your filters</p>
          <p className="text-xs">Try a different search term or filter</p>
        </div>
      )}
    </div>
  );
}
