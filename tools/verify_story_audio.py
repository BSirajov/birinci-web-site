# -*- coding: utf-8 -*-
"""Verify EN/RU story MP3 coverage, naming, and data-audio wiring."""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from generate_story_audio import content_fingerprint, configure_lang, planned_jobs  # noqa: E402
from i18n_config import story_audio_dir  # noqa: E402
from stories_catalog import load_stories_catalog, stories_data_path  # noqa: E402

_ARTICLE_RE = re.compile(
    r'<article\b(?=[^>]*\bclass="[^"]*\bstory\b)[^>]*?>',
    re.I,
)


def catalog_stems(lang: str) -> list[str]:
    data = load_stories_catalog(lang)
    stems: list[str] = []
    for cat in data.get("categories") or []:
        for story in cat.get("stories") or []:
            stem = story.get("stem")
            if stem:
                stems.append(stem)
    return stems


def verify_lang(lang: str) -> list[str]:
    problems: list[str] = []
    configure_lang(lang)
    stems = catalog_stems(lang)
    audio_dir = story_audio_dir(lang)
    mp3s = {p.stem: p for p in audio_dir.glob("*.mp3") if p.is_file()}
    # Ignore nested pilot/ folder files counted via glob? audio_dir.glob("*.mp3") is non-recursive. Good.
    counts = Counter(stems)
    dups = [s for s, n in counts.items() if n > 1]
    if dups:
        problems.append(f"{lang}: duplicate stems in catalog: {', '.join(dups[:10])}")

    missing = sorted(set(stems) - set(mp3s))
    orphan = sorted(set(mp3s) - set(stems) - {"manifest"})
    tiny = sorted(s for s, p in mp3s.items() if p.stat().st_size < 256)
    if missing:
        problems.append(f"{lang}: missing MP3 ({len(missing)}): {', '.join(missing[:8])}...")
    if orphan:
        problems.append(f"{lang}: orphan MP3 ({len(orphan)}): {', '.join(orphan[:8])}")
    if tiny:
        problems.append(f"{lang}: tiny MP3 ({len(tiny)}): {', '.join(tiny[:8])}")

    # Manifest content fingerprints vs current story text
    manifest_path = audio_dir / "manifest.json"
    manifest = {}
    if manifest_path.is_file():
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            problems.append(f"{lang}: corrupt manifest.json")
            manifest = {}
    jobs = {j["stem"]: j for j in planned_jobs(None)}
    stale = []
    for stem in stems:
        if stem not in mp3s:
            continue
        job = jobs.get(stem)
        if not job:
            continue
        meta = manifest.get(stem) or {}
        fp = content_fingerprint(job)
        if meta.get("content") and meta.get("content") != fp:
            stale.append(stem)
    if stale:
        problems.append(f"{lang}: outdated vs story text ({len(stale)}): {', '.join(stale[:8])}")

    # stories-data.js hasAudio flags
    data_path = stories_data_path(lang)
    if data_path.is_file():
        text = data_path.read_text(encoding="utf-8")
        blob = json.loads(text[text.find("{") : text.rfind("}") + 1])
        flagged_true = set()
        flagged_false = set()
        for cat in blob.get("categories") or []:
            for story in cat.get("stories") or []:
                stem = story.get("stem")
                if not stem:
                    continue
                if story.get("hasAudio"):
                    flagged_true.add(stem)
                else:
                    flagged_false.add(stem)
        bad_false = sorted(set(stems) & set(mp3s) & flagged_false)
        bad_true = sorted(flagged_true - set(mp3s))
        if bad_false:
            problems.append(
                f"{lang}: hasAudio=false but MP3 exists ({len(bad_false)}): {', '.join(bad_false[:8])}"
            )
        if bad_true:
            problems.append(
                f"{lang}: hasAudio=true but MP3 missing ({len(bad_true)}): {', '.join(bad_true[:8])}"
            )

    # Category HTML data-audio links
    cat_dir = ROOT / lang / "categories"
    wrong_link = 0
    missing_attr = 0
    if cat_dir.is_dir():
        for path in cat_dir.glob("*.html"):
            html = path.read_text(encoding="utf-8")
            for tag in _ARTICLE_RE.findall(html):
                stem_m = re.search(r'\bdata-stem="([^"]+)"', tag)
                if not stem_m:
                    continue
                stem = stem_m.group(1)
                audio_m = re.search(r'\bdata-audio="([^"]+)"', tag)
                if stem in mp3s:
                    if not audio_m:
                        missing_attr += 1
                        continue
                    href = audio_m.group(1)
                    if f"{stem}.mp3" not in href:
                        wrong_link += 1
                elif audio_m:
                    wrong_link += 1
    if missing_attr:
        problems.append(f"{lang}: articles missing data-audio ({missing_attr})")
    if wrong_link:
        problems.append(f"{lang}: incorrect data-audio links ({wrong_link})")

    print(
        f"{lang}: stories={len(stems)} mp3={len(mp3s)} "
        f"missing={len(missing)} orphan={len(orphan)} stale={len(stale)} problems={len(problems)}"
    )
    return problems


def main() -> None:
    all_problems: list[str] = []
    for lang in ("en", "ru"):
        all_problems.extend(verify_lang(lang))
    if all_problems:
        print("FAIL")
        for line in all_problems:
            print(" -", line)
        raise SystemExit(1)
    print("OK: EN/RU audio coverage and links look correct")


if __name__ == "__main__":
    main()
