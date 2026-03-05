import {
  mockReportMetrics, mockDoraMetrics, mockOnCallMetrics, mockHypothesisAccuracy,
  mockMttrTrend, mockIncidentsByDay, mockAlertNoiseTrend, mockSloTrend, mockDeployFrequency
} from '@/data/mock-data';
import { cn } from '@/lib/utils';
import {
  TrendingDown, TrendingUp, AlertTriangle, Clock, Shield, BarChart3,
  Bell, Zap, Users, Target, CheckCircle2, ArrowUpRight
} from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, Radar
} from 'recharts';
import { Button } from '@/components/ui/button';

const TABS = ['overview', 'mttr', 'dora', 'slo', 'alert-noise', 'on-call', 'rca-accuracy'] as const;
type Tab = typeof TABS[number];

const chartStyle = {
  cartesian: { strokeDasharray: '3 3', stroke: 'hsl(0 0% 11%)' },
  axis: { fill: 'hsl(0 0% 45%)', fontSize: 10 },
  tooltip: { background: 'hsl(0 0% 7%)', border: '1px solid hsl(0 0% 14%)', borderRadius: 10, color: 'hsl(0 0% 90%)', fontSize: 12 },
};

function KpiCard({ label, value, trend, icon: Icon, iconColor, subtext, accentColor }: {
  label: string; value: string | number; trend?: number; icon: React.ElementType; iconColor: string; subtext?: string; accentColor?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border border-border bg-card p-4 border-l-2',
        accentColor ?? 'border-l-border',
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
        <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center bg-muted/50')}>
          <Icon className={cn('h-3.5 w-3.5', iconColor)} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold font-mono tabular-nums text-foreground tracking-tight">{value}</span>
        {trend !== undefined && (
          <span className={cn('flex items-center gap-0.5 text-xs font-medium mb-0.5', trend < 0 ? 'text-emerald-400' : 'text-severity-p0')}>
            {trend < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {subtext && <p className="text-[11px] text-muted-foreground mt-1">{subtext}</p>}
    </motion.div>
  );
}

function ChartCard({ title, subtitle, children, delay = 0 }: { title: string; subtitle?: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [dateRange, setDateRange] = useState('30d');
  const m = mockReportMetrics;
  const dora = mockDoraMetrics;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Analytics & Reports</h1>
          <p className="text-xs text-muted-foreground mt-0.5">DORA metrics, incident trends, and operational health</p>
        </div>
        {/* Date range selector */}
        <div className="flex items-center gap-1 bg-card rounded-lg border border-border p-0.5">
          {['7d', '30d', '90d'].map(r => (
            <button key={r} onClick={() => setDateRange(r)}
              className={cn('px-3 py-1.5 text-xs rounded-md font-medium transition-all tabular-nums',
                dateRange === r ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground'
              )}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ── 30-day Summary Banner ───────────────────────────────────────────── */}
      {tab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-center gap-6 flex-wrap"
        >
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary mb-1">30-Day Summary</p>
            <p className="text-sm text-foreground font-medium">
              {m.total_incidents} incidents · avg MTTR {m.mttr_minutes}m · {m.slo_violations} SLO violations
            </p>
          </div>
          {[
            { label: 'P0 Rate', value: `${m.p0_incidents}`, sub: 'critical incidents', color: 'text-severity-p0' },
            { label: 'Alert Noise', value: `${Math.round(m.alert_noise_ratio * 100)}%`, sub: 'suppressed', color: 'text-severity-p2' },
            { label: 'Trend', value: `↓${Math.abs(m.mttr_trend ?? 0)}%`, sub: 'MTTR improvement', color: 'text-emerald-400' },
          ].map(item => (
            <div key={item.label} className="text-center">
              <p className={cn('text-xl font-bold font-mono tabular-nums', item.color)}>{item.value}</p>
              <p className="text-[10px] text-muted-foreground">{item.sub}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-full capitalize transition-all font-medium border whitespace-nowrap',
              tab === t
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'text-muted-foreground border-border/50 hover:text-foreground hover:border-border bg-transparent',
            )}>
            {t.replace(/-/g, ' ')}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <KpiCard label="Total Incidents" value={m.total_incidents} icon={AlertTriangle} iconColor="text-severity-p1" subtext="Last 30 days" accentColor="border-l-severity-p1" />
            <KpiCard label="MTTR" value={`${m.mttr_minutes}m`} trend={m.mttr_trend} icon={Clock} iconColor="text-primary" subtext="Avg time to resolve" accentColor="border-l-primary" />
            <KpiCard label="SLO Violations" value={m.slo_violations} icon={Shield} iconColor="text-severity-p0" subtext="This period" accentColor="border-l-severity-p0" />
            <KpiCard label="P0 Incidents" value={m.p0_incidents} icon={BarChart3} iconColor="text-severity-p0" subtext="Critical severity" accentColor="border-l-severity-p0" />
            <KpiCard label="Alert Noise" value={`${Math.round(m.alert_noise_ratio * 100)}%`} icon={Bell} iconColor="text-severity-p2" subtext="Suppressed / correlated" accentColor="border-l-severity-p2" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="MTTR Trend" subtitle="Mean time to resolve by severity (minutes)" delay={0.2}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={mockMttrTrend.slice(-14)}>
                  <CartesianGrid {...chartStyle.cartesian} />
                  <XAxis dataKey="date" tick={chartStyle.axis} tickLine={false} axisLine={false} />
                  <YAxis tick={chartStyle.axis} tickLine={false} axisLine={false} unit="m" />
                  <Tooltip contentStyle={chartStyle.tooltip} formatter={(v: number) => [`${Math.round(v)}m`, '']} />
                  <Line type="monotone" dataKey="P0" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="P1" stroke="#f97316" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="P2" stroke="#eab308" strokeWidth={1.5} dot={false} strokeDasharray="4,3" />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#71717a' }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Incidents by Severity" subtitle="Daily incident volume" delay={0.25}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={mockIncidentsByDay.slice(-14)}>
                  <CartesianGrid {...chartStyle.cartesian} />
                  <XAxis dataKey="date" tick={chartStyle.axis} tickLine={false} axisLine={false} />
                  <YAxis tick={chartStyle.axis} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={chartStyle.tooltip} />
                  <Bar dataKey="P0" stackId="a" fill="#ef4444" />
                  <Bar dataKey="P1" stackId="a" fill="#f97316" />
                  <Bar dataKey="P2" stackId="a" fill="#eab308" />
                  <Bar dataKey="P3" stackId="a" fill="#52525b" radius={[2, 2, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#71717a' }} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Recurring Patterns */}
          <ChartCard title="Top Recurring Incident Patterns" subtitle="Most common root cause patterns this period" delay={0.3}>
            <div className="space-y-3 mt-2">
              {[
                { pattern: 'Deploy regression', count: 15, impact: 'P0–P1', trend: 'stable' },
                { pattern: 'Dependency timeout cascade', count: 11, impact: 'P1–P2', trend: 'up' },
                { pattern: 'Config misconfiguration', count: 8, impact: 'P0–P2', trend: 'down' },
                { pattern: 'Memory leak (post-deploy)', count: 5, impact: 'P1', trend: 'stable' },
                { pattern: 'Rate limit exhaustion', count: 3, impact: 'P2', trend: 'up' },
              ].map(({ pattern, count, impact, trend }, i) => (
                <div key={pattern} className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-muted-foreground/50 w-4 tabular-nums">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">{pattern}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground">{impact}</span>
                        <span className={cn('text-[10px] font-medium',
                          trend === 'up' ? 'text-severity-p0' : trend === 'down' ? 'text-emerald-400' : 'text-muted-foreground'
                        )}>
                          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                        </span>
                        <span className="text-xs font-mono font-bold text-foreground w-6 text-right tabular-nums">{count}</span>
                      </div>
                    </div>
                    <div className="h-1 rounded-full bg-secondary mt-1 overflow-hidden">
                      <div className="h-full rounded-full bg-primary/60" style={{ width: `${(count / 15) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      {/* MTTR TAB */}
      {tab === 'mttr' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label="Overall MTTR" value={`${m.mttr_minutes}m`} trend={m.mttr_trend} icon={Clock} iconColor="text-primary" accentColor="border-l-primary" />
            <KpiCard label="P0 MTTR" value="142m" trend={-18} icon={AlertTriangle} iconColor="text-severity-p0" accentColor="border-l-severity-p0" />
            <KpiCard label="P1 MTTR" value="58m" trend={-9} icon={AlertTriangle} iconColor="text-severity-p1" accentColor="border-l-severity-p1" />
          </div>
          <ChartCard title="MTTR Trend — Last 30 Days" subtitle="Minutes by severity">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={mockMttrTrend}>
                <CartesianGrid {...chartStyle.cartesian} />
                <XAxis dataKey="date" tick={chartStyle.axis} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={chartStyle.axis} tickLine={false} axisLine={false} unit="m" />
                <Tooltip contentStyle={chartStyle.tooltip} formatter={(v: number) => [`${Math.round(v)}m`, '']} />
                <Line type="monotone" dataKey="P0" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="P1" stroke="#f97316" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="P2" stroke="#eab308" strokeWidth={1.5} dot={false} strokeDasharray="4,3" />
                <Legend wrapperStyle={{ fontSize: 11, color: '#71717a' }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="MTTR Breakdown by Service" subtitle="Average resolution time per affected service">
            <div className="space-y-3 mt-2">
              {[
                { service: 'payment-service', mttr: 142, incidents: 8 },
                { service: 'order-service', mttr: 89, incidents: 5 },
                { service: 'search-indexer', mttr: 67, incidents: 4 },
                { service: 'notification-worker', mttr: 45, incidents: 6 },
                { service: 'user-profile-service', mttr: 28, incidents: 3 },
              ].map(({ service, mttr, incidents }) => (
                <div key={service} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-foreground w-40 shrink-0">{service}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary/60" style={{ width: `${(mttr / 142) * 100}%` }} />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground w-14 text-right tabular-nums">{mttr}m avg</span>
                  <span className="text-[10px] text-muted-foreground w-8 text-right tabular-nums">{incidents} inc</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      {/* DORA TAB */}
      {tab === 'dora' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Deployment Frequency" value={`${dora.deployment_frequency}/day`} trend={dora.deployment_frequency_trend} icon={Zap} iconColor="text-primary" subtext="Elite: >1/day" accentColor="border-l-primary" />
            <KpiCard label="Change Failure Rate" value={`${dora.change_failure_rate}%`} trend={dora.change_failure_rate_trend} icon={AlertTriangle} iconColor="text-amber-400" subtext="Elite: <5%" accentColor="border-l-amber-500" />
            <KpiCard label="MTTR" value={`${dora.mttr_minutes}m`} trend={dora.mttr_trend} icon={Clock} iconColor="text-emerald-400" subtext="Elite: <1 hour" accentColor="border-l-emerald-500" />
            <KpiCard label="Change Lead Time" value={`${dora.change_lead_time_hours}h`} trend={dora.change_lead_time_trend} icon={ArrowUpRight} iconColor="text-blue-400" subtext="Elite: <1 hour" accentColor="border-l-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ChartCard title="Deployment Frequency" subtitle="Daily deploys to production" delay={0.2}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={mockDeployFrequency}>
                  <CartesianGrid {...chartStyle.cartesian} />
                  <XAxis dataKey="date" tick={chartStyle.axis} tickLine={false} axisLine={false} />
                  <YAxis tick={chartStyle.axis} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={chartStyle.tooltip} />
                  <Bar dataKey="deploys" fill="hsl(270 100% 68%)" radius={[2, 2, 0, 0]} name="Successful" />
                  <Bar dataKey="failed" fill="#ef4444" radius={[2, 2, 0, 0]} name="Failed" />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#71717a' }} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="DORA Performance Band" subtitle="Your team vs DORA benchmarks" delay={0.25}>
              <div className="space-y-4 mt-4">
                {[
                  { metric: 'Deployment Frequency', value: 4.2, target: 1, unit: '/day', higher: true, band: 'Elite', color: 'text-emerald-400' },
                  { metric: 'Change Failure Rate', value: 8.3, target: 5, unit: '%', higher: false, band: 'High', color: 'text-amber-400' },
                  { metric: 'MTTR', value: 47, target: 60, unit: 'min', higher: false, band: 'Elite', color: 'text-emerald-400' },
                  { metric: 'Change Lead Time', value: 2.8, target: 1, unit: 'h', higher: false, band: 'Medium', color: 'text-amber-400' },
                ].map(({ metric, value, target, unit, higher, band, color }) => (
                  <div key={metric}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-foreground">{metric}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-foreground tabular-nums">{value}{unit}</span>
                        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full border', color,
                          color === 'text-emerald-400' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'
                        )}>{band}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className={cn('h-full rounded-full', color.replace('text-', 'bg-'))} style={{ width: `${higher ? Math.min(100, (value / 10) * 100) : Math.max(5, 100 - (value / target) * 40)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </div>
      )}

      {/* SLO TAB */}
      {tab === 'slo' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label="SLO Violations" value={m.slo_violations} icon={Shield} iconColor="text-severity-p0" subtext="Services breached SLO" accentColor="border-l-severity-p0" />
            <KpiCard label="Highest Burn Rate" value="8.5x" icon={AlertTriangle} iconColor="text-severity-p0" subtext="payment-service" accentColor="border-l-severity-p0" />
            <KpiCard label="Budget Avg Consumed" value="23%" icon={Target} iconColor="text-amber-400" subtext="Across all violations" accentColor="border-l-amber-500" />
          </div>
          <ChartCard title="SLO Availability Trend" subtitle="30-day rolling availability by service">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={mockSloTrend.slice(-14)}>
                <CartesianGrid {...chartStyle.cartesian} />
                <XAxis dataKey="date" tick={chartStyle.axis} tickLine={false} axisLine={false} />
                <YAxis tick={chartStyle.axis} tickLine={false} axisLine={false} domain={[94, 100]} unit="%" />
                <Tooltip contentStyle={chartStyle.tooltip} formatter={(v: number) => [`${v.toFixed(2)}%`, '']} />
                <Line type="monotone" dataKey="payment-service" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="checkout-api" stroke="#f97316" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="auth-service" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="4,3" />
                <Legend wrapperStyle={{ fontSize: 11, color: '#71717a' }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Services by SLO Health" subtitle="Current status across all defined SLOs">
            <div className="space-y-2.5 mt-2">
              {[
                { service: 'payment-service', slo: 99.9, current: 97.2, budget: 45.2, violated: true },
                { service: 'order-service', slo: 99.5, current: 99.7, budget: 8, violated: false },
                { service: 'auth-service', slo: 99.95, current: 99.98, budget: 2, violated: false },
                { service: 'checkout-api', slo: 99.5, current: 99.1, budget: 22, violated: true },
                { service: 'user-profile-service', slo: 99.0, current: 99.4, budget: 5, violated: false },
              ].map(({ service, slo, current, budget, violated }) => (
                <div key={service} className={cn('flex items-center gap-3 p-3 rounded-xl border', violated ? 'border-severity-p0/20 bg-severity-p0/5' : 'border-border bg-card')}>
                  <div className={cn('h-2 w-2 rounded-full shrink-0', violated ? 'bg-severity-p0 animate-pulse' : 'bg-emerald-400')} />
                  <span className="text-xs font-mono text-foreground flex-1">{service}</span>
                  <span className="text-xs text-muted-foreground">Target: {slo}%</span>
                  <span className={cn('text-xs font-mono font-bold tabular-nums', violated ? 'text-severity-p0' : 'text-emerald-400')}>{current}%</span>
                  <span className={cn('text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-full',
                    budget > 30 ? 'text-severity-p0 bg-severity-p0/10' :
                    budget > 10 ? 'text-amber-400 bg-amber-500/10' :
                    'text-muted-foreground bg-muted'
                  )}>
                    {budget}% budget
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      {/* ALERT NOISE TAB */}
      {tab === 'alert-noise' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label="Total Alerts" value="1,247" icon={Bell} iconColor="text-muted-foreground" subtext="Last 30 days" />
            <KpiCard label="Suppressed / Correlated" value="34%" trend={-8} icon={CheckCircle2} iconColor="text-emerald-400" subtext="Alert noise reduced" accentColor="border-l-emerald-500" />
            <KpiCard label="Actionable Alerts" value="823" icon={Zap} iconColor="text-primary" subtext="Led to real incidents" accentColor="border-l-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ChartCard title="Alert Volume — 14 Days" subtitle="Total, correlated, and suppressed" delay={0.2}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={mockAlertNoiseTrend}>
                  <CartesianGrid {...chartStyle.cartesian} />
                  <XAxis dataKey="date" tick={chartStyle.axis} tickLine={false} axisLine={false} />
                  <YAxis tick={chartStyle.axis} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={chartStyle.tooltip} />
                  <Bar dataKey="total" fill="#52525b" name="Total" />
                  <Bar dataKey="correlated" fill="hsl(270 100% 68%)" name="Correlated" />
                  <Bar dataKey="suppressed" fill="#10b981" name="Suppressed" />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#71717a' }} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="High-Frequency Alert Rules" subtitle="Top rules by volume / low action rate" delay={0.25}>
              <div className="space-y-2.5 mt-2">
                {[
                  { rule: 'payment-service p99 > 1s', count: 142, actionRate: 0.12, risk: true },
                  { rule: 'high memory utilization pod', count: 98, actionRate: 0.45, risk: false },
                  { rule: 'error rate > 5%', count: 87, actionRate: 0.72, risk: false },
                  { rule: 'cpu throttling > 20%', count: 73, actionRate: 0.08, risk: true },
                  { rule: 'disk usage > 80%', count: 56, actionRate: 0.34, risk: false },
                ].map(({ rule, count, actionRate, risk }) => (
                  <div key={rule} className={cn('flex items-center gap-2 p-2.5 rounded-xl border', risk ? 'border-amber-500/20 bg-amber-500/5' : 'border-border bg-card/50')}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-foreground truncate">{rule}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{count} alerts · {Math.round(actionRate * 100)}% action rate</p>
                    </div>
                    {risk && <span className="text-[9px] text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-bold">TUNE</span>}
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </div>
      )}

      {/* ON-CALL TAB */}
      {tab === 'on-call' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label="Total Pages This Week" value="20" icon={Bell} iconColor="text-severity-p1" accentColor="border-l-severity-p1" />
            <KpiCard label="After-Hours Pages" value="7" icon={Clock} iconColor="text-severity-p0" subtext="35% of total" accentColor="border-l-severity-p0" />
            <KpiCard label="Avg MTTA" value="4.5m" trend={-12} icon={Users} iconColor="text-primary" accentColor="border-l-primary" />
          </div>
          <ChartCard title="On-Call Load by Engineer" subtitle="Pages this week vs monthly average">
            <div className="space-y-3 mt-3">
              {mockOnCallMetrics.map((eng) => (
                <div key={eng.engineer} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-primary">{eng.engineer.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <span className="text-foreground font-medium">{eng.engineer}</span>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span className="tabular-nums">{eng.pages_this_week} pages/wk</span>
                      <span className={cn('font-medium tabular-nums', eng.after_hours_pages > 2 ? 'text-severity-p0' : 'text-muted-foreground')}>
                        {eng.after_hours_pages} after-hours
                      </span>
                      <span className="tabular-nums">MTTA: {eng.mtta_minutes}m</span>
                      <span className="tabular-nums">{eng.incidents_this_month} this month</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-primary/60" style={{ width: `${(eng.pages_this_week / 6) * 100}%` }} />
                    </div>
                    {eng.after_hours_pages > 0 && (
                      <div className="h-1.5 rounded-full bg-severity-p0/40" style={{ width: `${(eng.after_hours_pages / 3) * 24}px` }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
          <ChartCard title="On-Call Health Signals">
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { label: 'Engineers with >5 pages/wk', value: 2, alert: true },
                { label: 'Engineers with >2 after-hours/wk', value: 2, alert: true },
                { label: 'Avg pages per engineer/wk', value: 4, alert: false },
                { label: 'Teams with single point of failure', value: 1, alert: true },
              ].map(({ label, value, alert }) => (
                <div key={label} className={cn('p-4 rounded-xl border', alert ? 'border-amber-500/20 bg-amber-500/5' : 'border-border bg-card/50')}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
                  <p className={cn('text-2xl font-bold font-mono tabular-nums mt-2', alert ? 'text-amber-400' : 'text-foreground')}>{value}</p>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      {/* RCA ACCURACY TAB */}
      {tab === 'rca-accuracy' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label="RCA Accuracy Rate" value={`${Math.round(mockHypothesisAccuracy.accuracy_rate * 100)}%`} icon={Target} iconColor="text-emerald-400" subtext="Top hypothesis correct" accentColor="border-l-emerald-500" />
            <KpiCard label="Incidents Analyzed" value={mockHypothesisAccuracy.total_incidents} icon={BarChart3} iconColor="text-primary" accentColor="border-l-primary" />
            <KpiCard label="Fix Acceptance Rate" value="68%" icon={CheckCircle2} iconColor="text-emerald-400" subtext="Fixes accepted as-is" accentColor="border-l-emerald-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ChartCard title="Accuracy by Pattern" subtitle="RCA top hypothesis match rate per incident type" delay={0.2}>
              <div className="space-y-3 mt-3">
                {mockHypothesisAccuracy.by_pattern.map(({ pattern, accuracy, count }) => (
                  <div key={pattern}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-foreground">{pattern}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground tabular-nums">{count} incidents</span>
                        <span className={cn('font-mono font-bold tabular-nums',
                          accuracy >= 0.8 ? 'text-emerald-400' : accuracy >= 0.65 ? 'text-amber-400' : 'text-severity-p0'
                        )}>{Math.round(accuracy * 100)}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className={cn('h-full rounded-full',
                        accuracy >= 0.8 ? 'bg-emerald-500' : accuracy >= 0.65 ? 'bg-amber-500' : 'bg-severity-p0'
                      )} style={{ width: `${accuracy * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Confidence Calibration" subtitle="How well confidence scores predict correctness" delay={0.25}>
              <div className="mt-4 space-y-4">
                <p className="text-xs text-muted-foreground">
                  Well-calibrated: a hypothesis at 70% confidence is actually correct ~70% of the time.
                </p>
                {[
                  { range: '85–100%', correct: 92, total: 13 },
                  { range: '65–84%', correct: 79, total: 18 },
                  { range: '40–64%', correct: 41, total: 7 },
                  { range: '<40%', correct: 12, total: 4 },
                ].map(({ range, correct, total }) => (
                  <div key={range} className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground w-20 shrink-0">{range}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-primary/60" style={{ width: `${correct}%` }} />
                    </div>
                    <span className="font-mono text-foreground w-20 text-right tabular-nums">{correct}% correct ({total})</span>
                  </div>
                ))}
                <div className="p-3 rounded-xl bg-secondary/50 border border-border mt-2">
                  <p className="text-[11px] text-muted-foreground">
                    Confidence model is <span className="text-emerald-400 font-medium">well calibrated</span> at high confidence ranges.
                    Low confidence ranges show slight over-estimation — adjustment in progress.
                  </p>
                </div>
              </div>
            </ChartCard>
          </div>

          <ChartCard title="Fix Outcome Analysis" subtitle="What happened to BugPilot's proposed fixes" delay={0.3}>
            <div className="grid grid-cols-4 gap-3 mt-3">
              {[
                { label: 'Accepted As-Is', count: 28, pct: 68, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', accent: 'border-l-emerald-500' },
                { label: 'Modified & Accepted', count: 8, pct: 20, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', accent: 'border-l-blue-500' },
                { label: 'Rejected', count: 3, pct: 7, color: 'text-muted-foreground', bg: 'bg-secondary border-border', accent: 'border-l-border' },
                { label: 'Not Reviewed', count: 2, pct: 5, color: 'text-muted-foreground/50', bg: 'bg-secondary/50 border-border/50', accent: 'border-l-border/50' },
              ].map(({ label, count, pct, color, bg, accent }) => (
                <div key={label} className={cn('p-4 rounded-xl border border-l-2 text-center', bg, accent)}>
                  <p className={cn('text-2xl font-bold font-mono tabular-nums', color)}>{pct}%</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mt-2">{label}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5 tabular-nums">{count} fixes</p>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}
    </div>
  );
}
