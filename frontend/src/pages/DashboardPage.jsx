import React, { useEffect } from 'react';
import TopCommandBar from '../components/dashboard/TopCommandBar';
import LeftDataPanel from '../components/dashboard/LeftDataPanel';
import MapCanvas from '../components/dashboard/MapCanvas';
import MilpOverlay from '../components/dashboard/MilpOverlay';
import useAppStore from '../store/useAppStore';

export default function DashboardPage() {
  const { connectWebSocket, disconnectWebSocket } = useAppStore();

  useEffect(() => {
    connectWebSocket();
    return () => disconnectWebSocket();
  }, [connectWebSocket, disconnectWebSocket]);

  return (
    <div className="h-screen w-screen bg-background text-white overflow-hidden flex flex-col font-sans selection:bg-primary/30">
      <TopCommandBar />
      <div className="flex-1 flex relative">
        <LeftDataPanel />
        <div className="flex-1 relative">
          <MapCanvas />
          <MilpOverlay />
        </div>
      </div>
    </div>
  );
}


