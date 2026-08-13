# Bir inci — Full Site QA checklist

Asset version under test: **20260820b** (source: `tools/build_website.py`).

## Architecture reminder

1. Edit only `tools/build_website.py`
2. `python tools/build_website.py`
3. `python tools/build_deployment.py`
4. Hard-refresh browsers after deploy

## Breakpoints

| Width | Behavior |
|-------|----------|
| ≤480 | Tools 1-col grid |
| ≤760 | Tools 2-col / denser stacking; larger touch targets |
| ≤1060 | Layout density tweaks |
| ≤1180 | Home **and** category tools wrap (search full-width) |
| ≤1400 | Hamburger nav (accordion: top-level first) |

## Desktop smoke (agent / Cursor browser) — 2026-08-13

| Check | 1440 | 1280 | 1100/900 | 760 | 390 |
|-------|------|------|----------|-----|-----|
| Home: no horizontal overflow | Pass | Pass* | Pass | Pass* | Pass* |
| Category: no horizontal overflow | Pass | Pass | Pass | Pass | Pass |
| Category tools wrap / not clipped | n/a (fit) | fit | wrap, no clip | wrap | wrap |
| Tam focusable + pressed when all | — | — | Pass (`disabled=false`, `aria-pressed=true`) | — | — |
| Batch hint when needsSize | — | — | Pass (“Əvvəl say daxil edin”) | — | Pass |
| Search title not outline `<h2>` | Pass (`<p>`) | | | | |
| Nav `role=menu` removed | Pass (0) | | | | |
| Home `#kateqoriyalar` labelled | Pass | | | | |

\*Home spot-checked at 900; same CSS path as category wrap rules.

Home and category **Göstər** both use empty → all / needsSize / Tam pressed semantics (aligned in 20260820b).

---

## Manual physical matrix (you run)

Mark each cell Pass / Fail. Test portrait **and** landscape on phones/tablets.

### Surfaces

1. **Home** — cards (Təsnifatlı) + list (Ardıcıl), tools, sticky chrome, global search
2. **Category** — tools wrap, sidebar accordion, story TTS / lightbox / hide image-text
3. **Nav** — ≤1400 hamburger; open accordion top-level first, then submenu

### Widths

`390` · `768` · `1024` · `1440`

### Browsers

| Browser | Home | Category | Nav accordion |
|---------|------|----------|---------------|
| Safari (iOS) | | | |
| Chrome (Android) | | | |
| Samsung Internet | | | |
| Chrome (desktop) | | | |
| Edge | | | |
| Firefox | | | |

### Acceptance prompts

- [ ] No horizontal page overflow at any width above
- [ ] Category tools usable between ~761–1180 (wrap, not clipped)
- [ ] Hamburger shows ≤1400; desktop mega nav >1400
- [ ] Mobile nav: top-level items visible before expanding panels
- [ ] Sticky header + breadcrumbs do not jump / overlap tools oddly
- [ ] Home + category: empty count + Tam shows all; Prev/Next/Təsadüfi need a number (hint visible)
- [ ] Tam remains keyboard-focusable while pressed (all shown)
- [ ] Global search opens (Ctrl+K / toggle); page outline starts at content `<h1>`
- [ ] Story listen / lightbox / hide text & image work on a sample category

### Sign-off

| Role | Date | Notes |
|------|------|-------|
| | | |
