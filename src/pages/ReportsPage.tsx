import { mockReportMetrics } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { TrendingDown, TrendingUp, AlertTriangle, Clock, Shield, BarChart3, Bell } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const mttrData = Array.from({ length: 30 }, (_, i) => ({
  date: `Mar ${i + 1}`,
  mttr: Math.max(10, 60 - i * 0.8 + Math.random() * 20),
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
    { label: 'Total Incidents', value: m.total_incidents, icon: AlertTriangle, iconColor: 'text-severity-p1' },
    { label: 'MTTR', value: `${m.mttr_minutes}m`, trend: m.mttr_trend, icon: Clock, iconColor: 'text-primary' },
    { label: 'SLO Violations', value: m.slo_violations, icon: Shield, iconColor: 'text-severity-p0' },
    { label: 'P0 Incidents', value: m.p0_incidents, icon: BarChart3, iconColor: 'text-severity-p0' },
    { label: 'Alert Noise', value: `${Math.round(m.alert_noise_ratio * 100)}%`, icon: Bell, iconColor: 'text-severity-p2' },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-border/50 w-fit">
        {['overview', 'mttr', 'slo', 'alert-noise', 'on-call'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-md capitalize transition-all font-medium',
              tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-secondary-foreground'
            )}>
            {t.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <kpi.icon className={cn('h-4 w-4', kpi.iconColor)} />
              <span className="text-[11px] text-muted-foreground font-medium">{kpi.label}</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-foreground tracking-tight">{kpi.value}</span>
              {kpi.trend !== undefined && (
                <span className={cn('flex items-center gap-0.5 text-xs font-medium mb-1',
                  kpi.trend < 0 ? 'text-success' : 'text-severity-p0'
                )}>
                  {kpi.trend < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                  {Math.abs(kpi.trend)}%
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">MTTR Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={mttrData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 12%)" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(0 0% 45%)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'hsl(0 0% 45%)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(0 0% 8%)', border: '1px solid hsl(0 0% 12%)', borderRadius: 10, color: 'hsl(0 0% 93%)' }} />
              <Line type="monotone" dataKey="mttr" stroke="hsl(270 100% 68%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Incidents by Severity</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incidentsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 12%)" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(0 0% 45%)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'hsl(0 0% 45%)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(0 0% 8%)', border: '1px solid hsl(0 0% 12%)', borderRadius: 10, color: 'hsl(0 0% 93%)' }} />
              <Bar dataKey="p0" stackId="a" fill="hsl(0 84% 60%)" />
              <Bar dataKey="p1" stackId="a" fill="hsl(25 95% 53%)" />
              <Bar dataKey="p2" stackId="a" fill="hsl(45 93% 47%)" />
              <Bar dataKey="p3" stackId="a" fill="hsl(215 12% 48%)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
