# -*- coding: utf-8 -*-
"""Locale catalog parity policy for wisdom stories.

AZ may publish stems that other locales have not received yet. Treat these as
intentional AZ-only catalog entries until translations land — not as sync bugs.
"""
from __future__ import annotations

# Poems / stories published in AZ only (as of 2026-11-19 consistency audit).
AZ_ONLY_STEMS = frozenset(
    {
        "flowers",
        "my-lifes-journey",
        "pandemic-and-quarantine",
        "reflections",
        "time-has-passed",
    }
)


def expected_missing_vs_az(lang: str, stem: str) -> bool:
    """True when *stem* is allowed to be missing outside AZ."""
    return lang != "az" and stem in AZ_ONLY_STEMS
