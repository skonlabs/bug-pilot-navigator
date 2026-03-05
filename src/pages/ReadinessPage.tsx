import { mockReadiness } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { Gauge } from 'lucide-react';

export default function ReadinessPage() {
  const avgScore = Math.round(mockReadiness.reduce((s, r) => s + r.overall_score, 0) / mockReadiness.length);
  const totalGaps = mockReadiness.reduce((s, r) => s + r.gap_count, 0);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="flex items-center gap-6 p-6 rounded-lg border border-border bg-card">
        <div className="relative h-24 w-24">
          <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle cx="50" cy="50" r="42" fill="none" stroke={avgScore >= 80 ? 'hsl(var(--confidence-high))' : avgScore >= 50 ? 'hsl(var(--severity-p2))' : 'hsl(var(--severity-p0))'} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${avgScore * 2.64} 264`} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{avgScore}</span>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Organization Readiness</h2>
          <p className="text-sm text-muted-foreground mt-1">{mockReadiness.length} services · {totalGaps} critical gaps</p>
        </div>
      </div>

      {/* Services Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Service</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Score</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Observability</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Change Tracking</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Dependencies</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Incident Ready</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Docs</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Gaps</th>
            </tr>
          </thead>
          <tbody>
            {mockReadiness.map(r => (
              <tr key={r.service_id} className="border-t border-border hover:bg-surface-hover cursor-pointer transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{r.service_name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                      <div className={cn('h-full rounded-full', r.overall_score >= 80 ? 'bg-confidence-high' : r.overall_score >= 50 ? 'bg-severity-p2' : 'bg-severity-p0')} style={{ width: `${r.overall_score}%` }} />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{r.overall_score}</span>
                  </div>
                </td>
                {Object.values(r.dimensions).map((v, i) => (
                  <td key={i} className="px-4 py-3">
                    <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={cn('h-full rounded-full', v >= 80 ? 'bg-confidence-high' : v >= 50 ? 'bg-severity-p2' : 'bg-severity-p0')} style={{ width: `${v}%` }} />
                    </div>
                  </td>
                ))}
                <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{r.gap_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
