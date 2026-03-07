from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.database import init_db
from app.routes import auth_routes, admin_routes, user_routes, verification_routes
from app.routes.agreement_routes import router as agreement_router
from app.routes.agreement_routes import router as agreement_router

# ── Application factory ───────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Suraksh — Secure Digital Documentation & Identity Verification Platform. "
        "Backend API scaffold."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup event ─────────────────────────────────────────────────────────────

@app.on_event("startup")
async def on_startup() -> None:
    """
    Run once when the server starts.
    Creates all SQLite tables for development.
    Also runs lightweight column migrations for new fields (SQLite doesn't support IF NOT EXISTS in ALTER).
    TODO: Replace init_db() with Alembic migrations for production.
    """
    init_db()
    # ── Lightweight column migrations ──────────────────────────────────────────
    from app.db.database import engine
    new_columns = [
        ("agreements", "analysis_result", "TEXT"),
        ("agreements", "user_analysis_result", "TEXT"),
        ("aadhaar_verifications", "scan_score", "INTEGER"),
        ("aadhaar_verifications", "face_submitted", "BOOLEAN DEFAULT 0"),
        ("aadhaar_verifications", "id_card_path", "TEXT"),
        ("aadhaar_verifications", "face_path", "TEXT"),
    ]
    with engine.connect() as conn:
        for table, col, col_type in new_columns:
            try:
                conn.execute(__import__("sqlalchemy").text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
                conn.commit()
            except Exception:
                # Column already exists — safe to ignore
                pass


# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(auth_routes.router)
app.include_router(admin_routes.router)
app.include_router(user_routes.router)
app.include_router(verification_routes.router)
app.include_router(agreement_router)


# ── Health check ──────────────────────────────────────────────────────────────

@app.api_route("/health", methods=["GET", "HEAD"])
def health():
    """Simple liveness probe — returns 200 OK when the server is running."""
    return JSONResponse(content={"status": "ok"})

@app.get("/health", tags=["System"])
async def health_check():
    """Simple liveness probe — returns 200 OK when the server is running."""
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


# ── Root ──────────────────────────────────────────────────────────────────────

@app.get("/", tags=["System"])
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "docs": "/docs",
        "version": settings.APP_VERSION,
    }
