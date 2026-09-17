# -*- coding: utf-8 -*-
"""Rebuild Azerbaijani Discoveries article bodies from Age10-14 Word sources.

Matches files to live articles by numeric prefix (1.1, 1.10, …). Preserves
article ids, category chrome, image paths, TOC structure, and URLs.

  python tools/rebuild_az_discovery_from_docx.py
  python tools/rebuild_az_discovery_from_docx.py --dry-run
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
DOCX_DIR = ROOT / "az" / "discovery-articles" / "Age10-14"
PAGE = ROOT / "az" / "discoveries" / "discoveries-and-inventions.html"
BODY = ROOT / "tools" / "inventions" / "az-body.html"

NUM_RE = re.compile(r"^(\d+\.\d+)\b")
TITLE_NUM_RE = re.compile(r"^\d+\.\d+\s+")
CATEGORY_RE = re.compile(r"^\d+\.\s+\S")
REF_GROUP_RE = re.compile(r"^[A-Z]\.\s+\S")
REF_ITEM_RE = re.compile(r"^\d+\.\s+")
URL_RE = re.compile(r"(https?://[^\s<>\"]+?)([.,;:)\]]*)(?=\s|$)")
META_SPLIT_RE = re.compile(r"^(Dövr:\s*.+?)(?:\s*\|\s*(.+))?$", re.S)
FIG_LABEL_RE = re.compile(r"^([^:]+:)\s*(.*)$", re.S)

ARTICLE_RE = re.compile(
    r'(<article class="inventions-entry" id="([^"]+)">)(.*?)(</article>)',
    re.S,
)
ENTRY_HEAD_RE = re.compile(
    r'<article class="inventions-entry" id="([^"]+)">\s*'
    r'<h2 class="inventions-entry-title">'
    r'<span class="inventions-entry-num"[^>]*>([^<]+)</span>'
    r'<span class="inventions-entry-name">([^<]+)</span>',
)
MEDIA_RE = re.compile(r'<div class="inventions-entry-visual-media">.*?</div>', re.S)
IMG_ALT_RE = re.compile(r'(<img\b[^>]*\balt=")([^"]*)(")')
TOC_RE = re.compile(
    r'(<li class="inventions-toc-entry" data-toc-entry="([^"]+)"[^>]*>'
    r'<span class="tl-date">[^<]*</span><a href="#[^"]+">)([^<]*)(</a>)'
)
OLD_FIGURES_RE = re.compile(
    r'<p class="inventions-entry-visual-figures">(.*?)</p>',
    re.S,
)

SECTION_HEAD_PREFIXES = (
    "Bu nədir",
    "Kim kəşf",
    "Onu kim kəşf",
    "Nə vaxt",
    "Elmi əhəmiyyəti",
    "Elmi baxımdan",
    "Sonrakı inkişaf",
    "İnsan həyatını",
)


@dataclass
class ParsedArticle:
    number: str
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
    text = "".join(parts).strip()
    return text or (para.text or "").strip()


def is_section_heading(text: str) -> bool:
    if len(text) > 80:
        return False
    return any(text.startswith(prefix) for prefix in SECTION_HEAD_PREFIXES)


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


def parse_docx(path: Path) -> ParsedArticle:
    number_m = NUM_RE.match(path.stem)
    if not number_m:
        raise ValueError(f"No article number in filename: {path.name}")
    number = number_m.group(1)
    doc = Document(str(path))
    rows = [(para_text(para), (para.style.name if para.style else "")) for para in doc.paragraphs]
    rows = [(text, style) for text, style in rows if text]
    parsed = ParsedArticle(number=number, path=path, title="", category="", period_line="", figures_label="", figures_names="", summary="")
    if not rows:
        parsed.warnings.append("empty document")
        return parsed

    parsed.title = TITLE_NUM_RE.sub("", rows[0][0]).strip() or rows[0][0]
    i = 1
    if i < len(rows) and CATEGORY_RE.match(rows[i][0]) and not rows[i][0].startswith("Dövr:"):
        parsed.category = rows[i][0]
        i += 1
    if i < len(rows) and rows[i][0].startswith("Dövr:"):
        parsed.period_line = rows[i][0]
        meta = META_SPLIT_RE.match(rows[i][0])
        if meta and meta.group(2):
            fig = FIG_LABEL_RE.match(meta.group(2).strip())
            if fig:
                parsed.figures_label = fig.group(1).strip()
                parsed.figures_names = fig.group(2).strip()
            else:
                parsed.figures_names = meta.group(2).strip()
        i += 1

    summary_parts: list[str] = []
    while i < len(rows) and rows[i][0] != "Əsas faktlar" and not is_section_heading(rows[i][0]):
        summary_parts.append(rows[i][0])
        i += 1
    parsed.summary = " ".join(summary_parts).strip()
    if i < len(rows) and rows[i][0] == "Əsas faktlar":
        i += 1
    while i < len(rows) and rows[i][0] != "Mənbələr və istinadlar" and not is_section_heading(rows[i][0]):
        parsed.facts.append(rows[i][0])
        i += 1

    while i < len(rows) and rows[i][0] != "Mənbələr və istinadlar":
        text, _style = rows[i]
        if is_section_heading(text):
            heading = text
            i += 1
            body: list[str] = []
            while (
                i < len(rows)
                and rows[i][0] != "Mənbələr və istinadlar"
                and not is_section_heading(rows[i][0])
                and not REF_GROUP_RE.match(rows[i][0])
            ):
                body.append(rows[i][0])
                i += 1
            parsed.sections.append((heading, body))
        else:
            parsed.warnings.append(f"unexpected paragraph before references: {text[:80]}")
            i += 1

    if i < len(rows) and rows[i][0] == "Mənbələr və istinadlar":
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
        text = rows[i][0]
        if REF_GROUP_RE.match(text):
            flush_group()
            current_title = text
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


def render_article(parsed: ParsedArticle, article_id: str, number: str, media_html: str, fallback_figures: str) -> str:
    title = html.escape(parsed.title)
    media = IMG_ALT_RE.sub(rf'\1İllüstrasiya: {title}\3', media_html, count=1)
    names = parsed.figures_names
    if names:
        figures = (
            f'<p class="inventions-entry-visual-figures"><strong>Əsas adlar:</strong> '
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
    facts_html = f'<div class="inventions-key-facts"><h3>Əsas faktlar</h3><ul>{facts}</ul></div>'
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
    refs = (
        '<div class="inventions-entry-references">\n'
        "<h3>Mənbələr və istinadlar</h3>\n"
        + "\n".join(groups)
        + "\n</div>"
    )
    return (
        f'<h2 class="inventions-entry-title">'
        f'<span class="inventions-entry-num" aria-hidden="true">{html.escape(number)}</span>'
        f'<span class="inventions-entry-name">{title}</span></h2>\n'
        f'<div class="inventions-entry-visual">\n'
        f"{media}\n"
        f'<div class="inventions-entry-visual-copy">{figures}{summary}{meta}{facts_html}</div>\n'
        f"</div>\n"
        + "\n".join(sections)
        + "\n"
        + refs
        + "\n"
    )


def index_live_articles(markup: str) -> dict[str, tuple[str, str]]:
    """number -> (id, current title)."""
    found: dict[str, tuple[str, str]] = {}
    for article_id, number, name in ENTRY_HEAD_RE.findall(markup):
        if number in found:
            raise SystemExit(f"Duplicate live article number {number}")
        found[number] = (article_id, html.unescape(name))
    return found


def index_docx() -> dict[str, Path]:
    found: dict[str, Path] = {}
    unmatched: list[str] = []
    for path in sorted(DOCX_DIR.glob("*.docx")):
        match = NUM_RE.match(path.stem)
        if not match:
            unmatched.append(path.name)
            continue
        number = match.group(1)
        if number in found:
            raise SystemExit(f"Duplicate source number {number}: {found[number].name} and {path.name}")
        found[number] = path
    if unmatched:
        print("Unnumbered source files:")
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


def rebuild(dry_run: bool = False) -> dict:
    if not DOCX_DIR.is_dir():
        raise SystemExit(f"Missing source folder: {DOCX_DIR}")
    page = PAGE.read_text(encoding="utf-8")
    live = index_live_articles(page)
    sources = index_docx()
    live_nums = set(live)
    source_nums = set(sources)
    missing_sources = sorted(live_nums - source_nums, key=lambda n: [int(p) for p in n.split(".")])
    extra_sources = sorted(source_nums - live_nums, key=lambda n: [int(p) for p in n.split(".")])
    parsed_by_num: dict[str, ParsedArticle] = {}
    for number in sorted(live_nums & source_nums, key=lambda n: [int(p) for p in n.split(".")]):
        parsed_by_num[number] = parse_docx(sources[number])

    by_id: dict[str, str] = {}
    titles: dict[str, str] = {}
    renamed: list[tuple[str, str, str, str]] = []
    warnings: list[str] = []
    for number, parsed in parsed_by_num.items():
        article_id, old_title = live[number]
        titles[article_id] = parsed.title
        if parsed.title != old_title:
            renamed.append((number, article_id, old_title, parsed.title))
        article_m = re.search(
            rf'<article class="inventions-entry" id="{re.escape(article_id)}">(.*?)</article>',
            page,
            re.S,
        )
        if not article_m:
            raise SystemExit(f"Could not locate article {article_id}")
        old_inner = article_m.group(1)
        media_m = MEDIA_RE.search(old_inner)
        if not media_m:
            raise SystemExit(f"Missing image block in {article_id}")
        figures_m = OLD_FIGURES_RE.search(old_inner)
        fallback = figures_m.group(0) if figures_m else ""
        by_id[article_id] = render_article(parsed, article_id, number, media_m.group(0), fallback)
        for warning in parsed.warnings:
            warnings.append(f"{number} {article_id}: {warning}")

    report = {
        "live": len(live),
        "sources": len(sources),
        "updated": len(by_id),
        "missing_sources": missing_sources,
        "extra_sources": extra_sources,
        "renamed": renamed,
        "warnings": warnings,
    }
    if dry_run:
        return report

    for path in (PAGE, BODY):
        if not path.is_file():
            raise SystemExit(f"Missing HTML file: {path}")
        markup = path.read_text(encoding="utf-8")
        markup = replace_articles(markup, by_id)
        markup = replace_toc(markup, titles)
        path.write_text(markup, encoding="utf-8")
    return report


def print_report(report: dict) -> None:
    print(f"Live articles: {report['live']}")
    print(f"Source files:  {report['sources']}")
    print(f"Updated:       {report['updated']}")
    print(f"Missing sources for live articles: {report['missing_sources'] or 'none'}")
    print(f"Unmatched extra source files: {report['extra_sources'] or 'none'}")
    print(f"Title changes: {len(report['renamed'])}")
    for number, article_id, old, new in report["renamed"]:
        print(f"  {number} #{article_id}")
        print(f"    {old}")
        print(f"    {new}")
    if report["warnings"]:
        print("Warnings:")
        for warning in report["warnings"]:
            print(f"  {warning}")
    else:
        print("Warnings: none")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    report = rebuild(dry_run=args.dry_run)
    print_report(report)
    return 1 if report["missing_sources"] or report["extra_sources"] or report["warnings"] else 0


if __name__ == "__main__":
    sys.exit(main())
