"""
backend/app/db/database.py
SkyGuard AI — Async Database Engine, Sessionmaker, and Lifecycle Management.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy import event
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlite3 import Connection as SQLite3Connection

from backend.app.config import settings

logger = logging.getLogger(__name__)

# Ensure data directory exists if a relative/absolute sqlite path is used
if settings.DATABASE_URL.startswith("sqlite+aiosqlite:///"):
    db_raw_path = settings.DATABASE_URL.replace("sqlite+aiosqlite:///", "")
    if db_raw_path and not db_raw_path.startswith(":memory:"):
        db_file = Path(db_raw_path)
        db_file.parent.mkdir(parents=True, exist_ok=True)


class Base(DeclarativeBase):
    """Declarative Base class for all SQLAlchemy 2.0 ORM models."""
    pass


# Create Async Engine
engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
    pool_pre_ping=True,
)


@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragmas(dbapi_connection, connection_record) -> None:
    """Configures SQLite connection pragmas for high concurrency, durability, and referential integrity."""
    if isinstance(dbapi_connection, SQLite3Connection) or hasattr(dbapi_connection, "cursor"):
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA journal_mode=WAL;")
            cursor.execute("PRAGMA synchronous=NORMAL;")
            cursor.execute("PRAGMA foreign_keys=ON;")
            cursor.execute("PRAGMA busy_timeout=10000;")
        finally:
            cursor.close()


# Async Session Factory
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI Dependency yielding an isolated AsyncSession per request."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    """Async context manager for background workers, services, and simulation loops."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Creates all database tables and seeds default stations if empty."""
    from backend.app.db import models  # noqa: F401
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed default AWS stations if database is freshly initialized
    async with get_db_context() as session:
        from backend.app.db.models import Station
        from sqlalchemy import select
        
        result = await session.execute(select(Station).limit(1))
        existing = result.scalars().first()
        if not existing:
            default_stations = [
                Station(
                    station_id="AWS-001",
                    name="Central Meteorological Observatory",
                    latitude=28.6139,
                    longitude=77.2090,
                    elevation=216.0,
                    status="ACTIVE",
                ),
                Station(
                    station_id="AWS-002",
                    name="Coastal Marine Weather Tower",
                    latitude=18.9220,
                    longitude=72.8347,
                    elevation=14.0,
                    status="ACTIVE",
                ),
                Station(
                    station_id="AWS-003",
                    name="Plateau Highland Station",
                    latitude=32.2190,
                    longitude=76.3234,
                    elevation=1457.0,
                    status="ACTIVE",
                ),
                Station(
                    station_id="AWS-004",
                    name="Arid Subtropical Outpost",
                    latitude=26.9124,
                    longitude=70.9022,
                    elevation=225.0,
                    status="ACTIVE",
                ),
            ]
            session.add_all(default_stations)
            await session.commit()
            logger.info("Initialized database with %d default AWS stations.", len(default_stations))


async def close_db() -> None:
    """Gracefully disposes database connection pool on application shutdown."""
    await engine.dispose()
    logger.info("Database connection pool closed.")
