from __future__ import annotations

import json

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session as DbSession

from app.database import UserPreference, get_db
from app.deps import require_csrf, require_user
from app.schemas import PreferencesIn
from app.security import utcnow

router = APIRouter(tags=["preferences"])


def _load_data(row: UserPreference | None) -> dict:
    if row is None or row.data is None:
        return {}
    data = row.data
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except json.JSONDecodeError:
            return {}
    if isinstance(data, dict):
        return dict(data)
    return {}


@router.get("/api/preferences")
def get_preferences(request: Request, db: DbSession = Depends(get_db)) -> dict:
    user = require_user(request, db)
    return {"ok": True, "data": _load_data(db.get(UserPreference, user.id))}


@router.put("/api/preferences")
def put_preferences(payload: PreferencesIn, request: Request, db: DbSession = Depends(get_db)) -> dict:
    require_csrf(request)
    user = require_user(request, db)
    row = db.get(UserPreference, user.id)
    incoming = payload.data if isinstance(payload.data, dict) else {}
    existing = _load_data(row)
    existing.update(incoming)
    if row is None:
        row = UserPreference(user_id=user.id, data={})
        db.add(row)
    row.data = existing
    row.updated_at = utcnow()
    db.commit()
    return {"ok": True, "data": existing}
