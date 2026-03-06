import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, String, Text, ForeignKey
from app.db.database import Base

class Signature(Base):
    __tablename__ = 'signatures'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False, unique=True, index=True)
    image_data = Column(Text, nullable=False)  # base64 PNG
    created_at = Column(DateTime, default=datetime.utcnow)
