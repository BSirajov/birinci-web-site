# Azerbaijani lexicon (sticky notes)

Runtime files in this folder (shipped):

- `popup-data.js` — sticky-note data for AZ pages
- `az-lexicon-ui.js` — hover/tap UI
- `data/meta.json` — build stats

**Source PDFs** (*Azərbaycan dilinin izahlı lüğəti*, 4 volumes) stay local only:
they are gitignored and excluded from `deployment/`. Keep them in this folder
on your machine to rebuild:

```bash
python tools/build_adil_pdf_lexicon.py
```
