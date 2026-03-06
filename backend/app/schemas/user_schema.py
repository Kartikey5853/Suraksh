from typing import Optional
from pydantic import BaseModel


class UserRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None


class UserLoginRequest(BaseModel):
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str
    is_admin: bool
