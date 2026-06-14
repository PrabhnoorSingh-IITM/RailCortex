const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Wrapper around fetch that:
 * - Attaches Content-Type for POST/PUT
 * - Applies an optional timeout (default 60 s — LLM pipeline can be slow)
 * - Throws with the server's error detail rather than a generic message
 */
async function apiFetch(path, options = {}, timeoutMs = 60_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });

    if (!res.ok) {
      // Try to extract backend detail message
      let detail = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        detail = body?.detail || body?.message || detail;
      } catch (_) { /* ignore parse errors */ }
      throw new Error(detail);
    }

    return res.json();
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Request timed out — backend may still be processing');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const injectWeather = (intensity, region, delayMultiplier) =>
  apiFetch('/api/v1/simulation/weather', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intensity,
      affected_region: region,
      delay_multiplier: delayMultiplier,
    }),
  });

export const resetSimulation = () =>
  apiFetch('/api/v1/simulation/reset', { method: 'POST' });

export const triggerEmergency = (payload) =>
  apiFetch(
    '/api/v1/emergency/trigger',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    120_000, // 2-minute timeout — OSM + LLM can be slow
  );

export const resetEmergency = () =>
  apiFetch('/api/v1/emergency/reset', { method: 'POST' });
