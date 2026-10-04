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
