import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

export default function SettingsPage() {
  const [orgName, setOrgName] = useState('Acme Corp');
  const [timezone, setTimezone] = useState('UTC');

  return (
    <div className="max-w-2xl space-y-8">
      {/* General */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-1">General Settings</h2>
        <p className="text-sm text-muted-foreground mb-4">Manage your organization settings.</p>
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-foreground">Organization Name</Label>
            <Input value={orgName} onChange={e => setOrgName(e.target.value)} className="mt-1 bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-sm text-foreground">Timezone</Label>
            <Input value={timezone} onChange={e => setTimezone(e.target.value)} className="mt-1 bg-secondary border-border" />
          </div>
          <Button size="sm">Save Changes</Button>
        </div>
      </div>

      <Separator className="bg-border" />

      {/* Members */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-1">Team Members</h2>
        <p className="text-sm text-muted-foreground mb-4">Manage who has access to your organization.</p>
        <div className="rounded-lg border border-border overflow-hidden">
          {[
            { name: 'Sarah Chen', email: 'sarah@acme.dev', role: 'Admin' },
            { name: 'James Park', email: 'james@acme.dev', role: 'Responder' },
            { name: 'Maria Garcia', email: 'maria@acme.dev', role: 'Responder' },
            { name: 'Alex Kim', email: 'alex@acme.dev', role: 'Viewer' },
          ].map((member, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
              <div>
                <p className="text-sm font-medium text-foreground">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.email}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{member.role}</span>
            </div>
          ))}
        </div>
        <Button size="sm" variant="outline" className="mt-3">Invite Member</Button>
      </div>

      <Separator className="bg-border" />

      {/* API Keys */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-1">API Keys</h2>
        <p className="text-sm text-muted-foreground mb-4">Manage API keys for programmatic access.</p>
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Production API Key</p>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">bp_live_****************************k4m2</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs">Copy</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-severity-p0 hover:text-severity-p0">Revoke</Button>
            </div>
          </div>
        </div>
        <Button size="sm" className="mt-3">Generate New Key</Button>
      </div>
    </div>
  );
}
