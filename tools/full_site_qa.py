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

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "tools" / "_qa_report.txt"
LANGS = ("az", "en", "ru", "ky")
WIDTHS = (360, 390, 768, 1024, 1440)
if str(ROOT / "tools") not in sys.path:
    sys.path.insert(0, str(ROOT / "tools"))
from chrome_restore import (  # noqa: E402
    KNOWN_ASSET_STAMPS,
    SITE_ASSET_VERSION,
    SITE_CHROME_ASSET_VERSION,
)

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


_V_QUERY_RE = re.compile(r"\?v=[^\"')\s]+")


def asset_fingerprint(path: Path) -> str:
    """Hash shared assets, ignoring publish-time CSS image ?v= restamps and newlines."""
    data = path.read_bytes()
    if path.suffix.lower() in {".css", ".js"}:
        text = data.decode("utf-8").replace("\r\n", "\n")
        if path.suffix.lower() == ".css":
            text = _V_QUERY_RE.sub("", text)
        data = text.encode("utf-8")
    return hashlib.sha256(data).hexdigest()[:16]


def structural() -> None:
    log("=== Structural / cache / deploy ===")
    builder = ROOT / "tools" / "build_website.py"
    check("build_website.py entrypoint present", builder.is_file(), str(builder.relative_to(ROOT)))
    # *.pyc is gitignored; CI never has tools/_bytecode_backup/*.pyc. Structural QA
    # does not invoke the CPython 3.14 bytecode builder.
    pyc = ROOT / "tools" / "_bytecode_backup" / "build_website.cpython-314.pyc"
    if pyc.is_file():
        log(f"[PASS] local CPython 3.14 bytecode backup present — {pyc.relative_to(ROOT)}")
    else:
        log("[SKIP] CPython 3.14 bytecode backup (*.pyc gitignored; not required for Site QA)")

    # Stylesheet/script cache-bust under /assets/. Different families may use
    # different stamps (site chrome vs inventions vs illustrations).
    asset_ref_re = re.compile(
        r"""(?:href|src)=["']([^"']*?/assets/[^"'?]*\.(?:css|js))(\?[^"']*)?["']""",
        re.I,
    )
    skip_unstamped = {"force-local-http.js"}
    versions: Counter[str] = Counter()
    missing_v: list[str] = []
    empty_v: list[str] = []
    unknown_v: list[str] = []
    basename_conflicts: list[str] = []
    chrome_stamps: dict[str, set[str]] = {"site.css": set(), "site.js": set()}
    pages_with_assets = 0

    def scan_html(rel: str, text: str) -> None:
        nonlocal pages_with_assets
        by_base: dict[str, set[str]] = {}
        saw_asset = False
        for match in asset_ref_re.finditer(text):
            url = match.group(1)
            query = match.group(2) or ""
            base = url.rsplit("/", 1)[-1]
            saw_asset = True
            vm = re.search(r"[?&]v=([^&]*)", query)
            stamp = vm.group(1).strip() if vm else ""
            if base in skip_unstamped:
                continue
            loc = f"{rel}:{base}"
            if not query or "v=" not in query:
                missing_v.append(loc)
                continue
            if not stamp:
                empty_v.append(loc)
                continue
            versions[stamp] += 1
            by_base.setdefault(base, set()).add(stamp)
            if stamp not in KNOWN_ASSET_STAMPS:
                unknown_v.append(f"{loc}?v={stamp}")
            if base in chrome_stamps:
                chrome_stamps[base].add(stamp)
        if saw_asset:
            pages_with_assets += 1
        for base, stamps in by_base.items():
            if len(stamps) > 1:
                basename_conflicts.append(f"{rel}:{base}={sorted(stamps)}")

    for lang in LANGS:
        for p in (ROOT / lang).rglob("*.html"):
            scan_html(str(p.relative_to(ROOT)), p.read_text(encoding="utf-8", errors="replace"))
    if (ROOT / "index.html").exists():
        scan_html("index.html", (ROOT / "index.html").read_text(encoding="utf-8"))
    not_found = ROOT / "404.html"
    if not_found.exists():
        nf_text = not_found.read_text(encoding="utf-8")
        scan_html("404.html", nf_text)
        nf_site = set(
            re.findall(
                r"""/assets/site\.css\?v=([^"'&\s]+)""",
                nf_text,
                flags=re.I,
            )
        )
        check(
            "404.html site.css uses current site chrome stamp",
            nf_site == {SITE_CHROME_ASSET_VERSION},
            str(sorted(nf_site)),
        )

    top = versions.most_common(8)
    log(f"Asset CSS/JS ?v= frequency (top): {top}")
    check(
        "CSS/JS /assets/ refs have ?v= (except local-only force-local-http.js)",
        not missing_v,
        f"{len(missing_v)} missing: {missing_v[:8]}" if missing_v else f"ok ({pages_with_assets} pages)",
    )
    check(
        "CSS/JS ?v= is non-empty",
        not empty_v,
        f"{len(empty_v)} empty: {empty_v[:8]}" if empty_v else "ok",
    )
    check(
        "CSS/JS ?v= stamps are on the known allowlist",
        not unknown_v,
        f"{len(unknown_v)} unknown: {unknown_v[:8]}" if unknown_v else f"ok ({len(KNOWN_ASSET_STAMPS)} allowed)",
    )
    check(
        "same CSS/JS basename is not mixed on one page",
        not basename_conflicts,
        f"{len(basename_conflicts)}: {basename_conflicts[:8]}" if basename_conflicts else "ok",
    )
    mixed_chrome = {
        name: sorted(stamps)
        for name, stamps in chrome_stamps.items()
        if stamps and stamps != {SITE_CHROME_ASSET_VERSION}
    }
    check(
        "shared site.css/site.js use one chrome stamp",
        not mixed_chrome,
        str(mixed_chrome) if mixed_chrome else SITE_CHROME_ASSET_VERSION,
    )
    check(
        "Default inventions/search stamp is current SITE_ASSET_VERSION",
        bool(top) and SITE_ASSET_VERSION in versions,
        str(top[:3]),
    )

    # Critical shared assets: live vs deployment (deployment/ is gitignored;
    # CI rebuilds it before this script. Local runs without a publish tree skip.)
    critical = [
        "assets/site.css",
        "assets/site.js",
        "assets/inventions/kt-inventions.css",
        "assets/inventions/inventions-bridge.css",
        "assets/inventions/kt-tokens.css",
    ]
    deploy_root = ROOT / "deployment"
    if not deploy_root.is_dir():
        warn(
            "deployment/ missing — skip publish-tree hash checks "
            "(run: python tools/build_deployment.py)"
        )
    else:
        for rel in critical:
            src = ROOT / rel
            dep = deploy_root / rel
            if not src.exists():
                check(f"Source exists {rel}", False)
                continue
            if not dep.exists():
                check(f"Deployment mirror exists {rel}", False)
                continue
            check(
                f"deployment matches {rel}",
                asset_fingerprint(src) == asset_fingerprint(dep),
                f"src={asset_fingerprint(src)} dep={asset_fingerprint(dep)}",
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

    css_url_re = re.compile(r"""url\(["']?([^"')]+)["']?\)""")
    missing_css_urls = []
    for css_path in (
        ROOT / "assets" / "site.css",
        ROOT / "assets" / "inventions" / "inventions-bridge.css",
    ):
        text = css_path.read_text(encoding="utf-8")
        for raw in css_url_re.findall(text):
            if raw.startswith(("http://", "https://", "data:", "fonts.css")):
                continue
            dest = (css_path.parent / raw.split("?")[0]).resolve()
            if dest.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".svg", ".woff2"} and not dest.exists():
                missing_css_urls.append(f"{css_path.name}:{raw}")
    check("CSS image/font urls resolve on disk", not missing_css_urls, str(missing_css_urls[:8]))

    # Public XML sitemap must match default Discoveries publish policy
    from publish_policy import publish_discoveries_enabled  # noqa: E402

    sm = ROOT / "sitemap.xml"
    if sm.is_file():
        sm_text = sm.read_text(encoding="utf-8", errors="replace")
        disc_locs = len(re.findall(r"/discoveries/", sm_text))
        want_disc = publish_discoveries_enabled()
        check(
            "repo sitemap.xml Discoveries locs match publish policy",
            (disc_locs > 0) == want_disc,
            f"discoveries_locs={disc_locs} publish_discoveries={want_disc}",
        )
        dep_sm = ROOT / "deployment" / "sitemap.xml"
        if dep_sm.is_file():
            dep_disc = len(re.findall(r"/discoveries/", dep_sm.read_text(encoding="utf-8", errors="replace")))
            check(
                "deployment sitemap.xml Discoveries locs match publish policy",
                (dep_disc > 0) == want_disc,
                f"discoveries_locs={dep_disc} publish_discoveries={want_disc}",
            )

    # Per-locale i18n.js must exist (KY previously vanished when truncated
    # locale site.js stubs had no extractable i18n blob).
    for lang in LANGS:
        i18n = ROOT / lang / "assets" / "i18n.js"
        ok = i18n.is_file() and i18n.stat().st_size > 32
        blob_ok = False
        if ok:
            text = i18n.read_text(encoding="utf-8", errors="replace")
            blob_ok = f'"lang": "{lang}"' in text or f'"lang":"{lang}"' in text
        check(
            f"{lang}/assets/i18n.js present with matching lang",
            ok and blob_ok,
            f"exists={i18n.is_file()} size={i18n.stat().st_size if i18n.is_file() else 0} lang_marker={blob_ok}",
        )
        stub = ROOT / lang / "assets" / "site.js"
        check(
            f"{lang}/assets/site.js stub absent (use shared /assets/site.js)",
            not stub.is_file(),
            f"path={stub}",
        )

    # translation_manifest audio_* must match MP3s on disk
    import json
    from i18n_config import story_audio_dir  # noqa: E402

    man_path = ROOT / "docs" / "i18n" / "translation_manifest.json"
    if man_path.is_file():
        stems = (json.loads(man_path.read_text(encoding="utf-8")).get("stems") or {})
        drift = []
        for stem, entry in stems.items():
            for lang in LANGS:
                key = f"audio_{lang}"
                marked = entry.get(key) == "done"
                on_disk = (story_audio_dir(lang) / f"{stem}.mp3").is_file()
                if marked != on_disk:
                    drift.append(f"{stem}:{lang}:manifest={'done' if marked else 'pending'} disk={'yes' if on_disk else 'no'}")
        check(
            "translation_manifest audio flags match story MP3s on disk",
            not drift,
            f"drifts={len(drift)} sample={drift[:5]}",
        )

    # Footer structure parity: linked logo + hidden phone/address stubs
    for lang in LANGS:
        home = ROOT / lang / "index.html"
        if not home.is_file():
            continue
        ft = home.read_text(encoding="utf-8", errors="replace")
        fm = re.search(r"<footer\b[\s\S]*?</footer>", ft, re.I)
        footer = fm.group(0) if fm else ""
        check(
            f"{lang} footer logo is home link",
            bool(re.search(r'<a class="footer-logo" href="[^"]*index\.html"', footer)),
        )
        check(
            f"{lang} footer has phone+address stubs and website+email links",
            all(
                s in footer
                for s in (
                    "menu-icon--phone",
                    "menu-icon--map-pin",
                    "menu-icon--website",
                    "mailto:info@birinci.cloud",
                )
            ),
        )

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
        ".page-jump keeps position:fixed",
        bool(re.search(r"\.page-jump\s*\{[^}]*position:\s*fixed", site, re.S)),
    )
    check(
        "story body uses --font-body token",
        bool(
            re.search(
                r"\.story__text,\s*\.story \.card-text\s*\{[^}]*font-family:\s*var\(--font-body\)",
                site,
                re.S,
            )
        ),
    )
    check(
        "story body color uses --ink-soft",
        bool(
            re.search(
                r"\.story__text,\s*\.story \.card-text\s*\{[^}]*color:\s*var\(--ink-soft\)",
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
                      const catCs = catHead && getComputedStyle(catHead);
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
                        catAlign: catCs && catCs.textAlign,
                        catBg: catCs && catCs.backgroundColor,
                        catColor: catCs && catCs.color,
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
                        "story body uses ink-soft color",
                        data["storyColor"] in ("rgb(52, 95, 134)", "rgba(52, 95, 134, 1)"),
                        data["storyColor"],
                    )
                    check(
                        "story body uses Source Serif 4",
                        "Source Serif 4" in (data["storyFont"] or ""),
                        data["storyFont"],
                    )
                    if data["storyLH"] and data["storyFS"]:
                        ratio = float(data["storyLH"].replace("px", "")) / float(
                            data["storyFS"].replace("px", "")
                        )
                        check(
                            "story line-height ~1.55",
                            1.50 <= ratio <= 1.60,
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
                    if data["catColor"]:
                        check(
                            f"{label} category head uses brand blue text",
                            data["catColor"]
                            in (
                                "rgb(0, 105, 180)",
                                "rgb(0, 90, 154)",
                                "rgb(6, 49, 78)",  # --blue-900 on soft panel
                            ),
                            data["catColor"],
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


def main(argv: list[str] | None = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--structural",
        action="store_true",
        help="Run filesystem/SEO/chrome checks only (skip Playwright matrix). Preferred for CI.",
    )
    args = parser.parse_args(argv)

    if sys.platform == "win32":
        for stream in (sys.stdout, sys.stderr):
            try:
                stream.reconfigure(encoding="utf-8")
            except Exception:
                pass
    log(f"Birİnci Full Site QA — {datetime.now(timezone.utc).isoformat()}")
    log(f"Root: {ROOT}")
    if args.structural:
        log("Mode: structural only (Playwright skipped)")
    structural()
    if not args.structural:
        playwright_matrix()
    else:
        log("=== Playwright matrix ===")
        log("[SKIP] Playwright matrix (--structural)")
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
