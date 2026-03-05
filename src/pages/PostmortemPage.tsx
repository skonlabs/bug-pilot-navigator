import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockIncidents, mockPostmortem } from '@/data/mock-data';
import { SeverityBadge } from '@/components/bugpilot/SeverityBadge';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, FileText, Download, ExternalLink, CheckCircle2,
  AlertTriangle, Plus, Edit3, Save, Clock, Users, Target,
  ChevronRight, Trash2, Link2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { PostmortemActionItem, PostmortemContent } from '@/types/bugpilot';

// Blameless language check
const BLAMELESS_FORBIDDEN = ['forgot to', 'failed to', 'did not', 'should have', 'neglected to', 'made a mistake', 'caused the'];
function checkBlameless(text: string): string | null {
  const lower = text.toLowerCase();
  const found = BLAMELESS_FORBIDDEN.find(p => lower.includes(p));
  return found ? `Consider rephrasing: "${found}" focuses on a person. Try describing the system condition instead.` : null;
}

const StatusColors = {
  draft: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  review: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  final: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const PriorityColors = {
  high: 'text-severity-p0',
  medium: 'text-amber-400',
  low: 'text-muted-foreground',
};

function EditableText({ value, onChange, multiline = false, className = '', placeholder = '' }: {
  value: string; onChange: (v: string) => void; multiline?: boolean; className?: string; placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [blamelessWarning, setBlamelessWarning] = useState<string | null>(null);

  const handleChange = (v: string) => {
    onChange(v);
    setBlamelessWarning(checkBlameless(v));
  };

  if (editing) {
    return (
      <div className="space-y-1">
        {multiline ? (
          <Textarea
            value={value}
            onChange={e => handleChange(e.target.value)}
            onBlur={() => setEditing(false)}
            autoFocus
            rows={4}
            placeholder={placeholder}
            className="text-sm"
          />
        ) : (
          <Input
            value={value}
            onChange={e => handleChange(e.target.value)}
            onBlur={() => setEditing(false)}
            autoFocus
            placeholder={placeholder}
            className="text-sm"
          />
        )}
        {blamelessWarning && (
          <div className="flex items-start gap-1.5 text-[11px] text-amber-400 p-2 bg-amber-500/5 rounded border border-amber-500/20">
            <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
            {blamelessWarning}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn('group relative cursor-text', className)}
      onClick={() => setEditing(true)}
    >
      <span className="text-sm text-foreground leading-relaxed">{value || <span className="text-muted-foreground/50 italic">{placeholder || 'Click to edit...'}</span>}</span>
      <Edit3 className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

function EditableList({ items, onChange, placeholder, blameless = false }: {
  items: string[]; onChange: (items: string[]) => void; placeholder?: string; blameless?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [blamelessWarning, setBlamelessWarning] = useState<string | null>(null);

  const handleAdd = () => {
    if (newItem.trim()) {
      onChange([...items, newItem.trim()]);
      setNewItem('');
      setAdding(false);
      setBlamelessWarning(null);
    }
  };

  const handleNewItemChange = (v: string) => {
    setNewItem(v);
    if (blameless) setBlamelessWarning(checkBlameless(v));
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 group">
          <div className="h-1.5 w-1.5 rounded-full bg-primary/60 mt-2 shrink-0" />
          <span className="text-sm text-foreground flex-1">{item}</span>
          <button
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-severity-p0 transition-all"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
      {adding ? (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Input
              value={newItem}
              onChange={e => handleNewItemChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setNewItem(''); } }}
              placeholder={placeholder || 'Type and press Enter...'}
              className="text-sm h-8"
              autoFocus
            />
            <Button size="sm" variant="default" className="h-8 shrink-0" onClick={handleAdd}>Add</Button>
            <Button size="sm" variant="ghost" className="h-8 shrink-0" onClick={() => { setAdding(false); setNewItem(''); }}>Cancel</Button>
          </div>
          {blamelessWarning && (
            <div className="flex items-start gap-1.5 text-[11px] text-amber-400 p-2 bg-amber-500/5 rounded border border-amber-500/20">
              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
              {blamelessWarning}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-primary transition-colors"
        >
          <Plus className="h-3 w-3" /> Add item
        </button>
      )}
    </div>
  );
}

function ActionItemRow({ item, onChange, onDelete }: {
  item: PostmortemActionItem;
  onChange: (updated: PostmortemActionItem) => void;
  onDelete: () => void;
}) {
  const statusColors = {
    open: 'bg-secondary text-muted-foreground',
    in_progress: 'bg-blue-500/10 text-blue-400',
    done: 'bg-emerald-500/10 text-emerald-400',
  };

  return (
    <tr className="border-b border-border/50 hover:bg-secondary/20 group">
      <td className="px-4 py-3 align-top">
        <div className="text-xs text-foreground leading-relaxed max-w-xs">{item.description}</div>
      </td>
      <td className="px-4 py-3 align-middle">
        <span className="text-xs text-muted-foreground">{item.owner_role}</span>
      </td>
      <td className="px-4 py-3 align-middle">
        <span className="text-xs text-muted-foreground">
          {item.due_date ? format(new Date(item.due_date), 'MMM d') : '—'}
        </span>
      </td>
      <td className="px-4 py-3 align-middle">
        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium capitalize', PriorityColors[item.priority])}>
          {item.priority}
        </span>
      </td>
      <td className="px-4 py-3 align-middle">
        <Select value={item.status} onValueChange={v => onChange({ ...item, status: v as PostmortemActionItem['status'] })}>
          <SelectTrigger className="h-6 text-[11px] w-28 border-0 bg-secondary/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {item.external_issue_key ? (
            <span className="text-[11px] text-primary font-mono">{item.external_issue_key}</span>
          ) : (
            <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1">
              <Link2 className="h-3 w-3" /> Push to Jira
            </Button>
          )}
          <button onClick={onDelete} className="ml-1 text-muted-foreground/40 hover:text-severity-p0 transition-colors">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function PostmortemPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const incident = mockIncidents.find(i => i.id === id || i.id === '6') || mockIncidents[5];
  const [postmortem, setPostmortem] = useState(mockPostmortem);
  const [status, setStatus] = useState<'draft' | 'review' | 'final'>('draft');
  const [saved, setSaved] = useState(false);

  const updateContent = useCallback(<K extends keyof PostmortemContent>(key: K, value: PostmortemContent[K]) => {
    setPostmortem(pm => ({ ...pm, content: { ...pm.content, [key]: value } }));
    setSaved(false);
  }, []);

  const handleSave = () => {
    setSaved(true);
    toast.success('Postmortem saved');
    setTimeout(() => setSaved(false), 3000);
  };

  const handleFinalize = () => {
    setStatus('final');
    toast.success('Postmortem finalized and locked');
  };

  const addActionItem = () => {
    const newItem: PostmortemActionItem = {
      id: `ai-${Date.now()}`,
      description: 'New action item',
      owner_role: '',
      due_date: null,
      priority: 'medium',
      gap_artifact_id: null,
      external_issue_key: null,
      status: 'open',
    };
    updateContent('action_items', [...postmortem.content.action_items, newItem]);
  };

  const updateActionItem = (idx: number, updated: PostmortemActionItem) => {
    const items = [...postmortem.content.action_items];
    items[idx] = updated;
    updateContent('action_items', items);
  };

  const deleteActionItem = (idx: number) => {
    updateContent('action_items', postmortem.content.action_items.filter((_, i) => i !== idx));
  };

  const isReadOnly = status === 'final';

  return (
    <div className="space-y-0 -m-6">
      {/* Sticky Header */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-3 border-b border-border bg-background/80 backdrop-blur-sm flex items-center gap-3 sticky top-14 z-10"
      >
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/incidents/${id || '6'}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Postmortem</span>
          <span className="text-muted-foreground">·</span>
          <span className="font-mono text-xs bg-secondary px-2 py-0.5 rounded">{incident.short_id}</span>
          <SeverityBadge severity={incident.severity} />
          <span className={cn('text-[10px] px-2 py-0.5 rounded border font-medium capitalize', StatusColors[status])}>
            {status}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {!isReadOnly && (
            <>
              <span className={cn('text-[10px] text-muted-foreground transition-opacity', saved ? 'opacity-100' : 'opacity-0')}>
                ✓ Saved
              </span>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={handleSave}>
                <Save className="h-3 w-3" /> Save Draft
              </Button>
              <Button size="sm" variant="default" className="h-7 text-xs" onClick={handleFinalize}>
                Finalize Postmortem
              </Button>
            </>
          )}
          {isReadOnly && (
            <>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                <Download className="h-3 w-3" /> Export PDF
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                <ExternalLink className="h-3 w-3" /> Push to Confluence
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Draft banner */}
      {status === 'draft' && (
        <div className="px-6 py-2 bg-amber-500/5 border-b border-amber-500/20 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          <p className="text-xs text-amber-400">
            This postmortem is in <strong>draft</strong>. Share with your team for review before finalizing.
            Blameless language is enforced — BugPilot will warn you about individual-blaming phrases.
          </p>
        </div>
      )}

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-10">

        {/* Incident Summary */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h2 className="text-lg font-bold text-foreground mb-1">{incident.title}</h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-6">
            <span>Severity: <strong className="text-foreground">{incident.severity}</strong></span>
            <span>·</span>
            <span>Duration: <strong className="text-foreground">{postmortem.content.incident_summary.duration_mins} minutes</strong></span>
            <span>·</span>
            <span>Environment: <strong className="text-foreground">{incident.environment}</strong></span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block mb-1.5">What Happened</label>
              {isReadOnly ? (
                <p className="text-sm text-foreground leading-relaxed">{postmortem.content.incident_summary.what_happened}</p>
              ) : (
                <EditableText
                  value={postmortem.content.incident_summary.what_happened}
                  onChange={v => updateContent('incident_summary', { ...postmortem.content.incident_summary, what_happened: v })}
                  multiline
                />
              )}
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block mb-1.5">Customer Impact</label>
              {isReadOnly ? (
                <p className="text-sm text-foreground leading-relaxed">{postmortem.content.incident_summary.customer_impact}</p>
              ) : (
                <EditableText
                  value={postmortem.content.incident_summary.customer_impact}
                  onChange={v => updateContent('incident_summary', { ...postmortem.content.incident_summary, customer_impact: v })}
                  multiline
                />
              )}
            </div>
          </div>
        </motion.section>

        <div className="h-px bg-border" />

        {/* Timeline (read-only from packet) */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Timeline</h3>
            <span className="text-xs text-muted-foreground ml-1">(from Resolution Packet — read-only)</span>
            <Link to={`/incidents/${id || '6'}/packet`} className="ml-auto text-[11px] text-primary flex items-center gap-1 hover:underline">
              View full packet <ExternalLink className="h-2.5 w-2.5" />
            </Link>
          </div>
          <div className="relative pl-4 border-l border-border space-y-0">
            {postmortem.content.timeline.slice(0, 6).map(event => (
              <div key={event.id} className="relative pb-4 last:pb-0">
                <div className="absolute -left-5 top-1 h-2.5 w-2.5 rounded-full border-2 border-border bg-background" />
                <div className="flex items-start gap-2.5">
                  <div className="flex-1">
                    <span className="text-xs font-medium text-foreground">{event.title}</span>
                    {event.description && <span className="text-xs text-muted-foreground ml-2">— {event.description}</span>}
                    <span className="text-[10px] text-muted-foreground/50 ml-2 font-mono">
                      {format(new Date(event.timestamp), 'HH:mm')} UTC
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <div className="h-px bg-border" />

        {/* Root Causes */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Root Causes</h3>
          </div>
          {isReadOnly ? (
            <ul className="space-y-2">
              {postmortem.content.root_causes.map((rc, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-severity-p0 mt-2 shrink-0" />
                  {rc}
                </li>
              ))}
            </ul>
          ) : (
            <EditableList
              items={postmortem.content.root_causes}
              onChange={v => updateContent('root_causes', v)}
              placeholder="Describe the root cause of this incident..."
            />
          )}
        </motion.section>

        <div className="h-px bg-border" />

        {/* Contributing Factors */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Contributing Factors</h3>
          </div>
          {isReadOnly ? (
            <ul className="space-y-2">
              {postmortem.content.contributing_factors.map((cf, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                  {cf}
                </li>
              ))}
            </ul>
          ) : (
            <EditableList
              items={postmortem.content.contributing_factors}
              onChange={v => updateContent('contributing_factors', v)}
              placeholder="What made the impact worse or detection slower?"
            />
          )}
        </motion.section>

        <div className="h-px bg-border" />

        {/* What Went Well */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-foreground">What Went Well</h3>
          </div>
          {isReadOnly ? (
            <ul className="space-y-2">
              {postmortem.content.what_went_well.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <EditableList
              items={postmortem.content.what_went_well}
              onChange={v => updateContent('what_went_well', v)}
              placeholder="Actions that limited blast radius or accelerated resolution..."
            />
          )}
        </motion.section>

        <div className="h-px bg-border" />

        {/* What Went Poorly */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-foreground">What Went Poorly</h3>
          </div>
          {!isReadOnly && (
            <div className="mb-3 flex items-start gap-1.5 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-400">
              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
              BugPilot enforces blameless framing. Avoid "X forgot to" or "X failed to" — describe system conditions instead.
            </div>
          )}
          {isReadOnly ? (
            <ul className="space-y-2">
              {postmortem.content.what_went_poorly.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <EditableList
              items={postmortem.content.what_went_poorly}
              onChange={v => updateContent('what_went_poorly', v)}
              placeholder="What process or system conditions slowed detection or resolution?"
              blameless
            />
          )}
        </motion.section>

        <div className="h-px bg-border" />

        {/* Lessons Learned */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Lessons Learned</h3>
          </div>
          {isReadOnly ? (
            <ul className="space-y-2">
              {postmortem.content.lessons_learned.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary/60 mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <EditableList
              items={postmortem.content.lessons_learned}
              onChange={v => updateContent('lessons_learned', v)}
              placeholder="Key insights for the team going forward..."
            />
          )}
        </motion.section>

        <div className="h-px bg-border" />

        {/* Action Items */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Action Items</h3>
            <span className="text-xs text-muted-foreground">({postmortem.content.action_items.length} total)</span>
            {!isReadOnly && (
              <Button size="sm" variant="outline" className="h-6 text-xs ml-auto gap-1" onClick={addActionItem}>
                <Plus className="h-3 w-3" /> Add Action Item
              </Button>
            )}
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-secondary/30">
                <tr>
                  <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Description</th>
                  <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Owner</th>
                  <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Due</th>
                  <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Priority</th>
                  <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Issue</th>
                </tr>
              </thead>
              <tbody>
                {postmortem.content.action_items.map((item, i) => (
                  <ActionItemRow
                    key={item.id}
                    item={item}
                    onChange={updated => updateActionItem(i, updated)}
                    onDelete={() => deleteActionItem(i)}
                  />
                ))}
              </tbody>
            </table>
            {postmortem.content.action_items.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No action items yet. Add items to track follow-up work.
              </div>
            )}
          </div>
          {!isReadOnly && (
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                <ExternalLink className="h-3 w-3" /> Push all to Jira
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                <ExternalLink className="h-3 w-3" /> Create GitHub Issues
              </Button>
            </div>
          )}
        </motion.section>

        {/* SLO Impact */}
        {postmortem.content.slo_impact && (
          <>
            <div className="h-px bg-border" />
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-4 w-4 text-severity-p0" />
                <h3 className="text-sm font-semibold text-foreground">SLO Impact</h3>
              </div>
              <div className="flex items-center gap-6 p-4 rounded-xl border border-severity-p0/20 bg-severity-p0/5">
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">SLO</p>
                  <p className="text-sm font-medium text-foreground">{postmortem.content.slo_impact.slo_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Violated</p>
                  <p className="text-sm font-bold text-severity-p0">{postmortem.content.slo_impact.violated ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Budget Consumed</p>
                  <p className="text-sm font-mono font-bold text-severity-p0">{postmortem.content.slo_impact.budget_consumed_pct}%</p>
                </div>
              </div>
            </motion.section>
          </>
        )}

        {/* Bottom Actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="border-t border-border pt-6 flex items-center gap-3">
          {!isReadOnly && (
            <>
              <Button variant="default" size="sm" onClick={handleFinalize}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Finalize Postmortem
              </Button>
              <Button variant="outline" size="sm" onClick={handleSave}>
                <Save className="h-3.5 w-3.5 mr-1.5" /> Save Draft
              </Button>
            </>
          )}
          {isReadOnly && (
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Finalized
            </Badge>
          )}
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/incidents/${id || '6'}/packet`}>
              <ChevronRight className="h-3.5 w-3.5 mr-1.5" /> View Resolution Packet
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/incidents/${id || '6'}`}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Investigation
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
