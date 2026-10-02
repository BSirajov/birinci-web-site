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
    "advice-for-those-who-marry": [1447, 1087],
    "aging": [1465, 1074],
    "albrecht-durer": [1455, 1081],
    "ant-that-carries-water": [1468, 1071],
    "architect-sinan-dies-in-a-house-without-water": [1458, 1079],
    "attitude-toward-a-problem": [1446, 1087],
    "avoid-these-questions": [1465, 1074],
    "baklava": [1489, 1056],
    "be-sure-of-your-purpose": [1485, 1059],
    "bedouin-whose-camel-was-stolen": [1459, 1078],
    "being-human": [1513, 1040],
    "bell-to-hang-on-the-cats-neck": [1501, 1047],
    "beloved-is-one-who-gives-love-to-people": [1497, 1051],
    "beware-of-those-you-love": [1474, 1067],
    "blessings-god-has-given": [1521, 1034],
    "blind-well": [1432, 1098],
    "blind-who-have-eyes": [1453, 1082],
    "bookstore": [1449, 1085],
    "builder-of-the-nest": [1453, 1082],
    "calamity-and-blessing": [1441, 1091],
    "can-a-broken-heart-love-again": [1454, 1082],
    "candles-conversation": [1484, 1060],
    "chief-accountant-and-the-ceo": [1494, 1052],
    "church-bell": [1472, 1068],
    "communication": [1469, 1071],
    "compassion": [1451, 1084],
    "compliment": [1460, 1077],
    "credit-ledger": [1437, 1095],
    "dead-remain-in-life": [1447, 1087],
    "dervishs-clothes": [1452, 1083],
    "dervishs-robe": [1438, 1093],
    "dervishs-spoons": [1440, 1092],
    "diderot-effect": [1447, 1087],
    "different-path": [1437, 1095],
    "discussion-and-conflict": [1506, 1045],
    "do-not-complain-about-any-day-you-have-lived": [1500, 1049],
    "do-not-do-these-things": [1520, 1035],
    "do-not-let-your-hearts-part": [1462, 1076],
    "do-you-have-spending-money": [1453, 1083],
    "doctors-appointment": [1492, 1054],
    "donkeys-law": [1439, 1093],
    "dont-be-words-for-mouths-dust-for-feet": [1495, 1052],
    "dont-open-your-mouth": [1545, 1018],
    "dont-say-i-couldnt-deliver-or-i-couldnt-manage": [1521, 1034],
    "drinking-the-sherbet-of-martyrdom": [1489, 1056],
    "early-marriage": [1484, 1060],
    "eat-less-and-stay-on-the-right-path": [1494, 1052],
    "education-or-character": [1460, 1077],
    "elephant-and-the-rope": [1476, 1066],
    "everyone-has-work-to-do": [1458, 1079],
    "everyone-is-the-same-here": [1448, 1086],
    "everything-is-in-our-own-hands": [1458, 1079],
    "explaining-ones-sorrow": [1476, 1066],
    "expressions-you-should-stay-away-from": [1470, 1070],
    "faith-is-half-of-success": [1497, 1051],
    "fallen-teeth": [1450, 1085],
    "father-and-son": [1431, 1099],
    "fathers-footprints": [1453, 1083],
    "festive-gift": [1489, 1056],
    "fish-shop": [1470, 1070],
    "flower-of-honesty": [1457, 1079],
    "fly-in-the-china-shop": [1483, 1061],
    "for-those-who-have-reached-sixty": [1482, 1062],
    "forbidden-money": [1455, 1081],
    "former-minister-at-the-seminar": [1469, 1071],
    "fortieth-day-rite": [1518, 1036],
    "friend-of-god": [1487, 1058],
    "friendship-and-love": [1469, 1071],
    "friendship-of-horses": [1502, 1047],
    "from-a-wise-fathers-advice-to-his-son": [1459, 1078],
    "from-the-memoirs-of-a-lady-from-istanbul": [1467, 1072],
    "garden-and-the-gardener": [1470, 1070],
    "generous-man": [1423, 1105],
    "glass-of-milk": [1465, 1073],
    "go-but-come-again": [1461, 1076],
    "gods-pleasure": [1474, 1067],
    "goose-to-be-plucked": [1427, 1102],
    "gossip": [1513, 1039],
    "grandfather-and-grandson-at-the-market": [1458, 1079],
    "grocery-shop-and-the-supermarket": [1472, 1069],
    "hajj-pilgrimage": [1443, 1090],
    "handful-of-roasted-chickpeas": [1474, 1067],
    "hayats-life-story": [1526, 1030],
    "he-would-not-have-given-so-little": [1498, 1050],
    "help-yourself-o-exalted-god": [1463, 1075],
    "henry-fords-choice": [1460, 1078],
    "his-hand-is-at-work": [1451, 1084],
    "hold-my-hand": [1540, 1021],
    "homeland-and-land": [1465, 1074],
    "honey-or-dry-bread": [1451, 1084],
    "hot-bread": [1507, 1044],
    "how-can-i-escape-my-thoughts": [1679, 937],
    "how-to-ward-off-insults": [1450, 1085],
    "how-we-treat-people": [1494, 1052],
    "human-emerged": [1508, 1043],
    "humanity": [1438, 1094],
    "hunters-description": [1431, 1099],
    "i-am-aware-now": [1472, 1069],
    "i-am-tired-mother": [1462, 1076],
    "i-am-waiting-for-the-teeth": [1422, 1106],
    "i-got-busy-with-cleaning": [1457, 1080],
    "i-kiss-your-eyes": [1492, 1054],
    "i-love-you": [1455, 1081],
    "i-want-a-friend": [1474, 1067],
    "i-would-not-trade-it-for-anything": [1432, 1098],
    "idle-devil": [1426, 1103],
    "if-fate-allows-we-will-meet": [1438, 1093],
    "if-i-dont-do-it-these-days-the-world-wont-collapse": [1511, 1041],
    "if-the-door-before-you-wont-open-it-is-not-your-door": [1421, 1107],
    "if-the-road-does-not-tire-you-it-is-because-of-your-companion": [1470, 1070],
    "it-is-in-vain": [1470, 1070],
    "it-wont-go-to-waste": [1510, 1041],
    "just-verdict-of-the-frankfurt-judge": [1478, 1064],
    "know-your-friend": [1484, 1060],
    "lawful-morsel": [1466, 1073],
    "lecturer-and-the-groom": [1474, 1067],
    "let-prayer-come-and-find-you": [1476, 1066],
    "life-is-short": [1490, 1055],
    "life-lesson": [1482, 1062],
    "light-of-the-universe": [1439, 1093],
    "lions-footprint": [1393, 1129],
    "liver": [1472, 1069],
    "living-in-the-past": [1412, 1114],
    "loving-from-afar": [1433, 1098],
    "magnificent-lesson": [1483, 1061],
    "mature-person": [1489, 1056],
    "may-your-face-always-smile": [1458, 1079],
    "meaningless-question": [1476, 1066],
    "meddling-in-others-lives": [1496, 1051],
    "mercedes": [1478, 1064],
    "mihrimah-sultan-and-architect-sinan": [1436, 1096],
    "mockery-is-unacceptable": [1455, 1081],
    "more-effective-way": [1440, 1092],
    "most-beautiful-gift": [1522, 1033],
    "most-beautiful-places-in-the-world": [1535, 1025],
    "most-beautiful-portion": [1477, 1065],
    "mother-and-son": [1447, 1087],
    "mother-of-pearl-flower": [1474, 1067],
    "mothers-advice-fakir-baykurt-never-forgot": [1431, 1099],
    "mothers-love": [1461, 1076],
    "mullah-and-the-scholar": [1462, 1076],
    "my-alif-has-been-dotted": [1492, 1054],
    "newtons-second-law": [1455, 1081],
    "no-need-to-be-sane-when-everyone-is-mad": [1419, 1109],
    "no-one-listens-to-constant-complainers": [1477, 1065],
    "not-every-sorrow-is-told-to-people": [1506, 1045],
    "not-leaving-the-right-path": [1458, 1079],
    "nothing-is-ever-truly-lost": [1548, 1016],
    "o-god-give-first-to-the-mountains-and-stones": [1466, 1073],
    "o-god-heal-our-sorrows": [1462, 1076],
    "one-who-knows-and-the-one-who-does-not": [1459, 1078],
    "only-my-mother-would-weep": [1524, 1032],
    "organization-without-an-action-plan": [1460, 1077],
    "other-peoples-opinions": [1497, 1051],
    "our-qualities-can-become-our-enemies": [1472, 1069],
    "pair-of-boots": [1474, 1067],
    "pawn-and-the-king": [1452, 1083],
    "pay-rent-for-the-water": [1435, 1096],
    "people-who-need-something-from-you": [1454, 1082],
    "permission-or-apology": [1472, 1069],
    "power-of-truth": [1494, 1052],
    "pray-while-washing-your-dishes": [1486, 1059],
    "price-of-a-miracle": [1469, 1071],
    "properties-of-water": [1478, 1064],
    "puppies-for-sale": [1474, 1067],
    "purple-jacket": [1466, 1073],
    "raising-children": [1484, 1060],
    "ramadan-prayer": [1482, 1061],
    "red-dress": [1474, 1067],
    "road-to-the-cotton-field": [1484, 1060],
    "rose": [1479, 1063],
    "rotten-seed": [1457, 1079],
    "sacrificial-meat": [1484, 1060],
    "say-what-you-know": [1519, 1036],
    "saying-the-word-in-its-place": [1492, 1054],
    "scarf-seller": [1474, 1067],
    "searching": [1516, 1037],
    "secret-of-living-well-and-longevity": [1531, 1027],
    "sharing-justice": [1487, 1058],
    "shepherd-must-be-called": [1484, 1060],
    "shepherds-word": [1487, 1058],
    "silence": [1523, 1032],
    "silent-corridor": [1518, 1036],
    "skins-of-the-lambs": [1505, 1045],
    "sound-of-the-doorbell": [1455, 1081],
    "sowing-millet-at-the-bottom": [1408, 1117],
    "spare-time": [1497, 1051],
    "spend-your-time-with-people": [1492, 1054],
    "spinach": [1444, 1089],
    "stoning-the-devil": [1489, 1056],
    "strength-and-sorrow": [1457, 1079],
    "strongest-shield": [1517, 1037],
    "teacher-hello-do-you-remember-me": [1470, 1070],
    "telling-lies": [1487, 1058],
    "that-was-not-your-right": [1463, 1075],
    "think-speak-and-act-positively": [1550, 1014],
    "this-boat-is-empty-too": [1494, 1052],
    "those-you-should-not-befriend": [1497, 1051],
    "three-best-things": [1479, 1064],
    "three-essential-things-for-a-city": [1477, 1065],
    "three-landscapes": [1474, 1067],
    "three-questions": [1453, 1082],
    "three-statues": [1498, 1050],
    "to-be-alone": [1476, 1066],
    "to-be-cool-headed": [1551, 1014],
    "to-be-fasting": [1490, 1055],
    "to-be-full-or-to-be-gone": [1488, 1057],
    "to-be-self-confident": [1547, 1016],
    "to-dream": [1438, 1094],
    "to-forgive": [1507, 1044],
    "to-give-up": [1516, 1037],
    "to-meet-and-to-know": [1505, 1045],
    "tongue": [1516, 1037],
    "true-love": [1449, 1085],
    "try-to-think-this-way": [1516, 1037],
    "turning-hardship-into-opportunity": [1460, 1077],
    "turtles-wrong-calculation": [1496, 1051],
    "two-bowls-of-water": [1497, 1051],
    "two-donkeys": [1469, 1071],
    "value-of-your-family": [1490, 1055],
    "we-are-rich": [1498, 1050],
    "weeds-must-be-pulled-from-the-root": [1453, 1082],
    "weight-of-the-oil": [1463, 1075],
    "welcome-my-bey": [1513, 1040],
    "what-breaks-a-marriage": [1509, 1042],
    "what-changed-after-sixty": [1484, 1060],
    "what-do-i-need-it-for": [1492, 1054],
    "what-is-a-word": [1510, 1041],
    "what-is-loyalty": [1507, 1044],
    "what-it-means-to-be-late": [1491, 1055],
    "what-matters-in-life": [1490, 1055],
    "what-we-learn-in-life": [1514, 1039],
    "what-women-have-endured-in-this-world": [1478, 1064],
    "where-does-calamity-come-from": [1475, 1067],
    "where-does-this-road-go": [1495, 1052],
    "who-handles-honey-licks-his-finger": [1466, 1073],
    "why-am-i-poor": [1479, 1063],
    "why-are-you-waiting-for-the-last-day-of-the-world": [1421, 1107],
    "why-injustice-when-there-is-justice": [1501, 1048],
    "why-people-shout-when-they-argue": [1465, 1073],
    "windmill-turning-in-still-air": [1484, 1060],
    "with-this-nation-the-world-can-be-conquered": [1455, 1081],
    "woman-and-the-mirror": [1536, 1024],
    "woman-whose-house-was-robbed": [1487, 1058],
    "word-and-silence": [1467, 1072],
    "yellow-and-red-flowers": [1468, 1071],
    "you-cannot-descend-a-well-on-his-rope": [1479, 1063],
    "your-friends": [1494, 1052],
    "your-hand-at-work-your-hope-in-god": [1498, 1050],
      "caring-call-brightens-the-day": [1536, 1024],
      "kindness-builds-stronger-bonds": [1536, 1024],
      "nails-lasting-lesson": [1536, 1024],
      "cherish-today-with-loved-ones": [1536, 1024],
      "humanity-rebuilds-in-peace": [1536, 1024],
      "day-gratefully-lived": [1536, 1024],
      "small-changes-big-meaning": [1536, 1024],
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

  const illustrationUrl = (lang, storyStem, _assetQuery, bakedImage) => {
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
    const kyBakhtiyar =
      lang === "ky" &&
      /^(discussion-and-conflict|everyone-has-work-to-do|if-fate-allows-we-will-meet|organization-without-an-action-plan|silent-corridor|weeds-must-be-pulled-from-the-root)$/.test(
        storyStem || ""
      );
    const stamp = lang === "ky"
      ? "?v=20261001kywebp"
      : ruSideFix
        ? "?v=20260927ruside"
        : enSideFix
          ? "?v=20260928enside"
          : lang === "az"
            ? "?v=20260929azcap2"
            : "?v=20260927frame";
    const baked = String(bakedImage || "").trim().replace(/^\/+/, "");
    if (baked) {
      const stamped = baked.indexOf("?") >= 0 ? baked : baked + stamp;
      return new URL("../../" + lang + "/" + stamped, window.location.href).href;
    }
    const illustExt = ".webp";
    const illustDir = kyBakhtiyar
      ? "/wisdom-stories/Bakhtiyar%20Sirajov/illustrations/"
      : "/wisdom-stories/illustrations/";
    return new URL(
      "../../" + lang + illustDir + storyStem + illustExt + stamp,
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

  const kyMidTopPercent = (w, h, topPx, botPx) => {
    const r = h / w;
    const topF = topPx / h;
    const botF = botPx / h;
    const midR = 2 / 3 - r * (topF + botF);
    if (!(midR > 0.02)) return "0%";
    const artCenter = topF + (1 - topF - botF) / 2;
    return (50 - artCenter * (r / midR) * 100).toFixed(4) + "%";
  };

  const kyPlateVars = (w, h, topPx, botPx) =>
    "--ky-w:" +
    w +
    ";--ky-h:" +
    h +
    ";--ky-top-px:" +
    topPx +
    ";--ky-bot-px:" +
    botPx +
    ";--ky-mid-top:" +
    kyMidTopPercent(w, h, topPx, botPx) +
    ";";

  const isKyGold = (r, g, b) =>
    r >= 145 && g >= 85 && g <= 215 && b <= 170 && r > g + 8 && g > b + 10 && r - b > 40;

  const isKyCream = (r, g, b) =>
    r >= 220 && g >= 200 && b >= 155 && Math.abs(r - g) < 55 && r + g + b > 600;

  /* Per-image title and moral plate bounds. Plates are cream bands edged
     with thin gold rules; the middle is the artwork. */
  const detectKyPlates = (img) => {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx2 = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx2) return null;
    ctx2.drawImage(img, 0, 0, w, h);
    let data;
    try {
      data = ctx2.getImageData(0, 0, w, h).data;
    } catch (_) {
      return null;
    }
    const x0 = (w * 0.22) | 0;
    const x1 = (w * 0.78) | 0;
    const sideSpans = [
      [(w * 0.06) | 0, (w * 0.18) | 0],
      [(w * 0.82) | 0, (w * 0.94) | 0],
    ];
    const step = 5;
    const gold = new Uint8Array(h);
    const cream = new Uint8Array(h);
    const frame = new Uint8Array(h);
    for (let y = 0; y < h; y++) {
      let g = 0;
      let c = 0;
      let n = 0;
      const row = y * w;
      for (let x = x0; x < x1; x += step) {
        const i = (row + x) * 4;
        const r = data[i];
        const gg = data[i + 1];
        const b = data[i + 2];
        n += 1;
        if (isKyGold(r, gg, b)) g += 1;
        else if (isKyCream(r, gg, b)) c += 1;
      }
      if (n && g / n >= 0.48) gold[y] = 1;
      if (n && c / n >= 0.55) cream[y] = 1;
      let sg = 0;
      let sn = 0;
      for (let s = 0; s < sideSpans.length; s++) {
        for (let x = sideSpans[s][0]; x < sideSpans[s][1]; x += step) {
          const i = (row + x) * 4;
          sn += 1;
          if (isKyGold(data[i], data[i + 1], data[i + 2]) || isKyCream(data[i], data[i + 1], data[i + 2])) {
            sg += 1;
          }
        }
      }
      if (sn && sg / sn >= 0.62) frame[y] = 1;
    }
    const clusters = [];
    let y = 0;
    while (y < h) {
      if (gold[y]) {
        const s = y;
        while (y < h && gold[y]) y += 1;
        for (;;) {
          let gap = 0;
          let k = y;
          while (k < h && !gold[k] && gap < 10) {
            k += 1;
            gap += 1;
          }
          if (k < h && gold[k] && gap <= 10) {
            y = k;
            while (y < h && gold[y]) y += 1;
          } else break;
        }
        clusters.push([s, y - 1]);
      } else {
        y += 1;
      }
    }
    const thin = clusters.filter((c) => c[1] - c[0] <= 22);
    const creamAfter = (y0, limit) => {
      let last = y0;
      let yy = y0 + 1;
      let steps = 0;
      while (yy < h && steps < limit) {
        if (cream[yy] || gold[yy]) {
          last = yy;
          yy += 1;
          steps += 1;
        } else break;
      }
      return last;
    };
    const header = thin.filter((c) => c[0] < h * 0.22);
    let topEnd = 0;
    if (header.length >= 2 && header[0][0] < h * 0.05) {
      topEnd = creamAfter(header[1][1], 16) + 1;
    } else if (header.length === 1 && header[0][0] > h * 0.04) {
      topEnd = creamAfter(header[0][1], 16) + 1;
    }
    if (topEnd < h * 0.045) {
      let last = 0;
      let gap = 0;
      const limitY = (h * 0.22) | 0;
      for (let yy = 0; yy < limitY; yy++) {
        if (frame[yy] || cream[yy] || gold[yy]) {
          last = yy;
          gap = 0;
        } else {
          gap += 1;
          if (gap > 8 && last > 8) break;
        }
      }
      topEnd = Math.max(topEnd, last + 1);
    }
    const creamBefore = (y0, limit) => {
      let last = y0;
      let yy = y0 - 1;
      let steps = 0;
      while (yy >= 0 && steps < limit) {
        if (cream[yy] || gold[yy]) {
          last = yy;
          yy -= 1;
          steps += 1;
        } else break;
      }
      return last;
    };
    let outer = null;
    for (let i = thin.length - 1; i >= 0; i--) {
      if (thin[i][1] > h * 0.9) {
        outer = thin[i];
        break;
      }
    }
    let botStart = h;
    if (outer) {
      const windowTop = outer[0] - ((h * 0.32) | 0);
      const minGap = (h * 0.045) | 0;
      let chosen = null;
      thin.forEach((c) => {
        if (c[0] < windowTop || c[0] >= outer[0] - minGap) return;
        let creamRows = 0;
        let total = 0;
        for (let yy = c[1] + 1; yy < outer[0]; yy += 3) {
          total += 1;
          if (cream[yy] || gold[yy]) creamRows += 1;
        }
        if (total && creamRows / total >= 0.42 && (!chosen || c[0] > chosen[0])) chosen = c;
      });
      botStart = creamBefore(chosen ? chosen[0] : outer[0], 14);
    }
    if (h - botStart < h * 0.06) {
      let last = h - 1;
      let gap = 0;
      for (let yy = h - 1; yy > ((h * 0.75) | 0); yy--) {
        if (frame[yy] || cream[yy]) {
          last = yy;
          gap = 0;
        } else {
          gap += 1;
          if (gap > 8 && h - last > ((h * 0.05) | 0)) break;
        }
      }
      botStart = Math.min(botStart, last);
    }
    if (!(topEnd > 1) || !(botStart > topEnd + 8) || !(botStart < h)) return null;
    return { topPx: topEnd, botPx: h - botStart };
  };

  window.__birinciFitKyPlate = (img) => {
    if (!img || img.dataset.kyFit === "1") return;
    const figure = img.closest("figure");
    if (!figure) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return;
    const plates = detectKyPlates(img);
    const topPx = plates ? plates.topPx : Math.max(1, Math.round(h * 0.12));
    const botPx = plates ? plates.botPx : Math.max(1, Math.round(h * 0.135));
    figure.setAttribute("style", kyPlateVars(w, h, topPx, botPx));
    figure.dataset.kyTop = String(topPx);
    figure.dataset.kyBot = String(botPx);
    img.dataset.kyFit = "1";
    try {
      window.dispatchEvent(new Event("resize"));
    } catch (_) {}
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
    const imgSrc = escapeHtml(
      illustrationUrl(code, story.stem, ctx.assetQuery, story && story.image)
    );
    const imgHtml =
      '<img class="sc-col__image" src="' +
      imgSrc +
      '" alt="' +
      escapeHtml(alt) +
      '" loading="lazy" decoding="async" width="' +
      illustW +
      '" height="' +
      illustH +
      '" onerror="this.closest(\'figure\').hidden=true" />';
    let figureHtml = "";
    if (showImage && code === "ky") {
      const natW = kyBox ? kyBox[0] : 1431;
      const natH = kyBox ? kyBox[1] : 1099;
      const guessTop = Math.max(1, Math.round(natH * 0.12));
      const guessBot = Math.max(1, Math.round(natH * 0.135));
      const sliceImg = (sliceAlt, handlers) =>
        '<img class="sc-col__image" src="' +
        imgSrc +
        '" alt="' +
        sliceAlt +
        '" decoding="async" width="' +
        illustW +
        '" height="' +
        illustH +
        '" ' +
        handlers +
        " />";
      figureHtml =
        '<figure class="sc-col__figure sc-col__figure--ky" style="' +
        kyPlateVars(natW, natH, guessTop, guessBot) +
        '">' +
        '<div class="sc-ky-slice sc-ky-slice--top">' +
        sliceImg(
          escapeHtml(alt),
          'loading="eager" onload="window.__birinciFitKyPlate(this)" onerror="this.closest(\'figure\').hidden=true"'
        ) +
        "</div>" +
        '<div class="sc-ky-slice sc-ky-slice--mid">' +
        sliceImg("", 'aria-hidden="true" loading="eager"') +
        "</div>" +
        '<div class="sc-ky-slice sc-ky-slice--bot">' +
        sliceImg("", 'aria-hidden="true" loading="eager" onerror="this.closest(\'figure\').hidden=true"') +
        "</div>" +
        "</figure>";
    } else if (showImage) {
      figureHtml = '<figure class="sc-col__figure">' + imgHtml + "</figure>";
    }
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
