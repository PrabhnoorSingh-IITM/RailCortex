from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, JSON, String, Text, Index
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class IncidentRecord(Base):
    """Complete record of emergency incident with full dispatch details."""
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # Incident identification
    event_type: Mapped[str] = mapped_column(String(32), index=True)
    train_id: Mapped[str] = mapped_column(String(64), index=True)
    
    # Location and severity
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    severity: Mapped[str] = mapped_column(String(16), index=True)
    casualties: Mapped[int] = mapped_column(Integer)
    risk_score: Mapped[float] = mapped_column(Float, nullable=True)
    confidence: Mapped[float] = mapped_column(Float, nullable=True)
    
    # Dispatch information
    priority_level: Mapped[str] = mapped_column(String(16), nullable=True)
    response_time: Mapped[str] = mapped_column(String(64), nullable=True)
    total_ambulances: Mapped[int] = mapped_column(Integer, nullable=True)
    
    # Full dispatch plan and telemetry
    dispatch_plan: Mapped[dict] = mapped_column(JSON)
    telemetry_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    reasoning: Mapped[list | None] = mapped_column(JSON, nullable=True)
    errors: Mapped[list | None] = mapped_column(JSON, nullable=True)
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Indexing for common queries
    __table_args__ = (
        Index('idx_train_created', 'train_id', 'created_at'),
        Index('idx_severity_created', 'severity', 'created_at'),
    )


class HospitalAssignment(Base):
    """Track hospital assignments during incident response."""
    __tablename__ = "hospital_assignments"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    incident_id: Mapped[int] = mapped_column(Integer, index=True)
    
    hospital_name: Mapped[str] = mapped_column(String(255))
    hospital_city: Mapped[str] = mapped_column(String(128))
    hospital_lat: Mapped[float] = mapped_column(Float)
    hospital_lon: Mapped[float] = mapped_column(Float)
    
    assigned_patients: Mapped[int] = mapped_column(Integer)
    ambulances_dispatched: Mapped[int] = mapped_column(Integer)
    trauma_level: Mapped[int] = mapped_column(Integer)
    distance_km: Mapped[float] = mapped_column(Float)
    
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )


class AmbulanceRoute(Base):
    """Track ambulance routing for each hospital assignment."""
    __tablename__ = "ambulance_routes"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    incident_id: Mapped[int] = mapped_column(Integer, index=True)
    assignment_id: Mapped[int] = mapped_column(Integer, nullable=True)
    
    hospital_name: Mapped[str] = mapped_column(String(255))
    distance_km: Mapped[float] = mapped_column(Float)
    eta_minutes: Mapped[float] = mapped_column(Float)
    ambulance_count: Mapped[int] = mapped_column(Integer)
    
    route_source: Mapped[str] = mapped_column(String(32))  # "mappls_live" | "heuristic" | "fallback_linear"
    eta_source: Mapped[str] = mapped_column(String(32))
    
    path_geojson: Mapped[dict] = mapped_column(JSON)  # GeoJSON LineString
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )


class DispatchLog(Base):
    """Audit log for dispatch operations and decisions."""
    __tablename__ = "dispatch_logs"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    incident_id: Mapped[int] = mapped_column(Integer, index=True)
    
    action: Mapped[str] = mapped_column(String(128))
    details: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(32))  # "success" | "warning" | "error"
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )


class MLModelMetrics(Base):
    """Track ML model performance metrics for continuous improvement."""
    __tablename__ = "ml_metrics"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    incident_id: Mapped[int] = mapped_column(Integer, nullable=True, index=True)
    
    model_type: Mapped[str] = mapped_column(String(32))  # "severity" | "casualty"
    prediction: Mapped[str | int] = mapped_column(String(64))
    confidence: Mapped[float] = mapped_column(Float)
    
    shap_available: Mapped[bool] = mapped_column(default=False)
    feature_importance: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
