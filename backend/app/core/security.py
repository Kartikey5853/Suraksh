import bcrypt

# bcrypt hard-limits input to 72 bytes.  Slicing a Python *str* at [:72]
# counts characters, not bytes — a single emoji is 4 bytes, so a
# 72-char password can exceed the limit.  Always truncate the *bytes*
# representation before passing it to bcrypt.
_BCRYPT_MAX_BYTES = 72


def _prepare(plain: str) -> bytes:
    """Encode to UTF-8 and truncate to the bcrypt byte limit."""
    return plain.encode("utf-8")[:_BCRYPT_MAX_BYTES]


def hash_password(plain: str) -> str:
    """Return a bcrypt hash string suitable for storing in the database."""
    return bcrypt.hashpw(_prepare(plain), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if *plain* matches the stored bcrypt *hashed* string."""
    return bcrypt.checkpw(_prepare(plain), hashed.encode("utf-8"))

