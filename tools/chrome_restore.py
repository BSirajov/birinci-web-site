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
from html_sitemap import write_html_sitemaps  # noqa: E402

# Discovery videos are off. chrome_restore still strips leftover Ocaq markup
# if a bytecode rebuild re-emits it.
DISABLE_DISCOVERY_VIDEOS = True

# Keep in sync with tools/build_website.py SITE_ASSET_VERSION
SITE_ASSET_VERSION = "20260823s"
SITE_PUBLIC_ORIGIN = "https://birinci.cloud"
LIVE_LANGS = ("az", "en", "ru", "ky")
OG_IMAGE_URL = f"{SITE_PUBLIC_ORIGIN}/assets/pearl-hero.webp"
OG_LOCALE = {
    "az": "az_AZ",
    "en": "en",
    "ru": "ru_RU",
    "ky": "ky_KG",
}
_NOT_FOUND_HTML = """\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="robots" content="noindex" />
  <title>Birİnci — Page not found</title>
  <link rel="icon" href="/assets/favicon-32.png" type="image/png" sizes="32x32" />
  <link rel="stylesheet" href="/assets/site.css?v=SITE_ASSET_VERSION" />
</head>
<body class="page-home" id="top">
  <main class="intro" id="main" style="padding:4rem 1.5rem">
    <div class="intro__content">
      <div class="intro__copy">
        <h1 class="intro__brand">Bir<span>İnci</span></h1>
        <p class="intro__tagline">This page could not be found.</p>
        <p class="intro__lead">The address may have changed, or the page is not available in this language.</p>
        <p>
          <a href="/">Home</a> ·
          <a href="/az/index.html" hreflang="az">AZ</a> ·
          <a href="/en/index.html" hreflang="en">EN</a> ·
          <a href="/ru/index.html" hreflang="ru">RU</a> ·
          <a href="/ky/index.html" hreflang="ky">KY</a>
        </p>
      </div>
    </div>
  </main>
</body>
</html>
""".replace("SITE_ASSET_VERSION", SITE_ASSET_VERSION)

DEAD_INVENTION_VIDEO_KEYS = ("watch_video", "video_series", "close_video", "video_note")
STORY_I18N_UI_KEYS = (
    "enlarge_image",
    "illustration_alt",
    "lightbox_illustration",
    "lightbox_text",
    "close",
    "sign_in",
    "sign_up",
    "sign_out",
    "auth_email",
    "auth_first_name",
    "auth_last_name",
    "auth_password",
    "auth_display_name",
    "auth_lead_login",
    "auth_lead_register",
    "auth_close",
    "auth_forgot",
    "auth_have_account",
    "auth_need_account",
    "auth_account",
    "auth_no_account",
    "auth_create_account",
    "auth_bad_password",
    "auth_need_signin",
    "auth_photo",
    "auth_photo_hint",
    "settings",
    "settings_lead",
    "settings_save",
    "settings_saved",
    "settings_delete",
    "settings_delete_lead",
    "settings_delete_confirm",
    "settings_delete_forever",
    "settings_delete_cancel",
    "pref_view_stories",
    "pref_view_category",
    "pref_view_discoveries",
    "pref_view_list",
    "pref_view_cards",
    "pref_hide_images",
    "pref_hide_texts",
    "pref_verified",
    "pref_unverified",
    "pref_locale",
)

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
}

GO_TO_BOTTOM = {
    "az": "Səhifənin aşağısına get",
    "en": "Go to bottom of page",
    "ru": "Вниз страницы",
    "ky": "Барактын аягына өтүү",
}

BACK_TO_TOP = {
    "az": "Səhifənin yuxarısına qayıt",
    "en": "Back to top",
    "ru": "Наверх",
    "ky": "Барактын башына кайтуу",
}

NAV_STORIES_ALL = {
    "az": "Hamısı",
    "en": "All",
    "ru": "Все",
    "ky": "Баары",
}

NAV_STORIES_BY_CATEGORY = {
    "az": "Kateqoriya üzrə",
    "en": "By Category",
    "ru": "По категориям",
    "ky": "Категория боюнча",
}

# Former Literature top-nav labels → stories-section name in each language.
OLD_NAV_LITERATURE = {
    "az": "Ədəbiyyat",
    "en": "Literature",
    "ru": "Литература",
    "ky": "Адабият",
}
NAV_LITERATURE_LABEL = {
    "az": "İbrətamiz hekayələr",
    "en": "Wisdom stories",
    "ru": "Нравоучительные рассказы",
    "ky": "Үлгүлүү аңгемелер",
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
_FOOTER_ABOUT_COL_RE = re.compile(
    r'(<div class="footer-col footer-col--about">)\s*'
    r'(?:<a class="footer-qr"[\s\S]*?</a>\s*)?'
    r'(<p class="footer-about">)',
    re.I,
)
FOOTER_QR_ALT = {
    "az": "birinci.cloud saytına keçid üçün QR kod",
    "en": "QR code linking to birinci.cloud",
    "ru": "QR-код со ссылкой на birinci.cloud",
    "ky": "birinci.cloud сайтына шилтеме берген QR kod",
}
_ABOUT_PANEL_LEAD_RE = re.compile(
    r"(<p class=\"about-panel__lead\">)([\s\S]*?)(</p>)",
    re.I,
)
_DISCOVERIES_PANEL_RE = re.compile(
    r"[ \t]*<aside class=\"about-hero__panel\"[\s\S]*?</aside>\s*",
    re.I,
)
_HERO_H1_RE = re.compile(
    r'(<h1 class="about-hero__title" id="about-hero-title">)([\s\S]*?)(</h1>)',
    re.I,
)
_DOC_TITLE_RE = re.compile(r"(<title>)([^<]*?)( · Birİnci</title>)", re.I)
_CRUMB_CURRENT_RE = re.compile(
    r'(<li class="breadcrumbs__item" aria-current="page"><span>)([^<]*)(</span></li>)',
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

    css = css.replace("diaspor-body-top-bg.png", "diaspor-body-top-bg.webp")

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
            ".page-inventions .about-hero__wrap,\n"
            ".page-sitemap .about-hero__wrap {\n"
            "  grid-template-columns: 1fr;\n"
            "}\n"
        )
    elif ".page-inventions .about-hero__wrap" not in css:
        css = css.replace(
            ".page-home:not(.page-root-home) .about-hero__wrap {\n"
            "  grid-template-columns: 1fr;\n"
            "}",
            ".page-home:not(.page-root-home) .about-hero__wrap,\n"
            ".page-inventions .about-hero__wrap,\n"
            ".page-sitemap .about-hero__wrap {\n"
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

    if ".footer-contact li:not(:has(.footer-contact__link))" not in css:
        css = css.rstrip() + (
            "\n.footer-contact li:not(:has(.footer-contact__link)) {\n"
            "  display: none;\n"
            "}\n"
        )

    if ".story-tts__note" not in css or "data-story-tts-note" not in css:
        css = css.rstrip() + (
            "\n.story-tts__note,\n"
            "[data-story-tts-note] {\n"
            "  display: none;\n"
            "}\n"
        )

    if '@import url("fonts.css")' not in css and "@import url('fonts.css')" not in css:
        css = '@import url("fonts.css");\n' + css

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


SEARCH_INDEX_FAILED = {
    "az": "Axtarış indeksi yüklənmədi. Səhifəni yeniləyin.",
    "en": "Search index failed to load. Reload the page.",
    "ru": "Не удалось загрузить поисковый индекс. Обновите страницу.",
    "ky": "Издөө индекси жүктөлгөн жок. Баракты жаңыртыңыз.",
}

_OLD_GLOBAL_SEARCH_CORE = """    let index = null;
    let loading = null;
    let lastQuery = \"\";

    const closeSearch = () => {
      root.hidden = true;
      toggle.setAttribute(\"aria-expanded\", \"false\");
      document.body.classList.remove(\"global-search-open\");
    };

    const openSearch = () => {
      root.hidden = false;
      toggle.setAttribute(\"aria-expanded\", \"true\");
      document.body.classList.add(\"global-search-open\");
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
      const url = root.getAttribute(\"data-search-index\");
      if (!url) return null;
      if (status) status.textContent = \"İndeks yüklənir…\";
      loading = new Promise((resolve, reject) => {
        const script = document.createElement(\"script\");
        script.src = url;
        script.async = true;
        script.onload = () => {
          if (Array.isArray(window.__BIRINCI_SEARCH__)) resolve(window.__BIRINCI_SEARCH__);
          else reject(new Error(\"empty-index\"));
        };
        script.onerror = () => reject(new Error(\"script-error\"));
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
              \"Axtarış indeksi yüklənmədi. Saytı http://localhost:8765/az/ ünvanından açın.\";
          }
        })
        .finally(() => {
          loading = null;
        });
      return loading;
    };

    const render = (query) => {
      lastQuery = query;
      const q = query.trim().toLocaleLowerCase(LOCALE_TAG);
      results.innerHTML = \"\";
      if (!q) {
        if (status) status.textContent = index ? `${index.length} hekayə` : \"\";
        return;
      }
      if (!index) {
        if (status) status.textContent = \"İndeks yüklənir…\";
        return;
      }
      const matches = index.filter((row) => row.hay.includes(q)).slice(0, 40);
      if (status) {
        status.textContent = matches.length
          ? `${matches.length} nəticə`
          : \"Uyğun hekayə tapılmadı.\";
      }
"""

_NEW_GLOBAL_SEARCH_CORE = r"""    let index = null;
    let loading = null;
    let lastQuery = "";
    let loadedUrl = "";

    const searchLang = () =>
      (window.__BIRINCI_I18N__ && window.__BIRINCI_I18N__.lang) || LOCALE_TAG || "az";
    const currentSearchUrl = () => root.getAttribute("data-search-index") || "";
    const countStatus = (n) => `${n} ${tUi("stories_count_suffix", "hekayə")}`;
    const resetIndex = () => {
      index = null;
      loading = null;
      loadedUrl = "";
      window.__BIRINCI_SEARCH__ = undefined;
    };

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
      const url = currentSearchUrl();
      if (loadedUrl && url && loadedUrl !== url) resetIndex();
      if (index && loadedUrl === url) {
        if (status && !lastQuery) status.textContent = countStatus(index.length);
        return Promise.resolve(index);
      }
      if (loading) return loading;
      if (!url) return null;
      if (status) status.textContent = tJs("index_loading", "İndeks yüklənir…");
      loadedUrl = url;
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
          if (status) status.textContent = lastQuery ? status.textContent : countStatus(index.length);
          if (lastQuery) render(lastQuery);
        })
        .catch(() => {
          index = [];
          loadedUrl = "";
          if (status) {
            status.textContent = tJs("index_failed", "Axtarış indeksi yüklənmədi.").replace(
              /\{lang\}/g,
              searchLang()
            );
          }
        })
        .finally(() => {
          loading = null;
        });
      return loading;
    };

    const render = (query) => {
      lastQuery = query;
      const q = query.trim().toLocaleLowerCase(searchLang());
      results.innerHTML = "";
      if (!q) {
        if (status) status.textContent = index ? countStatus(index.length) : "";
        return;
      }
      if (!index) {
        if (status) status.textContent = tJs("index_loading", "İndeks yüklənir…");
        return;
      }
      const matches = index.filter((row) => row.hay.includes(q)).slice(0, 40);
      if (status) {
        status.textContent = matches.length
          ? tJs("results_n", "{n} nəticə").replace(/\{n\}/g, String(matches.length))
          : tJs("no_match", "Uyğun hekayə tapılmadı.");
      }
"""

_OLD_GLOBAL_SEARCH_KBD = """      toggle.title = \"Axtar (⌘K)\";
      toggle.setAttribute(\"aria-label\", \"Qlobal axtarış, Command+K\");
"""

_NEW_GLOBAL_SEARCH_KBD = """      toggle.title = tUi(\"global_search_title_attr\", \"Axtar (Ctrl+K)\").replace(\"Ctrl+K\", \"⌘K\");
      toggle.setAttribute(
        \"aria-label\",
        tUi(\"global_search_toggle\", \"Qlobal axtarış, Ctrl+K\").replace(\"Ctrl+K\", \"Command+K\")
      );
"""

_GLOBAL_SEARCH_OBSERVER = """
    if (typeof MutationObserver === \"function\") {
      new MutationObserver(() => {
        const url = currentSearchUrl();
        if (!url || url === loadedUrl) return;
        resetIndex();
        results.innerHTML = \"\";
        if (!root.hidden) ensureIndex();
      }).observe(root, { attributes: true, attributeFilter: [\"data-search-index\"] });
    }

"""


def update_locale_search_fail() -> None:
    for lang, text in SEARCH_INDEX_FAILED.items():
        path = TOOLS / "locales" / f"{lang}.json"
        if not path.is_file():
            continue
        raw = path.read_text(encoding="utf-8")
        new_raw, n = re.subn(
            r'("index_failed":\s*)"(?:\\.|[^"\\])*"',
            lambda m, value=text: m.group(1) + json.dumps(value, ensure_ascii=False),
            raw,
            count=1,
        )
        if n and new_raw != raw:
            path.write_text(new_raw, encoding="utf-8")


def _replace_i18n_index_failed(js: str, lang: str) -> str:
    text = SEARCH_INDEX_FAILED.get(lang)
    if not text:
        return js
    return re.sub(
        r'"index_failed":\s*"(?:\\.|[^"\\])*"',
        '"index_failed": ' + json.dumps(text, ensure_ascii=False),
        js,
        count=1,
    )


def ensure_site_js_search(js: str) -> str:
    if _OLD_GLOBAL_SEARCH_CORE in js:
        js = js.replace(_OLD_GLOBAL_SEARCH_CORE, _NEW_GLOBAL_SEARCH_CORE, 1)
    if _OLD_GLOBAL_SEARCH_KBD in js:
        js = js.replace(_OLD_GLOBAL_SEARCH_KBD, _NEW_GLOBAL_SEARCH_KBD, 1)
    needle = '    toggle.addEventListener("click", () => {'
    if (
        'attributeFilter: ["data-search-index"]' not in js
        and "attributeFilter: ['data-search-index']" not in js
        and needle in js
    ):
        js = js.replace(needle, _GLOBAL_SEARCH_OBSERVER + needle, 1)
    old_tui = (
        "  const tUi = (key, fallback) =>\n"
        "    (I18N.ui && I18N.ui[key]) || fallback || key;\n"
        "  const tJs = (key, fallback) =>\n"
        "    (I18N.js && I18N.js[key]) || fallback || key;"
    )
    new_tui = (
        "  const liveI18n = () => window.__BIRINCI_I18N__ || I18N;\n"
        "  const tUi = (key, fallback) => {\n"
        "    const ui = liveI18n().ui || {};\n"
        "    return ui[key] || fallback || key;\n"
        "  };\n"
        "  const tJs = (key, fallback) => {\n"
        "    const pack = liveI18n().js || {};\n"
        "    return pack[key] || fallback || key;\n"
        "  };"
    )
    if old_tui in js:
        js = js.replace(old_tui, new_tui, 1)
    old_home = (
        '      const inCategories = window.location.pathname.includes("/categories/");\n'
        '      const homeListBase = inCategories ? "../index.html" : "index.html";\n'
    )
    new_home = (
        '      const onRoot = document.body.classList.contains("page-root-home");\n'
        '      const inCategories = window.location.pathname.includes("/categories/");\n'
        '      const homeListBase = onRoot\n'
        '        ? `${searchLang()}/index.html`\n'
        '        : inCategories\n'
        '          ? "../index.html"\n'
        '          : "index.html";\n'
    )
    if old_home in js:
        js = js.replace(old_home, new_home, 1)
    return js


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


_DISABLED_DISCOVERIES_NAV_RE = re.compile(
    r'<a(\s+class="primary-nav__link")\s+href="#"\s+aria-disabled="true"[^>]*>'
    r'(\s*<span class="menu-icon menu-icon--lightbulb")',
    re.I,
)
_KEY_FACTS_H4_RE = re.compile(
    r'(<div class="inventions-key-facts">\s*)<h4>(.*?)</h4>',
    re.I | re.S,
)
_TOOLBAR_MOBILE_JS_RE = re.compile(
    r"^[ \t]*<script[^>]+kt-catalog-toolbar-mobile\.js[^>]*></script>\s*\n?",
    re.M,
)
_ASSET_VERSION_RE = re.compile(r"(\?v=)2026\d{4}[a-zA-Z0-9]*")
_DATA_ASSET_VERSION_RE = re.compile(r'data-asset-version="[^"]*"')
_DATA_AUDIO_RE = re.compile(r'\s+data-audio="[^"]*"')
_DATA_SEARCH_RE = re.compile(r'\s+data-search="[^"]*"')
_SEO_BLOCK_RE = re.compile(
    r"\n?[ \t]*<!-- birinci-seo:start -->[\s\S]*?<!-- birinci-seo:end -->\s*",
    re.I,
)
_TITLE_RE = re.compile(r"<title>(.*?)</title>", re.I | re.S)
_META_DESC_RE = re.compile(
    r'<meta\s+name="description"\s+content="([^"]*)"',
    re.I,
)
_LANG_PAGE_RE = re.compile(r'data-lang-page="([^"]+)"', re.I)
_CATEGORY_HREF_RE = re.compile(
    r'href="(?:\.\./)+(?:az|en|ru|ky)/categories/([^"]+\.html)"',
    re.I,
)
_I18N_ASSIGN_PREFIX = "window.__BIRINCI_I18N__ = "
_SITE_RUNTIME_SCRIPTS_RE = re.compile(
    r"[ \t]*<script src=\"[^\"]*i18n\.js\?v=[^\"]+\"[^>]*></script>\s*"
    r"[ \t]*<script src=\"[^\"]*site\.js\?v=[^\"]+\"[^>]*></script>\s*",
    re.I,
)
_SITE_JS_ONLY_RE = re.compile(
    r"[ \t]*<script src=\"[^\"]*assets/site\.js\?v=[^\"]+\"[^>]*></script>\s*",
    re.I,
)
_SITEMAP_NAV_RE = re.compile(
    r'<a class="primary-nav__link(?: is-active)?" href="[^"]*" data-nav-sitemap>[\s\S]*?</a>',
    re.I,
)
_ABOUT_DETAILS_RE = re.compile(
    r'(<details class="nav-dropdown nav-dropdown--about">[\s\S]*?</details>)',
    re.I,
)
_SITEMAP_NAV_ICON = (
    '<span class="menu-icon menu-icon--map" aria-hidden="true" '
    'style="--icon-from:#06b6d4;--icon-to:#0284c7;--icon-glow:#67e8f9">'
    '<svg class="menu-icon__svg" viewBox="0 0 24 24" width="18" height="18" fill="none" '
    'stroke="#fff" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round">'
    '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/>'
    '<path d="M15 5.764v15"/><path d="M9 3.236v15"/></svg></span>'
)


def _discoveries_nav_href(html: str) -> str:
    if "page-inventions" in html or 'data-lang-page="discoveries/' in html:
        return "discoveries-and-inventions.html"
    if re.search(r'href="\.\./(?:about|categories|discoveries)/', html):
        return "../discoveries/discoveries-and-inventions.html"
    return "discoveries/discoveries-and-inventions.html"


def ensure_discoveries_nav_link(html: str, lang: str) -> str:
    """Turn the disabled Discoveries stub into a real link when the page exists."""
    if not (ROOT / lang / "discoveries" / "discoveries-and-inventions.html").is_file():
        return html
    href = _discoveries_nav_href(html)

    def _repl(match: re.Match[str], target: str = href) -> str:
        return f'<a{match.group(1)} href="{target}">{match.group(2)}'

    return _DISABLED_DISCOVERIES_NAV_RE.sub(_repl, html, count=1)


def ensure_discoveries_heading_order(html: str) -> str:
    """Key-facts heading is H4 under an H2 entry title; use H3 instead."""
    return _KEY_FACTS_H4_RE.sub(r"\1<h3>\2</h3>", html)


def strip_unused_inventions_scripts(html: str) -> str:
    """Drop KT catalog-toolbar mobile JS — Birİnci uses .tools-bar--inventions."""
    return _TOOLBAR_MOBILE_JS_RE.sub("", html)


def pin_asset_versions(html: str) -> str:
    html = _ASSET_VERSION_RE.sub(rf"\g<1>{SITE_ASSET_VERSION}", html)
    html = _DATA_ASSET_VERSION_RE.sub(f'data-asset-version="{SITE_ASSET_VERSION}"', html)
    return html


def strip_data_audio(html: str) -> str:
    return _DATA_AUDIO_RE.sub("", html)


_LISTEN_ICON = (
    '<svg class="tools-bar__glyph" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" '
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>'
    '<path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>'
    '<path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>'
)
_STOP_ICON = (
    '<svg class="tools-bar__glyph" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" '
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>'
    '<path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>'
    '<path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>'
    '<path d="M3 3l18 18"/></svg>'
)
_STORY_ACTIONS_OPEN = '<div class="story__actions">'
_CAT_STORY_CARD_RE = re.compile(
    r'(<a class="cat-card page-card"[^>]*\bdata-stem="([^"]+)"[^>]*>)(.*?)(</a>)',
    re.S,
)


def _inject_card_listen_buttons(markup: str, listen: str) -> str:
    """Put a Listen control on category story cards (the default cards view)."""

    def repl(match: re.Match[str]) -> str:
        open_tag, stem, body, close = match.group(1), match.group(2), match.group(3), match.group(4)
        if "data-story-tts" in body:
            return match.group(0)
        btn = (
            f'<button type="button" class="story-tts cat-card__listen" '
            f'data-story-tts data-tts-mode="listen" data-story-stem="{html.escape(stem)}" '
            f'aria-pressed="false" title="{listen}" aria-label="{listen}">'
            f"{_LISTEN_ICON}</button>"
        )
        return f"{open_tag}{body}{btn}{close}"

    return _CAT_STORY_CARD_RE.sub(repl, markup)


def _story_listen_labels(lang: str) -> dict[str, str]:
    loc = _load_locale(lang)
    ui = loc.get("ui") if isinstance(loc.get("ui"), dict) else {}
    return {
        "audio": str(ui.get("story_audio_label") or "Səs"),
        "listen": str(ui.get("listen") or "Mətni dinlə"),
        "stop": str(ui.get("stop") or "Dayandır"),
        "listen_page": str(ui.get("listen_page") or "Səhifəni dinlə"),
    }


def ensure_story_listen_markup(markup: str, lang: str) -> str:
    """Bake Listen buttons into static story HTML so they show without JS."""
    if lang == "ky":
        return markup
    labels = _story_listen_labels(lang)
    audio = html.escape(labels["audio"])
    listen = html.escape(labels["listen"])
    stop = html.escape(labels["stop"])
    listen_page = html.escape(labels["listen_page"])
    group = (
        f'          <div class="story__action-group">\n'
        f'            <span class="tools-bar__label">{audio}</span>\n'
        f'            <div class="tools-bar__views" role="group" aria-label="{audio}">\n'
        f'              <button type="button" class="story-tts tools-bar__view-btn tools-bar__view-btn--icon" '
        f'data-story-tts data-tts-mode="listen" aria-pressed="false" title="{listen}" aria-label="{listen}">'
        f"{_LISTEN_ICON}</button>\n"
        f'              <button type="button" class="story-tts tools-bar__view-btn tools-bar__view-btn--icon" '
        f'data-story-tts data-tts-mode="stop" aria-pressed="true" title="{stop}" aria-label="{stop}">'
        f"{_STOP_ICON}</button>\n"
        f"            </div>\n"
        f"          </div>\n"
    )

    pieces = []
    cursor = 0
    while True:
        start = markup.find(_STORY_ACTIONS_OPEN, cursor)
        if start < 0:
            pieces.append(markup[cursor:])
            break
        insert_at = start + len(_STORY_ACTIONS_OPEN)
        next_text = markup.find('<div class="story__text', insert_at)
        body = markup[insert_at:next_text] if next_text >= 0 else markup[insert_at : insert_at + 2500]
        pieces.append(markup[cursor:insert_at])
        if 'data-story-tts data-tts-mode' not in body:
            pieces.append("\n" + group)
        cursor = insert_at
    markup = "".join(pieces)
    # Listen used to be list-only on the home page (`hidden` + data-home-list-only).
    # Always show the toolbar control in both cards and list views.
    markup = re.sub(
        r'<div class="tools-bar__field tools-bar__field--listen"[^>]*>',
        '<div class="tools-bar__field tools-bar__field--listen">',
        markup,
    )
    markup = _inject_card_listen_buttons(markup, listen)
    markup = markup.replace(
        'v = localStorage.getItem("birinci-home-view") || "";',
        'v = localStorage.getItem("birinci-home-view") || "list";',
    )
    markup = markup.replace(
        'document.querySelectorAll("[data-home-list-only]").forEach(function (el) {\n      hideEl(el, view !== "list");\n    });',
        'document.querySelectorAll("[data-home-list-only]").forEach(function (el) {\n'
        '      if (el.classList.contains("tools-bar__field--listen")) { hideEl(el, false); return; }\n'
        '      hideEl(el, view !== "list");\n    });',
    )
    if "data-tools-play-visible" not in markup and "tools-bar__batch" in markup:
        field = (
            f'  <div class="tools-bar__field tools-bar__field--listen">\n'
            f'    <span class="tools-bar__label">{listen_page}</span>\n'
            f'    <div class="tools-bar__views" role="group" aria-label="{listen_page}">\n'
            f'      <button type="button" class="story-tts tools-bar__view-btn tools-bar__view-btn--icon" '
            f'data-tools-play-visible data-tts-mode="listen" aria-pressed="false" title="{listen_page}" '
            f'aria-label="{listen_page}">{_LISTEN_ICON}</button>\n'
            f'      <button type="button" class="story-tts tools-bar__view-btn tools-bar__view-btn--icon" '
            f'data-tools-play-visible data-tts-mode="stop" aria-pressed="true" title="{stop}" '
            f'aria-label="{stop}">{_STOP_ICON}</button>\n'
            f"    </div>\n"
            f"  </div>\n"
        )
        markup = markup.replace(
            '<div class="tools-bar__field tools-bar__batch"',
            field + '<div class="tools-bar__field tools-bar__batch"',
            1,
        )
    return markup


def slim_discoveries_search(html: str) -> str:
    return _DATA_SEARCH_RE.sub("", html)


def strip_google_fonts(html: str) -> str:
    html = re.sub(
        r"[ \t]*<link[^>]+fonts\.googleapis\.com[^>]*>\n",
        "",
        html,
        flags=re.I,
    )
    html = re.sub(
        r"[ \t]*<link[^>]+fonts\.gstatic\.com[^>]*>\n",
        "",
        html,
        flags=re.I,
    )
    html = re.sub(
        r'<link rel=\\"stylesheet\\" href=\\"([^\\"]+)\\"',
        r'<link rel="stylesheet" href="\1"',
        html,
    )
    return html


def strip_stories_json_refs(html: str) -> str:
    html = re.sub(r'\s+data-stories-url="[^"]*"', "", html)
    html = re.sub(
        r"[ \t]*var jsonUrl = panel\.getAttribute\(\"data-stories-url\"\)[^;]+;\s*",
        "",
        html,
    )
    html = html.replace(
        """    loadViaScript()
      .catch(function () {
        return fetch(jsonUrl).then(function (res) {
          if (!res.ok) throw new Error("fetch-failed");
          return res.json();
        });
      })
      .then(function (catalog) {""",
        """    loadViaScript()
      .then(function (catalog) {""",
        1,
    )
    return html


def fix_ky_illustration_prefix(html: str, lang: str) -> str:
    if lang != "ky":
        return html
    return html.replace("Иллюстрация:", "Сүрөт:")


def _public_url(rel_path: str) -> str:
    rel = rel_path.replace("\\", "/").lstrip("/")
    if rel in ("", "index.html"):
        return f"{SITE_PUBLIC_ORIGIN}/"
    return f"{SITE_PUBLIC_ORIGIN}/{rel}"


def _hreflang_pairs(rel_path: str) -> list[tuple[str, str]]:
    rel = rel_path.replace("\\", "/").lstrip("/")
    pairs: list[tuple[str, str]] = []
    if rel in ("", "index.html"):
        pairs.append(("x-default", f"{SITE_PUBLIC_ORIGIN}/"))
        for lang in LIVE_LANGS:
            pairs.append((lang, f"{SITE_PUBLIC_ORIGIN}/{lang}/index.html"))
        return pairs
    parts = rel.split("/", 1)
    if parts[0] in LIVE_LANGS and len(parts) == 2:
        rest = parts[1]
        pairs.append(("x-default", f"{SITE_PUBLIC_ORIGIN}/en/{rest}"))
        for lang in LIVE_LANGS:
            pairs.append((lang, f"{SITE_PUBLIC_ORIGIN}/{lang}/{rest}"))
    return pairs


def infer_html_rel_path(html: str, lang: str, *, inventions: bool = False) -> str:
    if "page-root-home" in html:
        return "index.html"
    page = _LANG_PAGE_RE.search(html)
    if page:
        return f"{lang}/{page.group(1).lstrip('/')}"
    if inventions or "page-inventions" in html:
        return f"{lang}/discoveries/discoveries-and-inventions.html"
    if "page-sitemap" in html or 'data-lang-page="sitemap.html"' in html:
        return f"{lang}/sitemap.html"
    if "page-about" in html:
        return f"{lang}/about/mission-vision-values.html"
    if "page-home" in html:
        return f"{lang}/index.html"
    cat = _CATEGORY_HREF_RE.search(html)
    if cat:
        return f"{lang}/categories/{cat.group(1)}"
    return f"{lang}/index.html"


def ensure_seo_head(markup: str, lang: str, rel_path: str = "") -> str:
    rel_path = rel_path or infer_html_rel_path(markup, lang)
    title_m = _TITLE_RE.search(markup)
    title = html.unescape(title_m.group(1)).strip() if title_m else "Birİnci"
    desc_m = _META_DESC_RE.search(markup)
    desc = html.unescape(desc_m.group(1)).strip() if desc_m else ""
    canonical = _public_url(rel_path)
    og_locale = OG_LOCALE.get(lang, lang)
    lines = [
        "  <!-- birinci-seo:start -->",
        f'  <link rel="canonical" href="{html.escape(canonical, quote=True)}" />',
    ]
    for hreflang, url in _hreflang_pairs(rel_path):
        lines.append(
            f'  <link rel="alternate" hreflang="{hreflang}" href="{html.escape(url, quote=True)}" />'
        )
    lines.extend(
        [
            '  <meta property="og:type" content="website" />',
            '  <meta property="og:site_name" content="Birİnci" />',
            f'  <meta property="og:title" content="{html.escape(title, quote=True)}" />',
            f'  <meta property="og:description" content="{html.escape(desc, quote=True)}" />',
            f'  <meta property="og:url" content="{html.escape(canonical, quote=True)}" />',
            f'  <meta property="og:image" content="{html.escape(OG_IMAGE_URL, quote=True)}" />',
            f'  <meta property="og:locale" content="{og_locale}" />',
            '  <meta name="twitter:card" content="summary_large_image" />',
            f'  <meta name="twitter:title" content="{html.escape(title, quote=True)}" />',
            f'  <meta name="twitter:description" content="{html.escape(desc, quote=True)}" />',
            f'  <meta name="twitter:image" content="{html.escape(OG_IMAGE_URL, quote=True)}" />',
            "  <!-- birinci-seo:end -->",
        ]
    )
    block = "\n".join(lines) + "\n"
    markup = _SEO_BLOCK_RE.sub("\n", markup)
    if re.search(r"</head>", markup, re.I):
        markup = re.sub(r"[ \t]*</head>", block + "</head>", markup, count=1, flags=re.I)
    return markup


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


def _footer_qr_asset_href(rel_path: str) -> str:
    """Relative href from an HTML file to assets/qr/birinci-cloud-qr.png."""
    depth = Path(rel_path.replace("\\", "/")).as_posix().count("/")
    prefix = "../" * depth if depth else ""
    return f"{prefix}assets/qr/birinci-cloud-qr.png?v={SITE_ASSET_VERSION}"


def ensure_footer_qr_html(markup: str, lang: str, *, rel_path: str = "") -> str:
    if not _FOOTER_ABOUT_COL_RE.search(markup):
        return markup
    alt = html.escape(FOOTER_QR_ALT.get(lang) or FOOTER_QR_ALT["en"])
    src = _footer_qr_asset_href(rel_path or "index.html")
    block = (
        f'<a class="footer-qr" href="{SITE_PUBLIC_ORIGIN}" '
        f'rel="noopener noreferrer" title="birinci.cloud">'
        f'<img class="footer-qr__img" src="{src}" alt="{alt}" '
        f'width="88" height="88" decoding="async" /></a>\n          '
    )
    return _FOOTER_ABOUT_COL_RE.sub(rf"\1\n          {block}\2", markup, count=1)


def _strip_hero_hearth_panel(html: str) -> str:
    if "about-hero__panel" not in html:
        return html
    return _DISCOVERIES_PANEL_RE.sub("", html, count=1)


def ensure_discoveries_hero_html(markup: str, lang: str) -> str:
    """Keep the discoveries title; drop the hearth-of-knowledge side panel."""
    if "inventions-page-body" not in markup and "inventions-entry" not in markup:
        return markup
    markup = _strip_hero_hearth_panel(markup)
    title = (
        _load_locale(lang).get("ui", {}).get("inventions", {}).get("page_title") or ""
    )
    if not title:
        return markup
    title_html = _about_title_html(title)
    escaped = html.escape(title)
    if _HERO_H1_RE.search(markup):
        markup = _HERO_H1_RE.sub(rf"\1{title_html}\3", markup, count=1)
    if _DOC_TITLE_RE.search(markup):
        markup = _DOC_TITLE_RE.sub(rf"\1{escaped}\3", markup, count=1)
    if _CRUMB_CURRENT_RE.search(markup):
        markup = _CRUMB_CURRENT_RE.sub(rf"\1{escaped}\3", markup, count=1)
    return markup


def ensure_about_hero_html(html: str, lang: str) -> str:
    """Keep the Mission title; drop the hearth-of-knowledge side panel."""
    if "page-about" not in html and "about-page" not in html:
        return html
    return _strip_hero_hearth_panel(html)


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
    tagline = ui.get("hero_lead", "Bilik və Mənəvi Dəyərlər İncisi")
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
        f'        <img src="../assets/pearl-hero.webp?v={ROOT_HOME_ASSET_VERSION}" '
        'alt="Birİnci" width="1536" height="1024" decoding="async" />\n'
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


# First breadcrumb item Home link (not Wisdom Stories / #kateqoriyalar).
_BREADCRUMB_HOME_LINK_RE = re.compile(
    r'(<ol class="breadcrumbs__list">\s*'
    r'<li class="breadcrumbs__item"[^>]*>\s*'
    r'<a href=")[^"]*(")',
    re.I,
)


def ensure_breadcrumb_home_href(html: str) -> str:
    """Point breadcrumb Home at the site root (same target as the brand logo)."""
    if "page-root-home" in html:
        return html
    if 'class="breadcrumbs"' not in html:
        return html
    href = site_root_index_href(html)
    return _BREADCRUMB_HOME_LINK_RE.sub(rf"\g<1>{href}\g<2>", html, count=1)


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
    if "page-root-home" in html:
        return f"{lang}/index.html?view=list"
    if "page-inventions" in html or 'data-lang-page="discoveries/' in html:
        return "../index.html?view=list"
    if re.search(r'href="\.\./(?:about|categories|discoveries)/', html):
        return "../index.html?view=list"
    match = re.search(r'href="([^"]*categories/[^"]+\.html)"', html)
    if match:
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


_LIT_FLAT_LINK_RE = re.compile(
    r'(<a class="primary-nav__link" href=")[^"]*(" data-nav-stories-all>'
    r'[\s\S]*?</svg></span>\s*<span>)([^<]*)(</span></a>)',
    re.I,
)
_LIT_BOOK_ICON_RE = re.compile(
    r'(<span class="menu-icon menu-icon--book"[^>]*>[\s\S]*?</span>)',
    re.I,
)


def _replace_balanced_details(html: str, class_name: str, replacement: str) -> str:
    """Replace a top-level ``<details class="... class_name ...">`` block."""
    removed = _remove_balanced_details(html, class_name)
    if removed == html:
        return html
    # Re-find the cut point by comparing prefixes is fragile; re-run locate.
    needle = f'class="nav-dropdown {class_name}"'
    start = html.find(f"<details {needle}")
    if start < 0:
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
                return html[:start] + replacement + html[i:]
            continue
        i += 1
    return html


def ensure_literature_submenu(source: str, lang: str) -> str:
    """Stories top-nav is a single link to the full collection (no submenu)."""
    label = html.escape(NAV_LITERATURE_LABEL.get(lang) or NAV_LITERATURE_LABEL["en"])
    href = html.escape(_stories_all_href(source, lang), quote=True)

    if "nav-dropdown--literature" in source:
        block_m = re.search(
            rf"<details\b[^>]*\bnav-dropdown--literature\b[\s\S]*?</details>",
            source,
            re.I,
        )
        icon = _ICON_LIST
        if block_m:
            icon_m = _LIT_BOOK_ICON_RE.search(block_m.group(0))
            if icon_m:
                icon = icon_m.group(1)
        link = (
            f'<a class="primary-nav__link" href="{href}" '
            f'data-nav-stories-all>{icon}<span>{label}</span></a>'
        )
        source = _replace_balanced_details(source, "nav-dropdown--literature", link)
        return ensure_literature_nav_label(source, lang)

    if _LIT_FLAT_LINK_RE.search(source):
        source = _LIT_FLAT_LINK_RE.sub(
            lambda m, h=href, t=label: m.group(1) + h + m.group(2) + t + m.group(4),
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


def _parse_site_js_i18n_blob(js: str) -> tuple[dict, int, int] | None:
    start = js.find(_I18N_ASSIGN_PREFIX)
    if start < 0:
        return None
    payload_start = start + len(_I18N_ASSIGN_PREFIX)
    decoder = json.JSONDecoder()
    try:
        blob, end = decoder.raw_decode(js, payload_start)
    except json.JSONDecodeError:
        return None
    if end < len(js) and js[end] == ";":
        end += 1
    return blob, start, end


def sync_site_js_i18n_blob(js: str, lang: str) -> str:
    parsed = _parse_site_js_i18n_blob(js)
    if not parsed:
        return js
    blob, start, end = parsed
    locale = _load_locale(lang)
    ui = locale.get("ui") or {}
    blob_ui = blob.setdefault("ui", {})
    for key in STORY_I18N_UI_KEYS:
        if key in ui:
            blob_ui[key] = ui[key]
    # Keep nested packs (about / inventions / sitemap) and common footer keys current.
    for key in ("about", "inventions", "sitemap", "footer_about", "footer_email_url", "hero_lead"):
        if key in ui:
            blob_ui[key] = ui[key]
    inventions = blob_ui.get("inventions")
    if isinstance(inventions, dict):
        for dead in DEAD_INVENTION_VIDEO_KEYS:
            inventions.pop(dead, None)
        loc_inv = ui.get("inventions") if isinstance(ui.get("inventions"), dict) else {}
        for key, value in loc_inv.items():
            inventions[key] = value
    if isinstance(locale.get("js"), dict):
        blob["js"] = locale["js"]
    dumped = json.dumps(blob, ensure_ascii=False, separators=(", ", ": "))
    return js[:start] + _I18N_ASSIGN_PREFIX + dumped + ";" + js[end:]


def write_lang_i18n_from_locale(lang: str) -> None:
    """Rebuild `{lang}/assets/i18n.js` from tools/locales/{lang}.json."""
    locale = _load_locale(lang)
    path = ROOT / lang / "assets" / "i18n.js"
    ui = dict(locale.get("ui") or {})
    inventions = ui.get("inventions")
    if isinstance(inventions, dict):
        for dead in DEAD_INVENTION_VIDEO_KEYS:
            inventions.pop(dead, None)
    tts_voice = ""
    show_audio = lang != "ky"
    show_discovery_listen = lang != "ky"
    try:
        langs = json.loads((ROOT / "languages.json").read_text(encoding="utf-8"))
        for row in langs.get("languages") or []:
            if isinstance(row, dict) and row.get("code") == lang:
                tts_voice = str(row.get("tts_voice") or "")
                if "show_audio_controls" in row:
                    show_audio = bool(row.get("show_audio_controls"))
                if "show_discovery_listen" in row:
                    show_discovery_listen = bool(row.get("show_discovery_listen"))
                break
    except (OSError, json.JSONDecodeError, TypeError):
        tts_voice = ""
    blob = {
        "lang": lang,
        "ui": ui,
        "js": locale.get("js") or {},
        "show_audio_controls": show_audio,
        "show_discovery_listen": show_discovery_listen,
        "tts_voice": tts_voice,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        _I18N_ASSIGN_PREFIX
        + json.dumps(blob, ensure_ascii=False, separators=(", ", ": "))
        + ";\n",
        encoding="utf-8",
    )

def split_site_js_i18n(js: str) -> tuple[str, str]:
    parsed = _parse_site_js_i18n_blob(js)
    if not parsed:
        return "", js
    _blob, start, end = parsed
    i18n = js[start:end].strip()
    if i18n and not i18n.endswith(";"):
        i18n += ";"
    rest = (js[:start] + js[end:]).lstrip("\n")
    return (i18n + "\n") if i18n else "", rest


def ensure_shared_site_js_tags(markup: str, lang: str, rel_path: str = "") -> str:
    rel_path = rel_path or infer_html_rel_path(markup, lang)
    if rel_path in ("", "index.html") or "page-root-home" in markup:
        i18n_src = f"az/assets/i18n.js?v={SITE_ASSET_VERSION}"
        site_src = f"assets/site.js?v={SITE_ASSET_VERSION}"
    elif rel_path.count("/") <= 1:
        i18n_src = f"assets/i18n.js?v={SITE_ASSET_VERSION}"
        site_src = f"../assets/site.js?v={SITE_ASSET_VERSION}"
    else:
        i18n_src = f"../assets/i18n.js?v={SITE_ASSET_VERSION}"
        site_src = f"../../assets/site.js?v={SITE_ASSET_VERSION}"
    block = (
        f'  <script src="{i18n_src}"></script>\n'
        f'  <script src="{site_src}" defer></script>\n'
    )
    if _SITE_RUNTIME_SCRIPTS_RE.search(markup):
        return _SITE_RUNTIME_SCRIPTS_RE.sub(block, markup, count=1)
    if _SITE_JS_ONLY_RE.search(markup):
        return _SITE_JS_ONLY_RE.sub(block, markup, count=1)
    return markup


def ensure_site_js_i18n_chrome(js: str) -> str:
    old_figure = (
        '      const figureHtml = story.hasImage\n'
        "        ? `\n"
        '    <figure class="story__figure" id="figure-${escapeHtml(story.stem)}">\n'
        '      <button type="button" class="story__figure-open" aria-label="${escapeHtml(story.title)} şəklini böyüt">\n'
        '        <img src="illustrations/${escapeHtml(story.stem)}.webp" alt="${escapeHtml(story.title)} illüstrasiyası" loading="lazy" width="1536" height="1024" />\n'
    )
    new_figure = (
        "      const enlargeLabel = escapeHtml(\n"
        '        tUi("enlarge_image", "{title} şəklini böyüt").replace("{title}", story.title || "")\n'
        "      );\n"
        "      const figAlt = escapeHtml(\n"
        '        tUi("illustration_alt", "{title} illüstrasiyası").replace("{title}", story.title || "")\n'
        "      );\n"
        "      const figureHtml = story.hasImage\n"
        "        ? `\n"
        '    <figure class="story__figure" id="figure-${escapeHtml(story.stem)}">\n'
        '      <button type="button" class="story__figure-open" aria-label="${enlargeLabel}">\n'
        '        <img src="illustrations/${escapeHtml(story.stem)}.webp" alt="${figAlt}" loading="lazy" width="1536" height="1024" />\n'
    )
    if old_figure in js:
        js = js.replace(old_figure, new_figure, 1)
    replacements = (
        (
            'aria-label="Böyüdülmüş illüstrasiya"',
            'aria-label="${tUi("lightbox_illustration", "Böyüdülmüş illüstrasiya")}"',
        ),
        (
            'aria-label="Böyüdülmüş hekayə mətni"',
            'aria-label="${tUi("lightbox_text", "Böyüdülmüş hekayə mətni")}"',
        ),
        (
            'class="illustration-lightbox__close" aria-label="Bağla"',
            'class="illustration-lightbox__close" aria-label="${tUi("close", "Bağla")}"',
        ),
        (
            'class="text-lightbox__close" aria-label="Bağla"',
            'class="text-lightbox__close" aria-label="${tUi("close", "Bağla")}"',
        ),
    )
    for old, new in replacements:
        if old in js:
            js = js.replace(old, new, 1)
    old_hide = (
        '    (root || document).querySelectorAll("[data-story-tts], [data-tools-play-visible]").forEach((el) => {'
    )
    new_hide = (
        '    (root || document).querySelectorAll("[data-story-tts], [data-tools-play-visible], [data-story-tts-note], .story-tts__note").forEach((el) => {'
    )
    if old_hide in js:
        js = js.replace(old_hide, new_hide, 1)
    js = js.replace(
        '    const storiesUrl = listPanel.getAttribute("data-stories-url") || "data/stories.json";\n',
        "",
        1,
    )
    js = js.replace(
        """          return loadCatalogViaScript().catch(() =>
            fetch(storiesUrl).then((res) => {
              if (!res.ok) throw new Error("fetch-failed");
              return res.json();
            })
          );""",
        "          return loadCatalogViaScript();",
        1,
    )
    return js


def _sitemap_nav_label(lang: str) -> str:
    loc = _load_locale(lang)
    label = ((loc.get("ui") or {}).get("sitemap") or {}).get("nav_item")
    if label:
        return str(label)
    return {
        "az": "Sayt xəritəsi",
        "en": "Sitemap",
        "ru": "Карта сайта",
        "ky": "Сайт картасы",
    }.get(lang, "Sitemap")


def _sitemap_nav_href(markup: str) -> str:
    if "page-root-home" in markup:
        return "az/sitemap.html"
    if re.search(r'href="\.\./(?:about|categories|discoveries)/', markup):
        return "../sitemap.html"
    if re.search(r'data-lang-page="(?:about|categories|discoveries)/', markup):
        return "../sitemap.html"
    return "sitemap.html"


def ensure_sitemap_nav_link(markup: str, lang: str) -> str:
    """Add or refresh the top-navbar Sitemap item."""
    active = (
        " is-active"
        if "page-sitemap" in markup or 'data-lang-page="sitemap.html"' in markup
        else ""
    )
    href = _sitemap_nav_href(markup)
    label = html.escape(_sitemap_nav_label(lang))
    link = (
        f'<a class="primary-nav__link{active}" href="{href}" data-nav-sitemap>'
        f"{_SITEMAP_NAV_ICON}<span>{label}</span></a>"
    )
    if _SITEMAP_NAV_RE.search(markup):
        return _SITEMAP_NAV_RE.sub(link, markup, count=1)
    if _ABOUT_DETAILS_RE.search(markup):
        return _ABOUT_DETAILS_RE.sub(rf"\1{link}", markup, count=1)

    def _append(match: re.Match[str]) -> str:
        return f"{match.group(1)}{match.group(2).rstrip()}{link}\n{match.group(3)}"

    return re.sub(
        r'(<nav class="primary-nav"[^>]*>)([\s\S]*?)(</nav>)',
        _append,
        markup,
        count=1,
        flags=re.I,
    )


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


def patch_emitted_html(
    html: str, lang: str, *, inventions: bool = False, rel_path: str = ""
) -> str:
    html = hide_empty_top_nav(html)
    html = ensure_discoveries_nav_link(html, lang)
    html = ensure_sitemap_nav_link(html, lang)
    html = ensure_page_jump_html(html, lang)
    html = ensure_literature_submenu(html, lang)
    html = ensure_literature_nav_label(html, lang)
    html = ensure_footer_about_html(html, lang)
    html = ensure_footer_qr_html(html, lang, rel_path=rel_path)
    html = ensure_brand_home_href(html)
    html = ensure_breadcrumb_home_href(html)
    html = ensure_stories_hero_html(html, lang)
    html = ensure_about_hero_html(html, lang)
    if inventions or "ocaq-video" in html or "inventions-entry" in html:
        if DISABLE_DISCOVERY_VIDEOS:
            html = strip_ocaq_videos(html)
        html = ensure_discoveries_hero_html(html, lang)
        html = ensure_discoveries_heading_order(html)
        html = strip_unused_inventions_scripts(html)
        html = slim_discoveries_search(html)
        html = fix_ky_illustration_prefix(html, lang)
    html = strip_data_audio(html)
    html = ensure_story_listen_markup(html, lang)
    html = strip_google_fonts(html)
    html = strip_stories_json_refs(html)
    html = ensure_shared_site_js_tags(html, lang, rel_path)
    html = pin_asset_versions(html)
    html = ensure_seo_head(html, lang, rel_path)
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
    update_locale_search_fail()
    css_path = ROOT / "assets" / "site.css"
    css_path.write_text(ensure_site_css_chrome(css_path.read_text(encoding="utf-8")), encoding="utf-8")

    shared_path = ROOT / "assets" / "site.js"
    shared_src = ""
    az_js = ROOT / "az" / "assets" / "site.js"
    if az_js.is_file():
        shared_src = az_js.read_text(encoding="utf-8")
    elif shared_path.is_file():
        shared_src = shared_path.read_text(encoding="utf-8")
    if shared_src:
        _i18n, rest = split_site_js_i18n(shared_src)
        rest = ensure_site_js_go_to_bottom(rest)
        rest = ensure_site_js_search(rest)
        rest = ensure_site_js_i18n_chrome(rest)
        shared_path.write_text(rest, encoding="utf-8")

    for lang in LIVE_LANGS:
        loc_path = ROOT / lang / "assets" / "site.js"
        i18n_path = ROOT / lang / "assets" / "i18n.js"
        if loc_path.is_file():
            js = loc_path.read_text(encoding="utf-8")
            js = _replace_i18n_index_failed(js, lang)
            js = sync_site_js_i18n_blob(js, lang)
            i18n_line, _rest = split_site_js_i18n(js)
            if i18n_line:
                i18n_path.parent.mkdir(parents=True, exist_ok=True)
                i18n_path.write_text(i18n_line, encoding="utf-8")
            loc_path.unlink()
        else:
            write_lang_i18n_from_locale(lang)

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

ROOT_HOME_ASSET_VERSION = SITE_ASSET_VERSION

ROOT_ENTRY_LANGS = ("az", "en", "ru", "ky")
ROOT_CHROME_UI_KEYS = (
    "skip_to_content",
    "open_menu",
    "close_menu",
    "main_menu",
    "lang_switcher_label",
    "sign_in",
    "sign_up",
    "sign_out",
    "auth_email",
    "auth_first_name",
    "auth_last_name",
    "auth_password",
    "auth_display_name",
    "auth_lead_login",
    "auth_lead_register",
    "auth_close",
    "auth_forgot",
    "auth_have_account",
    "auth_need_account",
    "auth_account",
    "settings",
    "settings_lead",
    "settings_save",
    "settings_saved",
    "settings_delete",
    "settings_delete_lead",
    "settings_delete_confirm",
    "settings_delete_forever",
    "settings_delete_cancel",
    "pref_view_stories",
    "pref_view_category",
    "pref_view_discoveries",
    "pref_view_list",
    "pref_view_cards",
    "pref_hide_images",
    "pref_hide_texts",
    "pref_verified",
    "pref_unverified",
    "pref_locale",
    "auth_no_account",
    "auth_create_account",
    "auth_bad_password",
    "auth_need_signin",
    "auth_photo",
    "auth_photo_hint",
    "search",
    "search_aria",
    "global_search",
    "global_search_toggle",
    "global_search_title_attr",
    "close_search",
    "close",
    "enlarge_image",
    "illustration_alt",
    "lightbox_illustration",
    "lightbox_text",
    "search_stories_label",
    "search_stories_placeholder",
    "search_filter_label",
    "search_results_count",
    "clear_search_filter",
    "go_to_bottom",
    "back_to_top",
    "footer_contact",
    "footer_phone",
    "footer_address",
    "footer_email",
    "footer_website",
    "site_description",
)

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
    if (L.page_title) {
      document.title = L.page_title;
      var ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", L.page_title);
      var twTitle = document.querySelector('meta[name="twitter:title"]');
      if (twTitle) twTitle.setAttribute("content", L.page_title);
    }
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
    var storiesAll = document.querySelector("[data-nav-stories-all]");
    if (storiesAll) {
      if (L.stories_all_href) storiesAll.href = L.stories_all_href;
      var litNav = storiesAll.querySelector("span:not(.menu-icon)");
      if (litNav && L.nav_label) litNav.textContent = L.nav_label;
    }
    var search = document.getElementById("global-search");
    if (search && L.search_index) search.setAttribute("data-search-index", L.search_index);
    var ui = L.ui || {};
    function setText(el, text) {
      if (el && text) el.textContent = text;
    }
    function setAttr(el, name, value) {
      if (el && value) el.setAttribute(name, value);
    }
    setText(document.querySelector(".skip-link"), ui.skip_to_content);
    setAttr(document.getElementById("nav-toggle"), "aria-label", ui.open_menu);
    setAttr(document.getElementById("primaryNav"), "aria-label", ui.main_menu);
    setAttr(document.querySelector(".lang-switcher"), "aria-label", ui.lang_switcher_label);
    var disc = document.querySelector('.primary-nav a[href*="discoveries"]');
    if (disc) {
      if (L.discoveries_href) disc.setAttribute("href", L.discoveries_href);
      setText(disc.querySelector("span:not(.menu-icon)"), L.discoveries_label);
    }
    setText(
      document.querySelector(".nav-dropdown--about .nav-dropdown__summary > span:not(.menu-icon)"),
      L.about_label
    );
    var aboutLink = document.querySelector(".nav-dropdown--about .nav-dropdown-link");
    if (aboutLink && L.about_href) aboutLink.setAttribute("href", L.about_href);
    setText(document.querySelector(".nav-dropdown--about .nav-dropdown-link-title"), L.about_item);
    var searchToggle = document.getElementById("global-search-toggle");
    setAttr(searchToggle, "title", ui.global_search_title_attr);
    setAttr(searchToggle, "aria-label", ui.global_search_toggle);
    setText(document.querySelector(".global-search-toggle__label"), ui.search);
    setText(document.getElementById("global-search-title"), ui.global_search);
    document.querySelectorAll("[data-global-search-close]").forEach(function (btn) {
      setAttr(
        btn,
        "aria-label",
        btn.classList.contains("global-search__backdrop") ? ui.close_search : ui.close
      );
    });
    setText(document.querySelector(".global-search__field .visually-hidden"), ui.search_stories_label);
    var searchInput = document.getElementById("global-search-input");
    if (searchInput && ui.search_stories_placeholder) {
      searchInput.setAttribute("placeholder", ui.search_stories_placeholder);
    }
    setAttr(document.querySelector(".page-jump"), "aria-label", L.page_jump);
    var goBottom = document.getElementById("go-to-bottom");
    setAttr(goBottom, "title", ui.go_to_bottom);
    setAttr(goBottom, "aria-label", ui.go_to_bottom);
    var backTop = document.getElementById("back-to-top");
    setAttr(backTop, "title", ui.back_to_top);
    setAttr(backTop, "aria-label", ui.back_to_top);
    setText(document.querySelector(".footer-logo__tagline"), L.hero_lead);
    setText(document.querySelector(".footer-contact__title"), ui.footer_contact);
    var meta = document.querySelector('meta[name="description"]');
    if (meta && L.meta_description) meta.setAttribute("content", L.meta_description);
    if (L.meta_description) {
      var ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", L.meta_description);
      var twDesc = document.querySelector('meta[name="twitter:description"]');
      if (twDesc) twDesc.setAttribute("content", L.meta_description);
    }
    var ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale && L.og_locale) ogLocale.setAttribute("content", L.og_locale);
    var runtime = window.__BIRINCI_I18N__;
    if (runtime) {
      runtime.lang = code;
      if (!runtime.ui) runtime.ui = {};
      Object.keys(ui).forEach(function (key) {
        runtime.ui[key] = ui[key];
      });
      if (L.js) {
        if (!runtime.js) runtime.js = {};
        Object.keys(L.js).forEach(function (key) {
          runtime.js[key] = L.js[key];
        });
      }
    }
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
    if (typeof window.__birinciRefreshAuthChrome === "function") {
      window.__birinciRefreshAuthChrome();
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
  document.addEventListener("DOMContentLoaded", function () {
    applyLang(readLang());
  });
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
        "page_jump": PAGE_JUMP_NAV.get(lang, PAGE_JUMP_NAV["en"]),
        "page_title": data.get("site_name") or "Birİnci",
        "og_locale": OG_LOCALE.get(lang, lang),
        "meta_description": ui.get("site_description", ""),
        "discoveries_label": inv.get("page_title", ""),
        "discoveries_href": f"{lang}/discoveries/discoveries-and-inventions.html",
        "about_label": about.get("kicker", ""),
        "about_item": about.get("nav_item") or about.get("page_title", ""),
        "about_href": f"{lang}/about/mission-vision-values.html",
        "ui": {key: ui[key] for key in ROOT_CHROME_UI_KEYS if key in ui},
        "js": data.get("js") or {},
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
    """Copy AZ home chrome to the site root: navbar, breadcrumbs, hero, footer."""
    html = az_html

    # Keep the sticky breadcrumbs strip (Home only) — do not strip it.
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
    html = html.replace('href="categories/', 'href="az/categories/')
    html = html.replace('href="discoveries/', 'href="az/discoveries/')
    html = html.replace('href="about/', 'href="az/about/')
    html = html.replace('href="sitemap.html"', 'href="az/sitemap.html"')
    html = html.replace('href="index.html?view=list"', 'href="az/index.html?view=list"')
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
    html = strip_google_fonts(html)
    html = strip_stories_json_refs(html)
    html = ensure_shared_site_js_tags(html, "az", "index.html")
    html = pin_asset_versions(html)
    html = ensure_seo_head(html, "az", "index.html")
    (ROOT / "index.html").write_text(html, encoding="utf-8")


def apply_story_audio_cleanup() -> None:
    for lang in LIVE_LANGS:
        for rel in (
            Path(lang) / "assets" / "stories-data.js",
        ):
            path = ROOT / rel
            if not path.is_file():
                continue
            text = path.read_text(encoding="utf-8")
            new = text.replace('"hasAudio": true', '"hasAudio": false')
            if new != text:
                path.write_text(new, encoding="utf-8")
    manifest = ROOT / "az" / "audio" / "manifest.json"
    if manifest.is_file():
        manifest.unlink()
    for lang in LIVE_LANGS:
        path = ROOT / lang / "data" / "stories.json"
        if path.is_file():
            path.unlink()
        data_dir = ROOT / lang / "data"
        if data_dir.is_dir() and not any(data_dir.iterdir()):
            data_dir.rmdir()


def apply_invention_source_bodies() -> None:
    for lang in LIVE_LANGS:
        path = TOOLS / "inventions" / f"{lang}-body.html"
        if not path.is_file():
            continue
        markup = path.read_text(encoding="utf-8")
        new = slim_discoveries_search(markup)
        new = fix_ky_illustration_prefix(new, lang)
        if new != markup:
            path.write_text(new, encoding="utf-8")


def write_public_seo_files() -> None:
    urls = [_public_url("index.html")]
    for lang in LIVE_LANGS:
        urls.append(_public_url(f"{lang}/index.html"))
        about = ROOT / lang / "about" / "mission-vision-values.html"
        if about.is_file():
            urls.append(_public_url(f"{lang}/about/mission-vision-values.html"))
        sitemap = ROOT / lang / "sitemap.html"
        if sitemap.is_file():
            urls.append(_public_url(f"{lang}/sitemap.html"))
        disc = ROOT / lang / "discoveries" / "discoveries-and-inventions.html"
        if disc.is_file():
            urls.append(_public_url(f"{lang}/discoveries/discoveries-and-inventions.html"))
        cat = ROOT / lang / "categories"
        if cat.is_dir():
            for path in sorted(cat.glob("*.html")):
                urls.append(_public_url(f"{lang}/categories/{path.name}"))
    today = "2026-08-19"
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for url in urls:
        lines.extend(
            [
                "  <url>",
                f"    <loc>{html.escape(url)}</loc>",
                f"    <lastmod>{today}</lastmod>",
                "  </url>",
            ]
        )
    lines.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (ROOT / "robots.txt").write_text(
        "User-agent: *\n"
        "Allow: /\n"
        f"Sitemap: {SITE_PUBLIC_ORIGIN}/sitemap.xml\n",
        encoding="utf-8",
    )
    (ROOT / "404.html").write_text(_NOT_FOUND_HTML, encoding="utf-8")


def _load_stories_blob(lang: str) -> dict:
    path = ROOT / lang / "assets" / "stories-data.js"
    text = path.read_text(encoding="utf-8")
    prefix = "window.__BIRINCI_STORIES__ = "
    start = text.find(prefix)
    if start < 0:
        raise ValueError(f"Missing stories blob in {path}")
    blob, _end = json.JSONDecoder().raw_decode(text, start + len(prefix))
    return blob


def write_translation_manifest() -> None:
    blobs = {
        lang: _load_stories_blob(lang)
        for lang in LIVE_LANGS
        if (ROOT / lang / "assets" / "stories-data.js").is_file()
    }
    present = {
        lang: {
            story.get("stem")
            for cat in (blob.get("categories") or [])
            for story in (cat.get("stories") or [])
            if story.get("stem") and story.get("paragraphs")
        }
        for lang, blob in blobs.items()
    }
    az = blobs["az"]
    stems: dict[str, dict[str, str]] = {}
    for cat in az.get("categories") or []:
        for story in cat.get("stories") or []:
            stem = story.get("stem")
            if not stem:
                continue
            entry: dict[str, str] = {}
            for lang in LIVE_LANGS:
                entry[f"text_{lang}"] = "done" if stem in present.get(lang, set()) else "pending"
                entry[f"audio_{lang}"] = "pending"
                illu = ROOT / lang / "illustrations" / f"{stem}.webp"
                entry[f"illustration_{lang}"] = "done" if illu.is_file() else "pending"
            stems[stem] = entry
    dest = ROOT / "docs" / "i18n" / "translation_manifest.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps({"stems": stems}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def apply_all_html() -> int:
    update_locale_discoveries_descriptions()
    n = 0
    for lang in LIVE_LANGS:
        base = ROOT / lang
        if not base.is_dir():
            continue
        paths = [base / "index.html"]
        about = base / "about" / "mission-vision-values.html"
        if about.is_file():
            paths.append(about)
        sitemap = base / "sitemap.html"
        if sitemap.is_file():
            paths.append(sitemap)
        disc = base / "discoveries" / "discoveries-and-inventions.html"
        if disc.is_file():
            paths.append(disc)
        cat = base / "categories"
        if cat.is_dir():
            paths.extend(sorted(cat.glob("*.html")))
        for path in paths:
            if not path.is_file():
                continue
            markup = path.read_text(encoding="utf-8")
            inventions = "discoveries" in path.parts or "ocaq-video" in markup
            rel = path.relative_to(ROOT).as_posix()
            new_html = patch_emitted_html(
                markup, lang, inventions=inventions, rel_path=rel
            )
            if new_html != markup:
                path.write_text(new_html, encoding="utf-8")
                n += 1
    write_root_home()
    n += 1
    return n


def apply_review_fixes() -> int:
    apply_shared_assets()
    apply_story_audio_cleanup()
    apply_invention_source_bodies()
    n = apply_all_html()
    n += write_html_sitemaps(
        lambda markup, lang, rel_path="": patch_emitted_html(
            markup, lang, rel_path=rel_path
        )
    )
    write_public_seo_files()
    write_translation_manifest()
    return n


if __name__ == "__main__":
    count = apply_review_fixes()
    print(f"chrome_restore: patched {count} HTML files; asset {SITE_ASSET_VERSION}")

