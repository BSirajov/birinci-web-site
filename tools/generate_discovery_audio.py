# -*- coding: utf-8 -*-
"""Generate MP3 narration for Discoveries articles (AZ / EN / RU).

Uses the same Microsoft neural TTS path as Wisdom stories: official Azure Speech
when AZURE_SPEECH_KEY (or SPEECH_KEY) is set, otherwise edge-tts. Public
edge-tts always receives plain text plus rate/pitch/volume — never SSML
through Communicate().

Default locale is AZ (az-AZ-BabekNeural narrator, az-AZ-BanuNeural dialogue).
EN uses one en-US pair (Guy narrator, Jenny dialogue). RU uses Dmitry narrator
and Svetlana dialogue. KY is not supported.

Output lives in {lang}/discovery-articles/audio/ (separate from Wisdom audio).
Filenames match article ids used by Listen buttons, e.g. controlled-use-of-fire.mp3.

Does not restore or copy old MP3s.

Examples:
  python tools/generate_discovery_audio.py --plan-only
  python tools/generate_discovery_audio.py --lang en --plan-only
  python tools/generate_discovery_audio.py --lang en --smoke --force
  python tools/generate_discovery_audio.py --lang ru --all
  python tools/generate_discovery_audio.py --all --force
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
    DEFAULT_DIALOGUE_VOICE,
    DEFAULT_VOICE,
    MAX_CONCURRENCY,
    PROSODY_VERSION,
    VOICE_FEMALE,
    assign_dialogue_voices,
    azure_speech_ready,
    classify_paragraph,
    clean_speech_chunk,
    content_fingerprint,
    fold_az_i,
    is_source_paragraph,
    synthesize_story,
)
from i18n_config import TTS_DIALOGUE_VOICES, TTS_VOICES, discovery_audio_dir  # noqa: E402

DISCOVERY_LANGS = ("az", "en", "ru")
# Same-locale pairs, one narrator each. Male narrator so existing
# segment_voice() can reuse it for male dialogue.
DISCOVERY_VOICES = {
    "az": (TTS_VOICES.get("az") or "az-AZ-BabekNeural",
           TTS_DIALOGUE_VOICES.get("az") or "az-AZ-BanuNeural"),
    "en": ("en-US-GuyNeural", "en-US-JennyNeural"),
    "ru": ("ru-RU-DmitryNeural", "ru-RU-SvetlanaNeural"),
}

LANG = "az"
PAGE = ROOT / "az" / "discoveries" / "discoveries-and-inventions.html"
AUDIO_DIR = discovery_audio_dir("az")
MANIFEST_JSON = AUDIO_DIR / "manifest.json"
ASSIGNMENTS_JSON = AUDIO_DIR / "voice-assignments.json"
VOICE = DEFAULT_VOICE
DIALOGUE_VOICE = DEFAULT_DIALOGUE_VOICE or VOICE_FEMALE
AUDIO_CACHE_TAG = "discaudio2"


def configure_lang(lang: str) -> None:
    """Point inventory, voices, and output at one Discoveries locale."""
    global LANG, PAGE, AUDIO_DIR, MANIFEST_JSON, ASSIGNMENTS_JSON
    global VOICE, DIALOGUE_VOICE
    code = (lang or "az").strip().lower()
    if code not in DISCOVERY_LANGS:
        raise SystemExit(
            f"Unsupported discovery lang {lang!r}. Use one of: {', '.join(DISCOVERY_LANGS)}"
        )
    LANG = code
    PAGE = ROOT / code / "discoveries" / "discoveries-and-inventions.html"
    AUDIO_DIR = discovery_audio_dir(code)
    MANIFEST_JSON = AUDIO_DIR / "manifest.json"
    ASSIGNMENTS_JSON = AUDIO_DIR / "voice-assignments.json"
    VOICE, DIALOGUE_VOICE = DISCOVERY_VOICES[code]

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
_REFLECTIVE_HEAD_RE = re.compile(
    r"^(elm\s+üçün\s+əhəmiyyəti|insan\s+həyatını\s+necə\s+dəyişib|"
    r"sonrakı\s+inkişafa\s+təsiri|"
    r"why\s+it\s+mattered\s+scientifically|"
    r"how\s+it\s+shaped\s+later\s+developments|"
    r"how\s+it\s+changed\s+human\s+life|"
    r"значение\s+для\s+науки|"
    r"влияние\s+на\s+дальнейшее\s+развитие|"
    r"как\s+изменило\s+жизнь\s+людей)$",
    re.I,
)
_SOURCE_HEAD_RE = re.compile(
    r"^(mənbə|mənbələr|mənbələr və istinadlar|istinad|istinadlar|"
    r"source|sources|sources and references|references|bibliography|"
    r"biblioqrafiya|"
    r"источник|источники|источники и литература|литература|"
    r"kitablar və əsas elmi əsərlər|"
    r"qurumların materialları və ensiklopedik mənbələr|"
    r"rəy verilmiş elmi məqalələr və hesabatlar|"
    r"mətbuat elmi kütləvi nəşrlər və ümumi mənbələr)"
    r"(\b|$)",
    re.I,
)
_URL_RE = re.compile(r"https?://\S+|www\.\S+", re.I)
_CITE_RE = re.compile(
    r"("
    r"encyclopaedia britannica|"
    r"\bisbn\b|"
    r"doi:\s*\d"
    r")",
    re.I,
)
_DIV_OPEN_RE = re.compile(r"<div\b", re.I)
_DIV_CLOSE_RE = re.compile(r"</div>", re.I)


def synthesizer_label() -> str:
    """Same choice generate_story_audio.synthesize_chunk makes at runtime."""
    if azure_speech_ready():
        return "azure-official"
    return "edge-tts-fallback"


def _safe_print(text: str) -> None:
    try:
        print(text, flush=True)
    except UnicodeEncodeError:
        enc = sys.stdout.encoding or "ascii"
        print(text.encode(enc, "replace").decode(enc, "replace"), flush=True)


def _asset_version() -> str:
    try:
        from chrome_restore import SITE_ASSET_VERSION

        base = str(SITE_ASSET_VERSION)
    except Exception:
        base = "20260905search4"
    return f"{base}-{AUDIO_CACHE_TAG}"


def strip_tags(html: str) -> str:
    text = _TAG_RE.sub(" ", html or "")
    return clean_speech_chunk(unescape(text))


def _strip_urls(text: str) -> str:
    cleaned = _URL_RE.sub(" ", text or "")
    return clean_speech_chunk(cleaned)


def _fold_heading(text: str) -> str:
    return fold_az_i(text or "").strip().casefold()


def _is_source_heading(heading: str) -> bool:
    return bool(_SOURCE_HEAD_RE.match(_fold_heading(heading)))


def _is_citation_text(text: str) -> bool:
    raw = (text or "").strip()
    if not raw:
        return True
    if is_source_paragraph(raw):
        return True
    if _URL_RE.search(raw):
        return True
    if _CITE_RE.search(raw):
        return True
    return False


def _remove_class_blocks(html: str, class_name: str) -> str:
    """Remove nested <div class="…class_name…"> trees from article markup."""
    pattern = re.compile(rf"<div\b[^>]*\b{re.escape(class_name)}\b[^>]*>", re.I)
    out: list[str] = []
    i = 0
    while True:
        match = pattern.search(html, i)
        if not match:
            out.append(html[i:])
            break
        out.append(html[i : match.start()])
        pos = match.end()
        depth = 1
        while depth and pos < len(html):
            nxt_open = _DIV_OPEN_RE.search(html, pos)
            nxt_close = _DIV_CLOSE_RE.search(html, pos)
            if not nxt_close:
                pos = len(html)
                break
            if nxt_open and nxt_open.start() < nxt_close.start():
                depth += 1
                pos = nxt_open.end()
            else:
                depth -= 1
                pos = nxt_close.end()
        i = pos
    return "".join(out)


def chunk_text(text: str, max_len: int = 900, min_tail: int = 80) -> list[str]:
    """Split long paragraphs, keeping leftover tails with the previous clip."""
    rest = clean_speech_chunk(text)
    chunks: list[str] = []
    while len(rest) > max_len:
        slice_ = rest[:max_len]
        cut = max(slice_.rfind(". "), slice_.rfind("? "), slice_.rfind("! "), slice_.rfind(" "))
        if cut < 80:
            cut = max_len
        chunk = rest[: cut + 1].strip()
        rest = rest[cut + 1 :].strip()
        if rest and len(rest) < min_tail:
            chunk = clean_speech_chunk(f"{chunk} {rest}")
            rest = ""
        if chunk:
            chunks.append(chunk)
    if rest:
        chunks.append(rest)
    return chunks


def _is_reflective_heading(heading: str) -> bool:
    folded = (
        (heading or "")
        .replace("İ", "i")
        .replace("I", "i")
        .replace("ı", "i")
        .strip()
        .casefold()
    )
    return bool(_REFLECTIVE_HEAD_RE.match(folded))


def speech_parts(inner: str) -> list[tuple[str, str]]:
    """Return (kind, text) parts matching the on-page Listen reader (no chrome).

    Bibliography / Mənbə / Source / URL / attribution blocks are omitted.
    """
    inner = _remove_class_blocks(inner or "", "inventions-entry-references")
    parts: list[tuple[str, str]] = []
    name_m = _NAME_RE.search(inner)
    title = strip_tags(name_m.group(1)) if name_m else ""
    if title and not _is_citation_text(title):
        parts.append(("title", title))

    sum_m = _SUMMARY_RE.search(inner)
    if sum_m:
        summary = _strip_urls(strip_tags(sum_m.group(1)))
        if summary and not _is_citation_text(summary):
            parts.append(("narrative", summary))

    facts_m = _KEY_FACTS_RE.search(inner)
    if facts_m:
        for li in _FACT_RE.findall(facts_m.group(1)):
            fact = _strip_urls(strip_tags(li))
            if fact and not _is_citation_text(fact):
                parts.append(("narrative", fact))

    for section in _SECTION_RE.findall(inner):
        heading_m = _H3_RE.search(section)
        heading = strip_tags(heading_m.group(1)) if heading_m else ""
        if heading and _is_source_heading(heading):
            continue
        calm = _is_reflective_heading(heading)
        if heading and not _is_citation_text(heading):
            parts.append(("title", heading))
        for para in _P_RE.findall(section):
            sent = _strip_urls(strip_tags(para))
            if sent and not _is_citation_text(sent):
                parts.append(("reflective" if calm else "body", sent))
    return parts


def article_segments(inner: str) -> list[dict]:
    segments: list[dict] = []
    body_paras: list[str] = []
    for kind, text in speech_parts(inner):
        chunks = chunk_text(text)
        for i, chunk in enumerate(chunks):
            last = i == len(chunks) - 1
            if kind == "title":
                role, voice_role = "title", "narrator"
                pause = "medium" if last else "short"
            else:
                role, voice_role = classify_paragraph(chunk)
                if kind == "reflective" and voice_role == "narrator" and role == "narrative":
                    role = "reflective"
                pause = "medium" if last and role in ("title", "dialogue") else "short"
                if voice_role == "dialogue":
                    body_paras.append(chunk)
            segments.append(
                {
                    "role": role,
                    "voice_role": voice_role,
                    "text": chunk,
                    "pause_after": pause,
                    "pause_ms": 400 if pause == "short" else 600,
                }
            )
            if voice_role != "dialogue":
                body_paras.append(chunk)
    assign_dialogue_voices(segments, body_paras)
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
                "voice": VOICE,
                "dialogue_voice": DIALOGUE_VOICE,
                "segments": segments,
                "text": " ".join(seg["text"] for seg in segments),
                "chars": sum(len(seg["text"]) for seg in segments),
            }
        )
    return articles


def existing_stems() -> set[str]:
    if not AUDIO_DIR.is_dir():
        return set()
    return {path.stem for path in AUDIO_DIR.glob("*.mp3") if path.is_file()}


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


def write_assignment_log(jobs: list[dict]) -> Path:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    stories: dict[str, dict] = {}
    dialogue_count = 0
    extra_count = 0
    for job in jobs:
        speakers: dict[int, dict] = {}
        for seg in job.get("segments") or []:
            role = seg.get("voice_role") or "narrator"
            if not str(role).startswith("dialogue"):
                continue
            sid = int(seg.get("speaker") or 0)
            if sid not in speakers:
                gender = seg.get("speaker_gender") or (
                    "female" if role == "dialogue_female" else "male"
                )
                voice = DIALOGUE_VOICE if gender == "female" else VOICE
                speakers[sid] = {
                    "id": sid,
                    "gender": gender,
                    "voice": voice,
                    "delivery": seg.get("delivery") or "primary",
                    "sample": (seg.get("text") or "")[:160],
                }
        if speakers:
            dialogue_count += 1
        if any(item.get("delivery") == "extra" for item in speakers.values()):
            extra_count += 1
        stories[job["stem"]] = {
            "title": job.get("title"),
            "narrator": VOICE,
            "dialogue": bool(speakers),
            "speakers": [speakers[k] for k in sorted(speakers)],
        }
    payload = {
        "lang": LANG,
        "kind": "discoveries",
        "prosody": PROSODY_VERSION,
        "narrator_voice": VOICE,
        "female_voice": DIALOGUE_VOICE,
        "male_voice": VOICE,
        "article_count": len(jobs),
        "dialogue_article_count": dialogue_count,
        "extra_speaker_article_count": extra_count,
        "cache_tag": _asset_version(),
        "synthesizer": synthesizer_label(),
        "articles": stories,
    }
    ASSIGNMENTS_JSON.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"voice assignments: articles={len(jobs)} dialogue={dialogue_count} "
        f"extra_speakers={extra_count} log={ASSIGNMENTS_JSON}",
        flush=True,
    )
    return ASSIGNMENTS_JSON


def orphan_mp3s(jobs: list[dict]) -> list[str]:
    known = {job["stem"] for job in jobs}
    if not AUDIO_DIR.is_dir():
        return []
    return sorted(path.stem for path in AUDIO_DIR.glob("*.mp3") if path.stem not in known)


async def run(jobs: list[dict], force: bool) -> None:
    synth = synthesizer_label()
    print(f"Synthesizer: {synth} (Azure official if key present; else edge-tts)", flush=True)
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    write_assignment_log(jobs)
    manifest = load_manifest()
    total = len(jobs)
    done = 0
    skipped = 0
    failed: list[str] = []
    sem = asyncio.Semaphore(MAX_CONCURRENCY)
    lock = asyncio.Lock()

    async def one(job: dict) -> None:
        nonlocal done, skipped
        stem = job["stem"]
        out = AUDIO_DIR / f"{stem}.mp3"
        fp = content_fingerprint(job)
        if out.is_file() and not force:
            existing = manifest.get(stem) or {}
            if (
                existing.get("voice") == VOICE
                and existing.get("dialogue_voice") == DIALOGUE_VOICE
                and existing.get("prosody") == PROSODY_VERSION
                and existing.get("content") == fp
                and out.stat().st_size >= 256
            ):
                async with lock:
                    skipped += 1
                    done += 1
                    print(f"[{done}/{total}] skip {stem}", flush=True)
                return
        _safe_print(
            f"-> {stem} ({job['title']}) chars={job['chars']} segs={len(job['segments'])}"
        )
        async with sem:
            try:
                join_note = await synthesize_story(
                    job["segments"],
                    out,
                    VOICE,
                    stem=stem,
                    dialogue_voice=DIALOGUE_VOICE,
                    single_voice=False,
                )
            except Exception as exc:  # noqa: BLE001
                async with lock:
                    failed.append(stem)
                    done += 1
                    print(f"[{done}/{total}] FAIL {stem}: {exc}", flush=True)
                await asyncio.sleep(2.0)
                return

        async with lock:
            manifest[stem] = {
                "title": job["title"],
                "voice": VOICE,
                "dialogue_voice": DIALOGUE_VOICE,
                "prosody": PROSODY_VERSION,
                "synthesizer": synth,
                "content": fp,
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
            done += 1
            print(
                f"[{done}/{total}] wrote {out} ({out.stat().st_size / 1024:.1f} KB) {join_note}",
                flush=True,
            )
        await asyncio.sleep(0.35)

    await asyncio.gather(*(one(job) for job in jobs))

    MANIFEST_JSON.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    linked = link_discovery_audio()
    orphans = orphan_mp3s(jobs)
    print(
        f"Done. jobs={total} skipped={skipped} failed={len(failed)} "
        f"synthesizer={synth} linked_page={linked} dest={AUDIO_DIR} orphans={len(orphans)}",
        flush=True,
    )
    if orphans:
        print("Orphan MP3 stems: " + ", ".join(orphans), flush=True)
    if failed:
        raise SystemExit("Failed stems: " + ", ".join(failed))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("stems", nargs="*", help="Article id(s)")
    parser.add_argument(
        "--lang",
        default="az",
        choices=DISCOVERY_LANGS,
        help="Discoveries locale (az, en, ru). Default az. KY is not supported.",
    )
    parser.add_argument("--all", action="store_true", help="Generate every discovery article for --lang")
    parser.add_argument("--smoke", action="store_true", help="Generate the first article only")
    parser.add_argument("--force", action="store_true", help="Regenerate even if the MP3 exists")
    parser.add_argument("--link-only", action="store_true", help="Only attach data-audio on the page")
    parser.add_argument(
        "--plan-only",
        action="store_true",
        help="Inventory articles and write voice-assignments.json without synthesizing",
    )
    return parser.parse_args()


def _source_leak_stems(jobs: list[dict]) -> list[str]:
    leak_re = re.compile(
        r"("
        r"mənbə\s*:|istinad\s*:|source\s*:|sources and references|"
        r"\bisbn\b|doi:\s*\d|источник\s*:|источники и литература|"
        r"https?://|www\."
        r")",
        re.I,
    )
    leaked: list[str] = []
    for job in jobs:
        blob = " ".join(seg.get("text") or "" for seg in job.get("segments") or [])
        if leak_re.search(blob):
            leaked.append(job["stem"])
    return leaked


def main() -> None:
    args = parse_args()
    configure_lang(args.lang)
    if not PAGE.is_file():
        raise SystemExit(f"Missing {PAGE}")
    articles = load_articles()
    if not articles:
        raise SystemExit("No discovery articles found")
    leaks = _source_leak_stems(articles)
    _safe_print(
        f"Inventory: {len(articles)} {LANG.upper()} discovery articles from {PAGE}  "
        f"narrator={VOICE} dialogue={DIALOGUE_VOICE} dest={AUDIO_DIR} "
        f"source_leaks={len(leaks)}"
    )
    if leaks:
        print("Source-leak stems: " + ", ".join(leaks[:20]), flush=True)
    if args.plan_only:
        write_assignment_log(articles)
        print(f"existing_mp3s={len(existing_stems())} orphans={len(orphan_mp3s(articles))}")
        return
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
        raise SystemExit("Pass --all, --smoke, --plan-only, or one or more article ids")
    print(
        f"Jobs: {len(selected)}  voice: {VOICE}  dest: {AUDIO_DIR}  "
        f"synthesizer: {synthesizer_label()}",
        flush=True,
    )
    asyncio.run(run(selected, args.force))


if __name__ == "__main__":
    main()
