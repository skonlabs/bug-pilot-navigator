import { mockReadiness } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp } from 'lucide-react';

export default function ReadinessPage() {
  const avgScore = Math.round(mockReadiness.reduce((s, r) => s + r.overall_score, 0) / mockReadiness.length);
  const totalGaps = mockReadiness.reduce((s, r) => s + r.gap_count, 0);
  const criticalServices = mockReadiness.filter(r => r.overall_score < 60).length;

  const dimensions = ['Observability', 'Change Tracking', 'Dependencies', 'Incident Ready', 'Documentation'];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">Overall Readiness</span>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <div className="flex items-end gap-3">
            <div className="relative h-16 w-16">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
                <circle cx="50" cy="50" r="38" fill="none" 
                  stroke={avgScore >= 80 ? 'hsl(var(--success))' : avgScore >= 50 ? 'hsl(var(--severity-p2))' : 'hsl(var(--severity-p0))'}
                  strokeWidth="7" strokeLinecap="round" strokeDasharray={`${avgScore * 2.39} 239`} />
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

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border border-border bg-card p-5">
          <span className="text-xs text-muted-foreground">Critical Gaps</span>
          <p className="text-3xl font-bold text-foreground mt-2">{totalGaps}</p>
          <p className="text-xs text-muted-foreground mt-1">across {mockReadiness.length} services</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-5">
          <span className="text-xs text-muted-foreground">At Risk Services</span>
          <p className="text-3xl font-bold text-severity-p0 mt-2">{criticalServices}</p>
          <p className="text-xs text-muted-foreground mt-1">readiness score below 60</p>
        </motion.div>
      </div>

      {/* Services Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Service</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Score</th>
              {dimensions.map(d => (
                <th key={d} className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">{d}</th>
              ))}
              <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Gaps</th>
            </tr>
          </thead>
          <tbody>
            {mockReadiness.sort((a, b) => a.overall_score - b.overall_score).map((r, i) => (
              <motion.tr
                key={r.service_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border/50 last:border-0 hover:bg-surface-hover cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full',
                      r.overall_score >= 80 ? 'bg-success' : r.overall_score >= 50 ? 'bg-severity-p2' : 'bg-severity-p0'
                    )} />
                    <span className="text-sm font-medium text-foreground">{r.service_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={cn('h-full rounded-full',
                        r.overall_score >= 80 ? 'bg-success' : r.overall_score >= 50 ? 'bg-severity-p2' : 'bg-severity-p0'
                      )} style={{ width: `${r.overall_score}%` }} />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground w-6">{r.overall_score}</span>
                  </div>
                </td>
                {Object.values(r.dimensions).map((v, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-8 h-1 rounded-full bg-muted overflow-hidden">
                        <div className={cn('h-full rounded-full',
                          v >= 80 ? 'bg-success' : v >= 50 ? 'bg-severity-p2' : 'bg-severity-p0'
                        )} style={{ width: `${v}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">{v}</span>
                    </div>
                  </td>
                ))}
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-mono font-medium',
                    r.gap_count > 7 ? 'text-severity-p0' : r.gap_count > 3 ? 'text-severity-p2' : 'text-muted-foreground'
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
  );
}
