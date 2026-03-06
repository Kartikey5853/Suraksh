import uuid
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, String, Enum
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(
        Enum("founder", "associate", "lawyer", "admin", name="user_role"),
        default="founder",
        nullable=False,
    )
    is_active = Column(Boolean, default=True)
    is_onboarded = Column(Boolean, default=False)  # True after OTP+Aadhaar+Signature
    admin_otp_required = Column(Boolean, default=False)
    reset_token = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<User id={self.id} email={self.email} role={self.role}>"


