"""
Suraksh - Verification Service
Business logic for KYC / identity verification.
All functions are placeholders — implementation pending.

Face verification, liveness detection, and completeness scoring
are explicitly NOT implemented (see TODO tags).
"""

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.verification_schema import UploadIDRequest


async def upload_id_document(
    file: UploadFile,
    metadata: UploadIDRequest,
    current_user: User,
    db: Session,
):
    """
    Process an uploaded government ID document.

    Implementation checklist:
      [ ] Read file.read() bytes.
      [ ] Compute SHA-256 hash via hashing.compute_document_hash(bytes).
      [ ] Save file to secure storage path.
      [ ] Hash any extracted gov ID string via security.hash_government_id().
      [ ] Create or update Verification record; set status = "pending".

    TODO: Run OCR to extract text from the ID.
    TODO: Trigger AI document summary engine (NOT YET IMPLEMENTED).
    TODO: Trigger completeness scoring (NOT YET IMPLEMENTED).
    """
    # placeholder
    pass


async def upload_face_image(
    file: UploadFile,
    current_user: User,
    db: Session,
):
    """
    Process an uploaded selfie / face image.

    Implementation checklist:
      [ ] Read file bytes.
      [ ] Compute SHA-256 hash via hashing.compute_document_hash(bytes).
      [ ] Save file to secure storage path.
      [ ] Update Verification.face_image_path and face_image_hash.
      [ ] Queue face-match task (NOT YET IMPLEMENTED).

    TODO: Integrate face recognition service.
    TODO: Implement liveness detection.
    NOT YET IMPLEMENTED — face verification logic pending.
    """
    # placeholder — face verification logic not implemented
    pass


async def get_status(current_user: User, db: Session):
    """
    Return the current Verification record for the user.
    """
    from app.models.verification import AadhaarVerification
    record = db.query(AadhaarVerification).filter(AadhaarVerification.user_id == current_user.id).first()
    if not record:
        return {
            "user_id": current_user.id,
            "is_verified": False,
            "aadhaar_submitted": False,
            "aadhaar_last4": None,
            "verified_at": None,
        }
    return {
        "user_id": current_user.id,
        "is_verified": record.is_valid,
        "aadhaar_submitted": True,
        "aadhaar_last4": record.aadhaar_last4,
        "verified_at": record.verified_at.isoformat() if record.verified_at else None,
    }


async def approve_verification(verification_id: str, admin: User, db: Session):
    """
    Placeholder: Admin approves a KYC submission.

    TODO: Set status = "approved", reviewer fields, update user.is_kyc_complete.
    TODO: Append to audit trail (NOT YET IMPLEMENTED).
    """
    # placeholder
    pass


async def reject_verification(
    verification_id: str, reason: str, admin: User, db: Session
):
    """
    Placeholder: Admin rejects a KYC submission.

    TODO: Set status = "rejected", persist reviewer_notes.
    TODO: Notify user.
    TODO: Append to audit trail (NOT YET IMPLEMENTED).
    """
    # placeholder
    pass
