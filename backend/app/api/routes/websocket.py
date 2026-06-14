from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.config import get_settings
from app.schemas.telemetry import TelemetryMessage
from app.services.telemetry_simulator import telemetry_simulator
from app.services.websocket_manager import ws_manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/network-telemetry")
async def network_telemetry(websocket: WebSocket) -> None:
    settings = get_settings()
    if settings.api_key:
        provided = websocket.query_params.get("api_key") or websocket.headers.get("x-api-key")
        if provided != settings.api_key:
            await websocket.close(code=4401, reason="Invalid or missing API key")
            return

    await ws_manager.connect(websocket)

    try:
        trains = telemetry_simulator.tick() if telemetry_simulator.trains else []
        await websocket.send_json(
            TelemetryMessage(
                type="TELEMETRY",
                trains=trains,
                emergency_active=ws_manager.emergency_active,
                weather_active=telemetry_simulator.weather_active,
                live_weather=telemetry_simulator.last_live_weather,
            ).model_dump(mode="json")
        )

        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await ws_manager.disconnect(websocket)
