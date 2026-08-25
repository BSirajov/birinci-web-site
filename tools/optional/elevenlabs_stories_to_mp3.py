# -*- coding: utf-8 -*-
"""Bulk-convert story .docx files to MP3 via the ElevenLabs text-to-speech API.

Reads ELEVENLABS_API_KEY from the environment or an optional gitignored .env
in the repo root. Voice ID comes from --voice-id or ELEVENLABS_VOICE_ID.
Never hardcode a key or voice ID.

Writes {stem}.mp3 to --out (default %USERPROFILE%\\Downloads\\{lang}-mp3).
Does not write into {lang}/wisdom-stories/audio/ unless --install-to-site is passed.

Examples (PowerShell):
  $env:ELEVENLABS_API_KEY="..."
  $env:ELEVENLABS_VOICE_ID="..."
  python tools/optional/elevenlabs_stories_to_mp3.py --lang ky --limit 2

Examples (cmd):
  set ELEVENLABS_API_KEY=...
  set ELEVENLABS_VOICE_ID=...
  python tools/optional/elevenlabs_stories_to_mp3.py --lang ky --limit 2

Or put those two names in a repo-root .env (gitignored). Copy the voice ID
from ElevenLabs Voice Library: open the voice, then copy Voice ID.
https://elevenlabs.io/app/voice-library
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

from docx import Document

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
from i18n_config import SUPPORTED_LANGS, language_by_code, story_audio_dir, story_sources  # noqa: E402

TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
VOICE_LIBRARY_URL = "https://elevenlabs.io/app/voice-library"
DEFAULT_MODEL = "eleven_v3"
CHUNK_CHARS = 4500
V3_HARD_LIMIT = 5000
DEFAULT_SLEEP_S = 1.0
MAX_RETRIES = 8
RETRY_BASE_DELAY = 2.0
RETRY_MAX_DELAY = 60.0
REQUEST_TIMEOUT_S = 180

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
    "the-silent-corridor",
}
_SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?…])\s+")
_ALLOWED_ENV_KEYS = ("ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID")


def fold_az_i(text: str) -> str:
    """Map dotted/dotless I so AZ/TR İ matches ASCII i (same as the site builder)."""
    return (text or "").replace("İ", "i").replace("I", "i").replace("ı", "i")


def is_moral_paragraph(text: str) -> bool:
    return bool(_MORAL_RE.match(fold_az_i((text or "").strip())))


def is_source_paragraph(text: str) -> bool:
    return bool(_SOURCE_RE.search(fold_az_i((text or "").strip().strip("«»\"“”"))))


def load_dotenv(path: Path) -> None:
    """Load KEY=value lines into os.environ if the name is not already set."""
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        if key not in _ALLOWED_ENV_KEYS:
            continue
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def default_language_code(lang: str) -> str:
    meta = language_by_code(lang) or {}
    return str(meta.get("html_lang") or lang)


def default_out_dir(lang: str) -> Path:
    return Path.home() / "Downloads" / f"{lang}-mp3"


def discover_docx(lang: str) -> list[Path]:
    folder = story_sources(lang)
    if not folder.is_dir():
        raise SystemExit(f"Missing stories folder: {folder}")
    paths = sorted(folder.glob("*.docx"), key=lambda p: p.stem.casefold())
    if not paths:
        raise SystemExit(f"No .docx files in {folder}")
    return paths


def read_docx_paragraphs(path: Path) -> list[str]:
    return [
        (p.text or "").strip()
        for p in Document(str(path)).paragraphs
        if (p.text or "").strip()
    ]


def speech_text_from_docx(path: Path) -> str:
    """Title + body + moral. Skip trailing source lines (same SOURCE_RE as the site)."""
    paras = read_docx_paragraphs(path)
    if not paras:
        return ""
    title = paras[0]
    body: list[str] = []
    for i, para in enumerate(paras[1:], start=1):
        if is_source_paragraph(para):
            continue
        if (
            path.stem in _AUTHOR_SOURCE_STEMS
            and i == len(paras) - 1
            and not is_moral_paragraph(para)
        ):
            continue
        if title and para.casefold() == title.casefold():
            continue
        body.append(para)
    parts = [title, *body]
    return "\n\n".join(p for p in parts if p)


def chunk_text(text: str, max_chars: int = CHUNK_CHARS) -> list[str]:
    """Split near max_chars on paragraph, then sentence, then word boundaries."""
    text = (text or "").strip()
    if not text:
        return []
    if len(text) <= max_chars:
        return [text]

    chunks: list[str] = []

    def flush(parts: list[str], joiner: str) -> None:
        piece = joiner.join(parts).strip()
        if piece:
            chunks.append(piece)

    def split_long(piece: str, joiner: str, parts: list[str]) -> list[str]:
        if len(piece) <= max_chars:
            return parts + [piece]
        if joiner == "\n\n":
            bits = _SENTENCE_SPLIT_RE.split(piece)
            next_joiner = " "
        else:
            bits = piece.split()
            next_joiner = " "
        acc: list[str] = []
        acc_len = 0
        overflow: list[str] = []
        for bit in bits:
            extra = len(next_joiner) if acc else 0
            if acc and acc_len + extra + len(bit) > max_chars:
                overflow.append(next_joiner.join(acc))
                acc = [bit]
                acc_len = len(bit)
            else:
                acc.append(bit)
                acc_len += extra + len(bit)
        if acc:
            overflow.append(next_joiner.join(acc))
        out = parts
        for item in overflow:
            if len(item) <= max_chars:
                out.append(item)
            else:
                for i in range(0, len(item), max_chars):
                    out.append(item[i : i + max_chars])
        return out

    current: list[str] = []
    current_len = 0
    for para in text.split("\n\n"):
        para = para.strip()
        if not para:
            continue
        extra = 2 if current else 0
        if current and current_len + extra + len(para) > max_chars:
            flush(current, "\n\n")
            current = []
            current_len = 0
        if len(para) > max_chars:
            if current:
                flush(current, "\n\n")
                current = []
                current_len = 0
            for piece in split_long(para, "\n\n", []):
                chunks.append(piece)
            continue
        current.append(para)
        current_len += extra + len(para)
    if current:
        flush(current, "\n\n")

    oversized = [c for c in chunks if len(c) > V3_HARD_LIMIT]
    if oversized:
        raise SystemExit(
            f"A text chunk is still {len(oversized[0])} chars (v3 limit {V3_HARD_LIMIT})."
        )
    return chunks


def _safe_print(text: str) -> None:
    try:
        print(text, flush=True)
    except UnicodeEncodeError:
        enc = sys.stdout.encoding or "ascii"
        print(text.encode(enc, "replace").decode(enc, "replace"), flush=True)


def _http_error_detail(exc: urllib.error.HTTPError) -> str:
    raw = exc.read() if hasattr(exc, "read") else b""
    if not raw:
        return exc.reason or str(exc)
    try:
        payload = json.loads(raw.decode("utf-8", errors="replace"))
    except json.JSONDecodeError:
        return raw.decode("utf-8", errors="replace")[:300]
    detail = payload.get("detail")
    if isinstance(detail, dict):
        return str(detail.get("message") or detail.get("status") or detail)
    if isinstance(detail, str):
        return detail
    return str(payload)[:300]


def synthesize_chunk(
    text: str,
    *,
    api_key: str,
    voice_id: str,
    model: str,
    language_code: str,
) -> bytes:
    url = TTS_URL.format(voice_id=voice_id)
    payload: dict[str, str] = {"text": text, "model_id": model}
    if language_code:
        payload["language_code"] = language_code
    body = json.dumps(payload).encode("utf-8")
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    last_err = "unknown error"
    for attempt in range(1, MAX_RETRIES + 1):
        req = urllib.request.Request(url, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_S) as resp:
                audio = resp.read()
            if len(audio) < 64:
                raise RuntimeError("ElevenLabs returned empty or tiny audio")
            return audio
        except urllib.error.HTTPError as exc:
            status = int(exc.code)
            last_err = f"HTTP {status}: {_http_error_detail(exc)}"
            retryable = status == 429 or 500 <= status <= 599
            if not retryable or attempt >= MAX_RETRIES:
                raise RuntimeError(last_err) from None
            retry_after = exc.headers.get("Retry-After") if exc.headers else None
            try:
                delay = float(retry_after) if retry_after else 0.0
            except ValueError:
                delay = 0.0
            if delay <= 0:
                delay = min(RETRY_MAX_DELAY, RETRY_BASE_DELAY * (2 ** (attempt - 1)))
            _safe_print(f"  retry {attempt}/{MAX_RETRIES}: {last_err} (sleep {delay:.1f}s)")
            time.sleep(delay)
        except (urllib.error.URLError, TimeoutError, RuntimeError) as exc:
            last_err = str(exc)
            if attempt >= MAX_RETRIES:
                raise RuntimeError(last_err) from None
            delay = min(RETRY_MAX_DELAY, RETRY_BASE_DELAY * (2 ** (attempt - 1)))
            _safe_print(f"  retry {attempt}/{MAX_RETRIES}: {last_err} (sleep {delay:.1f}s)")
            time.sleep(delay)
    raise RuntimeError(f"Failed after {MAX_RETRIES} tries: {last_err}")


def find_ffmpeg() -> str | None:
    return shutil.which("ffmpeg")


def concat_mp3(parts: list[Path], dest: Path) -> None:
    if len(parts) == 1:
        shutil.copyfile(parts[0], dest)
        return
    ffmpeg = find_ffmpeg()
    if ffmpeg:
        with tempfile.TemporaryDirectory(prefix="birinci-el-") as tmp:
            lst = Path(tmp) / "concat.txt"
            lines = [f"file '{part.resolve().as_posix()}'" for part in parts]
            lst.write_text("\n".join(lines) + "\n", encoding="utf-8")
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
                    "-c",
                    "copy",
                    str(dest),
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            if result.returncode == 0 and dest.is_file() and dest.stat().st_size >= 64:
                return
    dest.write_bytes(b"".join(p.read_bytes() for p in parts))


def resolve_api_key() -> str:
    key = (os.environ.get("ELEVENLABS_API_KEY") or "").strip()
    if key:
        return key
    raise SystemExit(
        "Missing ELEVENLABS_API_KEY. Set it in the environment or in a repo-root .env "
        "(gitignored).\n"
        "  PowerShell:  $env:ELEVENLABS_API_KEY=\"your-key\"\n"
        "  cmd:         set ELEVENLABS_API_KEY=your-key"
    )


def resolve_voice_id(cli_value: str | None) -> str:
    voice_id = (cli_value or os.environ.get("ELEVENLABS_VOICE_ID") or "").strip()
    if voice_id:
        return voice_id
    raise SystemExit(
        "Missing voice ID. Pass --voice-id or set ELEVENLABS_VOICE_ID.\n"
        "Copy it from ElevenLabs Voice Library: open the voice, then copy Voice ID.\n"
        f"{VOICE_LIBRARY_URL}"
    )


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("stems", nargs="*", help="Optional story stem(s), e.g. friend-of-god")
    parser.add_argument(
        "--lang",
        choices=SUPPORTED_LANGS,
        default="ky",
        help="Locale tree from languages.json. Default ky.",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Output directory. Default: %%USERPROFILE%%\\Downloads\\{lang}-mp3",
    )
    parser.add_argument("--limit", type=int, default=None, metavar="N", help="Convert at most N stories")
    parser.add_argument(
        "--skip-existing",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Skip stems that already have an MP3 in --out (default: true)",
    )
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"ElevenLabs model id (default: {DEFAULT_MODEL})")
    parser.add_argument(
        "--language-code",
        default=None,
        help="ElevenLabs language_code. Default: html_lang from languages.json for --lang.",
    )
    parser.add_argument(
        "--voice-id",
        default=None,
        help="ElevenLabs voice ID. Default: ELEVENLABS_VOICE_ID from the environment or .env.",
    )
    parser.add_argument(
        "--install-to-site",
        action="store_true",
        help="Also copy each MP3 to {lang}/wisdom-stories/audio/{stem}.mp3 (off by default).",
    )
    parser.add_argument(
        "--sleep",
        type=float,
        default=DEFAULT_SLEEP_S,
        help=f"Seconds to wait between API requests (default: {DEFAULT_SLEEP_S:g})",
    )
    return parser.parse_args(argv)


def main() -> None:
    load_dotenv(ROOT / ".env")
    args = parse_args()
    api_key = resolve_api_key()
    voice_id = resolve_voice_id(args.voice_id)
    lang = args.lang
    language_code = (args.language_code or default_language_code(lang)).strip()
    out_dir = Path(args.out) if args.out else default_out_dir(lang)
    out_dir = out_dir.expanduser()
    site_audio = story_audio_dir(lang)

    paths = discover_docx(lang)
    if args.stems:
        wanted = set(args.stems)
        found = {p.stem for p in paths}
        missing = sorted(wanted - found)
        if missing:
            raise SystemExit(f"Unknown story stem(s) for {lang}: {', '.join(missing)}")
        paths = [p for p in paths if p.stem in wanted]
    if args.limit is not None:
        if args.limit < 1:
            raise SystemExit("--limit must be >= 1")
        paths = paths[: args.limit]

    out_dir.mkdir(parents=True, exist_ok=True)
    if args.install_to_site:
        site_audio.mkdir(parents=True, exist_ok=True)

    _safe_print(
        f"Stories: {len(paths)}  lang: {lang}  language_code: {language_code}  "
        f"model: {args.model}  out: {out_dir}  install_to_site: {args.install_to_site}"
    )

    generated = 0
    skipped = 0
    failed: list[str] = []
    api_calls = 0

    for path in paths:
        stem = path.stem
        dest = out_dir / f"{stem}.mp3"
        if args.skip_existing and dest.is_file() and dest.stat().st_size >= 64:
            _safe_print(f"skip existing {stem}")
            skipped += 1
            continue
        text = speech_text_from_docx(path)
        if not text:
            _safe_print(f"skip empty {stem}")
            skipped += 1
            continue
        chunks = chunk_text(text)
        _safe_print(f"{stem}: {len(text)} chars, {len(chunks)} chunk(s)")
        try:
            with tempfile.TemporaryDirectory(prefix="birinci-el-") as tmp:
                tmp_dir = Path(tmp)
                parts: list[Path] = []
                for i, chunk in enumerate(chunks):
                    if api_calls and args.sleep > 0:
                        time.sleep(args.sleep)
                    audio = synthesize_chunk(
                        chunk,
                        api_key=api_key,
                        voice_id=voice_id,
                        model=args.model,
                        language_code=language_code,
                    )
                    api_calls += 1
                    part = tmp_dir / f"{stem}-{i:03d}.mp3"
                    part.write_bytes(audio)
                    parts.append(part)
                concat_mp3(parts, dest)
            if args.install_to_site:
                shutil.copy2(dest, site_audio / f"{stem}.mp3")
            generated += 1
            _safe_print(f"  wrote {dest}")
        except Exception as exc:  # noqa: BLE001 - keep going through the batch
            failed.append(stem)
            if dest.exists():
                dest.unlink(missing_ok=True)
            _safe_print(f"  failed {stem}: {exc}")

    _safe_print(
        f"Done. generated={generated} skipped={skipped} failed={len(failed)} out={out_dir}"
    )
    if failed:
        raise SystemExit("Failed stems: " + ", ".join(failed))


if __name__ == "__main__":
    main()
