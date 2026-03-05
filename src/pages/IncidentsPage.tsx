import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockIncidents } from '@/data/mock-data';
import { SeverityBadge } from '@/components/bugpilot/SeverityBadge';
import { StatusBadge } from '@/components/bugpilot/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, AlertTriangle, Clock, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { IncidentStatus, Severity } from '@/types/bugpilot';
import { DeclareIncidentDialog } from '@/components/bugpilot/DeclareIncidentDialog';

export default function IncidentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [declareOpen, setDeclareOpen] = useState(false);

  const filtered = mockIncidents.filter(inc => {
    if (statusFilter !== 'all' && inc.status !== statusFilter) return false;
    if (severityFilter !== 'all' && inc.severity !== severityFilter) return false;
    if (search && !inc.title.toLowerCase().includes(search.toLowerCase()) && !inc.short_id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getDuration = (inc: typeof mockIncidents[0]) => {
    const end = inc.resolved_at ? new Date(inc.resolved_at).getTime() : Date.now();
    const mins = Math.floor((end - new Date(inc.detected_at).getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
  };

  const statusTabs = [
    { key: 'all' as const, label: 'All', count: mockIncidents.length },
    { key: 'investigating' as const, label: 'Active', count: mockIncidents.filter(i => ['detected', 'investigating', 'identified', 'mitigating'].includes(i.status)).length },
    { key: 'resolved' as const, label: 'Resolved', count: mockIncidents.filter(i => i.status === 'resolved').length },
    { key: 'closed' as const, label: 'Closed', count: mockIncidents.filter(i => ['closed', 'postmortem'].includes(i.status)).length },
  ];

  return (
    <div className="space-y-5">
      {/* Active incident banner */}
      {mockIncidents.some(i => i.severity === 'P0' && ['detected', 'investigating'].includes(i.status)) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-lg border border-severity-p0/30 bg-severity-p0/5"
        >
          <div className="h-2 w-2 rounded-full bg-severity-p0 animate-pulse-dot" />
          <span className="text-sm text-foreground font-medium flex-1">
            Active P0 incident requires attention
          </span>
          <Button size="sm" variant="ghost" className="text-xs text-severity-p0 hover:text-severity-p0 gap-1" 
            onClick={() => navigate('/incidents/1')}>
            View <ArrowUpRight className="h-3 w-3" />
          </Button>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Search by title or ID..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9 h-9 bg-secondary/50 border-border text-sm" 
            />
          </div>
          <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-border/50">
            {(['all', 'P0', 'P1', 'P2', 'P3'] as const).map(s => (
              <button key={s} onClick={() => setSeverityFilter(s)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-md transition-all font-medium',
                  severityFilter === s 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-secondary-foreground'
                )}>
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>
        <Button size="sm" onClick={() => setDeclareOpen(true)} className="gap-2 h-9 gradient-brand border-0 text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Declare Incident
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {statusTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key === 'all' ? 'all' : tab.key)}
            className={cn(
              'px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              (statusFilter === tab.key || (tab.key === 'all' && statusFilter === 'all'))
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-secondary-foreground hover:border-border'
            )}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-muted-foreground">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Severity</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Incident</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Status</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Services</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">IC</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Detected</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Duration</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inc, i) => (
              <motion.tr 
                key={inc.id} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/incidents/${inc.id}`)}
                className="border-b border-border/50 last:border-0 hover:bg-surface-hover cursor-pointer transition-colors group"
              >
                <td className="px-4 py-3"><SeverityBadge severity={inc.severity} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">{inc.short_id}</span>
                    <span className="text-sm text-foreground font-medium group-hover:text-primary transition-colors">{inc.title}</span>
                    {inc.slo_violated && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-severity-p0/15 text-severity-p0 font-bold tracking-wide">SLO</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3"><StatusBadge status={inc.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {inc.affected_services.slice(0, 2).map(s => (
                      <span key={s} className="text-[11px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">{s}</span>
                    ))}
                    {inc.affected_services.length > 2 && (
                      <span className="text-[11px] text-muted-foreground">+{inc.affected_services.length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {inc.ic && (
                      <>
                        <div className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-primary">{inc.ic.name.split(' ').map(n => n[0]).join('')}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{inc.ic.name.split(' ')[0]}</span>
                      </>
                    )}
                    {!inc.ic && <span className="text-xs text-muted-foreground/50">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground/50" />
                    <span className="text-xs text-muted-foreground font-mono">{getTimeAgo(inc.detected_at)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{getDuration(inc)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No incidents found</p>
            <p className="text-xs text-muted-foreground mb-4">Try adjusting your filters or search query</p>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => { setSearch(''); setStatusFilter('all'); setSeverityFilter('all'); }}>
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      <DeclareIncidentDialog open={declareOpen} onOpenChange={setDeclareOpen} />
    </div>
  );
}
