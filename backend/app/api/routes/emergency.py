from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.graph import run_emergency_pipeline
from app.db.database import get_db_session
from app.middleware.auth import verify_api_key
from app.models.emergency_state import EmergencyState
from app.schemas.emergency import (
    DispatchPlanResponse,
    EmergencyTriggerRequest,
    IncidentDetail,
    IncidentSummary,
)
from app.services.incident_store import get_incident, list_incidents, save_incident
from app.services.telemetry_simulator import telemetry_simulator
from app.services.weather_service import fetch_live_weather, weather_delay_multiplier
from app.services.websocket_manager import ws_manager

router = APIRouter(
    prefix="/api/v1/emergency",
    tags=["emergency"],
    dependencies=[Depends(verify_api_key)],
)


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


def _state_to_response(state: EmergencyState, incident_id: int | None = None) -> DispatchPlanResponse:
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
        dispatch_report_structured=state.dispatch_report_structured,
        llm_source=state.llm_source,
        search_radius_used_m=state.search_radius_used_m,
        final_dispatch_plan=state.final_dispatch_plan,
        errors=state.errors,
        incident_id=incident_id,
    )


@router.post("/trigger", response_model=DispatchPlanResponse)
async def trigger_emergency(
    payload: EmergencyTriggerRequest,
    session: AsyncSession = Depends(get_db_session),
) -> DispatchPlanResponse:
    await ws_manager.broadcast_emergency_state(
        active=True,
        message=f"Emergency triggered: {payload.event_type} on train {payload.train_id}",
    )

    try:
        state = _payload_to_state(payload)

        live_weather = await fetch_live_weather(state.lat, state.lon)
        if live_weather:
            state.temperature = live_weather.temp_c
            state.humidity = live_weather.humidity
            state.incident_data["live_weather"] = live_weather.model_dump()
            delay = weather_delay_multiplier(live_weather.humidity, live_weather.temp_c)
            if delay > 1.0:
                state.incident_data["weather_delay_active"] = True
                state.incident_data["weather_delay_factor"] = delay

        result = await run_emergency_pipeline(state)
        telemetry_snapshot = {
            "trains": [train.model_dump(mode="json") for train in telemetry_simulator.tick()],
            "weather_active": telemetry_simulator.weather_active,
            "last_optimization": telemetry_simulator.last_optimization,
        }
        record = await save_incident(session, result, telemetry_snapshot=telemetry_snapshot)
        response = _state_to_response(result, incident_id=record.id)

        await ws_manager.broadcast_dispatch_plan(response.model_dump(mode="json"))
        return response
    except Exception as exc:
        await ws_manager.broadcast_emergency_state(
            active=True,
            message=f"Emergency pipeline error: {exc}",
        )
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/history", response_model=list[IncidentSummary])
async def emergency_history(
    limit: int = 50,
    session: AsyncSession = Depends(get_db_session),
) -> list[IncidentSummary]:
    records = await list_incidents(session, limit=limit)
    return [
        IncidentSummary(
            id=record.id,
            event_type=record.event_type,
            train_id=record.train_id,
            severity=record.severity,
            casualties=record.casualties,
            lat=record.lat,
            lon=record.lon,
            created_at=record.created_at,
        )
        for record in records
    ]


@router.get("/history/{incident_id}", response_model=IncidentDetail)
async def emergency_detail(
    incident_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> IncidentDetail:
    record = await get_incident(session, incident_id)
    if not record:
        raise HTTPException(status_code=404, detail="Incident not found")
    return IncidentDetail(
        id=record.id,
        event_type=record.event_type,
        train_id=record.train_id,
        severity=record.severity,
        casualties=record.casualties,
        lat=record.lat,
        lon=record.lon,
        created_at=record.created_at,
        dispatch_plan=record.dispatch_plan,
        telemetry_snapshot=record.telemetry_snapshot,
    )


@router.post("/reset")
async def reset_emergency() -> dict:
    await ws_manager.broadcast_emergency_state(active=False, message="Normal operations resumed")
    return {"status": "ok", "emergency_active": False}
