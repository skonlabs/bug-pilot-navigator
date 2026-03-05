import { cn } from '@/lib/utils';
import type { Severity } from '@/types/bugpilot';

const config: Record<Severity, { label: string; classes: string; dot: string }> = {
  P0: {
    label: 'P0',
    classes: 'bg-severity-p0/10 text-severity-p0 border-severity-p0/30',
    dot: 'bg-severity-p0',
  },
  P1: {
    label: 'P1',
    classes: 'bg-severity-p1/10 text-severity-p1 border-severity-p1/30',
    dot: 'bg-severity-p1',
  },
  P2: {
    label: 'P2',
    classes: 'bg-severity-p2/10 text-severity-p2 border-severity-p2/30',
    dot: 'bg-severity-p2',
  },
  P3: {
    label: 'P3',
    classes: 'bg-severity-p3/10 text-severity-p3 border-severity-p3/30',
    dot: 'bg-severity-p3',
  },
};

interface SeverityBadgeProps {
  severity: Severity | string;
  size?: 'sm' | 'md';
  showDot?: boolean;
  pulse?: boolean;
  className?: string;
}

export function SeverityBadge({ severity, size = 'md', showDot = true, pulse = false, className }: SeverityBadgeProps) {
  const cfg = config[severity as Severity] || config.P3;

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded border font-mono font-bold uppercase tracking-wide',
      size === 'sm' ? 'text-[9px] px-1 py-px h-4' : 'text-[10px] px-1.5 py-0.5 h-5',
      cfg.classes,
      className
    )}>
      {showDot && (
        <span className={cn(
          'rounded-full shrink-0',
          size === 'sm' ? 'h-1 w-1' : 'h-1.5 w-1.5',
          cfg.dot,
          pulse && 'animate-pulse'
        )} />
      )}
      {cfg.label}
    </span>
  );
}
