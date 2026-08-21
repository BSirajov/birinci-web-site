# -*- coding: utf-8 -*-
"""Build a standalone prominent-figures preview page (not linked in site nav)."""
from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(r"c:/dev/birinci-web-site")
DIR = ROOT / "en" / "prominent-figures"
EXTRACT = DIR / "_extract.json"
OUT = DIR / "index.html"

SKIP_CAT = {
    "endnotes-and-selected-bibliography",
    "alphabetical-index",
    "image-credits-and-rights",
}

ASSET_V = "20260822d"
INV_V = "20260821o"


def esc(s: str) -> str:
    return html.escape(s or "", quote=True)


def short_title(title: str, max_len: int = 42) -> str:
    t = re.sub(r"\s+", " ", title).strip()
    if len(t) <= max_len:
        return t
    cut = t[: max_len - 1].rsplit(" ", 1)[0]
    return (cut or t[: max_len - 1]) + "…"


def parse_meta(meta: str) -> dict:
    out = {"life": "", "region": "", "fields": "", "alt": ""}
    if not meta:
        return out
    # Word often packs fields with newlines and pipes in one run.
    chunks = re.split(r"\s*\|\s*|\n+", meta)
    for p in chunks:
        p = p.strip()
        if not p:
            continue
        low = p.casefold()
        if low.startswith("alternative names:"):
            out["alt"] = p.split(":", 1)[1].strip()
        elif low.startswith("life:"):
            out["life"] = p.split(":", 1)[1].strip()
        elif low.startswith("associated region:"):
            out["region"] = p.split(":", 1)[1].strip()
        elif low.startswith("fields:"):
            out["fields"] = p.split(":", 1)[1].strip()
        elif not out["life"] and ("BCE" in p or "CE" in p or "born" in low or "died" in low or "active" in low):
            out["life"] = p
    return out


def render_person(person: dict, cat_id: str, num: str) -> str:
    pid = person["id"]
    name = person["name"]
    meta = parse_meta(person.get("meta") or "")
    meta_bits = []
    if meta.get("life"):
        meta_bits.append(meta["life"])
    if meta.get("region"):
        meta_bits.append(meta["region"])
    if meta.get("fields"):
        meta_bits.append(meta["fields"])
    meta_line = " · ".join(meta_bits)

    parts = [
        f'<article class="inventions-entry" id="{esc(pid)}" data-figure-cat="{esc(cat_id)}">',
        f'<h2 class="inventions-entry-title"><span class="inventions-entry-num" aria-hidden="true">{esc(num)}</span>'
        f'<span class="inventions-entry-name">{esc(name)}</span></h2>',
    ]
    if meta.get("alt"):
        parts.append(f'<p class="inventions-entry-visual-figures"><strong>Also known as:</strong> {esc(meta["alt"])}</p>')
    if meta_line:
        parts.append(f'<p class="inventions-entry-meta">{esc(meta_line)}</p>')

    for block in person.get("body") or []:
        t = block.get("text") or ""
        if not t:
            continue
        if block.get("type") == "li":
            parts.append(f"<ul><li>{esc(t)}</li></ul>")
        else:
            parts.append(f'<div class="inventions-entry-section"><p>{esc(t)}</p></div>')

    for sec in person.get("sections") or []:
        heading = sec.get("heading") or ""
        parts.append('<div class="inventions-entry-section">')
        if heading:
            parts.append(f"<h3>{esc(heading)}</h3>")
        for p in sec.get("paras") or []:
            parts.append(f"<p>{esc(p)}</p>")
        items = sec.get("items") or []
        if items:
            parts.append("<ul>")
            for it in items:
                parts.append(f"<li>{esc(it)}</li>")
            parts.append("</ul>")
        parts.append("</div>")

    parts.append("</article>")
    return "\n".join(parts)


def main() -> None:
    data = json.loads(EXTRACT.read_text(encoding="utf-8"))
    cats = [c for c in data["categories"] if c["id"] not in SKIP_CAT and c.get("people")]
    people_n = sum(len(c["people"]) for c in cats)

    # TOC
    toc = []
    for i, cat in enumerate(cats, start=1):
        cid = cat["id"]
        toc.append(
            f'<li class="inventions-toc-cat-row" data-toc-cat="{esc(cid)}">'
            f'<span class="tl-date">§{i}</span><a href="#{esc(cid)}">{esc(short_title(cat["title"]))}</a></li>'
        )
        for j, person in enumerate(cat["people"], start=1):
            toc.append(
                f'<li class="inventions-toc-entry" data-toc-entry="{esc(person["id"])}" data-toc-cat="{esc(cid)}">'
                f'<span class="tl-date">{i}.{j}</span><a href="#{esc(person["id"])}">{esc(person["name"])}</a></li>'
            )

    # Articles
    stack = []
    for i, cat in enumerate(cats, start=1):
        cid = cat["id"]
        stack.append(
            f'<section class="inventions-category" id="{esc(cid)}" data-category="{esc(cat["title"])}">'
            f'<h2 class="inventions-category-head">{i}. {esc(cat["title"])}</h2>'
        )
        for intro in cat.get("intro") or []:
            stack.append(f'<p class="figures-cat-intro">{esc(intro)}</p>')
        for j, person in enumerate(cat["people"], start=1):
            stack.append(render_person(person, cid, f"{i}.{j}"))
        stack.append("</section>")

    cat_options = "".join(
        f'<option value="{esc(c["id"])}">{i}. {esc(short_title(c["title"], 48))}</option>'
        for i, c in enumerate(cats, start=1)
    )

    page = f"""<!DOCTYPE html>
<html lang="en" data-kt-lang="en" data-kt-page-id="prominent-figures-preview">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0069b4" />
  <meta name="robots" content="noindex,nofollow" />
  <title>{esc(data.get("title") or "Prominent figures")} · Preview · Birİnci</title>
  <meta name="description" content="{esc(data.get("subtitle") or "")}" />
  <link rel="icon" href="../../assets/favicon-32.png" type="image/png" sizes="32x32" />
  <link rel="stylesheet" href="../../assets/site.css?v={ASSET_V}" />
  <link rel="stylesheet" href="../../assets/inventions/kt-tokens.css?v=20260821n" />
  <link rel="stylesheet" href="../../assets/inventions/kt-catalog-toolbar.css?v=20260821n" />
  <link rel="stylesheet" href="../../assets/inventions/kt-sidebar-widget.css?v=20260821n" />
  <link rel="stylesheet" href="../../assets/inventions/kt-inventions.css?v={INV_V}" />
  <link rel="stylesheet" href="../../assets/inventions/inventions-bridge.css?v=20260821n" />
  <link rel="stylesheet" href="figures-preview.css?v=1" />
</head>
<body class="page-inventions inventions-preview-page figures-preview-page" id="top" data-lang="en">
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="figures-preview-banner" role="status">
    <strong>Preview only</strong> — not linked from the site navigation. Open this file directly to review.
    Source: <code>Prominent figures.docx</code> · {people_n} profiles · {len(cats)} categories.
  </div>
  <header class="site-header">
  <div class="site-header__inner">
    <a class="brand" href="../../index.html">
      <img class="brand__logo" src="../../assets/pearl.webp" alt="" width="40" height="40" />
      <span class="brand__name">Birİnci</span>
    </a>
    <p class="figures-preview-header-note">Prominent figures (draft)</p>
  </div>
</header>
  <main id="main">
  <div class="inventions-page-body">
<header class="about-hero">
  <div class="about-hero__wrap">
    <section class="about-hero__copy">
      <h1 class="about-hero__title" id="about-hero-title">{esc(data.get("title") or "Humanity's Makers")}</h1>
      <p class="about-hero__lead">{esc(data.get("subtitle") or "")}</p>
    </section>
</div>
</header>
<div class="tools-bar tools-bar--dense tools-bar--inventions" data-tools="inventions" aria-label="Catalog filters">
  <div class="tools-bar__search">
    <label class="tools-bar__search-field">
      <span class="visually-hidden">Search</span>
      <input type="search" id="inventionsSearch" data-tools-search placeholder="Search people…" aria-label="Search" autocomplete="off"/>
    </label>
    <div class="tools-bar__search-chip" data-search-filter hidden>
      <span class="tools-bar__search-chip-dot" aria-hidden="true"></span>
      <span class="tools-bar__search-chip-text" data-search-filter-text aria-live="polite"></span>
      <button type="button" class="tools-bar__view-btn tools-bar__search-clear" data-search-filter-clear title="Clear filter" aria-label="Clear filter">×</button>
    </div>
  </div>
  <div class="tools-bar__field tools-bar__field--filter">
    <span class="tools-bar__label" id="fig-cat-label">Category</span>
    <div class="sel-wrap">
      <select id="filterCategory" aria-labelledby="fig-cat-label"><option value="">All categories</option>
{cat_options}
</select>
      <button class="sel-clear" data-for="filterCategory" title="Clear filter" type="button">×</button>
    </div>
  </div>
</div>
<div class="charter-layout inventions-layout">
<aside class="charter-sidebar toc-card" aria-label="People navigation">
<div class="sidebar-widget events-open" id="inventionsArticlesWidget">
<div class="widget-head">
<h2 class="widget-head__title"><span class="widget-head__icon" aria-hidden="true">👤</span> People</h2>
<button type="button" class="events-menu-toggle" aria-expanded="true" aria-controls="inventionsArticlesWidgetBody" aria-label="Toggle people menu"><span></span><span></span><span></span></button>
</div>
<div class="widget-actions" role="group" aria-label="People section controls">
<div class="widget-actions__views" role="group" aria-label="Categories">
<button type="button" class="widget-action-btn" data-toc-action="expand-all" data-bulk-action="expand" aria-label="Expand all categories" title="Expand all categories"><span class="widget-action-btn__icon" aria-hidden="true"></span><span class="widget-action-btn__label">Expand</span></button>
<button type="button" class="widget-action-btn" data-toc-action="collapse-all" data-bulk-action="collapse" aria-label="Collapse all categories" title="Collapse all categories"><span class="widget-action-btn__icon" aria-hidden="true"></span><span class="widget-action-btn__label">Collapse</span></button>
</div>
</div>
<div class="widget-body" id="inventionsArticlesWidgetBody">
<ul class="timeline-list" id="inventionsTocList">
{"".join(toc)}
</ul>
</div>
</div>
</aside>
<div class="charter-stack inventions-stack">
{"".join(stack)}
</div>
</div>
  </div>
  </main>
  <footer class="site-footer">
    <div class="footer-bottom">
      <div class="footer-copy">© 2026 Birİnci · Prominent figures preview (not published in nav)</div>
    </div>
  </footer>
  <script src="../../assets/inventions/kt-sidebar-toc-groups.js?v={INV_V}" defer></script>
  <script src="../../assets/inventions/kt-inventions.js?v=20260821q" defer></script>
  <script src="../../assets/site.js?v={ASSET_V}" defer></script>
  <script src="figures-preview.js?v=1" defer></script>
</body>
</html>
"""
    OUT.write_text(page, encoding="utf-8")
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")
    print(f"categories={len(cats)} people={people_n}")


if __name__ == "__main__":
    main()
