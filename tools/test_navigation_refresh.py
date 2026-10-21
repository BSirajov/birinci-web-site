"""Regressions found while reviewing the shared navigation refresh."""
import json
from pathlib import Path

from lxml import html
from chrome_restore import _sitemap_nav_href

ROOT = Path(__file__).resolve().parents[1]


def test_root_language_data_is_valid_json():
    doc = html.fromstring((ROOT / "index.html").read_text(encoding="utf-8"))
    data = json.loads(doc.get_element_by_id("root-entry-i18n").text)
    assert set(data) == {"az", "de", "en", "ky", "ru"}


def test_nested_german_navigation_targets_locale_sitemap():
    for folder in ("categories", "authors"):
        for path in (ROOT / "de" / folder).glob("*.html"):
            markup = path.read_text(encoding="utf-8")
            assert _sitemap_nav_href(markup) == "../sitemap.html"
            doc = html.fromstring(markup)
            assert doc.xpath('//a[@data-nav-sitemap]/@href') == ["../sitemap.html"]


def test_german_legal_breadcrumbs_and_sitemap_metadata():
    for slug in ("feedback", "privacy-notice", "terms-of-use", "cookie-policy", "legal-notice"):
        doc = html.fromstring((ROOT / "de" / (slug + ".html")).read_text(encoding="utf-8"))
        assert not doc.xpath('//nav[contains(@class,"breadcrumbs")]//a[@href="about/mission-vision-values.html"]')
    doc = html.fromstring((ROOT / "de/sitemap.html").read_text(encoding="utf-8"))
    assert len(doc.xpath('//link[@rel="canonical"]')) == 1


def test_root_sitemap_links_cover_all_languages():
    from chrome_restore import _root_entry_locale_pack

    doc = html.fromstring((ROOT / "index.html").read_text(encoding="utf-8"))
    data = json.loads(doc.get_element_by_id("root-entry-i18n").text)
    labels = {"az": "Saytın xəritəsi", "en": "Sitemap", "ru": "Карта сайта", "ky": "Сайт картасы", "de": "Seitenübersicht"}
    for lang, label in labels.items():
        expected = {"label": label, "href": f"{lang}/sitemap.html"}
        assert data[lang]["sitemap"] == expected
        assert _root_entry_locale_pack(lang)["sitemap"] == expected
        assert (ROOT / expected["href"]).is_file()
