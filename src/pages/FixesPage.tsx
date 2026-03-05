import { mockFixes, mockIncidents } from '@/data/mock-data';
import { FixProposalCard } from '@/components/bugpilot/FixProposalCard';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

type FilterTab = 'proposed' | 'approved' | 'executed' | 'rejected';

export default function FixesPage() {
  const [tab, setTab] = useState<FilterTab>('proposed');

  const filtered = mockFixes.filter(f => f.status === tab);
  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'proposed', label: 'Needs Approval' },
    { key: 'approved', label: 'Approved' },
    { key: 'executed', label: 'Executed' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-colors',
              tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-surface-hover'
            )}>
            {t.label}
            {t.key === 'proposed' && <span className="ml-1.5 text-xs bg-severity-p0/20 text-severity-p0 px-1.5 py-0.5 rounded font-mono">{mockFixes.filter(f => f.status === 'proposed').length}</span>}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-3 max-w-3xl">
          {filtered.map(fix => {
            const incident = mockIncidents.find(i => i.id === fix.incident_id);
            return (
              <div key={fix.id} className="space-y-1">
                {incident && (
                  <p className="text-xs text-muted-foreground font-mono">
                    {incident.short_id} — {incident.title}
                  </p>
                )}
                <FixProposalCard fix={fix} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <CheckCircle className="h-10 w-10 mb-3 text-confidence-high opacity-50" />
          <p className="text-sm font-medium">No fixes awaiting approval. All clear.</p>
        </div>
      )}
    </div>
  );
}
