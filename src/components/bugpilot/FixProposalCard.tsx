import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { FixProposal } from '@/types/bugpilot';
import {
  Undo2, Settings, FileCode, Flag, Database, Layers, BookOpen, Shield,
  CheckCircle, ChevronDown, ChevronUp, Copy, Check, ExternalLink,
  AlertTriangle, Clock, Server, Terminal, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

// ─── Icon map ──────────────────────────────────────────────────────────────────

const typeIcons: Record<FixProposal['fix_type'], React.ElementType> = {
  rollback: Undo2,
  config_change: Settings,
  code_fix: FileCode,
  flag_change: Flag,
  data_fix: Database,
  infra: Layers,
  runbook: BookOpen,
  gap_artifact: Shield,
};

// ─── Tier config ───────────────────────────────────────────────────────────────

const tierConfig: Record<1 | 2 | 3, {
  label: string;
  badge: string;
  badgeClass: string;
  ringClass: string;
  dotClass: string;
}> = {
  1: {
    label: 'Tier 1',
    badge: 'AUTO',
    badgeClass: 'bg-confidence-high/15 text-confidence-high border border-confidence-high/30',
    ringClass: 'border-confidence-high/30',
    dotClass: 'bg-confidence-high animate-pulse',
  },
  2: {
    label: 'Tier 2',
    badge: 'APPROVAL NEEDED',
    badgeClass: 'bg-warning/15 text-warning border border-warning/30',
    ringClass: 'border-warning/30',
    dotClass: 'bg-warning',
  },
  3: {
    label: 'Tier 3',
    badge: 'ADVISORY',
    badgeClass: 'bg-muted text-muted-foreground border border-border',
    ringClass: 'border-border',
    dotClass: 'bg-muted-foreground',
  },
};

// ─── Risk config ───────────────────────────────────────────────────────────────

const riskConfig: Record<FixProposal['risk'], {
  label: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
}> = {
  low: {
    label: 'Low Risk',
    textClass: 'text-confidence-high',
    bgClass: 'bg-confidence-high/10',
    borderClass: 'border-confidence-high/30',
  },
  medium: {
    label: 'Medium Risk',
    textClass: 'text-severity-p2',
    bgClass: 'bg-severity-p2/10',
    borderClass: 'border-severity-p2/30',
  },
  high: {
    label: 'High Risk',
    textClass: 'text-severity-p1',
    bgClass: 'bg-severity-p1/10',
    borderClass: 'border-severity-p1/30',
  },
  critical: {
    label: 'Critical Risk',
    textClass: 'text-severity-p0',
    bgClass: 'bg-severity-p0/10',
    borderClass: 'border-severity-p0/30',
  },
};

// ─── Diff line renderer ────────────────────────────────────────────────────────

function DiffPreview({ diff }: { diff: string }) {
  const lines = diff.split('\n');
  return (
    <div className="rounded-md overflow-hidden border border-border text-xs font-mono">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted border-b border-border">
        <FileCode className="h-3 w-3 text-muted-foreground" />
        <span className="text-muted-foreground text-[10px] uppercase tracking-wide font-medium">Diff Preview</span>
      </div>
      <div className="bg-[#0d1117] overflow-x-auto max-h-52 scrollbar-thin">
        {lines.map((line, i) => {
          const isAddition = line.startsWith('+') && !line.startsWith('+++');
          const isRemoval = line.startsWith('-') && !line.startsWith('---');
          const isHeader =
            line.startsWith('@@') ||
            line.startsWith('---') ||
            line.startsWith('+++') ||
            line.startsWith('#');
          return (
            <div
              key={i}
              className={cn(
                'px-3 py-0.5 leading-5 whitespace-pre',
                isAddition && 'bg-[#0d2818] text-[#3fb950]',
                isRemoval && 'bg-[#2d0e0e] text-[#f85149]',
                isHeader && 'text-[#8b949e]',
                !isAddition && !isRemoval && !isHeader && 'text-[#c9d1d9]',
              )}
            >
              {line || ' '}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Terminal block ────────────────────────────────────────────────────────────

function CommandBlock({ commands }: { commands: string[] }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(commands.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-md overflow-hidden border border-border text-xs font-mono">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground text-[10px] uppercase tracking-wide font-medium">Commands</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-confidence-high" /> : <Copy className="h-3 w-3" />}
          <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <div className="bg-[#0d1117] p-3 space-y-1 overflow-x-auto">
        {commands.map((cmd, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-[#6e7681] select-none shrink-0">$</span>
            <span className="text-[#c9d1d9] whitespace-pre">{cmd}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Validation criteria table ─────────────────────────────────────────────────

function ValidationTable({ criteria }: { criteria: NonNullable<FixProposal['validation_criteria']> }) {
  return (
    <div className="rounded-md border border-border overflow-hidden text-xs">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted border-b border-border">
        <CheckCircle className="h-3 w-3 text-muted-foreground" />
        <span className="text-muted-foreground text-[10px] uppercase tracking-wide font-medium">Validation Criteria</span>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground font-medium w-1/3">Check</th>
            <th className="text-left px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Query</th>
            <th className="text-left px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground font-medium w-24">Threshold</th>
          </tr>
        </thead>
        <tbody>
          {criteria.map((c, i) => (
            <tr key={i} className={cn('border-b border-border last:border-0', i % 2 === 1 && 'bg-muted/30')}>
              <td className="px-3 py-2 font-medium text-foreground align-top">{c.check}</td>
              <td className="px-3 py-2 font-mono text-muted-foreground text-[10px] align-top break-all">{c.query ?? '—'}</td>
              <td className="px-3 py-2 font-mono text-confidence-high align-top">{c.success_threshold ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export interface FixProposalCardProps {
  fix: FixProposal;
  onApprove?: () => void;
  onReject?: () => void;
  showContext?: boolean;
}

export function FixProposalCard({ fix, onApprove, onReject, showContext = false }: FixProposalCardProps) {
  const [expanded, setExpanded] = useState(false);

  const tier = tierConfig[fix.tier];
  const risk = riskConfig[fix.risk];
  const Icon = typeIcons[fix.fix_type] ?? CheckCircle;

  const hasBody =
    !!fix.diff_preview ||
    (fix.commands && fix.commands.length > 0) ||
    (fix.rollback_steps && fix.rollback_steps.length > 0) ||
    (fix.validation_criteria && fix.validation_criteria.length > 0);

  const isProposedTier2 = fix.tier === 2 && fix.status === 'proposed';
  const isExecuting = fix.status === 'executing';
  const isExecuted = fix.status === 'executed';
  const isFailed = fix.status === 'failed';
  const isRolledBack = fix.status === 'rolled_back';

  return (
    <div
      className={cn(
        'rounded-lg border bg-card transition-all duration-200',
        tier.ringClass,
      )}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="p-3">
        <div className="flex items-start gap-2.5">
          {/* Icon */}
          <div className={cn('mt-0.5 h-8 w-8 rounded-md flex items-center justify-center shrink-0', risk.bgClass)}>
            <Icon className={cn('h-4 w-4', risk.textClass)} />
          </div>

          {/* Title + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-1.5 mb-1.5">
              <p className="text-sm font-semibold text-foreground leading-snug flex-1 min-w-0">{fix.title}</p>
            </div>

            {/* Tier + Risk + Meta row */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Tier badge — prominently shown */}
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                  tier.badgeClass,
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', tier.dotClass)} />
                {tier.label} · {tier.badge}
              </span>

              {/* Risk badge */}
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold border',
                  risk.bgClass,
                  risk.textClass,
                  risk.borderClass,
                )}
              >
                <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                {risk.label}
              </span>

              {/* Estimated time */}
              {fix.estimated_time && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5 shrink-0" />
                  {fix.estimated_time_mins != null ? `Est. ~${fix.estimated_time_mins} min` : fix.estimated_time}
                </span>
              )}

              {/* Affected service */}
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Server className="h-2.5 w-2.5 shrink-0" />
                {fix.affected_service}
              </span>
            </div>

            {/* Short description (always visible) */}
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{fix.description}</p>
          </div>

          {/* Expand toggle */}
          {hasBody && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="mt-0.5 p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Execution status bar */}
        {isExecuting && (
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3 text-primary" />
                Executing…
              </span>
              <span className="text-primary font-medium animate-pulse">In progress</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full animate-[progress_2s_ease-in-out_infinite]"
                style={{ width: '60%' }}
              />
            </div>
          </div>
        )}

        {isExecuted && fix.executed_at && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-confidence-high">
            <CheckCircle className="h-3 w-3 shrink-0" />
            <span>Executed {format(new Date(fix.executed_at), 'MMM d, HH:mm')}</span>
            {fix.approved_by && (
              <span className="text-muted-foreground">· approved by {fix.approved_by}</span>
            )}
          </div>
        )}

        {isFailed && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-severity-p0">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            <span>Execution failed</span>
          </div>
        )}

        {isRolledBack && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-severity-p1">
            <Undo2 className="h-3 w-3 shrink-0" />
            <span>Rolled back</span>
          </div>
        )}
      </div>

      {/* ── Expanded body ────────────────────────────────────────────────────── */}
      {expanded && hasBody && (
        <div className="border-t border-border p-3 space-y-3">
          {/* Diff preview */}
          {fix.diff_preview && <DiffPreview diff={fix.diff_preview} />}

          {/* Commands */}
          {fix.commands && fix.commands.length > 0 && (
            <CommandBlock commands={fix.commands} />
          )}

          {/* Rollback steps */}
          {fix.rollback_steps && fix.rollback_steps.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground">Rollback Steps</p>
              <ol className="space-y-1">
                {fix.rollback_steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                    <span className="shrink-0 h-4 w-4 rounded-full bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Validation criteria */}
          {fix.validation_criteria && fix.validation_criteria.length > 0 && (
            <ValidationTable criteria={fix.validation_criteria} />
          )}

          {/* PR link */}
          {fix.pr_url && (
            <a
              href={fix.pr_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              View PR
            </a>
          )}
        </div>
      )}

      {/* ── Footer actions ───────────────────────────────────────────────────── */}
      <div className="border-t border-border px-3 py-2 flex items-center gap-2 bg-muted/20 rounded-b-lg">
        {/* Tier 2 proposed: Approve + Reject */}
        {isProposedTier2 && (
          <>
            <Button size="sm" onClick={onApprove} className="h-8 text-xs px-3">
              Approve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onReject}
              className="h-7 text-xs px-3 text-muted-foreground"
            >
              Reject
            </Button>
          </>
        )}

        {/* Tier 1: View Execution Log */}
        {fix.tier === 1 && (
          <Button size="sm" variant="outline" className="h-8 text-xs px-3">
            <Terminal className="h-3 w-3 mr-1" />
            View Execution Log
          </Button>
        )}

        {/* Tier 3: View Instructions */}
        {fix.tier === 3 && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs px-3"
            onClick={() => setExpanded(true)}
          >
            <BookOpen className="h-3 w-3 mr-1" />
            View Instructions
          </Button>
        )}

        {/* Always: View Full Details link */}
        <button className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          View Full Details
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
