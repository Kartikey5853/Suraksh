import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, Text

from app.db.database import Base


class DocumentRequest(Base):
    __tablename__ = "document_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    doc_type = Column(String(100), nullable=False)
    doc_category = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(
        Enum("pending", "in_review", "approved", "rejected", name="doc_req_status"),
        default="pending",
        nullable=False,
    )
    assigned_to = Column(String(36), ForeignKey("users.id"), nullable=True)
    reviewer_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
