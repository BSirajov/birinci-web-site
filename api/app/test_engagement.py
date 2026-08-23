import os
import uuid
from pathlib import Path

os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-prod")
_test_db = Path(__file__).resolve().parents[1] / "var" / f"test-engage-{uuid.uuid4().hex}.db"
_test_db.parent.mkdir(parents=True, exist_ok=True)
os.environ["DATABASE_URL"] = "sqlite:///" + str(_test_db.as_posix())
os.environ["DEBUG"] = "true"
os.environ["ADMIN_EMAIL"] = "admin@example.com"

from fastapi.testclient import TestClient

from app.main import app
from app.rate_limit import limiter


def _csrf(client: TestClient) -> dict[str, str]:
    res = client.get("/api/auth/csrf")
    return {"X-CSRF-Token": res.json()["csrf_token"]}


def _register(client: TestClient, *, email: str, verified: bool = False, admin: bool = False) -> dict:
    headers = _csrf(client)
    payload = {
        "email": email,
        "password": "CorrectHorse9",
        "preferred_locale": "en",
        "first_name": "Ada",
        "last_name": "Lovelace",
    }
    if admin:
        payload["email"] = "admin@example.com"
    res = client.post("/api/auth/register", json=payload, headers=headers)
    assert res.status_code == 200, res.text
    if verified:
        from urllib.parse import parse_qs, urlparse

        qs = parse_qs(urlparse(res.json()["verify_url"]).query)
        headers = _csrf(client)
        verify = client.post("/api/auth/verify-email", json={"token": qs["token"][0]}, headers=headers)
        assert verify.status_code == 200, verify.text
    return res.json()["user"]


def test_comments_require_verified_and_premoderate():
    limiter._hits.clear()
    with TestClient(app) as client:
        _register(client, email=f"raw-{uuid.uuid4().hex[:8]}@example.com", verified=False)
        headers = _csrf(client)
        pending_user = client.post(
            "/api/comments",
            json={"locale": "en", "target_type": "story", "target_slug": "the-candles-conversation", "body": "Nice story."},
            headers=headers,
        )
        assert pending_user.status_code == 403

        client.post("/api/auth/logout", headers=_csrf(client))
        _register(client, email=f"ok-{uuid.uuid4().hex[:8]}@example.com", verified=True)
        headers = _csrf(client)
        created = client.post(
            "/api/comments",
            json={"locale": "en", "target_type": "story", "target_slug": "the-candles-conversation", "body": "Nice story."},
            headers=headers,
        )
        assert created.status_code == 200, created.text
        comment = created.json()["comment"]
        assert comment["status"] == "pending"
        assert comment["mine"] is True

        public = client.get(
            "/api/comments",
            params={"locale": "en", "target_type": "story", "target_slug": "the-candles-conversation"},
        )
        assert public.status_code == 200
        assert any(item["id"] == comment["id"] for item in public.json()["comments"])

        anon = TestClient(app)
        listed = anon.get(
            "/api/comments",
            params={"locale": "en", "target_type": "story", "target_slug": "the-candles-conversation"},
        )
        assert listed.status_code == 200
        assert listed.json()["comments"] == []


def test_moderator_approves_comment_and_reply_rules():
    limiter._hits.clear()
    with TestClient(app) as client:
        from app.database import SessionLocal, User

        admin_email = f"mod-{uuid.uuid4().hex[:8]}@example.com"
        _register(client, email=admin_email, verified=True)
        with SessionLocal() as db:
            user = db.query(User).filter(User.email == admin_email).first()
            user.role = "admin"
            db.commit()
        admin_headers = _csrf(client)
        client.post("/api/auth/logout", headers=admin_headers)

        _register(client, email=f"reader-{uuid.uuid4().hex[:8]}@example.com", verified=True)
        headers = _csrf(client)
        created = client.post(
            "/api/comments",
            json={"locale": "az", "target_type": "discovery", "target_slug": "controlled-use-of-fire", "body": "Faydalı."},
            headers=headers,
        )
        assert created.status_code == 200, created.text
        comment_id = created.json()["comment"]["id"]

        limiter._hits.clear()
        bad_reply = client.post(
            "/api/comments",
            json={
                "locale": "az",
                "target_type": "discovery",
                "target_slug": "controlled-use-of-fire",
                "body": "nested",
                "parent_comment_id": comment_id,
            },
            headers=_csrf(client),
        )
        assert bad_reply.status_code == 200
        reply_id = bad_reply.json()["comment"]["id"]
        limiter._hits.clear()
        nested = client.post(
            "/api/comments",
            json={
                "locale": "az",
                "target_type": "discovery",
                "target_slug": "controlled-use-of-fire",
                "body": "too deep",
                "parent_comment_id": reply_id,
            },
            headers=_csrf(client),
        )
        assert nested.status_code == 400

        client.post("/api/auth/logout", headers=_csrf(client))
        client.post(
            "/api/auth/login",
            json={"email": admin_email, "password": "CorrectHorse9"},
            headers=_csrf(client),
        )
        queue = client.get("/api/comments/moderation?status=pending")
        assert queue.status_code == 200
        assert any(item["id"] == comment_id for item in queue.json()["comments"])

        approved = client.post(
            f"/api/comments/{comment_id}/moderate",
            json={"action": "approve"},
            headers=_csrf(client),
        )
        assert approved.status_code == 200
        assert approved.json()["comment"]["status"] == "approved"

        public = TestClient(app).get(
            "/api/comments",
            params={"locale": "az", "target_type": "discovery", "target_slug": "controlled-use-of-fire"},
        )
        assert any(item["id"] == comment_id for item in public.json()["comments"])


def test_reactions_toggle_and_counts():
    limiter._hits.clear()
    with TestClient(app) as client:
        _register(client, email=f"fan-{uuid.uuid4().hex[:8]}@example.com", verified=False)
        headers = _csrf(client)
        target = {"locale": "en", "target_type": "story", "target_slug": "the-candles-conversation"}
        liked = client.put("/api/reactions", json={**target, "value": "like"}, headers=headers)
        assert liked.status_code == 200, liked.text
        assert liked.json()["likes"] == 1
        assert liked.json()["mine"] == "like"

        swapped = client.put("/api/reactions", json={**target, "value": "dislike"}, headers=_csrf(client))
        assert swapped.status_code == 200
        assert swapped.json()["likes"] == 0
        assert swapped.json()["dislikes"] == 1
        assert swapped.json()["mine"] == "dislike"

        cleared = client.request("DELETE", "/api/reactions", json=target, headers=_csrf(client))
        assert cleared.status_code == 200, cleared.text
        assert cleared.json()["dislikes"] == 0
        assert cleared.json()["mine"] is None

        anon = TestClient(app).get("/api/reactions", params=target)
        assert anon.status_code == 200
        assert anon.json()["mine"] is None


def test_feedback_saves_and_writes_outbox():
    limiter._hits.clear()
    with TestClient(app) as client:
        page = client.get("/feedback?lang=en")
        assert page.status_code == 200
        assert b"Feedback" in page.content
        headers = _csrf(client)
        res = client.post(
            "/api/feedback",
            json={
                "category": "improvement",
                "body": "Please add a print stylesheet.",
                "contact_email": "reader@example.com",
                "locale": "en",
                "page_url": "https://birinci.cloud/en/index.html",
            },
            headers=headers,
        )
        assert res.status_code == 200, res.text
        assert res.json()["ok"] is True
        outbox = Path(__file__).resolve().parents[1] / "var" / "outbox"
        notes = list(outbox.glob("*-feedback.txt"))
        assert notes, "expected a feedback outbox file"


def test_honeypot_feedback_is_swallowed():
    limiter._hits.clear()
    with TestClient(app) as client:
        res = client.post(
            "/api/feedback",
            json={
                "category": "other",
                "body": "spam",
                "contact_email": "bot@example.com",
                "website": "http://spam.example",
            },
            headers=_csrf(client),
        )
        assert res.status_code == 200
        assert res.json()["ok"] is True
