from collections.abc import AsyncGenerator
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings
from app.db.models import Base

# Resolve the backend package root so the SQLite path is always correct
# regardless of which directory uvicorn is launched from.
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent  # backend/

_engine = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def _resolve_db_url(url: str) -> str:
    """Make SQLite paths absolute relative to the backend root."""
    if url.startswith("sqlite") and "///" in url:
        prefix, rel = url.split("///", 1)
        if not Path(rel).is_absolute():
            abs_path = (_BACKEND_ROOT / rel).resolve()
            return f"{prefix}///{abs_path}"
    return url


def get_engine():
    global _engine
    if _engine is None:
        settings = get_settings()
        db_url = _resolve_db_url(settings.database_url)
        _engine = create_async_engine(db_url, echo=False)
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(get_engine(), expire_on_commit=False)
    return _session_factory


async def init_db() -> None:
    db_url = _resolve_db_url(get_settings().database_url)
    if db_url.startswith("sqlite"):
        file_part = db_url.split("///")[-1]
        Path(file_part).parent.mkdir(parents=True, exist_ok=True)

    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    session_factory = get_session_factory()
    async with session_factory() as session:
        yield session
