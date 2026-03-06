"""
Suraksh - Database Setup
Creates an SQLAlchemy engine + session factory from the configured DATABASE_URL.

To switch to Supabase / PostgreSQL:
  1. Update DATABASE_URL in .env  →  postgresql+psycopg2://user:pass@host/dbname
  2. Remove the connect_args block (it is SQLite-specific).
  3. Install psycopg2-binary (or asyncpg for async).
  4. Run Alembic migrations instead of create_all().
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.core.config import settings

# ── Engine ────────────────────────────────────────────────────────────────────
# connect_args is required for SQLite only (allows multi-thread access).
_connect_args = (
    {"check_same_thread": False}
    if settings.DATABASE_URL.startswith("sqlite")
    else {}
)

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=_connect_args,
    echo=settings.DEBUG,          # logs SQL statements when DEBUG=True
)

# ── Session factory ───────────────────────────────────────────────────────────
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# ── Declarative base shared by all models ─────────────────────────────────────
Base = declarative_base()


# ── Dependency injected into routes ───────────────────────────────────────────
def get_db() -> Generator[Session, None, None]:
    """
    Yield a database session and guarantee cleanup on request completion.
    Usage:
        db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Development helper ────────────────────────────────────────────────────────
def init_db() -> None:
    """
    Create all tables defined by SQLAlchemy models.
    Called once on application startup for development / SQLite.

    TODO: Replace with Alembic migrations for production.
    """
    # Import models so Base is aware of them before create_all().
    from app.models import user, document, verification  # noqa: F401
    Base.metadata.create_all(bind=engine)
