"""
Suraksh - Core Configuration
Centralised settings loaded from environment variables.
Switch DATABASE_URL to a Supabase/PostgreSQL DSN when going to production.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # ── Application ────────────────────────────────────────────────────────────
    APP_NAME: str = "Suraksh"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # ── Database ───────────────────────────────────────────────────────────────
    # SQLite for local development.
    # Switch to: "postgresql+asyncpg://user:password@host/dbname" for Supabase.
    DATABASE_URL: str = "sqlite:///./suraksh.db"

    # ── JWT ────────────────────────────────────────────────────────────────────
    SECRET_KEY: str = "CHANGE_ME_BEFORE_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ── Hashing ────────────────────────────────────────────────────────────────
    BCRYPT_ROUNDS: int = 12

    # ── OTP (placeholder) ──────────────────────────────────────────────────────
    OTP_EXPIRE_MINUTES: int = 10

    # ── CORS ───────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
