# -*- coding: utf-8 -*-
"""Rebuild published wisdom stories from `{lang}/wisdom-stories/{stem}.docx`.

Reads title / body / moral from stem-named Word files and updates category HTML,
`stories-data.js`, `search-index.js`, and `sitemap.html`. Does not modify the
source DOCX files. Preserves layout, IDs, illustrations, and controls.

  python tools/rebuild_stories_from_docx.py --lang ky
  python tools/rebuild_stories_from_docx.py --lang ky --dry-run
  python tools/rebuild_stories_from_docx.py --lang ky --stem aging
"""
from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

from docx import Document

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from dev_story_edit_server import (  # noqa: E402
    LANGS,
    MORAL_RE,
    SITE_SOURCE,
    SOURCE_RE,
    STEM_RE,
    find_story_meta,
    update_category_html,
    update_sitemap,
)
from i18n_config import story_sources  # noqa: E402

SKIP_STEMS = frozenset({"all_stories_combined", "all-stories-combined"})
EDITORIAL_SUFFIX_RE = re.compile(
    r"-(?:AZ-redakte|EN-revised|RU-edited)$",
    re.I,
)
AUTHOR_NAME_RE = re.compile(
    r"^[A-Za-zА-Яа-яƏəӘәÖöÜüĞğŞşÇçIıİiӨөҮүҢңҒғІіҺһЁёҚқ\.\-\s']{2,80}$"
)


@dataclass
class ParsedStory:
    stem: str
    title: str
    body: list[str]
    moral: str
    source: str | None  # None => use SITE_SOURCE[lang]


def read_docx_paragraphs(path: Path) -> list[str]:
    return [
        (p.text or "").strip()
        for p in Document(str(path)).paragraphs
        if (p.text or "").strip()
    ]


def is_internet_source(text: str) -> bool:
    return bool(SOURCE_RE.search(text)) and not MORAL_RE.match(text)


def is_author_credit(text: str) -> bool:
    t = text.strip().rstrip(".")
    if not t or MORAL_RE.match(text) or is_internet_source(text):
        return False
    if len(t) > 80:
        return False
    # Short trailing byline (e.g. "Бахтияр Сиражов").
    return bool(AUTHOR_NAME_RE.match(text.strip())) and " " in t


def parse_story_docx(path: Path) -> ParsedStory:
    paras = read_docx_paragraphs(path)
    if len(paras) < 2:
        raise ValueError(f"too few paragraphs ({len(paras)})")

    title = " ".join(paras[0].split()).strip()
    rest = paras[1:]
    source: str | None = None

    if rest and (is_internet_source(rest[-1]) or is_author_credit(rest[-1])):
        trailing = rest[-1].strip()
        rest = rest[:-1]
        if is_author_credit(trailing):
            # Keep author byline; drop a lone trailing period for site consistency.
            source = trailing[:-1].strip() if trailing.endswith(".") else trailing

    if not rest:
        raise ValueError("no body/moral after title")

    moral_raw = rest[-1]
    if not MORAL_RE.match(moral_raw):
        raise ValueError(f"moral not found; last content={moral_raw[:120]!r}")
    moral = " ".join(moral_raw.split()).strip()
    body = [" ".join(p.split()).strip() for p in rest[:-1]]
    body = [p for p in body if p]
    if not title:
        raise ValueError("empty title")
    if not body:
        raise ValueError("empty body")
    return ParsedStory(
        stem=story_stem_from_docx(path) or path.stem,
        title=title,
        body=body,
        moral=moral,
        source=source,
    )


def story_stem_from_docx(path: Path) -> str | None:
    stem = EDITORIAL_SUFFIX_RE.sub("", path.stem)
    if STEM_RE.match(stem):
        return stem
    return None


def index_docx(lang: str) -> dict[str, Path]:
    folder = story_sources(lang)
    if not folder.is_dir():
        raise SystemExit(f"Missing source folder: {folder}")
    out: dict[str, Path] = {}
    for path in sorted(folder.glob("*.docx")):
        if path.name.startswith("~$"):
            continue
        raw = path.stem
        if raw.casefold().replace(" ", "-") in SKIP_STEMS:
            continue
        if raw.casefold() == "all_stories_combined":
            continue
        stem = story_stem_from_docx(path)
        if not stem:
            # Allow All_Stories_Combined and similar non-story dumps to be skipped quietly.
            if "combined" in raw.casefold() or " " in raw:
                continue
            print(f"skip non-stem filename: {path.name}", file=sys.stderr)
            continue
        out[stem] = path
    return out


def apply_story(lang: str, parsed: ParsedStory, *, dry_run: bool) -> dict:
    slug, old_title = find_story_meta(lang, parsed.stem)
    if not slug:
        raise ValueError("category slug missing")
    source = parsed.source  # None => SITE_SOURCE inside updaters
    if dry_run:
        return {
            "stem": parsed.stem,
            "slug": slug,
            "title": parsed.title,
            "body_paragraphs": len(parsed.body),
            "moral": parsed.moral[:80],
            "source": source or SITE_SOURCE[lang][:40] + "…",
            "title_changed": old_title != parsed.title,
        }

    update_stories_data(
        lang, parsed.stem, parsed.title, parsed.body, parsed.moral, source=source
    )
    cat_title = category_title_for_slug(lang, slug)
    update_search_index(
        lang,
        parsed.stem,
        parsed.title,
        parsed.body,
        parsed.moral,
        cat_title,
        source=source,
    )
    update_category_html(
        lang,
        slug,
        parsed.stem,
        parsed.title,
        parsed.body,
        parsed.moral,
        old_title,
        source=source,
    )
    update_sitemap(lang, parsed.stem, slug, parsed.title)
    return {
        "stem": parsed.stem,
        "slug": slug,
        "title": parsed.title,
        "body_paragraphs": len(parsed.body),
    }


def _patch_stories_blob(data: dict, parsed: ParsedStory, lang: str) -> str:
    """Update in-memory stories-data; return category slug."""
    source = (parsed.source or "").strip() or SITE_SOURCE[lang]
    paragraphs = list(parsed.body) + [parsed.moral, source]
    for cat in data.get("categories") or []:
        for story in cat.get("stories") or []:
            if story.get("stem") != parsed.stem:
                continue
            story["title"] = parsed.title
            story["paragraphs"] = paragraphs
            return str(cat.get("slug") or "")
    raise ValueError(f"stem {parsed.stem!r} not in stories-data")


def _patch_search_blob(
    entries: list,
    parsed: ParsedStory,
    lang: str,
    category: str | None,
) -> None:
    source = (parsed.source or "").strip() or SITE_SOURCE[lang]
    hay = " ".join(
        p
        for p in [parsed.title, category or "", *parsed.body, parsed.moral, source]
        if p
    ).lower()
    for entry in entries:
        if entry.get("stem") != parsed.stem:
            continue
        entry["title"] = parsed.title
        entry["hay"] = hay
        if category:
            entry["category"] = category
        return
    raise ValueError(f"stem {parsed.stem!r} not in search-index")


def apply_all(lang: str, parsed_list: list[ParsedStory], *, dry_run: bool) -> int:
    """Apply many stories with one stories-data / search-index write."""
    from dev_story_edit_server import _load_json_assignment

    if dry_run:
        for parsed in parsed_list:
            apply_story(lang, parsed, dry_run=True)
        return len(parsed_list)

    meta: dict[str, tuple[str, str]] = {}
    for parsed in parsed_list:
        meta[parsed.stem] = find_story_meta(lang, parsed.stem)

    stories_path = ROOT / lang / "assets" / "stories-data.js"
    search_path = ROOT / lang / "assets" / "search-index.js"
    s_prefix, s_data, s_suffix = _load_json_assignment(
        stories_path, "window.__BIRINCI_STORIES__"
    )
    h_prefix, h_entries, h_suffix = _load_json_assignment(
        search_path, "window.__BIRINCI_SEARCH__"
    )

    slug_to_title = {
        str(c.get("slug") or ""): str(c.get("title") or "")
        for c in (s_data.get("categories") or [])
    }

    for parsed in parsed_list:
        slug, old_title = meta[parsed.stem]
        if not slug:
            raise ValueError(f"category slug missing for {parsed.stem}")
        _patch_stories_blob(s_data, parsed, lang)
        _patch_search_blob(
            h_entries, parsed, lang, slug_to_title.get(slug)
        )
        update_category_html(
            lang,
            slug,
            parsed.stem,
            parsed.title,
            parsed.body,
            parsed.moral,
            old_title,
            source=parsed.source,
        )
        update_sitemap(lang, parsed.stem, slug, parsed.title)

    import json

    stories_path.write_text(
        s_prefix
        + json.dumps(s_data, ensure_ascii=False, separators=(",", ":"))
        + s_suffix,
        encoding="utf-8",
        newline="\n",
    )
    search_path.write_text(
        h_prefix
        + json.dumps(h_entries, ensure_ascii=False, separators=(",", ":"))
        + h_suffix,
        encoding="utf-8",
        newline="\n",
    )
    return len(parsed_list)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--lang",
        required=True,
        choices=sorted(LANGS),
        help="Locale to rebuild (e.g. ky)",
    )
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--stem", action="append", default=[], help="Limit to stem(s)")
    args = ap.parse_args()
    lang = args.lang

    sources = index_docx(lang)
    from stories_catalog import load_stories_catalog

    catalog = load_stories_catalog(lang)
    page_stems = {
        s["stem"]
        for c in catalog.get("categories") or []
        for s in c.get("stories") or []
    }

    only = set(args.stem) if args.stem else None
    if only:
        missing = sorted(only - set(sources))
        if missing:
            raise SystemExit(f"--stem not found in docx: {', '.join(missing)}")

    docx_stems = set(sources)
    docx_without_page = sorted(docx_stems - page_stems)
    page_without_docx = sorted(page_stems - docx_stems)

    stems = sorted(docx_stems & page_stems)
    if only:
        stems = [s for s in stems if s in only]

    parsed_ok: list[ParsedStory] = []
    errors: list[tuple[str, str]] = []
    for stem in stems:
        try:
            parsed_ok.append(parse_story_docx(sources[stem]))
        except Exception as exc:  # noqa: BLE001
            errors.append((stem, f"parse: {exc}"))

    updated = 0
    if parsed_ok and not errors:
        try:
            if args.dry_run:
                for i, parsed in enumerate(parsed_ok[:3]):
                    result = apply_story(lang, parsed, dry_run=True)
                    print(
                        f"  sample {parsed.stem}: title={result['title']!r} "
                        f"paras={result['body_paragraphs']} "
                        f"moral={result['moral']!r}"
                    )
                updated = len(parsed_ok)
            else:
                updated = apply_all(lang, parsed_ok, dry_run=False)
        except Exception as exc:  # noqa: BLE001
            errors.append(("*", str(exc)))
    elif parsed_ok and args.dry_run:
        # Still show dry-run samples even if some parses failed.
        for parsed in parsed_ok[:3]:
            result = apply_story(lang, parsed, dry_run=True)
            print(
                f"  sample {parsed.stem}: title={result['title']!r} "
                f"paras={result['body_paragraphs']} "
                f"moral={result['moral']!r}"
            )
        updated = len(parsed_ok)
    elif parsed_ok:
        # Apply successful parses even if some failed — report both.
        try:
            updated = apply_all(lang, parsed_ok, dry_run=False)
        except Exception as exc:  # noqa: BLE001
            errors.append(("*", str(exc)))

    mode = "DRY-RUN" if args.dry_run else "UPDATED"
    print(f"{mode} {lang}: {updated} stories")
    print(f"docx files (stem): {len(docx_stems)}")
    print(f"page stories:      {len(page_stems)}")
    print(
        f"docx without page: {len(docx_without_page)}"
        + (f" -> {docx_without_page}" if docx_without_page else "")
    )
    print(
        f"page without docx: {len(page_without_docx)}"
        + (f" -> {page_without_docx}" if page_without_docx else "")
    )
    print(f"errors: {len(errors)}")
    for stem, err in errors:
        print(f"  ! {stem}: {err}")
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
