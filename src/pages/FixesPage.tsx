import { mockFixes, mockIncidents } from '@/data/mock-data';
import { FixProposalCard } from '@/components/bugpilot/FixProposalCard';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

type FilterTab = 'proposed' | 'approved' | 'executed' | 'rejected';

export default function FixesPage() {
  const [tab, setTab] = useState<FilterTab>('proposed');

  const filtered = mockFixes.filter(f => f.status === tab);
  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'proposed', label: 'Needs Approval', count: mockFixes.filter(f => f.status === 'proposed').length },
    { key: 'approved', label: 'Approved', count: 0 },
    { key: 'executed', label: 'Executed', count: 0 },
    { key: 'rejected', label: 'Rejected', count: 0 },
  ];

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-border/50 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-all font-medium',
              tab === t.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-secondary-foreground'
            )}>
            {t.label}
            {t.count > 0 && (
              <span className={cn('min-w-[16px] h-4 rounded-full text-[10px] font-bold flex items-center justify-center px-1',
                t.key === 'proposed' ? 'bg-severity-p0/15 text-severity-p0' : 'bg-muted text-muted-foreground'
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((fix, i) => {
            const incident = mockIncidents.find(inc => inc.id === fix.incident_id);
            return (
              <motion.div
                key={fix.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="space-y-1.5"
              >
                {incident && (
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-mono font-medium">{incident.short_id}</span> — {incident.title}
                  </p>
                )}
                <FixProposalCard fix={fix} />
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
          <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">All clear!</p>
          <p className="text-xs text-muted-foreground">No fixes awaiting approval.</p>
        </motion.div>
      )}
    </div>
  );
}
