import React from 'react';
import TopCommandBar from '../components/dashboard/TopCommandBar';
import LeftDataPanel from '../components/dashboard/LeftDataPanel';
import MapCanvas from '../components/dashboard/MapCanvas';
import PredictiveMLOverlay from '../components/dashboard/PredictiveMLOverlay';
import IncidentHistoryModal from '../components/dashboard/IncidentHistoryModal';
import useAppStore from '../store/useAppStore';

export default function DashboardPage() {
  const { wsConnected } = useAppStore();

  return (
    <div className="h-screen w-screen bg-slate-950 text-white overflow-hidden flex flex-col font-sans selection:bg-primary/30 relative">
      <TopCommandBar />
      <div className="flex-1 relative overflow-hidden flex">
        
        {/* Connection Lost Banner */}
        {!wsConnected && (
          <div className="absolute top-0 left-0 right-0 bg-red-600/90 text-white text-center py-1.5 text-xs font-bold tracking-widest z-[100] shadow-md animate-pulse">
            ⚠️ WEBSOCKET CONNECTION LOST — RECONNECTING TO TELEMETRY SERVER...
          </div>
        )}

        {/* Ambient Gradient under Map */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15)_0%,rgba(15,23,42,1)_100%)] z-0 pointer-events-none"></div>
        
        <div className="absolute inset-0 z-10">
          <MapCanvas />
        </div>
        
        <LeftDataPanel />
        <PredictiveMLOverlay />
        
        <IncidentHistoryModal />
      </div>
    </div>
  );
}
