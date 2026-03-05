import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import {
  AlertTriangle,
  Activity,
  CheckCircle2,
  Clock,
  TrendingDown,
  TrendingUp,
  Zap,
  Shield,
  ArrowRight,
  ArrowUpRight,
  Plus,
  Map,
  BarChart2,
  ClipboardCheck,
  Flame,
  Users,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  mockIncidents,
  mockConnectors,
  mockReportMetrics,
  mockReadiness,
  mockFixes,
  mockOnCallMetrics,
  mockDoraMetrics,
  mockOrg,
} from '@/data/mock-data';
import { SeverityBadge } from '@/components/bugpilot/SeverityBadge';
import { StatusBadge } from '@/components/bugpilot/StatusBadge';
import { Button } from '@/components/ui/button';
import { DeclareIncidentDialog } from '@/components/bugpilot/DeclareIncidentDialog';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTimeAgo(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

function getMTTRLabel(secs: number) {
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function connectorDotClass(status: string) {
  if (status === 'connected') return 'bg-emerald-500';
  if (status === 'error') return 'bg-severity-p0';
  if (status === 'stale') return 'bg-yellow-500';
  return 'bg-muted-foreground/40';
}

const ACTIVE_STATUSES = ['detected', 'investigating', 'identified', 'mitigating'];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
  icon: React.ElementType;
  accent?: string;
}

function MetricCard({ label, value, sub, trend, trendUp, icon: Icon, accent }: MetricCardProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-4 flex flex-col gap-3', accent)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {trend && (
          <span className={cn('flex items-center gap-0.5 text-xs font-medium mb-0.5', trendUp ? 'text-severity-p0' : 'text-emerald-500')}>
            {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend}
          </span>
        )}
      </div>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

function LiveIncidentCard({ inc }: { inc: typeof mockIncidents[0] }) {
  const navigate = useNavigate();
  const isP0 = inc.severity === 'P0';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/incidents/${inc.id}`)}
      className={cn(
        'rounded-xl border bg-card p-4 cursor-pointer hover:bg-surface-hover transition-colors group relative overflow-hidden',
        isP0 ? 'border-severity-p0/40' : 'border-severity-p1/30',
      )}
    >
      {isP0 && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-severity-p0" />}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Pulse dot */}
          <div className="mt-1 flex-shrink-0 relative h-2.5 w-2.5">
            <div className={cn('h-2.5 w-2.5 rounded-full', isP0 ? 'bg-severity-p0' : 'bg-severity-p1')} />
            {isP0 && (
              <div className="absolute inset-0 rounded-full bg-severity-p0 animate-ping opacity-75" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-[11px] text-muted-foreground">{inc.short_id}</span>
              <SeverityBadge severity={inc.severity} />
              {inc.slo_violated && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-severity-p0/15 text-severity-p0 font-bold tracking-wider">
                  SLO BURN
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-foreground leading-snug group-hover:text-primary transition-colors">
              {inc.title}
            </p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Detected {getTimeAgo(inc.detected_at)}
              </span>
              {inc.environment && (
                <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                  {inc.environment}
                </span>
              )}
              {inc.ic && (
                <span className="text-xs text-muted-foreground">IC: {inc.ic.name.split(' ')[0]}</span>
              )}
            </div>
            {inc.affected_services.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {inc.affected_services.slice(0, 3).map(s => (
                  <span key={s} className="text-[11px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                    {s}
                  </span>
                ))}
                {inc.affected_services.length > 3 && (
                  <span className="text-[11px] text-muted-foreground">+{inc.affected_services.length - 3} more</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <StatusBadge status={inc.status} />
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </div>
      </div>

      {inc.burn_rate !== undefined && inc.burn_rate > 5 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-severity-p0 border-t border-border/50 pt-3">
          <Flame className="h-3.5 w-3.5" />
          <span>Error budget burning at {inc.burn_rate}x rate</span>
          {inc.error_budget_consumed !== undefined && (
            <span className="ml-auto text-muted-foreground">{inc.error_budget_consumed}% consumed</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IndexPage() {
  const navigate = useNavigate();
  const [declareOpen, setDeclareOpen] = useState(false);

  const activeIncidents = mockIncidents.filter(i => ACTIVE_STATUSES.includes(i.status));
  const resolvedIncidents = mockIncidents
    .filter(i => ['resolved', 'closed', 'postmortem'].includes(i.status))
    .sort((a, b) => {
      const aTime = a.resolved_at ? new Date(a.resolved_at).getTime() : 0;
      const bTime = b.resolved_at ? new Date(b.resolved_at).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 3);

  const pendingFixes = mockFixes.filter(f => f.status === 'proposed').length;
  const sloViolations = mockIncidents.filter(i => i.slo_violated && ACTIVE_STATUSES.includes(i.status)).length;
  const connectedConnectors = mockConnectors.filter(c => c.status === 'connected').length;
  const errorConnectors = mockConnectors.filter(c => c.status === 'error').length;
  const burnoutEngineers = mockOnCallMetrics.filter(e => e.pages_this_week > 5);
  const avgReadiness = Math.round(
    mockReadiness.reduce((acc, r) => acc + r.overall_score, 0) / mockReadiness.length,
  );

  return (
    <div className="space-y-6">

      {/* ── Welcome Bar ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <span className="bg-clip-text text-transparent gradient-brand">BugPilot</span>
            <span className="text-muted-foreground font-normal">·</span>
            <span>{mockOrg.name}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
            {' · '}
            {activeIncidents.length > 0
              ? `${activeIncidents.length} active incident${activeIncidents.length > 1 ? 's' : ''}`
              : 'All systems nominal'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-8 text-xs"
            onClick={() => navigate('/reports')}
          >
            <BarChart2 className="h-3.5 w-3.5" /> Reports
          </Button>
          <Button
            size="sm"
            className="gap-1.5 h-8 text-xs gradient-brand border-0 text-primary-foreground hover:opacity-90"
            onClick={() => setDeclareOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" /> Declare Incident
          </Button>
        </div>
      </motion.div>

      {/* ── On-call Burnout Warning ────────────────────────────────────────────── */}
      {burnoutEngineers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-start gap-3 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5"
        >
          <Users className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-foreground">On-call burnout risk: </span>
            <span className="text-sm text-muted-foreground">
              {burnoutEngineers
                .map(e => `${e.engineer} (${e.pages_this_week} pages/wk)`)
                .join(', ')}{' '}
              — consider rotating on-call.
            </span>
          </div>
        </motion.div>
      )}

      {/* ── Health Strip — 4 KPI cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <MetricCard
            label="MTTR (30d)"
            value={`${mockReportMetrics.mttr_minutes}m`}
            sub="Mean time to resolve"
            trend={`${Math.abs(mockReportMetrics.mttr_trend)}%`}
            trendUp={mockReportMetrics.mttr_trend > 0}
            icon={Clock}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}>
          <MetricCard
            label="Active Incidents"
            value={activeIncidents.length}
            sub={`${activeIncidents.filter(i => i.severity === 'P0').length} P0 · ${activeIncidents.filter(i => i.severity === 'P1').length} P1`}
            icon={AlertTriangle}
            accent={activeIncidents.some(i => i.severity === 'P0') ? 'border-severity-p0/30' : undefined}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <MetricCard
            label="Fix Approvals Pending"
            value={pendingFixes}
            sub="Awaiting review"
            icon={ClipboardCheck}
            accent={pendingFixes > 0 ? 'border-yellow-500/25' : undefined}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
          <MetricCard
            label="SLO Violations"
            value={sloViolations}
            sub="Active budget burns"
            icon={Shield}
            accent={sloViolations > 0 ? 'border-severity-p0/25' : undefined}
          />
        </motion.div>
      </div>

      {/* ── Main Content Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Left 2/3 — Live Incidents + Recent Resolutions */}
        <div className="xl:col-span-2 space-y-5">

          {/* Live Incidents */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  {activeIncidents.length > 0 ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-severity-p0 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-severity-p0" />
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  )}
                </span>
                Live Incidents
                {activeIncidents.length > 0 && (
                  <span className="ml-1 text-xs font-medium px-1.5 py-0.5 rounded-full bg-severity-p0/10 text-severity-p0">
                    {activeIncidents.length}
                  </span>
                )}
              </h2>
              <button
                onClick={() => navigate('/incidents')}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {activeIncidents.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">All clear</p>
                <p className="text-xs text-muted-foreground">No active incidents at this time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeIncidents.map((inc, i) => (
                  <motion.div
                    key={inc.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                  >
                    <LiveIncidentCard inc={inc} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Resolutions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Recent Resolutions
              </h2>
            </div>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {resolvedIncidents.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">No resolved incidents yet.</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2 uppercase tracking-wider">Severity</th>
                      <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2 uppercase tracking-wider">Incident</th>
                      <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2 uppercase tracking-wider">Resolved</th>
                      <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2 uppercase tracking-wider">MTTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolvedIncidents.map((inc, i) => (
                      <motion.tr
                        key={inc.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        onClick={() => navigate(`/incidents/${inc.id}`)}
                        className="border-b border-border/50 last:border-0 hover:bg-surface-hover cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-3">
                          <SeverityBadge severity={inc.severity} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-muted-foreground">{inc.short_id}</span>
                            <span className="text-sm text-foreground group-hover:text-primary transition-colors truncate max-w-[220px]">
                              {inc.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {inc.resolved_at ? getTimeAgo(inc.resolved_at) : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                          {inc.time_to_resolve_secs ? getMTTRLabel(inc.time_to_resolve_secs) : '—'}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right 1/3 — Connectors, DORA, On-call, Quick Actions */}
        <div className="space-y-4">

          {/* Connector Health */}
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.22 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Connector Health
              </h2>
              <button
                onClick={() => navigate('/integrations')}
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                Manage <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {connectedConnectors} connected
              </span>
              {errorConnectors > 0 && (
                <span className="flex items-center gap-1.5 text-severity-p0">
                  <span className="h-1.5 w-1.5 rounded-full bg-severity-p0" />
                  {errorConnectors} error
                </span>
              )}
            </div>

            <div className="space-y-1">
              {mockConnectors.map(c => (
                <div
                  key={c.id}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/integrations/${c.slug}`)}
                >
                  <span className={cn('h-2 w-2 rounded-full flex-shrink-0', connectorDotClass(c.status))} />
                  <span className="text-xs text-foreground flex-1 min-w-0 truncate">{c.name}</span>
                  {c.status === 'error' && <AlertCircle className="h-3.5 w-3.5 text-severity-p0 flex-shrink-0" />}
                  {c.status === 'stale' && <Clock className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />}
                  {c.status === 'connected' && c.last_sync && (
                    <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">{c.last_sync}</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* DORA Snapshot */}
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.28 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                DORA Snapshot
              </h2>
              <button
                onClick={() => navigate('/reports')}
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                Full report <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                {
                  label: 'Deploy Frequency',
                  value: `${mockDoraMetrics.deployment_frequency}/day`,
                  trend: mockDoraMetrics.deployment_frequency_trend,
                  positiveIsUp: true,
                },
                {
                  label: 'Change Failure Rate',
                  value: `${mockDoraMetrics.change_failure_rate}%`,
                  trend: mockDoraMetrics.change_failure_rate_trend,
                  positiveIsUp: false,
                },
                {
                  label: 'MTTR',
                  value: `${mockDoraMetrics.mttr_minutes}m`,
                  trend: mockDoraMetrics.mttr_trend,
                  positiveIsUp: false,
                },
                {
                  label: 'Change Lead Time',
                  value: `${mockDoraMetrics.change_lead_time_hours}h`,
                  trend: mockDoraMetrics.change_lead_time_trend,
                  positiveIsUp: false,
                },
              ].map(row => {
                const isGood = row.positiveIsUp ? row.trend > 0 : row.trend < 0;
                return (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{row.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-foreground">{row.value}</span>
                      <span className={cn('text-[11px] font-medium', isGood ? 'text-emerald-500' : 'text-severity-p0')}>
                        {row.trend > 0 ? '▲' : '▼'} {Math.abs(row.trend)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* On-call Metrics */}
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.33 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              On-call This Week
            </h2>
            <div className="space-y-1.5">
              {mockOnCallMetrics.map(m => {
                const isBurnt = m.pages_this_week > 5;
                return (
                  <div
                    key={m.engineer}
                    className={cn(
                      'flex items-center justify-between px-2 py-1.5 rounded-lg',
                      isBurnt
                        ? 'bg-yellow-500/5 border border-yellow-500/20'
                        : 'hover:bg-secondary/30 transition-colors',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-primary">
                          {m.engineer.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <span className="text-xs text-foreground">{m.engineer.split(' ')[0]}</span>
                      {isBurnt && <Flame className="h-3 w-3 text-yellow-500" />}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn('text-[11px] font-medium', isBurnt ? 'text-yellow-500' : 'text-foreground')}>
                        {m.pages_this_week} pages
                      </span>
                      <span className="text-[11px] text-muted-foreground">MTTA {m.mtta_minutes}m</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.38 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <h2 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Declare Incident', icon: Plus, action: () => setDeclareOpen(true), primary: true },
                { label: 'View Topology', icon: Map, action: () => navigate('/topology') },
                { label: 'View Reports', icon: BarChart2, action: () => navigate('/reports') },
                { label: 'Check Readiness', icon: ClipboardCheck, action: () => navigate('/readiness') },
              ].map(qa => (
                <button
                  key={qa.label}
                  onClick={qa.action}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98]',
                    qa.primary
                      ? 'gradient-brand border-0 text-primary-foreground'
                      : 'border-border bg-secondary/30 text-foreground hover:bg-secondary',
                  )}
                >
                  <qa.icon className="h-4 w-4" />
                  {qa.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── System Health Summary ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <h2 className="text-sm font-semibold text-foreground mb-4">System Health Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className={cn(
              'text-2xl font-bold mb-1',
              connectedConnectors === mockConnectors.length
                ? 'text-emerald-500'
                : errorConnectors > 0
                ? 'text-severity-p0'
                : 'text-yellow-500',
            )}>
              {connectedConnectors}/{mockConnectors.length}
            </div>
            <div className="text-xs text-muted-foreground">Connectors Online</div>
          </div>
          <div>
            <div className={cn(
              'text-2xl font-bold mb-1',
              avgReadiness >= 80 ? 'text-emerald-500' : avgReadiness >= 60 ? 'text-yellow-500' : 'text-severity-p0',
            )}>
              {avgReadiness}%
            </div>
            <div className="text-xs text-muted-foreground">Avg Readiness Score</div>
          </div>
          <div>
            <div className={cn('text-2xl font-bold mb-1', sloViolations > 0 ? 'text-severity-p0' : 'text-emerald-500')}>
              {sloViolations}
            </div>
            <div className="text-xs text-muted-foreground">Active SLO Violations</div>
          </div>
          <div>
            <div className={cn('text-2xl font-bold mb-1', pendingFixes > 0 ? 'text-yellow-500' : 'text-emerald-500')}>
              {pendingFixes}
            </div>
            <div className="text-xs text-muted-foreground">Fixes Awaiting Approval</div>
          </div>
        </div>

        {/* Per-service readiness pills */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Service Readiness</p>
          <div className="flex gap-1.5 flex-wrap">
            {mockReadiness.map(r => (
              <div
                key={r.service_id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/50 border border-border/50 cursor-pointer hover:bg-secondary transition-colors"
                onClick={() => navigate(`/readiness/${r.service_id}`)}
              >
                <span className={cn(
                  'h-1.5 w-1.5 rounded-full flex-shrink-0',
                  r.overall_score >= 80 ? 'bg-emerald-500' : r.overall_score >= 60 ? 'bg-yellow-500' : 'bg-severity-p0',
                )} />
                <span className="text-[11px] text-foreground">{r.service_name}</span>
                <span className="text-[11px] text-muted-foreground">{r.overall_score}%</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <DeclareIncidentDialog open={declareOpen} onOpenChange={setDeclareOpen} />
    </div>
  );
}
