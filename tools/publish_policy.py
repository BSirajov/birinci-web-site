"""Public publish policy shared by SEO writers and deployment builds."""
from __future__ import annotations

import os

# Discoveries is authored in locale trees but omitted from the default public
# publish tree and from the public XML sitemap unless explicitly enabled.
PUBLISH_DISCOVERIES_ENV = "BIRINCI_PUBLISH_DISCOVERIES"


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
