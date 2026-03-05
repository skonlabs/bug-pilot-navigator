import { mockFixes, mockIncidents } from '@/data/mock-data';
import { FixProposalCard } from '@/components/bugpilot/FixProposalCard';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircle, AlertTriangle, Zap, Clock, ChevronDown, X,
  CheckSquare, Square, Filter, ArrowUpDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FixProposal, FixStatus, FixTier, FixRisk, Incident } from '@/types/bugpilot';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabKey = 'proposed' | 'approved' | 'executing' | 'executed' | 'rejected' | 'all';

interface ApprovalModalState {
  fix: FixProposal;
  incident: Incident | undefined;
}

// ─── Local state store for fix statuses (simulated) ───────────────────────────

type FixStatusMap = Record<string, FixStatus>;

// ─── Severity badge helpers ───────────────────────────────────────────────────

const severityClass: Record<string, string> = {
  P0: 'bg-severity-p0/15 text-severity-p0 border border-severity-p0/30',
  P1: 'bg-severity-p1/15 text-severity-p1 border border-severity-p1/30',
  P2: 'bg-severity-p2/15 text-severity-p2 border border-severity-p2/30',
  P3: 'bg-muted text-muted-foreground border border-border',
};

// ─── Approval Modal ───────────────────────────────────────────────────────────

interface ApprovalModalProps {
  state: ApprovalModalState;
  onConfirm: () => void;
  onClose: () => void;
}

function ApprovalModal({ state, onConfirm, onClose }: ApprovalModalProps) {
  const [understood, setUnderstood] = useState(false);
  const { fix, incident } = state;

  const riskColors: Record<FixRisk, string> = {
    low: 'text-confidence-high',
    medium: 'text-severity-p2',
    high: 'text-severity-p1',
    critical: 'text-severity-p0',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.15 }}
        className="relative z-10 w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Approve Fix Execution</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{fix.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Incident context */}
          {incident && (
            <div className="rounded-md bg-muted/50 border border-border px-3 py-2 flex items-center gap-2">
              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', severityClass[incident.severity])}>
                {incident.severity}
              </span>
              <span className="text-xs font-mono font-medium text-muted-foreground">{incident.short_id}</span>
              <span className="text-xs text-foreground truncate">{incident.title}</span>
            </div>
          )}

          {/* Risk warning */}
          <div className={cn(
            'rounded-md border px-3 py-2.5 flex items-start gap-2',
            fix.risk === 'critical' || fix.risk === 'high'
              ? 'bg-severity-p0/5 border-severity-p0/30'
              : fix.risk === 'medium'
                ? 'bg-severity-p2/5 border-severity-p2/30'
                : 'bg-confidence-high/5 border-confidence-high/30',
          )}>
            <AlertTriangle className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', riskColors[fix.risk])} />
            <div>
              <p className={cn('text-xs font-semibold', riskColors[fix.risk])}>
                {fix.risk.charAt(0).toUpperCase() + fix.risk.slice(1)} Risk Fix
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                This fix affects <span className="font-medium text-foreground">{fix.affected_service}</span>.
                {' '}Estimated execution time: <span className="font-medium text-foreground">{fix.estimated_time}</span>.
              </p>
            </div>
          </div>

          {/* Diff preview */}
          {fix.diff_preview && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground">Diff Preview</p>
              <div className="rounded-md overflow-hidden border border-border text-[11px] font-mono bg-[#0d1117] max-h-40 overflow-y-auto">
                {fix.diff_preview.split('\n').map((line, i) => {
                  const isAddition = line.startsWith('+') && !line.startsWith('+++');
                  const isRemoval = line.startsWith('-') && !line.startsWith('---');
                  const isHeader =
                    line.startsWith('@@') || line.startsWith('---') || line.startsWith('+++') || line.startsWith('#');
                  return (
                    <div
                      key={i}
                      className={cn(
                        'px-3 py-0.5 leading-5 whitespace-pre',
                        isAddition && 'bg-[#0d2818] text-[#3fb950]',
                        isRemoval && 'bg-[#2d0e0e] text-[#f85149]',
                        isHeader && 'text-[#8b949e]',
                        !isAddition && !isRemoval && !isHeader && 'text-[#c9d1d9]',
                      )}
                    >
                      {line || ' '}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rollback steps */}
          {fix.rollback_steps && fix.rollback_steps.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground">Rollback Steps</p>
              <ol className="space-y-1">
                {fix.rollback_steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                    <span className="shrink-0 h-4 w-4 rounded-full bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Validation criteria */}
          {fix.validation_criteria && fix.validation_criteria.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground">Validation Criteria</p>
              <div className="rounded-md border border-border overflow-hidden text-xs">
                <table className="w-full">
                  <tbody>
                    {fix.validation_criteria.map((c, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 font-medium text-foreground">{c.check}</td>
                        <td className="px-3 py-2 font-mono text-confidence-high text-[10px]">{c.success_threshold ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Understand checkbox */}
          <button
            onClick={() => setUnderstood(v => !v)}
            className={cn(
              'w-full flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-left transition-all',
              understood
                ? 'border-confidence-high/40 bg-confidence-high/5'
                : 'border-border bg-muted/30 hover:border-border/80',
            )}
          >
            {understood
              ? <CheckSquare className="h-4 w-4 text-confidence-high mt-0.5 shrink-0" />
              : <Square className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            }
            <span className={cn('text-xs leading-relaxed', understood ? 'text-foreground' : 'text-muted-foreground')}>
              I understand the risk, and I authorize BugPilot to execute this fix in the production environment.
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-muted/20">
          <Button size="sm" variant="ghost" onClick={onClose} className="h-8 text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={!understood}
            className="h-8 text-xs px-4"
          >
            <Zap className="h-3 w-3 mr-1.5" />
            Execute Fix
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Filter / Sort controls ───────────────────────────────────────────────────

type SortKey = 'risk' | 'estimated_time' | 'proposed_at';
type FilterState = {
  tier: FixTier | 'all';
  risk: FixRisk | 'all';
  service: string;
  fix_type: FixProposal['fix_type'] | 'all';
};

const RISK_ORDER: Record<FixRisk, number> = { critical: 0, high: 1, medium: 2, low: 3 };

// ─── Statistics bar ───────────────────────────────────────────────────────────

interface StatsBarProps {
  fixes: FixProposal[];
  statusMap: FixStatusMap;
}

function StatsBar({ fixes, statusMap }: StatsBarProps) {
  const getStatus = (f: FixProposal) => statusMap[f.id] ?? f.status;

  const pendingApproval = fixes.filter(f => getStatus(f) === 'proposed' && f.tier === 2).length;
  const executing = fixes.filter(f => getStatus(f) === 'executing').length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const executedToday = fixes.filter(f => {
    if (getStatus(f) !== 'executed') return false;
    if (!f.executed_at) return true; // simulated
    return new Date(f.executed_at) >= today;
  }).length;

  const stats = [
    {
      label: 'Pending Approval',
      value: pendingApproval,
      icon: Clock,
      colorClass: pendingApproval > 0 ? 'text-warning' : 'text-muted-foreground',
      bgClass: pendingApproval > 0 ? 'bg-warning/10' : 'bg-muted/50',
    },
    {
      label: 'Executing',
      value: executing,
      icon: Zap,
      colorClass: executing > 0 ? 'text-primary' : 'text-muted-foreground',
      bgClass: executing > 0 ? 'bg-primary/10' : 'bg-muted/50',
    },
    {
      label: 'Executed Today',
      value: executedToday,
      icon: CheckCircle,
      colorClass: executedToday > 0 ? 'text-confidence-high' : 'text-muted-foreground',
      bgClass: executedToday > 0 ? 'bg-confidence-high/10' : 'bg-muted/50',
    },
  ];

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {stats.map(s => (
        <div key={s.label} className={cn('flex items-center gap-2 rounded-lg px-3 py-1.5', s.bgClass)}>
          <s.icon className={cn('h-3.5 w-3.5', s.colorClass)} />
          <span className={cn('text-sm font-bold tabular-nums', s.colorClass)}>{s.value}</span>
          <span className="text-[11px] text-muted-foreground">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FixesPage() {
  const [tab, setTab] = useState<TabKey>('proposed');
  const [statusMap, setStatusMap] = useState<FixStatusMap>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [approvalModal, setApprovalModal] = useState<ApprovalModalState | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('proposed_at');
  const [filters, setFilters] = useState<FilterState>({
    tier: 'all',
    risk: 'all',
    service: '',
    fix_type: 'all',
  });

  // Merge mock statuses with local overrides
  const getStatus = (fix: FixProposal): FixStatus => statusMap[fix.id] ?? fix.status;

  // Tab definitions
  const tabDefs: { key: TabKey; label: string }[] = [
    { key: 'proposed', label: 'Needs Approval' },
    { key: 'approved', label: 'Approved' },
    { key: 'executing', label: 'Executing' },
    { key: 'executed', label: 'Executed' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all', label: 'All' },
  ];

  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, number> = {
      proposed: 0, approved: 0, executing: 0, executed: 0, rejected: 0, all: mockFixes.length,
    };
    for (const fix of mockFixes) {
      const s = getStatus(fix);
      if (s in counts) counts[s as TabKey]++;
    }
    return counts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusMap]);

  // Unique services for filter
  const allServices = useMemo(
    () => Array.from(new Set(mockFixes.map(f => f.affected_service))).sort(),
    [],
  );

  // Filter + sort
  const filtered = useMemo(() => {
    let result = mockFixes.filter(fix => {
      const s = getStatus(fix);
      if (tab !== 'all' && s !== tab) return false;
      if (filters.tier !== 'all' && fix.tier !== filters.tier) return false;
      if (filters.risk !== 'all' && fix.risk !== filters.risk) return false;
      if (filters.service && fix.affected_service !== filters.service) return false;
      if (filters.fix_type !== 'all' && fix.fix_type !== filters.fix_type) return false;
      return true;
    });

    result = [...result].sort((a, b) => {
      if (sortKey === 'risk') return RISK_ORDER[a.risk] - RISK_ORDER[b.risk];
      if (sortKey === 'estimated_time') return (a.estimated_time_mins ?? 999) - (b.estimated_time_mins ?? 999);
      return new Date(b.proposed_at).getTime() - new Date(a.proposed_at).getTime();
    });

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, filters, sortKey, statusMap]);

  // Bulk approve helpers
  const tier2Pending = filtered.filter(f => f.tier === 2 && getStatus(f) === 'proposed');
  const allTier2Selected = tier2Pending.length > 0 && tier2Pending.every(f => selectedIds.has(f.id));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllTier2 = () => {
    if (allTier2Selected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        tier2Pending.forEach(f => next.delete(f.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        tier2Pending.forEach(f => next.add(f.id));
        return next;
      });
    }
  };

  // Approve a single fix (open modal)
  const handleApproveClick = (fix: FixProposal) => {
    const incident = mockIncidents.find(i => i.id === fix.incident_id);
    setApprovalModal({ fix, incident });
  };

  // Confirm approval from modal
  const handleConfirmApproval = () => {
    if (!approvalModal) return;
    const { fix } = approvalModal;
    setStatusMap(prev => ({ ...prev, [fix.id]: 'executing' }));
    setApprovalModal(null);

    // Simulate execution completing after 3 seconds
    setTimeout(() => {
      setStatusMap(prev => ({ ...prev, [fix.id]: 'executed' }));
    }, 3000);
  };

  // Reject a fix
  const handleReject = (fixId: string) => {
    setStatusMap(prev => ({ ...prev, [fixId]: 'rejected' }));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(fixId);
      return next;
    });
  };

  // Bulk approve selected tier-2
  const handleBulkApprove = () => {
    const toApprove = tier2Pending.filter(f => selectedIds.has(f.id));
    if (toApprove.length === 0) return;
    // Approve first one via modal; in a real app you'd batch them
    handleApproveClick(toApprove[0]);
  };

  const hasActiveFilters =
    filters.tier !== 'all' ||
    filters.risk !== 'all' ||
    filters.service !== '' ||
    filters.fix_type !== 'all';

  const fixTypeOptions: Array<{ value: FixProposal['fix_type'] | 'all'; label: string }> = [
    { value: 'all', label: 'All Types' },
    { value: 'rollback', label: 'Rollback' },
    { value: 'config_change', label: 'Config Change' },
    { value: 'code_fix', label: 'Code Fix' },
    { value: 'flag_change', label: 'Flag Change' },
    { value: 'data_fix', label: 'Data Fix' },
    { value: 'infra', label: 'Infra' },
    { value: 'runbook', label: 'Runbook' },
    { value: 'gap_artifact', label: 'Gap Artifact' },
  ];

  return (
    <div className="space-y-4 max-w-4xl">
      {/* ── Statistics bar ─────────────────────────────────────────────────── */}
      <StatsBar fixes={mockFixes} statusMap={statusMap} />

      {/* ── Header row: tabs + bulk actions ───────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tabs */}
        <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-border/50">
          {tabDefs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-all font-medium',
                tab === t.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-secondary-foreground',
              )}
            >
              {t.label}
              {tabCounts[t.key] > 0 && (
                <span
                  className={cn(
                    'min-w-[16px] h-4 rounded-full text-[10px] font-bold flex items-center justify-center px-1',
                    t.key === 'proposed'
                      ? 'bg-warning/20 text-warning'
                      : t.key === 'executing'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {tabCounts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bulk approve button */}
        {tier2Pending.length > 1 && tab === 'proposed' && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkApprove}
            disabled={selectedIds.size === 0}
            className="h-7 text-xs gap-1.5"
          >
            <Zap className="h-3 w-3" />
            Approve All Tier-2
            {selectedIds.size > 0 && (
              <span className="ml-0.5 bg-primary/20 text-primary rounded-full px-1.5 text-[10px] font-bold">
                {selectedIds.size}
              </span>
            )}
          </Button>
        )}

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(v => !v)}
          className={cn(
            'ml-auto flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-all',
            showFilters || hasActiveFilters
              ? 'border-primary/40 text-primary bg-primary/5'
              : 'border-border text-muted-foreground hover:text-foreground',
          )}
        >
          <Filter className="h-3 w-3" />
          Filters
          {hasActiveFilters && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          )}
          <ChevronDown className={cn('h-3 w-3 transition-transform', showFilters && 'rotate-180')} />
        </button>

        {/* Sort */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowUpDown className="h-3 w-3" />
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value as SortKey)}
            className="bg-transparent text-xs text-muted-foreground border-none outline-none cursor-pointer"
          >
            <option value="proposed_at">Newest</option>
            <option value="risk">Risk (highest)</option>
            <option value="estimated_time">Time (shortest)</option>
          </select>
        </div>
      </div>

      {/* ── Filter panel ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-3 p-3 rounded-lg border border-border bg-muted/30">
              {/* Tier filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground">Tier</span>
                {(['all', 1, 2, 3] as Array<FilterState['tier']>).map(v => (
                  <button
                    key={String(v)}
                    onClick={() => setFilters(f => ({ ...f, tier: v }))}
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-medium border transition-all',
                      filters.tier === v
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {v === 'all' ? 'All' : `T${v}`}
                  </button>
                ))}
              </div>

              {/* Risk filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground">Risk</span>
                {(['all', 'low', 'medium', 'high', 'critical'] as Array<FilterState['risk']>).map(v => (
                  <button
                    key={v}
                    onClick={() => setFilters(f => ({ ...f, risk: v }))}
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-medium border transition-all capitalize',
                      filters.risk === v
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {v === 'all' ? 'All' : v}
                  </button>
                ))}
              </div>

              {/* Service filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground">Service</span>
                <select
                  value={filters.service}
                  onChange={e => setFilters(f => ({ ...f, service: e.target.value }))}
                  className="text-[11px] border border-border rounded px-1.5 py-0.5 bg-background text-foreground outline-none"
                >
                  <option value="">All</option>
                  {allServices.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Type filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground">Type</span>
                <select
                  value={filters.fix_type}
                  onChange={e => setFilters(f => ({ ...f, fix_type: e.target.value as FilterState['fix_type'] }))}
                  className="text-[11px] border border-border rounded px-1.5 py-0.5 bg-background text-foreground outline-none"
                >
                  {fixTypeOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={() => setFilters({ tier: 'all', risk: 'all', service: '', fix_type: 'all' })}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors ml-auto"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tier-2 bulk select bar ─────────────────────────────────────────── */}
      {tier2Pending.length > 1 && tab === 'proposed' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button onClick={toggleAllTier2} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            {allTier2Selected
              ? <CheckSquare className="h-3.5 w-3.5 text-primary" />
              : <Square className="h-3.5 w-3.5" />
            }
            {allTier2Selected ? 'Deselect all Tier-2' : `Select all Tier-2 (${tier2Pending.length})`}
          </button>
        </div>
      )}

      {/* ── Fix list ───────────────────────────────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="space-y-5">
          {filtered.map((fix, i) => {
            const incident = mockIncidents.find(inc => inc.id === fix.incident_id);
            const effectiveStatus = getStatus(fix);
            const isExecutingNow = effectiveStatus === 'executing';
            const isExecutedNow = effectiveStatus === 'executed';
            const isRejectedNow = effectiveStatus === 'rejected';
            const isFailedNow = effectiveStatus === 'failed';
            const isSelectableTier2 = fix.tier === 2 && effectiveStatus === 'proposed';

            const fixWithStatus: FixProposal = { ...fix, status: effectiveStatus };

            return (
              <motion.div
                key={fix.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="space-y-1.5"
              >
                {/* Incident context banner */}
                {incident && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Select checkbox for tier-2 pending */}
                    {isSelectableTier2 && tier2Pending.length > 1 && (
                      <button onClick={() => toggleSelect(fix.id)} className="text-muted-foreground hover:text-foreground">
                        {selectedIds.has(fix.id)
                          ? <CheckSquare className="h-3.5 w-3.5 text-primary" />
                          : <Square className="h-3.5 w-3.5" />
                        }
                      </button>
                    )}
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded',
                        severityClass[incident.severity],
                      )}
                    >
                      {incident.severity}
                    </span>
                    <span className="text-[11px] font-mono font-medium text-muted-foreground">{incident.short_id}</span>
                    <span className="text-[11px] text-muted-foreground">—</span>
                    <span className="text-[11px] text-foreground font-medium truncate max-w-xs">{incident.title}</span>
                    <button className="text-[10px] text-primary hover:underline ml-auto shrink-0">
                      View Investigation →
                    </button>
                  </div>
                )}

                {/* Execution progress overlay for executing state */}
                {isExecutingNow && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-primary font-medium">Executing…</span>
                    <span className="text-muted-foreground">This may take a moment</span>
                  </div>
                )}

                {/* Executed timestamp */}
                {isExecutedNow && (
                  <div className="flex items-center gap-1.5 text-[11px] text-confidence-high">
                    <CheckCircle className="h-3 w-3" />
                    <span className="font-medium">Executed successfully</span>
                    {fix.executed_at && (
                      <span className="text-muted-foreground">
                        · {format(new Date(fix.executed_at), 'MMM d, HH:mm')}
                      </span>
                    )}
                  </div>
                )}

                {/* Rejected state note */}
                {isRejectedNow && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <X className="h-3 w-3" />
                    <span>Fix rejected</span>
                  </div>
                )}

                {/* Failed state note */}
                {isFailedNow && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <AlertTriangle className="h-3 w-3 text-severity-p0" />
                    <span className="text-severity-p0 font-medium">Execution failed</span>
                    <button className="text-primary hover:underline">Rollback</button>
                  </div>
                )}

                <FixProposalCard
                  fix={fixWithStatus}
                  onApprove={() => handleApproveClick(fix)}
                  onReject={() => handleReject(fix.id)}
                />
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-muted-foreground"
        >
          <div className="h-14 w-14 rounded-full bg-confidence-high/10 flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-confidence-high" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">All clear!</p>
          <p className="text-xs text-muted-foreground">
            {hasActiveFilters
              ? 'No fixes match the current filters.'
              : tab === 'proposed'
                ? 'No fixes awaiting approval.'
                : `No ${tab} fixes.`}
          </p>
          {hasActiveFilters && (
            <button
              onClick={() => setFilters({ tier: 'all', risk: 'all', service: '', fix_type: 'all' })}
              className="mt-3 text-xs text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </motion.div>
      )}

      {/* ── Approval modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {approvalModal && (
          <ApprovalModal
            state={approvalModal}
            onConfirm={handleConfirmApproval}
            onClose={() => setApprovalModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
