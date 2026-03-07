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
    # pipeline_stage: draft | lawyer_review | lawyer_approved | sent | completed | on_hold
    pipeline_stage = Column(String(30), nullable=False, default="draft")
    # status: draft | pending_lawyer_review | lawyer_approved | lawyer_rejected | sent | signed | rejected
    status = Column(String(30), nullable=False, default="draft")
    is_signed = Column(Boolean, default=False)
    signed_at = Column(DateTime, nullable=True)
    # base64 signature image captured when user signs
    signature_snapshot = Column(Text, nullable=True)
    # reason provided by user when rejecting
    rejection_reason = Column(Text, nullable=True)
    # lawyer review pipeline
    lawyer_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    lawyer_notes = Column(Text, nullable=True)
    lawyer_status = Column(String(20), nullable=True)   # pending | approved | rejected
    lawyer_reviewed_at = Column(DateTime, nullable=True)
    # AI-extracted key points as JSON string
    key_points = Column(Text, nullable=True)
    # AI analysis results (company perspective) stored as JSON string
    analysis_result = Column(Text, nullable=True)
    # AI analysis results (user/personal perspective) stored as JSON string
    user_analysis_result = Column(Text, nullable=True)
    # link back to the document request that triggered this agreement (optional)
    source_request_id = Column(String(36), ForeignKey("document_requests.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Agreement id={self.id} title={self.title} status={self.status}>"


class AgreementEvent(Base):
    """Append-only timeline events for an agreement."""
    __tablename__ = "agreement_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    agreement_id = Column(String(36), ForeignKey("agreements.id"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)
    # e.g. created | sent_to_lawyer | lawyer_approved | lawyer_rejected
    #       sent_to_user | signed | rejected_by_user | put_on_hold | resumed
    actor_id = Column(String(36), nullable=True)   # who triggered this event
    actor_name = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<AgreementEvent agreement={self.agreement_id} type={self.event_type}>"
