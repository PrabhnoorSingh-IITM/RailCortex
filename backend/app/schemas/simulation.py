from pydantic import BaseModel, Field


class WeatherInjectionRequest(BaseModel):
    intensity: str = Field(default="heavy", description="light | moderate | heavy")
    affected_region: str = Field(default="delhi_lucknow_corridor")
    delay_multiplier: float = Field(default=1.5, ge=1.0, le=5.0)
    use_live_weather: bool = Field(
        default=True,
        description="Poll OpenWeatherMap for the active corridor if API key is configured",
    )


class WeatherInjectionResponse(BaseModel):
    status: str
    message: str
    trains_rerouted: int
    total_delay_added_sec: float
    optimization_summary: dict
    live_weather: dict | None = None


class LiveWeatherResponse(BaseModel):
    status: str
    lat: float
    lon: float
    temp_c: float
    humidity: float
    delay_multiplier: float
    source: str
