# Russian wisdom-story illustration regeneration — batch plan

**Status:** In progress via Cursor `GenerateImage` → Pillow WebP (1536×1024). Exact-text rule: on-image Russian must match DOCX character-for-character.

## Pipeline

| Piece | Path / behavior |
|-------|-----------------|
| Sources | `ru/wisdom-stories/{stem}.docx` |
| Assets | `ru/wisdom-stories/illustrations/{stem}.webp` (1536×1024) |
| Prompt export | `tools/export_ru_illustration_prompts.py` |
| Session helpers | `tools/_tmp_ru_illu_session.py` (`png2webp`, `set-status`, `next-pending`, `recount`) |
| Progress init | `tools/_tmp_init_ru_illustration_progress.py` |
| Progress | `docs/reviews/ru-illustration-regen-progress.json` |

## Inventory

| Metric | Count |
|--------|------:|
| DOCX stems | **249** |
| WebP illustrations | **249** (1:1 match) |
| Cyrillic titles | **249** |
| `nazim-hikmet-in-bursa-prison` | absent (no orphan cleanup needed) |

## Session progress (latest)

| Metric | Count |
|--------|------:|
| Regenerated & accepted this session | see `last_session` in progress JSON (baseline was 30 done) |
| Skipped | **0** (nazim already absent) |
| Failed / left pending after reject | retries until exact, then accept |

## Batches

- **B1** — 73 short aphorisms (≤2 body paras) — start here
- **B2–B8** — 25 each; **B9** — 1 remaining longer story

## How to resume

```bash
python tools/_tmp_ru_illu_session.py next-pending 10 B1
python tools/export_ru_illustration_prompts.py --pending --limit 10 --out docs/reviews/ru-illu-prompts-next.json
# After GenerateImage PNG lands under Cursor assets/:
python tools/_tmp_ru_illu_session.py png2webp "C:\Users\BSira\.cursor\projects\c-dev-birinci-web-site\assets\ru-STEM.png" STEM
python tools/_tmp_update_ru_illu_progress.py
```

**QA tips:** Reject invented shop/road signs and bubble text. Watch **ё** vs **е** and em dash **—**. Leave mismatches `pending` and retry.

**Do not** invent/fake WebPs. Do not commit unless asked. Discoveries stays dev-only.
