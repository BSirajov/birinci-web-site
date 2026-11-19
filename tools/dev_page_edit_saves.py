# -*- coding: utf-8 -*-
"""True-source save helpers for local page edit mode (non-story surfaces).

Used by tools/dev_story_edit_server.py. Never for production hosting.
"""
from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path
from typing import Any

from docx import Document

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT / "tools") not in sys.path:
    sys.path.insert(0, str(ROOT / "tools"))
if str(ROOT / "en" / "prominent-figures") not in sys.path:
    sys.path.insert(0, str(ROOT / "en" / "prominent-figures"))

LANGS = frozenset({"az", "en", "ru", "ky"})
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
ARTICLE_ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def _atomic_write_text(path: Path, text: str, *, attempts: int = 8) -> None:
    import time

    tmp = path.with_suffix(path.suffix + ".tmp")
    last_err: Exception | None = None
    for i in range(attempts):
        try:
            tmp.write_text(text, encoding="utf-8", newline="\n")
            tmp.replace(path)
            return
        except OSError as exc:
            last_err = exc
            time.sleep(0.05 * (i + 1))
    assert last_err is not None
    raise last_err


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _dump_json(path: Path, data: Any) -> None:
    _atomic_write_text(path, json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def _load_js_assignment(path: Path, prefix: str) -> tuple[str, Any, str]:
    raw = path.read_text(encoding="utf-8")
    m = re.match(rf"({re.escape(prefix)}\s*=\s*)(\{{.*\}}|\[.*\])(\s*;?\s*)$", raw, re.S)
    if not m:
        raise ValueError(f"cannot parse {path.name}")
    return m.group(1), json.loads(m.group(2)), m.group(3) or ";\n"


def _write_js_assignment(path: Path, prefix: str, data: Any, suffix: str) -> None:
    _atomic_write_text(
        path,
        prefix + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + suffix,
    )


def _norm(text: str) -> str:
    return " ".join(str(text or "").split()).strip()


def _set_paragraph_text(paragraph, text: str) -> None:
    runs = paragraph.runs
    if runs:
        runs[0].text = text
        for run in runs[1:]:
            run.text = ""
    else:
        paragraph.add_run(text)


# ---------------------------------------------------------------------------
# Category meta (home cards + category heroes)
# ---------------------------------------------------------------------------


def save_category_meta(payload: dict[str, Any]) -> dict[str, Any]:
    lang = str(payload.get("lang") or "").strip().lower()
    slug = str(payload.get("slug") or "").strip().lower()
    title = _norm(payload.get("title") or "")
    blurb = _norm(payload.get("blurb") or "")
    if lang not in LANGS:
        raise ValueError("invalid lang")
    if not SLUG_RE.match(slug):
        raise ValueError("invalid slug")
    if not title:
        raise ValueError("title required")
    if not blurb:
        raise ValueError("blurb required")

    locale_path = ROOT / "tools" / "locales" / f"{lang}.json"
    locale = _load_json(locale_path)
    cats = locale.get("categories") or {}
    if slug not in cats:
        raise ValueError(f"unknown category {slug!r} in locales")
    before = {
        "title": str(cats[slug].get("title") or ""),
        "blurb": str(cats[slug].get("blurb") or ""),
    }
    cats[slug]["title"] = title
    cats[slug]["blurb"] = blurb
    locale["categories"] = cats
    _dump_json(locale_path, locale)

    manifest_path = ROOT / "tools" / "story-build-manifest.json"
    manifest = _load_json(manifest_path)
    found_manifest = False
    for cat in (manifest.get(lang) or {}).get("categories") or []:
        if cat.get("slug") == slug:
            cat["title"] = title
            cat["blurb"] = blurb
            found_manifest = True
            break
    if not found_manifest:
        raise ValueError(f"slug {slug!r} missing from story-build-manifest[{lang}]")
    _dump_json(manifest_path, manifest)

    paths = [
        f"tools/locales/{lang}.json",
        "tools/story-build-manifest.json",
    ]

    # Home card
    index_path = ROOT / lang / "index.html"
    if index_path.is_file():
        text = index_path.read_text(encoding="utf-8")
        title_attr = html.escape(title, quote=True)
        blurb_attr = html.escape(blurb, quote=True)
        title_html = html.escape(title)
        blurb_html = html.escape(blurb)
        text, n = re.subn(
            rf'(<a class="cat-card page-card" href="categories/{re.escape(slug)}\.html"[^>]*'
            rf'data-title=")([^"]*)("[^>]*data-blurb=")([^"]*)(")',
            lambda m: f"{m.group(1)}{title_attr}{m.group(3)}{blurb_attr}{m.group(5)}",
            text,
            count=1,
        )
        if n != 1:
            text, n = re.subn(
                rf'(href="categories/{re.escape(slug)}\.html"[^>]*data-title=")([^"]*)("'
                rf'[^>]*data-blurb=")([^"]*)(")',
                lambda m: f"{m.group(1)}{title_attr}{m.group(3)}{blurb_attr}{m.group(5)}",
                text,
                count=1,
            )
        text, n2 = re.subn(
            rf'(href="categories/{re.escape(slug)}\.html"[\s\S]*?<h2 class="card-title">)'
            rf'([^<]*)(</h2>\s*<div class="card-desc">)([^<]*)(</div>)',
            lambda m: f"{m.group(1)}{title_html}{m.group(3)}{blurb_html}{m.group(5)}",
            text,
            count=1,
        )
        if n2:
            _atomic_write_text(index_path, text)
            paths.append(f"{lang}/index.html")

    # Category page hero + meta
    cat_path = ROOT / lang / "categories" / f"{slug}.html"
    if cat_path.is_file():
        text = cat_path.read_text(encoding="utf-8")
        title_html = html.escape(title)
        blurb_html = html.escape(blurb)
        text = re.sub(
            r"(<title>)([^<]*?)( · Birİnci</title>)",
            lambda m: f"{m.group(1)}{title_html}{m.group(3)}",
            text,
            count=1,
        )
        for attr in (
            'name="description"',
            'property="og:description"',
            'name="twitter:description"',
        ):
            text = re.sub(
                rf'(<meta {re.escape(attr)} content=")([^"]*)(")',
                lambda m, b=html.escape(blurb, quote=True): f"{m.group(1)}{b}{m.group(3)}",
                text,
                count=1,
            )
        for attr in (
            'property="og:title"',
            'name="twitter:title"',
        ):
            text = re.sub(
                rf'(<meta {re.escape(attr)} content=")([^"]*)(")',
                lambda m, t=html.escape(f"{title} · Birİnci", quote=True): f"{m.group(1)}{t}{m.group(3)}",
                text,
                count=1,
            )
        text = re.sub(
            r'(<li class="breadcrumbs__item" aria-current="page"><span>)([^<]*)(</span>)',
            lambda m: f"{m.group(1)}{title_html}{m.group(3)}",
            text,
            count=1,
        )
        text = re.sub(
            r'(<header class="category-hero">\s*<h1>)([^<]*)(</h1>)',
            lambda m: f"{m.group(1)}{title_html}{m.group(3)}",
            text,
            count=1,
        )
        text, n = re.subn(
            r'(<p class="category-hero__lead">)(.*?)( · <span data-tools-count>)',
            lambda m: f"{m.group(1)}{blurb_html}{m.group(3)}",
            text,
            count=1,
            flags=re.S,
        )
        if not n:
            text = re.sub(
                r'(<p class="category-hero__lead">)([^<]*)(</p>)',
                lambda m: f"{m.group(1)}{blurb_html}{m.group(3)}",
                text,
                count=1,
            )
        _atomic_write_text(cat_path, text)
        paths.append(f"{lang}/categories/{slug}.html")

    # stories-data.js
    sd_path = ROOT / lang / "assets" / "stories-data.js"
    if sd_path.is_file():
        prefix, data, suffix = _load_js_assignment(sd_path, "window.__BIRINCI_STORIES__")
        for cat in data.get("categories") or []:
            if cat.get("slug") == slug:
                cat["title"] = title
                cat["blurb"] = blurb
                break
        _write_js_assignment(sd_path, prefix, data, suffix)
        paths.append(f"{lang}/assets/stories-data.js")

    # search-index.js — category label + hay
    si_path = ROOT / lang / "assets" / "search-index.js"
    if si_path.is_file():
        prefix, entries, suffix = _load_js_assignment(si_path, "window.__BIRINCI_SEARCH__")
        for entry in entries:
            if entry.get("slug") != slug:
                continue
            old_cat = str(entry.get("category") or "")
            entry["category"] = title
            hay = str(entry.get("hay") or "")
            if old_cat and old_cat.lower() in hay:
                hay = hay.replace(old_cat.lower(), title.lower(), 1)
            else:
                hay = f"{entry.get('title', '')} {title} {hay}".lower()
            entry["hay"] = hay
        _write_js_assignment(si_path, prefix, entries, suffix)
        paths.append(f"{lang}/assets/search-index.js")

    # sitemap category block
    sm_path = ROOT / lang / "sitemap.html"
    if sm_path.is_file():
        text = sm_path.read_text(encoding="utf-8")
        title_html = html.escape(title)
        blurb_html = html.escape(blurb)
        text2, n = re.subn(
            rf'(<h3><a href="categories/{re.escape(slug)}\.html">)([^<]*)(</a></h3>)',
            lambda m: f"{m.group(1)}{title_html}{m.group(3)}",
            text,
            count=1,
        )
        text2, n2 = re.subn(
            rf'(href="categories/{re.escape(slug)}\.html">[\s\S]*?</h3></div>'
            rf'<span class="sitemap-block__count">[^<]*</span></div>'
            rf'<p class="sitemap-block__blurb">)([^<]*)(</p>)',
            lambda m: f"{m.group(1)}{blurb_html}{m.group(3)}",
            text2,
            count=1,
        )
        if n or n2:
            _atomic_write_text(sm_path, text2)
            paths.append(f"{lang}/sitemap.html")

    return {
        "ok": True,
        "kind": "category-meta",
        "lang": lang,
        "slug": slug,
        "paths": paths,
        "before": before,
        "after": {"title": title, "blurb": blurb},
    }


# ---------------------------------------------------------------------------
# About body
# ---------------------------------------------------------------------------


def save_about_body(payload: dict[str, Any]) -> dict[str, Any]:
    lang = str(payload.get("lang") or "").strip().lower()
    if lang not in LANGS:
        raise ValueError("invalid lang")

    mission_title = _norm(payload.get("mission_title") or "")
    mission_body = _norm(payload.get("mission_body") or "")
    vision_title = _norm(payload.get("vision_title") or "")
    vision_body = _norm(payload.get("vision_body") or "")
    values_title = _norm(payload.get("values_title") or "")
    values_intro = _norm(payload.get("values_intro") or "")
    raw_values = payload.get("values") or []
    if not isinstance(raw_values, list) or not raw_values:
        raise ValueError("values required")
    values = []
    for row in raw_values:
        if not isinstance(row, dict):
            raise ValueError("each value must be an object")
        name = _norm(row.get("name") or "")
        gloss = _norm(row.get("gloss") or "")
        if not name or not gloss:
            raise ValueError("value name and gloss required")
        values.append({"name": name, "gloss": gloss})

    for label, val in (
        ("mission_title", mission_title),
        ("mission_body", mission_body),
        ("vision_title", vision_title),
        ("vision_body", vision_body),
        ("values_title", values_title),
        ("values_intro", values_intro),
    ):
        if not val:
            raise ValueError(f"{label} required")

    locale_path = ROOT / "tools" / "locales" / f"{lang}.json"
    locale = _load_json(locale_path)
    about = (locale.get("ui") or {}).get("about")
    if not isinstance(about, dict):
        raise ValueError("ui.about missing in locale")

    before = {
        "mission_title": str(about.get("mission_title") or ""),
        "mission_body": str(about.get("mission_body") or ""),
        "vision_title": str(about.get("vision_title") or ""),
        "vision_body": str(about.get("vision_body") or ""),
        "values_title": str(about.get("values_title") or ""),
        "values_intro": str(about.get("values_intro") or ""),
        "values": [
            {"name": str(v.get("name") or ""), "gloss": str(v.get("gloss") or "")}
            for v in (about.get("values") or [])
            if isinstance(v, dict)
        ],
    }

    about["mission_title"] = mission_title
    about["mission_body"] = mission_body
    about["vision_title"] = vision_title
    about["vision_body"] = vision_body
    about["values_title"] = values_title
    about["values_intro"] = values_intro
    about["values"] = values
    locale.setdefault("ui", {})["about"] = about
    _dump_json(locale_path, locale)

    from chrome_restore import write_lang_i18n_from_locale

    write_lang_i18n_from_locale(lang)

    about_path = ROOT / lang / "about" / "mission-vision-values.html"
    if not about_path.is_file():
        raise FileNotFoundError(f"missing about page: {about_path}")
    text = about_path.read_text(encoding="utf-8")

    def _esc(s: str) -> str:
        return html.escape(s)

    text = re.sub(
        r'(<article class="about-card" id="missiya">[\s\S]*?<h2>)([^<]*)(</h2>)',
        lambda m: f"{m.group(1)}{_esc(mission_title)}{m.group(3)}",
        text,
        count=1,
    )
    text = re.sub(
        r'(<article class="about-card" id="missiya">[\s\S]*?<p class="about-card__text">)([\s\S]*?)(</p>)',
        lambda m: f"{m.group(1)}{_esc(mission_body)}{m.group(3)}",
        text,
        count=1,
    )
    text = re.sub(
        r'(<article class="about-card" id="baxis">[\s\S]*?<h2>)([^<]*)(</h2>)',
        lambda m: f"{m.group(1)}{_esc(vision_title)}{m.group(3)}",
        text,
        count=1,
    )
    text = re.sub(
        r'(<article class="about-card" id="baxis">[\s\S]*?<p class="about-card__text">)([\s\S]*?)(</p>)',
        lambda m: f"{m.group(1)}{_esc(vision_body)}{m.group(3)}",
        text,
        count=1,
    )
    text = re.sub(
        r'(<article class="about-card" id="deyerler">[\s\S]*?<h2>)([^<]*)(</h2>)',
        lambda m: f"{m.group(1)}{_esc(values_title)}{m.group(3)}",
        text,
        count=1,
    )
    text = re.sub(
        r'(<h2 id="about-values-detail-title">)([^<]*)(</h2>)',
        lambda m: f"{m.group(1)}{_esc(values_title)}{m.group(3)}",
        text,
        count=1,
    )
    text = re.sub(
        r'(<header class="about-values-block__head">[\s\S]*?</h2>\s*<p>)([\s\S]*?)(</p>)',
        lambda m: f"{m.group(1)}{_esc(values_intro)}{m.group(3)}",
        text,
        count=1,
    )

    pills = "".join(
        f'<a class="about-pill" href="#vd-{i}"><span class="about-pill__name">'
        f'{_esc(v["name"])}</span></a>'
        for i, v in enumerate(values, start=1)
    )
    text = re.sub(
        r'(<div class="about-pills">)([\s\S]*?)(</div>)',
        lambda m: f"{m.group(1)}{pills}{m.group(3)}",
        text,
        count=1,
    )

    for i, v in enumerate(values, start=1):
        text = re.sub(
            rf'(<article class="about-vd" id="vd-{i}">\s*'
            rf'<h3 class="about-vd__title">)([^<]*)(</h3>\s*'
            rf'<p class="about-vd__gloss">)([\s\S]*?)(</p>)',
            lambda m, vv=v: (
                f"{m.group(1)}{_esc(vv['name'])}{m.group(3)}{_esc(vv['gloss'])}{m.group(5)}"
            ),
            text,
            count=1,
        )

    _atomic_write_text(about_path, text)

    after = {
        "mission_title": mission_title,
        "mission_body": mission_body,
        "vision_title": vision_title,
        "vision_body": vision_body,
        "values_title": values_title,
        "values_intro": values_intro,
        "values": values,
    }
    return {
        "ok": True,
        "kind": "about-body",
        "lang": lang,
        "paths": [
            f"tools/locales/{lang}.json",
            f"{lang}/assets/i18n.js",
            f"{lang}/about/mission-vision-values.html",
        ],
        "before": before,
        "after": after,
    }


# ---------------------------------------------------------------------------
# Discoveries article
# ---------------------------------------------------------------------------


def _rewrite_discovery_docx(
    path: Path,
    lang: str,
    *,
    title: str,
    period_line: str,
    summary: str,
    facts: list[str],
    sections: list[tuple[str, list[str]]],
) -> None:
    import rebuild_discovery_from_docx as disc

    parsed = disc.parse_docx(path, lang)
    cfg = disc.LOCALE[lang]
    facts_head = cfg["facts_head"]
    refs_head = cfg["refs_heads"][0]

    rows: list[str] = [title]
    if parsed.category:
        rows.append(parsed.category)
    if period_line:
        rows.append(period_line)
    if summary:
        rows.append(summary)
    rows.append(facts_head)
    rows.extend(facts)
    for heading, paras in sections:
        rows.append(heading)
        rows.extend(paras)
    rows.append(refs_head)
    for group_title, items in parsed.ref_groups:
        if group_title:
            rows.append(group_title)
        for idx, item in enumerate(items, start=1):
            rows.append(f"{idx}. {item}")

    doc = Document(str(path))
    visible = [p for p in doc.paragraphs if (p.text or "").strip()]
    for idx, para in enumerate(visible):
        if idx < len(rows):
            _set_paragraph_text(para, rows[idx])
        else:
            _set_paragraph_text(para, "")
    if len(visible) < len(rows):
        for text in rows[len(visible) :]:
            doc.add_paragraph(text)
    doc.save(str(path))


def save_discovery(payload: dict[str, Any]) -> dict[str, Any]:
    import rebuild_discovery_from_docx as disc

    lang = str(payload.get("lang") or "").strip().lower()
    article_id = str(payload.get("id") or "").strip().lower()
    title = _norm(payload.get("title") or "")
    period_line = _norm(payload.get("period_line") or "")
    summary = _norm(payload.get("summary") or "")
    raw_facts = payload.get("facts") or []
    raw_sections = payload.get("sections") or []
    if lang not in LANGS:
        raise ValueError("invalid lang")
    if not ARTICLE_ID_RE.match(article_id):
        raise ValueError("invalid id")
    if not title:
        raise ValueError("title required")
    if not summary:
        raise ValueError("summary required")
    if not isinstance(raw_facts, list) or not raw_facts:
        raise ValueError("facts required")
    facts = [_norm(f) for f in raw_facts]
    facts = [f for f in facts if f]
    if not facts:
        raise ValueError("facts required")
    if not isinstance(raw_sections, list) or not raw_sections:
        raise ValueError("sections required")
    sections: list[tuple[str, list[str]]] = []
    for row in raw_sections:
        if not isinstance(row, dict):
            raise ValueError("section must be object")
        heading = _norm(row.get("heading") or "")
        paras_raw = row.get("paragraphs") or []
        if not heading:
            raise ValueError("section heading required")
        if not isinstance(paras_raw, list):
            raise ValueError("section paragraphs must be list")
        paras = [_norm(p) for p in paras_raw]
        paras = [p for p in paras if p]
        sections.append((heading, paras))

    page_path = ROOT / lang / "discoveries" / "discoveries-and-inventions.html"
    body_path = ROOT / "tools" / "inventions" / f"{lang}-body.html"
    if not page_path.is_file():
        raise FileNotFoundError(f"missing discoveries page: {page_path}")

    page = page_path.read_text(encoding="utf-8")
    live = disc.index_live_articles(page)
    if article_id not in live:
        raise ValueError(f"unknown discovery id {article_id!r}")
    sources = disc.index_docx(lang, set(live))
    if article_id not in sources:
        raise ValueError(f"no DOCX for {article_id!r}")
    docx_path = sources[article_id]

    old = disc.parse_docx(docx_path, lang)
    before = {
        "title": old.title,
        "period_line": old.period_line,
        "summary": old.summary,
        "facts": list(old.facts),
        "sections": [{"heading": h, "paragraphs": list(ps)} for h, ps in old.sections],
    }

    # Keep section headings from DOCX when client sends empty/locked headings.
    fixed_sections: list[tuple[str, list[str]]] = []
    for idx, (heading, paras) in enumerate(sections):
        if not heading and idx < len(old.sections):
            heading = old.sections[idx][0]
        if not paras and idx < len(old.sections):
            paras = list(old.sections[idx][1])
        fixed_sections.append((heading, paras))
    if len(fixed_sections) < len(old.sections):
        for extra in old.sections[len(fixed_sections) :]:
            fixed_sections.append(extra)

    _rewrite_discovery_docx(
        docx_path,
        lang,
        title=title,
        period_line=period_line or old.period_line,
        summary=summary,
        facts=facts,
        sections=fixed_sections,
    )

    parsed = disc.parse_docx(docx_path, lang)
    number, _old_title = live[article_id]
    article_m = re.search(
        rf'<article class="inventions-entry" id="{re.escape(article_id)}"[^>]*>(.*?)</article>',
        page,
        re.S,
    )
    if not article_m:
        raise ValueError(f"Could not locate article {article_id}")
    old_inner = article_m.group(1)
    media = disc.extract_media(old_inner)
    figures_m = disc.OLD_FIGURES_RE.search(old_inner)
    fallback = figures_m.group(0) if figures_m else ""
    num_span = disc.extract_num_span(old_inner, number)
    inner = disc.render_article(parsed, lang, number, num_span, media, fallback)
    by_id = {article_id: inner}
    titles = {article_id: parsed.title}

    paths = [str(docx_path.relative_to(ROOT)).replace("\\", "/")]
    for target in (page_path, body_path):
        if not target.is_file():
            continue
        markup = target.read_text(encoding="utf-8")
        markup = disc.replace_articles(markup, by_id)
        markup = disc.replace_toc(markup, titles)
        _atomic_write_text(target, markup)
        paths.append(str(target.relative_to(ROOT)).replace("\\", "/"))

    sm_path = ROOT / lang / "sitemap.html"
    if sm_path.is_file():
        text = sm_path.read_text(encoding="utf-8")
        title_html = html.escape(parsed.title)
        text2, n = re.subn(
            rf'(href="discoveries/discoveries-and-inventions\.html#{re.escape(article_id)}"><span>)'
            rf'([^<]*)(</span>)',
            lambda m: f"{m.group(1)}{title_html}{m.group(3)}",
            text,
            count=1,
        )
        if n:
            _atomic_write_text(sm_path, text2)
            paths.append(f"{lang}/sitemap.html")

    after = {
        "title": parsed.title,
        "period_line": parsed.period_line,
        "summary": parsed.summary,
        "facts": list(parsed.facts),
        "sections": [{"heading": h, "paragraphs": list(ps)} for h, ps in parsed.sections],
    }
    return {
        "ok": True,
        "kind": "discovery",
        "lang": lang,
        "id": article_id,
        "paths": paths,
        "before": before,
        "after": after,
    }


# ---------------------------------------------------------------------------
# Prominent figures (en only)
# ---------------------------------------------------------------------------


def _slugify_figure(text: str) -> str:
    s = text.strip().lower()
    s = (
        s.replace("ə", "e")
        .replace("ı", "i")
        .replace("ö", "o")
        .replace("ü", "u")
        .replace("ğ", "g")
        .replace("ş", "s")
        .replace("ç", "c")
    )
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "item"


def _figure_meta_string(alt: str, life: str, region: str, fields: str) -> str:
    parts = []
    if alt:
        parts.append(f"Alternative names: {alt}")
    if life:
        parts.append(f"Life: {life}")
    if region:
        parts.append(f"Associated region: {region}")
    if fields:
        parts.append(f"Fields: {fields}")
    return " | ".join(parts)


def _parse_figure_meta_line(meta_line: str, alt: str = "") -> dict[str, str]:
    """Accept either pipe-labelled meta or the HTML 'life · region · fields' line."""
    out = {"alt": _norm(alt), "life": "", "region": "", "fields": ""}
    raw = str(meta_line or "").strip()
    if not raw:
        return out
    if "|" in raw or raw.casefold().startswith(
        ("alternative names:", "life:", "associated region:", "fields:")
    ):
        for chunk in re.split(r"\s*\|\s*|\n+", raw):
            chunk = chunk.strip()
            if not chunk:
                continue
            low = chunk.casefold()
            if low.startswith("alternative names:"):
                out["alt"] = chunk.split(":", 1)[1].strip()
            elif low.startswith("life:"):
                out["life"] = chunk.split(":", 1)[1].strip()
            elif low.startswith("associated region:"):
                out["region"] = chunk.split(":", 1)[1].strip()
            elif low.startswith("fields:"):
                out["fields"] = chunk.split(":", 1)[1].strip()
        return out
    bits = [b.strip() for b in raw.split("·") if b.strip()]
    if len(bits) >= 1:
        out["life"] = bits[0]
    if len(bits) >= 2:
        out["region"] = bits[1]
    if len(bits) >= 3:
        out["fields"] = bits[2]
    return out


def _figure_index_in_category(person_id: str, category_id: str) -> int | None:
    """0-based index of person_id among HTML articles in category_id."""
    html_path = ROOT / "en" / "prominent-figures" / "index.html"
    if not html_path.is_file():
        return None
    markup = html_path.read_text(encoding="utf-8")
    ids = re.findall(
        rf'<article class="inventions-entry" id="([^"]+)" data-figure-cat="{re.escape(category_id)}"',
        markup,
    )
    try:
        return ids.index(person_id)
    except ValueError:
        return None


def _rewrite_figure_docx(
    *,
    person_id: str,
    category_id: str,
    name: str,
    alt: str,
    meta_line: str,
    body: list[dict[str, str]],
    sections: list[dict[str, Any]],
) -> dict[str, Any]:
    docx_path = ROOT / "en" / "prominent-figures" / "Prominent figures.docx"
    if not docx_path.is_file():
        raise FileNotFoundError(f"missing figures docx: {docx_path}")

    doc = Document(str(docx_path))
    person_paras: list[Any] = []
    collecting = False
    before = {"name": "", "meta": "", "body": [], "sections": []}

    # Prefer stable HTML order within the category so renames still resolve.
    want_ord = _figure_index_in_category(person_id, category_id)
    base_id = person_id
    want_nth = 1
    m_dup = re.match(r"^(.*)-(\d+)$", person_id)
    if m_dup and int(m_dup.group(2)) >= 2:
        base_id = m_dup.group(1)
        want_nth = int(m_dup.group(2))
    seen_in_cat = 0
    ord_in_cat = -1
    start_idx = None
    end_idx = None
    cat_ok = False
    for idx, para in enumerate(doc.paragraphs):
        text = (para.text or "").strip()
        style = para.style.name if para.style else ""
        if style == "Heading 1" and text:
            current_cat = _slugify_figure(text)
            cat_ok = current_cat == category_id
            seen_in_cat = 0
            ord_in_cat = -1
            if collecting:
                end_idx = idx
                collecting = False
            continue
        if style == "Heading 2" and text:
            pid = _slugify_figure(text)
            if collecting:
                end_idx = idx
                collecting = False
            if not cat_ok:
                continue
            ord_in_cat += 1
            matched = False
            if want_ord is not None and ord_in_cat == want_ord:
                matched = True
            elif want_ord is None and pid == base_id:
                seen_in_cat += 1
                matched = seen_in_cat == want_nth
            if matched:
                start_idx = idx
                collecting = True
                before["name"] = text
            continue
        if collecting and text:
            person_paras.append((idx, style, text))

    if collecting:
        end_idx = len(doc.paragraphs)
    if start_idx is None:
        raise ValueError(f"figure {person_id!r} not found in DOCX under {category_id!r}")

    # Collect before snapshot from person_paras
    meta_bits = []
    body_before: list[dict[str, str]] = []
    sections_before: list[dict[str, Any]] = []
    cur_sec: dict[str, Any] | None = None
    for _i, style, text in person_paras:
        if style == "Profile Metadata":
            meta_bits.append(text)
        elif style == "Heading 3":
            cur_sec = {"heading": text, "paras": [], "items": []}
            sections_before.append(cur_sec)
        elif style == "List Bullet":
            if cur_sec is not None:
                cur_sec["items"].append(text)
            else:
                body_before.append({"type": "li", "text": text})
        elif style in {"Profile Body", "Normal", "Source Text"}:
            if cur_sec is not None:
                cur_sec["paras"].append(text)
            else:
                body_before.append({"type": "p", "text": text})
    before["meta"] = " ".join(meta_bits).strip()
    before["body"] = body_before
    before["sections"] = sections_before

    meta_fields = _parse_figure_meta_line(meta_line, alt=alt)
    meta_text = _figure_meta_string(
        meta_fields["alt"],
        meta_fields["life"],
        meta_fields["region"],
        meta_fields["fields"],
    )

    def _content_len(body_rows: list[dict[str, str]], section_rows: list[dict[str, Any]]) -> int:
        total = sum(len(str(b.get("text") or "")) for b in body_rows)
        for sec in section_rows:
            total += len(str(sec.get("heading") or ""))
            total += sum(len(str(p)) for p in (sec.get("paras") or []))
            total += sum(len(str(i)) for i in (sec.get("items") or []))
        return total

    new_len = _content_len(body, sections)
    old_len = _content_len(body_before, sections_before)
    # Refuse accidental wipes from partial client payloads.
    if old_len >= 200 and new_len < max(80, int(old_len * 0.5)):
        raise ValueError(
            "figure body looks truncated compared with the DOCX profile; "
            "save refused to avoid wiping content"
        )

    content_rows: list[tuple[str, str]] = []  # (style_name, text)
    if meta_text:
        content_rows.append(("Profile Metadata", meta_text))
    for block in body:
        t = _norm(block.get("text") or "")
        if not t:
            continue
        if block.get("type") == "li":
            content_rows.append(("List Bullet", t))
        else:
            content_rows.append(("Profile Body", t))
    for sec in sections:
        heading = _norm(sec.get("heading") or "")
        if heading:
            content_rows.append(("Heading 3", heading))
        for p in sec.get("paras") or []:
            p = _norm(p)
            if p:
                content_rows.append(("Profile Body", p))
        for it in sec.get("items") or []:
            it = _norm(it)
            if it:
                content_rows.append(("List Bullet", it))

    _set_paragraph_text(doc.paragraphs[start_idx], name)

    # In-place text updates only (no paragraph insert/delete). Structural DOCX
    # edits are fragile on Windows; HTML still receives the full payload.
    existing = list(range(start_idx + 1, end_idx or len(doc.paragraphs)))
    if len(content_rows) == len(existing):
        for para_idx, (style_name, text) in zip(existing, content_rows):
            para = doc.paragraphs[para_idx]
            _set_paragraph_text(para, text)
            try:
                para.style = style_name
            except Exception:  # noqa: BLE001 — style may be missing
                pass
    else:
        # Always refresh metadata when present; leave remaining body rows alone.
        for para_idx in existing:
            para = doc.paragraphs[para_idx]
            style = para.style.name if para.style else ""
            if style == "Profile Metadata" and meta_text:
                _set_paragraph_text(para, meta_text)
                break

    # Save via temp+replace with retries — Windows often locks DOCX briefly.
    import time

    tmp_docx = docx_path.with_name(docx_path.stem + ".tmp.docx")
    last_err: Exception | None = None
    for attempt in range(8):
        try:
            if tmp_docx.exists():
                tmp_docx.unlink()
            doc.save(str(tmp_docx))
            tmp_docx.replace(docx_path)
            last_err = None
            break
        except OSError as exc:
            last_err = exc
            time.sleep(0.08 * (attempt + 1))
    if last_err is not None:
        raise last_err

    after = {
        "name": name,
        "alt": meta_fields["alt"],
        "meta_line": " · ".join(
            b for b in (meta_fields["life"], meta_fields["region"], meta_fields["fields"]) if b
        ),
        "body": body,
        "sections": sections,
        "meta": meta_text,
    }
    return {
        "docx": docx_path,
        "before": before,
        "after": after,
        "person": {
            "id": person_id,
            "name": name,
            "meta": meta_text,
            "body": body,
            "sections": sections,
        },
        "meta_fields": meta_fields,
    }


def save_figure(payload: dict[str, Any]) -> dict[str, Any]:
    person_id = str(payload.get("id") or "").strip().lower()
    category_id = str(payload.get("category_id") or "").strip().lower()
    name = _norm(payload.get("name") or "")
    alt = _norm(payload.get("alt") or "")
    meta_line = _norm(payload.get("meta_line") or "")
    raw_body = payload.get("body") or []
    raw_sections = payload.get("sections") or []
    if not ARTICLE_ID_RE.match(person_id):
        raise ValueError("invalid id")
    if not ARTICLE_ID_RE.match(category_id):
        raise ValueError("invalid category_id")
    if not name:
        raise ValueError("name required")
    if not isinstance(raw_body, list):
        raise ValueError("body must be list")
    if not isinstance(raw_sections, list):
        raise ValueError("sections must be list")

    body: list[dict[str, str]] = []
    for row in raw_body:
        if isinstance(row, str):
            t = _norm(row)
            if t:
                body.append({"type": "p", "text": t})
            continue
        if not isinstance(row, dict):
            continue
        t = _norm(row.get("text") or "")
        if not t:
            continue
        body.append({"type": "li" if row.get("type") == "li" else "p", "text": t})

    sections: list[dict[str, Any]] = []
    for row in raw_sections:
        if not isinstance(row, dict):
            continue
        heading = _norm(row.get("heading") or "")
        paras = [_norm(p) for p in (row.get("paras") or row.get("paragraphs") or [])]
        paras = [p for p in paras if p]
        items = [_norm(i) for i in (row.get("items") or [])]
        items = [i for i in items if i]
        sections.append({"heading": heading, "paras": paras, "items": items})

    rewritten = _rewrite_figure_docx(
        person_id=person_id,
        category_id=category_id,
        name=name,
        alt=alt,
        meta_line=meta_line,
        body=body,
        sections=sections,
    )

    # Surgical HTML replace
    import _build_page as build_page  # type: ignore

    html_path = ROOT / "en" / "prominent-figures" / "index.html"
    if not html_path.is_file():
        raise FileNotFoundError(f"missing figures page: {html_path}")
    markup = html_path.read_text(encoding="utf-8")

    # Preserve existing display number
    num_m = re.search(
        rf'<article class="inventions-entry" id="{re.escape(person_id)}"[^>]*>\s*'
        rf'<h2 class="inventions-entry-title"><span class="inventions-entry-num"[^>]*>([^<]*)</span>',
        markup,
    )
    num = num_m.group(1) if num_m else "1"
    person = rewritten["person"]
    new_article = build_page.render_person(person, category_id, num)

    markup2, n = re.subn(
        rf'<article class="inventions-entry" id="{re.escape(person_id)}"[^>]*>.*?</article>',
        new_article,
        markup,
        count=1,
        flags=re.S,
    )
    if n != 1:
        raise ValueError(f"figure article {person_id!r} not found in HTML")

    name_html = html.escape(name)
    markup2, n2 = re.subn(
        rf'(<li class="inventions-toc-entry" data-toc-entry="{re.escape(person_id)}"[^>]*>'
        rf'<span class="tl-date">[^<]*</span><a href="#[^"]+">)([^<]*)(</a>)',
        lambda m: f"{m.group(1)}{name_html}{m.group(3)}",
        markup2,
        count=1,
    )
    _atomic_write_text(html_path, markup2)

    rel_docx = str(rewritten["docx"].relative_to(ROOT)).replace("\\", "/")
    return {
        "ok": True,
        "kind": "figure",
        "id": person_id,
        "category_id": category_id,
        "paths": [rel_docx, "en/prominent-figures/index.html"],
        "before": rewritten["before"],
        "after": rewritten["after"],
    }
