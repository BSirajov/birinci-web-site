# Phase 1 · Batch 3 report

House style: `docs/HOUSE_STYLE_DIALOGUE.md`

## What this batch did

- Converted ASCII/curly double quotes → «»
- Normalized leading en-dash dialogue markers → em dash —
- Collapsed accidental double spaces / overlong ellipsis where found
- **Did not** remove correct inline «» or rewrite wording
- **Did not** regenerate illustrations or audio

Note: many Tier-2 “mixed” stories already follow the house style (— for turns + «» for inline quotes). Those correctly show as unchanged.

- Batch size: **20**
- Files modified: **4**
- Already compliant / no ASCII to fix: **16**
- Missing DOCX: **0**

## Modified stems

- `try-to-think-this-way` — 1 paragraph(s); tags: {'curly_to_guillemets': 1}
  - before: Düşüncəni dəyişmək həyatını dəyişməyin ilk addımıdır. “Bacarmaram” demək yolu bağlayır, “öyrənərəm” demək isə yeni imkanlar açır. Uğursuzluq son deyil, inkişaf fürsətidir.
  - after:  Düşüncəni dəyişmək həyatını dəyişməyin ilk addımıdır. «Bacarmaram» demək yolu bağlayır, «öyrənərəm» demək isə yeni imkanlar açır. Uğursuzluq son deyil, inkişaf fürsətidir.
- `the-silent-corridor` — 5 paragraph(s); tags: {'curly_to_guillemets': 5, 'ascii_unpaired_skipped': 1}
  - before: “Sənədlər çatdımı? Onlara baxılıbmı?"
  - after:  «Sənədlər çatdımı? Onlara baxılıbmı?"
  - before: “Bəli, sənədlər gəlib. Amma biz onları qəbul etməmişik. Çünki təqdimat forması düzgün deyil və rəsmi prosedura əməl olunmayıb.”
  - after:  «Bəli, sənədlər gəlib. Amma biz onları qəbul etməmişik. Çünki təqdimat forması düzgün deyil və rəsmi prosedura əməl olunmayıb.»
  - before: “Bəs bunu bizə niyə demədiniz?” — deyə sual edirlər.
  - after:  «Bəs bunu bizə niyə demədiniz?» — deyə sual edirlər.
- `at-the-doctors-appointment` — 1 paragraph(s); tags: {'ascii_to_guillemets': 1}
  - before: Gözlərindəki ifadə sanki "mən də acam, yemək istəyirəm" deyirdi. Ürəyim yandı. Bufetə qayıdıb bir sendviç, bir də alma suyu alıb ona verdim. Uşaq iştahla yeməyə başladı. Sevindim, 
  - after:  Gözlərindəki ifadə sanki «mən də acam, yemək istəyirəm» deyirdi. Ürəyim yandı. Bufetə qayıdıb bir sendviç, bir də alma suyu alıb ona verdim. Uşaq iştahla yeməyə başladı. Sevindim, 
- `hayats-life-story` — 1 paragraph(s); tags: {'curly_to_guillemets': 1}
  - before: Həsən əmi evdən gedəndə aynanın qarşısına keçdim — «Həsən» deməyi öyrənəcəkdim. Hər dəfə «Həsən» deyəndə aynada onun saçları tökülmüş başı, burnunun üstünə düşmüş eynəyi, şişmiş qa
  - after:  Həsən əmi evdən gedəndə aynanın qarşısına keçdim — «Həsən» deməyi öyrənəcəkdim. Hər dəfə «Həsən» deyəndə aynada onun saçları tökülmüş başı, burnunun üstünə düşmüş eynəyi, şişmiş qa

## Unchanged stems (already house-style compliant for this pass)

- `your-friends`
- `i-was-so-embarrassed`
- `spend-your-time-with-people`
- `welcome-my-bey`
- `if-the-road-does-not-tire-you-it-is-because-of-your-companion`
- `being-human`
- `he-would-not-have-given-so-little`
- `avoid-these-questions`
- `everything-is-in-our-own-hands`
- `you-cannot-descend-a-well-on-his-rope`
- `expressions-you-should-stay-away-from`
- `telling-lies`
- `the-goose-to-be-plucked`
- `liver`
- `the-diderot-effect`
- `what-it-means-to-be-late`

## Next

1. Spot-check 3–5 modified stories on the site after rebuild
2. Reply **continue Phase 1 batch 4** for the next 20 Tier-2 stems
3. After Phase 1 completes → Phase 2 (Tier 1 long paragraphs)
