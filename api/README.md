# Birİnci API

Phase 1–5: sign-up, login, email verify, password reset, session cookies, preferences, comments, reactions, and emailed feedback.

## Production architecture (Hostinger)

| Piece | Where |
|-------|--------|
| Static site (`az`/`en`/`ru`/`ky`, assets) | Hostinger **web hosting** |
| Database | Hostinger **MySQL / MariaDB** (hPanel → Databases) |
| FastAPI API | Small **VPS** (venv + systemd; no containers) |
| Prefer | Same domain path `/api` (Nginx reverse proxy) so session cookies stay same-origin |

See [docs/HOSTINGER_DEPLOYMENT.md](../docs/HOSTINGER_DEPLOYMENT.md) for the full checklist.

## Storage

| What | Where |
|------|--------|
| Accounts, `password_hash` (argon2 only), sessions, preferences | **MySQL / MariaDB** (production); SQLite locally |
| Profile picture bytes | `api/var/avatars/` (filename only in DB) |
| Secrets (`SECRET_KEY`, `DATABASE_URL`, mail keys) | `.env` / host secrets — never commit real values |
| Story/discovery content | Static HTML (not in the DB) |

Passwords are **never** stored in plaintext or in configuration files.

## Local development (SQLite)

```bash
cd api
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/macOS
pip install -r requirements.txt
copy .env.example .env          # or: cp .env.example .env
```

`.env.example` defaults to:

`DATABASE_URL=sqlite:///./var/birinci.db`

Start the API (migrations run on startup via `init_db()`):

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8088
```

Open:

- Site: http://127.0.0.1:8088/ or http://127.0.0.1:8088/az/index.html
- Account: http://127.0.0.1:8088/account/register?lang=az
- Health: http://127.0.0.1:8088/api/health

Optional explicit migrate:

```bash
alembic upgrade head
```

## Pointing at Hostinger MySQL (from a VPS or local test)

In hPanel create a database + user, then set:

```env
DATABASE_URL=mysql+pymysql://USER:PASSWORD@HOST:3306/DBNAME?charset=utf8mb4
```

`mysql://` and `mariadb://` URLs are accepted and rewritten to `mysql+pymysql://`.

Then:

```bash
alembic upgrade head
python scripts/verify_storage.py
```

Remote MySQL from your laptop may be blocked by Hostinger firewall — prefer running migrations on the VPS.

## Auth notes

- Session cookie: `birinci_session` (httpOnly)
- CSRF: fetch `/api/auth/csrf`, send `X-CSRF-Token` on POST
- First user whose email matches `ADMIN_EMAIL` in `.env` gets the `admin` role
- Verification and reset emails are **printed to the console** and saved under `api/var/outbox/` (no SMTP yet)
- In debug mode, register/reset JSON may also include `verify_url` / `reset_url`

## Verify storage

```bash
cd api
python scripts/verify_storage.py
```

Applies migrations, registers a user, asserts `password_hash` is argon2-only, and checks preferences JSON round-trip.

## Production checklist (short)

- Hostinger MySQL `DATABASE_URL` — do not use SQLite in production
- Strong `SECRET_KEY`; `DEBUG=false`; `COOKIE_SECURE=true` behind HTTPS
- Nginx (or Hostinger proxy) same-origin `/api` → VPS uvicorn
- Avatars on VPS disk or object storage when you scale
- Transactional email (verify, reset, feedback)
- Backups + `alembic upgrade head` on deploy
- Comments, reactions, and feedback use Alembic revision `0002_engagement`
