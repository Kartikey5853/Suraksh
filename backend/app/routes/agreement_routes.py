from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth_dependencies import get_current_admin, get_current_user
from app.models.agreement import Agreement
from app.models.user import User
from app.models.signature import Signature

router = APIRouter(prefix="/agreements", tags=["Agreements"])


class AgreementCreatePayload(BaseModel):
    title: str
    content: str
    doc_type: str
    doc_category: str = "general"
    sent_to: Optional[str] = None   # user_id to send to immediately


class AgreementRejectPayload(BaseModel):
    reason: str = ""


class AgreementSendPayload(BaseModel):
    user_id: str


class AgreementSignPayload(BaseModel):
    pass   # signature comes from saved user signature


# ── Admin: create ─────────────────────────────────────────────────────────────

@router.post("", status_code=201)
def create_agreement(
    payload: AgreementCreatePayload,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    status = "draft"
    if payload.sent_to:
        user = db.query(User).filter(User.id == payload.sent_to).first()
        if not user:
            raise HTTPException(status_code=404, detail="Target user not found")
        status = "sent"

    ag = Agreement(
        title=payload.title,
        content=payload.content,
        doc_type=payload.doc_type,
        doc_category=payload.doc_category,
        created_by=current_admin.id,
        sent_to=payload.sent_to,
        status=status,
    )
    db.add(ag)
    db.commit()
    db.refresh(ag)
    return _serialize(ag)


# ── Admin: list all agreements ────────────────────────────────────────────────

@router.get("")
def list_all_agreements(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    ags = db.query(Agreement).all()
    return [_serialize(a) for a in ags]


# ── Admin: send a draft to a user ─────────────────────────────────────────────

@router.post("/{agreement_id}/send")
def send_agreement(
    agreement_id: str,
    payload: AgreementSendPayload,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    ag = db.query(Agreement).filter(Agreement.id == agreement_id).first()
    if not ag:
        raise HTTPException(status_code=404, detail="Agreement not found")
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Target user not found")
    ag.sent_to = payload.user_id
    ag.status = "sent"
    db.commit()
    db.refresh(ag)
    return _serialize(ag)


# ── User: get their pending agreements ────────────────────────────────────────

@router.get("/mine")
def get_my_agreements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ags = db.query(Agreement).filter(Agreement.sent_to == current_user.id).all()
    return [_serialize(a) for a in ags]


# ── User: sign an agreement ───────────────────────────────────────────────────

@router.post("/{agreement_id}/sign")
def sign_agreement(
    agreement_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ag = db.query(Agreement).filter(Agreement.id == agreement_id, Agreement.sent_to == current_user.id).first()
    if not ag:
        raise HTTPException(status_code=404, detail="Agreement not found or not sent to you")
    if ag.is_signed:
        return {"message": "Already signed", "agreement": _serialize(ag)}

    # capture their saved signature
    sig = db.query(Signature).filter(Signature.user_id == current_user.id).first()
    ag.is_signed = True
    ag.status = "signed"
    from datetime import datetime
    ag.signed_at = datetime.utcnow()
    if sig:
        ag.signature_snapshot = sig.image_data
    db.commit()
    db.refresh(ag)
    return {"message": "Agreement signed", "agreement": _serialize(ag)}


# ── User: reject an agreement ─────────────────────────────────────────────────

@router.post("/{agreement_id}/reject")
def reject_agreement(
    agreement_id: str,
    payload: AgreementRejectPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ag = db.query(Agreement).filter(Agreement.id == agreement_id, Agreement.sent_to == current_user.id).first()
    if not ag:
        raise HTTPException(status_code=404, detail="Agreement not found or not sent to you")
    if ag.is_signed:
        raise HTTPException(status_code=400, detail="Cannot reject an already signed agreement")
    ag.status = "rejected"
    ag.rejection_reason = payload.reason
    from datetime import datetime
    ag.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ag)
    return {"message": "Agreement rejected", "agreement": _serialize(ag)}


def _serialize(ag: Agreement):
    return {
        "id": ag.id,
        "title": ag.title,
        "content": ag.content,
        "doc_type": ag.doc_type,
        "doc_category": ag.doc_category,
        "created_by": ag.created_by,
        "sent_to": ag.sent_to,
        "status": ag.status,
        "is_signed": ag.is_signed,
        "signed_at": ag.signed_at.isoformat() if ag.signed_at else None,
        "rejection_reason": ag.rejection_reason,
        "source_request_id": ag.source_request_id,
        "signature_snapshot": ag.signature_snapshot,
        "created_at": ag.created_at.isoformat() if ag.created_at else None,
    }
