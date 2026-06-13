import React, { useEffect } from 'react';
import AppRoutes from './routes';
import useAppStore from './store/useAppStore';

export default function App() {
  const { connectWebSocket, disconnectWebSocket } = useAppStore();

  useEffect(() => {
    connectWebSocket();
    return () => disconnectWebSocket();
  }, [connectWebSocket, disconnectWebSocket]);

  return (
    <AppRoutes />
  );
}
