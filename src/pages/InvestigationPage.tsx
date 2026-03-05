import { useParams, useNavigate } from 'react-router-dom';
import { mockIncidents, mockInvestigation, mockEvidence, mockHypotheses, mockFixes } from '@/data/mock-data';
import { SeverityBadge } from '@/components/bugpilot/SeverityBadge';
import { StatusBadge } from '@/components/bugpilot/StatusBadge';
import { ConfidenceBar } from '@/components/bugpilot/ConfidenceBar';
import { EvidenceItemCard } from '@/components/bugpilot/EvidenceItemCard';
import { HypothesisCard } from '@/components/bugpilot/HypothesisCard';
import { FixProposalCard } from '@/components/bugpilot/FixProposalCard';
import { cn } from '@/lib/utils';
import { ArrowLeft, AlertTriangle, Users, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InvestigationPhase } from '@/types/bugpilot';

const phases: InvestigationPhase[] = ['classify', 'scope', 'evidence', 'topology', 'hypothesize', 'test', 'fix', 'packet'];

export default function InvestigationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const incident = mockIncidents.find(i => i.id === id) || mockIncidents[0];
  const investigation = mockInvestigation;
  const evidence = mockEvidence;
  const hypotheses = mockHypotheses;
  const fixes = mockFixes;

  const currentPhaseIdx = phases.indexOf(investigation.phase || 'classify');

  return (
    <div className="space-y-4 -m-6">
      {/* Incident Header Bar */}
      <div className="px-6 py-3 border-b border-border bg-surface-raised flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/incidents')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-mono text-sm font-bold text-foreground">{incident.short_id}</span>
        <SeverityBadge severity={incident.severity} />
        <StatusBadge status={incident.status} />
        {incident.slo_violated && (
          <span className="text-xs px-2 py-0.5 rounded bg-severity-p0/15 text-severity-p0 font-bold font-mono">
            SLO: {incident.error_budget_consumed}% burned ↗
          </span>
        )}
        <span className="text-sm text-foreground ml-2">{incident.title}</span>
      </div>

      {/* 3-Panel Layout */}
      <div className="flex gap-0 min-h-[calc(100vh-8rem)]">
        {/* Left Panel - Scope */}
        <div className="w-72 shrink-0 border-r border-border p-4 space-y-4 overflow-y-auto scrollbar-thin">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Incident Scope</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <SeverityBadge severity={incident.severity} />
                <StatusBadge status={incident.status} />
              </div>
              <p className="text-xs text-muted-foreground">{incident.environment}</p>
            </div>
          </div>

          {incident.slo_violated && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">SLO Impact</h3>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Burn rate</span>
                  <span className={cn('text-sm font-mono font-bold', (incident.burn_rate || 0) > 5 ? 'text-severity-p0' : 'text-severity-p2')}>
                    {incident.burn_rate}x
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Budget consumed</span>
                  <span className="text-sm font-mono text-severity-p0">{incident.error_budget_consumed}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-severity-p0 transition-all" style={{ width: `${incident.error_budget_consumed}%` }} />
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Affected Services</h3>
            <div className="space-y-1">
              {incident.affected_services.map(s => (
                <button key={s} className="block w-full text-left text-xs px-2 py-1.5 rounded bg-secondary text-secondary-foreground hover:bg-surface-hover transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">On-Call</h3>
            <div className="space-y-2">
              {incident.ic && (
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-foreground font-medium">{incident.ic.name}</p>
                    <p className="text-[10px] text-muted-foreground">Incident Commander</p>
                  </div>
                </div>
              )}
              {incident.tl && (
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-foreground font-medium">{incident.tl.name}</p>
                    <p className="text-[10px] text-muted-foreground">Tech Lead</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {investigation.missing_signals.length > 0 && investigation.completeness_score < 0.85 && (
            <div className="rounded-lg border border-severity-p2/30 bg-severity-p2/5 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-3.5 w-3.5 text-severity-p2" />
                <p className="text-xs font-medium text-severity-p2">Missing Signals</p>
              </div>
              <ul className="space-y-1">
                {investigation.missing_signals.map((s, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground">• {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Center Panel - Timeline & Evidence */}
        <div className="flex-1 p-4 overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Evidence Timeline</h3>
            <div className="flex items-center gap-1">
              {['All', 'Logs', 'Metrics', 'Traces', 'Deploys', 'Alerts'].map(tab => (
                <button key={tab} className={cn(
                  'px-2.5 py-1 text-xs rounded-md transition-colors',
                  tab === 'All' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-surface-hover'
                )}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {evidence.sort((a, b) => new Date(b.event_timestamp).getTime() - new Date(a.event_timestamp).getTime()).map(item => (
              <EvidenceItemCard key={item.id} item={item} onPin={() => {}} />
            ))}
          </div>
        </div>

        {/* Right Panel - Hypotheses & Fixes */}
        <div className="w-80 shrink-0 border-l border-border p-4 space-y-4 overflow-y-auto scrollbar-thin">
          {/* Investigation Progress */}
          {investigation.status === 'running' && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Investigation Progress</h3>
              <div className="space-y-1">
                {phases.map((phase, i) => (
                  <div key={phase} className="flex items-center gap-2">
                    {i < currentPhaseIdx ? (
                      <CheckCircle className="h-3.5 w-3.5 text-confidence-high shrink-0" />
                    ) : i === currentPhaseIdx ? (
                      <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border border-border shrink-0" />
                    )}
                    <span className={cn(
                      'text-xs capitalize',
                      i < currentPhaseIdx ? 'text-confidence-high' :
                      i === currentPhaseIdx ? 'text-primary font-medium' :
                      'text-muted-foreground'
                    )}>
                      {phase}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hypotheses */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Hypotheses</h3>
            <div className="space-y-2">
              {hypotheses.map(h => <HypothesisCard key={h.id} hypothesis={h} />)}
            </div>
          </div>

          {/* Fix Gating */}
          {hypotheses[0] && hypotheses[0].confidence < 0.65 ? (
            <div className="rounded-lg border border-severity-p2/30 bg-severity-p2/5 p-3">
              <p className="text-xs text-severity-p2 font-medium">Fix generation locked — confidence {Math.round(hypotheses[0].confidence * 100)}%. Need 65% minimum.</p>
            </div>
          ) : (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Proposed Fixes</h3>
              <div className="space-y-2">
                {fixes.map(f => <FixProposalCard key={f.id} fix={f} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
