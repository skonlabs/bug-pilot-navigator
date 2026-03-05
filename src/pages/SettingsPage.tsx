import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Settings as SettingsIcon, Users, Key, Shield, Copy, Trash2, Plus, Mail } from 'lucide-react';

export default function SettingsPage() {
  const [orgName, setOrgName] = useState('Acme Corp');
  const [timezone, setTimezone] = useState('UTC');
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { key: 'general', label: 'General', icon: SettingsIcon },
    { key: 'members', label: 'Members', icon: Users },
    { key: 'api-keys', label: 'API Keys', icon: Key },
    { key: 'security', label: 'Security', icon: Shield },
  ];

  const members = [
    { name: 'Sarah Chen', email: 'sarah@acme.dev', role: 'Admin', initials: 'SC' },
    { name: 'James Park', email: 'james@acme.dev', role: 'Responder', initials: 'JP' },
    { name: 'Maria Garcia', email: 'maria@acme.dev', role: 'Responder', initials: 'MG' },
    { name: 'Alex Kim', email: 'alex@acme.dev', role: 'Viewer', initials: 'AK' },
  ];

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
                <Label className="text-sm text-foreground font-medium">Timezone</Label>
                <Input value={timezone} onChange={e => setTimezone(e.target.value)} className="mt-1.5 h-10 bg-secondary/50 border-border" />
              </div>
              <Button size="sm" className="gradient-brand border-0 text-primary-foreground hover:opacity-90">Save Changes</Button>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'members' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Team Members</h2>
              <p className="text-sm text-muted-foreground">Manage who has access to your organization.</p>
            </div>
            <Button size="sm" className="gap-1.5 gradient-brand border-0 text-primary-foreground hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> Invite
            </Button>
          </div>
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            {members.map((member, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-0 hover:bg-surface-hover transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">{member.initials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-md font-medium',
                    member.role === 'Admin' ? 'bg-primary/10 text-primary' :
                    member.role === 'Responder' ? 'bg-success/10 text-success' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {member.role}
                  </span>
                </div>
              </div>
            ))}
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
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            {[
              { name: 'Production API Key', key: 'bp_live_****************************k4m2', created: '14 days ago' },
              { name: 'Webhook Signing Secret', key: 'whsec_****************************x9p1', created: '14 days ago' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.key}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">Created {item.created}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground">
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-severity-p0 hover:text-severity-p0 hover:bg-severity-p0/10">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'security' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <h2 className="text-base font-semibold text-foreground">Security & Audit</h2>
          <p className="text-sm text-muted-foreground">Security settings and audit log access. Available for security_admin role.</p>
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-foreground font-medium mb-1">Audit Log</p>
            <p className="text-xs text-muted-foreground">All actions are logged with timestamps, actors, and evidence. Contact your security admin for full access.</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
