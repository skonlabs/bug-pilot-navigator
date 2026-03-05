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
    classes: 'bg-red-500/10 text-red-400 border-red-500/30',
    dot: 'bg-red-500',
    pulse: true,
    dotVariant: 'ping',
  },
  investigating: {
    label: 'Investigating',
    classes: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    dot: 'bg-cyan-400',
    pulse: true,
    dotVariant: 'blink',
  },
  identified: {
    label: 'Identified',
    classes: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    dot: 'bg-violet-400',
    dotVariant: 'static',
  },
  mitigating: {
    label: 'Mitigating',
    classes: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
    dotVariant: 'static',
  },
  resolved: {
    label: 'Resolved',
    classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
    dotVariant: 'static',
  },
  postmortem: {
    label: 'Postmortem',
    classes: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    dot: 'bg-slate-400',
    dotVariant: 'static',
  },
  closed: {
    label: 'Closed',
    classes: 'bg-slate-800/60 text-slate-500 border-slate-700/30',
    dot: 'bg-slate-600',
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
