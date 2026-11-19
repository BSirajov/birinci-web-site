# Quotation-mark style scan

## Summary per language

| language | stories scanned | mixed | unbalanced | nested (check manually) | foreign but consistent | mixed apostrophes |
|---|---:|---:|---:|---:|---:|---:|
| az | 251 | 0 | 0 | 2 | 0 | 0 |
| en | 246 | 0 | 15 | 19 | 0 | 1 |
| de | 246 | 0 | 0 | 17 | 0 | 0 |
| ru | 246 | 0 | 0 | 0 | 0 | 0 |
| ky | 246 | 0 | 0 | 0 | 0 | 0 |
| **total** | **1235** | **0** | **15** | **38** | **0** | **1** |

Expected styles: az: guillemets «» (or curly double “”); en: curly double “”; de: German low-quote „“; ru: guillemets «»; ky: guillemets «» (or curly double “”)

CSV (mixed/unbalanced): `docs/reviews/quote-style-scan-20261119/mixed-quotation-marks.csv`
CSV (nested): `docs/reviews/quote-style-scan-20261119/nested-quotes-check-manually.csv`
CSV (foreign consistent): `docs/reviews/quote-style-scan-20261119/foreign-style-consistent.csv`
CSV (mixed apostrophes): `docs/reviews/quote-style-scan-20261119/mixed-apostrophes.csv`

## Mixed / unbalanced stories

### AZ (0)

_None._

### EN (15)

| # | title | path | styles found | unbalanced | example |
|---:|---|---|---|---|---|
| 14 | If fate allows | `en/categories/iman-ve-meneviyyat.html#if-fate-allows` | curly_double=8; curly_single=1 | True | [curly_double] Someone who used to say, “We'll meet,” now says, “We'll meet if f \|\| [curly_single] t. Do not put off seeing them by saying ‘if fate allows'—meet them today and lif |
| 28 | The pleasure of Allah | `en/categories/iman-ve-meneviyyat.html#pleasure-of-allah` | curly_double=3 | True | [curly_double] “I explored the paths that lead to Allah |
| 31 | Begin with self-examination | `en/categories/iman-ve-meneviyyat.html#begin-with-self-examination` | curly_double=8 | True | [curly_double] “Where does misfortune come from?” |
| 47 | Spinach | `en/categories/aile-ve-terbiye.html#spinach` | curly_double=7; curly_single=2 | True | [curly_double] “Eat plenty. It will make you strong,” s \|\| [curly_single] “‘Spinach is very good for you. That's wh |
| 56 | Before you marry | `en/categories/sevgi-ve-evlilik.html#before-you-marry` | curly_double=8; curly_single=8 | True | [curly_double] “Don't compare your marriage with anyone \|\| [curly_single] marriage with anyone else's. Don't say, ‘Look at her husband…’ or ‘Look at his w |
| 67 | Honesty (Lunaria annua) | `en/categories/sevgi-ve-evlilik.html#mother-of-pearl-flower` | curly_double=22; curly_single=2 | True | [curly_double] “Tell me, why do you want a divorce?” \|\| [curly_single] to look after it. Not once did he say, ‘You sleep. I'll take care of it tonight |
| 86 | A test of humanity | `en/categories/dostluq-ve-insan-munasibetleri.html#humanity` | curly_double=28; curly_single=4 | True | [curly_double] “Come back! If you leave now, your exam \|\| [curly_single] “‘I can start my studies a year later,’ h |
| 88 | If the road feels easy, thank your companion | `en/categories/dostluq-ve-insan-munasibetleri.html#sharing-the-burden` | curly_double=9; curly_single=2 | True | [curly_double] “I was very young when I married your fa \|\| [curly_single] “‘Have this stitched by the time I get ba |
| 97 | Make time for people | `en/categories/dostluq-ve-insan-munasibetleri.html#make-time-for-people` | curly_double=19 | True | [curly_double] “Dad, let me show you how to do your ban |
| 185 | Hello, teacher! Do you remember me? | `en/categories/hikmet-ve-heyat-dersleri.html#do-you-remember-me` | curly_double=29; curly_single=2 | True | [curly_double] “Hello, sir! Do you remember me? I used \|\| [curly_single] “‘Whoever took it, please give it back.’ |
| 188 | The road to the cotton field | `en/categories/hikmet-ve-heyat-dersleri.html#beyond-the-cotton-field` | curly_double=13 | True | [curly_double] “Where does that road go?” |
| 193 | Three statues | `en/categories/hikmet-ve-heyat-dersleri.html#three-statues` | curly_double=9 | True | [curly_double] “To celebrate your birthday, I present y |
| 197 | Not my concern | `en/categories/hikmet-ve-heyat-dersleri.html#not-my-concern` | curly_double=20; curly_single=4 | True | [curly_double] “Could the Ottoman Empire one day weaken \|\| [curly_single] od nothing from your answer. You wrote, ‘What has it got to do with me?’ It soun |
| 199 | What matters in life? | `en/categories/hikmet-ve-heyat-dersleri.html#what-matters-in-life` | curly_double=18; curly_single=1 | True | [curly_double] “We each have one life. How we spend our \|\| [curly_single] “First, decide what the ‘golf balls' in your life are and make r |
| 219 | Giving without money | `en/categories/emek-ruzi-ve-servet.html#giving-without-money` | curly_double=16 | True | [curly_double] “Why am I poor?” |

### DE (0)

_None._

### RU (0)

_None._

### KY (0)

_None._

## Nested (check manually)

### AZ (2)

| # | title | path | styles found | example |
|---:|---|---|---|---|
| 60 | Ailə qurmağa hazırlaşanlara tövsiyələr | `az/categories/sevgi-ve-evlilik.html#before-you-marry` | curly_double=2; curly_single=10 | [curly_double] “Öz ailənizi başqalarının ailəsi ilə müq \|\| [curly_single] şqalarının ailəsi ilə müqayisə etməyin. ‘Filankəsin əri belədir’, ‘filankəsin ar |
| 184 | Görünən və görünməyən həqiqət | `az/categories/hikmet-ve-heyat-dersleri.html#istanbul-woman-remembers` | curly_double=2; curly_single=2 | [curly_double] “Məktəbi yenicə bitirmişdim. Bir gün özü \|\| [curly_single] Qapıdakı lövhədə onun adı, altında isə ‘vəkil’ sözü yazılmışdı. |

### EN (19)

| # | title | path | styles found | example |
|---:|---|---|---|---|
| 14 | If fate allows | `en/categories/iman-ve-meneviyyat.html#if-fate-allows` | curly_double=8; curly_single=1 | [curly_double] Someone who used to say, “We'll meet,” now says, “We'll meet if f \|\| [curly_single] t. Do not put off seeing them by saying ‘if fate allows'—meet them today and lif |
| 36 | The advice from his mother that Fakir Baykurt never forgot | `en/categories/aile-ve-terbiye.html#mothers-lasting-lesson` | curly_double=14; curly_single=2 | [curly_double] “Mom, I'd love some tea. Shall we have a \|\| [curly_single] e me high marks. And all you can say is ‘It wasn't bad’?” |
| 46 | The rotten seed | `en/categories/aile-ve-terbiye.html#rotten-seed` | curly_double=8; curly_single=4 | [curly_double] as often ill. He dismissed the boy as a “rotten seed” and eventually placed him \|\| [curly_single] “After you said, ‘A rotten seed will never sprout,’ and l |
| 47 | Spinach | `en/categories/aile-ve-terbiye.html#spinach` | curly_double=7; curly_single=2 | [curly_double] “Eat plenty. It will make you strong,” s \|\| [curly_single] “‘Spinach is very good for you. That's wh |
| 56 | Before you marry | `en/categories/sevgi-ve-evlilik.html#before-you-marry` | curly_double=8; curly_single=8 | [curly_double] “Don't compare your marriage with anyone \|\| [curly_single] marriage with anyone else's. Don't say, ‘Look at her husband…’ or ‘Look at his w |
| 62 | Loving from afar | `en/categories/sevgi-ve-evlilik.html#loving-from-afar` | curly_double=12; curly_single=4 | [curly_double] “I think I've fallen for someone.” \|\| [curly_single] d come the arguments and the making up: ‘Why were you looking at her?’ ‘Why did |
| 67 | Honesty (Lunaria annua) | `en/categories/sevgi-ve-evlilik.html#mother-of-pearl-flower` | curly_double=22; curly_single=2 | [curly_double] “Tell me, why do you want a divorce?” \|\| [curly_single] to look after it. Not once did he say, ‘You sleep. I'll take care of it tonight |
| 68 | The red dress | `en/categories/sevgi-ve-evlilik.html#red-dress` | curly_double=26; curly_single=4 | [curly_double] “Mom, what a beautiful dress! I've never \|\| [curly_single] d him I was dying, he came in and said, ‘You can't die! Do you hear me? What am |
| 84 | Gossip | `en/categories/dostluq-ve-insan-munasibetleri.html#gossip` | curly_double=16; curly_single=2 | [curly_double] “It was only a joke!” he protested. “Peo \|\| [curly_single] spread just like these feathers. Saying ‘I take it back’ cannot bring them home. |
| 85 | How to respond to insults | `en/categories/dostluq-ve-insan-munasibetleri.html#unwelcome-gifts` | curly_double=8; curly_single=2 | [curly_double] “Master, why did you put up with those i \|\| [curly_single] he same way. If you do not accept these ‘gifts,’ they remain with the person who |
| 86 | A test of humanity | `en/categories/dostluq-ve-insan-munasibetleri.html#humanity` | curly_double=28; curly_single=4 | [curly_double] “Come back! If you leave now, your exam \|\| [curly_single] “‘I can start my studies a year later,’ h |
| 88 | If the road feels easy, thank your companion | `en/categories/dostluq-ve-insan-munasibetleri.html#sharing-the-burden` | curly_double=9; curly_single=2 | [curly_double] “I was very young when I married your fa \|\| [curly_single] “‘Have this stitched by the time I get ba |
| 102 | Welcome home, my dear | `en/categories/dostluq-ve-insan-munasibetleri.html#welcome-home-my-dear` | curly_double=16; curly_single=2 | [curly_double] “Son, I'm going to the market. If your f \|\| [curly_single] “If your father comes home, tell him, ‘Mother waited for you until the end of |
| 121 | He would not give so little | `en/categories/exlaq-ve-xarakter.html#kings-generosity` | curly_double=8; curly_single=4 | [curly_double] “Why not?” the king asked, surprised. \|\| [curly_single] If I take it home, my parents will ask, ‘Where did you steal that money?’” |
| 128 | Self-belief and truth | `en/categories/exlaq-ve-xarakter.html#telling-lies` | curly_double=18; curly_single=2 | [curly_double] “Do you tell lies?” \|\| [curly_single] tell only to myself. Every day, I say, ‘You're stronger, more knowledgeable, an |
| 185 | Hello, teacher! Do you remember me? | `en/categories/hikmet-ve-heyat-dersleri.html#do-you-remember-me` | curly_double=29; curly_single=2 | [curly_double] “Hello, sir! Do you remember me? I used \|\| [curly_single] “‘Whoever took it, please give it back.’ |
| 197 | Not my concern | `en/categories/hikmet-ve-heyat-dersleri.html#not-my-concern` | curly_double=20; curly_single=4 | [curly_double] “Could the Ottoman Empire one day weaken \|\| [curly_single] od nothing from your answer. You wrote, ‘What has it got to do with me?’ It soun |
| 199 | What matters in life? | `en/categories/hikmet-ve-heyat-dersleri.html#what-matters-in-life` | curly_double=18; curly_single=1 | [curly_double] “We each have one life. How we spend our \|\| [curly_single] “First, decide what the ‘golf balls' in your life are and make r |
| 240 | Two donkeys | `en/categories/temsiller-ve-meseller.html#two-donkeys` | curly_double=6; curly_single=4 | [curly_double] “Let's have some fun at his expense. We' \|\| [curly_single] any friends. If he says yes, we'll say, ‘What fool would be friends with you?’ I |

### DE (17)

| # | title | path | styles found | example |
|---:|---|---|---|---|
| 43 | Der verfaulte Samen | `de/categories/aile-ve-terbiye.html#rotten-seed` | german_low_double=8; german_low_single=4 | [german_low_double] nk war. Verächtlich nannte er ihn einen „verfaulten Samen“ und brachte ihn schli \|\| [german_low_single] „Nachdem du gesagt hattest: ‚Ein verfaulter Samen keimt nicht‘, und |
| 47 | Der Rat seiner Mutter, den Fakir Baykurt nie vergaß | `de/categories/aile-ve-terbiye.html#mothers-lasting-lesson` | german_low_double=16; german_low_single=2 | [german_low_double] „Mama, ich hätte so gern einen Tee. Woll \|\| [german_low_single] eine Arbeit sehr gut. Und du sagst nur: ‚Nicht schlecht‘?“ |
| 48 | Spinat | `de/categories/aile-ve-terbiye.html#spinach` | german_low_double=6; german_low_single=2 | [german_low_double] „Esst reichlich davon, das macht euch st \|\| [german_low_single] Wenn ich sagte: ‚Spinat ist so gesund, deshalb bekommt i |
| 59 | Ratschläge für eine glückliche Ehe | `de/categories/sevgi-ve-evlilik.html#before-you-marry` | german_low_double=2; german_low_single=8 | [german_low_double] „Vergleicht eure Ehe nicht mit der ander \|\| [german_low_single] Ehe nicht mit der anderer. Sagt nicht: ‚Ihr Mann macht das aber …‘ oder ‚Seine |
| 64 | Das rote Kleid | `de/categories/sevgi-ve-evlilik.html#red-dress` | german_low_double=26; german_low_single=4 | [german_low_double] „Mama, was für ein schönes Kleid! Ich ha \|\| [german_low_single] sterben werde, kam er zu mir und sagte: ‚Du darfst nicht sterben! Hörst du? Was |
| 70 | Einjähriges Silberblatt (Lunaria annua) | `de/categories/sevgi-ve-evlilik.html#mother-of-pearl-flower` | german_low_double=20; german_low_single=2 | [german_low_double] „Warum möchten Sie sich scheiden lassen? \|\| [german_low_single] . Nicht ein einziges Mal hat er gesagt: ‚Schlaf weiter, heute übernehme ich das. |
| 72 | Aus der Ferne lieben | `de/categories/sevgi-ve-evlilik.html#loving-from-afar` | german_low_double=12; german_low_single=4 | [german_low_double] „Ich glaube, ich habe mich in eine junge \|\| [german_low_single] ämen die Streitereien und Versöhnungen: ‚Warum hast du die angeschaut?‘, ‚Warum |
| 90 | Die Prüfung der Menschlichkeit | `de/categories/dostluq-ve-insan-munasibetleri.html#humanity` | german_low_double=28; german_low_single=2 | [german_low_double] „Komm zurück! Wenn du jetzt gehst, wird \|\| [german_low_single] er hinaus, um mir zu helfen. Er sagte: ‚Dann fange ich eben ein Jahr später mit |
| 103 | Willkommen daheim, mein Lieber | `de/categories/dostluq-ve-insan-munasibetleri.html#welcome-home-my-dear` | german_low_double=16; german_low_single=2 | [german_low_double] „Mein Sohn, ich gehe auf den Markt. Wenn \|\| [german_low_single] „Wenn dein Vater heimkommt, sag ihm: ‚Mutter hat bis an ihr Lebensende auf di |
| 104 | Wenn der Weg leichtfällt, liegt es am Weggefährten | `de/categories/dostluq-ve-insan-munasibetleri.html#sharing-the-burden` | german_low_double=4; german_low_single=2 | [german_low_double] „Ich war noch sehr jung, als ich deinen \|\| [german_low_single] ‚Bis ich zurück bin, hast du sie fertig |
| 111 | Ein König gäbe mehr | `de/categories/exlaq-ve-xarakter.html#kings-generosity` | german_low_double=8; german_low_single=4 | [german_low_double] „Warum willst du sie nicht?“, fragte der \|\| [german_low_single] nach Hause komme, fragen meine Eltern: ‚Wo hast du das Geld gestohlen?‘“ |
| 134 | Selbstvertrauen und Wahrheit | `de/categories/exlaq-ve-xarakter.html#telling-lies` | german_low_double=18; german_low_single=2 | [german_low_double] „Lügst du?“ \|\| [german_low_single] selbst erzähle. Jeden Tag sage ich mir: ‚Du bist stärker, gebildeter und fähiger |
| 176 | Was ist wichtig im Leben? | `de/categories/hikmet-ve-heyat-dersleri.html#what-matters-in-life` | german_low_double=14; german_low_single=2 | [german_low_double] „Wir haben alle nur ein Leben. Wofür wir \|\| [german_low_single] Überlegt euch deshalb zuerst, was die ‚Golfbälle‘ in eurem Leben sind, und geb |
| 180 | Die sichtbare und die unsichtbare Wahrheit | `de/categories/hikmet-ve-heyat-dersleri.html#istanbul-woman-remembers` | german_low_double=2; german_low_single=18 | [german_low_double] „Ich hatte gerade die Schule abgeschloss \|\| [german_low_single] ‚Ayşes Verlobter ist gar kein Anwalt. Er |
| 188 | Guten Tag, Herr Lehrer! Erinnern Sie sich an mich? | `de/categories/hikmet-ve-heyat-dersleri.html#do-you-remember-me` | german_low_double=22; german_low_single=2 | [german_low_double] „Guten Tag! Erinnern Sie sich noch an mi \|\| [german_low_single] ‚Wer die Uhr genommen hat, soll sie bitt |
| 190 | Was geht mich das an? | `de/categories/hikmet-ve-heyat-dersleri.html#not-my-concern` | german_low_double=18; german_low_single=6 | [german_low_double] „Könnte auch unser Reich eines Tages sch \|\| [german_low_single] nicht verstanden. Du hast geschrieben: ‚Was geht mich das an?‘ Das klingt, als |
| 237 | Zwei Esel | `de/categories/temsiller-ve-meseller.html#two-donkeys` | german_low_double=6; german_low_single=4 | [german_low_double] „Komm, wir machen uns einen Spaß mit ihm \|\| [german_low_single] er Freunde hat. Sagt er Ja, fragen wir: ‚Welcher Dummkopf ist denn mit dir befre |

### RU (0)

_None._

### KY (0)

_None._

## Foreign style but consistent within the story

### AZ (0)

_None._

### EN (0)

_None._

### DE (0)

_None._

### RU (0)

_None._

### KY (0)

_None._

