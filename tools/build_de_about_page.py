# -*- coding: utf-8 -*-
"""Build de/about/mission-vision-values.html from DE locale copy + shared chrome."""
from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
if str(TOOLS) not in sys.path:
    sys.path.insert(0, str(TOOLS))

from chrome_restore import (  # noqa: E402
    SITE_ASSET_VERSION,
    SITE_CHROME_ASSET_VERSION,
    _about_title_html,
    ensure_lang_switcher_dropdown,
    ensure_seo_head,
    patch_emitted_html,
    pin_asset_versions,
)


def _e(text: str) -> str:
    return html.escape(str(text or ""), quote=False)


def _eq(text: str) -> str:
    return html.escape(str(text or ""), quote=True)


def build_main(about: dict) -> str:
    title = about.get("page_title") or "Unsere Mission, Vision und Werte"
    lead = about.get("card_description") or about.get("page_description") or ""
    values = about.get("values") or []
    pills = "".join(
        f'<a class="about-pill" href="#vd-{i}">'
        f'<span class="about-pill__name">{_e(item.get("name", ""))}</span></a>'
        for i, item in enumerate(values, 1)
    )
    details = "".join(
        f'<article class="about-vd" id="vd-{i}">\n'
        f'  <h3 class="about-vd__title">{_e(item.get("name", ""))}</h3>\n'
        f'  <p class="about-vd__gloss">{_e(item.get("gloss", ""))}</p>\n'
        f"</article>"
        for i, item in enumerate(values, 1)
    )
    img = f"../../assets/mission.webp?v={SITE_ASSET_VERSION}"
    return f"""<div class="about-page">
  <section class="intro">
    <div class="intro__atmosphere" aria-hidden="true"></div>
    <div class="intro__content">
      <div class="intro__copy">
        <h1 class="intro__brand" id="about-hero-title">{_about_title_html(title)}</h1>
        <p class="intro__lead">{_e(lead)}</p>
      </div>
      <div class="intro__visual">
        <img src="{img}" alt="{_eq(title)}" width="1536" height="1024" decoding="async" />
      </div>
    </div>
  </section>

  <div class="about-main">
    <section class="about-core" aria-label="{_eq(title)}">
      <article class="about-card" id="missiya">
        <div class="about-card__head">
          <span class="about-card__icon" aria-hidden="true">🏛</span>
          <h2>{_e(about.get("mission_title") or "Mission")}</h2>
        </div>
        <div class="about-card__body">
          <p class="about-card__text">{_e(about.get("mission_body") or "")}</p>
        </div>
      </article>
      <article class="about-card" id="baxis">
        <div class="about-card__head">
          <span class="about-card__icon" aria-hidden="true">🌐</span>
          <h2>{_e(about.get("vision_title") or "Vision")}</h2>
        </div>
        <div class="about-card__body">
          <p class="about-card__text">{_e(about.get("vision_body") or "")}</p>
        </div>
      </article>
      <article class="about-card" id="deyerler">
        <div class="about-card__head">
          <span class="about-card__icon" aria-hidden="true">⭐</span>
          <h2>{_e(about.get("values_title") or "Unsere Werte")}</h2>
        </div>
        <div class="about-card__body">
          <div class="about-pills">{pills}</div>
        </div>
      </article>
    </section>

    <section class="about-values-block" id="values-detail" aria-labelledby="about-values-detail-title">
      <header class="about-values-block__head">
        <h2 id="about-values-detail-title">{_e(about.get("values_title") or "Unsere Werte")}</h2>
        <p>{_e(about.get("values_intro") or "")}</p>
      </header>
      <div class="about-vd-grid about-vd-grid--seven">
        {details}
      </div>
    </section>
  </div>
</div>
"""


def _local_about_href(path: Path) -> str:
    rel = path.relative_to(ROOT / "de")
    depth = len(rel.parts) - 1
    if rel.parts[0] == "about":
        return "mission-vision-values.html"
    if depth <= 0:
        return "about/mission-vision-values.html"
    return f'{"../" * depth}about/mission-vision-values.html'


def retarget_de_about_nav_links() -> int:
    """Point German About nav/sitemap/breadcrumb links at the local page."""
    changed = 0
    # Match either attribute order on the About mega-menu link only.
    mission_re = re.compile(
        r'(<a\b(?=[^>]*\bdata-nav-id="mission")[^>]*\bhref=")[^"]+(")',
        re.I,
    )
    card_re = re.compile(
        r'(<a class="sitemap-card sitemap-card--about" href=")[^"]+(")',
        re.I,
    )
    crumb_re = re.compile(
        r'(<nav class="breadcrumbs"[\s\S]*?<a\b[^>]*\bhref=")[^"]*?(?:en/)?about/mission-vision-values\.html(")',
        re.I,
    )
    for path in (ROOT / "de").rglob("*.html"):
        if "_reviews" in path.parts:
            continue
        text = path.read_text(encoding="utf-8")
        local = _local_about_href(path)
        new = mission_re.sub(rf"\1{local}\2", text)
        new = card_re.sub(rf"\1{local}\2", new)
        new = crumb_re.sub(rf"\1{local}\2", new)
        new = new.replace(
            "Unsere Mission, Vision und Werte (Englisch)",
            "Unsere Mission, Vision und Werte",
        )
        if new != text:
            path.write_text(new, encoding="utf-8", newline="\n")
            changed += 1
    return changed


def main() -> None:
    locale = json.loads((TOOLS / "locales" / "de.json").read_text(encoding="utf-8"))
    ui = locale.get("ui") or {}
    about = ui.get("about") or {}
    title = about.get("page_title") or "Unsere Mission, Vision und Werte"
    desc = about.get("page_description") or ""
    site = locale.get("site_name") or "Birİnci"
    full_title = f"{title} · {site}"

    # Chrome template: German feedback page (same locale chrome).
    template = (ROOT / "de" / "feedback.html").read_text(encoding="utf-8")
    # Lift asset paths from de/ → de/about/ (one extra ../).
    template = template.replace('href="../', 'href="../../')
    template = template.replace('src="../', 'src="../../')
    template = template.replace('data-search-index="assets/', 'data-search-index="../assets/')
    template = template.replace('href="index.html', 'href="../index.html')
    template = template.replace('href="privacy-notice.html', 'href="../privacy-notice.html')
    template = template.replace('href="terms-of-use.html', 'href="../terms-of-use.html')
    template = template.replace('href="cookie-policy.html', 'href="../cookie-policy.html')
    template = template.replace('href="legal-notice.html', 'href="../legal-notice.html')
    template = template.replace('href="feedback.html', 'href="../feedback.html')
    template = template.replace('href="sitemap.html', 'href="../sitemap.html')
    template = template.replace('href="user-manual.html', 'href="../user-manual.html')
    # Shared root assets stay two levels up from de/about/.
    template = template.replace(
        'src="../assets/force-local-http.js"',
        'src="../../assets/force-local-http.js"',
    )
    template = template.replace(
        'src="../../assets/force-local-http.js"',
        'src="../../assets/force-local-http.js"',
    )

    template = re.sub(
        r"<title>.*?</title>",
        f"<title>{_e(full_title)}</title>",
        template,
        count=1,
        flags=re.I | re.S,
    )
    template = re.sub(
        r'<meta name="description" content="[^"]*"\s*/?>',
        f'<meta name="description" content="{_eq(desc)}" />',
        template,
        count=1,
        flags=re.I,
    )
    template = re.sub(
        r'<body\b[^>]*>',
        '<body class="page-about" id="top" data-lang="de" data-lang-page="about/mission-vision-values.html">',
        template,
        count=1,
        flags=re.I,
    )
    # Drop legal/feedback-only stylesheets that feedback carries.
    template = re.sub(
        r'\s*<link rel="stylesheet" href="[^"]*inventions/[^"]*"\s*/?>',
        "",
        template,
        flags=re.I,
    )

    main_html = build_main(about)
    template = re.sub(
        r"<main\b[^>]*>[\s\S]*?</main>",
        f"<main id=\"main\">\n\n{main_html}\n  </main>",
        template,
        count=1,
        flags=re.I,
    )

    # Breadcrumbs placeholder; chrome_restore fills them.
    crumb = (
        '<nav class="breadcrumbs" aria-label="Brotkrumen">\n'
        '  <div class="breadcrumbs__inner">\n'
        '    <ol class="breadcrumbs__list">\n'
        '      <li class="breadcrumbs__item"><a href="../../index.html">Startseite</a></li>'
        f'<li class="breadcrumbs__item"><span>{_e(about.get("kicker") or "Über uns")}</span></li>'
        f'<li class="breadcrumbs__item" aria-current="page"><span>{_e(title)}</span></li>\n'
        "    </ol>\n"
        "  </div>\n"
        "</nav>"
    )
    if re.search(r'<nav class="breadcrumbs"', template):
        template = re.sub(
            r'<nav class="breadcrumbs"[\s\S]*?</nav>',
            crumb,
            template,
            count=1,
            flags=re.I,
        )
    else:
        template = template.replace("<main id=\"main\">", crumb + "\n<main id=\"main\">", 1)

    # Clear feedback aria-current; mark mission current via patch.
    template = template.replace(' data-nav-feedback aria-current="page"', " data-nav-feedback")
    template = re.sub(
        r'(data-nav-id="mission")([^>]*>)',
        r'\1 aria-current="page"\2',
        template,
        count=1,
    )

    dest = ROOT / "de" / "about" / "mission-vision-values.html"
    dest.parent.mkdir(parents=True, exist_ok=True)
    # Write a stub first so ensure_lang_switcher / hreflang see the file on disk.
    if not dest.is_file():
        dest.write_text("<!-- stub -->\n", encoding="utf-8")

    markup = patch_emitted_html(template, "de", rel_path="de/about/mission-vision-values.html")
    markup = ensure_lang_switcher_dropdown(markup, "de", "de/about/mission-vision-values.html")
    markup = ensure_seo_head(markup, "de", rel_path="de/about/mission-vision-values.html")
    markup = pin_asset_versions(markup)
    markup = re.sub(
        r'(src="(?:(?:\.\./){0,3}assets/site\.js)\?v=)[^"]+(")',
        rf"\g<1>{SITE_CHROME_ASSET_VERSION}\2",
        markup,
    )
    # Stories home from about/ is one level up.
    markup = markup.replace('href="index.html?view=list"', 'href="../index.html?view=list"')
    # About pages must not inherit the home/stories tools bar from feedback chrome.
    markup = re.sub(
        r'\n<div class="page-toolbar"[^>]*>[\s\S]*?</div></div>\s*(?=\n\s*<main\b)',
        "\n",
        markup,
        count=1,
        flags=re.I,
    )
    dest.write_text(markup, encoding="utf-8", newline="\n")
    print(f"wrote {dest.relative_to(ROOT).as_posix()}")

    changed = retarget_de_about_nav_links()
    print(f"retargeted about nav on {changed} German HTML files")

    # Refresh this page again after retarget + sibling pages' DE switcher/SEO.
    final = dest.read_text(encoding="utf-8")
    final = ensure_lang_switcher_dropdown(final, "de", "de/about/mission-vision-values.html")
    final = ensure_seo_head(final, "de", rel_path="de/about/mission-vision-values.html")
    final = pin_asset_versions(final)
    final = re.sub(
        r'(src="(?:(?:\.\./){0,3}assets/site\.js)\?v=)[^"]+(")',
        rf"\g<1>{SITE_CHROME_ASSET_VERSION}\2",
        final,
    )
    dest.write_text(final, encoding="utf-8", newline="\n")

    for lang in ("az", "en", "ru", "ky"):
        path = ROOT / lang / "about" / "mission-vision-values.html"
        if not path.is_file():
            continue
        text = path.read_text(encoding="utf-8")
        text = ensure_lang_switcher_dropdown(
            text, lang, f"{lang}/about/mission-vision-values.html"
        )
        text = ensure_seo_head(text, lang, rel_path=f"{lang}/about/mission-vision-values.html")
        text = pin_asset_versions(text)
        text = re.sub(
            r'(src="(?:(?:\.\./){0,3}assets/site\.js)\?v=)[^"]+(")',
            rf"\g<1>{SITE_CHROME_ASSET_VERSION}\2",
            text,
        )
        path.write_text(text, encoding="utf-8", newline="\n")
        print(f"updated switcher/seo on {path.relative_to(ROOT).as_posix()}")

    from html_sitemap import write_html_sitemaps  # noqa: WPS433

    write_html_sitemaps(patch_emitted_html, langs=("de",))
    # Sitemap rebuild may restore English About fallbacks on german-docx pages; fix again.
    changed = retarget_de_about_nav_links()
    print(f"rebuilt de/sitemap.html; retarget pass 2 on {changed} files")


if __name__ == "__main__":
    main()
