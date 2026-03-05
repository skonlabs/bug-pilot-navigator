import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockIncidents, mockInvestigation, mockEvidence, mockHypotheses, mockFixes, mockChangeTimeline, mockUser } from '@/data/mock-data';
import { SeverityBadge } from '@/components/bugpilot/SeverityBadge';
import { StatusBadge } from '@/components/bugpilot/StatusBadge';
import { ConfidenceBar } from '@/components/bugpilot/ConfidenceBar';
import { EvidenceItemCard } from '@/components/bugpilot/EvidenceItemCard';
import { HypothesisCard } from '@/components/bugpilot/HypothesisCard';
import { FixProposalCard } from '@/components/bugpilot/FixProposalCard';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, AlertTriangle, CheckCircle, Loader2, FileText,
  GitCommit, Settings2, Flag, Database, Layers, ExternalLink, Search, Pin,
  Hash, Copy, Pencil, ChevronDown, Clock, Send, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState, useMemo, useCallback } from 'react';
import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns';
import type { InvestigationPhase, EvidenceType, IncidentStatus } from '@/types/bugpilot';
import { useToast } from '@/hooks/use-toast';

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
  config: 'text-warning bg-warning/10',
  flag: 'text-success bg-success/10',
  migration: 'text-severity-p1 bg-severity-p1/10',
  infra: 'text-severity-p3 bg-severity-p3/10',
  rollback: 'text-severity-p0 bg-severity-p0/10',
  manual: 'text-muted-foreground bg-secondary',
};

// ─── Status Transition Map ────────────────────────────────────────────────────

const STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  detected: ['investigating'],
  investigating: ['identified'],
  identified: ['mitigating'],
  mitigating: ['resolved'],
  resolved: ['postmortem'],
  postmortem: ['closed'],
  closed: [],
};

const STATUS_LABELS: Record<IncidentStatus, string> = {
  detected: 'Detected',
  investigating: 'Investigating',
  identified: 'Identified',
  mitigating: 'Mitigating',
  resolved: 'Resolved',
  postmortem: 'Postmortem',
  closed: 'Closed',
};

const NEXT_STATUS_BUTTON_LABELS: Partial<Record<IncidentStatus, string>> = {
  detected: 'Start Investigating',
  investigating: 'Mark as Identified',
  identified: 'Begin Mitigation',
  mitigating: 'Mark as Resolved',
  resolved: 'Start Postmortem',
  postmortem: 'Close Incident',
};

// ─── Note type ────────────────────────────────────────────────────────────────

interface LocalNote {
  id: string;
  text: string;
  actor: string;
  timestamp: string;
}

// ─── Phase step colors ────────────────────────────────────────────────────────

const PHASE_LABELS: Record<InvestigationPhase, string> = {
  classify: 'Classify',
  scope: 'Scope',
  evidence: 'Evidence',
  topology: 'Topology',
  hypothesize: 'Hypothesize',
  test: 'Test',
  fix: 'Fix',
  packet: 'Packet',
};

export default function InvestigationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const incident = mockIncidents.find(i => i.id === id) || mockIncidents[0];
  const investigation = mockInvestigation;
  const evidence = mockEvidence;
  const hypotheses = mockHypotheses;
  const fixes = mockFixes;

  // ── Local status tracking ──────────────────────────────────────────────────
  const [currentStatus, setCurrentStatus] = useState<IncidentStatus>(incident.status);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // ── Evidence state ─────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('All');
  const [evidenceSearch, setEvidenceSearch] = useState('');
  const [pinnedOnly, setPinnedOnly] = useState(false);

  // ── Time range scrubber ────────────────────────────────────────────────────
  const allTimestamps = evidence.map(e => e.event_timestamp).sort();
  const defaultStart = allTimestamps[0] ?? new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
  const defaultEnd = allTimestamps[allTimestamps.length - 1] ?? new Date().toISOString();
  const [timeStart, setTimeStart] = useState<string>('');
  const [timeEnd, setTimeEnd] = useState<string>('');

  // ── Notes state ────────────────────────────────────────────────────────────
  const [notes, setNotes] = useState<LocalNote[]>([]);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');

  // ── Footer quick-note / slack update state ─────────────────────────────────
  const [footerNote, setFooterNote] = useState('');
  const [footerStatusValue, setFooterStatusValue] = useState<IncidentStatus>(incident.status);

  const currentPhaseIdx = phases.indexOf(investigation.phase || 'classify');
  const isInvestigationComplete = investigation.status === 'complete';

  // Elapsed time
  const elapsedMinutes = investigation.started_at && investigation.completed_at
    ? differenceInMinutes(new Date(investigation.completed_at), new Date(investigation.started_at))
    : investigation.started_at
    ? differenceInMinutes(new Date(), new Date(investigation.started_at))
    : null;

  // Filter evidence for the affected services
  const relevantChanges = mockChangeTimeline.filter(c =>
    incident.affected_services.includes(c.service_name)
  );

  // ── Status transition handler ──────────────────────────────────────────────
  const handleStatusTransition = useCallback((nextStatus: IncidentStatus) => {
    setCurrentStatus(nextStatus);
    setStatusDropdownOpen(false);
    setFooterStatusValue(nextStatus);

    if (nextStatus === 'resolved') {
      setStatusBanner('Incident marked resolved. Postmortem will be auto-generated.');
      toast({
        title: 'Incident Resolved',
        description: 'Postmortem will be auto-generated.',
      });
    } else if (nextStatus === 'identified') {
      setStatusBanner('Root cause identified. Fix generation unlocked.');
      toast({
        title: 'Root Cause Identified',
        description: 'Fix generation unlocked.',
      });
    } else {
      setStatusBanner(null);
    }

    setTimeout(() => setStatusBanner(null), 6000);
  }, [toast]);

  // ── Add note handler ───────────────────────────────────────────────────────
  const handleAddNote = useCallback(() => {
    if (!noteText.trim()) return;
    const note: LocalNote = {
      id: `note-${Date.now()}`,
      text: noteText.trim(),
      actor: mockUser.name,
      timestamp: new Date().toISOString(),
    };
    setNotes(prev => [note, ...prev]);
    setNoteText('');
    setNoteOpen(false);
  }, [noteText]);

  const handleFooterNote = useCallback(() => {
    if (!footerNote.trim()) return;
    const note: LocalNote = {
      id: `note-${Date.now()}`,
      text: footerNote.trim(),
      actor: mockUser.name,
      timestamp: new Date().toISOString(),
    };
    setNotes(prev => [note, ...prev]);
    setFooterNote('');
    toast({ title: 'Context note added', description: footerNote.trim() });
  }, [footerNote, toast]);

  // ── Copy channel link ──────────────────────────────────────────────────────
  const handleCopyChannelLink = useCallback(() => {
    if (incident.slack_channel_name) {
      navigator.clipboard.writeText(`https://slack.com/app_redirect?channel=${incident.slack_channel_name}`).catch(() => {});
      toast({ title: 'Copied', description: 'Channel link copied to clipboard.' });
    }
  }, [incident.slack_channel_name, toast]);

  // ── Evidence filtering ─────────────────────────────────────────────────────
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
    if (timeStart) {
      items = items.filter(item => new Date(item.event_timestamp) >= new Date(timeStart));
    }
    if (timeEnd) {
      items = items.filter(item => new Date(item.event_timestamp) <= new Date(timeEnd));
    }
    return items;
  }, [evidence, activeTab, pinnedOnly, evidenceSearch, timeStart, timeEnd]);

  const pinnedCount = evidence.filter(e => e.is_pinned).length;

  const nextStatuses = STATUS_TRANSITIONS[currentStatus];
  const primaryNextStatus = nextStatuses[0] ?? null;

  // Format datetime-local value from ISO string for display
  const formatDatetimeLocal = (iso: string) => {
    try {
      return format(new Date(iso), "MMM d, HH:mm");
    } catch {
      return iso;
    }
  };

  // Phase progress %
  const phaseProgress = isInvestigationComplete ? 100 : Math.round(((currentPhaseIdx + 1) / phases.length) * 100);

  return (
    <div className="space-y-0 -m-4 md:-m-5 xl:-m-6 flex flex-col">
      {/* ── Incident Header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-3 border-b border-border bg-surface-raised/50 backdrop-blur-sm flex items-center gap-3 flex-wrap sticky top-14 z-10"
      >
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => navigate('/incidents')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Severity badge — prominent */}
        <SeverityBadge severity={incident.severity} />

        <span className="font-mono text-xs font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded border border-border/50">
          {incident.short_id}
        </span>

        <StatusBadge status={currentStatus} />

        {incident.slo_violated && (
          <span className="text-xs px-2 py-0.5 rounded-md bg-severity-p0/10 text-severity-p0 font-bold font-mono border border-severity-p0/20">
            SLO · {incident.error_budget_consumed}% burned · {incident.burn_rate}x
          </span>
        )}

        <div className="h-4 w-px bg-border mx-1 hidden sm:block" />
        <span className="text-xs text-foreground font-medium truncate max-w-[220px] md:max-w-xs hidden sm:block">
          {incident.title}
        </span>

        {incident.slack_channel_name && (
          <span className="text-xs font-mono text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md border border-border/50 hidden md:block">
            #{incident.slack_channel_name}
          </span>
        )}

        {/* ── Status Transition Buttons ──────────────────────────────────── */}
        <div className="ml-auto flex gap-2 items-center">
          {primaryNextStatus && (
            <div className="flex items-center">
              <Button
                size="sm"
                className="h-7 text-xs gap-1.5 rounded-r-none border-r-0"
                onClick={() => handleStatusTransition(primaryNextStatus)}
              >
                <Zap className="h-3 w-3" />
                {NEXT_STATUS_BUTTON_LABELS[currentStatus]}
              </Button>
              <div className="relative">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs px-1.5 rounded-l-none border-l border-border/60"
                  onClick={() => setStatusDropdownOpen(o => !o)}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
                {statusDropdownOpen && (
                  <div className="absolute right-0 top-8 z-50 min-w-[160px] rounded-lg border border-border bg-card shadow-xl py-1">
                    {nextStatuses.map(s => (
                      <button
                        key={s}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-secondary transition-colors text-foreground"
                        onClick={() => handleStatusTransition(s)}
                      >
                        {NEXT_STATUS_BUTTON_LABELS[s] ?? STATUS_LABELS[s]}
                      </button>
                    ))}
                    {nextStatuses.length === 0 && (
                      <span className="px-3 py-1.5 text-xs text-muted-foreground block">No further transitions</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

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

      {/* ── Investigation Phase Progress Bar ────────────────────────────────── */}
      <div className="px-6 py-2 border-b border-border bg-background/60 flex items-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0">
          {isInvestigationComplete ? (
            <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
          ) : (
            investigation.status === 'running'
              ? <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
              : <div className="h-3.5 w-3.5 rounded-full border-2 border-primary shrink-0" />
          )}
          <span className={cn(
            'label-overline',
            isInvestigationComplete ? 'text-success' : 'text-primary',
          )}>
            {isInvestigationComplete ? 'Complete' : `Phase: ${PHASE_LABELS[investigation.phase || 'classify']}`}
          </span>
        </div>

        {/* Phase stepper */}
        <div className="flex items-center gap-0 flex-1 overflow-x-auto scrollbar-thin">
          {phases.map((phase, i) => {
            const isDone = isInvestigationComplete || i < currentPhaseIdx;
            const isCurrent = !isInvestigationComplete && i === currentPhaseIdx;
            return (
              <div key={phase} className="flex items-center gap-0 shrink-0">
                <div className={cn(
                  'px-2 py-1 text-xs font-semibold tracking-[0.12em] text-success transition-all',
                  isCurrent && 'border-b-2 border-success',
                  !isDone && !isCurrent && 'opacity-35',
                )}>
                  {PHASE_LABELS[phase]}
                </div>
                {i < phases.length - 1 && (
                  <div className={cn('h-px w-3 shrink-0', isDone ? 'bg-success/30' : 'bg-border/40')} />
                )}
              </div>
            );
          })}
        </div>

        {/* Confidence + progress compact */}
        <div className="flex items-center gap-3 shrink-0 text-ui-2xs text-muted-foreground">
          <span className="font-mono">
            <span className="text-foreground font-bold">{Math.round(investigation.overall_confidence * 100)}%</span> conf
          </span>
          <span className="font-mono">
            <span className="text-foreground font-bold">{phaseProgress}%</span> done
          </span>
        </div>
      </div>

      {/* ── Status Banner ───────────────────────────────────────────────────── */}
      {statusBanner && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={cn(
            'px-6 py-2 text-xs font-medium flex items-center gap-2 border-b',
            currentStatus === 'resolved'
              ? 'bg-success/10 text-success border-success/20'
              : 'bg-primary/10 text-primary border-primary/20'
          )}
        >
          <CheckCircle className="h-3.5 w-3.5 shrink-0" />
          {statusBanner}
        </motion.div>
      )}

      {/* ── 3-Panel Layout ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-[calc(100vh-10rem)]">
        {/* ── Left Panel ────────────────────────────────────────────────────── */}
        <div className="w-[240px] shrink-0 border-r border-border p-4 space-y-5 overflow-y-auto scrollbar-thin bg-muted/20">
          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <p className="label-overline mb-2">Scope</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <SeverityBadge severity={incident.severity} />
                <StatusBadge status={currentStatus} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-ui-2xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground capitalize border border-border/50">{incident.environment}</span>
                <span className="text-ui-2xs text-muted-foreground">· {incident.source}</span>
              </div>
              {incident.customer_impact && (
                <p className="text-ui-2xs text-muted-foreground/70 italic leading-snug pl-0.5">{incident.customer_impact}</p>
              )}
            </div>
          </motion.div>

          {incident.slo_violated && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <p className="label-overline mb-2">SLO Impact</p>
              <div className="p-3 rounded-lg bg-severity-p0/5 border border-severity-p0/15 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-ui-2xs text-muted-foreground">Burn rate</span>
                  <span className={cn('text-sm font-mono font-bold', (incident.burn_rate || 0) > 5 ? 'text-severity-p0' : 'text-severity-p2')}>
                    {incident.burn_rate}x
                  </span>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-ui-2xs text-muted-foreground">Budget consumed</span>
                    <span className="text-ui-2xs font-mono text-severity-p0 font-bold">{incident.error_budget_consumed}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-severity-p0" style={{ width: `${incident.error_budget_consumed}%` }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <p className="label-overline mb-2">Affected Services</p>
            <div className="space-y-1">
              {incident.affected_services.map(s => (
                <Link
                  key={s}
                  to={`/topology?highlight=${encodeURIComponent(s)}`}
                  className="flex items-center gap-2 text-xs p-2 rounded-md bg-secondary/50 text-secondary-foreground hover:bg-surface-hover transition-colors cursor-pointer group border border-border/30"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-severity-p0 shrink-0" />
                  <span className="flex-1 truncate font-mono">{s}</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                </Link>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
            <p className="label-overline mb-2">On-Call</p>
            <div className="space-y-2">
              {[
                { user: incident.ic, role: 'Incident Commander' },
                { user: incident.tl, role: 'Tech Lead' },
              ].filter(item => item.user).map(item => (
                <div key={item.role} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary/30 border border-border/30">
                  <div className="h-7 w-7 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-ui-3xs font-bold text-primary">{item.user!.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <p className="text-xs text-foreground font-medium leading-tight">{item.user!.name}</p>
                    <p className="text-ui-2xs text-muted-foreground leading-tight">{item.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── War Room Panel ──────────────────────────────────────────────── */}
          {incident.slack_channel_name && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.28 }}>
              <p className="label-overline mb-2">War Room</p>
              <div className="p-3 rounded-lg border border-border/50 bg-secondary/20 space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Hash className="h-3 w-3 text-muted-foreground shrink-0" />
                  <a
                    href={`https://slack.com/app_redirect?channel=${incident.slack_channel_name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ui-2xs font-mono text-primary hover:underline truncate"
                  >
                    {incident.slack_channel_name}
                  </a>
                  <div className="ml-auto flex items-center gap-1 shrink-0">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
                    </span>
                    <span className="text-ui-2xs text-success font-medium">Live</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-6 text-ui-2xs flex-1 gap-1" asChild>
                    <a href={`https://slack.com/app_redirect?channel=${incident.slack_channel_name}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-2.5 w-2.5" /> Open
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-ui-2xs flex-1 gap-1" onClick={handleCopyChannelLink}>
                    <Copy className="h-2.5 w-2.5" /> Copy
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Recent Changes Panel */}
          {relevantChanges.length > 0 && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <p className="label-overline mb-2">
                Recent Changes
                <span className="ml-1.5 font-mono normal-case text-muted-foreground/60">({relevantChanges.length})</span>
              </p>
              <div className="space-y-2">
                {relevantChanges.map(change => {
                  const Icon = CHANGE_TYPE_ICONS[change.change_type] || GitCommit;
                  const colorClass = CHANGE_TYPE_COLORS[change.change_type] || 'text-muted-foreground bg-secondary';
                  return (
                    <div key={change.id} className="p-2.5 rounded-lg border border-border/40 bg-secondary/20 space-y-1.5 hover:bg-secondary/40 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className={cn('inline-flex items-center gap-1 label-overline px-1.5 py-0.5 rounded-md', colorClass)}>
                          <Icon className="h-2.5 w-2.5" />
                          {change.change_type}
                        </span>
                        <span className="text-ui-2xs text-muted-foreground/60 ml-auto shrink-0">
                          {formatDistanceToNow(new Date(change.occurred_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-ui-2xs font-medium text-foreground leading-tight">{change.title}</p>
                      <p className="text-ui-2xs text-muted-foreground/60 leading-tight font-mono">{change.service_name}</p>
                      {change.description && (
                        <p className="text-ui-2xs text-muted-foreground leading-snug">{change.description}</p>
                      )}
                      {change.source_ref && (
                        <a href={change.source_ref} target="_blank" rel="noopener noreferrer"
                          className="text-ui-2xs text-primary hover:underline flex items-center gap-1">
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
              <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                  <p className="text-ui-2xs font-medium text-warning">
                    {investigation.missing_signals.length} missing signals
                  </p>
                </div>
                <ul className="space-y-1">
                  {investigation.missing_signals.map((s, i) => (
                    <li key={i} className="text-ui-2xs text-muted-foreground pl-2 border-l-2 border-warning/20">{s}</li>
                  ))}
                </ul>
                <Button size="sm" variant="ghost" className="h-6 text-ui-2xs mt-2 text-warning hover:text-warning p-0" onClick={() => navigate('/integrations')}>
                  Fix in Integrations →
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Center Panel - Evidence Timeline ──────────────────────────────── */}
        <div className="flex-1 p-4 overflow-y-auto scrollbar-thin">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {/* Evidence Header */}
            <div className="flex items-center justify-between mb-3 gap-3">
              <div className="flex items-center gap-2">
                <p className="label-overline">
                  Evidence Timeline
                </p>
                <span className="text-ui-2xs font-mono text-muted-foreground/60 bg-secondary px-1.5 py-0.5 rounded">
                  {filteredEvidence.length}/{evidence.length}
                </span>
              </div>
              <button
                onClick={() => setPinnedOnly(p => !p)}
                className={cn(
                  'flex items-center gap-1 h-6 px-2 rounded-md label-overline border transition-colors',
                  pinnedOnly
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'border-border/50 text-muted-foreground hover:text-foreground'
                )}
              >
                <Pin className="h-3 w-3" />
                Pinned{pinnedCount > 0 ? ` (${pinnedCount})` : ''}
              </button>
            </div>

            {/* Search + Tabs */}
            <div className="flex items-center gap-2 mb-3">
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
                    'px-2 py-1 label-overline rounded-md transition-all',
                    activeTab === tab.label ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-secondary-foreground'
                  )}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Time Range Scrubber ──────────────────────────────────────── */}
            <div className="mb-4 p-3 rounded-lg border border-border/50 bg-secondary/20 space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                <span className="label-overline text-muted-foreground/60">Time Range Filter</span>
              </div>
              <div className="text-ui-2xs text-muted-foreground">
                {timeStart || timeEnd ? (
                  <span>
                    Showing events from{' '}
                    <span className="text-foreground font-medium font-mono">{timeStart ? formatDatetimeLocal(new Date(timeStart).toISOString()) : formatDatetimeLocal(defaultStart)}</span>
                    {' '}to{' '}
                    <span className="text-foreground font-medium font-mono">{timeEnd ? formatDatetimeLocal(new Date(timeEnd).toISOString()) : formatDatetimeLocal(defaultEnd)}</span>
                  </span>
                ) : (
                  <span>
                    Showing all events from{' '}
                    <span className="text-foreground font-medium font-mono">{formatDatetimeLocal(defaultStart)}</span>
                    {' '}to{' '}
                    <span className="text-foreground font-medium font-mono">{formatDatetimeLocal(defaultEnd)}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-ui-2xs text-muted-foreground/60 shrink-0">From</span>
                  <input
                    type="datetime-local"
                    value={timeStart}
                    onChange={e => setTimeStart(e.target.value)}
                    className="h-6 px-2 text-ui-2xs bg-background border border-border/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 text-foreground"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-ui-2xs text-muted-foreground/60 shrink-0">To</span>
                  <input
                    type="datetime-local"
                    value={timeEnd}
                    onChange={e => setTimeEnd(e.target.value)}
                    className="h-6 px-2 text-ui-2xs bg-background border border-border/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 text-foreground"
                  />
                </div>
                {(timeStart || timeEnd) && (
                  <button
                    onClick={() => { setTimeStart(''); setTimeEnd(''); }}
                    className="h-6 px-2 text-ui-2xs text-primary hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* ── Add Note Button + Form ───────────────────────────────────── */}
            <div className="mb-4">
              {!noteOpen ? (
                <button
                  onClick={() => setNoteOpen(true)}
                  className="flex items-center gap-1.5 h-7 px-3 rounded-md text-ui-2xs font-medium border border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-secondary/30 transition-colors w-full justify-center"
                >
                  <Pencil className="h-3 w-3" />
                  Add Note
                </button>
              ) : (
                <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Pencil className="h-3 w-3 text-warning" />
                    <span className="label-overline text-warning">New Note</span>
                  </div>
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Add investigation note..."
                    rows={3}
                    autoFocus
                    className="w-full text-xs bg-background/50 border border-border/50 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-warning/40 focus:border-warning/40 text-foreground placeholder:text-muted-foreground/50 resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" className="h-6 text-ui-2xs" onClick={() => { setNoteOpen(false); setNoteText(''); }}>
                      Cancel
                    </Button>
                    <Button size="sm" className="h-6 text-ui-2xs bg-warning/20 text-warning hover:bg-warning/30 border border-warning/30" onClick={handleAddNote} disabled={!noteText.trim()}>
                      Save Note
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Evidence Feed ────────────────────────────────────────────── */}
            {notes.length === 0 && filteredEvidence.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-12 w-12 rounded-xl bg-secondary/60 border border-border flex items-center justify-center mb-3">
                  <Search className="h-5 w-5 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">No evidence matches your filter</p>
                <p className="text-xs text-muted-foreground mb-3">Try adjusting your search or time range</p>
                <button
                  onClick={() => { setActiveTab('All'); setEvidenceSearch(''); setPinnedOnly(false); setTimeStart(''); setTimeEnd(''); }}
                  className="text-xs text-primary hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Note cards */}
                {notes.map((note, i) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-lg border border-warning/25 p-3 space-y-1.5 bg-warning/10"
                  >
                    <div className="flex items-center gap-2">
                      <Pencil className="h-3 w-3 text-warning shrink-0" />
                      <span className="text-ui-2xs font-medium text-warning">{note.actor}</span>
                      <span className="text-ui-2xs text-muted-foreground/60 ml-auto">
                        {formatDistanceToNow(new Date(note.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-foreground leading-snug pl-5">{note.text}</p>
                  </motion.div>
                ))}

                {/* Evidence items */}
                {filteredEvidence.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.03 }}>
                    <EvidenceItemCard item={item} onPin={() => {}} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Right Panel ─────────────────────────────────────────────────────── */}
        <div className="w-[300px] shrink-0 border-l border-border p-4 space-y-5 overflow-y-auto scrollbar-thin">

          {/* Investigation Progress */}
          <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-3">
              <p className="label-overline">Investigation</p>
              {investigation.llm_model_used && (
                <span className="text-ui-3xs font-mono text-muted-foreground/50 bg-secondary px-1.5 py-0.5 rounded border border-border/40">
                  {investigation.llm_model_used}
                </span>
              )}
            </div>

            {/* Complete banner */}
            {isInvestigationComplete && (
              <div className="mb-3 rounded-lg bg-success/10 border border-success/20 px-3 py-2.5 flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
                <span className="text-ui-2xs font-bold text-success">Investigation Complete</span>
              </div>
            )}

            {/* Phase list — compact */}
            <div className="space-y-0 rounded-lg border border-border/40 bg-secondary/10 overflow-hidden">
              {phases.map((phase, i) => {
                const isDone = isInvestigationComplete || i < currentPhaseIdx;
                const isCurrent = !isInvestigationComplete && i === currentPhaseIdx;
                return (
                  <div
                    key={phase}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-1.5 border-b border-border/30 last:border-0',
                      isCurrent && 'bg-primary/5',
                    )}
                  >
                    {isDone ? (
                      <CheckCircle className="h-3 w-3 text-success shrink-0" />
                    ) : isCurrent ? (
                      investigation.status === 'running'
                        ? <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />
                        : <div className="h-3 w-3 rounded-full border-2 border-primary shrink-0" />
                    ) : (
                      <div className="h-3 w-3 rounded-full border border-border/50 shrink-0" />
                    )}
                    <span className={cn(
                      'text-xs capitalize flex-1',
                      isDone ? 'text-success' :
                      isCurrent ? 'text-primary font-medium' :
                      'text-muted-foreground/40'
                    )}>
                      {PHASE_LABELS[phase]}
                    </span>
                    {isCurrent && investigation.status === 'running' && (
                      <span className="text-ui-2xs text-primary/60">Running...</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Confidence + stats */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <ConfidenceBar confidence={investigation.overall_confidence} className="flex-1" />
                <span className="text-ui-2xs text-muted-foreground whitespace-nowrap font-mono font-bold">
                  {Math.round(investigation.overall_confidence * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-ui-2xs text-muted-foreground/60">
                <span className="font-mono">Completeness: {Math.round(investigation.completeness_score * 100)}%</span>
                {investigation.cost_usd && <span className="font-mono">${investigation.cost_usd.toFixed(3)}</span>}
              </div>

              {elapsedMinutes !== null && (
                <div className="text-ui-2xs text-muted-foreground/60 flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5 shrink-0" />
                  {isInvestigationComplete ? 'Took' : 'Running for'}{' '}
                  <span className="font-mono text-foreground/60">{elapsedMinutes}m</span>
                </div>
              )}

              {(investigation.tokens_in || investigation.tokens_out) && (
                <div className="pt-2 border-t border-border/40">
                  <p className="text-ui-2xs font-mono text-muted-foreground/50 leading-relaxed">
                    {investigation.tokens_in?.toLocaleString()} in
                    {investigation.tokens_out ? ` / ${investigation.tokens_out.toLocaleString()} out` : ''}
                    {investigation.cost_usd ? ` · $${investigation.cost_usd.toFixed(3)}` : ''}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Hypotheses */}
          <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-2">
              <p className="label-overline">Hypotheses</p>
              <span className="text-ui-2xs font-mono text-muted-foreground/60 bg-secondary px-1.5 py-0.5 rounded">
                {hypotheses.length}
              </span>
            </div>
            <div className="space-y-2">
              {hypotheses.map(h => <HypothesisCard key={h.id} hypothesis={h} />)}
            </div>
          </motion.div>

          {/* Fixes */}
          <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            {hypotheses[0] && hypotheses[0].confidence < 0.65 ? (
              <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
                <p className="text-xs text-warning font-semibold mb-1">Fix generation locked</p>
                <p className="text-ui-2xs text-muted-foreground">
                  Confidence {Math.round(hypotheses[0].confidence * 100)}% — need ≥65% to generate fixes.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="label-overline">Proposed Fixes</p>
                  <span className="text-ui-2xs font-mono text-muted-foreground/60 bg-secondary px-1.5 py-0.5 rounded">
                    {fixes.length}
                  </span>
                </div>
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
                <p className="label-overline mb-2">Outputs</p>
                {incident.latest_packet_id && (
                  <Link
                    to={`/incidents/${incident.id}/packet`}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors group"
                  >
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Resolution Packet</p>
                      <p className="text-ui-2xs text-muted-foreground">Full RCA with confidence scoring</p>
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
                      <p className="text-ui-2xs text-muted-foreground">Blameless review & action items</p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground/40 ml-auto group-hover:text-foreground transition-colors" />
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Sticky Footer: Quick Status Update Bar ─────────────────────────── */}
      <div className="sticky bottom-0 z-20 border-t border-border bg-surface-raised/90 backdrop-blur-sm px-6 py-2.5 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 shrink-0">
          <span className="label-overline text-muted-foreground/60">Status</span>
          <select
            value={footerStatusValue}
            onChange={e => {
              const next = e.target.value as IncidentStatus;
              setFooterStatusValue(next);
              handleStatusTransition(next);
            }}
            className="h-7 pl-2 pr-6 text-xs bg-secondary border border-border/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 text-foreground appearance-none cursor-pointer"
          >
            {(Object.keys(STATUS_LABELS) as IncidentStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <input
            value={footerNote}
            onChange={e => setFooterNote(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFooterNote(); } }}
            placeholder="Add context note..."
            className="flex-1 h-7 px-3 text-xs bg-secondary/50 border border-border/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 text-foreground placeholder:text-muted-foreground/50"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5 shrink-0"
            disabled={!footerNote.trim()}
            onClick={handleFooterNote}
          >
            <Pencil className="h-3 w-3" />
            Save
          </Button>
        </div>

        <div className="h-4 w-px bg-border" />

        {incident.slack_channel_name && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5 shrink-0"
            onClick={() => {
              toast({
                title: 'Slack Update Sent',
                description: `Posted status update to #${incident.slack_channel_name}`,
              });
            }}
          >
            <Send className="h-3 w-3" />
            Slack Update
          </Button>
        )}
      </div>
    </div>
  );
}
