from datetime import datetime
from typing import Literal

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
    event_type: Literal["DERAILMENT", "COLLISION", "OBSTACLE", "MANUAL"] = "DERAILMENT"
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
    final_dispatch_plan: dict
    errors: list[str] = Field(default_factory=list)
