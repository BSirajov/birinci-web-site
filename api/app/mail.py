from __future__ import annotations

from app.config import get_settings
from app.security import write_outbox

settings = get_settings()


def send_verification(email: str, link: str) -> None:
    subject = "Verify your Birİnci account"
    body = (
        f"Welcome to Birİnci.\n\n"
        f"Confirm your email by opening this link (valid 24 hours):\n{link}\n\n"
        f"If you did not create an account, ignore this message.\n"
    )
    path = write_outbox("verify", email, subject, body)
    print(f"\n[mail:verify] {email}\n{link}\n(saved {path})\n", flush=True)


def send_feedback(
    inbox: str,
    reply_to: str,
    category: str,
    body: str,
    locale: str,
    page_url: str | None,
    name: str,
) -> None:
    subject = f"Birİnci feedback ({category})"
    text = (
        f"Category: {category}\n"
        f"Locale: {locale}\n"
        f"From: {name or '—'} <{reply_to}>\n"
        f"Page: {page_url or '—'}\n\n"
        f"{body}\n"
    )
    path = write_outbox("feedback", inbox, subject, text)
    print(f"\n[mail:feedback] to {inbox} reply-to {reply_to}\n(saved {path})\n", flush=True)


def send_password_reset(email: str, link: str) -> None:
    subject = "Reset your Birİnci password"
    body = (
        f"Reset your password by opening this link (valid 2 hours):\n{link}\n\n"
        f"If you did not request a reset, ignore this message.\n"
    )
    path = write_outbox("reset", email, subject, body)
    print(f"\n[mail:reset] {email}\n{link}\n(saved {path})\n", flush=True)
