# Optional tooling

These scripts are **not** part of the live site build.

| Script | Purpose |
|--------|---------|
| `build_kindle_epub.py` | Kindle EPUB from `az/assets/stories-data.js` |
| `elevenlabs_stories_to_mp3.py` | ElevenLabs MP3s from Word sources |

```bash
python tools/optional/build_kindle_epub.py --pilot
python tools/optional/elevenlabs_stories_to_mp3.py --lang ky --limit 2
```

EPUB output defaults to `docs/epub/` (gitignored).
