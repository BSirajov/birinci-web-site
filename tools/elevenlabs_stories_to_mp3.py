# -*- coding: utf-8 -*-
"""Compatibility wrapper. Prefer tools/optional/elevenlabs_stories_to_mp3.py."""
from pathlib import Path
import runpy

if __name__ == "__main__":
    runpy.run_path(
        str(Path(__file__).resolve().parent / "optional" / "elevenlabs_stories_to_mp3.py"),
        run_name="__main__",
    )
