"""
Suraksh - Verification Schemas (Pydantic)
Request / response models for KYC / identity verification endpoints.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ── Upload requests ────────────────────────────────────────────────────────────

class UploadIDRequest(BaseModel):
    """
    Metadata accompanying a government ID upload.
    Actual file bytes arrive via FastAPI UploadFile.
    """
    id_document_type: str = "national_id"
    # NOTE: any raw ID text extracted from the doc must be HASHED before storage


class UploadFaceRequest(BaseModel):
    """
    Metadata accompanying a face image upload.
    Actual file bytes arrive via FastAPI UploadFile.

    TODO: Add liveness challenge token once biometric service is integrated.
    """
    pass


# ── Status response ────────────────────────────────────────────────────────────

class VerificationStatusResponse(BaseModel):
    id: str
    user_id: str
    status: str
    id_document_type: Optional[str]
    face_match_score: Optional[float]
    liveness_score: Optional[float]
    reviewer_notes: Optional[str]
    submitted_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
