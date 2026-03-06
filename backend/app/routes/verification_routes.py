"""
Suraksh - Verification Routes
POST /verification/upload-id
POST /verification/upload-face
GET  /verification/status
POST /verification/bypass

Face verification logic is NOT implemented — placeholders only.
"""

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth_dependencies import get_current_user
from app.models.user import User
from app.schemas.verification_schema import (
    UploadIDRequest,
    VerificationStatusResponse,
)
from app.services import verification_service

router = APIRouter(prefix="/verification", tags=["Verification"])


@router.post(
    "/upload-id",
    status_code=201,
    summary="Upload a government-issued ID document for KYC",
)
async def upload_id(
    metadata: UploadIDRequest = Depends(),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Accept a government ID image and initiate the verification process.

    Steps (placeholders):
      1. Read file bytes.
      2. Compute SHA-256 hash via hashing.compute_document_hash().
      3. Hash any extracted plaintext ID number via security.hash_government_id().
      4. Save file to secure storage.
      5. Create / update Verification record with status=pending.

    TODO: Integrate OCR to extract ID fields.
    TODO: Trigger document AI summary engine (NOT YET IMPLEMENTED).
    """
    # placeholder
    return await verification_service.upload_id_document(
        file, metadata, current_user, db
    )


@router.post(
    "/upload-face",
    status_code=201,
    summary="Upload a selfie / face image for biometric matching",
)
async def upload_face(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Accept a face image for liveness check and ID-to-face matching.

    Steps (placeholders):
      1. Read file bytes.
      2. Compute and store SHA-256 hash.
      3. Save to secure storage.
      4. Queue biometric comparison task (NOT YET IMPLEMENTED).

    TODO: Integrate face recognition / liveness detection service.
    NOT YET IMPLEMENTED — face verification logic pending.
    """
    # placeholder — face verification logic not implemented
    return await verification_service.upload_face_image(file, current_user, db)


@router.get(
    "/status",
    summary="Get the current KYC verification status",
)
async def get_verification_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return the current identity verification record for the authenticated user.

    TODO: Include completeness score when scoring engine is ready.
    NOT YET IMPLEMENTED — document completeness scoring pending.
    """
    # placeholder
    return await verification_service.get_status(current_user, db)


@router.post("/bypass", status_code=200)
def bypass_verification(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.models.verification import AadhaarVerification
    import datetime
    existing = db.query(AadhaarVerification).filter(AadhaarVerification.user_id == current_user.id).first()
    if existing:
        existing.is_valid = True
        existing.verified_at = datetime.datetime.utcnow()
    else:
        record = AadhaarVerification(
            user_id=current_user.id,
            aadhaar_last4="0000",
            aadhaar_hash="bypass",
            is_valid=True,
            verified_at=datetime.datetime.utcnow(),
        )
        db.add(record)
    db.commit()
    return {"message": "Aadhaar verification bypassed for testing."}


@router.post("/aadhaar", status_code=201, summary="Submit Aadhaar document for verification")
async def submit_aadhaar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Accept Aadhaar image and create a pending verification record."""
    from app.models.verification import AadhaarVerification
    import datetime
    existing = db.query(AadhaarVerification).filter(AadhaarVerification.user_id == current_user.id).first()
    if existing:
        # re-submission: reset to pending
        existing.is_valid = False
        existing.verified_at = None
        existing.aadhaar_hash = "pending_review"
    else:
        record = AadhaarVerification(
            user_id=current_user.id,
            aadhaar_last4="****",
            aadhaar_hash="pending_review",
            is_valid=False,
        )
        db.add(record)
    db.commit()
    return {"message": "Aadhaar document submitted. Pending admin review."}
