import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.api.routes.emergency import router as emergency_router
from app.api.routes.simulation import router as simulation_router
from app.api.routes.websocket import router as websocket_router
from app.config import get_settings
from app.db.database import init_db
from app.schemas.telemetry import TelemetryMessage
from app.services.telemetry_simulator import telemetry_simulator
from app.services.weather_service import fetch_live_weather
from app.services.websocket_manager import ws_manager

_telemetry_task: asyncio.Task | None = None
_weather_task: asyncio.Task | None = None


async def _telemetry_broadcast_loop() -> None:
    settings = get_settings()
    interval = settings.telemetry_interval_sec

    while True:
        try:
            if not ws_manager.emergency_active and ws_manager._connections:
                telemetry_simulator.step()
                state = telemetry_simulator.get_current_state()
                await ws_manager.broadcast(
                    TelemetryMessage(
                        type="TELEMETRY",
                        trains=state["trains"],
                        emergency_active=False,
<<<<<<< HEAD
                        weather_active=telemetry_simulator.weather_active,
                        live_weather=telemetry_simulator.last_live_weather,
=======
                        weather_active=state["weather_active"],
>>>>>>> 6d81d76320a04b27dc1517fb2e706aecca429b31
                    )
                )
        except Exception as e:
            print(f"Error in broadcast loop: {e}")
        await asyncio.sleep(interval)


async def _weather_poll_loop() -> None:
    settings = get_settings()
    if not settings.openweather_api_key:
        return

    while True:
        try:
            if telemetry_simulator.trains:
                train = telemetry_simulator.trains[0]
                index = min(train.current_index, len(train.path) - 1)
                lon, lat = train.path[index]
                live = await fetch_live_weather(lat, lon)
                if live:
                    telemetry_simulator.last_live_weather = {
                        "lat": lat,
                        "lon": lon,
                        "temp_c": live.temp_c,
                        "humidity": live.humidity,
                        "source": "openweathermap",
                    }
        except Exception:
            pass
        await asyncio.sleep(settings.weather_poll_interval_sec)


@asynccontextmanager
async def lifespan(_: FastAPI):
    global _telemetry_task, _weather_task
    await init_db()
    telemetry_simulator.load_from_static_data()
    _telemetry_task = asyncio.create_task(_telemetry_broadcast_loop())
    _weather_task = asyncio.create_task(_weather_poll_loop())
    yield
    for task in (_telemetry_task, _weather_task):
        if task:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass


def create_app() -> FastAPI:
    settings = get_settings()

    application = FastAPI(
        title="RailMind AI Backend",
        description="Digital twin telemetry + emergency multi-agent response API",
        version="1.1.0",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(emergency_router)
    application.include_router(simulation_router)
    application.include_router(websocket_router)

    @application.get("/", include_in_schema=False)
    async def root():
        return RedirectResponse(url="/docs")

    @application.get("/health")
    async def health() -> dict:
        return {
            "status": "ok",
            "emergency_active": ws_manager.emergency_active,
            "trains_loaded": len(telemetry_simulator.trains),
            "websocket_clients": len(ws_manager._connections),
            "auth_enabled": bool(settings.api_key),
            "weather_polling_enabled": bool(settings.openweather_api_key),
        }

    return application


app = create_app()
