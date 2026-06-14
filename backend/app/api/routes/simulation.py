from fastapi import APIRouter, Depends

from app.middleware.auth import verify_api_key
from app.schemas.simulation import (
    LiveWeatherResponse,
    WeatherInjectionRequest,
    WeatherInjectionResponse,
)
from app.services.milp_solver import solve_train_rerouting
from app.services.telemetry_simulator import telemetry_simulator
from app.services.weather_service import fetch_live_weather, weather_delay_multiplier
from app.services.websocket_manager import ws_manager

router = APIRouter(
    prefix="/api/v1/simulation",
    tags=["simulation"],
    dependencies=[Depends(verify_api_key)],
)


def _active_corridor_centroid() -> tuple[float, float]:
    trains = telemetry_simulator.trains
    if not trains:
        return 26.8467, 80.9462

    index = min(trains[0].current_index, len(trains[0].path) - 1)
    lon, lat = trains[0].path[index]
    return lat, lon


@router.get("/weather/live", response_model=LiveWeatherResponse)
async def get_live_weather() -> LiveWeatherResponse:
    lat, lon = _active_corridor_centroid()
    live = await fetch_live_weather(lat, lon)
    if not live:
        return LiveWeatherResponse(
            status="unavailable",
            lat=lat,
            lon=lon,
            temp_c=30.0,
            humidity=60.0,
            delay_multiplier=1.0,
            source="default",
        )

    delay = weather_delay_multiplier(live.humidity, live.temp_c)
    return LiveWeatherResponse(
        status="ok",
        lat=lat,
        lon=lon,
        temp_c=live.temp_c,
        humidity=live.humidity,
        delay_multiplier=delay,
        source="openweathermap",
    )


@router.post("/weather", response_model=WeatherInjectionResponse)
async def inject_weather(payload: WeatherInjectionRequest) -> WeatherInjectionResponse:
    if ws_manager.emergency_active:
        return WeatherInjectionResponse(
            status="blocked",
            message="Weather simulation blocked while emergency response is active",
            trains_rerouted=0,
            total_delay_added_sec=0.0,
            optimization_summary={},
        )

    live_weather = None
    delay_multiplier = payload.delay_multiplier

    if payload.use_live_weather:
        lat, lon = _active_corridor_centroid()
        live = await fetch_live_weather(lat, lon)
        if live:
            live_weather = {
                "lat": lat,
                "lon": lon,
                "temp_c": live.temp_c,
                "humidity": live.humidity,
            }
            delay_multiplier = max(payload.delay_multiplier, weather_delay_multiplier(live.humidity, live.temp_c))

    telemetry_simulator.weather_active = True
    assignments, delay_map, summary = solve_train_rerouting(
        telemetry_simulator,
        delay_multiplier=delay_multiplier,
    )

    rerouted = telemetry_simulator.apply_rerouting(assignments, delay_map)
    telemetry_simulator.last_optimization = summary

    trains = telemetry_simulator.tick()
    weather_note = ""
    if live_weather:
        weather_note = (
            f" Live weather: {live_weather['temp_c']:.1f}°C, "
            f"{live_weather['humidity']:.0f}% humidity."
        )

    message = (
        f"{payload.intensity.title()} rain injected on {payload.affected_region}."
        f"{weather_note} MILP rerouted {rerouted} trains."
    )

    await ws_manager.broadcast_weather_alert(message, trains=trains)

    return WeatherInjectionResponse(
        status="ok",
        message=message,
        trains_rerouted=rerouted,
        total_delay_added_sec=summary.get("total_delay_added_sec", 0.0),
        optimization_summary=summary,
        live_weather=live_weather,
    )


@router.post("/reset")
async def reset_simulation() -> dict:
    telemetry_simulator.reset()
    await ws_manager.broadcast_emergency_state(active=False, message="Simulation reset")
    return {"status": "ok", "message": "Telemetry simulation reset to baseline"}
