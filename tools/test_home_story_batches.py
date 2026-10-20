"""Run the home renderer's batch selection against every real language catalog."""
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]


def test_home_batches_search_and_deep_links():
    node = shutil.which("node")
    if not node:
        pytest.skip("Node.js is required for home story batch regression checks")
    source = (ROOT / "assets/site.js").read_text(encoding="utf-8")
    start = source.index("      // Search the complete catalog")
    end = source.index("      const needRebuild =", start)
    selection = source[start:end]
    label_start = source.index("    const moreStoriesLabel =")
    label_end = source.index("    storiesList.after(moreStories);", label_start)
    script = r"""
const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
for (const lang of ["az", "en", "ru", "ky", "de"]) {
  const context = {window: {}};
  vm.runInNewContext(fs.readFileSync(lang + "/assets/stories-data.js", "utf8"), context);
  const catalog = context.window.__BIRINCI_STORIES__;
  const all = catalog.categories.flatMap(c => c.stories.map(s => ({...s, categorySlug: c.slug})));
  let homeLimit = 32, homeFilterKey = "", lastShownCount, lastVisibleStems;
  const homeBatchSize = 32;
  const window = {__BIRINCI_STORIES__: catalog};
  const groupStoriesByCategory = stories => catalog.categories.map(c => ({
    stories: stories.filter(s => s.categorySlug === c.slug)
  }));
  const activeStoryAuthorFilter = () => "";
  const moreStories = {dataset: {}};
  const tUi = () => "More";
  LABEL_HELPERS
  function select(filtered, {q="", resetWindow=false, pendingStem=null, noneSelected=false}={}) {
    const total = filtered.length;
    SELECTION
    return {paintStories, poolKey};
  }
  let result = select(all);
  assert.equal(result.paintStories.length, 32, lang);
  assert.equal(lastVisibleStems.size, all.length);
  assert.equal(moreStories.hidden, false);
  assert.equal(moreStories.textContent, `More (32 / ${all.length})`);
  assert.equal(moreStories.dataset.shown, "32");
  assert.equal(moreStories.dataset.total, String(all.length));
  homeLimit += 32;
  result = select(all);
  assert.equal(result.paintStories.length, 64);
  assert.equal(moreStories.textContent, `More (64 / ${all.length})`);
  const target = all.at(-1);
  result = select(all, {pendingStem: target.stem});
  assert.ok(result.paintStories.some(s => s.stem === target.stem));
  assert.equal(moreStories.hidden, true);
  result = select([target], {q: target.title, resetWindow: true});
  assert.equal(result.paintStories.length, 1);
  assert.equal(result.paintStories[0], target);
  assert.equal(lastVisibleStems.size, 1);
  assert.equal(moreStories.hidden, true);
  result = select([], {q: "no matches", resetWindow: true});
  assert.equal(result.paintStories.length, 0);
  assert.equal(lastShownCount, 0);
  assert.equal(moreStories.textContent, "More (0 / 0)");
  assert.equal(moreStories.hidden, true);
  result = select(all, {resetWindow: true, noneSelected: true});
  assert.equal(result.paintStories.length, 32);
  assert.equal(result.paintStories[0].stem, all[0].stem);
  const lastCategory = catalog.categories.at(-1);
  result = select(all, {pendingStem: lastCategory.slug});
  assert.ok(result.paintStories.some(s => s.categorySlug === lastCategory.slug));
}
""".replace("SELECTION", selection).replace("LABEL_HELPERS", source[label_start:label_end])
    result = subprocess.run([node, "-e", script], cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
    assert result.returncode == 0, result.stderr


def test_home_view_click_supersedes_inline_fallback():
    node = shutil.which("node")
    if not node:
        pytest.skip("Node.js is required for home view regression checks")
    source = (ROOT / "assets/site.js").read_text(encoding="utf-8")
    start = source.index("    // The generated page also has a document-capture fallback")
    end = source.index("    const paintHomeSearchHits =", start)
    script = r"""
const assert = require("node:assert/strict");
let handler, calls=0, prevented=0, stopped=0;
const button = {};
const bar = {contains: b => b === button};
const onViewButton = () => calls++;
const window = {addEventListener: (type, callback, capture) => {
  assert.equal(type, "click"); assert.equal(capture, true); handler=callback;
}};
HANDLER
const event = {
  target: {closest: () => button},
  preventDefault: () => prevented++,
  stopPropagation: () => stopped++,
};
handler(event);
assert.equal(calls, 1);
assert.equal(prevented, 1);
assert.equal(stopped, 1);
handler({...event, target:{closest: () => null}});
handler({...event, target:{closest: () => ({})}});
assert.equal(calls, 1);
assert.equal(stopped, 1);
""".replace("HANDLER", source[start:end])
    result = subprocess.run([node, "-e", script], cwd=ROOT, capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
