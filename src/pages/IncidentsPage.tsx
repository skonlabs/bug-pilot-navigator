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

const ACTIVE_STATUSES = ['detected', 'investigating', 'identified', 'mitigating'];

type SortKey = 'detected_at' | 'severity' | 'duration';

const SEVERITY_ORDER: Record<Severity, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

// ─── Derived option lists ─────────────────────────────────────────────────────

const ALL_ENVIRONMENTS = Array.from(new Set(mockIncidents.map(i => i.environment))).sort();
const ALL_SERVICES = Array.from(new Set(mockIncidents.flatMap(i => i.affected_services))).sort();
const ALL_ICS = Array.from(
  new Map(mockIncidents.filter(i => i.ic).map(i => [i.ic!.id, i.ic!.name])).entries(),
).map(([id, name]) => ({ id, name }));

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
    { key: 'all' as const, label: 'All', count: mockIncidents.length },
    { key: 'investigating' as const, label: 'Active', count: activeCount },
    { key: 'resolved' as const, label: 'Resolved', count: resolvedCount },
    { key: 'closed' as const, label: 'Closed', count: closedCount },
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

      {/* Active P0 banner */}
      {p0Incident && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-lg border border-severity-p0/30 bg-severity-p0/5"
        >
          <div className="relative h-2 w-2 flex-shrink-0">
            <div className="h-2 w-2 rounded-full bg-severity-p0" />
            <div className="absolute inset-0 rounded-full bg-severity-p0 animate-ping opacity-75" />
          </div>
          <span className="text-sm text-foreground font-medium flex-1">
            Active P0 incident: <span className="font-mono text-xs text-muted-foreground">{p0Incident.short_id}</span>{' '}
            {p0Incident.title}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-severity-p0 hover:text-severity-p0 gap-1 flex-shrink-0"
            onClick={() => navigate(`/incidents/${p0Incident.id}`)}
          >
            Investigate <ArrowUpRight className="h-3 w-3" />
          </Button>
        </motion.div>
      )}

      {/* Header stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
        <span>
          <strong className="text-foreground">{mockIncidents.length}</strong> total incidents
        </span>
        <span className="text-border">|</span>
        <span>
          <strong className={cn('text-foreground', activeCount > 0 ? 'text-severity-p0' : '')}>{activeCount}</strong> active
        </span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-1">
          <Shield className="h-3.5 w-3.5 text-severity-p0" />
          <strong className={cn('text-foreground', sloViolationCount > 0 ? 'text-severity-p0' : '')}>{sloViolationCount}</strong> SLO violations
        </span>
      </div>

      {/* Search + severity filter + declare button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by title or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 bg-secondary/50 border-border text-sm"
            />
          </div>

          {/* Severity pills */}
          <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-border/50">
            {(['all', 'P0', 'P1', 'P2', 'P3'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-md transition-all font-medium',
                  severityFilter === s
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-secondary-foreground',
                )}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>

          {/* Advanced Filters toggle */}
          <button
            onClick={() => setAdvancedOpen(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 h-9 rounded-lg border text-xs font-medium transition-colors',
              advancedOpen || hasAdvancedFilters
                ? 'border-primary/50 bg-primary/5 text-primary'
                : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground',
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Advanced
            {hasAdvancedFilters && (
              <span className="ml-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                {[envFilter !== 'all', serviceFilter !== 'all', icFilter !== 'all'].filter(Boolean).length}
              </span>
            )}
            {advancedOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        <Button
          size="sm"
          onClick={() => setDeclareOpen(true)}
          className="gap-2 h-9 gradient-brand border-0 text-primary-foreground hover:opacity-90 flex-shrink-0"
        >
          <Plus className="h-4 w-4" /> Declare Incident
        </Button>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Environment */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
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
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
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
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
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
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
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
      <div className="flex items-center gap-1 border-b border-border">
        {statusTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key === 'all' ? 'all' : tab.key)}
            className={cn(
              'px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              statusFilter === tab.key || (tab.key === 'all' && statusFilter === 'all')
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-secondary-foreground hover:border-border',
            )}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-muted-foreground">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Severity</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Incident</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Status</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Env</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Services</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">IC</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Detected</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Duration / MTTR</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc, i) => {
                const isResolved = ['resolved', 'closed', 'postmortem'].includes(inc.status);
                return (
                  <motion.tr
                    key={inc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                    className="border-b border-border/50 last:border-0 hover:bg-surface-hover cursor-pointer transition-colors group"
                  >
                    {/* Severity */}
                    <td className="px-4 py-3">
                      <SeverityBadge severity={inc.severity} />
                    </td>

                    {/* Incident title + tags */}
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2 flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[11px] text-muted-foreground">{inc.short_id}</span>
                          <span className="text-sm text-foreground font-medium group-hover:text-primary transition-colors leading-snug">
                            {inc.title}
                          </span>
                          {inc.slo_violated && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-severity-p0/15 text-severity-p0 font-bold tracking-wide">
                              SLO
                            </span>
                          )}
                        </div>
                        {/* Customer impact tooltip */}
                        {inc.customer_impact && (
                          <span
                            className="text-[11px] text-muted-foreground/80 italic truncate max-w-[320px]"
                            title={inc.customer_impact}
                          >
                            {inc.customer_impact}
                          </span>
                        )}
                        {/* Tags */}
                        {inc.tags && inc.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {inc.tags.map(tag => (
                              <span
                                key={tag}
                                className={cn(
                                  'text-[10px] px-1.5 py-0.5 rounded border font-medium',
                                  tagColor(tag),
                                )}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={inc.status} />
                    </td>

                    {/* Environment */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'text-[11px] px-1.5 py-0.5 rounded border font-medium',
                          envBadgeClass(inc.environment),
                        )}
                      >
                        {inc.environment}
                      </span>
                    </td>

                    {/* Services */}
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {inc.affected_services.slice(0, 2).map(s => (
                          <span key={s} className="text-[11px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                            {s}
                          </span>
                        ))}
                        {inc.affected_services.length > 2 && (
                          <span className="text-[11px] text-muted-foreground">+{inc.affected_services.length - 2}</span>
                        )}
                      </div>
                    </td>

                    {/* IC */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {inc.ic ? (
                          <>
                            <div className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                              <span className="text-[9px] font-bold text-primary">
                                {inc.ic.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">{inc.ic.name.split(' ')[0]}</span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </div>
                    </td>

                    {/* Detected */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                        <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                          {getTimeAgo(inc.detected_at)}
                        </span>
                      </div>
                    </td>

                    {/* Duration / MTTR */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground font-mono">{getDuration(inc)}</span>
                        {isResolved && inc.time_to_resolve_secs && (
                          <span className="text-[10px] text-emerald-600 font-medium">
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

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No incidents found</p>
            <p className="text-xs text-muted-foreground mb-4">Try adjusting your filters or search query</p>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={clearAllFilters}
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          Showing {filtered.length} of {mockIncidents.length} incidents
        </p>
      )}

      <DeclareIncidentDialog open={declareOpen} onOpenChange={setDeclareOpen} />
    </div>
  );
}
