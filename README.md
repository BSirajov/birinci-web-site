# Birİnci

Multilingual static site: **AZ / EN / RU / KY**.  
Live URLs stay `{lang}/…` — do not rename those folders.

## What to edit

| Edit this | Leave this alone |
|-----------|------------------|
| `source/stories/{lang}/*.docx` | `{az,en,ru,ky}/**/*.html` (generated) |
| `source/discoveries/{lang}/*.docx` | `deployment/` (local publish copy) |
| `tools/locales/{lang}.json` | `{lang}/assets/stories-data.js` (generated catalog) |
| `tools/inventions/{lang}-body.html` | `{lang}/assets/site.js` (removed; use shared JS) |
| `tools/chrome_restore.py` | |
| `assets/site.css` | |
| `languages.json` | |

Shared runtime JS is `assets/site.js`. Per-locale strings are `{lang}/assets/i18n.js`.

## Build

```bash
python tools/build_website.py --lang all
python tools/build_deployment.py
```

Serve `deployment/` (or a locale folder) for a local preview. Hard-refresh after an asset-version bump (`tools/chrome_restore.py` → `SITE_ASSET_VERSION`).

Chrome and version policy live in `tools/chrome_restore.py`. The website builder still loads bytecode; do not replace `tools/build_website.py` with a decompiled recover file.

## Layout

```text
source/                 Word sources (not deployed)
tools/locales/          UI strings
tools/inventions/       Discoveries HTML bodies
tools/chrome_restore.py Durable chrome / SEO / i18n
tools/optional/         EPUB and ElevenLabs helpers
docs/                   QA and i18n notes
assets/                 Shared CSS, fonts, icons, site.js
az/ en/ ru/ ky/         Generated locale trees
index.html              Root home
deployment/             Generated publish tree (not in git)
samples/                Local design experiments (not in git)
```

## Optional

```bash
python tools/optional/build_kindle_epub.py --pilot
python tools/optional/elevenlabs_stories_to_mp3.py --lang ky --limit 2
python tools/vendor_google_fonts.py
```
