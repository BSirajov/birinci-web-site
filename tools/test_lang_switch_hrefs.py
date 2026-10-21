"""Language switcher hrefs stay on the same relative page."""
from chrome_restore import (
    _sibling_lang_href,
    ensure_lang_switcher_dropdown,
    infer_html_rel_path,
    patch_emitted_html,
)

NAV = (
    '<nav class="lang-switcher" aria-label="Language">'
    '<button type="button" class="lang-switcher__toggle"></button>'
    '<div class="lang-switcher__menu"></div></nav>'
)


def test_infer_legal_uses_data_lang_page_not_home():
    html = (
        '<html><body class="page-home page-legal" data-lang-page="privacy-notice.html">'
        "</body></html>"
    )
    assert infer_html_rel_path(html, "en") == "en/privacy-notice.html"


def test_sibling_lang_href_nested_about():
    href = _sibling_lang_href("en/about/mission-vision-values.html", "az")
    assert href == "../../az/about/mission-vision-values.html"


def test_switcher_without_rel_path_keeps_legal_file():
    html = (
        f'<html><body class="page-home page-legal" data-lang="en" '
        f'data-lang-page="feedback.html">{NAV}</body></html>'
    )
    out = ensure_lang_switcher_dropdown(html, "en")
    assert 'href="../az/feedback.html"' in out
    assert 'href="../az/index.html"' not in out


def test_patch_infers_privacy_hreflang():
    html = (
        "<html><head><title>Privacy</title></head>"
        '<body class="page-home page-legal" data-lang="ky" '
        f'data-lang-page="privacy-notice.html">{NAV}</body></html>'
    )
    out = patch_emitted_html(html, "ky")
    assert 'hreflang="az" href="https://birinci.cloud/az/privacy-notice.html"' in out
    assert 'href="../en/privacy-notice.html"' in out


def test_german_wisdom_is_available_in_existing_category_switcher():
    out = ensure_lang_switcher_dropdown(NAV, "ru", "ru/categories/sevgi-ve-evlilik.html")
    assert 'href="../../de/categories/sevgi-ve-evlilik.html"' in out
    assert 'data-lang="de"' in out


def test_partial_german_locale_does_not_invent_legal_pages():
    out = ensure_lang_switcher_dropdown(NAV, "en", "en/cookie-policy.html")
    assert 'data-lang="de"' in out
    assert 'href="../de/index.html"' in out
    assert 'href="../de/cookie-policy.html"' not in out
    assert 'href="../az/cookie-policy.html"' in out


def test_german_category_seo_uses_matching_language_categories():
    from chrome_restore import _hreflang_pairs

    pairs = _hreflang_pairs("de/categories/sevgi-ve-evlilik.html")
    assert ("de", "https://birinci.cloud/de/categories/sevgi-ve-evlilik.html") in pairs
    assert ("en", "https://birinci.cloud/en/categories/sevgi-ve-evlilik.html") in pairs


def test_german_sitemap_has_its_own_language_alternate():
    from chrome_restore import _hreflang_pairs

    assert ("de", "https://birinci.cloud/de/sitemap.html") in _hreflang_pairs("de/sitemap.html")


def test_generic_chrome_restoration_preserves_scoped_german_navigation():
    from pathlib import Path

    path = Path(__file__).resolve().parents[1] / "de/index.html"
    original = path.read_text(encoding="utf-8")
    assert 'data-wisdom-generator="german-docx"' in original
    assert patch_emitted_html(original, "de", rel_path="de/index.html") == original


def test_german_privacy_is_available_from_feedback():
    from lxml import html
    from pathlib import Path
    root = Path(__file__).resolve().parents[1]
    page = html.fromstring((root / "de/feedback.html").read_text(encoding="utf-8"))
    assert page.xpath('//label[@for="privacyconfirm"]/a/@href') == ["privacy-notice.html"]
    notice = html.fromstring((root / "de/privacy-notice.html").read_text(encoding="utf-8"))
    assert notice.get("lang") == "de"
    assert len(notice.xpath('//article[@class="legal-doc"]//h2')) == 10
