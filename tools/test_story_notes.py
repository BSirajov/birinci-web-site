from story_note_markup import restore_story_note_classes, restore_shared_note_styles
from pathlib import Path
import shutil
import subprocess
import pytest


def test_classes_are_restored_without_rewriting_text_or_markup():
    original = '<article class="story news-card"><div class="story__text"><p>Текст</p><p>Урок: Береги людей.</p><p>Etibar Siracsoy</p></div></article>'
    expected = original.replace("<p>Урок:", '<p class="story__moral">Урок:').replace("<p>Etibar", '<p class="story__source">Etibar')
    assert restore_story_note_classes(original) == expected
    assert restore_story_note_classes(expected) == expected


def test_poems_without_morals_are_unchanged():
    original = '<article class="story"><p>Last stanza</p><p class="story__source">Etibar Siracsoy</p></article>'
    assert restore_story_note_classes(original) == original


def test_multiple_source_lines_keep_their_order_and_classes():
    original = '<article class="story"><p class="story__moral">Moral: Care.</p><p>Credit</p><p class="citation">https://example.org</p></article>'
    expected = original.replace("<p>Credit", '<p class="story__source">Credit').replace('class="citation"', 'class="citation story__source"')
    assert restore_story_note_classes(original) == expected


def test_non_story_articles_are_untouched():
    original = '<article class="news"><p>Moral: Care.</p><p>Credit</p></article>'
    assert restore_story_note_classes(original) == original


def test_legacy_css_is_replaced_by_one_shared_import():
    css = '.story__text .story__source,\n.story .card-text .story__source { margin: .85rem; }\n.other { color: red; }'
    result = restore_shared_note_styles(css)
    assert result.count('@import url("story-notes.css') == 1
    assert ".story__source" not in result
    assert ".other { color: red; }" in result
    assert restore_shared_note_styles(result) == result


def test_home_note_classes_cover_real_catalogs_without_inventing_poem_morals():
    node = shutil.which("node")
    if not node:
        pytest.skip("Node.js is required for the home note regression")
    root = Path(__file__).resolve().parents[1]
    source = (root / "assets/site.js").read_text(encoding="utf-8")
    renderer = source[source.index("    const paragraphsHtml = (paragraphs, stem) => {"):source.index("    const KY_ILLUST_SIZE =")]
    script = r"""
const fs = require("node:fs"), vm = require("node:vm"), assert = require("node:assert/strict");
const I18N = {ui:{}};
const escapeHtml = value => String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const isEtibarAuthorCredit = value => /Etibar\s+Siracsoy|Этибар/i.test(value);
const isBakhtiyarAuthorCredit = value => /Bakhtiyar|Bəxtiyar|Бахтияр/i.test(value);
let language;
const currentPageLang = () => language;
RENDERER
for (language of ["az","en","ru","ky","de"]) {
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(language+"/assets/stories-data.js","utf8"),context);
  let noMoral=0;
  for (const category of context.window.__BIRINCI_STORIES__.categories) {
    for (const story of category.stories) {
      const markup=paragraphsHtml(story.paragraphs,story.stem);
      const morals=(markup.match(/class="story__moral"/g)||[]).length;
      const sources=(markup.match(/class="story__source"/g)||[]).length;
      assert.ok(morals<=1,language+" "+story.stem);
      if(!morals) noMoral++;
      assert.ok(sources>=1,language+" "+story.stem+" has no credit");
      if(language==="en" && story.stem==="mercedes") assert.equal(sources,3);
    }
  }
  assert.equal(noMoral,language==="az"?5:0,language);
}
""".replace("RENDERER", renderer)
    result = subprocess.run([node, "-e", script], cwd=root, capture_output=True, text=True, encoding="utf-8")
    assert result.returncode == 0, result.stderr
