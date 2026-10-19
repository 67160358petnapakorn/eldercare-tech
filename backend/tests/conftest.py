import os

# Must be set before `app.core.config` (and anything that imports it) loads,
# since Settings reads the environment once at import time. Using a shared
# in-memory SQLite DB (StaticPool, single connection) keeps every test
# isolated from the real dev/production database on disk.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SECRET_KEY"] = "test-secret-key"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
import app.main as main_module
from app.main import app

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db
# The app seeds demo data on startup against the *real* engine/DB file —
# irrelevant and unwanted here since every test talks to the in-memory
# engine above via the dependency override.
main_module.initialize_database = lambda: None


@pytest.fixture(autouse=True)
def _fresh_schema():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def _cleanup_uploaded_files():
    from app.routers.uploads import UPLOAD_DIR

    before = set(UPLOAD_DIR.iterdir()) if UPLOAD_DIR.exists() else set()
    yield
    if UPLOAD_DIR.exists():
        for path in UPLOAD_DIR.iterdir():
            if path not in before:
                path.unlink()


@pytest.fixture
def register_and_login(client: TestClient):
    """Registers a fresh user through the real endpoints and returns
    (auth_headers, tokens) — exercises the actual register -> login path
    rather than inserting rows directly. Exposed as a fixture (not a plain
    importable function) so test modules never import this conftest module
    under a second name — pytest already loads it once to supply fixtures,
    and a second `from tests.conftest import ...` import creates an
    independent copy of this module with its own engine/dependency-override
    that silently wins over the one pytest is actually using, which is
    exactly the bug that caused every DB-touching test to fail with
    'no such table' the first time this suite was written."""

    def _do(*, email: str, role: str = "family", password: str = "123456") -> tuple[dict, dict]:
        username = email.split("@")[0]
        register_resp = client.post(
            "/api/auth/register",
            json={
                "username": username,
                "email": email,
                "password": password,
                "first_name": "Test",
                "last_name": role.capitalize(),
                "role": role,
            },
        )
        assert register_resp.status_code == 201, register_resp.text

        login_resp = client.post("/api/auth/login", json={"email": email, "password": password})
        assert login_resp.status_code == 200, login_resp.text
        tokens = login_resp.json()
        return {"Authorization": f"Bearer {tokens['access_token']}"}, tokens

    return _do
