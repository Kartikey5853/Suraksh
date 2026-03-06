"""
Suraksh - Document Model
SQLAlchemy ORM model for platform documents.

Security notes:
  - `integrity_hash`   : SHA-256 of the raw file bytes — used for tamper detection.
  - `file_path`        : path on secure storage — replace with blob URL for cloud.
  - Sensitive metadata fields should be hashed via hashing.compute_string_hash()
    before storage — marked with TODO below.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class Document(Base):
    __tablename__ = "documents"

    # ── Primary key ───────────────────────────────────────────────────────────
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)

    # ── Ownership ─────────────────────────────────────────────────────────────
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)

    # ── Document metadata ─────────────────────────────────────────────────────
    title = Column(String(512), nullable=False)
    description = Column(Text, nullable=True)
    document_type = Column(
        Enum(
            "agreement",
            "id_proof",
            "face_image",
            "contract",
            "other",
            name="document_type_enum",
        ),
        default="other",
        nullable=False,
    )

    # ── File reference ────────────────────────────────────────────────────────
    # For local dev: relative path.  For cloud: presigned URL / Supabase path.
    file_path = Column(String(1024), nullable=True)
    file_size_bytes = Column(String(20), nullable=True)
    mime_type = Column(String(128), nullable=True)

    # ── Integrity (SHA-256 of raw bytes) ──────────────────────────────────────
    # TODO: populate via hashing.compute_document_hash(file_bytes) before INSERT
    integrity_hash = Column(String(64), nullable=True)

    # ── Sensitive metadata placeholder ────────────────────────────────────────
    # TODO: hash the raw value via hashing.compute_string_hash() before storing
    hashed_sensitive_meta = Column(String(64), nullable=True)

    # ── Workflow state ────────────────────────────────────────────────────────
    status = Column(
        Enum("pending", "signed", "rejected", "expired", name="document_status_enum"),
        default="pending",
        nullable=False,
    )
    is_signed = Column(Boolean, default=False)
    signed_at = Column(DateTime, nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # ── Audit ─────────────────────────────────────────────────────────────────
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ── Relationships ─────────────────────────────────────────────────────────
    owner = relationship("User", back_populates="documents")

    def __repr__(self) -> str:
        return f"<Document id={self.id} title={self.title} status={self.status}>"
