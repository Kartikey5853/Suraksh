"""
Suraksh - JWT Token Handler
Create, decode and validate JSON Web Tokens.
Placeholder — structure only, no advanced claims logic yet.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Any

from jose import JWTError, jwt

from app.core.config import settings


# ── Token creation ────────────────────────────────────────────────────────────

def create_access_token(
    subject: str,
    extra_claims: Optional[dict[str, Any]] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a signed JWT access token.

    Args:
        subject:      Unique identifier for the token owner (e.g. user UUID).
        extra_claims: Additional claims to embed (role, org_id, etc.).
        expires_delta: Override the default expiry window.

    Returns:
        Signed JWT string.

    TODO: Add jti (JWT ID) claim for token revocation support.
    TODO: Embed user roles/permissions as claims.
    """
    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta
        else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload: dict[str, Any] = {
        "sub": subject,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    if extra_claims:
        payload.update(extra_claims)

    # placeholder — returns encoded JWT
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: str) -> str:
    """
    Create a longer-lived refresh token.

    TODO: Persist refresh tokens (or their hashes) for revocation tracking.
    """
    # placeholder
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    payload = {
        "sub": subject,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


# ── Token verification ────────────────────────────────────────────────────────

def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    """
    Decode and validate a JWT access token.

    Returns the payload dict on success, or None if validation fails.

    TODO: Check jti against a revocation list (Redis / DB).
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


def decode_refresh_token(token: str) -> Optional[dict[str, Any]]:
    """
    Decode and validate a JWT refresh token.

    TODO: Validate against persisted refresh token store.
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None


def extract_subject(token: str) -> Optional[str]:
    """
    Quick helper: extract the `sub` claim without raising exceptions.
    Returns None if the token is invalid or expired.
    """
    payload = decode_access_token(token)
    if payload:
        return payload.get("sub")
    return None
