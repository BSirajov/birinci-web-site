# Kindle / EPUB builds

Generated with `tools/build_kindle_epub.py` from `az/data/stories.json` + `az/illustrations/*.webp` (converted to JPEG).

## Builds

| File | Contents | Size |
|------|----------|------|
| `bir-inci-all-stories.epub` | **All 12 categories · 250 stories** with illustrations | ~95 MB |
| `bir-inci-pilot-edalet-ve-cemiyyet.epub` | Pilot: **Ədalət və cəmiyyət** — 10 stories | ~4.3 MB |

Open in [Kindle Previewer](https://www.amazon.com/Kindle-Previewer/b?node=21381691011) or Apple Books / Calibre.

**Note:** KDP accepts EPUB; large illustrated books may need Kindle Previewer conversion checks. If upload size is an issue, publish as multi-volume by category.

## Commands

```bash
python tools/build_kindle_epub.py --pilot
python tools/build_kindle_epub.py --category soz-sukut-ve-unsiyyet
python tools/build_kindle_epub.py --all
```
