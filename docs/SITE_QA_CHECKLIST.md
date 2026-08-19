# Birİnci — Full Site QA checklist

Asset version under test: **20260818p**.

## Architecture reminder

1. Prefer editing shared CSS in `assets/site.css` and Discoveries bridge in `assets/inventions/inventions-bridge.css`. `tools/build_website.py` loads inventions-aware bytecode plus `chrome_restore.py` (pins `SITE_ASSET_VERSION=20260818p`, brand-one / page-jump / footer frames, strips leftover Discovery-video markup, hides unfinished top-nav stubs, enables RU/KY Discoveries nav when that page exists).
2. Discoveries content: EN/AZ/RU/KY via `tools/inventions/{lang}-body.html` + rebuild when chrome must regenerate.
3. `python tools/build_deployment.py` after asset changes so `deployment/` matches `assets/`.
4. Hard-refresh browsers after deploy (`?v=20260818p`). `deployment/` is a local publish copy (gitignored).

Shared CSS: `assets/site.css`. Shared JS: `assets/site.js`. Locale strings: `{lang}/assets/i18n.js`.
Discoveries: KT stack under `assets/inventions/` + `inventions-bridge.css`.

### Discovery videos (Ocaq)

- **Off.** `chrome_restore.DISABLE_DISCOVERY_VIDEOS` still strips leftover video slots if a rebuild re-emits them.
- Source MP4s and `ocaq-video.css` / `ocaq-video.js` were removed from the repo. Do not restore them in the live UI without a product decision.

## Breakpoints

| Width | Behavior |
|-------|----------|
| ≤480 | Tools 1-col; toggle/pager groups full width |
| ≤760 | Tools denser stacking; larger touch targets; inventions filters full-width |
| ≤1060 | Category sidebar accordion; inventions TOC unsticks from header stack |
| ≤1180 | Home **and** category tools wrap (search full-width); inventions search full-width |
| ≤1400 | Hamburger nav (accordion) |
| ≥1401 | Desktop inline nav + hover megas |

## Agent pass (2026-08-19, asset `20260818n`)

| Check | Result |
|-------|--------|
| Google Fonts self-hosted under `assets/fonts/` + `assets/fonts.css` | Done |
| Published `data/stories.json` removed; home list uses `stories-data.js` only | Done |
| Category HTML still inlines stories (SEO / per-page weight) | Kept on purpose |
| Dirty tree committed | Done |

## Agent pass (2026-08-19, asset `20260818m`)

Review fixes applied without changing story/invention prose:

| Check | Result |
|-------|--------|
| Home-list / lightbox alt and aria labels use `tUi()` + locale packs | Done |
| KY Discoveries figure prefix `Иллюстрация:` → `Сүрөт:` | Done |
| `data-asset-version` pinned to `SITE_ASSET_VERSION` | Done |
| Root `applyLang()` updates `document.title` and OG/Twitter title | Done |
| Empty footer phone/address rows hidden | Done |
| Dead `data-audio` / `hasAudio` / `az/audio/manifest.json` stripped | Done |
| Ocaq video i18n keys removed from locale packs and site.js blobs | Done |
| Discoveries `data-search` blobs removed (filter uses `textContent`) | Done |
| `robots.txt`, `sitemap.xml`, `404.html`, canonical / OG / hreflang | Done |
| `docs/i18n/translation_manifest.json` regenerated for AZ/EN/RU/KY | Done |

## Agent pass (2026-08-18, asset `20260818i`)

Done without changing story/invention content or the visual system:

| Check | Result |
|-------|--------|
| RU/KY Discoveries nav is a real link (page exists) | Pass |
| Cache-bust `?v=` unified to `20260818i` on live HTML | Pass |
| Dead CSS removed: `.section__head`, `.about-hero__subtitle`, `.lang-switcher__flag-slot`, `[data-tools-play-visible]:disabled` | Pass |
| Title gradient one-off `#2e9fd4` → `--blue-mid` token | Pass |
| Discoveries key-facts headings H4 → H3 (CSS accepts both) | Pass |
| Unused `kt-catalog-toolbar-mobile.js` dropped from Discoveries pages | Pass |
| Dead `.research-hero-related` hide rule removed | Pass |
| Root hero pearl has `alt="Birİnci"` | Pass |
| Ocaq video markup/assets absent from live HTML | Pass |
| Landmarks (`header` / `nav` / `main` / `footer`) present site-wide | Pass |
| Buttons have `type="button"`; images have `alt` | Pass |

### Intentionally not changed (would alter look, hide a feature, or need product sign-off)

- Full TTS / `.audio-player*` stack — gated by `show_audio_controls: false`, kept for re-enable
- Arts / Knowledge / Figures / Support nav CSS — HTML hidden; CSS kept if those menus return
- Large KT catalog-toolbar CSS trim — `.sel-wrap` / `.kt-multi-filter` still live
- CSS/JS minify — skipped to keep source readable and avoid regressions

## Manual physical matrix (you run)

Mark each cell Pass / Fail. Test portrait **and** landscape on phones/tablets.

### Surfaces

1. **Root home** (`index.html`) — AZ navbar, hero, footer
2. **Home** — cards + list, tools, sticky chrome, global search, lang switcher
3. **Category** — tools wrap, sidebar accordion, story TTS / lightbox / hide image-text
4. **Nav** — ≤1400 hamburger; open accordion; Escape / outside click closes
5. **Discoveries** — filters, TOC, search; **RU and KY nav must open the live page**; no video launch controls

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
- [ ] Mobile nav `aria-label` switches open/close in the active locale
- [ ] Tools-bar image/text toggles and pager usable at 390 / 768
- [ ] Category sidebar hamburger works ≤1060; list scrolls with overscroll contained
- [ ] Global search opens (Ctrl+K / toggle); closes cleanly
- [ ] Story listen / lightbox / hide text & image work on a sample category
- [ ] Language switcher opens on touch without being clipped by sticky header
- [ ] Fixed audio bar does not hide primary controls (hidden by default)
- [ ] Discoveries filters usable on touch; search wraps at ≤1180
- [ ] Discoveries articles show icon/media only — no Watch video / Ocaq controls
- [ ] RU and KY primary nav “Discoveries” opens the live page
- [ ] Header shows pearlescent “1” left of pearl; Go-to-bottom sits above Back-to-top
- [ ] Footer panels have decorative frames; AZ left panel uses short heritage copy

### Sign-off

| Role | Date | Notes |
|------|------|-------|
| | | |
