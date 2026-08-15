# -*- coding: utf-8 -*-
"""Build a Kindle-ready EPUB from Bir inci stories + illustrations.

Pilot / full builds read az/data/stories.json (run build_website.py first).
Illustrations are converted from WebP to JPEG for Kindle compatibility.

Examples:
  python tools/build_kindle_epub.py --pilot
  python tools/build_kindle_epub.py --category edalet-ve-cemiyyet
  python tools/build_kindle_epub.py --all
  python tools/build_kindle_epub.py --stems friend-of-god the-blind-well
"""
from __future__ import annotations

import argparse
import html
import io
import json
import re
import sys
from pathlib import Path

from ebooklib import epub
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DATA_JSON = ROOT / "az" / "data" / "stories.json"
ILLUSTRATIONS = ROOT / "az" / "illustrations"
BRAND_COVER = ROOT / "az" / "assets" / "Pearl with Background 2.png"
OUT_DIR = ROOT / "docs" / "epub"

# Compact pilot category (~10 stories) for Kindle Previewer checks.
PILOT_CATEGORY = "edalet-ve-cemiyyet"

CSS = """
@namespace epub "http://www.idpf.org/2007/ops";
body {
  font-family: "Bookerly", "Georgia", "Times New Roman", serif;
  line-height: 1.45;
  margin: 0;
  padding: 0;
  color: #111;
}
h1 {
  font-size: 1.55em;
  line-height: 1.25;
  text-align: center;
  margin: 1.2em 0 0.7em;
  page-break-before: always;
  page-break-after: avoid;
}
h1.cover-title {
  font-size: 1.8em;
  margin-top: 2.5em;
}
h2 {
  font-size: 1.25em;
  margin: 1.4em 0 0.6em;
  page-break-after: avoid;
}
p {
  margin: 0 0 0.85em;
  text-indent: 1.15em;
  text-align: justify;
  orphans: 2;
  widows: 2;
}
p.no-indent { text-indent: 0; }
p.blurb {
  text-indent: 0;
  font-style: italic;
  text-align: center;
  margin: 0.4em 1em 1.4em;
}
p.moral {
  text-indent: 0;
  margin-top: 1.15em;
  padding: 0.55em 0.65em;
  border-left: 3px solid #c99b3b;
  font-weight: bold;
  background: #fff8e8;
}
.figure {
  margin: 0.4em 0 1em;
  text-align: center;
  page-break-inside: avoid;
}
.figure img {
  width: 100%;
  max-width: 100%;
  height: auto;
}
.toc a { text-decoration: none; color: #113366; }
.toc li { margin: 0.35em 0; }
.cover-fig { margin: 1.5em auto; text-align: center; }
.cover-fig img { width: 55%; max-width: 280px; height: auto; }
.meta { text-align: center; text-indent: 0; color: #444; }
"""


def esc(text: str) -> str:
    return html.escape(text or "", quote=True)


def slugify(text: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9\-]+", "-", (text or "").strip().lower())
    return s.strip("-") or "item"


def load_data() -> dict:
    if not DATA_JSON.is_file():
        raise SystemExit(f"Missing {DATA_JSON} — run tools/build_website.py first.")
    return json.loads(DATA_JSON.read_text(encoding="utf-8"))


def select_categories(
    data: dict,
    *,
    all_cats: bool,
    category: str | None,
    stems: set[str] | None,
) -> list[dict]:
    cats = list(data.get("categories") or [])
    if all_cats:
        return cats
    if category:
        found = [c for c in cats if c.get("slug") == category]
        if not found:
            known = ", ".join(c.get("slug", "?") for c in cats)
            raise SystemExit(f"Unknown category {category!r}. Known: {known}")
        return found
    if stems:
        out = []
        for cat in cats:
            stories = [s for s in cat.get("stories") or [] if s.get("stem") in stems]
            if stories:
                out.append({**cat, "stories": stories, "count": len(stories)})
        missing = stems - {s["stem"] for c in out for s in c["stories"]}
        if missing:
            raise SystemExit("Unknown stem(s): " + ", ".join(sorted(missing)))
        return out
    raise SystemExit("Provide --pilot, --category, --stems, or --all")


def webp_to_jpeg_bytes(path: Path, *, max_side: int = 1400, quality: int = 85) -> bytes:
    with Image.open(path) as im:
        im = im.convert("RGB")
        w, h = im.size
        scale = min(1.0, max_side / max(w, h))
        if scale < 1.0:
            im = im.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, format="JPEG", quality=quality, optimize=True)
        return buf.getvalue()


def story_html(story: dict, image_href: str | None) -> str:
    title = esc(story["title"])
    paras = list(story.get("paragraphs") or [])
    parts = [f"<h1>{title}</h1>"]
    if image_href:
        parts.append(
            f'<div class="figure"><img src="{esc(image_href)}" alt="{title}"/></div>'
        )
    for i, para in enumerate(paras):
        cls = []
        if i == 0:
            cls.append("no-indent")
        if i == len(paras) - 1 and len(paras) >= 3:
            cls.append("moral")
        class_attr = f' class="{" ".join(cls)}"' if cls else ""
        parts.append(f"<p{class_attr}>{esc(para)}</p>")
    return "\n".join(parts)


def build_epub(
    categories: list[dict],
    *,
    book_title: str,
    out_path: Path,
) -> Path:
    book = epub.EpubBook()
    book.set_identifier("bir-inci-pilot-" + slugify(book_title))
    book.set_title(book_title)
    book.set_language("az")
    book.add_author("Bir inci")
    book.add_metadata("DC", "publisher", "Bir inci")
    book.add_metadata("DC", "description", "İbrətamiz hekayələr — mətn və illüstrasiya ilə.")

    style = epub.EpubItem(
        uid="style",
        file_name="style/book.css",
        media_type="text/css",
        content=CSS.encode("utf-8"),
    )
    book.add_item(style)

    # Cover image (brand pearl)
    cover_bytes = None
    if BRAND_COVER.is_file():
        with Image.open(BRAND_COVER) as im:
            im = im.convert("RGB")
            buf = io.BytesIO()
            im.save(buf, format="JPEG", quality=88, optimize=True)
            cover_bytes = buf.getvalue()
        book.set_cover("images/cover.jpg", cover_bytes)

    spine: list = ["nav"]
    toc: list = []
    chapters: list[epub.EpubHtml] = []

    # Title / intro page
    intro = epub.EpubHtml(
        title="Ön söz",
        file_name="text/intro.xhtml",
        lang="az",
    )
    cover_block = (
        '<div class="cover-fig"><img src="../images/cover.jpg" alt="Bir inci"/></div>'
        if cover_bytes
        else ""
    )
    story_count = sum(len(c.get("stories") or []) for c in categories)
    cat_labels = ", ".join(c.get("title", "") for c in categories)
    # ebooklib expects body fragment content (it wraps the XHTML shell).
    intro.set_content(
        f"""
{cover_block}
<h1 class="cover-title">{esc(book_title)}</h1>
<p class="meta no-indent">Bir inci</p>
<p class="blurb">{esc(cat_labels)}</p>
<p class="meta no-indent">{story_count} hekayə · mətn və illüstrasiya</p>
<p class="no-indent">Bu pilot nəşr saytdakı hekayələrin Kindle/EPUB yoxlaması üçündür.
Hər hekayədə mətn və (mövcuddursa) illüstrasiya birlikdə verilir.</p>
""".strip()
    )
    intro.add_link(href="../style/book.css", rel="stylesheet", type="text/css")
    book.add_item(intro)
    spine.append(intro)
    toc.append(intro)

    missing_images: list[str] = []

    for cat in categories:
        cat_title = cat.get("title") or cat.get("slug") or "Kateqoriya"
        cat_slug = cat.get("slug") or slugify(cat_title)
        cat_blurb = cat.get("blurb") or ""

        cat_page = epub.EpubHtml(
            title=cat_title,
            file_name=f"text/cat-{cat_slug}.xhtml",
            lang="az",
        )
        cat_page.set_content(
            f"<h1>{esc(cat_title)}</h1>\n<p class=\"blurb\">{esc(cat_blurb)}</p>"
        )
        cat_page.add_link(href="../style/book.css", rel="stylesheet", type="text/css")
        book.add_item(cat_page)
        spine.append(cat_page)

        story_chapters: list[epub.EpubHtml] = []

        for story in cat.get("stories") or []:
            stem = story["stem"]
            webp = ILLUSTRATIONS / f"{stem}.webp"
            image_href = None
            if webp.is_file():
                jpeg = webp_to_jpeg_bytes(webp)
                img_name = f"images/{stem}.jpg"
                book.add_item(
                    epub.EpubItem(
                        uid=f"img-{stem}",
                        file_name=img_name,
                        media_type="image/jpeg",
                        content=jpeg,
                    )
                )
                image_href = f"../{img_name}"
            else:
                missing_images.append(stem)

            chapter = epub.EpubHtml(
                title=story["title"],
                file_name=f"text/{stem}.xhtml",
                lang="az",
            )
            chapter.set_content(story_html(story, image_href))
            chapter.add_link(href="../style/book.css", rel="stylesheet", type="text/css")
            book.add_item(chapter)
            spine.append(chapter)
            story_chapters.append(chapter)
            chapters.append(chapter)

        toc.append((cat_page, story_chapters))

    book.toc = toc
    book.spine = spine
    book.add_item(epub.EpubNcx())
    book.add_item(epub.EpubNav())

    out_path.parent.mkdir(parents=True, exist_ok=True)
    epub.write_epub(str(out_path), book, {})

    if missing_images:
        print(
            "Warning: missing illustrations for: " + ", ".join(missing_images),
            file=sys.stderr,
        )
    return out_path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pilot", action="store_true", help=f"Build pilot ({PILOT_CATEGORY})")
    parser.add_argument("--all", action="store_true", help="All categories / stories")
    parser.add_argument("--category", metavar="SLUG", help="One category slug")
    parser.add_argument("--stems", nargs="+", help="Specific story stems")
    parser.add_argument(
        "--out",
        type=Path,
        help="Output .epub path (default under docs/epub/)",
    )
    args = parser.parse_args()

    selectors = sum(
        [bool(args.pilot), bool(args.all), bool(args.category), bool(args.stems)]
    )
    if selectors != 1:
        parser.error("Provide exactly one of: --pilot, --all, --category, --stems")

    data = load_data()
    if args.pilot:
        cats = select_categories(data, all_cats=False, category=PILOT_CATEGORY, stems=None)
        book_title = f"Bir inci — {cats[0]['title']} (pilot)"
        default_name = f"bir-inci-pilot-{PILOT_CATEGORY}.epub"
    elif args.all:
        cats = select_categories(data, all_cats=True, category=None, stems=None)
        book_title = "Bir inci — İbrətamiz hekayələr"
        default_name = "bir-inci-all-stories.epub"
    elif args.category:
        cats = select_categories(data, all_cats=False, category=args.category, stems=None)
        book_title = f"Bir inci — {cats[0]['title']}"
        default_name = f"bir-inci-{args.category}.epub"
    else:
        cats = select_categories(
            data, all_cats=False, category=None, stems=set(args.stems)
        )
        book_title = "Bir inci — Seçilmiş hekayələr"
        default_name = "bir-inci-selected.epub"

    out = args.out or (OUT_DIR / default_name)
    path = build_epub(cats, book_title=book_title, out_path=out)
    n = sum(len(c.get("stories") or []) for c in cats)
    print(f"Wrote {path} ({n} stories, {path.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
