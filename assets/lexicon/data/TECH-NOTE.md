# ADİL PDF lexicon (non-Turkic)

Built from the four *Azərbaycan dilinin izahlı lüğəti* PDF volumes.
PDF text uses a custom Latin-1 codepoint remapping; see `DECODE` in `tools/build_adil_pdf_lexicon.py`.
Only headwords with non-Turkic origin brackets are kept for sticky notes.
Unmarked headwords default to `is.` (isim), matching ADİL practice.

- Entries: 10287
- Forms: 10287
- Output: `assets/lexicon/popup-data.js`
