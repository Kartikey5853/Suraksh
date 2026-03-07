"""
Agreement routes — full pipeline: draft → lawyer review → send to user → signed/rejected.
Includes AI generation via Gemini and per-agreement timeline.
"""
import hashlib
import json
import re
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth_dependencies import get_current_admin, get_current_user
from app.models.agreement import Agreement, AgreementEvent
from app.models.user import User
from app.models.signature import Signature

router = APIRouter(prefix="/agreements", tags=["Agreements"])


# ── Payloads ─────────────────────────────────────────────────────────────────

class AgreementCreatePayload(BaseModel):
    title: str
    content: str
    doc_type: str
    doc_category: str = "general"
    sent_to: Optional[str] = None
    send_to_lawyer: Optional[str] = None
    key_points: Optional[str] = None


class AgreementGeneratePayload(BaseModel):
    prompt: str
    doc_type: str
    doc_category: str = "general"
    title: Optional[str] = None


class AgreementRejectPayload(BaseModel):
    reason: str = ""


class AgreementSendPayload(BaseModel):
    user_id: str


class LawyerReviewPayload(BaseModel):
    action: str
    notes: str = ""


class SendToLawyerPayload(BaseModel):
    lawyer_id: str


class PipelineHoldPayload(BaseModel):
    notes: str = ""


# ── Helpers ───────────────────────────────────────────────────────────────────

def _add_event(db, agreement_id, event_type, actor=None, notes=None):
    ev = AgreementEvent(
        agreement_id=agreement_id,
        event_type=event_type,
        actor_id=actor.id if actor else None,
        actor_name=actor.name if actor else None,
        notes=notes,
        timestamp=datetime.utcnow(),
    )
    db.add(ev)


def _serialize(ag: Agreement, db=None):
    sent_to_name = None
    lawyer_name = None
    created_by_name = None
    if db:
        if ag.sent_to:
            u = db.query(User).filter(User.id == ag.sent_to).first()
            sent_to_name = u.name if u else None
        if ag.lawyer_id:
            l = db.query(User).filter(User.id == ag.lawyer_id).first()
            lawyer_name = l.name if l else None
        if ag.created_by:
            c = db.query(User).filter(User.id == ag.created_by).first()
            created_by_name = c.name if c else None

    try:
        key_points_parsed = json.loads(ag.key_points) if ag.key_points else None
    except Exception:
        key_points_parsed = None

    # Compute content hash and extract keywords on-the-fly
    content_hash = hashlib.sha256(ag.content.encode()).hexdigest() if ag.content else None
    _stop = {"shall", "party", "under", "agree", "which", "their", "herein", "thereof", "provided",
             "pursuant", "above", "document", "agreement", "agreements", "parties", "company",
             "terms", "where", "after", "before", "other", "these", "those"}
    _words = re.findall(r'\b[a-z]{5,}\b', ag.content.lower()) if ag.content else []
    _freq: dict = {}
    for w in _words:
        _freq[w] = _freq.get(w, 0) + 1
    keywords = [w for w, _ in sorted(_freq.items(), key=lambda x: -x[1]) if w not in _stop][:10]

    return {
        "id": ag.id,
        "title": ag.title,
        "content": ag.content,
        "doc_type": ag.doc_type,
        "doc_category": ag.doc_category,
        "created_by": ag.created_by,
        "created_by_name": created_by_name,
        "sent_to": ag.sent_to,
        "sent_to_name": sent_to_name,
        "pipeline_stage": getattr(ag, "pipeline_stage", "draft"),
        "status": ag.status,
        "is_signed": ag.is_signed,
        "signed_at": ag.signed_at.isoformat() if ag.signed_at else None,
        "rejection_reason": ag.rejection_reason,
        "lawyer_id": getattr(ag, "lawyer_id", None),
        "lawyer_name": lawyer_name,
        "lawyer_notes": getattr(ag, "lawyer_notes", None),
        "lawyer_status": getattr(ag, "lawyer_status", None),
        "lawyer_reviewed_at": ag.lawyer_reviewed_at.isoformat() if getattr(ag, "lawyer_reviewed_at", None) else None,
        "key_points": key_points_parsed,
        "analysis_result": json.loads(ag.analysis_result) if getattr(ag, "analysis_result", None) else None,
        "user_analysis_result": json.loads(ag.user_analysis_result) if getattr(ag, "user_analysis_result", None) else None,
        "source_request_id": ag.source_request_id,
        "signature_snapshot": ag.signature_snapshot,
        "created_at": ag.created_at.isoformat() if ag.created_at else None,
        "updated_at": ag.updated_at.isoformat() if ag.updated_at else None,
        "content_hash": content_hash,
        "keywords": keywords,
    }


# ── AI Generation ─────────────────────────────────────────────────────────────

@router.post("/generate")
def generate_agreement_ai(payload: AgreementGeneratePayload, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    from app.services.gemini_service import generate_agreement
    try:
        result = generate_agreement(prompt=payload.prompt, doc_type=payload.doc_type, doc_category=payload.doc_category, title=payload.title)
        return {"content": result["content"], "key_points": result["key_points"]}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


# ── AI Analysis / Scoring ─────────────────────────────────────────────────────

class AgreementAnalyzePayload(BaseModel):
    content: str
    doc_type: str = "Agreement"

@router.post("/analyze")
def analyze_agreement_ai(payload: AgreementAnalyzePayload, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    from app.services.gemini_service import analyze_agreement
    try:
        result = analyze_agreement(content=payload.content, doc_type=payload.doc_type)
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")


# ── Template: return pre-built template ──────────────────────────────────────

@router.get("/template")
def get_template(doc_type: str = "NDA", doc_category: str = ""):
    """Return a pre-built template string for the given doc_type."""
    from app.services.gemini_service import get_category_template
    return {"doc_type": doc_type, "content": get_category_template(doc_type, doc_category)}


# ── Finalize: run AI analysis and store result ────────────────────────────────

@router.post("/{agreement_id}/finalize")
def finalize_agreement(agreement_id: str, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Run company-perspective AI analysis and store in agreement.analysis_result."""
    from app.services.gemini_service import analyze_agreement
    ag = db.query(Agreement).filter(Agreement.id == agreement_id).first()
    if not ag:
        raise HTTPException(status_code=404, detail="Agreement not found")
    try:
        result = analyze_agreement(content=ag.content, doc_type=ag.doc_type)
        ag.analysis_result = json.dumps(result)
        ag.updated_at = datetime.utcnow()
        _add_event(db, ag.id, "finalized", actor=current_admin, notes="AI analysis completed (company perspective)")
        db.commit()
        db.refresh(ag)
        return {"analysis": result, "agreement": _serialize(ag, db)}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI finalize failed: {str(e)}")


@router.post("/{agreement_id}/finalize-user")
def finalize_agreement_user(agreement_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Run user-perspective AI analysis and store in agreement.user_analysis_result."""
    from app.services.gemini_service import analyze_agreement_user
    ag = db.query(Agreement).filter(Agreement.id == agreement_id).first()
    if not ag:
        raise HTTPException(status_code=404, detail="Agreement not found")
    try:
        result = analyze_agreement_user(content=ag.content, doc_type=ag.doc_type)
        ag.user_analysis_result = json.dumps(result)
        ag.updated_at = datetime.utcnow()
        _add_event(db, ag.id, "user_finalized", actor=current_user, notes="AI analysis completed (personal perspective)")
        db.commit()
        db.refresh(ag)
        return {"analysis": result, "agreement": _serialize(ag, db)}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI finalize failed: {str(e)}") 


# ── Admin: create ─────────────────────────────────────────────────────────────

@router.post("", status_code=201)
def create_agreement(payload: AgreementCreatePayload, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    if payload.send_to_lawyer:
        lawyer = db.query(User).filter(User.id == payload.send_to_lawyer, User.role == "lawyer").first()
        if not lawyer:
            raise HTTPException(status_code=404, detail="Lawyer not found")
        pipeline_stage = "lawyer_review"
        status = "pending_lawyer_review"
    elif payload.sent_to:
        user = db.query(User).filter(User.id == payload.sent_to).first()
        if not user:
            raise HTTPException(status_code=404, detail="Target user not found")
        pipeline_stage = "sent"
        status = "sent"
    else:
        pipeline_stage = "draft"
        status = "draft"

    kp = payload.key_points
    if isinstance(kp, dict):
        kp = json.dumps(kp)

    ag = Agreement(
        title=payload.title,
        content=payload.content,
        doc_type=payload.doc_type,
        doc_category=payload.doc_category,
        created_by=current_admin.id,
        sent_to=payload.sent_to,
        pipeline_stage=pipeline_stage,
        status=status,
        lawyer_id=payload.send_to_lawyer,
        lawyer_status="pending" if payload.send_to_lawyer else None,
        key_points=kp,
    )
    db.add(ag)
    db.flush()

    _add_event(db, ag.id, "created", actor=current_admin)
    if payload.send_to_lawyer:
        _add_event(db, ag.id, "sent_to_lawyer", actor=current_admin, notes=f"Sent to lawyer for review")
    elif payload.sent_to:
        _add_event(db, ag.id, "sent_to_user", actor=current_admin)

    db.commit()
    db.refresh(ag)
    return _serialize(ag, db)


# ── Admin: list all ───────────────────────────────────────────────────────────

@router.get("")
def list_all_agreements(current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    ags = db.query(Agreement).all()
    return [_serialize(a, db) for a in ags]


# ── Admin: send a draft to a user ─────────────────────────────────────────────

@router.post("/{agreement_id}/send")
def send_agreement(agreement_id: str, payload: AgreementSendPayload, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    ag = db.query(Agreement).filter(Agreement.id == agreement_id).first()
    if not ag:
        raise HTTPException(status_code=404, detail="Agreement not found")
    if getattr(ag, "pipeline_stage", "") == "lawyer_review":
        raise HTTPException(status_code=400, detail="Agreement pending lawyer review — wait for approval first.")
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Target user not found")
    ag.sent_to = payload.user_id
    ag.status = "sent"
    ag.pipeline_stage = "sent"
    ag.updated_at = datetime.utcnow()
    _add_event(db, ag.id, "sent_to_user", actor=current_admin, notes=f"Sent to user: {user.name}")
    db.commit()
    db.refresh(ag)
    return _serialize(ag, db)


# ── Admin: send to lawyer ─────────────────────────────────────────────────────

@router.post("/{agreement_id}/send-to-lawyer")
def send_to_lawyer(agreement_id: str, payload: SendToLawyerPayload, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    ag = db.query(Agreement).filter(Agreement.id == agreement_id).first()
    if not ag:
        raise HTTPException(status_code=404, detail="Agreement not found")
    lawyer = db.query(User).filter(User.id == payload.lawyer_id, User.role == "lawyer").first()
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")
    ag.lawyer_id = payload.lawyer_id
    ag.lawyer_status = "pending"
    ag.pipeline_stage = "lawyer_review"
    ag.status = "pending_lawyer_review"
    ag.updated_at = datetime.utcnow()
    _add_event(db, ag.id, "sent_to_lawyer", actor=current_admin, notes=f"Sent to {lawyer.name} for review")
    db.commit()
    db.refresh(ag)
    return _serialize(ag, db)


# ── Admin: hold / resume pipeline ────────────────────────────────────────────

@router.post("/{agreement_id}/hold")
def put_on_hold(agreement_id: str, payload: PipelineHoldPayload, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    ag = db.query(Agreement).filter(Agreement.id == agreement_id).first()
    if not ag:
        raise HTTPException(status_code=404, detail="Agreement not found")
    ag.pipeline_stage = "on_hold"
    ag.status = "on_hold"
    ag.updated_at = datetime.utcnow()
    _add_event(db, ag.id, "put_on_hold", actor=current_admin, notes=payload.notes or "Pipeline paused")
    db.commit()
    db.refresh(ag)
    return _serialize(ag, db)


@router.post("/{agreement_id}/resume")
def resume_pipeline(agreement_id: str, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    ag = db.query(Agreement).filter(Agreement.id == agreement_id).first()
    if not ag:
        raise HTTPException(status_code=404, detail="Agreement not found")
    ls = getattr(ag, "lawyer_status", None)
    if ag.lawyer_id and ls == "approved":
        ag.pipeline_stage = "lawyer_approved"
        ag.status = "lawyer_approved"
    elif ag.lawyer_id:
        ag.pipeline_stage = "lawyer_review"
        ag.status = "pending_lawyer_review"
    else:
        ag.pipeline_stage = "draft"
        ag.status = "draft"
    ag.updated_at = datetime.utcnow()
    _add_event(db, ag.id, "resumed", actor=current_admin)
    db.commit()
    db.refresh(ag)
    return _serialize(ag, db)


# ── Timeline ──────────────────────────────────────────────────────────────────

@router.get("/{agreement_id}/timeline")
def get_timeline(agreement_id: str, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    ag = db.query(Agreement).filter(Agreement.id == agreement_id).first()
    if not ag:
        raise HTTPException(status_code=404, detail="Agreement not found")
    events = db.query(AgreementEvent).filter(AgreementEvent.agreement_id == agreement_id).order_by(AgreementEvent.timestamp).all()
    return {
        "agreement": _serialize(ag, db),
        "timeline": [{"id": e.id, "event_type": e.event_type, "actor_name": e.actor_name, "notes": e.notes, "timestamp": e.timestamp.isoformat()} for e in events],
    }


# ── Lawyer: see their assigned agreements ─────────────────────────────────────

@router.get("/lawyer/pending")
def get_lawyer_agreements(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ("lawyer", "admin"):
        raise HTTPException(status_code=403, detail="Lawyer access required")
    ags = db.query(Agreement).filter(Agreement.lawyer_id == current_user.id).all()
    return [_serialize(a, db) for a in ags]


# ── Lawyer: approve / reject ──────────────────────────────────────────────────

@router.post("/{agreement_id}/lawyer-review")
def lawyer_review(agreement_id: str, payload: LawyerReviewPayload, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ("lawyer", "admin"):
        raise HTTPException(status_code=403, detail="Lawyer access required")
    ag = db.query(Agreement).filter(Agreement.id == agreement_id).first()
    if not ag:
        raise HTTPException(status_code=404, detail="Agreement not found")
    if ag.lawyer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="This agreement is not assigned to you")
    if payload.action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="action must be approve or reject")

    ag.lawyer_notes = payload.notes
    ag.lawyer_reviewed_at = datetime.utcnow()
    ag.updated_at = datetime.utcnow()

    if payload.action == "approve":
        ag.lawyer_status = "approved"
        ag.pipeline_stage = "lawyer_approved"
        ag.status = "lawyer_approved"
        _add_event(db, ag.id, "lawyer_approved", actor=current_user, notes=payload.notes)
    else:
        ag.lawyer_status = "rejected"
        ag.pipeline_stage = "lawyer_rejected"
        ag.status = "lawyer_rejected"
        _add_event(db, ag.id, "lawyer_rejected", actor=current_user, notes=payload.notes)

    db.commit()
    db.refresh(ag)
    return _serialize(ag, db)


# ── User: get their agreements ────────────────────────────────────────────────

@router.get("/mine")
def get_my_agreements(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ags = db.query(Agreement).filter(Agreement.sent_to == current_user.id).all()
    return [_serialize(a, db) for a in ags]


# ── User: sign ────────────────────────────────────────────────────────────────

@router.post("/{agreement_id}/sign")
def sign_agreement(agreement_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ag = db.query(Agreement).filter(Agreement.id == agreement_id, Agreement.sent_to == current_user.id).first()
    if not ag:
        raise HTTPException(status_code=404, detail="Agreement not found or not sent to you")
    if ag.is_signed:
        return {"message": "Already signed", "agreement": _serialize(ag, db)}
    sig = db.query(Signature).filter(Signature.user_id == current_user.id).first()
    ag.is_signed = True
    ag.status = "signed"
    ag.pipeline_stage = "completed"
    ag.signed_at = datetime.utcnow()
    ag.updated_at = datetime.utcnow()
    if sig:
        ag.signature_snapshot = sig.image_data
    _add_event(db, ag.id, "signed", actor=current_user)
    db.commit()
    db.refresh(ag)
    return {"message": "Agreement signed", "agreement": _serialize(ag, db)}


# ── User: reject ──────────────────────────────────────────────────────────────

@router.post("/{agreement_id}/reject")
def reject_agreement(agreement_id: str, payload: AgreementRejectPayload, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ag = db.query(Agreement).filter(Agreement.id == agreement_id, Agreement.sent_to == current_user.id).first()
    if not ag:
        raise HTTPException(status_code=404, detail="Agreement not found or not sent to you")
    if ag.is_signed:
        raise HTTPException(status_code=400, detail="Cannot reject an already signed agreement")
    ag.status = "rejected"
    ag.pipeline_stage = "rejected"
    ag.rejection_reason = payload.reason
    ag.updated_at = datetime.utcnow()
    _add_event(db, ag.id, "rejected_by_user", actor=current_user, notes=payload.reason)
    db.commit()
    db.refresh(ag)
    return {"message": "Agreement rejected", "agreement": _serialize(ag, db)}
