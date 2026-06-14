from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import IncidentRecord, HospitalAssignment, AmbulanceRoute, DispatchLog
from app.models.emergency_state import EmergencyState


async def save_incident(
    session: AsyncSession,
    state: EmergencyState,
    telemetry_snapshot: dict | None = None,
) -> IncidentRecord:
    """
    Save complete incident record with all dispatch details to database.
    Returns created incident record.
    """
    record = IncidentRecord(
        event_type=state.event_type,
        train_id=state.train_id,
        severity=state.severity,
        casualties=state.casualties,
        lat=state.lat,
        lon=state.lon,
        risk_score=state.risk_score,
        confidence=state.confidence,
        priority_level=state.priority_level,
        response_time=state.response_time,
        total_ambulances=state.total_ambulances,
        dispatch_plan=state.final_dispatch_plan or state.to_dict(),
        telemetry_snapshot=telemetry_snapshot,
        reasoning=state.reasoning,
        errors=state.errors,
    )
    session.add(record)
    await session.flush()  # Get the ID without committing
    
    # Save hospital assignments
    for allocation in state.allocations:
        assignment = HospitalAssignment(
            incident_id=record.id,
            hospital_name=allocation["hospital"],
            hospital_city=allocation.get("hospital_city", "Unknown"),
            hospital_lat=allocation["hospital_lat"],
            hospital_lon=allocation["hospital_lon"],
            assigned_patients=allocation["assigned_patients"],
            ambulances_dispatched=allocation["ambulances_dispatched"],
            trauma_level=allocation["trauma_level"],
            distance_km=allocation.get("distance_km", 0),
        )
        session.add(assignment)
    
    # Save ambulance routes
    for idx, route in enumerate(state.ambulance_routes):
        # Convert path to GeoJSON LineString
        geojson = {
            "type": "LineString",
            "coordinates": route.get("path", []),
        }
        
        ambulance_route = AmbulanceRoute(
            incident_id=record.id,
            hospital_name=route["hospital"],
            distance_km=route["distance_km"],
            eta_minutes=route["eta_minutes"],
            ambulance_count=route.get("ambulances", 1),
            route_source=route.get("source", "unknown"),
            eta_source=route.get("eta_source", "unknown"),
            path_geojson=geojson,
        )
        session.add(ambulance_route)
    
    # Log dispatch decision
    dispatch_log = DispatchLog(
        incident_id=record.id,
        action="incident_dispatch",
        details={
            "severity": state.severity,
            "casualties": state.casualties,
            "hospitals": len(state.allocations),
            "ambulances": state.total_ambulances,
            "llm_source": state.llm_source,
        },
        status="success",
    )
    session.add(dispatch_log)
    
    await session.commit()
    await session.refresh(record)
    return record


async def list_incidents(
    session: AsyncSession,
    limit: int = 50,
    severity: str | None = None,
    train_id: str | None = None,
) -> list[IncidentRecord]:
    """
    List incidents with optional filtering.
    Returns most recent incidents first.
    """
    query = select(IncidentRecord).order_by(IncidentRecord.created_at.desc())
    
    if severity:
        query = query.where(IncidentRecord.severity == severity)
    if train_id:
        query = query.where(IncidentRecord.train_id == train_id)
    
    query = query.limit(limit)
    result = await session.execute(query)
    return list(result.scalars().all())


async def get_incident(session: AsyncSession, incident_id: int) -> IncidentRecord | None:
    """Retrieve a specific incident by ID."""
    result = await session.execute(
        select(IncidentRecord).where(IncidentRecord.id == incident_id)
    )
    return result.scalar_one_or_none()


async def get_incident_with_details(
    session: AsyncSession,
    incident_id: int,
) -> dict | None:
    """
    Retrieve incident with all related records (assignments, routes, logs).
    Returns comprehensive incident data or None.
    """
    incident = await get_incident(session, incident_id)
    if not incident:
        return None
    
    # Fetch related records
    assignments_result = await session.execute(
        select(HospitalAssignment).where(HospitalAssignment.incident_id == incident_id)
    )
    assignments = list(assignments_result.scalars().all())
    
    routes_result = await session.execute(
        select(AmbulanceRoute).where(AmbulanceRoute.incident_id == incident_id)
    )
    routes = list(routes_result.scalars().all())
    
    logs_result = await session.execute(
        select(DispatchLog).where(DispatchLog.incident_id == incident_id)
    )
    logs = list(logs_result.scalars().all())
    
    return {
        "incident": incident,
        "assignments": assignments,
        "routes": routes,
        "logs": logs,
    }


async def log_dispatch_action(
    session: AsyncSession,
    incident_id: int,
    action: str,
    details: dict,
    status: str = "success",
) -> DispatchLog:
    """Log a dispatch action for audit trail."""
    log = DispatchLog(
        incident_id=incident_id,
        action=action,
        details=details,
        status=status,
    )
    session.add(log)
    await session.commit()
    return log


async def get_incident_statistics(
    session: AsyncSession,
    days: int = 30,
) -> dict:
    """
    Get incident statistics for dashboard.
    Returns counts by severity, average casualties, etc.
    """
    # Get timestamp for filtering
    cutoff = datetime.now(timezone.utc)
    from datetime import timedelta
    cutoff = cutoff - timedelta(days=days)
    
    # Get all incidents in period
    result = await session.execute(
        select(IncidentRecord).where(IncidentRecord.created_at >= cutoff)
    )
    incidents = list(result.scalars().all())
    
    # Calculate statistics
    severity_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    total_casualties = 0
    total_ambulances = 0
    
    for incident in incidents:
        severity_counts[incident.severity] = severity_counts.get(incident.severity, 0) + 1
        total_casualties += incident.casualties
        total_ambulances += incident.total_ambulances or 0
    
    return {
        "period_days": days,
        "total_incidents": len(incidents),
        "by_severity": severity_counts,
        "total_casualties": total_casualties,
        "total_ambulances": total_ambulances,
        "average_casualties": total_casualties / len(incidents) if incidents else 0,
    }
