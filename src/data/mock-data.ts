import type { 
  Incident, Investigation, EvidenceItem, Hypothesis, FixProposal, 
  ServiceNode, ConnectorInfo, ReadinessScore, ReportMetrics, User, Organization 
} from '@/types/bugpilot';

export const mockUser: User = {
  id: '1', name: 'Sarah Chen', email: 'sarah@acme.dev', 
  avatar_url: '', role: 'admin'
};

export const mockOrg: Organization = {
  id: '1', slug: 'acme-corp', name: 'Acme Corp', plan: 'pro'
};

export const mockIncidents: Incident[] = [
  {
    id: '1', short_id: 'INC-0042', title: 'Payment service timeout causing checkout failures',
    status: 'investigating', severity: 'P0', environment: 'production',
    source: 'pagerduty', affected_services: ['payment-service', 'checkout-api', 'stripe-gateway'],
    ic: { id: '1', name: 'Sarah Chen', email: 'sarah@acme.dev', role: 'admin' },
    tl: { id: '2', name: 'James Park', email: 'james@acme.dev', role: 'responder' },
    slo_violated: true, error_budget_consumed: 45.2, burn_rate: 8.5,
    detected_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    tags: ['payments', 'revenue-impact'], severity_basis: 'Complete payment processing failure',
    customer_impact: 'All checkout attempts failing for 100% of users',
  },
  {
    id: '2', short_id: 'INC-0041', title: 'Elevated latency on user-profile-service',
    status: 'identified', severity: 'P1', environment: 'production',
    source: 'grafana', affected_services: ['user-profile-service', 'auth-service'],
    ic: { id: '3', name: 'Maria Garcia', email: 'maria@acme.dev', role: 'responder' },
    slo_violated: false, burn_rate: 2.1,
    detected_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    tags: ['latency'], customer_impact: 'Profile pages loading slowly',
  },
  {
    id: '3', short_id: 'INC-0040', title: 'Search indexer stuck in crash loop',
    status: 'mitigating', severity: 'P2', environment: 'production',
    source: 'datadog', affected_services: ['search-indexer'],
    slo_violated: false,
    detected_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    tags: ['search'],
  },
  {
    id: '4', short_id: 'INC-0039', title: 'Memory leak in notification worker after deploy v2.14.3',
    status: 'resolved', severity: 'P1', environment: 'production',
    source: 'auto', affected_services: ['notification-worker', 'email-service'],
    slo_violated: true, error_budget_consumed: 12.8,
    detected_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    tags: ['memory-leak', 'deploy-related'],
  },
  {
    id: '5', short_id: 'INC-0038', title: 'CDN cache invalidation delay causing stale assets',
    status: 'closed', severity: 'P3', environment: 'production',
    source: 'manual', affected_services: ['cdn-edge', 'asset-service'],
    slo_violated: false,
    detected_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 70 * 60 * 60 * 1000).toISOString(),
    tags: ['cdn'],
  },
  {
    id: '6', short_id: 'INC-0037', title: 'Database connection pool exhaustion on order-service',
    status: 'postmortem', severity: 'P0', environment: 'production',
    source: 'pagerduty', affected_services: ['order-service', 'inventory-service', 'payment-service'],
    slo_violated: true, error_budget_consumed: 78.5,
    detected_at: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 116 * 60 * 60 * 1000).toISOString(),
    tags: ['database', 'connection-pool'],
  },
];

export const mockInvestigation: Investigation = {
  id: '1', incident_id: '1', status: 'running', phase: 'hypothesize',
  overall_confidence: 0.78, completeness_score: 0.82, llm_available: true,
  missing_signals: ['Kubernetes pod metrics', 'Stripe webhook logs', 'Redis slow log'],
  started_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
};

export const mockEvidence: EvidenceItem[] = [
  {
    id: '1', investigation_id: '1', evidence_type: 'log_event',
    source_connector: 'datadog', source_system: 'Datadog Logs',
    summary: 'Error rate spike: payment-service returned 503 for 89% of requests starting at 14:12 UTC. Pattern matches connection timeout to stripe-gateway.',
    confidence: 0.92, inference_method: 'llm_inference',
    event_timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    is_pinned: true, service_name: 'payment-service',
  },
  {
    id: '2', investigation_id: '1', evidence_type: 'metric_anomaly',
    source_connector: 'prometheus', source_system: 'Prometheus',
    summary: 'p99 latency for payment-service jumped from 120ms to 28,500ms at 14:11 UTC. Anomaly score: 4.7σ above baseline.',
    confidence: 0.95, inference_method: 'schema_mapped',
    event_timestamp: new Date(Date.now() - 112 * 60 * 1000).toISOString(),
    is_pinned: true, service_name: 'payment-service',
  },
  {
    id: '3', investigation_id: '1', evidence_type: 'deploy_event',
    source_connector: 'github', source_system: 'GitHub Actions',
    summary: 'Deploy v2.15.0 to payment-service at 14:08 UTC. Changed: connection pool config (max_connections: 50→10), added retry logic to stripe client.',
    confidence: 0.88, inference_method: 'regex_parse',
    event_timestamp: new Date(Date.now() - 115 * 60 * 1000).toISOString(),
    is_pinned: false, service_name: 'payment-service',
  },
  {
    id: '4', investigation_id: '1', evidence_type: 'trace_span',
    source_connector: 'jaeger', source_system: 'Jaeger',
    summary: 'Trace shows checkout flow: user-api → checkout-api → payment-service (TIMEOUT after 30s) → stripe-gateway (never reached). 12 spans affected.',
    confidence: 0.90, inference_method: 'schema_mapped',
    event_timestamp: new Date(Date.now() - 108 * 60 * 1000).toISOString(),
    is_pinned: false, service_name: 'checkout-api',
  },
  {
    id: '5', investigation_id: '1', evidence_type: 'alert',
    source_connector: 'pagerduty', source_system: 'PagerDuty',
    summary: 'Alert: payment-service error rate > 50% for 5 minutes. Triggered escalation policy "Payments Team P0".',
    confidence: 1.0, inference_method: 'schema_mapped',
    event_timestamp: new Date(Date.now() - 105 * 60 * 1000).toISOString(),
    is_pinned: false, service_name: 'payment-service',
  },
  {
    id: '6', investigation_id: '1', evidence_type: 'config_change',
    source_connector: 'github', source_system: 'GitHub',
    summary: 'Config change in payment-service/config/database.yml: max_connections reduced from 50 to 10. Author: deploy-bot. PR #1847.',
    confidence: 0.85, inference_method: 'regex_parse',
    event_timestamp: new Date(Date.now() - 116 * 60 * 1000).toISOString(),
    is_pinned: false, service_name: 'payment-service',
  },
];

export const mockHypotheses: Hypothesis[] = [
  {
    id: '1', investigation_id: '1', rank: 1,
    title: 'Connection pool exhaustion due to misconfigured max_connections in v2.15.0 deploy',
    description: 'Deploy v2.15.0 reduced max_connections from 50 to 10, causing connection pool exhaustion under normal load.',
    confidence: 0.82, status: 'probable',
    causal_factors: ['Connection pool max reduced 80%', 'Deploy at 14:08 UTC precedes first errors by 3 minutes'],
    contributing_factors: ['No canary deployment', 'Missing connection pool metrics alert'],
    tests: [
      { id: '1', test_query: 'Check if error rate correlates with deploy timestamp', result: 'confirms', confidence_delta: 0.15 },
      { id: '2', test_query: 'Verify connection pool config diff in v2.15.0', result: 'confirms', confidence_delta: 0.12 },
      { id: '3', test_query: 'Check if rollback to v2.14.9 would restore connections', result: 'pending', confidence_delta: 0 },
    ],
    supporting_evidence_ids: ['1', '2', '3', '6'],
    disconfirming_evidence_ids: [],
  },
  {
    id: '2', investigation_id: '1', rank: 2,
    title: 'Stripe API rate limiting causing cascading timeouts',
    description: 'Stripe API began rate-limiting payment-service requests, causing upstream timeouts.',
    confidence: 0.35, status: 'candidate',
    causal_factors: ['Stripe gateway unreachable in traces'],
    contributing_factors: ['No circuit breaker on Stripe client'],
    tests: [
      { id: '4', test_query: 'Check Stripe status page for incidents', result: 'disconfirms', confidence_delta: -0.20 },
      { id: '5', test_query: 'Verify Stripe API response codes in logs', result: 'inconclusive', confidence_delta: -0.05 },
    ],
    supporting_evidence_ids: ['4'],
    disconfirming_evidence_ids: ['3'],
  },
];

export const mockFixes: FixProposal[] = [
  {
    id: '1', investigation_id: '1', incident_id: '1',
    title: 'Rollback payment-service to v2.14.9',
    description: 'Revert to last known good version to restore connection pool settings.',
    tier: 2, risk: 'low', status: 'proposed', fix_type: 'rollback',
    estimated_time: '~3 minutes', affected_service: 'payment-service',
    proposed_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    diff_preview: `# Rollback Command\nkubectl rollout undo deployment/payment-service -n production\n\n# Or via GitHub\ngit revert abc123..def456\ngit push origin main`,
    rollback_steps: ['Re-deploy v2.15.0 if rollback causes issues', 'Monitor error rate for 10 minutes post-rollback'],
  },
  {
    id: '2', investigation_id: '1', incident_id: '1',
    title: 'Fix connection pool config and redeploy',
    description: 'Update max_connections from 10 back to 50 and deploy as v2.15.1.',
    tier: 2, risk: 'medium', status: 'proposed', fix_type: 'config_change',
    estimated_time: '~8 minutes', affected_service: 'payment-service',
    proposed_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    diff_preview: `--- a/config/database.yml\n+++ b/config/database.yml\n@@ -3,7 +3,7 @@\n production:\n   pool:\n-    max_connections: 10\n+    max_connections: 50\n     min_connections: 5`,
  },
  {
    id: '3', investigation_id: '1', incident_id: '1',
    title: 'Add connection pool size alert rule',
    description: 'Create Prometheus alerting rule for connection pool utilization > 80%.',
    tier: 3, risk: 'low', status: 'proposed', fix_type: 'gap_artifact',
    estimated_time: '~5 minutes', affected_service: 'payment-service',
    proposed_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
];

export const mockServices: ServiceNode[] = [
  { id: '1', name: 'payment-service', team: 'Payments', criticality: 'critical', health: 'incident', readiness_score: 62, active_incidents: 1, last_deploy: '2h ago' },
  { id: '2', name: 'checkout-api', team: 'Commerce', criticality: 'critical', health: 'degraded', readiness_score: 78, active_incidents: 1, last_deploy: '3d ago' },
  { id: '3', name: 'user-profile-service', team: 'Platform', criticality: 'high', health: 'degraded', readiness_score: 85, active_incidents: 1, last_deploy: '1d ago' },
  { id: '4', name: 'auth-service', team: 'Platform', criticality: 'critical', health: 'healthy', readiness_score: 91, active_incidents: 0, last_deploy: '5d ago' },
  { id: '5', name: 'order-service', team: 'Commerce', criticality: 'critical', health: 'healthy', readiness_score: 74, active_incidents: 0, last_deploy: '12h ago' },
  { id: '6', name: 'notification-worker', team: 'Platform', criticality: 'medium', health: 'healthy', readiness_score: 56, active_incidents: 0, last_deploy: '1d ago' },
  { id: '7', name: 'search-indexer', team: 'Search', criticality: 'high', health: 'incident', readiness_score: 68, active_incidents: 1, last_deploy: '6h ago' },
  { id: '8', name: 'stripe-gateway', team: 'Payments', criticality: 'critical', health: 'healthy', readiness_score: 88, active_incidents: 0, last_deploy: '7d ago' },
  { id: '9', name: 'inventory-service', team: 'Commerce', criticality: 'high', health: 'healthy', readiness_score: 71, active_incidents: 0, last_deploy: '2d ago' },
  { id: '10', name: 'cdn-edge', team: 'Infra', criticality: 'medium', health: 'healthy', readiness_score: 82, active_incidents: 0, last_deploy: '14d ago' },
];

export const mockConnectors: ConnectorInfo[] = [
  { id: '1', name: 'PagerDuty', category: 'Alerting & On-Call', description: 'Ingest alerts, read on-call schedules, escalation policies', status: 'connected', last_sync: '2 min ago', items_synced: 1247, icon: 'Bell' },
  { id: '2', name: 'Datadog', category: 'Observability', description: 'Logs, metrics, APM traces, and synthetic monitoring', status: 'connected', last_sync: '1 min ago', items_synced: 45892, icon: 'BarChart3' },
  { id: '3', name: 'GitHub', category: 'Source Control', description: 'Commits, PRs, diffs, blame, deploy history', status: 'connected', last_sync: '5 min ago', items_synced: 8934, icon: 'GitBranch' },
  { id: '4', name: 'Slack', category: 'Communication', description: 'Read incident channels, push structured updates', status: 'connected', last_sync: '30 sec ago', items_synced: 3421, icon: 'MessageSquare' },
  { id: '5', name: 'Prometheus', category: 'Observability', description: 'Metrics collection and alerting', status: 'connected', last_sync: '1 min ago', items_synced: 128456, icon: 'Activity' },
  { id: '6', name: 'Jaeger', category: 'Observability', description: 'Distributed tracing', status: 'connected', last_sync: '3 min ago', items_synced: 23891, icon: 'Waypoints' },
  { id: '7', name: 'Jira', category: 'Ticketing', description: 'Issue tracking and project management', status: 'error', error_message: 'API token expired. Re-authenticate required.', icon: 'Ticket' },
  { id: '8', name: 'AWS CloudWatch', category: 'Observability', description: 'AWS logs and metrics', status: 'stale', last_sync: '45 min ago', data_lag: '45 min', icon: 'Cloud' },
  { id: '9', name: 'Kubernetes', category: 'Infrastructure', description: 'Pods, deployments, events, configmaps', status: 'not_connected', icon: 'Container' },
  { id: '10', name: 'Grafana', category: 'Observability', description: 'Dashboards and alerting', status: 'not_connected', icon: 'LayoutDashboard' },
  { id: '11', name: 'OpsGenie', category: 'Alerting & On-Call', description: 'Alert management and on-call scheduling', status: 'not_connected', icon: 'Siren' },
  { id: '12', name: 'Confluence', category: 'Documentation', description: 'Wiki and runbook content', status: 'not_connected', icon: 'BookOpen' },
];

export const mockReadiness: ReadinessScore[] = [
  { service_id: '1', service_name: 'payment-service', overall_score: 62, dimensions: { observability: 75, change_tracking: 80, dependency_mapping: 55, incident_readiness: 45, documentation: 55 }, gap_count: 8, last_incident: '2h ago' },
  { service_id: '2', service_name: 'checkout-api', overall_score: 78, dimensions: { observability: 85, change_tracking: 90, dependency_mapping: 70, incident_readiness: 65, documentation: 80 }, gap_count: 4, last_incident: '2h ago' },
  { service_id: '3', service_name: 'user-profile-service', overall_score: 85, dimensions: { observability: 90, change_tracking: 85, dependency_mapping: 80, incident_readiness: 85, documentation: 85 }, gap_count: 2, last_incident: '5h ago' },
  { service_id: '4', service_name: 'auth-service', overall_score: 91, dimensions: { observability: 95, change_tracking: 90, dependency_mapping: 85, incident_readiness: 95, documentation: 90 }, gap_count: 1 },
  { service_id: '5', service_name: 'order-service', overall_score: 74, dimensions: { observability: 80, change_tracking: 85, dependency_mapping: 65, incident_readiness: 60, documentation: 80 }, gap_count: 5 },
  { service_id: '6', service_name: 'notification-worker', overall_score: 56, dimensions: { observability: 60, change_tracking: 70, dependency_mapping: 40, incident_readiness: 45, documentation: 65 }, gap_count: 11, last_incident: '1d ago' },
  { service_id: '7', service_name: 'search-indexer', overall_score: 68, dimensions: { observability: 75, change_tracking: 80, dependency_mapping: 55, incident_readiness: 60, documentation: 70 }, gap_count: 6, last_incident: '8h ago' },
];

export const mockReportMetrics: ReportMetrics = {
  total_incidents: 42,
  mttr_minutes: 47,
  mttr_trend: -12.5,
  slo_violations: 6,
  p0_incidents: 3,
  alert_noise_ratio: 0.34,
};
