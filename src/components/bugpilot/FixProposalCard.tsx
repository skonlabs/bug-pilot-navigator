import { cn } from '@/lib/utils';
import type { FixProposal } from '@/types/bugpilot';
import { Undo2, Settings, FileCode, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const tierConfig = {
  1: { label: 'Auto-executes', className: 'bg-confidence-high/15 text-confidence-high' },
  2: { label: 'Approve to run', className: 'bg-primary/15 text-primary' },
  3: { label: 'Manual', className: 'bg-muted text-muted-foreground' },
};

const riskConfig = {
  low: { label: 'Low risk', className: 'text-confidence-high' },
  medium: { label: 'Medium risk', className: 'text-severity-p2' },
  high: { label: 'High risk', className: 'text-severity-p1' },
  critical: { label: 'Critical risk', className: 'text-severity-p0' },
};

const typeIcons: Record<string, React.ElementType> = {
  rollback: Undo2, config_change: Settings, code_fix: FileCode,
  gap_artifact: Shield, default: CheckCircle,
};

export function FixProposalCard({ fix, onApprove, onReject }: { 
  fix: FixProposal; onApprove?: () => void; onReject?: () => void 
}) {
  const tier = tierConfig[fix.tier];
  const risk = riskConfig[fix.risk];
  const Icon = typeIcons[fix.fix_type] || typeIcons.default;

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-start gap-2">
        <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{fix.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{fix.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', tier.className)}>{tier.label}</span>
        <span className={cn('text-xs font-medium', risk.className)}>
          <AlertTriangle className="h-3 w-3 inline mr-0.5" />{risk.label}
        </span>
        <span className="text-xs text-muted-foreground">{fix.estimated_time}</span>
      </div>

      {fix.diff_preview && (
        <pre className="text-xs font-mono p-2 rounded bg-muted overflow-x-auto scrollbar-thin max-h-32">
          {fix.diff_preview}
        </pre>
      )}

      {fix.tier === 2 && fix.status === 'proposed' && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={onApprove} className="h-7 text-xs">Approve</Button>
          <Button size="sm" variant="ghost" onClick={onReject} className="h-7 text-xs">Reject</Button>
        </div>
      )}
    </div>
  );
}
