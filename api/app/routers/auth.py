from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session as DbSession

from app.avatars import AVATAR_MAX_BYTES, AVATAR_NAME_RE, avatar_path, delete_avatar_file, public_avatar_url, save_avatar
from app.config import get_settings
from app.database import Session as AuthSession
from app.database import User, UserPreference, get_db
from app.deps import client_ip, get_current_user, require_csrf, require_user
from app.mail import send_password_reset, send_verification
from app.rate_limit import limiter
from app.schemas import LOCALES, DeleteAccountIn, EmailIn, LoginIn, MeOut, MePatchIn, PasswordResetConfirmIn, RegisterIn, TokenIn
from app.security import (
    hash_password,
    hash_token,
    make_email_token,
    new_csrf_cookie,
    new_session_token,
    password_errors,
    read_email_token,
    session_expiry,
    utcnow,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()


def _cookie_kwargs() -> dict:
    return {
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": settings.cookie_samesite,
        "path": "/",
        "max_age": settings.session_days * 24 * 3600,
    }


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(settings.session_cookie, token, **_cookie_kwargs())


def _clear_session_cookie(response: Response) -> None:
    response.delete_cookie(settings.session_cookie, path="/")


def _ensure_csrf(response: Response, request: Request) -> str:
    existing = request.cookies.get(settings.csrf_cookie)
    from app.security import verify_csrf

    if existing and verify_csrf(existing):
        return existing
    token = new_csrf_cookie()
    response.set_cookie(
        settings.csrf_cookie,
        token,
        httponly=False,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/",
        max_age=settings.session_days * 24 * 3600,
    )
    return token


def _compose_display_name(first_name: str | None, last_name: str | None, display_name: str | None = None) -> str | None:
    explicit = (display_name or "").strip()
    if explicit:
        return explicit[:80]
    composed = " ".join(part for part in ((first_name or "").strip(), (last_name or "").strip()) if part)
    return composed[:80] or None


def _me(user: User) -> dict:
    return MeOut(
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        display_name=user.display_name or _compose_display_name(user.first_name, user.last_name),
        preferred_locale=user.preferred_locale,
        is_verified=user.is_verified,
        role=user.role,
        avatar_url=public_avatar_url(user.avatar_filename),
    ).model_dump()


def _create_session(db: DbSession, user: User) -> str:
    raw = new_session_token()
    row = AuthSession(
        id=str(uuid.uuid4()),
        user_id=user.id,
        token_hash=hash_token(raw),
        expires_at=session_expiry(),
    )
    db.add(row)
    db.commit()
    return raw


def _revoke_all_sessions(db: DbSession, user_id: str) -> None:
    now = utcnow()
    db.query(AuthSession).filter(AuthSession.user_id == user_id, AuthSession.revoked_at.is_(None)).update(
        {AuthSession.revoked_at: now}
    )
    db.commit()


def _public_url(path: str) -> str:
    return f"{settings.public_base_url.rstrip('/')}{path}"


@router.get("/csrf")
def csrf(request: Request, response: Response) -> dict:
    token = _ensure_csrf(response, request)
    return {"csrf_token": token}


@router.post("/register")
def register(payload: RegisterIn, request: Request, response: Response, db: DbSession = Depends(get_db)) -> dict:
    require_csrf(request)
    ip = client_ip(request)
    if not limiter.allow(f"register:{ip}", 8, 3600):
        raise HTTPException(status_code=429, detail="Too many registration attempts. Try later.")

    locale = payload.preferred_locale if payload.preferred_locale in LOCALES else "az"
    email = str(payload.email).strip().lower()
    errors = password_errors(payload.password)
    if errors:
        raise HTTPException(status_code=400, detail=errors[0])

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    first_name = payload.first_name.strip()
    last_name = payload.last_name.strip()
    if not first_name or not last_name:
        raise HTTPException(status_code=400, detail="Please enter your name and surname.")

    user = User(
        id=str(uuid.uuid4()),
        email=email,
        password_hash=hash_password(payload.password),
        first_name=first_name,
        last_name=last_name,
        display_name=_compose_display_name(first_name, last_name, payload.display_name),
        preferred_locale=locale,
        is_verified=False,
        is_active=True,
        role="admin" if settings.admin_email and email == settings.admin_email.lower() else "user",
    )
    db.add(user)
    db.commit()

    token = make_email_token(email, "verify-email")
    link = _public_url(f"/account/verify?token={token}&lang={locale}")
    send_verification(email, link)

    raw = _create_session(db, user)
    _set_session_cookie(response, raw)
    _ensure_csrf(response, request)
    out = {
        "ok": True,
        "user": _me(user),
        "message": "Account created. Verify your email to comment.",
    }
    if settings.debug:
        out["verify_url"] = link
    return out


@router.post("/login")
def login(payload: LoginIn, request: Request, response: Response, db: DbSession = Depends(get_db)) -> dict:
    require_csrf(request)
    ip = client_ip(request)
    email = str(payload.email).strip().lower()
    if not limiter.allow(f"login:{ip}:{email}", 5, 15 * 60):
        raise HTTPException(status_code=429, detail="Too many sign-in attempts. Try later.")

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(
            status_code=401,
            detail={
                "code": "account_not_found",
                "message": "No account was found for this email.",
            },
        )
    if not user.is_active:
        raise HTTPException(
            status_code=401,
            detail={"code": "account_inactive", "message": "This account is disabled."},
        )
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail={"code": "invalid_password", "message": "That password does not match this account."},
        )

    raw = _create_session(db, user)
    _set_session_cookie(response, raw)
    _ensure_csrf(response, request)
    return {"ok": True, "user": _me(user)}


@router.post("/logout")
def logout(request: Request, response: Response, db: DbSession = Depends(get_db)) -> dict:
    require_csrf(request)
    raw = request.cookies.get(settings.session_cookie)
    if raw:
        row = db.query(AuthSession).filter(AuthSession.token_hash == hash_token(raw)).first()
        if row and row.revoked_at is None:
            row.revoked_at = utcnow()
            db.commit()
    _clear_session_cookie(response)
    return {"ok": True}


@router.post("/logout-all")
def logout_all(request: Request, response: Response, db: DbSession = Depends(get_db)) -> dict:
    require_csrf(request)
    user = require_user(request, db)
    _revoke_all_sessions(db, user.id)
    _clear_session_cookie(response)
    return {"ok": True}


@router.get("/me")
def me(request: Request, db: DbSession = Depends(get_db)) -> dict:
    user = get_current_user(request, db)
    if user is None:
        return {"user": None}
    return {"user": _me(user)}


@router.patch("/me")
def patch_me(payload: MePatchIn, request: Request, db: DbSession = Depends(get_db)) -> dict:
    require_csrf(request)
    user = require_user(request, db)
    if payload.first_name is not None:
        user.first_name = payload.first_name.strip() or None
    if payload.last_name is not None:
        user.last_name = payload.last_name.strip() or None
    if payload.display_name is not None:
        name = payload.display_name.strip()
        user.display_name = name or None
    elif payload.first_name is not None or payload.last_name is not None:
        user.display_name = _compose_display_name(user.first_name, user.last_name)
    if payload.preferred_locale is not None:
        if payload.preferred_locale not in LOCALES:
            raise HTTPException(status_code=400, detail="Unsupported locale.")
        user.preferred_locale = payload.preferred_locale
    db.commit()
    db.refresh(user)
    return {"ok": True, "user": _me(user)}


@router.post("/me/avatar")
def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    db: DbSession = Depends(get_db),
) -> dict:
    require_csrf(request)
    user = require_user(request, db)
    data = file.file.read(AVATAR_MAX_BYTES + 1)
    user.avatar_filename = save_avatar(user.id, data)
    db.commit()
    db.refresh(user)
    return {"ok": True, "user": _me(user)}


def _purge_account(db: DbSession, user: User) -> None:
    filename = user.avatar_filename
    user_id = user.id
    db.query(AuthSession).filter(AuthSession.user_id == user_id).delete(synchronize_session=False)
    db.query(UserPreference).filter(UserPreference.user_id == user_id).delete(synchronize_session=False)
    db.delete(user)
    db.commit()
    delete_avatar_file(filename)


@router.delete("/me")
def delete_me(
    payload: DeleteAccountIn,
    request: Request,
    response: Response,
    db: DbSession = Depends(get_db),
) -> dict:
    require_csrf(request)
    user = require_user(request, db)
    if not payload.confirm:
        raise HTTPException(
            status_code=400,
            detail="Please confirm that you want to permanently delete this account.",
        )
    _purge_account(db, user)
    _clear_session_cookie(response)
    return {"ok": True}


@router.post("/verify-email")
def verify_email(payload: TokenIn, request: Request, db: DbSession = Depends(get_db)) -> dict:
    require_csrf(request)
    email = read_email_token(payload.token, "verify-email", max_age=24 * 3600)
    if not email:
        raise HTTPException(status_code=400, detail="This verification link is invalid or has expired.")
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=400, detail="This verification link is invalid or has expired.")
    user.is_verified = True
    db.commit()
    return {"ok": True, "user": _me(user)}


@router.post("/password-reset/request")
def password_reset_request(payload: EmailIn, request: Request, db: DbSession = Depends(get_db)) -> dict:
    require_csrf(request)
    ip = client_ip(request)
    email = str(payload.email).strip().lower()
    if not limiter.allow(f"reset:{ip}:{email}", 5, 3600):
        raise HTTPException(status_code=429, detail="Too many reset requests. Try later.")

    generic = {"ok": True, "message": "If an account exists, a reset link was sent."}
    user = db.query(User).filter(User.email == email).first()
    if user and user.is_active:
        token = make_email_token(email, "reset-password")
        locale = user.preferred_locale
        link = _public_url(f"/account/reset?token={token}&lang={locale}")
        send_password_reset(email, link)
        if settings.debug:
            generic["reset_url"] = link
    return generic


@router.post("/password-reset/confirm")
def password_reset_confirm(payload: PasswordResetConfirmIn, request: Request, db: DbSession = Depends(get_db)) -> dict:
    require_csrf(request)
    email = read_email_token(payload.token, "reset-password", max_age=2 * 3600)
    if not email:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired.")
    errors = password_errors(payload.password)
    if errors:
        raise HTTPException(status_code=400, detail=errors[0])
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired.")
    user.password_hash = hash_password(payload.password)
    db.commit()
    _revoke_all_sessions(db, user.id)
    return {"ok": True, "message": "Password updated. Sign in with your new password."}


avatars_router = APIRouter(tags=["avatars"])


@avatars_router.get("/api/avatars/{filename}")
def get_avatar(filename: str) -> FileResponse:
    if not AVATAR_NAME_RE.match(filename):
        raise HTTPException(status_code=404, detail="Not found.")
    path = avatar_path(filename)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Not found.")
    return FileResponse(path, media_type="image/jpeg")
