import { create } from 'zustand';

const useAppStore = create((set, get) => ({
  // UI State
  isEmergencyMode: false,
  isSimulating: false,
  
  // Data State
  trains: [],
  dispatchPlan: null,
  weatherMessage: '',
  wsConnected: false,
  wsInstance: null,
  isHistoryModalOpen: false,

  // Actions
  setEmergencyMode: (mode) => set({ isEmergencyMode: mode }),
  setSimulating: (sim) => set({ isSimulating: sim }),
  
  setTrains: (trains) => set({ trains }),
  setDispatchPlan: (plan) => set({ dispatchPlan: plan }),
  setWeatherMessage: (msg) => set({ weatherMessage: msg }),
  setHistoryModalOpen: (isOpen) => set({ isHistoryModalOpen: isOpen }),

  // WebSocket connection management
  connectWebSocket: () => {
    // Prevent duplicate connections
    if (get().wsInstance) return;

    // Use relative URL so the Vite proxy handles routing to the backend.
    // Falls back to explicit ws://localhost:8000 only if VITE_WS_BASE_URL is set.
    const wsBase = import.meta.env.VITE_WS_BASE_URL || 
      `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
    const ws = new WebSocket(`${wsBase}/ws/network-telemetry`);

    ws.onopen = () => {
      set({ wsConnected: true, wsInstance: ws });
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'TELEMETRY':
            set({ 
              trains: data.trains || [],
              isEmergencyMode: data.emergency_active,
              isSimulating: data.weather_active
            });
            break;
          case 'EMERGENCY_STATE':
            set({ isEmergencyMode: data.emergency_active });
            if (!data.emergency_active) {
              set({ dispatchPlan: null, isSimulating: false }); // Clear plan and weather on reset
            }
            break;
          case 'WEATHER_ALERT':
            set({ 
              weatherMessage: data.message,
              isSimulating: true,
              trains: data.trains || get().trains,  // keep existing trains if none sent
            });
            break;
          case 'DISPATCH_PLAN':
            set({ dispatchPlan: data.dispatch_plan });
            break;
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing WS message', error);
      }
    };

    ws.onclose = () => {
      set({ wsConnected: false, wsInstance: null });
      console.log('WebSocket disconnected. Reconnecting in 3s...');
      setTimeout(() => {
        get().connectWebSocket();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      ws.close();
    };
  },

  disconnectWebSocket: () => {
    const { wsInstance } = get();
    if (wsInstance) {
      wsInstance.close();
    }
  }
}));

export default useAppStore;
