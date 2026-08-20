# Birİnci — Technical Specification: Auth, Preferences, Comments, Reactions & Feedback

**Status:** Draft v4 (reactions added)  
**Owner:** Bakhtiyar  
**Date:** 2026-08-19  
**Supersedes:** v3 in this folder; original `.docx` (auth/comments/analytics)

---

## 1. Current objectives

| In scope now | Out of scope for now |
|--------------|----------------------|
| Sign-up and login | Custom analytics / pageview warehouse |
| Save **preferences** for registered users across sessions (and devices) | Social login |
| **Comments** on Stories and Discoveries | Migrating content into the database |
| **Reactions** — like / dislike on each Story and Discovery (simple Facebook-style feedback) | Reactions on comments; emoji reaction pickers |
| **Feedback** → email suggestions (improvements, missing features, bugs, etc.) | Unlimited comment nesting; cross-locale shared threads |

Analytics can be revisited later (e.g. Plausible/Umami). Do not build it in this phase.

### 1.1 Product defaults

| Topic | Decision |
|-------|----------|
| Unverified users | Can log in; **cannot** comment until email verified. May **react** (like/dislike) after login even if unverified. Preferences may sync after login. |
| Comment moderation | **Pre-moderation** (`pending` until approved) |
| Auth | **httpOnly session cookies** (no JWT access tokens in JS) |
| Content target key | `locale` + `target_type` (`story` \| `discovery`) + `target_slug` — shared by comments and reactions |
| Threading | Max **2 levels** (comment → reply) |
| Reactions | Exactly one of: **like**, **dislike**, or **none** per user per item; choosing the other replaces; clicking the active one clears it |
| Feedback | **Email to the site team** via a form (not a public comment thread) |

### 1.2 Blocking check before Phase 1

Confirm audience: if under-16 users are expected to create accounts, pause for COPPA/GDPR-for-minors.  

**Working assumption:** accounts are for adults / parents / educators.

---

## 2. Architecture

Birİnci remains a **static multilingual site** (`az` / `en` / `ru` / `ky`) on Hostinger web hosting. A **FastAPI** sidecar on a small VPS, backed by **Hostinger MySQL/MariaDB**, provides auth, preference storage, comments, reactions, and feedback mail.

```text
Static site (existing)          API (new)
{lang}/**/*.html         ←→     /api/auth/*
assets/site.js                  /api/preferences
comments + reactions UI         /api/comments*
feedback form                   /api/reactions*
                                /api/feedback  → transactional email
```

Prefer same site or subdomain so session cookies work (`birinci.cloud` + `api.birinci.cloud` or path `/api` on the same origin).

Content (stories, discoveries) stays in generated HTML/Word sources — **not** in MySQL.

---

## 3. Tech stack

| Layer | Choice |
|-------|--------|
| Backend | FastAPI (VPS: venv + systemd) |
| DB | Hostinger MySQL / MariaDB (`utf8mb4`; SQLite for local only) |
| ORM | SQLAlchemy 2.0 + Alembic |
| Hosting | Static site → Hostinger web hosting; API → VPS; prefer same-origin `/api` proxy |
| Passwords | argon2 (`argon2-cffi`) |
| Sessions | Server-side; cookie `birinci_session` (httpOnly, Secure, SameSite) |
| Email | Postmark / SendGrid / SES — verification, password reset, **and feedback inbox** |

---

## 4. Authentication

### 4.1 Register

- Email, password, optional display name, optional `preferred_locale`.  
- Password strength rules; hash with argon2; `is_verified = false`.  
- Send localized verification email (signed token, ~24h).  
- Rate-limit registration.

### 4.2 Login / logout

- Email + password → create session row; set session cookie.  
- Rate-limit failures (IP + account).  
- Logout revokes current session; “log out all devices” revokes all.  
- Password change/reset revokes all sessions.

### 4.3 Password reset

- Always return a generic response (no account enumeration).  
- Signed, short-lived link; update hash; revoke sessions.

### 4.4 Frontend

- Login / register / verify / reset pages (static HTML + API), linked from site chrome when logged out.  
- Logged-in state via `GET /api/auth/me` (display name, verified flag, preferred locale).

---

## 5. Preferences (registered users)

**Goal:** a logged-in user gets the same settings on return visits and on another browser/device after login.

### 5.1 What to sync (v1)

Align with what the site already stores locally where possible, e.g.:

- Home / category **view mode** (list vs cards)  
- Batch / page size preferences (if still used)  
- Preferred **UI locale** (and optionally last locale visited)  
- Future toggles (e.g. reduced motion) as key/value  

Anonymous users keep today’s **`localStorage`** behaviour. On login, **merge**: server prefs win for keys present on server; otherwise upload local keys once (document merge rule in implementation).

### 5.2 Model: `user_preferences`

| Column | Notes |
|--------|--------|
| `user_id` | PK/FK → users |
| `data` | JSON object of preference keys (MySQL/MariaDB JSON) |
| `updated_at` | |

### 5.3 API

```text
GET  /api/preferences      # requires session
PUT  /api/preferences      # replace or merge whole JSON object (choose one; recommend merge-patch)
```

Client (`assets/site.js` or small `assets/prefs.js`): after login, fetch and apply; on change while logged in, debounce PUT.

---

## 6. Comments (Stories & Discoveries only)

### 6.1 Rules

- Only authenticated **and verified** users.  
- Targets: **story** or **discovery** pages only (not general site chatter).  
- Identity: `locale` + `target_type` + `target_slug` (slug from static URL/filename).  
- Each locale page has its **own** thread in v1.  
- New comments: `status = pending` until a moderator approves.  
- Author may edit/soft-delete own comments; **re-queue to `pending` after edit** (recommended).  
- Rate-limit create (e.g. 1 / 10s).  
- Store **plain text**; escape on render (no user HTML).

### 6.2 Model: `comments`

| Column | Notes |
|--------|--------|
| `id` | UUID |
| `user_id` | FK |
| `parent_comment_id` | nullable; reply only to top-level |
| `locale` | az \| en \| ru \| ky |
| `target_type` | story \| discovery |
| `target_slug` | non-null |
| `body` | text |
| `status` | pending \| approved \| rejected \| deleted |
| `created_at` / `updated_at` / `edited_at` | |

### 6.3 API

```text
GET    /api/comments?locale=&target_type=&target_slug=
POST   /api/comments
PATCH  /api/comments/{id}
DELETE /api/comments/{id}
GET    /api/comments/moderation?status=pending
POST   /api/comments/{id}/moderate
```

### 6.4 UI

- Mount on story and discovery templates via build/chrome (`data-lang`, `data-comments-type`, `data-comments-slug`).  
- Show approved comments publicly; CTA to log in / verify to post.  
- Minimal moderator queue page for approve/reject.

---

## 7. Reactions — like / dislike (Stories & Discoveries)

**Goal:** Facebook-style simple feedback on each Story and Discovery: the reader indicates whether they **liked** or **disliked** the item. Not a free-form emoji picker; not reactions on individual comments (v1).

### 7.1 Behaviour

| Action | Result |
|--------|--------|
| Tap **Like** when none / dislike set | User’s reaction becomes `like` |
| Tap **Dislike** when none / like set | User’s reaction becomes `dislike` |
| Tap the **same** control again | Reaction cleared (`none`) |
| Not logged in | Controls visible; prompt to log in / sign up |

- **One reaction per user per item** (unique on user + content target).  
- Like and dislike are **mutually exclusive**.  
- Public UI shows **counts** of likes and dislikes (and highlights the viewer’s choice when logged in).  
- Same content key as comments: `locale` + `target_type` + `target_slug`.  
- Each locale page has its **own** counts in v1 (same rule as comments).

### 7.2 Who can react

- Must be **logged in**.  
- Email verification **not** required for reactions (lower friction than comments).  
- Rate-limit: e.g. 30 reaction changes / minute / user (enough for toggles, blocks abuse bots).

### 7.3 Model: `reactions`

| Column | Notes |
|--------|--------|
| `id` | UUID |
| `user_id` | FK → users |
| `locale` | az \| en \| ru \| ky |
| `target_type` | story \| discovery |
| `target_slug` | non-null |
| `value` | `like` \| `dislike` |
| `created_at` / `updated_at` | |

**Unique constraint:** `(user_id, locale, target_type, target_slug)`.

Clearing a reaction **deletes** the row (or soft-deletes — prefer hard delete for simplicity).

### 7.4 API

```text
GET    /api/reactions?locale=&target_type=&target_slug=
       # public: { likes: N, dislikes: N, mine: "like"|"dislike"|null }
       # mine is null when anonymous or no reaction

PUT    /api/reactions
       # auth required; body: locale, target_type, target_slug, value: "like"|"dislike"
       # upserts the user’s row

DELETE /api/reactions
       # auth required; query/body: locale, target_type, target_slug
       # clears the user’s reaction
```

Optional convenience: `POST` with `value` null meaning clear — pick one style and stick to it (**recommend PUT + DELETE**).

### 7.5 UI

- Place a compact **Like / Dislike** control near the article title or footer of each Story and Discovery (with counts).  
- Use clear icons + accessible labels (localized strings); avoid relying on colour alone.  
- Optimistic UI update on tap; reconcile with API response.  
- Do not show a list of who liked/disliked in v1 (counts only — privacy and simplicity).

### 7.6 Aggregation note

For v1, counts can be `COUNT(*)` filtered by `value` on read (indexed). If volume grows, add a cached counters table later — not required at launch.

---

## 8. Feedback (email suggestions)

**Goal:** anyone (or optionally logged-in only — **recommendation: allow anonymous**) can send suggestions about improvements, missing features, technical issues, and other enhancements **to the site team by email**.

This is **not** a public comment list. It is a **contact/feedback form** that results in an email (and optionally a DB row for a simple inbox log).

### 8.1 Form fields (v1)

- Category: `improvement` \| `missing_feature` \| `technical_issue` \| `other`  
- Message (required, length-capped)  
- Contact email (required if anonymous; prefilled if logged in)  
- Optional name  
- `locale` (from page)  
- Optional page URL (auto-filled)  

### 8.2 Behaviour

1. `POST /api/feedback` (rate-limited by IP; honeypot field optional).  
2. Validate; send email to a configured inbox (e.g. `feedback@…` or owner address) with category, message, locale, URL, and reply-to = submitter.  
3. Optionally insert `feedback_messages` for internal history (status: new/read).  
4. Return a generic success message in the page locale.  
5. Do **not** publish feedback on the site.

### 8.3 Model (optional but useful): `feedback_messages`

| Column | Notes |
|--------|--------|
| `id` | UUID |
| `user_id` | nullable |
| `category` | enum |
| `body` | text |
| `contact_email` | |
| `locale` | |
| `page_url` | nullable |
| `created_at` | |
| `status` | new \| read \| archived |

### 8.4 UI

- Dedicated Feedback page and/or footer link in all locales.  
- Strings in existing i18n locale files.

---

## 9. Data model (summary)

- `users` — email, password_hash, display_name, preferred_locale, is_verified, is_active, role  
- `sessions` — token_hash, expires_at, revoked_at  
- `user_preferences` — JSON `data`  
- `comments` — as above  
- `reactions` — like/dislike per user per story/discovery  
- `feedback_messages` — optional log of emailed feedback  

No `analytics_events` table in this phase.

---

## 10. Security (essentials)

- HTTPS; argon2; httpOnly Secure session cookie  
- CSRF protection on cookie-authenticated mutating routes  
- Escape comment/feedback text; never store password plaintext  
- Rate limits: register, login, reset, comment create, reaction change, feedback  
- Role checks for moderation  
- Privacy policy updated for accounts, session cookie, reactions, feedback emails, retention/deletion  

---

## 11. Implementation phases

### Phase 0 — Prerequisites

- Hostinger MySQL + VPS API hosting; same-origin `/api`; TLS (see `docs/HOSTINGER_DEPLOYMENT.md`)  
- Transactional email (verify, reset, feedback-to-inbox)  
- Age/audience + privacy policy sign-off  

### Phase 1 — Auth

- Register, verify, login, logout, password reset, `/api/auth/me`  
- Account UI in chrome  

### Phase 2 — Preferences

- `GET`/`PUT /api/preferences`  
- Wire existing client prefs to sync when logged in  

### Phase 3 — Comments

- API + panel on Stories/Discoveries  
- Pre-moderation queue  
- Soft delete / edit + rate limits  

### Phase 4 — Reactions (like / dislike)

- `reactions` table + GET/PUT/DELETE  
- Like/Dislike controls + counts on Stories/Discoveries  
- Login CTA when anonymous  

### Phase 5 — Feedback

- Feedback form + `/api/feedback` + email delivery  
- Optional DB log + simple “mark read” for admins  

*(Analytics: later phase, separate decision.)*

---

## 12. Explicitly deferred

- Plausible/Umami or any first-party pageview system  
- JWT / OAuth social login  
- Public “site feedback” comment board  
- Content CMS in MySQL  
- Cross-locale merged comment/reaction threads  
- Reactions on comments; multi-emoji reactions  
- Public “who reacted” lists  

---

## 13. Remaining implementation details

1. Exact **slug** derivation from live story/discovery URLs when mounting comments/reactions.  
2. Preference **key list** frozen against current `localStorage` keys before Phase 2.  
3. Feedback inbox address and whether anonymous submit is allowed (**recommend yes**).  
4. Bootstrap first `admin` / `moderator` via CLI/env runbook.  
5. Visual design for Like/Dislike (icons consistent with Birİnci chrome; no Facebook brand assets).  

---

## 14. One-line summary

**Ship:** accounts → synced preferences → moderated comments → like/dislike on Stories/Discoveries → emailed feedback form.  
**Do not ship yet:** analytics.
