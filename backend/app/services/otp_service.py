import random
import string
from datetime import datetime, timedelta, timezone

import resend
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.otp import OTPRecord

resend.api_key = settings.RESEND_API_KEY

_OTP_EMAIL_HTML = """
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body {{ margin:0; padding:0; background:#0a0a0a; font-family: 'Segoe UI', Arial, sans-serif; color:#e5e5e5; }}
    .wrapper {{ max-width:520px; margin:40px auto; background:#111; border:1px solid #d4af3730; border-radius:16px; overflow:hidden; }}
    .header {{ background:linear-gradient(135deg,#0a0a0a 0%,#1a1a0a 100%); padding:32px 40px 24px; text-align:center; border-bottom:1px solid #d4af3720; }}
    .logo-text {{ font-size:36px; color:#d4af37; letter-spacing:0.05em; font-weight:400; margin:0 0 4px; }}
    .tagline {{ font-size:11px; color:#888; letter-spacing:0.15em; text-transform:uppercase; }}
    .body {{ padding:36px 40px; }}
    .greeting {{ font-size:15px; color:#ccc; margin-bottom:20px; }}
    .otp-block {{ background:#0a0a0a; border:1px solid #d4af3740; border-radius:12px; padding:24px; text-align:center; margin:24px 0; }}
    .otp-label {{ font-size:11px; color:#888; letter-spacing:0.18em; text-transform:uppercase; margin-bottom:12px; }}
    .otp-code {{ font-size:44px; letter-spacing:0.3em; color:#d4af37; font-weight:700; font-family:monospace; }}
    .otp-note {{ font-size:12px; color:#666; margin-top:12px; }}
    .divider {{ border:none; border-top:1px solid #222; margin:24px 0; }}
    .footer {{ font-size:11px; color:#555; text-align:center; padding:0 40px 28px; line-height:1.7; }}
    .emerald {{ color:#10b981; }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-text">Suraksh</div>
      <div class="tagline">India's Trusted Legal Document Platform</div>
    </div>
    <div class="body">
      <p class="greeting">Hello,</p>
      <p style="font-size:14px;color:#aaa;line-height:1.6;">
        You've requested a one-time verification code to access your <span class="emerald">Suraksh</span> account.
        Use the code below to complete verification.
      </p>
      <div class="otp-block">
        <div class="otp-label">Your Verification Code</div>
        <div class="otp-code">{code}</div>
        <div class="otp-note">Expires in <strong style="color:#d4af37">10 minutes</strong></div>
      </div>
      <hr class="divider" />
      <p style="font-size:12px;color:#666;line-height:1.7;">
        If you did not request this code, please ignore this email. Your account remains secure.
        Do not share this code with anyone.
      </p>
    </div>
    <div class="footer">
      © 2026 Suraksh · India's trusted platform for digital documents and legally-binding e-agreements.<br/>
      This is an automated message — please do not reply.
    </div>
  </div>
</body>
</html>
"""


def _send_otp_email(to_email: str, code: str) -> None:
    """Send OTP via Resend. Silently logs on failure so the flow continues."""
    try:
        resend.Emails.send({
            "from": "Suraksh <onboarding@resend.dev>",
            "to": [to_email],
            "subject": f"{code} is your Suraksh verification code",
            "html": _OTP_EMAIL_HTML.format(code=code),
        })
    except Exception as exc:
        print(f"[OTP] Email send failed ({to_email}): {exc}")


def generate_otp(user_id: str, db: Session, email: str | None = None) -> str:
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

    # Always print to terminal as fallback
    print(f"\n{'=' * 50}")
    print(f"[OTP] User ID : {user_id}")
    print(f"[OTP] Email   : {email or 'not provided'}")
    print(f"[OTP] Code    : {code}")
    print(f"[OTP] Expires : {expires.strftime('%H:%M:%S UTC')}")
    print(f"{'=' * 50}\n")

    # Send email via Resend
    if email:
        resend.api_key = settings.RESEND_API_KEY  # ensure latest key
        _send_otp_email(email, code)

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
