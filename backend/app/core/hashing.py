"""
Suraksh - Document Hashing Utilities
SHA-256 based integrity checks for uploaded documents.
Placeholder — logic stubs only.
"""

import hashlib
from typing import Optional


def compute_document_hash(file_bytes: bytes) -> str:
    """
    Compute the SHA-256 digest of raw document bytes.
    Store the hex digest alongside the document to detect tampering.

    TODO: Stream large files in chunks to avoid holding them in memory.
    """
    # placeholder
    return hashlib.sha256(file_bytes).hexdigest()


def verify_document_integrity(file_bytes: bytes, stored_hash: str) -> bool:
    """
    Re-compute the SHA-256 of the supplied bytes and compare with the
    stored hash.  Returns True only when they match.

    TODO: Add timestamp-based signing for non-repudiation.
    """
    # placeholder
    computed = compute_document_hash(file_bytes)
    return computed == stored_hash


def compute_string_hash(value: str) -> str:
    """
    Convenience wrapper: hash a UTF-8 string and return the hex digest.
    Used for hashing metadata fields before persistence.

    TODO: Replace with HMAC when a server secret is available.
    """
    # placeholder
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def generate_document_fingerprint(
    filename: str,
    uploader_id: str,
    upload_timestamp: str,
) -> str:
    """
    Combine document metadata into a deterministic fingerprint string.
    Used for audit-trail purposes.

    TODO: Include document content hash in the fingerprint.
    """
    # placeholder
    raw = f"{filename}:{uploader_id}:{upload_timestamp}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()
