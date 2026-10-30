"""Public manual metadata must remain aligned with the shared build policy."""
from pathlib import Path
from xml.etree import ElementTree

from lxml import html
from chrome_restore import SITE_ASSET_VERSION, pin_asset_versions

ROOT = Path(__file__).resolve().parents[1]


def test_manual_asset_versions_survive_normal_build():
    for lang in ('az', 'de', 'en', 'ky', 'ru'):
        markup = (ROOT / lang / 'user-manual.html').read_text(encoding='utf-8')
        doc = html.fromstring(markup)
        refs = doc.xpath('//link[contains(@href,"user-manual.css")]/@href | //script[contains(@src,"user-manual.js")]/@src')
        assert len(refs) == 2
        assert all(ref.endswith('?v=' + SITE_ASSET_VERSION) for ref in refs)
        assert pin_asset_versions(markup) == markup


def test_manuals_are_listed_once_in_public_sitemap():
    tree = ElementTree.parse(ROOT / 'sitemap.xml')
    urls = [e.text for e in tree.iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
    for lang in ('az', 'de', 'en', 'ky', 'ru'):
        assert urls.count(f'https://birinci.cloud/{lang}/user-manual.html') == 1
