# Full-site QA audit — 2026-10-04

Checkpoint: `90722d12f5707bbeb77bf6096d22c520891bcbd0` (`checkpoint: pre full-site QA audit`).  
Fix commit: **not made** — review the uncommitted diff first. Do not push.

## 1. Coverage

| Area | Coverage |
|------|----------|
| Languages | az, en, ru, ky |
| Routes (locale HTML, excluding discovery article JSON/docx) | Home, 12 category pages, Discoveries hub + compare, stories compare (`{lang}/stories/compare.html`), about, sitemap, 5 legal/feedback pages; EN-only `prominent-figures/` |
| Content | Wisdom stems: AZ **261**, EN/RU/KY **256**. Discoveries hub: **121** entries × 4 langs. Illustrations: files exist for catalog `image` paths (URL-decoded). |
| Automated | `pytest` lang-switch / build-info / audio-player / publish-policy (12 passed). Static inventory. Playwright Chromium against `http://127.0.0.1:8775/` |
| Manual / browser | Cursor browser tab: EN Feedback (narrow embedded viewport). Playwright for filters, images, compare heights, legal lang hrefs, feedback submit |
| Devices | Desktop 1400×900 (Playwright). MCP tab was a narrow width, not a systematic mobile pass |
| Browsers **not** tested | iOS Safari, Android Chrome, Samsung Internet, desktop Safari, Firefox, Edge |
| Publish tree | Default `build_deployment.py` **not** re-run this pass |

**Audio:** `AUDIO_CONTROLS_ENABLED = false`. Listen buttons are in the DOM but `display: none`, `disabled`, `aria-disabled`. Local listen is hidden, not a working player.

**Server note:** Port 8765 was another site (WAAS). Birİnci was served on **8775**. `tools/serve_site.py` now refuses to treat a foreign `/index.html` as this project.

## 2. Issues

### Critical
*None remaining after the Discoveries view-URL fix.*

### High (fixed)

1. **Discoveries `?view=list` was ignored**  
   Init always preferred `localStorage` and `writeInventionsUrlState` rewrote `view=list` to `view=cards` before list mode applied. Lang-switch hrefs could not restore list view.  
   **Fix:** Apply `view` from the query string immediately; persist `view` in the URL; prefer URL over localStorage; lang-switcher also reads the live list/cards body class.  
   **Verify:** Playwright — `?view=list` → 121 list entries; `?view=list&cat=1` → 20 entries, all `data-category=1`; AZ/EN/RU/KY hrefs keep `view=list&cat=1`.

2. **Local preview could bind to the wrong app on 8765**  
   Health check accepted any 200 on `/index.html`.  
   **Fix:** Require Birİnci markers; do not kill a foreign listener.

### High (content gap — not rewritten)

3. **Five Etibar stories exist only in Azerbaijani**  
   Stems: `cherishing-flowers-in-spring`, `changing-times-enduring-friendship`, `quarantine-days-hopeful-hearts`, `from-reflection-to-hope`, `hopeful-journey-through-life`.  
   Author filter: AZ Etibar **12**, EN/RU/KY **7**. RU/KY illustration folders already contain images for some of these stems. Compare for an AZ-only stem showed an AZ column only. Translations were **not** invented this pass.

### Medium

- Legal About megamenu uses `role="menu"` without `role="menuitem"` (same chrome as the rest of the site).
- Feedback honeypot field can still appear in some accessibility trees; it is off-screen. Added `hidden` on the wrapper (safe).
- Compare globe `title="Show full-size brand icon"` remains English on all compare locales.
- Discoveries **cards** view still does not apply category/period filters (list-only) — existing design.
- EN-only `prominent-figures/`.
- Legal imprint still documents missing Firmenbuch / address / phone by policy (placeholders in the footer).
- Default Discoveries URL may become `?view=cards` after first write (explicit, not a blank URL).

### Low

- Playwright image probe on the home list matched the language globe if the story article was not in the virtualized DOM; category pages are the reliable image check.
- `role="doc-subtitle"` on legal heroes.

## 3. What was verified (pass)

- Legal/feedback language switch hrefs stay on the same file (`feedback.html`, privacy, terms, cookies, legal-notice). Unit tests for `page-home` + `data-lang-page` still pass.
- Footer: `© Birİnci - All rights reserved | Build 20261003-1447` (English). Legal footer links present.
- Author filters return only the matching corpus (EN Etibar 7 / Bakhtiyar 6; AZ Etibar 12). Lang-switch keeps `author=`.
- Wisdom category filter `cat=iman-ve-meneviyyat` kept across language hrefs.
- Etibar/Bakhtiyar illustrations load on category pages (AZ/EN/RU/KY nails story: naturalWidth 1536; RU/KY still use author-folder paths, including `Illustrations` vs `illustrations` and the apostrophe filename).
- Stories compare (glass-of-milk, four langs): column heights **1744px** all equal (`min-height` set).
- Discoveries compare (`agriculture-and-domestication`): four columns **3606px** equal; no `????` mojibake.
- Local feedback POST succeeds (preview outbox); live Hostinger `mail()` not tested.
- Discoveries locale trees left intact; not published in this pass.

## 4. Files changed (uncommitted)

- `assets/inventions/kt-inventions.js` — URL `view` apply/persist  
- `assets/site.js` — inventions lang-switch view from body class  
- `az|en|ru|ky/discoveries/discoveries-and-inventions.html` — cache-bust `20261004qa1`  
- `az|en|ru|ky/feedback.html`, `tools/legal_pages.py` — honeypot `hidden`  
- `tools/serve_site.py` — Birİnci health check / foreign port  

QA helpers under `tools/_tmp_*` are gitignored.

## 5. Checkpoint / commit

- Checkpoint SHA: **`90722d12f5707bbeb77bf6096d22c520891bcbd0`**  
- Fix commit: **no** (left uncommitted)

## 6. Unresolved

- Localize the five AZ-only Etibar stories (EN/RU/KY text) if product wants stem parity at 261.  
- Optional: localize compare globe tooltip.  
- Confirm Linux/Hostinger case-sensitive `Illustrations/` vs `illustrations/` (Windows QA cannot fail that).  
- Live feedback email via PHP.  
- Default production build (`hide_discoveries`) not re-run here.

## 7. Acceptance

Critical functional bugs found in this pass were fixed (Discoveries list URL + preview-server identity). Remaining high item is **intentional/incomplete AZ-only stories**, not a broken filter. Legal pages were not visually redesigned. Honest gap: no iOS/Android/Safari/Firefox/Edge, no Hostinger upload, no full mobile matrix.
