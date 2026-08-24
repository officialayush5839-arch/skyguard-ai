import { useEffect, useState } from 'react';
import {
  Cpu,
  Layers,
  CheckCircle2,
  Info,
  Thermometer,
  Gauge,
  Droplets,
  Activity,
} from 'lucide-react';
import { fetchAnomalies } from '../services/api';
import { AnomalyEvent } from '../types';

export function EventDetailView() {
  const [events, setEvents] = useState<AnomalyEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  useEffect(() => {
    fetchAnomalies({ limit: 20 })
      .then((res) => {
        setEvents(res.items);
        if (res.items.length > 0) {
          setSelectedEventId(res.items[0].id);
        }
      })
      .catch((err) => console.error('Failed to load events:', err));
  }, []);

  const current = events.find((e) => e.id === selectedEventId) || events[0];

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-sky-400" />
            Forensic Anomaly Incident Detail & Root Cause Inspection
          </h2>
          <p className="text-xs text-slate-400">
            Multi-tier signal decomposition, TreeSHAP feature attributions, and thermodynamic validation
          </p>
        </div>

        {events.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Select Event:</span>
            <select
              value={selectedEventId || ''}
              onChange={(e) => setSelectedEventId(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 font-mono"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  #{ev.id} [{ev.station_id}] {ev.classification} ({(ev.anomaly_score * 100).toFixed(0)}%)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!current ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
          <Activity className="w-8 h-8 mx-auto mb-2 text-slate-600" />
          No anomaly events recorded yet.
          <p className="text-xs text-slate-600 mt-1">
            Inject a test anomaly from the Anomaly Injector tab to inspect multi-tier forensic breakdown.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Comprehensive Forensic Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Verdict Card */}
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-5 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${getSeverityBadge(current.severity)}`}>
                      {current.severity} SEVERITY
                    </span>
                    <span className="font-mono text-xs font-bold text-sky-400">{current.station_id}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1">
                    {current.classification.replace(/_/g, ' ')}
                  </h3>
                </div>

                <div className="text-right font-mono text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase">Recorded At</span>
                  <span className="text-slate-200">
                    {new Date(current.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Observed Channels */}
              <div className="grid grid-cols-3 gap-3 font-mono text-center">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mb-1">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" /> Temperature
                  </div>
                  <span className="text-base font-bold text-white">
                    {current.raw_values?.temperature !== undefined ? `${current.raw_values.temperature.toFixed(2)}°C` : '--'}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mb-1">
                    <Gauge className="w-3.5 h-3.5 text-sky-400" /> Pressure
                  </div>
                  <span className="text-base font-bold text-white">
                    {current.raw_values?.pressure !== undefined ? `${current.raw_values.pressure.toFixed(1)} hPa` : '--'}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mb-1">
                    <Droplets className="w-3.5 h-3.5 text-indigo-400" /> Humidity
                  </div>
                  <span className="text-base font-bold text-white">
                    {current.raw_values?.humidity !== undefined ? `${current.raw_values.humidity.toFixed(1)}%` : '--'}
                  </span>
                </div>
              </div>
            </div>

            {/* 5-Tier Score Attribution Breakdown */}
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-5 shadow-md">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                Multi-Tier Algorithmic Decomposition
              </h4>

              <div className="space-y-3 font-mono text-xs">
                {/* Tier 1 */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-sans font-semibold text-slate-200 block">Tier 1: Deterministic Physics Quality Control</span>
                    <span className="text-[11px] text-slate-500 font-sans">Physical range limits & rate-of-change boundaries</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    current.tier_scores?.tier1_qc_flag
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {current.tier_scores?.tier1_qc_flag ? 'VIOLATION' : 'PASSED'}
                  </span>
                </div>

                {/* Tier 2 Point */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-sans font-semibold text-slate-200 block">Tier 2A: Isolation Forest Point Outlier Detector</span>
                    <span className="text-[11px] text-slate-500 font-sans">Spatial density & multivariate distribution anomaly</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-sky-400">
                      {current.tier_scores?.tier2_point_score !== undefined
                        ? (current.tier_scores.tier2_point_score * 100).toFixed(1)
                        : '--'}%
                    </span>
                  </div>
                </div>

                {/* Tier 2 Temporal */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-sans font-semibold text-slate-200 block">Tier 2B: PyTorch GRU Temporal Autoencoder</span>
                    <span className="text-[11px] text-slate-500 font-sans">30-step sliding sequence reconstruction error</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-indigo-400">
                      {current.tier_scores?.tier2_temporal_score !== undefined
                        ? (current.tier_scores.tier2_temporal_score * 100).toFixed(1)
                        : '--'}%
                    </span>
                  </div>
                </div>

                {/* Tier 3 Multivariate */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-sans font-semibold text-slate-200 block">Tier 3: Thermodynamic & Mahalanobis Consistency</span>
                    <span className="text-[11px] text-slate-500 font-sans">Clausius-Clapeyron saturation vapor relation</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-amber-400">
                      {current.tier_scores?.tier3_multivariate_score !== undefined
                        ? (current.tier_scores.tier3_multivariate_score * 100).toFixed(1)
                        : '--'}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Explainability & Action Guidance */}
          <div className="space-y-6">
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-400" />
                Root Cause Synthesis
              </h4>

              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {current.explanation?.summary || current.reason || 'Multi-tier anomaly fusion generated high anomaly probability.'}
              </div>

              {/* Recommended Action */}
              <div className="bg-amber-500/10 p-3.5 rounded-lg border border-amber-500/30 text-xs">
                <div className="flex items-center gap-1.5 text-amber-300 font-semibold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  Recommended Action
                </div>
                <p className="text-amber-200/90 leading-relaxed">
                  {current.recommended_action || 'Inspect and calibrate target sensor channel.'}
                </p>
              </div>

              {/* Contributing Features */}
              {current.explanation?.contributing_features && current.explanation.contributing_features.length > 0 && (
                <div>
                  <h5 className="text-[11px] font-semibold uppercase text-slate-400 mb-2">
                    Key Contributing Factors (TreeSHAP)
                  </h5>
                  <div className="space-y-2">
                    {current.explanation.contributing_features.map((feat, i) => (
                      <div key={i} className="bg-slate-950 p-2 rounded border border-slate-800 text-xs">
                        <div className="flex justify-between font-mono">
                          <span className="text-slate-300">{feat.feature}</span>
                          <span className="text-sky-400 font-bold">{(feat.attribution * 100).toFixed(0)}%</span>
                        </div>
                        {feat.description && (
                          <p className="text-[10px] text-slate-500 mt-0.5">{feat.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
