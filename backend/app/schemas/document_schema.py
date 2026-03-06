"""
Suraksh - Document Schemas (Pydantic)
Request / response models for document-related endpoints.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ── Shared ─────────────────────────────────────────────────────────────────────

class DocumentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=512)
    description: Optional[str] = None
    document_type: str = "other"


# ── Admin upload ───────────────────────────────────────────────────────────────

class AdminUploadDocumentRequest(DocumentBase):
    """Payload sent by an admin when uploading a new document."""
    # file arrives via UploadFile — this schema covers the form fields only
    pass


# ── Admin create agreement (placeholder) ──────────────────────────────────────

class CreateAgreementRequest(BaseModel):
    """
    Placeholder schema for agreement creation.
    TODO: Define agreement fields when agreement engine is implemented.
    """
    title: str
    parties: list[str] = Field(default_factory=list)


# ── Admin send document ────────────────────────────────────────────────────────

class SendDocumentRequest(BaseModel):
    document_id: str
    recipient_user_id: str
    message: Optional[str] = None


# ── Sign / Reject ──────────────────────────────────────────────────────────────

class SignDocumentRequest(BaseModel):
    document_id: str
    # Signature placeholder — actual signing logic TBD
    signature_token: Optional[str] = None


class RejectDocumentRequest(BaseModel):
    document_id: str
    reason: Optional[str] = Field(None, max_length=1024)


# ── Filter (placeholder) ───────────────────────────────────────────────────────

class DocumentFilterRequest(BaseModel):
    """
    Placeholder for document filtering params.
    TODO: Add date range, status, document_type filters.
    """
    status: Optional[str] = None
    document_type: Optional[str] = None


# ── Response ───────────────────────────────────────────────────────────────────

class DocumentResponse(BaseModel):
    id: str
    owner_id: str
    title: str
    description: Optional[str]
    document_type: str
    status: str
    is_signed: bool
    integrity_hash: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
