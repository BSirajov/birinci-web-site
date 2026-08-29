# -*- coding: utf-8 -*-
"""Generate MP3 narration for stories via Microsoft Edge TTS.

Default voice is male (az-AZ-BabekNeural). Female (az-AZ-BanuNeural) is used
only when you pass --voice az-AZ-BanuNeural explicitly.

Prosody v2: paragraphs are classified (title / narrative / dialogue /
question / exclaim / moral). Source lines are omitted. Dual voice (narrator +
dialogue) comes from languages.json. Pauses are silent MP3 clips between
segments (ffmpeg loudnorm when available; edge-tts rejects <break> SSML).

Examples:
  python tools/generate_story_audio.py --all
  python tools/generate_story_audio.py friend-of-god
  python tools/generate_story_audio.py --all --force
  python tools/generate_story_audio.py value-of-your-family --force
  python tools/generate_story_audio.py friend-of-god --voice az-AZ-BanuNeural --force
  python tools/generate_story_audio.py --pilot
  python tools/generate_story_audio.py --pilot --lang az
"""
from __future__ import annotations

import argparse
import asyncio
import json
import re
import shutil
import socket
import subprocess
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
sys.path.insert(0, str(Path(__file__).resolve().parent))
from i18n_config import (  # noqa: E402
    SUPPORTED_LANGS,
    TTS_DIALOGUE_VOICES,
    TTS_VOICES,
    story_audio_dir,
)
from stories_catalog import load_stories_catalog, stories_data_path  # noqa: E402

_STORIES_PREFIX = "window.__BIRINCI_STORIES__ = "
_STORY_ARTICLE_RE = re.compile(
    r'<article\b(?=[^>]*\bclass="[^"]*\bstory\b)[^>]*>',
    re.I,
)

DATA_JS = stories_data_path("az")
AUDIO_DIR = story_audio_dir("az")
MANIFEST_JSON = AUDIO_DIR / "manifest.json"

VOICE_FEMALE = "az-AZ-BanuNeural"
VOICE_MALE = "az-AZ-BabekNeural"
DEFAULT_VOICE = VOICE_MALE
DEFAULT_DIALOGUE_VOICE = VOICE_FEMALE
KNOWN_VOICES = tuple(
    dict.fromkeys(
        [
            VOICE_FEMALE,
            VOICE_MALE,
            *[voice for voice in TTS_VOICES.values() if voice],
            *[voice for voice in TTS_DIALOGUE_VOICES.values() if voice],
        ]
    )
)
LANG = "az"

# Listening-test set. --pilot with no stems uses these.
PILOT_STEMS = (
    "friend-of-god",
    "elephant-and-the-rope",
    "mothers-love",
    "baklava",
    "gossip",
    "hold-my-hand",
    "silent-corridor",
    "weeds-must-be-pulled-from-the-root",
    "everyone-has-work-to-do",
    "glass-of-milk",
)
PILOT_LANGS = ("az", "en", "ru")


def configure_lang(lang: str) -> None:
    global LANG, DATA_JS, AUDIO_DIR, MANIFEST_JSON, DEFAULT_VOICE, DEFAULT_DIALOGUE_VOICE
    if lang not in SUPPORTED_LANGS:
        raise SystemExit(f"Unsupported lang {lang}")
    LANG = lang
    DATA_JS = stories_data_path(lang)
    AUDIO_DIR = story_audio_dir(lang)
    MANIFEST_JSON = AUDIO_DIR / "manifest.json"
    voice = TTS_VOICES.get(lang)
    if not voice:
        raise SystemExit(
            f"No Edge/Azure neural voice is configured for {lang}. "
            "Story audio for this locale stays pending until a voice is available."
        )
    DEFAULT_VOICE = voice
    DEFAULT_DIALOGUE_VOICE = TTS_DIALOGUE_VOICES.get(lang) or ""


MAX_CONCURRENCY = 1
MAX_RETRIES = 12
RETRY_BASE_DELAY = 2.0
RETRY_MAX_DELAY = 20.0
PROSODY_VERSION = "v2"

# Wider role contrast than v1. edge-tts pitch is Hz, not semitones.
PROSODY = {
    "title": {"rate": "-8%", "pitch": "+0Hz", "volume": "+0%"},
    "narrative": {"rate": "-6%", "pitch": "+0Hz", "volume": "+0%"},
    "dialogue": {"rate": "+10%", "pitch": "+4Hz", "volume": "+0%"},
    "question": {"rate": "+4%", "pitch": "+6Hz", "volume": "+0%"},
    "exclaim": {"rate": "+8%", "pitch": "+4Hz", "volume": "+0%"},
    "moral": {"rate": "-15%", "pitch": "-3Hz", "volume": "+0%"},
}

# Optional per-story role overrides (merged on top of PROSODY).
STORY_PROSODY_OVERRIDES: dict[str, dict[str, dict[str, str]]] = {}

# Real pauses (ms). Public edge-tts rejects <break> SSML (NoAudioReceived),
# so gaps are silent MP3 frames (or ffmpeg anullsrc) between segments.
PAUSE_MS = {
    "none": 0,
    "short": 400,
    "medium": 400,
    "long": 800,
}
_MORAL_RE = re.compile(r"^(ibrət|ibret|moral|мораль|үлгү|сабак)\s*:", re.I)
_SOURCE_RE = re.compile(
    r"(internet\s+sources|internet\s+mənb|internet\s+kaynak|"
    r"открыт\w*\s+источник|интернет|"
    r"(?:source|mənbə|kaynak|источник|булак|булагы)\s*:)",
    re.I,
)
_AUTHOR_SOURCE_STEMS = {
    "everyone-has-work-to-do",
    "weeds-must-be-pulled-from-the-root",
    "silent-corridor",
}

# MPEG-2 Layer III, 24 kHz, 48 kbps, mono — matches edge-tts outputFormat.
_MP3_SILENCE_FRAME = bytes.fromhex("fff364c4") + bytes(140)


def fold_az_i(text: str) -> str:
    """Map dotted/dotless I so AZ/TR İ matches ASCII i (same as the site builder)."""
    return (text or "").replace("İ", "i").replace("I", "i").replace("ı", "i")


def find_ffmpeg() -> str | None:
    return shutil.which("ffmpeg")


def synthetic_silence_mp3(ms: int) -> bytes:
    """Last-resort silent MP3 (~24 ms/frame) when ffmpeg and SSML-only breaks fail."""
    frames = max(1, int(round(max(ms, 1) / 24.0)))
    return _MP3_SILENCE_FRAME * frames


def prosody_for(stem: str, role: str) -> dict[str, str]:
    """Resolve rate/pitch/volume for a role, with optional per-story overrides."""
    base = dict(PROSODY.get(role) or PROSODY["narrative"])
    story_over = STORY_PROSODY_OVERRIDES.get(stem) or {}
    role_over = story_over.get(role) or story_over.get("*") or {}
    base.update(role_over)
    return base


def load_manifest(path: Path | None = None) -> dict[str, dict]:
    manifest_path = path or MANIFEST_JSON
    if not manifest_path.is_file():
        return {}
    try:
        data = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def existing_audio_stems(lang: str | None = None) -> set[str]:
    audio_dir = story_audio_dir(lang or LANG)
    if not audio_dir.is_dir():
        return set()
    return {path.stem for path in audio_dir.glob("*.mp3") if path.is_file()}


def _asset_version() -> str:
    try:
        from chrome_restore import SITE_ASSET_VERSION

        return str(SITE_ASSET_VERSION)
    except Exception:
        return "20260823o"


def _inject_article_audio(html: str, rel_prefix: str, version: str, stems: set[str]) -> str:
    def repl(match: re.Match[str]) -> str:
        tag = match.group(0)
        stem_m = re.search(r'\bdata-stem="([^"]+)"', tag)
        if not stem_m:
            return tag
        stem = stem_m.group(1)
        if stem not in stems:
            return re.sub(r'\s+data-audio="[^"]*"', "", tag)
        attr = f' data-audio="{rel_prefix}{stem}.mp3?v={version}"'
        if "data-audio=" in tag:
            return re.sub(r'\s+data-audio="[^"]*"', attr, tag)
        return tag[:-1] + attr + ">"

    return _STORY_ARTICLE_RE.sub(repl, html)


def link_story_audio(lang: str | None = None) -> tuple[int, int]:
    """Mark hasAudio and attach data-audio for generated MP3s."""
    lang = lang or LANG
    stems = existing_audio_stems(lang)
    data_path = stories_data_path(lang)
    marked = 0
    if data_path.is_file():
        text = data_path.read_text(encoding="utf-8")
        start = text.find(_STORIES_PREFIX)
        if start >= 0:
            payload_start = start + len(_STORIES_PREFIX)
            blob, end = json.JSONDecoder().raw_decode(text, payload_start)
            for cat in blob.get("categories") or []:
                for story in cat.get("stories") or []:
                    stem = story.get("stem")
                    story["hasAudio"] = bool(stem and stem in stems)
                    if story["hasAudio"]:
                        marked += 1
            suffix = text[end:]
            if not suffix.startswith(";"):
                suffix = ";" + suffix.lstrip()
            data_path.write_text(
                text[:start]
                + _STORIES_PREFIX
                + json.dumps(blob, ensure_ascii=False, separators=(", ", ": "))
                + suffix,
                encoding="utf-8",
            )

    version = _asset_version()
    pages = 0
    cat_dir = ROOT / lang / "categories"
    if cat_dir.is_dir():
        for path in sorted(cat_dir.glob("*.html")):
            raw = path.read_text(encoding="utf-8")
            new = _inject_article_audio(raw, "../wisdom-stories/audio/", version, stems)
            if new != raw:
                path.write_text(new, encoding="utf-8")
                pages += 1
    return marked, pages


def stems_with_voice(voice: str) -> set[str]:
    return {
        stem
        for stem, meta in load_manifest().items()
        if isinstance(meta, dict) and meta.get("voice") == voice
    }


def load_categories() -> list[dict]:
    data = load_stories_catalog(LANG)
    return list(data.get("categories", []))


def clean_speech_chunk(text: str) -> str:
    """Normalize text for TTS while keeping pause-friendly punctuation."""
    t = re.sub(r"\s+", " ", (text or "")).strip()
    t = t.replace("\u00ad", "")
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
    if re.fullmatch(r"[\s\*•·\-–—._=~]+", raw):
        return True
    cleaned = clean_speech_chunk(raw)
    if not cleaned:
        return True
    if not re.search(r"[\wÀ-öø-ÿĞğİıŞşÇçÖöÜüƏə]", cleaned, re.UNICODE):
        return True
    return False


def is_moral_paragraph(text: str) -> bool:
    return bool(_MORAL_RE.match(fold_az_i((text or "").strip())))


def is_source_paragraph(text: str) -> bool:
    return bool(_SOURCE_RE.search(fold_az_i((text or "").strip().strip("«»\"“”"))))


def is_dialogue(text: str) -> bool:
    s = text.strip()
    if not s:
        return False
    # Only line-initial markers. Mid-sentence em-dashes are narrative (e.g. mothers-love).
    if s.startswith(("—", "–", "«", "\"", "“", "„")):
        return True
    if re.match(r"^-\s+\S", s):
        return True
    return False


def classify_paragraph(text: str) -> tuple[str, str]:
    """Return (prosody_role, voice_role). Moral is prefix-only, never last-para fallback."""
    raw = (text or "").strip()
    cleaned = clean_speech_chunk(raw)
    if not cleaned:
        return "narrative", "narrator"
    if is_moral_paragraph(raw):
        return "moral", "narrator"
    dialogue = is_dialogue(raw)
    if cleaned.endswith("?"):
        return "question", "dialogue" if dialogue else "narrator"
    if cleaned.endswith("!"):
        return "exclaim", "dialogue" if dialogue else "narrator"
    if dialogue:
        return "dialogue", "dialogue"
    return "narrative", "narrator"


def speech_segments(story: dict) -> list[dict]:
    """Build ordered TTS segments with role-based prosody. Source lines are omitted."""
    title = clean_speech_chunk(story.get("title") or "")
    stem = str(story.get("stem") or "")
    paras = [p for p in story.get("paragraphs", []) if p and str(p).strip()]
    segments: list[dict] = []

    body_paras = []
    for i, p in enumerate(paras):
        if is_non_speech_paragraph(p):
            continue
        if is_source_paragraph(p):
            continue
        if stem in _AUTHOR_SOURCE_STEMS and i == len(paras) - 1 and not is_moral_paragraph(p):
            continue
        cleaned = clean_speech_chunk(p)
        if not cleaned:
            continue
        if title and cleaned.casefold() == title.casefold():
            continue
        body_paras.append(p)

    if title:
        segments.append(
            {
                "role": "title",
                "voice_role": "narrator",
                "text": title,
                "pause_after": "long",
                "pause_ms": PAUSE_MS["long"],
            }
        )

    for raw in body_paras:
        role, voice_role = classify_paragraph(raw)
        text = clean_speech_chunk(raw)
        if not text:
            continue
        pause = "long" if role == "moral" else "medium" if role == "dialogue" else "short"
        segments.append(
            {
                "role": role,
                "voice_role": voice_role,
                "text": text,
                "pause_after": pause,
                "pause_ms": PAUSE_MS[pause],
            }
        )

    if segments:
        # Longer breath before the moral; no trailing pause after the last line.
        for i, seg in enumerate(segments):
            if seg["role"] == "moral" and i > 0:
                segments[i - 1]["pause_after"] = "long"
                segments[i - 1]["pause_ms"] = PAUSE_MS["long"]
        segments[-1]["pause_after"] = "none"
        segments[-1]["pause_ms"] = 0

    if not segments and title:
        segments.append(
            {
                "role": "narrative",
                "voice_role": "narrator",
                "text": title,
                "pause_after": "none",
                "pause_ms": 0,
            }
        )
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
                    "dialogue_voice": DEFAULT_DIALOGUE_VOICE,
                    "segments": segments,
                    "text": " ".join(s["text"] for s in segments),
                }
            )
    return jobs


def segment_voice(seg: dict, narrator: str, dialogue: str, single_voice: bool) -> str:
    if single_voice or not dialogue:
        return narrator
    if seg.get("voice_role") == "dialogue":
        return dialogue
    return narrator


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


def write_silence_file(path: Path, ms: int) -> None:
    path.write_bytes(synthetic_silence_mp3(ms))


def ffmpeg_make_silence(ffmpeg: str, dest: Path, ms: int) -> bool:
    sec = max(ms, 1) / 1000.0
    gap = subprocess.run(
        [
            ffmpeg,
            "-y",
            "-f",
            "lavfi",
            "-i",
            "anullsrc=r=24000:cl=mono",
            "-t",
            f"{sec:.3f}",
            "-c:a",
            "libmp3lame",
            "-b:a",
            "48k",
            str(dest),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    return gap.returncode == 0 and dest.is_file()


def ffmpeg_concat_and_normalize(parts: list[Path], out_path: Path, ffmpeg: str) -> bool:
    """Concat already-gapped parts and loudnorm. Returns False if ffmpeg fails."""
    try:
        with tempfile.TemporaryDirectory(prefix="birinci-ff-") as tmp:
            tmp_dir = Path(tmp)
            lst = tmp_dir / "concat.txt"
            lines = [f"file '{part.resolve().as_posix()}'" for part in parts]
            lst.write_text("\n".join(lines) + "\n", encoding="utf-8")
            mixed = tmp_dir / "mixed.mp3"
            result = subprocess.run(
                [
                    ffmpeg,
                    "-y",
                    "-f",
                    "concat",
                    "-safe",
                    "0",
                    "-i",
                    str(lst),
                    "-af",
                    "loudnorm=I=-16:TP=-1.5:LRA=11",
                    "-c:a",
                    "libmp3lame",
                    "-b:a",
                    "48k",
                    str(mixed),
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            if result.returncode != 0 or not mixed.is_file() or mixed.stat().st_size < 256:
                return False
            shutil.copyfile(mixed, out_path)
            return True
    except OSError:
        return False


async def synthesize_story(
    segments: list[dict],
    out_path: Path,
    voice: str,
    *,
    stem: str = "",
    dialogue_voice: str = "",
    single_voice: bool = False,
) -> str:
    """Synthesize each segment with role prosody and concatenate with pauses.

    Returns a short note about how audio was joined (ffmpeg vs raw concat).
    """
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if not segments:
        raise RuntimeError("No speech segments to synthesize")

    ffmpeg = find_ffmpeg()
    join_note = "raw-concat"
    with tempfile.TemporaryDirectory(prefix="birinci-tts-") as tmp:
        tmp_dir = Path(tmp)
        parts: list[Path] = []
        for i, seg in enumerate(segments):
            role = seg.get("role") or "narrative"
            prosody = prosody_for(stem, role)
            pause_ms = int(seg.get("pause_ms") or 0)
            if i == len(segments) - 1:
                pause_ms = 0
            chunk_path = tmp_dir / f"seg-{i:03d}-{role}.mp3"
            await synthesize_chunk(
                seg["text"],
                chunk_path,
                segment_voice(seg, voice, dialogue_voice, single_voice),
                rate=prosody["rate"],
                pitch=prosody["pitch"],
                volume=prosody["volume"],
            )
            parts.append(chunk_path)
            if pause_ms:
                gap_path = tmp_dir / f"gap-{i:03d}-{pause_ms}.mp3"
                if ffmpeg and ffmpeg_make_silence(ffmpeg, gap_path, pause_ms):
                    parts.append(gap_path)
                else:
                    write_silence_file(gap_path, pause_ms)
                    parts.append(gap_path)

        final_tmp = out_path.with_suffix(".partial.mp3")
        if ffmpeg and ffmpeg_concat_and_normalize(parts, final_tmp, ffmpeg):
            join_note = "ffmpeg+loudnorm"
        else:
            if ffmpeg:
                join_note = "raw-concat (ffmpeg failed; loudnorm skipped)"
            else:
                join_note = "raw-concat (ffmpeg missing; loudnorm skipped)"
            with final_tmp.open("wb") as sink:
                for part in parts:
                    sink.write(part.read_bytes())
        if final_tmp.stat().st_size < 256:
            final_tmp.unlink(missing_ok=True)
            raise RuntimeError("TTS produced empty or tiny audio file")
        final_tmp.replace(out_path)
    return join_note


async def run(
    jobs: list[dict],
    force: bool,
    *,
    pilot: bool = False,
    single_voice: bool = False,
) -> None:
    out_dir = AUDIO_DIR / "pilot" if pilot else AUDIO_DIR
    manifest_path = out_dir / "manifest.json" if pilot else MANIFEST_JSON
    out_dir.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(MAX_CONCURRENCY)
    manifest = load_manifest(manifest_path)

    total = len(jobs)
    done = 0
    skipped = 0
    failed: list[str] = []
    lock = asyncio.Lock()
    ffmpeg = find_ffmpeg()

    async def one(job: dict) -> None:
        nonlocal done, skipped
        stem = job["stem"]
        out = out_dir / f"{stem}.mp3"
        voice = job["voice"]
        dialogue_voice = "" if single_voice else (job.get("dialogue_voice") or "")

        if out.is_file() and not force:
            existing = manifest.get(stem) or {}
            same_voice = existing.get("voice") == voice
            same_dialogue = existing.get("dialogue_voice") == (dialogue_voice or None)
            same_prosody = existing.get("prosody") == PROSODY_VERSION
            if same_voice and same_dialogue and same_prosody:
                async with lock:
                    skipped += 1
                    done += 1
                    print(f"[{done}/{total}] skip {stem} ({voice})", flush=True)
                return
            # Metadata mismatch (e.g. v1 → v2): regenerate. Use --force to replace
            # matching files too.

        async with sem:
            roles = ",".join(seg["role"] for seg in job["segments"])
            voices = voice if not dialogue_voice else f"{voice}+{dialogue_voice}"
            print(
                f"-> {stem} [{job['category']} #{job['index']+1}] {voices} "
                f"prosody={PROSODY_VERSION} roles={roles}",
                flush=True,
            )
            try:
                join_note = await synthesize_story(
                    job["segments"],
                    out,
                    voice,
                    stem=stem,
                    dialogue_voice=dialogue_voice,
                    single_voice=single_voice,
                )
            except Exception as exc:  # noqa: BLE001
                async with lock:
                    failed.append(stem)
                    done += 1
                    print(f"[{done}/{total}] FAIL {stem}: {exc}", flush=True)
                await asyncio.sleep(2.0)
                return

        size_kb = out.stat().st_size / 1024
        async with lock:
            manifest[stem] = {
                "title": job["title"],
                "category": job["category"],
                "index": job["index"],
                "voice": voice,
                "dialogue_voice": dialogue_voice or None,
                "prosody": PROSODY_VERSION,
                "roles": [seg["role"] for seg in job["segments"]],
                "file": f"pilot/{out.name}" if pilot else out.name,
                "bytes": out.stat().st_size,
                "join": join_note,
            }
            manifest_path.write_text(
                json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            done += 1
            print(
                f"[{done}/{total}] wrote {out} ({size_kb:.1f} KB) {voices} {join_note}",
                flush=True,
            )
        await asyncio.sleep(0.35)

    await asyncio.gather(*(one(job) for job in jobs))

    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Done. generated_or_updated={total - skipped - len(failed)} "
        f"skipped={skipped} failed={len(failed)} manifest={manifest_path} "
        f"ffmpeg={'yes' if ffmpeg else 'no'}",
        flush=True,
    )
    if not pilot:
        marked, pages = link_story_audio(LANG)
        print(f"linked hasAudio={marked} category_pages={pages}", flush=True)
    if failed:
        raise SystemExit("Failed stems: " + ", ".join(failed))


def _safe_print(text: str) -> None:
    try:
        print(text)
    except UnicodeEncodeError:
        enc = sys.stdout.encoding or "ascii"
        print(text.encode(enc, "replace").decode(enc, "replace"))


def print_segment_plan(jobs: list[dict], single_voice: bool) -> None:
    for job in jobs:
        _safe_print(f"\n# {job['stem']} ({job['title']})")
        for seg in job["segments"]:
            sample = seg["text"][:120].encode("ascii", "replace").decode("ascii")
            voice = segment_voice(
                seg, job["voice"], job.get("dialogue_voice") or "", single_voice
            )
            _safe_print(
                f"  [{seg['role']}/{seg.get('voice_role', 'narrator')}"
                f" {voice} pause={seg.get('pause_ms', 0)}ms] {sample}"
            )


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("stems", nargs="*", help="Story stem(s), e.g. friend-of-god")
    parser.add_argument("--all", action="store_true", help="Generate audio for every story")
    parser.add_argument(
        "--lang",
        choices=SUPPORTED_LANGS,
        default=None,
        help=f"Locale tree ({'/'.join(SUPPORTED_LANGS)}). Default az, or az/en/ru with --pilot.",
    )
    parser.add_argument(
        "--stems-from-voice",
        metavar="VOICE",
        help="Select stems whose manifest voice matches VOICE (e.g. az-AZ-BanuNeural)",
    )
    parser.add_argument(
        "--voice",
        metavar="VOICE",
        choices=KNOWN_VOICES,
        help="Override voice (single-voice mode). Default is narrator+dialogue from languages.json.",
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
    parser.add_argument(
        "--pilot",
        action="store_true",
        help=(
            "Write {lang}/wisdom-stories/audio/pilot/{stem}.mp3 (does not overwrite production). "
            "With no stems, uses the 10-story listening set across az/en/ru."
        ),
    )
    args = parser.parse_args(argv)

    selectors = sum(
        [
            bool(args.all),
            bool(args.stems),
            bool(args.stems_from_voice),
            bool(args.pilot and not args.all and not args.stems and not args.stems_from_voice),
        ]
    )
    if selectors != 1:
        parser.error(
            "Provide exactly one of: story stem(s), --all, --stems-from-voice, or --pilot"
        )
    return args


def main() -> None:
    args = parse_args()
    langs: tuple[str, ...]
    if args.lang:
        langs = (args.lang,)
    elif args.pilot:
        langs = PILOT_LANGS
    else:
        langs = ("az",)

    if args.all:
        stem_filter: set[str] | None = None
    elif args.stems_from_voice:
        stem_filter = None  # resolved per lang after configure_lang
    elif args.stems:
        stem_filter = set(args.stems)
    else:
        stem_filter = set(PILOT_STEMS)

    single_voice = bool(args.voice)
    any_jobs = False
    failures: list[str] = []

    for lang in langs:
        configure_lang(lang)
        AUDIO_DIR.mkdir(parents=True, exist_ok=True)

        lang_filter = stem_filter
        if args.stems_from_voice:
            lang_filter = stems_with_voice(args.stems_from_voice)
            if not lang_filter:
                print(
                    f"No stems in {MANIFEST_JSON} with voice={args.stems_from_voice}",
                    flush=True,
                )
                continue

        if not DATA_JS.is_file():
            print(f"skip {lang}: missing {DATA_JS}", flush=True)
            continue

        jobs = planned_jobs(lang_filter)
        if lang_filter is not None:
            found = {j["stem"] for j in jobs}
            missing = sorted(lang_filter - found)
            if missing:
                if args.pilot:
                    print(f"skip missing stems for {lang}: {', '.join(missing)}", flush=True)
                else:
                    raise SystemExit(f"Unknown story stem(s): {', '.join(missing)}")
        if not jobs:
            print(f"skip {lang}: no matching stories", flush=True)
            continue

        if args.voice:
            for job in jobs:
                job["voice"] = args.voice
                job["dialogue_voice"] = ""
            voice_msg = args.voice
        else:
            extra = f"+{DEFAULT_DIALOGUE_VOICE}" if DEFAULT_DIALOGUE_VOICE else ""
            voice_msg = f"{DEFAULT_VOICE}{extra} (narrator+dialogue)"

        any_jobs = True
        if args.print_segments:
            print(f"\n== {lang} ==")
            print_segment_plan(jobs, single_voice)
            continue

        dest = "pilot" if args.pilot else "production"
        print(
            f"Jobs: {len(jobs)}  lang: {lang}  voice: {voice_msg}  "
            f"prosody: {PROSODY_VERSION}  dest: {dest}",
            flush=True,
        )
        try:
            asyncio.run(
                run(
                    jobs,
                    force=args.force,
                    pilot=args.pilot,
                    single_voice=single_voice,
                )
            )
        except SystemExit as exc:
            failures.append(f"{lang}: {exc}")

    if args.print_segments:
        return
    if not any_jobs:
        raise SystemExit("No stories to generate.")
    if failures:
        raise SystemExit("Failed: " + " | ".join(failures))


if __name__ == "__main__":
    main()
