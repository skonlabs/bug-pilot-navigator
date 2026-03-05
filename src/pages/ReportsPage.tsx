import { mockReportMetrics } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { TrendingDown, TrendingUp, AlertTriangle, Clock, Shield, BarChart3, Bell } from 'lucide-react';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const mttrData = Array.from({ length: 30 }, (_, i) => ({
  date: `Mar ${i + 1}`,
  mttr: Math.max(10, 60 - i * 0.8 + Math.random() * 20),
  p0: Math.random() > 0.85 ? Math.random() * 30 + 20 : 0,
}));

const incidentsByDay = Array.from({ length: 14 }, (_, i) => ({
  date: `Mar ${i + 1}`,
  p0: Math.floor(Math.random() * 2),
  p1: Math.floor(Math.random() * 3),
  p2: Math.floor(Math.random() * 5),
  p3: Math.floor(Math.random() * 4),
}));

export default function ReportsPage() {
  const [tab, setTab] = useState('overview');
  const m = mockReportMetrics;

  const kpis = [
    { label: 'Total Incidents', value: m.total_incidents, icon: AlertTriangle },
    { label: 'MTTR', value: `${m.mttr_minutes}m`, trend: m.mttr_trend, icon: Clock },
    { label: 'SLO Violations', value: m.slo_violations, icon: Shield },
    { label: 'P0 Incidents', value: m.p0_incidents, icon: BarChart3 },
    { label: 'Alert Noise', value: `${Math.round(m.alert_noise_ratio * 100)}%`, icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1">
        {['overview', 'mttr', 'slo', 'alert-noise'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md capitalize transition-colors',
              tab === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-surface-hover'
            )}>
            {t.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-foreground">{kpi.value}</span>
              {kpi.trend !== undefined && (
                <span className={cn('flex items-center gap-0.5 text-xs font-medium mb-1', kpi.trend < 0 ? 'text-confidence-high' : 'text-severity-p0')}>
                  {kpi.trend < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                  {Math.abs(kpi.trend)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">MTTR Trend (minutes)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={mttrData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} />
              <Line type="monotone" dataKey="mttr" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">Incidents by Severity</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={incidentsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} />
              <Bar dataKey="p0" stackId="a" fill="hsl(var(--severity-p0))" radius={[0, 0, 0, 0]} />
              <Bar dataKey="p1" stackId="a" fill="hsl(var(--severity-p1))" />
              <Bar dataKey="p2" stackId="a" fill="hsl(var(--severity-p2))" />
              <Bar dataKey="p3" stackId="a" fill="hsl(var(--severity-p3))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
