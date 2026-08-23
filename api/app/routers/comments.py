from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session as DbSession

from app.content import clean_text, normalize_target
from app.database import Comment, User, get_db
from app.deps import client_ip, get_current_user, require_csrf, require_moderator, require_user, require_verified_user
from app.rate_limit import limiter
from app.schemas import COMMENT_STATUSES, MODERATE_ACTIONS, CommentCreateIn, CommentModerateIn, CommentPatchIn
from app.security import utcnow

router = APIRouter(prefix="/api/comments", tags=["comments"])

PUBLIC_STATUSES = {"approved"}
AUTHOR_VISIBLE = {"pending", "approved", "rejected"}


def _author(user: User | None) -> dict:
    if user is None:
        return {"display_name": "Reader", "avatar_url": None}
    from app.avatars import public_avatar_url

    name = user.display_name or " ".join(part for part in (user.first_name, user.last_name) if part).strip()
    return {
        "display_name": name or "Reader",
        "avatar_url": public_avatar_url(user.avatar_filename),
    }


def _public(row: Comment, viewer: User | None, author: User | None = None) -> dict:
    return {
        "id": row.id,
        "parent_comment_id": row.parent_comment_id,
        "body": row.body,
        "status": row.status,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        "edited_at": row.edited_at.isoformat() if row.edited_at else None,
        "mine": bool(viewer and viewer.id == row.user_id),
        "author": _author(author),
    }


def _visible_to(row: Comment, viewer: User | None) -> bool:
    if row.status == "deleted":
        return False
    if row.status in PUBLIC_STATUSES:
        return True
    return bool(viewer and viewer.id == row.user_id and row.status in AUTHOR_VISIBLE)


@router.get("")
def list_comments(
    locale: str,
    target_type: str,
    target_slug: str,
    request: Request,
    db: DbSession = Depends(get_db),
) -> dict:
    loc, kind, slug = normalize_target(locale, target_type, target_slug)
    viewer = get_current_user(request, db)
    rows = (
        db.query(Comment)
        .filter(
            Comment.locale == loc,
            Comment.target_type == kind,
            Comment.target_slug == slug,
            Comment.status != "deleted",
        )
        .order_by(Comment.created_at.asc())
        .limit(200)
        .all()
    )
    authors = {u.id: u for u in db.query(User).filter(User.id.in_({r.user_id for r in rows} or {"-"})).all()}
    visible = [row for row in rows if _visible_to(row, viewer)]
    return {
        "ok": True,
        "comments": [_public(row, viewer, authors.get(row.user_id)) for row in visible],
    }


@router.post("")
def create_comment(payload: CommentCreateIn, request: Request, db: DbSession = Depends(get_db)) -> dict:
    require_csrf(request)
    user = require_verified_user(request, db)
    ip = client_ip(request)
    if not limiter.allow(f"comment:{user.id}", 1, 10) or not limiter.allow(f"comment-ip:{ip}", 20, 3600):
        raise HTTPException(status_code=429, detail="Please wait a moment before commenting again.")

    loc, kind, slug = normalize_target(payload.locale, payload.target_type, payload.target_slug)
    body = clean_text(payload.body, max_len=2000)
    parent_id = (payload.parent_comment_id or "").strip() or None
    if parent_id:
        parent = db.get(Comment, parent_id)
        if (
            parent is None
            or parent.parent_comment_id is not None
            or parent.locale != loc
            or parent.target_type != kind
            or parent.target_slug != slug
            or parent.status == "deleted"
        ):
            raise HTTPException(status_code=400, detail="Replies are only allowed on top-level comments.")

    row = Comment(
        id=str(uuid.uuid4()),
        user_id=user.id,
        parent_comment_id=parent_id,
        locale=loc,
        target_type=kind,
        target_slug=slug,
        body=body,
        status="pending",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"ok": True, "comment": _public(row, user, user), "message": "Comment submitted for review."}


@router.patch("/{comment_id}")
def edit_comment(comment_id: str, payload: CommentPatchIn, request: Request, db: DbSession = Depends(get_db)) -> dict:
    require_csrf(request)
    user = require_verified_user(request, db)
    row = db.get(Comment, comment_id)
    if row is None or row.status == "deleted":
        raise HTTPException(status_code=404, detail="Comment not found.")
    if row.user_id != user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own comments.")
    row.body = clean_text(payload.body, max_len=2000)
    row.status = "pending"
    row.edited_at = utcnow()
    db.commit()
    db.refresh(row)
    return {"ok": True, "comment": _public(row, user, user)}


@router.delete("/{comment_id}")
def delete_comment(comment_id: str, request: Request, db: DbSession = Depends(get_db)) -> dict:
    require_csrf(request)
    user = require_user(request, db)
    row = db.get(Comment, comment_id)
    if row is None or row.status == "deleted":
        raise HTTPException(status_code=404, detail="Comment not found.")
    if row.user_id != user.id and user.role not in {"admin", "moderator"}:
        raise HTTPException(status_code=403, detail="You can only delete your own comments.")
    row.status = "deleted"
    row.updated_at = utcnow()
    db.commit()
    return {"ok": True}


@router.get("/moderation")
def moderation_queue(request: Request, status: str = "pending", db: DbSession = Depends(get_db)) -> dict:
    require_moderator(request, db)
    wanted = (status or "pending").strip().lower()
    if wanted not in COMMENT_STATUSES:
        raise HTTPException(status_code=400, detail="Unknown status.")
    rows = (
        db.query(Comment)
        .filter(Comment.status == wanted)
        .order_by(Comment.created_at.asc())
        .limit(200)
        .all()
    )
    authors = {u.id: u for u in db.query(User).filter(User.id.in_({r.user_id for r in rows} or {"-"})).all()}
    return {
        "ok": True,
        "comments": [
            {
                **_public(row, None, authors.get(row.user_id)),
                "locale": row.locale,
                "target_type": row.target_type,
                "target_slug": row.target_slug,
            }
            for row in rows
        ],
    }


@router.post("/{comment_id}/moderate")
def moderate_comment(
    comment_id: str,
    payload: CommentModerateIn,
    request: Request,
    db: DbSession = Depends(get_db),
) -> dict:
    require_csrf(request)
    require_moderator(request, db)
    action = (payload.action or "").strip().lower()
    if action not in MODERATE_ACTIONS:
        raise HTTPException(status_code=400, detail="action must be approve or reject.")
    row = db.get(Comment, comment_id)
    if row is None or row.status == "deleted":
        raise HTTPException(status_code=404, detail="Comment not found.")
    row.status = "approved" if action == "approve" else "rejected"
    row.updated_at = utcnow()
    db.commit()
    db.refresh(row)
    return {"ok": True, "comment": {"id": row.id, "status": row.status}}
