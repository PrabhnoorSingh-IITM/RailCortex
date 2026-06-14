from fastapi import HTTPException, Security, WebSocket
from fastapi.security import APIKeyHeader

from app.config import get_settings

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str | None = Security(api_key_header)) -> None:
    settings = get_settings()
    if not settings.api_key:
        return
    if api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


async def verify_websocket_api_key(websocket: WebSocket) -> bool:
    settings = get_settings()
    if not settings.api_key:
        return True

    provided = websocket.query_params.get("api_key") or websocket.headers.get("x-api-key")
    return provided == settings.api_key
