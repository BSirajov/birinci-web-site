# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
stats = json.loads((ROOT / "docs" / "_az_lang_analysis.json").read_text(encoding="utf-8"))

long = OrderedDict()
for item in stats["long_paras"]:
    # keep max len per stem
    prev = long.get(item["stem"])
    if not prev or item["len"] > prev["len"]:
        long[item["stem"]] = item

mixed = OrderedDict()
for item in stats["mixed"]:
    mixed[item["stem"]] = item

both = [stem for stem in long if stem in mixed]
tier2 = OrderedDict((stem, item) for stem, item in mixed.items() if stem not in long)

lines: list[str] = []
lines.append("# Stories affected by recommended language modifications")
lines.append("")
lines.append("Derived from the language review. Use this to plan illustration/audio regeneration.")
lines.append("")
lines.append("## Regeneration rule of thumb")
lines.append("")
lines.append("| Change type | Illustrations (`.webp`) | Audio (`.mp3`) |")
lines.append("|-------------|-------------------------|----------------|")
lines.append("| Punctuation / quote style only (`—`, `«»`, ASCII) | **No** | **No** (spoken words unchanged) |")
lines.append("| Paragraph splits without rephrasing | **No** | **Usually no** |")
lines.append("| Wording / fluency rewrite | **Only if scene/meaning changes** | **Yes** |")
lines.append("| New scenes or character actions | **Yes** | **Yes** |")
lines.append("")
lines.append(
    f"**Summary:** Tier 1 = **{len(long)}** stories (structure / possible rewrite). "
    f"Tier 2 = **{len(tier2)}** stories (dialogue punctuation only). "
    f"**{len(both)}** stories appear in both."
)
lines.append("")
lines.append("If you only apply the review’s punctuation + paragraph-split recommendations **without rewriting meaning**, expect:")
lines.append("")
lines.append("- **Illustrations to regenerate: 0** (unless you later change story content)")
lines.append(f"- **Audio to regenerate: mainly the Tier 1 set ({len(long)})**, and only if phrasing changes when splitting")
lines.append(f"- **Tier 2 ({len(tier2)}): text files only** — no illustration/audio regen required for punctuation unification")
lines.append("")

lines.append("## Tier 1 — Long paragraphs (highest chance of text change)")
lines.append("")
lines.append(f"Count: **{len(long)}** unique stories.")
lines.append("")
lines.append("| # | Category | Title | Stem | Longest para (chars) | Also mixed dialogue? |")
lines.append("|---|----------|-------|------|---------------------:|----------------------|")
for i, (stem, item) in enumerate(long.items(), 1):
    mix = "yes" if stem in mixed else "no"
    lines.append(
        f"| {i} | {item['cat']} | {item['title']} | `{stem}` | {item['len']} | {mix} |"
    )

lines.append("")
lines.append("### Tier 1 file paths")
lines.append("")
for stem in long:
    lines.append(f"- `az/illustrations/{stem}.webp`")
    lines.append(f"- `az/audio/{stem}.mp3`")
lines.append("")

lines.append("## Tier 2 — Mixed dialogue punctuation only (not in Tier 1)")
lines.append("")
lines.append(f"Count: **{len(tier2)}** stories.")
lines.append("")
lines.append("| # | Category | Title | Stem | Styles mixed |")
lines.append("|---|----------|-------|------|--------------|")
for i, (stem, item) in enumerate(tier2.items(), 1):
    styles = ", ".join(item["styles"])
    lines.append(
        f"| {i} | {item['cat']} | {item['title']} | `{stem}` | {styles} |"
    )

lines.append("")
lines.append("## Stem lists (copy/paste)")
lines.append("")
lines.append("### Tier 1 stems")
lines.append("")
lines.append("```")
lines.extend(long.keys())
lines.append("```")
lines.append("")
lines.append("### Tier 2-only stems")
lines.append("")
lines.append("```")
lines.extend(tier2.keys())
lines.append("```")
lines.append("")

out = ROOT / "docs" / "STORIES_AFFECTED_BY_LANGUAGE_FIXES.md"
out.write_text("\n".join(lines), encoding="utf-8")
print(f"tier1={len(long)} tier2={len(tier2)} both={len(both)}")
print("wrote", out)
for stem, item in long.items():
    print(f"T1\t{item['len']}\t{stem}\t{item['title']}")
