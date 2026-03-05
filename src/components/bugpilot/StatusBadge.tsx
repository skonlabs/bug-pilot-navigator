import { cn } from '@/lib/utils';
import type { IncidentStatus } from '@/types/bugpilot';

const statusConfig: Record<IncidentStatus, { bg: string; text: string; label: string; pulse?: boolean }> = {
  detected: { bg: 'bg-status-detected', text: 'text-destructive-foreground', label: 'Detected', pulse: true },
  investigating: { bg: 'bg-status-investigating', text: 'text-destructive-foreground', label: 'Investigating', pulse: true },
  identified: { bg: 'bg-status-identified/15', text: 'text-status-identified', label: 'Identified' },
  mitigating: { bg: 'bg-status-mitigating/15', text: 'text-status-mitigating', label: 'Mitigating' },
  resolved: { bg: 'bg-status-resolved/15', text: 'text-status-resolved', label: 'Resolved' },
  postmortem: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Postmortem' },
  closed: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Closed' },
};

export function StatusBadge({ status, className }: { status: IncidentStatus; className?: string }) {
  const config = statusConfig[status];
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium',
      config.bg, config.text, className
    )}>
      {config.pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {config.label}
    </span>
  );
}
