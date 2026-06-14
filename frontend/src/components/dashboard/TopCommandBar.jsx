import React from 'react';
import { Train, CloudRain, AlertTriangle, History, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAppStore from '../../store/useAppStore';

import { injectWeather, triggerEmergency, resetSimulation, resetEmergency } from '../../lib/api';

export default function TopCommandBar() {
  const { isEmergencyMode, isSimulating, trains, setHistoryModalOpen } = useAppStore();

  const handleInjectRain = async () => {
    try {
      await injectWeather("heavy", "Kanpur Sector", 2.5);
    } catch (error) {
      console.error("Failed to inject weather", error);
    }
  };

  const handleSimulateDerailment = async () => {
    try {
      // Pick a target train for the derailment payload, or use a dummy if none available
      const targetTrainId = trains.length > 0 ? trains[0].train_id : "TRN-001";
      const targetLat = trains.length > 0 ? trains[0].path[trains[0].current_index][1] : 26.4499;
      const targetLon = trains.length > 0 ? trains[0].path[trains[0].current_index][0] : 80.3319;
      const targetVel = trains.length > 0 ? trains[0].speed_kmh : 110;

      await triggerEmergency({
        event_type: "derailment",
        train_id: targetTrainId,
        velocity_kmh: targetVel,
        location: {
          lat: targetLat,
          lon: targetLon
        },
        sensor_data: {
          peak_g_force: 8.4,
          weather: {
            temp_c: 32.5,
            humidity: 85
          },
          obstacle_distance_mm: 0
        }
      });
    } catch (error) {
      console.error("Failed to trigger emergency", error);
    }
  };

  const handleReset = async () => {
    try {
      if (isEmergencyMode) await resetEmergency();
      await resetSimulation();
    } catch (error) {
      console.error("Failed to reset", error);
    }
  };

  return (
    <div className="h-[10vh] min-h-[70px] bg-black/40 backdrop-blur-2xl border-b border-white/10 flex items-center justify-between px-6 z-50 relative shadow-2xl">
      
      {/* Logo and Branding */}
      <div className="flex items-center space-x-6">
        <Link to="/" className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity group">
          <Train className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          <span className="text-xl tracking-tight">
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">RAILCORTEX</span>
          </span>
        </Link>

        {/* Current Mode Indicator */}
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

      {/* Dashboard Action Buttons */}
      <div className="flex items-center space-x-4">
        {isEmergencyMode && (
          <button 
            onClick={handleReset}
            className="flex items-center space-x-2 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/50 hover:border-emerald-400 text-emerald-400 hover:text-white px-5 py-2.5 rounded-md text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] animate-pulse"
          >
            <span>Reset System</span>
          </button>
        )}

        <button 
          onClick={handleInjectRain}
          disabled={isEmergencyMode}
          className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 hover:border-primary/50 text-slate-300 hover:text-white px-5 py-2.5 rounded-md text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed group hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
        >
          <CloudRain className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
          <span>Inject Heavy Rain</span>
        </button>

        <button 
          onClick={handleSimulateDerailment}
          disabled={isEmergencyMode}
          className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 border border-transparent text-white px-5 py-2.5 rounded-md text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] hover:-translate-y-0.5 duration-300"
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Simulate Derailment</span>
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
