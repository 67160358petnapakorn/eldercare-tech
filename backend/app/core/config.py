import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR.parent / ".env")


class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{(BASE_DIR / 'eldercare.db').resolve()}",
    )
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-this-secret-key")
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


settings = Settings()
