"""
Suraksh - Document Routes
GET  /documents
GET  /documents/{id}
POST /documents/sign
POST /documents/reject

Document SHA-256 integrity hash placeholder is noted in the sign endpoint.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth_dependencies import get_current_user
from app.models.user import User
from app.schemas.document_schema import (
    DocumentResponse,
    RejectDocumentRequest,
    SignDocumentRequest,
)
from app.services import document_service

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.get(
    "",
    summary="List all accessible documents for the authenticated user",
)
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return documents that the authenticated user is allowed to see.

    TODO: Add pagination (skip / limit).
    TODO: Add role-based filtering (user sees own docs; admin sees all).
    """
    # placeholder
    return await document_service.get_documents_for_user(current_user, db)


@router.get(
    "/{doc_id}",
    response_model=DocumentResponse,
    summary="Retrieve a single document by ID",
)
async def get_document(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return a single document.  Enforces ownership / access control.

    TODO: Verify current_user has permission to read this document.
    TODO: Re-compute integrity hash and verify before returning.
    """
    # placeholder
    return await document_service.get_document_by_id(doc_id, current_user, db)


@router.post(
    "/sign",
    summary="Sign a document",
)
async def sign_document(
    payload: SignDocumentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mark a document as signed by the authenticated user.

    Security placeholder:
      - Before signing, re-verify the integrity_hash stored on the Document
        record against the current file bytes via hashing.verify_document_integrity().
      - If the hash does not match, reject the signing attempt.

    TODO: Implement cryptographic signature (e.g. PKCS#7 / CAdES).
    TODO: Append to audit trail.
    """
    # placeholder — document SHA256 integrity check before signing
    return await document_service.sign_document(payload, current_user, db)


@router.post(
    "/reject",
    summary="Reject a document",
)
async def reject_document(
    payload: RejectDocumentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mark a document as rejected and record the reason.

    TODO: Notify the document owner of the rejection.
    TODO: Append to audit trail.
    """
    # placeholder
    return await document_service.reject_document(payload, current_user, db)
