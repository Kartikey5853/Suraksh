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
    from app.models import user, otp, document, verification, signature, document_request, agreement  # noqa: F401
    Base.metadata.create_all(bind=engine)

    # ── Inline column migrations for SQLite ───────────────────────────────────
    # SQLite does not support ALTER TABLE in create_all when table already exists.
    # We guard each statement with a try/except so it's idempotent.
    _add_column_if_missing("agreements", "rejection_reason", "TEXT")
    _add_column_if_missing("agreements", "source_request_id", "VARCHAR(36)")
    # v2 — lawyer pipeline + AI key points + pipeline_stage
    _add_column_if_missing("agreements", "pipeline_stage", "VARCHAR(30) DEFAULT 'draft'")
    _add_column_if_missing("agreements", "lawyer_id", "VARCHAR(36)")
    _add_column_if_missing("agreements", "lawyer_notes", "TEXT")
    _add_column_if_missing("agreements", "lawyer_status", "VARCHAR(20)")
    _add_column_if_missing("agreements", "lawyer_reviewed_at", "DATETIME")
    _add_column_if_missing("agreements", "key_points", "TEXT")


def _add_column_if_missing(table: str, column: str, col_type: str) -> None:
    """Attempt to add a column to a table; silently ignore if it already exists."""
    try:
        with engine.connect() as conn:
            conn.execute(  # type: ignore[call-overload]
                __import__("sqlalchemy").text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
            )
            conn.commit()
    except Exception:
        pass  # column already exists or DB doesn't support this DDL
