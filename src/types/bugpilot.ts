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
  | 'on_call_event';

export type ConnectorStatus = 'connected' | 'error' | 'stale' | 'not_connected';

export type UserRole = 'viewer' | 'responder' | 'admin' | 'security_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
}

export interface Organization {
  id: string;
  slug: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
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
  slo_violated: boolean;
  error_budget_consumed?: number;
  burn_rate?: number;
  detected_at: string;
  resolved_at?: string;
  tags: string[];
}

export interface Investigation {
  id: string;
  incident_id: string;
  status: InvestigationStatus;
  phase?: InvestigationPhase;
  overall_confidence: number;
  completeness_score: number;
  llm_available: boolean;
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
  inference_method: 'llm_inference' | 'regex_parse' | 'schema_mapped';
  event_timestamp: string;
  is_pinned: boolean;
  service_name: string;
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
  tests: HypothesisTest[];
  supporting_evidence_ids: string[];
  disconfirming_evidence_ids: string[];
}

export interface HypothesisTest {
  id: string;
  test_query: string;
  result: 'confirms' | 'disconfirms' | 'inconclusive' | 'pending';
  confidence_delta: number;
}

export interface FixProposal {
  id: string;
  investigation_id: string;
  title: string;
  description: string;
  tier: FixTier;
  risk: FixRisk;
  status: FixStatus;
  fix_type: string;
  estimated_time: string;
  diff_preview?: string;
  rollback_steps?: string[];
  incident_id: string;
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
}

export interface ConnectorInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  status: ConnectorStatus;
  last_sync?: string;
  data_lag?: string;
  items_synced?: number;
  error_message?: string;
  icon: string;
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
}

export interface ReportMetrics {
  total_incidents: number;
  mttr_minutes: number;
  mttr_trend: number;
  slo_violations: number;
  p0_incidents: number;
  alert_noise_ratio: number;
}
