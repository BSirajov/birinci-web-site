# Multilingual rollout (AZ / EN / RU / KY)

## Locked decisions
- Full UI + all 250 stories in each target locale (EN, RU, KY)
- TTS when each story is translated (male neural voices where available)
- **Separate illustrations per locale** (AZ text in art → regenerate per language)

## Layout
| Path | Role |
|------|------|
| `languages.json` | Enabled languages, names, flags, TTS voices |
| `flags/{code}.svg` | Mini flags for the language dropdown |
| `tools/locales/{code}.json` | UI chrome + category titles |
| `{code}/` | Generated locale trees (`i18n.js`, stories data) |
| `{code}/wisdom-stories/` | Story Word sources, audio, and illustrations |
| `{code}/discovery-articles/` | Discovery Word sources and audio |
| `assets/site.js` | Shared site runtime |
| `docs/i18n/translation_manifest.json` | Progress: text/audio/illustration |
| `tools/i18n_config.py` | Loads `languages.json` for builds |

## Adding or disabling a language
Edit `languages.json` only — the navbar dropdown and the root chooser read this file at runtime.

- Set `"enabled": false` to hide a language without deleting it
- Set `"implemented": false` to show the language as a disabled menu item until the locale is ready
- Add a new object to `languages` (`code`, `name`, `flag`, `nav_prefixes`, `tts_voice`)
- Add `flags/{code}.svg` and `tools/locales/{code}.json`, then build that locale when content is ready

## Commands
```bash
# Build all locales
python tools/build_website.py --lang all
python tools/build_deployment.py

# Export AZ sources for translation
python tools/i18n_story_pipeline.py export

# Import a translated package
python tools/i18n_story_pipeline.py import --lang en path/to/batch.json
python tools/i18n_story_pipeline.py import --lang ru path/to/batch.json
python tools/i18n_story_pipeline.py import --lang ky path/to/batch.json

# Audio for a locale
python tools/generate_story_audio.py --lang en --all --force
```

Kyrgyz (`ky`) has no Edge/Azure neural voice as of 2026-08. `generate_story_audio.py --lang ky` exits until a voice is configured in `tools/i18n_config.py`.

## Illustration regen
Place localized art at:
- `en/wisdom-stories/illustrations/{stem}.webp`
- `ru/wisdom-stories/illustrations/{stem}.webp`
- `ky/wisdom-stories/illustrations/{stem}.webp`

Do **not** copy AZ WebPs. Mark `illustration_<lang>` in the manifest when done.

## Status (2026-08-18)

| Phase | Status |
|-------|--------|
| A — Shell / builder / switcher | **Done** (AZ, EN, RU, KY) |
| B — Translate 250×N | AZ/EN/RU/KY **250 / 250** in `stories-data.js` |
| B2 — Illustrations | Locale folders ready; do not copy AZ art into other langs blindly |
| C — Audio | AZ/EN/RU present for narrated stems; KY follows content readiness |
| D — Deploy | `python tools/build_deployment.py` writes a local `deployment/` copy (not in git) |
| E — Discoveries | AZ/EN/RU/KY live (121 articles); videos stripped from UI |

Open `index.html` → language chooser, or go directly to `/en/`, `/ru/`, or `/ky/`.
