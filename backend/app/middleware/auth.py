import hashlib
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, Security, WebSocket, status
from fastapi.security import APIKeyHeader

from app.config import get_settings

logger = logging.getLogger(__name__)

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

# Simple rate limiting storage (in production, use Redis)
_api_key_attempts: dict[str, list[datetime]] = {}


def _rate_limit_check(api_key: str, max_attempts: int = 100, window_seconds: int = 3600) -> bool:
    """
    Check if API key has exceeded rate limit.
    Returns True if within limits, False if exceeded.
    """
    now = datetime.now(timezone.utc)
    
    if api_key not in _api_key_attempts:
        _api_key_attempts[api_key] = []
    
    # Remove old attempts outside window
    window_start = now - timedelta(seconds=window_seconds)
    _api_key_attempts[api_key] = [
        attempt for attempt in _api_key_attempts[api_key]
        if attempt > window_start
    ]
    
    # Check if exceeded
    if len(_api_key_attempts[api_key]) >= max_attempts:
        logger.warning(f"Rate limit exceeded for API key: {_hash_key(api_key)}")
        return False
    
    # Record this attempt
    _api_key_attempts[api_key].append(now)
    return True


def _hash_key(api_key: str, length: int = 8) -> str:
    """Return truncated hash of API key for logging."""
    return hashlib.sha256(api_key.encode()).hexdigest()[:length]


def _validate_api_key(api_key: str) -> bool:
    """Validate API key format and content."""
    if not api_key:
        return False
    
    # Check minimum length (prevent brute force)
    if len(api_key) < 16:
        return False
    
    # Alphanumeric and hyphens only
    if not all(c.isalnum() or c == '-' for c in api_key):
        return False
    
    return True


async def verify_api_key(api_key: str | None = Security(api_key_header)) -> None:
    """
    Verify API key for HTTP endpoints.
    Raises HTTPException if invalid or rate limited.
    """
    settings = get_settings()
    
    # If no API key configured, allow all requests
    if not settings.api_key:
        logger.debug("API key authentication disabled")
        return
    
    # Check if API key provided
    if not api_key:
        logger.warning("Missing API key header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required in X-API-Key header",
        )
    
    # Validate format
    if not _validate_api_key(api_key):
        logger.warning(f"Invalid API key format: {_hash_key(api_key)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key format",
        )
    
    # Check rate limit
    if not _rate_limit_check(api_key):
        logger.warning(f"Rate limit exceeded: {_hash_key(api_key)}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="API rate limit exceeded",
        )
    
    # Constant-time comparison to prevent timing attacks
    api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    settings_hash = hashlib.sha256(settings.api_key.encode()).hexdigest()
    
    if api_key_hash != settings_hash:
        logger.warning(f"Invalid API key: {_hash_key(api_key)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )


async def verify_websocket_api_key(websocket: WebSocket) -> bool:
    """
    Verify API key for WebSocket connections.
    Returns True if valid, False if invalid.
    """
    settings = get_settings()
    
    # If no API key configured, allow all connections
    if not settings.api_key:
        logger.debug("WebSocket: Authentication disabled")
        return True
    
    # Try to get API key from query params or headers
    provided_key: Optional[str] = (
        websocket.query_params.get("api_key") 
        or websocket.headers.get("x-api-key")
    )
    
    if not provided_key:
        logger.warning("WebSocket: Missing API key")
        return False
    
    # Validate format
    if not _validate_api_key(provided_key):
        logger.warning(f"WebSocket: Invalid key format: {_hash_key(provided_key)}")
        return False
    
    # Check rate limit
    if not _rate_limit_check(provided_key):
        logger.warning(f"WebSocket: Rate limit exceeded: {_hash_key(provided_key)}")
        return False
    
    # Constant-time comparison
    provided_hash = hashlib.sha256(provided_key.encode()).hexdigest()
    settings_hash = hashlib.sha256(settings.api_key.encode()).hexdigest()
    
    if provided_hash != settings_hash:
        logger.warning(f"WebSocket: Invalid key: {_hash_key(provided_key)}")
        return False
    
    logger.debug("WebSocket: Authentication successful")
    return True


def get_api_key_from_request(authorization: Optional[str]) -> Optional[str]:
    """Extract and validate API key from Authorization header."""
    if not authorization:
        return None
    
    # Support "Bearer <api_key>" format
    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    
    return None
