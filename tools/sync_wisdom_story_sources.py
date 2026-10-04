# -*- coding: utf-8 -*-
"""Sync published Wisdom Stories from author-folder / sibling source docx+images.

Usage:
  python tools/sync_wisdom_story_sources.py --lang en
  python tools/sync_wisdom_story_sources.py --lang ru
  python tools/sync_wisdom_story_sources.py --lang az
  python tools/sync_wisdom_story_sources.py --lang ky
"""
from __future__ import annotations

import argparse
import hashlib
import html as html_lib
import json
import re
import shutil
import sys
from dataclasses import dataclass, field
from pathlib import Path

from docx import Document
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from dev_story_edit_server import (  # noqa: E402
    MORAL_RE,
    SOURCE_RE,
    find_story_meta,
    update_sitemap,
)
from rebuild_stories_from_docx import (  # noqa: E402
    AUTHOR_NAME_RE,
    is_author_credit,
    is_internet_source,
)

STAMPS = {
    "az": "20260930azsrc",
    "en": "20260930ensrc",
    "ru": "20260930rusrc",
    "ky": "20260930kysrc",
}

SITE_AUTHOR = {
    "etibar": {
        "az": "Etibar Siracsoy",
        "en": "Etibar Siracsoy",
        "ru": "Etibar Siracsoy",
        "ky": "Etibar Siracsoy",
    },
    "bakhtiyar": {
        "az": "Bəxtiyar Siracov",
        "en": "Bakhtiyar Sirajov",
        "ru": "Бахтияр Сираджов",
        "ky": "Бахтияр Сиражов",
    },
}

ETIBAR_NAME_HINTS = (
    "etibar",
    "этибар",
    "siracsoy",
    "sirajsoy",
    "сираджсой",
    "сиражсой",
)
BAKHTIYAR_NAME_HINTS = (
    "bakhtiyar",
    "bəxtiyar",
    "баҳтияр",
    "бахтияр",
    "sirajov",
    "siracov",
    "сираджов",
    "сиражов",
)

# EN Etibar source filenames that differ from published stems.
EN_ETIBAR_ALIAS = {
    "humanity": "humanity-rebuilds-in-peace",
    "i-have-lived-another-day": "day-gratefully-lived",
    "relationships": "kindness-builds-stronger-bonds",
    "small-changes-great-value": "small-changes-big-meaning",
    "the-story-of-a-nail": "nails-lasting-lesson",
    "thoughtfulness": "caring-call-brightens-the-day",
    "time-life-flowing-silently": "cherish-today-with-loved-ones",
}

LABEL_ONLY_RE = re.compile(
    r"^(ibrət|ibret|moral|мораль|үлгү|сабак)\s*:\s*$", re.I
)
AZ_LOWER_MAP = {
    "İ": "i",
    "I": "ı",
    "Ş": "ş",
    "Ğ": "ğ",
    "Ü": "ü",
    "Ö": "ö",
    "Ç": "ç",
    "Ə": "ə",
}
SKIP_DIR_NAMES = {"originals", "audio", "discovery-articles", "discoveries"}


@dataclass
class Parsed:
    stem: str
    title: str
    body: list[str]
    moral: str
    source: str | None
    docx: Path
    image: Path | None = None


@dataclass
class LangReport:
    lang: str
    updated: list[dict] = field(default_factory=list)
    unmatched: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    @property
    def text_count(self) -> int:
        return sum(1 for u in self.updated if u.get("text_changed"))

    @property
    def image_count(self) -> int:
        return sum(1 for u in self.updated if u.get("image_changed"))


def normalize_stem(raw: str) -> str:
    s = raw.strip()
    low = s.lower()
    for pref in ("es_", "bs_"):
        if low.startswith(pref):
            s = s[len(pref) :]
            break
    s = s.replace("\u2019", "'").replace("\u2018", "'").replace("'", "")
    if s.lower().endswith("_ky"):
        s = s[:-3]
    return s.lower()


def published_stems(lang: str) -> set[str]:
    data = load_stories_data(lang)
    out: set[str] = set()
    for cat in data.get("categories") or []:
        for story in cat.get("stories") or []:
            if story.get("stem"):
                out.add(str(story["stem"]))
    # Also accept stems present only in category HTML (edge case).
    cat_dir = ROOT / lang / "categories"
    if cat_dir.is_dir():
        for path in cat_dir.glob("*.html"):
            text = path.read_text(encoding="utf-8")
            out.update(re.findall(r'data-stem="([a-z0-9]+(?:-[a-z0-9]+)*)"', text))
            out.update(re.findall(r'<article class="story[^"]*" id="([a-z0-9]+(?:-[a-z0-9]+)*)"', text))
    return out


def resolve_stem(raw: str, published: set[str], *, prefer_alias: bool = False) -> str | None:
    n = normalize_stem(raw)
    if prefer_alias and n in EN_ETIBAR_ALIAS and EN_ETIBAR_ALIAS[n] in published:
        return EN_ETIBAR_ALIAS[n]
    if n in published:
        # Prefer Etibar long stem over short "humanity" when alias exists.
        if n in EN_ETIBAR_ALIAS and EN_ETIBAR_ALIAS[n] in published:
            return EN_ETIBAR_ALIAS[n]
        return n
    if n in EN_ETIBAR_ALIAS and EN_ETIBAR_ALIAS[n] in published:
        return EN_ETIBAR_ALIAS[n]
    if "nail" in n and "lasting" in n and "nails-lasting-lesson" in published:
        return "nails-lasting-lesson"
    return None


def _atomic_write_text(path: Path, text: str) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(text, encoding="utf-8", newline="\n")
    tmp.replace(path)


def load_stories_data(lang: str) -> dict:
    path = ROOT / lang / "assets" / "stories-data.js"
    text = path.read_text(encoding="utf-8")
    raw = text[text.index("=") + 1 :].strip()
    if raw.endswith(";"):
        raw = raw[:-1]
    return json.loads(raw)


def write_stories_data(lang: str, data: dict) -> None:
    path = ROOT / lang / "assets" / "stories-data.js"
    text = path.read_text(encoding="utf-8")
    m = re.match(r"(window\.__BIRINCI_STORIES__\s*=\s*)", text)
    prefix = m.group(1) if m else "window.__BIRINCI_STORIES__ = "
    suffix = ";" if text.rstrip().endswith(";") else ""
    _atomic_write_text(
        path,
        prefix
        + json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        + suffix
        + "\n",
    )


def load_search_index(lang: str) -> tuple[str, list, str]:
    path = ROOT / lang / "assets" / "search-index.js"
    text = path.read_text(encoding="utf-8")
    m = re.match(r"(window\.__BIRINCI_SEARCH__\s*=\s*)", text)
    if not m:
        raise ValueError(f"bad search-index: {path}")
    prefix = m.group(1)
    raw = text[m.end() :].strip()
    if raw.endswith(";"):
        raw = raw[:-1]
        suffix = ";"
    else:
        suffix = ""
    return prefix, json.loads(raw), suffix


def write_search_index(lang: str, prefix: str, entries: list, suffix: str) -> None:
    path = ROOT / lang / "assets" / "search-index.js"
    _atomic_write_text(
        path,
        prefix
        + json.dumps(entries, ensure_ascii=False, separators=(",", ":"))
        + suffix
        + "\n",
    )


def read_docx_paragraphs(path: Path) -> list[str]:
    return [
        (p.text or "").strip()
        for p in Document(str(path)).paragraphs
        if (p.text or "").strip()
    ]


def sentence_case_title(title: str, lang: str) -> str:
    title = " ".join(title.split()).strip()
    letters = [c for c in title if c.isalpha()]
    if not letters or not all(c.isupper() for c in letters):
        return title

    if lang == "az":
        def low(c: str) -> str:
            if c in AZ_LOWER_MAP:
                return AZ_LOWER_MAP[c]
            return c.lower()

        # Keep first character as-is (already upper), lower the rest with AZ map.
        return title[0] + "".join(low(c) for c in title[1:])

    # RU/KY/EN: Unicode lower for rest; restore English pronoun I.
    out = title[0] + title[1:].lower()
    if lang == "en":
        out = re.sub(r"\bi\b", "I", out)
    return out


def normalize_author(source: str | None, lang: str, folder_hint: str) -> str | None:
    if not source:
        # If folder is author folder, still set credit.
        low = folder_hint.lower()
        if "etibar" in low:
            return SITE_AUTHOR["etibar"][lang]
        if "bakhtiyar" in low or "bəxtiyar" in low or "baxtiyar" in low:
            return SITE_AUTHOR["bakhtiyar"][lang]
        return None
    s = source.strip().rstrip(".")
    low = s.casefold()
    if any(h in low for h in ETIBAR_NAME_HINTS) or "etibar" in folder_hint.lower():
        return SITE_AUTHOR["etibar"][lang]
    if any(h in low for h in BAKHTIYAR_NAME_HINTS) or "bakhtiyar" in folder_hint.lower():
        return SITE_AUTHOR["bakhtiyar"][lang]
    return s


def parse_story_docx(path: Path, stem: str, lang: str, folder_hint: str) -> Parsed:
    paras = read_docx_paragraphs(path)
    if len(paras) < 2:
        raise ValueError(f"too few paragraphs ({len(paras)})")

    title = sentence_case_title(paras[0], lang)
    rest = paras[1:]
    source_raw: str | None = None

    if rest and (is_internet_source(rest[-1]) or is_author_credit(rest[-1])):
        trailing = rest[-1].strip()
        rest = rest[:-1]
        if is_author_credit(trailing):
            source_raw = trailing[:-1].strip() if trailing.endswith(".") else trailing

    moral = ""
    if rest:
        last = rest[-1]
        if MORAL_RE.match(last) and not LABEL_ONLY_RE.match(last):
            moral = " ".join(last.split()).strip()
            rest = rest[:-1]
        elif LABEL_ONLY_RE.match(last):
            # dangling empty label
            rest = rest[:-1]
        elif len(rest) >= 2 and LABEL_ONLY_RE.match(rest[-2]):
            label = rest[-2].split(":", 1)[0].strip()
            moral = f"{label}: {' '.join(rest[-1].split()).strip()}"
            rest = rest[:-2]

    body = [" ".join(p.split()).strip() for p in rest if p.strip()]
    if not title:
        raise ValueError("empty title")
    if not body:
        raise ValueError("empty body")

    source = normalize_author(source_raw, lang, folder_hint)
    return Parsed(
        stem=stem,
        title=title,
        body=body,
        moral=moral,
        source=source,
        docx=path,
    )


def find_source_image(docx: Path, stem: str, published: set[str]) -> Path | None:
    """Prefer webp beside the docx (same folder tree), else png."""
    search_roots = [docx.parent]
    # Also look in Illustrations / illustrations siblings
    for name in ("Illustrations", "illustrations", "Images", "images"):
        p = docx.parent / name
        if p.is_dir():
            search_roots.append(p)
        p2 = docx.parent.parent / name
        if p2.is_dir():
            search_roots.append(p2)

    webps: list[Path] = []
    pngs: list[Path] = []
    for root in search_roots:
        # Don't search into published illustrations by walking up incorrectly;
        # only search under author folder / docx parent.
        if root.name.lower() == "illustrations" and root.parent.name.lower() == "wisdom-stories":
            continue
        for p in root.rglob("*"):
            if not p.is_file():
                continue
            if any(part.lower() in SKIP_DIR_NAMES for part in p.parts):
                continue
            if p.suffix.lower() == ".webp":
                webps.append(p)
            elif p.suffix.lower() == ".png":
                pngs.append(p)

    def matches(p: Path) -> bool:
        resolved = resolve_stem(p.stem, published, prefer_alias=True)
        return resolved == stem or normalize_stem(p.stem) == stem

    for pool in (webps, pngs):
        for p in pool:
            if matches(p):
                return p
    return None


def discover_sources(lang: str, published: set[str]) -> tuple[dict[str, Parsed], list[str]]:
    """Return stem->Parsed (author-folder preferred) and unmatched relative paths."""
    ws = ROOT / lang / "wisdom-stories"
    unmatched: list[str] = []
    by_stem: dict[str, Parsed] = {}

    # Author / story subfolders first (higher priority).
    subdirs = [
        p
        for p in ws.iterdir()
        if p.is_dir() and p.name.lower() not in {"audio", "illustrations", "originals"}
    ]
    # Process author folders; also any other non-standard folders with docx.
    docx_files: list[Path] = []
    for d in subdirs:
        docx_files.extend(sorted(d.rglob("*.docx")))

    def ingest(path: Path, *, prefer_alias: bool, priority: int) -> None:
        if path.name.startswith("~$"):
            return
        if any(part.lower() == "originals" for part in path.parts):
            return
        folder_hint = path.parent.name
        # Prefer alias when under Etibar folder.
        prefer = prefer_alias or ("etibar" in str(path).lower())
        stem = resolve_stem(path.stem, published, prefer_alias=prefer)
        if not stem:
            unmatched.append(str(path.relative_to(ws)))
            return
        try:
            parsed = parse_story_docx(path, stem, lang, folder_hint)
        except Exception as exc:  # noqa: BLE001
            unmatched.append(f"{path.relative_to(ws)} (parse error: {exc})")
            return
        parsed.image = find_source_image(path, stem, published)
        existing = by_stem.get(stem)
        if existing is None or priority > getattr(existing, "_priority", 0):
            parsed._priority = priority  # type: ignore[attr-defined]
            by_stem[stem] = parsed

    # Author / story subfolders only (Etibar, Bakhtiyar, …). Flat root corpus
    # docx are left alone unless they live in a story folder with illustrations.
    for path in docx_files:
        ingest(path, prefer_alias=True, priority=2)

    return by_stem, unmatched


def story_paragraphs_for_data(parsed: Parsed) -> list[str]:
    paras = list(parsed.body)
    if parsed.moral:
        paras.append(parsed.moral)
    if parsed.source:
        paras.append(parsed.source)
    return paras


def published_content(story: dict) -> tuple[str, list[str], str, str | None]:
    """Return title, body, moral, source from published story dict."""
    title = str(story.get("title") or "")
    paras = list(story.get("paragraphs") or [])
    source = None
    moral = ""
    if paras:
        last = paras[-1]
        if is_author_credit(last) or is_internet_source(last) or last in {
            SITE_AUTHOR["etibar"]["az"],
            SITE_AUTHOR["etibar"]["en"],
            SITE_AUTHOR["bakhtiyar"]["az"],
            SITE_AUTHOR["bakhtiyar"]["en"],
            SITE_AUTHOR["bakhtiyar"]["ru"],
            SITE_AUTHOR["bakhtiyar"]["ky"],
        }:
            source = last
            paras = paras[:-1]
    if paras and MORAL_RE.match(paras[-1] or ""):
        moral = paras[-1]
        paras = paras[:-1]
    return title, paras, moral, source


def story_body_html(body: list[str], moral: str, source: str) -> str:
    parts = [f"<p>{html_lib.escape(p)}</p>" for p in body]
    if moral:
        parts.append(f'<p class="story__moral">{html_lib.escape(moral)}</p>')
    parts.append(f'<p class="story__source">{html_lib.escape(source)}</p>')
    return "".join(parts)


def update_category_html_flexible(
    lang: str,
    slug: str,
    stem: str,
    title: str,
    body: list[str],
    moral: str,
    old_title: str | None,
    source: str,
) -> None:
    path = ROOT / lang / "categories" / f"{slug}.html"
    text = path.read_text(encoding="utf-8")
    blurb = body[0] if body else title
    body_html = story_body_html(body, moral, source)

    if old_title and old_title != title:
        text = text.replace(old_title, title)

    # Replace story text block
    exact = re.compile(
        rf'(<div class="story__text card-text" id="text-{re.escape(stem)}">)([\s\S]*?)(</div>)'
    )

    def _inject(m: re.Match[str]) -> str:
        return f"{m.group(1)}\n          {body_html}\n        {m.group(3)}"

    text2, n = exact.subn(_inject, text, count=1)
    if n != 1:
        art = re.search(
            rf'<article class="story news-card[^"]*" id="{re.escape(stem)}"[^>]*>[\s\S]*?</article>',
            text,
        )
        if not art:
            raise ValueError(f"story article not found for {stem}")
        article = art.group(0)
        article2, n2 = re.subn(
            r'(<div class="story__text card-text" id="text-[^"]+">)([\s\S]*?)(</div>)',
            _inject,
            article,
            count=1,
        )
        if n2 != 1:
            raise ValueError(f"story text block not found for {stem}")
        text = text[: art.start()] + article2 + text[art.end() :]
    else:
        text = text2

    title_attr = html_lib.escape(title, quote=True)
    title_html = html_lib.escape(title)
    blurb_attr = html_lib.escape(blurb, quote=True)
    blurb_html = html_lib.escape(blurb)

    text = re.sub(
        rf'(data-stem="{re.escape(stem)}" data-title=")([^"]*)(")',
        lambda m: f"{m.group(1)}{title_attr}{m.group(3)}",
        text,
    )
    text = re.sub(
        rf'(id="{re.escape(stem)}"[^>]*data-title=")([^"]*)(")',
        lambda m: f"{m.group(1)}{title_attr}{m.group(3)}",
        text,
    )
    text = re.sub(
        rf'(<li data-stem="{re.escape(stem)}"[^>]*>\s*<a href="#{re.escape(stem)}">)([^<]*)(</a>)',
        lambda m: f"{m.group(1)}{title_html}{m.group(3)}",
        text,
    )
    text = re.sub(
        rf'(href="#{re.escape(stem)}"[^>]*data-blurb=")([^"]*)(")',
        lambda m: f"{m.group(1)}{blurb_attr}{m.group(3)}",
        text,
    )
    text, _ = re.subn(
        rf'(<a class="cat-card page-card" href="#{re.escape(stem)}"[\s\S]*?<h2 class="card-title">)([^<]*)(</h2>\s*<div class="card-desc">)([^<]*)(</div>)',
        lambda m: f"{m.group(1)}{title_html}{m.group(3)}{blurb_html}{m.group(5)}",
        text,
        count=1,
    )
    text, n2 = re.subn(
        rf'(<article class="story news-card[^"]*" id="{re.escape(stem)}"[\s\S]*?<h2 class="card-title story__title">)([^<]*)(</h2>)',
        lambda m: f"{m.group(1)}{title_html}{m.group(3)}",
        text,
        count=1,
    )
    if n2 != 1:
        raise ValueError(f"article title not found for {stem}")

    _atomic_write_text(path, text)


def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ensure_webp(src: Path, dest: Path) -> tuple[bool, tuple[int, int]]:
    """Write src into dest as webp. Returns (bytes_changed, size)."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    if src.suffix.lower() == ".webp":
        data = src.read_bytes()
        with Image.open(src) as im:
            size = im.size
        if dest.exists() and file_sha(dest) == hashlib.sha256(data).hexdigest():
            return False, size
        dest.write_bytes(data)
        return True, size

    # Convert png (or other) with Pillow quality 92 method 6.
    with Image.open(src) as im:
        im = im.convert("RGB") if im.mode not in ("RGB", "RGBA") else im
        size = im.size
        # Compare to existing by re-encoding to temp-equivalent check: always
        # write then see if identical to previous bytes.
        from io import BytesIO

        buf = BytesIO()
        save_kwargs = {"quality": 92, "method": 6}
        if im.mode == "RGBA":
            im.save(buf, format="WEBP", **save_kwargs)
        else:
            im.convert("RGB").save(buf, format="WEBP", **save_kwargs)
        data = buf.getvalue()
    if dest.exists() and file_sha(dest) == hashlib.sha256(data).hexdigest():
        return False, size
    dest.write_bytes(data)
    return True, size


def bump_img_stamp_and_size(
    lang: str, slug: str, stem: str, stamp: str, size: tuple[int, int]
) -> None:
    path = ROOT / lang / "categories" / f"{slug}.html"
    text = path.read_text(encoding="utf-8")
    w, h = size
    # Update width/height and ?v= on illustration img for this stem only.
    pattern = re.compile(
        rf'(<img[^>]+?(?:data-src|src)="[^"]*?/illustrations/{re.escape(stem)}\.webp)(?:\?v=[^"]*)?("[^>]*?>)'
    )

    def repl(m: re.Match[str]) -> str:
        tag_rest = m.group(2)
        # Rebuild approaching from the full match
        full = m.group(0)
        full = re.sub(
            rf'(/illustrations/{re.escape(stem)}\.webp)(?:\?v=[^"]*)?',
            rf"\1?v={stamp}",
            full,
            count=1,
        )
        if re.search(r'\bwidth="\d+"', full):
            full = re.sub(r'\bwidth="\d+"', f'width="{w}"', full, count=1)
        if re.search(r'\bheight="\d+"', full):
            full = re.sub(r'\bheight="\d+"', f'height="{h}"', full, count=1)
        return full

    text2, n = pattern.subn(repl, text)
    if n == 0:
        # Try without requiring illustrations path prefix quirks
        pattern2 = re.compile(
            rf'(src|data-src)="([^"]*?{re.escape(stem)}\.webp)(?:\?v=[^"]*)?"'
        )
        text2, n = pattern2.subn(
            lambda m: f'{m.group(1)}="{m.group(2)}?v={stamp}"', text
        )
        if n:
            text2 = re.sub(
                rf'(id="figure-{re.escape(stem)}"[\s\S]*?<img[^>]*?)\bwidth="\d+"',
                rf'\1width="{w}"',
                text2,
                count=1,
            )
            text2 = re.sub(
                rf'(id="figure-{re.escape(stem)}"[\s\S]*?<img[^>]*?)\bheight="\d+"',
                rf'\1height="{h}"',
                text2,
                count=1,
            )
    _atomic_write_text(path, text2)


def update_size_map(js_path: Path, map_name: str, stem: str, size: tuple[int, int]) -> None:
    text = js_path.read_text(encoding="utf-8")
    # Find the map block
    start = text.find(f"const {map_name} = {{")
    if start < 0:
        start = text.find(f"const {map_name}={{")
    if start < 0:
        raise ValueError(f"{map_name} not found in {js_path}")
    brace = text.find("{", start)
    depth = 0
    end = None
    for i, ch in enumerate(text[brace:], brace):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i
                break
    if end is None:
        raise ValueError(f"unclosed {map_name}")
    block = text[brace : end + 1]
    entry = f'"{stem}": [{size[0]}, {size[1]}]'
    entry_re = re.compile(rf'"{re.escape(stem)}"\s*:\s*\[\s*\d+\s*,\s*\d+\s*\]')
    if entry_re.search(block):
        new_block = entry_re.sub(entry, block, count=1)
    else:
        # Insert in alphabetical-ish place: before closing brace, after last entry comma.
        inner = block[1:-1].rstrip()
        if inner and not inner.endswith(","):
            inner += ","
        inner += f"\n      {entry},"
        new_block = "{" + inner + "\n    }"
    text = text[:brace] + new_block + text[end + 1 :]
    _atomic_write_text(js_path, text)


def patch_chrome_restore_stamps() -> None:
    path = ROOT / "tools" / "chrome_restore.py"
    text = path.read_text(encoding="utf-8")
    needed = [
        '"20260930azsrc"',
        '"20260930ensrc"',
        '"20260930rusrc"',
        '"20260930kysrc"',
    ]
    # Insert after 20260930enes if present
    for stamp in needed:
        if stamp in text:
            continue
        # Add after 20260930enes line
        if '"20260930enes"' in text:
            text = text.replace(
                '"20260930enes",',
                '"20260930enes",\n                ' + stamp + ",",
                1,
            )
        else:
            text = text.replace(
                '"20260930azes",',
                '"20260930azes",\n                ' + stamp + ",",
                1,
            )
    _atomic_write_text(path, text)


def sync_lang(lang: str) -> LangReport:
    report = LangReport(lang=lang)
    published = published_stems(lang)
    sources, unmatched = discover_sources(lang, published)
    # Filter unmatched: only report author-folder unmatched (not every root miss).
    # discover already lists unmatched author+root fails; keep those that came from subfolders.
    report.unmatched = [
        u
        for u in unmatched
        if (not u.endswith(".docx") or "/" in u.replace("\\", "/") or "\\" in u)
        or "(parse error" in u
    ]
    # Also keep unmatched that are clearly from subfolders
    report.unmatched = sorted(
        {
            u
            for u in unmatched
            if any(
                x in u.replace("\\", "/")
                for x in (
                    "Etibar",
                    "Bakhtiyar",
                    "Siracsoy",
                    "Sirajov",
                )
            )
            or "(parse error" in u
        }
    )

    data = load_stories_data(lang)
    search_prefix, search_entries, search_suffix = load_search_index(lang)
    stamp = STAMPS[lang]
    any_image_change = False
    size_updates: dict[str, tuple[int, int]] = {}

    # Index stories
    story_index: dict[str, dict] = {}
    for cat in data.get("categories") or []:
        for story in cat.get("stories") or []:
            story_index[str(story["stem"])] = story

    for stem, parsed in sorted(sources.items()):
        # Only update stems that exist in stories-data (true published catalog).
        if stem not in story_index:
            # Present in HTML only? still try find_story_meta
            slug, old_title = find_story_meta(lang, stem)
            if not slug:
                report.unmatched.append(str(parsed.docx.relative_to(ROOT / lang / "wisdom-stories")))
                continue
        else:
            slug, old_title = find_story_meta(lang, stem)

        story = story_index.get(stem)
        text_changed = False
        image_changed = False
        new_size = None

        if story is not None:
            pub_title, pub_body, pub_moral, pub_source = published_content(story)
            new_source = parsed.source or pub_source
            if (
                parsed.title != pub_title
                or parsed.body != pub_body
                or (parsed.moral or "") != (pub_moral or "")
                or (new_source or "") != (pub_source or "")
            ):
                text_changed = True
                # Patch story dict
                story["title"] = parsed.title
                story["paragraphs"] = story_paragraphs_for_data(
                    Parsed(
                        stem=stem,
                        title=parsed.title,
                        body=parsed.body,
                        moral=parsed.moral,
                        source=new_source,
                        docx=parsed.docx,
                    )
                )
                # Search index
                cat_title = None
                for cat in data.get("categories") or []:
                    if any(s.get("stem") == stem for s in cat.get("stories") or []):
                        cat_title = cat.get("title")
                        break
                hay = " ".join(
                    p
                    for p in [
                        parsed.title,
                        cat_title or "",
                        *parsed.body,
                        parsed.moral,
                        new_source or "",
                    ]
                    if p
                ).lower()
                for entry in search_entries:
                    if entry.get("stem") == stem:
                        entry["title"] = parsed.title
                        entry["hay"] = hay
                        if cat_title:
                            entry["category"] = cat_title
                        break
                if not new_source:
                    raise ValueError(f"{stem}: missing author/source line")
                update_category_html_flexible(
                    lang,
                    slug,
                    stem,
                    parsed.title,
                    parsed.body,
                    parsed.moral,
                    old_title or pub_title,
                    source=new_source,
                )
                update_sitemap(lang, stem, slug, parsed.title)

        # Images
        if parsed.image is not None:
            dest = ROOT / lang / "wisdom-stories" / "illustrations" / f"{stem}.webp"
            # Do not copy published onto itself
            try:
                if dest.resolve() == parsed.image.resolve():
                    pass
                else:
                    changed, size = ensure_webp(parsed.image, dest)
                    new_size = size
                    if changed:
                        image_changed = True
                        any_image_change = True
                        size_updates[stem] = size
                        if slug:
                            bump_img_stamp_and_size(lang, slug, stem, stamp, size)
                    elif size and dest.exists():
                        # Even if bytes same, ensure width/height in HTML match if needed
                        new_size = size
            except Exception as exc:  # noqa: BLE001
                report.errors.append(f"{stem} image: {exc}")

        if text_changed or image_changed:
            report.updated.append(
                {
                    "stem": stem,
                    "text_changed": text_changed,
                    "image_changed": image_changed,
                    "size": new_size,
                    "docx": str(parsed.docx.relative_to(ROOT)),
                    "image": str(parsed.image.relative_to(ROOT)) if parsed.image else None,
                }
            )
        else:
            report.updated.append(
                {
                    "stem": stem,
                    "text_changed": False,
                    "image_changed": False,
                    "size": new_size,
                    "docx": str(parsed.docx.relative_to(ROOT)),
                    "image": str(parsed.image.relative_to(ROOT)) if parsed.image else None,
                }
            )

    # Write data files if any text changed
    if any(u["text_changed"] for u in report.updated):
        write_stories_data(lang, data)
        write_search_index(lang, search_prefix, search_entries, search_suffix)

    # Size maps for changed images
    if size_updates:
        site_js = ROOT / "assets" / "site.js"
        compare_js = ROOT / "assets" / "story-compare.js"
        map_name = {
            "az": "AZ_ILLUST_SIZE",
            "ky": "KY_ILLUST_SIZE",
            "en": None,
            "ru": None,
        }[lang]
        # EN/RU may not have dedicated maps; check if AZ/KY only.
        # Also update AZ map for az, KY for ky. For en/ru, still update img width/height in HTML (done).
        if map_name:
            for stem, size in size_updates.items():
                update_size_map(site_js, map_name, stem, size)
                if (compare_js.read_text(encoding="utf-8")).find(f"const {map_name}") >= 0:
                    update_size_map(compare_js, map_name, stem, size)

    if any_image_change:
        patch_chrome_restore_stamps()

    return report


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--lang", required=True, choices=["az", "en", "ru", "ky"])
    args = ap.parse_args()
    report = sync_lang(args.lang)
    print(f"LANG={report.lang}")
    print(f"text_changed={report.text_count} image_changed={report.image_count}")
    print(f"stems_processed={len(report.updated)}")
    for u in report.updated:
        print(
            f"  {u['stem']}: text={u['text_changed']} image={u['image_changed']}"
            + (f" size={u['size']}" if u.get("size") else "")
        )
    print(f"unmatched={len(report.unmatched)}")
    for u in report.unmatched:
        print(f"  UNMATCHED {u}")
    if report.errors:
        print(f"errors={len(report.errors)}")
        for e in report.errors:
            print(f"  ERROR {e}")


if __name__ == "__main__":
    main()
