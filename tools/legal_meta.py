# -*- coding: utf-8 -*-
"""Shared filenames and footer keys for legal pages."""

from __future__ import annotations

import html as html_lib

LEGAL_HTML_FILES = (
    "feedback.html",
    "privacy-notice.html",
    "terms-of-use.html",
    "cookie-policy.html",
    "legal-notice.html",
)

# Nested under About → Legal (DAAB Hüquqi məlumat). Feedback sits beside this group.
ABOUT_LEGAL_NESTED_FILES = (
    "privacy-notice.html",
    "terms-of-use.html",
    "cookie-policy.html",
    "legal-notice.html",
)

ABOUT_LEGAL_GROUP_TITLE = {
    "az": "Hüquqi məlumat",
    "en": "Legal information",
    "ru": "Правовая информация",
    "ky": "Укуктук маалымат",
}

ABOUT_LEGAL_AND = {
    "az": "və",
    "en": "and",
    "ru": "и",
    "ky": "жана",
}

# Footer order matches daab-waas.com (Feedback … Sitemap).
FOOTER_LEGAL_ITEMS = (
    ("feedback.html", "footer_feedback"),
    ("privacy-notice.html", "footer_privacy"),
    ("terms-of-use.html", "footer_terms"),
    ("cookie-policy.html", "footer_cookies"),
    ("legal-notice.html", "footer_imprint"),
    ("sitemap.html", "footer_sitemap"),
)

FOOTER_LEGAL_LABEL_FALLBACKS = {
    "az": {
        "footer_legal_nav": "Hüquqi sənədlər və saytın xəritəsi",
        "footer_feedback": "Rəy",
        "footer_privacy": "Məxfilik bildirişi",
        "footer_terms": "İstifadə şərtləri",
        "footer_cookies": "Kuki siyasəti",
        "footer_imprint": "Hüquqi rekvizitlər",
        "footer_sitemap": "Saytın xəritəsi",
        "legal_crumb": "Hüquqi məlumat",
        "nav_legal_group": "Hüquqi məlumat",
    },
    "en": {
        "footer_legal_nav": "Legal documents and sitemap",
        "footer_feedback": "Feedback",
        "footer_privacy": "Privacy notice",
        "footer_terms": "Terms of use",
        "footer_cookies": "Cookie policy",
        "footer_imprint": "Legal notice (Imprint)",
        "footer_sitemap": "Sitemap",
        "legal_crumb": "Legal information",
        "nav_legal_group": "Legal information",
    },
    "ru": {
        "footer_legal_nav": "Правовые документы и карта сайта",
        "footer_feedback": "Обратная связь",
        "footer_privacy": "Уведомление о конфиденциальности",
        "footer_terms": "Условия использования",
        "footer_cookies": "Политика cookie",
        "footer_imprint": "Юридическое уведомление (Impressum)",
        "footer_sitemap": "Карта сайта",
        "legal_crumb": "Правовая информация",
        "nav_legal_group": "Правовая информация",
    },
    "ky": {
        "footer_legal_nav": "Укуктук документтер жана сайт картасы",
        "footer_feedback": "Пикир",
        "footer_privacy": "Купуялык билдирүүсү",
        "footer_terms": "Колдонуу шарттары",
        "footer_cookies": "Cookie саясаты",
        "footer_imprint": "Юридикалык билдирүү (Impressum)",
        "footer_sitemap": "Сайт картасы",
        "legal_crumb": "Укуктук маалымат",
        "nav_legal_group": "Укуктук маалымат",
    },
}


BREADCRUMB_NAV_LABEL = {
    "az": "Səhifə yolu",
    "en": "Breadcrumb",
    "ru": "Навигационная цепочка",
    "ky": "Барак жолу",
}


def render_breadcrumbs_nav(
    items: list[tuple[str | None, str, bool]], lang: str | None = None
) -> str:
    """Sticky breadcrumb bar markup used across stories, about, and legal pages."""
    aria = BREADCRUMB_NAV_LABEL.get(lang or "", BREADCRUMB_NAV_LABEL["en"])
    bits: list[str] = []
    for href, label, current in items:
        text = html_lib.escape(str(label or ""), quote=False)
        if current:
            bits.append(
                f'<li class="breadcrumbs__item" aria-current="page"><span>{text}</span></li>'
            )
        elif href:
            bits.append(
                f'<li class="breadcrumbs__item">'
                f'<a href="{html_lib.escape(href, quote=True)}">{text}</a></li>'
            )
        else:
            bits.append(f'<li class="breadcrumbs__item"><span>{text}</span></li>')
    return (
        f'  <nav class="breadcrumbs" aria-label="{html_lib.escape(aria, quote=True)}">\n'
        "  <div class=\"breadcrumbs__inner\">\n"
        '    <ol class="breadcrumbs__list">\n'
        f'      {"".join(bits)}\n'
        "    </ol>\n"
        "  </div>\n"
        "</nav>\n"
    )
