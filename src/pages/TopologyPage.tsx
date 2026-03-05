import { mockServices } from '@/data/mock-data';
import { cn } from '@/lib/utils';

const healthColors = {
  healthy: 'bg-confidence-high',
  degraded: 'bg-severity-p2',
  incident: 'bg-severity-p0',
  unknown: 'bg-muted-foreground',
};

const healthBg = {
  healthy: 'border-confidence-high/20',
  degraded: 'border-severity-p2/20',
  incident: 'border-severity-p0/20 animate-glow',
  unknown: 'border-border',
};

export default function TopologyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {(['healthy', 'degraded', 'incident', 'unknown'] as const).map(h => (
            <div key={h} className="flex items-center gap-1.5">
              <div className={cn('h-2.5 w-2.5 rounded-full', healthColors[h])} />
              <span className="text-xs text-muted-foreground capitalize">{h}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Simple topology grid visualization */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {mockServices.map(service => (
          <div key={service.id} className={cn(
            'rounded-lg border-2 bg-card p-4 transition-all hover:scale-105 cursor-pointer',
            healthBg[service.health]
          )}>
            <div className="flex items-center gap-2 mb-3">
              <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', healthColors[service.health])} />
              <span className="text-sm font-medium text-foreground truncate">{service.name}</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Team</span>
                <span className="text-secondary-foreground">{service.team}</span>
              </div>
              <div className="flex justify-between text-xs">
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
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Readiness</span>
                <span className={cn(
                  'font-mono font-medium',
                  service.readiness_score >= 80 ? 'text-confidence-high' :
                  service.readiness_score >= 50 ? 'text-severity-p2' :
                  'text-severity-p0'
                )}>
                  {service.readiness_score}%
                </span>
              </div>
              {service.active_incidents > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Active</span>
                  <span className="text-severity-p0 font-bold">{service.active_incidents} incident{service.active_incidents > 1 ? 's' : ''}</span>
                </div>
              )}
              {service.last_deploy && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Last deploy</span>
                  <span className="text-muted-foreground font-mono">{service.last_deploy}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
