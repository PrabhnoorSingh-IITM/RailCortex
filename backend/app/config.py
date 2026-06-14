from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    openai_api_key: str = ""
    mappls_api_key: str = ""
    mapbox_access_token: str = ""
    openweather_api_key: str = ""
    api_key: str = ""

    database_url: str = "sqlite+aiosqlite:///./data/railcortex.db"

    overpass_api_url: str = "https://overpass-api.de/api/interpreter"
    mappls_routes_url: str = "https://apis.mappls.com/advancedmaps/v1/route_adv/driving"
    openweather_api_url: str = "https://api.openweathermap.org/data/2.5/weather"

    ollama_model: str = "llama3.2:latest"
    openai_model_mini: str = "gpt-4o-mini"
    openai_model_full: str = "gpt-4o"

    telemetry_interval_sec: float = 1.0
    weather_poll_interval_sec: float = 300.0
    hospital_search_radius_m: int = 5000
    hospital_search_radii_m: list[int] = [5000, 15000, 25000, 50000]
    hospital_fallback_max_km: float = 150.0

    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
