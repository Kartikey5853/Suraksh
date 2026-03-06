"""
Suraksh - Authentication Routes
POST /auth/register
POST /auth/login
POST /auth/verify-otp
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.user_schema import (
    OTPVerifyRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
async def register(
    payload: UserRegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Register a new user.

    Steps (placeholders — not yet implemented):
      1. Validate that the email is not already taken.
      2. Hash `payload.password` via security.hash_password().
      3. Hash `payload.gov_id` (if provided) via security.hash_government_id().
      4. Persist the User record.
      5. Generate and return a JWT access token.

    TODO: Trigger OTP email after registration.
    """
    # placeholder
    return await auth_service.register_user(payload, db)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate and obtain JWT tokens",
)
async def login(
    payload: UserLoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticate a user with email + password.

    Steps (placeholders):
      1. Look up user by email.
      2. Verify password via security.verify_password().
      3. Return signed JWT access + refresh tokens.

    TODO: Add rate-limiting / account lockout after N failed attempts.
    """
    # placeholder
    return await auth_service.login_user(payload, db)


@router.post(
    "/verify-otp",
    summary="Verify the OTP code sent to the user",
)
async def verify_otp(
    payload: OTPVerifyRequest,
    db: Session = Depends(get_db),
):
    """
    Verify the OTP code.

    Steps (placeholders):
      1. Look up user by email.
      2. Compare OTP code and check expiry.
      3. Mark user as verified.

    TODO: Implement actual OTP delivery (email / SMS) and TOTP logic.
    """
    # placeholder
    return await auth_service.verify_otp(payload, db)
