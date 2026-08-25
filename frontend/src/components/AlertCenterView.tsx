import { useEffect, useState } from 'react';
import {
  Search,
  Download,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { fetchAnomalies, fetchAnomalyStats, fetchStations } from '../services/api';
import { AnomalyEvent, AnomalyStats, Station } from '../types';

export function AlertCenterView() {
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [stats, setStats] = useState<AnomalyStats | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [selectedClassification, setSelectedClassification] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeEvent, setActiveEvent] = useState<AnomalyEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const [anRes, stRes, stStats] = await Promise.all([
        fetchAnomalies({
          station_id: selectedStation || undefined,
          severity: selectedSeverity || undefined,
          classification: selectedClassification || undefined,
          limit: 100,
        }),
        fetchStations(),
        fetchAnomalyStats(24),
      ]);
      setAnomalies(anRes.items);
      setStations(stRes.items);
      setStats(stStats);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [selectedStation, selectedSeverity, selectedClassification]);

  const filtered = anomalies.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.station_id.toLowerCase().includes(q) ||
      a.classification.toLowerCase().includes(q) ||
      (a.reason && a.reason.toLowerCase().includes(q)) ||
      (a.explanation?.summary && a.explanation.summary.toLowerCase().includes(q))
    );
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toUpperCase()) {
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

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skyguard_alerts_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Alert Stats Header */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Total Flagged (24h)</span>
          <div className="mt-1 text-2xl font-bold font-mono text-white">{stats?.total_anomalies ?? 0}</div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] font-semibold uppercase text-rose-400">Critical / High Severity</span>
          <div className="mt-1 text-2xl font-bold font-mono text-rose-300">
            {(stats?.by_severity?.CRITICAL ?? 0) + (stats?.by_severity?.HIGH ?? 0)}
          </div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] font-semibold uppercase text-amber-400">Probable Sensor Faults</span>
          <div className="mt-1 text-2xl font-bold font-mono text-amber-300">{stats?.sensor_faults ?? 0}</div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] font-semibold uppercase text-sky-400">Meteorological Extremes</span>
          <div className="mt-1 text-2xl font-bold font-mono text-sky-300">{stats?.meteorological_extremes ?? 0}</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search station, fault type, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-sky-500 font-sans"
            />
          </div>

          {/* Station Filter */}
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500 font-mono"
          >
            <option value="">All Stations</option>
            {stations.map((s) => (
              <option key={s.station_id} value={s.station_id}>
                {s.station_id}
              </option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Classification Filter */}
          <select
            value={selectedClassification}
            onChange={(e) => setSelectedClassification(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500"
          >
            <option value="">All Classifications</option>
            <option value="SPIKE">Spike</option>
            <option value="DRIFT">Drift</option>
            <option value="FROZEN">Frozen Sensor</option>
            <option value="DROPOUT">Dropout</option>
            <option value="MULTIVARIATE_INCONSISTENCY">Multivariate Inconsistency</option>
            <option value="METEOROLOGICAL_EXTREME">Meteorological Extreme</option>
            <option value="DATA_CORRUPTION">Data Corruption</option>
          </select>
        </div>

        {/* Export Button */}
        <button
          onClick={exportJSON}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-all"
        >
          <Download className="w-3.5 h-3.5" /> Export Alerts JSON
        </button>
      </div>

      {/* Main Grid: Alerts Table + Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table View */}
        <div className={`bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-5 shadow-md ${activeEvent ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-sky-400" />
              Flagged Telemetry Incident Log ({filtered.length})
            </h3>
            <button
              onClick={loadAlerts}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium uppercase tracking-wider">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Station</th>
                  <th className="pb-3">Severity</th>
                  <th className="pb-3">Classification</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">Confidence</th>
                  <th className="pb-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                      {isLoading ? 'Loading incident records...' : 'No alert records match current filter criteria.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setActiveEvent(item)}
                      className={`cursor-pointer transition-colors ${
                        activeEvent?.id === item.id ? 'bg-sky-500/10' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 text-slate-300">
                        {new Date(item.timestamp).toLocaleString([], {
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3 font-bold text-sky-400">{item.station_id}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getSeverityBadge(item.severity || 'NORMAL')}`}>
                          {item.severity || 'NORMAL'}
                        </span>
                      </td>
                      <td className="py-3 font-sans font-medium text-slate-200">
                        {(item.classification || 'NORMAL').replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 text-white font-bold">{((item.anomaly_score || 0) * 100).toFixed(0)}%</td>
                      <td className="py-3 text-sky-300 font-bold">{((item.confidence || 0) * 100).toFixed(0)}%</td>
                      <td className="py-3 text-right">
                        <button className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Detail Inspection Drawer / Modal */}
        {activeEvent && (
          <div className="bg-slate-900/95 backdrop-blur border border-sky-500/40 rounded-xl p-5 shadow-2xl space-y-4 max-h-[800px] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded border text-xs font-bold ${getSeverityBadge(activeEvent.severity || 'NORMAL')}`}>
                  {activeEvent.severity || 'NORMAL'}
                </span>
                <span className="font-mono text-xs font-bold text-sky-400">{activeEvent.station_id}</span>
                {activeEvent.source_type && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {activeEvent.source_type}
                  </span>
                )}
              </div>
              <button
                onClick={() => setActiveEvent(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>

            {/* Classification & Confidence Header */}
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Classification & Decision</h4>
                <span className="text-xs font-mono font-bold text-sky-300">
                  Confidence: {((activeEvent.confidence || 0) * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-lg font-bold text-white mt-0.5">
                {(activeEvent.classification || 'NORMAL').replace(/_/g, ' ')}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                  activeEvent.is_fault
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {activeEvent.is_fault ? '⚠️ Probable Sensor/Data Fault' : '🌪️ Likely Genuine Meteorological Event'}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Score: <strong className="text-white">{((activeEvent.anomaly_score || 0) * 100).toFixed(1)}%</strong>
                </span>
              </div>
            </div>

            {/* Observed Channels */}
            {activeEvent.raw_values && (
              <div>
                <h5 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Observed Channel Telemetry
                </h5>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs text-center">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Temperature</span>
                    <span className="font-bold text-white text-sm">
                      {activeEvent.raw_values.temperature !== undefined ? `${Number(activeEvent.raw_values.temperature).toFixed(1)}°C` : '--'}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Pressure</span>
                    <span className="font-bold text-white text-sm">
                      {activeEvent.raw_values.pressure !== undefined ? `${Number(activeEvent.raw_values.pressure).toFixed(1)} hPa` : '--'}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Humidity</span>
                    <span className="font-bold text-white text-sm">
                      {activeEvent.raw_values.humidity !== undefined ? `${Number(activeEvent.raw_values.humidity).toFixed(1)}%` : '--'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TreeSHAP Feature Attributions Waterfall */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-sky-400" />
                  TreeSHAP Root-Cause Feature Attributions
                </h5>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  {activeEvent.explanation?.method || 'TreeExplainer'}
                </span>
              </div>

              {activeEvent.explanation?.contributing_features && activeEvent.explanation.contributing_features.length > 0 ? (
                <div className="space-y-2 font-mono text-xs">
                  {activeEvent.explanation.contributing_features.slice(0, 6).map((feat, idx) => {
                    const isPositive = feat.attribution >= 0;
                    const absVal = Math.abs(feat.attribution);
                    const pctWidth = Math.min(100, Math.max(8, absVal * 200));

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-300 font-medium truncate max-w-[180px]">
                            {feat.feature.replace(/_/g, ' ')}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className={`font-bold ${isPositive ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {isPositive ? `+${feat.attribution.toFixed(3)}` : feat.attribution.toFixed(3)}
                            </span>
                          </div>
                        </div>

                        {/* Relative Contribution Bar */}
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isPositive
                                ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                                : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                            }`}
                            style={{ width: `${pctWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic py-2">
                  No feature attribution data stored for this historical event.
                </div>
              )}

              {/* Rationale Summary */}
              <div className="mt-2 pt-2 border-t border-slate-900 text-xs">
                <p className="text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">Deterministic Rationale: </strong>
                  {activeEvent.explanation?.summary || activeEvent.reason || 'Multi-tier anomaly score exceeded operational threshold.'}
                </p>
              </div>
            </div>

            {/* Spatial Consensus / AWS Buddy-Check Card */}
            {activeEvent.spatial_consensus && (
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Tier 3.5 Spatial Consensus
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    activeEvent.spatial_consensus.status === 'SUPPORTED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : activeEvent.spatial_consensus.status === 'ISOLATED'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {activeEvent.spatial_consensus.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="text-slate-400">
                    Neighbors: <strong className="text-white">{activeEvent.spatial_consensus.neighbor_count}</strong> (Radius: {activeEvent.spatial_consensus.radius_km}km)
                  </div>
                  <div className="text-slate-400 text-right">
                    Agreement: <strong className="text-white">{((activeEvent.spatial_consensus.consensus_score || 0) * 100).toFixed(0)}%</strong>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  {activeEvent.spatial_consensus.message || (
                    activeEvent.spatial_consensus.regional_event_supported
                      ? 'Observation is supported by regional AWS station consensus.'
                      : 'Observation diverges from neighboring AWS stations (isolated sensor fault suspected).'
                  )}
                </p>
              </div>
            )}

            {/* Recommended Operator Action */}
            {activeEvent.recommended_action && (
              <div className="bg-amber-500/10 p-3.5 rounded-lg border border-amber-500/30 text-xs">
                <h5 className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  Recommended Operational Action
                </h5>
                <p className="text-amber-200/90">{activeEvent.recommended_action}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
