import os
import secrets
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from core.security import hash_password, verify_password, create_access_token
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

router = APIRouter()

# Google OAuth Client ID — replace with your real one from Google Cloud Console
GOOGLE_CLIENT_ID = "675529892898-thelsnkavtprj8uopau67vqckk5svss1.apps.googleusercontent.com"

# HR credentials — MUST be set via environment variables in production
_hr_email = os.getenv("HR_EMAIL", "hr@company.com")
_hr_password = os.getenv("HR_PASSWORD", "")
if not _hr_password:
    _hr_password = secrets.token_urlsafe(16)
    print(f"[WARNING] HR_PASSWORD not set! Generated temporary password: {_hr_password}")
    print("[WARNING] Set HR_PASSWORD in your .env file for production use.")
HR_ACCOUNTS = {
    _hr_email: hash_password(_hr_password)
}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token from frontend


class GoogleAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    google_id: str
    email: str
    name: str
    picture: str = ""


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    hashed = HR_ACCOUNTS.get(body.email)
    if not hashed or not verify_password(body.password, hashed):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token({"sub": body.email, "role": "hr"})
    return TokenResponse(access_token=token, role="hr")


@router.post("/google", response_model=GoogleAuthResponse)
async def google_auth(body: GoogleAuthRequest):
    """
    Verify Google ID token and return user info + app JWT.
    Does NOT create an applicant — that happens on resume submission.
    """
    try:
        # Verify the Google ID token
        idinfo = id_token.verify_oauth2_token(
            body.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )

        google_id = idinfo["sub"]
        email = idinfo.get("email", "")
        name = idinfo.get("name", "")
        picture = idinfo.get("picture", "")

        # Issue our own JWT for the applicant session
        token = create_access_token({
            "sub": email,
            "role": "applicant",
            "google_id": google_id,
        })

        return GoogleAuthResponse(
            access_token=token,
            role="applicant",
            google_id=google_id,
            email=email,
            name=name,
            picture=picture,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}",
        )


