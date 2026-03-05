import { mockAuditLog } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { Shield, Download, Search, Filter } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const ACTION_COLORS: Record<string, string> = {
  'fix.approve': 'text-success',
  'fix.execute': 'text-success',
  'investigation.start': 'text-severity-p3',
  'investigation.complete': 'text-severity-p3',
  'incident.status_change': 'text-primary',
  'connector.auth': 'text-warning',
  'connector.sync': 'text-muted-foreground',
  'packet.view': 'text-muted-foreground',
  'postmortem.edit': 'text-status-identified',
  'member.invite': 'text-warning',
  'member.role_change': 'text-warning',
};

const ACTOR_BADGE: Record<string, string> = {
  user: 'bg-primary/10 text-primary',
  system: 'bg-secondary text-muted-foreground',
  'bugpilot-auto': 'bg-accent/10 text-accent',
};

export default function AuditPage() {
  const [search, setSearch] = useState('');

  const filtered = mockAuditLog.filter(e =>
    !search ||
    e.action_type.includes(search.toLowerCase()) ||
    (e.user_name && e.user_name.toLowerCase().includes(search.toLowerCase())) ||
    (e.resource_type && e.resource_type.includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Audit Log</h2>
          <span className="text-xs text-muted-foreground">(immutable — append only)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search audit events..."
              className="pl-8 h-8 text-xs w-64"
            />
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Export JSON
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="border-b border-border bg-secondary/30">
            <tr>
              <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Timestamp</th>
              <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Actor</th>
              <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Action</th>
              <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Resource</th>
              <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">IP</th>
              <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Detail</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, i) => (
              <motion.tr
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
              >
                <td className="px-4 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                  {format(new Date(entry.created_at), 'MMM d, HH:mm:ss')} UTC
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider', ACTOR_BADGE[entry.actor])}>
                      {entry.actor}
                    </span>
                    {entry.user_name && <span className="text-foreground font-medium">{entry.user_name}</span>}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className={cn('font-mono font-medium', ACTION_COLORS[entry.action_type] || 'text-muted-foreground')}>
                    {entry.action_type}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground capitalize">
                  {entry.resource_type?.replace('_', ' ')}
                </td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground/60">
                  {entry.ip_address || '—'}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground max-w-xs">
                  {entry.metadata && Object.entries(entry.metadata).map(([k, v]) => (
                    <span key={k} className="mr-2">
                      <span className="text-muted-foreground/50">{k}:</span>{' '}
                      <span className="text-foreground/70">{String(v)}</span>
                    </span>
                  ))}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Showing {filtered.length} of {mockAuditLog.length} entries · Audit log is retained for 2 years · SIEM export available
      </p>
    </div>
  );
}
