/* Wisdom Stories adapter for the shared multilingual compare window. */
(function () {
  "use strict";

  const CW = window.__birinciCompareWindow;
  if (!CW || typeof window.__birinciBootCompareWindow !== "function") {
    return;
  }

  const escapeHtml = CW.escapeHtml;
  const tUi = CW.tUi;
  const flagImgHtml = CW.flagImgHtml;
  const VIEW_ICONS = CW.VIEW_ICONS;

  const KY_ILLUST_SIZE = {
    "advice-for-those-who-marry": [1522, 849],
    "aging": [1522, 816],
    "albrecht-durer": [1536, 845],
    "ant-that-carries-water": [1536, 816],
    "architect-sinan-dies-in-a-house-without-water": [1536, 816],
    "attitude-toward-a-problem": [1536, 816],
    "avoid-these-questions": [1536, 816],
    "baklava": [1536, 816],
    "be-sure-of-your-purpose": [1536, 796],
    "bedouin-whose-camel-was-stolen": [1536, 816],
    "being-human": [1536, 816],
    "bell-to-hang-on-the-cats-neck": [1536, 816],
    "beloved-is-one-who-gives-love-to-people": [1536, 816],
    "beware-of-those-you-love": [1536, 816],
    "blessings-god-has-given": [1536, 810],
    "blind-well": [1536, 816],
    "blind-who-have-eyes": [1536, 816],
    "bookstore": [1536, 816],
    "builder-of-the-nest": [1536, 816],
    "calamity-and-blessing": [1536, 816],
    "can-a-broken-heart-love-again": [1536, 816],
    "candles-conversation": [1514, 796],
    "chief-accountant-and-the-ceo": [1536, 816],
    "church-bell": [1536, 816],
    "communication": [1536, 816],
    "compassion": [1536, 816],
    "compliment": [1530, 816],
    "credit-ledger": [1536, 796],
    "dead-remain-in-life": [1520, 796],
    "dervishs-clothes": [1536, 816],
    "dervishs-robe": [1536, 871],
    "dervishs-spoons": [1536, 816],
    "diderot-effect": [1536, 816],
    "different-path": [1536, 816],
    "discussion-and-conflict": [1536, 816],
    "do-not-complain-about-any-day-you-have-lived": [1536, 796],
    "do-not-do-these-things": [1536, 816],
    "do-not-let-your-hearts-part": [1536, 816],
    "do-you-have-spending-money": [1536, 816],
    "doctors-appointment": [1536, 816],
    "donkeys-law": [1536, 816],
    "dont-be-words-for-mouths-dust-for-feet": [1536, 816],
    "dont-open-your-mouth": [1536, 816],
    "dont-say-i-couldnt-deliver-or-i-couldnt-manage": [1536, 816],
    "drinking-the-sherbet-of-martyrdom": [1536, 816],
    "early-marriage": [1536, 816],
    "eat-less-and-stay-on-the-right-path": [1536, 816],
    "education-or-character": [1536, 796],
    "elephant-and-the-rope": [1536, 816],
    "everyone-has-work-to-do": [1536, 816],
    "everyone-is-the-same-here": [1536, 816],
    "everything-is-in-our-own-hands": [1536, 816],
    "explaining-ones-sorrow": [1536, 816],
    "expressions-you-should-stay-away-from": [1536, 816],
    "faith-is-half-of-success": [1536, 816],
    "fallen-teeth": [1536, 816],
    "father-and-son": [1536, 904],
    "fathers-footprints": [1536, 816],
    "festive-gift": [1536, 816],
    "fish-shop": [1536, 816],
    "flower-of-honesty": [1530, 816],
    "fly-in-the-china-shop": [1536, 816],
    "for-those-who-have-reached-sixty": [1536, 796],
    "forbidden-money": [1536, 816],
    "former-minister-at-the-seminar": [1536, 816],
    "fortieth-day-rite": [1536, 816],
    "friend-of-god": [1536, 816],
    "friendship-and-love": [1536, 796],
    "friendship-of-horses": [1536, 816],
    "from-a-wise-fathers-advice-to-his-son": [1536, 816],
    "from-the-memoirs-of-a-lady-from-istanbul": [1536, 796],
    "garden-and-the-gardener": [1536, 816],
    "generous-man": [1536, 816],
    "glass-of-milk": [1536, 796],
    "go-but-come-again": [1536, 816],
    "gods-pleasure": [1536, 816],
    "goose-to-be-plucked": [1536, 816],
    "gossip": [1536, 816],
    "grandfather-and-grandson-at-the-market": [1536, 816],
    "grocery-shop-and-the-supermarket": [1536, 796],
    "hajj-pilgrimage": [1536, 816],
    "handful-of-roasted-chickpeas": [1536, 816],
    "hayats-life-story": [1536, 816],
    "he-would-not-have-given-so-little": [1536, 816],
    "help-yourself-o-exalted-god": [1536, 796],
    "henry-fords-choice": [1530, 816],
    "his-hand-is-at-work": [1536, 809],
    "hold-my-hand": [1536, 796],
    "homeland-and-land": [1536, 796],
    "honey-or-dry-bread": [1536, 816],
    "hot-bread": [1536, 810],
    "how-can-i-escape-my-thoughts": [1536, 796],
    "how-to-ward-off-insults": [1536, 816],
    "how-we-treat-people": [1536, 796],
    "human-emerged": [1536, 796],
    "humanity": [1536, 816],
    "hunters-description": [1523, 816],
    "i-am-aware-now": [1536, 816],
    "i-am-tired-mother": [1536, 816],
    "i-am-waiting-for-the-teeth": [1536, 816],
    "i-got-busy-with-cleaning": [1536, 816],
    "i-kiss-your-eyes": [1536, 816],
    "i-love-you": [1536, 816],
    "i-want-a-friend": [1536, 816],
    "i-would-not-trade-it-for-anything": [1536, 816],
    "idle-devil": [1536, 816],
    "if-fate-allows-we-will-meet": [1523, 816],
    "if-i-dont-do-it-these-days-the-world-wont-collapse": [1536, 816],
    "if-the-door-before-you-wont-open-it-is-not-your-door": [1536, 796],
    "if-the-road-does-not-tire-you-it-is-because-of-your-companion": [1536, 816],
    "it-is-in-vain": [1536, 796],
    "it-wont-go-to-waste": [1536, 816],
    "just-verdict-of-the-frankfurt-judge": [1536, 796],
    "know-your-friend": [1536, 816],
    "lawful-morsel": [1536, 816],
    "lecturer-and-the-groom": [1536, 816],
    "let-prayer-come-and-find-you": [1536, 816],
    "life-is-short": [1536, 816],
    "life-lesson": [1536, 816],
    "light-of-the-universe": [1536, 816],
    "lions-footprint": [1536, 816],
    "liver": [1536, 816],
    "living-in-the-past": [1536, 816],
    "loving-from-afar": [1536, 816],
    "magnificent-lesson": [1536, 816],
    "mature-person": [1536, 816],
    "may-your-face-always-smile": [1536, 816],
    "meaningless-question": [1536, 816],
    "meddling-in-others-lives": [1536, 816],
    "mercedes": [1516, 816],
    "mihrimah-sultan-and-architect-sinan": [1536, 796],
    "mockery-is-unacceptable": [1536, 816],
    "more-effective-way": [1536, 796],
    "most-beautiful-gift": [1536, 816],
    "most-beautiful-places-in-the-world": [1536, 796],
    "most-beautiful-portion": [1536, 816],
    "mother-and-son": [1536, 816],
    "mother-of-pearl-flower": [1536, 816],
    "mothers-advice-fakir-baykurt-never-forgot": [1536, 816],
    "mothers-love": [1536, 816],
    "mullah-and-the-scholar": [1524, 816],
    "my-alif-has-been-dotted": [1536, 816],
    "newtons-second-law": [1521, 816],
    "no-need-to-be-sane-when-everyone-is-mad": [1536, 816],
    "no-one-listens-to-constant-complainers": [1536, 816],
    "not-every-sorrow-is-told-to-people": [1536, 816],
    "not-leaving-the-right-path": [1536, 816],
    "nothing-is-ever-truly-lost": [1536, 789],
    "o-god-give-first-to-the-mountains-and-stones": [1536, 816],
    "o-god-heal-our-sorrows": [1536, 796],
    "one-who-knows-and-the-one-who-does-not": [1536, 816],
    "only-my-mother-would-weep": [1536, 796],
    "organization-without-an-action-plan": [1536, 816],
    "other-peoples-opinions": [1536, 816],
    "our-qualities-can-become-our-enemies": [1536, 816],
    "pair-of-boots": [1536, 816],
    "pawn-and-the-king": [1536, 816],
    "pay-rent-for-the-water": [1536, 816],
    "people-who-need-something-from-you": [1536, 816],
    "permission-or-apology": [1536, 816],
    "power-of-truth": [1536, 816],
    "pray-while-washing-your-dishes": [1536, 816],
    "price-of-a-miracle": [1536, 816],
    "properties-of-water": [1536, 816],
    "puppies-for-sale": [1536, 816],
    "purple-jacket": [1536, 816],
    "raising-children": [1536, 816],
    "ramadan-prayer": [1536, 816],
    "red-dress": [1536, 816],
    "road-to-the-cotton-field": [1536, 816],
    "rose": [1536, 796],
    "rotten-seed": [1536, 816],
    "sacrificial-meat": [1536, 816],
    "say-what-you-know": [1536, 816],
    "saying-the-word-in-its-place": [1536, 816],
    "scarf-seller": [1536, 816],
    "searching": [1536, 816],
    "secret-of-living-well-and-longevity": [1536, 796],
    "sharing-justice": [1536, 816],
    "shepherd-must-be-called": [1536, 816],
    "shepherds-word": [1536, 816],
    "silence": [1536, 816],
    "silent-corridor": [1536, 816],
    "skins-of-the-lambs": [1536, 816],
    "sound-of-the-doorbell": [1536, 816],
    "sowing-millet-at-the-bottom": [1536, 816],
    "spare-time": [1536, 816],
    "spend-your-time-with-people": [1536, 816],
    "spinach": [1536, 816],
    "stoning-the-devil": [1536, 816],
    "strength-and-sorrow": [1536, 796],
    "strongest-shield": [1536, 816],
    "teacher-hello-do-you-remember-me": [1536, 816],
    "telling-lies": [1536, 816],
    "that-was-not-your-right": [1536, 816],
    "think-speak-and-act-positively": [1536, 796],
    "this-boat-is-empty-too": [1536, 816],
    "those-you-should-not-befriend": [1536, 816],
    "three-best-things": [1536, 816],
    "three-essential-things-for-a-city": [1536, 816],
    "three-landscapes": [1536, 816],
    "three-questions": [1536, 816],
    "three-statues": [1536, 816],
    "to-be-alone": [1536, 816],
    "to-be-cool-headed": [1536, 796],
    "to-be-fasting": [1536, 816],
    "to-be-full-or-to-be-gone": [1536, 796],
    "to-be-self-confident": [1536, 796],
    "to-dream": [1536, 816],
    "to-forgive": [1536, 816],
    "to-give-up": [1536, 816],
    "to-meet-and-to-know": [1536, 816],
    "tongue": [1536, 816],
    "true-love": [1536, 816],
    "try-to-think-this-way": [1536, 816],
    "turning-hardship-into-opportunity": [1536, 816],
    "turtles-wrong-calculation": [1536, 816],
    "two-bowls-of-water": [1536, 816],
    "two-donkeys": [1536, 816],
    "value-of-your-family": [1536, 816],
    "we-are-rich": [1536, 816],
    "weeds-must-be-pulled-from-the-root": [1536, 796],
    "weight-of-the-oil": [1536, 816],
    "welcome-my-bey": [1536, 796],
    "what-breaks-a-marriage": [1536, 816],
    "what-changed-after-sixty": [1536, 816],
    "what-do-i-need-it-for": [1536, 816],
    "what-is-a-word": [1536, 816],
    "what-is-loyalty": [1536, 816],
    "what-it-means-to-be-late": [1536, 816],
    "what-matters-in-life": [1536, 816],
    "what-we-learn-in-life": [1536, 816],
    "what-women-have-endured-in-this-world": [1536, 816],
    "where-does-calamity-come-from": [1536, 816],
    "where-does-this-road-go": [1536, 816],
    "who-handles-honey-licks-his-finger": [1536, 816],
    "why-am-i-poor": [1536, 816],
    "why-are-you-waiting-for-the-last-day-of-the-world": [1536, 816],
    "why-injustice-when-there-is-justice": [1536, 816],
    "why-people-shout-when-they-argue": [1536, 816],
    "windmill-turning-in-still-air": [1536, 816],
    "with-this-nation-the-world-can-be-conquered": [1536, 816],
    "woman-and-the-mirror": [1536, 728],
    "woman-whose-house-was-robbed": [1536, 816],
    "word-and-silence": [1536, 816],
    "yellow-and-red-flowers": [1536, 816],
    "you-cannot-descend-a-well-on-his-rope": [1536, 816],
    "your-friends": [1536, 816],
    "your-hand-at-work-your-hope-in-god": [1536, 816],
  };
  const AZ_ILLUST_SIZE = {
    "advice-for-those-who-marry": [1536, 1024],
    "aging": [1536, 1099],
    "albrecht-durer": [1536, 1033],
    "ant-that-carries-water": [1536, 1181],
    "architect-sinan-dies-in-a-house-without-water": [1536, 1024],
    "attitude-toward-a-problem": [1536, 1144],
    "avoid-these-questions": [1536, 1024],
    "baklava": [1536, 1029],
    "be-sure-of-your-purpose": [1536, 1075],
    "bedouin-whose-camel-was-stolen": [1536, 1127],
    "being-human": [1536, 1024],
    "bell-to-hang-on-the-cats-neck": [1536, 1010],
    "beloved-is-one-who-gives-love-to-people": [1536, 1068],
    "beware-of-those-you-love": [1536, 1048],
    "blessings-god-has-given": [1536, 1024],
    "blind-well": [1536, 1121],
    "blind-who-have-eyes": [1536, 1177],
    "bookstore": [1536, 784],
    "builder-of-the-nest": [1536, 799],
    "calamity-and-blessing": [1536, 1024],
    "can-a-broken-heart-love-again": [1536, 762],
    "candles-conversation": [1536, 788],
      "caring-call-brightens-the-day": [1536, 1024],
      "changing-times-enduring-friendship": [1536, 1024],
      "cherish-today-with-loved-ones": [1536, 1024],
      "cherishing-flowers-in-spring": [1536, 1024],
    "chief-accountant-and-the-ceo": [1536, 1024],
    "church-bell": [1536, 1024],
    "communication": [1536, 1024],
    "compassion": [1536, 780],
    "compliment": [1536, 1024],
    "credit-ledger": [1536, 1024],
      "day-gratefully-lived": [1536, 1024],
    "dead-remain-in-life": [1536, 721],
    "dervishs-clothes": [1536, 754],
    "dervishs-robe": [1536, 784],
    "dervishs-spoons": [1536, 856],
    "diderot-effect": [1536, 754],
    "different-path": [1536, 840],
    "discussion-and-conflict": [1536, 1024],
    "do-not-complain-about-any-day-you-have-lived": [1536, 642],
    "do-not-do-these-things": [1536, 778],
    "do-not-let-your-hearts-part": [1536, 756],
    "do-you-have-spending-money": [1536, 780],
    "doctors-appointment": [1536, 555],
    "donkeys-law": [1536, 735],
    "dont-be-words-for-mouths-dust-for-feet": [1536, 712],
    "dont-open-your-mouth": [1536, 674],
    "dont-say-i-couldnt-deliver-or-i-couldnt-manage": [1536, 736],
    "drinking-the-sherbet-of-martyrdom": [1536, 1024],
    "early-marriage": [1536, 729],
    "eat-less-and-stay-on-the-right-path": [1536, 839],
    "education-or-character": [1536, 731],
    "elephant-and-the-rope": [1536, 825],
    "everyone-has-work-to-do": [1536, 1024],
    "everyone-is-the-same-here": [1536, 838],
    "everything-is-in-our-own-hands": [1536, 788],
    "explaining-ones-sorrow": [1536, 730],
    "expressions-you-should-stay-away-from": [1536, 736],
    "faith-is-half-of-success": [1536, 703],
    "fallen-teeth": [1536, 846],
    "father-and-son": [1536, 741],
    "fathers-footprints": [1536, 570],
    "festive-gift": [1536, 749],
    "fish-shop": [1536, 780],
    "flower-of-honesty": [1536, 644],
    "fly-in-the-china-shop": [1536, 604],
    "for-those-who-have-reached-sixty": [1536, 759],
    "forbidden-money": [1536, 729],
    "former-minister-at-the-seminar": [1536, 759],
    "fortieth-day-rite": [1536, 784],
    "friend-of-god": [1536, 760],
    "friendship-and-love": [1536, 806],
    "friendship-of-horses": [1536, 777],
    "from-a-wise-fathers-advice-to-his-son": [1536, 784],
      "from-reflection-to-hope": [1536, 1024],
    "from-the-memoirs-of-a-lady-from-istanbul": [1536, 838],
    "garden-and-the-gardener": [1536, 762],
    "generous-man": [1536, 771],
    "glass-of-milk": [1536, 825],
    "go-but-come-again": [1536, 772],
    "gods-pleasure": [1536, 766],
    "goose-to-be-plucked": [1536, 807],
    "gossip": [1536, 659],
    "grandfather-and-grandson-at-the-market": [1536, 776],
    "grocery-shop-and-the-supermarket": [1536, 794],
    "hajj-pilgrimage": [1536, 669],
    "handful-of-roasted-chickpeas": [1536, 757],
    "hayats-life-story": [1536, 770],
    "he-would-not-have-given-so-little": [1536, 665],
    "help-yourself-o-exalted-god": [1536, 736],
    "henry-fords-choice": [1536, 720],
    "his-hand-is-at-work": [1536, 705],
    "hold-my-hand": [1536, 767],
    "homeland-and-land": [1536, 785],
    "honey-or-dry-bread": [1536, 768],
      "hopeful-journey-through-life": [1536, 1024],
    "hot-bread": [1536, 771],
    "how-can-i-escape-my-thoughts": [1536, 753],
    "how-to-ward-off-insults": [1536, 722],
    "how-we-treat-people": [1536, 644],
    "human-emerged": [1536, 750],
    "humanity": [1536, 806],
      "humanity-rebuilds-in-peace": [1536, 1024],
    "hunters-description": [1536, 669],
    "i-am-aware-now": [1536, 550],
    "i-am-tired-mother": [1536, 759],
    "i-am-waiting-for-the-teeth": [1536, 702],
    "i-got-busy-with-cleaning": [1536, 774],
    "i-kiss-your-eyes": [1536, 805],
    "i-love-you": [1536, 744],
    "i-want-a-friend": [1536, 782],
    "i-would-not-trade-it-for-anything": [1536, 795],
    "idle-devil": [1536, 817],
    "if-fate-allows-we-will-meet": [1536, 1024],
    "if-i-dont-do-it-these-days-the-world-wont-collapse": [1536, 751],
    "if-the-door-before-you-wont-open-it-is-not-your-door": [1536, 738],
    "if-the-road-does-not-tire-you-it-is-because-of-your-companion": [1536, 640],
    "it-is-in-vain": [1536, 696],
    "it-wont-go-to-waste": [1536, 747],
    "just-verdict-of-the-frankfurt-judge": [1536, 1024],
      "kindness-builds-stronger-bonds": [1536, 1024],
    "know-your-friend": [1536, 1024],
    "lawful-morsel": [1536, 1024],
    "lecturer-and-the-groom": [1536, 793],
    "let-prayer-come-and-find-you": [1536, 733],
    "life-is-short": [1536, 595],
    "life-lesson": [1536, 804],
    "light-of-the-universe": [1536, 765],
    "lions-footprint": [1536, 755],
    "liver": [1536, 1052],
    "living-in-the-past": [1536, 1047],
    "loving-from-afar": [1536, 1029],
    "magnificent-lesson": [1536, 1024],
    "mature-person": [1536, 755],
    "may-your-face-always-smile": [1536, 1024],
    "meaningless-question": [1536, 1024],
    "meddling-in-others-lives": [1536, 738],
    "mercedes": [1536, 1024],
    "mihrimah-sultan-and-architect-sinan": [1536, 1024],
    "mockery-is-unacceptable": [1536, 638],
    "more-effective-way": [1536, 750],
    "most-beautiful-gift": [1536, 719],
    "most-beautiful-places-in-the-world": [1536, 712],
    "most-beautiful-portion": [1536, 681],
    "mother-and-son": [1536, 779],
    "mother-of-pearl-flower": [1536, 1024],
    "mothers-advice-fakir-baykurt-never-forgot": [1536, 790],
    "mothers-love": [1536, 762],
    "mullah-and-the-scholar": [1536, 1024],
    "my-alif-has-been-dotted": [1536, 679],
      "nails-lasting-lesson": [1536, 1024],
    "newtons-second-law": [1536, 756],
    "no-need-to-be-sane-when-everyone-is-mad": [1536, 808],
    "no-one-listens-to-constant-complainers": [1536, 757],
    "not-every-sorrow-is-told-to-people": [1536, 768],
    "not-leaving-the-right-path": [1536, 659],
    "nothing-is-ever-truly-lost": [1536, 717],
    "o-god-give-first-to-the-mountains-and-stones": [1536, 779],
    "o-god-heal-our-sorrows": [1536, 815],
    "one-who-knows-and-the-one-who-does-not": [1536, 1024],
    "only-my-mother-would-weep": [1536, 579],
    "organization-without-an-action-plan": [1536, 1024],
    "other-peoples-opinions": [1536, 1024],
    "our-qualities-can-become-our-enemies": [1536, 1097],
    "pair-of-boots": [1536, 1013],
    "pawn-and-the-king": [1536, 1024],
    "pay-rent-for-the-water": [1536, 1024],
    "people-who-need-something-from-you": [1536, 1024],
    "permission-or-apology": [1536, 1024],
    "power-of-truth": [1536, 1024],
    "pray-while-washing-your-dishes": [1536, 1097],
    "price-of-a-miracle": [1536, 1024],
    "properties-of-water": [1536, 1024],
    "puppies-for-sale": [1536, 1024],
    "purple-jacket": [1536, 1024],
      "quarantine-days-hopeful-hearts": [1536, 1024],
    "raising-children": [1536, 1024],
    "ramadan-prayer": [1536, 1024],
    "red-dress": [1536, 1024],
    "road-to-the-cotton-field": [1536, 1024],
    "rose": [1536, 974],
    "rotten-seed": [1536, 1024],
    "sacrificial-meat": [1536, 1024],
    "say-what-you-know": [1536, 1024],
    "saying-the-word-in-its-place": [1536, 961],
    "scarf-seller": [1536, 1117],
    "searching": [1536, 1106],
    "secret-of-living-well-and-longevity": [1536, 1076],
    "sharing-justice": [1536, 1024],
    "shepherd-must-be-called": [1536, 1070],
    "shepherds-word": [1536, 1092],
    "silence": [1536, 1036],
    "silent-corridor": [1536, 1024],
    "skins-of-the-lambs": [1536, 1024],
      "small-changes-big-meaning": [1536, 1024],
    "sound-of-the-doorbell": [1536, 1051],
    "sowing-millet-at-the-bottom": [1536, 1097],
    "spare-time": [1536, 1066],
    "spend-your-time-with-people": [1536, 1107],
    "spinach": [1536, 1024],
    "stoning-the-devil": [1536, 1110],
    "strength-and-sorrow": [1536, 911],
    "strongest-shield": [1536, 1108],
    "teacher-hello-do-you-remember-me": [1536, 1051],
    "telling-lies": [1536, 1111],
    "that-was-not-your-right": [1536, 1019],
    "think-speak-and-act-positively": [1536, 1024],
    "this-boat-is-empty-too": [1536, 1012],
    "those-you-should-not-befriend": [1536, 1068],
    "three-best-things": [1536, 1158],
    "three-essential-things-for-a-city": [1536, 1024],
    "three-landscapes": [1536, 1115],
    "three-questions": [1536, 1115],
    "three-statues": [1536, 1110],
    "to-be-alone": [1536, 1024],
    "to-be-cool-headed": [1536, 1085],
    "to-be-fasting": [1536, 1107],
    "to-be-full-or-to-be-gone": [1536, 1125],
    "to-be-self-confident": [1536, 1099],
    "to-dream": [1536, 1035],
    "to-forgive": [1536, 909],
    "to-give-up": [1536, 1029],
    "to-meet-and-to-know": [1536, 1129],
    "tongue": [1536, 1071],
    "true-love": [1536, 1112],
    "try-to-think-this-way": [1536, 1039],
    "turning-hardship-into-opportunity": [1536, 1097],
    "turtles-wrong-calculation": [1536, 1065],
    "two-bowls-of-water": [1536, 1146],
    "two-donkeys": [1536, 1132],
    "value-of-your-family": [1536, 1123],
    "we-are-rich": [1536, 1114],
    "weeds-must-be-pulled-from-the-root": [1536, 1024],
    "weight-of-the-oil": [1536, 1084],
    "welcome-my-bey": [1536, 1130],
    "what-breaks-a-marriage": [1536, 1021],
    "what-changed-after-sixty": [1536, 1078],
    "what-do-i-need-it-for": [1536, 1139],
    "what-is-a-word": [1536, 1028],
    "what-is-loyalty": [1536, 1093],
    "what-it-means-to-be-late": [1536, 1032],
    "what-matters-in-life": [1536, 1079],
    "what-we-learn-in-life": [1536, 1092],
    "what-women-have-endured-in-this-world": [1536, 1050],
    "where-does-calamity-come-from": [1536, 1025],
    "where-does-this-road-go": [1536, 1011],
    "who-handles-honey-licks-his-finger": [1536, 1122],
    "why-am-i-poor": [1536, 1128],
    "why-are-you-waiting-for-the-last-day-of-the-world": [1536, 1070],
    "why-injustice-when-there-is-justice": [1536, 1091],
    "why-people-shout-when-they-argue": [1536, 1049],
    "windmill-turning-in-still-air": [1536, 1166],
    "with-this-nation-the-world-can-be-conquered": [1536, 1105],
    "woman-and-the-mirror": [1536, 1024],
    "woman-whose-house-was-robbed": [1536, 1072],
    "word-and-silence": [1536, 1064],
    "yellow-and-red-flowers": [1536, 1057],
    "you-cannot-descend-a-well-on-his-rope": [1536, 1125],
    "your-friends": [1536, 840],
    "your-hand-at-work-your-hope-in-god": [1536, 1024],
  };
  const foldAzI = (s) => String(s || "").replace(/[İIı]/g, "i");
  const classifyParagraphs = (paragraphs, storyStem) => {
    const list = Array.isArray(paragraphs) ? paragraphs.map((p) => String(p || "")) : [];
    if (!list.length) return { body: [], moral: "", source: "" };
    const last = list.length - 1;
    const srcRe =
      /(internet\s+sources|internet\s+mənb|internet\s+kaynak|открыт\w*\s+источник|интернет|(?:source|mənbə|kaynak|источник|булак|булагы)\s*:)/i;
    const moralRe = /^(ibrət|ibret|moral|мораль|үлгү|сабак)\s*:/i;
    const authorSrcStems = {      "caring-call-brightens-the-day": 1,
      "changing-times-enduring-friendship": 1,
      "cherish-today-with-loved-ones": 1,
      "cherishing-flowers-in-spring": 1,
      "day-gratefully-lived": 1,
      "everyone-has-work-to-do": 1,
      "from-reflection-to-hope": 1,
      "hopeful-journey-through-life": 1,
      "humanity-rebuilds-in-peace": 1,
      "if-fate-allows-we-will-meet": 1,
      "kindness-builds-stronger-bonds": 1,
      "nails-lasting-lesson": 1,
      "quarantine-days-hopeful-hearts": 1,
      "silent-corridor": 1,
      "small-changes-big-meaning": 1,
      "weeds-must-be-pulled-from-the-root": 1,
    };
    const authorSrc = !!(storyStem && authorSrcStems[storyStem]);
    const lastIsSrc = last >= 0 && (authorSrc || srcRe.test(foldAzI(list[last] || "")));
    let moralI = -1;
    for (let j = lastIsSrc ? last - 1 : last; j >= 0; j--) {
      if (moralRe.test(foldAzI(String(list[j] || "").trim()))) {
        moralI = j;
        break;
      }
    }
    if (moralI < 0) moralI = lastIsSrc && last >= 1 ? last - 1 : last;
    const body = [];
    let moral = "";
    let source = "";
    list.forEach((p, i) => {
      if (lastIsSrc && i === last) source = p;
      else if (i === moralI) moral = p;
      else body.push(p);
    });
    return { body, moral, source };
  };

  const findStory = (catalog, storyStem) => {
    const cats = (catalog && catalog.categories) || [];
    const wanted = String(storyStem || "").toLowerCase();
    for (let i = 0; i < cats.length; i++) {
      const stories = cats[i].stories || [];
      for (let j = 0; j < stories.length; j++) {
        const stem = stories[j] && String(stories[j].stem || "");
        if (!stem) continue;
        if (stem === storyStem || stem.toLowerCase() === wanted) return stories[j];
      }
    }
    return null;
  };

  const flattenStems = (catalog) => {
    const out = [];
    const seen = Object.create(null);
    const cats = (catalog && catalog.categories) || [];
    cats.forEach((cat) => {
      (cat.stories || []).forEach((story) => {
        const stem = story && String(story.stem || "").trim();
        if (!stem || seen[stem]) return;
        seen[stem] = 1;
        out.push(stem);
      });
    });
    return out;
  };

  const parseStoriesData = (source) => {
    const text = String(source || "");
    const key = "window.__BIRINCI_STORIES__ = ";
    const start = text.indexOf(key);
    if (start < 0) return null;
    try {
      let body = text.slice(start + key.length).trim();
      if (body.endsWith(";")) body = body.slice(0, -1);
      return JSON.parse(body);
    } catch (_) {
      return null;
    }
  };

  const catalogUrlsFor = (lang, assetQuery) => {
    const q = assetQuery() || "";
    const here = window.location.href;
    const origin = window.location.origin || "";
    const base = new URL("../../" + lang + "/assets/", here);
    const urls = [
      new URL("stories-data.js" + q, base).href,
      new URL("stories-data.json" + q, base).href,
    ];
    if (origin && origin !== "null" && origin !== "file://") {
      urls.push(origin + "/" + lang + "/assets/stories-data.js" + q);
      urls.push(origin + "/" + lang + "/assets/stories-data.json" + q);
    }
    return urls.filter((url, idx, all) => all.indexOf(url) === idx);
  };

  const loadCatalogViaFetch = async (lang, assetQuery) => {
    const urls = catalogUrlsFor(lang, assetQuery);
    let lastErr = "";
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        const res = await fetch(url, { cache: "no-cache", credentials: "same-origin" });
        if (!res.ok) {
          lastErr = "HTTP " + res.status + " for " + url;
          continue;
        }
        const source = await res.text();
        if (/\.json(\?|$)/i.test(url)) {
          const catalog = JSON.parse(source);
          if (catalog && catalog.categories) return catalog;
          lastErr = "Invalid JSON catalog " + lang;
          continue;
        }
        const catalog = parseStoriesData(source);
        if (catalog && catalog.categories) return catalog;
        lastErr = "Invalid JS catalog " + lang;
      } catch (err) {
        lastErr = String((err && err.message) || err || "fetch failed");
      }
    }
    throw new Error(lastErr || "Failed to load " + lang);
  };

  const loadCatalogViaScript = (lang, assetQuery) =>
    new Promise((resolve, reject) => {
      const urls = catalogUrlsFor(lang, assetQuery).filter((url) => /\.js(\?|$)/i.test(url));
      const url = urls[0];
      if (!url) {
        reject(new Error("No script URL for " + lang));
        return;
      }
      const prev = window.__BIRINCI_STORIES__;
      try {
        window.__BIRINCI_STORIES__ = undefined;
      } catch (_) {}
      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      const cleanup = () => {
        try {
          script.remove();
        } catch (_) {}
      };
      script.onload = () => {
        const catalog = window.__BIRINCI_STORIES__;
        try {
          window.__BIRINCI_STORIES__ = prev;
        } catch (_) {}
        cleanup();
        if (catalog && catalog.categories) resolve(catalog);
        else reject(new Error("Empty script catalog " + lang));
      };
      script.onerror = () => {
        try {
          window.__BIRINCI_STORIES__ = prev;
        } catch (_) {}
        cleanup();
        reject(new Error("Script load failed " + lang));
      };
      document.head.appendChild(script);
    });

  let scriptQueue = Promise.resolve();
  const loadCatalog = (lang, ctx) =>
    loadCatalogViaFetch(lang, ctx.assetQuery).catch(() => {
      const job = scriptQueue.then(() => loadCatalogViaScript(lang, ctx.assetQuery));
      scriptQueue = job.catch(() => {});
      return job;
    });

  const illustrationUrl = (lang, storyStem) => {
    const ruSideFix =
      lang === "ru" &&
      /^(sowing-millet-at-the-bottom|teacher-hello-do-you-remember-me|skins-of-the-lambs|you-cannot-descend-a-well-on-his-rope|raising-children)$/.test(
        storyStem || ""
      );
    const enSideFix =
      lang === "en" &&
      /^(architect-sinan-dies-in-a-house-without-water|bedouin-whose-camel-was-stolen|being-human|builder-of-the-nest|calamity-and-blessing|can-a-broken-heart-love-again|credit-ledger|dervishs-robe|diderot-effect|different-path|do-not-complain-about-any-day-you-have-lived|dont-be-words-for-mouths-dust-for-feet|dont-open-your-mouth|dont-say-i-couldnt-deliver-or-i-couldnt-manage|eat-less-and-stay-on-the-right-path|education-or-character|elephant-and-the-rope|expressions-you-should-stay-away-from|fallen-teeth|father-and-son|flower-of-honesty|forbidden-money|former-minister-at-the-seminar|friend-of-god|friendship-and-love|friendship-of-horses|from-a-wise-fathers-advice-to-his-son|from-the-memoirs-of-a-lady-from-istanbul|grocery-shop-and-the-supermarket|handful-of-roasted-chickpeas|help-yourself-o-exalted-god|henry-fords-choice|his-hand-is-at-work|honey-or-dry-bread|hot-bread|how-can-i-escape-my-thoughts|how-to-ward-off-insults|how-we-treat-people|human-emerged|i-want-a-friend|i-would-not-trade-it-for-anything|idle-devil|lions-footprint|most-beautiful-portion|mothers-advice-fakir-baykurt-never-forgot|mullah-and-the-scholar|not-leaving-the-right-path|raising-children|silence|skins-of-the-lambs|sowing-millet-at-the-bottom|stoning-the-devil|teacher-hello-do-you-remember-me|that-was-not-your-right|think-speak-and-act-positively)$/.test(
        storyStem || ""
      );
    const kyEnFix =
      lang === "ky" &&
      /^(my-alif-has-been-dotted|woman-and-the-mirror|mullah-and-the-scholar|expressions-you-should-stay-away-from|hayats-life-story|ramadan-prayer|not-leaving-the-right-path|help-yourself-o-exalted-god|mothers-advice-fakir-baykurt-never-forgot|i-love-you|yellow-and-red-flowers|if-the-road-does-not-tire-you-it-is-because-of-your-companion|that-was-not-your-right|dont-open-your-mouth|tongue|human-emerged|secret-of-living-well-and-longevity|what-it-means-to-be-late|why-injustice-when-there-is-justice|with-this-nation-the-world-can-be-conquered|bedouin-whose-camel-was-stolen|do-not-complain-about-any-day-you-have-lived|your-friends|word-and-silence|what-women-have-endured-in-this-world|why-people-shout-when-they-argue|what-is-loyalty|what-is-a-word|what-do-i-need-it-for|to-give-up|two-bowls-of-water|two-donkeys)$/.test(
        storyStem || ""
      );
    const kyHeadFix =
      lang === "ky" &&
      /^(ramadan-prayer|not-leaving-the-right-path|help-yourself-o-exalted-god|mothers-advice-fakir-baykurt-never-forgot|i-love-you|yellow-and-red-flowers|if-the-road-does-not-tire-you-it-is-because-of-your-companion|that-was-not-your-right|dont-open-your-mouth|tongue|human-emerged|secret-of-living-well-and-longevity|what-it-means-to-be-late|why-injustice-when-there-is-justice|with-this-nation-the-world-can-be-conquered|bedouin-whose-camel-was-stolen)$/.test(
        storyStem || ""
      );
    const kyFit =
      lang === "ky" &&
      /^(advice-for-those-who-marry|albrecht-durer|candles-conversation|dervishs-robe|father-and-son|mercedes|aging|blessings-god-has-given|compliment|dead-remain-in-life|flower-of-honesty|henry-fords-choice|his-hand-is-at-work|hot-bread|hunters-description|if-fate-allows-we-will-meet|mullah-and-the-scholar|newtons-second-law|nothing-is-ever-truly-lost)$/.test(
        storyStem || ""
      );
    const stamp = kyFit
      ? "?v=20260929kyfit"
      : ruSideFix
      ? "?v=20260927ruside"
      : enSideFix
        ? "?v=20260928enside"
      : kyEnFix
        ? "?v=20260928kyen"
      : kyHeadFix
        ? "?v=20260928kytitle"
      : lang === "ky"
        ? "?v=20260928kystyle"
        : lang === "az"
          ? "?v=20260929azcap2"
          : "?v=20260927frame";
    const illustExt = ".webp";
    return new URL(
      "../../" + lang + "/wisdom-stories/illustrations/" + storyStem + illustExt + stamp,
      window.location.href
    ).href;
  };

  const audioUrl = (code, ctx) => {
    const story = ctx.state.byLang[code];
    const stem = (story && story.stem) || ctx.state.stem;
    if (!stem) return "";
    return new URL(
      "../../" + code + "/wisdom-stories/audio/" + stem + ".mp3" + ctx.assetQuery(),
      window.location.href
    ).href;
  };

  const renderColumn = (code, ctx) => {
    const story = ctx.state.byLang[code];
    const meta = ctx.LANG_META[code];
    const parts = classifyParagraphs(story ? story.paragraphs : [], ctx.state.stem);
    const bodyHtml = parts.body
      .map((p) => '<p class="sc-col__text">' + escapeHtml(p) + "</p>")
      .join("");
    const moralHtml = parts.moral
      ? '<p class="sc-col__text sc-col__moral">' + escapeHtml(parts.moral) + "</p>"
      : "";
    const title = (story && story.title) || "";
    const audioLabel = escapeHtml(tUi("story_audio_label", "Audio"));
    const listenTip = escapeHtml(tUi("listen", "Listen"));
    const stopTip = escapeHtml(tUi("stop", "Stop"));
    const audioEnabled = window.__BIRINCI_AUDIO_CONTROLS_ENABLED__ === true;
    const disabledAttrs = audioEnabled
      ? ""
      : ' disabled aria-disabled="true" tabindex="-1" hidden';
    const audioHiddenAttrs = audioEnabled ? "" : " hidden aria-hidden=\"true\"";
    const audioHtml =
      '<div class="sc-col__audio" role="group" aria-label="' +
      audioLabel +
      '"' +
      audioHiddenAttrs +
      ">" +
      '<button type="button" class="tools-bar__view-btn tools-bar__view-btn--icon" data-sc-tts="listen" data-lang="' +
      code +
      '" aria-pressed="false" title="' +
      listenTip +
      '" aria-label="' +
      listenTip +
      '"' +
      disabledAttrs +
      ">" +
      VIEW_ICONS.listen +
      "</button>" +
      '<button type="button" class="tools-bar__view-btn tools-bar__view-btn--icon" data-sc-tts="stop" data-lang="' +
      code +
      '" aria-pressed="true" title="' +
      stopTip +
      '" aria-label="' +
      stopTip +
      '"' +
      disabledAttrs +
      ">" +
      VIEW_ICONS.stop +
      "</button>" +
      "</div>";
    const showImage = !!(story && story.stem && story.hasImage !== false);
    const alt = tUi("illustration_alt", "{title} illustration").replace(
      "{title}",
      title || (story && story.stem) || ""
    );
    const kyBox = code === "ky" && story && story.stem ? KY_ILLUST_SIZE[story.stem] : null;
    const azBox = code === "az" && story && story.stem ? AZ_ILLUST_SIZE[story.stem] : null;
    const box = kyBox || azBox;
    const illustW = box ? String(box[0]) : "768";
    const illustH = box ? String(box[1]) : "512";
    const imgHtml =
      '<img class="sc-col__image" src="' +
      escapeHtml(illustrationUrl(code, story.stem, ctx.assetQuery)) +
      '" alt="' +
      escapeHtml(alt) +
      '" loading="lazy" decoding="async" width="' +
      illustW +
      '" height="' +
      illustH +
      '" onerror="this.closest(\'figure\').hidden=true" />';
    // Plain image for all langs (KY title/moral chrome stays on story pages / lightboxes only).
    const figureHtml = showImage
      ? '<figure class="sc-col__figure">' + imgHtml + "</figure>"
      : "";
    return (
      '<article class="sc-col" data-lang="' +
      code +
      '">' +
      '<header class="sc-col__head">' +
      flagImgHtml(code, 22, 16) +
      "<span>" +
      escapeHtml(meta.short) +
      "</span>" +
      '<span class="sc-col__head-name">' +
      escapeHtml(meta.title) +
      "</span>" +
      "</header>" +
      '<div class="sc-col__body">' +
      '<div class="sc-col__copy">' +
      '<div class="sc-col__title-row">' +
      '<h2 class="sc-col__title">' +
      escapeHtml(title || "—") +
      "</h2>" +
      audioHtml +
      "</div>" +
      bodyHtml +
      moralHtml +
      "</div>" +
      figureHtml +
      "</div>" +
      "</article>"
    );
  };

  const columnSpeakText = (code, ctx) => {
    const story = ctx.state.byLang[code];
    if (!story) return "";
    const parts = classifyParagraphs(story.paragraphs, ctx.state.stem);
    return [story.title || "", ...(parts.body || []), parts.moral || ""]
      .map((p) => String(p || "").trim())
      .filter(Boolean)
      .join(". ");
  };

  window.__birinciBootCompareWindow({
    scriptName: "story-compare.js",
    showContentViews: true,
    pagerLabelKey: "stories_nav",
    pagerLabelFallback: "Stories",
    loadLang: loadCatalog,
    findItem: findStory,
    flattenStems,
    renderColumn,
    columnSpeakText,
    audioUrl,
    logLoadFailure: (info) => {
      try {
        console.error("story-compare catalog load failed", info);
      } catch (_) {}
    },
  });
})();
