import { cn } from '@/lib/utils';

interface ConfidenceBarProps {
  confidence: number;
  showValue?: boolean;
  label?: string;
  className?: string;
}

function getConfidenceColor(c: number) {
  if (c >= 0.85) return 'bg-confidence-high';
  if (c >= 0.65) return 'bg-confidence-probable';
  if (c >= 0.40) return 'bg-confidence-candidate';
  return 'bg-confidence-low';
}

function getConfidenceLabel(c: number) {
  if (c >= 0.85) return 'High confidence';
  if (c >= 0.65) return 'Probable';
  if (c >= 0.40) return 'Candidate';
  return 'Low confidence';
}

export function ConfidenceBar({ confidence, showValue = true, label, className }: ConfidenceBarProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-in-out', getConfidenceColor(confidence))}
          style={{ width: `${confidence * 100}%` }}
        />
      </div>
      {showValue && (
        <span className="text-xs font-mono text-muted-foreground min-w-[3ch]">
          {Math.round(confidence * 100)}%
        </span>
      )}
      {label && <span className="text-xs text-muted-foreground">{getConfidenceLabel(confidence)}</span>}
    </div>
  );
}
