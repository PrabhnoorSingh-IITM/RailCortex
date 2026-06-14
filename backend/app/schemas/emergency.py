from datetime import datetime

from pydantic import BaseModel, Field


class SensorWeather(BaseModel):
    temp_c: float = 30.0
    humidity: float = 60.0


class SensorData(BaseModel):
    peak_g_force: float
    orientation_x: float = 0.0
    obstacle_distance_mm: float = 100.0
    weather: SensorWeather = Field(default_factory=SensorWeather)


class Location(BaseModel):
    lat: float
    lon: float


class EmergencyTriggerRequest(BaseModel):
    event_type: str = "DERAILMENT"
    train_id: str = "RAJ-12345"
    sensor_data: SensorData
    location: Location
    velocity_kmh: float
    timestamp: datetime | None = None


class DispatchPlanResponse(BaseModel):
    event_type: str
    train_id: str
    severity: str
    casualties: int
    risk_score: float
    confidence: float
    reasoning: list[str]
    priority_level: str
    response_time: str
    total_ambulances: int
    hospitals: list[dict]
    allocations: list[dict]
    ambulance_routes: list[dict]
    dispatch_report: str
    dispatch_report_structured: dict = Field(default_factory=dict)
    llm_source: str = ""
    search_radius_used_m: int = 0
    final_dispatch_plan: dict
    errors: list[str] = Field(default_factory=list)
    incident_id: int | None = None


class IncidentSummary(BaseModel):
    id: int
    event_type: str
    train_id: str
    severity: str
    casualties: int
    lat: float
    lon: float
    created_at: datetime


class IncidentDetail(IncidentSummary):
    dispatch_plan: dict
    telemetry_snapshot: dict | None = None
