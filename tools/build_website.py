# -*- coding: utf-8 -*-
"""Build static website for az moral stories (landing + one page per category)."""
from __future__ import annotations

import html
import json
import sys
from collections import defaultdict
from pathlib import Path

from docx import Document

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _az_story_categories import CATEGORY_ORDER, STORY_CATEGORY  # noqa: E402

TOOLS = Path(__file__).resolve().parent
SITE_ROOT = TOOLS.parent
AZ_ROOT = SITE_ROOT / "az"
STORIES = AZ_ROOT / "stories"
ILLUSTRATIONS = AZ_ROOT / "illustrations"
MAP_JSON = Path(__file__).resolve().parent / "story-mapping.json"
DATA_JSON = AZ_ROOT / "data" / "stories.json"
PAGES_DIR = AZ_ROOT / "categories"
ASSETS = AZ_ROOT / "assets"

SITE_NAME = "Bir inci"
SITE_TITLE = "İbrətamiz deyimlər və hekayələr"
NAV_LABEL = "İbrətamiz deyimlər və hekayələr"

# Inline Lucide-style stroke icons (24x24 viewBox) for menu items.
CATEGORY_ICONS: dict[str, str] = {
    # Spirituality / faith
    "sparkles": '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
    # Family / home
    "home": '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    # Love
    "heart": '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    # Friendship
    "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    # Character / ethics
    "shield": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    # Communication
    "message": '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    # Wisdom
    "lightbulb": '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    # Work / wealth
    "briefcase": '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
    # Justice
    "scale": '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
    # Time / aging
    "clock": '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    # Parables / fables
    "book": '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    # History / figures
    "landmark": '<path d="M10 18v-7"/><path d="M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.10.0.0.5-.22.949H3.474c-.53 0-.695-.716-.22-.949z"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M3 22h18"/><path d="M6 18v-7"/>',
}

# Per-icon accent colors for 3D colorful badges.
ICON_COLORS: dict[str, dict[str, str]] = {
    "sparkles": {"from": "#7c5cff", "to": "#b44dff", "glow": "#a78bfa"},
    "home": {"from": "#0ea5e9", "to": "#2563eb", "glow": "#38bdf8"},
    "heart": {"from": "#f43f5e", "to": "#e11d48", "glow": "#fb7185"},
    "users": {"from": "#14b8a6", "to": "#0d9488", "glow": "#2dd4bf"},
    "shield": {"from": "#f59e0b", "to": "#d97706", "glow": "#fbbf24"},
    "message": {"from": "#3b82f6", "to": "#1d4ed8", "glow": "#60a5fa"},
    "lightbulb": {"from": "#fbbf24", "to": "#f97316", "glow": "#fcd34d"},
    "briefcase": {"from": "#64748b", "to": "#334155", "glow": "#94a3b8"},
    "scale": {"from": "#6366f1", "to": "#4f46e5", "glow": "#818cf8"},
    "clock": {"from": "#a855f7", "to": "#7e22ce", "glow": "#c084fc"},
    "book": {"from": "#10b981", "to": "#059669", "glow": "#34d399"},
    "landmark": {"from": "#eab308", "to": "#ca8a04", "glow": "#facc15"},
}

CATEGORY_META: list[dict[str, str]] = [
    {
        "title": "İman və mənəviyyat",
        "slug": "iman-ve-meneviyyat",
        "blurb": "İnanç, ibadət və ruhi yol axtarışına dair hekayələr.",
        "icon": "sparkles",
    },
    {
        "title": "Ailə və tərbiyə",
        "slug": "aile-ve-terbiye",
        "blurb": "Ana-ata sevgisi, övlad tərbiyəsi və yuva qurmaq.",
        "icon": "home",
    },
    {
        "title": "Sevgi və evlilik",
        "slug": "sevgi-ve-evlilik",
        "blurb": "Eşq, vəfa və birgə ömrün sınaqları.",
        "icon": "heart",
    },
    {
        "title": "Dostluq və insan münasibətləri",
        "slug": "dostluq-ve-insan-munasibetleri",
        "blurb": "Dost seçimi, mərhəmət və insanlara münasibət.",
        "icon": "users",
    },
    {
        "title": "Əxlaq və xarakter",
        "slug": "exlaq-ve-xarakter",
        "blurb": "Dürüstlük, səxavət və şəxsi kamillik.",
        "icon": "shield",
    },
    {
        "title": "Söz, sükut və ünsiyyət",
        "slug": "soz-sukut-ve-unsiyyet",
        "blurb": "Sözün gücü, sükutun hikməti və doğru ünsiyyət.",
        "icon": "message",
    },
    {
        "title": "Hikmət və həyat dərsləri",
        "slug": "hikmet-ve-heyat-dersleri",
        "blurb": "Həyatın mənası, seçimlər və düşüncə tərzi.",
        "icon": "lightbulb",
    },
    {
        "title": "Əmək, ruzi və sərvət",
        "slug": "emek-ruzi-ve-servet",
        "blurb": "Zəhmət, ruzi və var-dövlətə baxış.",
        "icon": "briefcase",
    },
    {
        "title": "Ədalət və cəmiyyət",
        "slug": "edalet-ve-cemiyyet",
        "blurb": "Haqq, cəmiyyət və ortaq məsuliyyət.",
        "icon": "scale",
    },
    {
        "title": "Yaşlanma və zaman",
        "slug": "yaslanma-ve-zaman",
        "blurb": "Ömrün fəsilləri və zamanın dəyişdirdikləri.",
        "icon": "clock",
    },
    {
        "title": "Təmsillər və məsəllər",
        "slug": "temsiller-ve-meseller",
        "blurb": "Heyvanlar və obrazlarla öyrədən məsəllər.",
        "icon": "book",
    },
    {
        "title": "Tarix və tanınmış şəxsiyyətlər",
        "slug": "tarix-ve-taninmish-shexsiyyetler",
        "blurb": "Tarixdən və tanınmış adlardan ibrət.",
        "icon": "landmark",
    },
]


def menu_icon(name: str) -> str:
    paths = CATEGORY_ICONS.get(name, CATEGORY_ICONS["book"])
    colors = ICON_COLORS.get(name, ICON_COLORS["book"])
    return (
        f'<span class="menu-icon menu-icon--{esc(name)}" aria-hidden="true" '
        f'style="--icon-from:{colors["from"]};--icon-to:{colors["to"]};--icon-glow:{colors["glow"]}">'
        f'<svg class="menu-icon__svg" viewBox="0 0 24 24" width="18" height="18" '
        f'fill="none" stroke="#fff" stroke-width="2.15" '
        f'stroke-linecap="round" stroke-linejoin="round">'
        f"{paths}</svg></span>"
    )


def extract_paragraphs(docx_path: Path, title: str) -> list[str]:
    doc = Document(str(docx_path))
    paras: list[str] = []
    for p in doc.paragraphs:
        t = (p.text or "").strip()
        if t:
            paras.append(t)
    while paras and paras[0].casefold() == title.casefold():
        paras = paras[1:]
    return paras


def load_catalog() -> dict:
    data = json.loads(MAP_JSON.read_text(encoding="utf-8"))
    by_stem = {r["en_stem"]: r for r in data["rows"]}
    title_by_cat = {c["title"]: c for c in CATEGORY_META}
    assert [c["title"] for c in CATEGORY_META] == CATEGORY_ORDER

    grouped: dict[str, list[dict]] = defaultdict(list)
    for stem, row in by_stem.items():
        cat = STORY_CATEGORY[stem]
        story_path = STORIES / f"{stem}.docx"
        ill_rel = f"../illustrations/{stem}.webp"
        text = extract_paragraphs(story_path, row["az_stem"]) if story_path.exists() else []
        grouped[cat].append(
            {
                "stem": stem,
                "title": row["az_stem"],
                "paragraphs": text,
                "image": ill_rel,
                "image_from_root": f"illustrations/{stem}.webp",
            }
        )

    categories = []
    for meta in CATEGORY_META:
        stories = sorted(grouped[meta["title"]], key=lambda s: s["title"].casefold())
        categories.append({**meta, "count": len(stories), "stories": stories})

    return {
        "site_title": SITE_TITLE,
        "nav_label": NAV_LABEL,
        "categories": categories,
    }


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def breadcrumbs_html(crumbs: list[tuple[str, str | None]], prefix: str) -> str:
    """crumbs: list of (label, href_or_None). Last item is current page."""
    items = []
    for i, (label, href) in enumerate(crumbs):
        is_last = i == len(crumbs) - 1
        if is_last or not href:
            items.append(
                f'<li class="breadcrumbs__item" aria-current="page">'
                f"<span>{esc(label)}</span></li>"
            )
        else:
            items.append(
                f'<li class="breadcrumbs__item">'
                f'<a href="{esc(href)}">{esc(label)}</a></li>'
            )
    return f"""
<nav class="breadcrumbs" aria-label="Breadcrumb">
  <div class="breadcrumbs__inner">
    <ol class="breadcrumbs__list">
      {"".join(items)}
    </ol>
  </div>
</nav>
""".strip()


def nav_html(active_slug: str | None, prefix: str) -> str:
    items = []
    for c in CATEGORY_META:
        href = f"{prefix}categories/{c['slug']}.html"
        cls = ' class="is-active"' if c["slug"] == active_slug else ""
        icon = menu_icon(c["icon"])
        items.append(
            f'<li><a href="{href}"{cls}>'
            f'{icon}<span>{esc(c["title"])}</span></a></li>'
        )
    menu = "\n".join(items)
    home = f"{prefix}index.html"
    data_url = f"{prefix}assets/search-index.js"
    return f"""
<header class="site-header">
  <div class="site-header__inner">
    <a class="brand" href="{home}">
      <img class="brand__logo" src="{prefix}assets/pearl.webp" alt="" width="36" height="36" />
      <span class="brand__name">{esc(SITE_NAME)}</span>
    </a>
    <nav class="primary-nav" aria-label="Əsas menyu">
      <details class="nav-dropdown">
        <summary>{esc(NAV_LABEL)}</summary>
        <ul class="nav-dropdown__list">
          {menu}
        </ul>
      </details>
    </nav>
    <button type="button" class="global-search-toggle" id="global-search-toggle" aria-expanded="false" aria-controls="global-search" title="Axtar" aria-label="Qlobal axtarış">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7"></circle>
        <path d="m20 20-3.5-3.5"></path>
      </svg>
      <span>Axtar</span>
    </button>
  </div>
</header>
<div class="global-search" id="global-search" hidden data-search-index="{esc(data_url)}">
  <button type="button" class="global-search__backdrop" data-global-search-close tabindex="-1" aria-label="Axtarışı bağla"></button>
  <div class="global-search__panel" role="dialog" aria-modal="true" aria-labelledby="global-search-title">
    <div class="global-search__head">
      <h2 id="global-search-title">Qlobal axtarış</h2>
      <button type="button" class="global-search__close" data-global-search-close aria-label="Bağla">×</button>
    </div>
    <label class="global-search__field">
      <span class="visually-hidden">Hekayə axtar</span>
      <input type="search" id="global-search-input" placeholder="Bütün hekayələrdə axtar…" autocomplete="off" />
    </label>
    <p class="global-search__status" id="global-search-status" aria-live="polite"></p>
    <div class="global-search__results" id="global-search-results"></div>
  </div>
</div>
""".strip()


def page_shell(
    *,
    title: str,
    description: str,
    active_slug: str | None,
    prefix: str,
    body: str,
    crumbs: list[tuple[str, str | None]],
    extra_body_class: str = "",
) -> str:
    page_title = title if SITE_NAME in title else f"{title} · {SITE_NAME}"
    return f"""<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#0069b4" />
  <meta name="color-scheme" content="light" />
  <title>{esc(page_title)}</title>
  <meta name="description" content="{esc(description)}" />
  <link rel="icon" href="{prefix}assets/pearl.webp" type="image/webp" />
  <link rel="icon" href="{prefix}assets/favicon.ico" sizes="any" />
  <link rel="apple-touch-icon" href="{prefix}assets/pearl.webp" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="{prefix}assets/site.css" />
</head>
<body class="{extra_body_class}" id="top">
  <a class="skip-link" href="#main">Məzmuna keç</a>
  {nav_html(active_slug, prefix)}
  {breadcrumbs_html(crumbs, prefix)}
  <div id="main">
  {body}
  </div>
  <a class="back-to-top" href="#top" id="back-to-top" title="Navigate to the top of the page" aria-label="Navigate to the top of the page"></a>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <div class="site-footer__brand">
        <img src="{prefix}assets/pearl.webp" alt="" width="28" height="28" />
        <span>{esc(SITE_NAME)}</span>
      </div>
      <p>{esc(SITE_TITLE)}</p>
    </div>
  </footer>
  <script src="{prefix}assets/site.js" defer></script>
</body>
</html>
"""


def tools_bar_html(*, mode: str, sort_options: list[tuple[str, str]], search_placeholder: str) -> str:
    opts = "\n".join(
        f'<option value="{esc(value)}">{esc(label)}</option>' for value, label in sort_options
    )
    images_btn = ""
    if mode == "stories":
        images_btn = """
  <button type="button" class="tools-bar__images" data-tools-images aria-pressed="false" title="Şəkilləri gizlət / göstər">
    <span data-tools-images-label>Şəkilləri gizlət</span>
  </button>
""".rstrip()
    return f"""
<div class="tools-bar" data-tools="{esc(mode)}">
  <label class="tools-bar__search">
    <span class="visually-hidden">Axtar</span>
    <input type="search" data-tools-search placeholder="{esc(search_placeholder)}" autocomplete="off" />
  </label>
  <label class="tools-bar__sort">
    <span>Sırala</span>
    <select data-tools-sort>
      {opts}
    </select>
  </label>
  {images_btn}
  <p class="tools-bar__status" data-tools-status aria-live="polite"></p>
</div>
""".strip()


def build_landing(catalog: dict) -> str:
    cards = []
    for c in catalog["categories"]:
        icon = menu_icon(c["icon"])
        cards.append(
            f"""
<a class="cat-card page-card" href="categories/{esc(c['slug'])}.html" data-title="{esc(c['title'])}" data-blurb="{esc(c['blurb'])}" data-count="{c['count']}">
  <div class="card-icon-wrap" aria-hidden="true">{icon}</div>
  <div class="card-body">
    <h2 class="card-title">{esc(c['title'])}</h2>
    <div class="card-desc">{esc(c['blurb'])}</div>
    <span class="cat-card__meta">{c['count']} hekayə</span>
  </div>
</a>
""".strip()
        )

    tools = tools_bar_html(
        mode="categories",
        search_placeholder="Kateqoriya axtar…",
        sort_options=[
            ("az", "A–Z"),
            ("za", "Z–A"),
            ("count-desc", "Ən çox hekayə"),
            ("count-asc", "Ən az hekayə"),
        ],
    )

    body = f"""
<main>
  <section class="intro">
    <div class="intro__atmosphere" aria-hidden="true"></div>
    <div class="intro__content">
      <div class="intro__copy">
        <h1 class="intro__brand">Bir <span>inci</span></h1>
        <p class="intro__lead">Kateqoriyalara ayrılmış ibrətamiz deyimlər və hekayələr toplusu — hər biri tam mətn və illüstrasiya ilə.</p>
      </div>
      <div class="intro__visual">
        <img src="assets/pearl.webp" alt="" width="602" height="610" decoding="async" />
      </div>
    </div>
  </section>

  <section id="kateqoriyalar" class="section categories">
    <div class="section__head">
      <p>Mövzuya görə seçin; hər səhifədə həmin kateqoriyanın bütün hekayələri var.</p>
    </div>
    {tools}
    <div class="cat-grid" data-tools-list>
      {"".join(cards)}
    </div>
    <p class="tools-empty" data-tools-empty hidden>Uyğun kateqoriya tapılmadı.</p>
  </section>
</main>
"""
    return page_shell(
        title=SITE_NAME,
        description="Bir inci — ibrətamiz deyimlər və hekayələr toplusu.",
        active_slug=None,
        prefix="",
        body=body,
        crumbs=[(SITE_NAME, None)],
        extra_body_class="page-home",
    )


def build_category_page(cat: dict) -> str:
    stories_html = []
    for s in cat["stories"]:
        paras = "".join(f"<p>{esc(p)}</p>" for p in s["paragraphs"])
        img = f"../illustrations/{esc(s['stem'])}.webp"
        stories_html.append(
            f"""
<article class="story news-card" id="{esc(s['stem'])}" data-stem="{esc(s['stem'])}" data-title="{esc(s['title'])}">
  <div class="card-header">
    <h2 class="card-title story__title">{esc(s['title'])}</h2>
  </div>
  <div class="card-body">
    <div class="story__text card-text">
      {paras}
    </div>
    <figure class="story__figure">
      <img src="{img}" alt="{esc(s['title'])} illüstrasiyası" loading="lazy" width="1536" height="1024" />
    </figure>
  </div>
</article>
""".strip()
        )

    nav_items = "\n".join(
        f'<li data-stem="{esc(s["stem"])}" data-title="{esc(s["title"])}">'
        f'<a href="#{esc(s["stem"])}">{esc(s["title"])}</a></li>'
        for s in cat["stories"]
    )
    tools = tools_bar_html(
        mode="stories",
        search_placeholder="Hekayə axtar…",
        sort_options=[
            ("az", "A–Z"),
            ("za", "Z–A"),
        ],
    )
    body = f"""
<main class="category-page">
  <div class="sticky-stack">
  <header class="category-hero">
    <h1>{esc(cat['title'])}</h1>
    <p class="category-hero__lead">{esc(cat['blurb'])} · <span data-tools-count>{cat['count']}</span> hekayə</p>
  </header>
  {tools}
  </div>
  <div class="category-layout">
    <aside class="story-nav sidebar" aria-label="Hekayələr">
      <div class="sidebar-widget">
        <div class="widget-head">
          <span><span aria-hidden="true">📖</span> Hekayələr</span>
          <button type="button" class="events-menu-toggle" aria-controls="storyNavMenu" aria-expanded="false" aria-label="Hekayələr menyusunu aç">
            <span></span><span></span><span></span>
          </button>
        </div>
        <div class="widget-body">
          <nav>
            <ul class="timeline-list" id="storyNavMenu" data-tools-nav>
              {nav_items}
            </ul>
          </nav>
        </div>
      </div>
    </aside>
    <div class="story-list" data-tools-list>
      {"".join(stories_html)}
    </div>
  </div>
  <p class="tools-empty" data-tools-empty hidden>Uyğun hekayə tapılmadı.</p>
</main>
"""
    return page_shell(
        title=f"{cat['title']} · {SITE_NAME}",
        description=cat["blurb"],
        active_slug=cat["slug"],
        prefix="../",
        body=body,
        crumbs=[
            (SITE_NAME, "../index.html"),
            (NAV_LABEL, "../index.html#kateqoriyalar"),
            (cat["title"], None),
        ],
        extra_body_class="page-category",
    )


CSS = r"""
:root {
  /* DAAB activities palette (daab-tokens.css) */
  --ink: #08263b;
  --ink-soft: #345f86;
  --paper: #f5fbff;
  --surface: #ffffff;
  --surface-muted: #eef7fc;
  --nav-blue: #0069b4;
  --nav-blue-deep: #005a9a;
  --nav-blue-soft: #dff2ff;
  --panel-blue: #e5f4fb;
  --panel-blue-deep: #d9eef9;
  --blue-400: #4eb4ee;
  --blue-600: #117fc8;
  --blue-800: #133f63;
  --blue-900: #06314e;
  --blue-soft: #9ed6f5;
  --gold: #c99b3b;
  --gold-soft: #fff0bf;
  --accent: #0069b4;
  --accent-hover: #005a9a;
  --line: rgba(0, 105, 180, 0.18);
  --line-strong: rgba(0, 105, 180, 0.26);
  --ring: rgba(0, 105, 180, 0.28);
  --shadow: 0 12px 32px rgba(0, 78, 140, 0.14);
  --font-display: "Fraunces", Georgia, serif;
  --font-body: "Source Serif 4", Georgia, serif;
  --font-ui: "Figtree", system-ui, sans-serif;
  --max: 1120px;
  --max-wide: 1280px;
  --radius: 16px;
  --radius-sm: 12px;
  --header-h: 4.25rem;
  --breadcrumb-h: 2.7rem;
  --tools-bar-h: 4.5rem;
  --sticky-stack-h: 0rem;
  --tools-sticky-top: calc(var(--header-h) + var(--breadcrumb-h));
  --sticky-stack-bottom: calc(var(--header-h) + var(--breadcrumb-h) + var(--sticky-stack-h));
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-7: 3rem;
}
.page-category {
  --sticky-stack-h: 10.5rem;
  --tools-sticky-top: calc(var(--header-h) + var(--breadcrumb-h));
  --sticky-stack-bottom: calc(var(--header-h) + var(--breadcrumb-h) + var(--sticky-stack-h));
}
.page-home {
  --tools-sticky-top: calc(var(--header-h) + var(--breadcrumb-h));
}

*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: auto; }
html.smooth-scroll { scroll-behavior: smooth; }
html.no-smooth-scroll,
html.no-smooth-scroll * {
  scroll-behavior: auto !important;
}
body {
  margin: 0;
  color: var(--ink);
  background:
    radial-gradient(900px 420px at 8% -8%, rgba(78, 180, 238, 0.18), transparent 60%),
    radial-gradient(700px 380px at 100% 0%, rgba(0, 105, 180, 0.08), transparent 55%),
    linear-gradient(180deg, #eef8ff 0%, var(--paper) 42%, #eef7fc 100%);
  font-family: var(--font-body);
  line-height: 1.55;
  min-height: 100vh;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}
::selection {
  background: rgba(0, 105, 180, 0.18);
  color: var(--ink);
}
img { max-width: 100%; height: auto; display: block; }
a { color: var(--accent); text-decoration-thickness: 1px; text-underline-offset: 0.18em; }
a:hover { color: var(--accent-hover); }
:focus-visible {
  outline: 3px solid var(--gold-soft);
  outline-offset: 2px;
}

.skip-link {
  position: absolute;
  left: 1rem;
  top: -3rem;
  z-index: 100;
  padding: 0.65rem 0.9rem;
  border-radius: 999px;
  background: var(--nav-blue);
  color: #fff;
  font-family: var(--font-ui);
  font-weight: 600;
  text-decoration: none;
}
.skip-link:focus { top: 0.75rem; }

.site-header {
  position: sticky;
  top: 0;
  z-index: 40;
  min-height: var(--header-h);
  background: linear-gradient(180deg, var(--blue-600) 0%, var(--nav-blue) 55%, var(--nav-blue-deep) 100%);
  border-bottom: 3px solid var(--blue-900);
  color: #fff;
}
.site-header__inner {
  max-width: var(--max-wide);
  margin: 0 auto;
  padding: 0.8rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 1rem;
}
.global-search-toggle {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.5rem;
  padding: 0.45rem 0.95rem;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-family: var(--font-ui);
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 160ms ease, border-color 160ms ease;
}
.global-search-toggle:hover,
.global-search-toggle[aria-expanded="true"] {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.8);
}
.global-search-toggle svg { display: block; }
.global-search[hidden] { display: none !important; }
.global-search {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: start center;
  padding: calc(var(--header-h) + 1rem) 1rem 1.5rem;
}
.global-search__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  padding: 0;
  margin: 0;
  background: rgba(8, 38, 59, 0.45);
  cursor: pointer;
}
.global-search__panel {
  position: relative;
  z-index: 1;
  width: min(40rem, 100%);
  max-height: min(78vh, 40rem);
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(0, 105, 180, 0.18);
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(0, 45, 82, 0.28);
  overflow: hidden;
  color: var(--ink);
}
.global-search__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.95rem 1.1rem;
  background: linear-gradient(135deg, var(--blue-900) 0%, var(--nav-blue) 58%, var(--blue-400) 100%);
  border-bottom: 2px solid #f0c75e;
  color: #fff;
}
.global-search__head h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 800;
}
.global-search__close {
  width: 2.2rem;
  height: 2.2rem;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
}
.global-search__field {
  display: block;
  padding: 0.9rem 1.1rem 0.35rem;
}
.global-search__field input {
  width: 100%;
  min-height: 2.7rem;
  padding: 0.55rem 0.9rem;
  border: 1px solid rgba(0, 105, 180, 0.28);
  border-radius: 999px;
  background: var(--panel-blue);
  color: var(--ink);
  font: inherit;
  font-size: 0.98rem;
}
.global-search__field input:focus {
  outline: 3px solid var(--ring);
  outline-offset: 1px;
}
.global-search__status {
  margin: 0;
  padding: 0.25rem 1.2rem 0.55rem;
  font-family: var(--font-ui);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink-soft);
}
.global-search__results {
  padding: 0 0.65rem 0.85rem;
  overflow: auto;
  display: grid;
  gap: 0.35rem;
}
.global-search__item {
  display: block;
  padding: 0.7rem 0.8rem;
  border-radius: 12px;
  text-decoration: none;
  color: var(--ink);
  border: 1px solid transparent;
}
.global-search__item:hover,
.global-search__item:focus-visible {
  background: var(--surface-muted);
  border-color: rgba(0, 105, 180, 0.18);
}
.global-search__item-title {
  display: block;
  font-family: var(--font-ui);
  font-weight: 700;
  font-size: 0.98rem;
  margin-bottom: 0.15rem;
}
.global-search__item-meta {
  display: block;
  font-family: var(--font-ui);
  font-size: 0.82rem;
  color: var(--ink-soft);
}
body.global-search-open { overflow: hidden; }
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.2rem, 2vw, 1.55rem);
  color: #fff;
  text-decoration: none;
  letter-spacing: -0.01em;
}
.brand__logo {
  width: 38px;
  height: 38px;
  object-fit: contain;
  flex: 0 0 auto;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.22);
}
.brand__name { color: #fff; }
.brand:hover { color: #fff; opacity: 0.95; }

.breadcrumbs {
  position: sticky;
  top: var(--header-h);
  z-index: 35;
  background: rgba(238, 248, 255, 0.96);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--line);
}
.breadcrumbs__inner {
  max-width: var(--max-wide);
  margin: 0 auto;
  padding: 0.7rem 1.25rem;
}
.breadcrumbs__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.15rem;
  font-family: var(--font-ui);
  font-size: 0.9rem;
}
.breadcrumbs__item {
  display: inline-flex;
  align-items: center;
  color: var(--ink-soft);
  min-width: 0;
}
.breadcrumbs__item:not(:last-child)::after {
  content: "/";
  margin: 0 0.45rem;
  color: rgba(0, 78, 140, 0.35);
}
.breadcrumbs__item a {
  color: var(--nav-blue);
  text-decoration: none;
  font-weight: 600;
}
.breadcrumbs__item a:hover {
  text-decoration: underline;
  color: var(--nav-blue-deep);
}
.breadcrumbs__item[aria-current="page"] span {
  color: var(--ink);
  font-weight: 600;
  overflow-wrap: anywhere;
}

.nav-dropdown { position: relative; font-family: var(--font-ui); }
.nav-dropdown > summary {
  list-style: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.6rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  transition: background 160ms ease, border-color 160ms ease;
}
.nav-dropdown > summary:hover {
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.75);
}
.nav-dropdown > summary::-webkit-details-marker { display: none; }
.nav-dropdown > summary::after {
  content: "";
  display: inline-block;
  width: 0.45rem;
  height: 0.45rem;
  margin-left: 0.55rem;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: translateY(-0.1rem) rotate(45deg);
  transition: transform 160ms ease;
}
.nav-dropdown[open] > summary::after { transform: translateY(0.1rem) rotate(225deg); }
.nav-dropdown__list {
  position: absolute;
  left: 0;
  top: calc(100% + 0.5rem);
  min-width: min(22rem, 86vw);
  margin: 0;
  padding: 0.5rem;
  list-style: none;
  background: linear-gradient(180deg, #eef8ff 0%, var(--panel-blue) 100%);
  border: 1px solid rgba(0, 105, 180, 0.22);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow);
  max-height: min(70vh, 28rem);
  overflow: auto;
  opacity: 0;
  transform: translateY(-6px);
  animation: drop-in 180ms ease forwards;
  color: var(--ink);
}
.nav-dropdown__list a {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.8rem;
  border-radius: 10px;
  text-decoration: none;
  color: var(--ink);
  font-size: 0.95rem;
  font-weight: 500;
}
.nav-dropdown__list a:hover,
.nav-dropdown__list a.is-active {
  background: rgba(255, 255, 255, 0.72);
  color: var(--nav-blue-deep);
}
.menu-icon {
  --icon-from: #0069b4;
  --icon-to: #4eb4ee;
  --icon-glow: #9ed6f5;
  flex: 0 0 auto;
  width: 2.15rem;
  height: 2.15rem;
  display: inline-grid;
  place-items: center;
  border-radius: 0.7rem;
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0.35) 42%, transparent 43%),
    linear-gradient(145deg, var(--icon-from), var(--icon-to));
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.55) inset,
    0 -2px 4px rgba(0, 0, 0, 0.18) inset,
    0 4px 10px color-mix(in srgb, var(--icon-glow) 55%, transparent),
    0 2px 0 rgba(0, 0, 0, 0.12);
  transform: perspective(120px) rotateX(12deg) translateY(0);
  transition: transform 160ms ease, box-shadow 160ms ease;
}
.menu-icon__svg {
  display: block;
  filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.35)) drop-shadow(0 2px 2px rgba(0, 0, 0, 0.25));
  stroke: #fff;
}
.nav-dropdown__list a:hover .menu-icon,
.nav-dropdown__list a.is-active .menu-icon {
  transform: perspective(120px) rotateX(6deg) translateY(-1px) scale(1.05);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.65) inset,
    0 -2px 4px rgba(0, 0, 0, 0.16) inset,
    0 7px 14px color-mix(in srgb, var(--icon-glow) 65%, transparent),
    0 2px 0 rgba(0, 0, 0, 0.1);
}

@keyframes drop-in {
  to { opacity: 1; transform: translateY(0); }
}
@keyframes rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes intro-fade {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes intro-shine {
  from { transform: translateX(-30%) rotate(12deg); opacity: 0; }
  to { transform: translateX(0) rotate(12deg); opacity: 1; }
}
.intro {
  position: relative;
  isolation: isolate;
  max-width: var(--max-wide);
  margin: 0 auto;
  padding: 1.1rem 1.25rem 0.35rem;
  overflow: hidden;
}
.intro__atmosphere {
  position: absolute;
  top: 0.15rem;
  left: 50%;
  transform: translateX(-50%);
  width: min(56rem, calc(100% - 2.5rem));
  height: min(18rem, 52vw);
  border-radius: 28px;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(ellipse 70% 80% at 12% 20%, rgba(78, 180, 238, 0.28), transparent 60%),
    radial-gradient(ellipse 55% 70% at 88% 10%, rgba(0, 105, 180, 0.18), transparent 58%),
    radial-gradient(ellipse 40% 50% at 70% 85%, rgba(201, 155, 59, 0.14), transparent 55%),
    linear-gradient(135deg, rgba(217, 240, 255, 0.75), rgba(245, 251, 255, 0.35) 55%, rgba(255, 255, 255, 0.15));
  border: 1px solid rgba(158, 214, 245, 0.55);
  box-shadow: 0 24px 60px rgba(0, 78, 140, 0.1);
}
.intro__atmosphere::after {
  content: "";
  position: absolute;
  inset: -20% auto auto -10%;
  width: 55%;
  height: 140%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
  animation: intro-shine 1.1s ease both 180ms;
}
.intro__content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(10rem, 0.8fr);
  align-items: center;
  gap: clamp(0.75rem, 2.5vw, 1.75rem);
  width: 100%;
  max-width: 56rem;
  margin: 0 auto;
  padding: 0.55rem 1.35rem 0.45rem 1.6rem;
  border: 1px solid rgba(0, 105, 180, 0.14);
  border-radius: 28px;
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.92) 0%, rgba(238, 248, 255, 0.88) 100%);
  backdrop-filter: blur(10px);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.85) inset,
    0 18px 40px rgba(0, 78, 140, 0.12);
  animation: intro-fade 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
}
.intro__copy {
  min-width: 0;
  text-align: center;
}
.intro__visual {
  display: grid;
  place-items: center;
  align-self: center;
  margin: 0;
  animation: intro-fade 900ms cubic-bezier(0.22, 1, 0.36, 1) both 160ms;
}
.intro__visual img {
  width: min(100%, 11.5rem);
  height: auto;
  display: block;
  object-fit: contain;
  filter: drop-shadow(0 10px 16px rgba(0, 78, 140, 0.14));
}
.intro__brand {
  font-family: var(--font-display);
  font-size: clamp(2.6rem, 6vw, 4.2rem);
  font-weight: 800;
  margin: 0 0 0.45rem;
  letter-spacing: -0.035em;
  line-height: 1.02;
  color: var(--ink);
  animation: intro-fade 760ms cubic-bezier(0.22, 1, 0.36, 1) both 120ms;
}
.intro__brand span {
  background: linear-gradient(135deg, var(--nav-blue) 10%, var(--blue-400) 55%, #2e9fd4 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.intro__lead {
  margin: 0 auto;
  max-width: 46ch;
  color: var(--ink-soft);
  font-family: var(--font-ui);
  font-size: clamp(1.02rem, 1.6vw, 1.12rem);
  line-height: 1.55;
  animation: intro-fade 820ms cubic-bezier(0.22, 1, 0.36, 1) both 180ms;
}
@media (max-width: 760px) {
  .intro__content {
    grid-template-columns: 1fr;
    padding: 0.85rem 1.2rem 0.75rem;
    gap: 0.45rem;
  }
  .intro__visual {
    margin: 0;
    justify-self: center;
  }
  .intro__visual img {
    width: min(48%, 9.5rem);
  }
  .intro__atmosphere {
    height: min(22rem, 70vw);
  }
}

.section {
  max-width: var(--max);
  margin: 0 auto;
  padding: 2rem 1.25rem 4.5rem;
}
.section__head {
  max-width: 40rem;
  margin-bottom: 1.5rem;
}
.section__head h2 {
  font-family: var(--font-display);
  font-size: clamp(1.7rem, 3vw, 2.3rem);
  margin: 0 0 0.45rem;
  letter-spacing: -0.02em;
}
.section__head p {
  margin: 0;
  color: var(--ink-soft);
  font-family: var(--font-ui);
  font-size: 1rem;
}

.visually-hidden {
  position: absolute !important;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.tools-bar {
  position: sticky;
  top: var(--tools-sticky-top);
  z-index: 30;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1rem;
  margin: 0 0 1.25rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 16px rgba(0, 78, 140, 0.08);
  font-family: var(--font-ui);
}
.page-category .sticky-stack {
  position: sticky;
  top: calc(var(--header-h) + var(--breadcrumb-h));
  z-index: 32;
  background: rgba(245, 251, 255, 0.96);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(0, 105, 180, 0.16);
  padding-bottom: 0.85rem;
  margin-bottom: 1.25rem;
}
.page-category .sticky-stack .category-hero,
.page-category .sticky-stack .tools-bar {
  position: relative;
  top: auto;
  z-index: auto;
  backdrop-filter: none;
  border-bottom: 0;
  margin-bottom: 0;
}
.page-category .tools-bar {
  max-width: var(--max-wide);
  margin-left: auto;
  margin-right: auto;
  width: calc(100% - 2.5rem);
}
.tools-bar__search {
  flex: 1 1 16rem;
  min-width: min(100%, 14rem);
}
.tools-bar__search input {
  width: 100%;
  min-height: 2.6rem;
  padding: 0.55rem 0.85rem;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: var(--surface);
  color: var(--ink);
  font: inherit;
  font-size: 0.95rem;
}
.tools-bar__search input:focus {
  outline: 3px solid var(--ring);
  outline-offset: 1px;
  border-color: rgba(0, 105, 180, 0.45);
}
.tools-bar__sort {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--ink-soft);
  font-size: 0.9rem;
  font-weight: 600;
}
.tools-bar__sort select {
  min-height: 2.6rem;
  padding: 0.45rem 0.8rem;
  border: 1px solid rgba(0, 105, 180, 0.2);
  border-radius: 999px;
  background: var(--panel-blue);
  color: var(--ink);
  font: inherit;
  font-size: 0.92rem;
  font-weight: 600;
}
.tools-bar__images {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.6rem;
  padding: 0.45rem 1rem;
  border: 1px solid rgba(0, 105, 180, 0.22);
  border-radius: 999px;
  background: linear-gradient(135deg, var(--nav-blue), var(--blue-400));
  color: #fff;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(0, 45, 82, 0.14);
  transition: transform 160ms ease, filter 160ms ease, background 160ms ease;
}
.tools-bar__images:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
}
.tools-bar__images[aria-pressed="true"] {
  background: var(--surface);
  color: var(--nav-blue);
  border-color: rgba(0, 105, 180, 0.35);
  box-shadow: none;
}
.tools-bar__status {
  margin: 0;
  margin-left: auto;
  font-size: 0.85rem;
  color: var(--ink-soft);
  font-weight: 600;
}
.tools-empty {
  margin: 1rem 0 0;
  padding: 1rem 1.1rem;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius-sm);
  background: var(--surface-muted);
  color: var(--ink-soft);
  font-family: var(--font-ui);
  text-align: center;
}
.page-category .tools-empty {
  max-width: var(--max-wide);
  margin-left: auto;
  margin-right: auto;
  width: calc(100% - 2.5rem);
}
[hidden] { display: none !important; }

/* DAAB home page-card parity */
.cat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  align-items: stretch;
}
@media (max-width: 1180px) {
  .cat-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 920px) {
  .cat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 620px) {
  .cat-grid { grid-template-columns: 1fr; }
  .site-header__inner { flex-wrap: wrap; }
}

.cat-card.page-card {
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr) auto;
  column-gap: 12px;
  row-gap: 0;
  min-height: 0;
  height: 100%;
  padding: 16px 16px 12px;
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid var(--blue-soft);
  background: rgba(245, 251, 255, 0.96);
  box-shadow: var(--shadow);
  text-decoration: none;
  color: inherit;
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}
.cat-card.page-card::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: 0;
  background: linear-gradient(135deg, rgba(46, 159, 212, 0.12), transparent 52%, rgba(200, 155, 56, 0.13));
  transition: opacity 0.25s ease;
}
.cat-card.page-card::after {
  content: "";
  position: absolute;
  right: -50px;
  top: -50px;
  z-index: -1;
  width: 130px;
  height: 130px;
  background: rgba(46, 159, 212, 0.09);
  border-radius: 50%;
  transition: transform 0.25s ease;
}
.cat-card.page-card:hover {
  transform: translateY(-7px);
  border-color: var(--blue-400);
  box-shadow: 0 20px 45px rgba(0, 78, 140, 0.2);
}
.cat-card.page-card:hover::before { opacity: 1; }
.cat-card.page-card:hover::after { transform: scale(1.25); }
.cat-card .card-icon-wrap {
  grid-column: 1;
  grid-row: 1 / 4;
  align-self: start;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin: 0;
  background: linear-gradient(135deg, #d9f0ff, #fff);
  border: 1px solid var(--blue-soft);
  border-radius: 18px;
  box-shadow: inset 0 1px 0 #fff, 0 10px 22px rgba(0, 105, 180, 0.16);
}
.cat-card .card-icon-wrap .menu-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.55rem;
  transform: none;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.55) inset,
    0 -1px 3px rgba(0, 0, 0, 0.16) inset,
    0 3px 8px color-mix(in srgb, var(--icon-glow) 50%, transparent);
}
.cat-card .card-icon-wrap .menu-icon__svg {
  width: 16px;
  height: 16px;
}
.cat-card .card-body {
  display: contents;
}
.cat-card .card-title {
  grid-column: 2;
  grid-row: 1;
  margin: 0 0 8px;
  color: var(--nav-blue-deep);
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 800;
  line-height: 1.28;
  letter-spacing: -0.01em;
}
.cat-card .card-desc {
  grid-column: 2;
  grid-row: 2;
  align-self: start;
  margin: 0;
  color: var(--ink-soft);
  font-family: var(--font-ui);
  font-size: 14.5px;
  line-height: 1.48;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}
.cat-card__meta {
  grid-column: 2;
  grid-row: 3;
  justify-self: start;
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  min-height: 1.55rem;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  border: 1px solid rgba(0, 105, 180, 0.16);
  background: rgba(255, 255, 255, 0.85);
  font-family: var(--font-ui);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--nav-blue);
  white-space: nowrap;
}

.category-page { padding-bottom: 3rem; }
.category-hero {
  width: 100%;
  margin: 0;
  padding: 0.95rem max(1.25rem, calc((100% - var(--max-wide)) / 2 + 1.25rem)) 0.8rem;
  background: transparent;
  animation: intro-fade 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
}
.eyebrow {
  font-family: var(--font-ui);
  font-size: 0.85rem;
  margin: 0 0 0.55rem;
}
.eyebrow a {
  text-decoration: none;
  color: var(--accent);
  font-weight: 600;
}
.category-hero h1 {
  font-family: var(--font-display);
  font-size: clamp(1.55rem, 3.2vw, 2.15rem);
  margin: 0 0 0.35rem;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: var(--ink);
  background: linear-gradient(135deg, var(--ink) 0%, var(--nav-blue-deep) 55%, var(--nav-blue) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.category-hero__lead {
  margin: 0;
  color: var(--ink-soft);
  font-family: var(--font-ui);
  max-width: 58ch;
  font-size: 0.95rem;
  line-height: 1.4;
}

.category-layout {
  max-width: var(--max-wide);
  margin: 0 auto;
  padding: 0 1.25rem 2rem;
  display: grid;
  grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
  gap: 28px;
  align-items: start;
  overflow: visible;
}
/* DAAB News sidebar widget parity (activities.html) */
.story-nav.sidebar {
  position: sticky;
  top: calc(var(--sticky-stack-bottom) + 12px);
  align-self: start;
  width: 100%;
  max-height: calc(100vh - var(--sticky-stack-bottom) - 28px);
  overflow: visible;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}
.story-nav .sidebar-widget {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: calc(100vh - var(--sticky-stack-bottom) - 28px);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(0, 105, 180, 0.18);
  border-radius: 14px;
  box-shadow: 0 14px 28px rgba(0, 45, 82, 0.10);
}
.story-nav .widget-head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  background: linear-gradient(135deg, var(--ink) 0%, var(--nav-blue-deep) 58%, #2e9fd4 100%);
  border-bottom: 2px solid #f0c75e;
  color: #fff;
  font-family: var(--font-display);
  font-size: 12.6px;
  font-weight: 800;
  letter-spacing: 0.01em;
}
.story-nav .widget-head > span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.story-nav .events-menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  width: 44px;
  height: 44px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 8px;
  cursor: pointer;
}
.story-nav .events-menu-toggle span {
  display: block;
  width: 100%;
  height: 2px;
  background: #fff;
  border-radius: 999px;
}
.story-nav .widget-body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 16px 20px;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #2e9fd4 #e8eef5;
}
.story-nav .widget-body::-webkit-scrollbar { width: 6px; }
.story-nav .widget-body::-webkit-scrollbar-track { background: #e8eef5; border-radius: 3px; }
.story-nav .widget-body::-webkit-scrollbar-thumb { background: #2e9fd4; border-radius: 3px; }
.story-nav .widget-body::-webkit-scrollbar-thumb:hover { background: #1a6fa8; }
.story-nav .timeline-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.story-nav .timeline-list li {
  display: flex;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(0, 45, 82, 0.08);
  font-family: var(--font-ui);
  font-size: 15px;
  line-height: 1.3;
  color: #345d76;
  transition: color 0.18s ease;
}
.story-nav .timeline-list li:last-child { border-bottom: none; }
.story-nav .timeline-list li:hover { color: var(--nav-blue); }
.story-nav .timeline-list a {
  flex: 1 1 auto;
  min-width: 0;
  display: block;
  margin: -2px -6px;
  padding: 2px 6px;
  color: inherit;
  background: transparent;
  border-radius: 10px;
  font-family: var(--font-ui);
  font-size: 15px;
  font-weight: 500;
  line-height: 1.3;
  text-decoration: none !important;
  border: 0;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.story-nav .timeline-list a:hover,
.story-nav .timeline-list a:focus-visible,
.story-nav .timeline-list a.is-active {
  color: var(--nav-blue) !important;
  background: var(--surface-muted) !important;
  text-decoration: none !important;
}
.story-nav .timeline-list a.is-active {
  font-weight: 700;
}

.story-list {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}
/* DAAB News feed card parity (activities.html) */
.story.news-card {
  scroll-margin-top: calc(var(--sticky-stack-bottom) + 28px);
  margin: 0 0 26px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(0, 105, 180, 0.18);
  border-radius: 24px;
  box-shadow: var(--shadow);
  overflow: hidden;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
.story.news-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 45px rgba(0, 78, 140, 0.2);
  border-color: rgba(78, 180, 238, 0.42);
}
.story .card-header {
  padding: 20px 28px 14px;
  background: linear-gradient(135deg, var(--blue-900) 0%, var(--nav-blue) 58%, var(--blue-400) 100%);
  border-bottom: 2px solid #f0c75e;
  text-align: center;
}
.story .card-title,
.story__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(14px, 1.54vw, 19.6px);
  font-weight: 800;
  letter-spacing: -0.015em;
  line-height: 1.38;
  color: #fff;
  background: none;
  padding: 0;
  border-radius: 0;
  box-shadow: none;
}
.story .card-body {
  padding: 14px 28px 26px;
  line-height: 1.45;
}
.story .card-body > :first-child {
  margin-top: 0;
}
.story__text,
.story .card-text {
  width: 100%;
  max-width: none;
  margin: 0;
  color: var(--ink-soft);
  font-family: var(--font-ui);
  font-size: 15px;
  line-height: 1.15;
  text-align: justify;
  text-justify: inter-word;
  hyphens: auto;
}
.story__text p,
.story .card-text p {
  margin: 0 0 0.2rem;
  font-size: inherit;
  line-height: inherit;
  text-align: justify;
  text-justify: inter-word;
  hyphens: auto;
}
.story__text p:last-child,
.story .card-text p:last-child {
  margin-bottom: 0;
}
.story__figure {
  margin: 18px 0 0;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(0, 105, 180, 0.14);
  background: #fff;
  padding: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transition: opacity 160ms ease, max-height 220ms ease, margin 160ms ease, padding 160ms ease;
}
.story__figure img {
  width: 100%;
  height: auto;
  max-width: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
  border-radius: 10px;
}
body.images-collapsed .story__figure {
  display: none;
}
@media (max-width: 760px) {
  .story .card-header,
  .story .card-body {
    padding-left: 18px;
    padding-right: 18px;
  }
  .story .card-title,
  .story__title {
    font-size: clamp(14px, 4.2vw, 17px);
  }
}

@media (max-width: 1060px) {
  .category-layout {
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  .story-nav.sidebar {
    position: static;
    top: auto;
    max-height: none;
    order: 0;
    z-index: 30;
  }
  .story-list { order: 1; }
  .story-nav .sidebar-widget {
    max-height: none;
    overflow: hidden;
    border-radius: 18px;
  }
  .story-nav .widget-head {
    min-height: 58px;
  }
  .story-nav .events-menu-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 44px;
    height: 42px;
    min-width: 44px;
  }
  .story-nav .sidebar-widget:not(.events-open) .widget-body {
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    overflow: hidden;
  }
  .story-nav .sidebar-widget.events-open .widget-body {
    max-height: min(62vh, 520px);
    padding: 12px 16px;
    overflow-y: auto;
  }
  .story-nav .timeline-list a {
    min-height: 44px;
    padding: 10px 12px;
    margin: -6px -8px;
    line-height: 1.35;
  }
}
@media (max-width: 720px) {
  .story-nav .widget-head {
    padding: 12px 16px;
    font-size: 16px;
  }
  .story-nav .timeline-list li {
    gap: 10px;
    font-size: 14px;
  }
}

.back-to-top {
  position: fixed;
  right: 1.25rem;
  bottom: 1.25rem;
  z-index: 50;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  padding: 0;
  border-radius: 999px;
  border: 1px solid rgba(0, 105, 180, 0.28);
  background: var(--nav-blue);
  color: #fff;
  text-decoration: none;
  box-shadow: 0 8px 24px rgba(0, 78, 140, 0.18);
  transition: transform 160ms ease, background 160ms ease;
}
.back-to-top::before {
  content: "";
  width: 0.7rem;
  height: 0.7rem;
  border-top: 2.5px solid currentColor;
  border-left: 2.5px solid currentColor;
  transform: translateY(0.18rem) rotate(45deg);
}
.back-to-top:hover {
  transform: translateY(-2px);
  background: var(--nav-blue-deep);
  color: #fff;
}
@media (max-width: 620px) {
  .back-to-top {
    right: 0.85rem;
    bottom: 0.85rem;
    width: 2.75rem;
    height: 2.75rem;
  }
}

.site-footer {
  margin-top: auto;
  border-top: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(238, 248, 255, 0.72), rgba(229, 244, 251, 0.9));
  padding: 1.6rem 1.25rem 2.2rem;
  font-family: var(--font-ui);
  color: var(--ink-soft);
}
.site-footer__inner {
  max-width: var(--max-wide);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  text-align: center;
}
.site-footer__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--ink);
  font-weight: 700;
  font-family: var(--font-display);
}
.site-footer__brand img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--nav-blue-soft);
}
.site-footer p { margin: 0; font-size: 0.9rem; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
"""

JS = r"""
(() => {
  const dropdown = document.querySelector(".nav-dropdown");
  if (dropdown) {
    document.addEventListener("click", (event) => {
      if (!dropdown.open) return;
      if (!dropdown.contains(event.target)) dropdown.open = false;
    });
    dropdown.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        dropdown.open = false;
      });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") dropdown.open = false;
    });
  }

  const backToTop = document.getElementById("back-to-top");
  if (backToTop) {
    backToTop.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const html = document.documentElement;
      html.classList.add("no-smooth-scroll");
      html.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      window.scrollTo(0, 0);
      history.replaceState(null, "", window.location.pathname + window.location.search);
      requestAnimationFrame(() => {
        html.classList.remove("no-smooth-scroll");
      });
    });
  }

  const initGlobalSearch = () => {
    const root = document.getElementById("global-search");
    const toggle = document.getElementById("global-search-toggle");
    const input = document.getElementById("global-search-input");
    const results = document.getElementById("global-search-results");
    const status = document.getElementById("global-search-status");
    if (!root || !toggle || !input || !results) return;

    let index = null;
    let loading = null;
    let lastQuery = "";

    const closeSearch = () => {
      root.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("global-search-open");
    };

    const openSearch = () => {
      root.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("global-search-open");
      window.setTimeout(() => input.focus(), 20);
      ensureIndex();
    };

    const ensureIndex = () => {
      if (index || loading) return loading;
      if (Array.isArray(window.__BIRINCI_SEARCH__)) {
        index = window.__BIRINCI_SEARCH__;
        if (status) status.textContent = `${index.length} hekayə`;
        if (lastQuery) render(lastQuery);
        return Promise.resolve(index);
      }
      const url = root.getAttribute("data-search-index");
      if (!url) return null;
      if (status) status.textContent = "İndeks yüklənir…";
      loading = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.async = true;
        script.onload = () => {
          if (Array.isArray(window.__BIRINCI_SEARCH__)) resolve(window.__BIRINCI_SEARCH__);
          else reject(new Error("empty-index"));
        };
        script.onerror = () => reject(new Error("script-error"));
        document.head.appendChild(script);
      })
        .then((rows) => {
          index = rows || [];
          if (status) status.textContent = lastQuery ? status.textContent : `${index.length} hekayə`;
          if (lastQuery) render(lastQuery);
        })
        .catch(() => {
          index = [];
          if (status) {
            status.textContent =
              "Axtarış indeksi yüklənmədi. Saytı http://localhost:8765/az/ ünvanından açın.";
          }
        })
        .finally(() => {
          loading = null;
        });
      return loading;
    };

    const render = (query) => {
      lastQuery = query;
      const q = query.trim().toLocaleLowerCase("az");
      results.innerHTML = "";
      if (!q) {
        if (status) status.textContent = index ? `${index.length} hekayə` : "";
        return;
      }
      if (!index) {
        if (status) status.textContent = "İndeks yüklənir…";
        return;
      }
      const matches = index.filter((row) => row.hay.includes(q)).slice(0, 40);
      if (status) {
        status.textContent = matches.length
          ? `${matches.length} nəticə`
          : "Uyğun hekayə tapılmadı.";
      }
      const inCategories = window.location.pathname.includes("/categories/");
      matches.forEach((row) => {
        const a = document.createElement("a");
        a.className = "global-search__item";
        a.href = inCategories
          ? `${encodeURIComponent(row.slug)}.html#${encodeURIComponent(row.stem)}`
          : `categories/${encodeURIComponent(row.slug)}.html#${encodeURIComponent(row.stem)}`;
        a.innerHTML =
          `<span class="global-search__item-title"></span>` +
          `<span class="global-search__item-meta"></span>`;
        a.querySelector(".global-search__item-title").textContent = row.title;
        a.querySelector(".global-search__item-meta").textContent = row.category;
        a.addEventListener("click", closeSearch);
        results.appendChild(a);
      });
    };

    toggle.addEventListener("click", () => {
      if (root.hidden) openSearch();
      else closeSearch();
    });
    root.querySelectorAll("[data-global-search-close]").forEach((el) => {
      el.addEventListener("click", closeSearch);
    });
    input.addEventListener("input", () => render(input.value));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !root.hidden) {
        closeSearch();
        toggle.focus();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }
    });
  };

  initGlobalSearch();

  const localeCompareAz = (a, b) =>
    String(a || "").localeCompare(String(b || ""), "az", { sensitivity: "base" });

  const initTools = () => {
    const bar = document.querySelector("[data-tools]");
    if (!bar) return;
    const mode = bar.getAttribute("data-tools");
    const searchInput = bar.querySelector("[data-tools-search]");
    const sortSelect = bar.querySelector("[data-tools-sort]");
    const status = bar.querySelector("[data-tools-status]");
    const empty = document.querySelector("[data-tools-empty]");
    const list = document.querySelector("[data-tools-list]");
    const imagesBtn = bar.querySelector("[data-tools-images]");
    const imagesLabel = bar.querySelector("[data-tools-images-label]");
    if (!searchInput || !sortSelect || !list) return;

    if (imagesBtn && mode === "stories") {
      const storageKey = "birinci-images-collapsed";
      const applyImagesState = (collapsed) => {
        document.body.classList.toggle("images-collapsed", collapsed);
        imagesBtn.setAttribute("aria-pressed", collapsed ? "true" : "false");
        if (imagesLabel) {
          imagesLabel.textContent = collapsed ? "Şəkilləri göstər" : "Şəkilləri gizlət";
        }
        try {
          localStorage.setItem(storageKey, collapsed ? "1" : "0");
        } catch (_) {}
      };
      let collapsed = false;
      try {
        collapsed = localStorage.getItem(storageKey) === "1";
      } catch (_) {}
      applyImagesState(collapsed);
      imagesBtn.addEventListener("click", () => {
        applyImagesState(!document.body.classList.contains("images-collapsed"));
      });
    }

    const applyCategories = () => {
      const q = searchInput.value.trim().toLocaleLowerCase("az");
      const sort = sortSelect.value;
      const items = Array.from(list.querySelectorAll(".cat-card"));
      items.sort((a, b) => {
        if (sort === "count-desc" || sort === "count-asc") {
          const ca = Number(a.dataset.count || 0);
          const cb = Number(b.dataset.count || 0);
          return sort === "count-desc" ? cb - ca : ca - cb;
        }
        const cmp = localeCompareAz(a.dataset.title, b.dataset.title);
        return sort === "za" ? -cmp : cmp;
      });
      items.forEach((item) => list.appendChild(item));

      let visible = 0;
      items.forEach((item) => {
        const hay = `${item.dataset.title || ""} ${item.dataset.blurb || ""}`.toLocaleLowerCase("az");
        const show = !q || hay.includes(q);
        item.hidden = !show;
        if (show) visible += 1;
      });
      if (status) status.textContent = `${visible} / ${items.length}`;
      if (empty) empty.hidden = visible !== 0;
    };

    const applyStories = () => {
      const q = searchInput.value.trim().toLocaleLowerCase("az");
      const sort = sortSelect.value;
      const stories = Array.from(list.querySelectorAll(".story"));
      const navList = document.querySelector("[data-tools-nav]");
      const navItems = navList ? Array.from(navList.querySelectorAll("li[data-stem]")) : [];
      const countEl = document.querySelector("[data-tools-count]");

      stories.sort((a, b) => {
        const cmp = localeCompareAz(a.dataset.title, b.dataset.title);
        return sort === "za" ? -cmp : cmp;
      });
      stories.forEach((story) => list.appendChild(story));

      if (navList) {
        navItems.sort((a, b) => {
          const cmp = localeCompareAz(a.dataset.title, b.dataset.title);
          return sort === "za" ? -cmp : cmp;
        });
        navItems.forEach((item) => navList.appendChild(item));
      }

      let visible = 0;
      stories.forEach((story) => {
        const textEl = story.querySelector(".story__text");
        const hay = `${story.dataset.title || ""} ${textEl ? textEl.textContent : ""}`.toLocaleLowerCase("az");
        const show = !q || hay.includes(q);
        story.hidden = !show;
        if (show) visible += 1;
        const navItem = navItems.find((li) => li.dataset.stem === story.dataset.stem);
        if (navItem) navItem.hidden = !show;
      });

      if (status) status.textContent = `${visible} / ${stories.length}`;
      if (countEl) countEl.textContent = String(visible);
      if (empty) empty.hidden = visible !== 0;
    };

    const apply = () => {
      if (mode === "categories") applyCategories();
      else applyStories();
    };

    searchInput.addEventListener("input", apply);
    sortSelect.addEventListener("change", apply);
    apply();
  };

  initTools();

  const nav = document.querySelector(".story-nav");
  if (!nav) return;

  const widget = nav.querySelector(".sidebar-widget");
  const toggle = nav.querySelector(".events-menu-toggle");
  const mobileQuery = window.matchMedia("(max-width: 1060px)");

  const closeMenu = () => {
    if (!widget || !toggle) return;
    widget.classList.remove("events-open");
    toggle.setAttribute("aria-expanded", "false");
  };
  const toggleMenu = () => {
    if (!widget || !toggle) return;
    const open = widget.classList.toggle("events-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  };
  if (toggle) {
    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleMenu();
    });
  }
  mobileQuery.addEventListener("change", () => {
    if (!mobileQuery.matches) closeMenu();
  });

  const refreshSpyTargets = () => {
    const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
    return links
      .map((link) => {
        const id = decodeURIComponent(link.getAttribute("href").slice(1));
        const el = document.getElementById(id);
        return el ? { link, el } : null;
      })
      .filter(Boolean);
  };

  let storyPairs = refreshSpyTargets();
  if (!storyPairs.length) return;

  const setActive = (activeLink) => {
    nav.querySelectorAll("a").forEach((link) => {
      link.classList.toggle("is-active", link === activeLink);
    });
  };

  nav.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = decodeURIComponent((link.getAttribute("href") || "").slice(1));
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      setActive(link);
      const html = document.documentElement;
      const prevBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";
      target.scrollIntoView({ block: "start", behavior: "auto" });
      html.style.scrollBehavior = prevBehavior;
      history.pushState(null, "", `#${id}`);
      if (mobileQuery.matches) closeMenu();
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const match = storyPairs.find((s) => s.el === visible.target);
      if (match) setActive(match.link);
    },
    { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.25, 0.5] }
  );
  storyPairs.forEach(({ el }) => observer.observe(el));
})();
"""


def main() -> int:
    print("Extracting stories…")
    catalog = load_catalog()
    total = sum(c["count"] for c in catalog["categories"])
    print(f"categories={len(catalog['categories'])} stories={total}")

    DATA_JSON.parent.mkdir(parents=True, exist_ok=True)
    # Slim JSON for potential future use (no need to duplicate huge if unused)
    slim = {
        "site_title": catalog["site_title"],
        "categories": [
            {
                "title": c["title"],
                "slug": c["slug"],
                "blurb": c["blurb"],
                "count": c["count"],
                "stories": [
                    {"stem": s["stem"], "title": s["title"], "paragraphs": s["paragraphs"]}
                    for s in c["stories"]
                ],
            }
            for c in catalog["categories"]
        ],
    }
    DATA_JSON.write_text(json.dumps(slim, ensure_ascii=False, indent=2), encoding="utf-8")

    search_rows = []
    for c in catalog["categories"]:
        for s in c["stories"]:
            text = " ".join(s["paragraphs"])
            search_rows.append(
                {
                    "title": s["title"],
                    "stem": s["stem"],
                    "category": c["title"],
                    "slug": c["slug"],
                    "hay": f'{s["title"]} {c["title"]} {text}'.casefold(),
                }
            )
    search_js = (
        "window.__BIRINCI_SEARCH__ = "
        + json.dumps(search_rows, ensure_ascii=False)
        + ";\n"
    )

    ASSETS.mkdir(parents=True, exist_ok=True)
    (ASSETS / "search-index.js").write_text(search_js, encoding="utf-8")
    (ASSETS / "site.css").write_text(CSS, encoding="utf-8")
    (ASSETS / "site.js").write_text(JS, encoding="utf-8")

    PAGES_DIR.mkdir(parents=True, exist_ok=True)
    (AZ_ROOT / "index.html").write_text(build_landing(catalog), encoding="utf-8")

    for cat in catalog["categories"]:
        path = PAGES_DIR / f"{cat['slug']}.html"
        path.write_text(build_category_page(cat), encoding="utf-8")
        print(f"  wrote {path.name} ({cat['count']})")

    # Root redirect into az/
    (SITE_ROOT / "index.html").write_text(
        """<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0; url=az/" />
  <link rel="canonical" href="az/" />
  <title>Bir inci</title>
  <script>location.replace("az/");</script>
</head>
<body>
  <p><a href="az/">Bir inci</a></p>
</body>
</html>
""",
        encoding="utf-8",
    )

    print(f"landing: {AZ_ROOT / 'index.html'}")
    print(f"root: {SITE_ROOT / 'index.html'}")
    print(f"data: {DATA_JSON}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
