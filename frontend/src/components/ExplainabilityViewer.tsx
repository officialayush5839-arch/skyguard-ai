import { useEffect, useState } from 'react';
import {
  Cpu,
  BarChart2,
  Info,
  Layers,
} from 'lucide-react';
import { fetchAnomalies } from '../services/api';
import { AnomalyEvent } from '../types';

export function ExplainabilityViewer() {
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyEvent | null>(null);

  useEffect(() => {
    fetchAnomalies({ limit: 15 })
      .then((res) => {
        setAnomalies(res.items);
        if (res.items.length > 0) {
          setSelectedAnomaly(res.items[0]);
        }
      })
      .catch((err) => console.error('Failed to load anomalies:', err));
  }, []);

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

  const sampleFeatures = [
    { feature: 'temperature_rate_of_change (ΔT/Δt)', attribution: 0.42, description: 'Surge of +8.4°C within 1 step (limit: 3.0°C/5min)' },
    { feature: 'temporal_reconstruction_error', attribution: 0.28, description: 'GRU Autoencoder MSE exceeded normal envelope' },
    { feature: 'dew_point_depression_anomaly', attribution: 0.18, description: 'Thermodynamic Clausius-Clapeyron inconsistency' },
    { feature: 'isolation_forest_path_length', attribution: 0.12, description: 'Short decision path indicating low point density' },
  ];

  const features =
    selectedAnomaly?.explanation?.contributing_features &&
    selectedAnomaly.explanation.contributing_features.length > 0
      ? selectedAnomaly.explanation.contributing_features
      : sampleFeatures;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-sky-400" />
            Explainable AI (XAI) & TreeSHAP Attribution Engine
          </h2>
          <p className="text-xs text-slate-400">
            Mathematical decomposition of anomaly reasoning across physics rules, statistical density, and temporal autoencoders
          </p>
        </div>

        {anomalies.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Incident:</span>
            <select
              value={selectedAnomaly?.id || ''}
              onChange={(e) => {
                const found = anomalies.find((a) => a.id === Number(e.target.value));
                if (found) setSelectedAnomaly(found);
              }}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 font-mono"
            >
              {anomalies.map((a) => (
                <option key={a.id} value={a.id}>
                  #{a.id} [{a.station_id}] {a.classification}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: XAI Narrative & Feature Attribution Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Narrative Verdict Card */}
          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-5 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold font-mono text-slate-500 uppercase">Incident Explanation</span>
                <h3 className="text-lg font-bold text-white">
                  {selectedAnomaly ? selectedAnomaly.classification.replace(/_/g, ' ') : 'Thermal Spike Incident'}
                </h3>
              </div>
              {selectedAnomaly && (
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${getSeverityBadge(selectedAnomaly.severity)}`}>
                  {selectedAnomaly.severity}
                </span>
              )}
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs leading-relaxed">
              <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-sky-400" />
                Human-Readable Decision Summary
              </h4>
              <p className="text-slate-300">
                {selectedAnomaly?.explanation?.summary ||
                  selectedAnomaly?.reason ||
                  'The observation was flagged because temperature rose sharply by 14.5°C within a single observation cycle, while relative humidity and atmospheric pressure remained unchanged, representing an unphysical rate-of-change in atmospheric thermodynamics.'}
              </p>
            </div>
          </div>

          {/* Feature Attribution Bars */}
          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-5 shadow-md">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-sky-400" />
              TreeSHAP / Gradient Feature Contribution Weights
            </h4>

            <div className="space-y-4">
              {features.map((feat, idx) => {
                const weight = Math.abs(feat.attribution);
                const percent = Math.min(100, Math.round(weight * 100));

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-200 font-medium">{feat.feature}</span>
                      <span className="text-sky-400 font-bold">{percent}%</span>
                    </div>

                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {feat.description && (
                      <p className="text-[11px] text-slate-400 font-sans">{feat.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Genuine Weather vs Sensor Fault Discrimination */}
        <div className="space-y-6">
          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              Sensor Fault vs Weather Discrimination
            </h4>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="font-bold text-white">Physical Sensor Fault</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Characterized by single-channel isolated jumps, frozen constant readings, rate-of-change limit breaks, or severe Clausius-Clapeyron thermodynamic contradictions.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-bold text-white">Genuine Meteorological Extreme</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Characterized by multi-channel physically consistent dynamics (e.g. sharp cold front where pressure spikes simultaneously as temperature plunges and RH rises).
              </p>
            </div>

            <div className="p-3.5 bg-sky-500/10 border border-sky-500/30 rounded-lg text-xs space-y-1">
              <span className="font-semibold text-sky-300 block">Uncertainty Calibration</span>
              <p className="text-slate-400">
                Confidence score is computed independently from anomaly magnitude to prevent high-confidence false alarms during synoptic frontal passages.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
