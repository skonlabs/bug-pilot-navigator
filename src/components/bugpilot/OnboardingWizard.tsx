import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, ArrowRight, ArrowLeft, Building2, Link2, Rocket, Check, Zap, Shield, Globe, ChevronRight, ExternalLink, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type ConnectorSetupStep = 'select' | 'overview' | 'permissions' | 'authenticate' | 'validate';

const connectorCatalog = [
  { 
    id: 'pagerduty', name: 'PagerDuty', category: 'Alerting & On-Call', 
    desc: 'Ingest alerts, read on-call schedules, escalation policies, create/update incidents',
    scopes: ['incidents.read', 'oncalls.read', 'escalation_policies.read', 'incidents.write'],
    scopeDescriptions: ['Read your incidents and alert history', 'Read on-call schedules and rotations', 'Read escalation policy configurations', 'Add notes and updates to incidents'],
    authType: 'api_key' as const,
    popular: true,
  },
  { 
    id: 'datadog', name: 'Datadog', category: 'Observability', 
    desc: 'Logs, metrics, APM traces, and synthetic monitoring data',
    scopes: ['logs_read', 'metrics_read', 'apm_read', 'synthetics_read'],
    scopeDescriptions: ['Read log entries and search logs', 'Read metric time series data', 'Read APM traces and spans', 'Read synthetic test results'],
    authType: 'api_key' as const,
    popular: true,
  },
  { 
    id: 'github', name: 'GitHub', category: 'Source Control', 
    desc: 'Commits, PRs, diffs, blame, file history, deploy events',
    scopes: ['repo:read', 'actions:read', 'deployments:read'],
    scopeDescriptions: ['Read repository content, commits, and PRs (read-only)', 'Read GitHub Actions workflow runs and logs', 'Read deployment history and statuses'],
    authType: 'oauth' as const,
    popular: true,
  },
  { 
    id: 'slack', name: 'Slack', category: 'Communication', 
    desc: 'Read incident channels, push structured updates, create incident channels',
    scopes: ['channels:read', 'channels:history', 'chat:write'],
    scopeDescriptions: ['List and read channel information', 'Read message history in incident channels', 'Post structured incident updates to channels'],
    authType: 'oauth' as const,
    popular: true,
  },
  { 
    id: 'prometheus', name: 'Prometheus', category: 'Observability', 
    desc: 'Metrics collection, alerting rules, and alert history',
    scopes: ['query', 'alerts'],
    scopeDescriptions: ['Execute PromQL queries against your metrics', 'Read alerting rules and active alerts'],
    authType: 'api_key' as const,
  },
  { 
    id: 'kubernetes', name: 'Kubernetes', category: 'Infrastructure', 
    desc: 'Pods, deployments, events, configmaps, HPAs, nodes (read-only)',
    scopes: ['pods:read', 'deployments:read', 'events:read', 'configmaps:read'],
    scopeDescriptions: ['Read pod status, logs, and resource usage', 'Read deployment configurations and rollout history', 'Read cluster events and warnings', 'Read configmap contents (secrets excluded)'],
    authType: 'kubeconfig' as const,
  },
  { 
    id: 'jira', name: 'Jira', category: 'Ticketing', 
    desc: 'Issue tracking — create tickets, link incidents to issues',
    scopes: ['read:jira-work', 'write:jira-work'],
    scopeDescriptions: ['Read issues, projects, and boards', 'Create and update issues from incidents'],
    authType: 'oauth' as const,
  },
  { 
    id: 'grafana', name: 'Grafana', category: 'Observability', 
    desc: 'Dashboards, alerting, and annotation data',
    scopes: ['dashboards:read', 'alerts:read'],
    scopeDescriptions: ['Read dashboard panels and queries', 'Read Grafana alert rules and history'],
    authType: 'api_key' as const,
  },
];

export function OnboardingWizard() {
  const { onboardingStep, setOnboardingStep, completeOnboarding, updateSetupProgress } = useAppStore();
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);
  const [connectorStep, setConnectorStep] = useState<ConnectorSetupStep>('select');
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'success' | 'error' | null>(null);

  const selectedConnector = connectorCatalog.find(c => c.id === selectedConnectorId);

  const handleValidate = async () => {
    setIsValidating(true);
    setValidationResult(null);
    // Simulate API validation
    await new Promise(r => setTimeout(r, 2000));
    setIsValidating(false);
    setValidationResult('success');
  };

  const resetConnectorSetup = () => {
    setSelectedConnectorId(null);
    setConnectorStep('select');
    setApiKey('');
    setEndpoint('');
    setValidationResult(null);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 0.5px, transparent 0)`,
        backgroundSize: '40px 40px',
      }} />
      
      {/* Violet glow */}
      <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/4 blur-[160px]" />

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
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/20"
            >
              <Bug className="h-8 w-8 text-primary-foreground" />
            </motion.div>

            <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
              Welcome to <span className="gradient-brand-text">BugPilot</span>
            </h1>
            <p className="text-base text-muted-foreground mb-2">
              AI-powered incident root cause analysis
            </p>
            <p className="text-sm text-muted-foreground/60 mb-10 max-w-sm mx-auto leading-relaxed">
              BugPilot automates the manual work of investigating incidents — correlating logs, metrics, traces, 
              and deployment history to find root causes and propose fixes.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-10">
              {[
                { icon: Zap, label: 'Auto-Investigate', desc: '80-95% of RCA work automated' },
                { icon: Shield, label: 'Evidence-First', desc: 'Every conclusion cites specific signals' },
                { icon: Globe, label: 'Day-One Value', desc: 'Works with messy or incomplete data' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="p-4 rounded-xl border border-border bg-card text-center"
                >
                  <item.icon className="h-5 w-5 text-primary mx-auto mb-2.5" />
                  <p className="text-xs font-semibold text-foreground mb-1">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <Button size="lg" onClick={() => setOnboardingStep('org-setup')} className="gap-2 gradient-brand border-0 text-primary-foreground hover:opacity-90 h-12 px-8 text-sm font-semibold shadow-lg shadow-primary/20">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground/40 mt-4">Takes about 3 minutes to set up</p>
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
              <p className="text-sm text-muted-foreground mb-8">Your team's workspace for incidents, services, and investigations.</p>

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
                    className="mt-2 h-11 bg-card border-border focus:border-primary"
                  />
                </div>
                <div>
                  <Label className="text-sm text-foreground font-medium">URL Slug</Label>
                  <div className="mt-2 flex items-center rounded-lg border border-border bg-card overflow-hidden">
                    <span className="px-3 text-sm text-muted-foreground bg-muted h-11 flex items-center border-r border-border font-mono text-xs">bugpilot.app/</span>
                    <Input value={orgSlug} onChange={e => setOrgSlug(e.target.value)} placeholder="acme" className="border-0 h-11 bg-transparent focus-visible:ring-0" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button variant="ghost" onClick={() => setOnboardingStep('welcome')} className="text-muted-foreground">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={() => { updateSetupProgress('orgConfigured', true); setOnboardingStep('connect-first'); }}
                  disabled={!orgName.trim()} className="flex-1 gradient-brand border-0 text-primary-foreground hover:opacity-90 h-11">
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
              <AnimatePresence mode="wait">
                {/* Step: Select connector */}
                {connectorStep === 'select' && (
                  <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Connect your first data source</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                      BugPilot needs at least one data source to investigate incidents. Pick a tool your team uses.
                    </p>

                    <div className="space-y-1.5 max-h-[380px] overflow-y-auto scrollbar-thin pr-1">
                      {connectorCatalog.map(c => (
                        <button key={c.id}
                          onClick={() => { setSelectedConnectorId(c.id); setConnectorStep('overview'); }}
                          className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-surface-hover hover:border-primary/20 transition-all text-left group"
                        >
                          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                            <Link2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">{c.name}</span>
                              {c.popular && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Popular</span>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.desc}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground/40 shrink-0">{c.category}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-3 mt-6">
                      <Button variant="ghost" onClick={() => setOnboardingStep('org-setup')} className="text-muted-foreground">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back
                      </Button>
                      <Button variant="ghost" onClick={() => { setOnboardingStep('test-run'); }} className="flex-1 text-muted-foreground hover:text-foreground">
                        Skip for now — I'll connect later
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step: Overview — what this connector does */}
                {connectorStep === 'overview' && selectedConnector && (
                  <motion.div key="overview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <button onClick={() => { resetConnectorSetup(); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
                      <ArrowLeft className="h-3 w-3" /> Back to connectors
                    </button>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Link2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">{selectedConnector.name}</h2>
                        <p className="text-xs text-muted-foreground">{selectedConnector.category}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-5 mb-6">
                      <h3 className="text-sm font-semibold text-foreground mb-3">What this connector does</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{selectedConnector.desc}</p>
                      <h4 className="text-xs font-semibold text-foreground mb-2">Features enabled:</h4>
                      <ul className="space-y-1.5">
                        {selectedConnector.scopeDescriptions.map((scope, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                            {scope}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button onClick={() => setConnectorStep('permissions')} className="w-full gradient-brand border-0 text-primary-foreground hover:opacity-90 h-11">
                      Continue to Permissions <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </motion.div>
                )}

                {/* Step: Permissions — what scopes we need */}
                {connectorStep === 'permissions' && selectedConnector && (
                  <motion.div key="permissions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <button onClick={() => setConnectorStep('overview')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
                      <ArrowLeft className="h-3 w-3" /> Back
                    </button>
                    <h2 className="text-xl font-bold text-foreground mb-2">Permissions required</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                      BugPilot requests only read-only access to your data. Here's exactly what we need and why.
                    </p>

                    <div className="space-y-2 mb-6">
                      {selectedConnector.scopes.map((scope, i) => (
                        <div key={scope} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
                          <div className="h-6 w-6 rounded-md bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-3.5 w-3.5 text-success" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground font-mono">{scope}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{selectedConnector.scopeDescriptions[i]}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-lg border border-primary/10 bg-primary/5 p-3 mb-6">
                      <p className="text-xs text-muted-foreground">
                        <Shield className="h-3.5 w-3.5 text-primary inline mr-1.5" />
                        All data is encrypted in transit and at rest. PII is automatically redacted before processing.
                      </p>
                    </div>

                    <Button onClick={() => setConnectorStep('authenticate')} className="w-full gradient-brand border-0 text-primary-foreground hover:opacity-90 h-11">
                      Continue to Authentication <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </motion.div>
                )}

                {/* Step: Authenticate */}
                {connectorStep === 'authenticate' && selectedConnector && (
                  <motion.div key="authenticate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <button onClick={() => setConnectorStep('permissions')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
                      <ArrowLeft className="h-3 w-3" /> Back
                    </button>
                    <h2 className="text-xl font-bold text-foreground mb-2">
                      {selectedConnector.authType === 'oauth' ? 'Connect with OAuth' : 'Enter credentials'}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-6">
                      {selectedConnector.authType === 'oauth' 
                        ? `Click below to authenticate with ${selectedConnector.name}. You'll be redirected to authorize BugPilot.`
                        : `Provide your ${selectedConnector.name} API credentials. You can find these in your ${selectedConnector.name} settings.`
                      }
                    </p>

                    {selectedConnector.authType === 'oauth' ? (
                      <Button onClick={() => setConnectorStep('validate')} className="w-full h-12 gap-2 gradient-brand border-0 text-primary-foreground hover:opacity-90">
                        <ExternalLink className="h-4 w-4" /> Authorize with {selectedConnector.name}
                      </Button>
                    ) : selectedConnector.authType === 'kubeconfig' ? (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-foreground">Cluster Name</Label>
                          <Input placeholder="production-us-east-1" className="mt-1.5 h-10 bg-card border-border" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-foreground">Kubeconfig</Label>
                          <textarea placeholder="Paste your kubeconfig content..." 
                            className="mt-1.5 w-full h-32 rounded-lg border border-border bg-card px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
                        </div>
                        <Button onClick={() => setConnectorStep('validate')} className="w-full h-11 gradient-brand border-0 text-primary-foreground hover:opacity-90">
                          Validate Connection <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-foreground">API Key</Label>
                          <div className="relative mt-1.5">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                              placeholder={`Enter your ${selectedConnector.name} API key`}
                              className="pl-10 h-10 bg-card border-border font-mono text-xs" />
                          </div>
                          <p className="text-[11px] text-muted-foreground/60 mt-1.5">
                            Find this in {selectedConnector.name} → Settings → API Keys
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-foreground">Endpoint URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
                          <Input value={endpoint} onChange={e => setEndpoint(e.target.value)}
                            placeholder={`https://api.${selectedConnector.id}.com`}
                            className="mt-1.5 h-10 bg-card border-border text-xs" />
                        </div>
                        <Button onClick={() => setConnectorStep('validate')} disabled={!apiKey}
                          className="w-full h-11 gradient-brand border-0 text-primary-foreground hover:opacity-90">
                          Validate Connection <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step: Validate */}
                {connectorStep === 'validate' && selectedConnector && (
                  <motion.div key="validate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h2 className="text-xl font-bold text-foreground mb-6">Validating connection...</h2>

                    {!validationResult && !isValidating && (
                      <div className="text-center py-8">
                        <Button onClick={handleValidate} className="gradient-brand border-0 text-primary-foreground hover:opacity-90 h-11 px-8">
                          Run Connection Test
                        </Button>
                      </div>
                    )}

                    {isValidating && (
                      <div className="flex flex-col items-center py-12">
                        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                        <p className="text-sm text-foreground mb-1">Testing connection to {selectedConnector.name}...</p>
                        <p className="text-xs text-muted-foreground">Verifying credentials and required scopes</p>
                      </div>
                    )}

                    {!isValidating && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {validationResult === 'success' && (
                          <div className="text-center py-8">
                            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                              <Check className="h-7 w-7 text-success" />
                            </div>
                            <p className="text-base font-semibold text-foreground mb-1">Connection successful!</p>
                            <p className="text-sm text-muted-foreground mb-2">
                              {selectedConnector.name} is connected and all required scopes are available.
                            </p>
                            <div className="rounded-lg border border-success/20 bg-success/5 p-3 mb-6 text-left max-w-sm mx-auto">
                              <p className="text-xs text-success font-medium mb-1">Initial sync starting</p>
                              <p className="text-[11px] text-muted-foreground">BugPilot will begin ingesting data from {selectedConnector.name}. This typically takes 2-5 minutes.</p>
                            </div>
                            <Button onClick={() => { updateSetupProgress('firstConnectorLinked', true); setOnboardingStep('test-run'); }}
                              className="gradient-brand border-0 text-primary-foreground hover:opacity-90 h-11 px-8">
                              Continue <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        )}

                        {validationResult === 'error' && (
                          <div className="text-center py-8">
                            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                              <AlertCircle className="h-7 w-7 text-destructive" />
                            </div>
                            <p className="text-base font-semibold text-foreground mb-1">Connection failed</p>
                            <p className="text-sm text-muted-foreground mb-4">Check your credentials and try again.</p>
                            <div className="flex gap-3 justify-center">
                              <Button variant="outline" onClick={() => setConnectorStep('authenticate')}>
                                <ArrowLeft className="h-4 w-4 mr-1" /> Try Again
                              </Button>
                              <Button variant="ghost" onClick={() => { setOnboardingStep('test-run'); }} className="text-muted-foreground">
                                Skip for now
                              </Button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                  </motion.div>
                )}
              </AnimatePresence>
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
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }}
                className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-6">
                <Rocket className="h-7 w-7 text-success" />
              </motion.div>

              <h2 className="text-2xl font-bold text-foreground mb-2">You're ready to go!</h2>
              <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">Here's what happens next:</p>

              <div className="space-y-2.5 text-left max-w-sm mx-auto mb-8">
                {[
                  { step: '1', text: 'BugPilot discovers your services and builds a topology map from connected sources' },
                  { step: '2', text: 'When an incident triggers (or you declare one), we auto-investigate and correlate signals' },
                  { step: '3', text: 'You review the evidence, approve proposed fixes, and resolve faster than ever' },
                ].map((item, i) => (
                  <motion.div key={item.step} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.15 }}
                    className="flex gap-3 items-start p-3 rounded-lg border border-border bg-card">
                    <span className="h-6 w-6 rounded-full gradient-brand text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{item.step}</span>
                    <p className="text-sm text-foreground/90 leading-relaxed">{item.text}</p>
                  </motion.div>
                ))}
              </div>

              <Button size="lg" onClick={completeOnboarding}
                className="gradient-brand border-0 text-primary-foreground hover:opacity-90 h-12 px-10 text-sm font-semibold shadow-lg shadow-primary/20">
                Launch BugPilot <ChevronRight className="h-4 w-4 ml-1" />
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
        <div key={i} className={cn(
          'h-1.5 rounded-full transition-all duration-300',
          i + 1 === current ? 'w-8 gradient-brand' :
          i + 1 < current ? 'w-1.5 bg-primary' :
          'w-1.5 bg-muted'
        )} />
      ))}
    </div>
  );
}
