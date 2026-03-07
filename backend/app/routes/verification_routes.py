"""
Suraksh - Verification Routes
POST /verification/upload-id
POST /verification/upload-face
GET  /verification/status
GET  /verification/my-details
GET  /verification/image/id      - serve user's own ID card image
GET  /verification/image/face    - serve user's own face image
POST /verification/bypass
POST /verification/aadhaar
POST /verification/face
"""

import os
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
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

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")


def _save_file(data: bytes, subfolder: str, user_id: str, filename: str) -> str:
    """Save bytes to UPLOAD_DIR/subfolder/user_id/filename and return the path."""
    folder = os.path.join(UPLOAD_DIR, subfolder, user_id)
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, filename)
    with open(path, "wb") as f:
        f.write(data)
    return path


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
    return await verification_service.upload_face_image(file, current_user, db)


@router.get(
    "/status",
    summary="Get the current KYC verification status",
)
async def get_verification_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await verification_service.get_status(current_user, db)


@router.get("/my-details", summary="Get full verification details including image availability")
async def get_my_details(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.verification import AadhaarVerification
    record = db.query(AadhaarVerification).filter(AadhaarVerification.user_id == current_user.id).first()
    if not record:
        return {"found": False}
    return {
        "found": True,
        "user_id": current_user.id,
        "user_name": current_user.name,
        "user_email": current_user.email,
        "aadhaar_last4": record.aadhaar_last4,
        "is_valid": record.is_valid,
        "scan_score": record.scan_score,
        "face_submitted": record.face_submitted,
        "verified_at": record.verified_at.isoformat() if record.verified_at else None,
        "created_at": record.created_at.isoformat() if record.created_at else None,
        "has_id_card": bool(record.id_card_path and os.path.exists(record.id_card_path)),
        "has_face": bool(record.face_path and os.path.exists(record.face_path)),
    }


@router.get("/image/id", summary="Serve the user's own ID card image")
def get_id_image(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.verification import AadhaarVerification
    record = db.query(AadhaarVerification).filter(AadhaarVerification.user_id == current_user.id).first()
    if not record or not record.id_card_path or not os.path.exists(record.id_card_path):
        raise HTTPException(status_code=404, detail="ID card image not found")
    return FileResponse(record.id_card_path)


@router.get("/image/face", summary="Serve the user's own face image")
def get_face_image(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.verification import AadhaarVerification
    record = db.query(AadhaarVerification).filter(AadhaarVerification.user_id == current_user.id).first()
    if not record or not record.face_path or not os.path.exists(record.face_path):
        raise HTTPException(status_code=404, detail="Face image not found")
    return FileResponse(record.face_path)


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
    """Accept Aadhaar image, scan with Gemini AI, save to disk, and create a pending verification record."""
    from app.models.verification import AadhaarVerification
    from app.services.gemini_service import scan_aadhaar_image
    import datetime

    image_bytes = await file.read()
    mime_type = file.content_type or "image/jpeg"
    ext = (file.filename or "id.jpg").rsplit(".", 1)[-1] if file.filename else "jpg"

    # Save file to disk
    saved_path = _save_file(image_bytes, "id_cards", current_user.id, f"id_card.{ext}")

    # Use Gemini Vision to scan the Aadhaar
    scan_result: dict = {"confidence_score": 0, "last4": None, "notes": "Scan not available"}
    try:
        scan_result = scan_aadhaar_image(image_bytes, mime_type)
    except Exception as exc:
        scan_result["notes"] = f"Scan error: {str(exc)[:80]}"

    raw_last4 = scan_result.get("last4") or "****"
    raw_last4 = str(raw_last4).replace(" ", "").strip()
    last4 = raw_last4[-4:] if len(raw_last4) >= 4 else raw_last4.ljust(4, "*")
    scan_score = max(0, min(100, int(scan_result.get("confidence_score") or 0)))

    existing = db.query(AadhaarVerification).filter(AadhaarVerification.user_id == current_user.id).first()
    if existing:
        existing.is_valid = False
        existing.verified_at = None
        existing.aadhaar_hash = "pending_review"
        existing.aadhaar_last4 = last4
        existing.scan_score = scan_score
        existing.id_card_path = saved_path
    else:
        record = AadhaarVerification(
            user_id=current_user.id,
            aadhaar_last4=last4,
            aadhaar_hash="pending_review",
            is_valid=False,
            scan_score=scan_score,
            id_card_path=saved_path,
        )
        db.add(record)
    db.commit()
    return {
        "message": "Aadhaar document submitted. Pending admin review.",
        "scanned_last4": last4,
        "scan_score": scan_score,
        "scan_notes": scan_result.get("notes", ""),
    }


@router.post("/face", status_code=201, summary="Submit face photo for identity verification")
async def submit_face(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Accept face/selfie photo, save to disk, and mark it as received."""
    from app.models.verification import AadhaarVerification

    existing = db.query(AadhaarVerification).filter(AadhaarVerification.user_id == current_user.id).first()
    if not existing:
        raise HTTPException(
            status_code=400,
            detail="Please upload your Aadhaar card first before submitting a face photo.",
        )
    face_bytes = await file.read()
    ext = (file.filename or "face.jpg").rsplit(".", 1)[-1] if file.filename else "jpg"
    saved_path = _save_file(face_bytes, "faces", current_user.id, f"face.{ext}")

    existing.face_submitted = True
    existing.face_path = saved_path
    db.commit()
    return {"message": "Face photo received and saved successfully."}



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
    """Accept Aadhaar image, scan with Gemini AI, and create a pending verification record."""
    from app.models.verification import AadhaarVerification
    from app.services.gemini_service import scan_aadhaar_image
    import datetime

    # Read the uploaded image
    image_bytes = await file.read()
    mime_type = file.content_type or "image/jpeg"

    # Use Gemini Vision to scan the Aadhaar
    scan_result: dict = {"confidence_score": 0, "last4": None, "notes": "Scan not available"}
    try:
        scan_result = scan_aadhaar_image(image_bytes, mime_type)
    except Exception as exc:
        scan_result["notes"] = f"Scan error: {str(exc)[:80]}"

    raw_last4 = scan_result.get("last4") or "****"
    # Normalise to exactly 4 digits (strip spaces and take last 4)
    raw_last4 = str(raw_last4).replace(" ", "").strip()
    last4 = raw_last4[-4:] if len(raw_last4) >= 4 else raw_last4.ljust(4, "*")
    scan_score = max(0, min(100, int(scan_result.get("confidence_score") or 0)))

    existing = db.query(AadhaarVerification).filter(AadhaarVerification.user_id == current_user.id).first()
    if existing:
        existing.is_valid = False
        existing.verified_at = None
        existing.aadhaar_hash = "pending_review"
        existing.aadhaar_last4 = last4
        existing.scan_score = scan_score
    else:
        record = AadhaarVerification(
            user_id=current_user.id,
            aadhaar_last4=last4,
            aadhaar_hash="pending_review",
            is_valid=False,
            scan_score=scan_score,
        )
        db.add(record)
    db.commit()
    return {
        "message": "Aadhaar document submitted. Pending admin review.",
        "scanned_last4": last4,
        "scan_score": scan_score,
        "scan_notes": scan_result.get("notes", ""),
    }


@router.post("/face", status_code=201, summary="Submit face photo for identity verification")
async def submit_face(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Accept face/selfie photo and mark it as received on the verification record."""
    from app.models.verification import AadhaarVerification
    from fastapi import HTTPException

    existing = db.query(AadhaarVerification).filter(AadhaarVerification.user_id == current_user.id).first()
    if not existing:
        raise HTTPException(
            status_code=400,
            detail="Please upload your Aadhaar card first before submitting a face photo.",
        )
    # Consume the file (in production you would save it)
    await file.read()
    existing.face_submitted = True
    db.commit()
    return {"message": "Face photo received successfully."}
