# Azerbaijani wisdom-story illustration regeneration — batch plan

**Status:** In progress via Cursor `GenerateImage` → Pillow WebP (1536×1024). Exact-text rule: on-image Azerbaijani must match DOCX character-for-character (`ə/ı/ğ/ö/ü/ş/ç`).

## Pipeline

| Piece | Path / behavior |
|-------|-----------------|
| Sources | `az/wisdom-stories/{stem}-AZ-redakte.docx` |
| Assets | `az/wisdom-stories/illustrations/{stem}.webp` (1536×1024) |
| Prompt export | `tools/export_az_illustration_prompts.py` |
| Session helpers | `tools/_tmp_az_illu_session.py` (`png2webp`, `set-status`, `next-pending`, `recount`) |
| Progress init | `tools/_tmp_init_az_illustration_progress.py` |
| Progress update | `tools/_tmp_update_az_illu_progress.py` |
| Progress | `docs/reviews/az-illustration-regen-progress.json` |

## Inventory

| Metric | Count |
|--------|------:|
| DOCX stems | **249** (`*-AZ-redakte.docx`) |
| WebP illustrations | **249** (1:1 match) |
| `nazim-hikmet-in-bursa-prison` | absent (no orphan cleanup needed) |

## Session progress (latest)

| Metric | Count |
|--------|------:|
| Regenerated & accepted this session | **+35** (from prior 214) |
| Cumulative done / pending | **249** / **0** |
| B1–B9 progress | **all complete** |
| Nazim | absent (no cleanup) |

All 249 AZ illustration regenerations accepted. Resume not needed unless a stem is reopened for QA.

## Batches

- **B1** — 73 short aphorisms (≤2 body paras) — **done**
- **B2–B8** — 25 each — **done**
- **B9** — 1 (`hot-bread`) — **done**

## How to resume (if reopening a stem)

```bash
python tools/_tmp_az_illu_session.py next-pending 10
python tools/export_az_illustration_prompts.py --stem STEM --out docs/reviews/az-illu-prompts-next.json
# After GenerateImage PNG lands under Cursor assets/:
python tools/_tmp_az_illu_session.py png2webp "C:\Users\BSira\.cursor\projects\c-dev-birinci-web-site\assets\az-STEM.png" STEM
python tools/_tmp_update_az_illu_progress.py
```

**QA tips:** Prefer title+moral-only on-image text for long stories. Reject invented shop/road signs, desk labels, bubble paraphrases, English `MORAL`, and floating glyph artifacts from prompt wording. Watch **ə** vs **e**, **ı** vs **i**, and **İ**.

**Do not** invent/fake WebPs. Do not commit unless asked. Discoveries stays dev-only.
