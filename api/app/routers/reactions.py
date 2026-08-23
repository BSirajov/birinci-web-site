from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func
from sqlalchemy.orm import Session as DbSession

from app.content import normalize_target
from app.database import Reaction, get_db
from app.deps import get_current_user, require_csrf, require_user
from app.rate_limit import limiter
from app.schemas import REACTION_VALUES, ReactionClearIn, ReactionPutIn
from app.security import utcnow

router = APIRouter(prefix="/api/reactions", tags=["reactions"])


def _counts(db: DbSession, loc: str, kind: str, slug: str) -> dict[str, int]:
    rows = (
        db.query(Reaction.value, func.count(Reaction.id))
        .filter(
            Reaction.locale == loc,
            Reaction.target_type == kind,
            Reaction.target_slug == slug,
        )
        .group_by(Reaction.value)
        .all()
    )
    out = {"likes": 0, "dislikes": 0}
    for value, n in rows:
        if value == "like":
            out["likes"] = int(n)
        elif value == "dislike":
            out["dislikes"] = int(n)
    return out


def _mine(db: DbSession, user_id: str | None, loc: str, kind: str, slug: str) -> str | None:
    if not user_id:
        return None
    row = (
        db.query(Reaction)
        .filter(
            Reaction.user_id == user_id,
            Reaction.locale == loc,
            Reaction.target_type == kind,
            Reaction.target_slug == slug,
        )
        .first()
    )
    return row.value if row else None


def _payload(db: DbSession, loc: str, kind: str, slug: str, user_id: str | None) -> dict:
    counts = _counts(db, loc, kind, slug)
    return {"ok": True, "likes": counts["likes"], "dislikes": counts["dislikes"], "mine": _mine(db, user_id, loc, kind, slug)}


@router.get("")
def get_reactions(
    locale: str,
    target_type: str,
    target_slug: str,
    request: Request,
    db: DbSession = Depends(get_db),
) -> dict:
    loc, kind, slug = normalize_target(locale, target_type, target_slug)
    user = get_current_user(request, db)
    return _payload(db, loc, kind, slug, user.id if user else None)


@router.put("")
def put_reaction(payload: ReactionPutIn, request: Request, db: DbSession = Depends(get_db)) -> dict:
    require_csrf(request)
    user = require_user(request, db)
    if not limiter.allow(f"reaction:{user.id}", 30, 60):
        raise HTTPException(status_code=429, detail="Too many reaction changes. Try again shortly.")
    loc, kind, slug = normalize_target(payload.locale, payload.target_type, payload.target_slug)
    value = (payload.value or "").strip().lower()
    if value not in REACTION_VALUES:
        raise HTTPException(status_code=400, detail="value must be like or dislike.")

    row = (
        db.query(Reaction)
        .filter(
            Reaction.user_id == user.id,
            Reaction.locale == loc,
            Reaction.target_type == kind,
            Reaction.target_slug == slug,
        )
        .first()
    )
    if row is None:
        row = Reaction(
            id=str(uuid.uuid4()),
            user_id=user.id,
            locale=loc,
            target_type=kind,
            target_slug=slug,
            value=value,
        )
        db.add(row)
    else:
        row.value = value
        row.updated_at = utcnow()
    db.commit()
    return _payload(db, loc, kind, slug, user.id)


@router.delete("")
def clear_reaction(
    request: Request,
    payload: ReactionClearIn | None = None,
    locale: str | None = None,
    target_type: str | None = None,
    target_slug: str | None = None,
    db: DbSession = Depends(get_db),
) -> dict:
    require_csrf(request)
    user = require_user(request, db)
    loc_in = payload.locale if payload else locale
    kind_in = payload.target_type if payload else target_type
    slug_in = payload.target_slug if payload else target_slug
    loc, kind, slug = normalize_target(loc_in or "", kind_in or "", slug_in or "")
    db.query(Reaction).filter(
        Reaction.user_id == user.id,
        Reaction.locale == loc,
        Reaction.target_type == kind,
        Reaction.target_slug == slug,
    ).delete(synchronize_session=False)
    db.commit()
    return _payload(db, loc, kind, slug, user.id)
