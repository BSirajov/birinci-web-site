from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta
from pathlib import Path

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from app.config import API_DIR, get_settings

hasher = PasswordHasher()
settings = get_settings()

COMMON_PASSWORDS = {
    "password",
    "password1",
    "password12",
    "password123",
    "1234567890",
    "qwerty1234",
    "letmein123",
    "birinci123",
    "admin12345",
    "welcome123",
    "iloveyou12",
}


def hash_password(password: str) -> str:
    return hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return hasher.verify(password_hash, password)
    except VerifyMismatchError:
        return False


def password_errors(password: str) -> list[str]:
    errors: list[str] = []
    if len(password) < settings.password_min_length:
        errors.append(f"Password must be at least {settings.password_min_length} characters.")
    if password.lower() in COMMON_PASSWORDS:
        errors.append("This password is too common.")
    if password.isalpha() or password.isdigit():
        errors.append("Use a mix of letters and numbers or symbols.")
    return errors


def _serializer(salt: str) -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(settings.secret_key, salt=salt)


def make_email_token(email: str, purpose: str) -> str:
    return _serializer(purpose).dumps(email)


def read_email_token(token: str, purpose: str, max_age: int) -> str | None:
    try:
        email = _serializer(purpose).loads(token, max_age=max_age)
    except (BadSignature, SignatureExpired):
        return None
    if not isinstance(email, str):
        return None
    return email


def new_session_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def session_expiry() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None) + timedelta(days=settings.session_days)


def utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def sign_csrf(value: str) -> str:
    digest = hmac.new(settings.secret_key.encode(), value.encode(), hashlib.sha256).hexdigest()
    return f"{value}.{digest}"


def verify_csrf(signed: str | None) -> bool:
    if not signed or "." not in signed:
        return False
    value, digest = signed.rsplit(".", 1)
    expected = hmac.new(settings.secret_key.encode(), value.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(digest, expected)


def new_csrf_cookie() -> str:
    return sign_csrf(secrets.token_urlsafe(16))


def write_outbox(kind: str, to_email: str, subject: str, body: str) -> Path:
    outbox = API_DIR / "var" / "outbox"
    outbox.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(UTC).strftime("%Y%m%d-%H%M%S")
    path = outbox / f"{stamp}-{kind}.txt"
    path.write_text(f"To: {to_email}\nSubject: {subject}\n\n{body}\n", encoding="utf-8")
    return path
