import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockIncidents } from '@/data/mock-data';
import { SeverityBadge } from '@/components/bugpilot/SeverityBadge';
import { StatusBadge } from '@/components/bugpilot/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, AlertTriangle } from 'lucide-react';
import type { IncidentStatus, Severity } from '@/types/bugpilot';

export default function IncidentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search incidents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-64 h-9 bg-secondary border-border" />
          </div>
          <div className="flex items-center gap-1">
            {(['all', 'P0', 'P1', 'P2', 'P3'] as const).map(s => (
              <button key={s} onClick={() => setSeverityFilter(s)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${severityFilter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-surface-hover'}`}>
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {(['all', 'detected', 'investigating', 'identified', 'mitigating', 'resolved', 'closed'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 text-xs rounded-md capitalize transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-surface-hover'}`}>
                {s === 'all' ? 'All Status' : s}
              </button>
            ))}
          </div>
        </div>
        <Button size="sm" className="h-9 gap-2">
          <Plus className="h-4 w-4" /> Declare Incident
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Severity</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Incident</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Services</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">IC</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Detected</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Duration</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(inc => (
              <tr key={inc.id} onClick={() => navigate(`/incidents/${inc.id}`)}
                className="border-t border-border hover:bg-surface-hover cursor-pointer transition-colors">
                <td className="px-4 py-3"><SeverityBadge severity={inc.severity} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{inc.short_id}</span>
                    <span className="text-sm text-foreground font-medium">{inc.title}</span>
                    {inc.slo_violated && <span className="text-[10px] px-1 py-0.5 rounded bg-severity-p0/15 text-severity-p0 font-bold">SLO</span>}
                  </div>
                </td>
                <td className="px-4 py-3"><StatusBadge status={inc.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {inc.affected_services.slice(0, 2).map(s => (
                      <span key={s} className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{s}</span>
                    ))}
                    {inc.affected_services.length > 2 && <span className="text-xs text-muted-foreground">+{inc.affected_services.length - 2}</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{inc.ic?.name || 'Unassigned'}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{getTimeAgo(inc.detected_at)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{getDuration(inc)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <AlertTriangle className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No incidents found</p>
            <p className="text-xs mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
