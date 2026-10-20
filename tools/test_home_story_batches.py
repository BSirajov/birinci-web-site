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
  const moreStories = {}, moreLabel = "More";
  function select(filtered, {q="", resetWindow=false, pendingStem=null, noneSelected=false}={}) {
    const total = filtered.length;
    SELECTION
    return {paintStories, poolKey};
  }
  let result = select(all);
  assert.equal(result.paintStories.length, 32, lang);
  assert.equal(lastVisibleStems.size, all.length);
  assert.equal(moreStories.hidden, false);
  homeLimit += 32;
  result = select(all);
  assert.equal(result.paintStories.length, 64);
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
  assert.equal(moreStories.hidden, true);
  result = select(all, {resetWindow: true, noneSelected: true});
  assert.equal(result.paintStories.length, 32);
  assert.equal(result.paintStories[0].stem, all[0].stem);
  const lastCategory = catalog.categories.at(-1);
  result = select(all, {pendingStem: lastCategory.slug});
  assert.ok(result.paintStories.some(s => s.categorySlug === lastCategory.slug));
}
""".replace("SELECTION", selection)
    result = subprocess.run([node, "-e", script], cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
    assert result.returncode == 0, result.stderr
