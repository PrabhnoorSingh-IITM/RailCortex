from __future__ import annotations

import asyncio
import json
import logging
import math
from pathlib import Path
from typing import Any

import httpx

from app.config import get_settings
from app.models.emergency_state import EmergencyState

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# Load fallback hospital registry
try:
    FALLBACK_HOSPITALS: list[dict] = json.loads(
        (DATA_DIR / "hospitals_fallback.json").read_text(encoding="utf-8")
    )
except Exception as exc:
    logger.warning(f"Failed to load fallback hospitals: {exc}")
    FALLBACK_HOSPITALS = []


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two geographic points in kilometers."""
    radius = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(a))


def _estimate_capacity(tags: dict, distance_km: float) -> int:
    """
    Estimate hospital bed capacity from OSM tags.
    Uses multiple fallback heuristics if explicit data unavailable.
    """
    # Priority 1: Explicit bed count from OSM
    if beds := tags.get("beds"):
        try:
            return max(5, int(beds))
        except (TypeError, ValueError):
            pass

    # Priority 2: Known facility types
    if tags.get("healthcare") == "hospital" and tags.get("emergency") == "yes":
        return 35  # Dedicated trauma center
    if tags.get("amenity") == "hospital" and tags.get("operator"):
        return 28  # Operated facility
    if tags.get("healthcare:speciality") == "trauma":
        return 30  # Trauma specialty
    if tags.get("healthcare:speciality") == "emergency":
        return 25  # Emergency dept
    if tags.get("amenity") == "hospital":
        return 20  # Generic hospital

    # Priority 3: Distance-based heuristic
    # Closer hospitals often have more capacity in major corridors
    return max(10, int(25 - min(distance_km / 2, 10)))


def _estimate_ambulances(capacity: int, distance_km: float, tags: dict) -> int:
    """Estimate ambulance availability based on hospital capacity and emergency status."""
    base = 0
    
    if tags.get("emergency") == "yes":
        base = max(4, capacity // 5)  # 20% of capacity, min 4
    elif tags.get("healthcare:speciality") in ["emergency", "trauma"]:
        base = max(3, capacity // 6)  # ~16% of capacity
    else:
        base = max(2, capacity // 8)  # ~12% of capacity

    # Reduce availability with distance (travel time reduces fleet availability)
    distance_reduction = int(distance_km // 5)
    return max(1, base - distance_reduction)


def _sanitize_hospital_data(element: dict, crash_lat: float, crash_lon: float) -> dict | None:
    """Extract and validate hospital location from OSM element."""
    tags = element.get("tags", {})
    
    # Extract location
    if "lat" in element and "lon" in element:
        lat, lon = element["lat"], element["lon"]
    elif "center" in element:
        lat, lon = element["center"]["lat"], element["center"]["lon"]
    else:
        return None

    # Extract name
    name = tags.get("name") or tags.get("operator") or tags.get("healthcare:type") or "Medical Facility"
    if not name or len(name.strip()) < 2:
        return None

    return {
        "name": name.strip(),
        "city": tags.get("addr:city", tags.get("addr:state", "Unknown")),
        "lat": lat,
        "lon": lon,
        "tags": tags,
        "distance_km": _haversine_km(crash_lat, crash_lon, lat, lon),
    }


def _parse_osm_elements(
    elements: list[dict],
    crash_lat: float,
    crash_lon: float,
    max_results: int = 5,
) -> list[dict]:
    """Parse OSM elements and create hospital records."""
    hospitals: list[dict] = []
    seen: set[str] = set()

    for element in elements:
        hospital_data = _sanitize_hospital_data(element, crash_lat, crash_lon)
        if not hospital_data:
            continue

        # Deduplicate by name
        name = hospital_data["name"]
        if name in seen:
            continue
        seen.add(name)

        tags = hospital_data["tags"]
        capacity = _estimate_capacity(tags, hospital_data["distance_km"])
        
        hospitals.append(
            {
                "name": name,
                "city": hospital_data["city"],
                "capacity": capacity,
                "ambulances": _estimate_ambulances(capacity, hospital_data["distance_km"], tags),
                "trauma_level": 1 if tags.get("emergency") == "yes" else (
                    1 if tags.get("healthcare:speciality") in ["trauma", "emergency"] else 2
                ),
                "lat": hospital_data["lat"],
                "lon": hospital_data["lon"],
                "distance_km": round(hospital_data["distance_km"], 2),
                "source": "osm",
                "capacity_source": "osm_tags" if tags.get("beds") else "estimated",
                "tags": tags,
            }
        )

    # Sort by distance, then by trauma level
    hospitals.sort(key=lambda h: (h["distance_km"], h["trauma_level"]))
    return hospitals[:max_results]


async def fetch_hospitals_from_osm(lat: float, lon: float, radius_m: int) -> list[dict]:
    """
    Fetch hospitals from OpenStreetMap Overpass API.
    Queries for multiple hospital types and emergency facilities.
    """
    settings = get_settings()
    
    query = f"""
    [out:json][timeout:30];
    (
      node["amenity"="hospital"](around:{radius_m},{lat},{lon});
      way["amenity"="hospital"](around:{radius_m},{lat},{lon});
      node["healthcare"="hospital"](around:{radius_m},{lat},{lon});
      way["healthcare"="hospital"](around:{radius_m},{lat},{lon});
      node["emergency"="yes"](around:{radius_m},{lat},{lon});
    );
    out center;
    """.strip()

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                settings.overpass_api_url,
                data={"data": query},
                headers={"User-Agent": "RailCortex/1.0 emergency-response"},
                retry=3,  # Automatic retries
            )
            response.raise_for_status()
            payload = response.json()
            hospitals = _parse_osm_elements(payload.get("elements", []), lat, lon)
            logger.info(f"Found {len(hospitals)} hospitals within {radius_m}m of ({lat}, {lon})")
            return hospitals
    except Exception as exc:
        logger.error(f"OSM API error for radius {radius_m}m: {exc}")
        raise


def _geo_aware_fallback(crash_lat: float, crash_lon: float, max_results: int = 5) -> list[dict]:
    """
    Use geo-aware static registry as fallback.
    Selects nearest hospitals from national database.
    """
    if not FALLBACK_HOSPITALS:
        logger.warning("Fallback hospital registry is empty")
        return []

    ranked = []
    for hospital in FALLBACK_HOSPITALS:
        try:
            distance_km = _haversine_km(crash_lat, crash_lon, hospital.get("lat", 0), hospital.get("lon", 0))
            ranked.append(
                {
                    **hospital,
                    "distance_km": round(distance_km, 2),
                    "source": "fallback_registry",
                    "capacity_source": "static",
                }
            )
        except Exception as exc:
            logger.warning(f"Failed to process fallback hospital: {exc}")
            continue

    ranked.sort(key=lambda h: h["distance_km"])
    selected = ranked[:max_results]
    logger.info(f"Selected {len(selected)} fallback hospitals for ({crash_lat}, {crash_lon})")
    return selected


def _allocate_patients(state: EmergencyState, hospitals: list[dict]) -> list[dict]:
    """
    Allocate casualties to hospitals based on capacity.
    Respects maximum per-hospital capacity and prioritizes trauma centers.
    """
    casualties_remaining = state.casualties
    allocations = []

    for hospital in hospitals:
        if casualties_remaining <= 0:
            break

        # Allocate min of hospital capacity or remaining casualties
        assigned = min(hospital["capacity"], casualties_remaining)
        
        # Calculate ambulance count (roughly 1 ambulance per 4 patients)
        ambulance_count = max(1, assigned // 4)
        
        # Cap at hospital's available ambulances
        ambulance_count = min(ambulance_count, hospital.get("ambulances", ambulance_count))

        allocations.append(
            {
                "hospital": hospital["name"],
                "hospital_city": hospital.get("city", "Unknown"),
                "assigned_patients": assigned,
                "ambulances_dispatched": ambulance_count,
                "trauma_level": hospital.get("trauma_level", 2),
                "hospital_lat": hospital["lat"],
                "hospital_lon": hospital["lon"],
                "distance_km": hospital.get("distance_km", 0),
                "hospital_capacity": hospital.get("capacity", 0),
                "hospital_ambulances": hospital.get("ambulances", 0),
            }
        )
        casualties_remaining -= assigned

    logger.info(f"Allocated {state.casualties - casualties_remaining} of {state.casualties} casualties")
    return allocations


async def find_hospitals(state: EmergencyState) -> EmergencyState:
    """
    Main entry point for hospital search.
    Starts with initial radius, expands on failure.
    """
    settings = get_settings()
    hospitals: list[dict] = []
    search_radii = settings.hospital_search_radii_m

    # Try each radius sequentially
    for idx, radius in enumerate(search_radii):
        try:
            logger.info(f"Searching for hospitals at radius {radius}m (attempt {idx + 1}/{len(search_radii)})")
            hospitals = await fetch_hospitals_from_osm(state.lat, state.lon, radius)
            
            if hospitals:
                state.search_radius_used_m = radius
                state.hospitals = hospitals
                state.allocations = _allocate_patients(state, hospitals)
                logger.info(f"Found {len(hospitals)} hospitals at {radius}m radius")
                return state
            
            logger.warning(f"No hospitals found at {radius}m radius; expanding search")
            
        except Exception as exc:
            logger.error(f"Hospital search failed at radius {radius}m: {exc}")
            state.errors.append(f"OSM lookup failed at {radius / 1000:.0f} km: {str(exc)[:80]}")
            
            # Add small delay before retry
            if idx < len(search_radii) - 1:
                await asyncio.sleep(0.5)

    # Fallback to static registry
    try:
        logger.warning("All OSM searches failed; falling back to static hospital registry")
        hospitals = _geo_aware_fallback(state.lat, state.lon, max_results=5)
        
        if hospitals:
            state.hospitals = hospitals
            state.search_radius_used_m = search_radii[-1]
            state.allocations = _allocate_patients(state, hospitals)
            state.errors.append("OSM API unavailable; using static national hospital registry")
            return state
    except Exception as exc:
        logger.error(f"Fallback registry failed: {exc}")
        state.errors.append(f"Fallback hospital lookup failed: {str(exc)[:80]}")

    # Last resort: empty allocation
    logger.critical("All hospital lookup methods failed")
    state.hospitals = []
    state.allocations = []
    state.errors.append("CRITICAL: Unable to locate hospitals; check network/OSM API status")
    
    return state
