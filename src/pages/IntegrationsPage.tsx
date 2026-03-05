import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockConnectors } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CheckCircle, AlertCircle, Clock, Link2, Search, ArrowRight, ArrowLeft,
  ExternalLink, Shield, Check, Loader2, KeyRound, ChevronRight, X,
  GitBranch, MessageSquare, Server, FolderGit2, Hash, Lock, Eye, RefreshCw,
  Globe, Webhook, Database, Plus, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ConnectorSetupStep = 'list' | 'overview' | 'permissions' | 'authenticate' | 'configure' | 'validate';

type ConnectorStatus = 'connected' | 'error' | 'stale' | 'not_connected';

const statusConfig: Record<ConnectorStatus, { border: string; dotColor: string; badge: string; label: string; badgeBg: string }> = {
  connected: { border: 'border-emerald-500/20', dotColor: 'bg-emerald-400', badge: 'text-emerald-400', label: 'Connected', badgeBg: 'bg-emerald-500/10 border-emerald-500/20' },
  error: { border: 'border-severity-p0/20', dotColor: 'bg-severity-p0', badge: 'text-severity-p0', label: 'Error', badgeBg: 'bg-severity-p0/10 border-severity-p0/20' },
  stale: { border: 'border-severity-p2/20', dotColor: 'bg-severity-p2', badge: 'text-severity-p2', label: 'Stale', badgeBg: 'bg-severity-p2/10 border-severity-p2/20' },
  not_connected: { border: 'border-border', dotColor: 'bg-muted-foreground/40', badge: 'text-muted-foreground', label: 'Not Connected', badgeBg: 'bg-muted border-border' },
};

// Full connector configuration with resource selection
interface ConnectorDetail {
  scopes: string[];
  scopeDescs: string[];
  authType: 'api_key' | 'oauth' | 'kubeconfig';
  features: string[];
  resources: ResourceConfig[];
}

interface ResourceConfig {
  type: string;
  label: string;
  pluralLabel: string;
  icon: React.ElementType;
  description: string;
  items: ResourceItem[];
  requiresPermission?: boolean;
}

interface ResourceItem {
  id: string;
  name: string;
  description?: string;
  visibility?: 'public' | 'private' | 'internal';
  permission?: string;
  meta?: string;
}

const connectorDetails: Record<string, ConnectorDetail> = {
  'PagerDuty': {
    scopes: ['incidents.read', 'oncalls.read', 'escalation_policies.read'],
    scopeDescs: ['Read incidents and alert history', 'Read on-call schedules', 'Read escalation policies'],
    authType: 'api_key',
    features: ['Auto-trigger investigations from PagerDuty alerts', 'Show on-call engineers for affected services', 'Correlate alert timing with deploy events'],
    resources: [
      {
        type: 'services', label: 'Service', pluralLabel: 'Services', icon: Server,
        description: 'Select which PagerDuty services to monitor for alerts',
        items: [
          { id: 'svc-1', name: 'payment-service', description: 'Payments team', meta: '12 integrations' },
          { id: 'svc-2', name: 'checkout-api', description: 'Commerce team', meta: '8 integrations' },
          { id: 'svc-3', name: 'user-profile-service', description: 'Platform team', meta: '5 integrations' },
          { id: 'svc-4', name: 'auth-service', description: 'Platform team', meta: '3 integrations' },
          { id: 'svc-5', name: 'order-service', description: 'Commerce team', meta: '6 integrations' },
        ],
      },
      {
        type: 'escalation_policies', label: 'Escalation Policy', pluralLabel: 'Escalation Policies', icon: Webhook,
        description: 'Which escalation policies should trigger BugPilot auto-investigation?',
        items: [
          { id: 'ep-1', name: 'Payments Team P0', description: 'Critical payment incidents', meta: '3 levels' },
          { id: 'ep-2', name: 'Platform On-Call', description: 'General platform issues', meta: '2 levels' },
          { id: 'ep-3', name: 'Infrastructure Critical', description: 'Infra-level emergencies', meta: '4 levels' },
        ],
      },
    ],
  },
  'Datadog': {
    scopes: ['logs_read', 'metrics_read', 'apm_read'],
    scopeDescs: ['Search and read log entries', 'Read metric time series', 'Read APM traces and spans'],
    authType: 'api_key',
    features: ['Ingest logs as investigation evidence', 'Detect metric anomalies automatically', 'Trace request flows across services'],
    resources: [
      {
        type: 'log_indexes', label: 'Log Index', pluralLabel: 'Log Indexes', icon: Database,
        description: 'Select which Datadog log indexes BugPilot should search during investigations',
        items: [
          { id: 'li-1', name: 'main', description: 'Primary application logs', meta: '45.2 GB/day' },
          { id: 'li-2', name: 'error-logs', description: 'Error-level logs only', meta: '2.1 GB/day' },
          { id: 'li-3', name: 'security', description: 'Security audit logs', meta: '800 MB/day' },
        ],
      },
      {
        type: 'apm_services', label: 'APM Service', pluralLabel: 'APM Services', icon: Server,
        description: 'Select services to enable distributed trace analysis',
        items: [
          { id: 'apm-1', name: 'payment-service', description: 'Python / FastAPI', meta: '1.2k req/s' },
          { id: 'apm-2', name: 'checkout-api', description: 'Node.js / Express', meta: '800 req/s' },
          { id: 'apm-3', name: 'user-profile-service', description: 'Go / Gin', meta: '2.5k req/s' },
          { id: 'apm-4', name: 'auth-service', description: 'Go / Gin', meta: '3.1k req/s' },
        ],
      },
    ],
  },
  'GitHub': {
    scopes: ['repo:read', 'actions:read', 'deployments:read'],
    scopeDescs: ['Read repo content, commits, PRs (read-only)', 'Read workflow run logs', 'Read deployment history'],
    authType: 'oauth',
    features: ['Correlate deploys with incident timing', 'Show recent code changes for affected services', 'Generate rollback PRs as fix proposals'],
    resources: [
      {
        type: 'repositories', label: 'Repository', pluralLabel: 'Repositories', icon: FolderGit2,
        description: 'Select repositories BugPilot should monitor for commits, PRs, and deploy events',
        requiresPermission: true,
        items: [
          { id: 'repo-1', name: 'acme/payment-service', visibility: 'private', permission: 'admin', meta: 'Last push 2h ago', description: 'Payment processing microservice' },
          { id: 'repo-2', name: 'acme/checkout-api', visibility: 'private', permission: 'write', meta: 'Last push 3d ago', description: 'Checkout flow API' },
          { id: 'repo-3', name: 'acme/user-profile-service', visibility: 'private', permission: 'write', meta: 'Last push 1d ago', description: 'User profiles and preferences' },
          { id: 'repo-4', name: 'acme/auth-service', visibility: 'private', permission: 'admin', meta: 'Last push 5d ago', description: 'Authentication & authorization' },
          { id: 'repo-5', name: 'acme/infrastructure', visibility: 'private', permission: 'read', meta: 'Last push 12h ago', description: 'Terraform configs & k8s manifests' },
          { id: 'repo-6', name: 'acme/deploy-scripts', visibility: 'internal', permission: 'write', meta: 'Last push 7d ago', description: 'CI/CD pipeline scripts' },
          { id: 'repo-7', name: 'acme/shared-libs', visibility: 'private', permission: 'read', meta: 'Last push 14d ago', description: 'Shared internal libraries' },
        ],
      },
      {
        type: 'environments', label: 'Environment', pluralLabel: 'Deployment Environments', icon: Globe,
        description: 'Which deployment environments should BugPilot track?',
        items: [
          { id: 'env-1', name: 'production', description: 'Live production environment', meta: 'Auto-tracked' },
          { id: 'env-2', name: 'staging', description: 'Pre-production staging', meta: 'Manual tracking' },
          { id: 'env-3', name: 'canary', description: 'Canary release target', meta: 'Manual tracking' },
        ],
      },
    ],
  },
  'Slack': {
    scopes: ['channels:read', 'channels:history', 'chat:write'],
    scopeDescs: ['List channels', 'Read incident channel history', 'Post incident updates'],
    authType: 'oauth',
    features: ['Auto-create incident channels for P0/P1', 'Archive channel messages into incident timeline', 'Push investigation updates in real-time'],
    resources: [
      {
        type: 'channels', label: 'Channel', pluralLabel: 'Channels', icon: Hash,
        description: 'Select channels BugPilot should monitor and post to. Incident channels are auto-discovered.',
        items: [
          { id: 'ch-1', name: '#incidents', description: 'Main incident coordination', meta: '342 members' },
          { id: 'ch-2', name: '#incidents-p0', description: 'P0 critical incidents only', meta: '128 members' },
          { id: 'ch-3', name: '#on-call', description: 'On-call team channel', meta: '45 members' },
          { id: 'ch-4', name: '#deployments', description: 'Deploy notifications', meta: '89 members' },
          { id: 'ch-5', name: '#platform-alerts', description: 'Platform monitoring alerts', meta: '67 members' },
        ],
      },
    ],
  },
  'Prometheus': {
    scopes: ['query', 'alerts'],
    scopeDescs: ['Execute PromQL queries', 'Read alerting rules and history'],
    authType: 'api_key',
    features: ['Query metrics during investigations', 'Detect anomalies in SLI metrics', 'Track SLO burn rates'],
    resources: [
      {
        type: 'namespaces', label: 'Namespace', pluralLabel: 'Metric Namespaces', icon: Database,
        description: 'Select Prometheus metric namespaces to query during investigations',
        items: [
          { id: 'ns-1', name: 'production', description: 'Production metrics', meta: '12k series' },
          { id: 'ns-2', name: 'staging', description: 'Staging metrics', meta: '8k series' },
        ],
      },
    ],
  },
  'Jaeger': {
    scopes: ['traces:read'],
    scopeDescs: ['Read distributed traces and spans'],
    authType: 'api_key',
    features: ['Trace request flows across microservices', 'Identify latency bottlenecks', 'Map service dependencies from traces'],
    resources: [
      {
        type: 'services', label: 'Service', pluralLabel: 'Traced Services', icon: Server,
        description: 'Select which traced services BugPilot should analyze',
        items: [
          { id: 'js-1', name: 'payment-service', description: 'Python / FastAPI', meta: '~400 traces/min' },
          { id: 'js-2', name: 'checkout-api', description: 'Node.js / Express', meta: '~250 traces/min' },
          { id: 'js-3', name: 'user-profile-service', description: 'Go / Gin', meta: '~600 traces/min' },
          { id: 'js-4', name: 'auth-service', description: 'Go / Gin', meta: '~900 traces/min' },
        ],
      },
    ],
  },
};

type StatusFilter = 'all' | 'connected' | 'error' | 'stale' | 'not_connected';

export default function IntegrationsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [setupStep, setSetupStep] = useState<ConnectorSetupStep>('list');
  const [selectedConnector, setSelectedConnector] = useState<typeof mockConnectors[0] | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationDone, setValidationDone] = useState(false);
  const [selectedResources, setSelectedResources] = useState<Record<string, string[]>>({});
  const [resourceSearch, setResourceSearch] = useState('');

  const categories = ['all', ...new Set(mockConnectors.map(c => c.category))];
  const connected = mockConnectors.filter(c => c.status === 'connected');
  const errored = mockConnectors.filter(c => c.status === 'error');
  const stale = mockConnectors.filter(c => c.status === 'stale');
  const notConnected = mockConnectors.filter(c => c.status === 'not_connected');

  const allConnectors = mockConnectors.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (category !== 'all' && c.category !== category) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredAvailable = notConnected.filter(c => {
    if (category !== 'all' && c.category !== category) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const startSetup = (connector: typeof mockConnectors[0]) => {
    setSelectedConnector(connector);
    setSetupStep('overview');
    setApiKey('');
    setValidationDone(false);
    setSelectedResources({});
    setResourceSearch('');
  };

  const closeSetup = () => {
    setSetupStep('list');
    setSelectedConnector(null);
    setApiKey('');
    setValidationDone(false);
    setSelectedResources({});
  };

  const handleValidate = async () => {
    setIsValidating(true);
    await new Promise(r => setTimeout(r, 2200));
    setIsValidating(false);
    setValidationDone(true);
  };

  const toggleResource = (type: string, id: string) => {
    setSelectedResources(prev => {
      const current = prev[type] || [];
      return {
        ...prev,
        [type]: current.includes(id) ? current.filter(r => r !== id) : [...current, id],
      };
    });
  };

  const selectAllResources = (type: string, items: ResourceItem[]) => {
    setSelectedResources(prev => ({
      ...prev,
      [type]: items.map(i => i.id),
    }));
  };

  const detail = selectedConnector ? connectorDetails[selectedConnector.name] : null;

  const totalSelectedResources = Object.values(selectedResources).reduce((sum, arr) => sum + arr.length, 0);

  const stepLabels = ['Overview', 'Permissions', 'Authenticate', 'Configure', 'Validate'];
  const stepKeys: ConnectorSetupStep[] = ['overview', 'permissions', 'authenticate', 'configure', 'validate'];
  const currentStepIdx = stepKeys.indexOf(setupStep);

  // Connector setup flow
  if (setupStep !== 'list' && selectedConnector && detail) {
    return (
      <div className="max-w-2xl">
        {/* Step Progress */}
        <div className="flex items-center gap-0 mb-8">
          {stepLabels.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                i === currentStepIdx ? 'bg-primary/10 text-primary border border-primary/20' :
                i < currentStepIdx ? 'text-emerald-400' : 'text-muted-foreground/40'
              )}>
                <span className={cn(
                  'h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center border',
                  i === currentStepIdx ? 'border-primary bg-primary/20 text-primary' :
                  i < currentStepIdx ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' :
                  'border-border bg-muted text-muted-foreground/40'
                )}>
                  {i < currentStepIdx ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{s}</span>
              </div>
              {i < stepLabels.length - 1 && <div className={cn('w-6 h-px mx-1', i < currentStepIdx ? 'bg-emerald-500/40' : 'bg-border')} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Overview */}
          {setupStep === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button onClick={closeSetup} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back to Integrations
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Link2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{selectedConnector.name}</h1>
                  <p className="text-xs text-muted-foreground">{selectedConnector.category}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">What this connector does</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{selectedConnector.description}</p>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">Features this enables</h4>
                <ul className="space-y-2">
                  {detail.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <div className="h-5 w-5 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-emerald-400" />
                      </div>
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
                  <div key={scope} className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card">
                    <div className="h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground font-mono">{scope}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{detail.scopeDescs[i]}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 mb-6 flex items-start gap-2.5">
                <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
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
                  ? `You'll be redirected to ${selectedConnector.name} to authorize BugPilot with the scopes shown above.`
                  : `Provide your ${selectedConnector.name} API credentials. Find these in your ${selectedConnector.name} settings.`
                }
              </p>

              {detail.authType === 'oauth' ? (
                <Button onClick={() => setSetupStep('configure')} className="w-full h-12 gap-2 gradient-brand border-0 text-primary-foreground hover:opacity-90">
                  <ExternalLink className="h-4 w-4" /> Authorize with {selectedConnector.name}
                </Button>
              ) : detail.authType === 'kubeconfig' ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-foreground">Cluster Name</Label>
                    <Input placeholder="production-us-east-1" className="mt-1.5 h-10 bg-card border-border" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-foreground">Kubeconfig</Label>
                    <textarea placeholder="Paste your kubeconfig YAML..." className="mt-1.5 w-full h-32 rounded-xl border border-border bg-card px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
                  </div>
                  <Button onClick={() => setSetupStep('configure')} className="w-full h-11 gradient-brand border-0 text-primary-foreground hover:opacity-90">
                    Continue to Configuration <ArrowRight className="h-4 w-4 ml-2" />
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
                    <Input placeholder={`https://api.${selectedConnector.name.toLowerCase()}.com`} className="mt-1.5 h-10 bg-card border-border text-xs" />
                  </div>
                  <Button onClick={() => setSetupStep('configure')} disabled={!apiKey}
                    className="w-full h-11 gradient-brand border-0 text-primary-foreground hover:opacity-90">
                    Continue to Configuration <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Configure — Resource Selection */}
          {setupStep === 'configure' && (
            <motion.div key="configure" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button onClick={() => setSetupStep('authenticate')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back
              </button>

              <h2 className="text-xl font-bold text-foreground mb-2">Configure {selectedConnector.name}</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Select the specific resources BugPilot should access. You can change these later in settings.
              </p>

              <div className="space-y-6">
                {detail.resources.map((resourceGroup) => {
                  const selected = selectedResources[resourceGroup.type] || [];
                  const ResourceIcon = resourceGroup.icon;

                  const filteredItems = resourceGroup.items.filter(item =>
                    !resourceSearch || item.name.toLowerCase().includes(resourceSearch.toLowerCase())
                  );

                  return (
                    <div key={resourceGroup.type} className="rounded-xl border border-border bg-card overflow-hidden">
                      {/* Resource group header */}
                      <div className="px-4 py-3 border-b border-border bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ResourceIcon className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">{resourceGroup.pluralLabel}</h3>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                              {selected.length}/{resourceGroup.items.length}
                            </span>
                          </div>
                          <button
                            onClick={() => selectAllResources(resourceGroup.type, resourceGroup.items)}
                            className="text-[11px] text-primary hover:text-primary/80 transition-colors font-medium"
                          >
                            Select all
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{resourceGroup.description}</p>
                      </div>

                      {/* Resource items */}
                      <div className="divide-y divide-border/50">
                        {resourceGroup.items.length > 5 && (
                          <div className="px-4 py-2">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                              <Input
                                placeholder={`Search ${resourceGroup.pluralLabel.toLowerCase()}...`}
                                value={resourceSearch}
                                onChange={e => setResourceSearch(e.target.value)}
                                className="pl-8 h-8 bg-background border-border text-xs"
                              />
                            </div>
                          </div>
                        )}
                        {filteredItems.map((item) => {
                          const isSelected = selected.includes(item.id);
                          return (
                            <label
                              key={item.id}
                              className={cn(
                                'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                                isSelected ? 'bg-primary/[0.03]' : 'hover:bg-muted/30'
                              )}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleResource(resourceGroup.type, item.id)}
                                className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                                  {item.visibility && (
                                    <span className={cn(
                                      'text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1',
                                      item.visibility === 'private' ? 'bg-muted text-muted-foreground' :
                                      item.visibility === 'internal' ? 'bg-primary/10 text-primary' :
                                      'bg-emerald-500/10 text-emerald-400'
                                    )}>
                                      {item.visibility === 'private' && <Lock className="h-2.5 w-2.5" />}
                                      {item.visibility === 'public' && <Eye className="h-2.5 w-2.5" />}
                                      {item.visibility}
                                    </span>
                                  )}
                                  {item.permission && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                      {item.permission}
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                                )}
                              </div>
                              {item.meta && (
                                <span className="text-[10px] text-muted-foreground/60 shrink-0 font-mono">{item.meta}</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-6">
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono tabular-nums text-foreground">{totalSelectedResources}</span> resource{totalSelectedResources !== 1 ? 's' : ''} selected
                </p>
                <Button
                  onClick={() => setSetupStep('validate')}
                  disabled={totalSelectedResources === 0}
                  className="gradient-brand border-0 text-primary-foreground hover:opacity-90 h-11 px-6"
                >
                  Validate Connection <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Validate */}
          {setupStep === 'validate' && (
            <motion.div key="validate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {!validationDone && !isValidating && (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">Ready to test the connection</p>
                  <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto">
                    BugPilot will verify credentials, test each selected scope, and confirm access to {totalSelectedResources} resource{totalSelectedResources !== 1 ? 's' : ''}.
                  </p>
                  <Button onClick={handleValidate} className="gradient-brand border-0 text-primary-foreground hover:opacity-90 h-11 px-8">
                    Run Connection Test
                  </Button>
                </div>
              )}

              {isValidating && (
                <div className="flex flex-col items-center py-16">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                  <p className="text-sm font-semibold text-foreground mb-1">Testing connection to {selectedConnector.name}...</p>
                  <p className="text-xs text-muted-foreground mb-6">Verifying credentials, scopes, and resource access</p>
                  <div className="w-full max-w-sm space-y-2">
                    {detail.scopes.map((scope, i) => (
                      <motion.div
                        key={scope}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.4 }}
                        className="flex items-center gap-2 text-xs"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.4 + 0.3 }}
                        >
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        </motion.div>
                        <span className="font-mono text-muted-foreground">{scope}</span>
                        <span className="text-emerald-400 text-[10px] ml-auto">verified</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {validationDone && !isValidating && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-7 w-7 text-emerald-400" />
                  </div>
                  <p className="text-lg font-semibold text-foreground mb-1">Connection successful!</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    {selectedConnector.name} is connected with access to {totalSelectedResources} resource{totalSelectedResources !== 1 ? 's' : ''}.
                  </p>

                  {/* Summary of selected resources */}
                  <div className="rounded-xl border border-border bg-card p-4 mb-4 text-left max-w-md mx-auto">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">Configuration summary</p>
                    {detail.resources.map(rg => {
                      const sel = selectedResources[rg.type] || [];
                      if (sel.length === 0) return null;
                      return (
                        <div key={rg.type} className="mb-2 last:mb-0">
                          <p className="text-[11px] text-muted-foreground mb-1">{rg.pluralLabel}</p>
                          <div className="flex flex-wrap gap-1">
                            {sel.map(id => {
                              const item = rg.items.find(i => i.id === id);
                              return item ? (
                                <span key={id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                                  {item.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 mb-6 text-left max-w-md mx-auto flex items-start gap-2.5">
                    <RefreshCw className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-emerald-400 font-medium">Initial sync starting</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Data ingestion typically takes 2-5 minutes.</p>
                    </div>
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
    <div className="space-y-6 max-w-5xl">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Integrations</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage data source connections for incident investigations</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Status summary */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="tabular-nums font-mono text-foreground">{connected.length}</span> connected
            </span>
            {errored.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-severity-p0" />
                <span className="tabular-nums font-mono text-severity-p0">{errored.length}</span> error{errored.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <Button size="sm" className="h-8 text-xs gap-1.5 gradient-brand border-0 text-primary-foreground hover:opacity-90">
            <Plus className="h-3.5 w-3.5" />
            Add Integration
          </Button>
        </div>
      </div>

      {/* ── Status filter tabs ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          { key: 'all' as StatusFilter, label: 'All', count: mockConnectors.length },
          { key: 'connected' as StatusFilter, label: 'Connected', count: connected.length },
          { key: 'error' as StatusFilter, label: 'Errors', count: errored.length },
          { key: 'stale' as StatusFilter, label: 'Stale', count: stale.length },
          { key: 'not_connected' as StatusFilter, label: 'Not Connected', count: notConnected.length },
        ]).map(f => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full transition-all font-medium border',
              statusFilter === f.key
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'text-muted-foreground border-border/50 hover:text-foreground hover:border-border bg-transparent',
            )}
          >
            {f.label}
            <span className={cn(
              'min-w-[16px] h-4 rounded-full text-[10px] font-bold flex items-center justify-center px-1',
              statusFilter === f.key ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
            )}>{f.count}</span>
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 w-48 bg-card border-border text-xs" />
          </div>
          <div className="flex items-center gap-1 bg-card rounded-lg border border-border p-0.5 overflow-x-auto">
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
      </div>

      {/* ── Connected + Active Sources ───────────────────────────────────────── */}
      {(statusFilter === 'all' || statusFilter === 'connected' || statusFilter === 'error' || statusFilter === 'stale') && (
        <>
          {mockConnectors.filter(c => c.status !== 'not_connected').filter(c => {
            if (statusFilter !== 'all' && c.status !== statusFilter) return false;
            if (category !== 'all' && c.category !== category) return false;
            if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
          }).length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Active Connections</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {mockConnectors.filter(c => c.status !== 'not_connected').filter(c => {
                  if (statusFilter !== 'all' && c.status !== statusFilter) return false;
                  if (category !== 'all' && c.category !== category) return false;
                  if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
                  return true;
                }).map((c, i) => {
                  const config = statusConfig[c.status as ConnectorStatus];
                  return (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className={cn('rounded-xl border bg-card p-4 transition-all hover:border-border', config.border)}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0">
                            <Link2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-foreground">{c.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.5 rounded-md bg-secondary text-[10px] text-muted-foreground border border-border/50">{c.category}</span>
                            </div>
                          </div>
                        </div>
                        <span className={cn('inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full font-medium border', config.badgeBg, config.badge)}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', config.dotColor, c.status === 'connected' ? 'animate-pulse' : '')} />
                          {config.label}
                        </span>
                      </div>

                      {c.status === 'error' && c.error_message && (
                        <div className="mb-3 p-2.5 rounded-lg bg-severity-p0/5 border border-severity-p0/20">
                          <p className="text-[11px] text-severity-p0 leading-relaxed">{c.error_message}</p>
                        </div>
                      )}

                      {c.status === 'stale' && (
                        <div className="mb-3 p-2.5 rounded-lg bg-severity-p2/5 border border-severity-p2/20">
                          <p className="text-[11px] text-severity-p2">Last sync {c.last_sync}. Data may be outdated.</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-3">
                        {c.last_sync && c.status !== 'stale' && (
                          <span className="font-mono">Synced {c.last_sync}</span>
                        )}
                        {c.items_synced && (
                          <span className="font-mono tabular-nums">{c.items_synced.toLocaleString()} items</span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {c.status === 'error' && (
                          <Button size="sm" className="h-7 text-xs gradient-brand border-0 text-primary-foreground">Re-authenticate</Button>
                        )}
                        {c.status === 'stale' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs">Force Sync</Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground ml-auto">Configure</Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Available Integrations ───────────────────────────────────────────── */}
      {(statusFilter === 'all' || statusFilter === 'not_connected') && filteredAvailable.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Available Integrations</p>
            <p className="text-[11px] text-muted-foreground">Connect to improve investigation quality</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAvailable.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-all group cursor-pointer"
                onClick={() => startSetup(c)}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-muted border border-border group-hover:bg-primary/10 group-hover:border-primary/20 transition-all flex items-center justify-center shrink-0">
                    <Link2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{c.name}</span>
                    <div className="mt-0.5">
                      <span className="px-1.5 py-0.5 rounded-md bg-secondary text-[10px] text-muted-foreground border border-border/50">{c.category}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors mt-0.5 shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                  <span className="text-[10px] text-muted-foreground">Not connected</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {allConnectors.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <div className="h-14 w-14 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No integrations found</p>
          <p className="text-xs text-muted-foreground">Try adjusting your search or filter.</p>
        </div>
      )}
    </div>
  );
}
