"""
Suraksh - User Schemas (Pydantic)
Request / response models for user-related endpoints.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ── Registration ───────────────────────────────────────────────────────────────

class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone_number: Optional[str] = Field(None, max_length=20)
    password: str = Field(..., min_length=8, description="Plain-text — hashed before storage")
    # NOTE: gov_id received here will be HASHED before hitting the database
    gov_id: Optional[str] = Field(None, description="Government ID — stored as hash only")


# ── Login ──────────────────────────────────────────────────────────────────────

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


# ── OTP ────────────────────────────────────────────────────────────────────────

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=4, max_length=8)


# ── Token response ─────────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"


# ── Profile ────────────────────────────────────────────────────────────────────

class UserProfileResponse(BaseModel):
    id: str
    full_name: str
    email: str
    phone_number: Optional[str]
    role: str
    is_active: bool
    is_verified: bool
    is_kyc_complete: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone_number: Optional[str] = Field(None, max_length=20)
