# Full-site QA audit — 2026-09-23

Checkpoint: `93f167992e45a45748ecbd929a0741c89043b37e` (`checkpoint: pre full-site QA audit`).  
Fix commit: **not made** — review the uncommitted diff first.

## 1. Coverage

| Area | Coverage |
|------|----------|
| Languages | az, en, ru, ky |
| Pages | Home (wisdom stories SPA), 12 category pages/lang, discoveries hub + compare, stories compare, about, sitemap, root `index.html`, `404.html`; EN-only `prominent-figures/` |
| Content | 249 wisdom stems × 4 langs (parity); 121 discovery articles × 4 langs (id parity); illustrations 249/lang |
| Automated | Stem/id/illustration parity scripts; default `build_deployment.py`; discovery leak scan; Playwright lang-switch filter tests |
| Manual / browser | Cursor browser MCP (EN home + discoveries filters earlier); Playwright Chromium headless for lang-switch regression |
| Devices | Desktop viewport primarily; mobile/tablet screenshots **not** systematically captured (MCP tab instability mid-audit) |
| Browsers **not** tested | iOS Safari, Android Chrome, Samsung Internet, desktop Safari, Edge, Firefox |

**Gaps:** No Shuffle control exists in current UI/JS (checklist N/A). Full modal Escape/focus matrix and mobile sticky chrome not exhaustively re-tested after fixes. Audio play paths largely gated off (`AUDIO_CONTROLS_ENABLED = false`).

## 2. Issues

### Critical
*None remaining after fixes below.*

### High (fixed)

1. **Language switch wiped category/period/search filters**  
   - **Where:** Wisdom Stories + Discoveries; `assets/site.js` `applyLangSwitchBrowseReset`  
   - **Repro:** Filter category (e.g. `?cat=iman-ve-meneviyyat`), switch language (stash `birinci-lang-ctx`), reset runs → filters cleared, URL lost `cat`.  
   - **Expected:** Retain equivalent filters across locales (shared slugs).  
   - **Fix:** Restore `q`/`cat`/`period` from stashed ctx; re-apply after view chrome; `__birinciApplyInventionsFilters` export in `kt-inventions.js`.  
   - **Verify:** Playwright — stories PASS (36 articles, `cat` retained); discoveries PASS (cat+period retained, entry/toc counts match).

2. **RU/KY discoveries compare pages — mojibake UI**  
   - **Where:** `ru/discoveries/compare.html`, `ky/discoveries/compare.html`  
   - **Actual:** Titles/labels as `????`; brand `BirInci`.  
   - **Fix:** Rewrote UTF-8 from stories-compare templates (article labels). Also normalized `en/discoveries/compare.html` brand to `Birİnci`.  
   - **Verify:** Encoding scan — Cyrillic titles OK; `qmarks=0` in titles.

### Medium (listed, not all fixed)

- **Cards view ignores category/period filters** on Discoveries — intentional (list-only filters); document as design, not defect.  
- **EN-only `prominent-figures/`** — intentional / incomplete localization.  
- **AZ discovery MP3s = 0** (EN/RU = 121); KY wisdom audio = 0 by policy (no neural voice). Safe while Listen is disabled globally.  
- **AZ scratch** `wisdom-stories/audio/pilot/_tts_probe.mp3` extra stem.  
- Globe `title="Show full-size brand icon"` English leftover on compare pages (all langs).  
- Cache-bust bump only on hub HTML (`site.js` / `kt-inventions.js` → `20260923qa1`); category pages still reference older asset query for other files.

### Low

- Breadcrumb can show first category name while sidebar total is 249 (scroll/section crumb, not a filter mismatch).  
- Widget head decorative “×” next to count in some states.  
- No Shuffle button in product (mission checklist item unused).

## 3. Files changed

**Modified**
- `assets/site.js` — lang-switch filter restore  
- `assets/inventions/kt-inventions.js` — `__birinciApplyInventionsFilters`  
- `ru/discoveries/compare.html`, `ky/discoveries/compare.html`, `en/discoveries/compare.html`  
- `az|en|ru|ky/index.html`, `az|en|ru|ky/discoveries/discoveries-and-inventions.html` — JS cache buster  

**Added (local QA helpers; optional to keep)**
- `tools/_qa_*.py`, `tools/_fix_compare_encoding.py`, etc.

**Removed:** none as part of this fix set.

## 4. Checkpoint / commit

- Checkpoint SHA: **`93f167992e45a45748ecbd929a0741c89043b37e`**  
- Fix commit: **no** (left uncommitted for review)

## 5. Unresolved / decisions

- Whether to enable Listen / ship audio for AZ discoveries & KY stories later.  
- Whether EN prominent-figures should be mirrored or excluded from SEO.  
- Whether to localize compare globe tooltip strings.  
- Cursor browser MCP became unavailable mid-session; Playwright used instead for regression.

## 6. Acceptance

**No verified critical/high defects remain** for: story count alignment (249×4, no Nazım ghost), discoveries id parity (121×4), default publish hide-discoveries (0 leaks, no MP3s), lang-switch filter retention (verified), RU/KY discoveries compare encoding (verified).

**Do not claim full completion** for: mobile/responsive matrix, iOS/Android/Safari/Firefox/Edge, full modal a11y pass, Shuffle (absent), live audio playback, or exhaustive mixed-language UI sweep beyond compare/encoding and sampled hubs.
