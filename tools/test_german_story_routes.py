"""Regression tests for safe, content-preserving German route migration."""
import json
from pathlib import Path
import tempfile
import unittest

from german_story_routes import migrate


class GermanRouteTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        for directory in ('de/assets', 'de/categories', 'de/stories'):
            (self.root / directory).mkdir(parents=True)
        self.put('de/assets/stories-data.js', 'window.__BIRINCI_STORIES__ = ' + json.dumps({
            'categories': [{'slug': 'wisdom', 'stories': [{'stem': 'a-story', 'href': 'stories/a-story.html'}]}]
        }, separators=(',', ':')) + ';')
        self.put('de/assets/search-index.js', 'window.__BIRINCI_SEARCH__ = [{"href":"stories/a-story.html"}];')
        self.put('de/categories/wisdom.html', '<article id="a-story"><p>Unveränderter Text: ö, ä, ü.</p><a href="../stories/a-story.html">Titel</a></article>')
        self.put('de/stories/a-story.html', '<p>Legacy generated page</p>')
        self.put('de/stories/compare.html', '<p>Comparison utility</p>')
        self.put('de/index.html', '<a href="stories/a-story.html?from=search#old">Story</a><a href="https://example.com/de/stories/a-story.html">External</a>')
        self.put('sitemap.xml', '<urlset><url><loc>https://birinci.cloud/de/stories/a-story.html</loc></url><url><loc>https://birinci.cloud/de/categories/wisdom.html</loc></url></urlset>')

    def put(self, name, text):
        (self.root / name).write_text(text, encoding='utf-8')

    def test_preserves_content_query_external_links_and_comparison(self):
        migrate(self.root)
        page = (self.root / 'de/index.html').read_text()
        self.assertIn('categories/wisdom.html?from=search#a-story', page)
        self.assertIn('https://example.com/de/stories/a-story.html', page)
        self.assertIn('Unveränderter Text: ö, ä, ü.', (self.root / 'de/categories/wisdom.html').read_text(encoding='utf-8'))
        self.assertTrue((self.root / 'de/stories/compare.html').exists())
        self.assertFalse((self.root / 'de/stories/a-story.html').exists())
        self.assertIn('/de/categories/wisdom.html#a-story [R=301,L,NE]', (self.root / 'de/stories/.htaccess').read_text())
        self.assertNotIn('/de/stories/a-story.html', (self.root / 'sitemap.xml').read_text())
        self.assertEqual(migrate(self.root), [])

    def test_missing_anchor_aborts_before_modifying_any_file(self):
        self.put('de/categories/wisdom.html', '<p>No destination anchor</p>')
        before = {p.relative_to(self.root): p.read_bytes() for p in self.root.rglob('*') if p.is_file()}
        with self.assertRaises(ValueError):
            migrate(self.root)
        after = {p.relative_to(self.root): p.read_bytes() for p in self.root.rglob('*') if p.is_file()}
        self.assertEqual(before, after)


if __name__ == '__main__':
    unittest.main()
