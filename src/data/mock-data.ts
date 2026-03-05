import type {
  Incident, Investigation, EvidenceItem, Hypothesis, FixProposal,
  ServiceNode, ConnectorInfo, ReadinessScore, ReportMetrics, User, Organization,
  ResolutionPacket, Postmortem, AuditLogEntry, ApiKey, OrgMember, TimelineEvent,
  ChangeEvent, DoraMetrics, OnCallMetrics, HypothesisAccuracy, GapArtifact,
  NotificationItem
} from '@/types/bugpilot';

// ─── USERS ───────────────────────────────────────────────────────────────────

export const mockUser: User = {
  id: '1', name: 'Sarah Chen', email: 'sarah@acme.dev',
  avatar_url: '', role: 'admin'
};

export const mockOrg: Organization = {
  id: '1', slug: 'acme-corp', name: 'Acme Corp', plan: 'pro', timezone: 'UTC'
};

export const mockTeamMembers: OrgMember[] = [
  { id: '1', name: 'Sarah Chen', email: 'sarah@acme.dev', role: 'admin', joined_at: '2024-01-15T09:00:00Z', invited_by: undefined },
  { id: '2', name: 'James Park', email: 'james@acme.dev', role: 'responder', joined_at: '2024-02-01T10:00:00Z', invited_by: 'sarah@acme.dev' },
  { id: '3', name: 'Maria Garcia', email: 'maria@acme.dev', role: 'responder', joined_at: '2024-02-14T11:00:00Z', invited_by: 'sarah@acme.dev' },
  { id: '4', name: 'Alex Kim', email: 'alex@acme.dev', role: 'viewer', joined_at: '2024-03-01T08:30:00Z', invited_by: 'james@acme.dev' },
  { id: '5', name: 'Priya Nair', email: 'priya@acme.dev', role: 'security_admin', joined_at: '2024-01-20T14:00:00Z', invited_by: 'sarah@acme.dev' },
  { id: '6', name: 'Tom Ellis', email: 'tom@acme.dev', role: 'responder', joined_at: '2024-03-10T09:15:00Z', invited_by: 'sarah@acme.dev' },
];

// ─── INCIDENTS ────────────────────────────────────────────────────────────────

export const mockIncidents: Incident[] = [
  {
    id: '1', short_id: 'INC-0042', title: 'Payment service timeout causing checkout failures',
    status: 'investigating', severity: 'P0', environment: 'production',
    source: 'pagerduty', affected_services: ['payment-service', 'checkout-api', 'stripe-gateway'],
    ic: { id: '1', name: 'Sarah Chen', email: 'sarah@acme.dev', role: 'admin' },
    tl: { id: '2', name: 'James Park', email: 'james@acme.dev', role: 'responder' },
    slack_channel_id: 'C0ABCD123', slack_channel_name: 'bugpilot-inc-0042-payment',
    slo_violated: true, error_budget_consumed: 45.2, burn_rate: 8.5,
    detected_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    investigating_at: new Date(Date.now() - 118 * 60 * 1000).toISOString(),
    tags: ['payments', 'revenue-impact'], severity_basis: 'Complete payment processing failure',
    customer_impact: 'All checkout attempts failing for 100% of users',
    latest_packet_id: 'pkt-1', investigation_status: 'running', investigation_phase: 'hypothesize',
  },
  {
    id: '2', short_id: 'INC-0041', title: 'Elevated latency on user-profile-service',
    status: 'identified', severity: 'P1', environment: 'production',
    source: 'grafana', affected_services: ['user-profile-service', 'auth-service'],
    ic: { id: '3', name: 'Maria Garcia', email: 'maria@acme.dev', role: 'responder' },
    slo_violated: false, burn_rate: 2.1,
    detected_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    tags: ['latency'], customer_impact: 'Profile pages loading slowly for ~15% of users',
    investigation_status: 'complete', investigation_phase: 'packet',
  },
  {
    id: '3', short_id: 'INC-0040', title: 'Search indexer stuck in crash loop',
    status: 'mitigating', severity: 'P2', environment: 'production',
    source: 'datadog', affected_services: ['search-indexer'],
    slo_violated: false,
    detected_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    tags: ['search'], customer_impact: 'Search results outdated by up to 8 hours',
    investigation_status: 'complete',
  },
  {
    id: '4', short_id: 'INC-0039', title: 'Memory leak in notification worker after deploy v2.14.3',
    status: 'resolved', severity: 'P1', environment: 'production',
    source: 'auto', affected_services: ['notification-worker', 'email-service'],
    slo_violated: true, error_budget_consumed: 12.8,
    detected_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    time_to_resolve_secs: 14400,
    tags: ['memory-leak', 'deploy-related'], customer_impact: 'Push notifications delayed up to 4 hours',
    investigation_status: 'complete',
  },
  {
    id: '5', short_id: 'INC-0038', title: 'CDN cache invalidation delay causing stale assets',
    status: 'closed', severity: 'P3', environment: 'production',
    source: 'manual', affected_services: ['cdn-edge', 'asset-service'],
    slo_violated: false,
    detected_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 70 * 60 * 60 * 1000).toISOString(),
    time_to_resolve_secs: 7200,
    tags: ['cdn'], customer_impact: 'Some users seeing outdated JS/CSS bundles',
    investigation_status: 'complete',
  },
  {
    id: '6', short_id: 'INC-0037', title: 'Database connection pool exhaustion on order-service',
    status: 'postmortem', severity: 'P0', environment: 'production',
    source: 'pagerduty', affected_services: ['order-service', 'inventory-service', 'payment-service'],
    slo_violated: true, error_budget_consumed: 78.5,
    detected_at: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 116 * 60 * 60 * 1000).toISOString(),
    time_to_resolve_secs: 14400,
    tags: ['database', 'connection-pool'], customer_impact: 'Order placement completely unavailable for 4 hours',
    latest_packet_id: 'pkt-6', investigation_status: 'complete',
  },
];

// ─── INVESTIGATION ────────────────────────────────────────────────────────────

export const mockInvestigation: Investigation = {
  id: '1', incident_id: '1', status: 'running', phase: 'hypothesize',
  overall_confidence: 0.78, completeness_score: 0.82,
  llm_available: true, llm_model_used: 'claude-sonnet-4-6', prompt_version: 'v2.4',
  tokens_in: 42893, tokens_out: 8234, cost_usd: 0.087,
  missing_signals: ['Kubernetes pod metrics', 'Stripe webhook logs', 'Redis slow log'],
  started_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
};

// ─── EVIDENCE ────────────────────────────────────────────────────────────────

export const mockEvidence: EvidenceItem[] = [
  {
    id: '1', investigation_id: '1', evidence_type: 'log_event',
    source_connector: 'datadog', source_system: 'Datadog Logs',
    summary: 'Error rate spike: payment-service returned 503 for 89% of requests starting at 14:12 UTC. Pattern matches connection timeout to stripe-gateway.',
    confidence: 0.92, inference_method: 'llm_inference',
    event_timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    is_pinned: true, service_name: 'payment-service',
    normalized_data: { error_rate: 0.89, http_status: 503, duration_ms: 30000 },
  },
  {
    id: '2', investigation_id: '1', evidence_type: 'metric_anomaly',
    source_connector: 'prometheus', source_system: 'Prometheus',
    summary: 'p99 latency for payment-service jumped from 120ms to 28,500ms at 14:11 UTC. Anomaly score: 4.7σ above baseline.',
    confidence: 0.95, inference_method: 'schema_mapped',
    event_timestamp: new Date(Date.now() - 112 * 60 * 1000).toISOString(),
    is_pinned: true, service_name: 'payment-service',
    normalized_data: { p99_ms: 28500, baseline_ms: 120, sigma: 4.7 },
  },
  {
    id: '3', investigation_id: '1', evidence_type: 'deploy_event',
    source_connector: 'github', source_system: 'GitHub Actions',
    summary: 'Deploy v2.15.0 to payment-service at 14:08 UTC. Changed: connection pool config (max_connections: 50→10), added retry logic to stripe client.',
    confidence: 0.88, inference_method: 'regex_parse',
    event_timestamp: new Date(Date.now() - 115 * 60 * 1000).toISOString(),
    is_pinned: false, service_name: 'payment-service',
    normalized_data: { version: 'v2.15.0', commit: 'abc123f', pr_number: 1847 },
  },
  {
    id: '4', investigation_id: '1', evidence_type: 'trace_span',
    source_connector: 'jaeger', source_system: 'Jaeger',
    summary: 'Trace shows checkout flow: user-api → checkout-api → payment-service (TIMEOUT after 30s) → stripe-gateway (never reached). 12 spans affected.',
    confidence: 0.90, inference_method: 'schema_mapped',
    event_timestamp: new Date(Date.now() - 108 * 60 * 1000).toISOString(),
    is_pinned: false, service_name: 'checkout-api',
    normalized_data: { trace_id: 'trace-abc123', span_count: 12, root_cause_span: 'payment-service' },
  },
  {
    id: '5', investigation_id: '1', evidence_type: 'alert',
    source_connector: 'pagerduty', source_system: 'PagerDuty',
    summary: 'Alert: payment-service error rate > 50% for 5 minutes. Triggered escalation policy "Payments Team P0".',
    confidence: 1.0, inference_method: 'schema_mapped',
    event_timestamp: new Date(Date.now() - 105 * 60 * 1000).toISOString(),
    is_pinned: false, service_name: 'payment-service',
    normalized_data: { alert_id: 'PD-1234', escalation_policy: 'Payments Team P0' },
  },
  {
    id: '6', investigation_id: '1', evidence_type: 'config_change',
    source_connector: 'github', source_system: 'GitHub',
    summary: 'Config change in payment-service/config/database.yml: max_connections reduced from 50 to 10. Author: deploy-bot. PR #1847.',
    confidence: 0.85, inference_method: 'regex_parse',
    event_timestamp: new Date(Date.now() - 116 * 60 * 1000).toISOString(),
    is_pinned: false, service_name: 'payment-service',
    normalized_data: { file: 'config/database.yml', key: 'max_connections', old_value: 50, new_value: 10 },
  },
  {
    id: '7', investigation_id: '1', evidence_type: 'on_call_event',
    source_connector: 'pagerduty', source_system: 'PagerDuty',
    summary: 'On-call engineer Sarah Chen paged at 14:14 UTC via PagerDuty. Acknowledged at 14:16 UTC (2 min MTTA).',
    confidence: 1.0, inference_method: 'schema_mapped',
    event_timestamp: new Date(Date.now() - 104 * 60 * 1000).toISOString(),
    is_pinned: false, service_name: 'payment-service',
  },
  {
    id: '8', investigation_id: '1', evidence_type: 'metric_anomaly',
    source_connector: 'prometheus', source_system: 'Prometheus',
    summary: 'DB connection pool wait time spiked from 2ms to 8,400ms at 14:12 UTC. Active connections at max (10/10) from 14:09 UTC.',
    confidence: 0.94, inference_method: 'schema_mapped',
    event_timestamp: new Date(Date.now() - 109 * 60 * 1000).toISOString(),
    is_pinned: false, service_name: 'payment-service',
    normalized_data: { metric: 'db_pool_wait_ms', value: 8400, max_connections: 10, active: 10 },
  },
];

// ─── HYPOTHESES ───────────────────────────────────────────────────────────────

export const mockHypotheses: Hypothesis[] = [
  {
    id: '1', investigation_id: '1', rank: 1,
    title: 'Connection pool exhaustion due to misconfigured max_connections in v2.15.0 deploy',
    description: 'Deploy v2.15.0 reduced max_connections from 50 to 10, causing connection pool exhaustion under normal production load. This directly caused timeouts as requests waited for available connections beyond the 30s timeout threshold.',
    confidence: 0.82, status: 'probable',
    causal_factors: [
      'Connection pool max reduced 80% (50→10) in deploy v2.15.0',
      'Deploy at 14:08 UTC precedes first errors by exactly 3 minutes',
      'DB pool wait time spiked simultaneously with error rate',
    ],
    contributing_factors: [
      'No canary deployment — change went directly to 100% traffic',
      'Missing connection pool utilization alert',
      'No automated rollback triggered',
    ],
    interaction_description: 'The reduced connection pool (10 max) was insufficient for normal traffic volume (~45 concurrent requests). Each request that couldn\'t acquire a connection waited up to 30s before timing out, creating a cascading backlog.',
    tests: [
      { id: '1', test_query: 'Correlate error rate with deploy timestamp', expected_true: 'Error rate increases within 3-5 min of deploy', expected_false: 'Error rate precedes deploy', result: 'confirms', confidence_delta: 0.15, evidence_reference: '3' },
      { id: '2', test_query: 'Verify connection pool config diff in v2.15.0 PR #1847', expected_true: 'max_connections reduced in config', expected_false: 'No config change found', result: 'confirms', confidence_delta: 0.12, evidence_reference: '6' },
      { id: '3', test_query: 'Check if active connections reached max before errors', expected_true: 'Pool at capacity before timeout errors', expected_false: 'Pool had available connections', result: 'confirms', confidence_delta: 0.10, evidence_reference: '8' },
      { id: '4', test_query: 'Verify rollback to v2.14.9 restores connections', expected_true: 'Error rate drops to 0 after rollback', expected_false: 'Errors persist after rollback', result: 'pending', confidence_delta: 0 },
    ],
    supporting_evidence_ids: ['1', '2', '3', '6', '8'],
    disconfirming_evidence_ids: [],
  },
  {
    id: '2', investigation_id: '1', rank: 2,
    title: 'Stripe API rate limiting causing cascading timeouts',
    description: 'Stripe API may have begun rate-limiting payment-service requests, causing upstream timeouts that propagated to checkout-api.',
    confidence: 0.35, status: 'candidate',
    causal_factors: [
      'Stripe gateway never reached in traces (timeouts at payment-service level)',
    ],
    contributing_factors: [
      'No circuit breaker on Stripe client',
      'Stripe status page showed no incident',
    ],
    tests: [
      { id: '5', test_query: 'Check Stripe status page for incidents during window', expected_true: 'Stripe incident reported', expected_false: 'No Stripe incident', result: 'disconfirms', confidence_delta: -0.20, evidence_reference: undefined },
      { id: '6', test_query: 'Verify Stripe API response codes in logs', expected_true: 'HTTP 429 from Stripe', expected_false: 'No Stripe 429s found', result: 'inconclusive', confidence_delta: -0.05 },
    ],
    supporting_evidence_ids: ['4'],
    disconfirming_evidence_ids: ['3'],
  },
];

// ─── FIXES ────────────────────────────────────────────────────────────────────

export const mockFixes: FixProposal[] = [
  {
    id: '1', investigation_id: '1', incident_id: '1', hypothesis_id: '1',
    title: 'Rollback payment-service to v2.14.9',
    description: 'Revert to last known good version to restore connection pool settings. Fastest path to recovery.',
    tier: 2, risk: 'low', status: 'proposed', fix_type: 'rollback',
    estimated_time: '~3 minutes', estimated_time_mins: 3,
    affected_service: 'payment-service',
    proposed_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    diff_preview: `# Rollback Command\nkubectl rollout undo deployment/payment-service -n production\n\n# Verify rollout\nkubectl rollout status deployment/payment-service -n production\n\n# Check error rate drops\nwatch -n 5 'kubectl exec -n production deploy/payment-service -- curl -s localhost:8080/health'`,
    rollback_steps: [
      'Monitor error rate for 5 minutes — should drop to <1% within 2 minutes',
      'If error rate persists, check for other root causes',
      'Re-deploy v2.15.0 only after connection pool config is corrected',
    ],
    validation_criteria: [
      { check: 'Error rate < 1%', query: 'sum(rate(http_requests_total{status="5xx",service="payment-service"}[2m])) / sum(rate(http_requests_total{service="payment-service"}[2m])) < 0.01', success_threshold: '< 0.01' },
      { check: 'p99 latency < 200ms', query: 'histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{service="payment-service"}[2m]))', success_threshold: '< 0.2' },
    ],
    commands: [
      'kubectl rollout undo deployment/payment-service -n production',
      'kubectl rollout status deployment/payment-service -n production --timeout=120s',
    ],
  },
  {
    id: '2', investigation_id: '1', incident_id: '1', hypothesis_id: '1',
    title: 'Fix connection pool config — redeploy as v2.15.1',
    description: 'Update max_connections from 10 back to 50 in the config and deploy as a hotfix patch. Permanent fix that preserves other v2.15.0 changes.',
    tier: 2, risk: 'medium', status: 'proposed', fix_type: 'config_change',
    estimated_time: '~8 minutes', estimated_time_mins: 8,
    affected_service: 'payment-service',
    proposed_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    diff_preview: `--- a/config/database.yml\n+++ b/config/database.yml\n@@ -3,7 +3,7 @@\n production:\n   pool:\n-    max_connections: 10\n+    max_connections: 50\n     min_connections: 5\n     checkout_timeout: 5\n     idle_timeout: 300`,
    rollback_steps: [
      'Revert config change: git revert HEAD',
      'Redeploy previous config',
    ],
    validation_criteria: [
      { check: 'DB pool utilization < 80%', query: 'db_pool_active / db_pool_max_connections', success_threshold: '< 0.8' },
    ],
    commands: [
      'git checkout -b hotfix/fix-connection-pool',
      'sed -i "s/max_connections: 10/max_connections: 50/" config/database.yml',
      'git commit -am "fix: restore db pool max_connections to 50 (hotfix for INC-0042)"',
      'git push origin hotfix/fix-connection-pool',
    ],
  },
  {
    id: '3', investigation_id: '1', incident_id: '1',
    title: 'Add connection pool utilization alert',
    description: 'Create Prometheus alerting rule to fire when connection pool utilization exceeds 80%. This gap would have detected this issue before it caused user-facing failures.',
    tier: 3, risk: 'low', status: 'proposed', fix_type: 'gap_artifact',
    estimated_time: '~5 minutes', estimated_time_mins: 5,
    affected_service: 'payment-service',
    proposed_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    diff_preview: `# prometheus/alerts/payment-service.yml\ngroups:\n  - name: payment-service.pool\n    rules:\n      - alert: DBPoolHighUtilization\n        expr: |\n          (db_pool_active{service="payment-service"} /\n           db_pool_max{service="payment-service"}) > 0.8\n        for: 2m\n        labels:\n          severity: warning\n          service: payment-service\n        annotations:\n          summary: "DB pool utilization > 80%"\n          description: "{{$value | humanizePercentage}} of pool connections in use"`,
  },
];

// ─── SERVICES ────────────────────────────────────────────────────────────────

export const mockServices: ServiceNode[] = [
  {
    id: '1', name: 'payment-service', team: 'Payments', criticality: 'critical',
    health: 'incident', readiness_score: 62, active_incidents: 1, last_deploy: '2h ago',
    language: 'Go', repo_url: 'https://github.com/acme/payment-service',
    slo_definitions: [{ name: 'Availability', sli_metric: 'http_success_rate', threshold: 99.9, window: '30d', current_value: 97.2 }],
  },
  {
    id: '2', name: 'checkout-api', team: 'Commerce', criticality: 'critical',
    health: 'degraded', readiness_score: 78, active_incidents: 1, last_deploy: '3d ago',
    language: 'Node.js', repo_url: 'https://github.com/acme/checkout-api',
  },
  {
    id: '3', name: 'user-profile-service', team: 'Platform', criticality: 'high',
    health: 'degraded', readiness_score: 85, active_incidents: 1, last_deploy: '1d ago',
    language: 'Python', repo_url: 'https://github.com/acme/user-profile-service',
  },
  {
    id: '4', name: 'auth-service', team: 'Platform', criticality: 'critical',
    health: 'healthy', readiness_score: 91, active_incidents: 0, last_deploy: '5d ago',
    language: 'Go', repo_url: 'https://github.com/acme/auth-service',
  },
  {
    id: '5', name: 'order-service', team: 'Commerce', criticality: 'critical',
    health: 'healthy', readiness_score: 74, active_incidents: 0, last_deploy: '12h ago',
    language: 'Java', repo_url: 'https://github.com/acme/order-service',
  },
  {
    id: '6', name: 'notification-worker', team: 'Platform', criticality: 'medium',
    health: 'healthy', readiness_score: 56, active_incidents: 0, last_deploy: '1d ago',
    language: 'Python', repo_url: 'https://github.com/acme/notification-worker',
  },
  {
    id: '7', name: 'search-indexer', team: 'Search', criticality: 'high',
    health: 'incident', readiness_score: 68, active_incidents: 1, last_deploy: '6h ago',
    language: 'Java', repo_url: 'https://github.com/acme/search-indexer',
  },
  {
    id: '8', name: 'stripe-gateway', team: 'Payments', criticality: 'critical',
    health: 'healthy', readiness_score: 88, active_incidents: 0, last_deploy: '7d ago',
    language: 'Go', repo_url: 'https://github.com/acme/stripe-gateway',
  },
  {
    id: '9', name: 'inventory-service', team: 'Commerce', criticality: 'high',
    health: 'healthy', readiness_score: 71, active_incidents: 0, last_deploy: '2d ago',
    language: 'Java', repo_url: 'https://github.com/acme/inventory-service',
  },
  {
    id: '10', name: 'cdn-edge', team: 'Infra', criticality: 'medium',
    health: 'healthy', readiness_score: 82, active_incidents: 0, last_deploy: '14d ago',
    language: 'Rust', repo_url: 'https://github.com/acme/cdn-edge',
  },
  {
    id: '11', name: 'api-gateway', team: 'Platform', criticality: 'critical',
    health: 'healthy', readiness_score: 94, active_incidents: 0, last_deploy: '3d ago',
    language: 'Go',
  },
  {
    id: '12', name: 'email-service', team: 'Platform', criticality: 'medium',
    health: 'healthy', readiness_score: 67, active_incidents: 0, last_deploy: '5d ago',
    language: 'Python',
  },
];

// ─── CONNECTORS ──────────────────────────────────────────────────────────────

export const mockConnectors: ConnectorInfo[] = [
  {
    id: '1', name: 'PagerDuty', slug: 'pagerduty', category: 'Alerting & On-Call',
    description: 'Ingest alerts, read on-call schedules, escalation policies, and create/update incidents',
    status: 'connected', last_sync: '2 min ago', items_synced: 1247, icon: 'Bell',
    auth_type: 'api_key', data_lag_secs: 30,
    features: ['Auto-trigger investigations from alerts', 'Read on-call schedules', 'Create incident channels', 'Post investigation updates'],
    scopes: [
      { scope: 'incidents.read', description: 'Read incidents and alert history', required: true, granted: true },
      { scope: 'on_call.read', description: 'Read on-call schedules and escalation policies', required: true, granted: true },
      { scope: 'incidents.write', description: 'Create notes on PagerDuty incidents', required: false, granted: true },
    ],
  },
  {
    id: '2', name: 'Datadog', slug: 'datadog', category: 'Observability',
    description: 'Logs, metrics, APM traces, and synthetic monitoring. Full observability stack.',
    status: 'connected', last_sync: '1 min ago', items_synced: 45892, icon: 'BarChart3',
    auth_type: 'api_key', data_lag_secs: 15,
    features: ['Log correlation', 'Metric anomaly detection', 'APM trace analysis', 'SLO monitoring'],
    scopes: [
      { scope: 'logs.read', description: 'Read log data and search', required: true, granted: true },
      { scope: 'metrics.read', description: 'Read metric data and dashboards', required: true, granted: true },
      { scope: 'apm.read', description: 'Read APM traces and service maps', required: true, granted: true },
    ],
  },
  {
    id: '3', name: 'GitHub', slug: 'github', category: 'Source Control',
    description: 'Commits, PRs, diffs, blame, file history, and deploy events from GitHub Actions',
    status: 'connected', last_sync: '5 min ago', items_synced: 8934, icon: 'GitBranch',
    auth_type: 'oauth2', data_lag_secs: 60,
    features: ['Deploy event correlation', 'Code blame analysis', 'PR diff for hypothesis context', 'Auto-create fix PRs'],
    scopes: [
      { scope: 'repo.read', description: 'Read code, commits, and PRs (read-only)', required: true, granted: true },
      { scope: 'actions.read', description: 'Read GitHub Actions workflow runs and deploys', required: true, granted: true },
      { scope: 'repo.write', description: 'Create PRs for automated fixes', required: false, granted: false },
    ],
  },
  {
    id: '4', name: 'Slack', slug: 'slack', category: 'Communication',
    description: 'Read incident channels, push structured updates, auto-create war room channels',
    status: 'connected', last_sync: '30 sec ago', items_synced: 3421, icon: 'MessageSquare',
    auth_type: 'oauth2', data_lag_secs: 5,
    features: ['Auto-create war room channels for P0/P1', 'Post investigation updates', 'Slash command support', 'Channel history archiving'],
    scopes: [
      { scope: 'channels.read', description: 'Read public channel messages', required: true, granted: true },
      { scope: 'channels.write', description: 'Create incident war room channels', required: true, granted: true },
      { scope: 'chat.write', description: 'Post messages to channels', required: true, granted: true },
    ],
  },
  {
    id: '5', name: 'Prometheus', slug: 'prometheus', category: 'Observability',
    description: 'Metrics collection, alerting rules, and SLO burn rate monitoring',
    status: 'connected', last_sync: '1 min ago', items_synced: 128456, icon: 'Activity',
    auth_type: 'api_key', data_lag_secs: 15,
    features: ['SLO burn rate monitoring', 'Alerting rule sync', 'Metric anomaly detection', 'RED metrics dashboard'],
  },
  {
    id: '6', name: 'Jaeger', slug: 'jaeger', category: 'Observability',
    description: 'Distributed tracing — trace correlation, slow spans, error propagation analysis',
    status: 'connected', last_sync: '3 min ago', items_synced: 23891, icon: 'Waypoints',
    auth_type: 'api_key', data_lag_secs: 60,
    features: ['Trace-based root cause analysis', 'Service dependency mapping', 'Slow span detection'],
  },
  {
    id: '7', name: 'Jira', slug: 'jira', category: 'Ticketing',
    description: 'Issue tracking — push postmortem action items, link incidents to Jira tickets',
    status: 'error', icon: 'Ticket', auth_type: 'api_key',
    error_message: 'API token expired. Re-authenticate to restore Jira sync.',
    features: ['Auto-create Jira tickets from postmortem action items', 'Link incidents to existing tickets'],
  },
  {
    id: '8', name: 'AWS CloudWatch', slug: 'cloudwatch', category: 'Observability',
    description: 'AWS logs, metrics, and infrastructure events from CloudWatch and CloudTrail',
    status: 'stale', last_sync: '45 min ago', data_lag: '45 min', icon: 'Cloud',
    auth_type: 'service_account', data_lag_secs: 2700,
    features: ['CloudWatch Logs correlation', 'CloudTrail audit events', 'EC2/ECS/Lambda metrics'],
  },
  {
    id: '9', name: 'Kubernetes', slug: 'kubernetes', category: 'Infrastructure',
    description: 'Pod events, deployments, HPA, configmaps — read-only cluster visibility',
    status: 'not_connected', icon: 'Container', auth_type: 'service_account',
    features: ['Pod crash detection', 'Resource pressure analysis', 'ConfigMap change tracking', 'HPA scaling events'],
    scopes: [
      { scope: 'pods.read', description: 'Read pod status, events, and logs', required: true, granted: undefined },
      { scope: 'deployments.read', description: 'Read deployment history and replicas', required: true, granted: undefined },
      { scope: 'events.read', description: 'Read cluster events (OOM kills, scheduling failures)', required: true, granted: undefined },
    ],
  },
  {
    id: '10', name: 'Grafana', slug: 'grafana', category: 'Observability',
    description: 'Dashboard panels and Grafana Alertmanager webhook integration',
    status: 'not_connected', icon: 'LayoutDashboard', auth_type: 'api_key',
    features: ['Alertmanager webhook trigger', 'Dashboard panel data', 'SLO annotations'],
  },
  {
    id: '11', name: 'OpsGenie', slug: 'opsgenie', category: 'Alerting & On-Call',
    description: 'Alert management and on-call scheduling — alternative to PagerDuty',
    status: 'not_connected', icon: 'Siren', auth_type: 'api_key',
    features: ['Alert ingestion', 'On-call schedule reading', 'Escalation policy integration'],
  },
  {
    id: '12', name: 'Confluence', slug: 'confluence', category: 'Documentation',
    description: 'Wiki and runbook content — index for investigation context',
    status: 'not_connected', icon: 'BookOpen', auth_type: 'oauth2',
    features: ['Runbook indexing', 'Post postmortems to Confluence', 'Architecture doc context'],
  },
  {
    id: '13', name: 'LaunchDarkly', slug: 'launchdarkly', category: 'Feature Flags',
    description: 'Feature flag state history and rollout percentages for change correlation',
    status: 'not_connected', icon: 'Flag', auth_type: 'api_key',
    features: ['Flag change correlation with incidents', 'Rollout percentage tracking', 'Auto-propose flag disable as fix'],
  },
  {
    id: '14', name: 'Linear', slug: 'linear', category: 'Ticketing',
    description: 'Issue tracking for engineering teams — push postmortem action items',
    status: 'not_connected', icon: 'Ticket', auth_type: 'oauth2',
    features: ['Auto-create Linear issues from postmortem action items', 'Link incidents to Linear'],
  },
];

// ─── READINESS ────────────────────────────────────────────────────────────────

export const mockGapArtifacts: GapArtifact[] = [
  {
    id: 'gap-1', service_id: '1', service_name: 'payment-service',
    dimension: 'incident_readiness', title: 'Add DB connection pool utilization alert',
    description: 'Add Prometheus alert rule for connection pool utilization > 80%. This gap directly caused INC-0042 to not be detected before user impact.',
    artifact_type: 'alert_rule', priority: 'critical', status: 'open',
    incident_id: '1',
    content: `groups:\n  - name: payment-service.pool\n    rules:\n      - alert: DBPoolHighUtilization\n        expr: (db_pool_active / db_pool_max) > 0.8\n        for: 2m\n        labels:\n          severity: warning`,
    created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: 'gap-2', service_id: '1', service_name: 'payment-service',
    dimension: 'observability', title: 'Add structured logging with correlation IDs',
    description: 'payment-service logs lack request_id and correlation_id fields. This made it harder to trace individual request failures through the system.',
    artifact_type: 'pr', priority: 'high', status: 'open',
    incident_id: '1',
    content: `// Add to middleware/logging.go\nfunc LoggingMiddleware(next http.Handler) http.Handler {\n  return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {\n    requestID := r.Header.Get("X-Request-ID")\n    if requestID == "" { requestID = uuid.New().String() }\n    ctx := context.WithValue(r.Context(), "request_id", requestID)\n    log.WithField("request_id", requestID).Info("request started")\n    next.ServeHTTP(w, r.WithContext(ctx))\n  })\n}`,
    created_at: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
  },
  {
    id: 'gap-3', service_id: '1', service_name: 'payment-service',
    dimension: 'incident_readiness', title: 'Create payment-service runbook',
    description: 'No runbook exists for payment-service. A runbook with common failure modes would have reduced time to diagnose INC-0042.',
    artifact_type: 'runbook', priority: 'high', status: 'open',
    incident_id: '1',
    created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  },
  {
    id: 'gap-4', service_id: '6', service_name: 'notification-worker',
    dimension: 'observability', title: 'Add OpenTelemetry instrumentation',
    description: 'notification-worker has no distributed tracing. Adding OTel would enable trace correlation with upstream services.',
    artifact_type: 'pr', priority: 'medium', status: 'open',
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'gap-5', service_id: '5', service_name: 'order-service',
    dimension: 'dependency_mapping', title: 'Document service dependencies in catalog',
    description: 'order-service dependencies on inventory-service and payment-service are not documented in the service catalog.',
    artifact_type: 'yaml', priority: 'medium', status: 'acknowledged',
    created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockReadiness: ReadinessScore[] = [
  {
    service_id: '1', service_name: 'payment-service', overall_score: 62,
    dimensions: { observability: 75, change_tracking: 80, dependency_mapping: 55, incident_readiness: 45, documentation: 55 },
    gap_count: 8, last_incident: '2h ago',
    gaps: mockGapArtifacts.filter(g => g.service_id === '1'),
  },
  {
    service_id: '2', service_name: 'checkout-api', overall_score: 78,
    dimensions: { observability: 85, change_tracking: 90, dependency_mapping: 70, incident_readiness: 65, documentation: 80 },
    gap_count: 4, last_incident: '2h ago',
    gaps: [],
  },
  {
    service_id: '3', service_name: 'user-profile-service', overall_score: 85,
    dimensions: { observability: 90, change_tracking: 85, dependency_mapping: 80, incident_readiness: 85, documentation: 85 },
    gap_count: 2, last_incident: '5h ago',
    gaps: [],
  },
  {
    service_id: '4', service_name: 'auth-service', overall_score: 91,
    dimensions: { observability: 95, change_tracking: 90, dependency_mapping: 85, incident_readiness: 95, documentation: 90 },
    gap_count: 1,
    gaps: [],
  },
  {
    service_id: '5', service_name: 'order-service', overall_score: 74,
    dimensions: { observability: 80, change_tracking: 85, dependency_mapping: 65, incident_readiness: 60, documentation: 80 },
    gap_count: 5,
    gaps: mockGapArtifacts.filter(g => g.service_id === '5'),
  },
  {
    service_id: '6', service_name: 'notification-worker', overall_score: 56,
    dimensions: { observability: 60, change_tracking: 70, dependency_mapping: 40, incident_readiness: 45, documentation: 65 },
    gap_count: 11, last_incident: '1d ago',
    gaps: mockGapArtifacts.filter(g => g.service_id === '6'),
  },
  {
    service_id: '7', service_name: 'search-indexer', overall_score: 68,
    dimensions: { observability: 75, change_tracking: 80, dependency_mapping: 55, incident_readiness: 60, documentation: 70 },
    gap_count: 6, last_incident: '8h ago',
    gaps: [],
  },
];

// ─── CHANGE TIMELINE ─────────────────────────────────────────────────────────

export const mockChangeTimeline: ChangeEvent[] = [
  {
    id: 'ch-1', service_name: 'payment-service', change_type: 'deploy',
    title: 'Deploy v2.15.0', description: 'Connection pool config change, retry logic for Stripe client',
    actor: 'deploy-bot', source_ref: 'https://github.com/acme/payment-service/actions/runs/1234',
    occurred_at: new Date(Date.now() - 115 * 60 * 1000).toISOString(),
    metadata: { version: 'v2.15.0', commit: 'abc123f', pr: '1847' },
  },
  {
    id: 'ch-2', service_name: 'checkout-api', change_type: 'config',
    title: 'Update checkout timeout', description: 'Increased downstream timeout from 15s to 30s',
    actor: 'james@acme.dev', occurred_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    metadata: { key: 'downstream_timeout_ms', old: '15000', new: '30000' },
  },
  {
    id: 'ch-3', service_name: 'user-profile-service', change_type: 'deploy',
    title: 'Deploy v3.2.1', description: 'Cache TTL reduction from 5m to 30s for profile data',
    actor: 'deploy-bot', occurred_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── REPORT METRICS ───────────────────────────────────────────────────────────

export const mockReportMetrics: ReportMetrics = {
  total_incidents: 42,
  mttr_minutes: 47,
  mttr_trend: -12.5,
  slo_violations: 6,
  p0_incidents: 3,
  alert_noise_ratio: 0.34,
};

export const mockDoraMetrics: DoraMetrics = {
  deployment_frequency: 4.2, // deploys per day
  deployment_frequency_trend: 0.8,
  change_failure_rate: 8.3, // %
  change_failure_rate_trend: -1.2,
  mttr_minutes: 47,
  mttr_trend: -12.5,
  change_lead_time_hours: 2.8,
  change_lead_time_trend: -0.5,
};

export const mockOnCallMetrics: OnCallMetrics[] = [
  { engineer: 'Sarah Chen', pages_this_week: 4, after_hours_pages: 1, mtta_minutes: 3.2, incidents_this_month: 8 },
  { engineer: 'James Park', pages_this_week: 6, after_hours_pages: 3, mtta_minutes: 4.8, incidents_this_month: 12 },
  { engineer: 'Maria Garcia', pages_this_week: 3, after_hours_pages: 0, mtta_minutes: 2.9, incidents_this_month: 6 },
  { engineer: 'Tom Ellis', pages_this_week: 5, after_hours_pages: 2, mtta_minutes: 6.1, incidents_this_month: 9 },
  { engineer: 'Alex Kim', pages_this_week: 2, after_hours_pages: 1, mtta_minutes: 5.5, incidents_this_month: 4 },
];

export const mockHypothesisAccuracy: HypothesisAccuracy = {
  total_incidents: 42,
  top_hypothesis_correct: 34,
  accuracy_rate: 0.81,
  by_pattern: [
    { pattern: 'Deploy regression', accuracy: 0.92, count: 15 },
    { pattern: 'Dependency timeout', accuracy: 0.85, count: 11 },
    { pattern: 'Config misconfiguration', accuracy: 0.78, count: 8 },
    { pattern: 'Memory leak', accuracy: 0.70, count: 5 },
    { pattern: 'Rate limit exhaustion', accuracy: 0.60, count: 3 },
  ],
};

// ─── RESOLUTION PACKET ────────────────────────────────────────────────────────

export const mockTimeline: TimelineEvent[] = [
  { id: 't1', timestamp: new Date(Date.now() - 116 * 60 * 1000).toISOString(), event_type: 'deploy', title: 'Deploy v2.15.0 to payment-service', description: 'max_connections reduced from 50 to 10', actor: 'deploy-bot', service: 'payment-service', source: 'GitHub Actions' },
  { id: 't2', timestamp: new Date(Date.now() - 112 * 60 * 1000).toISOString(), event_type: 'metric', title: 'p99 latency spike — payment-service', description: '120ms → 28,500ms (4.7σ)', service: 'payment-service', source: 'Prometheus', evidence_reference: '2' },
  { id: 't3', timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(), event_type: 'alert', title: 'Error rate alert: payment-service > 50%', description: 'PagerDuty alert fired', service: 'payment-service', source: 'PagerDuty', evidence_reference: '5' },
  { id: 't4', timestamp: new Date(Date.now() - 108 * 60 * 1000).toISOString(), event_type: 'on_call', title: 'Sarah Chen paged', description: 'Escalation policy "Payments Team P0" activated', actor: 'PagerDuty', service: 'payment-service' },
  { id: 't5', timestamp: new Date(Date.now() - 106 * 60 * 1000).toISOString(), event_type: 'on_call', title: 'Alert acknowledged', description: 'MTTA: 2 minutes', actor: 'Sarah Chen', service: 'payment-service' },
  { id: 't6', timestamp: new Date(Date.now() - 105 * 60 * 1000).toISOString(), event_type: 'status_change', title: 'Incident declared — INC-0042', description: 'Status: DETECTED → INVESTIGATING', actor: 'BugPilot Auto', service: 'payment-service' },
  { id: 't7', timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(), event_type: 'status_change', title: 'Investigation started', description: 'BugPilot RCA agent initialized', actor: 'BugPilot Auto' },
];

export const mockResolutionPacket: ResolutionPacket = {
  id: 'pkt-1', incident_id: '1', investigation_id: '1', version: 1,
  overall_confidence: 0.82, completeness_score: 0.82,
  llm_available: true, llm_model_used: 'claude-sonnet-4-6', prompt_version: 'v2.4',
  summary: {
    one_line: 'Deploy v2.15.0 reduced DB connection pool 80% (50→10), exhausting capacity under normal production load and causing payment failures.',
    severity_basis: 'Complete payment processing outage affecting 100% of checkout flow for all users.',
    customer_impact: 'All checkout attempts failing for 100% of users during the incident window. Estimated revenue impact: $42,000 based on normal transaction rate.',
    confidence_statement: 'probable',
    slo_impact: { violated: true, budget_consumed: 45.2, burn_rate: 8.5 },
  },
  affected_scope: {
    services: ['payment-service', 'checkout-api', 'stripe-gateway'],
    endpoints: ['/api/v1/payments/charge', '/api/v1/checkout/complete'],
    regions: ['us-east-1'],
    tenants: [],
    versions: ['payment-service@v2.15.0'],
    flag_cohorts: [],
    scope_confidence: 0.92,
  },
  unified_timeline: mockTimeline,
  topology_slice: {
    causal_path: ['checkout-api', 'payment-service', 'stripe-gateway'],
    dependency_map: {
      'user-api': ['checkout-api'],
      'checkout-api': ['payment-service'],
      'payment-service': ['stripe-gateway', 'postgres-db'],
    },
    confidence: 0.88,
    source: 'inferred',
  },
  hypotheses: mockHypotheses,
  root_cause_conclusion: {
    confirmed_root_causes: [],
    probable_root_causes: ['Deploy v2.15.0 misconfigured max_connections from 50 to 10 in database.yml, exhausting the connection pool under normal production traffic (~45 concurrent requests).'],
    contributing_factors: [
      'No canary deployment — change rolled out to 100% of traffic simultaneously',
      'No alert configured for connection pool utilization',
      'No automated rollback triggered when error rate exceeded 50%',
    ],
    explicit_unknowns: [
      'Cannot confirm whether Stripe was also degraded (Stripe webhook logs unavailable)',
      'Redis slow log not accessible — cannot rule out cache-layer contribution',
    ],
    requires_further_investigation: false,
    next_investigation_steps: [],
  },
  mitigation_plan: {
    immediate_actions: [
      { id: 'ma-1', description: 'Rollback payment-service to v2.14.9 via kubectl rollout undo', tier: 2, owner_role: 'IC / Tech Lead', estimated_time: '~3 minutes', risk_level: 'low', rollback_available: true, commands: ['kubectl rollout undo deployment/payment-service -n production'], fix_proposal_id: '1' },
    ],
    durable_fixes: [
      { id: 'df-1', description: 'Fix max_connections config and deploy as v2.15.1 with correct value (50)', tier: 2, owner_role: 'Tech Lead', estimated_time: '~8 minutes', risk_level: 'medium', rollback_available: true, fix_proposal_id: '2' },
    ],
    preventive_actions: [
      { id: 'pa-1', description: 'Add Prometheus alert for DB pool utilization > 80%', tier: 3, owner_role: 'Payments Team', estimated_time: '~5 minutes', risk_level: 'low', rollback_available: false, fix_proposal_id: '3' },
      { id: 'pa-2', description: 'Require canary deployment for payment-service config changes', tier: 3, owner_role: 'Platform Team', estimated_time: '~2 hours', risk_level: 'low', rollback_available: false },
    ],
    execution_order: ['Rollback to v2.14.9 (immediate)', 'Confirm error rate drops to <1%', 'Deploy v2.15.1 with correct config (durable)', 'Add pool utilization alert (preventive)'],
  },
  verification_criteria: [
    { id: 'vc-1', check_type: 'error_rate', measurement_query: 'sum(rate(http_requests_total{status="5xx",service="payment-service"}[2m])) / sum(rate(http_requests_total{service="payment-service"}[2m]))', success_threshold: '< 0.01', timeout: '10m', fallback_action: 'Escalate to DB team — possible deeper issue' },
    { id: 'vc-2', check_type: 'p99_latency', measurement_query: 'histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{service="payment-service"}[2m]))', success_threshold: '< 0.2', timeout: '5m', fallback_action: 'Investigate remaining latency source' },
  ],
  gap_artifacts: mockGapArtifacts.filter(g => g.incident_id === '1'),
  missing_signals: [
    { source: 'Kubernetes pod metrics', reason: 'Kubernetes connector not configured', confidence_impact: 0.08 },
    { source: 'Stripe webhook logs', reason: 'Stripe webhook endpoint not set up', confidence_impact: 0.05 },
    { source: 'Redis slow log', reason: 'Redis connector not available', confidence_impact: 0.03 },
  ],
  created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
};

// ─── POSTMORTEM ───────────────────────────────────────────────────────────────

export const mockPostmortem: Postmortem = {
  id: 'pm-6', incident_id: '6', status: 'draft',
  created_at: new Date(Date.now() - 115 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date(Date.now() - 113 * 60 * 60 * 1000).toISOString(),
  content: {
    incident_summary: {
      what_happened: 'The order-service experienced complete database connection pool exhaustion, causing all order placement operations to fail for 4 hours. The issue was triggered by a deploy that incorrectly reduced the connection pool size from 50 to 10 without proper validation.',
      customer_impact: 'Order placement was completely unavailable for approximately 4 hours. An estimated 1,200 orders were affected, representing ~$240,000 in delayed revenue.',
      duration_mins: 240,
      severity: 'P0',
    },
    timeline: mockTimeline,
    root_causes: [
      'A configuration change in deploy v5.12.0 reduced max_connections from 50 to 10 in database.yml. This change was not validated against production traffic requirements.',
    ],
    contributing_factors: [
      'The deployment process did not validate database pool configuration against production traffic volume.',
      'No alerting existed for database connection pool utilization.',
      'The runbook for order-service database issues was outdated and did not cover pool exhaustion.',
      'The deploy went to 100% traffic without a canary phase.',
    ],
    what_went_well: [
      'On-call engineer was paged and acknowledged within 2 minutes.',
      'BugPilot identified the root cause within 12 minutes of investigation start.',
      'The rollback procedure was clean and restored service within 4 minutes of approval.',
      'Clear communication was maintained in the war room channel throughout.',
    ],
    what_went_poorly: [
      'The deployment process lacked validation of connection pool configuration against production traffic requirements.',
      'The alerting system did not cover database connection pool utilization, allowing the issue to cause user impact before detection.',
      'The existing runbook for order-service did not cover database pool exhaustion as a failure mode.',
      'The incident took 4 hours to resolve due to initial investigation focused on network issues.',
    ],
    lessons_learned: [
      'Database connection pool configuration should be treated as a critical parameter requiring load testing validation before production deploys.',
      'RED metrics (Rate, Errors, Duration) are necessary but not sufficient — internal resource metrics like connection pool utilization also need alerting.',
      'Runbooks should be updated after every incident to include the confirmed failure mode and diagnosis steps.',
    ],
    slo_impact: { violated: true, budget_consumed_pct: 78.5, slo_name: 'order-service Availability' },
    action_items: [
      { id: 'ai-1', description: 'Add automated validation of DB pool config against production traffic in CI/CD pipeline', owner_role: 'Platform Team', due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), priority: 'high', gap_artifact_id: null, external_issue_key: null, status: 'open' },
      { id: 'ai-2', description: 'Add Prometheus alert rule for DB pool utilization > 80% on all critical services', owner_role: 'Payments Team', due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), priority: 'high', gap_artifact_id: 'gap-1', external_issue_key: null, status: 'open' },
      { id: 'ai-3', description: 'Update order-service runbook with pool exhaustion diagnosis and remediation steps', owner_role: 'Commerce Team', due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), priority: 'medium', gap_artifact_id: 'gap-3', external_issue_key: null, status: 'in_progress' },
      { id: 'ai-4', description: 'Implement canary deployment requirement for payment-service and order-service config changes', owner_role: 'DevOps Team', due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), priority: 'medium', gap_artifact_id: null, external_issue_key: null, status: 'open' },
    ],
  },
};

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────

export const mockAuditLog: AuditLogEntry[] = [
  { id: '1', org_id: '1', user_id: '1', user_name: 'Sarah Chen', action_type: 'fix.approve', resource_type: 'fix_proposal', resource_id: '1', actor: 'user', metadata: { fix_title: 'Rollback payment-service to v2.14.9' }, ip_address: '10.0.1.5', created_at: new Date(Date.now() - 85 * 60 * 1000).toISOString() },
  { id: '2', org_id: '1', user_id: undefined, user_name: undefined, action_type: 'investigation.start', resource_type: 'investigation', resource_id: '1', actor: 'bugpilot-auto', metadata: { incident_id: '1', phase: 'classify' }, created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString() },
  { id: '3', org_id: '1', user_id: '1', user_name: 'Sarah Chen', action_type: 'incident.status_change', resource_type: 'incident', resource_id: '1', actor: 'user', metadata: { from: 'detected', to: 'investigating' }, ip_address: '10.0.1.5', created_at: new Date(Date.now() - 105 * 60 * 1000).toISOString() },
  { id: '4', org_id: '1', user_id: '1', user_name: 'Sarah Chen', action_type: 'connector.auth', resource_type: 'connector', resource_id: '3', actor: 'user', metadata: { connector: 'github', result: 'success' }, ip_address: '10.0.1.5', created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: '5', org_id: '1', user_id: undefined, action_type: 'connector.sync', resource_type: 'connector', resource_id: '2', actor: 'system', metadata: { connector: 'datadog', items: 45892, duration_ms: 3200 }, created_at: new Date(Date.now() - 60 * 1000).toISOString() },
  { id: '6', org_id: '1', user_id: '1', user_name: 'Sarah Chen', action_type: 'member.invite', resource_type: 'org_member', resource_id: '6', actor: 'user', metadata: { email: 'tom@acme.dev', role: 'responder' }, ip_address: '10.0.1.5', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '7', org_id: '1', user_id: undefined, action_type: 'investigation.complete', resource_type: 'investigation', resource_id: '1', actor: 'bugpilot-auto', metadata: { confidence: 0.82, hypotheses: 2 }, created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
  { id: '8', org_id: '1', user_id: '1', user_name: 'Sarah Chen', action_type: 'packet.view', resource_type: 'resolution_packet', resource_id: 'pkt-1', actor: 'user', ip_address: '10.0.1.5', created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
  { id: '9', org_id: '1', user_id: '2', user_name: 'James Park', action_type: 'postmortem.edit', resource_type: 'postmortem', resource_id: 'pm-6', actor: 'user', metadata: { section: 'what_went_well' }, ip_address: '10.0.2.8', created_at: new Date(Date.now() - 113 * 60 * 60 * 1000).toISOString() },
  { id: '10', org_id: '1', user_id: '1', user_name: 'Sarah Chen', action_type: 'member.role_change', resource_type: 'org_member', resource_id: '4', actor: 'user', metadata: { from: 'viewer', to: 'responder' }, ip_address: '10.0.1.5', created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
];

// ─── API KEYS ─────────────────────────────────────────────────────────────────

export const mockApiKeys: ApiKey[] = [
  { id: 'key-1', name: 'Production API Key', prefix: 'bp_prod_xK8m', created_at: '2024-01-15T09:00:00Z', last_used_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), created_by: 'sarah@acme.dev' },
  { id: 'key-2', name: 'CI/CD Pipeline Key', prefix: 'bp_ci_nR3q', created_at: '2024-02-20T10:30:00Z', last_used_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), created_by: 'sarah@acme.dev' },
];

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export const mockNotifications: NotificationItem[] = [
  { id: 'n1', type: 'incident_declared', title: 'P0 Incident Declared', description: 'INC-0042: Payment service timeout causing checkout failures', incident_id: '1', created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), read: false },
  { id: 'n2', type: 'fix_approval_needed', title: 'Fix Approval Needed', description: 'Rollback payment-service to v2.14.9 — awaiting your approval', incident_id: '1', created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), read: false },
  { id: 'n3', type: 'investigation_complete', title: 'Investigation Complete', description: 'INC-0041: Root cause identified with 78% confidence', incident_id: '2', created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), read: false },
  { id: 'n4', type: 'connector_error', title: 'Jira Connector Error', description: 'API token expired — re-authenticate to restore Jira sync', created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), read: true },
  { id: 'n5', type: 'postmortem_overdue', title: 'Postmortem Action Item Overdue', description: 'INC-0037: Add connection pool alert rule — due 2 days ago', incident_id: '6', created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), read: true },
];

// ─── REPORT CHART DATA ────────────────────────────────────────────────────────

export const mockMttrTrend = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  P0: Math.max(20, Math.round(180 - i * 4 + (Math.random() - 0.5) * 40)),
  P1: Math.max(15, Math.round(80 - i * 1.5 + (Math.random() - 0.5) * 20)),
  P2: Math.max(10, Math.round(45 - i * 0.8 + (Math.random() - 0.5) * 15)),
}));

export const mockIncidentsByDay = Array.from({ length: 14 }, (_, i) => ({
  date: new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  P0: Math.floor(Math.random() * 2),
  P1: Math.floor(Math.random() * 3) + 1,
  P2: Math.floor(Math.random() * 4) + 1,
  P3: Math.floor(Math.random() * 5) + 2,
}));

export const mockAlertNoiseTrend = Array.from({ length: 14 }, (_, i) => ({
  date: new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  total: Math.floor(Math.random() * 50) + 80,
  correlated: Math.floor(Math.random() * 20) + 30,
  suppressed: Math.floor(Math.random() * 30) + 20,
}));

export const mockSloTrend = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  'payment-service': Math.max(95, Math.min(100, 99.2 - (Math.random() - 0.7) * 2)),
  'checkout-api': Math.max(97, Math.min(100, 99.5 - (Math.random() - 0.7) * 1)),
  'auth-service': Math.max(99, Math.min(100, 99.9 - (Math.random() - 0.7) * 0.3)),
}));

export const mockDeployFrequency = Array.from({ length: 14 }, (_, i) => ({
  date: new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  deploys: Math.floor(Math.random() * 6) + 2,
  failed: Math.floor(Math.random() * 2),
}));
