/**
 * Shared historical period taxonomy for catalogue pages.
 */
(function (window) {
  "use strict";

  var PERIOD_SLUGS = [
    "prehistory",
    "ancient",
    "classical",
    "medieval",
    "renaissance",
    "early-modern",
    "industrial",
    "modern",
    "contemporary",
  ];

  var PERIOD_LABELS_EN = {
    prehistory: "Prehistoric Era (before 3000 BCE)",
    ancient: "Ancient World (c. 3000–800 BCE)",
    classical: "Classical Antiquity (c. 800 BCE–500 CE)",
    medieval: "Middle Ages (c. 500–1400)",
    renaissance: "Renaissance (c. 1400–1600)",
    "early-modern": "Early Modern Period (c. 1600–1750)",
    industrial: "Industrial Age (c. 1750–1914)",
    modern: "Modern Era (c. 1914–2000)",
    contemporary: "Contemporary Period (2000–present)",
  };

  var PERIOD_RANK = {
    prehistory: 1,
    ancient: 2,
    classical: 3,
    medieval: 4,
    renaissance: 5,
    "early-modern": 6,
    industrial: 7,
    modern: 8,
    contemporary: 9,
  };

  var PERIOD_LABELS_AZ = {
    prehistory: "Tarix öncəsi dövr (e.ə. 3000-ə qədər)",
    ancient: "Qədim dünya (təxm. e.ə. 3000–800)",
    classical: "Klassik antik dövr (təxm. e.ə. 800 – 500)",
    medieval: "Orta əsrlər (təxm. 500–1400)",
    renaissance: "İntibah dövrü (təxm. 1400–1600)",
    "early-modern": "Erkən yeni dövr (təxm. 1600–1750)",
    industrial: "Sənaye dövrü (təxm. 1750–1914)",
    modern: "Müasir dövr (təxm. 1914–2000)",
    contemporary: "Çağdaş dövr (2000 – indiyədək)",
  };

  var PF_PERIOD_RANK_EN = PERIOD_RANK;
  var PF_PERIOD_RANK_AZ = PERIOD_RANK;

  var PERIOD_LABEL_RANK_EN = {};
  var PERIOD_LABEL_RANK_AZ = {};
  PERIOD_SLUGS.forEach(function (slug) {
    PERIOD_LABEL_RANK_EN[PERIOD_LABELS_EN[slug]] = PERIOD_RANK[slug];
    PERIOD_LABEL_RANK_AZ[PERIOD_LABELS_AZ[slug]] = PERIOD_RANK[slug];
  });

  // Legacy prominent-figures labels (pre-2026 taxonomy).
  PERIOD_LABEL_RANK_EN["Prehistoric Era"] = 1;
  PERIOD_LABEL_RANK_EN["Ancient World"] = 2;
  PERIOD_LABEL_RANK_EN["Classical Antiquity"] = 3;
  PERIOD_LABEL_RANK_EN.Antiquity = 3;
  PERIOD_LABEL_RANK_EN["Middle Ages"] = 4;
  PERIOD_LABEL_RANK_EN.Renaissance = 5;
  PERIOD_LABEL_RANK_EN["Early Modern Period"] = 6;
  PERIOD_LABEL_RANK_EN["Modern era"] = 6;
  PERIOD_LABEL_RANK_EN["Industrial Age"] = 7;
  PERIOD_LABEL_RANK_EN["Modern Era"] = 8;
  PERIOD_LABEL_RANK_EN["Contemporary era"] = 9;
  PERIOD_LABEL_RANK_EN["Contemporary Period"] = 9;
  PERIOD_LABEL_RANK_AZ["Tarix öncəsi dövr"] = 1;
  PERIOD_LABEL_RANK_AZ["Qədim dünya"] = 2;
  PERIOD_LABEL_RANK_AZ["Klassik antik dövr"] = 3;
  PERIOD_LABEL_RANK_AZ["Antik dövr"] = 3;
  PERIOD_LABEL_RANK_AZ["Orta əsrlər"] = 4;
  PERIOD_LABEL_RANK_AZ["İntibah dövrü"] = 5;
  PERIOD_LABEL_RANK_AZ["Erkən yeni dövr"] = 6;
  PERIOD_LABEL_RANK_AZ["Yeni dövr"] = 6;
  PERIOD_LABEL_RANK_AZ["Sənaye dövrü"] = 7;
  PERIOD_LABEL_RANK_AZ["Müasir dövr"] = 8;
  PERIOD_LABEL_RANK_AZ["Çağdaş dövr"] = 9;

  var INVENTION_PERIOD_OVERRIDES = {
    "controlled-use-of-fire": "prehistory",
    "agriculture-and-domestication": "prehistory",
    "the-wheel": "ancient",
    "writing-systems": "ancient",
    "mathematics-and-the-concept-of-zero": "classical",
    paper: "classical",
    "the-compass": "medieval",
    gunpowder: "medieval",
    "the-printing-press": "renaissance",
    "the-scientific-method": "renaissance",
    "the-telescope": "early-modern",
    "the-microscope": "early-modern",
    "newtonian-mechanics": "early-modern",
    "steam-engine": "industrial",
    "electricity-generation-and-distribution": "industrial",
    electromagnetism: "industrial",
    "internal-combustion-engine": "industrial",
    automobile: "industrial",
    airplane: "modern",
    refrigeration: "industrial",
    vaccination: "industrial",
    antibiotics: "modern",
    "germ-theory-of-disease": "industrial",
    anaesthesia: "industrial",
    "x-rays-and-medical-imaging": "modern",
    "sanitation-and-clean-water-systems": "industrial",
    "dna-structure-and-molecular-genetics": "modern",
    "human-genome-sequencing": "contemporary",
    "crispr-gene-editing": "contemporary",
    "the-periodic-table": "industrial",
    "quantum-mechanics": "modern",
    "theory-of-relativity": "modern",
    "nuclear-energy-and-nuclear-science": "modern",
    "plastics-and-synthetic-materials": "modern",
    "fertilisers-and-modern-agricultural-chemistry": "modern",
    telegraph: "industrial",
    telephone: "industrial",
    radio: "modern",
    "semiconductor-technology": "modern",
    transistor: "modern",
    "integrated-circuit-microchip": "modern",
    computer: "modern",
    internet: "modern",
    "world-wide-web": "contemporary",
    "satellite-technology": "modern",
    "gps-global-positioning-system": "contemporary",
    laser: "modern",
    "fibre-optic-communication": "modern",
    "artificial-intelligence": "contemporary",
    "renewable-energy-technologies": "contemporary",
    "battery-technology": "modern",
    "electric-vehicles": "contemporary",
    robotics: "modern",
    "3d-printing-additive-manufacturing": "contemporary",
    blockchain: "contemporary",
    "cloud-computing": "contemporary",
    smartphones: "contemporary",
    "social-media-platforms": "contemporary",
    "search-engines": "contemporary",
    spaceflight: "modern",
  };

  var YEAR_RANGE_WITH_ERA_RE =
    /(?:c\.|ca\.|circa\s*)?(\d{1,3}(?:,\d{3})*|\d{3,4})\s*[–—-]\s*(\d{1,3}(?:,\d{3})*|\d{3,4})\s*(BCE|BC|CE|AD)?\b/gi;
  var YEAR_WITH_ERA_RE =
    /(?:c\.|ca\.|circa\s*)?(\d{1,3}(?:,\d{3})*|\d{3,4})\s*(BCE|BC|CE|AD)?\b/gi;
  var DECADE_RE = /\b(\d{3})0s\b/gi;
  var CENTURY_RE =
    /\b(\d{1,2})(?:st|nd|rd|th)?\s*centur(?:y|ies)\b|\b(\d{1,2})\s*(?:-ci|-cü|-cu|-cü|-nci|-ncü|-ncu|-ncü)\s*əsr\b/gi;
  var FOUR_DIGIT_YEAR_RE = /\b(1[0-9]{3}|20[0-2]\d)\b/g;

  function centuryMidyear(century) {
    return Math.max(1, (century - 1) * 100 + 50);
  }

  function extractYears(text) {
    var raw = text || "";
    var years = [];

    if (/million|400,000|1,000,000/i.test(raw)) {
      years.push(-1000000);
    }

    var m;
    YEAR_RANGE_WITH_ERA_RE.lastIndex = 0;
    while ((m = YEAR_RANGE_WITH_ERA_RE.exec(raw))) {
      var era = (m[3] || "").toUpperCase();
      [1, 2].forEach(function (idx) {
        var digits = m[idx].replace(/,/g, "");
        if (!/^\d+$/.test(digits)) return;
        var year = parseInt(digits, 10);
        if (era === "BCE" || era === "BC") year = -year;
        else if (year < 100 && era !== "CE" && era !== "AD") return;
        years.push(year);
      });
    }

    YEAR_WITH_ERA_RE.lastIndex = 0;
    while ((m = YEAR_WITH_ERA_RE.exec(raw))) {
      var digits = m[1].replace(/,/g, "");
      if (!/^\d+$/.test(digits)) continue;
      var year = parseInt(digits, 10);
      var era = (m[2] || "").toUpperCase();
      if (era === "BCE" || era === "BC") year = -year;
      else if (year < 100 && era !== "CE" && era !== "AD") continue;
      if (year > 3000 && era !== "CE" && era !== "AD") continue;
      years.push(year);
    }

    DECADE_RE.lastIndex = 0;
    while ((m = DECADE_RE.exec(raw))) {
      years.push(parseInt(m[1], 10) * 10);
    }

    CENTURY_RE.lastIndex = 0;
    while ((m = CENTURY_RE.exec(raw))) {
      var century = parseInt(m[1] || m[2], 10);
      if (century >= 1 && century <= 21) {
        var year = centuryMidyear(century);
        var tail = raw.slice(m.index + m[0].length, m.index + m[0].length + 16);
        if (/\b(BCE|BC)\b/i.test(tail)) year = -year;
        years.push(year);
      }
    }

    var periodMatch = /Period:\s*([^|]+)/i.exec(raw);
    var segment = periodMatch ? periodMatch[1] : raw.slice(0, 160);
    FOUR_DIGIT_YEAR_RE.lastIndex = 0;
    while ((m = FOUR_DIGIT_YEAR_RE.exec(segment))) {
      years.push(parseInt(m[1], 10));
    }

    return years;
  }

  function anchorYear(text, years) {
    var values = years || extractYears(text);
    if (!values.length) return null;

    var periodMatch = /Period:\s*([^|]+)/i.exec(text || "");
    var segment = periodMatch ? periodMatch[1] : (text || "").slice(0, 200);
    var segmentYears = extractYears("Period: " + segment);
    var pool = segmentYears.length ? segmentYears : values;

    if (/\b(BCE|BC)\b/i.test(text || "")) {
      var bceOnly = pool.filter(function (y) {
        return y < 0;
      });
      if (bceOnly.length) return Math.min.apply(null, bceOnly);
    }

    var deep = pool.filter(function (y) {
      return y <= -100000;
    });
    if (deep.length) return Math.min.apply(null, deep);

    var bce = pool.filter(function (y) {
      return y < 0;
    });
    var ce = pool.filter(function (y) {
      return y > 0;
    });

    if (ce.length && bce.length) return Math.min.apply(null, ce);
    if (bce.length) return Math.min.apply(null, bce);
    if (ce.length) return Math.min.apply(null, ce);
    return Math.min.apply(null, pool);
  }

  function slugFromYear(year) {
    if (year < -3000) return "prehistory";
    if (year < -800) return "ancient";
    if (year < 500) return "classical";
    if (year < 1400) return "medieval";
    if (year < 1600) return "renaissance";
    if (year < 1750) return "early-modern";
    if (year < 1914) return "industrial";
    if (year < 2000) return "modern";
    return "contemporary";
  }

  function inferPeriodSlug(text, milestones, slug) {
    if (slug && INVENTION_PERIOD_OVERRIDES[slug]) {
      return INVENTION_PERIOD_OVERRIDES[slug];
    }
    var blob = [text || ""]
      .concat(milestones || [])
      .join(" ")
      .trim();
    var year = anchorYear(blob);
    if (year == null) return "modern";
    return slugFromYear(year);
  }

  function getPeriodRank(period, langCode) {
    if (!period) return 999;
    if (PERIOD_RANK[period] != null) return PERIOD_RANK[period];
    var labelMap =
      langCode === "en" ? PERIOD_LABEL_RANK_EN : PERIOD_LABEL_RANK_AZ;
    var rank = labelMap[period];
    return rank != null ? rank : 999;
  }

  window.KT_HISTORICAL_PERIODS = {
    PERIOD_SLUGS: PERIOD_SLUGS,
    PERIOD_LABELS_EN: PERIOD_LABELS_EN,
    PERIOD_RANK: PERIOD_RANK,
    PERIOD_LABEL_RANK_EN: PERIOD_LABEL_RANK_EN,
    PERIOD_LABEL_RANK_AZ: PERIOD_LABEL_RANK_AZ,
    PF_PERIOD_RANK_EN: PF_PERIOD_RANK_EN,
    PF_PERIOD_RANK_AZ: PF_PERIOD_RANK_AZ,
    extractYears: extractYears,
    anchorYear: anchorYear,
    slugFromYear: slugFromYear,
    inferPeriodSlug: inferPeriodSlug,
    getPeriodRank: getPeriodRank,
  };
})(typeof window !== "undefined" ? window : this);
