import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockReadiness, mockServices, mockGapArtifacts, mockIncidents } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Shield, Activity, GitBranch, Link2, BookOpen, Bell,
  CheckCircle2, XCircle, AlertTriangle, Download, ExternalLink,
  Package, Users, Clock, TrendingUp, Plus, FileCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const DimensionConfig: Record<string, { icon: React.ElementType; label: string; description: string }> = {
  observability: { icon: Activity, label: 'Observability', description: 'Logs, metrics, traces coverage' },
  change_tracking: { icon: GitBranch, label: 'Change Tracking', description: 'Deploy & config change visibility' },
  dependency_mapping: { icon: Link2, label: 'Dependency Mapping', description: 'Service dependency documentation' },
  incident_readiness: { icon: Bell, label: 'Incident Readiness', description: 'Alerts, runbooks, on-call setup' },
  documentation: { icon: BookOpen, label: 'Documentation', description: 'Runbooks, ADRs, service catalog' },
};

function ScoreBar({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-severity-p0';
  const heights = { sm: 'h-1', md: 'h-1.5', lg: 'h-2.5' };
  return (
    <div className={cn('w-full rounded-full bg-secondary overflow-hidden', heights[size])}>
      <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${score}%` }} />
    </div>
  );
}

function ScoreColor(score: number) {
  return score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-severity-p0';
}

function GapPriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, string> = {
    critical: 'bg-severity-p0/10 text-severity-p0 border-severity-p0/20',
    high: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    medium: 'bg-secondary text-muted-foreground border-border',
    low: 'bg-secondary text-muted-foreground/60 border-border',
  };
  return (
    <span className={cn('text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider', config[priority] || config.low)}>
      {priority}
    </span>
  );
}

export default function ServiceReadinessPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const readiness = mockReadiness.find(r => r.service_id === serviceId) || mockReadiness[0];
  const service = mockServices.find(s => s.id === readiness.service_id);
  const gaps = mockGapArtifacts.filter(g => g.service_id === readiness.service_id);
  const serviceIncidents = mockIncidents.filter(i => i.affected_services.includes(readiness.service_name));

  const handleCreatePR = (gapTitle: string) => {
    toast.success(`Creating PR for: ${gapTitle}`);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back Nav */}
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-muted-foreground" onClick={() => navigate('/readiness')}>
          <ArrowLeft className="h-3.5 w-3.5" /> Readiness
        </Button>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm font-medium text-foreground font-mono">{readiness.service_name}</span>
      </motion.div>

      {/* Service Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="flex items-start gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold font-mono text-foreground">{readiness.service_name}</h1>
            {service?.health === 'incident' && (
              <Badge className="bg-severity-p0/10 text-severity-p0 border-severity-p0/20 animate-pulse">
                Active Incident
              </Badge>
            )}
            {service?.health === 'degraded' && (
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Degraded</Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            {service?.team && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {service.team} Team
              </span>
            )}
            {service?.language && (
              <span className="flex items-center gap-1">
                <FileCode className="h-3 w-3" /> {service.language}
              </span>
            )}
            {service?.last_deploy && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Last deploy: {service.last_deploy}
              </span>
            )}
            {service?.criticality && (
              <span className={cn('flex items-center gap-1 font-medium',
                service.criticality === 'critical' ? 'text-severity-p0' :
                service.criticality === 'high' ? 'text-amber-400' : 'text-muted-foreground'
              )}>
                <Shield className="h-3 w-3" /> {service.criticality} criticality
              </span>
            )}
          </div>
        </div>
        {service?.repo_url && (
          <Button variant="outline" size="sm" className="gap-1.5 h-8" asChild>
            <a href={service.repo_url} target="_blank" rel="noopener noreferrer">
              <GitBranch className="h-3.5 w-3.5" /> View Repo <ExternalLink className="h-3 w-3 ml-0.5" />
            </a>
          </Button>
        )}
      </motion.div>

      {/* Overall Score Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 rounded-xl border border-border bg-surface-raised/30 p-5 flex flex-col items-center justify-center gap-3">
          <div className="relative h-24 w-24">
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-secondary" />
              <circle
                cx="50" cy="50" r="40" fill="none" strokeWidth="8" strokeLinecap="round"
                stroke={readiness.overall_score >= 80 ? '#10b981' : readiness.overall_score >= 50 ? '#f59e0b' : '#ef4444'}
                strokeDasharray={`${2 * Math.PI * 40 * readiness.overall_score / 100} ${2 * Math.PI * 40}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-2xl font-bold font-mono', ScoreColor(readiness.overall_score))}>
                {readiness.overall_score}
              </span>
              <span className="text-[10px] text-muted-foreground">/ 100</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Overall Readiness</p>
            <p className="text-[11px] text-muted-foreground">{readiness.gap_count} gaps identified</p>
          </div>
        </div>

        <div className="col-span-2 rounded-xl border border-border bg-surface-raised/30 p-5 space-y-3">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-3">Dimension Scores</p>
          {Object.entries(DimensionConfig).map(([key, config]) => {
            const score = readiness.dimensions[key as keyof typeof readiness.dimensions];
            const Icon = config.icon;
            return (
              <div key={key} className="flex items-center gap-3">
                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0 w-5" />
                <span className="text-xs text-foreground w-36 shrink-0">{config.label}</span>
                <div className="flex-1">
                  <ScoreBar score={score} />
                </div>
                <span className={cn('text-xs font-mono font-bold w-8 text-right', ScoreColor(score))}>{score}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Gap Artifacts */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-foreground">Gap Artifacts</h2>
            <span className="text-xs text-muted-foreground">({gaps.length} open)</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Generated by BugPilot Prerequisites Builder · Sorted by priority
          </p>
        </div>

        {gaps.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-raised/30 p-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No open gaps</p>
            <p className="text-xs text-muted-foreground">This service has excellent readiness across all dimensions.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {gaps.sort((a, b) => {
              const order = { critical: 0, high: 1, medium: 2, low: 3 };
              return order[a.priority] - order[b.priority];
            }).map(gap => (
              <motion.div
                key={gap.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-xl border border-border bg-surface-raised/30 p-4"
              >
                <div className="flex items-start gap-3">
                  <GapPriorityBadge priority={gap.priority} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{gap.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{gap.description}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-[10px] px-1.5 py-0.5 bg-secondary rounded capitalize">
                            {gap.artifact_type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-muted-foreground capitalize">
                            {gap.dimension.replace('_', ' ')}
                          </span>
                          {gap.incident_id && (
                            <Link to={`/incidents/${gap.incident_id}`}
                              className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                              Surfaced in {mockIncidents.find(i => i.id === gap.incident_id)?.short_id}
                              <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                          )}
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium',
                            gap.status === 'open' ? 'bg-amber-500/10 text-amber-400' :
                            gap.status === 'acknowledged' ? 'bg-secondary text-muted-foreground' :
                            'bg-emerald-500/10 text-emerald-400'
                          )}>
                            {gap.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {gap.content && (
                          <>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                              <Download className="h-3 w-3" /> Download
                            </Button>
                            <Button size="sm" variant="default" className="h-7 text-xs gap-1"
                              onClick={() => handleCreatePR(gap.title)}>
                              <GitBranch className="h-3 w-3" /> Create PR
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    {gap.content && (
                      <div className="mt-3 p-3 bg-background/50 rounded-lg border border-border/50 font-mono text-[11px] text-muted-foreground overflow-x-auto">
                        <pre className="whitespace-pre-wrap">{gap.content.substring(0, 400)}{gap.content.length > 400 ? '\n...' : ''}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* SLO Definitions */}
      {service?.slo_definitions && service.slo_definitions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">SLO Definitions</h2>
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-secondary/30">
                <tr>
                  <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">SLO Name</th>
                  <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Metric</th>
                  <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Threshold</th>
                  <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Window</th>
                  <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Current</th>
                </tr>
              </thead>
              <tbody>
                {service.slo_definitions.map((slo, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3 font-medium">{slo.name}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{slo.sli_metric}</td>
                    <td className="px-4 py-3 font-mono">{slo.threshold}%</td>
                    <td className="px-4 py-3 text-muted-foreground">{slo.window}</td>
                    <td className="px-4 py-3">
                      {slo.current_value !== undefined && (
                        <span className={cn('font-mono font-bold',
                          slo.current_value >= slo.threshold ? 'text-emerald-400' : 'text-severity-p0'
                        )}>
                          {slo.current_value}%
                          {slo.current_value < slo.threshold && (
                            <span className="ml-1.5 text-[10px] text-severity-p0">⚠ VIOLATED</span>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Recent Incidents */}
      {serviceIncidents.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Recent Incidents</h2>
            <span className="text-xs text-muted-foreground">({serviceIncidents.length})</span>
          </div>
          <div className="space-y-2">
            {serviceIncidents.slice(0, 5).map(incident => (
              <Link key={incident.id} to={`/incidents/${incident.id}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface-raised/30 hover:border-primary/30 transition-colors">
                <div className={cn('h-2 w-2 rounded-full shrink-0',
                  incident.severity === 'P0' ? 'bg-severity-p0' :
                  incident.severity === 'P1' ? 'bg-severity-p1' :
                  incident.severity === 'P2' ? 'bg-severity-p2' : 'bg-muted-foreground'
                )} />
                <span className="font-mono text-[11px] text-muted-foreground shrink-0">{incident.short_id}</span>
                <span className="text-xs text-foreground flex-1 truncate">{incident.title}</span>
                <span className="text-[10px] text-muted-foreground shrink-0 capitalize">{incident.status}</span>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
