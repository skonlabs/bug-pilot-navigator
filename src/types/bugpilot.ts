// BugPilot Core Types

export type Severity = 'P0' | 'P1' | 'P2' | 'P3';

export type IncidentStatus =
  | 'detected'
  | 'investigating'
  | 'identified'
  | 'mitigating'
  | 'resolved'
  | 'postmortem'
  | 'closed';

export type InvestigationStatus = 'queued' | 'running' | 'complete' | 'failed' | 'inconclusive';

export type InvestigationPhase =
  | 'classify'
  | 'scope'
  | 'evidence'
  | 'topology'
  | 'hypothesize'
  | 'test'
  | 'fix'
  | 'packet';

export type HypothesisStatus = 'candidate' | 'probable' | 'confirmed' | 'eliminated';

export type FixTier = 1 | 2 | 3;
export type FixRisk = 'low' | 'medium' | 'high' | 'critical';
export type FixStatus = 'proposed' | 'approved' | 'rejected' | 'executing' | 'executed' | 'failed' | 'rolled_back';

export type EvidenceType =
  | 'log_event'
  | 'metric_anomaly'
  | 'trace_span'
  | 'deploy_event'
  | 'config_change'
  | 'flag_change'
  | 'alert'
  | 'on_call_event'
  | 'external_status'
  | 'db_signal'
  | 'security_event';

export type ConnectorStatus = 'connected' | 'error' | 'stale' | 'not_connected';

export type UserRole = 'viewer' | 'responder' | 'admin' | 'security_admin';

export type PostmortemStatus = 'draft' | 'review' | 'final';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
}

export interface OrgMember extends User {
  joined_at: string;
  invited_by?: string;
}

export interface Organization {
  id: string;
  slug: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  timezone?: string;
}

export interface Incident {
  id: string;
  short_id: string;
  title: string;
  status: IncidentStatus;
  severity: Severity;
  severity_basis?: string;
  environment: string;
  customer_impact?: string;
  source: string;
  affected_services: string[];
  ic?: User;
  tl?: User;
  slack_channel_id?: string;
  slack_channel_name?: string;
  slo_violated: boolean;
  error_budget_consumed?: number;
  burn_rate?: number;
  detected_at: string;
  investigating_at?: string;
  identified_at?: string;
  mitigating_at?: string;
  resolved_at?: string;
  closed_at?: string;
  time_to_detect_secs?: number;
  time_to_resolve_secs?: number;
  tags: string[];
  latest_packet_id?: string;
  investigation_status?: InvestigationStatus;
  investigation_phase?: InvestigationPhase;
}

export interface Investigation {
  id: string;
  incident_id: string;
  status: InvestigationStatus;
  phase?: InvestigationPhase;
  overall_confidence: number;
  completeness_score: number;
  llm_available: boolean;
  llm_model_used?: string;
  prompt_version?: string;
  tokens_in?: number;
  tokens_out?: number;
  cost_usd?: number;
  missing_signals: string[];
  started_at?: string;
  completed_at?: string;
}

export interface EvidenceItem {
  id: string;
  investigation_id: string;
  evidence_type: EvidenceType;
  source_connector: string;
  source_system: string;
  summary: string;
  confidence: number;
  inference_method: 'llm_inference' | 'regex_parse' | 'schema_mapped' | 'keyword_match' | 'fuzzy_match' | 'manual_upload';
  event_timestamp: string;
  is_pinned: boolean;
  service_name: string;
  normalized_data?: Record<string, unknown>;
}

export interface Hypothesis {
  id: string;
  investigation_id: string;
  rank: number;
  title: string;
  description: string;
  confidence: number;
  status: HypothesisStatus;
  causal_factors: string[];
  contributing_factors: string[];
  interaction_description?: string;
  tests: HypothesisTest[];
  supporting_evidence_ids: string[];
  disconfirming_evidence_ids: string[];
}

export interface HypothesisTest {
  id: string;
  test_query: string;
  expected_true?: string;
  expected_false?: string;
  result: 'confirms' | 'disconfirms' | 'inconclusive' | 'pending';
  confidence_delta: number;
  evidence_reference?: string;
}

export interface FixProposal {
  id: string;
  investigation_id: string;
  incident_id: string;
  hypothesis_id?: string;
  title: string;
  description: string;
  tier: FixTier;
  risk: FixRisk;
  status: FixStatus;
  fix_type: 'rollback' | 'config_change' | 'code_fix' | 'flag_change' | 'data_fix' | 'infra' | 'runbook' | 'gap_artifact';
  estimated_time: string;
  estimated_time_mins?: number;
  diff_preview?: string;
  rollback_steps?: string[];
  validation_criteria?: Array<{ check: string; query?: string; success_threshold?: string }>;
  commands?: string[];
  pr_url?: string;
  approved_by?: string;
  approved_at?: string;
  executed_at?: string;
  incident_id_ref?: string;
  affected_service: string;
  proposed_at: string;
}

export interface ServiceNode {
  id: string;
  name: string;
  team: string;
  criticality: 'critical' | 'high' | 'medium' | 'low';
  health: 'healthy' | 'degraded' | 'incident' | 'unknown';
  readiness_score: number;
  active_incidents: number;
  last_deploy?: string;
  language?: string;
  repo_url?: string;
  on_call_policy?: string;
  runbook_url?: string;
  slo_definitions?: SloDefinition[];
}

export interface SloDefinition {
  name: string;
  sli_metric: string;
  threshold: number;
  window: string;
  current_value?: number;
}

export interface ConnectorInfo {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  status: ConnectorStatus;
  last_sync?: string;
  data_lag?: string;
  items_synced?: number;
  error_message?: string;
  icon: string;
  features?: string[];
  scopes?: ConnectorScope[];
  auth_type?: 'oauth2' | 'api_key' | 'service_account';
  data_lag_secs?: number;
}

export interface ConnectorScope {
  scope: string;
  description: string;
  required: boolean;
  granted?: boolean;
}

export interface ReadinessScore {
  service_id: string;
  service_name: string;
  overall_score: number;
  dimensions: {
    observability: number;
    change_tracking: number;
    dependency_mapping: number;
    incident_readiness: number;
    documentation: number;
  };
  gap_count: number;
  last_incident?: string;
  gaps?: GapArtifact[];
}

export interface GapArtifact {
  id: string;
  service_id: string;
  service_name: string;
  dimension: string;
  title: string;
  description: string;
  artifact_type: 'pr' | 'config' | 'yaml' | 'dashboard' | 'alert_rule' | 'runbook' | 'schema';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'acknowledged' | 'resolved';
  incident_id?: string;
  content?: string;
  created_at: string;
}

export interface ReportMetrics {
  total_incidents: number;
  mttr_minutes: number;
  mttr_trend: number;
  slo_violations: number;
  p0_incidents: number;
  alert_noise_ratio: number;
}

export interface DoraMetrics {
  deployment_frequency: number; // deploys per day
  deployment_frequency_trend: number;
  change_failure_rate: number; // percentage
  change_failure_rate_trend: number;
  mttr_minutes: number;
  mttr_trend: number;
  change_lead_time_hours: number;
  change_lead_time_trend: number;
}

export interface OnCallMetrics {
  engineer: string;
  pages_this_week: number;
  after_hours_pages: number;
  mtta_minutes: number;
  incidents_this_month: number;
}

export interface HypothesisAccuracy {
  total_incidents: number;
  top_hypothesis_correct: number;
  accuracy_rate: number;
  by_pattern: Array<{ pattern: string; accuracy: number; count: number }>;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  event_type: 'deploy' | 'config' | 'alert' | 'metric' | 'on_call' | 'note' | 'status_change' | 'flag' | 'external';
  title: string;
  description?: string;
  actor?: string;
  service?: string;
  source?: string;
  evidence_reference?: string;
}

export interface ChangeEvent {
  id: string;
  org_id?: string;
  service_name: string;
  change_type: 'deploy' | 'config' | 'flag' | 'migration' | 'infra' | 'rollback' | 'manual';
  title: string;
  description?: string;
  actor: string;
  source_ref?: string;
  metadata?: Record<string, string>;
  occurred_at: string;
}

export interface ResolutionPacket {
  id: string;
  incident_id: string;
  investigation_id: string;
  version: number;
  overall_confidence: number;
  completeness_score: number;
  llm_available: boolean;
  llm_model_used?: string;
  prompt_version?: string;
  summary: {
    one_line: string;
    severity_basis: string;
    customer_impact: string;
    confidence_statement: 'high confidence' | 'probable' | 'inconclusive';
    slo_impact: {
      violated: boolean;
      budget_consumed: number;
      burn_rate: number;
    };
  };
  affected_scope: {
    services: string[];
    endpoints: string[];
    regions: string[];
    tenants: string[];
    versions: string[];
    flag_cohorts: string[];
    scope_confidence: number;
  };
  unified_timeline: TimelineEvent[];
  topology_slice?: {
    causal_path: string[];
    dependency_map: Record<string, string[]>;
    confidence: number;
    source: 'inferred' | 'explicit';
  };
  hypotheses: Hypothesis[];
  root_cause_conclusion: {
    confirmed_root_causes: string[];
    probable_root_causes: string[];
    contributing_factors: string[];
    explicit_unknowns: string[];
    requires_further_investigation: boolean;
    next_investigation_steps: string[];
  };
  mitigation_plan: {
    immediate_actions: MitigationAction[];
    durable_fixes: MitigationAction[];
    preventive_actions: MitigationAction[];
    execution_order: string[];
  };
  verification_criteria: VerificationCriterion[];
  gap_artifacts: GapArtifact[];
  missing_signals: MissingSignal[];
  created_at: string;
}

export interface MitigationAction {
  id: string;
  description: string;
  tier: FixTier;
  owner_role: string;
  estimated_time: string;
  risk_level: FixRisk;
  rollback_available: boolean;
  commands?: string[];
  fix_proposal_id?: string;
}

export interface VerificationCriterion {
  id: string;
  check_type: string;
  measurement_query: string;
  success_threshold: string;
  timeout: string;
  fallback_action: string;
}

export interface MissingSignal {
  source: string;
  reason: string;
  confidence_impact: number;
  fix_url?: string;
}

export interface Postmortem {
  id: string;
  incident_id: string;
  status: PostmortemStatus;
  finalized_by?: string;
  finalized_at?: string;
  created_at: string;
  updated_at: string;
  content: PostmortemContent;
}

export interface PostmortemContent {
  incident_summary: {
    what_happened: string;
    customer_impact: string;
    duration_mins: number;
    severity: string;
  };
  timeline: TimelineEvent[];
  root_causes: string[];
  contributing_factors: string[];
  what_went_well: string[];
  what_went_poorly: string[];
  lessons_learned: string[];
  slo_impact: {
    violated: boolean;
    budget_consumed_pct: number;
    slo_name: string;
  } | null;
  action_items: PostmortemActionItem[];
}

export interface PostmortemActionItem {
  id: string;
  description: string;
  owner_role: string;
  due_date: string | null;
  priority: 'high' | 'medium' | 'low';
  gap_artifact_id: string | null;
  external_issue_key: string | null;
  status: 'open' | 'in_progress' | 'done';
}

export interface AuditLogEntry {
  id: string;
  org_id: string;
  user_id?: string;
  user_name?: string;
  action_type: string;
  resource_type?: string;
  resource_id?: string;
  actor: 'user' | 'system' | 'bugpilot-auto';
  metadata?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at?: string;
  created_by: string;
}

export interface NotificationItem {
  id: string;
  type: 'incident_declared' | 'fix_approval_needed' | 'postmortem_overdue' | 'connector_error' | 'investigation_complete';
  title: string;
  description: string;
  incident_id?: string;
  created_at: string;
  read: boolean;
}
