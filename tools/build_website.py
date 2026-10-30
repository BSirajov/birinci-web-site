#!/usr/bin/env python3
"""Build the reviewed multilingual site from tracked layouts and Word sources.

Python 3.12+; see build_reviewed_site.py and story-build-manifest.json.
The recovered legacy bytecode is retained only as historical material.
"""
from build_reviewed_site import main

if __name__ == "__main__":
    raise SystemExit(main())
