"""Public publish policy shared by SEO writers and deployment builds."""
from __future__ import annotations

import os
import re
from pathlib import Path

# This exact entry point is deployed by the separate offline project.
# Other same-site URLs, including offline subpages, still require local targets.
SEPARATELY_PUBLISHED_URLS = frozenset({'https://birinci.cloud/offline/'})

# Discoveries is authored in locale trees but omitted from the default public
# publish tree and from the public XML sitemap unless explicitly enabled.
PUBLISH_DISCOVERIES_ENV = "BIRINCI_PUBLISH_DISCOVERIES"

def _audio_controls_enabled() -> bool:
    """The one Listen switch lives in assets/site.js."""
    site_js = Path(__file__).resolve().parents[1] / "assets" / "site.js"
    match = re.search(
        r"const AUDIO_CONTROLS_ENABLED = (true|false)",
        site_js.read_text(encoding="utf-8"),
    )
    return bool(match and match.group(1) == "true")


# Story/article MP3s and audio/ folders are copied into deployment/ only when
# AUDIO_CONTROLS_ENABLED is true in assets/site.js.
OMIT_AUDIO_FROM_PUBLISH = not _audio_controls_enabled()

# Authoring / editorial junk that must never land in deployment/ (basename
# fnmatch patterns for shutil.copytree ignore). Kept here so SEO/docs and the
# deployment builder share one list.
AUTHORING_JUNK_IGNORE_PATTERNS = (
    "_backups",
    "Backup",
    "_reviews",
    "*Comparison_Report*",
    "*_Stories_25.08*",
    "*.zip",
    "desktop.ini",
)


def publish_discoveries_enabled(*, flag: bool | None = None) -> bool:
    """Return whether Discoveries should appear in public SEO / deployment.

    Pass ``flag=True/False`` to override (CLI). Otherwise reads
    ``BIRINCI_PUBLISH_DISCOVERIES`` (1/true/yes/on).
    """
    if flag is not None:
        return bool(flag)
    return os.environ.get(PUBLISH_DISCOVERIES_ENV, "").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }
