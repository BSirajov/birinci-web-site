"""Smoke-check auth storage: migrations + hash-only passwords.

Uses DATABASE_URL from the environment (or .env).
Local default: SQLite. Production: Hostinger MySQL via mysql+pymysql://.
"""

from __future__ import annotations

import os
import sys
import uuid
from pathlib import Path

API_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(API_DIR))

# Load .env if present without overriding an explicit DATABASE_URL.
env_path = API_DIR / ".env"
if env_path.is_file() and "DATABASE_URL" not in os.environ:
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())

os.environ.setdefault("SECRET_KEY", "verify-storage-secret-not-for-prod")
os.environ.setdefault("DEBUG", "true")

from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import select, text

from app.config import get_settings
from app.database import SessionLocal, User, engine, resolve_database_url
from app.main import app
from app.rate_limit import limiter


def main() -> int:
    url = resolve_database_url(get_settings().database_url)
    print(f"DATABASE_URL dialect: {engine.dialect.name}")
    print(f"Resolved URL prefix: {url.split('://', 1)[0]}://…")

    cfg = Config(str(API_DIR / "alembic.ini"))
    command.upgrade(cfg, "head")
    print("alembic upgrade head: ok")

    with engine.connect() as conn:
        tables = set(conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table'"
            if engine.dialect.name == "sqlite"
            else "SELECT tablename FROM pg_tables WHERE schemaname='public'"
        )).scalars())
    for required in ("users", "sessions", "user_preferences", "alembic_version"):
        if required not in tables and not (
            engine.dialect.name != "sqlite" and required == "alembic_version" and "alembic_version" in tables
        ):
            # pg_tables returns without alembic sometimes in same query - check separately
            pass
    # Dialect-agnostic check via SQLAlchemy inspector
    from sqlalchemy import inspect

    names = set(inspect(engine).get_table_names())
    for required in ("users", "sessions", "user_preferences", "alembic_version"):
        assert required in names, f"missing table: {required}"
    print("tables present: ok")

    limiter._hits.clear()
    email = f"verify-{uuid.uuid4().hex[:10]}@example.com"
    password = "CorrectHorse9!"
    with TestClient(app) as client:
        csrf = client.get("/api/auth/csrf").json()["csrf_token"]
        headers = {"X-CSRF-Token": csrf}
        reg = client.post(
            "/api/auth/register",
            json={
                "email": email,
                "password": password,
                "first_name": "Verify",
                "last_name": "Storage",
                "preferred_locale": "en",
            },
            headers=headers,
        )
        assert reg.status_code == 200, reg.text
        assert "password" not in reg.text.lower() or "password_hash" not in reg.json()

        with SessionLocal() as db:
            user = db.scalar(select(User).where(User.email == email))
            assert user is not None
            assert user.password_hash.startswith("$argon2")
            assert password not in user.password_hash
            assert password not in (user.email + (user.display_name or ""))
            print(f"password_hash starts with $argon2: ok ({user.password_hash[:12]}…)")

        prefs = client.put(
            "/api/preferences",
            json={"data": {"home_view": "cards"}},
            headers=headers,
        )
        assert prefs.status_code == 200, prefs.text
        assert prefs.json()["data"]["home_view"] == "cards"
        print("preferences JSON round-trip: ok")

    print("storage smoke check passed")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"storage smoke check FAILED: {exc}", file=sys.stderr)
        raise
