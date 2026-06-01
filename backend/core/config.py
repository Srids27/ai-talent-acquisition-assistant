from pydantic_settings import BaseSettings
import secrets


class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "aria_recruitment"
    SECRET_KEY: str = ""  # MUST be set in .env for production
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    ALGORITHM: str = "HS256"
    GROQ_API_KEY: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# Auto-generate SECRET_KEY for development if not provided
if not settings.SECRET_KEY:
    settings.SECRET_KEY = secrets.token_urlsafe(32)
    print("[WARNING] SECRET_KEY not set! Generated a random one for this session.")
    print("[WARNING] Set SECRET_KEY in your .env file for production use.")
