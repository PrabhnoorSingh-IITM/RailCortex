from __future__ import annotations

import asyncio
import logging
import math

import httpx

from app.config import get_settings
from app.models.emergency_state import EmergencyState

logger = logging.getLogger(__name__)

# Ambulance speed profiles (km/h) by road type and conditions
AMBULANCE_SPEEDS = {
    "highway_emergency": 90,      # Major highways with emergency lane
    "highway_normal": 80,         # Interstate/expressway
    "urban_arterial": 50,         # Main city streets
    "urban_local": 35,            # Residential/local roads
    "rural": 65,                  # Rural roads
}


def _interpolate_route(
    origin_lon: float,
    origin_lat: float,
    dest_lon: float,
    dest_lat: float,
    points: int = 12,
) -> list[list[float]]:
    """
    Fallback geometry when routing API is unavailable.
    Provides linear interpolation between origin and destination.
    NOT suitable for accurate routing but ensures response continuity.
    """
    path = []
    for i in range(points + 1):
        t = i / points
        lon = origin_lon + (dest_lon - origin_lon) * t
        lat = origin_lat + (dest_lat - origin_lat) * t
        path.append([lon, lat])
    return path


def _path_distance_km(path: list[list[float]]) -> float:
    """Calculate approximate distance of a path using Haversine formula."""
    total = 0.0
    for idx in range(1, len(path)):
        lon1, lat1 = path[idx - 1]
        lon2, lat2 = path[idx]
        # Approximate: 111 km per degree at equator
        total += math.sqrt((lat2 - lat1) ** 2 + (lon2 - lon1) ** 2) * 111
    return total


def _estimate_duration_min(
    distance_km: float,
    *,
    weather_delay_factor: float = 1.0,
    urban_factor: float = 1.0,
    road_type: str = "urban_arterial",
) -> float:
    """
    Estimate ambulance ETA with realistic speed variations.
    
    Args:
        distance_km: Route distance
        weather_delay_factor: Multiplier for adverse weather (1.0 = normal, 1.2 = 20% slower)
        urban_factor: Multiplier for urban traffic (1.0 = clear, 1.5 = congested)
        road_type: Type of road for speed profile
    """
    base_speed = AMBULANCE_SPEEDS.get(road_type, 50)
    
    # Apply weather and traffic delays
    effective_speed = base_speed / (weather_delay_factor * urban_factor)
    effective_speed = max(20.0, effective_speed)  # Never below 20 km/h
    
    duration_min = (distance_km / effective_speed) * 60.0
    return max(5.0, duration_min)  # Minimum 5 minutes for crew prep


async def _fetch_mappls_route(
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float,
    api_key: str,
) -> dict | None:
    """
    Fetch route from Mappls routing API.
    Returns path, distance, and ETA with comprehensive error handling.
    """
    settings = get_settings()
    url = (
        f"{settings.mappls_routes_url}/{origin_lat},{origin_lon};"
        f"{dest_lat},{dest_lon}"
    )
    params = {
        "rtype": "1",  # Optimal route
        "region": "ind",  # India
        "access_token": api_key,
        "alternatives": "false",
        "traffic": "live",  # Use live traffic if available
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(url, params=params)
            
            if response.status_code == 401:
                logger.warning("Mappls API: Invalid API key")
                return None
            
            if response.status_code == 429:
                logger.warning("Mappls API: Rate limited")
                return None
            
            if response.status_code != 200:
                logger.warning(f"Mappls API returned {response.status_code}")
                return None
            
            data = response.json()
            
            # Parse response structure (Mappls may return different formats)
            routes = data.get("routes") or data.get("route") or []
            if not routes:
                logger.warning("Mappls API: No routes in response")
                return None

            route = routes[0] if isinstance(routes, list) else routes
            
            # Extract geometry
            geometry = route.get("geometry") or route.get("polyline") or route.get("coordinates")
            path: list[list[float]] | None = None

            if isinstance(geometry, str):
                path = _decode_polyline(geometry)
            elif isinstance(geometry, list):
                if geometry and isinstance(geometry[0], (list, tuple)):
                    # Already in [lon, lat] format
                    path = [[float(p[0]), float(p[1])] for p in geometry]

            if not path:
                logger.warning("Mappls API: Could not parse geometry")
                return None

            # Extract time and distance
            duration_sec = route.get("duration") or route.get("duration_sec") or route.get("time")
            distance_m = route.get("distance") or route.get("distance_m")

            if not duration_sec or not distance_m:
                logger.warning("Mappls API: Missing duration or distance")
                return None

            return {
                "path": path,
                "duration_sec": float(duration_sec),
                "distance_km": float(distance_m) / 1000.0,
            }

    except asyncio.TimeoutError:
        logger.warning("Mappls API: Request timeout")
        return None
    except Exception as exc:
        logger.warning(f"Mappls API error: {exc}")
        return None


def _decode_polyline(encoded: str) -> list[list[float]]:
    """
    Decode Google/Mappls polyline encoding to coordinate list.
    Returns list of [lon, lat] pairs.
    """
    coordinates: list[list[float]] = []
    index = 0
    lat = 0
    lon = 0

    try:
        while index < len(encoded):
            shift = result = 0
            while True:
                byte = ord(encoded[index]) - 63
                index += 1
                result |= (byte & 0x1F) << shift
                shift += 5
                if byte < 0x20:
                    break
            delta_lat = ~(result >> 1) if result & 1 else result >> 1
            lat += delta_lat

            shift = result = 0
            while True:
                byte = ord(encoded[index]) - 63
                index += 1
                result |= (byte & 0x1F) << shift
                shift += 5
                if byte < 0x20:
                    break
            delta_lon = ~(result >> 1) if result & 1 else result >> 1
            lon += delta_lon

            coordinates.append([lon / 1e5, lat / 1e5])
        
        return coordinates
    except Exception as exc:
        logger.warning(f"Polyline decoding failed: {exc}")
        return []


def _estimate_road_type(distance_km: float) -> str:
    """Estimate road type based on distance for speed profile selection."""
    if distance_km > 50:
        return "highway_normal"
    elif distance_km > 15:
        return "rural"
    else:
        return "urban_arterial"


async def _route_for_hospital(
    state: EmergencyState,
    hospital: dict,
    allocation: dict | None,
    api_key: str,
) -> dict:
    """Plan route from crash location to specific hospital."""
    hospital_lat = hospital["lat"]
    hospital_lon = hospital["lon"]
    
    # Straight-line distance as fallback
    straight_line_km = hospital.get(
        "distance_km",
        math.sqrt((state.lat - hospital_lat) ** 2 + (state.lon - hospital_lon) ** 2) * 111,
    )

    path: list[list[float]] | None = None
    source = "fallback_linear"
    duration_min: float | None = None
    route_distance_km = float(straight_line_km)
    mappls_duration_used = False

    # Determine weather impact
    weather_delay = 1.15 if state.incident_data.get("weather_delay_active") else 1.0
    weather_delay *= state.incident_data.get("weather_delay_factor", 1.0)
    
    # Urban factor based on distance to hospital
    urban_factor = 1.2 if route_distance_km < 15 else 1.0
    
    # Estimate road type
    road_type = _estimate_road_type(route_distance_km)

    # Try Mappls API if key configured
    if api_key:
        try:
            logger.info(f"Requesting route via Mappls for {hospital['name']}")
            route_data = await _fetch_mappls_route(
                state.lat,
                state.lon,
                hospital_lat,
                hospital_lon,
                api_key,
            )
            if route_data:
                path = route_data["path"]
                route_distance_km = route_data["distance_km"]
                source = "mappls_live"
                
                if route_data["duration_sec"]:
                    # Apply weather delays to live routing API ETA
                    duration_min = max(
                        5.0,
                        (route_data["duration_sec"] / 60.0) * weather_delay
                    )
                    mappls_duration_used = True
                    logger.info(f"Got live route for {hospital['name']}: {route_distance_km:.1f}km, {duration_min:.0f}min")
        except Exception as exc:
            logger.error(f"Route planning failed for {hospital['name']}: {exc}")
            state.errors.append(f"Routing failed for {hospital['name']}: {str(exc)[:60]}")

    # Fallback to linear interpolation if API unavailable
    if not path:
        logger.warning(f"Falling back to linear interpolation for {hospital['name']}")
        path = _interpolate_route(hospital_lon, hospital_lat, state.lon, state.lat)
        route_distance_km = _path_distance_km(path)
        source = "fallback_linear"
        state.errors.append(
            f"Mappls unavailable for {hospital['name']}; using linear interpolation"
        )

    # Calculate final ETA if not from Mappls
    if duration_min is None:
        duration_min = _estimate_duration_min(
            route_distance_km,
            weather_delay_factor=weather_delay,
            urban_factor=urban_factor,
            road_type=road_type,
        )

    ambulances = allocation["ambulances_dispatched"] if allocation else 1

    # Determine route color based on urgency
    if state.severity == "HIGH":
        route_color = [255, 0, 0]      # Red
    elif state.severity == "MEDIUM":
        route_color = [255, 140, 0]    # Orange
    else:
        route_color = [255, 220, 0]    # Yellow

    return {
        "hospital": hospital["name"],
        "hospital_city": hospital.get("city", "Unknown"),
        "hospital_lat": hospital_lat,
        "hospital_lon": hospital_lon,
        "crash_lat": state.lat,
        "crash_lon": state.lon,
        "path": path,
        "distance_km": round(route_distance_km, 2),
        "eta_minutes": round(duration_min, 1),
        "ambulances": ambulances,
        "route_color": route_color,
        "source": source,
        "eta_source": "mappls_live" if mappls_duration_used else "heuristic",
        "weather_delayed": weather_delay > 1.0,
        "road_type": road_type,
    }


async def plan_routes(state: EmergencyState) -> EmergencyState:
    """
    Plan ambulance routes to all allocated hospitals.
    Executes routes in parallel for speed.
    """
    settings = get_settings()
    allocation_by_hospital = {a["hospital"]: a for a in state.allocations}

    tasks = []
    for hospital in state.hospitals:
        allocation = allocation_by_hospital.get(hospital["name"])
        if allocation:
            tasks.append(
                _route_for_hospital(
                    state,
                    hospital,
                    allocation,
                    settings.mappls_api_key,
                )
            )

    if tasks:
        try:
            state.ambulance_routes = await asyncio.gather(*tasks, return_exceptions=False)
            logger.info(f"Planned {len(state.ambulance_routes)} ambulance routes")
        except Exception as exc:
            logger.error(f"Route planning failed: {exc}")
            state.errors.append(f"Route planning failed: {str(exc)[:60]}")
            state.ambulance_routes = []
    else:
        logger.warning("No hospitals to plan routes for")
        state.ambulance_routes = []

    return state
