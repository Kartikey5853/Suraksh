"""
Suraksh - Verification Model
SQLAlchemy ORM model for KYC / identity verification records.

One-to-one with User.
Face-match and liveness scores are placeholders — not computed yet.
"""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class Verification(Base):
    __tablename__ = "verifications"

    # ── Primary key ───────────────────────────────────────────────────────────
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)

    # ── Ownership (one-to-one with User) ──────────────────────────────────────
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False, index=True)

    # ── ID document ───────────────────────────────────────────────────────────
    id_document_path = Column(String(1024), nullable=True)
    # SHA-256 of the raw ID image bytes — tamper check
    id_document_hash = Column(String(64), nullable=True)
    id_document_type = Column(
        Enum("passport", "national_id", "driving_license", "other", name="id_doc_type_enum"),
        nullable=True,
    )

    # ── Face image ────────────────────────────────────────────────────────────
    face_image_path = Column(String(1024), nullable=True)
    face_image_hash = Column(String(64), nullable=True)

    # ── Scores (placeholders — not computed yet) ──────────────────────────────
    # TODO: Populate via AI / biometric service
    face_match_score = Column(Float, nullable=True)
    liveness_score = Column(Float, nullable=True)

    # ── Verification status ───────────────────────────────────────────────────
    status = Column(
        Enum(
            "pending",
            "under_review",
            "approved",
            "rejected",
            name="verification_status_enum",
        ),
        default="pending",
        nullable=False,
    )
    reviewer_notes = Column(Text, nullable=True)
    reviewed_by = Column(String(36), nullable=True)   # admin user id
    reviewed_at = Column(DateTime, nullable=True)

    # ── Audit ─────────────────────────────────────────────────────────────────
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ── Relationships ─────────────────────────────────────────────────────────
    user = relationship("User", back_populates="verification")

    def __repr__(self) -> str:
        return f"<Verification id={self.id} user_id={self.user_id} status={self.status}>"
