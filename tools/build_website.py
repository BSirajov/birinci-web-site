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
    patch_emitted_html,
    write_root_home,
)
from i18n_config import (  # noqa: E402
    story_audio_dir,
    story_illustrations_dir,
    story_sources,
)


def _bootstrap() -> None:
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
    global write_root_language_gate, apply_locale  # noqa: PLW0603

    ASSET_VERSION = SITE_ASSET_VERSION

    _orig_shell = page_shell  # type: ignore[name-defined]
    _orig_inventions = build_inventions_page  # type: ignore[name-defined]
    _orig_sync = sync_shared_assets  # type: ignore[name-defined]
    _orig_gate = write_root_language_gate  # type: ignore[name-defined]
    _orig_apply = apply_locale  # type: ignore[name-defined]

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

    def build_inventions_page_overlay():  # type: ignore[no-untyped-def]
        html = _orig_inventions()
        if not html:
            return html
        html = _pin_asset_versions(html)
        lang = LANG  # type: ignore[name-defined]
        return patch_emitted_html(html, lang, inventions=True)

    def sync_shared_assets_overlay(*args, **kwargs):  # type: ignore[no-untyped-def]
        result = _orig_sync(*args, **kwargs)
        apply_shared_assets()
        return result

    def write_root_language_gate_overlay():  # type: ignore[no-untyped-def]
        _orig_gate()
        write_root_home()

    apply_locale = apply_locale_overlay  # type: ignore[name-defined]
    page_shell = page_shell_overlay  # type: ignore[name-defined]
    build_inventions_page = build_inventions_page_overlay  # type: ignore[name-defined]
    sync_shared_assets = sync_shared_assets_overlay  # type: ignore[name-defined]
    write_root_language_gate = write_root_language_gate_overlay  # type: ignore[name-defined]

    _ = DISABLE_DISCOVERY_VIDEOS


_bootstrap()
_apply_overlay()

if __name__ == "__main__":
    main()  # noqa: F821 — provided by recovered bytecode
