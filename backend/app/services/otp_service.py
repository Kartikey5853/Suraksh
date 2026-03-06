import random
import string
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.otp import OTPRecord


def generate_otp(user_id: str, db: Session) -> str:
    # Invalidate any existing unused OTPs for this user
    db.query(OTPRecord).filter(
        OTPRecord.user_id == user_id,
        OTPRecord.used == False,
    ).delete()

    code = "".join(random.choices(string.digits, k=6))
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)

    record = OTPRecord(user_id=user_id, code=code, expires_at=expires)
    db.add(record)
    db.commit()

    # Print to terminal (development only)
    print(f"\n{'=' * 50}")
    print(f"[OTP] User ID : {user_id}")
    print(f"[OTP] Code    : {code}")
    print(f"[OTP] Expires : {expires.strftime('%H:%M:%S UTC')}")
    print(f"{'=' * 50}\n")

    return code


def verify_otp(user_id: str, code: str, db: Session) -> bool:
    now = datetime.now(timezone.utc)
    record = (
        db.query(OTPRecord)
        .filter(
            OTPRecord.user_id == user_id,
            OTPRecord.code == code,
            OTPRecord.used == False,
            OTPRecord.expires_at > now,
        )
        .first()
    )

    if not record:
        return False

    record.used = True
    db.commit()
    return True
