"""Reviewed-source preservation and fail-before-write guarantees."""
import json
from pathlib import Path

import pytest

from build_reviewed_site import ROOT, patch_page, plan_build, read_story
from stories_catalog import load_stories_catalog


def test_all_reviewed_sources_preserve_published_text_and_formatting():
    manifest = json.loads((ROOT / 'tools/story-build-manifest.json').read_text(encoding='utf-8'))
    for lang, catalog in manifest.items():
        published = {s['stem']: s for c in load_stories_catalog(lang)['categories'] for s in c['stories']}
        for category in catalog['categories']:
            for story in category['stories']:
                title, paragraphs = read_story(
                    ROOT / story['source'], lang, story['stem'], story['title'],
                    story.get('keepSourceUrls', False), story.get('preserveLineBreaks', False),
                    story.get('creditDisplay'),
                )
                expected = published[story['stem']]
                assert (title, paragraphs) == (expected['title'], expected['paragraphs']), (lang, story['stem'])


def test_missing_source_aborts_before_writing(tmp_path):
    (tmp_path / 'tools').mkdir()
    (tmp_path / 'en/categories').mkdir(parents=True)
    page = tmp_path / 'en/categories/example.html'
    page.write_text('Reviewed layout', encoding='utf-8')
    manifest = {'en': {'categories': [{'stories': [{'stem': 'example', 'source': 'en/wisdom-stories/example.docx'}]}]}}
    (tmp_path / 'tools/story-build-manifest.json').write_text(json.dumps(manifest), encoding='utf-8')
    with pytest.raises(ValueError, match='Source manifest mismatch'):
        plan_build(tmp_path, ['en'])
    assert page.read_text(encoding='utf-8') == 'Reviewed layout'
    assert not (tmp_path / 'en/assets').exists()


def test_page_refresh_keeps_controls_and_poem_line_breaks():
    original = ('<article class="story" id="flowers"><h2 class="story__title">Old</h2>'
                '<button class="story-multilingual-btn">Compare</button>'
                '<div class="story__text"><p>Old</p></div><figure><img src="flowers.webp"></figure></article>')
    story = {'title': 'Flowers', 'paragraphs': ['First line\nSecond line', 'Etibar Siracsoy']}
    rebuilt, seen = patch_page(original, {'flowers': story})
    assert seen == {'flowers'}
    assert 'story-multilingual-btn' in rebuilt and 'flowers.webp' in rebuilt
    assert 'First line<br>Second line' in rebuilt
    assert 'class="story__source">Etibar Siracsoy' in rebuilt
    assert 'story__moral' not in rebuilt
    assert patch_page(rebuilt, {'flowers': story})[0] == rebuilt
