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


def _estimate_duration_min(distance_km: float) -> float:
    # Heavy ambulance average speed ~45 km/h in urban/rural mix
    return max(5.0, (distance_km / 45.0) * 60.0)


async def _fetch_mappls_route(
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float,
    api_key: str,
) -> list[list[float]] | None:
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
        if isinstance(geometry, str):
            return _decode_polyline(geometry)
        if isinstance(geometry, list):
            return geometry
    return None


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
    distance_km = hospital.get(
        "distance_km",
        math.sqrt((state.lat - hospital_lat) ** 2 + (state.lon - hospital_lon) ** 2) * 111,
    )

    path: list[list[float]] | None = None
    source = "interpolated"

    if api_key:
        try:
            path = await _fetch_mappls_route(
                hospital_lat,
                hospital_lon,
                state.lat,
                state.lon,
                api_key,
            )
            if path:
                source = "mappls"
        except Exception as exc:
            state.errors.append(f"Routing failed for {hospital['name']}: {exc}")

    if not path:
        path = _interpolate_route(hospital_lon, hospital_lat, state.lon, state.lat)

    duration_min = _estimate_duration_min(float(distance_km))
    ambulances = allocation["ambulances_dispatched"] if allocation else 1

    return {
        "hospital": hospital["name"],
        "hospital_lat": hospital_lat,
        "hospital_lon": hospital_lon,
        "crash_lat": state.lat,
        "crash_lon": state.lon,
        "path": path,
        "distance_km": round(float(distance_km), 2),
        "eta_minutes": round(duration_min, 1),
        "ambulances": ambulances,
        "route_color": [255, 220, 0],
        "source": source,
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
