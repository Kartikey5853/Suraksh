import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, String, ForeignKey

from app.db.database import Base


class AadhaarVerification(Base):
    __tablename__ = "aadhaar_verifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    aadhaar_last4 = Column(String(4), nullable=False)
    aadhaar_hash = Column(String(64), nullable=False)
    is_valid = Column(Boolean, default=False)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

