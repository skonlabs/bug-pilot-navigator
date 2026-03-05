import { cn } from '@/lib/utils';
import type { Severity } from '@/types/bugpilot';

const severityConfig: Record<Severity, { bg: string; text: string; border: string }> = {
  P0: { bg: 'bg-severity-p0/15', text: 'text-severity-p0', border: 'border-severity-p0/30' },
  P1: { bg: 'bg-severity-p1/15', text: 'text-severity-p1', border: 'border-severity-p1/30' },
  P2: { bg: 'bg-severity-p2/15', text: 'text-severity-p2', border: 'border-severity-p2/30' },
  P3: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const config = severityConfig[severity];
  return (
    <span className={cn(
      'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wide',
      config.bg, config.text, config.border, className
    )}>
      {severity}
    </span>
  );
}
