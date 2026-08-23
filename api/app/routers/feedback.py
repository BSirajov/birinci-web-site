from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session as DbSession

from app.config import get_settings
from app.content import clean_text
from app.database import FeedbackMessage, get_db
from app.deps import client_ip, get_current_user, require_csrf
from app.mail import send_feedback
from app.rate_limit import limiter
from app.schemas import FEEDBACK_CATEGORIES, LOCALES, FeedbackIn

router = APIRouter(prefix="/api/feedback", tags=["feedback"])
settings = get_settings()


@router.post("")
def submit_feedback(payload: FeedbackIn, request: Request, db: DbSession = Depends(get_db)) -> dict:
    require_csrf(request)
    if (payload.website or "").strip():
        return {"ok": True, "message": "Thank you. Your note was sent."}

    ip = client_ip(request)
    if not limiter.allow(f"feedback:{ip}", 5, 3600):
        raise HTTPException(status_code=429, detail="Too many feedback messages. Try later.")

    category = (payload.category or "").strip().lower()
    if category not in FEEDBACK_CATEGORIES:
        raise HTTPException(status_code=400, detail="Please choose a feedback category.")
    locale = payload.locale if payload.locale in LOCALES else "en"
    body = clean_text(payload.body, max_len=4000)
    user = get_current_user(request, db)
    email = str(payload.contact_email or (user.email if user else "")).strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Please enter an email so we can reply.")

    inbox = (settings.feedback_inbox or settings.admin_email or "info@birinci.cloud").strip()
    name = (payload.name or "").strip() or (user.display_name if user else "") or ""
    page_url = (payload.page_url or "").strip() or None

    row = FeedbackMessage(
        id=str(uuid.uuid4()),
        user_id=user.id if user else None,
        category=category,
        body=body,
        contact_email=email,
        locale=locale,
        page_url=page_url,
        status="new",
    )
    db.add(row)
    db.commit()

    send_feedback(
        inbox=inbox,
        reply_to=email,
        category=category,
        body=body,
        locale=locale,
        page_url=page_url,
        name=name,
    )
    return {"ok": True, "message": "Thank you. Your note was sent."}
