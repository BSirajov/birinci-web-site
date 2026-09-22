# Kyrgyz wisdom-story illustration regeneration — batch plan

**Status:** In progress via Cursor `GenerateImage` → Pillow WebP (1536×1024). Exact-text rule enforced with visual QA; invented captions/bubbles rejected.

## Pipeline

| Piece | Path / behavior |
|-------|-----------------|
| Sources | `ky/wisdom-stories/{stem}.docx` |
| Assets | `ky/wisdom-stories/illustrations/{stem}.webp` (1536×1024) |
| Prompt export | `tools/export_ky_illustration_prompts.py` |
| Session helpers | `tools/_tmp_ky_illu_session.py` (`png2webp`, `set-status`, `scrub-nazim`), `tools/_tmp_dump_next_b1.py` |
| Progress | `docs/reviews/ky-illustration-regen-progress.json` |

## Inventory (latest session)

| Metric | Count |
|--------|------:|
| Regenerated & written (WebP overwrite) this session | **26** |
| Cumulative done | **51** |
| Skipped (cumulative) | **1** (`nazim-hikmet-in-bursa-prison`) |
| Failed / not saved this session | left `pending` (invented labels, moral typos, missing body) |
| B1 short aphorisms done | **51 of 76** |

## Sample stems updated (this session)

`what-is-a-word`, `blind-who-have-eyes`, `not-every-sorrow-is-told-to-people`, `dead-remain-in-life`, `spare-time`, `calamity-and-blessing`, `aging`, `communication`, `explaining-ones-sorrow`, `to-be-cool-headed`, `i-kiss-your-eyes`, `living-in-the-past`, `searching`, `turning-hardship-into-opportunity`, `dont-be-words-for-mouths-dust-for-feet`, `secret-of-living-well-and-longevity`, `let-prayer-come-and-find-you`, `three-essential-things-for-a-city`, `do-you-have-spending-money`, `what-we-learn-in-life`, `o-god-give-first-to-the-mountains-and-stones`, `people-who-need-something-from-you`, `to-be-alone`, `mature-person`, `yellow-and-red-flowers`, `ramadan-prayer`, …

## Still pending next (B1)

`do-not-do-these-things`, `newtons-second-law`, `say-what-you-know`, `dont-say-i-couldnt-deliver-or-i-couldnt-manage`, `drinking-the-sherbet-of-martyrdom`, `his-hand-is-at-work`, `fly-in-the-china-shop`, `idle-devil`, …

## How to resume

```bash
# Next pending short stems + exact quotes
python tools/_tmp_dump_next_b1.py 10

# Or full B1 prompt pack
python tools/export_ky_illustration_prompts.py --batch B1 --out docs/reviews/ky-illu-prompts-B1.json

# After GenerateImage PNG lands under Cursor assets/:
python tools/_tmp_ky_illu_session.py png2webp "C:\Users\BSira\.cursor\projects\c-dev-birinci-web-site\assets\ky-STEM.png" STEM
```

**QA tips:** Reject images with invented speech bubbles/sign labels. Watch Kyrgyz **ң** vs **н**. Include *all* DOCX body paragraphs (poems often have 2 lines; exporter lists them as BODY[1], BODY[2]). Reject moral paraphrases (e.g. сөзүңдү ≠ сезимиңди).

**Do not** invent/fake WebPs. **Do not** copy AZ illustrations. Do not commit unless asked.
