# Home-page rendering performance — 20 October 2026

The five localized home pages now render 32 stories initially. The localized
“Show more stories” control extends the list by 32 and moves keyboard focus to
the first newly available title. Search and author/category filters operate on
the full catalog, reset the reading window, and render only matching stories.
The complete sidebar remains available; a direct story or category link extends
the window enough to reveal its target. Existing story nodes are retained when
extending the list, preserving individual image/text choices.
The active home renderer also takes ownership of view-button clicks before the
inline fallback can build the complete catalog or trigger a second redraw.
Home view changes update synchronously, avoiding full-page animation snapshots
of long lists and canceled-animation races.

## Measured result

On the English deployment preview, the initial list changed from 19,212 DOM
elements, 256 articles and 522 image elements to 3,358 DOM elements, 32 articles
and 74 image elements. This is an 82.5% reduction in initial DOM elements.
Image elements with a source changed from 266 to 42; this is an element count,
not a network-request count.

Initial DOM element counts across the five languages: AZ 3,449; EN 3,358;
RU 3,402; KY 3,429; DE 3,458. Every locale initially renders 32 stories and
retains all sidebar links (261 in AZ, 256 in each other locale).

## Verification

- 55 tooling regression tests pass, including batch selection against all five
  real catalogs and the existing PHP feedback integration tests.
- JavaScript syntax validation passes.
- Structural QA: zero failures and zero warnings.
- Source synchronization: all 1,285 stories pass.
- Publish audit: 360 pages and 28,593 references, no errors.
- Browser traversal through every batch in all five languages reaches every
  story exactly once. All 1,285 rendered titles and paragraph sequences,
  including morals and source notices, match the catalogs.
- Browser checks pass for loading more, retained individual image visibility,
  full-catalog search, no matches, author/category filters, card/list switching,
  sidebar navigation to a deferred story, and a German direct story link.
- No horizontal overflow in the tested desktop viewport.

Evidence files are in `tmp/home-performance-release/`, including browser
measurements, full rendered content, and release hash verification.

## Limits

This addresses the excessive initial DOM construction. It does not claim a
Lighthouse score, Core Web Vitals improvement, or physical mobile-device
testing. Loading every batch, or following a deep link near the end, can still
mount the whole collection. Browser Find searches mounted text; the site's
search continues to search the entire catalog.

The deployment builder supplies a fresh asset cache stamp for the release.
Story catalogs, Word sources, and static story pages are unchanged.
