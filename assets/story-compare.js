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

  const KY_ILLUST_SIZE = {"door-to-the-heart": [1536, 1024], "honestly-earned-morsel": [1536, 1024], "hajj-pilgrimage": [1536, 1024], "power-of-justice": [1536, 1024], "my-alif-has-been-dotted": [1536, 1024], "gifts-of-allah": [1536, 1024], "friend-of-allah": [1536, 1024], "pleasure-of-allah": [1536, 1024], "if-fate-allows": [1536, 1024], "dervishs-long-spoons": [1536, 1024], "dervishs-appearance": [1536, 1024], "dervishs-robe": [1536, 1024], "prayer-finds-you": [1536, 1024], "gratitude-at-the-sink": [1536, 1024], "confidence-is-half-the-battle": [1536, 1024], "devil-out-of-work": [1536, 1024], "price-of-a-miracle": [1536, 1024], "hands-at-work-hope-in-god": [1536, 1024], "sacrificial-meat": [1536, 1024], "fortieth-day-rite": [1536, 1024], "adversity-and-blessing": [1536, 1024], "begin-with-self-examination": [1536, 1024], "vizier-and-the-scholar": [1536, 1024], "give-to-me-last": [1536, 1024], "prayer-for-relief": [1536, 1024], "fasting": [1536, 1024], "ramadan-prayer": [1536, 1024], "staying-on-the-right-path": [1536, 1024], "moderation-and-honesty": [1536, 1024], "church-bell": [1536, 1024], "stoning-the-devil": [1536, 1024], "drinking-the-sherbet-of-martyrdom": [1536, 1024], "why-wait": [1536, 1024], "lifes-finest-blessing": [1536, 1024], "prayer-for-everyone": [1536, 1024], "father-and-son": [1536, 1024], "fathers-footsteps": [1536, 1024], "raising-a-child": [1536, 1024], "only-my-mother-truly-weeps": [1536, 1024], "nails-lesson": [1536, 1024], "fathers-advice": [1536, 1024], "hold-my-hand": [1536, 1024], "puppies-for-sale": [1536, 1024], "festive-gift": [1536, 1024], "weeds": [1536, 1024], "waiting-for-the-teeth": [1536, 1024], "fallen-teeth": [1536, 1024], "nest-builder": [1536, 1024], "mothers-lasting-lesson": [1536, 1024], "im-tired-mom": [1536, 1024], "rotten-seed": [1536, 1024], "stay-calm-arif": [1536, 1024], "spinach": [1536, 1024], "mother-and-son": [1536, 1024], "mothers-love": [1536, 1024], "most-beautiful-gift": [1536, 1024], "hour-with-dad": [1536, 1024], "loving-from-afar": [1536, 1024], "woman-and-the-mirror": [1536, 1024], "what-is-loyalty": [1536, 1024], "what-women-endure": [1536, 1024], "friendship-and-love": [1536, 1024], "five-more-minutes": [1536, 1024], "keep-your-hearts-close": [1536, 1024], "purple-jacket": [1536, 1024], "red-dress": [1536, 1024], "i-kiss-your-eyes": [1536, 1024], "i-love-you": [1536, 1024], "eraser-in-marriage": [1536, 1024], "flower": [1536, 1024], "yellow-and-red-flowers": [1536, 1024], "mother-of-pearl-flower": [1536, 1024], "can-a-broken-heart-love-again": [1536, 1024], "those-who-give-love-receive-love": [1536, 1024], "true-love": [1536, 1024], "early-marriage": [1536, 1024], "before-you-marry": [1536, 1024], "humanity": [1536, 1024], "how-we-treat-people": [1536, 1024], "relationships": [1536, 1024], "friendship-of-horses": [1536, 1024], "go-but-come-again": [1536, 1024], "respecting-boundaries": [1536, 1024], "everyone-is-equal-here": [1536, 1024], "pair-of-boots": [1536, 1024], "glass-of-milk": [1536, 1024], "handful-of-roasted-chickpeas": [1536, 1024], "compassion": [1536, 1024], "i-wish-for-a-friend": [1536, 1024], "choosing-friends": [1536, 1024], "know-your-friend": [1536, 1024], "being-lonely": [1536, 1024], "sharing-the-burden": [1536, 1024], "compliment": [1536, 1024], "unwelcome-gifts": [1536, 1024], "forgiveness": [1536, 1024], "welcome-home-my-dear": [1536, 1024], "thoughtfulness": [1536, 1024], "your-friends": [1536, 1024], "request-for-help": [1536, 1024], "beyond-first-impressions": [1536, 1024], "discussion-and-conflict": [1536, 1024], "make-time-for-people": [1536, 1024], "permission-or-forgiveness": [1536, 1024], "gossip": [1536, 1024], "mockery-is-unacceptable": [1536, 1024], "why-shout": [1536, 1024], "doorbell": [1536, 1024], "try-again": [1536, 1024], "being-human": [1536, 1024], "justice-and-compassion": [1536, 1024], "alis-unreliable-rope": [1536, 1024], "choose-your-confidant": [1536, 1024], "in-your-hands": [1536, 1024], "grocers-sticky-fingers": [1536, 1024], "honey-or-dry-bread": [1536, 1024], "letting-go": [1536, 1024], "other-peoples-thoughts": [1536, 1024], "education-or-character": [1536, 1024], "avoid-these-questions": [1536, 1024], "every-day-has-meaning": [1536, 1024], "mature-person": [1536, 1024], "welcoming-smile": [1536, 1024], "plucking-the-goose": [1536, 1024], "how-we-express-sorrow": [1536, 1024], "telling-lies": [1536, 1024], "words-to-avoid": [1536, 1024], "generous-man": [1536, 1024], "obstacles-and-opportunities": [1536, 1024], "strength-and-sorrow": [1536, 1024], "facing-a-problem": [1536, 1024], "question-the-question": [1536, 1024], "shared-goal": [1536, 1024], "do-not-deepen-anothers-pain": [1536, 1024], "kings-generosity": [1536, 1024], "letting-go-of-painful-thoughts": [1536, 1024], "think-before-speaking": [1536, 1024], "thought-word-and-deed": [1536, 1024], "keeping-your-cool": [1536, 1024], "strengths-and-vulnerabilities": [1536, 1024], "inner-housekeeping": [1536, 1024], "beyond-complaining": [1536, 1024], "learning-to-say-yet": [1536, 1024], "flower-of-honesty": [1536, 1024], "keep-your-self-respect": [1536, 1024], "now-i-understand": [1536, 1024], "sunlit-day": [1536, 1024], "three-best-things": [1536, 1024], "strongest-shield": [1536, 1024], "believe-in-yourself": [1536, 1024], "communication": [1536, 1024], "knowing-what-you-know": [1536, 1024], "share-what-you-know": [1536, 1024], "silent-corridor": [1536, 1024], "call-the-shepherd": [1536, 1024], "shepherds-word": [1536, 1024], "what-is-a-word": [1536, 1024], "words-and-silence": [1536, 1024], "well-chosen-words": [1536, 1024], "language": [1536, 1024], "silence": [1536, 1024], "candles-conversation": [1536, 1024], "another-day": [1536, 1024], "learning-from-loss": [1536, 1024], "human-being-emerged": [1536, 1024], "different-door": [1536, 1024], "price-of-belonging": [1536, 1024], "different-path": [1536, 1024], "its-pointless": [1536, 1024], "liver": [1536, 1024], "free-time": [1536, 1024], "where-does-this-road-go": [1536, 1024], "empty-boat": [1536, 1024], "cost-of-indifference": [1536, 1024], "doctors-office": [1536, 1024], "diderot-effect": [1536, 1024], "place-in-loving-hearts": [1536, 1024], "living-well": [1536, 1024], "what-matters-in-life": [1536, 1024], "lifes-lessons": [1536, 1024], "searching": [1536, 1024], "before-it-is-too-late": [1536, 1024], "bookstore": [1536, 1024], "small-changes-great-value": [1536, 1024], "dreaming": [1536, 1024], "seeing-without-understanding": [1536, 1024], "audience-of-one": [1536, 1024], "not-my-concern": [1536, 1024], "sharpen-the-axe": [1536, 1024], "newtons-second-law": [1536, 1024], "beyond-the-cotton-field": [1536, 1024], "pawn-and-the-king": [1536, 1024], "do-you-remember-me": [1536, 1024], "dry-well": [1536, 1024], "istanbul-woman-remembers": [1536, 1024], "qualities-of-water": [1536, 1024], "never-lost": [1536, 1024], "stronger-together": [1536, 1024], "light-of-the-world": [1536, 1024], "draining-the-coffers": [1536, 1024], "hayats-life-story": [1536, 1024], "windmill-turning-without-wind": [1536, 1024], "two-bowls-of-water": [1536, 1024], "three-statues": [1536, 1024], "three-scenes": [1536, 1024], "three-questions": [1536, 1024], "living-with-loss": [1536, 1024], "life-is-short": [1536, 1024], "living-in-the-past": [1536, 1024], "butter-price-war": [1536, 1024], "everyone-has-work-to-do": [1536, 1024], "garden-and-the-gardener": [1536, 1024], "fish-shop": [1536, 1024], "investing-in-people": [1536, 1024], "we-are-rich": [1536, 1024], "henry-fords-choice": [1536, 1024], "scarf-seller": [1536, 1024], "without-a-plan": [1536, 1024], "credit-ledger": [1536, 1024], "busy-but-unproductive": [1536, 1024], "more-than-money": [1536, 1024], "weight-of-the-butter": [1536, 1024], "giving-without-money": [1536, 1024], "mercedes": [1536, 1024], "plastic-cup": [1536, 1024], "baklava": [1536, 1024], "pay-rent-for-the-water": [1536, 1024], "hot-bread": [1536, 1024], "humanity-etibar-siracsoy": [1536, 1024], "choose-justice": [1536, 1024], "sharing-justice": [1536, 1024], "lambs-skins": [1536, 1024], "land-and-homeland": [1536, 1024], "market-of-good-neighbors": [1536, 1024], "belling-the-cat": [1536, 1024], "stolen-camel": [1536, 1024], "judges-answer": [1536, 1024], "who-was-keeping-watch": [1536, 1024], "life-after-sixty": [1536, 1024], "what-changed-after-sixty": [1536, 1024], "aging": [1536, 1024], "life-flows-silently": [1536, 1024], "lions-tracks": [1536, 1024], "lions-untold-story": [1536, 1024], "elephant-and-the-rope": [1536, 1024], "ant-carrying-water": [1536, 1024], "tortoises-miscalculation": [1536, 1024], "fly-in-a-china-shop": [1536, 1024], "two-donkeys": [1536, 1024], "donkeys-law": [1536, 1024], "albrecht-durer": [1536, 1024], "mihrimah-and-sinan": [1536, 1024], "sinans-waterless-house": [1536, 1024], "remarkable-lesson": [1536, 1024], "three-essentials-for-a-city": [1536, 1024]};
  const AZ_ILLUST_SIZE = {
    "before-you-marry": [1536, 1024],
    "aging": [1536, 1024],
    "albrecht-durer": [1536, 1024],
    "ant-carrying-water": [1536, 1024],
    "sinans-waterless-house": [1536, 1024],
    "facing-a-problem": [1536, 1024],
    "avoid-these-questions": [1536, 1024],
    "baklava": [1536, 1024],
    "shared-goal": [1536, 1024],
    "stolen-camel": [1536, 1024],
    "being-human": [1536, 1024],
    "belling-the-cat": [1536, 1024],
    "those-who-give-love-receive-love": [1536, 1024],
    "five-more-minutes": [1536, 1024],
    "gifts-of-allah": [1536, 1024],
    "dry-well": [1536, 1024],
    "seeing-without-understanding": [1536, 1024],
    "bookstore": [1536, 1024],
    "nest-builder": [1536, 1024],
    "adversity-and-blessing": [1536, 1024],
    "can-a-broken-heart-love-again": [1536, 1024],
    "candles-conversation": [1536, 1024],
      "thoughtfulness": [1536, 1159],
      "time-has-passed": [1536, 1159],
      "life-flows-silently": [1536, 1159],
      "flowers": [1536, 1024],
    "investing-in-people": [1536, 1024],
    "church-bell": [1536, 1024],
    "communication": [1536, 1024],
    "compassion": [1536, 1024],
    "compliment": [1536, 1024],
    "credit-ledger": [1536, 1024],
      "another-day": [1536, 1159],
    "living-with-loss": [1536, 1024],
    "dervishs-appearance": [1536, 1024],
    "dervishs-robe": [1536, 1024],
    "dervishs-long-spoons": [1536, 1024],
    "diderot-effect": [1536, 1024],
    "different-path": [1536, 1024],
    "discussion-and-conflict": [1536, 1159],
    "every-day-has-meaning": [1536, 1024],
    "do-not-deepen-anothers-pain": [1536, 1024],
    "keep-your-hearts-close": [1536, 1024],
    "more-than-money": [1536, 1024],
    "doctors-office": [1536, 1024],
    "donkeys-law": [1536, 1024],
    "keep-your-self-respect": [1536, 1024],
    "think-before-speaking": [1536, 1024],
    "try-again": [1536, 1024],
    "drinking-the-sherbet-of-martyrdom": [1536, 1024],
    "early-marriage": [1536, 1024],
    "moderation-and-honesty": [1536, 1024],
    "education-or-character": [1536, 1024],
    "elephant-and-the-rope": [1536, 1024],
    "everyone-has-work-to-do": [1536, 1159],
    "everyone-is-equal-here": [1536, 1024],
    "in-your-hands": [1536, 1024],
    "how-we-express-sorrow": [1536, 1024],
    "words-to-avoid": [1536, 1024],
    "confidence-is-half-the-battle": [1536, 1024],
    "fallen-teeth": [1536, 1024],
    "father-and-son": [1536, 1024],
    "fathers-footsteps": [1536, 1024],
    "festive-gift": [1536, 1024],
    "fish-shop": [1536, 1024],
    "flower-of-honesty": [1536, 1024],
    "fly-in-a-china-shop": [1536, 1024],
    "life-after-sixty": [1536, 1024],
    "ill-gotten-money": [1536, 1024],
    "plastic-cup": [1536, 1024],
    "fortieth-day-rite": [1536, 1024],
    "friend-of-allah": [1536, 1024],
    "friendship-and-love": [1536, 1024],
    "friendship-of-horses": [1536, 1024],
    "fathers-advice": [1536, 1024],
      "reflections": [1536, 1159],
    "istanbul-woman-remembers": [1536, 1024],
    "garden-and-the-gardener": [1536, 1024],
    "generous-man": [1536, 1024],
    "glass-of-milk": [1536, 1024],
    "go-but-come-again": [1536, 1024],
    "pleasure-of-allah": [1536, 1024],
    "plucking-the-goose": [1536, 1024],
    "gossip": [1536, 1024],
    "stay-calm-arif": [1536, 1024],
    "butter-price-war": [1536, 1024],
    "hajj-pilgrimage": [1536, 1024],
    "handful-of-roasted-chickpeas": [1536, 1024],
    "hayats-life-story": [1536, 1024],
    "kings-generosity": [1536, 1024],
    "prayer-for-everyone": [1536, 1024],
    "henry-fords-choice": [1536, 1024],
    "busy-but-unproductive": [1536, 1024],
    "hold-my-hand": [1536, 1024],
    "land-and-homeland": [1536, 1024],
    "honey-or-dry-bread": [1536, 1024],
      "my-lifes-journey": [1536, 1159],
    "hot-bread": [1536, 1024],
    "letting-go-of-painful-thoughts": [1536, 1024],
    "unwelcome-gifts": [1536, 1024],
    "how-we-treat-people": [1536, 1024],
    "human-being-emerged": [1536, 1024],
    "humanity": [1536, 1024],
      "humanity-etibar-siracsoy": [1536, 1159],
    "lions-untold-story": [1536, 1024],
    "now-i-understand": [1536, 1024],
    "im-tired-mom": [1536, 1024],
    "waiting-for-the-teeth": [1536, 1024],
    "inner-housekeeping": [1536, 1024],
    "i-kiss-your-eyes": [1536, 1024],
    "i-love-you": [1536, 1024],
    "i-wish-for-a-friend": [1536, 1024],
    "sunlit-day": [1536, 1024],
    "devil-out-of-work": [1536, 1024],
    "if-fate-allows": [1536, 1159],
    "cost-of-indifference": [1536, 1024],
    "different-door": [1536, 1024],
    "sharing-the-burden": [1536, 1024],
    "its-pointless": [1536, 1024],
    "never-lost": [1536, 1024],
    "judges-answer": [1536, 1024],
      "relationships": [1536, 1159],
    "know-your-friend": [1536, 1024],
    "honestly-earned-morsel": [1536, 1024],
    "audience-of-one": [1536, 1024],
    "prayer-finds-you": [1536, 1024],
    "life-is-short": [1536, 1024],
    "light-of-the-world": [1536, 1024],
    "door-to-the-heart": [1536, 1024],
    "lions-tracks": [1536, 1024],
    "liver": [1536, 1024],
    "living-in-the-past": [1536, 1024],
    "loving-from-afar": [1536, 1024],
    "remarkable-lesson": [1536, 1024],
    "mature-person": [1536, 1024],
    "welcoming-smile": [1536, 1024],
    "question-the-question": [1536, 1024],
    "respecting-boundaries": [1536, 1024],
    "mercedes": [1536, 1024],
    "mihrimah-and-sinan": [1536, 1024],
    "mockery-is-unacceptable": [1536, 1024],
    "sharpen-the-axe": [1536, 1024],
    "most-beautiful-gift": [1536, 1024],
    "place-in-loving-hearts": [1536, 1024],
    "lifes-finest-blessing": [1536, 1024],
    "mother-and-son": [1536, 1024],
    "mother-of-pearl-flower": [1536, 1024],
    "mothers-lasting-lesson": [1536, 1024],
    "mothers-love": [1536, 1024],
    "vizier-and-the-scholar": [1536, 1024],
    "my-alif-has-been-dotted": [1536, 1024],
      "nails-lesson": [1536, 1159],
    "newtons-second-law": [1536, 1024],
    "price-of-belonging": [1536, 1024],
    "beyond-complaining": [1536, 1024],
    "choose-your-confidant": [1536, 1024],
    "staying-on-the-right-path": [1536, 1024],
    "learning-from-loss": [1536, 1024],
    "give-to-me-last": [1536, 1024],
    "prayer-for-relief": [1536, 1024],
    "knowing-what-you-know": [1536, 1024],
    "only-my-mother-truly-weeps": [1536, 1024],
    "without-a-plan": [1536, 1159],
    "other-peoples-thoughts": [1536, 1024],
    "strengths-and-vulnerabilities": [1536, 1024],
    "pair-of-boots": [1536, 1024],
    "pawn-and-the-king": [1536, 1024],
    "pay-rent-for-the-water": [1536, 1024],
    "request-for-help": [1536, 1024],
    "permission-or-forgiveness": [1536, 1024],
    "power-of-justice": [1536, 1024],
    "gratitude-at-the-sink": [1536, 1024],
    "price-of-a-miracle": [1536, 1024],
    "qualities-of-water": [1536, 1024],
    "puppies-for-sale": [1536, 1024],
    "purple-jacket": [1536, 1024],
      "pandemic-and-quarantine": [1536, 1159],
    "raising-a-child": [1536, 1024],
    "ramadan-prayer": [1536, 1024],
    "red-dress": [1536, 1024],
    "beyond-the-cotton-field": [1536, 1024],
    "flower": [1536, 1024],
    "rotten-seed": [1536, 1024],
    "sacrificial-meat": [1536, 1024],
    "share-what-you-know": [1536, 1024],
    "well-chosen-words": [1536, 1024],
    "scarf-seller": [1536, 1024],
    "searching": [1536, 1024],
    "living-well": [1536, 1024],
    "sharing-justice": [1536, 1024],
    "call-the-shepherd": [1536, 1024],
    "shepherds-word": [1536, 1024],
    "silence": [1536, 1024],
    "silent-corridor": [1536, 1159],
    "lambs-skins": [1536, 1024],
      "small-changes-great-value": [1536, 1159],
    "doorbell": [1536, 1024],
    "draining-the-coffers": [1536, 1024],
    "free-time": [1536, 1024],
    "make-time-for-people": [1536, 1024],
    "spinach": [1536, 1024],
    "stoning-the-devil": [1536, 1024],
    "strength-and-sorrow": [1536, 1024],
    "strongest-shield": [1536, 1024],
    "do-you-remember-me": [1536, 1024],
    "telling-lies": [1536, 1024],
    "justice-and-compassion": [1536, 1024],
    "thought-word-and-deed": [1536, 1024],
    "empty-boat": [1536, 1024],
    "choosing-friends": [1536, 1024],
    "three-best-things": [1536, 1024],
    "three-essentials-for-a-city": [1536, 1024],
    "three-scenes": [1536, 1024],
    "three-questions": [1536, 1024],
    "three-statues": [1536, 1024],
    "being-lonely": [1536, 1024],
    "keeping-your-cool": [1536, 1024],
    "fasting": [1536, 1024],
    "stronger-together": [1536, 1024],
    "believe-in-yourself": [1536, 1024],
    "dreaming": [1536, 1024],
    "forgiveness": [1536, 1024],
    "letting-go": [1536, 1024],
    "beyond-first-impressions": [1536, 1024],
    "language": [1536, 1024],
    "true-love": [1536, 1024],
    "learning-to-say-yet": [1536, 1024],
    "obstacles-and-opportunities": [1536, 1024],
    "tortoises-miscalculation": [1536, 1024],
    "two-bowls-of-water": [1536, 1024],
    "two-donkeys": [1536, 1024],
    "hour-with-dad": [1536, 1024],
    "we-are-rich": [1536, 1024],
    "weeds": [1536, 1159],
    "weight-of-the-butter": [1536, 1024],
    "welcome-home-my-dear": [1536, 1024],
    "eraser-in-marriage": [1536, 1024],
    "what-changed-after-sixty": [1536, 1024],
    "not-my-concern": [1536, 1024],
    "what-is-a-word": [1536, 1024],
    "what-is-loyalty": [1536, 1024],
    "before-it-is-too-late": [1536, 1024],
    "what-matters-in-life": [1536, 1024],
    "lifes-lessons": [1536, 1024],
    "what-women-endure": [1536, 1024],
    "begin-with-self-examination": [1536, 1024],
    "where-does-this-road-go": [1536, 1024],
    "grocers-sticky-fingers": [1536, 1024],
    "giving-without-money": [1536, 1024],
    "why-wait": [1536, 1024],
    "choose-justice": [1536, 1024],
    "why-shout": [1536, 1024],
    "windmill-turning-without-wind": [1536, 1024],
    "market-of-good-neighbors": [1536, 1024],
    "woman-and-the-mirror": [1536, 1024],
    "who-was-keeping-watch": [1536, 1024],
    "words-and-silence": [1536, 1024],
    "yellow-and-red-flowers": [1536, 1024],
    "alis-unreliable-rope": [1536, 1024],
    "your-friends": [1536, 1024],
    "hands-at-work-hope-in-god": [1536, 1024],
  };
  const foldAzI = (s) => String(s || "").replace(/[İIı]/g, "i");
  const classifyParagraphs = (paragraphs, storyStem, lang) => {
    const list = Array.isArray(paragraphs) ? paragraphs.map((p) => String(p || "")) : [];
    if (!list.length) return { body: [], moral: "", source: "" };
    const last = list.length - 1;
    const srcRe =
      /(internet|открыт\w*\s+источник|интернет|(?:source|quelle|quellen|mənbə|kaynak|источник|булак|булагы)\s*:)/i;
    const moralRe = /^(ibrət|ibret|nəticə|moral|lesson|lehre|мораль|урок|үлгү|сабак)\s*:/i;
    const authorSrcStems = {      "thoughtfulness": 1,
      "discussion-and-conflict": 1,
      "without-a-plan": 1,
      "time-has-passed": 1,
      "life-flows-silently": 1,
      "flowers": 1,
      "another-day": 1,
      "everyone-has-work-to-do": 1,
      "reflections": 1,
      "my-lifes-journey": 1,
      "humanity-etibar-siracsoy": 1,
      "if-fate-allows": 1,
      "relationships": 1,
      "nails-lesson": 1,
      "pandemic-and-quarantine": 1,
      "silent-corridor": 1,
      "small-changes-great-value": 1,
      "weeds": 1,
    };
    const authorSrc = !!(storyStem && authorSrcStems[storyStem]);
    const lastIsSrc = last >= 0 && (
      (lang !== "de" && authorSrc) || srcRe.test(foldAzI(list[last] || "")) ||
      (lang === "de" && /Internetquellen|^(?:Etibar Siracsoy|Bəxtiyar Siracov)\s*$/i.test(list[last] || ""))
    );
    let moralI = -1;
    for (let j = lastIsSrc ? last - 1 : last; j >= 0; j--) {
      if (moralRe.test(foldAzI(String(list[j] || "").trim()))) {
        moralI = j;
        break;
      }
    }
    // Poems may intentionally have no moral; never turn their last stanza into one.
    const body = [];
    let moral = "";
    let source = "";
    list.forEach((p, i) => {
      if ((moralI >= 0 && i > moralI) || (lastIsSrc && i === last)) source += (source ? "\n" : "") + p;
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
    const kyBakhtiyar =
      lang === "ky" &&
      /^(discussion-and-conflict|everyone-has-work-to-do|if-fate-allows-we-will-meet|organization-without-an-action-plan|silent-corridor|weeds-must-be-pulled-from-the-root)$/.test(
        storyStem || ""
      );
    const stamp = "?v=20261030qafixes";
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
    const parts = classifyParagraphs(story ? story.paragraphs : [], ctx.state.stem, code);
    // Flat title / prose / moral / source / figure slots so .sc-grid can align
    // rows across language columns via CSS subgrid (space sits above moral).
    const bodyHtml = (parts.body || [])
      .map((p) => '<p class="sc-col__text" style="white-space: pre-line">' + escapeHtml(p) + "</p>")
      .join("");
    const moralHtml = parts.moral
      ? '<p class="sc-col__moral story__moral" style="white-space: pre-line">' + escapeHtml(parts.moral.replace(/^\s*(?:[İiIı]brət|ibret|nəticə|moral|lesson|lehre|мораль|урок|үлгү|сабак)\s*:\s*/i, "")) + "</p>"
      : "";
    const sourceRaw = parts.source || "";
    const sourceLines = String(sourceRaw)
      .split(/\n+/)
      .map((line) => String(line || "").trim())
      .filter(Boolean);
    const sourceHtml = sourceLines.length
      ? '<p class="sc-col__source story__source">' +
        sourceLines
          .map((line) => '<span class="story__source-line">' + escapeHtml(line) + "</span>")
          .join("") +
        "</p>"
      : "";
    const title = (story && story.title) || "";
    const showImage = !!(story && story.stem && story.hasImage !== false);
    const alt = (code === "de" ? "Illustration zu „{title}“" : tUi("illustration_alt", "{title} illustration")).replace(
      "{title}",
      title || (story && story.stem) || ""
    );
    const kyBox = code === "ky" && story && story.stem ? KY_ILLUST_SIZE[story.stem] : null;
    const azBox = code === "az" && story && story.stem ? AZ_ILLUST_SIZE[story.stem] : null;
    const box = kyBox || azBox;
    const illustW = box ? String(box[0]) : "768";
    const illustH = box ? String(box[1]) : "512";
    const imgSrc = escapeHtml(
      illustrationUrl(code, story && (story.imageStem || story.stem), ctx.assetQuery, story && story.image)
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
      '<article class="sc-col sc-col--align" data-lang="' +
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
      '<div class="sc-col__title-row">' +
      '<h2 class="sc-col__title">' +
      escapeHtml(title || "—") +
      "</h2>" +
      "</div>" +
      '<div class="sc-col__prose">' +
      bodyHtml +
      "</div>" +
      '<div class="sc-col__moral-slot">' +
      moralHtml +
      "</div>" +
      '<div class="sc-col__source-slot">' +
      sourceHtml +
      "</div>" +
      '<div class="sc-col__figure-slot">' +
      figureHtml +
      "</div>" +
      "</article>"
    );
  };

  const columnSpeakText = (code, ctx) => {
    const story = ctx.state.byLang[code];
    if (!story) return "";
    const parts = classifyParagraphs(story.paragraphs, ctx.state.stem, code);
    return [story.title || "", ...(parts.body || []), parts.moral || ""]
      .map((p) => String(p || "").trim())
      .filter(Boolean)
      .join(". ");
  };

  window.__birinciBootCompareWindow({
    scriptName: "story-compare.js",
    languages: ["az", "de", "en", "ky", "ru"],
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
