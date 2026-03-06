import uuid
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from app.db.database import Base


class Agreement(Base):
    __tablename__ = "agreements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    title = Column(String(512), nullable=False)
    content = Column(Text, nullable=False)          # full agreement text
    doc_type = Column(String(100), nullable=False, default="other")
    doc_category = Column(String(100), nullable=False, default="general")
    # who created it (admin / lawyer / associate)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    # sent to which user (nullable until sent)
    sent_to = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    # status: draft | sent | signed | rejected
    status = Column(String(20), nullable=False, default="draft")
    is_signed = Column(Boolean, default=False)
    signed_at = Column(DateTime, nullable=True)
    # base64 signature image captured when user signs
    signature_snapshot = Column(Text, nullable=True)
    # reason provided by user when rejecting
    rejection_reason = Column(Text, nullable=True)
    # link back to the document request that triggered this agreement (optional)
    source_request_id = Column(String(36), ForeignKey("document_requests.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Agreement id={self.id} title={self.title} status={self.status}>"
