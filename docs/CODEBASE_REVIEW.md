# Birİnci — Full codebase review & cleanup (2026-08-20)

**Scope:** Static multilingual site (`az` / `en` / `ru` / `ky`) + shared `assets/` + `tools/`.  
**Constraint:** Preserve existing content, visual identity, and responsive behavior.  
**Source checklist:** User “Full codebase review and cleanup” request + prior Full Site QA checklist.

---

## 1. Project structure (vs assumed folders)

The site does **not** use `/css`, `/js`, `/helpers`, `/images`, or `/documents`. Mapping:

| Assumed | Actual |
|---------|--------|
| `/css` | `assets/site.css`, `assets/fonts.css`, `assets/inventions/*.css` |
| `/js` | `assets/site.js`, `assets/inventions/*.js`; `{lang}/assets/{i18n,stories-data,search-index}.js` |
| `/images` | `assets/` (brand/bg), `{lang}/illustrations/`, `assets/inventions/icons/`, `flags/` |
| `/documents` | `source/stories/`, `source/discoveries/`, `docs/` |
| `/helpers` | `tools/` (builders, QA, chrome restore) |

**Live trees:** `{az,en,ru,ky}/` (pages + illustrations + locale JS).  
**Publish mirror:** `deployment/` (keep in sync with `assets/`).  
**API (separate):** `api/` FastAPI auth/account templates — out of static-page chrome scope.

**Recommendation:** Keep this layout. Do not invent parallel `/css`/`/js` trees; they would duplicate the single source of truth.

---

## 2. Code quality — findings & actions

| Issue | Severity | Action |
|-------|----------|--------|
| Orphan `assets/inventions/kt-catalog-toolbar-mobile.js` (0 HTML refs) | High | **Deleted** (+ deployment copy) |
| Duplicate icon folder `assets/inventions/inventions/` (mirrors `icons/6-digital-…`) | High | **Deleted** (+ deployment) |
| Unused brand images: `pearl-knowledge*.webp`, `pearl-with-background.webp`, `bir-inci-logo.webp` | High | **Deleted** |
| Unused `diaspor-body-top-bg.webp` (CSS uses `.png`) | High | **Deleted** |
| Unused About icons `assets/icons/mvv-*` (page uses emoji) | High | **Deleted** |
| Root `index.html` mixed `?v=` (`site.css` 20x / `site.js` 20i) | Medium | **Unified to `20260820y`** |
| Reserved mega-nav CSS stubs (science/arts/… not in HTML) | Low | **Kept** — documented intentional stubs for future menus |
| Dormant TTS / `.audio-player*` stack (`hasAudio` always false) | Low | **Kept** — gated feature; removing would hinder re-enable |
| Obsolete `.tools-bar__images` (without `-toggle`) | — | Already absent; live class is `tools-bar__images-toggle` |
| Ocaq video UI | — | Already stripped from live HTML |

**Not done (would risk look/behavior):** wholesale CSS minify; large KT toolbar CSS trim; removing TTS/audio-player CSS.

---

## 3. Links and navigation

Automated scan of `az/` + `en/` internal `href` file targets: **0 broken**.

| Surface | Result |
|---------|--------|
| Primary nav (Stories, Discoveries, Sitemap, About) | Resolves |
| Footer (logo, birinci.cloud, mailto) | Resolves |
| Lang switcher az↔en↔ru↔ky on index / category / discoveries / about / sitemap | Resolves |
| Breadcrumbs + sample `#` anchors | Resolves |
| RU/KY Discoveries nav → live page | Pass |

**Non-bug note:** EN category breadcrumbs use fragment `#kateqoriyalar` (shared id on EN home). Works; optional future i18n of the fragment id.

---

## 4. UI/UX consistency

Aligned with DAAB / Birİnci tokens after recent passes:

| Area | Status |
|------|--------|
| Story + discovery body font | Source Sans 3 (`--font-ui`) |
| Story + discovery body color | Black `#000` |
| Titles | Fraunces on blue bars; discoveries titles centered |
| Spacing | Discovery entries gapped as cards (`margin-bottom: 16px`) |
| Breadcrumbs | Solid light-blue bar restored |
| Page-jump | Fixed; go-to-bottom above back-to-top |
| Footer | Contact = web + email only |
| Cache-bust | Unified `?v=20260820y` on CSS/JS |

Remaining intentional dual stack: Discoveries KT CSS + `inventions-bridge.css` aliasing tokens to site fonts/spacing (bridge-only strategy).

---

## 5. Bilingual synchronization (AZ / EN)

| Check | Result |
|-------|--------|
| HTML page sets | 16 / 16 identical relative paths |
| Categories | 12 / 12 same filenames |
| Discoveries chrome (CSS/JS link lists) | Identical |
| Nav structure | Same slots; labels translated |
| Footer contact shape | Identical (2 links) |

RU/KY follow the same chrome pattern; content depth differs by locale as authored.

---

## 6. Responsiveness

Automated Chromium matrix (also covered by `tools/full_site_qa.py`):

- Widths **390 / 768 / 1440** on root, EN/AZ home, category, discoveries: **no horizontal overflow**
- Page-jump remains `position: fixed` and visible
- Hamburger **visible ≤1400**, **hidden ≥1401**

**Still manual (hardware):** iOS Safari, Android Chrome, Samsung Internet; portrait + landscape; real touch on lang switcher / filters / sidebar accordion.

---

## 7. Accessibility basics

| Check | Result |
|-------|--------|
| Images missing `alt` (sampled pages) | **0** |
| Body text on white | Black on light surface — strong contrast |
| Focus styles | `:focus-visible` present in `site.css` |
| Landmarks | `header` / `main` / `footer` (+ `nav.page-jump`) on samples |
| Keyboard | Page-jump / primary controls are native `<a>`/`<button>` |

**Optional follow-ups (not applied):** replace About emoji icons with SVG for consistency; audit every inventions figure caption for locale-specific “Illustration:” prefixes beyond KY (already fixed once).

---

## 8. Fixes applied this pass

1. Deleted orphan JS, duplicate invention icon tree, unused brand/About image assets (live + deployment mirrors).  
2. Unified root `index.html` asset cache-bust to **`20260820y`**.  
3. Reconfirmed link health, AZ/EN sync, responsive/overflow, page-jump, alt attributes via smoke scripts.

**Re-run QA:** `python tools/full_site_qa.py`

---

## 9. Recommended next steps (product / optional)

1. Complete the **manual device matrix** in `docs/SITE_QA_CHECKLIST.md`.  
2. Decide whether to permanently remove or re-enable TTS (`show_audio_controls`).  
3. If About should use graphic icons, wire `mvv-*` assets back in (currently removed as unused).  
4. Avoid hand-editing locale HTML chrome long-term — prefer `tools/chrome_restore.py` + rebuild so AZ/EN/RU/KY stay synchronized.

---

## Sign-off

| Role | Date | Notes |
|------|------|-------|
| Agent | 2026-08-20 | Cleanup applied; automated checks green; physical browsers still human-owned |
