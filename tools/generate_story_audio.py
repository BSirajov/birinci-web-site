# -*- coding: utf-8 -*-
"""Generate MP3 narration for stories via Microsoft Edge TTS.

Default voice is male (az-AZ-BabekNeural). Female (az-AZ-BanuNeural) is used
only when you pass --voice az-AZ-BanuNeural explicitly.

Light prosody: paragraphs are classified (title / narrative / dialogue /
question / exclaim / moral) and synthesized with different rate/pitch/volume,
then concatenated with short pauses.

Examples:
  python tools/generate_story_audio.py --all
  python tools/generate_story_audio.py friend-of-god
  python tools/generate_story_audio.py --all --force
  python tools/generate_story_audio.py the-value-of-your-family --force
  python tools/generate_story_audio.py friend-of-god --voice az-AZ-BanuNeural --force
"""
from __future__ import annotations

import argparse
import asyncio
import json
import re
import socket
import sys
import tempfile
from pathlib import Path

# Prefer IPv4 for Edge TTS — IPv6 often fails with WinError 64 on some networks.
_orig_getaddrinfo = socket.getaddrinfo


def _getaddrinfo_ipv4_first(*args, **kwargs):  # type: ignore[no-untyped-def]
    responses = _orig_getaddrinfo(*args, **kwargs)
    ipv4 = [r for r in responses if r[0] == socket.AF_INET]
    return ipv4 or responses


socket.getaddrinfo = _getaddrinfo_ipv4_first  # type: ignore[assignment]

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
DEFAULT_VOICE = VOICE_MALE
KNOWN_VOICES = (VOICE_FEMALE, VOICE_MALE)
MAX_CONCURRENCY = 1
MAX_RETRIES = 12
RETRY_BASE_DELAY = 2.0
RETRY_MAX_DELAY = 20.0
PROSODY_VERSION = "v1"

# Edge TTS rate/pitch/volume strings. Keep ranges conservative for az voices.
PROSODY = {
    "title": {"rate": "-8%", "pitch": "+0Hz", "volume": "+0%"},
    "narrative": {"rate": "+0%", "pitch": "+0Hz", "volume": "+0%"},
    "dialogue": {"rate": "+4%", "pitch": "+2Hz", "volume": "+0%"},
    "question": {"rate": "-4%", "pitch": "+3Hz", "volume": "+0%"},
    "exclaim": {"rate": "+6%", "pitch": "+3Hz", "volume": "+0%"},
    "moral": {"rate": "-12%", "pitch": "-1Hz", "volume": "+0%"},
}

# Optional per-story role overrides (merged on top of PROSODY).
# Example:
# STORY_PROSODY_OVERRIDES = {
#     "friend-of-god": {"moral": {"rate": "-15%", "pitch": "-2Hz"}},
# }
STORY_PROSODY_OVERRIDES: dict[str, dict[str, dict[str, str]]] = {}

# Spoken pause markers appended to segment text (avoids extra TTS round-trips).
PAUSE_SUFFIX = {
    "short": "",
    "medium": " ...",
    "long": ". ...",
}


def prosody_for(stem: str, role: str) -> dict[str, str]:
    """Resolve rate/pitch/volume for a role, with optional per-story overrides."""
    base = dict(PROSODY.get(role) or PROSODY["narrative"])
    story_over = STORY_PROSODY_OVERRIDES.get(stem) or {}
    role_over = story_over.get(role) or story_over.get("*") or {}
    base.update(role_over)
    return base


def load_manifest() -> dict[str, dict]:
    if not MANIFEST_JSON.is_file():
        return {}
    try:
        data = json.loads(MANIFEST_JSON.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def stems_with_voice(voice: str) -> set[str]:
    return {
        stem
        for stem, meta in load_manifest().items()
        if isinstance(meta, dict) and meta.get("voice") == voice
    }


def load_categories() -> list[dict]:
    data = json.loads(DATA_JSON.read_text(encoding="utf-8"))
    return list(data.get("categories", []))


def clean_speech_chunk(text: str) -> str:
    """Normalize text for TTS while keeping pause-friendly punctuation."""
    t = re.sub(r"\s+", " ", (text or "")).strip()
    t = t.replace("\u00ad", "")
    # Prefer spoken pauses over raw quote / dash glyphs.
    t = (
        t.replace("«", "")
        .replace("»", "")
        .replace("„", "")
        .replace("“", "")
        .replace("”", "")
        .replace("‘", "")
        .replace("’", "")
    )
    t = re.sub(r"[—–]+\s*", ", ", t)
    t = re.sub(r"(,\s*){2,}", ", ", t)
    t = re.sub(r"\s+", " ", t).strip(" ,")
    return t


def is_non_speech_paragraph(text: str) -> bool:
    """Skip decorative separators that Edge TTS cannot synthesize."""
    raw = (text or "").strip()
    if not raw:
        return True
    # e.g. "* * *", "***", "— — —", "···"
    if re.fullmatch(r"[\s\*•·\-–—._=~]+", raw):
        return True
    cleaned = clean_speech_chunk(raw)
    if not cleaned:
        return True
    # Nothing alphanumeric left after cleanup.
    if not re.search(r"[\wÀ-öø-ÿĞğİıŞşÇçÖöÜüƏə]", cleaned, re.UNICODE):
        return True
    return False


def is_dialogue(text: str) -> bool:
    s = text.strip()
    if not s:
        return False
    if s.startswith(("—", "–", "-", "«", "\"", "“", "„")):
        return True
    if re.match(r"^(—|–|-)\s*", s):
        return True
    # Common Azerbaijani dialogue lead-ins after a dash mid-paragraph
    if "—" in s[:24] or "–" in s[:24]:
        return True
    return False


def classify_paragraph(text: str, index: int, total: int) -> str:
    raw = (text or "").strip()
    cleaned = clean_speech_chunk(raw)
    if not cleaned:
        return "narrative"
    if total > 1 and index == total - 1:
        return "moral"
    if is_dialogue(raw):
        return "dialogue"
    if cleaned.endswith("?"):
        return "question"
    if cleaned.endswith("!"):
        return "exclaim"
    return "narrative"


def speech_segments(story: dict) -> list[dict]:
    """Build ordered TTS segments with role-based prosody."""
    title = clean_speech_chunk(story.get("title") or "")
    paras = [
        p
        for p in story.get("paragraphs", [])
        if p and str(p).strip()
    ]
    segments: list[dict] = []

    body_paras = []
    for p in paras:
        if is_non_speech_paragraph(p):
            continue
        cleaned = clean_speech_chunk(p)
        if not cleaned:
            continue
        # Skip repeating the title if the first paragraph is the title.
        if title and cleaned.casefold() == title.casefold():
            continue
        body_paras.append(p)

    if title:
        segments.append({"role": "title", "text": title, "pause_after": "medium"})

    total = len(body_paras)
    for i, raw in enumerate(body_paras):
        role = classify_paragraph(raw, i, total)
        text = clean_speech_chunk(raw)
        if not text:
            continue
        pause = "long" if role == "moral" else "medium" if role == "dialogue" else "short"
        if i == total - 1:
            pause = "short"
        segments.append({"role": role, "text": text, "pause_after": pause})

    if not segments and title:
        segments.append({"role": "narrative", "text": title, "pause_after": "short"})
    return segments


def speech_text(story: dict) -> str:
    """Flat preview text (debug / fallback)."""
    return " ".join(seg["text"] for seg in speech_segments(story))


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
            segments = speech_segments(story)
            jobs.append(
                {
                    "stem": stem,
                    "title": story.get("title") or stem,
                    "category": cat_slug,
                    "index": index,
                    "voice": DEFAULT_VOICE,
                    "segments": segments,
                    "text": " ".join(s["text"] for s in segments),
                }
            )
    return jobs


async def synthesize_chunk(
    text: str,
    out_path: Path,
    voice: str,
    *,
    rate: str,
    pitch: str,
    volume: str,
) -> None:
    last_err: Exception | None = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            communicate = edge_tts.Communicate(
                text,
                voice,
                rate=rate,
                pitch=pitch,
                volume=volume,
            )
            await communicate.save(str(out_path))
            if not out_path.is_file() or out_path.stat().st_size < 64:
                raise RuntimeError("TTS produced empty or tiny audio chunk")
            return
        except Exception as exc:  # noqa: BLE001 - retry network/TTS blips
            last_err = exc
            if out_path.exists():
                out_path.unlink(missing_ok=True)
            if attempt < MAX_RETRIES:
                delay = min(RETRY_MAX_DELAY, RETRY_BASE_DELAY * (2 ** (attempt - 1)))
                print(
                    f"  retry {attempt}/{MAX_RETRIES} chunk: {exc} (sleep {delay:.1f}s)",
                    flush=True,
                )
                await asyncio.sleep(delay)
    raise RuntimeError(f"Failed after {MAX_RETRIES} tries: {last_err}")


async def synthesize_story(
    segments: list[dict],
    out_path: Path,
    voice: str,
    *,
    stem: str = "",
) -> None:
    """Synthesize each segment with role prosody and concatenate MP3 bytes."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if not segments:
        raise RuntimeError("No speech segments to synthesize")

    with tempfile.TemporaryDirectory(prefix="birinci-tts-") as tmp:
        tmp_dir = Path(tmp)
        parts: list[Path] = []
        for i, seg in enumerate(segments):
            role = seg.get("role") or "narrative"
            prosody = prosody_for(stem, role)
            pause_key = seg.get("pause_after") or "short"
            suffix = PAUSE_SUFFIX.get(pause_key, "") if i < len(segments) - 1 else ""
            text = f"{seg['text']}{suffix}".strip()
            chunk_path = tmp_dir / f"seg-{i:03d}-{role}.mp3"
            await synthesize_chunk(
                text,
                chunk_path,
                voice,
                rate=prosody["rate"],
                pitch=prosody["pitch"],
                volume=prosody["volume"],
            )
            parts.append(chunk_path)

        final_tmp = out_path.with_suffix(".partial.mp3")
        with final_tmp.open("wb") as sink:
            for part in parts:
                sink.write(part.read_bytes())
        if final_tmp.stat().st_size < 256:
            final_tmp.unlink(missing_ok=True)
            raise RuntimeError("TTS produced empty or tiny audio file")
        final_tmp.replace(out_path)


async def run(jobs: list[dict], force: bool) -> None:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(MAX_CONCURRENCY)
    manifest = load_manifest()

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
            if (
                existing.get("voice") == voice
                and existing.get("prosody") == PROSODY_VERSION
            ):
                async with lock:
                    skipped += 1
                    done += 1
                    print(f"[{done}/{total}] skip {stem} ({voice})", flush=True)
                return

        async with sem:
            roles = ",".join(seg["role"] for seg in job["segments"])
            print(
                f"-> {stem} [{job['category']} #{job['index']+1}] {voice} "
                f"prosody={PROSODY_VERSION} roles={roles}",
                flush=True,
            )
            try:
                await synthesize_story(job["segments"], out, voice, stem=stem)
            except Exception as exc:  # noqa: BLE001
                async with lock:
                    failed.append(stem)
                    done += 1
                    print(f"[{done}/{total}] FAIL {stem}: {exc}", flush=True)
                # Brief cool-down after network failures before the next story.
                await asyncio.sleep(2.0)
                return

        size_kb = out.stat().st_size / 1024
        async with lock:
            manifest[stem] = {
                "title": job["title"],
                "category": job["category"],
                "index": job["index"],
                "voice": voice,
                "prosody": PROSODY_VERSION,
                "roles": [seg["role"] for seg in job["segments"]],
                "file": out.name,
                "bytes": out.stat().st_size,
            }
            # Persist after each story so long runs can resume safely.
            MANIFEST_JSON.write_text(
                json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            done += 1
            print(
                f"[{done}/{total}] wrote {out.name} ({size_kb:.1f} KB) {voice}",
                flush=True,
            )
        # Small gap between stories to reduce Edge connection churn.
        await asyncio.sleep(0.35)

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
        "--stems-from-voice",
        metavar="VOICE",
        help="Select stems whose manifest voice matches VOICE (e.g. az-AZ-BanuNeural)",
    )
    parser.add_argument(
        "--voice",
        metavar="VOICE",
        choices=KNOWN_VOICES,
        help=(
            "Voice for selected jobs. Default is male az-AZ-BabekNeural; "
            "pass az-AZ-BanuNeural only when female narration is explicitly wanted."
        ),
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate even if an MP3 already exists for that stem/voice",
    )
    parser.add_argument(
        "--print-segments",
        action="store_true",
        help="Print prosody segment plan for selected stems and exit",
    )
    args = parser.parse_args()

    selectors = sum(
        [
            bool(args.all),
            bool(args.stems),
            bool(args.stems_from_voice),
        ]
    )
    if selectors != 1:
        parser.error("Provide exactly one of: story stem(s), --all, or --stems-from-voice")

    if args.all:
        stem_filter = None
    elif args.stems_from_voice:
        stem_filter = stems_with_voice(args.stems_from_voice)
        if not stem_filter:
            raise SystemExit(
                f"No stems in {MANIFEST_JSON} with voice={args.stems_from_voice}"
            )
    else:
        stem_filter = set(args.stems)

    if not DATA_JSON.is_file():
        raise SystemExit(f"Missing {DATA_JSON} — run tools/build_website.py first.")

    jobs = planned_jobs(stem_filter)
    if stem_filter is not None:
        found = {j["stem"] for j in jobs}
        missing = sorted(stem_filter - found)
        if missing:
            raise SystemExit(f"Unknown story stem(s): {', '.join(missing)}")

    if args.voice:
        for job in jobs:
            job["voice"] = args.voice
        voice_msg = args.voice
    else:
        voice_msg = f"{DEFAULT_VOICE} (default male)"

    if args.print_segments:
        for job in jobs:
            line = f"\n# {job['stem']} ({job['title']})"
            print(line.encode("utf-8", "replace").decode("utf-8", "replace"))
            for seg in job["segments"]:
                sample = seg["text"][:120].encode("ascii", "replace").decode("ascii")
                print(f"  [{seg['role']}] {sample}")
        return

    print(
        f"Jobs: {len(jobs)}  voice: {voice_msg}  prosody: {PROSODY_VERSION}",
        flush=True,
    )
    asyncio.run(run(jobs, force=args.force))


if __name__ == "__main__":
    main()
