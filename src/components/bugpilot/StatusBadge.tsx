import { cn } from '@/lib/utils';
import type { IncidentStatus } from '@/types/bugpilot';

interface StatusConfig {
  label: string;
  classes: string;
  dot: string;
  pulse?: boolean;
  dotVariant?: 'static' | 'ping' | 'blink';
}

const statusConfig: Record<IncidentStatus, StatusConfig> = {
  detected: {
    label: 'Detected',
    classes: 'bg-status-detected/10 text-status-detected border-status-detected/30',
    dot: 'bg-status-detected',
    pulse: true,
    dotVariant: 'ping',
  },
  investigating: {
    label: 'Investigating',
    classes: 'bg-status-investigating/10 text-status-investigating border-status-investigating/30',
    dot: 'bg-status-investigating',
    pulse: true,
    dotVariant: 'blink',
  },
  identified: {
    label: 'Identified',
    classes: 'bg-status-identified/10 text-status-identified border-status-identified/30',
    dot: 'bg-status-identified',
    dotVariant: 'static',
  },
  mitigating: {
    label: 'Mitigating',
    classes: 'bg-status-mitigating/10 text-status-mitigating border-status-mitigating/30',
    dot: 'bg-status-mitigating',
    dotVariant: 'static',
  },
  resolved: {
    label: 'Resolved',
    classes: 'bg-status-resolved/10 text-status-resolved border-status-resolved/30',
    dot: 'bg-status-resolved',
    dotVariant: 'static',
  },
  postmortem: {
    label: 'Postmortem',
    classes: 'bg-status-postmortem/10 text-status-postmortem border-status-postmortem/20',
    dot: 'bg-status-postmortem',
    dotVariant: 'static',
  },
  closed: {
    label: 'Closed',
    classes: 'bg-status-closed/10 text-status-closed border-status-closed/20',
    dot: 'bg-status-closed',
    dotVariant: 'static',
  },
};

interface StatusBadgeProps {
  status: IncidentStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const cfg = statusConfig[status];

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded border font-medium',
      size === 'sm' ? 'text-[9px] px-1.5 py-px h-4' : 'text-[11px] px-2 py-0.5 h-5',
      cfg.classes,
      className
    )}>
      {cfg.dotVariant === 'ping' ? (
        <span className="relative flex shrink-0 h-1.5 w-1.5">
          <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-60', cfg.dot)} />
          <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', cfg.dot)} />
        </span>
      ) : cfg.dotVariant === 'blink' ? (
        <span className={cn(
          'h-1.5 w-1.5 rounded-full shrink-0 animate-pulse-dot',
          cfg.dot
        )} />
      ) : (
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', cfg.dot)} />
      )}
      {cfg.label}
    </span>
  );
}