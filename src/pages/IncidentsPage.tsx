import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockIncidents } from '@/data/mock-data';
import { SeverityBadge } from '@/components/bugpilot/SeverityBadge';
import { StatusBadge } from '@/components/bugpilot/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Shield,
  ArrowRight,
  Activity,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { IncidentStatus, Severity } from '@/types/bugpilot';
import { DeclareIncidentDialog } from '@/components/bugpilot/DeclareIncidentDialog';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTimeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getDuration(inc: typeof mockIncidents[0]) {
  const end = inc.resolved_at ? new Date(inc.resolved_at).getTime() : Date.now();
  const mins = Math.floor((end - new Date(inc.detected_at).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

function getDurationMins(inc: typeof mockIncidents[0]) {
  const end = inc.resolved_at ? new Date(inc.resolved_at).getTime() : Date.now();
  return Math.floor((end - new Date(inc.detected_at).getTime()) / 60000);
}

function getMTTRLabel(secs: number) {
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function envBadgeClass(env: string) {
  if (env === 'production') return 'bg-severity-p0/10 text-severity-p0 border-severity-p0/20';
  if (env === 'staging') return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
  return 'bg-secondary text-secondary-foreground border-border/50';
}

function tagColor(tag: string) {
  const palette = [
    'bg-blue-500/10 text-blue-600 border-blue-500/20',
    'bg-purple-500/10 text-purple-600 border-purple-500/20',
    'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    'bg-orange-500/10 text-orange-600 border-orange-500/20',
    'bg-pink-500/10 text-pink-600 border-pink-500/20',
  ];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash + tag.charCodeAt(i)) % palette.length;
  return palette[hash];
}

function durationColor(mins: number) {
  if (mins < 30) return 'text-emerald-400';
  if (mins < 120) return 'text-severity-p2';
  if (mins < 360) return 'text-severity-p1';
  return 'text-severity-p0';
}

const ACTIVE_STATUSES = ['detected', 'investigating', 'identified', 'mitigating'];

type SortKey = 'detected_at' | 'severity' | 'duration';

const SEVERITY_ORDER: Record<Severity, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

// ─── Derived option lists ─────────────────────────────────────────────────────

const ALL_ENVIRONMENTS = Array.from(new Set(mockIncidents.map(i => i.environment))).sort();
const ALL_SERVICES = Array.from(new Set(mockIncidents.flatMap(i => i.affected_services))).sort();
const ALL_ICS = Array.from(
  new Map(mockIncidents.filter(i => i.ic).map(i => [i.ic!.id, i.ic!.name])).entries(),
).map(([id, name]) => ({ id, name }));

// ─── Severity pill config ────────────────────────────────────────────────────

const SEVERITY_PILL_CONFIG: Record<Severity | 'all', { label: string; activeClass: string }> = {
  all: { label: 'All', activeClass: 'bg-background text-foreground shadow-sm' },
  P0: { label: 'P0', activeClass: 'bg-severity-p0/15 text-severity-p0 border border-severity-p0/30 shadow-sm' },
  P1: { label: 'P1', activeClass: 'bg-severity-p1/15 text-severity-p1 border border-severity-p1/30 shadow-sm' },
  P2: { label: 'P2', activeClass: 'bg-severity-p2/15 text-severity-p2 border border-severity-p2/30 shadow-sm' },
  P3: { label: 'P3', activeClass: 'bg-severity-p3/15 text-severity-p3 border border-severity-p3/30 shadow-sm' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function IncidentsPage() {
  const navigate = useNavigate();

  // Basic filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [declareOpen, setDeclareOpen] = useState(false);

  // Advanced filters
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [envFilter, setEnvFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [icFilter, setIcFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('detected_at');

  // Derived stats
  const activeCount = mockIncidents.filter(i => ACTIVE_STATUSES.includes(i.status)).length;
  const resolvedCount = mockIncidents.filter(i => i.status === 'resolved').length;
  const closedCount = mockIncidents.filter(i => ['closed', 'postmortem'].includes(i.status)).length;
  const sloViolationCount = mockIncidents.filter(i => i.slo_violated).length;
  const p0Incident = mockIncidents.find(i => i.severity === 'P0' && ACTIVE_STATUSES.includes(i.status));

  // Has any advanced filter active
  const hasAdvancedFilters = envFilter !== 'all' || serviceFilter !== 'all' || icFilter !== 'all';

  const filtered = useMemo(() => {
    let list = mockIncidents.filter(inc => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'investigating') {
          if (!ACTIVE_STATUSES.includes(inc.status)) return false;
        } else {
          if (inc.status !== statusFilter) return false;
        }
      }
      if (severityFilter !== 'all' && inc.severity !== severityFilter) return false;
      if (envFilter !== 'all' && inc.environment !== envFilter) return false;
      if (serviceFilter !== 'all' && !inc.affected_services.includes(serviceFilter)) return false;
      if (icFilter !== 'all' && inc.ic?.id !== icFilter) return false;
      if (
        search &&
        !inc.title.toLowerCase().includes(search.toLowerCase()) &&
        !inc.short_id.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'severity') return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (sortBy === 'duration') {
        const aDur = (a.resolved_at ? new Date(a.resolved_at).getTime() : Date.now()) - new Date(a.detected_at).getTime();
        const bDur = (b.resolved_at ? new Date(b.resolved_at).getTime() : Date.now()) - new Date(b.detected_at).getTime();
        return bDur - aDur;
      }
      // default: detected_at desc
      return new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime();
    });

    return list;
  }, [search, statusFilter, severityFilter, envFilter, serviceFilter, icFilter, sortBy]);

  const statusTabs = [
    { key: 'all' as const, label: 'All', count: mockIncidents.length, icon: Activity },
    { key: 'investigating' as const, label: 'Active', count: activeCount, icon: AlertTriangle },
    { key: 'resolved' as const, label: 'Resolved', count: resolvedCount, icon: CheckCircle2 },
    { key: 'closed' as const, label: 'Closed', count: closedCount, icon: XCircle },
  ];

  function clearAllFilters() {
    setSearch('');
    setStatusFilter('all');
    setSeverityFilter('all');
    setEnvFilter('all');
    setServiceFilter('all');
    setIcFilter('all');
    setSortBy('detected_at');
  }

  return (
    <div className="space-y-5">

      {/* Active P0 banner — full-width, high impact */}
      {p0Incident && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden flex items-center gap-4 px-5 py-3.5 rounded-xl border border-severity-p0/40 bg-severity-p0/8"
          style={{ backgroundColor: 'rgba(239,68,68,0.07)' }}
        >
          {/* Animated left accent bar */}
          <div className="absolute left-0 inset-y-0 w-1 bg-severity-p0 rounded-l-xl" />
          <div className="relative ml-2 flex items-center gap-2 shrink-0">
            <div className="relative h-3 w-3">
              <div className="h-3 w-3 rounded-full bg-severity-p0" />
              <div className="absolute inset-0 rounded-full bg-severity-p0 animate-ping opacity-60" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-severity-p0">P0 Active</span>
          </div>
          <div className="h-4 w-px bg-severity-p0/30" />
          <div className="flex-1 min-w-0">
            <span className="text-sm text-foreground font-medium">
              {p0Incident.title}
            </span>
            <span className="ml-2 font-mono text-[11px] text-severity-p0/70">{p0Incident.short_id}</span>
          </div>
          {p0Incident.customer_impact && (
            <span className="hidden md:block text-[11px] text-muted-foreground italic truncate max-w-[200px]">
              {p0Incident.customer_impact}
            </span>
          )}
          <Button
            size="sm"
            className="gap-1.5 h-8 bg-severity-p0/15 hover:bg-severity-p0/25 text-severity-p0 border border-severity-p0/30 flex-shrink-0 font-medium text-xs"
            variant="ghost"
            onClick={() => navigate(`/incidents/${p0Incident.id}`)}
          >
            Investigate <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </motion.div>
      )}

      {/* Header: Page title + summary stats + declare button */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight mb-1">Incidents</h1>
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
              <span className="text-muted-foreground">
                <span className="font-mono font-bold text-foreground">{mockIncidents.length}</span> total
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={cn('h-2 w-2 rounded-full', activeCount > 0 ? 'bg-severity-p0 animate-pulse' : 'bg-muted-foreground/40')} />
              <span className="text-muted-foreground">
                <span className={cn('font-mono font-bold', activeCount > 0 ? 'text-severity-p0' : 'text-foreground')}>{activeCount}</span> active
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <span className="text-muted-foreground">
                <span className="font-mono font-bold text-foreground">{resolvedCount}</span> resolved
              </span>
            </div>
            {sloViolationCount > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-severity-p0/10 border border-severity-p0/20">
                <Shield className="h-3 w-3 text-severity-p0" />
                <span className="text-severity-p0 font-medium">
                  <span className="font-mono font-bold">{sloViolationCount}</span> SLO violations
                </span>
              </div>
            )}
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setDeclareOpen(true)}
          className="gap-2 h-9 gradient-brand border-0 text-primary-foreground hover:opacity-90 flex-shrink-0 font-medium"
        >
          <Plus className="h-4 w-4" /> Declare Incident
        </Button>
      </div>

      {/* Search + severity filter + advanced */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-sm min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by title or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 bg-secondary/50 border-border text-sm"
          />
        </div>

        {/* Severity pills with severity-colored active states */}
        <div className="flex items-center bg-secondary/60 rounded-lg p-0.5 border border-border/50 gap-0.5">
          {(['all', 'P0', 'P1', 'P2', 'P3'] as const).map(s => {
            const cfg = SEVERITY_PILL_CONFIG[s];
            const isActive = severityFilter === s;
            return (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-md transition-all font-medium',
                  isActive
                    ? cfg.activeClass
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Advanced Filters toggle */}
        <button
          onClick={() => setAdvancedOpen(v => !v)}
          className={cn(
            'flex items-center gap-1.5 px-3 h-9 rounded-lg border text-xs font-medium transition-colors',
            advancedOpen || hasAdvancedFilters
              ? 'border-primary/50 bg-primary/8 text-primary'
              : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground',
          )}
          style={advancedOpen || hasAdvancedFilters ? { backgroundColor: 'rgba(6,182,212,0.08)' } : {}}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {hasAdvancedFilters && (
            <span className="ml-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
              {[envFilter !== 'all', serviceFilter !== 'all', icFilter !== 'all'].filter(Boolean).length}
            </span>
          )}
          {advancedOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {(search || severityFilter !== 'all' || hasAdvancedFilters) && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-primary transition-colors px-2 h-9"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Advanced Filters panel */}
      <AnimatePresence>
        {advancedOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">Advanced Filters</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Environment */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Environment
                  </label>
                  <select
                    value={envFilter}
                    onChange={e => setEnvFilter(e.target.value)}
                    className="h-8 rounded-md border border-border bg-secondary/50 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">All environments</option>
                    {ALL_ENVIRONMENTS.map(env => (
                      <option key={env} value={env}>{env}</option>
                    ))}
                  </select>
                </div>

                {/* Affected Service */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Affected Service
                  </label>
                  <select
                    value={serviceFilter}
                    onChange={e => setServiceFilter(e.target.value)}
                    className="h-8 rounded-md border border-border bg-secondary/50 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">All services</option>
                    {ALL_SERVICES.map(svc => (
                      <option key={svc} value={svc}>{svc}</option>
                    ))}
                  </select>
                </div>

                {/* Incident Commander */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Incident Commander
                  </label>
                  <select
                    value={icFilter}
                    onChange={e => setIcFilter(e.target.value)}
                    className="h-8 rounded-md border border-border bg-secondary/50 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">All ICs</option>
                    {ALL_ICS.map(ic => (
                      <option key={ic.id} value={ic.id}>{ic.name}</option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as SortKey)}
                    className="h-8 rounded-md border border-border bg-secondary/50 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="detected_at">Detected (newest first)</option>
                    <option value="severity">Severity (P0 first)</option>
                    <option value="duration">Duration (longest first)</option>
                  </select>
                </div>
              </div>

              {hasAdvancedFilters && (
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-end">
                  <button
                    onClick={() => { setEnvFilter('all'); setServiceFilter('all'); setIcFilter('all'); }}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    Clear advanced filters <ArrowRight className="h-3 w-3 rotate-[135deg]" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Tabs */}
      <div className="flex items-center gap-0 border-b border-border">
        {statusTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = statusFilter === tab.key || (tab.key === 'all' && statusFilter === 'all');
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key === 'all' ? 'all' : tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-primary' : 'text-muted-foreground/60')} />
              {tab.label}
              <span className={cn(
                'text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded-md ml-0.5',
                isActive ? 'bg-primary/15 text-primary' : 'bg-secondary/60 text-muted-foreground',
              )}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-secondary/20">
                <th className="text-left text-[10px] font-bold text-muted-foreground px-3 py-2.5 uppercase tracking-[0.12em]">Sev</th>
                <th className="text-left text-[10px] font-bold text-muted-foreground px-3 py-2.5 uppercase tracking-[0.12em]">Incident</th>
                <th className="text-left text-[10px] font-bold text-muted-foreground px-3 py-2.5 uppercase tracking-[0.12em]">Status</th>
                <th className="text-left text-[10px] font-bold text-muted-foreground px-3 py-2.5 uppercase tracking-[0.12em]">Env</th>
                <th className="text-left text-[10px] font-bold text-muted-foreground px-3 py-2.5 uppercase tracking-[0.12em]">Services</th>
                <th className="text-left text-[10px] font-bold text-muted-foreground px-3 py-2.5 uppercase tracking-[0.12em]">IC</th>
                <th className="text-left text-[10px] font-bold text-muted-foreground px-3 py-2.5 uppercase tracking-[0.12em]">Detected</th>
                <th className="text-left text-[10px] font-bold text-muted-foreground px-3 py-2.5 uppercase tracking-[0.12em]">Duration</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc, i) => {
                const isActive = ACTIVE_STATUSES.includes(inc.status);
                const isResolved = ['resolved', 'closed', 'postmortem'].includes(inc.status);
                const durMins = getDurationMins(inc);
                return (
                  <motion.tr
                    key={inc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                    className="border-b border-border/40 last:border-0 hover:bg-surface-hover cursor-pointer transition-all duration-150 group"
                  >
                    {/* Severity */}
                    <td className="px-3 py-2.5">
                      <SeverityBadge severity={inc.severity} />
                    </td>

                    {/* Incident title + ID stacked */}
                    <td className="px-3 py-2.5 max-w-[340px]">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground font-medium group-hover:text-primary transition-colors leading-snug truncate">
                            {inc.title}
                          </span>
                          {inc.slo_violated && (
                            <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-severity-p0/15 text-severity-p0 font-bold tracking-wide border border-severity-p0/20">
                              SLO
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground/60">{inc.short_id}</span>
                          {inc.customer_impact && (
                            <span className="text-[10px] text-muted-foreground/60 italic truncate max-w-[200px]" title={inc.customer_impact}>
                              {inc.customer_impact}
                            </span>
                          )}
                        </div>
                        {inc.tags && inc.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap mt-0.5">
                            {inc.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', tagColor(tag))}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status pill */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {isActive && (
                          <div className="relative h-1.5 w-1.5 shrink-0">
                            <div className="h-1.5 w-1.5 rounded-full bg-severity-p0" />
                            <div className="absolute inset-0 rounded-full bg-severity-p0 animate-ping opacity-60" />
                          </div>
                        )}
                        <StatusBadge status={inc.status} />
                      </div>
                    </td>

                    {/* Environment */}
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded border font-medium',
                          envBadgeClass(inc.environment),
                        )}
                      >
                        {inc.environment}
                      </span>
                    </td>

                    {/* Services */}
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1 flex-wrap">
                        {inc.affected_services.slice(0, 2).map(s => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground font-mono">
                            {s}
                          </span>
                        ))}
                        {inc.affected_services.length > 2 && (
                          <span className="text-[10px] text-muted-foreground/60">+{inc.affected_services.length - 2}</span>
                        )}
                      </div>
                    </td>

                    {/* IC: avatar initial + first name */}
                    <td className="px-3 py-2.5">
                      {inc.ic ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold text-primary">
                              {inc.ic.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">{inc.ic.name.split(' ')[0]}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </td>

                    {/* Detected */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="text-xs text-muted-foreground font-mono tabular-nums">
                        {getTimeAgo(inc.detected_at)}
                      </span>
                    </td>

                    {/* Duration / MTTR with color coding */}
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <span className={cn('text-xs font-mono tabular-nums font-medium', durationColor(durMins))}>
                          {getDuration(inc)}
                        </span>
                        {isResolved && inc.time_to_resolve_secs && (
                          <span className="text-[10px] text-emerald-500 font-medium">
                            MTTR {getMTTRLabel(inc.time_to_resolve_secs)}
                          </span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-muted-foreground"
          >
            <div className="h-14 w-14 rounded-2xl bg-secondary/60 border border-border flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">No incidents match your filters</p>
            <p className="text-xs text-muted-foreground mb-5 text-center max-w-xs">
              Try adjusting your search query or removing some filters to see more results.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1.5"
              onClick={clearAllFilters}
            >
              <XCircle className="h-3.5 w-3.5" />
              Clear all filters
            </Button>
          </motion.div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-mono font-medium text-foreground">{filtered.length}</span> of{' '}
            <span className="font-mono font-medium text-foreground">{mockIncidents.length}</span> incidents
          </p>
          {filtered.length < mockIncidents.length && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              {mockIncidents.length - filtered.length} filtered out
            </div>
          )}
        </div>
      )}

      <DeclareIncidentDialog open={declareOpen} onOpenChange={setDeclareOpen} />
    </div>
  );
}
