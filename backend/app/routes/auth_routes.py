from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.user_schema import (
    UserRegisterRequest,
    UserLoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.services.auth_service import (
    register_user,
    login_user,
    forgot_password,
    reset_password,
)
from app.dependencies.auth_dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=201)
def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    return register_user(
        name=payload.name,
        email=payload.email,
        password=payload.password,
        phone=payload.phone,
        db=db,
    )


@router.post("/login")
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    return login_user(email=payload.email, password=payload.password, db=db)


@router.post("/forgot-password")
def forgot_pass(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return forgot_password(email=payload.email, db=db)


@router.post("/reset-password")
def reset_pass(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    return reset_password(token=payload.token, new_password=payload.new_password, db=db)


@router.post("/send-otp")
def send_otp(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.services.otp_service import generate_otp
    generate_otp(current_user.id, db, email=current_user.email)
    return {"message": "OTP sent to your registered email"}


@router.post("/verify-otp")
def verify_otp(code: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.services.otp_service import verify_otp as check_otp
    valid = check_otp(current_user.id, code, db)
    if not valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    return {"message": "OTP verified", "verified": True}

