#!/usr/bin/env python3
"""Write the public footer build stamp (not the cache-busting asset ?v= pin)."""
from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILD_INFO_NAME = "build-info.json"
TZ_NAME = "Europe/Berlin"


def local_now() -> datetime:
    try:
        from zoneinfo import ZoneInfo

        return datetime.now(ZoneInfo(TZ_NAME))
    except Exception:
        return datetime.now().astimezone()


def format_offset(dt: datetime) -> str:
    raw = dt.strftime("%z") or ""
    if len(raw) == 5:
        return f"{raw[:3]}:{raw[3:]}"
    return raw or "+00:00"


def make_build_info(now: datetime | None = None) -> dict[str, str]:
    now = now or local_now()
    return {
        "id": now.strftime("%Y%m%d-%H%M"),
        "builtAt": f"{now.strftime('%Y-%m-%d %H:%M')} {format_offset(now)}",
        "tz": str(now.tzname() or TZ_NAME),
    }


def write_build_info(
    dest_dir: Path | None = None, now: datetime | None = None
) -> Path:
    dest = (dest_dir or (ROOT / "assets")) / BUILD_INFO_NAME
    dest.parent.mkdir(parents=True, exist_ok=True)
    payload = make_build_info(now)
    dest.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    return dest


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dir",
        type=Path,
        default=None,
        help="Directory for build-info.json (default: repo assets/)",
    )
    args = parser.parse_args()
    path = write_build_info(args.dir)
    print(f"build-info: {path}")


if __name__ == "__main__":
    main()
