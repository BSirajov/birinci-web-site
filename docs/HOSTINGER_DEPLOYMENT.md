# Hostinger deployment (static site + MySQL + VPS API)

Long-term layout for Birİnci:

| Piece | Host |
|-------|------|
| Static HTML / assets | Hostinger **web hosting** |
| Accounts / sessions / prefs | Hostinger **MySQL or MariaDB** |
| FastAPI (`api/`) | Small **VPS** (Python venv + systemd) |

No Docker. Prefer one public origin with `/api` proxied to the VPS so `birinci_session` cookies stay same-site.

---

## 1. Database (hPanel)

1. hPanel → **Databases** → create MySQL/MariaDB database + user.
2. Note host (often something like `localhost` from Hostinger PHP, or a remote hostname for external access), port `3306`, db name, user, password.
3. Charset: **utf8mb4**.
4. If the VPS is not on the same Hostinger network, allow the VPS IP for remote MySQL (hPanel remote access / firewall), or use Hostinger’s documented remote host.

Connection string for the API:

```env
DATABASE_URL=mysql+pymysql://USER:PASSWORD@HOST:3306/DBNAME?charset=utf8mb4
```

---

## 2. Static site (web hosting)

1. Build/publish the usual site tree (`index.html`, `az/`, `en/`, `ru/`, `ky/`, `assets/`, …) — same as today’s Hostinger upload / Git deploy.
2. Do **not** put SQLite or API secrets on shared web hosting.
3. Keep front-end API calls relative (`/api/...`) once the reverse proxy is live.

Optional local check before upload: serve via the API’s static mount at `http://127.0.0.1:8088/` during development.

---

## 3. VPS (FastAPI)

Minimum: 1 vCPU, 1–2 GB RAM, Ubuntu LTS (or similar).

### 3.1 System packages

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nginx
```

### 3.2 App install

```bash
sudo mkdir -p /opt/birinci-api
sudo chown "$USER":"$USER" /opt/birinci-api
# copy or git-clone the repo; keep working directory at the api/ folder
cd /opt/birinci-api/api   # or wherever api/ lives
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
nano .env
```

Production `.env` essentials:

```env
SECRET_KEY=<long-random-string>
DEBUG=false
PUBLIC_BASE_URL=https://your-domain.tld
DATABASE_URL=mysql+pymysql://USER:PASSWORD@HOST:3306/DBNAME?charset=utf8mb4
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
SESSION_DAYS=30
ADMIN_EMAIL=you@example.com
```

### 3.3 Schema

```bash
source .venv/bin/activate
alembic upgrade head
python scripts/verify_storage.py   # optional smoke test
```

### 3.4 systemd unit

`/etc/systemd/system/birinci-api.service`:

```ini
[Unit]
Description=Birİnci FastAPI
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/birinci-api/api
EnvironmentFile=/opt/birinci-api/api/.env
ExecStart=/opt/birinci-api/api/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8088
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Adjust `User`/`paths` to match your install. Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now birinci-api
sudo systemctl status birinci-api
```

Ensure `api/var/` (avatars, outbox) is writable by that user.

---

## 4. Reverse proxy (`/api` → VPS)

**Preferred:** terminate TLS on Hostinger (or Cloudflare) and proxy `/api` and `/account` to the VPS.

If Nginx runs **on the VPS** as the public edge:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.tld;
    # ssl_certificate ...;

    # Static files can stay on Hostinger web hosting instead;
    # this block is only required if the VPS also serves HTML.

    location /api/ {
        proxy_pass http://127.0.0.1:8088/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /account {
        proxy_pass http://127.0.0.1:8088/account;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

If static hosting and VPS are separate hosts, configure Hostinger / Cloudflare to reverse-proxy those paths to `https://vps-ip-or-hostname` (or use a subdomain `api.` only if you set cookie `Domain` carefully — same-origin `/api` is simpler).

Health check: `https://your-domain.tld/api/health`

---

## 5. Cookies & TLS

- Site and API must share an origin (or a controlled parent domain).
- `COOKIE_SECURE=true` only with HTTPS.
- `PUBLIC_BASE_URL` must match the public HTTPS URL used in email verify/reset links.

---

## 6. Backups & deploys

- Enable Hostinger MySQL backups (or `mysqldump` cron from the VPS).
- On each API release: pull code → `pip install -r requirements.txt` → `alembic upgrade head` → `systemctl restart birinci-api`.
- Never commit `.env`. Rotate `SECRET_KEY` only with a planned session wipe.

---

## 7. Email (later)

Until SMTP/Postmark is wired, verify/reset links go to console + `api/var/outbox/`. For production Phase 0, configure real transactional email and set inbox addresses for feedback.

---

## 8. Local vs production

| | Local | Production |
|--|-------|------------|
| DB | SQLite `./var/birinci.db` | Hostinger MySQL |
| API | `uvicorn` on laptop `:8088` | VPS + systemd |
| Site | Served by FastAPI static mount | Hostinger web hosting |
| Docker | Not used | Not used |
