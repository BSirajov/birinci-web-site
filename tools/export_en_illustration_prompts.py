# -*- coding: utf-8 -*-
"""Export resume-friendly EN wisdom-story illustration prompts from DOCX.

Does not call any image API. Use when regenerating
`en/wisdom-stories/illustrations/{stem}.webp` so on-image English text matches
the story exactly.

  python tools/export_en_illustration_prompts.py --pending --limit 5
  python tools/export_en_illustration_prompts.py --stem baklava
  python tools/export_en_illustration_prompts.py --batch B1 --out docs/reviews/en-illu-prompts-B1.json
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from rebuild_stories_from_docx import parse_story_docx  # noqa: E402

PROGRESS = ROOT / "docs" / "reviews" / "en-illustration-regen-progress.json"
DOCX_DIR = ROOT / "en" / "wisdom-stories"
OUT_DIR = ROOT / "docs" / "reviews"

STYLE = (
    "Multi-panel storybook comic illustration, 1536x1024 landscape. "
    "Warm digital painting, clear panel borders, numbered reading order. "
    "Title banner at top and moral banner at bottom. "
    "English text only. No Russian, Azerbaijani, Kyrgyz, or Turkish text. "
    "Every letter of English text on the image must match the Exact quotes "
    "below character-for-character (spelling, punctuation, capitalization). "
    "Do not paraphrase, translate, or invent dialogue."
)


def load_progress() -> dict:
    if not PROGRESS.is_file():
        return {"entries": [], "batches": []}
    return json.loads(PROGRESS.read_text(encoding="utf-8"))


def stems_for_batch(log: dict, batch_id: str) -> list[str]:
    for b in log.get("batches") or []:
        if b.get("id") == batch_id:
            return list(b.get("stems") or [])
    raise SystemExit(f"unknown batch id: {batch_id}")


def build_prompt(stem: str) -> dict:
    path = DOCX_DIR / f"{stem}.docx"
    if not path.is_file():
        raise FileNotFoundError(path)
    story = parse_story_docx(path)
    quotes: list[str] = [f"TITLE: {story.title}"]
    for i, para in enumerate(story.body, 1):
        quotes.append(f"BODY[{i}]: {para}")
    if story.moral:
        quotes.append(f"MORAL: {story.moral}")

    dialogue_hint = (
        "Put spoken lines in speech bubbles using only quoted dialogue from BODY "
        '(lines that use quotation marks or dialogue attribution). Put narrative '
        "captions only when needed, copied verbatim from BODY. Moral banner must "
        "use MORAL exactly. Do not invent shop signs, price tags, or labels unless "
        "that exact English string appears in BODY."
    )
    prompt = "\n\n".join(
        [
            STYLE,
            dialogue_hint,
            f"Story stem: {stem}",
            "Exact quotes (copy verbatim onto the image where text appears):",
            "\n".join(quotes),
            "Scene: depict the characters, setting, and key actions from this story "
            "in chronological panel order so a reader who knows the text recognizes it.",
        ]
    )
    return {
        "stem": stem,
        "title": story.title,
        "moral": story.moral,
        "body": story.body,
        "output_webp": f"en/wisdom-stories/illustrations/{stem}.webp",
        "prompt": prompt,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stem", action="append", default=[], help="One or more stems")
    ap.add_argument("--batch", help="Batch id from progress JSON (e.g. B1)")
    ap.add_argument("--pending", action="store_true", help="All pending entries")
    ap.add_argument("--limit", type=int, default=0, help="Max stems to export")
    ap.add_argument("--out", type=Path, help="Write JSON export path")
    args = ap.parse_args()

    log = load_progress()
    stems: list[str] = []
    if args.stem:
        stems.extend(args.stem)
    if args.batch:
        stems.extend(stems_for_batch(log, args.batch))
    if args.pending:
        stems.extend(
            e["stem"]
            for e in log.get("entries") or []
            if e.get("status", "pending") == "pending"
        )
    if not stems:
        stems = [
            e["stem"]
            for e in log.get("entries") or []
            if e.get("status", "pending") == "pending"
        ][:1]
    seen: set[str] = set()
    ordered: list[str] = []
    for s in stems:
        if s not in seen:
            seen.add(s)
            ordered.append(s)
    if args.limit and args.limit > 0:
        ordered = ordered[: args.limit]

    items = [build_prompt(s) for s in ordered]
    payload = {
        "count": len(items),
        "asset_rule": "Save final art as WebP 1536x1024 at output_webp; HTML paths unchanged",
        "text_rule": "On-image English must match Exact quotes exactly",
        "items": items,
    }
    text = json.dumps(payload, ensure_ascii=False, indent=2)
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(text, encoding="utf-8")
        print(f"wrote {args.out} ({len(items)} prompts)")
    else:
        print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
