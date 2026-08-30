# -*- coding: utf-8 -*-
"""Build the human-readable sitemap page for each live locale."""
from __future__ import annotations

import html
import json
import locale
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOLS = Path(__file__).resolve().parent

if str(TOOLS) not in __import__("sys").path:
    __import__("sys").path.insert(0, str(TOOLS))

from stories_catalog import load_stories_catalog  # noqa: E402

LIVE_LANGS = ("az", "en", "ru", "ky")

_INV_BLOCK_RE = re.compile(
    r'<section class="inventions-category"[^>]*\bid="([^"]+)"[^>]*>'
    r'\s*<h2 class="inventions-category-head">([^<]+)</h2>'
    r"([\s\S]*?)(?=<section class=\"inventions-category\"|\Z)",
    re.I,
)
_INV_ENTRY_RE = re.compile(
    r'<article class="inventions-entry" id="([^"]+)"[\s\S]*?'
    r'<span class="inventions-entry-name">([^<]+)</span>',
    re.I,
)
_TITLE_RE = re.compile(r"<title>.*?</title>", re.I | re.S)
_META_DESC_RE = re.compile(
    r'<meta\s+name="description"\s+content="[^"]*"\s*/?>',
    re.I,
)
_BODY_RE = re.compile(r"<body\b([^>]*)>", re.I)
_BREADCRUMBS_RE = re.compile(
    r"[ \t]*<nav class=\"breadcrumbs\"[\s\S]*?</nav>\s*",
    re.I,
)
_HOME_CONTENT_RE = re.compile(
    r"<div class=\"page-home__content\">[\s\S]*?</div>\s*(?=</main>)",
    re.I,
)
_LANG_OPTION_RE = re.compile(
    r'(<a class="lang-switcher__option"[^>]*href="\.\./(?:az|en|ru|ky)/)index\.html"',
    re.I,
)


def _load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _locale(lang: str) -> dict:
    return _load_json(TOOLS / "locales" / f"{lang}.json")


def _sitemap_copy(lang: str) -> dict:
    loc = _locale(lang)
    ui = loc.get("ui") or {}
    pack = dict(ui.get("sitemap") or {})
    defaults = {
        "nav_item": "Sitemap",
        "page_title": "Sitemap",
        "page_description": "",
        "kicker": "",
        "lead": "",
        "jump_label": "On this page",
        "search_label": "Search this page",
        "search_placeholder": "Search stories, discoveries, and sections…",
        "search_no_match": "No matching items on this page.",
        "overview_title": "Main sections",
        "home_title": loc.get("home_crumb", "Home"),
        "home_desc": "",
        "stories_all_desc": "",
        "discoveries_all_desc": "",
        "about_desc": "",
        "stories_section": loc.get("nav_stories_label", ""),
        "discoveries_section": (ui.get("inventions") or {}).get("page_title", ""),
        "about_section": (ui.get("about") or {}).get("kicker", ""),
        "languages_section": ui.get("lang_switcher_label", "Language"),
        "languages_lead": "",
        "stories_count": "{n}",
        "articles_count": "{n}",
        "browse_chapter": "",
    }
    for key, value in defaults.items():
        pack.setdefault(key, value)
    return pack


_NUM_PREFIX_RE = re.compile(r"^(?:§\s*)?\d+(?:\.\d+)*\.?\s+")
_LOCALE_CANDIDATES = {
    "az": ("az_AZ.UTF-8", "az_AZ", "az", "Azerbaijani_Azerbaijan.1254"),
    "en": ("en_US.UTF-8", "en_US", "en", "English_United States.1252"),
    "ru": ("ru_RU.UTF-8", "ru_RU", "ru", "Russian_Russia.1251"),
    "ky": ("ky_KG.UTF-8", "ky_KG", "ky", "Kyrgyz_Kyrgyzstan.1251", "ru_RU.UTF-8"),
}


def _esc(text: str) -> str:
    return html.escape(str(text or ""), quote=False)


def _visible_label(text: str) -> str:
    return _NUM_PREFIX_RE.sub("", str(text or "")).strip()


def _locale_sort_titles(items: list, lang: str, key=lambda item: item.get("title") or "") -> list:
    titles = list(items)
    old = locale.setlocale(locale.LC_COLLATE, None)
    applied = False
    for cand in _LOCALE_CANDIDATES.get(lang, _LOCALE_CANDIDATES["en"]):
        try:
            locale.setlocale(locale.LC_COLLATE, cand)
            applied = True
            break
        except locale.Error:
            continue
    try:
        if applied:
            titles.sort(key=lambda item: locale.strxfrm(str(key(item) or "")))
        else:
            titles.sort(key=lambda item: str(key(item) or "").casefold())
    finally:
        try:
            locale.setlocale(locale.LC_COLLATE, old)
        except locale.Error:
            pass
    return titles


def _count_label(template: str, n: int) -> str:
    return template.replace("{n}", str(n))


_SITEMAP_ICONS = {
    "home": '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v10h14V10"/>',
    "stories": '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    "discoveries": '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    "about": '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
}


def _orb_icon(kind: str, size: int = 22) -> str:
    paths = _SITEMAP_ICONS.get(kind, _SITEMAP_ICONS["home"])
    return (
        f'<span class="sitemap-orb sitemap-orb--{kind}" aria-hidden="true">'
        f'<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" '
        f'stroke="#fff" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round">'
        f"{paths}</svg></span>"
    )


def _title_html(title: str) -> str:
    parts = str(title or "").rsplit(" ", 1)
    if len(parts) == 2:
        return f"{_esc(parts[0])} <span>{_esc(parts[1])}</span>"
    return _esc(title)


def _invention_chapters(lang: str) -> list[dict]:
    path = TOOLS / "inventions" / f"{lang}-body.html"
    if not path.is_file():
        path = ROOT / lang / "discoveries" / "discoveries-and-inventions.html"
    if not path.is_file():
        return []
    text = path.read_text(encoding="utf-8")
    chapters = []
    for match in _INV_BLOCK_RE.finditer(text):
        entries = [
            {"id": entry.group(1), "title": html.unescape(entry.group(2).strip())}
            for entry in _INV_ENTRY_RE.finditer(match.group(3))
        ]
        chapters.append(
            {
                "id": match.group(1),
                "title": html.unescape(match.group(2).strip()),
                "entries": entries,
            }
        )
    return chapters


def _story_categories(lang: str) -> list[dict]:
    loc = _locale(lang)
    catalog = load_stories_catalog(lang)
    by_slug = {cat.get("slug"): cat for cat in (catalog.get("categories") or [])}
    rows = []
    for slug, meta in (loc.get("categories") or {}).items():
        blob = by_slug.get(slug) or {}
        stories = _locale_sort_titles(
            [
                {"stem": story.get("stem"), "title": story.get("title")}
                for story in (blob.get("stories") or [])
                if story.get("stem") and story.get("title")
            ],
            lang,
        )
        rows.append(
            {
                "slug": slug,
                "title": meta.get("title") or blob.get("title") or slug,
                "blurb": meta.get("blurb") or blob.get("blurb") or "",
                "stories": stories,
            }
        )
    return rows


def _languages() -> list[dict]:
    data = _load_json(ROOT / "languages.json")
    return [
        lang
        for lang in (data.get("languages") or [])
        if lang.get("enabled") and lang.get("implemented") and lang.get("code") in LIVE_LANGS
    ]


def build_sitemap_inner_html(lang: str) -> str:
    loc = _locale(lang)
    ui = loc.get("ui") or {}
    about = ui.get("about") or {}
    inv = ui.get("inventions") or {}
    copy = _sitemap_copy(lang)
    stories = _story_categories(lang)
    chapters = _invention_chapters(lang)
    story_total = sum(len(cat["stories"]) for cat in stories)
    article_total = sum(len(ch["entries"]) for ch in chapters)
    disc_href = "discoveries/discoveries-and-inventions.html"
    about_href = "about/mission-vision-values.html"

    def links(items: list[dict], href_for) -> str:
        rows = []
        for item in items:
            rows.append(
                f'<li><a href="{html.escape(href_for(item), quote=True)}">'
                f"<span>{_esc(item['title'])}</span></a></li>"
            )
        return f'<ul class="sitemap-links">\n{" ".join(rows)}\n</ul>'

    def section_head(title_id: str, title: str, more_href: str = "", more_label: str = "") -> str:
        more = ""
        if more_href:
            more = (
                f'<a class="sitemap-section__more" href="{html.escape(more_href, quote=True)}">'
                f"<span>{_esc(more_label)}</span></a>"
            )
        return (
            '<div class="sitemap-section__head">'
            '<div class="sitemap-section__title">'
            f'<h2 id="{html.escape(title_id, quote=True)}">{_esc(title)}</h2>'
            "</div>"
            f"{more}</div>"
        )

    overview = [
        {
            "tone": "home",
            "href": "../index.html",
            "kicker": loc.get("site_name", "Birİnci"),
            "title": copy["home_title"],
            "desc": copy["home_desc"],
            "meta": "",
        },
        {
            "tone": "stories",
            "href": "index.html?view=list",
            "kicker": copy["stories_section"],
            "title": loc.get("nav_stories_label", copy["stories_section"]),
            "desc": copy["stories_all_desc"],
            "meta": _count_label(copy["stories_count"], story_total),
        },
        {
            "tone": "discoveries",
            "href": disc_href,
            "kicker": copy["discoveries_section"],
            "title": inv.get("page_title", copy["discoveries_section"]),
            "desc": copy["discoveries_all_desc"] or inv.get("card_description", ""),
            "meta": _count_label(copy["articles_count"], article_total),
        },
        {
            "tone": "about",
            "href": about_href,
            "kicker": copy["about_section"],
            "title": about.get("page_title", copy["about_section"]),
            "desc": copy["about_desc"] or about.get("page_description", ""),
            "meta": "",
        },
    ]
    overview_html = []
    for card in overview:
        meta_html = (
            f'<p class="sitemap-card__meta">{_esc(card["meta"])}</p>' if card["meta"] else ""
        )
        overview_html.append(
            f'<a class="sitemap-card sitemap-card--{card["tone"]}" '
            f'href="{html.escape(card["href"], quote=True)}">'
            f"{_orb_icon(card['tone'], 24)}"
            f'<p class="sitemap-card__kicker">{_esc(card["kicker"])}</p>'
            f"<h3>{_esc(card['title'])}</h3>"
            f'<p class="sitemap-card__desc">{_esc(card["desc"])}</p>'
            f"{meta_html}</a>"
        )

    story_blocks = []
    for cat in stories:
        n = len(cat["stories"])
        href = f"categories/{cat['slug']}.html"
        story_blocks.append(
            '<article class="sitemap-block sitemap-block--stories">'
            '<div class="sitemap-block__top">'
            f"{_orb_icon('stories', 18)}"
            '<div class="sitemap-block__heading">'
            f"<h3><a href=\"{html.escape(href, quote=True)}\">{_esc(cat['title'])}</a></h3>"
            "</div>"
            f'<span class="sitemap-block__count">{_esc(_count_label(copy["stories_count"], n))}</span>'
            "</div>"
            f'<p class="sitemap-block__blurb">{_esc(cat["blurb"])}</p>'
            + links(cat["stories"], lambda item, slug=cat["slug"]: f"categories/{slug}.html#{item['stem']}")
            + "</article>"
        )

    disc_blocks = []
    for chapter in chapters:
        n = len(chapter["entries"])
        href = f"{disc_href}#{chapter['id']}"
        disc_blocks.append(
            '<article class="sitemap-block sitemap-block--discoveries">'
            '<div class="sitemap-block__top">'
            f"{_orb_icon('discoveries', 18)}"
            '<div class="sitemap-block__heading">'
            f"<h3><a href=\"{html.escape(href, quote=True)}\">{_esc(_visible_label(chapter['title']))}</a></h3>"
            "</div>"
            f'<span class="sitemap-block__count">{_esc(_count_label(copy["articles_count"], n))}</span>'
            "</div>"
            + links(
                chapter["entries"],
                lambda item: f"{disc_href}#{item['id']}",
            )
            + "</article>"
        )

    lang_cards = []
    for item in _languages():
        code = item["code"]
        flag = f"../{item.get('flag', f'flags/{code}.svg')}"
        current = ' aria-current="page"' if code == lang else ""
        current_class = " is-current" if code == lang else ""
        lang_cards.append(
            f'<a class="sitemap-lang{current_class}" href="../{code}/sitemap.html" hreflang="{code}"{current}>'
            f'<img src="{html.escape(flag, quote=True)}" alt="" width="22" height="16" decoding="async" />'
            f'<span class="sitemap-lang__copy"><strong>{_esc(item.get("label", code.upper()))}</strong>'
            f"<span>{_esc(item.get('name', code))}</span></span></a>"
        )

    jump_items = (
        ("overview", "#sitemap-overview", copy["overview_title"]),
        ("stories", "#sitemap-stories", copy["stories_section"]),
        ("discoveries", "#sitemap-discoveries", copy["discoveries_section"]),
        ("about", "#sitemap-about", copy["about_section"]),
        ("languages", "#sitemap-languages", copy["languages_section"]),
    )
    jump_chips = "".join(
        f'<a class="sitemap-jump__chip sitemap-jump__chip--{tone}" '
        f'href="{html.escape(href, quote=True)}">{_esc(label)}</a>'
        for tone, href, label in jump_items
    )
    jump = (
        f'<nav class="sitemap-jump" aria-label="{_esc(copy["jump_label"])}">'
        f'<div class="sitemap-jump__inner">'
        f'<div class="sitemap-jump__chips">{jump_chips}</div>'
        "</div></nav>"
    )
    search = (
        f'<div class="sitemap-search" role="search">'
        f'<label class="sitemap-search__field">'
        f'<span class="visually-hidden">{_esc(copy["search_label"])}</span>'
        f'<svg class="sitemap-search__icon" viewBox="0 0 24 24" width="18" height="18" '
        f'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" '
        f'stroke-linejoin="round" aria-hidden="true">'
        f'<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>'
        f'<input type="search" id="sitemap-search-input" '
        f'placeholder="{html.escape(copy["search_placeholder"], quote=True)}" '
        f'autocomplete="off" />'
        f"</label>"
        f'<p class="sitemap-search__status" id="sitemap-search-status" '
        f'data-empty="{html.escape(copy["search_no_match"], quote=True)}" '
        f'aria-live="polite" hidden></p>'
        f"</div>"
    )

    return (
        '<div class="sitemap-page">\n'
        '  <header class="about-hero">\n'
        '    <div class="about-hero__wrap">\n'
        '      <section class="about-hero__copy">\n'
        f'        <h1 class="about-hero__title" id="about-hero-title">{_title_html(copy["page_title"])}</h1>\n'
        f'        <p class="about-hero__lead">{_esc(copy["lead"])}</p>\n'
        "      </section>\n"
        "    </div>\n"
        "  </header>\n"
        f"  {jump}\n"
        f"  {search}\n"
        '  <div class="sitemap-main">\n'
        f'    <section class="sitemap-section sitemap-section--overview" id="sitemap-overview" aria-labelledby="sitemap-overview-title">\n'
        f'      {section_head("sitemap-overview-title", copy["overview_title"])}\n'
        f'      <div class="sitemap-overview">\n{" ".join(overview_html)}\n      </div>\n'
        "    </section>\n"
        f'    <section class="sitemap-section sitemap-section--stories" id="sitemap-stories" aria-labelledby="sitemap-stories-title">\n'
        f'      {section_head("sitemap-stories-title", copy["stories_section"], "index.html?view=list", loc.get("nav_stories_all", copy["browse_chapter"]))}\n'
        f'      <div class="sitemap-grid">\n{" ".join(story_blocks)}\n      </div>\n'
        "    </section>\n"
        f'    <section class="sitemap-section sitemap-section--discoveries" id="sitemap-discoveries" aria-labelledby="sitemap-discoveries-title">\n'
        f'      {section_head("sitemap-discoveries-title", copy["discoveries_section"], disc_href, copy["browse_chapter"])}\n'
        f'      <div class="sitemap-grid">\n{" ".join(disc_blocks)}\n      </div>\n'
        "    </section>\n"
        f'    <section class="sitemap-section sitemap-section--about" id="sitemap-about" aria-labelledby="sitemap-about-title">\n'
        f'      {section_head("sitemap-about-title", copy["about_section"])}\n'
        '      <div class="sitemap-overview sitemap-overview--single">\n'
        f'        <a class="sitemap-card sitemap-card--about" href="{html.escape(about_href, quote=True)}">'
        f'{_orb_icon("about", 24)}'
        f'<p class="sitemap-card__kicker">{_esc(about.get("kicker", ""))}</p>'
        f'<h3>{_esc(about.get("page_title", copy["about_section"]))}</h3>'
        f'<p class="sitemap-card__desc">{_esc(about.get("page_description", copy["about_desc"]))}</p>'
        "</a>\n"
        "      </div>\n"
        "    </section>\n"
        f'    <section class="sitemap-section sitemap-section--languages" id="sitemap-languages" aria-labelledby="sitemap-languages-title">\n'
        f'      {section_head("sitemap-languages-title", copy["languages_section"])}\n'
        f'      <p class="sitemap-langs__lead">{_esc(copy["languages_lead"])}</p>\n'
        f'      <div class="sitemap-langs">\n{" ".join(lang_cards)}\n      </div>\n'
        "    </section>\n"
        "  </div>\n"
        "</div>\n"
    )


def build_sitemap_page_html(index_html: str, lang: str) -> str:
    loc = _locale(lang)
    copy = _sitemap_copy(lang)
    site = loc.get("site_name", "Birİnci")
    title = f"{copy['page_title']} · {site}"
    desc = copy["page_description"]
    home = loc.get("home_crumb", "Home")
    markup = index_html
    markup = _TITLE_RE.sub(f"<title>{html.escape(title)}</title>", markup, count=1)
    meta = (
        f'<meta name="description" content="{html.escape(desc, quote=True)}" />'
    )
    if _META_DESC_RE.search(markup):
        markup = _META_DESC_RE.sub(meta, markup, count=1)
    else:
        markup = markup.replace("</title>", f"</title>\n  {meta}", 1)

    def _body(match: re.Match[str]) -> str:
        attrs = match.group(1)
        attrs = re.sub(r'\sclass="[^"]*"', "", attrs)
        attrs = re.sub(r'\sdata-lang-page="[^"]*"', "", attrs)
        return f'<body class="page-home page-sitemap" data-lang-page="sitemap.html"{attrs}>'

    markup = _BODY_RE.sub(_body, markup, count=1)
    crumbs = (
        '  <nav class="breadcrumbs" aria-label="Breadcrumb">\n'
        '  <div class="breadcrumbs__inner">\n'
        '    <ol class="breadcrumbs__list">\n'
        f'      <li class="breadcrumbs__item"><a href="index.html">{_esc(home)}</a></li>'
        f'<li class="breadcrumbs__item" aria-current="page"><span>{_esc(copy["page_title"])}</span></li>\n'
        "    </ol>\n"
        "  </div>\n"
        "</nav>\n"
    )
    if _BREADCRUMBS_RE.search(markup):
        markup = _BREADCRUMBS_RE.sub(crumbs, markup, count=1)
    markup = _HOME_CONTENT_RE.sub(
        '<div class="page-home__content">\n' + build_sitemap_inner_html(lang) + "</div>\n",
        markup,
        count=1,
    )
    markup = _LANG_OPTION_RE.sub(r'\1sitemap.html"', markup)
    return markup


def write_html_sitemaps(patch_html) -> int:
    n = 0
    for lang in LIVE_LANGS:
        src = ROOT / lang / "index.html"
        if not src.is_file():
            continue
        markup = build_sitemap_page_html(src.read_text(encoding="utf-8"), lang)
        markup = patch_html(markup, lang, rel_path=f"{lang}/sitemap.html")
        dest = ROOT / lang / "sitemap.html"
        dest.write_text(markup, encoding="utf-8")
        n += 1
    return n
