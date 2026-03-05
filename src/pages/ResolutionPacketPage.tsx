import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockIncidents, mockResolutionPacket, mockHypotheses } from '@/data/mock-data';
import { SeverityBadge } from '@/components/bugpilot/SeverityBadge';
import { ConfidenceBar } from '@/components/bugpilot/ConfidenceBar';
import { HypothesisCard } from '@/components/bugpilot/HypothesisCard';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Download, Share2, CheckCircle2, AlertTriangle, XCircle,
  Clock, Shield, Zap, FileText, ChevronRight, ExternalLink, Info,
  GitBranch, Settings, Activity, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { format } from 'date-fns';

const SectionHeader = ({ icon: Icon, title, badge }: { icon: React.ElementType; title: string; badge?: string }) => (
  <div className="flex items-center gap-2.5 mb-4">
    <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
      <Icon className="h-3.5 w-3.5 text-primary" />
    </div>
    <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    {badge && <Badge variant="secondary" className="text-[10px]">{badge}</Badge>}
    <div className="flex-1 h-px bg-border ml-2" />
  </div>
);

const RiskBadge = ({ risk }: { risk: string }) => {
  const colors: Record<string, string> = {
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wide', colors[risk] || colors.low)}>
      {risk} risk
    </span>
  );
};

const TierBadge = ({ tier }: { tier: number }) => {
  const config = {
    1: { label: 'Auto-executes', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    2: { label: 'Approve to run', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    3: { label: 'Manual', className: 'bg-secondary text-muted-foreground border-border' },
  }[tier] || { label: 'Unknown', className: '' };
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', config.className)}>
      Tier {tier} · {config.label}
    </span>
  );
};

const EventTypeIcon = ({ type }: { type: string }) => {
  const icons: Record<string, { icon: React.ElementType; color: string }> = {
    deploy: { icon: GitBranch, color: 'text-emerald-400' },
    config: { icon: Settings, color: 'text-amber-400' },
    alert: { icon: AlertCircle, color: 'text-red-400' },
    metric: { icon: Activity, color: 'text-blue-400' },
    on_call: { icon: Shield, color: 'text-purple-400' },
    status_change: { icon: CheckCircle2, color: 'text-primary' },
    flag: { icon: Zap, color: 'text-yellow-400' },
  };
  const { icon: Icon, color } = icons[type] || { icon: Info, color: 'text-muted-foreground' };
  return <Icon className={cn('h-3.5 w-3.5 shrink-0', color)} />;
};

export default function ResolutionPacketPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const incident = mockIncidents.find(i => i.id === id) || mockIncidents[0];
  const packet = mockResolutionPacket;
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary', 'scope', 'timeline', 'hypotheses', 'conclusion', 'mitigation', 'gaps']));

  const toggleSection = (s: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  };

  const confidenceColor = packet.overall_confidence >= 0.85 ? 'text-emerald-400' :
    packet.overall_confidence >= 0.65 ? 'text-blue-400' :
    packet.overall_confidence >= 0.40 ? 'text-amber-400' : 'text-muted-foreground';

  return (
    <div className="space-y-0 -m-6">
      {/* Sticky Header */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-3 border-b border-border bg-background/80 backdrop-blur-sm flex items-center gap-3 sticky top-14 z-10"
      >
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/incidents/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Resolution Packet</span>
          <span className="text-muted-foreground text-sm">·</span>
          <span className="font-mono text-xs bg-secondary px-2 py-0.5 rounded">{incident.short_id}</span>
          <SeverityBadge severity={incident.severity} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>v{packet.version}</span>
            <span>·</span>
            <span>Generated {format(new Date(packet.created_at), 'MMM d, HH:mm')} UTC</span>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
            <Download className="h-3 w-3" /> Export PDF
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
            <Share2 className="h-3 w-3" /> Share
          </Button>
        </div>
      </motion.div>

      {/* Packet Metadata Bar */}
      <div className="px-6 py-2.5 border-b border-border bg-surface-raised/30 flex items-center gap-6 flex-wrap text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="text-foreground font-medium">Confidence:</span>
          <span className={cn('font-mono font-bold', confidenceColor)}>{Math.round(packet.overall_confidence * 100)}%</span>
          <span className="text-muted-foreground/60">({packet.summary.confidence_statement})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-foreground font-medium">Completeness:</span>
          <span className="font-mono">{Math.round(packet.completeness_score * 100)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-foreground font-medium">Model:</span>
          <span className="font-mono">{packet.llm_model_used}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-foreground font-medium">Prompt:</span>
          <span className="font-mono">{packet.prompt_version}</span>
        </div>
        {packet.missing_signals.length > 0 && (
          <div className="flex items-center gap-1.5 ml-auto text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            <span>{packet.missing_signals.length} missing signals — reduced confidence</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

        {/* SUMMARY */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <SectionHeader icon={FileText} title="Summary" />
          <div className="rounded-xl border border-border bg-surface-raised/30 p-5 space-y-4">
            <p className="text-base font-medium text-foreground leading-relaxed">{packet.summary.one_line}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Severity Basis</p>
                <p className="text-xs text-foreground">{packet.summary.severity_basis}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Customer Impact</p>
                <p className="text-xs text-foreground">{packet.summary.customer_impact}</p>
              </div>
              <div className="p-3 rounded-lg bg-severity-p0/5 border border-severity-p0/10 space-y-1">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">SLO Impact</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-severity-p0">{packet.summary.slo_impact.burn_rate}x burn rate</span>
                  <span className="text-xs text-muted-foreground">{packet.summary.slo_impact.budget_consumed}% budget consumed</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">Overall Confidence</span>
                  <span className={cn('text-xs font-mono font-bold', confidenceColor)}>{Math.round(packet.overall_confidence * 100)}% — {packet.summary.confidence_statement}</span>
                </div>
                <ConfidenceBar confidence={packet.overall_confidence} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">Packet Completeness</span>
                  <span className="text-xs font-mono">{Math.round(packet.completeness_score * 100)}%</span>
                </div>
                <Progress value={packet.completeness_score * 100} className="h-1.5" />
              </div>
            </div>
          </div>
        </motion.section>

        {/* AFFECTED SCOPE */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SectionHeader icon={AlertCircle} title="Affected Scope" badge={`${packet.affected_scope.scope_confidence * 100}% confidence`} />
          <div className="rounded-xl border border-border bg-surface-raised/30 p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Services', items: packet.affected_scope.services },
                { label: 'Endpoints', items: packet.affected_scope.endpoints },
                { label: 'Regions', items: packet.affected_scope.regions },
                { label: 'Versions', items: packet.affected_scope.versions },
              ].map(({ label, items }) => (
                <div key={label}>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1.5">{label}</p>
                  {items.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {items.map(item => (
                        <span key={item} className="text-[11px] px-2 py-0.5 bg-secondary rounded font-mono">{item}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/50 italic">None identified</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* TOPOLOGY SLICE */}
        {packet.topology_slice && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <SectionHeader icon={GitBranch} title="Topology — Causal Path" badge={packet.topology_slice.source === 'inferred' ? 'Inferred' : 'Explicit'} />
            <div className="rounded-xl border border-border bg-surface-raised/30 p-5">
              <div className="flex items-center gap-2 flex-wrap mb-4">
                {packet.topology_slice.causal_path.map((svc, i) => (
                  <div key={svc} className="flex items-center gap-2">
                    <Link
                      to={`/topology`}
                      className={cn(
                        'px-3 py-2 rounded-lg border text-xs font-medium transition-colors hover:border-primary/50',
                        packet.affected_scope.services.includes(svc)
                          ? 'border-severity-p0/40 bg-severity-p0/5 text-foreground'
                          : 'border-border bg-secondary/50 text-muted-foreground'
                      )}
                    >
                      {svc}
                    </Link>
                    {i < packet.topology_slice!.causal_path.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Source: {packet.topology_slice.source === 'inferred' ? 'Inferred from distributed traces and service calls — not from explicit service catalog entry.' : 'From service catalog dependency definitions.'}
                {' '}Confidence: {Math.round(packet.topology_slice.confidence * 100)}%.
              </p>
            </div>
          </motion.section>
        )}

        {/* UNIFIED TIMELINE */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <SectionHeader icon={Clock} title="Unified Timeline" badge={`${packet.unified_timeline.length} events`} />
          <div className="rounded-xl border border-border bg-surface-raised/30 p-5">
            <div className="relative pl-4 border-l border-border space-y-0">
              {packet.unified_timeline.map((event, i) => (
                <div key={event.id} className="relative pb-5 last:pb-0">
                  <div className="absolute -left-5 top-0 h-3 w-3 rounded-full border-2 border-border bg-background" />
                  <div className="flex items-start gap-3">
                    <EventTypeIcon type={event.event_type} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-foreground">{event.title}</span>
                        {event.service && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-secondary rounded font-mono">{event.service}</span>
                        )}
                        {event.actor && (
                          <span className="text-[10px] text-muted-foreground">by {event.actor}</span>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{event.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5 font-mono">
                        {format(new Date(event.timestamp), 'HH:mm:ss')} UTC
                        {event.source && ` · ${event.source}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* HYPOTHESES */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SectionHeader icon={Activity} title="Ranked Hypotheses" badge={`${packet.hypotheses.length} hypotheses`} />
          <div className="space-y-2">
            {packet.hypotheses.map(h => <HypothesisCard key={h.id} hypothesis={h} defaultExpanded />)}
          </div>
        </motion.section>

        {/* ROOT CAUSE CONCLUSION */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <SectionHeader icon={CheckCircle2} title="Root Cause Conclusion" />
          <div className="rounded-xl border border-border bg-surface-raised/30 p-5 space-y-4">
            {packet.root_cause_conclusion.probable_root_causes.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-blue-400" />
                  Probable Root Causes
                </p>
                {packet.root_cause_conclusion.probable_root_causes.map((rc, i) => (
                  <p key={i} className="text-sm text-foreground leading-relaxed">{rc}</p>
                ))}
              </div>
            )}
            {packet.root_cause_conclusion.contributing_factors.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Contributing Factors</p>
                <ul className="space-y-1">
                  {packet.root_cause_conclusion.contributing_factors.map((cf, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      {cf}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {packet.root_cause_conclusion.explicit_unknowns.length > 0 && (
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                  Explicit Unknowns (Could Not Determine)
                </p>
                <ul className="space-y-1">
                  {packet.root_cause_conclusion.explicit_unknowns.map((u, i) => (
                    <li key={i} className="text-xs text-muted-foreground">{u}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.section>

        {/* MITIGATION PLAN */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <SectionHeader icon={Zap} title="Mitigation Plan" />
          <div className="space-y-4">
            {[
              { label: 'Immediate Actions', actions: packet.mitigation_plan.immediate_actions, color: 'text-severity-p0' },
              { label: 'Durable Fixes', actions: packet.mitigation_plan.durable_fixes, color: 'text-blue-400' },
              { label: 'Preventive Actions', actions: packet.mitigation_plan.preventive_actions, color: 'text-emerald-400' },
            ].map(({ label, actions, color }) => (
              actions.length > 0 && (
                <div key={label}>
                  <p className={cn('text-xs font-medium mb-2', color)}>{label}</p>
                  <div className="space-y-2">
                    {actions.map((action, i) => (
                      <div key={action.id} className="flex gap-3 p-3 rounded-lg border border-border bg-surface-raised/30">
                        <div className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-medium text-foreground">{action.description}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <TierBadge tier={action.tier} />
                            <RiskBadge risk={action.risk_level} />
                            <span className="text-[10px] text-muted-foreground">·</span>
                            <span className="text-[10px] text-muted-foreground">{action.estimated_time}</span>
                            <span className="text-[10px] text-muted-foreground">·</span>
                            <span className="text-[10px] text-muted-foreground">Owner: {action.owner_role}</span>
                            {action.rollback_available && (
                              <>
                                <span className="text-[10px] text-muted-foreground">·</span>
                                <span className="text-[10px] text-emerald-400">Rollback available</span>
                              </>
                            )}
                          </div>
                          {action.commands && action.commands.length > 0 && (
                            <div className="mt-2 p-2 bg-background/50 rounded border border-border/50 font-mono text-[11px] text-muted-foreground space-y-0.5">
                              {action.commands.map((cmd, ci) => (
                                <p key={ci} className="whitespace-pre-wrap break-all">{cmd}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </motion.section>

        {/* VERIFICATION CRITERIA */}
        {packet.verification_criteria.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <SectionHeader icon={CheckCircle2} title="Verification Criteria" />
            <div className="rounded-xl border border-border bg-surface-raised/30 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="border-b border-border">
                  <tr className="bg-secondary/30">
                    <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Check</th>
                    <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Success Threshold</th>
                    <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Timeout</th>
                    <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Fallback</th>
                  </tr>
                </thead>
                <tbody>
                  {packet.verification_criteria.map((vc, i) => (
                    <tr key={vc.id} className={cn('border-b border-border/50', i % 2 === 0 ? '' : 'bg-secondary/10')}>
                      <td className="px-4 py-2.5 font-medium">{vc.check_type}</td>
                      <td className="px-4 py-2.5 font-mono text-emerald-400">{vc.success_threshold}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{vc.timeout}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{vc.fallback_action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}

        {/* GAP ARTIFACTS */}
        {packet.gap_artifacts.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <SectionHeader icon={Shield} title="Gap Artifacts" badge="Prerequisites Builder" />
            <p className="text-xs text-muted-foreground mb-3">
              These instrumentation and process improvements would have detected or prevented this incident faster. Generated by BugPilot Prerequisites Builder.
            </p>
            <div className="space-y-2">
              {packet.gap_artifacts.map(gap => (
                <div key={gap.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface-raised/30">
                  <div className={cn(
                    'text-[9px] px-1.5 py-1 rounded font-bold uppercase tracking-wider shrink-0 mt-0.5',
                    gap.priority === 'critical' ? 'bg-severity-p0/10 text-severity-p0' :
                    gap.priority === 'high' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-secondary text-muted-foreground'
                  )}>
                    {gap.priority}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{gap.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{gap.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 bg-secondary rounded capitalize">{gap.artifact_type.replace('_', ' ')}</span>
                      <span className="text-[10px] text-muted-foreground">{gap.dimension.replace('_', ' ')}</span>
                    </div>
                  </div>
                  {gap.content && (
                    <Button size="sm" variant="outline" className="h-7 text-xs shrink-0">
                      Create PR
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* MISSING SIGNALS */}
        {packet.missing_signals.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <SectionHeader icon={AlertTriangle} title="Missing Signals" />
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="border-b border-amber-500/20">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-[10px] text-amber-400/80 font-medium uppercase tracking-wider">Signal Source</th>
                    <th className="text-left px-4 py-2.5 text-[10px] text-amber-400/80 font-medium uppercase tracking-wider">Reason Unavailable</th>
                    <th className="text-left px-4 py-2.5 text-[10px] text-amber-400/80 font-medium uppercase tracking-wider">Confidence Impact</th>
                    <th className="text-left px-4 py-2.5 text-[10px] text-amber-400/80 font-medium uppercase tracking-wider">Fix</th>
                  </tr>
                </thead>
                <tbody>
                  {packet.missing_signals.map((ms, i) => (
                    <tr key={i} className="border-b border-amber-500/10 last:border-0">
                      <td className="px-4 py-2.5 font-medium text-foreground">{ms.source}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{ms.reason}</td>
                      <td className="px-4 py-2.5 text-amber-400 font-mono">-{Math.round(ms.confidence_impact * 100)}%</td>
                      <td className="px-4 py-2.5">
                        <Link to="/integrations" className="text-primary text-[11px] flex items-center gap-1 hover:underline">
                          Connect <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="border-t border-border pt-6 flex items-center gap-3 flex-wrap">
          <Button variant="default" size="sm" asChild>
            <Link to={`/incidents/${id}/postmortem`}>
              <FileText className="h-3.5 w-3.5 mr-1.5" /> View Postmortem
            </Link>
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export JSON
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export Markdown
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/incidents/${id}`}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Investigation
            </Link>
          </Button>
        </motion.div>

      </div>
    </div>
  );
}
