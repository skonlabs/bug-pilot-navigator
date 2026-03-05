import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockConnectors } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, AlertCircle, Clock, Link2, Search, ArrowRight, ArrowLeft, 
  ExternalLink, Zap, Shield, Check, Loader2, KeyRound, ChevronRight, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ConnectorSetupStep = 'list' | 'overview' | 'permissions' | 'authenticate' | 'validate';

const statusConfig = {
  connected: { border: 'border-success/20', badge: 'bg-success/10 text-success', icon: CheckCircle, label: 'Healthy' },
  error: { border: 'border-destructive/20', badge: 'bg-destructive/10 text-destructive', icon: AlertCircle, label: 'Error' },
  stale: { border: 'border-warning/20', badge: 'bg-warning/10 text-warning', icon: Clock, label: 'Stale' },
  not_connected: { border: 'border-border', badge: '', icon: Link2, label: '' },
};

// Extended connector detail info
const connectorDetails: Record<string, { 
  scopes: string[]; 
  scopeDescs: string[]; 
  authType: 'api_key' | 'oauth' | 'kubeconfig';
  features: string[];
}> = {
  'PagerDuty': { 
    scopes: ['incidents.read', 'oncalls.read', 'escalation_policies.read'],
    scopeDescs: ['Read incidents and alert history', 'Read on-call schedules', 'Read escalation policies'],
    authType: 'api_key', 
    features: ['Auto-trigger investigations from PagerDuty alerts', 'Show on-call engineers for affected services', 'Correlate alert timing with deploy events']
  },
  'Datadog': { 
    scopes: ['logs_read', 'metrics_read', 'apm_read'],
    scopeDescs: ['Search and read log entries', 'Read metric time series', 'Read APM traces and spans'],
    authType: 'api_key',
    features: ['Ingest logs as investigation evidence', 'Detect metric anomalies automatically', 'Trace request flows across services']
  },
  'GitHub': { 
    scopes: ['repo:read', 'actions:read', 'deployments:read'],
    scopeDescs: ['Read repo content, commits, PRs (read-only)', 'Read workflow run logs', 'Read deployment history'],
    authType: 'oauth',
    features: ['Correlate deploys with incident timing', 'Show recent code changes for affected services', 'Generate rollback PRs as fix proposals']
  },
  'Slack': {
    scopes: ['channels:read', 'channels:history', 'chat:write'],
    scopeDescs: ['List channels', 'Read incident channel history', 'Post incident updates'],
    authType: 'oauth',
    features: ['Auto-create incident channels for P0/P1', 'Archive channel messages into incident timeline', 'Push investigation updates in real-time']
  },
  'Prometheus': {
    scopes: ['query', 'alerts'],
    scopeDescs: ['Execute PromQL queries', 'Read alerting rules and history'],
    authType: 'api_key',
    features: ['Query metrics during investigations', 'Detect anomalies in SLI metrics', 'Track SLO burn rates']
  },
  'Jaeger': {
    scopes: ['traces:read'],
    scopeDescs: ['Read distributed traces and spans'],
    authType: 'api_key',
    features: ['Trace request flows across microservices', 'Identify latency bottlenecks', 'Map service dependencies from traces']
  },
};

export default function IntegrationsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [setupStep, setSetupStep] = useState<ConnectorSetupStep>('list');
  const [selectedConnector, setSelectedConnector] = useState<typeof mockConnectors[0] | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationDone, setValidationDone] = useState(false);

  const categories = ['all', ...new Set(mockConnectors.map(c => c.category))];
  const connected = mockConnectors.filter(c => c.status !== 'not_connected');
  const available = mockConnectors.filter(c => c.status === 'not_connected');

  const filteredAvailable = available.filter(c => {
    if (category !== 'all' && c.category !== category) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const startSetup = (connector: typeof mockConnectors[0]) => {
    setSelectedConnector(connector);
    setSetupStep('overview');
    setApiKey('');
    setValidationDone(false);
  };

  const closeSetup = () => {
    setSetupStep('list');
    setSelectedConnector(null);
    setApiKey('');
    setValidationDone(false);
  };

  const handleValidate = async () => {
    setIsValidating(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsValidating(false);
    setValidationDone(true);
  };

  const detail = selectedConnector ? connectorDetails[selectedConnector.name] : null;

  // Connector setup flow (overlay)
  if (setupStep !== 'list' && selectedConnector && detail) {
    return (
      <div className="max-w-2xl">
        <AnimatePresence mode="wait">
          {/* Overview */}
          {setupStep === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button onClick={closeSetup} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back to Integrations
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Link2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{selectedConnector.name}</h1>
                  <p className="text-xs text-muted-foreground">{selectedConnector.category}</p>
                </div>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-0 mb-8">
                {['Overview', 'Permissions', 'Authenticate', 'Validate'].map((s, i) => (
                  <div key={s} className="flex items-center">
                    <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                      i === 0 ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                    )}>
                      <span className="h-4 w-4 rounded-full bg-current/20 text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                      {s}
                    </div>
                    {i < 3 && <div className="w-4 h-px bg-border mx-1" />}
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-border bg-card p-6 mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">What this connector does</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{selectedConnector.description}</p>
                
                <h4 className="text-xs font-semibold text-foreground mb-3">Features this enables:</h4>
                <ul className="space-y-2">
                  {detail.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <Button onClick={() => setSetupStep('permissions')} className="w-full gradient-brand border-0 text-primary-foreground hover:opacity-90 h-11">
                Continue to Permissions <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Permissions */}
          {setupStep === 'permissions' && (
            <motion.div key="permissions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button onClick={() => setSetupStep('overview')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back
              </button>

              <h2 className="text-xl font-bold text-foreground mb-2">Permissions required</h2>
              <p className="text-sm text-muted-foreground mb-6">
                BugPilot requests only the minimum scopes needed. All access is read-only unless explicitly stated.
              </p>

              <div className="space-y-2 mb-6">
                {detail.scopes.map((scope, i) => (
                  <div key={scope} className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-card">
                    <div className="h-6 w-6 rounded-md bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3.5 w-3.5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground font-mono">{scope}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{detail.scopeDescs[i]}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-primary/10 bg-primary/5 p-3 mb-6">
                <p className="text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5 text-primary inline mr-1.5" />
                  All data encrypted in transit (TLS 1.3) and at rest (AES-256). PII/secrets auto-redacted before processing.
                </p>
              </div>

              <Button onClick={() => setSetupStep('authenticate')} className="w-full gradient-brand border-0 text-primary-foreground hover:opacity-90 h-11">
                Continue to Authentication <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Authenticate */}
          {setupStep === 'authenticate' && (
            <motion.div key="authenticate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button onClick={() => setSetupStep('permissions')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back
              </button>

              <h2 className="text-xl font-bold text-foreground mb-2">
                {detail.authType === 'oauth' ? `Connect with ${selectedConnector.name}` : 'Enter credentials'}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {detail.authType === 'oauth'
                  ? `You'll be redirected to ${selectedConnector.name} to authorize BugPilot.`
                  : `Provide your ${selectedConnector.name} API credentials. Find these in your ${selectedConnector.name} settings.`
                }
              </p>

              {detail.authType === 'oauth' ? (
                <Button onClick={() => setSetupStep('validate')} className="w-full h-12 gap-2 gradient-brand border-0 text-primary-foreground hover:opacity-90">
                  <ExternalLink className="h-4 w-4" /> Authorize with {selectedConnector.name}
                </Button>
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
                    <Input placeholder={`https://api.${selectedConnector.name.toLowerCase()}.com`} className="mt-1.5 h-10 bg-card border-border text-xs" />
                  </div>
                  <Button onClick={() => setSetupStep('validate')} disabled={!apiKey}
                    className="w-full h-11 gradient-brand border-0 text-primary-foreground hover:opacity-90">
                    Validate Connection <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Validate */}
          {setupStep === 'validate' && (
            <motion.div key="validate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {!validationDone && !isValidating && (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground mb-4">Ready to test the connection</p>
                  <Button onClick={handleValidate} className="gradient-brand border-0 text-primary-foreground hover:opacity-90 h-11 px-8">
                    Run Connection Test
                  </Button>
                </div>
              )}

              {isValidating && (
                <div className="flex flex-col items-center py-16">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                  <p className="text-sm text-foreground mb-1">Testing connection to {selectedConnector.name}...</p>
                  <p className="text-xs text-muted-foreground">Verifying credentials and required scopes</p>
                </div>
              )}

              {validationDone && !isValidating && (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-7 w-7 text-success" />
                  </div>
                  <p className="text-lg font-semibold text-foreground mb-1">Connection successful!</p>
                  <p className="text-sm text-muted-foreground mb-2">{selectedConnector.name} is connected. All required scopes verified.</p>
                  <div className="rounded-lg border border-success/20 bg-success/5 p-3 mb-6 text-left max-w-sm mx-auto">
                    <p className="text-xs text-success font-medium mb-1">Initial sync starting</p>
                    <p className="text-[11px] text-muted-foreground">Data ingestion typically takes 2-5 minutes.</p>
                  </div>
                  <Button onClick={closeSetup} className="gradient-brand border-0 text-primary-foreground hover:opacity-90 h-11 px-8">
                    Done <Check className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Connected */}
      {connected.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-1">Connected Sources</h2>
          <p className="text-xs text-muted-foreground mb-4">Actively syncing with BugPilot.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {connected.map((c, i) => {
              const config = statusConfig[c.status];
              const StatusIcon = config.icon;
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className={cn('rounded-xl border bg-card p-4 transition-all hover:border-primary/10', config.border)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-foreground">{c.name}</span>
                        <p className="text-[10px] text-muted-foreground">{c.category}</p>
                      </div>
                    </div>
                    <span className={cn('inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium', config.badge)}>
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </span>
                  </div>

                  {c.status === 'error' && c.error_message && (
                    <div className="mb-3 p-2.5 rounded-md bg-destructive/5 border border-destructive/10">
                      <p className="text-[11px] text-destructive">{c.error_message}</p>
                    </div>
                  )}

                  {c.status === 'stale' && (
                    <div className="mb-3 p-2.5 rounded-md bg-warning/5 border border-warning/10">
                      <p className="text-[11px] text-warning">Last sync {c.last_sync}. Data may be outdated.</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-3">
                    {c.last_sync && c.status !== 'stale' && <span>Synced {c.last_sync}</span>}
                    {c.items_synced && <span>{c.items_synced.toLocaleString()} items</span>}
                  </div>

                  <div className="flex gap-2">
                    {c.status === 'error' && <Button size="sm" className="h-7 text-xs gradient-brand border-0 text-primary-foreground">Re-authenticate</Button>}
                    {c.status === 'stale' && <Button size="sm" className="h-7 text-xs">Force Sync</Button>}
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground">Settings</Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-1">Available Integrations</h2>
        <p className="text-xs text-muted-foreground mb-4">Connect additional data sources to improve investigation quality.</p>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search integrations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 bg-card border-border text-sm" />
          </div>
          <div className="flex items-center bg-card rounded-lg p-0.5 border border-border overflow-x-auto">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-md transition-all font-medium capitalize whitespace-nowrap',
                  category === cat ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                )}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAvailable.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-all group cursor-pointer"
              onClick={() => startSetup(c)}>
              <div className="flex items-start gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Link2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-foreground">{c.name}</span>
                  <p className="text-[10px] text-muted-foreground">{c.category}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors mt-0.5" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
            </motion.div>
          ))}
        </div>

        {filteredAvailable.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No integrations match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
