# -*- coding: utf-8 -*-
"""Generate MP3 narration for stories via Microsoft Edge TTS.

Within each category, voices alternate:
  even index → female (az-AZ-BanuNeural)
  odd index  → male   (az-AZ-BabekNeural)

Examples:
  python tools/generate_story_audio.py --all
  python tools/generate_story_audio.py friend-of-god
  python tools/generate_story_audio.py --all --force
"""
from __future__ import annotations

import argparse
import asyncio
import json
import re
import sys
from pathlib import Path

try:
    import edge_tts
except ImportError as exc:  # pragma: no cover
    raise SystemExit("Install edge-tts first: pip install edge-tts") from exc

ROOT = Path(__file__).resolve().parents[1]
DATA_JSON = ROOT / "az" / "data" / "stories.json"
AUDIO_DIR = ROOT / "az" / "audio"
MANIFEST_JSON = AUDIO_DIR / "manifest.json"

VOICE_FEMALE = "az-AZ-BanuNeural"
VOICE_MALE = "az-AZ-BabekNeural"
MAX_CONCURRENCY = 2
MAX_RETRIES = 8
RETRY_BASE_DELAY = 2.0


def load_categories() -> list[dict]:
    data = json.loads(DATA_JSON.read_text(encoding="utf-8"))
    return list(data.get("categories", []))


def speech_text(story: dict) -> str:
    title = (story.get("title") or "").strip()
    paras = [
        re.sub(r"\s+", " ", p).strip()
        for p in story.get("paragraphs", [])
        if p and str(p).strip()
    ]
    body = " ".join(paras)
    body = (
        body.replace("\u00ad", "")
        .replace("«", "")
        .replace("»", "")
        .replace("„", "")
        .replace("“", "")
        .replace("”", "")
        .replace("‘", "")
        .replace("’", "")
    )
    body = re.sub(r"[—–-]+\s*", "", body)
    body = re.sub(r"\s+", " ", body).strip()
    if not body:
        return title
    if title and body.casefold().startswith(title.casefold()):
        return body
    return f"{title}. {body}" if title else body


def voice_for_index(index: int) -> str:
    return VOICE_FEMALE if index % 2 == 0 else VOICE_MALE


def planned_jobs(stem_filter: set[str] | None) -> list[dict]:
    jobs: list[dict] = []
    for cat in load_categories():
        cat_slug = cat.get("slug") or ""
        for index, story in enumerate(cat.get("stories", [])):
            stem = story.get("stem")
            if not stem:
                continue
            if stem_filter is not None and stem not in stem_filter:
                continue
            jobs.append(
                {
                    "stem": stem,
                    "title": story.get("title") or stem,
                    "category": cat_slug,
                    "index": index,
                    "voice": voice_for_index(index),
                    "text": speech_text(story),
                }
            )
    return jobs


async def synthesize(text: str, out_path: Path, voice: str) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = out_path.with_suffix(".partial.mp3")
    last_err: Exception | None = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(str(tmp_path))
            if not tmp_path.is_file() or tmp_path.stat().st_size < 256:
                raise RuntimeError("TTS produced empty or tiny audio file")
            tmp_path.replace(out_path)
            return
        except Exception as exc:  # noqa: BLE001 - retry network/TTS blips
            last_err = exc
            if tmp_path.exists():
                tmp_path.unlink(missing_ok=True)
            if attempt < MAX_RETRIES:
                delay = RETRY_BASE_DELAY * (2 ** (attempt - 1))
                print(
                    f"  retry {attempt}/{MAX_RETRIES} for {out_path.stem}: {exc} "
                    f"(sleep {delay:.1f}s)",
                    flush=True,
                )
                await asyncio.sleep(delay)
    raise RuntimeError(f"Failed after {MAX_RETRIES} tries: {last_err}")


async def run(jobs: list[dict], force: bool) -> None:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(MAX_CONCURRENCY)
    manifest: dict[str, dict] = {}
    if MANIFEST_JSON.is_file():
        try:
            manifest = json.loads(MANIFEST_JSON.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            manifest = {}

    total = len(jobs)
    done = 0
    skipped = 0
    failed: list[str] = []
    lock = asyncio.Lock()

    async def one(job: dict) -> None:
        nonlocal done, skipped
        stem = job["stem"]
        out = AUDIO_DIR / f"{stem}.mp3"
        voice = job["voice"]

        if out.is_file() and not force:
            existing = manifest.get(stem) or {}
            if existing.get("voice") == voice:
                async with lock:
                    skipped += 1
                    done += 1
                    print(f"[{done}/{total}] skip {stem} ({voice})", flush=True)
                return

        async with sem:
            print(
                f"→ {stem} [{job['category']} #{job['index']+1}] {voice}",
                flush=True,
            )
            try:
                await synthesize(job["text"], out, voice)
            except Exception as exc:  # noqa: BLE001
                async with lock:
                    failed.append(stem)
                    done += 1
                    print(f"[{done}/{total}] FAIL {stem}: {exc}", flush=True)
                return

        size_kb = out.stat().st_size / 1024
        async with lock:
            manifest[stem] = {
                "title": job["title"],
                "category": job["category"],
                "index": job["index"],
                "voice": voice,
                "file": out.name,
                "bytes": out.stat().st_size,
            }
            done += 1
            print(
                f"[{done}/{total}] wrote {out.name} ({size_kb:.1f} KB) {voice}",
                flush=True,
            )

    await asyncio.gather(*(one(job) for job in jobs))

    MANIFEST_JSON.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Done. generated_or_updated={total - skipped - len(failed)} "
        f"skipped={skipped} failed={len(failed)} manifest={MANIFEST_JSON}",
        flush=True,
    )
    if failed:
        raise SystemExit("Failed stems: " + ", ".join(failed))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("stems", nargs="*", help="Story stem(s), e.g. friend-of-god")
    parser.add_argument("--all", action="store_true", help="Generate audio for every story")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate even if an MP3 already exists for that stem/voice",
    )
    args = parser.parse_args()

    if args.all:
        stem_filter = None
    elif args.stems:
        stem_filter = set(args.stems)
    else:
        parser.error("Provide story stem(s) or --all")

    if not DATA_JSON.is_file():
        raise SystemExit(f"Missing {DATA_JSON} — run tools/build_website.py first.")

    jobs = planned_jobs(stem_filter)
    if stem_filter is not None:
        found = {j["stem"] for j in jobs}
        missing = sorted(stem_filter - found)
        if missing:
            raise SystemExit(f"Unknown story stem(s): {', '.join(missing)}")

    print(
        f"Jobs: {len(jobs)}  voices: {VOICE_FEMALE} / {VOICE_MALE} "
        f"(alternating per category)",
        flush=True,
    )
    asyncio.run(run(jobs, force=args.force))


if __name__ == "__main__":
    main()
