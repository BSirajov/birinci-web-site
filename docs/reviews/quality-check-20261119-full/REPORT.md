# Full-surface quality check — 2026-11-19

**Discoveries deferred — excluded from findings.**

Surfaces checked: home, sitemap, help, about, legal, feedback, categories, compare, SEO XML, asset pins, search vs stories-data, lang switchers, relative links (non-Discoveries).

## Verdict

**0 errors.** Site chrome, help assets, sitemaps, feedback, about switchers, category/search catalogs, and `site.js` pins are consistent across AZ/EN/RU/KY/DE.

| Severity | Count |
|----------|------:|
| error | 0 |
| warn | 1 |
| info | 2 |

## WARN

- **DE Autoren vs Help** — `de/authors/*` is listed in the DE HTML sitemap, but Help does not document the Autoren directory pages (author *filters* on story lists are covered; directory pages are not).

## INFO

- Help “no audio / no read-aloud / no MP3” matches `AUDIO_CONTROLS_ENABLED = false` in `assets/site.js` (Listen chrome is gated/hidden).
- `site.js` pin consistent: `20261119langswitch1`.

## Healthy (sampled / automated)

| Surface | Result |
|---------|--------|
| Home (all langs) | Search, Help, Sitemap, Feedback, About, legal footer, QR, skip-link, lang switcher OK |
| HTML sitemap | Overview/stories/about/legal/languages/search + user-manual; DE includes authors |
| XML sitemap | `de/about` present; Discoveries absent (policy) |
| Help | 17 sections × 5 langs; offline screenshots present; offline URL separately published |
| Feedback | file + privacy + maxlength 5000 × 5 |
| About switchers | All peer locales linked |
| Categories | 12 × 5; search-index stem counts match stories-data |
| Compare | `stories/compare.html` present in all 5 langs |
| Broken relative links | None found outside Discoveries paths |

## Out of scope

- Discoveries (future work)
- EN `prominent-figures` draft (`noindex`) — still intentional unpublished preview
