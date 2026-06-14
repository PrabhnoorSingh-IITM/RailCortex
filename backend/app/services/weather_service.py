from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from typing import Optional

import httpx

from app.config import get_settings
from app.schemas.emergency import SensorWeather

logger = logging.getLogger(__name__)

# Cache for weather data (location -> (timestamp, weather_data))
_weather_cache: dict[str, tuple[float, SensorWeather]] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes


@dataclass
class WeatherContext:
    """Enhanced weather data with analysis."""
    temp_c: float
    humidity: float
    wind_speed_kmh: Optional[float] = None
    conditions: Optional[str] = None
    is_adverse: bool = False
    delay_factor: float = 1.0


def _make_cache_key(lat: float, lon: float) -> str:
    """Create cache key from coordinates."""
    return f"{lat:.2f},{lon:.2f}"


def _is_adverse_weather(temp_c: float, humidity: float, wind_speed_kmh: Optional[float] = None) -> bool:
    """Determine if weather conditions are adverse."""
    if humidity >= 85:
        return True
    if temp_c >= 40 or temp_c <= 0:
        return True
    if wind_speed_kmh and wind_speed_kmh > 40:
        return True
    return False


async def fetch_live_weather(lat: float, lon: float) -> SensorWeather | None:
    """
    Fetch live weather data from OpenWeatherMap API.
    Uses caching to reduce API calls.
    Falls back to defaults if API unavailable.
    """
    settings = get_settings()
    
    # Check cache first
    cache_key = _make_cache_key(lat, lon)
    if cache_key in _weather_cache:
        timestamp, cached_data = _weather_cache[cache_key]
        if time.time() - timestamp < CACHE_TTL_SECONDS:
            logger.debug(f"Weather cache hit for ({lat}, {lon})")
            return cached_data
    
    if not settings.openweather_api_key:
        logger.debug("OpenWeatherMap API key not configured")
        return None

    params = {
        "lat": lat,
        "lon": lon,
        "appid": settings.openweather_api_key,
        "units": "metric",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                settings.openweather_api_url,
                params=params,
                follow_redirects=True,
            )
            response.raise_for_status()
            
            payload = response.json()
            
            # Extract main weather data
            main = payload.get("main", {})
            weather_list = payload.get("weather", [])
            wind = payload.get("wind", {})
            
            temp_c = float(main.get("temp", 30.0))
            humidity = float(main.get("humidity", 60.0))
            
            # Extract additional context
            conditions = weather_list[0].get("main", "Unknown") if weather_list else "Unknown"
            wind_speed = float(wind.get("speed", 0.0)) * 3.6  # m/s to km/h
            
            weather = SensorWeather(
                temp_c=temp_c,
                humidity=humidity,
            )
            
            # Cache the result
            _weather_cache[cache_key] = (time.time(), weather)
            
            logger.info(
                f"Live weather: {temp_c}°C, {humidity}% humidity, {conditions} at ({lat}, {lon})"
            )
            return weather
            
    except httpx.TimeoutException:
        logger.warning(f"OpenWeatherMap API timeout for ({lat}, {lon})")
        return None
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 401:
            logger.error("OpenWeatherMap API: Invalid API key")
        elif exc.response.status_code == 429:
            logger.warning("OpenWeatherMap API: Rate limited")
        else:
            logger.warning(f"OpenWeatherMap API error: {exc.response.status_code}")
        return None
    except Exception as exc:
        logger.warning(f"Weather fetch error: {exc}")
        return None


def weather_delay_multiplier(
    humidity: float,
    temp_c: float,
    wind_speed_kmh: Optional[float] = None,
) -> float:
    """
    Calculate response delay multiplier from weather conditions.
    Returns value > 1.0 indicating slowdown.
    
    Examples:
        - 1.0: Perfect conditions (no delay)
        - 1.15: Heavy humidity (15% slower)
        - 1.25: Extreme temperature
        - 1.3: Combination of adverse factors
    """
    delay = 1.0
    
    # Humidity impact
    if humidity >= 90:
        delay += 0.2  # Very wet, visibility reduced
    elif humidity >= 85:
        delay += 0.15  # Heavy humidity
    elif humidity >= 75:
        delay += 0.08  # Moderate humidity
    
    # Temperature impact
    if temp_c >= 40:  # Extreme heat
        delay += 0.15
        delay += 0.05  # Driver fatigue
    elif temp_c >= 38:  # Very hot
        delay += 0.1
    elif temp_c <= 0:  # Freezing
        delay += 0.15  # Ice risk
    elif temp_c <= 5:  # Very cold
        delay += 0.1
    
    # Wind impact
    if wind_speed_kmh:
        if wind_speed_kmh > 50:
            delay += 0.2  # Dangerous winds
        elif wind_speed_kmh > 40:
            delay += 0.15
        elif wind_speed_kmh > 30:
            delay += 0.08
    
    # Cap the multiplier
    return min(2.0, delay)


def get_weather_context(temp_c: float, humidity: float, wind_speed: Optional[float] = None) -> WeatherContext:
    """
    Create weather analysis context for decision making.
    """
    is_adverse = _is_adverse_weather(temp_c, humidity, wind_speed)
    delay = weather_delay_multiplier(humidity, temp_c, wind_speed)
    
    # Determine conditions
    if humidity >= 85:
        conditions = "Heavy precipitation expected"
    elif temp_c <= 5:
        conditions = "Freezing conditions - ice hazard"
    elif temp_c >= 40:
        conditions = "Extreme heat - heat exhaustion risk"
    else:
        conditions = "Normal conditions"
    
    return WeatherContext(
        temp_c=temp_c,
        humidity=humidity,
        wind_speed_kmh=wind_speed,
        conditions=conditions,
        is_adverse=is_adverse,
        delay_factor=delay,
    )


def clear_weather_cache() -> None:
    """Clear weather cache (useful for testing)."""
    global _weather_cache
    _weather_cache.clear()
    logger.debug("Weather cache cleared")
