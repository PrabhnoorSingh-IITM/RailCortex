from __future__ import annotations

import json
import math
from pathlib import Path

import httpx

from app.config import get_settings
from app.models.emergency_state import EmergencyState

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
FALLBACK_HOSPITALS: list[dict] = json.loads(
    (DATA_DIR / "hospitals_fallback.json").read_text(encoding="utf-8")
)


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(a))


def _estimate_capacity(tags: dict, distance_km: float) -> int:
    if beds := tags.get("beds"):
        try:
            return max(5, int(beds))
        except (TypeError, ValueError):
            pass

    if tags.get("healthcare") == "hospital" and tags.get("emergency") == "yes":
        return 35
    if tags.get("amenity") == "hospital" and tags.get("operator"):
        return 28
    if tags.get("healthcare:speciality") == "trauma":
        return 30

    return max(10, 25 - int(distance_km))


def _estimate_ambulances(capacity: int, distance_km: float, tags: dict) -> int:
    if tags.get("emergency") == "yes":
        base = max(4, capacity // 5)
    else:
        base = max(2, capacity // 8)
    return max(1, base - int(distance_km // 5))


def _parse_osm_elements(elements: list[dict], crash_lat: float, crash_lon: float) -> list[dict]:
    hospitals: list[dict] = []
    seen: set[str] = set()

    for element in elements:
        tags = element.get("tags", {})
        name = tags.get("name") or tags.get("operator") or "Hospital"
        if name in seen:
            continue
        seen.add(name)

        if "lat" in element and "lon" in element:
            lat, lon = element["lat"], element["lon"]
        elif "center" in element:
            lat, lon = element["center"]["lat"], element["center"]["lon"]
        else:
            continue

        distance_km = _haversine_km(crash_lat, crash_lon, lat, lon)
        capacity = _estimate_capacity(tags, distance_km)
        hospitals.append(
            {
                "name": name,
                "city": tags.get("addr:city", tags.get("addr:state", "Unknown")),
                "capacity": capacity,
                "ambulances": _estimate_ambulances(capacity, distance_km, tags),
                "trauma_level": 1 if tags.get("emergency") == "yes" else 2,
                "lat": lat,
                "lon": lon,
                "distance_km": round(distance_km, 2),
                "source": "osm",
                "capacity_source": "osm_tags" if tags.get("beds") else "estimated",
            }
        )

    hospitals.sort(key=lambda h: h.get("distance_km", 999))
    return hospitals[:5]


async def fetch_hospitals_from_osm(lat: float, lon: float, radius_m: int) -> list[dict]:
    settings = get_settings()
    query = f"""
    [out:json][timeout:25];
  node["amenity"="hospital"](around:{radius_m},{lat},{lon});
  way["amenity"="hospital"](around:{radius_m},{lat},{lon});
  out center geom;
    """.strip()

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            settings.overpass_api_url,
            data={"data": query},
            headers={"User-Agent": "RailCortex/1.0 emergency-response"},
        )
        response.raise_for_status()
        payload = response.json()
        return _parse_osm_elements(payload.get("elements", []), lat, lon)


def _geo_aware_fallback(crash_lat: float, crash_lon: float, max_results: int = 5) -> list[dict]:
    ranked = []
    for hospital in FALLBACK_HOSPITALS:
        distance_km = _haversine_km(crash_lat, crash_lon, hospital["lat"], hospital["lon"])
        ranked.append(
            {
                **hospital,
                "distance_km": round(distance_km, 2),
                "source": "geo_fallback",
                "capacity_source": "static_registry",
            }
        )
    ranked.sort(key=lambda h: h["distance_km"])
    return ranked[:max_results]


def _allocate_patients(state: EmergencyState, hospitals: list[dict]) -> list[dict]:
    casualties_remaining = state.casualties
    allocations = []

    for hospital in hospitals:
        if casualties_remaining <= 0:
            break

        assigned = min(hospital["capacity"], casualties_remaining)
        ambulance_count = max(1, assigned // 4)
        ambulance_count = min(ambulance_count, hospital.get("ambulances", ambulance_count))

        allocations.append(
            {
                "hospital": hospital["name"],
                "assigned_patients": assigned,
                "ambulances_dispatched": ambulance_count,
                "trauma_level": hospital.get("trauma_level", 2),
                "hospital_lat": hospital["lat"],
                "hospital_lon": hospital["lon"],
            }
        )
        casualties_remaining -= assigned

    return allocations


async def find_hospitals(state: EmergencyState, radius_m: int | None = None) -> EmergencyState:
    settings = get_settings()
    search_radii = [radius_m] if radius_m else [settings.hospital_search_radii_m[0]]
    hospitals: list[dict] = []
    last_error: str | None = None

    for radius in search_radii:
        try:
            hospitals = await fetch_hospitals_from_osm(state.lat, state.lon, radius)
            if hospitals:
                state.search_radius_used_m = radius
                break
            last_error = f"No hospitals found within {radius / 1000:.0f} km"
        except Exception as exc:
            last_error = f"OSM lookup failed at {radius / 1000:.0f} km: {exc}"
            state.errors.append(last_error)

    state.hospitals = hospitals
    state.allocations = _allocate_patients(state, hospitals) if hospitals else []
    return state


async def expand_hospital_search(state: EmergencyState) -> EmergencyState:
    """LangGraph node: widen search when initial medical lookup returned nothing."""
    if state.hospitals:
        return state

    settings = get_settings()
    used = state.search_radius_used_m or settings.hospital_search_radii_m[0]
    wider_radii = [r for r in settings.hospital_search_radii_m if r > used]

    for radius in wider_radii:
        try:
            hospitals = await fetch_hospitals_from_osm(state.lat, state.lon, radius)
            if hospitals:
                state.hospitals = hospitals
                state.search_radius_used_m = radius
                state.allocations = _allocate_patients(state, hospitals)
                state.errors.append(f"Hospital search expanded to {radius / 1000:.0f} km radius")
                return state
        except Exception as exc:
            state.errors.append(f"Expanded OSM lookup failed at {radius / 1000:.0f} km: {exc}")

    state.hospitals = _geo_aware_fallback(state.lat, state.lon)
    state.search_radius_used_m = wider_radii[-1] if wider_radii else used
    state.allocations = _allocate_patients(state, state.hospitals)
    state.errors.append("Expanded search exhausted; using geo-aware national hospital registry")
    return state
