from __future__ import annotations

import httpx

from app.config import get_settings
from app.schemas.emergency import SensorWeather


async def fetch_live_weather(lat: float, lon: float) -> SensorWeather | None:
    settings = get_settings()
    if not settings.openweather_api_key:
        return None

    params = {
        "lat": lat,
        "lon": lon,
        "appid": settings.openweather_api_key,
        "units": "metric",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(settings.openweather_api_url, params=params)
            response.raise_for_status()
            payload = response.json()
            main = payload.get("main", {})
            return SensorWeather(
                temp_c=float(main.get("temp", 30.0)),
                humidity=float(main.get("humidity", 60.0)),
            )
    except Exception:
        return None


def weather_delay_multiplier(humidity: float, temp_c: float) -> float:
    """Estimate response delay factor from live weather conditions."""
    delay = 1.0
    if humidity >= 85:
        delay += 0.15
    if temp_c >= 38:
        delay += 0.05
    if temp_c <= 5:
        delay += 0.1
    return delay
