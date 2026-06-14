from typing import Literal

from pydantic import BaseModel, Field


class TrainTripPayload(BaseModel):
    train_id: str
    route_color: list[int] = Field(default_factory=lambda: [0, 255, 0])
    path: list[list[float]]
    timestamps: list[float]
    current_index: int = 0
    delay_offset: float = 0.0


class TelemetryMessage(BaseModel):
    type: Literal["TELEMETRY", "EMERGENCY_STATE", "DISPATCH_PLAN", "WEATHER_ALERT"] = "TELEMETRY"
    trains: list[TrainTripPayload] | None = None
    emergency_active: bool = False
    weather_active: bool = False
    live_weather: dict | None = None
    dispatch_plan: dict | None = None
    message: str | None = None
