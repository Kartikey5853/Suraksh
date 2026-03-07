import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, ForeignKey

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
    # Gemini scan fields
    scan_score = Column(Integer, nullable=True)          # 0-100 accuracy confidence
    face_submitted = Column(Boolean, default=False)      # face photo received
    # Stored file paths
    id_card_path = Column(String(512), nullable=True)    # path to saved ID card image
    face_path = Column(String(512), nullable=True)       # path to saved face/selfie image

