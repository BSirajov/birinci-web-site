#!/usr/bin/env python3
"""Read-only German Wisdom integration audit (stdlib only).

Run after generation: python -X utf8 tools/test_german_wisdom.py
Before generation: add --sources-only. --json prints the report to stdout.
Nothing is written, imported from the build pipeline, or fetched over the network.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from html.parser import HTMLParser
import json
import hashlib
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET
from zipfile import ZipFile

EXPECTED_AZ = 261
EXPECTED_DE = 256
# Etibar verse published in AZ but omitted from the German site.
ETIBAR_POETRY_STEMS = {
    "time-has-passed",
    "flowers",
    "reflections",
    "my-lifes-journey",
    "pandemic-and-quarantine",
}
SITE_HOSTS = {"birinci.cloud", "www.birinci.cloud"}
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
VOID = set("area base br col embed hr img input link meta param source track wbr".split())


def canonical_stem(stem: str) -> str:
    """bs_/es_ are source aliases; nail’s becomes nails, not nail-s."""
    if stem.lower().startswith(("bs_", "es_")):
        stem = stem[3:]
    return stem.replace("’", "").replace("‘", "").replace("'", "").lower()


def skip_wisdom_part(path: Path) -> bool:
    return any(part.lower() in {"backup", "_backups", "_reviews"} for part in path.parts)


def docx_paragraphs(path: Path) -> list[str]:
    with ZipFile(path) as package:
        body = ET.fromstring(package.read("word/document.xml")).find(W + "body")
        if body is None:
            raise ValueError("missing document body")
        result = []
        for paragraph in body.iter(W + "p"):
            parts = []
            for node in paragraph.iter():
                if node.tag == W + "t":
                    parts.append(node.text or "")
                elif node.tag == W + "tab":
                    parts.append("\t")
                elif node.tag in (W + "br", W + "cr"):
                    parts.append("\n")
            text = "".join(parts).strip()
            if text:
                result.append(text)
        # This source collection has no header/footer story text. Detect any new
        # visible text there rather than silently dropping it from the audit.
        for name in package.namelist():
            if re.fullmatch(r"word/(?:header|footer)\d+\.xml", name):
                if any((t.text or "").strip() for t in ET.fromstring(package.read(name)).iter(W + "t")):
                    raise ValueError(f"visible {name} text needs an explicit website mapping")
        return result


def catalog(path: Path) -> dict:
    text = path.read_text(encoding="utf-8-sig")
    match = re.match(r"\s*window\.__BIRINCI_STORIES__\s*=\s*", text)
    if not match:
        raise ValueError("expected window.__BIRINCI_STORIES__ JSON assignment")
    data, end = json.JSONDecoder().raw_decode(text[match.end():])
    if text[match.end() + end:].strip() not in ("", ";"):
        raise ValueError("unexpected executable content after catalog JSON")
    return data


class Page(HTMLParser):
    """Collect visible text without collapsing significant DOCX whitespace."""
    def __init__(self, text: str):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.captures = []
        self.paragraphs = []
        self.headings = []
        self.titles = []
        self.langs = []
        self.canonicals = []
        self.ids = Counter()
        self.anchors = set()
        self.references = []
        self.images = []
        self.image_attributes = []
        self.story_markers = set()
        self.styles = []
        self.base = False
        self.feed(text)
        self.close()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html":
            self.langs.append(a.get("lang", ""))
        if a.get("id"):
            self.ids[a["id"]] += 1
            self.anchors.add(a["id"])
            self.story_markers.add(a["id"])
        if tag == "a" and a.get("name"):
            self.anchors.add(a["name"])
        if a.get("data-stem"):
            self.story_markers.add(a["data-stem"])
        if tag == "link" and "canonical" in a.get("rel", "").split():
            self.canonicals.append(a.get("href", ""))
        if tag == "base":
            self.base = True
        for key in ("href", "src", "data-src", "poster", "action", "data-image"):
            if a.get(key):
                self.references.append((tag + "/" + key, a[key]))
        for key in ("srcset", "data-srcset"):
            if a.get(key) and not a[key].lstrip().startswith("data:"):
                self.references.extend((tag + "/" + key, part.strip().split()[0])
                                       for part in a[key].split(",") if part.strip())
        if tag == "img":
            self.images.extend(a[k] for k in ("src", "data-src") if a.get(k))
            self.image_attributes.append(a)
        if a.get("style"):
            self.styles.append(a["style"])
        inside_story = any("story__text" in item[1].get("class", "").split() for item in self.stack)
        kind = "paragraphs" if tag == "p" and inside_story else {"h1": "headings", "title": "titles", "style": "styles"}.get(tag)
        if kind:
            self.captures.append([tag, len(self.stack), kind, []])
        if tag == "br":
            self.handle_data("\n")
        if tag not in VOID:
            self.stack.append((tag, a))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        positions = [i for i, item in enumerate(self.stack) if item[0] == tag]
        if not positions:
            return
        depth = positions[-1]
        for capture in list(self.captures):
            if capture[1] >= depth:
                getattr(self, capture[2]).append("".join(capture[3]).strip())
                self.captures.remove(capture)
        del self.stack[depth:]

    def handle_data(self, data):
        for capture in self.captures:
            capture[3].append(data)


class Audit:
    def __init__(self, root: Path):
        self.root = root.resolve()
        self.errors = []
        self.pages = {}
        self.css_seen = set()
        self.counts = {}
        self.dimensions = {}
        self.story_stems = set()

    def label(self, path: Path) -> str:
        return path.relative_to(self.root).as_posix()

    def fail(self, message: str):
        self.errors.append(message)

    def load_page(self, path: Path):
        if path not in self.pages:
            try:
                self.pages[path] = Page(path.read_text(encoding="utf-8-sig"))
            except (OSError, UnicodeError, ValueError) as exc:
                self.fail(f"{self.label(path)}: cannot read HTML: {exc}")
                self.pages[path] = None
        return self.pages[path]

    def target(self, origin: Path, url: str):
        parsed = urlsplit(url.strip())
        if parsed.scheme or parsed.netloc:
            if parsed.scheme not in ("http", "https", "") or parsed.hostname not in SITE_HOSTS:
                return None
            path = self.root / unquote(parsed.path).lstrip("/")
        else:
            raw = unquote(parsed.path)
            path = (self.root / raw.lstrip("/")) if raw.startswith("/") else (origin.parent / raw if raw else origin)
        path = path.resolve()
        if not path.is_relative_to(self.root):
            raise ValueError("local reference escapes repository")
        if path.is_dir():
            path /= "index.html"
        return path, unquote(parsed.fragment)

    def reference(self, origin: Path, kind: str, url: str):
        try:
            target = self.target(origin, url)
        except ValueError as exc:
            self.fail(f"{self.label(origin)}: invalid {kind} {url!r}: {exc}")
            return
        if target is None:
            return
        path, fragment = target
        if not path.is_file():
            self.fail(f"{self.label(origin)}: broken {kind} {url!r} -> {self.label(path)}")
            return
        if fragment and path.suffix.lower() == ".html":
            anchor = fragment.split(":~:text=", 1)[0]
            page = self.load_page(path)
            if anchor and page is not None and anchor not in page.anchors:
                self.fail(f"{self.label(origin)}: missing anchor {url!r}")
        if path.suffix.lower() == ".css":
            self.css(path)

    def css(self, path: Path):
        if path in self.css_seen:
            return
        self.css_seen.add(path)
        try:
            self.css_text(path, path.read_text(encoding="utf-8-sig"))
        except (OSError, UnicodeError) as exc:
            self.fail(f"{self.label(path)}: cannot read CSS: {exc}")

    def css_text(self, origin: Path, text: str):
        text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
        for match in re.finditer(r"url\(\s*(['\"]?)(.*?)\1\s*\)|@import\s+(['\"])(.*?)\3", text, re.S):
            self.reference(origin, "CSS asset", (match.group(2) if match.group(2) is not None else match.group(4)).strip())

    def exact(self, label: str, actual, expected):
        if actual != expected:
            if isinstance(actual, list) and isinstance(expected, list):
                index = next((i for i, pair in enumerate(zip(actual, expected)) if pair[0] != pair[1]), min(len(actual), len(expected)))
                self.fail(f"{label}: mismatch at paragraph/item {index}; expected {expected[index:index+1]!r}, got {actual[index:index+1]!r}; counts {len(expected)}/{len(actual)}")
            else:
                self.fail(f"{label}: expected {expected!r}, got {actual!r}")

    def inventory(self, paths, kind):
        result = defaultdict(list)
        for path in sorted(paths):
            result[canonical_stem(path.stem)].append(path)
        self.counts[kind] = sum(map(len, result.values()))
        if self.counts[kind] != EXPECTED_DE:
            self.fail(f"{kind}: expected {EXPECTED_DE}, found {self.counts[kind]}")
        for stem, matches in result.items():
            if len(matches) != 1:
                self.fail(f"{kind}: duplicate canonical {stem!r}: {[self.label(p) for p in matches]}")
        return {stem: matches[0] for stem, matches in result.items()}

    def linked_stories(self, path: Path, page: Page, expected: set[str]):
        found = set(page.story_markers) & self.story_stems
        for _, url in page.references:
            try:
                target = self.target(path, url)
            except ValueError:
                continue
            if target and target[0].parent == self.root / "de/stories" and target[0].suffix == ".html":
                found.add(target[0].stem)
        self.exact(self.label(path) + " story membership", sorted(found), sorted(expected))

    def webp_dimensions(self, path: Path):
        if path in self.dimensions:
            return self.dimensions[path]
        try:
            raw = path.read_bytes()
            if raw[:4] != b"RIFF" or raw[8:12] != b"WEBP":
                raise ValueError("not a WebP RIFF file")
            offset = 12
            size = None
            while offset + 8 <= len(raw):
                kind = raw[offset:offset + 4]
                length = int.from_bytes(raw[offset + 4:offset + 8], "little")
                data = raw[offset + 8:offset + 8 + length]
                if kind == b"VP8X" and len(data) >= 10:
                    size = (1 + int.from_bytes(data[4:7], "little"), 1 + int.from_bytes(data[7:10], "little"))
                    break
                if kind == b"VP8L" and len(data) >= 5 and data[0] == 47:
                    bits = int.from_bytes(data[1:5], "little")
                    size = (1 + (bits & 0x3FFF), 1 + ((bits >> 14) & 0x3FFF))
                    break
                if kind == b"VP8 " and len(data) >= 10 and data[3:6] == b"\x9d\x01\x2a":
                    size = (int.from_bytes(data[6:8], "little") & 0x3FFF, int.from_bytes(data[8:10], "little") & 0x3FFF)
                    break
                offset += 8 + length + length % 2
            if not size or not all(size):
                raise ValueError("missing valid dimension chunk")
        except (OSError, ValueError) as exc:
            self.fail(f"{self.label(path)}: WebP dimensions: {exc}")
            size = None
        self.dimensions[path] = size
        return size

    def preservation(self, docs, images):
        path = self.root / "docs/reviews/de-preservation-baseline-20261020.json"
        try:
            baseline = json.loads(path.read_text(encoding="utf-8-sig"))
            expected = {self.label(p) for p in [*docs.values(), *images.values()]}
            recorded = {key.replace("\\", "/"): value for key, value in baseline.items()}
            self.exact("preservation source/image coverage", sorted(expected - recorded.keys()), [])
            checked = 0
            for name, digest in recorded.items():
                target = (self.root / name).resolve()
                if not target.is_relative_to(self.root):
                    self.fail(f"preservation baseline path escapes root: {name}")
                    continue
                if not target.is_file():
                    self.fail(f"preservation baseline file missing: {name}")
                    continue
                actual = hashlib.sha256(target.read_bytes()).hexdigest()
                self.exact("preservation SHA256 " + name, actual, digest)
                checked += 1
            self.counts["preservation_hashes_checked"] = checked
        except (OSError, ValueError, TypeError, AttributeError) as exc:
            self.fail(f"preservation baseline: {exc}")

    def run(self, sources_only: bool):
        from build_german_wisdom import (
            ETIBAR_DE_SENTENCE_TITLES,
            normalize_de_paragraphs,
            sentence_case_de,
        )

        ws = self.root / "de/wisdom-stories"
        docs = self.inventory(
            (
                p
                for p in ws.rglob("*.docx")
                if not p.name.startswith("~$") and not skip_wisdom_part(p)
            ),
            "DOCX",
        )
        images = self.inventory(
            (p for p in ws.rglob("*.webp") if not skip_wisdom_part(p)),
            "images",
        )
        self.story_stems = set(docs)
        self.exact("DOCX count", len(docs), EXPECTED_DE)
        self.exact("image count", len(images), EXPECTED_DE)
        self.exact("DOCX/image bijection", sorted(images), sorted(docs))
        self.preservation(docs, images)
        for stem, path in images.items():
            size = self.webp_dimensions(path)
            if size is None:
                continue
            # Intrinsic comic plates are typically 1536-wide; allow author-folder variants.
            if size[0] < 1200 or size[1] < 800:
                self.fail(f"{stem} illustration dimensions too small: {size}")
        self.counts["source_image_dimensions_checked"] = len(images)
        sources = {}
        for stem, path in docs.items():
            try:
                raw = docx_paragraphs(path)
                if len(raw) < 2:
                    self.fail(f"{self.label(path)}: missing title/body")
                    continue
                title = ETIBAR_DE_SENTENCE_TITLES.get(stem) or sentence_case_de(raw[0])
                body = normalize_de_paragraphs(raw[1:])
                sources[stem] = [title, *body]
            except (OSError, ValueError, ET.ParseError, KeyError) as exc:
                self.fail(f"{self.label(path)}: DOCX read failed: {exc}")
        try:
            az = catalog(self.root / "az/assets/stories-data.js")
            categories = az["categories"]
            memberships_az = {
                c["slug"]: [s["stem"] for s in c["stories"]] for c in categories
            }
            memberships = {
                slug: [s for s in stems if s not in ETIBAR_POETRY_STEMS]
                for slug, stems in memberships_az.items()
            }
            stems_az = [s for members in memberships_az.values() for s in members]
            stems_de = [s for members in memberships.values() for s in members]
            self.exact("AZ category count", len(categories), 12)
            self.exact("AZ canonical story count", len(stems_az), EXPECTED_AZ)
            self.exact("DE expected story count", len(stems_de), EXPECTED_DE)
            self.exact("DOCX/DE canonical bijection", sorted(docs), sorted(stems_de))
            if len(set(stems_az)) != len(stems_az):
                self.fail("AZ catalog has duplicate canonical stories")
        except (OSError, ValueError, KeyError, TypeError) as exc:
            self.fail(f"AZ canonical catalog: {exc}")
            return
        if sources_only:
            return
        try:
            de = catalog(self.root / "de/assets/stories-data.js")
            self.exact("DE catalog language", de.get("lang"), "de")
            de_cats = de["categories"]
            self.exact("DE category slugs/order", [c["slug"] for c in de_cats], list(memberships))
            de_stems = []
            for cat in de_cats:
                members = cat["stories"]
                self.exact(
                    f"catalog {cat['slug']} membership/order",
                    [s["stem"] for s in members],
                    memberships.get(cat["slug"], []),
                )
                self.exact(f"catalog {cat['slug']} count", cat.get("count"), len(members))
                for story in members:
                    stem = story["stem"]
                    de_stems.append(stem)
                    if stem in sources and sources[stem]:
                        self.exact(f"catalog {stem} title", story.get("title"), sources[stem][0])
                        self.exact(
                            f"catalog {stem} paragraphs",
                            story.get("paragraphs"),
                            sources[stem][1:],
                        )
                    self.exact(f"catalog {stem} hasImage", story.get("hasImage"), True)
            self.exact("DE catalog story bijection", sorted(de_stems), sorted(docs))
            self.counts["catalog_stories"] = len(de_stems)
        except (OSError, ValueError, KeyError, TypeError) as exc:
            self.fail(f"DE generated catalog: {exc}")
        story_dir = self.root / "de/stories"
        pages = {p.stem: p for p in story_dir.glob("*.html")}
        # compare.html is an existing multilingual utility, not a story.
        self.exact("DE story HTML bijection", sorted(set(pages) - {"compare"}), sorted(docs))
        self.counts["story_pages"] = len(set(pages) - {"compare"})
        for stem, paragraphs in sources.items():
            path = story_dir / (stem + ".html")
            if not path.is_file():
                self.fail(f"missing story page: {self.label(path)}")
                continue
            page = self.load_page(path)
            if page is None or not paragraphs:
                continue
            self.exact(f"{stem} h1", page.headings, paragraphs[:1])
            self.exact(f"{stem} story__text p", page.paragraphs, paragraphs[1:])
            if len(page.titles) != 1 or not (
                page.titles[0] == paragraphs[0]
                or any(
                    page.titles[0].startswith(paragraphs[0] + sep)
                    for sep in (" | ", " — ", " – ", " - ", " · ")
                )
            ):
                self.fail(
                    f"{stem}: document title must retain exact DOCX title "
                    f"(optional site suffix): {page.titles!r}"
                )
            targets = []
            for url in page.images:
                try:
                    target = self.target(path, url)
                    if target and target[0].suffix.lower() == ".webp":
                        # Accept main illustrations/ or author-folder plates.
                        if "wisdom-stories" in target[0].as_posix().replace("\\", "/"):
                            targets.append(target[0].resolve())
                except ValueError:
                    pass
            expected_img = [images[stem].resolve()] if stem in images else []
            self.exact(f"{stem} illustration", sorted(set(targets)), expected_img)
        self.exact(
            "DE category page bijection",
            sorted(p.stem for p in (self.root / "de/categories").glob("*.html")),
            sorted(memberships),
        )
        for slug, members in memberships.items():
            path = self.root / "de/categories" / (slug + ".html")
            if not path.is_file():
                self.fail(f"missing category page: {self.label(path)}")
            else:
                page = self.load_page(path)
                if page:
                    self.linked_stories(path, page, set(members))
        for author, prefix in (("bakhtiyar", "bs_"), ("etibar", "es_")):
            expected = {s for s, p in docs.items() if p.stem.lower().startswith(prefix) or author in p.parent.name.lower()}
            path = self.root / "de/authors" / (author + ".html")
            if not path.is_file():
                self.fail(f"missing author page: {self.label(path)}")
            else:
                page = self.load_page(path)
                if page:
                    self.linked_stories(path, page, expected)
        public = [p for p in (self.root / "de").rglob("*.html") if not any(part in {"_backups", "_reviews", "wisdom-stories"} for part in p.relative_to(self.root / "de").parts)]
        self.counts["public_html_audited"] = len(public)
        for path in sorted(public):
            page = self.load_page(path)
            if not page:
                continue
            self.exact(self.label(path) + " html lang", page.langs, ["de"])
            self.exact(self.label(path) + " canonical", page.canonicals, ["https://birinci.cloud/" + self.label(path)])
            if page.base:
                self.fail(f"{self.label(path)}: base URL unsupported; use explicit local references")
            for anchor, count in page.ids.items():
                if count > 1:
                    self.fail(f"{self.label(path)}: duplicate id {anchor!r}")
            for kind, url in page.references:
                self.reference(path, kind, url)
            for attrs in page.image_attributes:
                for key in ("src", "data-src"):
                    url = attrs.get(key)
                    if not url:
                        continue
                    try:
                        target = self.target(path, url)
                    except ValueError:
                        continue
                    if not target or target[0].suffix.lower() != ".webp" or not target[0].is_file():
                        continue
                    size = self.webp_dimensions(target[0])
                    # Shared logos intentionally use small display dimensions.
                    # Story illustrations declare their intrinsic dimensions;
                    # thumbnails may be resized with CSS, not false attributes.
                    # Story plates declare intrinsic dimensions; shared chrome
                    # logos intentionally use smaller display sizes.
                    if size and "wisdom-stories" in target[0].as_posix().replace("\\", "/"):
                        for field, dimension in zip(("width", "height"), size):
                            # HTML may keep the comic template 1536×1024 even when
                            # an author-folder plate differs slightly.
                            declared = attrs.get(field)
                            if declared not in {str(dimension), "1536" if field == "width" else "1024"}:
                                self.exact(
                                    f"{self.label(path)} {key} {url} {field}",
                                    declared,
                                    str(dimension),
                                )
            for style in page.styles:
                self.css_text(path, style)
        self.counts["referenced_webp_dimensions_checked"] = len(self.dimensions)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--sources-only", action="store_true", help="pre-generation DOCX/image/AZ-catalog audit")
    parser.add_argument("--json", action="store_true", help="print full machine-readable report to stdout")
    parser.add_argument("--max-errors", type=int, default=30, help="human-readable error display limit")
    args = parser.parse_args()
    audit = Audit(args.root)
    audit.run(args.sources_only)
    report = {"ok": not audit.errors, "mode": "sources-only" if args.sources_only else "integration", "counts": audit.counts, "errors": audit.errors}
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(("PASS" if report["ok"] else "FAIL") + " German Wisdom " + report["mode"])
        print(json.dumps(audit.counts, ensure_ascii=False))
        for error in audit.errors[:max(0, args.max_errors)]:
            print("  - " + error)
        if len(audit.errors) > args.max_errors:
            print(f"  ... {len(audit.errors)} errors total; use --json for all findings")
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
