# -*- coding: utf-8 -*-
"""Durable chrome restores wiped by bytecode rebuilds of site.css / site.js / HTML."""
from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOLS = Path(__file__).resolve().parent

# Import brand-one helper from same package dir
import sys

if str(TOOLS) not in sys.path:
    sys.path.insert(0, str(TOOLS))
from brand_one_mark import ensure_brand_one_mark  # noqa: E402

# User asked to remove Discovery videos; keep MP4s on disk but never emit UI.
DISABLE_DISCOVERY_VIDEOS = True

# Top navbar stubs with no content yet — remove until sections are ready.
# Re-enable by setting False (or removing specific keys) then rebuilding.
HIDE_TOP_NAV = {
    "science": True,  # Biliklər / Knowledge
    "arts": True,  # İncəsənət / Arts
    "figures": True,  # Tanınmış şəxsiyyətlər / Notable figures
    "support": True,  # Bizi dəstəkləyin / Support us
}

PAGE_JUMP_NAV = {
    "az": "Səhifə naviqasiyası",
    "en": "Page navigation",
    "ru": "Навигация по странице",
    "ky": "Барак навигациясы",
    "tr": "Sayfa gezintisi",
}

GO_TO_BOTTOM = {
    "az": "Səhifənin aşağısına get",
    "en": "Go to bottom of page",
    "ru": "Вниз страницы",
    "ky": "Барактын аягына өтүү",
    "tr": "Sayfanın sonuna git",
}

BACK_TO_TOP = {
    "az": "Səhifənin yuxarısına qayıt",
    "en": "Back to top",
    "ru": "Наверх",
    "ky": "Барактын башына кайтуу",
    "tr": "Sayfanın başına dön",
}

NAV_STORIES_ALL = {
    "az": "Hamısı",
    "en": "All",
    "ru": "Все",
    "ky": "Баары",
    "tr": "Tümü",
}

NAV_STORIES_BY_CATEGORY = {
    "az": "Kateqoriya üzrə",
    "en": "By Category",
    "ru": "По категориям",
    "ky": "Категория боюнча",
    "tr": "Kategoriye göre",
}

# Former Literature top-nav labels → stories-section name in each language.
OLD_NAV_LITERATURE = {
    "az": "Ədəbiyyat",
    "en": "Literature",
    "ru": "Литература",
    "ky": "Адабият",
    "tr": "Edebiyat",
}
NAV_LITERATURE_LABEL = {
    "az": "İbrətamiz hekayələr",
    "en": "Wisdom stories",
    "ru": "Нравоучительные рассказы",
    "ky": "Үлгүлүү аңгемелер",
    "tr": "İbret verici hikâyeler",
}
_LIT_NAV_SPAN_RE = re.compile(
    r'(<details class="nav-dropdown nav-dropdown--literature">[\s\S]*?'
    r'<summary class="nav-dropdown__summary">[\s\S]*?</svg></span>\s*<span>)'
    r'([^<]*)'
    r'(</span>)',
    re.I,
)
_LIT_CRUMB_DUP_RE = re.compile(
    r'(<li class="breadcrumbs__item"><a href="[^"]*#kateqoriyalar">)'
    r'([^<]+)'
    r'(</a></li>)'
    r'(<li class="breadcrumbs__item"><a href="[^"]*#kateqoriyalar">)'
    r'([^<]+)'
    r'(</a></li>)',
    re.I,
)

_NESTED_STORIES_OPEN_RE = re.compile(
    r'(<div class="nav-dropdown--nested nav-dropdown--has-mega[^"]*" '
    r'data-nav-branch="stories">)'
)
_TOGGLE_COPY_RE = re.compile(
    r'(<span class="nav-dropdown-toggle__copy">\s*'
    r'<span class="nav-dropdown-link-title">)([^<]*)(</span>\s*)'
    r'(?:<span class="nav-dropdown-link-desc">[\s\S]*?</span>\s*)?',
)
_ALL_LINK_RE = re.compile(
    r'(<a class="nav-dropdown-link" href=")([^"]*)(" data-nav-stories-all>'
    r'[\s\S]*?<span class="nav-dropdown-link-title">)([^<]*)(</span>)',
)
_LIT_PANEL_LINK_CSS = """
.nav-dropdown--literature > .nav-dropdown-panel > .nav-dropdown-link {
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding: 8px;
}
.nav-dropdown--literature > .nav-dropdown-panel > .nav-dropdown-link .nav-dropdown-link-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: inherit;
}
"""

# Leftmost footer panel copy (do not reuse stories intro_lead).
FOOTER_ABOUT_SHORT = {
    "az": (
        "Biz bəşəriyyətin əsrlər boyu topladığı bilikləri və mənəvi irsi qoruyaraq "
        "gələcək nəsillərə çatdıran platformayıq. Böyük kəşflərdən ibrətamiz "
        "hekayələrədək sizi öyrənməyə, düşünməyə və ilham almağa dəvət edirik."
    ),
    "en": (
        "We are a platform dedicated to preserving the knowledge and wisdom humanity "
        "has accumulated over centuries and passing this legacy on to future generations. "
        "From groundbreaking discoveries to stories rich in wisdom, we invite you to learn, "
        "reflect, and be inspired."
    ),
    "ru": (
        "Мы сохраняем накопленные человечеством знания и духовное наследие, чтобы "
        "передать их будущим поколениям. От великих открытий до мудрых, поучительных "
        "историй — приглашаем вас узнавать новое, размышлять и вдохновляться."
    ),
    "ky": (
        "Биз адамзат кылымдар бою топтогон билимди жана руханий мурасты сактап, "
        "келечек муундарга жеткирген платформабыз. Улуу ачылыштардан таалимдүү "
        "окуяларга чейин сиздерди жаңы нерселерди үйрөнүүгө, ой жүгүртүүгө жана "
        "шыктанууга чакырабыз."
    ),
}

DISCOVERIES_HERO = {
    "az": (
        "Bu səhifədə bəşəriyyətin elm, mədəniyyət və mənəvi irsi haqqında məlumatlar "
        "təqdim olunur. Niyyətimiz bu dəyərli irsi qoruyub gələcək nəsillərə çatdırmaqdır."
    ),
    "en": (
        "This page presents information about humanity’s scientific, cultural, and moral "
        "heritage. Our aim is to preserve this valuable heritage and pass it on to future "
        "generations."
    ),
    "ru": (
        "На этой странице представлены сведения о научном, культурном и духовном наследии "
        "человечества. Наша цель — сохранить это ценное наследие и передать его будущим "
        "поколениям."
    ),
    "ky": (
        "Бул баракта адамзаттын илимий, маданий жана адеп-ахлактык мурасы жөнүндө маалымат "
        "берилет. Максатыбыз — бул баалуу мурасты сактоо жана келечек муундарга жеткирүү."
    ),
}

_GO_BOTTOM_JS = r'''
  const goToBottom = document.getElementById("go-to-bottom");
  if (goToBottom) {
    goToBottom.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const html = document.documentElement;
      const footer = document.getElementById("site-footer") || document.querySelector("footer.footer-pro, footer");
      html.classList.add("no-smooth-scroll");
      if (footer) {
        const top = Math.round(footer.getBoundingClientRect().top + window.pageYOffset);
        html.scrollTop = top;
        if (document.body) document.body.scrollTop = top;
        window.scrollTo(0, top);
      } else {
        const max = Math.max(html.scrollHeight, document.body ? document.body.scrollHeight : 0);
        window.scrollTo(0, max);
      }
      history.replaceState(null, "", window.location.pathname + window.location.search);
      requestAnimationFrame(() => {
        html.classList.remove("no-smooth-scroll");
      });
    });
  }
'''

_BACK_TO_TOP_BLOCK_RE = re.compile(
    r"\.back-to-top \{\n"
    r"  position: fixed;\n"
    r"  right: 1\.25rem;\n"
    r"  bottom: 1\.25rem;\n"
    r"  z-index: 50;\n"
    r"  display: inline-flex;\n"
    r"  align-items: center;\n"
    r"  justify-content: center;\n"
    r"  width: 3rem;\n"
    r"  height: 3rem;\n"
    r"  padding: 0;\n"
    r"  border-radius: var\(--radius-pill\);\n"
    r"  border: 1px solid rgba\(0, 105, 180, 0\.28\);\n"
    r"  background: var\(--nav-blue\);\n"
    r"  color: #fff;\n"
    r"  text-decoration: none;\n"
    r"  box-shadow: 0 8px 24px rgba\(0, 78, 140, 0\.18\);\n"
    r"  transition: transform 160ms ease, background 160ms ease;\n"
    r"\}\n"
    r"\.back-to-top::before \{\n"
    r"  content: \"\";\n"
    r"  width: 0\.7rem;\n"
    r"  height: 0\.7rem;\n"
    r"  border-top: 2\.5px solid currentColor;\n"
    r"  border-left: 2\.5px solid currentColor;\n"
    r"  transform: translateY\(0\.18rem\) rotate\(45deg\);\n"
    r"\}\n"
    r"\.back-to-top:hover \{\n"
    r"  transform: translateY\(-2px\);\n"
    r"  background: var\(--nav-blue-deep\);\n"
    r"  color: #fff;\n"
    r"\}\n"
    r"@media \(max-width: 620px\) \{\n"
    r"  \.back-to-top \{\n"
    r"    right: 0\.85rem;\n"
    r"    bottom: 0\.85rem;\n"
    r"    width: 2\.75rem;\n"
    r"    height: 2\.75rem;\n"
    r"  \}\n"
    r"\}",
)

_PAGE_JUMP_CORE = """\
.page-jump {
  position: fixed;
  right: 1.25rem;
  bottom: 1.25rem;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.back-to-top,
.go-to-bottom {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  padding: 0;
  border-radius: var(--radius-pill);
  border: 1px solid rgba(0, 105, 180, 0.28);
  background: var(--nav-blue);
  color: #fff;
  text-decoration: none;
  box-shadow: 0 8px 24px rgba(0, 78, 140, 0.18);
  transition: transform 160ms ease, background 160ms ease;
}
.back-to-top::before,
.go-to-bottom::before {
  content: "";
  width: 0.7rem;
  height: 0.7rem;
  border-top: 2.5px solid currentColor;
  border-left: 2.5px solid currentColor;
}
.back-to-top::before {
  transform: translateY(0.18rem) rotate(45deg);
}
.go-to-bottom::before {
  transform: translateY(-0.12rem) rotate(225deg);
}
.back-to-top:hover,
.go-to-bottom:hover {
  transform: translateY(-2px);
  background: var(--nav-blue-deep);
  color: #fff;
}
@media (max-width: 620px) {
  .page-jump {
    right: 0.85rem;
    bottom: 0.85rem;
    gap: 0.85rem;
  }
  .back-to-top,
  .go-to-bottom {
    width: 2.75rem;
    height: 2.75rem;
  }
}
"""

_FOOTER_FRAMES_CORE = """\
.footer-col {
  position: relative;
  min-height: 7.5rem;
  padding: 22px 20px;
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: var(--radius-sm);
  box-shadow: none;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.footer-col::before,
.footer-col::after {
  content: "";
  position: absolute;
  inset: 7px;
  pointer-events: none;
  border-radius: 8px;
}
.footer-col::after {
  border: 1px solid rgba(240, 199, 94, 0.4);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.16),
    0 0 0 1px rgba(255, 255, 255, 0.08);
}
.footer-col::before {
  background:
    radial-gradient(circle, var(--gold-bright) 0 1.35px, var(--gold) 1.45px 2px, transparent 2.2px) top 1px left 1px / 8px 8px no-repeat,
    radial-gradient(circle, var(--gold-bright) 0 1.35px, var(--gold) 1.45px 2px, transparent 2.2px) top 1px right 1px / 8px 8px no-repeat,
    radial-gradient(circle, var(--gold-bright) 0 1.35px, var(--gold) 1.45px 2px, transparent 2.2px) bottom 1px left 1px / 8px 8px no-repeat,
    radial-gradient(circle, var(--gold-bright) 0 1.35px, var(--gold) 1.45px 2px, transparent 2.2px) bottom 1px right 1px / 8px 8px no-repeat,
    linear-gradient(var(--gold-bright), var(--gold)) top left / 17px 1.5px no-repeat,
    linear-gradient(var(--gold-bright), var(--gold)) top left / 1.5px 17px no-repeat,
    linear-gradient(var(--gold-bright), var(--gold)) top right / 17px 1.5px no-repeat,
    linear-gradient(var(--gold-bright), var(--gold)) top right / 1.5px 17px no-repeat,
    linear-gradient(var(--gold-bright), var(--gold)) bottom left / 17px 1.5px no-repeat,
    linear-gradient(var(--gold-bright), var(--gold)) bottom left / 1.5px 17px no-repeat,
    linear-gradient(var(--gold-bright), var(--gold)) bottom right / 17px 1.5px no-repeat,
    linear-gradient(var(--gold-bright), var(--gold)) bottom right / 1.5px 17px no-repeat;
}
"""

_ROOT_ENTRY_CSS = """
.page-root-home .root-entry {
  max-width: var(--max-wide);
  margin: 0 auto;
  padding: 2rem 1.25rem 2.75rem;
}
.page-root-home .root-entry__grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: stretch;
}
.page-root-home .root-entry-card.cat-card.page-card {
  min-height: 0;
  height: auto;
  padding: 20px 18px 18px;
  overflow: hidden;
}
.page-root-home .root-entry-card .card-desc {
  display: block;
  -webkit-line-clamp: unset;
  overflow: visible;
}
@media (max-width: 920px) {
  .page-root-home .root-entry__grid {
    grid-template-columns: 1fr;
  }
}
"""

_FOOTER_COL_STOCK_RE = re.compile(
    r"\.footer-col \{\n"
    r"  min-height: 7\.5rem;\n"
    r"  padding: 18px;\n"
    r"  text-align: center;\n"
    r"  background: rgba\(255, 255, 255, 0\.1\);\n"
    r"  border: 1px solid rgba\(255, 255, 255, 0\.18\);\n"
    r"  border-radius: var\(--radius-sm\);\n"
    r"  box-shadow: none;\n"
    r"  backdrop-filter: blur\(10px\);\n"
    r"  -webkit-backdrop-filter: blur\(10px\);\n"
    r"\}",
)

_FOOTER_ABOUT_FONT_RE = re.compile(
    r"(\.footer-about \{\n"
    r"  margin: 0;\n"
    r"  width: 100%;\n"
    r"  color: rgba\(255, 255, 255, 0\.92\);\n"
    r"  font-size: )0\.78rem(;\n)"
)

_BARE_BACK_TO_TOP_RE = re.compile(
    r"[ \t]*<a class=\"back-to-top\" href=\"#top\" id=\"back-to-top\"[^>]*>\s*</a>\s*",
)
_PAGE_JUMP_EXISTING_RE = re.compile(
    r"[ \t]*<nav class=\"page-jump\"[\s\S]*?</nav>\s*",
)
_FOOTER_OPEN_RE = re.compile(r"<footer class=\"footer-pro\"(?![^>]*\bid=)")
_FOOTER_ABOUT_RE = re.compile(
    r"(<p class=\"footer-about\">)([\s\S]*?)(</p>)",
    re.I,
)
_ABOUT_PANEL_LEAD_RE = re.compile(
    r"(<p class=\"about-panel__lead\">)([\s\S]*?)(</p>)",
    re.I,
)
_DISCOVERIES_PANEL_RE = re.compile(
    r"[ \t]*<aside class=\"about-hero__panel\"[\s\S]*?</aside>\s*",
    re.I,
)
_OCAQ_SLOT_RE = re.compile(
    r"<div class=\"ocaq-video-slot\"[\s\S]*?</div>",
    re.I,
)
_OCAQ_I18N_RE = re.compile(
    r"[ \t]*<script type=\"application/json\" id=\"ocaq-video-i18n\">[\s\S]*?</script>\s*",
    re.I,
)


def ensure_site_css_chrome(css: str) -> str:
    css = ensure_brand_one_mark(css) if ".brand::before" not in css or "brand-one.webp" not in css else css

    if "body.audio-player-open .page-jump" not in css:
        css = css.replace(
            "body.audio-player-open .back-to-top {\n  bottom: calc(var(--audio-player-h, 6.5rem) + 0.85rem);\n}",
            "body.audio-player-open .page-jump,\nbody.audio-player-open .back-to-top {\n  bottom: calc(var(--audio-player-h, 6.5rem) + 0.85rem);\n}",
            1,
        )
        css = css.replace(
            "  body.audio-player-open .back-to-top {\n    bottom: calc(var(--audio-player-h, 9.5rem) + 0.85rem);\n  }",
            "  body.audio-player-open .page-jump,\n  body.audio-player-open .back-to-top {\n    bottom: calc(var(--audio-player-h, 9.5rem) + 0.85rem);\n  }",
            1,
        )

    if ".page-jump {" not in css:
        if not _BACK_TO_TOP_BLOCK_RE.search(css):
            raise ValueError("Could not find stock .back-to-top CSS block")
        css = _BACK_TO_TOP_BLOCK_RE.sub(_PAGE_JUMP_CORE.rstrip("\n"), css, count=1)
    elif ".go-to-bottom" not in css:
        raise ValueError("Partial .page-jump CSS without .go-to-bottom")

    if ".footer-col::before" not in css:
        if not _FOOTER_COL_STOCK_RE.search(css):
            # already framed variant without ::before marker — try framed padding form
            if "padding: 22px 20px" not in css:
                raise ValueError("Could not find stock .footer-col CSS block")
        else:
            css = _FOOTER_COL_STOCK_RE.sub(_FOOTER_FRAMES_CORE.rstrip("\n"), css, count=1)

    if ".page-root-home .root-entry-card .card-desc" not in css:
        if ".page-root-home .root-entry {" in css:
            css = re.sub(
                r"\.page-root-home \.root-entry \{[\s\S]*?@media \(max-width: 920px\) \{\n  \.page-root-home \.root-entry__grid \{\n    grid-template-columns: 1fr;\n  \}\n\}",
                _ROOT_ENTRY_CSS.strip(),
                css,
                count=1,
            )
        else:
            css = css.rstrip() + "\n" + _ROOT_ENTRY_CSS.strip() + "\n"

    if ".nav-dropdown--literature > .nav-dropdown-panel > .nav-dropdown-link {" not in css:
        css = css.rstrip() + "\n" + _LIT_PANEL_LINK_CSS.strip() + "\n"

    if ".page-home:not(.page-root-home) .about-hero__wrap" not in css:
        css = css.rstrip() + (
            "\n.page-home:not(.page-root-home) .about-hero__wrap,\n"
            ".page-inventions .about-hero__wrap {\n"
            "  grid-template-columns: 1fr;\n"
            "}\n"
        )
    elif ".page-inventions .about-hero__wrap" not in css:
        css = css.replace(
            ".page-home:not(.page-root-home) .about-hero__wrap {\n"
            "  grid-template-columns: 1fr;\n"
            "}",
            ".page-home:not(.page-root-home) .about-hero__wrap,\n"
            ".page-inventions .about-hero__wrap {\n"
            "  grid-template-columns: 1fr;\n"
            "}",
            1,
        )

    if ".page-home .about-hero" not in css:
        css = re.sub(
            r"\.page-inventions (\.about-(?:hero(?:__[a-z]+|::[a-z]+)?|panel(?:__[a-z]+)?))",
            r".page-inventions \1,\n.page-home \1",
            css,
        )

    css, n = _FOOTER_ABOUT_FONT_RE.subn(r"\g<1>0.92rem\2", css, count=1)
    if not n and "font-size: 0.92rem" not in css[css.find(".footer-about") : css.find(".footer-about") + 200]:
        # already bumped or different shape
        pass

    return css


def ensure_site_js_go_to_bottom(js: str) -> str:
    if 'getElementById("go-to-bottom")' in js or "getElementById('go-to-bottom')" in js:
        return js
    marker = '  const backToTop = document.getElementById("back-to-top");'
    idx = js.find(marker)
    if idx < 0:
        raise ValueError("Could not find back-to-top handler in site.js")
    # Insert after the back-to-top if-block that follows marker
    # Find closing of that if block: look for "\n  }\n\n  const initGlobalSearch"
    end_marker = "\n  const initGlobalSearch"
    end = js.find(end_marker, idx)
    if end < 0:
        end_marker = "\n  const init"
        end = js.find("\n  const init", idx)
        if end < 0:
            raise ValueError("Could not find insertion point after back-to-top handler")
    return js[:end] + "\n" + _GO_BOTTOM_JS + js[end:]


def strip_ocaq_videos(html: str) -> str:
    html = _OCAQ_SLOT_RE.sub("", html)
    html = _OCAQ_I18N_RE.sub("", html)
    html = re.sub(
        r"^[ \t]*<link[^>]+ocaq-video\.css[^>]*>\s*\n?",
        "",
        html,
        flags=re.M,
    )
    html = re.sub(
        r"^[ \t]*<script[^>]+ocaq-video\.js[^>]*></script>\s*\n?",
        "",
        html,
        flags=re.M,
    )
    return html


def ensure_page_jump_html(html: str, lang: str) -> str:
    nav = PAGE_JUMP_NAV.get(lang, PAGE_JUMP_NAV["en"])
    go = GO_TO_BOTTOM.get(lang, GO_TO_BOTTOM["en"])
    top = BACK_TO_TOP.get(lang, BACK_TO_TOP["en"])
    block = (
        f'  <nav class="page-jump" aria-label="{nav}">\n'
        f'    <a class="go-to-bottom" href="#site-footer" id="go-to-bottom" '
        f'title="{go}" aria-label="{go}"></a>\n'
        f'    <a class="back-to-top" href="#top" id="back-to-top" '
        f'title="{top}" aria-label="{top}"></a>\n'
        f"  </nav>\n"
    )
    if 'class="page-jump"' in html:
        html = _PAGE_JUMP_EXISTING_RE.sub(block, html, count=1)
    elif _BARE_BACK_TO_TOP_RE.search(html):
        html = _BARE_BACK_TO_TOP_RE.sub(block, html, count=1)
    else:
        # insert before footer
        html = re.sub(
            r"(<footer class=\"footer-pro\")",
            block + r"\1",
            html,
            count=1,
        )

    if 'id="site-footer"' not in html:
        html = _FOOTER_OPEN_RE.sub('<footer class="footer-pro" id="site-footer"', html, count=1)
    return html


def ensure_footer_about_html(html: str, lang: str) -> str:
    short = FOOTER_ABOUT_SHORT.get(lang)
    if not short:
        return html
    if not _FOOTER_ABOUT_RE.search(html):
        return html
    return _FOOTER_ABOUT_RE.sub(rf"\1{short}\3", html, count=1)


def ensure_discoveries_hero_html(html: str, lang: str) -> str:
    """Keep the discoveries title; drop the hearth-of-knowledge side panel."""
    if "inventions-page-body" not in html and "inventions-entry" not in html:
        return html
    if "about-hero__panel" not in html:
        return html
    return _DISCOVERIES_PANEL_RE.sub("", html, count=1)


def _about_title_html(title: str) -> str:
    parts = str(title or "").rsplit(" ", 1)
    if len(parts) == 2:
        return f"{html.escape(parts[0])} <span>{html.escape(parts[1])}</span>"
    return html.escape(title)


def build_stories_hero_html(lang: str) -> str:
    data = _load_locale(lang)
    page_title = data.get("nav_stories_label", "İbrətamiz hekayələr")
    return (
        f'<header class="about-hero">\n'
        f'  <div class="about-hero__wrap">\n'
        f'    <section class="about-hero__copy">\n'
        f'      <h1 class="about-hero__title" id="about-hero-title">'
        f"{_about_title_html(page_title)}</h1>\n"
        f"    </section>\n"
        f"  </div>\n"
        f"</header>"
    )


def build_root_intro_hero_html() -> str:
    """Previous root-home hero: pearl visual + Birİnci copy."""
    data = _load_locale("az")
    ui = data.get("ui", {})
    tagline = ui.get("hero_lead", "Bilik və mədəniyyət ocağı")
    lead = ui.get("intro_lead", "")
    source = ui.get("intro_source", "")
    return (
        '<section class="intro">\n'
        '    <div class="intro__atmosphere" aria-hidden="true"></div>\n'
        '    <div class="intro__content">\n'
        '      <div class="intro__copy">\n'
        '        <h1 class="intro__brand">Bir<span>İnci</span></h1>\n'
        f'        <p class="intro__tagline">{html.escape(tagline)}</p>\n'
        f'        <p class="intro__lead">{html.escape(lead)}</p>\n'
        '        <p class="intro__source">'
        '<span class="intro__source-ornament" aria-hidden="true"></span>'
        f'<span class="intro__source-text">{html.escape(source)}</span></p>\n'
        "      </div>\n"
        '      <div class="intro__visual">\n'
        f'        <img src="../assets/Pearl%20with%20Background%203.png?v={ROOT_HOME_ASSET_VERSION}" '
        'alt="" width="1536" height="1024" decoding="async" />\n'
        "      </div>\n"
        "    </div>\n"
        "  </section>"
    )


_BRAND_HREF_RE = re.compile(r'(<a\s+class="brand"\s+href=")[^"]*(")', re.I)


def site_root_index_href(html: str) -> str:
    if "../../assets/" in html:
        return "../../index.html"
    if "../assets/" in html:
        return "../index.html"
    return "index.html"


def ensure_brand_home_href(html: str) -> str:
    """Point the top-navbar logo to the site root home page."""
    href = site_root_index_href(html)
    return _BRAND_HREF_RE.sub(rf"\g<1>{href}\g<2>", html, count=1)


_ABOUT_HERO_RE = re.compile(
    r"<header class=\"about-hero\">[\s\S]*?</header>",
    re.I,
)


def ensure_stories_hero_html(html: str, lang: str) -> str:
    """Replace legacy .intro hero on stories home with discoveries-style about-hero."""
    if "page-root-home" in html:
        return html
    if 'class="page-home"' not in html or 'id="kateqoriyalar"' not in html:
        return html
    hero = build_stories_hero_html(lang)
    if _INTRO_RE.search(html):
        return _INTRO_RE.sub(hero, html, count=1)
    if _ABOUT_HERO_RE.search(html):
        return _ABOUT_HERO_RE.sub(hero, html, count=1)
    return html


def _remove_balanced_details(html: str, class_name: str) -> str:
    """Remove a top-level ``<details class="... class_name ...">...</details>`` block."""
    needle = f'class="nav-dropdown {class_name}"'
    start = html.find(f"<details {needle}")
    if start < 0:
        # tolerate attribute order variants
        m = re.search(
            rf"<details\b[^>]*\b{re.escape(class_name)}\b[^>]*>",
            html,
        )
        if not m:
            return html
        start = m.start()
    i = start
    depth = 0
    while i < len(html):
        if html.startswith("<details", i):
            depth += 1
            i = html.find(">", i) + 1
            continue
        if html.startswith("</details>", i):
            depth -= 1
            i += len("</details>")
            if depth == 0:
                return html[:start] + html[i:]
            continue
        i += 1
    return html


_TOP_NAV_DISABLED_LINK_RE = re.compile(
    r"<a\s+class=\"primary-nav__link\"\s+href=\"#\"\s+aria-disabled=\"true\"[^>]*>"
    r"[\s\S]*?</a>\s*",
    re.I,
)


def _stories_all_href(html: str, lang: str) -> str:
    match = re.search(r'href="([^"]*categories/[^"]+\.html)"', html)
    if not match:
        return "index.html?view=list"
    href = match.group(1)
    prefix = re.match(r"^([a-z]{2})/", href)
    if prefix:
        return f"{prefix.group(1)}/index.html?view=list"
    if href.startswith("../"):
        return "../index.html?view=list"
    return "index.html?view=list"


_ICON_LIST = (
    '<span class="menu-icon menu-icon--list" aria-hidden="true" '
    'style="--icon-from:#38bdf8;--icon-to:#0369a1;--icon-glow:#7dd3fc">'
    '<svg class="menu-icon__svg" viewBox="0 0 24 24" width="18" height="18" '
    'fill="none" stroke="#fff" stroke-width="2.15" stroke-linecap="round" '
    'stroke-linejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/>'
    '<path d="M8 18h13"/><circle cx="4" cy="6" r="1.2"/>'
    '<circle cx="4" cy="12" r="1.2"/><circle cx="4" cy="18" r="1.2"/>'
    "</svg></span>"
)


def ensure_literature_submenu(source: str, lang: str) -> str:
    """Literature menu: All (stories list) + By Category (existing mega menu)."""
    if 'data-nav-branch="stories"' not in source:
        return source
    all_label = html.escape(NAV_STORIES_ALL.get(lang) or NAV_STORIES_ALL["en"])
    by_cat = html.escape(NAV_STORIES_BY_CATEGORY.get(lang) or NAV_STORIES_BY_CATEGORY["en"])
    all_href = _stories_all_href(source, lang)
    escaped_href = html.escape(all_href, quote=True)

    start = source.find('data-nav-branch="stories"')
    panel = source.find('id="literature-mega-panel"', start)
    if start != -1 and panel != -1:
        chunk = source[start:panel]
        new_chunk, n = _TOGGLE_COPY_RE.subn(
            lambda m, title=by_cat: m.group(1) + title + m.group(3),
            chunk,
            count=1,
        )
        if n:
            source = source[:start] + new_chunk + source[panel:]

    all_link = (
        f'<a class="nav-dropdown-link" href="{escaped_href}" '
        f'data-nav-stories-all>{_ICON_LIST}'
        f'<span class="nav-dropdown-link-copy">'
        f'<span class="nav-dropdown-link-title">{all_label}</span>'
        f"</span></a>\n          "
    )
    if "data-nav-stories-all" not in source:
        source, n = _NESTED_STORIES_OPEN_RE.subn(
            lambda m, prefix=all_link: prefix + m.group(1),
            source,
            count=1,
        )
    else:
        source = _ALL_LINK_RE.sub(
            lambda m, href=escaped_href, title=all_label: (
                m.group(1) + href + m.group(3) + title + m.group(5)
            ),
            source,
            count=1,
        )
    return ensure_literature_nav_label(source, lang)


def ensure_literature_nav_label(source: str, lang: str) -> str:
    """Rename the Literature top-nav item to the stories-section label."""
    new_label = NAV_LITERATURE_LABEL.get(lang) or NAV_LITERATURE_LABEL["en"]
    old_label = OLD_NAV_LITERATURE.get(lang)
    escaped = html.escape(new_label)

    def _span(match: re.Match[str], title: str = escaped) -> str:
        return match.group(1) + title + match.group(3)

    source, _ = _LIT_NAV_SPAN_RE.subn(_span, source, count=1)

    def _crumb(match: re.Match[str], title: str = escaped, old: str | None = old_label) -> str:
        first, second = match.group(2), match.group(5)
        if first == title and second == title:
            return match.group(4) + title + match.group(6)
        if old and first == old and second == title:
            return match.group(4) + title + match.group(6)
        if old and first == old and second == old:
            return match.group(4) + title + match.group(6)
        if first == old:
            return match.group(1) + title + match.group(3) + match.group(4) + second + match.group(6)
        return match.group(0)

    source = _LIT_CRUMB_DUP_RE.sub(_crumb, source)
    if old_label and old_label != new_label:
        source = source.replace(f">{old_label}</a>", f">{escaped}</a>")
    return source


def hide_empty_top_nav(html: str) -> str:
    """Strip unfinished top-nav sections (science, arts, figures, support)."""
    if HIDE_TOP_NAV.get("science"):
        html = _remove_balanced_details(html, "nav-dropdown--science")
    if HIDE_TOP_NAV.get("arts"):
        html = _remove_balanced_details(html, "nav-dropdown--arts")

    def _keep_or_drop(match: re.Match[str]) -> str:
        block = match.group(0)
        if HIDE_TOP_NAV.get("figures") and "menu-icon--landmark" in block:
            return ""
        if HIDE_TOP_NAV.get("support") and "menu-icon--hand-heart" in block:
            return ""
        return block

    if HIDE_TOP_NAV.get("figures") or HIDE_TOP_NAV.get("support"):
        html = _TOP_NAV_DISABLED_LINK_RE.sub(_keep_or_drop, html)
    return html


def patch_emitted_html(html: str, lang: str, *, inventions: bool = False) -> str:
    html = hide_empty_top_nav(html)
    html = ensure_page_jump_html(html, lang)
    html = ensure_literature_submenu(html, lang)
    html = ensure_literature_nav_label(html, lang)
    html = ensure_footer_about_html(html, lang)
    html = ensure_brand_home_href(html)
    html = ensure_stories_hero_html(html, lang)
    if inventions or "ocaq-video" in html or "inventions-entry" in html:
        if DISABLE_DISCOVERY_VIDEOS:
            html = strip_ocaq_videos(html)
        html = ensure_discoveries_hero_html(html, lang)
    return html


def update_locale_discoveries_descriptions() -> None:
    for lang, text in DISCOVERIES_HERO.items():
        path = TOOLS / "locales" / f"{lang}.json"
        if not path.is_file():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        inv = data.setdefault("ui", {}).setdefault("inventions", {})
        if inv.get("page_description") != text:
            inv["page_description"] = text
            path.write_text(
                json.dumps(data, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )


def apply_shared_assets() -> None:
    css_path = ROOT / "assets" / "site.css"
    css_path.write_text(ensure_site_css_chrome(css_path.read_text(encoding="utf-8")), encoding="utf-8")

    # Locale copies of site.js (builder writes per-lang)
    for lang in ("az", "en", "ru", "ky", "tr"):
        js_path = ROOT / lang / "assets" / "site.js"
        if js_path.is_file():
            js_path.write_text(
                ensure_site_js_go_to_bottom(js_path.read_text(encoding="utf-8")),
                encoding="utf-8",
            )


_BREADCRUMBS_RE = re.compile(
    r"[ \t]*<nav class=\"breadcrumbs\"[\s\S]*?</nav>\s*",
    re.I,
)
_INTRO_RE = re.compile(
    r"<section class=\"intro\">[\s\S]*?</section>",
    re.I,
)
_HOME_INLINE_SCRIPT_RE = re.compile(
    r"[ \t]*<script>\s*\(function \(\) \{[\s\S]*?</script>\s*",
    re.I,
)
_CATEGORIES_SECTION_RE = re.compile(
    r"[ \t]*<section id=\"kateqoriyalar\"[\s\S]*?</section>\s*",
    re.I,
)

ROOT_HOME_ASSET_VERSION = "20260818g"

ROOT_ENTRY_LANGS = ("az", "en", "ru", "ky")

ROOT_ENTRY_SECTION_LABEL = {
    "az": "Əsas bölmələr",
    "en": "Main sections",
    "ru": "Основные разделы",
    "ky": "Негизги бөлүмдөр",
}

_ICON_LAYERS = (
    '<span class="menu-icon menu-icon--layers" aria-hidden="true" '
    'style="--icon-from:#38bdf8;--icon-to:#0369a1;--icon-glow:#7dd3fc">'
    '<svg class="menu-icon__svg" viewBox="0 0 24 24" width="18" height="18" '
    'fill="none" stroke="#fff" stroke-width="2.15" stroke-linecap="round" '
    'stroke-linejoin="round"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/>'
    '<path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/>'
    '<path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/></svg></span>'
)
_ICON_LIGHTBULB = (
    '<span class="menu-icon menu-icon--lightbulb" aria-hidden="true" '
    'style="--icon-from:#fbbf24;--icon-to:#f97316;--icon-glow:#fcd34d">'
    '<svg class="menu-icon__svg" viewBox="0 0 24 24" width="18" height="18" '
    'fill="none" stroke="#fff" stroke-width="2.15" stroke-linecap="round" '
    'stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>'
    '<path d="M9 18h6"/><path d="M10 22h4"/></svg></span>'
)
_ICON_INFO = (
    '<span class="menu-icon menu-icon--info" aria-hidden="true" '
    'style="--icon-from:#3b82f6;--icon-to:#1d4ed8;--icon-glow:#93c5fd">'
    '<svg class="menu-icon__svg" viewBox="0 0 24 24" width="18" height="18" '
    'fill="none" stroke="#fff" stroke-width="2.15" stroke-linecap="round" '
    'stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/>'
    '<path d="M12 8h.01"/></svg></span>'
)

_ROOT_ENTRY_SCRIPT = """\
(function () {
  var body = document.body;
  if (!body || !body.classList.contains("page-root-home")) return;
  var dataEl = document.getElementById("root-entry-i18n");
  if (!dataEl) return;
  var pack;
  try {
    pack = JSON.parse(dataEl.textContent || "{}");
  } catch (_) {
    return;
  }
  var langs = ["az", "en", "ru", "ky"];
  function normLang(code) {
    return langs.indexOf(code) >= 0 ? code : "az";
  }
  function readLang() {
    try {
      var stored = localStorage.getItem("birinci-lang");
      if (stored && langs.indexOf(stored) >= 0) return stored;
    } catch (_) {}
    return "az";
  }
  function applyLang(code) {
    code = normLang(code);
    var L = pack[code] || pack.az;
    if (!L) return;
    document.documentElement.lang = code;
    body.setAttribute("data-lang", code);
    document.querySelectorAll("[data-root-entry]").forEach(function (link) {
      var key = link.getAttribute("data-root-entry");
      var card = L.cards && L.cards[key];
      if (!card) return;
      link.href = card.href;
      var title = link.querySelector(".card-title");
      var desc = link.querySelector(".card-desc");
      if (title) title.textContent = card.title || "";
      if (desc) desc.textContent = card.desc || "";
    });
    var sectionTitle = document.getElementById("root-entry-title");
    if (sectionTitle && L.section_label) sectionTitle.textContent = L.section_label;
    var tagline = document.querySelector(".intro__tagline");
    if (tagline && L.hero_lead) tagline.textContent = L.hero_lead;
    var lead = document.querySelector(".intro__lead");
    if (lead && L.intro_lead) lead.textContent = L.intro_lead;
    var source = document.querySelector(".intro__source-text");
    if (source && L.intro_source) source.textContent = L.intro_source;
    var footerAbout = document.querySelector(".footer-about");
    if (footerAbout && L.footer_about) footerAbout.textContent = L.footer_about;
    var litNav = document.querySelector(
      ".nav-dropdown--literature > .nav-dropdown__summary > span:not(.menu-icon)"
    );
    if (litNav && L.nav_label) litNav.textContent = L.nav_label;
    var storiesAll = document.querySelector("[data-nav-stories-all]");
    if (storiesAll) {
      if (L.stories_all_href) storiesAll.href = L.stories_all_href;
      var allTitle = storiesAll.querySelector(".nav-dropdown-link-title");
      if (allTitle && L.nav_stories_all) allTitle.textContent = L.nav_stories_all;
    }
    var byCategory = document.querySelector(
      '[data-nav-branch="stories"] [data-nav-mega-toggle] .nav-dropdown-link-title'
    );
    if (byCategory && L.nav_stories_by_category) byCategory.textContent = L.nav_stories_by_category;
    var search = document.getElementById("global-search");
    if (search && L.search_index) search.setAttribute("data-search-index", L.search_index);
    var switcher = document.querySelector(".lang-switcher");
    if (switcher) {
      switcher.querySelectorAll("a[data-lang]").forEach(function (link) {
        var lc = link.getAttribute("data-lang");
        var selected = lc === code;
        link.setAttribute("aria-selected", selected ? "true" : "false");
        if (selected) {
          var toggle = switcher.querySelector(".lang-switcher__toggle");
          var flag = link.querySelector(".lang-switcher__flag");
          var label = link.querySelector("span:last-child");
          if (toggle && flag) {
            var toggleFlag = toggle.querySelector(".lang-switcher__flag");
            var toggleName = toggle.querySelector(".lang-switcher__name");
            if (toggleFlag) toggleFlag.src = flag.src;
            if (toggleName && label) toggleName.textContent = label.textContent;
            if (link.title) toggle.title = link.title;
          }
        }
      });
    }
  }
  document.addEventListener(
    "click",
    function (event) {
      var link =
        event.target.closest &&
        event.target.closest(".lang-switcher a[data-lang]");
      if (!link) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      var code = link.getAttribute("data-lang") || "az";
      try {
        localStorage.setItem("birinci-lang", code);
      } catch (_) {}
      applyLang(code);
    },
    true
  );
  document.querySelectorAll("[data-root-entry]").forEach(function (link) {
    link.addEventListener("click", function () {
      var key = link.getAttribute("data-root-entry");
      try {
        if (key === "stories") localStorage.setItem("birinci-home-view", "cards");
        if (key === "discoveries") localStorage.setItem("birinci-inventions-view", "cards");
      } catch (_) {}
    });
  });
  var storiesAllLink = document.querySelector("[data-nav-stories-all]");
  if (storiesAllLink) {
    storiesAllLink.addEventListener("click", function () {
      try {
        localStorage.setItem("birinci-home-view", "list");
      } catch (_) {}
    });
  }
  applyLang(readLang());
})();
"""


def _load_locale(lang: str) -> dict:
    path = TOOLS / "locales" / f"{lang}.json"
    return json.loads(path.read_text(encoding="utf-8"))


def _root_entry_locale_pack(lang: str) -> dict:
    data = _load_locale(lang)
    ui = data.get("ui", {})
    about = ui.get("about", {})
    inv = ui.get("inventions", {})
    return {
        "section_label": ROOT_ENTRY_SECTION_LABEL.get(lang, ROOT_ENTRY_SECTION_LABEL["en"]),
        "cards": {
            "stories": {
                "title": data.get("nav_stories_label", ""),
                "desc": data.get("nav_stories_desc", ""),
                "href": f"{lang}/index.html?view=cards",
            },
            "discoveries": {
                "title": inv.get("page_title", ""),
                "desc": inv.get("card_description") or inv.get("page_description", ""),
                "href": f"{lang}/discoveries/discoveries-and-inventions.html",
            },
            "about": {
                "title": about.get("kicker", ""),
                "desc": about.get("card_description") or about.get("page_description", ""),
                "href": f"{lang}/about/mission-vision-values.html",
            },
        },
        "hero_lead": ui.get("hero_lead", ""),
        "intro_lead": ui.get("intro_lead", ""),
        "intro_source": ui.get("intro_source", ""),
        "nav_label": data.get("nav_label") or NAV_LITERATURE_LABEL.get(lang, "Wisdom stories"),
        "nav_stories_all": data.get("nav_stories_all") or NAV_STORIES_ALL.get(lang, "All"),
        "nav_stories_by_category": data.get("nav_stories_by_category")
        or NAV_STORIES_BY_CATEGORY.get(lang, "By Category"),
        "stories_all_href": f"{lang}/index.html?view=list",
        "footer_about": FOOTER_ABOUT_SHORT.get(lang)
        or ui.get("footer_about")
        or DISCOVERIES_HERO.get(lang, ""),
        "search_index": f"{lang}/assets/search-index.js?v={ROOT_HOME_ASSET_VERSION}",
    }


def _root_entry_card(key: str, icon_html: str, card: dict) -> str:
    title = card["title"]
    desc = card["desc"]
    href = card["href"]
    return (
        f'        <a class="cat-card page-card root-entry-card" data-root-entry="{key}" '
        f'href="{href}">\n'
        f'          <div class="card-icon-wrap" aria-hidden="true">{icon_html}</div>\n'
        f'          <div class="card-body">\n'
        f'            <h2 class="card-title">{title}</h2>\n'
        f'            <div class="card-desc">{desc}</div>\n'
        f"          </div>\n"
        f"        </a>"
    )


def build_root_entry_section() -> str:
    az = _root_entry_locale_pack("az")["cards"]
    i18n = {lang: _root_entry_locale_pack(lang) for lang in ROOT_ENTRY_LANGS}
    cards_html = "\n".join(
        [
            _root_entry_card("stories", _ICON_LAYERS, az["stories"]),
            _root_entry_card("discoveries", _ICON_LIGHTBULB, az["discoveries"]),
            _root_entry_card("about", _ICON_INFO, az["about"]),
        ]
    )
    section_label = ROOT_ENTRY_SECTION_LABEL["az"]
    i18n_json = json.dumps(i18n, ensure_ascii=False, separators=(",", ":"))
    return (
        f'\n  <section class="root-entry section" id="root-entry" '
        f'aria-labelledby="root-entry-title">\n'
        f'    <h2 id="root-entry-title" class="visually-hidden">{section_label}</h2>\n'
        f'    <div class="cat-grid root-entry__grid">\n'
        f"{cards_html}\n"
        f"    </div>\n"
        f"  </section>\n"
        f'  <script type="application/json" id="root-entry-i18n">{i18n_json}</script>\n'
        f"  <script>{_ROOT_ENTRY_SCRIPT}</script>"
    )


def build_root_home_html(az_html: str) -> str:
    """Copy AZ home chrome to the site root: navbar, hero, footer only."""
    html = az_html

    html = _BREADCRUMBS_RE.sub("", html)
    html = _HOME_INLINE_SCRIPT_RE.sub("", html)
    html = _CATEGORIES_SECTION_RE.sub("", html)

    root_hero = build_root_intro_hero_html()
    entry = build_root_entry_section()
    html = re.sub(
        r"<div class=\"page-home__content\">[\s\S]*?</div>\s*(?=</main>)",
        '<div class="page-home__content">\n'
        + root_hero
        + entry
        + "\n</div>\n",
        html,
        count=1,
        flags=re.I,
    )

    html = html.replace("../assets/", "assets/")
    html = html.replace("../flags/", "flags/")
    html = html.replace('href="../az/', 'href="az/')
    html = html.replace('href="../en/', 'href="en/')
    html = html.replace('href="../ru/', 'href="ru/')
    html = html.replace('href="../ky/', 'href="ky/')
    html = html.replace('href="../tr/', 'href="tr/')
    html = html.replace('href="categories/', 'href="az/categories/')
    html = html.replace('href="discoveries/', 'href="az/discoveries/')
    html = html.replace('href="about/', 'href="az/about/')
    html = html.replace('href="index.html?view=list"', 'href="az/index.html?view=list"')
    html = html.replace('src="assets/site.js', 'src="az/assets/site.js')
    html = html.replace(
        'data-search-index="assets/search-index.js',
        'data-search-index="az/assets/search-index.js',
    )
    html = html.replace('class="page-home"', 'class="page-home page-root-home"')
    html = ensure_brand_home_href(html)
    html = ensure_literature_submenu(html, "az")
    html = re.sub(
        r"(\?v=)2026\d{4}[a-zA-Z0-9]*",
        rf"\g<1>{ROOT_HOME_ASSET_VERSION}",
        html,
    )
    return html


def write_root_home() -> None:
    az_index = ROOT / "az" / "index.html"
    if not az_index.is_file():
        raise FileNotFoundError(az_index)
    html = build_root_home_html(az_index.read_text(encoding="utf-8"))
    (ROOT / "index.html").write_text(html, encoding="utf-8")


def apply_all_html() -> int:
    update_locale_discoveries_descriptions()
    n = 0
    for lang in ("az", "en", "ru", "ky", "tr"):
        base = ROOT / lang
        if not base.is_dir():
            continue
        paths = [base / "index.html"]
        about = base / "about" / "mission-vision-values.html"
        if about.is_file():
            paths.append(about)
        disc = base / "discoveries" / "discoveries-and-inventions.html"
        if disc.is_file():
            paths.append(disc)
        cat = base / "categories"
        if cat.is_dir():
            paths.extend(sorted(cat.glob("*.html")))
        for path in paths:
            if not path.is_file():
                continue
            html = path.read_text(encoding="utf-8")
            inventions = "discoveries" in path.parts or "ocaq-video" in html
            new_html = patch_emitted_html(html, lang, inventions=inventions)
            if new_html != html:
                path.write_text(new_html, encoding="utf-8")
                n += 1
    write_root_home()
    n += 1
    return n
