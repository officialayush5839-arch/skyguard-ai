import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Radio,
  Play,
  Square,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import {
  fetchStations,
  fetchFleetHealth,
  fetchAnomalyStats,
  fetchAnomalies,
  fetchMetrics,
  getSimulationStatus,
  startSimulation,
  stopSimulation,
} from '../services/api';
import {
  Station,
  FleetHealthSummary,
  AnomalyStats,
  AnomalyEvent,
  SystemMetrics,
  SimulationStatus,
  InferenceResult,
} from '../types';

interface OverviewViewProps {
  latestTelemetry: InferenceResult | null;
  onNavigate: (tab: string) => void;
}

export function OverviewView({ onNavigate }: OverviewViewProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [fleetHealth, setFleetHealth] = useState<FleetHealthSummary | null>(null);
  const [anomalyStats, setAnomalyStats] = useState<AnomalyStats | null>(null);
  const [recentAnomalies, setRecentAnomalies] = useState<AnomalyEvent[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [simStatus, setSimStatus] = useState<SimulationStatus | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  const loadData = async () => {
    try {
      const [stRes, fhRes, asRes, anRes, mtRes, smRes] = await Promise.all([
        fetchStations().catch(() => ({ items: [], total: 0 })),
        fetchFleetHealth().catch(() => null),
        fetchAnomalyStats(24).catch(() => null),
        fetchAnomalies({ limit: 6 }).catch(() => ({ items: [], total: 0 })),
        fetchMetrics().catch(() => null),
        getSimulationStatus().catch(() => null),
      ]);

      setStations(stRes.items);
      setFleetHealth(fhRes);
      setAnomalyStats(asRes);
      setRecentAnomalies(anRes.items);
      setMetrics(mtRes);
      setSimStatus(smRes);
    } catch (err) {
      console.error('Error loading overview data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSimulation = async () => {
    setSimLoading(true);
    try {
      if (simStatus?.running) {
        const res = await stopSimulation();
        setSimStatus(res);
      } else {
        const res = await startSimulation({ interval_seconds: 1.5 });
        setSimStatus(res);
      }
    } catch (err) {
      console.error('Failed to toggle simulation:', err);
    } finally {
      setSimLoading(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 70) return 'text-sky-400 border-sky-500/30 bg-sky-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-500/20 border-rose-500/50 text-rose-300';
      case 'HIGH':
        return 'bg-orange-500/20 border-orange-500/50 text-orange-300';
      case 'MEDIUM':
        return 'bg-amber-500/20 border-amber-500/50 text-amber-300';
      case 'LOW':
        return 'bg-sky-500/20 border-sky-500/50 text-sky-300';
      default:
        return 'bg-slate-500/20 border-slate-500/50 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Simulation Engine Control */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-500/15 border border-sky-500/30 rounded-xl text-sky-400">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Real-Time AWS Telemetry & Anomaly Processing Hub
            </h2>
            <p className="text-xs text-slate-400">
              5-Tier ML fusion (Physics QC • Isolation Forest • PyTorch GRU Autoencoder • Clausius-Clapeyron • TreeSHAP)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 px-3.5 py-2 rounded-lg text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                simStatus?.running ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            <span className="font-mono text-slate-300">
              {simStatus?.running ? 'LIVE STREAMING (1.5s)' : 'STREAM PAUSED'}
            </span>
          </div>

          <button
            onClick={handleToggleSimulation}
            disabled={simLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all shadow-md ${
              simStatus?.running
                ? 'bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300'
            }`}
          >
            {simStatus?.running ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" /> Pause Generator
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Start Stream
              </>
            )}
          </button>

          <button
            onClick={() => onNavigate('injector')}
            className="flex items-center gap-2 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 px-4 py-2 rounded-lg font-medium text-xs transition-all"
          >
            <Zap className="w-3.5 h-3.5" /> Inject Fault
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Fleet Average Health */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-xl shadow-md hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Fleet Health Index
            </span>
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">
              {fleetHealth ? Math.round(fleetHealth.average_health_score) : 98}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
            <span>{fleetHealth?.active_stations || 4} Stations Active</span>
            <span className="text-emerald-400 font-medium">Optimal</span>
          </div>
        </div>

        {/* Card 2: 24h Anomaly Total */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-xl shadow-md hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              24h Flagged Events
            </span>
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">
              {anomalyStats?.total_anomalies ?? 0}
            </span>
            <span className="text-xs text-slate-400">events</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
            <span>{anomalyStats?.sensor_faults ?? 0} Faults</span>
            <span>{anomalyStats?.meteorological_extremes ?? 0} Met Extremes</span>
          </div>
        </div>

        {/* Card 3: Inference Latency */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-xl shadow-md hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pipeline Latency
            </span>
            <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-sky-400">
              {metrics ? metrics.average_inference_latency_ms.toFixed(1) : '< 2.0'}
            </span>
            <span className="text-xs text-slate-400">ms / step</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
            <span>P95: {metrics ? metrics.p95_inference_latency_ms.toFixed(1) : '3.5'} ms</span>
            <span className="text-emerald-400">Sub-500ms target</span>
          </div>
        </div>

        {/* Card 4: Total Ingested */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-xl shadow-md hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Observations
            </span>
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">
              {metrics?.total_observations_ingested ? metrics.total_observations_ingested.toLocaleString() : '1,200+'}
            </span>
            <span className="text-xs text-slate-400">stored</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
            <span>SQLite WAL</span>
            <span className="text-slate-300">Continuous Ingest</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Stations List & Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: AWS Stations Status Table */}
        <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-400" />
                  Active Weather Stations
                </h3>
                <p className="text-xs text-slate-400">Real-time health, coordinates and latest telemetry</p>
              </div>
              <button
                onClick={() => onNavigate('live')}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors"
              >
                View Live Charts →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium uppercase tracking-wider">
                    <th className="pb-3">Station ID</th>
                    <th className="pb-3">Location / Region</th>
                    <th className="pb-3">Elevation</th>
                    <th className="pb-3">Health Score</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        Loading station registry...
                      </td>
                    </tr>
                  ) : (
                    stations.map((st) => {
                      const health = st.health_score ?? 100;
                      return (
                        <tr key={st.station_id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 font-mono font-bold text-sky-400">
                            {st.station_id}
                          </td>
                          <td className="py-3.5 text-slate-200">{st.name}</td>
                          <td className="py-3.5 font-mono text-slate-400">{st.elevation} m</td>
                          <td className="py-3.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded border text-xs font-mono font-semibold ${getHealthColor(
                                  health
                                )}`}
                              >
                                {Math.round(health)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              {st.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => onNavigate('live')}
                              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded transition-colors"
                            >
                              Monitor
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Core Sensors: Temperature (°C) • Pressure (hPa) • Relative Humidity (%)</span>
            <button
              onClick={() => onNavigate('health')}
              className="text-sky-400 hover:underline font-medium"
            >
              Detailed Health Analytics →
            </button>
          </div>
        </div>

        {/* Right Col: Latest Ingested Anomaly Stream */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Recent Alerts
              </h3>
              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium"
              >
                Alert Center ({anomalyStats?.total_anomalies ?? 0}) →
              </button>
            </div>

            <div className="space-y-3">
              {recentAnomalies.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-500/60" />
                  No active anomalies detected.
                  <p className="mt-1 text-slate-600">All atmospheric channels operating within nominal physical bounds.</p>
                </div>
              ) : (
                recentAnomalies.slice(0, 5).map((an) => (
                  <div
                    key={an.id}
                    className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg hover:border-slate-700 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-bold text-sky-400">{an.station_id}</span>
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getSeverityBadge(
                          an.severity || 'NORMAL'
                        )}`}
                      >
                        {an.severity || 'NORMAL'}
                      </span>
                    </div>
                    <div className="text-slate-300 font-medium flex items-center justify-between">
                      <span>{(an.classification || 'NORMAL').replace(/_/g, ' ')}</span>
                      <span className="font-mono text-slate-400">
                        Score: {(an.anomaly_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    {an.explanation?.summary && (
                      <p className="text-slate-400 text-[11px] mt-1 line-clamp-2">
                        {an.explanation.summary}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <button
              onClick={() => onNavigate('injector')}
              className="w-full py-2 bg-gradient-to-r from-sky-600/20 to-indigo-600/20 hover:from-sky-600/30 hover:to-indigo-600/30 border border-sky-500/30 text-sky-300 rounded-lg text-xs font-semibold transition-all"
            >
              Test Anomaly Detection (Inject Event)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
