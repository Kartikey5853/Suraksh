# Suraksh — Backend API

> **Secure Digital Documentation & Identity Verification Platform**

This is the **backend scaffold** for the Suraksh platform, built with FastAPI.
It provides the full route and module structure ready for feature implementation.

---

## Project Structure

```
backend/
├── app/
│   ├── main.py                    # FastAPI app factory, router wiring, startup
│   │
│   ├── core/
│   │   ├── config.py              # Centralised settings (DATABASE_URL, JWT, etc.)
│   │   ├── security.py            # bcrypt password hashing / verification
│   │   ├── hashing.py             # SHA-256 document integrity utilities
│   │   └── jwt_handler.py         # JWT create / decode helpers
│   │
│   ├── db/
│   │   └── database.py            # SQLAlchemy engine, session factory, Base
│   │
│   ├── models/
│   │   ├── user.py                # User ORM model
│   │   ├── document.py            # Document ORM model
│   │   └── verification.py        # Verification (KYC) ORM model
│   │
│   ├── schemas/
│   │   ├── user_schema.py         # Pydantic request/response schemas — users
│   │   ├── document_schema.py     # Pydantic schemas — documents
│   │   └── verification_schema.py # Pydantic schemas — KYC verification
│   │
│   ├── routes/
│   │   ├── auth_routes.py         # POST /auth/{register,login,verify-otp}
│   │   ├── user_routes.py         # GET/PUT /user/profile, GET /user/documents
│   │   ├── admin_routes.py        # /admin/* (dashboard, upload, send, filter)
│   │   ├── document_routes.py     # GET/POST /documents/*
│   │   └── verification_routes.py # POST /verification/upload-*, GET /verification/status
│   │
│   ├── services/
│   │   ├── auth_service.py        # Register, login, OTP logic (placeholders)
│   │   ├── document_service.py    # Document CRUD & signing logic (placeholders)
│   │   └── verification_service.py# KYC upload & status logic (placeholders)
│   │
│   └── dependencies/
│       └── auth_dependencies.py   # get_current_user, get_admin_user FastAPI deps
│
├── requirements.txt
└── README.md
```

---

## Quick Start

### 1. Create a virtual environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

Create a `.env` file in the `backend/` folder:

```env
APP_NAME=Suraksh
DEBUG=true
DATABASE_URL=sqlite:///./suraksh.db
SECRET_KEY=CHANGE_ME_BEFORE_PRODUCTION
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### 4. Run the server

```bash
uvicorn app.main:app --reload
```

API is now available at **http://localhost:8000**
Interactive docs at **http://localhost:8000/docs**

---

## API Routes

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | Login / get tokens | Public |
| POST | `/auth/verify-otp` | Verify OTP code | Public |
| GET | `/user/profile` | Get own profile | User |
| PUT | `/user/profile` | Update own profile | User |
| GET | `/user/documents` | List own documents | User |
| GET | `/user/verification-status` | KYC status | User |
| GET | `/documents` | List documents | User |
| GET | `/documents/{id}` | Get document by ID | User |
| POST | `/documents/sign` | Sign a document | User |
| POST | `/documents/reject` | Reject a document | User |
| POST | `/verification/upload-id` | Upload ID document | User |
| POST | `/verification/upload-face` | Upload face image | User |
| GET | `/verification/status` | KYC status | User |
| GET | `/admin/dashboard` | Admin stats | Admin |
| POST | `/admin/upload-document` | Admin upload | Admin |
| POST | `/admin/create-agreement` | Create agreement | Admin |
| POST | `/admin/send-document` | Send to user | Admin |
| GET | `/admin/filter-documents` | Filter docs | Admin |

---

## Security Architecture

### Password Hashing (bcrypt)
- Passwords are **never stored in plain text**.
- `core/security.py` → `hash_password()` / `verify_password()` using `passlib[bcrypt]`.

### JWT Authentication
- Access tokens signed with `HS256` using `SECRET_KEY`.
- `core/jwt_handler.py` → `create_access_token()` / `decode_access_token()`.
- Protected routes use `Depends(get_current_user)`.

### Document Integrity (SHA-256)
- Every uploaded file gets a SHA-256 digest stored in `Document.integrity_hash`.
- `core/hashing.py` → `compute_document_hash()` / `verify_document_integrity()`.
- Integrity is re-verified before a document can be signed.

### Sensitive Field Hashing
| Field | Model | Method |
|-------|-------|--------|
| `hashed_password` | User | bcrypt via `security.hash_password()` |
| `hashed_gov_id` | User | SHA-256/HMAC via `security.hash_government_id()` |
| `integrity_hash` | Document | SHA-256 via `hashing.compute_document_hash()` |
| `id_document_hash` | Verification | SHA-256 of raw image bytes |
| `face_image_hash` | Verification | SHA-256 of raw image bytes |

---

## Switching to PostgreSQL / Supabase

1. Change `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL=postgresql+psycopg2://user:password@host:5432/suraksh
   ```
2. Install the driver:
   ```bash
   pip install psycopg2-binary
   ```
3. Remove the `connect_args` block in `db/database.py` (SQLite-only).
4. Set up Alembic for migrations:
   ```bash
   pip install alembic
   alembic init alembic
   ```

---

## Features NOT Yet Implemented (Placeholders)

- [ ] AI document summary engine
- [ ] Agreement generation engine
- [ ] Document completeness scoring
- [ ] Audit trail system
- [ ] Semantic document search
- [ ] Face recognition / liveness detection
- [ ] OTP email/SMS delivery
- [ ] Token revocation (jti blacklist)
- [ ] Alembic database migrations

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web framework | FastAPI |
| ORM | SQLAlchemy |
| Database (dev) | SQLite |
| Database (prod) | PostgreSQL / Supabase |
| Auth | JWT (python-jose) |
| Password hashing | bcrypt (passlib) |
| Document integrity | SHA-256 (hashlib) |
| Schema validation | Pydantic v2 |
| Server | Uvicorn |
