import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Thermometer,
  Gauge,
  Droplets,
  Radio,
  Play,
  Square,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { InferenceResult, Station } from '../types';
import { fetchStations } from '../services/api';

interface LiveMonitoringViewProps {
  latestTelemetry: InferenceResult | null;
  historyBuffer: InferenceResult[];
  isStreaming: boolean;
  onToggleStreaming: () => void;
}

export function LiveMonitoringView({
  latestTelemetry,
  historyBuffer,
  isStreaming,
  onToggleStreaming,
}: LiveMonitoringViewProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('AWS-001');

  useEffect(() => {
    fetchStations().then((res) => {
      setStations(res.items);
      if (res.items.length > 0 && !selectedStation) {
        setSelectedStation(res.items[0].station_id);
      }
    });
  }, []);

  // Filter history buffer for currently selected station
  const stationHistory = historyBuffer
    .filter((item) => !selectedStation || item.station_id === selectedStation)
    .slice(-40);

  // Latest observation for this station
  const current =
    stationHistory.length > 0
      ? stationHistory[stationHistory.length - 1]
      : latestTelemetry?.station_id === selectedStation
      ? latestTelemetry
      : null;

  // Chart data formatting
  const chartData = stationHistory.map((item, idx) => {
    const timeStr = item.timestamp
      ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : `${idx}`;

    return {
      index: idx,
      time: timeStr,
      temp: item.temperature ?? item.raw_values?.temperature ?? 22.0,
      pressure: item.pressure ?? item.raw_values?.pressure ?? 1013.2,
      humidity: item.humidity ?? item.raw_values?.humidity ?? 55.0,
      isAnomaly: item.is_anomaly,
      anomalyScore: item.anomaly_score,
      severity: item.severity,
      classification: item.classification,
    };
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
        return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Station Selector & Streaming Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-xl shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Live Multi-Channel Atmospheric Telemetry</h2>
            <p className="text-xs text-slate-400">Real-time synchronized sensor stream with 5-tier anomaly boundary overlays</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Station Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Station:</span>
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

          {/* Pause / Resume Button */}
          <button
            onClick={onToggleStreaming}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isStreaming
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
            }`}
          >
            {isStreaming ? (
              <>
                <Square className="w-3 h-3 fill-current" /> Freeze View
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" /> Resume Live
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3 Core Atmospheric Readout Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Temperature Gauge */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-xl shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Temperature
            </span>
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <Thermometer className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">
              {current?.temperature !== undefined
                ? current.temperature.toFixed(2)
                : current?.raw_values?.temperature !== undefined
                ? current.raw_values.temperature.toFixed(2)
                : '--'}
            </span>
            <span className="text-sm font-semibold text-slate-400">°C</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
            <span>Range: -40°C to +60°C</span>
            <span className="text-sky-400">Diurnal Nominal</span>
          </div>
        </div>

        {/* Atmospheric Pressure Gauge */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-xl shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Atmospheric Pressure
            </span>
            <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">
              {current?.pressure !== undefined
                ? current.pressure.toFixed(1)
                : current?.raw_values?.pressure !== undefined
                ? current.raw_values.pressure.toFixed(1)
                : '--'}
            </span>
            <span className="text-sm font-semibold text-slate-400">hPa</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
            <span>Barometric S2(P) Tide</span>
            <span className="text-sky-400">Nominal</span>
          </div>
        </div>

        {/* Relative Humidity Gauge */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-xl shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Relative Humidity
            </span>
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">
              {current?.humidity !== undefined
                ? current.humidity.toFixed(1)
                : current?.raw_values?.humidity !== undefined
                ? current.raw_values.humidity.toFixed(1)
                : '--'}
            </span>
            <span className="text-sm font-semibold text-slate-400">%</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
            <span>Magnus-Tetens Dew Point</span>
            <span className="text-sky-400">Nominal</span>
          </div>
        </div>
      </div>

      {/* 5-Tier Pipeline Real-Time Decision Banner */}
      {current && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-lg border ${
                current.is_anomaly
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                  : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
              }`}
            >
              {current.is_anomaly ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-slate-400">Pipeline Verdict:</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold border ${getSeverityBadge(
                    current.severity || 'NORMAL'
                  )}`}
                >
                  {current.is_anomaly ? (current.severity || 'NORMAL') : 'NORMAL'}
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {(current.classification || 'NORMAL').replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {current.explanation?.summary || current.reason || 'All atmospheric channels operating within normal limits.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-slate-500 block text-[10px] uppercase">Anomaly Score</span>
              <span className="text-sm font-bold text-white">
                {((current.anomaly_score || 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px] uppercase">Confidence</span>
              <span className="text-sm font-bold text-sky-400">
                {((current.confidence || 0) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px] uppercase">Sensor Health</span>
              <span
                className={`text-sm font-bold ${
                  (current.sensor_health || 100) >= 80 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {Math.round(current.sensor_health || 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Series Real-Time Time-Series Charts */}
      <div className="space-y-4">
        {/* Chart 1: Temperature Stream */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Temperature (°C) Real-Time Curve
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Diurnal Cycle + AR(1)</span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', fontSize: '11px', borderRadius: '8px' }}
                  labelStyle={{ color: '#94A3B8' }}
                />
                <Area
                  type="monotone"
                  dataKey="temp"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#tempGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Pressure & Humidity Synchronized */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pressure Chart */}
          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Pressure (hPa)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Semi-Diurnal S2(P)</span>
            </div>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pressGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', fontSize: '11px', borderRadius: '8px' }}
                    labelStyle={{ color: '#94A3B8' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pressure"
                    stroke="#38BDF8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#pressGradient)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Humidity Chart */}
          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Relative Humidity (%)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Thermodynamic Inverse</span>
            </div>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="humGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818CF8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#818CF8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', fontSize: '11px', borderRadius: '8px' }}
                    labelStyle={{ color: '#94A3B8' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="humidity"
                    stroke="#818CF8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#humGradient)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
