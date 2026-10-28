from story_note_markup import restore_story_note_classes, restore_shared_note_styles
from pathlib import Path
import shutil
import subprocess
import pytest


def test_classes_are_restored_without_rewriting_text_or_markup():
    original = '<article class="story news-card"><div class="story__text"><p>Текст</p><p>Урок: Береги людей.</p><p>Etibar Siracsoy</p></div></article>'
    expected = original.replace("<p>Урок: ", '<p class="story__moral">').replace("<p>Etibar", '<p class="story__source">Etibar')
    assert restore_story_note_classes(original) == expected
    assert restore_story_note_classes(expected) == expected


def test_poems_without_morals_are_unchanged():
    original = '<article class="story"><p>Last stanza</p><p class="story__source">Etibar Siracsoy</p></article>'
    assert restore_story_note_classes(original) == original


def test_multiple_source_lines_keep_their_order_and_classes():
    original = '<article class="story"><p class="story__moral">Moral: Care.</p><p>Credit</p><p class="citation">https://example.org</p></article>'
    expected = original.replace("Moral: ", "").replace("<p>Credit", '<p class="story__source">Credit').replace('class="citation"', 'class="citation story__source"')
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
      assert.ok(!/class="story__moral">(?:İbrət|Moral|Lehre|Мораль|Урок|Сабак|Үлгү):/i.test(markup), language+" label remains");
      const morals=(markup.match(/class="story__moral"/g)||[]).length;
      const sources=(markup.match(/class="story__source"/g)||[]).length;
      assert.ok(morals<=1,language+" "+story.stem);
      if(!morals) noMoral++;
      const moralIndex=story.paragraphs.findIndex(p=>/^(?:ibrət|ibret|nəticə|moral|lesson|lehre|мораль|урок|үлгү|сабак)\s*:/i.test(p.trim().replace(/[İIı]/g,"i")));
      if(moralIndex>=0) assert.equal(sources,story.paragraphs.length-moralIndex-1,language+" "+story.stem+" credits changed");
      else assert.ok(sources>=1,language+" "+story.stem+" has no author credit");
      if(language==="en" && story.stem==="mercedes") assert.equal(sources,2);
    }
  }
  assert.equal(noMoral,language==="az"?5:0,language);
}
""".replace("RENDERER", renderer)
    result = subprocess.run([node, "-e", script], cwd=root, capture_output=True, text=True, encoding="utf-8")
    assert result.returncode == 0, result.stderr

def test_comparison_keeps_all_credits_after_the_moral():
    node = shutil.which("node")
    if not node:
        pytest.skip("Node.js required")
    root = Path(__file__).resolve().parents[1]
    source = (root / "assets/story-compare.js").read_text(encoding="utf-8")
    start = source.index("  const classifyParagraphs =")
    end = source.index("  const findStory =", start)
    script = r'''
const assert = require('node:assert/strict');
const foldAzI = s => s;
CLASSIFIER
const p = classifyParagraphs(['Body', 'Moral: Learn', 'Internet credit', 'https://one', 'https://two'], 'mercedes', 'en');
assert.deepEqual(p.body, ['Body']);
assert.equal(p.source, 'Internet credit\nhttps://one\nhttps://two');
const de = classifyParagraphs(['Body', 'Lehre: Learn', 'Bakhtiyar Sirajov'], 'telling-lies', 'de');
assert.deepEqual(de.body, ['Body']);
assert.equal(de.source, 'Bakhtiyar Sirajov');
'''.replace("CLASSIFIER", source[start:end])
    result = subprocess.run([node, "-e", script], capture_output=True, text=True, encoding="utf-8")
    assert result.returncode == 0, result.stderr


def test_labels_removed_in_all_languages_without_changing_moral_text():
    from story_note_markup import strip_moral_label
    for label in ["İbrət", "Nəticə", "Moral", "Lesson", "Lehre", "Мораль", "Урок", "Үлгү", "Сабак"]:
        assert strip_moral_label(label + ": Keep: the text.") == "Keep: the text."
    assert strip_moral_label("Keep: the text.") == "Keep: the text."

