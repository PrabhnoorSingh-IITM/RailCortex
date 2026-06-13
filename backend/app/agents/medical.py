import math

import httpx

from app.config import get_settings
from app.models.emergency_state import EmergencyState

FALLBACK_HOSPITALS = [
    {
        "name": "GSVM Medical College",
        "city": "Kanpur",
        "capacity": 25,
        "ambulances": 6,
        "trauma_level": 1,
        "lat": 26.4750,
        "lon": 80.3315,
    },
    {
        "name": "Lala Lajpat Rai Hospital",
        "city": "Kanpur",
        "capacity": 20,
        "ambulances": 5,
        "trauma_level": 1,
        "lat": 26.4490,
        "lon": 80.3500,
    },
    {
        "name": "Regency Hospital",
        "city": "Kanpur",
        "capacity": 15,
        "ambulances": 4,
        "trauma_level": 2,
        "lat": 26.4300,
        "lon": 80.3200,
    },
]


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(a))


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
        hospitals.append(
            {
                "name": name,
                "city": tags.get("addr:city", "Unknown"),
                "capacity": 20,
                "ambulances": max(2, int(8 - distance_km)),
                "trauma_level": 1 if tags.get("emergency") == "yes" else 2,
                "lat": lat,
                "lon": lon,
                "distance_km": round(distance_km, 2),
                "source": "osm",
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
        )
        response.raise_for_status()
        payload = response.json()
        return _parse_osm_elements(payload.get("elements", []), lat, lon)


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


async def find_hospitals(state: EmergencyState) -> EmergencyState:
    settings = get_settings()
    hospitals: list[dict] = []

    try:
        hospitals = await fetch_hospitals_from_osm(
            state.lat,
            state.lon,
            settings.hospital_search_radius_m,
        )
    except Exception as exc:
        state.errors.append(f"OSM lookup failed: {exc}")

    if not hospitals:
        hospitals = [
            {
                **h,
                "distance_km": round(_haversine_km(state.lat, state.lon, h["lat"], h["lon"]), 2),
                "source": "fallback",
            }
            for h in FALLBACK_HOSPITALS
        ]
        hospitals.sort(key=lambda h: h["distance_km"])

    state.hospitals = hospitals
    state.allocations = _allocate_patients(state, hospitals)
    return state
