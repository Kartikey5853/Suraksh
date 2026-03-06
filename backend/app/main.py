from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    TODO: Replace init_db() with Alembic migrations for production.
    """
    init_db()


# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(auth_routes.router)
app.include_router(admin_routes.router)
app.include_router(user_routes.router)
app.include_router(verification_routes.router)
app.include_router(agreement_router)


# ── Health check ──────────────────────────────────────────────────────────────

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
