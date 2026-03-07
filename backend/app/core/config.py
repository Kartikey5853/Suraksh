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
    # Supabase/PostgreSQL connection
    DATABASE_URL: str = "postgresql+psycopg2://<user>:<password>@<host>:5432/<database>"

    # ── JWT ────────────────────────────────────────────────────────────────────
    SECRET_KEY: str = "bee518a6-d433-4c25-98ae-eb2d4a0acc5e"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ── Hashing ────────────────────────────────────────────────────────────────
    BCRYPT_ROUNDS: int = 12

    # ── OTP (placeholder) ──────────────────────────────────────────────────────
    OTP_EXPIRE_MINUTES: int = 10

    # ── CORS ───────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: list[str] = ["*"]

    # ── Gemini AI ──────────────────────────────────────────────────────────────
    GEMINI_API_KEY: str = ""

    # ── Resend (email delivery) ────────────────────────────────────────────────
    RESEND_API_KEY: str = ""

    # ── Role registration codes ────────────────────────────────────────────────
    # Format: role -> invite code (change before production)
    ROLE_CODES: dict = {
        "admin":     "ADM-2025",
        "lawyer":    "LAW-8X4T",
        "associate": "ASC-7K2M",
        "founder":   "FND-3Q9R",
    }

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
