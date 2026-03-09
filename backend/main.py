import os
import sys
import traceback

print(f"[BOOT] Python {sys.version}")
print(f"[BOOT] Working directory: {os.getcwd()}")
print(f"[BOOT] Files in cwd: {os.listdir('.')}")

try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
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
        await connect_db()
        print("[BOOT] Database connected OK")
    except Exception as e:
        print(f"[ERROR] Database connection failed: {e}")
        traceback.print_exc()
        # Don't crash — let the app start even without DB
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

_allowed_origins = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
    if o.strip()
]
print(f"[BOOT] CORS origins: {_allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

print("[BOOT] App created successfully — ready to serve")
