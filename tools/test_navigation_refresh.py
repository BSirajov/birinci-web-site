"""Regressions found while reviewing the shared navigation refresh."""
import json
from pathlib import Path

from lxml import html
from chrome_restore import _sitemap_nav_href

ROOT = Path(__file__).resolve().parents[1]


def test_root_script_preserves_javascript_regex_escape():
    from chrome_restore import _ROOT_ENTRY_SCRIPT

    for script in (_ROOT_ENTRY_SCRIPT, (ROOT / 'assets/root-home.js').read_text(encoding='utf-8')):
        assert r'String(L.intro_source).split(/\n+/)' in script
        assert 'split(/\n+/)' not in script


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
    # Feedback + Sitemap are top-level nav: no About crumb.
    for slug in ("feedback", "sitemap"):
        doc = html.fromstring((ROOT / "de" / (slug + ".html")).read_text(encoding="utf-8"))
        assert not doc.xpath(
            '//nav[contains(@class,"breadcrumbs")]//a[contains(@href,"about/mission-vision-values.html")]'
        )
        assert doc.xpath('//nav[contains(@class,"breadcrumbs")]//a[@href="../index.html"]')
    # Nested legal docs stay under About → Legal group.
    for slug in ("privacy-notice", "terms-of-use", "cookie-policy", "legal-notice"):
        doc = html.fromstring((ROOT / "de" / (slug + ".html")).read_text(encoding="utf-8"))
        assert doc.xpath(
            '//nav[contains(@class,"breadcrumbs")]//a[contains(@href,"about/mission-vision-values.html")]'
        )
        assert doc.xpath('//nav[contains(@class,"breadcrumbs")]//a[@href="../index.html"]')
    doc = html.fromstring((ROOT / "de/sitemap.html").read_text(encoding="utf-8"))
    assert len(doc.xpath('//link[@rel="canonical"]')) == 1


def test_info_page_breadcrumb_rewriter_matches_primary_nav_ia():
    from chrome_restore import ensure_info_page_breadcrumbs

    skeleton = (
        '<html><body class="{body}" data-lang-page="{page}">'
        '<nav class="breadcrumbs"><div class="breadcrumbs__inner">'
        '<ol class="breadcrumbs__list">'
        '<li class="breadcrumbs__item"><a href="../index.html">Home</a></li>'
        '<li class="breadcrumbs__item"><a href="about/mission-vision-values.html">About us</a></li>'
        '<li class="breadcrumbs__item" aria-current="page"><span>X</span></li>'
        "</ol></div></nav></body></html>"
    )
    feedback = ensure_info_page_breadcrumbs(
        skeleton.format(body="page-home page-legal", page="feedback.html"),
        "en",
        rel_path="en/feedback.html",
    )
    assert "about/mission-vision-values" not in feedback
    assert "Feedback and suggestions" in feedback

    sitemap = ensure_info_page_breadcrumbs(
        skeleton.format(body="page-home page-sitemap", page="sitemap.html"),
        "en",
        rel_path="en/sitemap.html",
    )
    assert "about/mission-vision-values" not in sitemap
    assert "Sitemap" in sitemap

    privacy = ensure_info_page_breadcrumbs(
        skeleton.format(body="page-home page-legal", page="privacy-notice.html"),
        "en",
        rel_path="en/privacy-notice.html",
    )
    assert "about/mission-vision-values" in privacy
    assert "Legal information" in privacy


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
