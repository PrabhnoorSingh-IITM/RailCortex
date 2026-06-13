import asyncio
import json
from pathlib import Path

from fastapi import WebSocket

from app.schemas.telemetry import TelemetryMessage


class WebSocketManager:
    def __init__(self) -> None:
        self._connections: list[WebSocket] = []
        self._lock = asyncio.Lock()
        self.emergency_active = False

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.append(websocket)

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            if websocket in self._connections:
                self._connections.remove(websocket)

    async def broadcast(self, message: TelemetryMessage) -> None:
        payload = message.model_dump(mode="json")
        async with self._lock:
            stale: list[WebSocket] = []
            for connection in self._connections:
                try:
                    await connection.send_json(payload)
                except Exception:
                    stale.append(connection)
            for connection in stale:
                if connection in self._connections:
                    self._connections.remove(connection)

    async def broadcast_emergency_state(self, active: bool, message: str = "") -> None:
        self.emergency_active = active
        await self.broadcast(
            TelemetryMessage(
                type="EMERGENCY_STATE",
                emergency_active=active,
                message=message or ("Emergency response active" if active else "Normal operations resumed"),
            )
        )

    async def broadcast_dispatch_plan(self, dispatch_plan: dict) -> None:
        await self.broadcast(
            TelemetryMessage(
                type="DISPATCH_PLAN",
                emergency_active=True,
                dispatch_plan=dispatch_plan,
            )
        )

    async def broadcast_weather_alert(self, message: str, trains: list | None = None) -> None:
        await self.broadcast(
            TelemetryMessage(
                type="WEATHER_ALERT",
                weather_active=True,
                trains=trains,
                message=message,
            )
        )


ws_manager = WebSocketManager()

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def load_json(filename: str) -> dict:
    with open(DATA_DIR / filename, encoding="utf-8") as handle:
        return json.load(handle)
