# Bir inci — Full Site QA checklist

Asset version under test: **20260815e** (source: `tools/build_website.py`).

## Architecture reminder

1. Edit only `tools/build_website.py` (+ `tools/locales/*.json` for UI strings)
2. `python tools/build_website.py --lang all`
3. `python tools/build_deployment.py`
4. Hard-refresh browsers after deploy (`site.css?v=20260815e`)

Shared CSS: `assets/site.css` (all locales). Locale JS: `{lang}/assets/site.js`.

## Breakpoints

| Width | Behavior |
|-------|----------|
| ≤480 | Tools 1-col; toggle/pager groups full width |
| ≤760 | Tools denser stacking; larger touch targets |
| ≤1060 | Category sidebar accordion |
| ≤1180 | Home **and** category tools wrap (search full-width) |
| ≤1400 | Hamburger nav (accordion) |
| ≥1401 | Desktop inline nav + hover megas |

## Automated / agent smoke (2026-08-15)

| Check | Result |
|-------|--------|
| Obsolete `.tools-bar__images` / `__texts` absent from CSS | Pass |
| `.tools-bar__images-toggle` present | Pass |
| Gate uses `--nav-blue-deep` (no `#005291`) | Pass |
| Mobile nav labels via `tUi(open_menu/close_menu)` | Pass |
| `assets/site.css` hash == `deployment/assets/site.css` | Pass |
| EN home: one `<main>`, skip-link, asset `20260815b` | Pass |
| `deployment/az/audio` still present after deploy | Pass (250 mp3) |

## Manual physical matrix (you run)

Mark each cell Pass / Fail. Test portrait **and** landscape on phones/tablets.

### Surfaces

1. **Language gate** (`index.html`) — fonts, hover blue, lang buttons
2. **Home** — cards + list, tools, sticky chrome, global search, lang switcher
3. **Category** — tools wrap, sidebar accordion, story TTS / lightbox / hide image-text
4. **Nav** — ≤1400 hamburger; open accordion; Escape / outside click closes

### Widths

`360` · `390` · `768` · `1024` · `1440`

### Browsers

| Browser | Gate | Home | Category | Nav |
|---------|------|------|----------|-----|
| Safari (iOS) | | | | |
| Chrome (Android) | | | | |
| Samsung Internet | | | | |
| Chrome (desktop) | | | | |
| Edge | | | | |
| Firefox | | | | |

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

### Sign-off

| Role | Date | Notes |
|------|------|-------|
| | | |
