# Birİnci — Dialogue & paragraph house style

**Status:** Approved for automated cleanup · 2026-08-13  
**Scope:** Azerbaijani story texts in `source/stories/az/*.docx` (source of truth) → rebuild updates `az/data/stories.json` and site HTML.

## 1. Dialogue punctuation

### 1.1 Spoken turns (preferred)
Use a leading em dash for each speaker turn, one turn per paragraph:

```
— Mən gedirəm.
— Haraya?
```

Attribution on the same turn is fine:

```
— Gözləyin, indi sizə göstərəcəyəm, — dedi dərviş.
```

### 1.2 Allowed alternative
Guillemets with trailing attribution (common literary AZ form) are allowed:

```
«Ana, bura çox gözəl yer imiş», — dedi.
```

Do **not** mix both styles randomly inside one short exchange without reason; prefer leading `—` for new edits.

### 1.3 Guillemets «…» — keep for non-turn quotation
Use `«…»` for:

- titles of works (`«Kainat işığı»`)
- sayings / proverbs / fixed expressions
- thoughts and reported fragments inside narration
- inscriptions, letters, notebook lines, signs
- short emphasized words inside a sentence (`«satın ala»`)

### 1.4 Forbidden in new/cleaned text
- ASCII straight quotes `"` … `"`
- Typographic English curly quotes `“` … `”`
- Using `«…»` for every spoken turn when the story already uses leading `—` for the same exchange (prefer one system per exchange)

### 1.5 Dash character
Dialogue dash is the em dash `—` (U+2014). Do not use `--` or a bare hyphen for speaker turns.

## 2. Paragraph logic

- New paragraph on each dialogue turn
- New paragraph on time/scene shift
- Keep the moral/aphorism as the **final** short paragraph when the story has narrative body
- Split paragraphs longer than ~600 characters (Tier 1 pass — separate from punctuation cleanup)

## 3. What automation may change (Phase 1)

| Allowed auto change | Not allowed in Phase 1 |
|---------------------|-------------------------|
| `"` / `“”` → `«»` | Plot / wording / meaning changes |
| Normalize dialogue dash glyph | Removing correct inline `«»` |
| Collapse accidental double spaces | Regenerating images/audio |
| Light ellipsis normalization (`....` → `…`) | Tier 1 long-paragraph splits |

## 4. Media regeneration

- Phase 1 punctuation-only: **no** new illustrations, **no** new audio
- Later wording changes: regenerate **audio** for those stems; illustrations only if scene/meaning changes

## 5. Batch workflow

1. Freeze this style (done)
2. Phase 1 batches (~20 Tier-2 stems): ASCII cleanup + compliance report
3. Spot-check → continue
4. Phase 2: Tier 1 long-paragraph splits (human-approved)
