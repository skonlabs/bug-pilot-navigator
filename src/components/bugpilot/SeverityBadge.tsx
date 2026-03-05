import { cn } from '@/lib/utils';
import type { Severity } from '@/types/bugpilot';

const config: Record<Severity, { label: string; classes: string; dot: string }> = {
  P0: {
    label: 'P0',
    classes: 'bg-red-500/10 text-red-400 border-red-500/30',
    dot: 'bg-red-500',
  },
  P1: {
    label: 'P1',
    classes: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-500',
  },
  P2: {
    label: 'P2',
    classes: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    dot: 'bg-yellow-400',
  },
  P3: {
    label: 'P3',
    classes: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    dot: 'bg-blue-400',
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
