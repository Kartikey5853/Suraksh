"""
Suraksh - Auth Dependencies
FastAPI dependency functions injected into protected routes.

  get_current_user  → any authenticated user
  get_admin_user    → user with role == "admin"
  get_verifier_user → user with role in {"admin", "verifier"}
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.jwt_handler import decode_access_token
from app.db.database import get_db
from app.models.user import User

# OAuth2 scheme — reads the Bearer token from the Authorization header.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Decode the JWT and return the corresponding active User.

    Raises HTTP 401 if:
      - Token is missing, expired, or invalid.
      - User does not exist in the database.
      - User account is inactive (is_active == False).

    TODO: Check token against a revocation list (jti blacklist).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    # placeholder — query user from DB
    # user = db.query(User).filter(User.id == user_id).first()
    # if user is None or not user.is_active:
    #     raise credentials_exception
    # return user

    # TODO: remove stub and un-comment real query above
    raise NotImplementedError("get_current_user: DB query not yet implemented")


async def get_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Ensure the authenticated user has the 'admin' role.

    Raises HTTP 403 if the user's role is not 'admin'.

    TODO: Optionally support role hierarchy (e.g. superadmin > admin).
    """
    # placeholder
    if getattr(current_user, "role", None) != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privilege required",
        )
    return current_user


async def get_verifier_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Ensure the authenticated user has at least 'verifier' or 'admin' role.

    Raises HTTP 403 otherwise.
    """
    # placeholder
    allowed_roles = {"admin", "verifier"}
    if getattr(current_user, "role", None) not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Verifier or admin privilege required",
        )
    return current_user
