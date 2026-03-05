import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ConfidenceBar } from './ConfidenceBar';
import type { Hypothesis } from '@/types/bugpilot';

const statusStyles: Record<string, string> = {
  confirmed: 'bg-confidence-high/15 text-confidence-high',
  probable: 'bg-confidence-probable/15 text-confidence-probable',
  candidate: 'bg-confidence-candidate/15 text-confidence-candidate',
  eliminated: 'bg-muted text-muted-foreground line-through',
};

export function HypothesisCard({ hypothesis, defaultExpanded = false }: { hypothesis: Hypothesis; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-lg border border-border bg-card p-3 transition-colors">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-bold text-muted-foreground shrink-0">
            {hypothesis.rank}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground line-clamp-1">{hypothesis.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <ConfidenceBar confidence={hypothesis.confidence} className="flex-1 max-w-[120px]" />
              <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', statusStyles[hypothesis.status])}>
                {hypothesis.status}
              </span>
            </div>
          </div>
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-3 animate-slide-in">
          {hypothesis.description && <p className="text-sm text-muted-foreground">{hypothesis.description}</p>}
          
          {hypothesis.causal_factors.length > 0 && (
            <div>
              <p className="text-xs font-medium text-foreground mb-1">Causal Factors</p>
              <ul className="space-y-1">
                {hypothesis.causal_factors.map((f, i) => (
                  <li key={i} className="text-xs text-muted-foreground pl-3 relative before:absolute before:left-0 before:top-1.5 before:h-1 before:w-1 before:rounded-full before:bg-severity-p0">
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hypothesis.tests.length > 0 && (
            <div>
              <p className="text-xs font-medium text-foreground mb-1">Tests</p>
              <div className="space-y-1">
                {hypothesis.tests.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-xs">
                    <span className={cn(
                      'px-1.5 py-0.5 rounded font-medium',
                      t.result === 'confirms' ? 'bg-confidence-high/15 text-confidence-high' :
                      t.result === 'disconfirms' ? 'bg-severity-p0/15 text-severity-p0' :
                      t.result === 'inconclusive' ? 'bg-severity-p2/15 text-severity-p2' :
                      'bg-muted text-muted-foreground'
                    )}>
                      {t.result}
                    </span>
                    <span className="text-muted-foreground flex-1">{t.test_query}</span>
                    {t.confidence_delta !== 0 && (
                      <span className={cn('font-mono', t.confidence_delta > 0 ? 'text-confidence-high' : 'text-severity-p0')}>
                        {t.confidence_delta > 0 ? '+' : ''}{t.confidence_delta.toFixed(2)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}