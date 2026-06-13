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
    
    rapidapi_key: str = ""
    rapidapi_host: str = "indianrailapi.p.rapidapi.com"

    overpass_api_url: str = "https://overpass-api.de/api/interpreter"
    mappls_routes_url: str = "https://apis.mappls.com/advancedmaps/v1/route_adv/driving"

    ollama_model: str = "llama3.2:latest"
    openai_model_mini: str = "gpt-4o-mini"
    openai_model_full: str = "gpt-4o"

    telemetry_interval_sec: float = 1.0
    hospital_search_radius_m: int = 5000

    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
