# Changing fortunes update

Updated on 2 November 2026. Stable story identifier: `pawn-and-the-king`.

Five Word sources, five distinct photographic illustrations, the story manifest, generated story pages, search indexes, and catalogs were updated. The Azerbaijani proverb is preserved verbatim. Existing explanatory morals and source notices remain. Image generation used the built-in tool; exact prompts are in `generation-prompts.json`. No deployment or Git commit was performed.

Titles: AZ — Dəyişən talelər; EN — Changing Fortunes; DE — Wendungen des Schicksals; RU — Превратности судьбы; KY — Тагдырдын бурулуштары.

## Files

For each language (`az`, `en`, `de`, `ru`, `ky`), the files are:

- `<language>/wisdom-stories/pawn-and-the-king.docx`
- `<language>/wisdom-stories/illustrations/pawn-and-the-king.webp`
- `<language>/categories/hikmet-ve-heyat-dersleri.html#pawn-and-the-king`

## Verification

- All five generated illustrations visually inspected: distinct scenes, photographic imagery, no chess imagery, correct titles and lower-panel text, no clipping.
- Dimensions preserved: AZ 1536 × 1159; EN/DE/RU/KY 1536 × 1024. Conversion preserves proportions and complete framing.
- Ten live browser checks passed: every language at desktop/light and mobile/dark settings, checking title, story text, image loading, and updated image cache version.
- Word/catalog/search/HTML synchronization audit: no errors.
- German integration audit passed, including 512 preservation hashes. Only the two authorized German source/image baseline entries were advanced.
- Reviewed build tests: four passed.
- Word visual layout verification remains incomplete: the packaged renderer cannot run because LibreOffice is absent; installed Word automation stalled twice. Only this task's stalled processes were stopped. The documents were edited while preserving existing paragraph/run formatting and their extracted contents match the site, but rendered page layout was not verified.

Original source/image backups are under `tmp/changing-fortunes-backup` and are not deployment artifacts.
