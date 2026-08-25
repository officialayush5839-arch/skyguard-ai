/**
 * frontend/src/components/DataSourceControl.tsx
 * SkyGuard AI — Three-Source Interchangeable Telemetry Controller & Provenance Widget.
 */

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Radio,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { DataSourceListResponse, DataSourceStatus, DataSourceType } from '../types';
import { fetchDataSources, selectDataSource, fetchExternalWeatherPreview } from '../services/api';

interface DataSourceControlProps {
  onSourceChanged?: (source: DataSourceStatus) => void;
}

export const DataSourceControl: React.FC<DataSourceControlProps> = ({ onSourceChanged }) => {
  const [sourcesData, setSourcesData] = useState<DataSourceListResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [switching, setSwitching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  const loadSources = async () => {
    try {
      const data = await fetchDataSources();
      setSourcesData(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data source statuses');
    }
  };

  useEffect(() => {
    loadSources();
    const interval = setInterval(loadSources, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectSource = async (sourceType: DataSourceType) => {
    if (sourcesData?.active_source === sourceType) return;
    setSwitching(true);
    setError(null);
    try {
      const updated = await selectDataSource(sourceType);
      await loadSources();
      if (onSourceChanged) {
        onSourceChanged(updated);
      }
    } catch (err: any) {
      setError(err.message || `Failed to switch to ${sourceType}`);
    } finally {
      setSwitching(false);
    }
  };

  const handlePreviewExternal = async () => {
    try {
      setLoadingPreview(true);
      const res = await fetchExternalWeatherPreview();
      setPreviewData(res);
      setShowPreviewModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to preview Open-Meteo external feed');
    } finally {
      setLoadingPreview(false);
    }
  };

  const activeStatus = sourcesData?.sources.find(
    (s) => s.source_type === sourcesData.active_source
  );

  const getSourceIcon = (type: DataSourceType) => {
    switch (type) {
      case 'SIMULATED':
        return <Radio className="w-4 h-4 text-amber-400" />;
      case 'EXTERNAL_API':
        return <Globe className="w-4 h-4 text-sky-400" />;
      case 'PHYSICAL_AWS':
        return <Cpu className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getStatusBadge = (status?: string, isStale?: boolean) => {
    if (isStale) {
      return (
        <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
          <AlertCircle className="w-3 h-3" /> STALE DATA
        </span>
      );
    }
    switch (status) {
      case 'CONNECTED':
      case 'RUNNING':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3" /> {status}
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <AlertCircle className="w-3 h-3" /> DEGRADED
          </span>
        );
      case 'CONNECTING':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" /> CONNECTING
          </span>
        );
      case 'DISCONNECTED':
      case 'ERROR':
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <AlertCircle className="w-3 h-3" /> {status || 'DISCONNECTED'}
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md mb-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                TELEMETRY DATA SOURCE CONTROLLER
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                3 Interchangeable Feeds
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Select active ingest stream to feed the 5-Tier ML Quality Control Engine.
            </p>
          </div>
        </div>

        {/* Source Selector Buttons */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => handleSelectSource('SIMULATED')}
            disabled={switching}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sourcesData?.active_source === 'SIMULATED'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulated AWS</span>
          </button>

          <button
            onClick={() => handleSelectSource('EXTERNAL_API')}
            disabled={switching}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sourcesData?.active_source === 'EXTERNAL_API'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>Open-Meteo Feed</span>
          </button>

          <button
            onClick={() => handleSelectSource('PHYSICAL_AWS')}
            disabled={switching}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sourcesData?.active_source === 'PHYSICAL_AWS'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Physical ESP32</span>
          </button>
        </div>
      </div>

      {/* Active Source Details & Health Grid */}
      {activeStatus && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Active Provider Card */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 uppercase font-mono mb-1">Active Source</div>
            <div className="flex items-center gap-2 font-bold text-slate-100">
              {getSourceIcon(activeStatus.source_type)}
              <span className="truncate">{activeStatus.name}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Provider: <span className="text-sky-300 font-medium">{activeStatus.provider || 'Internal'}</span>
            </div>
          </div>

          {/* Connection Status & Health Card */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 uppercase font-mono mb-1">Live Status</div>
            <div className="flex items-center gap-2">
              {getStatusBadge(activeStatus.status, activeStatus.is_stale)}
            </div>
            {activeStatus.error_message ? (
              <div className="text-[10px] text-rose-400 mt-1 truncate" title={activeStatus.error_message}>
                {activeStatus.error_message}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 mt-1">
                Packets: <span className="text-slate-200 font-mono">{activeStatus.packet_count}</span>
              </div>
            )}
          </div>

          {/* Station & Location Card */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 uppercase font-mono mb-1">Station ID</div>
            <div className="flex items-center gap-1.5 font-bold text-slate-100 font-mono">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>{activeStatus.station_id}</span>
            </div>
            {activeStatus.coordinates && (
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                {activeStatus.coordinates.latitude.toFixed(2)}°N, {activeStatus.coordinates.longitude.toFixed(2)}°E
              </div>
            )}
          </div>

          {/* Telemetry Age & Action Card */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-mono mb-1">Data Freshness</div>
              <div className="flex items-center gap-1.5 text-slate-200 font-mono">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>
                  {activeStatus.data_age_seconds !== null && activeStatus.data_age_seconds !== undefined
                    ? `${activeStatus.data_age_seconds}s ago`
                    : 'Awaiting data...'}
                </span>
              </div>
            </div>

            {activeStatus.source_type === 'EXTERNAL_API' && (
              <button
                onClick={handlePreviewExternal}
                disabled={loadingPreview}
                className="mt-2 text-[10px] font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 disabled:opacity-50"
              >
                {loadingPreview ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <ExternalLink className="w-3 h-3" />
                )}
                <span>{loadingPreview ? 'Fetching Live...' : 'Test Live Query'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Notification Banner */}
      {error && (
        <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* External Feed Live Preview Modal */}
      {showPreviewModal && previewData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                <Globe className="w-4 h-4" />
                <span>Open-Meteo Live API Response</span>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Temperature</div>
                  <div className="text-base font-bold text-amber-400">
                    {previewData.telemetry.temperature}°C
                  </div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Pressure</div>
                  <div className="text-base font-bold text-sky-400">
                    {previewData.telemetry.pressure} hPa
                  </div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Humidity</div>
                  <div className="text-base font-bold text-indigo-400">
                    {previewData.telemetry.humidity}%
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
                <div>Station: {previewData.telemetry.station_id}</div>
                <div>Timestamp: {previewData.telemetry.timestamp}</div>
                <div>Location: {previewData.telemetry.latitude}°N, {previewData.telemetry.longitude}°E (Elevation: {previewData.telemetry.elevation}m)</div>
                <div>Status: {previewData.telemetry.connectivity_status}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
