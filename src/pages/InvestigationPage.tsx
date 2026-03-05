import { useParams, useNavigate } from 'react-router-dom';
import { mockIncidents, mockInvestigation, mockEvidence, mockHypotheses, mockFixes } from '@/data/mock-data';
import { SeverityBadge } from '@/components/bugpilot/SeverityBadge';
import { StatusBadge } from '@/components/bugpilot/StatusBadge';
import { ConfidenceBar } from '@/components/bugpilot/ConfidenceBar';
import { EvidenceItemCard } from '@/components/bugpilot/EvidenceItemCard';
import { HypothesisCard } from '@/components/bugpilot/HypothesisCard';
import { FixProposalCard } from '@/components/bugpilot/FixProposalCard';
import { cn } from '@/lib/utils';
import { ArrowLeft, AlertTriangle, Users, CheckCircle, Loader2, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
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
    <div className="space-y-0 -m-6">
      {/* Incident Header */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-3 border-b border-border bg-surface-raised/50 backdrop-blur-sm flex items-center gap-3 flex-wrap sticky top-14 z-10"
      >
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => navigate('/incidents')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-mono text-xs font-bold text-foreground bg-secondary px-2 py-0.5 rounded">{incident.short_id}</span>
        <SeverityBadge severity={incident.severity} />
        <StatusBadge status={incident.status} />
        {incident.slo_violated && (
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-severity-p0/10 text-severity-p0 font-bold font-mono border border-severity-p0/20">
            SLO: {incident.error_budget_consumed}% burned
          </span>
        )}
        <div className="h-4 w-px bg-border mx-1" />
        <span className="text-sm text-foreground font-medium">{incident.title}</span>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
            <FileText className="h-3 w-3" /> View Packet
          </Button>
        </div>
      </motion.div>

      {/* 3-Panel Layout */}
      <div className="flex min-h-[calc(100vh-8rem)]">
        {/* Left Panel - Scope */}
        <div className="w-[260px] shrink-0 border-r border-border p-4 space-y-5 overflow-y-auto scrollbar-thin">
          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <h3 className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em] mb-2">Scope</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <SeverityBadge severity={incident.severity} />
                <StatusBadge status={incident.status} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground capitalize">{incident.environment}</span>
                <span className="text-[11px] text-muted-foreground">• {incident.source}</span>
              </div>
            </div>
          </motion.div>

          {incident.slo_violated && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <h3 className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em] mb-2">SLO Impact</h3>
              <div className="p-3 rounded-lg bg-severity-p0/5 border border-severity-p0/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Burn rate</span>
                  <span className={cn('text-sm font-mono font-bold', (incident.burn_rate || 0) > 5 ? 'text-severity-p0' : 'text-severity-p2')}>
                    {incident.burn_rate}x
                  </span>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-muted-foreground">Budget consumed</span>
                    <span className="text-[11px] font-mono text-severity-p0 font-bold">{incident.error_budget_consumed}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-severity-p0 progress-stripe" style={{ width: `${incident.error_budget_consumed}%` }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <h3 className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em] mb-2">Affected Services</h3>
            <div className="space-y-1">
              {incident.affected_services.map(s => (
                <div key={s} className="flex items-center gap-2 text-xs p-2 rounded-md bg-secondary/50 text-secondary-foreground hover:bg-surface-hover transition-colors cursor-pointer">
                  <div className="h-1.5 w-1.5 rounded-full bg-severity-p0" />
                  {s}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
            <h3 className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em] mb-2">On-Call</h3>
            <div className="space-y-2">
              {[
                { user: incident.ic, role: 'Incident Commander' },
                { user: incident.tl, role: 'Tech Lead' },
              ].filter(item => item.user).map(item => (
                <div key={item.role} className="flex items-center gap-2.5 p-2 rounded-md bg-secondary/30">
                  <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-primary">{item.user!.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <p className="text-xs text-foreground font-medium leading-tight">{item.user!.name}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{item.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {investigation.missing_signals.length > 0 && investigation.completeness_score < 0.85 && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <div className="rounded-lg border border-severity-p2/20 bg-severity-p2/5 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-severity-p2" />
                  <p className="text-[11px] font-medium text-severity-p2">
                    {investigation.missing_signals.length} missing signals
                  </p>
                </div>
                <ul className="space-y-1">
                  {investigation.missing_signals.map((s, i) => (
                    <li key={i} className="text-[10px] text-muted-foreground pl-2 border-l-2 border-severity-p2/20">{s}</li>
                  ))}
                </ul>
                <Button size="sm" variant="ghost" className="h-6 text-[10px] mt-2 text-severity-p2 hover:text-severity-p2 p-0" onClick={() => navigate('/integrations')}>
                  Fix in Integrations →
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Center Panel - Evidence Timeline */}
        <div className="flex-1 p-4 overflow-y-auto scrollbar-thin">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em]">
                Evidence Timeline
                <span className="ml-2 text-muted-foreground font-normal normal-case tracking-normal">
                  {evidence.length} items
                </span>
              </h3>
              <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-border/50">
                {['All', 'Logs', 'Metrics', 'Traces', 'Deploys', 'Alerts'].map(tab => (
                  <button key={tab} className={cn(
                    'px-2 py-1 text-[11px] rounded-md transition-all font-medium',
                    tab === 'All' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-secondary-foreground'
                  )}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {evidence.sort((a, b) => new Date(b.event_timestamp).getTime() - new Date(a.event_timestamp).getTime()).map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.04 }}>
                  <EvidenceItemCard item={item} onPin={() => {}} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Panel - Hypotheses & Fixes */}
        <div className="w-[300px] shrink-0 border-l border-border p-4 space-y-5 overflow-y-auto scrollbar-thin">
          {/* Investigation Progress */}
          {investigation.status === 'running' && (
            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <h3 className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em] mb-3">Investigation</h3>
              <div className="space-y-0">
                {phases.map((phase, i) => (
                  <div key={phase} className="flex items-center gap-2.5 py-1.5">
                    {i < currentPhaseIdx ? (
                      <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
                    ) : i === currentPhaseIdx ? (
                      <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border border-border shrink-0" />
                    )}
                    <span className={cn(
                      'text-xs capitalize',
                      i < currentPhaseIdx ? 'text-success' :
                      i === currentPhaseIdx ? 'text-primary font-medium' :
                      'text-muted-foreground/50'
                    )}>
                      {phase}
                    </span>
                    {i === currentPhaseIdx && (
                      <span className="text-[10px] text-primary/60 ml-auto">Running...</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <ConfidenceBar confidence={investigation.overall_confidence} className="flex-1" />
                <span className="text-[10px] text-muted-foreground">overall</span>
              </div>
            </motion.div>
          )}

          {/* Hypotheses */}
          <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <h3 className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em] mb-2">
              Hypotheses
              <span className="ml-1 text-muted-foreground font-normal">({hypotheses.length})</span>
            </h3>
            <div className="space-y-2">
              {hypotheses.map(h => <HypothesisCard key={h.id} hypothesis={h} />)}
            </div>
          </motion.div>

          {/* Fixes */}
          <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            {hypotheses[0] && hypotheses[0].confidence < 0.65 ? (
              <div className="rounded-lg border border-severity-p2/20 bg-severity-p2/5 p-3">
                <p className="text-xs text-severity-p2 font-medium mb-1">Fix generation locked</p>
                <p className="text-[11px] text-muted-foreground">
                  Confidence {Math.round(hypotheses[0].confidence * 100)}% — need ≥65% to generate fixes.
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em] mb-2">
                  Proposed Fixes
                  <span className="ml-1 text-muted-foreground font-normal">({fixes.length})</span>
                </h3>
                <div className="space-y-2">
                  {fixes.map(f => <FixProposalCard key={f.id} fix={f} />)}
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
