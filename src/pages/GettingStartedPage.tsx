import { useAppStore } from '@/store/app-store';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, Link2, CheckCircle, Users, ArrowRight, 
  Zap, BarChart3, Shield, Gauge, Plus 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { mockIncidents } from '@/data/mock-data';

export default function GettingStartedPage() {
  const { setupProgress, updateSetupProgress } = useAppStore();
  const navigate = useNavigate();

  const activeIncidents = mockIncidents.filter(i => !['closed', 'resolved', 'postmortem'].includes(i.status));

  const steps = [
    {
      key: 'orgConfigured' as const,
      icon: CheckCircle,
      title: 'Organization configured',
      desc: 'Your workspace is set up and ready',
      done: setupProgress.orgConfigured,
      action: null,
    },
    {
      key: 'firstConnectorLinked' as const,
      icon: Link2,
      title: 'Connect your monitoring tools',
      desc: 'Link at least one data source so BugPilot can ingest signals',
      done: setupProgress.firstConnectorLinked,
      action: () => navigate('/integrations'),
      actionLabel: 'Go to Integrations',
    },
    {
      key: 'firstIncidentCreated' as const,
      icon: AlertTriangle,
      title: 'Create or receive your first incident',
      desc: 'Declare an incident manually or let BugPilot auto-detect one',
      done: setupProgress.firstIncidentCreated,
      action: () => navigate('/incidents'),
      actionLabel: 'Declare Incident',
    },
    {
      key: 'teamInvited' as const,
      icon: Users,
      title: 'Invite your team',
      desc: 'Add responders and viewers to collaborate on incidents',
      done: setupProgress.teamInvited,
      action: () => navigate('/settings'),
      actionLabel: 'Invite Members',
    },
  ];

  const completedSteps = steps.filter(s => s.done).length;
  const progressPct = (completedSteps / steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="text-2xl font-bold text-foreground">Welcome to BugPilot</h1>
        <p className="text-sm text-muted-foreground">Complete these steps to get the most out of your incident management.</p>
      </motion.div>

      {/* Setup Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Setup Progress</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{completedSteps} of {steps.length} steps completed</p>
          </div>
          <span className="text-2xl font-bold gradient-brand-text">{Math.round(progressPct)}%</span>
        </div>

        <div className="h-2 rounded-full bg-muted overflow-hidden mb-6">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="h-full rounded-full gradient-brand"
          />
        </div>

        <div className="space-y-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className={cn(
                'flex items-center gap-4 p-3 rounded-lg transition-colors',
                step.done ? 'bg-success/5' : 'bg-surface-raised hover:bg-surface-hover'
              )}
            >
              <div className={cn(
                'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
                step.done ? 'bg-success/15' : 'bg-muted'
              )}>
                <step.icon className={cn('h-4 w-4', step.done ? 'text-success' : 'text-muted-foreground')} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', step.done ? 'text-success' : 'text-foreground')}>
                  {step.title}
                  {step.done && <CheckCircle className="h-3.5 w-3.5 inline ml-1.5" />}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
              </div>
              {!step.done && step.action && (
                <Button size="sm" variant="outline" onClick={step.action} className="shrink-0 h-8 text-xs gap-1.5">
                  {step.actionLabel} <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: Plus, title: 'Declare Incident', desc: 'Start a manual investigation',
            action: () => navigate('/incidents'), gradient: true,
          },
          {
            icon: Gauge, title: 'View Readiness', desc: 'Check service health scores',
            action: () => navigate('/readiness'),
          },
          {
            icon: BarChart3, title: 'View Reports', desc: 'MTTR, SLOs, and trends',
            action: () => navigate('/reports'),
          },
        ].map((item, i) => (
          <motion.button
            key={item.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            onClick={item.action}
            className={cn(
              'p-5 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98]',
              item.gradient
                ? 'gradient-brand border-transparent gradient-glow'
                : 'border-border bg-card hover:bg-surface-hover'
            )}
          >
            <item.icon className={cn('h-5 w-5 mb-3', item.gradient ? 'text-primary-foreground' : 'text-primary')} />
            <p className={cn('text-sm font-semibold mb-1', item.gradient ? 'text-primary-foreground' : 'text-foreground')}>
              {item.title}
            </p>
            <p className={cn('text-xs', item.gradient ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
              {item.desc}
            </p>
          </motion.button>
        ))}
      </div>

      {/* Active Incidents */}
      {activeIncidents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground">Active Incidents</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/incidents')} className="text-xs text-muted-foreground gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-2">
            {activeIncidents.slice(0, 3).map(inc => (
              <button
                key={inc.id}
                onClick={() => navigate(`/incidents/${inc.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-surface-hover transition-colors text-left"
              >
                <span className={cn(
                  'h-2 w-2 rounded-full shrink-0',
                  inc.severity === 'P0' ? 'bg-severity-p0 animate-pulse-dot' :
                  inc.severity === 'P1' ? 'bg-severity-p1' :
                  'bg-severity-p2'
                )} />
                <span className="text-xs font-mono text-muted-foreground shrink-0">{inc.short_id}</span>
                <span className="text-sm text-foreground truncate flex-1">{inc.title}</span>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded font-medium shrink-0',
                  inc.severity === 'P0' ? 'bg-severity-p0/15 text-severity-p0' :
                  inc.severity === 'P1' ? 'bg-severity-p1/15 text-severity-p1' :
                  'bg-severity-p2/15 text-severity-p2'
                )}>
                  {inc.severity}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
