import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { Severity } from '@/types/bugpilot';

const severityOptions: { value: Severity; label: string; desc: string; color: string }[] = [
  { value: 'P0', label: 'P0 — Critical', desc: 'Complete outage, revenue impact, data loss risk', color: 'border-severity-p0 bg-severity-p0/10 text-severity-p0' },
  { value: 'P1', label: 'P1 — High', desc: 'Major feature degraded, significant customer impact', color: 'border-severity-p1 bg-severity-p1/10 text-severity-p1' },
  { value: 'P2', label: 'P2 — Medium', desc: 'Partial degradation, subset of users affected', color: 'border-severity-p2 bg-severity-p2/10 text-severity-p2' },
  { value: 'P3', label: 'P3 — Low', desc: 'Minor issue, informational, no SLO impact', color: 'border-border bg-muted text-muted-foreground' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeclareIncidentDialog({ open, onOpenChange }: Props) {
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [environment, setEnvironment] = useState('production');
  const [description, setDescription] = useState('');
  const [autoInvestigate, setAutoInvestigate] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim() || title.length < 5) errs.title = 'Title must be at least 5 characters';
    if (!severity) errs.severity = 'Please select a severity level';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    // Simulate submission
    await new Promise(r => setTimeout(r, 1500));
    setSubmitting(false);
    onOpenChange(false);
    // Reset form
    setTitle('');
    setSeverity(null);
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-severity-p1" />
            Declare Incident
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Declare a new incident to start an investigation. BugPilot will begin collecting evidence automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Title */}
          <div>
            <Label className="text-sm font-medium text-foreground">Incident Title *</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Payment service returning 503 errors"
              className="mt-1.5 h-10 bg-secondary/50 border-border"
            />
            {errors.title && <p className="text-xs text-severity-p0 mt-1">{errors.title}</p>}
          </div>

          {/* Severity */}
          <div>
            <Label className="text-sm font-medium text-foreground">Severity *</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {severityOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSeverity(opt.value)}
                  className={cn(
                    'p-2.5 rounded-lg border text-left transition-all',
                    severity === opt.value
                      ? cn(opt.color, 'ring-1 ring-current/20')
                      : 'border-border bg-secondary/30 hover:bg-secondary/60'
                  )}
                >
                  <p className={cn('text-xs font-semibold', severity === opt.value ? '' : 'text-foreground')}>
                    {opt.label}
                  </p>
                  <p className={cn('text-[10px] mt-0.5 leading-snug', severity === opt.value ? 'opacity-80' : 'text-muted-foreground')}>
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
            {errors.severity && <p className="text-xs text-severity-p0 mt-1">{errors.severity}</p>}
          </div>

          {/* Environment */}
          <div>
            <Label className="text-sm font-medium text-foreground">Environment</Label>
            <div className="flex gap-2 mt-1.5">
              {['production', 'staging', 'dev'].map(env => (
                <button
                  key={env}
                  onClick={() => setEnvironment(env)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all border',
                    environment === env
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'border-border text-muted-foreground hover:text-secondary-foreground hover:bg-secondary/60'
                  )}
                >
                  {env}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="text-sm font-medium text-foreground">Description / Context</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Paste alert text, error message, Slack thread, or describe what you observed..."
              className="mt-1.5 bg-secondary/50 border-border min-h-[80px] text-sm"
            />
          </div>

          {/* Auto Investigate */}
          <label className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10 cursor-pointer">
            <input
              type="checkbox"
              checked={autoInvestigate}
              onChange={e => setAutoInvestigate(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Start investigation automatically</p>
              <p className="text-xs text-muted-foreground">BugPilot will immediately begin collecting evidence and analyzing root cause</p>
            </div>
          </label>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 gradient-brand border-0 text-primary-foreground hover:opacity-90"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {submitting ? 'Declaring...' : 'Declare Incident'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
