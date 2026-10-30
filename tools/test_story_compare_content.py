"""Regression checks for real multilingual catalog paragraph classification."""
import json
from pathlib import Path
import shutil
import subprocess
import pytest

ROOT=Path(__file__).resolve().parents[1]

def test_comparison_preserves_explicit_morals_and_poetry():
    node=shutil.which('node')
    if not node:pytest.skip('Node.js is required for the comparison JavaScript regression')
    source=(ROOT/'assets/story-compare.js').read_text(encoding='utf-8')
    classifier=source[source.index('  const foldAzI ='):source.index('  const findStory =')]
    cases=[
        (['First stanza\nSecond line','Last stanza','Etibar Siracsoy'],'flowers','az',''),
        (['Body','Moral: Be kind.','Stories collected from the internet and processed by AI.'],'test','en','Moral: Be kind.'),
        (['Text','Lehre: Sei freundlich.','Geschichten aus dem Internet gesammelt.'],'test','de','Lehre: Sei freundlich.'),
    ]
    script=classifier+'\nconst cases='+json.dumps(cases)+'; console.log(JSON.stringify(cases.map(c=>classifyParagraphs(c[0],c[1],c[2]))));'
    results=json.loads(subprocess.check_output([node,'-e',script],text=True,encoding='utf-8'))
    for case,result in zip(cases,results):
        assert result['moral']==case[3]
        assert result['source']==case[0][-1]
    assert results[0]['body']==cases[0][0][:-1]


def test_comparison_renders_every_catalog_story_with_illustration_metadata():
    node = shutil.which('node')
    if not node:
        pytest.skip('Node.js is required for the comparison rendering regression')
    script = r"""
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
let adapter;
const context = {URL, window: {
  location: {href: 'https://example.test/az/stories/compare.html'},
  __birinciCompareWindow: {
    escapeHtml: s => String(s || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;'),
    tUi: (key, fallback) => fallback,
    flagImgHtml: () => ''
  },
  __birinciBootCompareWindow: options => { adapter = options; }
}};
vm.runInNewContext(fs.readFileSync('assets/story-compare.js', 'utf8'), context);
let count = 0;
for (const lang of ['az', 'de', 'en', 'ky', 'ru']) {
  const catalogContext = {window: {}};
  vm.runInNewContext(fs.readFileSync(lang + '/assets/stories-data.js', 'utf8'), catalogContext);
  for (const story of catalogContext.window.__BIRINCI_STORIES__.categories.flatMap(c => c.stories)) {
    const html = adapter.renderColumn(lang, {
      state: {byLang: {[lang]: story}, stem: story.stem},
      LANG_META: {[lang]: {short: lang.toUpperCase(), title: lang}},
      assetQuery: () => ''
    });
    assert.ok(html.includes('sc-col__prose'), lang + '/' + story.stem);
    assert.ok(html.includes('<img '), lang + '/' + story.stem);
    assert.ok(!/width="(?:undefined|NaN)"|height="(?:undefined|NaN)"/.test(html));
    count++;
  }
}
console.log(count);
"""
    result = subprocess.check_output([node, '-e', script], cwd=ROOT, text=True)
    assert int(result.strip()) == 1280
