from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth_dependencies import get_current_user
from app.models.document import Document
from app.models.document_request import DocumentRequest
from app.models.signature import Signature
from app.models.user import User

router = APIRouter(prefix="/user", tags=["User"])


class SignaturePayload(BaseModel):
    image_data: str  # base64 PNG data URL


class DocumentRequestPayload(BaseModel):
    doc_type: str
    doc_category: str
    notes: Optional[str] = None


@router.get("/me")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role,
        "is_onboarded": current_user.is_onboarded,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }


@router.post("/signature")
def save_signature(
    payload: SignaturePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(Signature).filter(Signature.user_id == current_user.id).first()
    if existing:
        existing.image_data = payload.image_data
    else:
        db.add(Signature(user_id=current_user.id, image_data=payload.image_data))
    current_user.is_onboarded = True
    db.commit()
    return {"message": "Signature saved. Onboarding complete."}


@router.get("/documents")
def get_documents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.owner_id == current_user.id).all()
    return [
        {
            "id": d.id,
            "title": d.title,
            "description": d.description,
            "doc_type": d.doc_type,
            "doc_category": d.doc_category,
            "status": d.status,
            "is_signed": d.is_signed,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in docs
    ]


@router.post("/document-requests", status_code=201)
def create_document_request(
    payload: DocumentRequestPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    req = DocumentRequest(
        user_id=current_user.id,
        doc_type=payload.doc_type,
        doc_category=payload.doc_category,
        notes=payload.notes,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return {"id": req.id, "status": req.status, "message": "Document request submitted successfully"}


@router.get("/document-requests")
def list_document_requests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reqs = db.query(DocumentRequest).filter(DocumentRequest.user_id == current_user.id).all()
    return [
        {
            "id": r.id,
            "doc_type": r.doc_type,
            "doc_category": r.doc_category,
            "notes": r.notes,
            "status": r.status,
            "reviewer_notes": r.reviewer_notes,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reqs
    ]


@router.get("/signature")
def get_signature(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sig = db.query(Signature).filter(Signature.user_id == current_user.id).first()
    if not sig:
        return {"image_data": None}
    return {"image_data": sig.image_data}


class ProfileUpdatePayload(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None


@router.put("/me")
def update_profile(
    payload: ProfileUpdatePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.name:
        current_user.name = payload.name
    if payload.phone:
        current_user.phone = payload.phone
    db.commit()
    return {"message": "Profile updated", "name": current_user.name, "phone": current_user.phone}
