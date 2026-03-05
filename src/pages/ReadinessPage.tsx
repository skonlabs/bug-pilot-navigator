import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockReadiness, mockGapArtifacts, mockServices } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  AlertTriangle, TrendingUp, TrendingDown, Download, GitPullRequest,
  ArrowRight, ChevronDown, Info
} from 'lucide-react';

// ─── Dimension config ─────────────────────────────────────────────────────────

const DIMENSIONS = [
  { key: 'observability',       label: 'Observability',     color: 'bg-blue-500',   weight: 25 },
  { key: 'change_tracking',     label: 'Change Tracking',   color: 'bg-purple-500', weight: 20 },
  { key: 'dependency_mapping',  label: 'Dependencies',      color: 'bg-cyan-500',   weight: 20 },
  { key: 'incident_readiness',  label: 'Incident Ready',    color: 'bg-amber-500',  weight: 20 },
  { key: 'documentation',       label: 'Documentation',     color: 'bg-emerald-500',weight: 15 },
] as const;

type DimKey = typeof DIMENSIONS[number]['key'];

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: 'bg-severity-p0/10',   text: 'text-severity-p0',  label: 'Critical' },
  high:     { bg: 'bg-amber-500/10',     text: 'text-amber-400',    label: 'High'     },
  medium:   { bg: 'bg-yellow-500/10',    text: 'text-yellow-400',   label: 'Medium'   },
  low:      { bg: 'bg-muted',            text: 'text-muted-foreground', label: 'Low'  },
};

const ARTIFACT_LABELS: Record<string, string> = {
  pr:          'Pull Request',
  config:      'Config',
  yaml:        'YAML',
  dashboard:   'Dashboard',
  alert_rule:  'Alert Rule',
  runbook:     'Runbook',
  schema:      'Schema',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type HealthFilter = 'all' | 'at_risk' | 'needs_work' | 'healthy';
type SortBy = 'lowest' | 'highest' | 'most_gaps' | 'alpha';

// ─── Score helpers ────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  return s >= 80 ? 'bg-success' : s >= 60 ? 'bg-severity-p2' : 'bg-severity-p0';
}

function scoreDot(s: number) {
  return s >= 80 ? 'bg-success' : s >= 60 ? 'bg-severity-p2' : 'bg-severity-p0';
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function DimTooltip({ label, weight, color }: { label: string; weight: number; color: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span
      className="relative inline-flex items-center gap-1 cursor-default"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span className={cn('h-2 w-2 rounded-full shrink-0', color)} />
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <Info className="h-3 w-3 text-muted-foreground/40" />
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1.5 shadow-xl">
          <p className="text-[11px] text-foreground font-medium">{label}</p>
          <p className="text-[10px] text-muted-foreground">{weight}% of total score</p>
        </div>
      )}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReadinessPage() {
  const navigate = useNavigate();

  const [teamFilter, setTeamFilter]     = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all');
  const [sortBy, setSortBy]             = useState<SortBy>('lowest');

  // Derive unique teams from mockServices
  const teams = useMemo(() => {
    const unique = Array.from(new Set(mockServices.map(s => s.team))).sort();
    return ['all', ...unique];
  }, []);

  // Summary stats (static "simulated" weekly trend numbers)
  const avgScore       = Math.round(mockReadiness.reduce((s, r) => s + r.overall_score, 0) / mockReadiness.length);
  const totalGaps      = mockReadiness.reduce((s, r) => s + r.gap_count, 0);
  const criticalSvcs   = mockReadiness.filter(r => r.overall_score < 60).length;
  const improvedCount  = 3;   // simulated: services improved this week
  const resolvedCount  = 7;   // simulated: critical gaps resolved this month

  // Filtered + sorted rows
  const filtered = useMemo(() => {
    let rows = [...mockReadiness];

    // Team filter — match service_name against mockServices
    if (teamFilter !== 'all') {
      const teamServiceNames = new Set(
        mockServices.filter(s => s.team === teamFilter).map(s => s.name)
      );
      rows = rows.filter(r => teamServiceNames.has(r.service_name));
    }

    // Health filter
    if (healthFilter === 'at_risk')    rows = rows.filter(r => r.overall_score < 60);
    if (healthFilter === 'needs_work') rows = rows.filter(r => r.overall_score >= 60 && r.overall_score < 80);
    if (healthFilter === 'healthy')    rows = rows.filter(r => r.overall_score >= 80);

    // Sort
    if (sortBy === 'lowest')    rows.sort((a, b) => a.overall_score - b.overall_score);
    if (sortBy === 'highest')   rows.sort((a, b) => b.overall_score - a.overall_score);
    if (sortBy === 'most_gaps') rows.sort((a, b) => b.gap_count - a.gap_count);
    if (sortBy === 'alpha')     rows.sort((a, b) => a.service_name.localeCompare(b.service_name));

    return rows;
  }, [teamFilter, healthFilter, sortBy]);

  // Top 5 critical/high gaps
  const priorityGaps = useMemo(() => {
    return [...mockGapArtifacts]
      .filter(g => g.priority === 'critical' || g.priority === 'high')
      .sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return order[a.priority] - order[b.priority];
      })
      .slice(0, 5);
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── Week / Month trend strip ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 text-[12px]">
        <div className="flex items-center gap-1.5 text-success">
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="font-semibold">{improvedCount} services improved</span>
          <span className="text-muted-foreground">this week</span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div className="flex items-center gap-1.5 text-primary">
          <TrendingDown className="h-3.5 w-3.5" />
          <span className="font-semibold">{resolvedCount} critical gaps resolved</span>
          <span className="text-muted-foreground">this month</span>
        </div>
      </div>

      {/* ── Summary Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">Overall Readiness</span>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <div className="flex items-end gap-3">
            <div className="relative h-16 w-16">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="hsl(0 0% 9%)" strokeWidth="7" />
                <circle
                  cx="50" cy="50" r="38" fill="none"
                  stroke={avgScore >= 80 ? 'hsl(152 69% 45%)' : avgScore >= 50 ? 'hsl(45 93% 47%)' : 'hsl(0 84% 60%)'}
                  strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={`${avgScore * 2.39} 239`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-foreground">{avgScore}</span>
              </div>
            </div>
            <div className="pb-1">
              <p className="text-xs text-muted-foreground">{mockReadiness.length} services</p>
              <p className="text-xs text-muted-foreground">{totalGaps} total gaps</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <span className="text-xs text-muted-foreground">Total Gaps</span>
          <p className="text-3xl font-bold text-foreground mt-2">{totalGaps}</p>
          <p className="text-xs text-muted-foreground mt-1">across {mockReadiness.length} services</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <span className="text-xs text-muted-foreground">At Risk Services</span>
          <p className="text-3xl font-bold text-severity-p0 mt-2">{criticalSvcs}</p>
          <p className="text-xs text-muted-foreground mt-1">readiness score below 60</p>
        </motion.div>
      </div>

      {/* ── Dimension Legend ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 px-1">
        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Dimensions:</span>
        {DIMENSIONS.map(d => (
          <DimTooltip key={d.key} label={d.label} weight={d.weight} color={d.color} />
        ))}
      </div>

      {/* ── Filter Bar ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Team */}
        <div className="relative">
          <select
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
            className="appearance-none h-8 pl-3 pr-7 rounded-lg border border-border bg-card text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
          >
            {teams.map(t => (
              <option key={t} value={t}>{t === 'all' ? 'All Teams' : t}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        </div>

        {/* Health */}
        <div className="relative">
          <select
            value={healthFilter}
            onChange={e => setHealthFilter(e.target.value as HealthFilter)}
            className="appearance-none h-8 pl-3 pr-7 rounded-lg border border-border bg-card text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
          >
            <option value="all">All Health</option>
            <option value="at_risk">At Risk (&lt;60)</option>
            <option value="needs_work">Needs Work (60–79)</option>
            <option value="healthy">Healthy (≥80)</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortBy)}
            className="appearance-none h-8 pl-3 pr-7 rounded-lg border border-border bg-card text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
          >
            <option value="lowest">Lowest Score</option>
            <option value="highest">Highest Score</option>
            <option value="most_gaps">Most Gaps</option>
            <option value="alpha">Alphabetical</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        </div>

        <span className="ml-auto text-[11px] text-muted-foreground">{filtered.length} of {mockReadiness.length} services</span>
      </div>

      {/* ── Services Table ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Service</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Score</th>
                {DIMENSIONS.map(d => (
                  <th key={d.key} className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <span className={cn('h-1.5 w-1.5 rounded-full', d.color)} />
                      {d.label}
                    </span>
                  </th>
                ))}
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Gaps</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={DIMENSIONS.length + 3} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No services match the selected filters.
                  </td>
                </tr>
              )}
              {filtered.map((r, i) => (
                <motion.tr
                  key={r.service_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/readiness/${r.service_id}`)}
                  className="border-b border-border/50 last:border-0 hover:bg-surface-hover cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={cn('h-2 w-2 rounded-full shrink-0', scoreDot(r.overall_score))} />
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {r.service_name}
                      </span>
                    </div>
                    {r.last_incident && (
                      <p className="text-[10px] text-muted-foreground/60 ml-4 mt-0.5 flex items-center gap-1">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Last incident {r.last_incident}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', scoreColor(r.overall_score))}
                          style={{ width: `${r.overall_score}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-6">{r.overall_score}</span>
                    </div>
                  </td>
                  {DIMENSIONS.map(d => {
                    const v = r.dimensions[d.key as DimKey];
                    return (
                      <td key={d.key} className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-8 h-1 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', scoreColor(v))}
                              style={{ width: `${v}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">{v}</span>
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-xs font-mono font-medium',
                      r.gap_count > 7 ? 'text-severity-p0' :
                      r.gap_count > 3 ? 'text-severity-p2' :
                      'text-muted-foreground'
                    )}>
                      {r.gap_count}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Priority Gaps Section ────────────────────────────────────────────── */}
      {priorityGaps.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-foreground">Priority Gaps</h2>
            <span className="text-[11px] text-muted-foreground">{mockGapArtifacts.filter(g => g.status === 'open').length} open gaps total</span>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border/50">
            {priorityGaps.map((gap, i) => {
              const pStyle = PRIORITY_STYLES[gap.priority] ?? PRIORITY_STYLES.low;
              const artifactLabel = ARTIFACT_LABELS[gap.artifact_type] ?? gap.artifact_type;
              const svc = mockReadiness.find(r => r.service_id === gap.service_id);
              const dimLabel = DIMENSIONS.find(d => d.key === gap.dimension)?.label ?? gap.dimension;

              return (
                <motion.div
                  key={gap.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-surface-hover transition-colors"
                >
                  {/* Priority badge */}
                  <span className={cn('shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded', pStyle.bg, pStyle.text)}>
                    {pStyle.label}
                  </span>

                  {/* Gap info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-medium text-muted-foreground">{gap.service_name}</span>
                      <span className="text-muted-foreground/30">·</span>
                      <span className="text-[11px] text-muted-foreground">{dimLabel}</span>
                      <span className="text-muted-foreground/30">·</span>
                      <span className="text-[10px] font-mono bg-secondary/50 px-1.5 py-0.5 rounded text-muted-foreground">{artifactLabel}</span>
                    </div>
                    <p className="text-[12px] font-medium text-foreground mt-0.5 truncate">{gap.title}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); }}
                      className="flex items-center gap-1 h-6 px-2.5 rounded-md border border-border/60 bg-secondary/40 hover:bg-secondary text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); }}
                      className="flex items-center gap-1 h-6 px-2.5 rounded-md border border-primary/20 bg-primary/5 hover:bg-primary/10 text-[11px] text-primary transition-colors"
                    >
                      <GitPullRequest className="h-3 w-3" />
                      Create PR
                    </button>
                    {svc && (
                      <button
                        onClick={() => navigate(`/readiness/${gap.service_id}`)}
                        className="flex items-center gap-0.5 h-6 px-2 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                      >
                        View all gaps
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
