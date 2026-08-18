# Birİnci — Full Site QA checklist

Asset version under test: **20260818d**.

## Architecture reminder

1. Prefer editing shared CSS in `assets/site.css` and Discoveries bridge in `assets/inventions/inventions-bridge.css` for chrome/token work. `tools/build_website.py` loads inventions-aware bytecode plus a source overlay (`chrome_restore.py`) that pins `ASSET_VERSION=20260818d`, restores brand-one / page-jump / footer frames, strips Discovery videos, hides unfinished top-nav stubs (Knowledge / Arts / Figures / Support), and patches short AZ footer + discoveries hero copy. Do not replace it with `tools/_pyc_recover_out/build_website.py` (broken decompile).
2. Discoveries content: EN/AZ/RU/KY via `tools/inventions/{lang}-body.html` + rebuild when chrome must regenerate. RU/KY bodies were extracted from live Word-injected pages; prefer inject scripts for article text updates, then re-extract body if needed.
3. `python tools/build_deployment.py` after asset changes so `deployment/` matches `assets/`.
4. Hard-refresh browsers after deploy (`?v=20260818d`).

Shared CSS: `assets/site.css` (all locales). Locale JS: `{lang}/assets/site.js`.
Discoveries: KT stack under `assets/inventions/` + `inventions-bridge.css` (aliases fonts/spacing/sticky onto Birİnci tokens).

### Discovery videos (Ocaq)
- **Off by policy:** `chrome_restore.DISABLE_DISCOVERY_VIDEOS` strips video slots and Ocaq CSS/JS from Discoveries pages on every build.
- MP4s may still exist under `assets/inventions/videos/` for later use; they must not appear in the live UI until that flag is turned off.

## Breakpoints

| Width | Behavior |
|-------|----------|
| ≤480 | Tools 1-col; toggle/pager groups full width |
| ≤760 | Tools denser stacking; larger touch targets; inventions filters full-width |
| ≤1060 | Category sidebar accordion; inventions TOC unsticks from header stack |
| ≤1180 | Home **and** category tools wrap (search full-width); inventions search full-width |
| ≤1400 | Hamburger nav (accordion) |
| ≥1401 | Desktop inline nav + hover megas |

## Automated / agent smoke (2026-08-18)

| Check | Result |
|-------|--------|
| Obsolete `.tools-bar__images` / `__texts` absent from CSS | Pass |
| `.tools-bar__images-toggle` present | Pass |
| Gate uses `--nav-blue-deep` (no `#005291`) | Pass |
| Discoveries bridge remaps `--font-sans` / `--space-*` / `--max` on `.page-inventions` | Pass |
| Asset `?v=` unified to `20260818d` on az/en/ru/ky HTML | Pass |
| Top nav hides Knowledge / Arts / Figures / Support stubs | Pass |
| `assets/site.css` hash == `deployment/assets/site.css` | Pass |
| Discoveries pages have no `ocaq-video-slot` / Ocaq head assets | Pass |
| Brand-one mark, page-jump, footer frames present in `site.css` | Pass |

## Manual physical matrix (you run)

Mark each cell Pass / Fail. Test portrait **and** landscape on phones/tablets.

### Surfaces

1. **Root home** (`index.html`) — AZ navbar, hero, footer (not the old language-picker gate)
2. **Home** — cards + list, tools, sticky chrome, global search, lang switcher
3. **Category** — tools wrap, sidebar accordion, story TTS / lightbox / hide image-text
4. **Nav** — ≤1400 hamburger; open accordion; Escape / outside click closes
5. **Discoveries** — filters, TOC, search; no video launch controls

### Widths

`360` · `390` · `768` · `1024` · `1440`

### Browsers

| Browser | Gate | Home | Category | Nav | Discoveries |
|---------|------|------|----------|-----|-------------|
| Safari (iOS) | | | | | |
| Chrome (Android) | | | | | |
| Samsung Internet | | | | | |
| Chrome (desktop) | | | | | |
| Edge | | | | | |
| Firefox | | | | | |

### Acceptance prompts

- [ ] No horizontal page overflow at any width above
- [ ] No content clipped under sticky header/breadcrumbs
- [ ] Hamburger shows ≤1400; desktop mega nav >1400
- [ ] Mobile nav `aria-label` switches open/close in the active locale (not stuck on Azerbaijani)
- [ ] Tools-bar image/text toggles and pager usable at 390 / 768
- [ ] Category sidebar hamburger works ≤1060; list scrolls with overscroll contained
- [ ] Global search opens (Ctrl+K / toggle); closes cleanly
- [ ] Story listen / lightbox / hide text & image work on a sample category
- [ ] Language switcher opens on touch without being clipped by sticky header
- [ ] Fixed audio bar does not hide primary controls
- [ ] Discoveries filters usable on touch; search wraps at ≤1180
- [ ] Discoveries articles show icon/media only — no Watch video / Ocaq controls
- [ ] Header shows pearlescent “1” left of pearl; Go-to-bottom sits above Back-to-top
- [ ] Footer panels have decorative frames; AZ left panel uses short heritage copy

### Sign-off

| Role | Date | Notes |
|------|------|-------|
| | | |
