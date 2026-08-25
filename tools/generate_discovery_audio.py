# -*- coding: utf-8 -*-
"""Generate MP3 narration for Azerbaijani Discoveries articles via Edge TTS.

Output lives in az/discovery-articles/audio/ (separate from Wisdom Stories audio).
Filenames match article ids, e.g. controlled-use-of-fire.mp3.

Examples:
  python tools/generate_discovery_audio.py --smoke
  python tools/generate_discovery_audio.py --all
  python tools/generate_discovery_audio.py controlled-use-of-fire --force
"""
from __future__ import annotations

import argparse
import asyncio
import json
import re
import sys
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from generate_story_audio import (  # noqa: E402
    DEFAULT_VOICE,
    PROSODY_VERSION,
    clean_speech_chunk,
    synthesize_story,
)
from i18n_config import discovery_audio_dir  # noqa: E402

PAGE = ROOT / "az" / "discoveries" / "discoveries-and-inventions.html"
AUDIO_DIR = discovery_audio_dir("az")
MANIFEST_JSON = AUDIO_DIR / "manifest.json"
VOICE = DEFAULT_VOICE

_ARTICLE_RE = re.compile(
    r'<article\b(?=[^>]*\binventions-entry\b)[^>]*\bid="([^"]+)"[^>]*>(.*?)</article>',
    re.I | re.S,
)
_NAME_RE = re.compile(
    r'<span\b[^>]*\binventions-entry-name\b[^>]*>(.*?)</span>',
    re.I | re.S,
)
_SUMMARY_RE = re.compile(
    r'<p\b[^>]*\binventions-entry-visual-summary\b[^>]*>(.*?)</p>',
    re.I | re.S,
)
_FACT_RE = re.compile(r"<li\b[^>]*>(.*?)</li>", re.I | re.S)
_SECTION_RE = re.compile(
    r'<div\b[^>]*\binventions-entry-section\b[^>]*>(.*?)</div>',
    re.I | re.S,
)
_H3_RE = re.compile(r"<h3\b[^>]*>(.*?)</h3>", re.I | re.S)
_P_RE = re.compile(r"<p\b[^>]*>(.*?)</p>", re.I | re.S)
_KEY_FACTS_RE = re.compile(
    r'<div\b[^>]*\binventions-key-facts\b[^>]*>(.*?)</div>',
    re.I | re.S,
)
_TAG_RE = re.compile(r"<[^>]+>")
_ARTICLE_OPEN_RE = re.compile(
    r'(<article\b(?=[^>]*\binventions-entry\b)[^>]*\bid=")([^"]+)("[^>]*)(>)',
    re.I,
)


def _asset_version() -> str:
    try:
        from chrome_restore import SITE_ASSET_VERSION

        return str(SITE_ASSET_VERSION)
    except Exception:
        return "20260823v"


def strip_tags(html: str) -> str:
    text = _TAG_RE.sub(" ", html or "")
    return clean_speech_chunk(unescape(text))


def chunk_text(text: str, max_len: int = 420) -> list[str]:
    rest = clean_speech_chunk(text)
    chunks: list[str] = []
    while len(rest) > max_len:
        slice_ = rest[:max_len]
        cut = max(slice_.rfind(". "), slice_.rfind("? "), slice_.rfind("! "), slice_.rfind(" "))
        if cut < 80:
            cut = max_len
        chunks.append(rest[: cut + 1].strip())
        rest = rest[cut + 1 :].strip()
    if rest:
        chunks.append(rest)
    return chunks


def speech_parts(inner: str) -> list[tuple[str, str]]:
    """Return (role, text) parts matching the on-page Listen reader."""
    parts: list[tuple[str, str]] = []
    name_m = _NAME_RE.search(inner)
    title = strip_tags(name_m.group(1)) if name_m else ""
    if title:
        parts.append(("title", title))

    sum_m = _SUMMARY_RE.search(inner)
    if sum_m:
        summary = strip_tags(sum_m.group(1))
        if summary:
            parts.append(("narrative", summary))

    facts_m = _KEY_FACTS_RE.search(inner)
    if facts_m:
        for li in _FACT_RE.findall(facts_m.group(1)):
            fact = strip_tags(li)
            if fact:
                parts.append(("narrative", fact))

    for section in _SECTION_RE.findall(inner):
        heading_m = _H3_RE.search(section)
        if heading_m:
            heading = strip_tags(heading_m.group(1))
            if heading:
                parts.append(("title", heading))
        for para in _P_RE.findall(section):
            sent = strip_tags(para)
            if sent:
                parts.append(("narrative", sent))
    return parts


def article_segments(inner: str) -> list[dict]:
    segments: list[dict] = []
    for role, text in speech_parts(inner):
        chunks = chunk_text(text)
        for i, chunk in enumerate(chunks):
            last = i == len(chunks) - 1
            pause = "medium" if last and role == "title" else "short"
            segments.append(
                {
                    "role": role,
                    "voice_role": "narrator",
                    "text": chunk,
                    "pause_after": pause,
                    "pause_ms": 400 if pause == "short" else 600,
                }
            )
    if segments:
        segments[-1]["pause_after"] = "none"
        segments[-1]["pause_ms"] = 0
    return segments


def load_articles(html: str | None = None) -> list[dict]:
    markup = html if html is not None else PAGE.read_text(encoding="utf-8")
    articles: list[dict] = []
    for stem, inner in _ARTICLE_RE.findall(markup):
        name_m = _NAME_RE.search(inner)
        title = strip_tags(name_m.group(1)) if name_m else stem
        segments = article_segments(inner)
        articles.append(
            {
                "stem": stem,
                "title": title,
                "segments": segments,
                "chars": sum(len(seg["text"]) for seg in segments),
            }
        )
    return articles


def existing_stems() -> set[str]:
    if not AUDIO_DIR.is_dir():
        return set()
    return {path.stem for path in AUDIO_DIR.glob("*.mp3")}


def link_discovery_audio(html_path: Path | None = None) -> int:
    path = html_path or PAGE
    raw = path.read_text(encoding="utf-8")
    stems = existing_stems()
    version = _asset_version()

    def repl(match: re.Match[str]) -> str:
        prefix, stem, mid, close = match.groups()
        tag = match.group(0)
        if stem not in stems:
            return re.sub(r'\s+data-audio="[^"]*"', "", tag)
        attr = f' data-audio="../discovery-articles/audio/{stem}.mp3?v={version}"'
        if "data-audio=" in tag:
            return re.sub(r'\s+data-audio="[^"]*"', attr, tag)
        return prefix + stem + mid + attr + close

    new = _ARTICLE_OPEN_RE.sub(repl, raw)
    if new != raw:
        path.write_text(new, encoding="utf-8")
        return 1
    return 0


def load_manifest() -> dict:
    if not MANIFEST_JSON.is_file():
        return {}
    try:
        data = json.loads(MANIFEST_JSON.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


async def run(jobs: list[dict], force: bool) -> None:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    manifest = load_manifest()
    total = len(jobs)
    done = 0
    skipped = 0
    failed: list[str] = []

    for job in jobs:
        stem = job["stem"]
        out = AUDIO_DIR / f"{stem}.mp3"
        done += 1
        if out.is_file() and not force:
            existing = manifest.get(stem) or {}
            if existing.get("voice") == VOICE and existing.get("prosody") == PROSODY_VERSION:
                skipped += 1
                print(f"[{done}/{total}] skip {stem}", flush=True)
                continue
        print(
            f"-> {stem} ({job['title']}) chars={job['chars']} segs={len(job['segments'])}",
            flush=True,
        )
        try:
            join_note = await synthesize_story(
                job["segments"],
                out,
                VOICE,
                stem=stem,
                single_voice=True,
            )
        except Exception as exc:  # noqa: BLE001
            failed.append(stem)
            print(f"[{done}/{total}] FAIL {stem}: {exc}", flush=True)
            await asyncio.sleep(2.0)
            continue
        manifest[stem] = {
            "title": job["title"],
            "voice": VOICE,
            "prosody": PROSODY_VERSION,
            "file": out.name,
            "bytes": out.stat().st_size,
            "chars": job["chars"],
            "segments": len(job["segments"]),
            "join": join_note,
        }
        MANIFEST_JSON.write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        link_discovery_audio()
        print(
            f"[{done}/{total}] wrote {out} ({out.stat().st_size / 1024:.1f} KB) {join_note}",
            flush=True,
        )
        await asyncio.sleep(0.35)

    MANIFEST_JSON.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    linked = link_discovery_audio()
    print(
        f"Done. jobs={total} skipped={skipped} failed={len(failed)} "
        f"linked_page={linked} dest={AUDIO_DIR}",
        flush=True,
    )
    if failed:
        raise SystemExit("Failed stems: " + ", ".join(failed))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("stems", nargs="*", help="Article id(s)")
    parser.add_argument("--all", action="store_true", help="Generate every AZ discovery article")
    parser.add_argument("--smoke", action="store_true", help="Generate the first article only")
    parser.add_argument("--force", action="store_true", help="Regenerate even if the MP3 exists")
    parser.add_argument("--link-only", action="store_true", help="Only attach data-audio on the page")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not PAGE.is_file():
        raise SystemExit(f"Missing {PAGE}")
    articles = load_articles()
    if not articles:
        raise SystemExit("No discovery articles found")
    if args.link_only:
        print(f"linked_page={link_discovery_audio()} stems={len(existing_stems())}")
        return
    selected = articles
    if args.smoke:
        selected = articles[:1]
    elif args.stems:
        want = set(args.stems)
        selected = [item for item in articles if item["stem"] in want]
        missing = want - {item["stem"] for item in selected}
        if missing:
            raise SystemExit("Unknown stems: " + ", ".join(sorted(missing)))
    elif not args.all:
        raise SystemExit("Pass --all, --smoke, or one or more article ids")
    print(f"Jobs: {len(selected)}  voice: {VOICE}  dest: {AUDIO_DIR}")
    asyncio.run(run(selected, args.force))


if __name__ == "__main__":
    main()
