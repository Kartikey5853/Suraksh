"""
Suraksh - Security Utilities
Placeholder wrappers for password hashing (bcrypt) and verification.
Full implementation stays here — callers never touch bcrypt directly.
"""

from passlib.context import CryptContext

# bcrypt is the single active scheme; auto=deprecated ensures old hashes
# are flagged when a user logs in, ready for rehashing in a future pass.
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """
    Hash a plain-text password using bcrypt.
    Store the returned string in the database — never the plain text.

    TODO: Add pepper value from settings before hashing for extra security.
    """
    # placeholder — returns bcrypt hash
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against a stored bcrypt hash.

    TODO: Strip/apply pepper before verification when pepper is introduced.
    """
    # placeholder — returns True/False
    return _pwd_context.verify(plain_password, hashed_password)


def hash_government_id(gov_id: str) -> str:
    """
    Placeholder: hash a government ID number before storing.
    A government ID must NEVER be stored in plain text.

    TODO: Use HMAC-SHA256 with a server-side secret key, not plain SHA256.
    """
    import hashlib
    # placeholder — simple SHA256 for now, replace with HMAC in production
    return hashlib.sha256(gov_id.encode()).hexdigest()


def hash_sensitive_metadata(value: str) -> str:
    """
    Generic placeholder for hashing any sensitive metadata field.

    TODO: Determine per-field strategy (HMAC vs deterministic encryption).
    """
    import hashlib
    return hashlib.sha256(value.encode()).hexdigest()
