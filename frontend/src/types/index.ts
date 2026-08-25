export interface Observation {
  id?: number;
  timestamp: string;
  station_id: string;
  temperature: number;
  pressure: number;
  humidity: number;
  latitude?: number;
  longitude?: number;
  elevation?: number;
  validation_status?: string;
}

export interface FeatureAttribution {
  feature: string;
  attribution: number;
  raw_value?: number;
  description?: string;
}

export interface ExplanationResult {
  summary: string;
  contributing_features: FeatureAttribution[];
  method: string;
}

export interface TierScores {
  tier1_qc_flag: boolean;
  tier2_point_score: number;
  tier2_temporal_score: number;
  tier3_multivariate_score: number;
  tier1_hard?: number;
  tier1_soft?: number;
}

export interface InferenceResult {
  timestamp: string;
  station_id: string;
  is_anomaly: boolean;
  anomaly_score: number;
  confidence: number;
  severity: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  classification: string;
  is_fault: boolean;
  reason: string;
  explanation: ExplanationResult;
  tier_scores: TierScores;
  sensor_health: number;
  sensor_status: string;
  recommended_action: string;
  degradation_risk: string;
  estimated_hours_to_failure?: number | null;
  multivariate_diagnostics?: Record<string, any>;
  raw_values?: Record<string, number>;
  temperature?: number;
  pressure?: number;
  humidity?: number;
  source?: {
    type: 'SIMULATED' | 'EXTERNAL_API' | 'PHYSICAL_AWS';
    id: string;
    provider?: string;
    device_id?: string;
  };
}

export type DataSourceType = 'SIMULATED' | 'EXTERNAL_API' | 'PHYSICAL_AWS';

export type SourceConnectionStatus =
  | 'CONNECTED'
  | 'RUNNING'
  | 'DEGRADED'
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'STOPPED'
  | 'ERROR';

export interface DataSourceStatus {
  source_type: DataSourceType;
  source_id: string;
  name: string;
  description: string;
  status: SourceConnectionStatus;
  is_active: boolean;
  is_available: boolean;
  station_id: string;
  provider?: string;
  last_received_at?: string;
  last_successful_fetch?: string;
  last_error_at?: string;
  error_message?: string;
  data_age_seconds?: number;
  is_stale: boolean;
  packet_count: number;
  polling_interval_seconds?: number;
  coordinates?: { latitude: number; longitude: number };
  metadata?: Record<string, any>;
}

export interface DataSourceListResponse {
  active_source: DataSourceType;
  active_source_id: string;
  sources: DataSourceStatus[];
  timestamp: string;
}

export interface Station {
  id: number;
  station_id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  status: string;
  health_score?: number;
  health_status?: string;
  created_at: string;
  updated_at: string;
}

export interface AnomalyEvent {
  id: number;
  observation_id?: number;
  station_id: string;
  timestamp: string;
  is_anomaly: boolean;
  anomaly_score: number;
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NORMAL';
  anomaly_type?: string;
  classification: string;
  is_fault: boolean;
  reason?: string;
  explanation?: ExplanationResult;
  tier_scores?: TierScores;
  recommended_action?: string;
  raw_values?: Record<string, any>;
  created_at: string;
}

export interface SensorHealthRecord {
  id?: number;
  station_id: string;
  timestamp: string;
  health_score: number;
  health_status: string;
  anomaly_rate: number;
  drift_score: number;
  data_quality_score: number;
  degradation_risk: string;
  estimated_hours_to_failure?: number | null;
  recommended_action?: string;
  created_at?: string;
}

export interface StationHealthDetail {
  station_id: string;
  current_health: number;
  health_status: string;
  degradation_risk: string;
  estimated_hours_to_failure?: number | null;
  recommended_action?: string;
  recent_history: SensorHealthRecord[];
}

export interface FleetHealthSummary {
  total_stations: number;
  active_stations: number;
  degraded_stations: number;
  critical_stations: number;
  offline_stations: number;
  average_health_score: number;
  status_distribution: Record<string, number>;
}

export interface AnomalyStats {
  period_hours: number;
  total_anomalies: number;
  by_severity: Record<string, number>;
  by_classification: Record<string, number>;
  sensor_faults: number;
  meteorological_extremes: number;
}

export interface SimulationStatus {
  running: boolean;
  interval_seconds: number;
  active_stations: string[];
  step_count: number;
  pending_injections_count: number;
  message?: string;
}

export interface SystemMetrics {
  total_observations_ingested: number;
  total_anomalies_detected: number;
  average_inference_latency_ms: number;
  p95_inference_latency_ms: number;
  database_size_bytes: number;
  uptime_seconds: number;
  active_websocket_clients: number;
  active_stations_count: number;
}
