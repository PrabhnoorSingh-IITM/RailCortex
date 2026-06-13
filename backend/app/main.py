import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.api.routes.emergency import router as emergency_router
from app.api.routes.simulation import router as simulation_router
from app.api.routes.websocket import router as websocket_router
from app.config import get_settings
from app.schemas.telemetry import TelemetryMessage
from app.services.telemetry_simulator import telemetry_simulator
from app.services.websocket_manager import ws_manager

_telemetry_task: asyncio.Task | None = None


async def _telemetry_broadcast_loop() -> None:
    settings = get_settings()
    interval = settings.telemetry_interval_sec

    while True:
        try:
            if not ws_manager.emergency_active and ws_manager._connections:
                trains = telemetry_simulator.tick()
                await ws_manager.broadcast(
                    TelemetryMessage(
                        type="TELEMETRY",
                        trains=trains,
                        emergency_active=False,
                        weather_active=telemetry_simulator.weather_active,
                    )
                )
        except Exception:
            pass
        await asyncio.sleep(interval)


@asynccontextmanager
async def lifespan(_: FastAPI):
    global _telemetry_task
    telemetry_simulator.load_from_static_data()
    _telemetry_task = asyncio.create_task(_telemetry_broadcast_loop())
    yield
    if _telemetry_task:
        _telemetry_task.cancel()
        try:
            await _telemetry_task
        except asyncio.CancelledError:
            pass


def create_app() -> FastAPI:
    settings = get_settings()

    application = FastAPI(
        title="RailMind AI Backend",
        description="Digital twin telemetry + emergency multi-agent response API",
        version="1.0.0",
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
        }

    return application


app = create_app()
