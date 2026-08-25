# Birİnci

Multilingual static site: **AZ / EN / RU / KY**.  
Live URLs stay `{lang}/…` — do not rename those folders.

## What to edit

| Edit this | Leave this alone |
|-----------|------------------|
| `{lang}/wisdom-stories/*.docx` | `{az,en,ru,ky}/**/*.html` (generated) |
| `{lang}/discovery-articles/*.docx` | `deployment/` (local publish copy) |
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

**Local TTS proxy (AZ / KY story listen):** `python tools/tts_proxy_server.py` → `http://127.0.0.1:8767/api/az-tts` and `/api/ky-tts`. Kyrgyz uses Kazakh neural voice (`kk-KZ-DauletNeural`) because Edge TTS has no `ky-KG` voice.


Serve `deployment/` (or a locale folder) for a local preview. Hard-refresh after an asset-version bump (`tools/chrome_restore.py` → `SITE_ASSET_VERSION`).

Chrome and version policy live in `tools/chrome_restore.py`. The website builder still loads bytecode; do not replace `tools/build_website.py` with a decompiled recover file.

## Layout

```text
{lang}/wisdom-stories/     Story Word sources + audio + illustrations
{lang}/discovery-articles/ Discovery Word sources + audio
tools/locales/             UI strings
tools/inventions/          Discoveries HTML bodies
tools/chrome_restore.py    Durable chrome / SEO / i18n
tools/optional/            EPUB and ElevenLabs helpers
docs/                      QA and i18n notes
assets/                    Shared CSS, fonts, icons, site.js
az/ en/ ru/ ky/            Locale trees (HTML routes stay {lang}/…)
index.html                 Root home
{lang}/sitemap.html        Human sitemap (also in the top nav)
deployment/                Generated publish tree (not in git)
samples/                   Local design experiments (not in git)
```

## Optional

```bash
python tools/optional/build_kindle_epub.py --pilot
python tools/optional/elevenlabs_stories_to_mp3.py --lang ky --limit 2
python tools/vendor_google_fonts.py
```
