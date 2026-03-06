"""
Suraksh - Admin Routes
GET  /admin/dashboard
POST /admin/upload-document
POST /admin/create-agreement
POST /admin/send-document
GET  /admin/filter-documents

All routes are protected by the admin_user dependency.
Agreement generation, scoring, and search are NOT yet implemented.
"""

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth_dependencies import get_admin_user
from app.models.user import User
from app.schemas.document_schema import (
    AdminUploadDocumentRequest,
    CreateAgreementRequest,
    DocumentFilterRequest,
    SendDocumentRequest,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get(
    "/dashboard",
    summary="Admin dashboard statistics overview",
)
async def admin_dashboard(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Return aggregate statistics for the admin dashboard.

    Placeholder stats:
      - total users
      - pending verifications
      - documents by status

    TODO: Implement with real queries.
    """
    # placeholder
    pass


@router.post(
    "/upload-document",
    status_code=201,
    summary="Admin uploads a document to the platform",
)
async def upload_document(
    metadata: AdminUploadDocumentRequest = Depends(),
    file: UploadFile = File(...),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Upload a document as an admin.

    Steps (placeholders):
      1. Read file bytes.
      2. Compute SHA-256 integrity hash via hashing.compute_document_hash().
      3. Save file to storage.
      4. Persist Document record with integrity_hash.

    TODO: Integrate with cloud storage (Supabase Storage / Azure Blob).
    """
    # placeholder
    pass


@router.post(
    "/create-agreement",
    status_code=201,
    summary="Create a new agreement document (placeholder)",
)
async def create_agreement(
    payload: CreateAgreementRequest,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Placeholder for the agreement generation engine.

    TODO: Implement template rendering, clause assembly, and PDF generation.
    NOT YET IMPLEMENTED — agreement generation logic pending.
    """
    # placeholder — agreement generation engine not implemented
    pass


@router.post(
    "/send-document",
    summary="Send a document to a user",
)
async def send_document(
    payload: SendDocumentRequest,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Assign / route an existing document to a target user.

    TODO: Implement notification dispatch (email / in-app).
    """
    # placeholder
    pass


@router.get(
    "/filter-documents",
    summary="Filter and search documents (placeholder)",
)
async def filter_documents(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    status: str | None = None,
    document_type: str | None = None,
):
    """
    Return documents matching the supplied filters.

    TODO: Add full-text / semantic search when search engine is ready.
    TODO: Add pagination (skip / limit).
    NOT YET IMPLEMENTED — search logic pending.
    """
    # placeholder — semantic document search not implemented
    pass
