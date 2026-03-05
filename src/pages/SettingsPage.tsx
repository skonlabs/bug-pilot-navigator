import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import {
  Settings as SettingsIcon, Users, Key, Shield, Copy, Trash2, Plus,
  ExternalLink, Check, ChevronRight
} from 'lucide-react';
import { mockTeamMembers, mockApiKeys, mockOrg } from '@/data/mock-data';
import { format } from 'date-fns';

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  admin: { label: 'Admin', className: 'bg-primary/10 text-primary' },
  responder: { label: 'Responder', className: 'bg-success/10 text-success' },
  viewer: { label: 'Viewer', className: 'bg-muted text-muted-foreground' },
  security_admin: { label: 'Security Admin', className: 'bg-amber-500/10 text-amber-400' },
};

export default function SettingsPage() {
  const [orgName, setOrgName] = useState(mockOrg.name);
  const [timezone, setTimezone] = useState(mockOrg.timezone || 'UTC');
  const [activeTab, setActiveTab] = useState('general');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const tabs = [
    { key: 'general', label: 'General', icon: SettingsIcon },
    { key: 'members', label: 'Members', icon: Users },
    { key: 'api-keys', label: 'API Keys', icon: Key },
    { key: 'security', label: 'Security', icon: Shield },
  ];

  const handleCopyKey = (id: string, prefix: string) => {
    navigator.clipboard.writeText(`${prefix}****************************`).catch(() => {});
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl">
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-secondary-foreground hover:border-border'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div>
            <h2 className="text-base font-semibold text-foreground mb-1">General Settings</h2>
            <p className="text-sm text-muted-foreground mb-5">Manage your organization configuration.</p>
            <div className="space-y-4 max-w-md">
              <div>
                <Label className="text-sm text-foreground font-medium">Organization Name</Label>
                <Input value={orgName} onChange={e => setOrgName(e.target.value)} className="mt-1.5 h-10 bg-secondary/50 border-border" />
              </div>
              <div>
                <Label className="text-sm text-foreground font-medium">Organization Slug</Label>
                <Input value={mockOrg.slug} readOnly className="mt-1.5 h-10 bg-secondary/50 border-border text-muted-foreground cursor-not-allowed" />
                <p className="text-[11px] text-muted-foreground mt-1">Slug cannot be changed after creation.</p>
              </div>
              <div>
                <Label className="text-sm text-foreground font-medium">Plan</Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground capitalize">{mockOrg.plan}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Active</span>
                </div>
              </div>
              <div>
                <Label className="text-sm text-foreground font-medium">Default Timezone</Label>
                <Input value={timezone} onChange={e => setTimezone(e.target.value)} className="mt-1.5 h-10 bg-secondary/50 border-border" />
              </div>
              <Button
                size="sm"
                onClick={handleSave}
                className={cn('gap-1.5', saved ? 'bg-success/20 text-success border border-success/30' : 'gradient-brand border-0 text-primary-foreground hover:opacity-90')}
              >
                {saved ? <><Check className="h-3.5 w-3.5" /> Saved!</> : 'Save Changes'}
              </Button>
            </div>
          </div>

          {/* Notification preferences */}
          <div className="border-t border-border pt-6">
            <h2 className="text-base font-semibold text-foreground mb-1">Notification Preferences</h2>
            <p className="text-sm text-muted-foreground mb-4">Control which events trigger in-app and Slack notifications.</p>
            <div className="space-y-3 max-w-md">
              {[
                { label: 'P0/P1 incident declared', enabled: true },
                { label: 'Investigation complete', enabled: true },
                { label: 'Fix approval required', enabled: true },
                { label: 'Connector error', enabled: false },
                { label: 'Postmortem overdue', enabled: true },
              ].map(item => (
                <label key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer hover:bg-secondary/50 transition-colors">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <input type="checkbox" defaultChecked={item.enabled} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                </label>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'members' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Team Members</h2>
              <p className="text-sm text-muted-foreground">{mockTeamMembers.length} members with access to your organization.</p>
            </div>
            <Button size="sm" className="gap-1.5 gradient-brand border-0 text-primary-foreground hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> Invite Member
            </Button>
          </div>
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            {mockTeamMembers.map((member, i) => {
              const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.viewer;
              return (
                <div key={member.id} className={cn(
                  'flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors',
                  i < mockTeamMembers.length - 1 && 'border-b border-border/50'
                )}>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-primary">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={cn('text-xs px-2 py-0.5 rounded-md font-medium', roleConfig.className)}>
                        {roleConfig.label}
                      </span>
                      {member.joined_at && (
                        <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                          Joined {format(new Date(member.joined_at), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {activeTab === 'api-keys' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">API Keys</h2>
              <p className="text-sm text-muted-foreground">Manage API keys for programmatic access and webhook integrations.</p>
            </div>
            <Button size="sm" className="gap-1.5 gradient-brand border-0 text-primary-foreground hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> Generate Key
            </Button>
          </div>

          <div className="p-3 rounded-lg border border-border/50 bg-secondary/20 text-xs text-muted-foreground">
            API keys grant full API access. Store them securely — they will not be shown again after creation.
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {mockApiKeys.map((item, i) => (
              <div key={item.id} className={cn(
                'flex items-center justify-between p-4 hover:bg-surface-hover transition-colors',
                i < mockApiKeys.length - 1 && 'border-b border-border/50'
              )}>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.prefix}••••••••••••••••••••••••••••</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-[10px] text-muted-foreground/60">
                      Created {format(new Date(item.created_at), 'MMM d, yyyy')} by {item.created_by}
                    </p>
                    {item.last_used_at && (
                      <p className="text-[10px] text-muted-foreground/60">
                        Last used {format(new Date(item.last_used_at), 'MMM d')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 text-muted-foreground"
                    onClick={() => handleCopyKey(item.id, item.prefix)}
                  >
                    {copiedKey === item.id ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                    {copiedKey === item.id ? 'Copied' : 'Copy'}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-severity-p0 hover:text-severity-p0 hover:bg-severity-p0/10">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Use your API key with the Authorization header: <code className="font-mono bg-secondary px-1.5 py-0.5 rounded">Bearer &lt;key&gt;</code></p>
          </div>
        </motion.div>
      )}

      {activeTab === 'security' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">Security & Audit</h2>
            <p className="text-sm text-muted-foreground">Manage security settings and review your organization's audit trail.</p>
          </div>

          {/* Audit Log Card */}
          <Link
            to="/settings/audit"
            className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-surface-hover transition-colors group"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Audit Log</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                All user actions, system events, and automated operations are logged with full attribution and timestamps.
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          </Link>

          {/* Security settings */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Authentication</h3>
            {[
              { label: 'Enforce SSO for all members', desc: 'Require SAML/OIDC sign-in. API key auth still allowed.', enabled: false },
              { label: 'Require MFA', desc: 'All members must have MFA enabled to access the platform.', enabled: true },
              { label: 'Session timeout after inactivity', desc: 'Automatically sign out inactive users after 8 hours.', enabled: true },
            ].map(item => (
              <label key={item.label} className="flex items-start justify-between gap-4 p-3.5 rounded-lg border border-border/50 bg-secondary/20 cursor-pointer hover:bg-secondary/40 transition-colors">
                <div>
                  <p className="text-sm text-foreground font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
                <input type="checkbox" defaultChecked={item.enabled} className="h-4 w-4 rounded border-border text-primary focus:ring-primary mt-0.5 shrink-0" />
              </label>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Permissions</h3>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {[
                { action: 'Approve Tier-1 fixes (auto-execute)', roles: ['admin', 'responder'] },
                { action: 'Approve Tier-2 fixes (approve-to-run)', roles: ['admin'] },
                { action: 'Export resolution packets', roles: ['admin', 'responder', 'viewer'] },
                { action: 'Manage connectors', roles: ['admin'] },
                { action: 'View audit log', roles: ['admin', 'security_admin'] },
              ].map((row, i) => (
                <div key={i} className={cn(
                  'flex items-center justify-between px-4 py-3',
                  i < 4 && 'border-b border-border/50'
                )}>
                  <span className="text-xs text-muted-foreground">{row.action}</span>
                  <div className="flex gap-1.5">
                    {row.roles.map(r => {
                      const cfg = ROLE_CONFIG[r];
                      return (
                        <span key={r} className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', cfg?.className)}>
                          {cfg?.label || r}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            <a href="#" className="text-xs text-primary hover:underline">Security documentation & compliance guide</a>
          </div>
        </motion.div>
      )}
    </div>
  );
}
