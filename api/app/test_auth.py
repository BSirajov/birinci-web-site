import os
import uuid
from pathlib import Path
from urllib.parse import parse_qs, urlparse

os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-prod")
_test_db = Path(__file__).resolve().parents[1] / "var" / f"test-{uuid.uuid4().hex}.db"
_test_db.parent.mkdir(parents=True, exist_ok=True)
os.environ["DATABASE_URL"] = "sqlite:///" + str(_test_db.as_posix())
os.environ["DEBUG"] = "true"

from fastapi.testclient import TestClient

from app.main import app
from app.rate_limit import limiter


def _csrf(client: TestClient) -> dict[str, str]:
    res = client.get("/api/auth/csrf")
    return {"X-CSRF-Token": res.json()["csrf_token"]}


def test_register_login_me_logout():
    limiter._hits.clear()
    with TestClient(app) as client:
        headers = _csrf(client)
        page = client.get("/account/login?lang=en")
        assert page.status_code == 200
        assert b"Sign in" in page.content
        email = f"phase1-{uuid.uuid4().hex[:8]}@example.com"
        password = "CorrectHorse9"

        reg = client.post(
            "/api/auth/register",
            json={"email": email, "password": password, "preferred_locale": "en", "first_name": "Ada", "last_name": "Lovelace", "display_name": "Ada"},
            headers=headers,
        )
        assert reg.status_code == 200, reg.text
        assert reg.json()["user"]["email"] == email
        assert "verify_url" in reg.json()

        me = client.get("/api/auth/me")
        assert me.json()["user"]["display_name"] == "Ada"
        assert me.json()["user"]["first_name"] == "Ada"
        assert me.json()["user"]["last_name"] == "Lovelace"

        verify = client.post("/api/auth/verify-email", json={"token": "bad"}, headers=headers)
        assert verify.status_code == 400

        qs = parse_qs(urlparse(reg.json()["verify_url"]).query)
        verify_ok = client.post("/api/auth/verify-email", json={"token": qs["token"][0]}, headers=headers)
        assert verify_ok.status_code == 200, verify_ok.text
        assert verify_ok.json()["user"]["is_verified"] is True

        client.post("/api/auth/logout", headers=headers)
        assert client.get("/api/auth/me").json()["user"] is None

        headers = _csrf(client)
        login = client.post("/api/auth/login", json={"email": email, "password": password}, headers=headers)
        assert login.status_code == 200
        assert client.get("/api/auth/me").json()["user"]["email"] == email


def test_anonymous_can_browse_site():
    limiter._hits.clear()
    with TestClient(app) as client:
        root = client.get("/")
        assert root.status_code == 200
        assert b"page-root-home" in root.content
        assert b"/account/login" not in root.headers.get("location", "").encode()
        home = client.get("/az/index.html")
        assert home.status_code == 200
        assert client.get("/api/auth/me").json()["user"] is None
        prefs = client.get("/api/preferences")
        assert prefs.status_code == 401


def test_unknown_email_invites_registration():
    limiter._hits.clear()
    with TestClient(app) as client:
        headers = _csrf(client)
        res = client.post(
            "/api/auth/login",
            json={"email": f"missing-{uuid.uuid4().hex[:8]}@example.com", "password": "CorrectHorse9"},
            headers=headers,
        )
        assert res.status_code == 401
        detail = res.json()["detail"]
        assert detail["code"] == "account_not_found"
        page = client.get("/account/login?lang=en")
        assert page.status_code == 200
        assert b"account-create" in page.content
        assert b"Create an account" in page.content
        signup = client.get("/account/register?lang=en&email=ada@example.com")
        assert signup.status_code == 200
        assert b'value="ada@example.com"' in signup.content


def test_wrong_password_does_not_claim_missing_account():
    limiter._hits.clear()
    with TestClient(app) as client:
        headers = _csrf(client)
        email = f"phase1-{uuid.uuid4().hex[:8]}@example.com"
        password = "CorrectHorse9"
        reg = client.post(
            "/api/auth/register",
            json={"email": email, "password": password, "preferred_locale": "en", "first_name": "Ada", "last_name": "Lovelace"},
            headers=headers,
        )
        assert reg.status_code == 200, reg.text
        client.post("/api/auth/logout", headers=headers)
        headers = _csrf(client)
        res = client.post(
            "/api/auth/login",
            json={"email": email, "password": "WrongHorse99"},
            headers=headers,
        )
        assert res.status_code == 401
        assert res.json()["detail"]["code"] == "invalid_password"


def _jpeg_bytes() -> bytes:
    from io import BytesIO

    from PIL import Image

    buf = BytesIO()
    Image.new("RGB", (64, 40), (0, 105, 180)).save(buf, "JPEG")
    return buf.getvalue()


def test_profile_photo_upload_and_serve():
    limiter._hits.clear()
    with TestClient(app) as client:
        headers = _csrf(client)
        email = f"photo-{uuid.uuid4().hex[:8]}@example.com"
        reg = client.post(
            "/api/auth/register",
            json={"email": email, "password": "CorrectHorse9", "preferred_locale": "en", "first_name": "Ada", "last_name": "Lovelace", "display_name": "Ada"},
            headers=headers,
        )
        assert reg.status_code == 200, reg.text
        assert reg.json()["user"]["avatar_url"] is None

        headers = _csrf(client)
        bad = client.post(
            "/api/auth/me/avatar",
            files={"file": ("note.txt", b"not-an-image", "text/plain")},
            headers=headers,
        )
        assert bad.status_code == 400

        headers = _csrf(client)
        up = client.post(
            "/api/auth/me/avatar",
            files={"file": ("me.jpg", _jpeg_bytes(), "image/jpeg")},
            headers=headers,
        )
        assert up.status_code == 200, up.text
        avatar_url = up.json()["user"]["avatar_url"]
        assert avatar_url
        assert avatar_url.startswith("/api/avatars/")

        me = client.get("/api/auth/me")
        assert me.json()["user"]["avatar_url"] == avatar_url

        photo = client.get(avatar_url.split("?")[0])
        assert photo.status_code == 200
        assert photo.headers["content-type"].startswith("image/jpeg")
        assert photo.content[:3] == b"\xff\xd8\xff"


def test_delete_account_requires_confirm_then_purges_data():
    limiter._hits.clear()
    with TestClient(app) as client:
        headers = _csrf(client)
        email = f"gone-{uuid.uuid4().hex[:8]}@example.com"
        password = "CorrectHorse9"
        reg = client.post(
            "/api/auth/register",
            json={"email": email, "password": password, "preferred_locale": "en", "first_name": "Ada", "last_name": "Lovelace", "display_name": "Ada"},
            headers=headers,
        )
        assert reg.status_code == 200, reg.text
        headers = _csrf(client)
        client.put("/api/preferences", json={"data": {"home_view": "cards"}}, headers=headers)
        headers = _csrf(client)
        client.post(
            "/api/auth/me/avatar",
            files={"file": ("me.jpg", _jpeg_bytes(), "image/jpeg")},
            headers=headers,
        )
        avatar_url = client.get("/api/auth/me").json()["user"]["avatar_url"]
        avatar_path = avatar_url.split("?")[0]

        headers = _csrf(client)
        refused = client.request("DELETE", "/api/auth/me", json={"confirm": False}, headers=headers)
        assert refused.status_code == 400
        assert client.get("/api/auth/me").json()["user"]["email"] == email

        headers = _csrf(client)
        gone = client.request("DELETE", "/api/auth/me", json={"confirm": True}, headers=headers)
        assert gone.status_code == 200, gone.text
        assert client.get("/api/auth/me").json()["user"] is None
        assert client.get("/api/preferences").status_code == 401
        assert client.get(avatar_path).status_code == 404

        headers = _csrf(client)
        login = client.post(
            "/api/auth/login",
            json={"email": email, "password": password},
            headers=headers,
        )
        assert login.status_code == 401
        assert login.json()["detail"]["code"] == "account_not_found"

        headers = _csrf(client)
        again = client.post(
            "/api/auth/register",
            json={"email": email, "password": password, "preferred_locale": "en", "first_name": "Ada", "last_name": "Lovelace"},
            headers=headers,
        )
        assert again.status_code == 200, again.text
