from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.schemas.telemetry import TelemetryMessage
from app.services.telemetry_simulator import telemetry_simulator
from app.services.websocket_manager import ws_manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/network-telemetry")
async def network_telemetry(websocket: WebSocket) -> None:
    await ws_manager.connect(websocket)

    try:
        trains = telemetry_simulator.tick() if telemetry_simulator.trains else []
        await websocket.send_json(
            TelemetryMessage(
                type="TELEMETRY",
                trains=trains,
                emergency_active=ws_manager.emergency_active,
                weather_active=telemetry_simulator.weather_active,
            ).model_dump(mode="json")
        )

        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await ws_manager.disconnect(websocket)
