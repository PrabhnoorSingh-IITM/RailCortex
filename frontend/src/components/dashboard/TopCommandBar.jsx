import React, { useState } from 'react';
import { Train, CloudRain, AlertTriangle, History, User, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAppStore from '../../store/useAppStore';
import { injectWeather, triggerEmergency, resetSimulation, resetEmergency } from '../../lib/api';

// Transient toast: shows for 4 s then clears
function useToast() {
  const [toast, setToast] = useState(null); // { type: 'ok'|'err', text }
  const show = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };
  return [toast, show];
}

export default function TopCommandBar() {
  const { isEmergencyMode, isSimulating, trains, setHistoryModalOpen } = useAppStore();

  const [rainLoading,       setRainLoading]       = useState(false);
  const [derailLoading,     setDerailLoading]      = useState(false);
  const [resetLoading,      setResetLoading]       = useState(false);
  const [toast, showToast] = useToast();

  // ── Inject Heavy Rain ──────────────────────────────────────────────────────
  const handleInjectRain = async () => {
    if (rainLoading) return;
    setRainLoading(true);
    try {
      const result = await injectWeather('heavy', 'Kanpur Sector', 2.5);
      showToast('ok', `Rain injected — ${result.trains_rerouted ?? 0} trains rerouted`);
    } catch (err) {
      console.error('Inject weather failed:', err);
      showToast('err', `Weather inject failed: ${err.message}`);
    } finally {
      setRainLoading(false);
    }
  };

  // ── Simulate Derailment ────────────────────────────────────────────────────
  const handleSimulateDerailment = async () => {
    if (derailLoading) return;
    setDerailLoading(true);
    showToast('ok', 'Dispatching emergency pipeline… this may take 10–20 s');

    try {
      // Safely extract train position — fall back to Kanpur coords if unavailable
      let targetTrainId = 'TRN-001';
      let targetLat     = 26.4499;
      let targetLon     = 80.3319;
      let targetVel     = 110;

      if (trains.length > 0) {
        const t   = trains[0];
        const idx = Math.min(t.current_index ?? 0, (t.path?.length ?? 1) - 1);
        const pt  = t.path?.[idx];
        if (pt && pt.length >= 2) {
          targetLon     = pt[0];   // path is [lon, lat]
          targetLat     = pt[1];
        }
        targetTrainId = t.train_id ?? targetTrainId;
        targetVel     = t.speed_kmh ?? targetVel;
      }

      await triggerEmergency({
        event_type:   'derailment',
        train_id:     targetTrainId,
        velocity_kmh: targetVel,
        location:     { lat: targetLat, lon: targetLon },
        sensor_data:  {
          peak_g_force:        8.4,
          obstacle_distance_mm: 0,
          weather:             { temp_c: 32.5, humidity: 85 },
        },
      });

      showToast('ok', 'Emergency pipeline complete — dispatch plan received');
    } catch (err) {
      console.error('Trigger emergency failed:', err);
      showToast('err', `Derailment trigger failed: ${err.message}`);
    } finally {
      setDerailLoading(false);
    }
  };

  // ── Reset System ───────────────────────────────────────────────────────────
  const handleReset = async () => {
    if (resetLoading) return;
    setResetLoading(true);
    try {
      if (isEmergencyMode) await resetEmergency();
      await resetSimulation();
      showToast('ok', 'System reset to normal operations');
    } catch (err) {
      console.error('Reset failed:', err);
      showToast('err', `Reset failed: ${err.message}`);
    } finally {
      setResetLoading(false);
    }
  };

  const anyLoading = rainLoading || derailLoading || resetLoading;

  return (
    <div className="h-[10vh] min-h-[70px] bg-black/40 backdrop-blur-2xl border-b border-white/10 flex items-center justify-between px-6 z-50 relative shadow-2xl">

      {/* Toast notification */}
      {toast && (
        <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[9999] flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium shadow-xl border backdrop-blur-sm transition-all
          ${toast.type === 'ok'
            ? 'bg-slate-900/90 border-emerald/40 text-emerald'
            : 'bg-slate-900/90 border-danger/40 text-danger'}`}>
          {toast.type === 'ok'
            ? <CheckCircle className="h-4 w-4 shrink-0" />
            : <XCircle className="h-4 w-4 shrink-0" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Logo and Branding */}
      <div className="flex items-center space-x-6">
        <Link to="/" className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity group">
          <Train className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          <span className="text-xl tracking-tight">
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">RAILCORTEX</span>
          </span>
        </Link>

        {/* Mode Indicator */}
        {!isEmergencyMode ? (
          <div className="flex items-center space-x-2 bg-slate-900 border border-emerald/30 px-4 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald animate-pulse shadow-[0_0_8px_#10b981]"></div>
            <span className="text-xs font-bold text-emerald tracking-wider">DIGITAL TWIN MODE</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 bg-red-950 border border-danger px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse">
            <div className="w-2 h-2 rounded-full bg-danger"></div>
            <span className="text-xs font-bold text-danger tracking-wider">EMERGENCY OVERRIDE</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-4">

        {/* Reset — only visible in emergency mode */}
        {isEmergencyMode && (
          <button
            onClick={handleReset}
            disabled={resetLoading}
            className="flex items-center space-x-2 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/50 hover:border-emerald-400 text-emerald-400 hover:text-white px-5 py-2.5 rounded-md text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] animate-pulse disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {resetLoading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <span>Reset System</span>}
          </button>
        )}

        {/* Inject Heavy Rain */}
        <button
          onClick={handleInjectRain}
          disabled={isEmergencyMode || rainLoading || anyLoading}
          className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 hover:border-primary/50 text-slate-300 hover:text-white px-5 py-2.5 rounded-md text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed group hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
        >
          {rainLoading
            ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
            : <CloudRain className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />}
          <span>{rainLoading ? 'Injecting…' : 'Inject Heavy Rain'}</span>
        </button>

        {/* Simulate Derailment */}
        <button
          onClick={handleSimulateDerailment}
          disabled={isEmergencyMode || derailLoading || anyLoading}
          className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 border border-transparent text-white px-5 py-2.5 rounded-md text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] hover:-translate-y-0.5 duration-300"
        >
          {derailLoading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <AlertTriangle className="h-4 w-4" />}
          <span>{derailLoading ? 'Processing…' : 'Simulate Derailment'}</span>
        </button>

        <div className="w-px h-8 bg-white/10 mx-2"></div>

        <button
          onClick={() => setHistoryModalOpen(true)}
          className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 hover:border-primary/50 text-slate-300 hover:text-white transition-all shadow-sm"
          title="Incident History"
        >
          <History className="h-5 w-5" />
        </button>

        <Link
          to="/admin/login"
          className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 hover:border-primary/50 text-slate-300 hover:text-white transition-all shadow-sm"
          title="Operator Login"
        >
          <User className="h-5 w-5" />
        </Link>
      </div>

    </div>
  );
}
