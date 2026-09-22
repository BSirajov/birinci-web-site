# English wisdom-story illustration regeneration — batch plan

**Status:** In progress via Cursor `GenerateImage` → Pillow WebP (1536×1024). Exact-text rule: on-image English must match DOCX character-for-character.

## Pipeline

| Piece | Path / behavior |
|-------|-----------------|
| Sources | `en/wisdom-stories/{stem}.docx` |
| Assets | `en/wisdom-stories/illustrations/{stem}.webp` (1536×1024) |
| Prompt export | `tools/export_en_illustration_prompts.py` |
| Session helpers | `tools/_tmp_en_illu_session.py` (`png2webp`, `set-status`, `next-pending`, `recount`) |
| Progress init | `tools/_tmp_init_en_illustration_progress.py` |
| Progress | `docs/reviews/en-illustration-regen-progress.json` |

## Inventory

| Metric | Count |
|--------|------:|
| DOCX stems | **249** |
| WebP illustrations | **249** (1:1 match) |
| `nazim-hikmet-in-bursa-prison` | absent (no orphan cleanup needed) |

## Session progress (latest)

| Metric | Count |
|--------|------:|
| Regenerated & accepted | see `last_session` in progress JSON |
| B1 | in progress |
| Pending overall | ~223 |

## Batches

- **B1** — 73 short aphorisms (≤2 body paras) — start here
- **B2–B8** — 25 each; **B9** — 1 remaining longer story

## How to resume

```bash
python tools/_tmp_en_illu_session.py next-pending 10 B1
python tools/export_en_illustration_prompts.py --stem STEM --out docs/reviews/en-illu-prompts-next.json
# After GenerateImage PNG lands under Cursor assets/:
python tools/_tmp_en_illu_session.py png2webp "C:\Users\BSira\.cursor\projects\c-dev-birinci-web-site\assets\en-STEM.png" STEM
python tools/_tmp_update_en_illu_progress.py
```

**QA tips:** Reject invented shop/road signs (VINEGAR/HONEY, PROBLEM/OPTIONS), bubble paraphrases, meta labels (`BODY:`/`TITLE:`), and missing body text. Leave mismatches `pending` and retry. Never overwrite with wrong-speaker or paraphrased text.

**Do not** invent/fake WebPs. Do not commit unless asked. Discoveries stays dev-only.
