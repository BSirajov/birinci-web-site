import json
from pathlib import Path
from urllib.parse import unquote, urlsplit

import pytest
from lxml import html
from story_routes import story_routes
from chrome_restore import pin_asset_versions

ROOT = Path(__file__).resolve().parents[1]


def test_every_published_route_resolves_to_same_story():
    manifest = json.loads((ROOT / 'tools/story-build-manifest.json').read_text('utf-8'))
    data = story_routes(manifest)
    documents = {}
    count = 0
    for stem, translations in data['stories'].items():
        for lang, href in translations.items():
            url = urlsplit(href)
            if url.path not in documents:
                documents[url.path] = html.fromstring((ROOT / url.path).read_text('utf-8'))
            matches = documents[url.path].xpath('//*[@id=$id]', id=unquote(url.fragment))
            assert len(matches) == 1, (stem, lang, href)
            assert matches[0].tag == 'article'
            count += 1
    assert count == sum(len(c['stories']) for catalog in manifest.values() for c in catalog['categories'])


def test_duplicate_or_mismatched_routes_fail_before_build():
    def manifest(stories):
        return {'az': {'categories': [{'slug': 'test', 'stories': stories}]}}
    with pytest.raises(ValueError, match='Duplicate'):
        story_routes(manifest([{'stem': 'one'}, {'stem': 'one'}]))
    with pytest.raises(ValueError, match='Invalid'):
        story_routes(manifest([{'stem': 'one', 'href': 'categories/test.html#two'}]))
    assert story_routes(manifest([{'stem': 'one'}]))['stories']['one'] == {
        'az': 'az/categories/test.html#one'
    }  # A missing translation is explicit, never an invented sibling URL.


def test_explicit_poem_translations_must_match_actual_routes():
    m = {lang: {'categories': [{'slug': 'poetry', 'stories': [{'stem': 'poem'}]}]}
         for lang in ['az', 'en']}
    assert story_routes(m, {'poem': ['az', 'en']})['poems']['poem'] == ['az', 'en']
    with pytest.raises(ValueError, match='Poem translations'):
        story_routes(m, {'poem': ['az']})


def test_shared_route_scripts_load_before_chrome_and_do_not_duplicate():
    page = '<script src="../../assets/site.js?v=20261101verify" defer></script>'
    updated = pin_asset_versions(page)
    assert updated.index('story-routes.js') < updated.index('story-navigation.js') < updated.index('/site.js')
    assert updated.count('story-routes.js') == 1
    assert pin_asset_versions(updated) == updated


def test_route_cache_stamp_is_recognized_by_structural_qa():
    from chrome_restore import KNOWN_ASSET_STAMPS, story_routes_asset_version
    stamp = story_routes_asset_version()
    assert stamp in KNOWN_ASSET_STAMPS
    result = pin_asset_versions('<script src="../assets/site.js?v=old" defer></script>')
    assert f'story-routes.js?v={stamp}' in result
    assert pin_asset_versions(result) == result
