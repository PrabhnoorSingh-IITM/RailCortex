const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const injectWeather = async (intensity, region, delayMultiplier) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/simulation/weather`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intensity,
      affected_region: region,
      delay_multiplier: delayMultiplier
    }),
  });
  if (!response.ok) throw new Error('Failed to inject weather');
  return response.json();
};

export const resetSimulation = async () => {
  const response = await fetch(`${API_BASE_URL}/api/v1/simulation/reset`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to reset simulation');
  return response.json();
};

export const triggerEmergency = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/emergency/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to trigger emergency');
  return response.json();
};

export const resetEmergency = async () => {
  const response = await fetch(`${API_BASE_URL}/api/v1/emergency/reset`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to reset emergency');
  return response.json();
};
