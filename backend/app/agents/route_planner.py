from __future__ import annotations

import asyncio
import math

import httpx

from app.config import get_settings
from app.models.emergency_state import EmergencyState


def _interpolate_route(
    origin_lon: float,
    origin_lat: float,
    dest_lon: float,
    dest_lat: float,
    points: int = 12,
) -> list[list[float]]:
    """Fallback geometry when routing API is unavailable."""
    path = []
    for i in range(points + 1):
        t = i / points
        lon = origin_lon + (dest_lon - origin_lon) * t
        lat = origin_lat + (dest_lat - origin_lat) * t
        path.append([lon, lat])
    return path


def _path_distance_km(path: list[list[float]]) -> float:
    total = 0.0
    for idx in range(1, len(path)):
        lon1, lat1 = path[idx - 1]
        lon2, lat2 = path[idx]
        total += math.sqrt((lat2 - lat1) ** 2 + (lon2 - lon1) ** 2) * 111
    return total


def _estimate_duration_min(
    distance_km: float,
    *,
    weather_delay_factor: float = 1.0,
    urban_factor: float = 1.0,
) -> float:
    # Base ambulance speed varies by distance: slower in dense urban segments
    base_speed_kmh = 45.0 / max(urban_factor, 1.0)
    adjusted_speed = max(25.0, base_speed_kmh / max(weather_delay_factor, 1.0))
    return max(5.0, (distance_km / adjusted_speed) * 60.0)


async def _fetch_mappls_route(
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float,
    api_key: str,
) -> dict | None:
    settings = get_settings()
    url = (
        f"{settings.mappls_routes_url}/{origin_lat},{origin_lon};"
        f"{dest_lat},{dest_lon}"
    )
    params = {"rtype": "1", "region": "ind", "access_token": api_key}

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, params=params)
        if response.status_code != 200:
            return None
        data = response.json()
        routes = data.get("routes") or data.get("route") or []
        if not routes:
            return None

        route = routes[0] if isinstance(routes, list) else routes
        geometry = route.get("geometry") or route.get("polyline")
        path: list[list[float]] | None = None

        if isinstance(geometry, str):
            path = _decode_polyline(geometry)
        elif isinstance(geometry, list):
            path = geometry

        if not path:
            return None

        duration_sec = route.get("duration") or route.get("duration_sec") or route.get("time")
        distance_m = route.get("distance") or route.get("distance_m")

        return {
            "path": path,
            "duration_sec": float(duration_sec) if duration_sec else None,
            "distance_km": float(distance_m) / 1000.0 if distance_m else _path_distance_km(path),
        }


def _decode_polyline(encoded: str) -> list[list[float]]:
    """Decode Google/Mappls encoded polyline into [lon, lat] pairs."""
    coordinates: list[list[float]] = []
    index = 0
    lat = 0
    lon = 0

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


async def _route_for_hospital(
    state: EmergencyState,
    hospital: dict,
    allocation: dict | None,
    api_key: str,
) -> dict:
    hospital_lat = hospital["lat"]
    hospital_lon = hospital["lon"]
    straight_line_km = hospital.get(
        "distance_km",
        math.sqrt((state.lat - hospital_lat) ** 2 + (state.lon - hospital_lon) ** 2) * 111,
    )

    path: list[list[float]] | None = None
    source = "interpolated"
    duration_min: float | None = None
    route_distance_km = float(straight_line_km)
    mappls_duration_used = False

    weather_delay = 1.15 if state.incident_data.get("weather_delay_active") else 1.0
    urban_factor = 1.2 if route_distance_km < 15 else 1.0

    if api_key:
        try:
            route_data = await _fetch_mappls_route(
                hospital_lat,
                hospital_lon,
                state.lat,
                state.lon,
                api_key,
            )
            if route_data:
                path = route_data["path"]
                route_distance_km = route_data["distance_km"]
                source = "mappls"
                if route_data["duration_sec"]:
                    duration_min = max(5.0, route_data["duration_sec"] / 60.0 * weather_delay)
                    mappls_duration_used = True
        except Exception as exc:
            state.errors.append(f"Routing failed for {hospital['name']}: {exc}")

    if not path:
        path = _interpolate_route(hospital_lon, hospital_lat, state.lon, state.lat)
        route_distance_km = _path_distance_km(path)
        source = "interpolated"
        state.errors.append(
            f"Mappls unavailable for {hospital['name']}; using straight-line fallback geometry"
        )

    if duration_min is None:
        duration_min = _estimate_duration_min(
            route_distance_km,
            weather_delay_factor=weather_delay,
            urban_factor=urban_factor,
        )

    ambulances = allocation["ambulances_dispatched"] if allocation else 1

    return {
        "hospital": hospital["name"],
        "hospital_lat": hospital_lat,
        "hospital_lon": hospital_lon,
        "crash_lat": state.lat,
        "crash_lon": state.lon,
        "path": path,
        "distance_km": round(route_distance_km, 2),
        "eta_minutes": round(duration_min, 1),
        "ambulances": ambulances,
        "route_color": [255, 220, 0],
        "source": source,
        "eta_source": "mappls_live" if mappls_duration_used else "heuristic",
    }


async def plan_routes(state: EmergencyState) -> EmergencyState:
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
        state.ambulance_routes = await asyncio.gather(*tasks)
    else:
        state.ambulance_routes = []

    return state
