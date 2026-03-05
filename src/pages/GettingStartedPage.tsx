import { useAppStore } from '@/store/app-store';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Link2, CheckCircle, Users, ArrowRight,
  Zap, BarChart3, Shield, Gauge, Plus, Copy, Check, Terminal, Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { mockIncidents } from '@/data/mock-data';
import { useState } from 'react';

export default function GettingStartedPage() {
  const { setupProgress, updateSetupProgress } = useAppStore();
  const navigate = useNavigate();
  const [copiedToken, setCopiedToken] = useState(false);

  const activeIncidents = mockIncidents.filter(i => !['closed', 'resolved', 'postmortem'].includes(i.status));

  const steps = [
    {
      key: 'orgConfigured' as const,
      num: 1,
      icon: CheckCircle,
      title: 'Organization configured',
      desc: 'Your workspace is set up and ready to use.',
      done: setupProgress.orgConfigured,
      action: null,
    },
    {
      key: 'firstConnectorLinked' as const,
      num: 2,
      icon: Link2,
      title: 'Connect your monitoring tools',
      desc: 'Link at least one data source so BugPilot can ingest signals from PagerDuty, Datadog, GitHub, and more.',
      done: setupProgress.firstConnectorLinked,
      action: () => navigate('/integrations'),
      actionLabel: 'Go to Integrations',
    },
    {
      key: 'firstIncidentCreated' as const,
      num: 3,
      icon: AlertTriangle,
      title: 'Create or receive your first incident',
      desc: 'Declare an incident manually or let BugPilot auto-detect one from your connected data sources.',
      done: setupProgress.firstIncidentCreated,
      action: () => navigate('/incidents'),
      actionLabel: 'Declare Incident',
    },
    {
      key: 'teamInvited' as const,
      num: 4,
      icon: Users,
      title: 'Invite your team',
      desc: 'Add responders and viewers to collaborate on incidents and receive on-call notifications.',
      done: setupProgress.teamInvited,
      action: () => navigate('/settings'),
      actionLabel: 'Invite Members',
    },
  ];

  const completedSteps = steps.filter(s => s.done).length;
  const progressPct = (completedSteps / steps.length) * 100;

  const demoToken = 'bplt_sk_live_xxxxxxxxxxxxxxxxxxxx';

  const handleCopyToken = () => {
    navigator.clipboard.writeText(demoToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* ── Welcome Banner ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl gradient-brand p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-white/80" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Getting Started</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Welcome to BugPilot</h1>
          <p className="text-sm text-white/70">AI-powered incident management and root cause analysis for engineering teams.</p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="h-2 bg-white/20 rounded-full w-32 overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="text-xs font-bold text-white/80">{Math.round(progressPct)}%</span>
            </div>
            <span className="text-xs text-white/60">{completedSteps} of {steps.length} setup steps done</span>
          </div>
        </div>
      </motion.div>

      {/* ── Setup Steps ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Setup Checklist</p>
            <span className="text-xs font-mono tabular-nums text-muted-foreground">{completedSteps}/{steps.length} complete</span>
          </div>
        </div>

        <div className="divide-y divide-border/50">
          {steps.map((step, i) => (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className={cn(
                'flex items-start gap-4 px-5 py-4 transition-colors',
                step.done ? 'bg-emerald-500/[0.03]' : 'hover:bg-muted/20',
              )}
            >
              {/* Step number / checkmark */}
              <div className={cn(
                'h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border',
                step.done
                  ? 'bg-emerald-500/15 border-emerald-500/30'
                  : 'bg-muted border-border',
              )}>
                {step.done
                  ? <Check className="h-4 w-4 text-emerald-400" />
                  : <span className="text-xs font-bold text-muted-foreground tabular-nums">{step.num}</span>
                }
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-semibold leading-tight',
                  step.done ? 'text-emerald-400' : 'text-foreground',
                )}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
              </div>

              {step.done ? (
                <div className="shrink-0 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] font-bold text-emerald-400">Done</span>
                </div>
              ) : step.action ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={step.action}
                  className="shrink-0 h-8 text-xs gap-1.5 border-border hover:border-primary/30 hover:text-primary"
                >
                  {step.actionLabel} <ArrowRight className="h-3 w-3" />
                </Button>
              ) : null}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Quick Start: API Token ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Quick Start</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Your API token</p>
            <p className="text-xs text-muted-foreground mb-3">Use this token to authenticate BugPilot's CLI and webhook integrations.</p>

            {/* Terminal-style code block */}
            <div className="rounded-xl overflow-hidden border border-border">
              <div className="flex items-center justify-between px-4 py-2 bg-[#0d1117] border-b border-[#30363d]">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                    <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                    <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                  </div>
                  <span className="text-[10px] text-[#8b949e] font-mono ml-2">~/.bugpilot/config</span>
                </div>
                <button
                  onClick={handleCopyToken}
                  className="flex items-center gap-1 text-[10px] text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
                >
                  {copiedToken ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copiedToken ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="bg-[#0d1117] px-4 py-3 font-mono text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-[#8b949e] select-none">$</span>
                  <div className="flex-1">
                    <span className="text-[#79c0ff]">bugpilot</span>
                    <span className="text-[#c9d1d9]"> auth </span>
                    <span className="text-[#a5d6ff]">--token</span>
                    <span className="text-[#c9d1d9]"> </span>
                    <span className="text-[#e6edf3] bg-[#161b22] px-1.5 py-0.5 rounded text-xs">{demoToken}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5">
            <Key className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground mb-0.5">Keep this token secret</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Treat your API token like a password. Never commit it to version control. Rotate it from Settings → API Keys if compromised.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Quick Actions ───────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">Quick Actions</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              icon: Plus, title: 'Declare Incident', desc: 'Start a manual investigation now',
              action: () => navigate('/incidents'), gradient: true,
            },
            {
              icon: Gauge, title: 'View Readiness', desc: 'Check service health scores',
              action: () => navigate('/readiness'), gradient: false,
            },
            {
              icon: BarChart3, title: 'View Reports', desc: 'MTTR, SLOs, and trends',
              action: () => navigate('/reports'), gradient: false,
            },
          ].map((item, i) => (
            <motion.button
              key={item.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + i * 0.08 }}
              onClick={item.action}
              className={cn(
                'p-5 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98]',
                item.gradient
                  ? 'gradient-brand border-transparent'
                  : 'border-border bg-card hover:border-primary/20 hover:bg-muted/20',
              )}
            >
              <div className={cn(
                'h-8 w-8 rounded-lg flex items-center justify-center mb-3',
                item.gradient ? 'bg-white/20' : 'bg-primary/10 border border-primary/20',
              )}>
                <item.icon className={cn('h-4 w-4', item.gradient ? 'text-white' : 'text-primary')} />
              </div>
              <p className={cn('text-sm font-semibold mb-0.5', item.gradient ? 'text-white' : 'text-foreground')}>
                {item.title}
              </p>
              <p className={cn('text-xs', item.gradient ? 'text-white/70' : 'text-muted-foreground')}>
                {item.desc}
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Active Incidents ────────────────────────────────────────────────── */}
      {activeIncidents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Active Incidents</p>
            <Button variant="ghost" size="sm" onClick={() => navigate('/incidents')} className="text-xs text-muted-foreground gap-1 h-7">
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border/50">
            {activeIncidents.slice(0, 3).map((inc, i) => (
              <motion.button
                key={inc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 + i * 0.05 }}
                onClick={() => navigate(`/incidents/${inc.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors text-left"
              >
                <span className={cn(
                  'h-2 w-2 rounded-full shrink-0',
                  inc.severity === 'P0' ? 'bg-severity-p0 animate-pulse' :
                  inc.severity === 'P1' ? 'bg-severity-p1' :
                  'bg-severity-p2',
                )} />
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0',
                  inc.severity === 'P0' ? 'bg-severity-p0/15 text-severity-p0' :
                  inc.severity === 'P1' ? 'bg-severity-p1/15 text-severity-p1' :
                  'bg-severity-p2/15 text-severity-p2',
                )}>
                  {inc.severity}
                </span>
                <span className="text-xs font-mono text-muted-foreground shrink-0">{inc.short_id}</span>
                <span className="text-sm text-foreground truncate flex-1">{inc.title}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
