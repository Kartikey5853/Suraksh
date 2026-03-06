import uuid
from app.db.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password

def create_admin():
    db = SessionLocal()
    email = "admin@suraksh.local"
    password = "admin123"
    user = User(
        id=str(uuid.uuid4()),
        name="Admin User",
        email=email,
        phone=None,
        hashed_password=hash_password(password),
        role="admin",
        is_active=True,
        is_onboarded=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"Admin created: {email} / {password}")
    db.close()

if __name__ == "__main__":
    create_admin()
