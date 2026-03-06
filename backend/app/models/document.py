import uuid
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, String, Text
from app.db.database import Base

class Document(Base):
    __tablename__ = 'documents'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    owner_id = Column(String(36), ForeignKey('users.id'), nullable=False, index=True)
    assigned_by = Column(String(36), ForeignKey('users.id'), nullable=True)
    title = Column(String(512), nullable=False)
    description = Column(Text, nullable=True)
    doc_type = Column(String(100), nullable=False, default='other')
    doc_category = Column(String(50), nullable=False, default='general')
    file_path = Column(String(1024), nullable=True)
    status = Column(Enum('pending', 'signed', 'rejected', 'expired', name='document_status_enum'), default='pending', nullable=False)
    is_signed = Column(Boolean, default=False)
    signed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Document id={self.id} title={self.title} status={self.status}>'
