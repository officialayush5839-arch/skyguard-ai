import { useState, useEffect } from 'react';
import {
  Zap,
  Flame,
  TrendingUp,
  Snowflake,
  RadioTower,
  Activity,
  CloudLightning,
  AlertOctagon,
  Play,
  Info,
} from 'lucide-react';
import { injectAnomaly, fetchStations } from '../services/api';
import { Station } from '../types';

interface AnomalyInjectorUIProps {
  onNavigateToLive: () => void;
}

export function AnomalyInjectorUI({ onNavigateToLive }: AnomalyInjectorUIProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('AWS-001');
  const [selectedParameter, setSelectedParameter] = useState<string>('temperature');
  const [customType, setCustomType] = useState<string>('SPIKE');
  const [customMagnitude, setCustomMagnitude] = useState<number>(25.0);
  const [customDuration, setCustomDuration] = useState<number>(5);
  const [customDecay] = useState<boolean>(true);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [isInjecting, setIsInjecting] = useState<boolean>(false);

  useEffect(() => {
    fetchStations().then((res) => {
      setStations(res.items);
      if (res.items.length > 0 && !selectedStation) {
        setSelectedStation(res.items[0].station_id);
      }
    });
  }, []);

  const triggerInjection = async (
    anomalyType: string,
    param: string = 'temperature',
    mag: number = 25.0,
    dur: number = 5,
    decay: boolean = false
  ) => {
    setIsInjecting(true);
    try {
      await injectAnomaly({
        anomaly_type: anomalyType,
        station_id: selectedStation || undefined,
        parameter: param,
        magnitude: mag,
        duration_steps: dur,
        decay: decay,
      });
      setLastMessage(`✅ Injected ${anomalyType} on ${selectedStation || 'all stations'} (${param}, mag: ${mag})`);
    } catch (err: any) {
      setLastMessage(`❌ Failed to inject: ${err.message}`);
    } finally {
      setIsInjecting(false);
    }
  };

  const presets = [
    {
      id: 'SPIKE',
      title: 'Sudden Thermal Spike',
      icon: Flame,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      description: 'Rapid transient temperature surge (+25°C) to test Tier 1 rate-of-change and Tier 2 point anomaly response.',
      action: () => triggerInjection('SPIKE', 'temperature', 25.0, 3, true),
    },
    {
      id: 'DRIFT',
      title: 'Calibration Drift',
      icon: TrendingUp,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      description: 'Gradual linear deviation (+0.25°C/step) testing sensor health EMA degradation and slow anomaly detection.',
      action: () => triggerInjection('DRIFT', 'temperature', 10.0, 20, false),
    },
    {
      id: 'FROZEN',
      title: 'Frozen / Stuck Sensor',
      icon: Snowflake,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      description: 'Zero variance constant value across consecutive timestamps to test persistence and frozen value quality checks.',
      action: () => triggerInjection('FROZEN', 'temperature', 0.0, 15, false),
    },
    {
      id: 'DROPOUT',
      title: 'Sensor Channel Dropout',
      icon: RadioTower,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      description: 'Sudden drop to near-zero or impossible baseline to test dropout and boundary violation rules.',
      action: () => triggerInjection('DROPOUT', 'humidity', -50.0, 5, false),
    },
    {
      id: 'MULTIVARIATE_INCONSISTENCY',
      title: 'Thermodynamic Inconsistency',
      icon: AlertOctagon,
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
      description: 'Simultaneous high temperature (+38°C) and 99% RH violating Clausius-Clapeyron thermodynamic consistency.',
      action: () => triggerInjection('MULTIVARIATE_INCONSISTENCY', 'humidity', 50.0, 8, false),
    },
    {
      id: 'METEOROLOGICAL_EXTREME',
      title: 'Genuine Severe Storm Front',
      icon: CloudLightning,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      description: 'Deep barometric pressure plunge (-22 hPa) with correlated wind and humidity, classified as METEOROLOGICAL_EXTREME rather than fault.',
      action: () => triggerInjection('METEOROLOGICAL_EXTREME', 'pressure', -22.0, 10, false),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Interactive Real-Time Anomaly & Fault Injector</h2>
            <p className="text-xs text-slate-400">
              Programmatically inject atmospheric disturbances and sensor hardware failures into the live simulation stream
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Target Station:</span>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 font-mono"
            >
              {stations.map((st) => (
                <option key={st.station_id} value={st.station_id}>
                  {st.station_id} — {st.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onNavigateToLive}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-md"
          >
            <Activity className="w-3.5 h-3.5" /> Watch Live Response →
          </button>
        </div>
      </div>

      {/* Status Message Notification */}
      {lastMessage && (
        <div className="p-3.5 bg-slate-950 border border-sky-500/40 rounded-xl text-xs flex items-center justify-between">
          <span className="font-mono text-slate-200">{lastMessage}</span>
          <button
            onClick={() => setLastMessage(null)}
            className="text-slate-500 hover:text-slate-300 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Preset Anomaly Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets.map((preset) => {
          const Icon = preset.icon;
          return (
            <div
              key={preset.id}
              className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-xl shadow-md hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg border ${preset.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">
                    {preset.id}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{preset.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{preset.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={preset.action}
                  disabled={isInjecting}
                  className="w-full py-2 bg-slate-800 hover:bg-sky-600/30 hover:border-sky-500/50 text-slate-200 hover:text-sky-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <Play className="w-3 h-3 fill-current" /> Inject {preset.title}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Anomaly Builder Form */}
      <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-5 shadow-md">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-sky-400" />
          Custom Parametric Disturbance Generator
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <label className="text-slate-400 block mb-1.5 font-sans">Anomaly Type</label>
            <select
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg p-2.5"
            >
              <option value="SPIKE">Spike (Transient)</option>
              <option value="DRIFT">Linear Drift (Ramp)</option>
              <option value="FROZEN">Frozen Sensor (Stuck)</option>
              <option value="DROPOUT">Dropout (Zero/Null)</option>
              <option value="NOISE_BURST">Noise Burst (Turbulence)</option>
              <option value="MULTIVARIATE_INCONSISTENCY">Multivariate Inconsistency</option>
              <option value="METEOROLOGICAL_EXTREME">Meteorological Extreme</option>
              <option value="DATA_CORRUPTION">Data Corruption</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1.5 font-sans">Channel</label>
            <select
              value={selectedParameter}
              onChange={(e) => setSelectedParameter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg p-2.5"
            >
              <option value="temperature">Temperature (°C)</option>
              <option value="pressure">Pressure (hPa)</option>
              <option value="humidity">Relative Humidity (%)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1.5 font-sans">Magnitude</label>
            <input
              type="number"
              value={customMagnitude}
              onChange={(e) => setCustomMagnitude(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1.5 font-sans">Duration (Steps)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={customDuration}
              onChange={(e) => setCustomDuration(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg p-2.5"
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-sky-400" />
            <span>Injections take effect on the next simulation step broadcast over WebSocket `/ws/live`.</span>
          </div>

          <button
            onClick={() => triggerInjection(customType, selectedParameter, customMagnitude, customDuration, customDecay)}
            disabled={isInjecting}
            className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md"
          >
            Dispatch Custom Anomaly
          </button>
        </div>
      </div>
    </div>
  );
}
