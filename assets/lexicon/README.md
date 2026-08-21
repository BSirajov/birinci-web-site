# Azerbaijani lexicon (sticky notes)

Source: four volumes of *Azərbaycan dilinin izahlı lüğəti* (PDF) in this folder.

Build (non-Turkic origins only: ərəb, fars, yunan, latın, …):

```bash
python tools/build_adil_pdf_lexicon.py
```

Outputs:

- `popup-data.js` — loaded by AZ pages for sticky-note tips
- `az-lexicon-ui.js` — hover/tap UI
- `data/meta.json` — build stats
