# Birİnci — codebase review (updated 2026-08-15)

## Scope note

Multilingual static story site: **AZ / EN / RU / KY**. Shared chrome CSS lives once under `/assets/`; each locale tree holds pages, stories data, illustrations, audio, and locale JS.

### Actual layout

| Concern | Path |
|---------|------|
| Source of truth | `tools/build_website.py` (embedded CSS / JS / HTML builders) |
| Shared CSS / brand | `assets/site.css`, favicons, pearl, bg |
| Locale trees | `{az,en,ru,ky}/` — generated pages, illustrations, `{lang}/assets/i18n.js` + stories/search data |
| Shared JS / CSS | `assets/site.js`, `assets/site.css`, `assets/fonts.css` |
| Story sources | `source/stories/{lang}/*.docx` (build input; not deployed) |
| Locales UI strings | `tools/locales/{lang}.json` |
| Publish mirror | `deployment/` via `tools/build_deployment.py` (gitignored) |

Prefer chrome fixes via `tools/chrome_restore.py` (and locales / inventions bodies). The builder may still emit per-locale `site.js`; the overlay folds that into shared `assets/site.js` plus `{lang}/assets/i18n.js`.

---

## Findings and fixes

### Applied 2026-08-15 (Full Site QA pass)

| Issue | Severity | Fix |
|-------|----------|-----|
| Dead `.tools-bar__images` / `__texts` CSS (HTML uses `*-toggle`) | Medium | Removed; ≤480 rules retargeted to toggle groups |
| Language gate hover `#005291` ≠ `--nav-blue-deep` | Low | Gate tokens + hover `#005a9a`; Fraunces / Source Sans 3 |
| Duplicated menu-icon chrome rules | Low | Shared selector group; default icon colors use CSS vars |
| Mobile nav open/close aria-labels hardcoded AZ | Medium | `tUi("open_menu"\|"close_menu")` + `close_menu` in all locale JSON |
| Mobile sidebar open body missing overscroll contain | Low | Added `overscroll-behavior: contain` + touch scrolling |
| `body.nav-open` iOS scroll bleed | Low | `overscroll-behavior: none` |
| Stale CODEBASE_REVIEW (AZ-only) | Docs | This file refreshed |

### Earlier (2026-08-12)

| Issue | Severity | Fix |
|-------|----------|-----|
| Nested / invalid landmarks | High | Single `<main id="main">` |
| Focus rings / story body typography | Medium | Restored `:focus-visible`; `--font-body` + line-height 1.55 |
| Touch targets | Low | `touch-action: manipulation` |

### Confirmed healthy

- Shared CSS hash matches `assets/` ↔ `deployment/assets/`
- Skip link → `#main`; one `<main>` on home/category shells
- Hamburger ≤1400px; tools wrap ≤1180; category sidebar accordion ≤1060
- Illustrations emit `loading="lazy"`, 1536×1024, non-empty alt
- Asset version: **20260818p**

### Intentional stubs (not bugs)

- Top nav stubs hidden until content exists: Knowledge (`Biliklər`), Arts (`İncəsənət`), Notable figures (`Tanınmış şəxsiyyətlər`), Support (`Bizi dəstəkləyin`) — toggled in `chrome_restore.HIDE_TOP_NAV`
- Elm / İncəsənət / some TOP_NAV items: `aria-disabled` + coming soon (builder still emits them; overlay strips the four above)
- Discovery Ocaq videos disabled site-wide (`DISABLE_DISCOVERY_VIDEOS`)
- Dual hamburgers (primary nav vs story sidebar) by design
- `--sticky-stack-h: 0rem` reserved; `syncStickyChrome()` sets header/breadcrumb only

---

## Responsiveness

Breakpoints: **480 / 760 / 1060 / 1180 (tools wrap) / 1400 (hamburger)**.

See [`docs/SITE_QA_CHECKLIST.md`](SITE_QA_CHECKLIST.md) for the manual device/browser matrix.

---

## Ops workflow

```bash
python tools/build_website.py --lang all
python tools/build_deployment.py
```

Serve from `deployment/` (or a locale folder for local preview). Hard-refresh after asset version bumps.
