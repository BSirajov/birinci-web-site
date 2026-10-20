# Wisdom Stories note styling — 20 October 2026

Implemented locally; not deployed.

## Coverage and changes

The shared styling affects **328 Wisdom Stories routes**:

- 318 static story-bearing pages: AZ 12, EN 12, RU 12, KY 12, DE 270.
- Five localized home pages.
- Five multilingual comparison entry pages.

The static pages contain 1,555 story displays, 1,550 moral boxes and 1,557
source boxes. The five Azerbaijani poems intentionally have no moral; the
English Mercedes story has three source paragraphs.

There are **369 modified HTML files**. Four have semantic class repairs listed
below; the remaining changes are stylesheet/script cache-version updates,
including 41 routes outside the Wisdom Stories scope. No story text, title,
paragraph order, Word source, catalog or unrelated page layout was changed.

`assets/story-notes.css` now owns the existing home story source-box appearance
and the moral-box rules reused by the multilingual window. Both `site.css` and
`story-compare.css` import it. The source class is `story__source`; the moral
class is `story__moral`. Duplicate source styling was removed from the reading
overlay. A scoped dark color scheme supplies readable note colors without
changing the rest of the site's theme.

The moral-to-source distance is **1.5rem**. In the multilingual flex layout,
the source margin subtracts the existing row gap so the total remains 1.5rem.
Spacing before the multilingual moral remains unchanged. Long source URLs can
wrap inside their boxes.

The chrome restore pass repairs missing note classes and removes legacy
duplicate note CSS after generation. The German builder also recognizes the
affected named-author source credit.

## Pages that did not match the expected structure

Four pages had missing classes and were repaired without changing their text:

- `ru/categories/aile-ve-terbiye.html` — `nails-lesson`: the existing “Урок:”
  paragraph lacked `story__moral`.
- `ru/categories/edalet-ve-cemiyyet.html` — `humanity-etibar-siracsoy`: same issue.
- `de/categories/exlaq-ve-xarakter.html` — `telling-lies`: the existing
  “Bakhtiyar Sirajov” credit lacked `story__source`.
- `de/stories/telling-lies.html` — the same credit lacked `story__source`.

Four pages retain intentional structural exceptions:

- `az/categories/dostluq-ve-insan-munasibetleri.html` — `time-has-passed` is a
  poem without a moral.
- `az/categories/hikmet-ve-heyat-dersleri.html` — `reflections`, `flowers` and
  `pandemic-and-quarantine` are poems without morals.
- `az/categories/iman-ve-meneviyyat.html` — `my-lifes-journey` is a poem without
  a moral.
- `en/categories/emek-ruzi-ve-servet.html` — `mercedes` has the general credit
  followed by two source URLs. All three remain in their original order.

No unexplained missing moral/source structures remain. Runtime home rendering
also respects the five poems and recognizes all credits and extra source URLs.

## Verification

- 29 non-PHP tooling tests pass, including note-class restoration, idempotence,
  preservation of poems and multiple sources, and all five real home catalogs.
- Both changed JavaScript files pass syntax checks.
- Source synchronization passes for all 1,285 stories.
- Every text node outside scripts/styles is unchanged in all 369 modified HTML
  files compared with the previous commit.
- Structural QA reports zero failures and zero warnings.
- Publish audit passes for 360 pages and 28,593 references. German integration
  and all 512 Word/image preservation hashes also pass.
- Browser measurements at 390px: 180 moral/source pairs across five language
  category pages have a 23.99–24.00px gap and no source-box overflow.
- German standalone and English long-URL source boxes pass the mobile checks.
- Desktop multilingual columns and a two-language mobile window use the same
  source background, border, padding, radius, font size and color as story pages.
- A local component fixture using the production stylesheet forced its dark
  color scheme for both contexts in all five languages. Gaps and wrapping pass.
  Dark text contrast is at least 9.93:1 for sources and 12.03:1 for morals.
  The operating-system theme was not changed.

The existing comparison layout keeps every selected language side by side.
Selecting all five on a narrow phone remains cramped; that column layout was
not changed, in accordance with the request to preserve other layout.

Evidence is under `tmp/story-notes-qa/`: structure inventory, source audit,
browser measurements, and desktop, mobile and dark-palette screenshots.
