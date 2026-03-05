import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, ArrowRight, Building2, Link2, Rocket, Check, Zap, Shield, Globe, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const connectorOptions = [
  { id: 'pagerduty', name: 'PagerDuty', category: 'Alerting', desc: 'Ingest alerts & on-call schedules', popular: true },
  { id: 'datadog', name: 'Datadog', category: 'Observability', desc: 'Logs, metrics, APM traces', popular: true },
  { id: 'github', name: 'GitHub', category: 'Source Control', desc: 'Commits, PRs, deploy history', popular: true },
  { id: 'slack', name: 'Slack', category: 'Communication', desc: 'Incident channels & updates', popular: true },
  { id: 'prometheus', name: 'Prometheus', category: 'Metrics', desc: 'Metrics collection & alerts' },
  { id: 'grafana', name: 'Grafana', category: 'Dashboards', desc: 'Dashboards & alerting' },
  { id: 'jira', name: 'Jira', category: 'Ticketing', desc: 'Issue tracking' },
  { id: 'aws', name: 'AWS CloudWatch', category: 'Cloud', desc: 'AWS logs & metrics' },
  { id: 'k8s', name: 'Kubernetes', category: 'Infra', desc: 'Pods, deployments, events' },
  { id: 'opsgenie', name: 'OpsGenie', category: 'Alerting', desc: 'Alert management & on-call' },
];

export function OnboardingWizard() {
  const { onboardingStep, setOnboardingStep, completeOnboarding, updateSetupProgress } = useAppStore();
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [selectedConnectors, setSelectedConnectors] = useState<string[]>([]);

  const toggleConnector = (id: string) => {
    setSelectedConnectors(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
        backgroundSize: '32px 32px',
      }} />
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-status-identified/5 blur-[120px]" />

      <AnimatePresence mode="wait">
        {onboardingStep === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 max-w-lg mx-auto text-center px-6"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-20 h-20 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-8 gradient-glow"
            >
              <Bug className="h-10 w-10 text-primary-foreground" />
            </motion.div>

            <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight">
              Welcome to <span className="gradient-brand-text">BugPilot</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-2">
              AI-powered incident root cause analysis
            </p>
            <p className="text-sm text-muted-foreground/70 mb-10 max-w-md mx-auto">
              Connect your monitoring tools, and BugPilot will automatically investigate incidents, 
              identify root causes, and propose fixes — so your team can resolve faster.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { icon: Zap, label: 'Auto-Investigate', desc: 'AI analyzes incidents end-to-end' },
                { icon: Shield, label: 'Evidence-Based', desc: 'Every conclusion cites signals' },
                { icon: Globe, label: 'Works Day One', desc: 'No instrumentation required' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="p-4 rounded-xl bg-card glass-border text-center"
                >
                  <item.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-xs font-semibold text-foreground mb-1">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <Button size="lg" onClick={() => setOnboardingStep('org-setup')} className="gap-2 gradient-brand border-0 text-primary-foreground hover:opacity-90 h-12 px-8 text-sm font-semibold">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground/50 mt-4">Takes about 2 minutes to set up</p>
          </motion.div>
        )}

        {onboardingStep === 'org-setup' && (
          <motion.div
            key="org-setup"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="relative z-10 w-full max-w-md mx-auto px-6"
          >
            <StepIndicator current={1} total={3} />
            
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Set up your organization</h2>
              <p className="text-sm text-muted-foreground mb-8">
                This is your team's workspace where incidents, services, and investigations live.
              </p>

              <div className="space-y-5">
                <div>
                  <Label className="text-sm text-foreground font-medium">Organization Name</Label>
                  <Input
                    value={orgName}
                    onChange={e => {
                      setOrgName(e.target.value);
                      setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
                    }}
                    placeholder="Acme Engineering"
                    className="mt-2 h-11 bg-secondary/50 border-border focus:border-primary"
                  />
                </div>
                <div>
                  <Label className="text-sm text-foreground font-medium">URL Slug</Label>
                  <div className="mt-2 flex items-center rounded-lg border border-border bg-secondary/50 overflow-hidden">
                    <span className="px-3 text-sm text-muted-foreground bg-muted/50 h-11 flex items-center border-r border-border">bugpilot.app/</span>
                    <Input
                      value={orgSlug}
                      onChange={e => setOrgSlug(e.target.value)}
                      placeholder="acme-engineering"
                      className="border-0 h-11 bg-transparent focus-visible:ring-0"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">This can be changed later in settings</p>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button variant="ghost" onClick={() => setOnboardingStep('welcome')} className="text-muted-foreground">
                  Back
                </Button>
                <Button
                  onClick={() => {
                    updateSetupProgress('orgConfigured', true);
                    setOnboardingStep('connect-first');
                  }}
                  disabled={!orgName.trim()}
                  className="flex-1 gradient-brand border-0 text-primary-foreground hover:opacity-90 h-11"
                >
                  Continue <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {onboardingStep === 'connect-first' && (
          <motion.div
            key="connect-first"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="relative z-10 w-full max-w-xl mx-auto px-6"
          >
            <StepIndicator current={2} total={3} />

            <div className="mt-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Connect your first data source</h2>
              <p className="text-sm text-muted-foreground mb-6">
                BugPilot needs at least one data source to start investigating incidents. 
                Select the tools your team uses — you can add more later.
              </p>

              <div className="space-y-2 max-h-[360px] overflow-y-auto scrollbar-thin pr-1">
                {connectorOptions.map(c => (
                  <button
                    key={c.id}
                    onClick={() => toggleConnector(c.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                      selectedConnectors.includes(c.id)
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border bg-card hover:bg-surface-hover hover:border-border'
                    )}
                  >
                    <div className={cn(
                      'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                      selectedConnectors.includes(c.id) ? 'gradient-brand' : 'bg-muted'
                    )}>
                      {selectedConnectors.includes(c.id) 
                        ? <Check className="h-4 w-4 text-primary-foreground" />
                        : <Link2 className="h-4 w-4 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{c.name}</span>
                        {c.popular && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Popular</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 shrink-0">{c.category}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="ghost" onClick={() => setOnboardingStep('org-setup')} className="text-muted-foreground">
                  Back
                </Button>
                <Button
                  onClick={() => {
                    updateSetupProgress('firstConnectorLinked', true);
                    setOnboardingStep('test-run');
                  }}
                  className="flex-1 gradient-brand border-0 text-primary-foreground hover:opacity-90 h-11"
                >
                  {selectedConnectors.length > 0 
                    ? `Connect ${selectedConnectors.length} source${selectedConnectors.length > 1 ? 's' : ''}` 
                    : 'Skip for now'
                  }
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
              {selectedConnectors.length === 0 && (
                <p className="text-xs text-muted-foreground/60 text-center mt-2">
                  You can connect data sources later from the Integrations page
                </p>
              )}
            </div>
          </motion.div>
        )}

        {onboardingStep === 'test-run' && (
          <motion.div
            key="test-run"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="relative z-10 w-full max-w-lg mx-auto px-6 text-center"
          >
            <StepIndicator current={3} total={3} />

            <div className="mt-8">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-6"
              >
                <Rocket className="h-8 w-8 text-success" />
              </motion.div>

              <h2 className="text-2xl font-bold text-foreground mb-2">You're all set!</h2>
              <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
                BugPilot is ready to start investigating incidents. Here's what happens next:
              </p>

              <div className="space-y-3 text-left max-w-sm mx-auto mb-8">
                {[
                  { step: '1', text: 'BugPilot discovers your services and builds a topology map' },
                  { step: '2', text: 'When an incident triggers, we auto-investigate and find root cause' },
                  { step: '3', text: 'You review the evidence, approve fixes, and resolve faster' },
                ].map((item, i) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.15 }}
                    className="flex gap-3 items-start p-3 rounded-lg bg-card glass-border"
                  >
                    <span className="h-6 w-6 rounded-full gradient-brand text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {item.step}
                    </span>
                    <p className="text-sm text-foreground/90">{item.text}</p>
                  </motion.div>
                ))}
              </div>

              <Button
                size="lg"
                onClick={completeOnboarding}
                className="gradient-brand border-0 text-primary-foreground hover:opacity-90 h-12 px-10 text-sm font-semibold"
              >
                Launch Dashboard <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={cn(
            'h-2 rounded-full transition-all duration-300',
            i + 1 === current ? 'w-8 gradient-brand' :
            i + 1 < current ? 'w-2 bg-primary' :
            'w-2 bg-muted'
          )} />
        </div>
      ))}
    </div>
  );
}
