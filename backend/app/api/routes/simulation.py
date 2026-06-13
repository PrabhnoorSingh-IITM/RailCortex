from fastapi import APIRouter

from app.schemas.simulation import WeatherInjectionRequest, WeatherInjectionResponse
from app.services.milp_solver import solve_train_rerouting
from app.services.telemetry_simulator import telemetry_simulator
from app.services.websocket_manager import ws_manager

router = APIRouter(prefix="/api/v1/simulation", tags=["simulation"])


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

    telemetry_simulator.weather_active = True
    assignments, delay_map, summary = solve_train_rerouting(
        telemetry_simulator,
        delay_multiplier=payload.delay_multiplier,
    )

    rerouted = telemetry_simulator.apply_rerouting(assignments, delay_map)
    telemetry_simulator.last_optimization = summary

    trains = telemetry_simulator.tick()
    message = (
        f"{payload.intensity.title()} rain injected on {payload.affected_region}. "
        f"MILP rerouted {rerouted} trains."
    )

    await ws_manager.broadcast_weather_alert(message, trains=trains)

    return WeatherInjectionResponse(
        status="ok",
        message=message,
        trains_rerouted=rerouted,
        total_delay_added_sec=summary.get("total_delay_added_sec", 0.0),
        optimization_summary=summary,
    )


@router.post("/reset")
async def reset_simulation() -> dict:
    telemetry_simulator.reset()
    await ws_manager.broadcast_emergency_state(active=False, message="Simulation reset")
    return {"status": "ok", "message": "Telemetry simulation reset to baseline"}
