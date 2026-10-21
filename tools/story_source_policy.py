"""Distinguish compiled Word collections from individual story sources."""
import re
import json
from pathlib import Path
from functools import lru_cache


def _notice_key(text):
    # HTML spans and Word paragraphs may join the two sentences without a space.
    return re.sub(r"\s+", "", str(text)).strip("*").casefold()


@lru_cache(maxsize=1)
def _generic_notices():
    locales = Path(__file__).resolve().parent / "locales"
    return {_notice_key(json.loads((locales / f"{lang}.json").read_text(encoding="utf-8"))["ui"]["story_source"])
            for lang in ("az", "en", "ru", "ky", "de")}


def is_generic_story_notice(text):
    """Match only the complete standard internet/AI notice, not specific credits."""
    return _notice_key(text) in _generic_notices()


def visible_story_paragraphs(paragraphs):
    return [p for p in paragraphs if not is_generic_story_notice(p)]


def is_story_collection(path):
    stem = re.sub(r"[ _-]+", "-", path.stem.casefold())
    return "combined" in stem or stem.endswith("-stories-collection")
