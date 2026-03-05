import { useState, useEffect } from 'react';
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
  Minus,
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

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVE_STATUSES = ['detected', 'investigating', 'identified', 'mitigating'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getElapsed(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: false });
}

function getMTTRLabel(secs: number): string {
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function connectorDotClass(status: string): string {
  if (status === 'connected') return 'bg-emerald-500';
  if (status === 'error') return 'bg-severity-p0';
  if (status === 'stale') return 'bg-yellow-500';
  return 'bg-muted-foreground/30';
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground', className)}>
      {children}
    </span>
  );
}

// ─── KPI Metric Card ──────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string | number;
  sub: string;
  trend?: number;         // positive = up, negative = down
  goodWhenDown?: boolean; // true = going down is good (e.g. MTTR)
  accentColor?: string;   // tailwind border color class
  bgAccent?: string;
}

function MetricCard({ label, value, sub, trend, goodWhenDown, accentColor, bgAccent }: MetricCardProps) {
  const trendGood =
    trend === undefined
      ? null
      : goodWhenDown
      ? trend < 0
      : trend > 0;

  const TrendIcon =
    trend === undefined || trend === 0
      ? Minus
      : trend > 0
      ? TrendingUp
      : TrendingDown;

  return (
    <div
      className={cn(
        'relative rounded-xl border bg-card p-4 flex flex-col gap-2 overflow-hidden transition-all hover:border-border/80',
        accentColor ?? 'border-border',
      )}
    >
      {/* Left accent stripe */}
      {accentColor && (
        <div className={cn('absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl', bgAccent)} />
      )}

      <div className="flex items-center justify-between pl-1">
        <SectionHeader>{label}</SectionHeader>
        {trend !== undefined && (
          <span
            className={cn(
              'flex items-center gap-0.5 text-[11px] font-semibold tabular-nums',
              trendGood === true
                ? 'text-emerald-500'
                : trendGood === false
                ? 'text-severity-p0'
                : 'text-muted-foreground',
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div className="pl-1">
        <div className="text-3xl font-bold font-mono tabular-nums text-foreground leading-none">
          {value}
        </div>
        <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
      </div>
    </div>
  );
}

// ─── Live Incident Card ───────────────────────────────────────────────────────

function LiveIncidentCard({ inc }: { inc: typeof mockIncidents[0] }) {
  const navigate = useNavigate();
  const isP0 = inc.severity === 'P0';
  const isP1 = inc.severity === 'P1';
  const hasBurn = inc.burn_rate !== undefined && inc.burn_rate > 5;
  const budgetConsumed = inc.error_budget_consumed ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => navigate(`/incidents/${inc.id}`)}
      className={cn(
        'relative rounded-xl border bg-card cursor-pointer group overflow-hidden',
        'transition-all hover:border-border/80 hover:bg-surface-hover',
        isP0 ? 'border-severity-p0/40' : isP1 ? 'border-severity-p1/25' : 'border-border',
      )}
    >
      {/* P0 left border glow */}
      {isP0 && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-severity-p0 rounded-l-xl" />
      )}

      <div className="px-4 py-3 pl-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Pulsing severity dot */}
            <div className="mt-[5px] flex-shrink-0 relative h-2 w-2">
              <span
                className={cn(
                  'relative inline-flex rounded-full h-2 w-2',
                  isP0 ? 'bg-severity-p0' : isP1 ? 'bg-severity-p1' : 'bg-severity-p2',
                )}
              />
              {isP0 && (
                <span className="absolute inset-0 rounded-full bg-severity-p0 animate-ping opacity-75" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              {/* Meta row */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                  {inc.short_id}
                </span>
                <SeverityBadge severity={inc.severity} />
                {inc.environment && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono">
                    {inc.environment}
                  </span>
                )}
                {inc.slo_violated && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-severity-p0/15 text-severity-p0 font-bold tracking-wider">
                    SLO BURN
                  </span>
                )}
              </div>

              {/* Title */}
              <p className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                {inc.title}
              </p>

              {/* Impact */}
              {inc.customer_impact && (
                <p className="text-xs text-muted-foreground mt-0.5 italic leading-snug">
                  {inc.customer_impact}
                </p>
              )}

              {/* Services */}
              {inc.affected_services.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {inc.affected_services.slice(0, 3).map(s => (
                    <span
                      key={s}
                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground font-mono"
                    >
                      {s}
                    </span>
                  ))}
                  {inc.affected_services.length > 3 && (
                    <span className="text-[10px] text-muted-foreground self-center">
                      +{inc.affected_services.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right side: status, elapsed, IC, chevron */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <StatusBadge status={inc.status} />
            <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
              {getElapsed(inc.detected_at)}
            </span>
            {inc.ic && (
              <span className="text-[10px] text-muted-foreground">
                IC: <span className="text-foreground">{inc.ic.name.split(' ')[0]}</span>
              </span>
            )}
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors mt-0.5" />
          </div>
        </div>

        {/* SLO Burn rate bar */}
        {hasBurn && (
          <div className="mt-3 border-t border-border/40 pt-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-severity-p0">
                <Flame className="h-3 w-3" />
                <span>Error budget burning at {inc.burn_rate}x rate</span>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                {budgetConsumed}% consumed
              </span>
            </div>
            <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-severity-p1 to-severity-p0"
                style={{ width: `${Math.min(budgetConsumed, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IndexPage() {
  const navigate = useNavigate();
  const [declareOpen, setDeclareOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock — updates every second
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Data derivations
  const activeIncidents = mockIncidents.filter(i => ACTIVE_STATUSES.includes(i.status));
  const p0Incidents = activeIncidents.filter(i => i.severity === 'P0');

  const resolvedIncidents = mockIncidents
    .filter(i => ['resolved', 'closed', 'postmortem'].includes(i.status))
    .sort((a, b) => {
      const aTime = a.resolved_at ? new Date(a.resolved_at).getTime() : 0;
      const bTime = b.resolved_at ? new Date(b.resolved_at).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 5);

  const pendingFixes = mockFixes.filter(f => f.status === 'proposed').length;
  const sloViolations = mockIncidents.filter(
    i => i.slo_violated && ACTIVE_STATUSES.includes(i.status),
  ).length;

  const connectedConnectors = mockConnectors.filter(c => c.status === 'connected').length;
  const errorConnectors = mockConnectors.filter(c => c.status === 'error').length;
  const staleConnectors = mockConnectors.filter(c => c.status === 'stale').length;
  const activeConnectors = mockConnectors.filter(
    c => c.status === 'connected' || c.status === 'error' || c.status === 'stale',
  );

  const burnoutEngineers = mockOnCallMetrics.filter(e => e.pages_this_week > 5);
  const avgReadiness = Math.round(
    mockReadiness.reduce((acc, r) => acc + r.overall_score, 0) / mockReadiness.length,
  );

  const maxPages = Math.max(...mockOnCallMetrics.map(m => m.pages_this_week), 1);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── P0 Alert Banner ──────────────────────────────────────────────────── */}
      {p0Incidents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-severity-p0/50 bg-severity-p0/8 cursor-pointer hover:bg-severity-p0/12 transition-colors"
          onClick={() => navigate(`/incidents/${p0Incidents[0].id}`)}
        >
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="absolute inset-0 rounded-full bg-severity-p0 animate-ping opacity-75" />
            <span className="relative rounded-full h-2.5 w-2.5 bg-severity-p0" />
          </span>
          <span className="text-sm font-bold text-severity-p0 tabular-nums">
            {p0Incidents.length} P0 INCIDENT{p0Incidents.length > 1 ? 'S' : ''}
          </span>
          <span className="text-sm text-foreground font-medium">—</span>
          <span className="text-sm text-foreground truncate">{p0Incidents[0].title}</span>
          {p0Incidents[0].ic && (
            <>
              <span className="text-muted-foreground text-sm hidden sm:inline">·</span>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                IC: {p0Incidents[0].ic.name}
              </span>
            </>
          )}
          <span className="ml-auto font-mono text-sm text-severity-p0 tabular-nums flex-shrink-0">
            {getElapsed(p0Incidents[0].detected_at)} elapsed
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-severity-p0 flex-shrink-0" />
        </motion.div>
      )}

      {/* ── Header / Welcome Bar ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="flex items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              <span className="gradient-brand-text">BugPilot</span>
              <span className="text-muted-foreground font-normal mx-1.5">·</span>
              <span>{mockOrg.name}</span>
            </h1>
            {activeIncidents.length === 0 && (
              <span className="flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                All clear
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {format(currentTime, "EEEE, MMMM d, yyyy")}
            {' · '}
            {activeIncidents.length > 0
              ? `${activeIncidents.length} active incident${activeIncidents.length > 1 ? 's' : ''}`
              : 'No active incidents'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="font-mono text-sm tabular-nums text-muted-foreground hidden md:inline">
            {format(currentTime, 'HH:mm:ss')}
            <span className="text-muted-foreground/40 ml-1">UTC</span>
          </span>
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
            className="gap-1.5 h-8 text-xs gradient-brand border-0 text-white hover:opacity-90 font-semibold"
            onClick={() => setDeclareOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" /> Declare Incident
          </Button>
        </div>
      </motion.div>

      {/* ── On-call Burnout Warning ───────────────────────────────────────────── */}
      {burnoutEngineers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-yellow-500/25 bg-yellow-500/5"
        >
          <Users className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
          <span className="text-xs font-medium text-yellow-500">On-call burnout risk</span>
          <span className="text-xs text-muted-foreground">
            {burnoutEngineers.map(e => `${e.engineer} (${e.pages_this_week} pages/wk)`).join(', ')}
            {' — consider rotating on-call.'}
          </span>
        </motion.div>
      )}

      {/* ── KPI Cards ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <MetricCard
            label="MTTR Trend"
            value={`${mockReportMetrics.mttr_minutes}m`}
            sub="avg this week"
            trend={mockReportMetrics.mttr_trend}
            goodWhenDown
            accentColor="border-primary/25"
            bgAccent="bg-primary"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.11 }}
        >
          <MetricCard
            label="Active Incidents"
            value={activeIncidents.length}
            sub={`${p0Incidents.length} P0 · ${activeIncidents.filter(i => i.severity === 'P1').length} P1`}
            accentColor={activeIncidents.length > 0 ? 'border-severity-p0/35' : 'border-border'}
            bgAccent={activeIncidents.length > 0 ? 'bg-severity-p0' : undefined}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
        >
          <MetricCard
            label="Fix Approvals"
            value={pendingFixes}
            sub="awaiting review"
            accentColor={pendingFixes > 0 ? 'border-yellow-500/30' : 'border-border'}
            bgAccent={pendingFixes > 0 ? 'bg-yellow-500' : undefined}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17 }}
        >
          <MetricCard
            label="SLO Violations"
            value={sloViolations}
            sub="active budget burns"
            accentColor={sloViolations > 0 ? 'border-severity-p0/30' : 'border-border'}
            bgAccent={sloViolations > 0 ? 'bg-severity-p0' : undefined}
          />
        </motion.div>
      </div>

      {/* ── Main 3-Column Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

        {/* ── Left column — ~60% (3/5) ─────────────────────────────────────── */}
        <div className="xl:col-span-3 space-y-5">

          {/* Live Incidents */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
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
                <SectionHeader>Live Incidents</SectionHeader>
                {activeIncidents.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-severity-p0/15 text-severity-p0 tabular-nums">
                    {activeIncidents.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate('/incidents')}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {activeIncidents.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-10 text-center">
                <CheckCircle2 className="h-9 w-9 text-emerald-500 mx-auto mb-3 opacity-80" />
                <p className="text-sm font-semibold text-foreground mb-1">All systems operational</p>
                <p className="text-xs text-muted-foreground">No active incidents. Nice work.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
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
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <SectionHeader>Resolved Recently</SectionHeader>
              </div>
              <button
                onClick={() => navigate('/incidents')}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {resolvedIncidents.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No resolved incidents yet.
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/20">
                      <th className="text-left px-4 py-2.5 w-16">
                        <SectionHeader>Sev</SectionHeader>
                      </th>
                      <th className="text-left px-4 py-2.5">
                        <SectionHeader>Incident</SectionHeader>
                      </th>
                      <th className="text-left px-4 py-2.5 hidden sm:table-cell w-24">
                        <SectionHeader>IC</SectionHeader>
                      </th>
                      <th className="text-right px-4 py-2.5 w-20">
                        <SectionHeader>MTTR</SectionHeader>
                      </th>
                      <th className="text-right px-4 py-2.5 w-28 hidden md:table-cell">
                        <SectionHeader>Resolved</SectionHeader>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolvedIncidents.map((inc, i) => (
                      <motion.tr
                        key={inc.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.04 }}
                        onClick={() => navigate(`/incidents/${inc.id}`)}
                        className="border-b border-border/40 last:border-0 hover:bg-surface-hover cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-2.5">
                          <SeverityBadge severity={inc.severity} />
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                            <span className="font-mono text-[10px] text-muted-foreground tabular-nums flex-shrink-0">
                              {inc.short_id}
                            </span>
                            <span className="text-xs text-foreground group-hover:text-primary transition-colors truncate max-w-[200px]">
                              {inc.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 hidden sm:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {inc.ic ? inc.ic.name.split(' ')[0] : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span className="font-mono text-xs text-muted-foreground tabular-nums">
                            {inc.time_to_resolve_secs ? getMTTRLabel(inc.time_to_resolve_secs) : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right hidden md:table-cell">
                          <span className="text-[11px] text-muted-foreground">
                            {inc.resolved_at
                              ? formatDistanceToNow(new Date(inc.resolved_at), { addSuffix: true })
                              : '—'}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* ── Right column — ~40% (2/5) ─────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">

          {/* System Health Card */}
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.22 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                <SectionHeader>System Health</SectionHeader>
              </div>
              <button
                onClick={() => navigate('/integrations')}
                className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                Manage <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Counts */}
            <div className="flex items-center gap-3 mb-3">
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {connectedConnectors} online
              </span>
              {errorConnectors > 0 && (
                <span className="flex items-center gap-1.5 text-[11px] text-severity-p0 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-severity-p0" />
                  {errorConnectors} error
                </span>
              )}
              {staleConnectors > 0 && (
                <span className="flex items-center gap-1.5 text-[11px] text-yellow-500 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                  {staleConnectors} stale
                </span>
              )}
              <span className="ml-auto text-[11px] text-muted-foreground">
                Readiness avg:{' '}
                <span
                  className={cn(
                    'font-semibold font-mono tabular-nums',
                    avgReadiness >= 80
                      ? 'text-emerald-500'
                      : avgReadiness >= 60
                      ? 'text-yellow-500'
                      : 'text-severity-p0',
                  )}
                >
                  {avgReadiness}%
                </span>
              </span>
            </div>

            {/* Connector grid */}
            <div className="grid grid-cols-3 gap-1">
              {activeConnectors.map(c => (
                <div
                  key={c.id}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer min-w-0"
                  onClick={() => navigate(`/integrations/${c.slug}`)}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', connectorDotClass(c.status))} />
                  <span className="text-[11px] text-foreground truncate">{c.name}</span>
                  {c.status === 'error' && (
                    <AlertCircle className="h-3 w-3 text-severity-p0 flex-shrink-0 ml-auto" />
                  )}
                </div>
              ))}
            </div>

            {/* Service readiness pills */}
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-1.5 mb-2">
                <Shield className="h-3 w-3 text-muted-foreground" />
                <SectionHeader>Service Readiness</SectionHeader>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mockReadiness.map(r => (
                  <div
                    key={r.service_id}
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50 border border-border/40 cursor-pointer hover:bg-secondary transition-colors"
                    onClick={() => navigate(`/readiness/${r.service_id}`)}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full flex-shrink-0',
                        r.overall_score >= 80
                          ? 'bg-emerald-500'
                          : r.overall_score >= 60
                          ? 'bg-yellow-500'
                          : 'bg-severity-p0',
                      )}
                    />
                    <span className="text-[10px] text-foreground">{r.service_name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                      {r.overall_score}%
                    </span>
                  </div>
                ))}
              </div>
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
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                <SectionHeader>DORA Snapshot</SectionHeader>
              </div>
              <button
                onClick={() => navigate('/reports')}
                className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                Full report <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  {
                    label: 'Deploy Freq',
                    value: `${mockDoraMetrics.deployment_frequency}/day`,
                    trend: mockDoraMetrics.deployment_frequency_trend,
                    goodWhenUp: true,
                  },
                  {
                    label: 'Change Fail Rate',
                    value: `${mockDoraMetrics.change_failure_rate}%`,
                    trend: mockDoraMetrics.change_failure_rate_trend,
                    goodWhenUp: false,
                  },
                  {
                    label: 'MTTR',
                    value: `${mockDoraMetrics.mttr_minutes}m`,
                    trend: mockDoraMetrics.mttr_trend,
                    goodWhenUp: false,
                  },
                  {
                    label: 'Lead Time',
                    value: `${mockDoraMetrics.change_lead_time_hours}h`,
                    trend: mockDoraMetrics.change_lead_time_trend,
                    goodWhenUp: false,
                  },
                ] as Array<{ label: string; value: string; trend: number; goodWhenUp: boolean }>
              ).map(row => {
                const isGood = row.goodWhenUp ? row.trend > 0 : row.trend < 0;
                const Icon = row.trend > 0 ? TrendingUp : row.trend < 0 ? TrendingDown : Minus;
                return (
                  <div key={row.label} className="rounded-lg bg-secondary/30 px-3 py-2.5">
                    <div className="text-[10px] text-muted-foreground mb-1">{row.label}</div>
                    <div className="flex items-end justify-between gap-1">
                      <span className="font-mono text-sm font-bold text-foreground tabular-nums">
                        {row.value}
                      </span>
                      <span
                        className={cn(
                          'flex items-center gap-0.5 text-[10px] font-semibold mb-0.5',
                          isGood ? 'text-emerald-500' : 'text-severity-p0',
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {Math.abs(row.trend)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* On-Call Fatigue */}
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.33 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <SectionHeader>On-Call Fatigue</SectionHeader>
            </div>
            <div className="space-y-2">
              {mockOnCallMetrics.map(m => {
                const isBurnt = m.pages_this_week > 5;
                const barPct = Math.round((m.pages_this_week / maxPages) * 100);
                const initials = m.engineer
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('');
                return (
                  <div key={m.engineer} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-[9px] font-bold text-primary">{initials}</span>
                        </div>
                        <span className="text-xs text-foreground">{m.engineer.split(' ')[0]}</span>
                        {isBurnt && <Flame className="h-3 w-3 text-yellow-500" />}
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'font-mono text-[11px] font-medium tabular-nums',
                            isBurnt ? 'text-yellow-500' : 'text-foreground',
                          )}
                        >
                          {m.pages_this_week} pg
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          MTTA {m.mtta_minutes}m
                        </span>
                      </div>
                    </div>
                    <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          isBurnt ? 'bg-yellow-500' : 'bg-primary/50',
                        )}
                        style={{ width: `${barPct}%` }}
                      />
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
            <SectionHeader className="mb-3 block">Quick Actions</SectionHeader>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    label: 'Declare Incident',
                    icon: Plus,
                    action: () => setDeclareOpen(true),
                    primary: true,
                  },
                  {
                    label: 'View Topology',
                    icon: Map,
                    action: () => navigate('/topology'),
                    primary: false,
                  },
                  {
                    label: 'View Reports',
                    icon: BarChart2,
                    action: () => navigate('/reports'),
                    primary: false,
                  },
                  {
                    label: 'Check Readiness',
                    icon: ClipboardCheck,
                    action: () => navigate('/readiness'),
                    primary: false,
                  },
                ] as Array<{ label: string; icon: React.ElementType; action: () => void; primary: boolean }>
              ).map(qa => (
                <button
                  key={qa.label}
                  onClick={qa.action}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border text-[11px] font-semibold',
                    'transition-all hover:scale-[1.02] active:scale-[0.98]',
                    qa.primary
                      ? 'gradient-brand border-transparent text-white'
                      : 'border-border bg-secondary/30 text-foreground hover:bg-secondary hover:border-border/80',
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

      <DeclareIncidentDialog open={declareOpen} onOpenChange={setDeclareOpen} />
    </div>
  );
}
