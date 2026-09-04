#!/usr/bin/env python3
"""Build website entrypoint.

Loads the recovered inventions-aware bytecode (Python 3.14), then applies a
small maintainable overlay so day-to-day chrome/version policy lives in source.

Full readable source restore is blocked by incomplete decompilation of the
embedded CSS/JS string constants; do not replace this file with
tools/_pyc_recover_out/build_website.py (syntax-broken).
"""
from __future__ import annotations

import marshal
import re
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
_SITE_ROOT = _HERE.parent
_CANDIDATES = [
    _HERE / "_bytecode_backup" / "build_website.cpython-314.pyc",
    _HERE / "__pycache__" / "build_website.cpython-314.pyc",
]

# SITE_ASSET_VERSION is imported from chrome_restore
_VERSION_RE = re.compile(r"(\?v=)2026\d{4}[a-zA-Z0-9]*")

if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))
from chrome_restore import (  # noqa: E402
    DISABLE_DISCOVERY_VIDEOS,
    SITE_ASSET_VERSION,
    apply_shared_assets,
    install_resilient_path_writes,
    patch_emitted_html,
    write_root_home,
)
from i18n_config import (  # noqa: E402
    story_audio_dir,
    story_illustrations_dir,
    story_sources,
)


def _require_build_prereqs() -> None:
    """Fail fast if the recovered 3.14 bytecode (or matching Python) is missing."""
    if sys.version_info[:2] != (3, 14):
        raise SystemExit(
            "build_website requires Python 3.14 "
            f"(found {sys.version_info.major}.{sys.version_info.minor}). "
            "The recovered builder is CPython 3.14 bytecode under "
            "tools/_bytecode_backup/."
        )
    if not any(pyc.is_file() for pyc in _CANDIDATES):
        raise FileNotFoundError(
            "Missing build_website bytecode backup under tools/_bytecode_backup "
            "(expected build_website.cpython-314.pyc)."
        )


def _bootstrap() -> None:
    _require_build_prereqs()
    for pyc in _CANDIDATES:
        if not pyc.is_file():
            continue
        code = marshal.loads(pyc.read_bytes()[16:])
        g = globals()
        g["__file__"] = str((_HERE / "build_website.py").resolve())
        # Prevent bytecode's own ``if __name__ == "__main__"`` from running
        # main() before our overlay is installed.
        saved_name = g.get("__name__", "__main__")
        g["__name__"] = "_birinci_build_bytecode"
        try:
            exec(code, g)
        finally:
            g["__name__"] = saved_name
        return
    raise FileNotFoundError(
        "Missing build_website bytecode backup under tools/_bytecode_backup"
    )


def _pin_asset_versions(html: str) -> str:
    return _VERSION_RE.sub(rf"\g<1>{SITE_ASSET_VERSION}", html)


def _apply_overlay() -> None:
    """Pin asset versions; restore chrome; keep Discovery videos off."""
    global ASSET_VERSION, page_shell, build_inventions_page, sync_shared_assets  # noqa: PLW0603
    global write_root_language_gate, apply_locale, build_landing, build_category_page  # noqa: PLW0603
    global LOCALE_ASSET_FILES, build_one_locale, prune_locale_assets  # noqa: PLW0603

    ASSET_VERSION = SITE_ASSET_VERSION

    # Bytecode kept locale site.js and pruned away i18n.js. Shared runtime uses
    # /assets/site.js + per-lang assets/i18n.js instead.
    LOCALE_ASSET_FILES = frozenset({"search-index.js", "stories-data.js", "i18n.js"})

    _orig_shell = page_shell  # type: ignore[name-defined]
    _orig_inventions = build_inventions_page  # type: ignore[name-defined]
    _orig_sync = sync_shared_assets  # type: ignore[name-defined]
    _orig_gate = write_root_language_gate  # type: ignore[name-defined]
    _orig_apply = apply_locale  # type: ignore[name-defined]
    _orig_landing = build_landing  # type: ignore[name-defined]
    _orig_category = build_category_page  # type: ignore[name-defined]
    _orig_build_one = build_one_locale  # type: ignore[name-defined]
    _orig_prune = prune_locale_assets  # type: ignore[name-defined]

    def prune_locale_assets_overlay():  # type: ignore[no-untyped-def]
        _orig_prune()
        # Belt-and-suspenders: never leave a locale site.js stub behind.
        lang = LANG  # type: ignore[name-defined]
        stub = _SITE_ROOT / lang / "assets" / "site.js"
        if stub.is_file():
            stub.unlink()

    def build_one_locale_overlay(*args, **kwargs):  # type: ignore[no-untyped-def]
        result = _orig_build_one(*args, **kwargs)
        # After bytecode writes/prunes locale assets, restore i18n.js and scrub stubs.
        apply_shared_assets()
        return result

    def apply_locale_overlay(lang):  # type: ignore[no-untyped-def]
        global STORIES, ILLUSTRATIONS, AUDIO_DIR  # noqa: PLW0603
        _orig_apply(lang)
        STORIES = story_sources(lang)
        ILLUSTRATIONS = story_illustrations_dir(lang)
        AUDIO_DIR = story_audio_dir(lang)

    def page_shell_overlay(*args, **kwargs):  # type: ignore[no-untyped-def]
        html = _pin_asset_versions(_orig_shell(*args, **kwargs))
        lang = LANG  # type: ignore[name-defined]
        return patch_emitted_html(html, lang, inventions=False)

    def build_landing_overlay(*args, **kwargs):  # type: ignore[no-untyped-def]
        html = _orig_landing(*args, **kwargs)
        if not html:
            return html
        lang = LANG  # type: ignore[name-defined]
        # Landing may add toolkit CSS after page_shell; re-apply chrome so
        # category headers/chevrons get kt-inventions.css.
        return patch_emitted_html(_pin_asset_versions(html), lang, inventions=False)

    def build_category_page_overlay(*args, **kwargs):  # type: ignore[no-untyped-def]
        html = _orig_category(*args, **kwargs)
        if not html:
            return html
        lang = LANG  # type: ignore[name-defined]
        cat = args[0] if args else None
        slug = ""
        if isinstance(cat, dict):
            slug = str(cat.get("slug") or "").strip()
        elif cat is not None:
            slug = str(getattr(cat, "slug", "") or "").strip()
            if not slug and hasattr(cat, "get"):
                try:
                    slug = str(cat.get("slug") or "").strip()
                except Exception:
                    slug = ""
        rel = (
            f"{lang}/categories/{slug}.html"
            if slug
            else f"{lang}/categories/index.html"
        )
        return patch_emitted_html(
            _pin_asset_versions(html), lang, inventions=False, rel_path=rel
        )

    def build_inventions_page_overlay():  # type: ignore[no-untyped-def]
        html = _orig_inventions()
        if not html:
            return html
        html = _pin_asset_versions(html)
        lang = LANG  # type: ignore[name-defined]
        return patch_emitted_html(html, lang, inventions=True)

    def sync_shared_assets_overlay(*args, **kwargs):  # type: ignore[no-untyped-def]
        # Bytecode sync emits a truncated site.js/css. Snapshot full sources first
        # so Wisdom list-view Kateqoriya filter and toolbar chrome survive rebuilds.
        assets = _SITE_ROOT / "assets"
        js_path = assets / "site.js"
        css_path = assets / "site.css"
        js_keep = ""
        css_keep = ""
        if js_path.is_file():
            candidate = js_path.read_text(encoding="utf-8")
            if "bindStoryCategoryFilter" in candidate and "initHomeTools" in candidate:
                js_keep = candidate
        if css_path.is_file():
            candidate = css_path.read_text(encoding="utf-8")
            if "tools-bar__search-row" in candidate and "tools-bar__field--filter" in candidate:
                css_keep = candidate

        result = _orig_sync(*args, **kwargs)

        if js_keep and js_path.is_file():
            wiped = js_path.read_text(encoding="utf-8")
            if "bindStoryCategoryFilter" not in wiped:
                js_path.write_text(js_keep, encoding="utf-8")
        # Drop locale site.js stubs — category pages historically loaded these
        # via a one-level-too-shallow ../assets/site.js and missed shared runtime.
        for lang in ("az", "en", "ru", "ky"):
            stub = _SITE_ROOT / lang / "assets" / "site.js"
            if stub.is_file():
                stub.unlink()

        if css_keep and css_path.is_file():
            wiped = css_path.read_text(encoding="utf-8")
            if "tools-bar__search-row" not in wiped or "tools-bar__field--filter" not in wiped:
                css_path.write_text(css_keep, encoding="utf-8")

        # Always regenerate per-lang i18n.js (and scrub any stub recreated mid-sync).
        apply_shared_assets()
        return result

    def write_root_language_gate_overlay():  # type: ignore[no-untyped-def]
        _orig_gate()
        write_root_home()

    apply_locale = apply_locale_overlay  # type: ignore[name-defined]
    page_shell = page_shell_overlay  # type: ignore[name-defined]
    build_landing = build_landing_overlay  # type: ignore[name-defined]
    build_category_page = build_category_page_overlay  # type: ignore[name-defined]
    build_inventions_page = build_inventions_page_overlay  # type: ignore[name-defined]
    sync_shared_assets = sync_shared_assets_overlay  # type: ignore[name-defined]
    write_root_language_gate = write_root_language_gate_overlay  # type: ignore[name-defined]
    prune_locale_assets = prune_locale_assets_overlay  # type: ignore[name-defined]
    build_one_locale = build_one_locale_overlay  # type: ignore[name-defined]

    _ = DISABLE_DISCOVERY_VIDEOS


_bootstrap()
_apply_overlay()
# Install early so every locale HTML write (bytecode + overlays) retries on
# transient Windows OSError Errno 22 / AV file locks (QA-104).
install_resilient_path_writes()

if __name__ == "__main__":
    main()  # noqa: F821 — provided by recovered bytecode
