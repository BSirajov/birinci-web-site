#!/usr/bin/env python3
"""Birİnci full-site QA smoke — structural + Playwright matrix.

Covers automated portions of docs/SITE_QA_CHECKLIST.md and the user's
Full Site QA & Consistency Checklist. Writes tools/_qa_report.txt.
"""
from __future__ import annotations

import hashlib
import re
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(r"c:\dev\birinci-web-site")
REPORT = ROOT / "tools" / "_qa_report.txt"
LANGS = ("az", "en", "ru", "ky")
WIDTHS = (360, 390, 768, 1024, 1440)

lines: list[str] = []
fails = 0
warns = 0


def log(msg: str) -> None:
    lines.append(msg)
    print(msg)


def check(name: str, ok: bool, detail: str = "") -> None:
    global fails
    status = "PASS" if ok else "FAIL"
    if not ok:
        fails += 1
    log(f"[{status}] {name}" + (f" — {detail}" if detail else ""))


def warn(name: str, detail: str = "") -> None:
    global warns
    warns += 1
    log(f"[WARN] {name}" + (f" — {detail}" if detail else ""))


def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]


def structural() -> None:
    log("=== Structural / cache / deploy ===")
    # Asset version drift on live locale HTML (exclude deployment for primary)
    # Only stylesheet/script cache-bust under /assets/ (ignore icons & YouTube)
    ver_re = re.compile(
        r"""(?:href|src)=["'][^"']*?/assets/[^"']*?\.(?:css|js)\?v=([^"'&\s]+)""",
        re.I,
    )
    versions: Counter[str] = Counter()
    per_file_versions: list[tuple[str, set[str]]] = []
    for lang in LANGS:
        for p in (ROOT / lang).rglob("*.html"):
            text = p.read_text(encoding="utf-8", errors="replace")
            found = set(ver_re.findall(text))
            if found:
                per_file_versions.append((str(p.relative_to(ROOT)), found))
                versions.update(found)
    # Root index
    if (ROOT / "index.html").exists():
        found = set(ver_re.findall((ROOT / "index.html").read_text(encoding="utf-8")))
        per_file_versions.append(("index.html", found))
        versions.update(found)

    top = versions.most_common(8)
    log(f"Asset CSS/JS ?v= frequency (top): {top}")
    multi = [(f, sorted(s)) for f, s in per_file_versions if len(s) > 1]
    check(
        "CSS/JS cache-bust unified per page (single ?v= stamp preferred)",
        len(multi) == 0,
        f"{len(multi)} pages still mix CSS/JS versions: {multi[:5]}"
        if multi
        else f"ok ({len(per_file_versions)} pages)",
    )
    check(
        "Dominant CSS/JS asset version is current pass stamp",
        bool(top) and top[0][0] == "20260820y",
        str(top[:3]),
    )

    # Critical shared assets: live vs deployment
    critical = [
        "assets/site.css",
        "assets/site.js",
        "assets/inventions/kt-inventions.css",
        "assets/inventions/inventions-bridge.css",
        "assets/inventions/kt-tokens.css",
    ]
    for rel in critical:
        src = ROOT / rel
        dep = ROOT / "deployment" / rel
        if not src.exists():
            check(f"Source exists {rel}", False)
            continue
        if not dep.exists():
            check(f"Deployment mirror exists {rel}", False)
            continue
        check(
            f"deployment matches {rel}",
            file_hash(src) == file_hash(dep),
            f"src={file_hash(src)} dep={file_hash(dep)}",
        )

    # Landmarks + page-jump on sample pages
    samples = [
        ROOT / "en" / "index.html",
        ROOT / "az" / "index.html",
        ROOT / "en" / "categories" / "exlaq-ve-xarakter.html",
        ROOT / "en" / "discoveries" / "discoveries-and-inventions.html",
        ROOT / "ru" / "discoveries" / "discoveries-and-inventions.html",
        ROOT / "ky" / "discoveries" / "discoveries-and-inventions.html",
        ROOT / "en" / "about" / "mission-vision-values.html",
        ROOT / "index.html",
    ]
    for p in samples:
        if not p.exists():
            check(f"Sample exists {p.relative_to(ROOT)}", False)
            continue
        t = p.read_text(encoding="utf-8", errors="replace")
        rel = str(p.relative_to(ROOT))
        check(f"Landmark header {rel}", bool(re.search(r"<header\b", t)))
        check(f"Landmark main {rel}", bool(re.search(r"<main\b", t)))
        check(f"Landmark footer {rel}", bool(re.search(r"<footer\b", t)))
        check(f"page-jump {rel}", 'class="page-jump"' in t or "class='page-jump'" in t)
        check(f"back-to-top {rel}", 'id="back-to-top"' in t)
        check(f"go-to-bottom {rel}", 'id="go-to-bottom"' in t)
        # Go-to-bottom before back-to-top in markup (checklist)
        if 'id="go-to-bottom"' in t and 'id="back-to-top"' in t:
            check(
                f"go-to-bottom above back-to-top markup {rel}",
                t.find('id="go-to-bottom"') < t.find('id="back-to-top"'),
            )

    # No Ocaq video UI
    ocaq_hits = []
    for lang in LANGS:
        disc = ROOT / lang / "discoveries" / "discoveries-and-inventions.html"
        if disc.exists():
            t = disc.read_text(encoding="utf-8", errors="replace")
            if re.search(r"ocaq-video|Watch video|data-ocaq", t, re.I):
                ocaq_hits.append(lang)
    check("No Ocaq/video launch controls on Discoveries", len(ocaq_hits) == 0, str(ocaq_hits))

    # RU/KY discoveries nav link present on home
    for lang in ("ru", "ky"):
        home = ROOT / lang / "index.html"
        t = home.read_text(encoding="utf-8", errors="replace")
        check(
            f"{lang} home links to discoveries page",
            "discoveries/discoveries-and-inventions.html" in t,
        )

    # CSS regression guards from recent sessions
    site = (ROOT / "assets" / "site.css").read_text(encoding="utf-8")
    check(
        "page-jump not forced to position:relative via body > .page-jump stack rule",
        not re.search(
            r"body\s*>\s*\.page-jump\s*\{[^}]*position:\s*relative",
            site,
            re.S,
        ),
    )
    check(
        "body > .page-jump keeps fixed",
        bool(re.search(r"body\s*>\s*\.page-jump\s*\{[^}]*position:\s*fixed", site, re.S)),
    )
    check(
        "story body uses Source Sans 3 token (--font-ui)",
        bool(
            re.search(
                r"\.story__text,\s*\.story \.card-text\s*\{[^}]*font-family:\s*var\(--font-ui\)",
                site,
                re.S,
            )
        ),
    )
    check(
        "story body color is black",
        bool(
            re.search(
                r"\.story__text,\s*\.story \.card-text\s*\{[^}]*color:\s*#000",
                site,
                re.S,
            )
        ),
    )
    inv = (ROOT / "assets" / "inventions" / "kt-inventions.css").read_text(encoding="utf-8")
    check(
        "discovery entry sections use black text",
        bool(
            re.search(
                r"\.inventions-entry-section p\s*\{[^}]*color:\s*#000",
                inv,
                re.S,
            )
        ),
    )
    check(
        "discovery entries have spacing (margin-bottom)",
        bool(re.search(r"\.inventions-entry\s*\{[^}]*margin:\s*0\s+0\s+16px", inv, re.S)),
    )


def playwright_matrix() -> None:
    log("=== Playwright matrix ===")
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        warn("playwright not installed — skip browser matrix")
        return

    pages = [
        ("en/index.html", "home"),
        ("en/categories/exlaq-ve-xarakter.html", "category"),
        ("en/discoveries/discoveries-and-inventions.html", "discoveries"),
        ("en/about/mission-vision-values.html", "about"),
        ("ru/discoveries/discoveries-and-inventions.html", "discoveries-ru"),
        ("ky/index.html", "home-ky"),
    ]

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for rel, label in pages:
            path = ROOT / rel
            if not path.exists():
                check(f"Playwright page {rel}", False)
                continue
            uri = path.as_uri()
            for w in WIDTHS:
                page = browser.new_page(viewport={"width": w, "height": 900})
                page.goto(uri, wait_until="domcontentloaded", timeout=60000)
                page.wait_for_timeout(700)
                if label.startswith("discoveries"):
                    # Prefer detailed view for article chrome checks
                    try:
                        if page.locator('[data-inventions-view="list"]').count():
                            page.locator('[data-inventions-view="list"]').click(timeout=2000)
                            page.wait_for_timeout(400)
                    except Exception:
                        pass

                data = page.evaluate(
                    """() => {
                      const doc = document.documentElement;
                      const jump = document.querySelector('.page-jump');
                      const top = document.getElementById('back-to-top');
                      const bottom = document.getElementById('go-to-bottom');
                      const crumbs = document.querySelector('.breadcrumbs');
                      const header = document.querySelector('.site-header, header.site-header');
                      const jcs = jump && getComputedStyle(jump);
                      const jr = jump && jump.getBoundingClientRect();
                      const overflowX = Math.max(0, doc.scrollWidth - window.innerWidth);
                      const storyText = document.querySelector('.story__text, .story .card-text');
                      const entryP = document.querySelector('.inventions-entry-section p');
                      const entryTitle = document.querySelector('.inventions-entry-title');
                      const catHead = document.querySelector('.inventions-category-head, .inventions-cards-head');
                      return {
                        overflowX,
                        jumpFixed: jcs && jcs.position,
                        jumpZ: jcs && jcs.zIndex,
                        jumpVisible: !!(jr && jr.width > 0 && jr.height > 0
                          && jr.bottom > 0 && jr.top < innerHeight
                          && jr.right > 0 && jr.left < innerWidth),
                        jumpHasBoth: !!(top && bottom),
                        crumbsBg: crumbs && getComputedStyle(crumbs).backgroundColor,
                        crumbsDisplay: crumbs && getComputedStyle(crumbs).display,
                        headerDisplay: header && getComputedStyle(header).display,
                        storyColor: storyText && getComputedStyle(storyText).color,
                        storyFont: storyText && getComputedStyle(storyText).fontFamily,
                        storyLH: storyText && getComputedStyle(storyText).lineHeight,
                        storyFS: storyText && getComputedStyle(storyText).fontSize,
                        entryColor: entryP && getComputedStyle(entryP).color,
                        entryAlign: entryP && getComputedStyle(entryP).textAlign,
                        titleJC: entryTitle && getComputedStyle(entryTitle).justifyContent,
                        catAlign: catHead && getComputedStyle(catHead).textAlign,
                        catBg: catHead && getComputedStyle(catHead).backgroundColor,
                      };
                    }"""
                )

                check(
                    f"{label}@{w} no horizontal overflow",
                    data["overflowX"] <= 1,
                    f"overflowX={data['overflowX']}",
                )
                check(
                    f"{label}@{w} page-jump fixed+visible",
                    data["jumpFixed"] == "fixed"
                    and data["jumpVisible"]
                    and data["jumpHasBoth"],
                    str(
                        {
                            k: data[k]
                            for k in (
                                "jumpFixed",
                                "jumpVisible",
                                "jumpHasBoth",
                                "jumpZ",
                            )
                        }
                    ),
                )
                if crumbs_expected(label):
                    check(
                        f"{label}@{w} breadcrumbs visible",
                        data["crumbsDisplay"] != "none" and data["crumbsBg"] not in (None, "rgba(0, 0, 0, 0)"),
                        f"display={data['crumbsDisplay']} bg={data['crumbsBg']}",
                    )

                if label == "category" and w == 1440 and data["storyColor"]:
                    check(
                        "story body is black",
                        data["storyColor"] == "rgb(0, 0, 0)",
                        data["storyColor"],
                    )
                    check(
                        "story body Source Sans 3",
                        "Source Sans 3" in (data["storyFont"] or ""),
                        data["storyFont"],
                    )
                    if data["storyLH"] and data["storyFS"]:
                        ratio = float(data["storyLH"].replace("px", "")) / float(
                            data["storyFS"].replace("px", "")
                        )
                        check(
                            "story line-height ~1.3",
                            1.25 <= ratio <= 1.35,
                            f"ratio={ratio:.3f}",
                        )

                if label.startswith("discoveries") and w == 1440:
                    if data["entryColor"]:
                        check(
                            f"{label} entry body black",
                            data["entryColor"] == "rgb(0, 0, 0)",
                            data["entryColor"],
                        )
                    if data["entryAlign"]:
                        check(
                            f"{label} entry justify",
                            data["entryAlign"] == "justify",
                            data["entryAlign"],
                        )
                    if data["titleJC"]:
                        check(
                            f"{label} entry title centered",
                            data["titleJC"] == "center",
                            data["titleJC"],
                        )
                    if data["catBg"]:
                        check(
                            f"{label} category head has blue bg",
                            data["catBg"] not in ("rgba(0, 0, 0, 0)", "transparent"),
                            data["catBg"],
                        )

                # Click smoke once per page at 1440
                if w == 1440:
                    page.evaluate("window.scrollTo(0, 800)")
                    page.wait_for_timeout(150)
                    try:
                        page.click("#back-to-top", timeout=2000)
                        page.wait_for_timeout(250)
                        y = page.evaluate(
                            "() => window.scrollY || document.documentElement.scrollTop"
                        )
                        check(f"{label} back-to-top works", y < 40, f"scrollY={y}")
                    except Exception as e:
                        check(f"{label} back-to-top works", False, str(e))
                    try:
                        page.click("#go-to-bottom", timeout=2000)
                        page.wait_for_timeout(350)
                        y2 = page.evaluate(
                            "() => window.scrollY || document.documentElement.scrollTop"
                        )
                        check(f"{label} go-to-bottom works", y2 > 200, f"scrollY={y2}")
                    except Exception as e:
                        check(f"{label} go-to-bottom works", False, str(e))

                page.close()
        browser.close()


def crumbs_expected(label: str) -> bool:
    return label not in ("home", "home-ky")  # root-ish homes may still have crumbs; check anyway soft


def main() -> int:
    log(f"Birİnci Full Site QA — {datetime.now(timezone.utc).isoformat()}")
    log(f"Root: {ROOT}")
    structural()
    playwright_matrix()
    log("=== Summary ===")
    log(f"FAIL={fails} WARN={warns}")
    log(
        "Manual remaining: physical devices (iOS Safari, Android Chrome, Samsung Internet), "
        "portrait/landscape, and real touch/lang-switcher on hardware."
    )
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    log(f"Wrote {REPORT}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
