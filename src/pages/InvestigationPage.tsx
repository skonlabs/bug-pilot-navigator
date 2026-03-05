import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockIncidents, mockInvestigation, mockEvidence, mockHypotheses, mockFixes, mockChangeTimeline } from '@/data/mock-data';
import { SeverityBadge } from '@/components/bugpilot/SeverityBadge';
import { StatusBadge } from '@/components/bugpilot/StatusBadge';
import { ConfidenceBar } from '@/components/bugpilot/ConfidenceBar';
import { EvidenceItemCard } from '@/components/bugpilot/EvidenceItemCard';
import { HypothesisCard } from '@/components/bugpilot/HypothesisCard';
import { FixProposalCard } from '@/components/bugpilot/FixProposalCard';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, AlertTriangle, CheckCircle, Loader2, FileText,
  GitCommit, Settings2, Flag, Database, Layers, ExternalLink, Search, Pin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import type { InvestigationPhase, EvidenceType } from '@/types/bugpilot';

const phases: InvestigationPhase[] = ['classify', 'scope', 'evidence', 'topology', 'hypothesize', 'test', 'fix', 'packet'];

const EVIDENCE_TABS: { label: string; filter?: EvidenceType[] }[] = [
  { label: 'All' },
  { label: 'Logs', filter: ['log_event'] },
  { label: 'Metrics', filter: ['metric_anomaly'] },
  { label: 'Traces', filter: ['trace_span'] },
  { label: 'Deploys', filter: ['deploy_event'] },
  { label: 'Alerts', filter: ['alert'] },
];

const CHANGE_TYPE_ICONS: Record<string, React.ElementType> = {
  deploy: GitCommit,
  config: Settings2,
  flag: Flag,
  migration: Database,
  infra: Layers,
  rollback: ArrowLeft,
  manual: FileText,
};

const CHANGE_TYPE_COLORS: Record<string, string> = {
  deploy: 'text-primary bg-primary/10',
  config: 'text-amber-400 bg-amber-400/10',
  flag: 'text-emerald-400 bg-emerald-400/10',
  migration: 'text-severity-p1 bg-severity-p1/10',
  infra: 'text-blue-400 bg-blue-400/10',
  rollback: 'text-severity-p0 bg-severity-p0/10',
  manual: 'text-muted-foreground bg-secondary',
};

export default function InvestigationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const incident = mockIncidents.find(i => i.id === id) || mockIncidents[0];
  const investigation = mockInvestigation;
  const evidence = mockEvidence;
  const hypotheses = mockHypotheses;
  const fixes = mockFixes;

  const [activeTab, setActiveTab] = useState('All');
  const [evidenceSearch, setEvidenceSearch] = useState('');
  const [pinnedOnly, setPinnedOnly] = useState(false);

  const currentPhaseIdx = phases.indexOf(investigation.phase || 'classify');

  // Filter evidence for the affected services
  const relevantChanges = mockChangeTimeline.filter(c =>
    incident.affected_services.includes(c.service_name)
  );

  const filteredEvidence = useMemo(() => {
    let items = [...evidence].sort((a, b) =>
      new Date(b.event_timestamp).getTime() - new Date(a.event_timestamp).getTime()
    );
    const tab = EVIDENCE_TABS.find(t => t.label === activeTab);
    if (tab?.filter) {
      items = items.filter(item => tab.filter!.includes(item.evidence_type));
    }
    if (pinnedOnly) {
      items = items.filter(item => item.is_pinned);
    }
    if (evidenceSearch.trim()) {
      const q = evidenceSearch.toLowerCase();
      items = items.filter(item =>
        item.summary.toLowerCase().includes(q) ||
        item.service_name.toLowerCase().includes(q) ||
        item.source_system.toLowerCase().includes(q)
      );
    }
    return items;
  }, [evidence, activeTab, pinnedOnly, evidenceSearch]);

  const pinnedCount = evidence.filter(e => e.is_pinned).length;

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
            SLO ·{incident.error_budget_consumed}% burned · {incident.burn_rate}x burn
          </span>
        )}
        <div className="h-4 w-px bg-border mx-1" />
        <span className="text-sm text-foreground font-medium truncate max-w-xs">{incident.title}</span>
        {incident.slack_channel_name && (
          <span className="text-[11px] font-mono text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md border border-border/50">
            #{incident.slack_channel_name}
          </span>
        )}
        <div className="ml-auto flex gap-2">
          {incident.investigation_status === 'complete' && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" asChild>
              <Link to={`/incidents/${incident.id}/postmortem`}>
                <FileText className="h-3 w-3" /> Postmortem
              </Link>
            </Button>
          )}
          {incident.latest_packet_id && (
            <Button size="sm" className="h-7 text-xs gap-1.5 gradient-brand border-0 text-primary-foreground hover:opacity-90" asChild>
              <Link to={`/incidents/${incident.id}/packet`}>
                <FileText className="h-3 w-3" /> View Packet
              </Link>
            </Button>
          )}
        </div>
      </motion.div>

      {/* 3-Panel Layout */}
      <div className="flex min-h-[calc(100vh-8rem)]">
        {/* Left Panel - Scope & Recent Changes */}
        <div className="w-[260px] shrink-0 border-r border-border p-4 space-y-5 overflow-y-auto scrollbar-thin">
          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <h3 className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em] mb-2">Scope</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <SeverityBadge severity={incident.severity} />
                <StatusBadge status={incident.status} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground capitalize">{incident.environment}</span>
                <span className="text-[11px] text-muted-foreground">· {incident.source}</span>
              </div>
              {incident.customer_impact && (
                <p className="text-[11px] text-muted-foreground/70 italic leading-snug pl-0.5">{incident.customer_impact}</p>
              )}
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
                <Link
                  key={s}
                  to={`/topology?highlight=${encodeURIComponent(s)}`}
                  className="flex items-center gap-2 text-xs p-2 rounded-md bg-secondary/50 text-secondary-foreground hover:bg-surface-hover transition-colors cursor-pointer group"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-severity-p0 shrink-0" />
                  <span className="flex-1 truncate">{s}</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                </Link>
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
                  <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
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

          {/* Recent Changes Panel */}
          {relevantChanges.length > 0 && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <h3 className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em] mb-2">
                Recent Changes
                <span className="ml-1 font-normal normal-case text-muted-foreground">({relevantChanges.length})</span>
              </h3>
              <div className="space-y-2">
                {relevantChanges.map(change => {
                  const Icon = CHANGE_TYPE_ICONS[change.change_type] || GitCommit;
                  const colorClass = CHANGE_TYPE_COLORS[change.change_type] || 'text-muted-foreground bg-secondary';
                  return (
                    <div key={change.id} className="p-2.5 rounded-lg border border-border/50 bg-secondary/20 space-y-1.5 hover:bg-secondary/40 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className={cn('inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase', colorClass)}>
                          <Icon className="h-2.5 w-2.5" />
                          {change.change_type}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60 ml-auto shrink-0">
                          {formatDistanceToNow(new Date(change.occurred_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-foreground leading-tight">{change.title}</p>
                      <p className="text-[10px] text-muted-foreground/60 leading-tight">{change.service_name}</p>
                      {change.description && (
                        <p className="text-[10px] text-muted-foreground leading-snug">{change.description}</p>
                      )}
                      {change.source_ref && (
                        <a href={change.source_ref} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] text-primary hover:underline flex items-center gap-1">
                          View change <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {investigation.missing_signals.length > 0 && investigation.completeness_score < 0.85 && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
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
            {/* Evidence Header */}
            <div className="flex items-center justify-between mb-3 gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em]">
                  Evidence Timeline
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  {filteredEvidence.length}/{evidence.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPinnedOnly(p => !p)}
                  className={cn(
                    'flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-medium border transition-colors',
                    pinnedOnly
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'border-border/50 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Pin className="h-3 w-3" />
                  Pinned{pinnedCount > 0 ? ` (${pinnedCount})` : ''}
                </button>
              </div>
            </div>

            {/* Search + Tabs */}
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
                <input
                  value={evidenceSearch}
                  onChange={e => setEvidenceSearch(e.target.value)}
                  placeholder="Search evidence..."
                  className="w-full h-7 pl-7 pr-3 text-xs bg-secondary/50 border border-border/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
              <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-border/50">
                {EVIDENCE_TABS.map(tab => (
                  <button key={tab.label} onClick={() => setActiveTab(tab.label)} className={cn(
                    'px-2 py-1 text-[11px] rounded-md transition-all font-medium',
                    activeTab === tab.label ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-secondary-foreground'
                  )}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredEvidence.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No evidence matches your filter</p>
                <button onClick={() => { setActiveTab('All'); setEvidenceSearch(''); setPinnedOnly(false); }}
                  className="text-xs text-primary hover:underline mt-2">Clear filters</button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEvidence.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.03 }}>
                    <EvidenceItemCard item={item} onPin={() => {}} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Panel - Investigation Status, Hypotheses & Fixes */}
        <div className="w-[300px] shrink-0 border-l border-border p-4 space-y-5 overflow-y-auto scrollbar-thin">
          {/* Investigation Progress */}
          <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em]">Investigation</h3>
              {investigation.llm_model_used && (
                <span className="text-[9px] font-mono text-muted-foreground/50 bg-secondary px-1.5 py-0.5 rounded">
                  {investigation.llm_model_used}
                </span>
              )}
            </div>
            <div className="space-y-0">
              {phases.map((phase, i) => (
                <div key={phase} className="flex items-center gap-2.5 py-1.5">
                  {i < currentPhaseIdx ? (
                    <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
                  ) : i === currentPhaseIdx ? (
                    investigation.status === 'running'
                      ? <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                      : <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
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
                  {i === currentPhaseIdx && investigation.status === 'running' && (
                    <span className="text-[10px] text-primary/60 ml-auto">Running...</span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <ConfidenceBar confidence={investigation.overall_confidence} className="flex-1" />
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {Math.round(investigation.overall_confidence * 100)}% conf
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
                <span>Completeness: {Math.round(investigation.completeness_score * 100)}%</span>
                {investigation.cost_usd && <span>${investigation.cost_usd.toFixed(3)}</span>}
              </div>
            </div>
          </motion.div>

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

          {/* Navigation to Packet/Postmortem */}
          {(incident.latest_packet_id || incident.investigation_status === 'complete') && (
            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <div className="border-t border-border pt-4 space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em] mb-2">Outputs</p>
                {incident.latest_packet_id && (
                  <Link
                    to={`/incidents/${incident.id}/packet`}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors group"
                  >
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Resolution Packet</p>
                      <p className="text-[10px] text-muted-foreground">Full RCA with confidence scoring</p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground/40 ml-auto group-hover:text-primary transition-colors" />
                  </Link>
                )}
                {incident.investigation_status === 'complete' && (
                  <Link
                    to={`/incidents/${incident.id}/postmortem`}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors group"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Postmortem</p>
                      <p className="text-[10px] text-muted-foreground">Blameless review & action items</p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground/40 ml-auto group-hover:text-foreground transition-colors" />
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
