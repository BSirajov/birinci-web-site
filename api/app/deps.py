from __future__ import annotations

from fastapi import HTTPException, Request, status
from sqlalchemy.orm import Session as DbSession

from app.config import get_settings
from app.database import Session as AuthSession
from app.database import User
from app.security import hash_token, utcnow, verify_csrf

settings = get_settings()


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def require_csrf(request: Request) -> None:
    header = request.headers.get("x-csrf-token")
    cookie = request.cookies.get(settings.csrf_cookie)
    if not header or header != cookie or not verify_csrf(cookie):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF check failed.")


def get_current_user(request: Request, db: DbSession) -> User | None:
    raw = request.cookies.get(settings.session_cookie)
    if not raw:
        return None
    row = (
        db.query(AuthSession)
        .filter(AuthSession.token_hash == hash_token(raw), AuthSession.revoked_at.is_(None))
        .first()
    )
    if row is None or row.expires_at < utcnow():
        return None
    user = db.get(User, row.user_id)
    if user is None or not user.is_active:
        return None
    return user


def require_user(request: Request, db: DbSession) -> User:
    user = get_current_user(request, db)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not signed in.")
    return user
