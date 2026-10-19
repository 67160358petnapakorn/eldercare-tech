import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR.parent / ".env")

_DEFAULT_SECRET_KEY = "change-this-secret-key"


def _bool_env(name: str, default: str) -> bool:
    return os.getenv(name, default).lower() == "true"


def _normalize_database_url(raw_url: str) -> str:
    # Render/Heroku-style managed Postgres instances hand out a
    # "postgres://" connection string, but SQLAlchemy 2.0 dropped support
    # for that scheme alias — only "postgresql://" is accepted.
    if raw_url.startswith("postgres://"):
        return "postgresql://" + raw_url[len("postgres://"):]
    return raw_url


class Settings:
    DATABASE_URL: str = _normalize_database_url(
        os.getenv("DATABASE_URL", f"sqlite:///{(BASE_DIR / 'eldercare.db').resolve()}")
    )
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    SECRET_KEY: str = os.getenv("SECRET_KEY", _DEFAULT_SECRET_KEY)
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(
        os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7")
    )
    # Demo PromptPay ID (mobile number or 13-digit citizen ID) used to build
    # the QR payload. Not a real merchant account — this project has no
    # settlement access, so "payment confirmed" is a simulated button, not
    # a verified bank webhook. Override via .env for a different demo number.
    PROMPTPAY_ID: str = os.getenv("PROMPTPAY_ID", "0812345678")
    # Seeding the demo accounts/sample data is a local-dev and portfolio-demo
    # convenience, not something a real deployment should do unasked — it
    # creates publicly-known login credentials (family@example.com / 123456
    # etc.). Default stays false; set it explicitly where that demo data is
    # actually wanted (local .env, or the demo Render deploy).
    SEED_DEMO_DATA: bool = _bool_env("SEED_DEMO_DATA", "false")
    # Comma-separated extra CORS origins on top of the localhost regex
    # below — this is how a specific production frontend (e.g. the Vercel
    # deployment) gets allowed without having to hardcode its domain here.
    ALLOWED_ORIGINS: list[str] = [
        origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "").split(",") if origin.strip()
    ]


settings = Settings()

if settings.ENVIRONMENT == "production" and settings.SECRET_KEY == _DEFAULT_SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY must be set via environment variable in production — "
        "refusing to start with the insecure default (ENVIRONMENT=production)."
    )
