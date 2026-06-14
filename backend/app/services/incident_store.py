from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import IncidentRecord
from app.models.emergency_state import EmergencyState


async def save_incident(
    session: AsyncSession,
    state: EmergencyState,
    telemetry_snapshot: dict | None = None,
) -> IncidentRecord:
    record = IncidentRecord(
        event_type=state.event_type,
        train_id=state.train_id,
        severity=state.severity,
        casualties=state.casualties,
        lat=state.lat,
        lon=state.lon,
        dispatch_plan=state.final_dispatch_plan or state.to_dict(),
        telemetry_snapshot=telemetry_snapshot,
    )
    session.add(record)
    await session.commit()
    await session.refresh(record)
    return record


async def list_incidents(session: AsyncSession, limit: int = 50) -> list[IncidentRecord]:
    result = await session.execute(
        select(IncidentRecord).order_by(IncidentRecord.created_at.desc()).limit(limit)
    )
    return list(result.scalars().all())


async def get_incident(session: AsyncSession, incident_id: int) -> IncidentRecord | None:
    result = await session.execute(
        select(IncidentRecord).where(IncidentRecord.id == incident_id)
    )
    return result.scalar_one_or_none()
