"""Public publish policy shared by SEO writers and deployment builds."""
from __future__ import annotations

import os

# Discoveries is authored in locale trees but omitted from the default public
# publish tree and from the public XML sitemap unless explicitly enabled.
PUBLISH_DISCOVERIES_ENV = "BIRINCI_PUBLISH_DISCOVERIES"

# Story/article MP3s and audio/ folders stay in locale trees for local
# development and testing, but build_deployment.py never copies them into
# deployment/ while listen UI remains off (AUDIO_CONTROLS_ENABLED=false).
# Re-enable publish only after stories/articles reach professional quality
# and audio controls are turned back on — then drop audio from IGNORE_PUBLISH
# in tools/build_deployment.py (and flip this flag).
OMIT_AUDIO_FROM_PUBLISH = True

# Authoring / editorial junk that must never land in deployment/ (basename
# fnmatch patterns for shutil.copytree ignore). Kept here so SEO/docs and the
# deployment builder share one list.
AUTHORING_JUNK_IGNORE_PATTERNS = (
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
