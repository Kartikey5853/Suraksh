import secrets

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.core.jwt_handler import create_access_token
from app.models.user import User


def register_user(name: str, email: str, password: str, db: Session, phone: str = None):
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=name,
        email=email,
        phone=phone,
        hashed_password=hash_password(password),
        role="founder",
        is_onboarded=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(subject=user.id, extra_claims={"role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "name": user.name,
        "role": user.role,
        "is_onboarded": user.is_onboarded,
    }


def login_user(email: str, password: str, db: Session, admin_only: bool = False):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if admin_only and user.role not in ("admin", "associate", "lawyer"):
        raise HTTPException(status_code=403, detail="Admin portal access required")

    # Admin OTP check
    if admin_only and user.admin_otp_required:
        # Return a flag telling frontend to prompt for OTP
        token = create_access_token(subject=user.id, extra_claims={"role": user.role})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": user.id,
            "name": user.name,
            "role": user.role,
            "is_onboarded": user.is_onboarded,
            "needs_admin_otp": True,
        }

    token = create_access_token(subject=user.id, extra_claims={"role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "name": user.name,
        "role": user.role,
        "is_onboarded": user.is_onboarded,
        "needs_admin_otp": False,
    }


def forgot_password(email: str, db: Session):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    db.commit()
    # In production: send this token via email
    return {"message": "Password reset token generated", "reset_token": reset_token}


def reset_password(token: str, new_password: str, db: Session):
    user = db.query(User).filter(User.reset_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    user.hashed_password = hash_password(new_password)
    user.reset_token = None
    db.commit()
    return {"message": "Password reset successful"}



def forgot_password(email: str, db: Session):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    db.commit()
    # In production: send this token via email
    return {"message": "Password reset token generated", "reset_token": reset_token}


def reset_password(token: str, new_password: str, db: Session):
    user = db.query(User).filter(User.reset_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    user.hashed_password = hash_password(new_password)
    user.reset_token = None
    db.commit()
    return {"message": "Password reset successful"}

