from passlib.context import CryptContext

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    # bcrypt only supports passwords up to 72 bytes
    # Truncate to 72 characters (assuming UTF-8, this is safe for ASCII)
    return _pwd_context.hash(plain[:72])


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)

