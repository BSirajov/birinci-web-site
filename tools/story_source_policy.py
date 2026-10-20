"""Distinguish compiled Word collections from individual story sources."""
import re


def is_story_collection(path):
    stem = re.sub(r"[ _-]+", "-", path.stem.casefold())
    return "combined" in stem or stem.endswith("-stories-collection")
