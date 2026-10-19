import os
import subprocess
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent


def test_postgres_url_scheme_is_normalized():
    from app.core.config import _normalize_database_url

    assert _normalize_database_url("postgres://user:pass@host/db") == "postgresql://user:pass@host/db"


def test_non_postgres_url_is_unchanged():
    from app.core.config import _normalize_database_url

    assert _normalize_database_url("sqlite:///foo.db") == "sqlite:///foo.db"
    assert _normalize_database_url("mysql+pymysql://x") == "mysql+pymysql://x"


def test_bool_env_defaults_false_when_unset(monkeypatch):
    from app.core.config import _bool_env

    monkeypatch.delenv("SOME_TEST_FLAG_NOT_SET", raising=False)
    assert _bool_env("SOME_TEST_FLAG_NOT_SET", "false") is False


def test_bool_env_reads_true_case_insensitively(monkeypatch):
    from app.core.config import _bool_env

    monkeypatch.setenv("SOME_TEST_FLAG_NOT_SET", "TRUE")
    assert _bool_env("SOME_TEST_FLAG_NOT_SET", "false") is True


def test_seed_demo_data_default_parameter_is_false():
    # Regression check for the spec requirement itself (SEED_DEMO_DATA
    # defaults to false) — this project's own .env sets it to true for
    # local-dev convenience, so this checks the *call site*'s default
    # argument rather than the live settings.SEED_DEMO_DATA value, which
    # would just reflect that local .env choice instead.
    source = (BACKEND_DIR / "app" / "core" / "config.py").read_text()
    assert 'SEED_DEMO_DATA: bool = _bool_env("SEED_DEMO_DATA", "false")' in source


def test_allowed_origins_parses_comma_separated_list(monkeypatch):
    monkeypatch.setenv("ALLOWED_ORIGINS", "https://a.example.com, https://b.example.com ,")
    monkeypatch.setenv("DATABASE_URL", "sqlite://")
    import app.core.config as config_module
    import importlib

    importlib.reload(config_module)
    try:
        assert config_module.settings.ALLOWED_ORIGINS == ["https://a.example.com", "https://b.example.com"]
    finally:
        monkeypatch.delenv("ALLOWED_ORIGINS", raising=False)
        importlib.reload(config_module)


def test_production_without_real_secret_key_refuses_to_start():
    # This has to run as a subprocess: config.py raises at *import* time,
    # and the module (plus half the app) is already imported into this
    # test process's sys.modules — reload() can't cleanly undo that.
    env = {
        **os.environ,
        "ENVIRONMENT": "production",
        "DATABASE_URL": "sqlite://",
    }
    env.pop("SECRET_KEY", None)
    result = subprocess.run(
        [sys.executable, "-c", "import app.core.config"],
        cwd=BACKEND_DIR,
        env=env,
        capture_output=True,
        text=True,
    )
    assert result.returncode != 0
    assert "SECRET_KEY" in result.stderr


def test_production_with_real_secret_key_starts_fine():
    env = {
        **os.environ,
        "ENVIRONMENT": "production",
        "DATABASE_URL": "sqlite://",
        "SECRET_KEY": "a-real-random-secret-not-the-default",
    }
    result = subprocess.run(
        [sys.executable, "-c", "import app.core.config"],
        cwd=BACKEND_DIR,
        env=env,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr
