# Story language switching

`story-build-manifest.json` owns published story IDs, category membership and
optional route overrides. `build_website.py` generates `assets/story-routes.js`
from this manifest. Do not edit the generated routes or individual page links.
`chrome_restore.pin_asset_versions` loads the shared route data and navigation
script before `site.js` on every page using shared site chrome.

`assets/story-navigation.js` selects the visible story (or expanded-reading
story), resolves its target from the generated map, and preserves reading and
search context. A retained search cannot hide the story being translated.
Navigation uses the complete destination page to avoid stale locale-specific
DOM state. An unavailable non-poem translation uses the matching category,
with an explicit notice and links to available translations.

## Poems

`poem-translations.json` explicitly lists available language codes for each
poem. It also identifies poems for the Word-source builder. When adding a
translation, add its actual source and manifest entry, and update this list.
The build rejects disagreement between the list and published routes.

Selecting an unavailable poem translation must not navigate, change the active
language or saved preference, or move the reading position. A six-second
message appears in the selected language. Listed translations navigate normally.
Do not infer availability from a title, filename, or the current language.

## Verification

Run `python -m pytest tools/test_story_routes.py tools/test_reviewed_build.py -q`.
With the site served locally, install/use Playwright and run:

```
node tools/test_language_switch_matrix.cjs after
node tools/test_language_switch_scroll.cjs after
node tools/test_language_switch_edges.cjs
node tools/test_poem_language_switch.cjs
```

The matrix covers every published source language version and every other
supported target language. Results are written under
`docs/reviews/language-switch-20261102/`. The matrix supports `QA_BASE`,
`QA_WORKERS`, and `MATRIX_ID`; `MATRIX_RETRY=1` rechecks only failed cases and
writes a separate retry file. `POEM_RETRY=1` rechecks failed poem cases while
retaining initial observations. Tests and reports are authoring material and
must never be deployed as runtime files.
