"""
Suraksh - User Model
SQLAlchemy ORM model for platform users.

Security notes:
  - `hashed_password`  : bcrypt hash — plain text is NEVER stored.
  - `hashed_gov_id`    : SHA-256 / HMAC of the government ID — plain text NOT stored.
  - `phone_number`     : store as-is for MVP; hash or encrypt for production.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    # ── Primary key ───────────────────────────────────────────────────────────
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)

    # ── Identity ──────────────────────────────────────────────────────────────
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone_number = Column(String(20), nullable=True)

    # ── Security (sensitive fields — store only hashes) ───────────────────────
    hashed_password = Column(String(255), nullable=False)
    # TODO: populate via security.hash_government_id() before INSERT
    hashed_gov_id = Column(String(64), nullable=True)

    # ── Status & roles ────────────────────────────────────────────────────────
    role = Column(
        Enum("user", "admin", "verifier", name="user_role_enum"),
        default="user",
        nullable=False,
    )
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_kyc_complete = Column(Boolean, default=False)

    # ── OTP (placeholder) ─────────────────────────────────────────────────────
    otp_secret = Column(String(64), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)

    # ── Audit ─────────────────────────────────────────────────────────────────
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ── Relationships ─────────────────────────────────────────────────────────
    documents = relationship("Document", back_populates="owner", lazy="dynamic")
    verification = relationship("Verification", back_populates="user", uselist=False)

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
