import { useState, useEffect, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  Database,
  Eye,
  Radio,
  Zap,
  Layers,
} from 'lucide-react';
import { TelemetryStreamClient } from './services/websocket';
import { InferenceResult } from './types';
import { OverviewView } from './components/OverviewView';
import { LiveMonitoringView } from './components/LiveMonitoringView';
import { AlertCenterView } from './components/AlertCenterView';
import { SensorHealthView } from './components/SensorHealthView';
import { EventDetailView } from './components/EventDetailView';
import { DataExplorerView } from './components/DataExplorerView';
import { AnomalyInjectorUI } from './components/AnomalyInjectorUI';
import { ExplainabilityViewer } from './components/ExplainabilityViewer';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'live' | 'alerts' | 'health' | 'events' | 'explorer' | 'injector' | 'explainability'
  >('overview');

  const [latestTelemetry, setLatestTelemetry] = useState<InferenceResult | null>(null);
  const [historyBuffer, setHistoryBuffer] = useState<InferenceResult[]>([]);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const isStreamingRef = useRef<boolean>(true);

  isStreamingRef.current = isStreaming;

  useEffect(() => {
    const wsClient = new TelemetryStreamClient({
      onOpen: () => {
        setIsWsConnected(true);
      },
      onClose: () => {
        setIsWsConnected(false);
      },
      onTelemetry: (data: InferenceResult) => {
        if (!isStreamingRef.current) return;
        setLatestTelemetry(data);
        setHistoryBuffer((prev) => {
          const next = [...prev, data];
          return next.length > 60 ? next.slice(-60) : next;
        });
      },
    });

    wsClient.connect();

    return () => {
      wsClient.disconnect();
    };
  }, []);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'live', label: 'Live Monitoring', icon: Eye },
    { id: 'alerts', label: 'Alert Center', icon: AlertTriangle },
    { id: 'health', label: 'Sensor Health', icon: ShieldCheck },
    { id: 'events', label: 'Event Detail', icon: Cpu },
    { id: 'explorer', label: 'Data Explorer', icon: Database },
    { id: 'injector', label: 'Anomaly Injector', icon: Zap },
    { id: 'explainability', label: 'Explainability (XAI)', icon: Layers },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Application Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/30 rounded-xl text-sky-400 shadow-inner">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white">
                SkyGuard <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">AI</span>
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-slate-800 text-sky-300 rounded border border-slate-700 font-semibold">
                v0.1.0 PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Intelligent AWS Quality-Control & Sensor Health Platform
            </p>
          </div>
        </div>

        {/* System Status Indicators */}
        <div className="flex items-center gap-4 text-xs font-mono">
          {/* WebSocket Status */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all ${
              isWsConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isWsConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
              }`}
            />
            {isWsConnected ? 'WS /ws/live STREAMING' : 'CONNECTING WS...'}
          </div>

          {/* Core Feature Badge */}
          <div className="hidden md:flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-400 text-[11px]">
            <span>Sensors:</span>
            <span className="text-amber-400 font-bold">T (°C)</span>
            <span>•</span>
            <span className="text-sky-400 font-bold">P (hPa)</span>
            <span>•</span>
            <span className="text-indigo-400 font-bold">RH (%)</span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <nav className="flex border-b border-slate-800/80 bg-slate-900/60 px-6 gap-1 overflow-x-auto scrollbar-none sticky top-[61px] z-40 backdrop-blur">
        {navItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-sky-400 text-sky-400 bg-sky-500/10 shadow-sm'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Active Tab View Body */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {activeTab === 'overview' && (
          <OverviewView latestTelemetry={latestTelemetry} onNavigate={(tab) => setActiveTab(tab as any)} />
        )}
        {activeTab === 'live' && (
          <LiveMonitoringView
            latestTelemetry={latestTelemetry}
            historyBuffer={historyBuffer}
            isStreaming={isStreaming}
            onToggleStreaming={() => setIsStreaming((s) => !s)}
          />
        )}
        {activeTab === 'alerts' && <AlertCenterView />}
        {activeTab === 'health' && <SensorHealthView />}
        {activeTab === 'events' && <EventDetailView />}
        {activeTab === 'explorer' && <DataExplorerView />}
        {activeTab === 'injector' && (
          <AnomalyInjectorUI onNavigateToLive={() => setActiveTab('live')} />
        )}
        {activeTab === 'explainability' && <ExplainabilityViewer />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950 px-6 py-4 text-center text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>SkyGuard AI Operational Station Quality Control</span>
          <span>•</span>
          <span className="font-mono text-slate-400">FastAPI • PyTorch • scikit-learn • TreeSHAP • React</span>
        </div>
        <div className="text-slate-400 font-mono text-[11px]">
          Backend Port: 8899 | Frontend Port: 5199
        </div>
      </footer>
    </div>
  );
}
