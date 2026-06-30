import os
import sys
import traceback

print(f"[BOOT] Python {sys.version}")
print(f"[BOOT] Working directory: {os.getcwd()}")
print(f"[BOOT] Files in cwd: {os.listdir('.')}")

try:
    from fastapi import FastAPI, Request
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse
    from contextlib import asynccontextmanager
    print("[BOOT] FastAPI imported OK")

    from core.database import connect_db, disconnect_db
    print("[BOOT] Database module imported OK")

    from routes import applicants, auth, chat, jobs, scheduling, applicant_portal
    print("[BOOT] All route modules imported OK")

except Exception as e:
    print(f"[FATAL] Import failed: {e}")
    traceback.print_exc()
    sys.exit(1)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await connect_db(max_retries=3)
        print("[BOOT] Database connected OK")
    except Exception as e:
        print(f"[FATAL] Database connection failed after retries: {type(e).__name__}: {e}")
        traceback.print_exc()
        # App will start but DB routes will fail — debug endpoint will show the error
    yield
    try:
        await disconnect_db()
    except Exception:
        pass


app = FastAPI(
    title="ARIA Recruitment API",
    description="AI Recruitment Intelligence Assistant — Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS Configuration ──
# Always include the Vercel production URL, plus any custom origins from env
_VERCEL_ORIGIN = "https://ai-talent-acquisition-assistant.vercel.app"
_default_origins = ["http://localhost:3000", "http://localhost:5173", _VERCEL_ORIGIN]

_env_origins = os.getenv("ALLOWED_ORIGINS", "")
if _env_origins:
    _extra = [o.strip() for o in _env_origins.split(",") if o.strip()]
    _allowed_origins = list(set(_default_origins + _extra))
else:
    _allowed_origins = _default_origins

print(f"[BOOT] CORS origins: {_allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global exception handler ──
# Ensures CORS headers are present even on 500 errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin", "")
    headers = {}
    if origin in _allowed_origins:
        headers["access-control-allow-origin"] = origin
        headers["access-control-allow-credentials"] = "true"
    print(f"[ERROR] {request.method} {request.url.path}: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
        headers=headers,
    )


app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(applicants.router, prefix="/api/applicants", tags=["Applicants"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(scheduling.router, prefix="/api/scheduling", tags=["Scheduling"])
app.include_router(applicant_portal.router, prefix="/api/applicant-portal", tags=["Applicant Portal"])


@app.get("/")
async def root():
    return {"message": "ARIA Recruitment API is running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/health")
async def api_health():
    return {"status": "ok"}


@app.get("/api/debug/db")
async def debug_db():
    """Check MongoDB status. If DB failed on startup, attempt reconnection."""
    from core.database import client, _db_ready
    from models.job import Job
    info = {"client_connected": client is not None, "beanie_initialized": _db_ready}
    
    if not _db_ready:
        # Attempt reconnection
        try:
            await connect_db(max_retries=1)
            info["reconnect"] = "success"
        except Exception as e:
            info["reconnect"] = f"failed: {type(e).__name__}: {str(e)}"
            return info
    
    try:
        count = await Job.count()
        info["jobs_count"] = count
        info["db_status"] = "connected"
    except Exception as e:
        info["db_status"] = "error"
        info["db_error"] = f"{type(e).__name__}: {str(e)}"
    return info

print("[BOOT] App created successfully — ready to serve")
