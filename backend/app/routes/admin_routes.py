import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth_dependencies import get_current_admin
from app.models.document_request import DocumentRequest
from app.models.document import Document
from app.models.user import User
from app.models.agreement import Agreement
from app.models.verification import AadhaarVerification
from app.schemas.user_schema import UserLoginRequest, UserRegisterRequest
from app.services.auth_service import login_user
from app.core.security import hash_password
from app.core.config import settings

router = APIRouter(prefix="/admin", tags=["Admin"])

VALID_ROLES = ("founder", "associate", "lawyer", "admin")


class AdminRegisterPayload(UserRegisterRequest):
    role: str
    role_code: str


@router.post("/register", status_code=201)
def admin_register(payload: AdminRegisterPayload, db: Session = Depends(get_db)):
    """Register admin/staff using a secret role invite code."""
    if payload.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Choose from: {list(VALID_ROLES)}")
    expected = settings.ROLE_CODES.get(payload.role)
    if not expected or payload.role_code != expected:
        raise HTTPException(status_code=403, detail="Invalid role code")
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        id=str(uuid.uuid4()),
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        is_onboarded=True,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"user_id": user.id, "name": user.name, "role": user.role, "email": user.email}

class AdminUserCreatePayload(UserRegisterRequest):
    role: str


@router.post("/create-user", status_code=201)
def create_user(payload: AdminUserCreatePayload, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    if payload.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Choose from: {VALID_ROLES}")
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        id=str(uuid.uuid4()),
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        is_onboarded=False,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {
        "user_id": user.id,
        "name": user.name,
        "role": user.role,
        "email": user.email,
        "is_onboarded": user.is_onboarded,
        "is_active": user.is_active,
    }


class RoleUpdatePayload(BaseModel):
    role: str


class DocumentRequestUpdatePayload(BaseModel):
    status: str  # pending / in_review / approved / rejected
    reviewer_notes: Optional[str] = None
    assigned_to: Optional[str] = None


class SendAgreementFromRequestPayload(BaseModel):
    title: str
    content: str


# ── Auth ──────────────────────────────────────────────────────────────────────

@router.post("/login")
def admin_login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    return login_user(email=payload.email, password=payload.password, db=db, admin_only=True)


# ── User management ───────────────────────────────────────────────────────────

@router.get("/users")
def list_users(current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "is_active": u.is_active,
            "is_onboarded": u.is_onboarded,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: str,
    payload: RoleUpdatePayload,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if payload.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Choose from: {VALID_ROLES}")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = payload.role
    db.commit()
    return {"message": f"Role updated to '{payload.role}'", "user_id": user_id}


@router.put("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}", "is_active": user.is_active}


# ── Document requests ─────────────────────────────────────────────────────────

@router.get("/document-requests")
def list_all_document_requests(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    reqs = db.query(DocumentRequest).all()
    user_cache: dict = {}
    results = []
    for r in reqs:
        if r.user_id not in user_cache:
            u = db.query(User).filter(User.id == r.user_id).first()
            user_cache[r.user_id] = u
        u = user_cache[r.user_id]
        results.append({
            "id": r.id,
            "user_id": r.user_id,
            "user_name": u.name if u else "Unknown",
            "user_email": u.email if u else "",
            "doc_type": r.doc_type,
            "doc_category": r.doc_category,
            "notes": r.notes,
            "status": r.status,
            "assigned_to": r.assigned_to,
            "reviewer_notes": r.reviewer_notes,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    return results


@router.put("/document-requests/{req_id}")
def update_document_request(
    req_id: str,
    payload: DocumentRequestUpdatePayload,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    req = db.query(DocumentRequest).filter(DocumentRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Document request not found")
    req.status = payload.status
    if payload.reviewer_notes is not None:
        req.reviewer_notes = payload.reviewer_notes
    if payload.assigned_to is not None:
        req.assigned_to = payload.assigned_to
    db.commit()
    return {"message": "Document request updated", "id": req_id, "status": req.status}


@router.post("/document-requests/{req_id}/send-agreement", status_code=201)
def send_agreement_from_request(
    req_id: str,
    payload: SendAgreementFromRequestPayload,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Create and immediately send an agreement to the requesting user, fulfilling their document request."""
    req = db.query(DocumentRequest).filter(DocumentRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Document request not found")
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Requesting user not found")

    ag = Agreement(
        title=payload.title,
        content=payload.content,
        doc_type=req.doc_type,
        doc_category=req.doc_category,
        created_by=current_admin.id,
        sent_to=req.user_id,
        status="sent",
        source_request_id=req_id,
    )
    db.add(ag)
    req.status = "approved"
    db.commit()
    db.refresh(ag)
    return {
        "message": "Agreement created and sent to user",
        "agreement_id": ag.id,
        "sent_to": req.user_id,
        "request_id": req_id,
    }


# ── Verification management ───────────────────────────────────────────────────

@router.get("/verifications")
def list_all_verifications(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    import os
    verifications = db.query(AadhaarVerification).all()
    results = []
    for v in verifications:
        user = db.query(User).filter(User.id == v.user_id).first()
        results.append({
            "id": v.id,
            "user_id": v.user_id,
            "user_name": user.name if user else "Unknown",
            "user_email": user.email if user else "",
            "aadhaar_last4": v.aadhaar_last4,
            "is_valid": v.is_valid,
            "verified_at": v.verified_at.isoformat() if v.verified_at else None,
            "created_at": v.created_at.isoformat() if v.created_at else None,
            "scan_score": getattr(v, "scan_score", None),
            "face_submitted": getattr(v, "face_submitted", False),
            "has_id_card": bool(getattr(v, "id_card_path", None) and os.path.exists(v.id_card_path)),
            "has_face": bool(getattr(v, "face_path", None) and os.path.exists(v.face_path)),
        })
    return results


@router.get("/verifications/{user_id}/id-image", summary="Serve ID card image for a user")
def get_user_id_image(
    user_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    import os
    v = db.query(AadhaarVerification).filter(AadhaarVerification.user_id == user_id).first()
    if not v or not getattr(v, "id_card_path", None) or not os.path.exists(v.id_card_path):
        raise HTTPException(status_code=404, detail="ID card image not found")
    return FileResponse(v.id_card_path)


@router.get("/verifications/{user_id}/face-image", summary="Serve face image for a user")
def get_user_face_image(
    user_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    import os
    v = db.query(AadhaarVerification).filter(AadhaarVerification.user_id == user_id).first()
    if not v or not getattr(v, "face_path", None) or not os.path.exists(v.face_path):
        raise HTTPException(status_code=404, detail="Face image not found")
    return FileResponse(v.face_path)


@router.post("/verifications/{user_id}/approve")
def approve_verification(
    user_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    import datetime
    v = db.query(AadhaarVerification).filter(AadhaarVerification.user_id == user_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Verification record not found")
    v.is_valid = True
    v.verified_at = datetime.datetime.utcnow()
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.is_onboarded = True
    db.commit()
    return {"message": "Verification approved", "user_id": user_id}


@router.post("/verifications/{user_id}/reject")
def reject_verification(
    user_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    v = db.query(AadhaarVerification).filter(AadhaarVerification.user_id == user_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Verification record not found")
    v.is_valid = False
    v.verified_at = None
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.is_onboarded = False
    db.commit()
    return {"message": "Verification rejected", "user_id": user_id}


# ── All documents (admin view) ────────────────────────────────────────────────

@router.get("/documents")
def list_all_documents(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    docs = db.query(Document).all()
    return [
        {
            "id": d.id,
            "title": d.title,
            "description": d.description,
            "doc_type": d.doc_type,
            "doc_category": d.doc_category,
            "owner_id": d.owner_id,
            "assigned_by": d.assigned_by,
            "status": d.status,
            "is_signed": d.is_signed,
            "signed_at": d.signed_at.isoformat() if d.signed_at else None,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in docs
    ]
