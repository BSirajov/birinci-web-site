# -*- coding: utf-8 -*-
"""Rebuild Discoveries article bodies from finalized top-level Word sources.

Reads `{lang}/discovery-articles/*.docx` (not Age10-14 or `_work` drafts) and
injects text into `{lang}/discoveries/discoveries-and-inventions.html` plus
`tools/inventions/{lang}-body.html`.

Matches files to live articles by English slug (filename after the number),
never by the alphabetical display number on the page. Preserves article ids,
display numbers, image markup, TOC structure, and chrome.

  python tools/rebuild_discovery_from_docx.py
  python tools/rebuild_discovery_from_docx.py --lang en --dry-run
"""
from __future__ import annotations

import argparse
import html
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parents[1]
LANGS = ("en", "az", "ru", "ky")

NUM_RE = re.compile(r"^(\d+\.\d+)\b")
TITLE_NUM_RE = re.compile(r"^\d+\.\d+\s+")
CATEGORY_RE = re.compile(r"^\d+\.\s+\S")
REF_GROUP_RE = re.compile(r"^[A-ZА-ЯЁ]\.\s+\S")
REF_GROUP_LETTER_RE = re.compile(r"^[A-ZА-ЯЁ](?:[.\)]\s+|\s+)(?=\S)")
REF_ITEM_RE = re.compile(r"^\d+\.\s+")
REF_GROUP_TITLES = frozenset(
    {
        "Books and major scholarly works",
        "Institutional and encyclopedic sources",
        "Peer-reviewed articles and scientific reports",
        "Peer-reviewed articles and original scientific papers",
        "Original papers",
        "Original scientific papers",
        "Museum, archive, and library resources",
        "Museum and archive resources",
        "Online lectures and educational series",
        "Space agencies, laboratories, and scientific organisations",
        "Space organisations",
        "Laboratories and scientific organisations",
        "Scientific organisations",
        "Professional societies and standards bodies",
        "Professional societies",
        "Press, popular science, and general reference",
        "Kitablar və əsas elmi əsərlər",
        "Qurumların materialları və ensiklopedik mənbələr",
        "Rəy verilmiş elmi məqalələr və hesabatlar",
        "Rəy verilmiş məqalələr və orijinal elmi işlər",
        "Orijinal elmi məqalələr",
        "Muzey arxiv və kitabxana materialları",
        "Muzey və arxiv materialları",
        "Onlayn mühazirələr və tədris silsilələri",
        "Kosmik agentliklər laboratoriyalar və elmi təşkilatlar",
        "Kosmik təşkilatlar",
        "Laboratoriyalar və elmi təşkilatlar",
        "Elmi təşkilatlar",
        "Peşə birlikləri və standartlaşdırma qurumları",
        "Peşə birlikləri",
        "Mətbuat elmi kütləvi nəşrlər və ümumi mənbələr",
        "Книги и основные научные труды",
        "Материалы организаций и энциклопедии",
        "Рецензируемые статьи и научные отчёты",
        "Рецензируемые и оригинальные научные статьи",
        "Оригинальные научные статьи",
        "Материалы музеев, архивов и библиотек",
        "Материалы музеев и архивов",
        "Онлайн-лекции и образовательные циклы",
        "Космические агентства, лаборатории и научные организации",
        "Космические организации",
        "Лаборатории и научные организации",
        "Научные организации",
        "Профессиональные общества и организации по стандартизации",
        "Профессиональные общества",
        "Пресса, научно-популярные и справочные материалы",
        "Китептер жана негизги илимий эмгектер",
        "Уюмдардын жана энциклопедиялардын материалдары",
        "Адистердин кароосунан өткөн макалалар жана илимий отчеттор",
        "Адистердин кароосунан өткөн жана баштапкы илимий макалалар",
        "Баштапкы илимий макалалар",
        "Музейлердин, архивдердин жана китепканалардын материалдары",
        "Музейлердин жана архивдердин материалдары",
        "Онлайн лекциялар жана билим берүү топтомдору",
        "Космос агенттиктери, лабораториялар жана илимий уюмдар",
        "Космос уюмдары",
        "Лабораториялар жана илимий уюмдар",
        "Илимий уюмдар",
        "Кесиптик коомдор жана стандартташтыруу уюмдары",
        "Кесиптик коомдор",
        "Басма сөз, илимий-популярдуу жана маалымдама материалдар",
    }
)
URL_RE = re.compile(r"(https?://[^\s<>\"]+?)([.,;:)\]]*)(?=\s|$)")
FIG_LABEL_RE = re.compile(r"^([^:]+:)\s*(.*)$", re.S)

ARTICLE_RE = re.compile(
    r'(<article class="inventions-entry" id="([^"]+)"[^>]*>)(.*?)(</article>)',
    re.S,
)
ENTRY_HEAD_RE = re.compile(
    r'<article class="inventions-entry" id="([^"]+)"[^>]*>\s*'
    r'<h2 class="inventions-entry-title">'
    r'(<span[^>]*class="inventions-entry-num"[^>]*>)([^<]+)(</span>)'
    r'<span class="inventions-entry-name">([^<]*)</span>',
)
MEDIA_CHUNK_RE = re.compile(
    r'(<div class="inventions-entry-visual">\s*)(.*?)(<div class="inventions-entry-visual-copy">)',
    re.S,
)
IMG_ALT_RE = re.compile(r'(<img\b[^>]*\balt=")([^"]*)(")')
NUM_SPAN_RE = re.compile(
    r'(<h2 class="inventions-entry-title">)(<span[^>]*class="inventions-entry-num"[^>]*>.*?</span>)',
    re.S,
)
TOC_RE = re.compile(
    r'(<li class="inventions-toc-entry" data-toc-entry="([^"]+)"[^>]*>'
    r'<span class="tl-date">[^<]*</span><a href="#[^"]+">)([^<]*)(</a>)'
)
OLD_FIGURES_RE = re.compile(
    r'<p class="inventions-entry-visual-figures">(.*?)</p>',
    re.S,
)

# Filename-stem leftovers that do not slugify to the live article id.
SLUG_ALIASES = {
    "integrated-circuit-microchip": "integrated-circuit-microchip",
}

LOCALE = {
    "en": {
        "period_prefix": "Period:",
        "facts_head": "Key facts",
        "refs_heads": ("Sources and references",),
        "figures_label": "Key figure(s):",
        "alt_prefix": "Illustration:",
        "section_prefixes": (
            "What it is",
            "Who discovered or invented it",
            "When and how it emerged",
            "Why it mattered scientifically",
            "How it shaped later developments",
            "How it changed human life",
        ),
        "meta_split": re.compile(r"^(Period:\s*.+?)(?:\s*\|\s*(.+))?$", re.S),
    },
    "az": {
        "period_prefix": "Dövr:",
        "facts_head": "Əsas məlumatlar",
        "facts_heads": ("Əsas məlumatlar", "Əsas faktlar"),
        "refs_heads": ("Mənbələr və istinadlar",),
        "figures_label": "Əsas adlar:",
        "alt_prefix": "İllüstrasiya:",
        "section_prefixes": (
            "Bu nədir",
            "Necə və kimlərin sayəsində",
            "Onu kim kəşf",
            "Kim kəşf",
            "Kim yaradıb",
            "Kim həyata keçirib",
            "Nə vaxt",
            "Elm üçün",
            "Elmi əhəmiyyəti",
            "Elmi baxımdan",
            "Sonrakı inkişaf",
            "İnsan həyatını",
            "İnsanların həyatını",
            "Pul və bank işi nədir",
            "Pul və bank işi necə yaranıb",
            "Odu idarə etmək nə deməkdir",
            "Oddan ilk kimlər istifadə edib",
            "Atın əhliləşdirilməsi nə deməkdir",
            "Atı ilk kimlər əhliləşdirib",
            "Elm baxımından",
            "Sonrakı ixtiralara",
        ),
        "category_re": re.compile(r"^\d+\.?\s+\S"),
        # Most finalized AZ Word files still use "A Kitablar…" without a period.
        # A few articles (e.g. horse domestication) drop the group letter entirely.
        "ref_group_re": re.compile(
            r"^(?:[A-JH]\s+\S|"
            r"Kitablar və əsas elmi əsərlər|"
            r"Qurumların materialları və ensiklopedik mənbələr|"
            r"Rəy verilmiş elmi məqalələr və hesabatlar)"
        ),
        "meta_split": re.compile(r"^(Dövr:\s*.+?)(?:\s*\|\s*(.+))?$", re.S),
    },
    "ru": {
        "period_prefix": "Период:",
        "facts_head": "Кратко о главном",
        "facts_heads": ("Кратко о главном", "Ключевые факты"),
        "refs_heads": ("Источники и литература", "Источники и ссылки"),
        "figures_label": "Основные участники:",
        "alt_prefix": "Иллюстрация:",
        "section_prefixes": (
            "Что это",
            "Кто открыл",
            "Кто изобрёл",
            "Кто изобрел",
            "Когда и как",
            "Значение для науки",
            "Влияние на дальнейшее развитие",
            "Почему это важно",
            "Как это повлияло",
            "Как это изменило",
            "Как изменило",
        ),
        "meta_split": re.compile(r"^(Период:\s*.+?)(?:\s*\|\s*(.+))?$", re.S),
    },
    "ky": {
        "period_prefix": "Мезгил:",
        "facts_head": "Негизги маалыматтар",
        "facts_heads": ("Негизги маалыматтар", "Негизги фактылар"),
        "refs_heads": (
            "Булактар жана кошумча окуу",
            "Булактар жана адабияттар",
            "Булактар жана шилтемелер",
        ),
        "figures_label": "Негизги катышуучулар:",
        "alt_prefix": "Сүрөт:",
        "section_prefixes": (
            "Бул эмне",
            "Аны ким ачкан",
            "Ким ачкан",
            "Ким ойлоп тапкан",
            "Качан жана кантип",
            "Илимий жактан",
            "Илимий мааниси",
            "Илим үчүн",
            "Кийинки өнүгүү",
            "Адамдардын жашоосун",
        ),
        "meta_split": re.compile(r"^(Мезгил:\s*.+?)(?:\s*\|\s*(.+))?$", re.S),
    },
}


@dataclass
class ParsedArticle:
    number: str
    slug: str
    path: Path
    title: str
    category: str
    period_line: str
    figures_label: str
    figures_names: str
    summary: str
    facts: list[str] = field(default_factory=list)
    sections: list[tuple[str, list[str]]] = field(default_factory=list)
    ref_groups: list[tuple[str, list[str]]] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def file_stem(name: str) -> str:
    if name.lower().endswith(".docx"):
        return name[: -len(".docx")]
    return name


def slug_from_stem(stem: str) -> str:
    name = NUM_RE.sub("", stem).strip()
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return SLUG_ALIASES.get(slug, slug)


def para_text(para) -> str:
    parts: list[str] = []
    for child in para._p.iterchildren():
        if child.tag == qn("w:hyperlink"):
            rid = child.get(qn("r:id"))
            visible = "".join(t.text or "" for t in child.iter(qn("w:t")))
            url = ""
            if rid and para.part and para.part.rels and rid in para.part.rels:
                url = para.part.rels[rid].target_ref or ""
            if url and url not in visible:
                parts.append(f"{visible} {url}".strip() if visible else url)
            else:
                parts.append(visible or url)
        elif child.tag == qn("w:r"):
            parts.append("".join(t.text or "" for t in child.iter(qn("w:t"))))
    text = "".join(parts).replace("\u00a0", " ").strip()
    return text or (para.text or "").replace("\u00a0", " ").strip()


def is_section_heading(text: str, prefixes: tuple[str, ...]) -> bool:
    if len(text) > 70:
        return False
    if "." in text or ":" in text:
        return False
    return any(text.startswith(prefix) for prefix in prefixes)


def facts_heads_for(lang: str) -> tuple[str, ...]:
    cfg = LOCALE[lang]
    heads = cfg.get("facts_heads")
    if heads:
        return tuple(heads)
    return (cfg["facts_head"],)


def strip_ref_group_letter(text: str) -> str:
    """Drop A / A. / B. category letters from a source-group heading."""
    return REF_GROUP_LETTER_RE.sub("", text, count=1).strip()


def is_ref_group(text: str, pattern: re.Pattern[str] | None = None) -> bool:
    if REF_ITEM_RE.match(text) or len(text) > 90:
        return False
    stripped = strip_ref_group_letter(text)
    if stripped in REF_GROUP_TITLES:
        return True
    rx = pattern or REF_GROUP_RE
    if not rx.match(text):
        return False
    return True


def is_refs_head(text: str, refs_heads: tuple[str, ...]) -> bool:
    return text in refs_heads


def escape_with_links(text: str) -> str:
    parts: list[str] = []
    last = 0
    for match in URL_RE.finditer(text):
        parts.append(html.escape(text[last : match.start()]))
        url, trail = match.group(1), match.group(2)
        parts.append(
            f'<a class="resource-link" href="{html.escape(url, quote=True)}" '
            f'target="_blank" rel="noopener noreferrer">{html.escape(url)}</a>'
        )
        parts.append(html.escape(trail))
        last = match.end()
    parts.append(html.escape(text[last:]))
    return "".join(parts)


def parse_docx(path: Path, lang: str) -> ParsedArticle:
    cfg = LOCALE[lang]
    stem = file_stem(path.name)
    number_m = NUM_RE.match(stem)
    if not number_m:
        raise ValueError(f"No article number in filename: {path.name}")
    number = number_m.group(1)
    slug = slug_from_stem(stem)
    doc = Document(str(path))
    rows = [para_text(para) for para in doc.paragraphs]
    rows = [text for text in rows if text]
    parsed = ParsedArticle(
        number=number,
        slug=slug,
        path=path,
        title="",
        category="",
        period_line="",
        figures_label="",
        figures_names="",
        summary="",
    )
    if not rows:
        parsed.warnings.append("empty document")
        return parsed

    parsed.title = TITLE_NUM_RE.sub("", rows[0]).strip() or rows[0]
    i = 1
    period_prefix = cfg["period_prefix"]
    category_re = cfg.get("category_re", CATEGORY_RE)
    if i < len(rows) and category_re.match(rows[i]) and not rows[i].startswith(period_prefix):
        parsed.category = rows[i]
        i += 1
    if i < len(rows) and rows[i].startswith(period_prefix):
        parsed.period_line = rows[i]
        meta = cfg["meta_split"].match(rows[i])
        if meta and meta.group(2):
            fig = FIG_LABEL_RE.match(meta.group(2).strip())
            if fig:
                parsed.figures_label = fig.group(1).strip()
                parsed.figures_names = fig.group(2).strip()
            else:
                parsed.figures_names = meta.group(2).strip()
        i += 1

    facts_heads = facts_heads_for(lang)
    refs_heads = cfg["refs_heads"]
    prefixes = cfg["section_prefixes"]
    ref_group_re = cfg.get("ref_group_re")
    summary_parts: list[str] = []
    while (
        i < len(rows)
        and rows[i] not in facts_heads
        and not is_section_heading(rows[i], prefixes)
        and not is_refs_head(rows[i], refs_heads)
    ):
        summary_parts.append(rows[i])
        i += 1
    parsed.summary = " ".join(summary_parts).strip()
    if i < len(rows) and rows[i] in facts_heads:
        i += 1
    while (
        i < len(rows)
        and not is_refs_head(rows[i], refs_heads)
        and not is_section_heading(rows[i], prefixes)
    ):
        parsed.facts.append(rows[i])
        i += 1

    while i < len(rows) and not is_refs_head(rows[i], refs_heads):
        text = rows[i]
        if is_section_heading(text, prefixes):
            heading = text
            i += 1
            body: list[str] = []
            while (
                i < len(rows)
                and not is_refs_head(rows[i], refs_heads)
                and not is_section_heading(rows[i], prefixes)
                and not is_ref_group(rows[i], ref_group_re)
            ):
                body.append(rows[i])
                i += 1
            parsed.sections.append((heading, body))
        else:
            parsed.warnings.append(f"unexpected paragraph before references: {text[:80]}")
            i += 1

    if i < len(rows) and is_refs_head(rows[i], refs_heads):
        i += 1
    current_title = ""
    current_items: list[str] = []

    def flush_group() -> None:
        nonlocal current_title, current_items
        if current_title or current_items:
            parsed.ref_groups.append((current_title, current_items))
        current_title = ""
        current_items = []

    while i < len(rows):
        text = rows[i]
        if is_ref_group(text, ref_group_re):
            flush_group()
            current_title = strip_ref_group_letter(text)
        elif REF_ITEM_RE.match(text):
            current_items.append(REF_ITEM_RE.sub("", text).strip())
        elif current_items:
            current_items[-1] = f"{current_items[-1]} {text}"
        else:
            parsed.warnings.append(f"unexpected reference paragraph: {text[:80]}")
        i += 1
    flush_group()

    if not parsed.title:
        parsed.warnings.append("missing title")
    if not parsed.summary:
        parsed.warnings.append("missing summary")
    if len(parsed.facts) != 5:
        parsed.warnings.append(f"{len(parsed.facts)} key facts (expected 5)")
    if len(parsed.sections) != 6:
        parsed.warnings.append(f"{len(parsed.sections)} body sections (expected 6)")
    if not parsed.ref_groups:
        parsed.warnings.append("no reference groups")
    return parsed


def render_article(
    parsed: ParsedArticle,
    lang: str,
    number: str,
    num_span: str,
    media_html: str,
    fallback_figures: str,
) -> str:
    cfg = LOCALE[lang]
    title = html.escape(parsed.title)
    media = IMG_ALT_RE.sub(rf"\1{html.escape(cfg['alt_prefix'])} {title}\3", media_html, count=1)
    names = parsed.figures_names
    label = parsed.figures_label or cfg["figures_label"]
    if names:
        figures = (
            f'<p class="inventions-entry-visual-figures"><strong>{html.escape(label)}</strong> '
            f"{html.escape(names)}</p>"
        )
    elif fallback_figures:
        figures = fallback_figures
    else:
        figures = ""
    summary = f'<p class="inventions-entry-visual-summary">{html.escape(parsed.summary)}</p>'
    meta = (
        f'<p class="inventions-entry-meta">{html.escape(parsed.period_line)}</p>'
        if parsed.period_line
        else ""
    )
    facts = "".join(f"<li>{html.escape(item)}</li>" for item in parsed.facts)
    facts_html = (
        f'<div class="inventions-key-facts"><h3>{html.escape(cfg["facts_head"])}</h3>'
        f"<ul>{facts}</ul></div>"
    )
    sections = []
    for heading, paras in parsed.sections:
        body = "".join(f"<p>{html.escape(para)}</p>" for para in paras) or "<p></p>"
        sections.append(
            f'<div class="inventions-entry-section">\n<h3>{html.escape(heading)}</h3>\n{body}\n</div>'
        )
    groups = []
    for group_title, items in parsed.ref_groups:
        lis = "".join(f"<li>{escape_with_links(item)}</li>" for item in items)
        head = f"<h4>{html.escape(group_title)}</h4>\n" if group_title else ""
        groups.append(
            f'<div class="inventions-entry-references-group">\n{head}'
            f'<ol class="inventions-bibliography">\n{lis}\n</ol></div>'
        )
    refs_head = parsed_refs_head(parsed, lang)
    refs = (
        '<div class="inventions-entry-references">\n'
        f"<h3>{html.escape(refs_head)}</h3>\n"
        + "\n".join(groups)
        + "\n</div>"
    )
    return (
        f'<h2 class="inventions-entry-title">'
        f"{num_span}"
        f'<span class="inventions-entry-name">{title}</span></h2>\n'
        f'<div class="inventions-entry-visual">\n'
        f"{media}"
        f'<div class="inventions-entry-visual-copy">{figures}{summary}{meta}{facts_html}</div>\n'
        f"</div>\n"
        + "\n".join(sections)
        + "\n"
        + refs
        + "\n"
    )


def parsed_refs_head(parsed: ParsedArticle, lang: str) -> str:
    return LOCALE[lang]["refs_heads"][0]


def index_live_articles(markup: str) -> dict[str, tuple[str, str]]:
    """article_id -> (display_number, current title)."""
    found: dict[str, tuple[str, str]] = {}
    for article_id, _open, number, _close, name in ENTRY_HEAD_RE.findall(markup):
        if article_id in found:
            raise SystemExit(f"Duplicate live article id {article_id}")
        found[article_id] = (number, html.unescape(name))
    return found


def number_to_en_slug() -> dict[str, str]:
    """Map source numbers (1.1, 3.6, …) to live English article ids."""
    mapping: dict[str, str] = {}
    folder = ROOT / "en" / "discovery-articles"
    for path in sorted(folder.glob("*.docx")):
        stem = file_stem(path.name)
        match = NUM_RE.match(stem)
        if not match:
            continue
        mapping[match.group(1)] = slug_from_stem(stem)
    return mapping


def resolve_source_slug(stem: str, live_ids: set[str] | None = None) -> str:
    slug = slug_from_stem(stem)
    if live_ids is None or slug in live_ids:
        return slug
    number_m = NUM_RE.match(stem)
    if not number_m:
        return slug
    return number_to_en_slug().get(number_m.group(1), slug)


def index_docx(lang: str, live_ids: set[str] | None = None) -> dict[str, Path]:
    folder = ROOT / lang / "discovery-articles"
    found: dict[str, Path] = {}
    unmatched: list[str] = []
    for path in sorted(folder.glob("*.docx")):
        stem = file_stem(path.name)
        if not NUM_RE.match(stem):
            unmatched.append(path.name)
            continue
        slug = resolve_source_slug(stem, live_ids)
        if slug in found:
            raise SystemExit(f"Duplicate source slug {slug}: {found[slug].name} and {path.name}")
        found[slug] = path
    if unmatched:
        print(f"[{lang}] Unnumbered source files:")
        for name in unmatched:
            print(f"  {name}")
    return found


def replace_articles(markup: str, by_id: dict[str, str]) -> str:
    def repl(match: re.Match[str]) -> str:
        open_tag, article_id, _old, close = match.groups()
        inner = by_id.get(article_id)
        if inner is None:
            return match.group(0)
        return f"{open_tag}\n{inner}{close}"

    return ARTICLE_RE.sub(repl, markup)


def replace_toc(markup: str, titles: dict[str, str]) -> str:
    def repl(match: re.Match[str]) -> str:
        prefix, article_id, _old, close = match.groups()
        title = titles.get(article_id)
        if title is None:
            return match.group(0)
        return f"{prefix}{html.escape(title)}{close}"

    return TOC_RE.sub(repl, markup)


def extract_num_span(inner: str, number: str) -> str:
    match = NUM_SPAN_RE.search(inner)
    if match:
        return match.group(2)
    return f'<span class="inventions-entry-num" aria-hidden="true">{html.escape(number)}</span>'


def extract_media(inner: str) -> str:
    match = MEDIA_CHUNK_RE.search(inner)
    if not match:
        raise ValueError("missing visual / media block")
    return match.group(2)


def rebuild_lang(lang: str, dry_run: bool = False) -> dict:
    cfg_ok = lang in LOCALE
    if not cfg_ok:
        raise SystemExit(f"Unsupported language: {lang}")
    docx_dir = ROOT / lang / "discovery-articles"
    page_path = ROOT / lang / "discoveries" / "discoveries-and-inventions.html"
    body_path = ROOT / "tools" / "inventions" / f"{lang}-body.html"
    if not docx_dir.is_dir():
        raise SystemExit(f"Missing source folder: {docx_dir}")
    if not page_path.is_file():
        raise SystemExit(f"Missing HTML file: {page_path}")
    page = page_path.read_text(encoding="utf-8")
    live = index_live_articles(page)
    live_ids = set(live)
    sources = index_docx(lang, live_ids)
    source_ids = set(sources)
    missing_sources = sorted(live_ids - source_ids)
    extra_sources = sorted(source_ids - live_ids)
    parsed_by_id: dict[str, ParsedArticle] = {}
    for article_id in sorted(live_ids & source_ids):
        parsed_by_id[article_id] = parse_docx(sources[article_id], lang)

    by_id: dict[str, str] = {}
    titles: dict[str, str] = {}
    renamed: list[tuple[str, str, str, str]] = []
    warnings: list[str] = []
    for article_id, parsed in parsed_by_id.items():
        number, old_title = live[article_id]
        titles[article_id] = parsed.title
        if parsed.title != old_title:
            renamed.append((parsed.number, article_id, old_title, parsed.title))
        article_m = re.search(
            rf'<article class="inventions-entry" id="{re.escape(article_id)}"[^>]*>(.*?)</article>',
            page,
            re.S,
        )
        if not article_m:
            raise SystemExit(f"Could not locate article {article_id}")
        old_inner = article_m.group(1)
        try:
            media = extract_media(old_inner)
        except ValueError as exc:
            raise SystemExit(f"{lang} #{article_id}: {exc}") from exc
        figures_m = OLD_FIGURES_RE.search(old_inner)
        fallback = figures_m.group(0) if figures_m else ""
        num_span = extract_num_span(old_inner, number)
        by_id[article_id] = render_article(parsed, lang, number, num_span, media, fallback)
        for warning in parsed.warnings:
            warnings.append(f"{parsed.number} #{article_id}: {warning}")

    report = {
        "lang": lang,
        "live": len(live),
        "sources": len(sources),
        "updated": len(by_id),
        "missing_sources": missing_sources,
        "extra_sources": extra_sources,
        "renamed": renamed,
        "warnings": warnings,
        "paths": [str(page_path.relative_to(ROOT)), str(body_path.relative_to(ROOT))],
    }
    if dry_run:
        return report

    targets = [page_path]
    if body_path.is_file():
        targets.append(body_path)
    else:
        report["warnings"].append(f"missing body fragment: {body_path}")
    for path in targets:
        markup = path.read_text(encoding="utf-8")
        markup = replace_articles(markup, by_id)
        markup = replace_toc(markup, titles)
        path.write_text(markup, encoding="utf-8")
    return report


def _safe_print(text: str) -> None:
    try:
        print(text)
    except UnicodeEncodeError:
        encoding = getattr(sys.stdout, "encoding", None) or "utf-8"
        print(text.encode(encoding, errors="replace").decode(encoding, errors="replace"))


def print_report(report: dict) -> None:
    lang = report["lang"]
    _safe_print(f"=== {lang} ===")
    _safe_print(f"Live articles: {report['live']}")
    _safe_print(f"Source files:  {report['sources']}")
    _safe_print(f"Updated:       {report['updated']}")
    _safe_print(f"Missing sources for live articles: {report['missing_sources'] or 'none'}")
    _safe_print(f"Unmatched extra source files: {report['extra_sources'] or 'none'}")
    _safe_print(f"Title changes: {len(report['renamed'])}")
    for number, article_id, old, new in report["renamed"][:20]:
        _safe_print(f"  {number} #{article_id}")
        _safe_print(f"    {old}")
        _safe_print(f"    {new}")
    if len(report["renamed"]) > 20:
        _safe_print(f"  … {len(report['renamed']) - 20} more title changes")
    if report["warnings"]:
        _safe_print("Warnings:")
        for warning in report["warnings"][:40]:
            _safe_print(f"  {warning}")
        if len(report["warnings"]) > 40:
            _safe_print(f"  … {len(report['warnings']) - 40} more warnings")
    else:
        _safe_print("Warnings: none")
    _safe_print(f"Files: {', '.join(report['paths'])}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lang", choices=LANGS, action="append")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    langs = args.lang or list(LANGS)
    code = 0
    for lang in langs:
        report = rebuild_lang(lang, dry_run=args.dry_run)
        print_report(report)
        if report["missing_sources"] or report["extra_sources"] or report["warnings"]:
            code = 1
    return code


if __name__ == "__main__":
    sys.exit(main())
