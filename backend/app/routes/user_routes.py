"""
Suraksh - User Routes
GET  /user/profile
PUT  /user/profile
GET  /user/documents
GET  /user/verification-status
All routes require a valid JWT (current_user dependency).
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth_dependencies import get_current_user
from app.models.user import User
from app.schemas.user_schema import UserProfileResponse, UserProfileUpdateRequest
from app.services import auth_service

router = APIRouter(prefix="/user", tags=["User"])


@router.get(
    "/profile",
    response_model=UserProfileResponse,
    summary="Get the authenticated user's profile",
)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return all non-sensitive profile fields for the authenticated user.

    TODO: Exclude hashed_password, hashed_gov_id from the serialised response.
    """
    # placeholder
    pass


@router.put(
    "/profile",
    response_model=UserProfileResponse,
    summary="Update the authenticated user's profile",
)
async def update_profile(
    payload: UserProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update mutable profile fields (full_name, phone_number).

    TODO: Trigger re-verification if sensitive fields change.
    """
    # placeholder
    pass


@router.get(
    "/documents",
    summary="List all documents belonging to the authenticated user",
)
async def list_user_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return a paginated list of documents owned by the authenticated user.

    TODO: Add pagination (skip / limit) and status filter.
    """
    # placeholder
    pass


@router.get(
    "/verification-status",
    summary="Get the KYC verification status of the authenticated user",
)
async def get_verification_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return the current KYC / identity verification state.

    TODO: Return structured VerificationStatusResponse schema.
    """
    # placeholder
    pass
