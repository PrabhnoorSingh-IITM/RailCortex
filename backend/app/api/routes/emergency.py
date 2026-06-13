from fastapi import APIRouter, HTTPException

from app.agents.graph import run_emergency_pipeline
from app.models.emergency_state import EmergencyState
from app.schemas.emergency import DispatchPlanResponse, EmergencyTriggerRequest
from app.services.websocket_manager import ws_manager

router = APIRouter(prefix="/api/v1/emergency", tags=["emergency"])


def _payload_to_state(payload: EmergencyTriggerRequest) -> EmergencyState:
    sensor = payload.sensor_data
    return EmergencyState(
        peak_g_force=sensor.peak_g_force,
        velocity_kmh=payload.velocity_kmh,
        lat=payload.location.lat,
        lon=payload.location.lon,
        temperature=sensor.weather.temp_c,
        humidity=sensor.weather.humidity,
        obstacle_distance=sensor.obstacle_distance_mm,
        event_type=payload.event_type,
        train_id=payload.train_id,
        incident_data=payload.model_dump(mode="json"),
    )


def _state_to_response(state: EmergencyState) -> DispatchPlanResponse:
    return DispatchPlanResponse(
        event_type=state.event_type,
        train_id=state.train_id,
        severity=state.severity,
        casualties=state.casualties,
        risk_score=state.risk_score,
        confidence=state.confidence,
        reasoning=state.reasoning,
        priority_level=state.priority_level,
        response_time=state.response_time,
        total_ambulances=state.total_ambulances,
        hospitals=state.hospitals,
        allocations=state.allocations,
        ambulance_routes=state.ambulance_routes,
        dispatch_report=state.dispatch_report,
        final_dispatch_plan=state.final_dispatch_plan,
        errors=state.errors,
    )


@router.post("/trigger", response_model=DispatchPlanResponse)
async def trigger_emergency(payload: EmergencyTriggerRequest) -> DispatchPlanResponse:
    await ws_manager.broadcast_emergency_state(
        active=True,
        message=f"Emergency triggered: {payload.event_type} on train {payload.train_id}",
    )

    try:
        state = _payload_to_state(payload)
        result = await run_emergency_pipeline(state)
        response = _state_to_response(result)

        await ws_manager.broadcast_dispatch_plan(response.model_dump(mode="json"))
        return response
    except Exception as exc:
        await ws_manager.broadcast_emergency_state(
            active=True,
            message=f"Emergency pipeline error: {exc}",
        )
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/reset")
async def reset_emergency() -> dict:
    await ws_manager.broadcast_emergency_state(active=False, message="Normal operations resumed")
    return {"status": "ok", "emergency_active": False}
