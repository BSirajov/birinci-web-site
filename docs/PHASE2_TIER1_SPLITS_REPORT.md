# Phase 2 · Tier-1 long paragraph splits

House style: `docs/HOUSE_STYLE_DIALOGUE.md`

## Method

- Split paragraphs ≥600 characters at sentence / scene boundaries
- No plot or wording rewrites (only paragraph breaks; where needed, guillemets were closed/reopened across paragraphs)
- Illustrations: unchanged
- Audio: regenerate recommended for all 10 stems (pacing/paragraph timing changed)

## Result

| Metric | Value |
|--------|------:|
| Tier-1 stories | 10 |
| Stories modified | **10** |
| Remaining paragraphs ≥600 chars in Tier-1 | **0** |

## Modified stems (audio regen list)

```
teacher-hello-do-you-remember-me
the-mother-of-pearl-flower
the-former-minister-at-the-seminar
the-mullah-and-the-scholar
the-blind-well
the-road-to-the-cotton-field
discussion-and-conflict
how-to-ward-off-insults
why-people-shout-when-they-argue
not-leaving-the-right-path
```

## Notes by story

- **Müəllim, salam…** — 1460-char confession → 3 paragraphs
- **Sədəf çiçəyi** — 2 long blocks → 2+2 parts
- **Keçmiş nazir seminarda** — 1 long turn → 2 parts
- **Molla və alim** — narrative + quoted explanation split carefully
- **Kor quyu** — opening block → 2 parts
- **Pambıq tarlasına gedən yol** — split before closing “Çünki…” beat
- **Müzakirə və münaqişə** — meeting scene → 2 parts
- **Təhqirləri necə dəf etməli** — samurai scene → 2 parts
- **Niyə insanlar mübahisə…** — long explanation → 2 parts
- **Doğru yoldan ayrılmamaq** — padşah episode → 2 parts

## Media

| Asset | Action |
|-------|--------|
| `az/illustrations/{stem}.webp` | Keep (no scene rewrite) |
| `az/audio/{stem}.mp3` | **Regenerated** (2026-08-13) with male Edge TTS `az-AZ-BabekNeural` + prosody v1 |

Asset version bumped to `20260820c` for cache bust.

## Next

- Spot-check the 10 stories on the site (hard-refresh)
- Or **commit and push** if you want Phase 1+2 + audio on GitHub
