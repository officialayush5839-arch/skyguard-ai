import { useEffect, useState } from 'react';
import {
  Database,
  Upload,
  Download,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { fetchObservations, fetchStations, uploadCSV } from '../services/api';
import { Observation, Station, InferenceResult } from '../types';

export function DataExplorerView() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<boolean>(false);
  const [uploadSummary, setUploadSummary] = useState<{
    total_records: number;
    valid_records: number;
    anomalies_detected: number;
    processing_time_ms: number;
    results: InferenceResult[];
  } | null>(null);

  const loadObservations = async () => {
    setIsLoading(true);
    try {
      const [obsRes, stRes] = await Promise.all([
        fetchObservations({
          station_id: selectedStation || undefined,
          limit: 50,
          page: page,
        }),
        fetchStations(),
      ]);
      setObservations(obsRes.items);
      setTotalCount(obsRes.total);
      setStations(stRes.items);
    } catch (err) {
      console.error('Failed to load observations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadObservations();
  }, [selectedStation, page]);

  const handleFileUpload = async () => {
    if (!uploadFile) return;
    setUploadProgress(true);
    try {
      const result = await uploadCSV(uploadFile);
      setUploadSummary(result);
      loadObservations();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploadProgress(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent =
      'timestamp,station_id,temperature,pressure,humidity\n' +
      '2026-08-24T12:00:00Z,AWS-001,24.5,1012.3,62.1\n' +
      '2026-08-24T12:05:00Z,AWS-001,24.8,1012.1,61.8\n' +
      '2026-08-24T12:10:00Z,AWS-001,58.2,1012.0,61.5\n' + // Thermal spike
      '2026-08-24T12:15:00Z,AWS-001,25.1,1011.8,60.9\n' +
      '2026-08-24T12:20:00Z,AWS-001,25.4,1011.6,60.5\n';

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skyguard_sample_aws_telemetry.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Upload & Ingestion Section */}
      <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-sky-400" />
              Batch Telemetry Dataset Ingestion & Validation
            </h3>
            <p className="text-xs text-slate-400">
              Upload historical AWS CSV data (timestamp, temperature, pressure, humidity) for 5-tier batch inference
            </p>
          </div>

          <button
            onClick={downloadSampleCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Download Sample CSV
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
            className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-500/10 file:text-sky-400 hover:file:bg-sky-500/20 cursor-pointer"
          />

          <button
            onClick={handleFileUpload}
            disabled={!uploadFile || uploadProgress}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-bold text-xs rounded-lg transition-all"
          >
            {uploadProgress ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing Dataset...
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5" /> Run 5-Tier ML Batch Inference
              </>
            )}
          </button>
        </div>

        {uploadSummary && (
          <div className="mt-4 p-4 bg-slate-950 border border-emerald-500/30 rounded-lg text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">TOTAL RECORDS</span>
              <span className="text-sm font-bold text-white">{uploadSummary.total_records}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">VALID QC PASS</span>
              <span className="text-sm font-bold text-emerald-400">{uploadSummary.valid_records}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ANOMALIES FLAGGED</span>
              <span className="text-sm font-bold text-rose-400">{uploadSummary.anomalies_detected}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">PROCESSING TIME</span>
              <span className="text-sm font-bold text-sky-400">{uploadSummary.processing_time_ms.toFixed(1)} ms</span>
            </div>
          </div>
        )}
      </div>

      {/* Historical Telemetry Table */}
      <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-400" />
              Persisted Telemetry Store ({totalCount.toLocaleString()} Observations)
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedStation}
              onChange={(e) => {
                setSelectedStation(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 font-mono"
            >
              <option value="">All Weather Stations</option>
              {stations.map((s) => (
                <option key={s.station_id} value={s.station_id}>
                  {s.station_id}
                </option>
              ))}
            </select>

            <button
              onClick={loadObservations}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-sans font-semibold uppercase tracking-wider">
                <th className="pb-3">ID</th>
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Station</th>
                <th className="pb-3">Temperature (°C)</th>
                <th className="pb-3">Pressure (hPa)</th>
                <th className="pb-3">Humidity (%)</th>
                <th className="pb-3 text-right">QC Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {observations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                    {isLoading ? 'Loading historical observations...' : 'No telemetry records found.'}
                  </td>
                </tr>
              ) : (
                observations.map((obs) => (
                  <tr key={obs.id || Math.random()} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 text-slate-500">#{obs.id}</td>
                    <td className="py-2.5 text-slate-300">
                      {new Date(obs.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-sky-400 font-bold">{obs.station_id}</td>
                    <td className="py-2.5 text-white font-bold">
                      {obs.temperature !== undefined ? obs.temperature.toFixed(2) : '--'}
                    </td>
                    <td className="py-2.5 text-slate-200">
                      {obs.pressure !== undefined ? obs.pressure.toFixed(1) : '--'}
                    </td>
                    <td className="py-2.5 text-slate-200">
                      {obs.humidity !== undefined ? obs.humidity.toFixed(1) : '--'}
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-sans">
                        {obs.validation_status || 'VALID'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-sans">
          <span>Showing page {page} of {Math.max(1, Math.ceil(totalCount / 50))}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded text-xs text-slate-200"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(totalCount / 50)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded text-xs text-slate-200"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
