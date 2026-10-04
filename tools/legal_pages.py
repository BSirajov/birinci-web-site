# -*- coding: utf-8 -*-
"""Emit {lang}/feedback.html and other legal pages from locale home chrome."""
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

from legal_copy import (  # noqa: E402
    CALLOUTS,
    FORM_TYPE_OPTIONS,
    HIGHLIGHTS_TITLE,
    PANEL_TITLE,
    PLAIN_LABEL,
    PLAINS,
    page_for,
)
from legal_meta import (  # noqa: E402
    ABOUT_LEGAL_GROUP_TITLE,
    ABOUT_LEGAL_NESTED_FILES,
    LEGAL_HTML_FILES,
    render_breadcrumbs_nav,
)

LIVE_LANGS = ("az", "en", "ru", "ky")

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


_URL_RE = re.compile(r"https?://[^\s<>]+")
_EMAIL_RE = re.compile(r"\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b")
_MARK_NEEDLES = (
    "We do not sell personal data",
    "Şəxsi məlumat satmırıq",
    "Мы не продаём персональные данные",
    "Жеке маалыматты сатпайбыз",
    "not invented",
    "uydurulmur",
    "не выдуманы",
    "ойлоп табылбайт",
    "do not load analytics",
    "analitika kukisi yoxdur",
    "нет cookie аналитики",
    "аналитика cookie жок",
)


def _esc(text: str) -> str:
    return html.escape(str(text or ""), quote=False)


def _rich(text: str) -> str:
    raw = str(text or "")
    parts: list[str] = []
    last = 0
    for match in _URL_RE.finditer(raw):
        parts.append(_link_emails(_esc(raw[last : match.start()])))
        url = match.group(0).rstrip(").,;")
        parts.append(
            f'<a href="{html.escape(url, quote=True)}" rel="noopener noreferrer">{_esc(url)}</a>'
        )
        last = match.start() + len(url)
    parts.append(_link_emails(_esc(raw[last:])))
    return "".join(parts)


def _link_emails(escaped: str) -> str:
    return _EMAIL_RE.sub(
        lambda m: f'<a href="mailto:{html.escape(m.group(0), quote=True)}">{m.group(0)}</a>',
        escaped,
    )


def _privacy_label_html(form: dict) -> str:
    label = _esc(form["privacy_label"])
    link_text = _esc(form["privacy_link"])
    if link_text and link_text in label:
        return label.replace(
            link_text,
            f'<a href="privacy-notice.html">{link_text}</a>',
            1,
        )
    return f'{label} (<a href="privacy-notice.html">{link_text}</a>)'


def _mark_highlight(text: str) -> str:
    body = _rich(text)
    if any(needle.lower() in text.lower() for needle in _MARK_NEEDLES):
        return f'<mark class="legal-mark">{body}</mark>'
    return body


def _load_locale(lang: str) -> dict:
    return json.loads((TOOLS / "locales" / f"{lang}.json").read_text(encoding="utf-8"))


def _home_crumb(lang: str) -> str:
    return str(_load_locale(lang).get("home_crumb") or "Home")


def _about_crumb(lang: str) -> str:
    loc = _load_locale(lang)
    about = (loc.get("ui") or {}).get("about") or {}
    return str(about.get("kicker") or "About")


def _legal_group_crumb(lang: str) -> str:
    loc = _load_locale(lang)
    ui = loc.get("ui") or {}
    return str(
        ui.get("nav_legal_group")
        or ui.get("legal_crumb")
        or ABOUT_LEGAL_GROUP_TITLE.get(lang)
        or "Legal information"
    )


def _legal_breadcrumbs_html(lang: str, filename: str, page_title: str) -> str:
    home = _home_crumb(lang)
    about = _about_crumb(lang)
    items: list[tuple[str | None, str, bool]] = [
        ("index.html", home, False),
        ("about/mission-vision-values.html", about, False),
    ]
    if filename in ABOUT_LEGAL_NESTED_FILES:
        items.append((None, _legal_group_crumb(lang), False))
    items.append((None, page_title, True))
    return render_breadcrumbs_nav(items, lang)


def _slug_from_file(name: str) -> str:
    return name.replace(".html", "")


def _section_html(sec: dict) -> str:
    paras = "".join(f"<p>{_rich(p)}</p>" for p in (sec.get("paragraphs") or []) if p)
    bullets = sec.get("bullets") or []
    ul = ""
    if bullets:
        items = "".join(f"<li>{_rich(item)}</li>" for item in bullets)
        ul = f"<ul>{items}</ul>"
    heading = f'<h2 id="{html.escape(sec["id"], quote=True)}">{_esc(sec["heading"])}</h2>'
    body = f"{paras}{ul}"
    if sec.get("id") == "missing":
        return f'<div class="legal-note">{heading}{body}</div>'
    return f"{heading}{body}"


def _form_html(lang: str, form: dict) -> str:
    options = "".join(
        f'<option value="{html.escape(value, quote=True)}">{_esc(label)}</option>'
        for value, label in FORM_TYPE_OPTIONS.get(lang, FORM_TYPE_OPTIONS["en"])
    )
    email_ph = html.escape(form.get("email_placeholder") or "example@email.com", quote=True)
    url_ph = html.escape(form.get("url_placeholder") or f"https://birinci.cloud/{lang}/…", quote=True)
    accept = (
        ".jpg,.jpeg,.png,.webp,.gif,.pdf,"
        "image/jpeg,image/png,image/webp,image/gif,application/pdf"
    )
    return (
        '<form class="legal-feedback-form" id="feedbackForm" action="mail-feedback.php" '
        'method="post" enctype="multipart/form-data" novalidate>\n'
        '<input type="hidden" name="form_kind" value="feedback" />\n'
        '<input type="hidden" name="form_started" id="form-started" value="" />\n'
        '<input type="hidden" name="submitted_at" id="submitted-at" value="" />\n'
        '<input type="hidden" name="page_url" id="page-url" value="" />\n'
        '<div class="form-section active" id="sec-feedback">\n'
        '<div class="section-header">\n'
        '<div class="section-num">1</div>\n'
        f'<div class="section-title">{_esc(form["section_title"])}'
        f"<small>{_esc(form['section_sub'])}</small></div>\n"
        "</div>\n"
        '<div class="section-body" id="sec-feedback-body">\n'
        f'<div class="intro-box">{_esc(form["intro"])} {_esc(form["required_note"])}</div>\n'
        '<div class="field-group field-group--name">\n'
        f'<label class="field-label" for="name">{_esc(form["name_label"])} '
        '<span class="req">*</span></label>\n'
        '<input type="text" id="name" name="name" maxlength="120" autocomplete="name" required />\n'
        "</div>\n"
        '<div class="field-group field-group--email">\n'
        f'<label class="field-label" for="email">{_esc(form["email_label"])} '
        '<span class="req">*</span></label>\n'
        f'<input type="email" id="email" name="email" maxlength="200" autocomplete="email" '
        f'inputmode="email" placeholder="{email_ph}" required />\n'
        "</div>\n"
        '<div class="field-group field-group--type">\n'
        f'<label class="field-label" for="feedback-type">{_esc(form["type_label"])} '
        '<span class="req">*</span></label>\n'
        f'<select id="feedback-type" name="feedback_type" required>{options}</select>\n'
        "</div>\n"
        '<div class="field-group field-group--subject">\n'
        f'<label class="field-label" for="subject">{_esc(form["subject_label"])} '
        f'<span class="req">*</span> <span class="field-label-optional">{_esc(form["subject_hint"])}'
        "</span></label>\n"
        '<input type="text" id="subject" name="subject" maxlength="200" required autocomplete="off" />\n'
        "</div>\n"
        '<div class="field-group field-group--message">\n'
        f'<label class="field-label" for="message">{_esc(form["message_label"])} '
        '<span class="req">*</span></label>\n'
        '<textarea name="message" id="message" class="form-textarea-tall" maxlength="5000" '
        "required rows=\"8\"></textarea>\n"
        "</div>\n"
        '<div class="field-group field-group--url">\n'
        f'<label class="field-label" for="related-url">{_esc(form["url_label"])} '
        f'<span class="field-label-optional">{_esc(form["url_optional"])}</span></label>\n'
        f'<span class="field-hint" id="related-url-hint">{_esc(form["url_hint"])}</span>\n'
        f'<input type="text" id="related-url" name="related_url" maxlength="500" inputmode="url" '
        f'autocomplete="url" aria-describedby="related-url-hint" placeholder="{url_ph}" />\n'
        "</div>\n"
        '<div class="app-file-uploads" id="app-file-uploads">\n'
        '<div class="app-file-card" data-file-kind="attachment">\n'
        f'<label class="field-label" for="attachment">{_esc(form["file_label"])} '
        f'<span class="field-label-optional">{_esc(form["url_optional"])}</span></label>\n'
        f'<p class="field-hint" id="attachment-hint">{_esc(form["file_hint"])}</p>\n'
        f'<input class="app-file-input" type="file" id="attachment" name="attachment" '
        f'accept="{accept}" aria-describedby="attachment-hint attachment-status attachment-error" />\n'
        f'<button type="button" class="app-btn app-btn-secondary app-file-choose" '
        f'id="attachment-choose" data-file-target="attachment">{_esc(form["file_choose"])}</button>\n'
        '<div class="app-file-selected" id="attachment-status" hidden>\n'
        '<img class="app-file-thumb" id="attachment-thumb" alt="" hidden loading="lazy" decoding="async" />\n'
        '<div class="app-file-meta">\n'
        '<span class="app-file-name"></span>\n'
        f'<span class="app-file-ready">{_esc(form["file_ready"])}</span>\n'
        "</div>\n"
        '<div class="app-file-tools">\n'
        f'<button type="button" class="app-file-replace" data-file-target="attachment">'
        f'{_esc(form["file_replace"])}</button>\n'
        f'<button type="button" class="app-file-remove" data-file-kind="attachment">'
        f'{_esc(form["file_remove"])}</button>\n'
        "</div>\n"
        "</div>\n"
        '<p class="app-file-error" id="attachment-error" hidden role="alert"></p>\n'
        "</div>\n"
        "</div>\n"
        '<div class="field-group field-group--privacy">\n'
        '<div class="opt-item opt-item-privacy-confirm">\n'
        '<input type="checkbox" id="privacyconfirm" name="privacyconfirm" value="yes" required />\n'
        f'<label class="field-label" for="privacyconfirm">{_privacy_label_html(form)}</label>\n'
        "</div>\n"
        "</div>\n"
        '<div class="app-honeypot" aria-hidden="true" hidden>\n'
        f'<label for="website">{_esc(form["honeypot_label"])}</label>\n'
        '<input type="text" id="website" name="website" tabindex="-1" autocomplete="off" />\n'
        "</div>\n"
        '<div class="app-submit-status" id="app-submit-status" role="status" aria-live="polite" hidden></div>\n'
        '<div class="app-btn-row">\n'
        f'<button type="submit" class="app-btn app-btn-submit" id="appSubmitBtn">'
        f'{_esc(form["submit"])}</button>\n'
        "</div>\n"
        "</div>\n"
        "</div>\n"
        '<div class="success-screen" id="success">\n'
        '<div class="success-icon">✓</div>\n'
        f'<h2>{_esc(form["success_title"])}</h2>\n'
        f'<p>{_esc(form["success_body"])}</p>\n'
        '<div class="app-btn-row">\n'
        f'<a class="app-btn app-btn-primary" href="index.html">{_esc(form["success_home"])}</a>\n'
        "</div>\n"
        "</div>\n"
        "</form>\n"
        '<script src="../assets/feedback-form.js?v=20261003fb" defer></script>\n'
    )


def build_legal_inner_html(lang: str, filename: str) -> str:
    slug = _slug_from_file(filename)
    page = page_for(lang, slug)
    is_feedback = slug == "feedback"
    highlights_title = HIGHLIGHTS_TITLE.get(lang, HIGHLIGHTS_TITLE["en"])
    hl_items = "".join(
        f"<li>{_mark_highlight(item)}</li>" for item in (page.get("highlights") or [])
    )
    highlights = (
        f'<section class="legal-takeaways" id="section-takeaways" aria-labelledby="legal-takeaways-title">\n'
        f'<p class="legal-takeaways__title" id="legal-takeaways-title">{_esc(highlights_title)}</p>\n'
        f"<ul>{hl_items}</ul>\n"
        "</section>\n"
        if hl_items and not is_feedback
        else ""
    )
    callout_text = (CALLOUTS.get(lang) or CALLOUTS["en"]).get(slug, "")
    callout = (
        f'<div class="legal-callout"><p>{_rich(callout_text)}</p></div>\n'
        if callout_text and not is_feedback
        else ""
    )
    plain_text = (PLAINS.get(lang) or PLAINS["en"]).get(slug, "")
    plain_label = PLAIN_LABEL.get(lang, PLAIN_LABEL["en"])
    plain = (
        f'<div class="legal-plain"><p class="legal-plain__label">{_esc(plain_label)}</p>'
        f"<p>{_rich(plain_text)}</p></div>\n"
        if plain_text and not is_feedback
        else ""
    )
    sections = (
        ""
        if is_feedback
        else "".join(_section_html(sec) for sec in (page.get("sections") or []))
    )
    form = ""
    if page.get("form"):
        form = _form_html(lang, page["form"])
    title = page["title"]
    panel_title = (PANEL_TITLE.get(lang) or PANEL_TITLE["en"]).get(slug, highlights_title)
    panel_copy = page.get("panel") or page.get("lead", "")
    article_bits = []
    if not is_feedback:
        article_bits.append(highlights)
        article_bits.append(callout)
        article_bits.append(plain)
        article_bits.append(sections)
    article_inner = "".join(article_bits).strip()
    article = (
        f'  <article class="legal-doc">\n    {article_inner}\n  </article>\n'
        if article_inner
        else ""
    )
    return (
        '<div class="legal-page">\n'
        '  <header class="hero legal-hero">\n'
        '    <div class="hero-wrap">\n'
        "      <section>\n"
        f'        <h1 id="page-title">{_esc(title)}</h1>\n'
        f'        <p class="page-hero-subtitle" id="page-hero-subtitle" role="doc-subtitle">'
        f"{_esc(page.get('lead', ''))}</p>\n"
        "      </section>\n"
        f'      <aside class="hero-panel" aria-label="{_esc(panel_title)}">\n'
        '        <div class="panel-card">\n'
        f'          <h2 class="panel-title">{_esc(panel_title)}</h2>\n'
        f'          <div class="panel-copy"><p>{_rich(panel_copy)}</p></div>\n'
        "        </div>\n"
        "      </aside>\n"
        "    </div>\n"
        "  </header>\n"
        f"  {form}"
        f"{article}"
        "</div>\n"
    )


def build_legal_page_html(index_html: str, lang: str, filename: str) -> str:
    loc = _load_locale(lang)
    site = loc.get("site_name", "Birİnci")
    page = page_for(lang, _slug_from_file(filename))
    title = f"{page['title']} · {site}"
    desc = page.get("description") or page.get("lead") or ""
    markup = index_html
    markup = _TITLE_RE.sub(f"<title>{html.escape(title)}</title>", markup, count=1)
    meta = f'<meta name="description" content="{html.escape(desc, quote=True)}" />'
    if _META_DESC_RE.search(markup):
        markup = _META_DESC_RE.sub(meta, markup, count=1)
    else:
        markup = markup.replace("</title>", f"</title>\n  {meta}", 1)

    def _body(match: re.Match[str]) -> str:
        attrs = match.group(1)
        attrs = re.sub(r'\sclass="[^"]*"', "", attrs)
        attrs = re.sub(r'\sdata-lang-page="[^"]*"', "", attrs)
        attrs = re.sub(r'\sid="top"', "", attrs)
        attrs = re.sub(r'\sdata-lang="[^"]*"', "", attrs)
        return (
            f'<body class="page-home page-legal" id="top" '
            f'data-lang="{lang}" data-lang-page="{filename}"{attrs}>'
        )

    markup = _BODY_RE.sub(_body, markup, count=1)
    crumbs = _legal_breadcrumbs_html(lang, filename, page["title"])
    if _BREADCRUMBS_RE.search(markup):
        markup = _BREADCRUMBS_RE.sub(crumbs, markup, count=1)
    inner = '<div class="page-home__content">\n' + build_legal_inner_html(lang, filename) + "</div>\n"
    markup = _HOME_CONTENT_RE.sub(lambda _m: inner, markup, count=1)
    markup = _LANG_OPTION_RE.sub(rf"\1{filename}\"", markup)
    return markup


def write_legal_pages(patch_html=None) -> int:
    n = 0
    for lang in LIVE_LANGS:
        src = ROOT / lang / "index.html"
        if not src.is_file():
            continue
        raw = src.read_text(encoding="utf-8")
        for filename in LEGAL_HTML_FILES:
            markup = build_legal_page_html(raw, lang, filename)
            if patch_html:
                markup = patch_html(markup, lang, rel_path=f"{lang}/{filename}")
            dest = ROOT / lang / filename
            dest.write_text(markup, encoding="utf-8", newline="\n")
            n += 1
        php_src = TOOLS / "mail_feedback.php"
        if php_src.is_file():
            (ROOT / lang / "mail-feedback.php").write_text(
                php_src.read_text(encoding="utf-8"), encoding="utf-8", newline="\n"
            )
    return n


if __name__ == "__main__":
    from chrome_restore import patch_emitted_html  # noqa: WPS433

    count = write_legal_pages(
        lambda markup, lang, rel_path="": patch_emitted_html(markup, lang, rel_path=rel_path)
    )
    print(f"legal_pages: wrote {count} files")
