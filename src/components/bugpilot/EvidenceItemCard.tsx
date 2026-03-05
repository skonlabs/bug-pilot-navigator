import { cn } from '@/lib/utils';
import type { EvidenceItem } from '@/types/bugpilot';
import { FileText, BarChart3, Waypoints, Rocket, Settings, Flag, Bell, Users, Pin } from 'lucide-react';

const typeIcons: Record<string, { icon: React.ElementType; color: string }> = {
  log_event: { icon: FileText, color: 'text-muted-foreground' },
  metric_anomaly: { icon: BarChart3, color: 'text-status-investigating' },
  trace_span: { icon: Waypoints, color: 'text-status-identified' },
  deploy_event: { icon: Rocket, color: 'text-status-resolved' },
  config_change: { icon: Settings, color: 'text-status-mitigating' },
  flag_change: { icon: Flag, color: 'text-severity-p2' },
  alert: { icon: Bell, color: 'text-severity-p0' },
  on_call_event: { icon: Users, color: 'text-primary' },
};

interface EvidenceItemCardProps {
  item: EvidenceItem;
  onPin?: () => void;
}

export function EvidenceItemCard({ item, onPin }: EvidenceItemCardProps) {
  const typeConfig = typeIcons[item.evidence_type] || typeIcons.log_event;
  const Icon = typeConfig.icon;

  const timeAgo = getTimeAgo(new Date(item.event_timestamp));

  return (
    <div className={cn(
      'group relative p-3 rounded-lg border transition-colors cursor-pointer',
      item.is_pinned 
        ? 'border-l-[3px] border-l-primary bg-primary/5 border-t-border border-r-border border-b-border' 
        : 'border-border hover:bg-surface-hover'
    )}>
      <div className="flex items-start gap-2">
        <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', typeConfig.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-mono text-muted-foreground">{timeAgo}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{item.source_system}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{item.service_name}</span>
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded italic',
              item.inference_method === 'llm_inference' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}>
              {item.inference_method === 'llm_inference' ? 'LLM' : 'Parsed'}
            </span>
          </div>
          <p className="text-sm text-foreground line-clamp-2">{item.summary}</p>
        </div>
        {onPin && (
          <button
            onClick={(e) => { e.stopPropagation(); onPin(); }}
            className={cn(
              'shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
              item.is_pinned ? 'opacity-100 text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Pin className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
