import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  ShieldCheck,
  TrendingDown,
  AlertOctagon,
  Wrench,
  Activity,
  CheckCircle,
} from 'lucide-react';
import { fetchFleetHealth, fetchStationHealth, fetchStations } from '../services/api';
import { FleetHealthSummary, Station, StationHealthDetail } from '../types';

export function SensorHealthView() {
  const [fleetHealth, setFleetHealth] = useState<FleetHealthSummary | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('AWS-001');
  const [stationHealth, setStationHealth] = useState<StationHealthDetail | null>(null);

  const loadData = async () => {
    try {
      const [fh, st] = await Promise.all([fetchFleetHealth(), fetchStations()]);
      setFleetHealth(fh);
      setStations(st.items);
      if (st.items.length > 0 && !selectedStationId) {
        setSelectedStationId(st.items[0].station_id);
      }
    } catch (err) {
      console.error('Failed to load sensor health overview:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedStationId) {
      fetchStationHealth(selectedStationId)
        .then((res) => setStationHealth(res))
        .catch((err) => console.error('Failed to load station health detail:', err));
    }
  }, [selectedStationId]);

  const chartData = stationHealth?.recent_history?.map((rec, idx) => ({
    step: idx,
    time: rec.timestamp
      ? new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : `${idx}`,
    health: rec.health_score,
    drift: rec.drift_score * 100,
    quality: rec.data_quality_score * 100,
  })) || [
    { step: 0, time: '10:00', health: 100, drift: 0, quality: 100 },
    { step: 1, time: '10:30', health: 98, drift: 2, quality: 100 },
    { step: 2, time: '11:00', health: 96, drift: 4, quality: 99 },
    { step: 3, time: '11:30', health: 94, drift: 5, quality: 98 },
  ];

  return (
    <div className="space-y-6">
      {/* Fleet Overview Health Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Average Fleet Health</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-3xl font-bold font-mono text-white">
            {fleetHealth ? Math.round(fleetHealth.average_health_score) : 98}%
          </div>
          <p className="mt-1 text-xs text-emerald-400 font-medium">Nominal Operating State</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Optimal Stations</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-3xl font-bold font-mono text-emerald-400">
            {fleetHealth?.active_stations ?? 4}
          </div>
          <p className="mt-1 text-xs text-slate-400">Health Index ≥ 85%</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Degraded Sensors</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-3xl font-bold font-mono text-amber-400">
            {fleetHealth?.degraded_stations ?? 0}
          </div>
          <p className="mt-1 text-xs text-slate-400">Health Index 50–74%</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Critical / Failing</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-3xl font-bold font-mono text-rose-400">
            {fleetHealth?.critical_stations ?? 0}
          </div>
          <p className="mt-1 text-xs text-slate-400">Immediate inspection required</p>
        </div>
      </div>

      {/* Station Specific Health Analysis & Predictive Maintenance */}
      <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              Sensor Degradation & Health Tracking
            </h3>
            <p className="text-xs text-slate-400">
              Exponential Moving Average (EMA-α=0.10) drift and physical failure forecasting
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Select Station:</span>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 font-mono"
            >
              {stations.map((st) => (
                <option key={st.station_id} value={st.station_id}>
                  {st.station_id} — {st.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Health Index Card */}
          <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Current Sensor Health Index
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-bold font-mono text-white">
                  {stationHealth ? Math.round(stationHealth.current_health) : 98}
                </span>
                <span className="text-sm font-semibold text-slate-400">/ 100</span>
              </div>

              <div className="mt-4">
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 h-full transition-all"
                    style={{
                      width: `${stationHealth ? stationHealth.current_health : 98}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Health State:</span>
                  <span className="font-bold text-emerald-400">
                    {stationHealth?.health_status || 'EXCELLENT'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Degradation Risk:</span>
                  <span className="font-bold text-sky-400">
                    {stationHealth?.degradation_risk || 'STABLE'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Estimated Time to Failure:</span>
                  <span className="font-mono text-slate-400">
                    {stationHealth?.estimated_hours_to_failure
                      ? `${stationHealth.estimated_hours_to_failure.toFixed(0)} hours`
                      : '> 500 hours (Nominal)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Maintenance Action Recommendation */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              <div className="flex items-start gap-2 bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs">
                <Wrench className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200 block">Operator Recommendation</span>
                  <p className="text-slate-400 mt-0.5">
                    {stationHealth?.recommended_action || 'Continue normal operation. Sensors responding within calibrated tolerances.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Health Trend Chart */}
          <div className="lg:col-span-2 p-5 bg-slate-950/80 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Health & Drift Time-Series Trend
              </h4>
              <div className="flex items-center gap-4 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-slate-300">Health Index</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-slate-300">Drift Score %</span>
                </div>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', fontSize: '11px', borderRadius: '8px' }}
                    labelStyle={{ color: '#94A3B8' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="health"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="drift"
                    stroke="#F59E0B"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
