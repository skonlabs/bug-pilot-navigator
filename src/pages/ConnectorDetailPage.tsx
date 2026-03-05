import { useParams, useNavigate } from 'react-router-dom';
import { mockConnectors } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw,
  ExternalLink, Shield, Plug, ChevronRight, Loader2, Eye, EyeOff,
  Database, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';

type SetupStep = 'overview' | 'permissions' | 'connect' | 'validate' | 'sync';

const StepOrder: SetupStep[] = ['overview', 'permissions', 'connect', 'validate', 'sync'];

const StatusColors = {
  connected: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  error: 'bg-severity-p0/10 text-severity-p0 border-severity-p0/20',
  stale: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  not_connected: 'bg-secondary text-muted-foreground border-border',
};

const StatusLabels = {
  connected: 'Connected',
  error: 'Error',
  stale: 'Stale',
  not_connected: 'Not Connected',
};

export default function ConnectorDetailPage() {
  const { name } = useParams();
  const navigate = useNavigate();
  const connector = mockConnectors.find(c => c.slug === name || c.name.toLowerCase().replace(/\s+/g, '-') === name);

  const [step, setStep] = useState<SetupStep>(connector?.status !== 'not_connected' ? 'overview' : 'overview');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  if (!connector) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Connector not found</p>
          <Button variant="ghost" className="mt-2" onClick={() => navigate('/integrations')}>
            Back to Integrations
          </Button>
        </div>
      </div>
    );
  }

  const currentStepIdx = StepOrder.indexOf(step);
  const isNew = connector.status === 'not_connected';

  const handleStartSetup = () => {
    setIsSettingUp(true);
    setStep('overview');
  };

  const handleValidate = async () => {
    setValidating(true);
    await new Promise(r => setTimeout(r, 2000));
    setValidating(false);
    setValidated(true);
    setStep('validate');
  };

  const handleConnect = async () => {
    if (!apiKey && connector.auth_type === 'api_key') {
      toast.error('Please enter your API key');
      return;
    }
    await handleValidate();
  };

  const handleCompleteSyncStep = async () => {
    setSyncing(true);
    setStep('sync');
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 200));
      setSyncProgress(i);
    }
    setSyncing(false);
    toast.success(`${connector.name} connected successfully!`);
    navigate('/integrations');
  };

  const handleForceSync = () => {
    toast.info(`Syncing ${connector.name}...`);
  };

  const handleReAuthenticate = () => {
    setIsSettingUp(true);
    setStep('connect');
  };

  const handleDisconnect = () => {
    toast.success(`${connector.name} disconnected`);
    navigate('/integrations');
  };

  // Settings view for existing connector
  if (!isSettingUp && connector.status !== 'not_connected') {
    return (
      <div className="max-w-3xl space-y-6">
        {/* Back nav */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5 h-7" onClick={() => navigate('/integrations')}>
            <ArrowLeft className="h-3.5 w-3.5" /> Integrations
          </Button>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm text-foreground">{connector.name}</span>
        </div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-secondary border border-border flex items-center justify-center">
            <Plug className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{connector.name}</h1>
              <span className={cn('text-[10px] px-2 py-0.5 rounded border font-medium', StatusColors[connector.status])}>
                {StatusLabels[connector.status]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{connector.category}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {connector.status === 'error' && (
              <Button variant="default" size="sm" className="gap-1.5" onClick={handleReAuthenticate}>
                Re-authenticate
              </Button>
            )}
            {connector.status === 'stale' && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleForceSync}>
                <RefreshCw className="h-3.5 w-3.5" /> Force Sync
              </Button>
            )}
            {connector.status === 'connected' && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleForceSync}>
                <RefreshCw className="h-3.5 w-3.5" /> Sync Now
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-severity-p0 hover:text-severity-p0 gap-1.5" onClick={handleDisconnect}>
              <XCircle className="h-3.5 w-3.5" /> Disconnect
            </Button>
          </div>
        </motion.div>

        {/* Error Banner */}
        {connector.status === 'error' && (
          <div className="rounded-xl border border-severity-p0/30 bg-severity-p0/5 p-4 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-severity-p0 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-severity-p0">Connection Error</p>
              <p className="text-xs text-muted-foreground mt-0.5">{connector.error_message}</p>
              <Button size="sm" variant="default" className="mt-2 h-7 text-xs" onClick={handleReAuthenticate}>
                Re-authenticate
              </Button>
            </div>
          </div>
        )}

        {/* Stale Banner */}
        {connector.status === 'stale' && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
            <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-400">Data May Be Outdated</p>
              <p className="text-xs text-muted-foreground mt-0.5">Last sync: {connector.last_sync}. Data lag: {connector.data_lag}.</p>
              <Button size="sm" variant="outline" className="mt-2 h-7 text-xs gap-1.5" onClick={handleForceSync}>
                <RefreshCw className="h-3 w-3" /> Force Sync
              </Button>
            </div>
          </div>
        )}

        {/* Stats */}
        {connector.status === 'connected' && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Last Sync', value: connector.last_sync || '—', icon: Clock },
              { label: 'Items Synced', value: connector.items_synced?.toLocaleString() || '—', icon: Database },
              { label: 'Data Lag', value: connector.data_lag_secs ? `${connector.data_lag_secs}s` : '<30s', icon: Activity },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-border bg-surface-raised/30 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
                </div>
                <p className="text-sm font-mono font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Features */}
        {connector.features && (
          <div className="rounded-xl border border-border bg-surface-raised/30 p-5">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-3">Features Enabled</p>
            <ul className="space-y-2">
              {connector.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Scope Permissions */}
        {connector.scopes && (
          <div className="rounded-xl border border-border bg-surface-raised/30 p-5">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-3">Permission Scopes</p>
            <div className="space-y-2">
              {connector.scopes.map(scope => (
                <div key={scope.scope} className="flex items-start gap-3 p-2.5 rounded-lg border border-border/50">
                  {scope.granted === true ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : scope.granted === false ? (
                    <XCircle className="h-4 w-4 text-severity-p0 shrink-0 mt-0.5" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-border shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-xs font-mono font-medium text-foreground">{scope.scope}</p>
                    <p className="text-[11px] text-muted-foreground">{scope.description}</p>
                    {!scope.required && (
                      <span className="text-[10px] text-muted-foreground/50 italic">Optional</span>
                    )}
                    {scope.granted === false && (
                      <p className="text-[11px] text-severity-p0 mt-0.5">Scope not granted — some features may be unavailable</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Setup Wizard for new or re-authenticating connector
  return (
    <div className="max-w-2xl space-y-6">
      {/* Back */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-1.5 h-7" onClick={() => navigate('/integrations')}>
          <ArrowLeft className="h-3.5 w-3.5" /> Integrations
        </Button>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm">Connect {connector.name}</span>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-2">
        {StepOrder.filter(s => s !== 'sync').map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all',
              StepOrder.indexOf(step) > i ? 'bg-primary border-primary text-white' :
              s === step ? 'bg-primary/20 border-primary text-primary' :
              'bg-secondary border-border text-muted-foreground'
            )}>
              {StepOrder.indexOf(step) > i ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={cn('text-xs capitalize hidden sm:inline',
              s === step ? 'text-foreground font-medium' : 'text-muted-foreground'
            )}>
              {s}
            </span>
            {i < StepOrder.filter(s => s !== 'sync').length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/30 mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          className="rounded-xl border border-border bg-surface-raised/30 p-6 space-y-5"
        >
          {step === 'overview' && (
            <>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-secondary border border-border flex items-center justify-center">
                    <Plug className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">{connector.name}</h2>
                    <p className="text-xs text-muted-foreground">{connector.category}</p>
                  </div>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{connector.description}</p>
              </div>
              {connector.features && (
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-3">What This Enables</p>
                  <ul className="space-y-2">
                    {connector.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Button className="w-full" onClick={() => setStep('permissions')}>
                Continue <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          )}

          {step === 'permissions' && (
            <>
              <div>
                <h2 className="text-base font-bold text-foreground mb-1">Permissions Required</h2>
                <p className="text-xs text-muted-foreground">BugPilot requests only read-only access. We never write to your systems without explicit approval.</p>
              </div>
              <div className="space-y-2">
                {(connector.scopes || [
                  { scope: 'read_only', description: `Read-only access to ${connector.name} data`, required: true },
                ]).map(scope => (
                  <div key={scope.scope} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-secondary/20">
                    <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-mono font-medium text-foreground">{scope.scope}</p>
                        {scope.required && <span className="text-[10px] text-primary">Required</span>}
                        {!scope.required && <span className="text-[10px] text-muted-foreground/50">Optional</span>}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{scope.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('overview')}>Back</Button>
                <Button className="flex-1" onClick={() => setStep('connect')}>
                  Understood — Continue <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          )}

          {step === 'connect' && (
            <>
              <div>
                <h2 className="text-base font-bold text-foreground mb-1">Connect {connector.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {connector.auth_type === 'oauth2'
                    ? 'Click the button below to authenticate via OAuth. You\'ll be redirected to authorize BugPilot.'
                    : 'Enter your API key. BugPilot stores keys encrypted at rest.'}
                </p>
              </div>

              {connector.auth_type === 'oauth2' ? (
                <div className="text-center py-4">
                  <Button size="lg" className="gap-2" onClick={handleConnect}>
                    <ExternalLink className="h-4 w-4" />
                    Connect with {connector.name}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">
                    You'll be redirected to {connector.name} to authorize access.
                    BugPilot will only request the scopes listed in the previous step.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="api-key" className="text-xs">
                      API Key
                      <a href="#" className="ml-2 text-primary text-[11px] hover:underline inline-flex items-center gap-0.5">
                        Where to find this <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="api-key"
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        placeholder={`Enter your ${connector.name} API key...`}
                        className="pr-10 font-mono text-sm"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowKey(!showKey)}
                      >
                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Stored encrypted using AES-256. Never logged or transmitted in plaintext.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep('permissions')}>Back</Button>
                    <Button className="flex-1" onClick={handleConnect} disabled={!apiKey}>
                      Validate Connection <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 'validate' && (
            <>
              <div>
                <h2 className="text-base font-bold text-foreground mb-1">Validating Connection</h2>
                <p className="text-xs text-muted-foreground">Verifying API key and required permission scopes...</p>
              </div>
              {validating ? (
                <div className="flex items-center justify-center py-8 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Checking scopes...</span>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {(connector.scopes || [{ scope: 'read_only', description: 'Read-only access', required: true }]).map(scope => (
                      <div key={scope.scope} className="flex items-center gap-3 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-xs font-mono font-medium text-foreground">{scope.scope}</p>
                          <p className="text-[11px] text-emerald-400">Granted ✓</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full" onClick={handleCompleteSyncStep}>
                    Complete Setup — Start Initial Sync <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </>
              )}
            </>
          )}

          {step === 'sync' && (
            <>
              <div className="text-center py-4 space-y-4">
                {syncing ? (
                  <>
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                    <div>
                      <p className="text-base font-semibold text-foreground">Setting up {connector.name}...</p>
                      <p className="text-xs text-muted-foreground mt-1">Do not navigate away during initial sync.</p>
                    </div>
                    <div className="space-y-2 text-left max-w-xs mx-auto">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Syncing data...</span>
                        <span>{syncProgress}%</span>
                      </div>
                      <Progress value={syncProgress} className="h-2" />
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                    <div>
                      <p className="text-lg font-bold text-foreground">{connector.name} Connected!</p>
                      <p className="text-xs text-muted-foreground mt-1">Initial sync complete. BugPilot will now use this data source for investigations.</p>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
