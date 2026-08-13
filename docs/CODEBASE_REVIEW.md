# Bir inci — codebase review (2026-08-12)

## Scope note

This repo is an **Azerbaijani-only** static story site. It does **not** use the classic `/css`, `/js`, `/helpers`, `/images`, `/documents` layout, and there is **no English (`en/`) locale** or language switcher. Review items that assume bilingual DAAB multi-folder apps are noted as N/A below.

### Actual layout

| Expectation | Actual |
|-------------|--------|
| `/css` | `az/assets/site.css` (generated from `tools/build_website.py`) |
| `/js` | `az/assets/site.js`, `search-index.js`, `stories-data.js` |
| `/images` | `az/illustrations/*.webp` + brand files in `az/assets/` |
| `/documents` | `az/stories/*.docx` (build input only; not deployed) |
| `/helpers` | Absent (stale `.gitignore` pattern removed) |
| `en/` | Does not exist |

**Source of truth:** `tools/build_website.py` → writes `az/`. Deploy with `tools/build_deployment.py` → `deployment/`.

---

## Findings and fixes

### Applied in this pass

| Issue | Severity | Fix |
|-------|----------|-----|
| Nested / invalid landmarks: page shell used `<div id="main">` while home/category wrapped content in `<main>` | High (a11y) | Single `<main id="main">` in shell; page bodies use `<div>` wrappers |
| Back-to-top `title` / `aria-label` in English | Medium | Localized to Azerbaijani |
| Placeholder nav links (`href="#"`) still focusable | Medium | Added `tabindex="-1"` on `aria-disabled` items |
| Unused JS binding `primaryNav` | Low | Removed |
| Story text used UI font + very tight `line-height: 1.15` | Medium (readability) | Switched to `--font-body` (Source Serif 4), `line-height: 1.55`, ~16px size |
| Missing global `:focus-visible` after edit risk | Medium | Restored + kept gold focus ring |
| Touch targets / 300ms delay | Low | `touch-action: manipulation` on interactive controls |
| `tools/story-mapping.json` root path typo (`birinci-web-stite`) | Low | Corrected to `birinci-web-site` |
| `.gitignore` referenced missing `helpers/` | Low | Cleaned; ignore `_verify_list_view/` |
| `deployment/` drifted behind `az/` (asset version / HTML / CSS / JS) | High (ops) | Rebuild site + refresh deployment |

### Confirmed healthy

- All 12 category pages + home present; internal category hrefs resolve
- Breadcrumbs: Ana səhifə → Ədəbiyyat… → İbrətamiz hekayələr → category (`#kateqoriyalar` exists on home)
- Skip link → `#main`
- Favicons / `pearl.webp` / illustrations / audio: **250/250/250** stems aligned
- Search index + stories-data generated with build
- Control panels have responsive breakpoints (≤1180 wrap for home **and** category, ≤760 2-col grid, ≤480 1-col)
- Nav mega menus use hover/click with mobile hamburger at **≤1400px** (not 1180)

### Intentional stubs (not bugs)

- **Elm**, **İncəsənət**, **TOP_NAV** items (Tanınmış şəxsiyyətlər, Tarixi kəşf…, Ümumi biliklər, Haqqımızda, Bizi dəstəkləyin): `aria-disabled` + “Tezliklə”
- English stems are **filenames only**, not an English UI

### Not changed (document only)

| Issue | Notes / recommendation |
|-------|------------------------|
| No English site | Out of scope unless product asks for `en/` parallel build |
| `az/assets/bir-inci-logo.png` unused in HTML | Keep for branding/OG later, or wire into hero/footer when needed |
| `_verify_list_view/*.png` | Local QA screenshots; gitignored |
| Emoji in sidebar widget heads (`📖`) | Decorative; already `aria-hidden` on wrap — acceptable |
| Dense top nav may hit hamburger earlier after new items | By design; responsive nav collapses ≤1400px |
| Category tools “Görünüş” groups image/text hide buttons | Matches home pattern; OK |

---

## Bilingual synchronization

**N/A — AZ only.** No language-switching links to audit. If English is added later: mirror `az/` → `en/`, shared CSS tokens, parallel category slugs, and a header locale switch that preserves path mapping.

---

## Responsiveness checklist

Breakpoints in use: **480 / 760 / 1060 / 1180 (tools wrap) / 1400 (hamburger)**.

| Surface | Desktop (>1400) | Mid (≤1400 / ≤1180) | Phone (≤760 / ≤480) |
|---------|-----------------|---------------------|---------------------|
| Primary nav | Inline + dropdowns | Hamburger + accordion | Hamburger + accordion |
| Home / category tools bar | Single row, labels above | ≤1180: search full-width, controls wrap (category uses `.tools-bar--dense`) | 2-col then 1-col grid; ~44px touch targets |
| Story actions in text frame | Float + wrap | Same | Same; buttons remain usable when text hidden |
| Sticky header / sticky-stack | OK | OK | OK (category stack sticky) |
| Global search dialog | OK | OK | Full-panel |

See [`docs/SITE_QA_CHECKLIST.md`](SITE_QA_CHECKLIST.md) for the full manual device/browser matrix.

---

## Accessibility checklist

| Item | Status |
|------|--------|
| Skip link | OK |
| One `<main>` | Fixed |
| Focus rings | Global + component `:focus-visible` |
| Image alts on story figures | Present (`… illüstrasiyası`) |
| Decorative brand images | Empty `alt` next to visible text — OK |
| Keyboard: Escape closes nav/search | OK |
| Disabled upcoming nav items | Not in tab order |
| Contrast | Blue/gold on white generally strong; gold listen button uses white text — OK |
| Min readable story type | Improved |

---

## Recommended ops workflow

```bash
python tools/build_website.py
python tools/build_deployment.py
```

Serve from `deployment/` (or `az/` for local preview). Hard-refresh after asset version bumps.
