/**
 * Sticky-note lexicon tips for Azerbaijani pages (ADİL non-Turkic loanwords).
 * Expects window.__BIRINCI_AZ_POPUP__ from popup-data.js.
 */
(() => {
  "use strict";

  const NOTE_ID = "az-lex-note";
  const OPEN_DELAY = 160;
  const CLOSE_DELAY = 180;

  const SKIP_CLOSEST =
    "button, input, textarea, select, option, script, style, noscript, " +
    "header a, footer a, .primary-nav a, .lang-switcher, .breadcrumbs a, " +
    ".story-nav a, .timeline-list a, .toc-group__toggle, .inventions-category-toggle, " +
    ".tools-bar, .az-lex, .az-lex-note, .global-search, " +
    "[data-tools-search], #sitemap-search-input, #global-search-input, #inventionsSearch";

  let noteEl = null;
  let openTimer = 0;
  let closeTimer = 0;
  let activeTrigger = null;
  let pinned = false;
  let pack = null;
  let listenersBound = false;

  const isAzUiLang = () => {
    const lang = String(
      (document.body && document.body.getAttribute("data-lang")) ||
        document.documentElement.getAttribute("data-kt-lang") ||
        document.documentElement.lang ||
        ""
    ).toLowerCase();
    return lang === "az" || lang.startsWith("az-");
  };

  const lowerAz = (value) => {
    try {
      return String(value || "")
        .replace(/İ/g, "i")
        .replace(/I/g, "ı")
        .toLocaleLowerCase("az");
    } catch (_) {
      return String(value || "")
        .replace(/İ/g, "i")
        .replace(/I/g, "ı")
        .toLowerCase();
    }
  };

  const clearTimers = () => {
    window.clearTimeout(openTimer);
    window.clearTimeout(closeTimer);
    openTimer = 0;
    closeTimer = 0;
  };

  const ensureNote = () => {
    if (noteEl && noteEl.isConnected) return noteEl;
    noteEl = document.createElement("div");
    noteEl.id = NOTE_ID;
    noteEl.className = "az-lex-note";
    noteEl.setAttribute("role", "tooltip");
    noteEl.hidden = true;
    noteEl.innerHTML =
      '<div class="az-lex-note__tape" aria-hidden="true"></div>' +
      '<p class="az-lex-note__lemma" data-lex-lemma></p>' +
      '<p class="az-lex-note__pos" data-lex-pos-row></p>' +
      '<p class="az-lex-note__gloss" data-lex-gloss></p>' +
      '<p class="az-lex-note__ety"><span class="az-lex-note__label">Mənşə:</span> <span data-lex-ety></span></p>' +
      '<p class="az-lex-note__src"><span class="az-lex-note__label">Mənbə:</span> <span data-lex-src></span></p>' +
      '<p class="az-lex-note__warn" data-lex-warn hidden></p>';
    document.body.appendChild(noteEl);
    noteEl.addEventListener("pointerenter", () => clearTimers());
    noteEl.addEventListener("pointerleave", () => {
      if (!pinned) scheduleClose();
    });
    return noteEl;
  };

  const languageLabel = (code) => {
    const map = {
      ərəb: "ərəb",
      fars: "fars",
      yunan: "yunan",
      latın: "latın",
      fransız: "fransız",
      ingilis: "ingilis",
      alman: "alman",
      rus: "rus",
      italyan: "italyan",
      ispan: "ispan",
      portuqal: "portuqal",
      holland: "holland",
      xarici: "xarici (dəqiq mənşə qeyri-müəyyən)",
    };
    return map[code] || code || "məlum deyil";
  };

  const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();

  const POS_LEAD_RE =
    /^(?:is\.|f\.is\.|f\.|sif\.|zərf\.?|əv\.|say\.|bağ\.|bağl\.|nid\.|nida|əd\.|qoş\.|məch\.|köhn\.|məc\.|dan\.|kit\.|şair\.|klas\.|tar\.|din\.|fon\.|xüs\.|tex\.|top\.|idm\.|anat\.|hərb\.|mal\.|əcz\.|mus\.|mat\.|biol\.)(?:\s*,\s*(?:is\.|f\.is\.|f\.|sif\.|zərf\.?|əv\.|say\.|bağ\.|bağl\.|nid\.|nida|əd\.|qoş\.|məch\.|köhn\.|məc\.|dan\.|kit\.|şair\.|klas\.|tar\.|din\.|fon\.|xüs\.|tex\.|top\.|idm\.|anat\.|hərb\.|mal\.|əcz\.|mus\.|mat\.|biol\.))*/i;

  const POS_FULL = {
    "is.": "isim",
    "f.is.": "fel ismi",
    "f.": "fel",
    "sif.": "sifət",
    "zərf.": "zərf",
    zərf: "zərf",
    "əv.": "əvəzlik",
    "say.": "say",
    "bağ.": "bağlayıcı",
    "bağl.": "bağlayıcı",
    "nid.": "nida",
    nida: "nida",
    "əd.": "ədat",
    "qoş.": "qoşma",
    "məch.": "məchul növ",
    "icb.": "icbar növ",
    "qarş.": "qarşılıq növ",
    "əmr.": "əmr şəkli",
    "şüh.": "şühudi keçmiş",
    "nəql.": "nəqli keçmiş",
    "cəm.": "cəm",
    cəm: "cəm",
    Cəm: "cəm",
    "zool.": "zoologiya",
    "bot.": "botanika",
    "fiziol.": "fiziologiya",
    "fiz.": "fizika",
    "kim.": "kimya",
    "arxit.": "arxitektura",
    "din.": "din",
    "klas.": "klassik",
    "köhn.": "köhnəlmiş",
    "məc.": "məcazi",
    "dan.": "danışıq",
    "kit.": "kitab dili",
    "tar.": "tarix",
    "coğr.": "coğrafiya",
    "coğ.": "coğrafiya",
    "musiqi.": "musiqi",
    "mus.": "musiqi",
    "rıy.": "riyaziyyat",
    "riyaz.": "riyaziyyat",
    "tib.": "tibb",
    "astr.": "astronomiya",
    "fəls.": "fəlsəfə",
    "hüq.": "hüquq",
    "iqt.": "iqtisadiyyat",
    "siy.": "siyasət",
    "ədəb.": "ədəbiyyat",
    "dilç.": "dilçilik",
    "şair.": "şeir dili",
    "fon.": "fonetika",
    "xüs.": "xüsusi",
    "tex.": "texnika",
    "top.": "topoqrafiya",
    "idm.": "idman",
    "anat.": "anatomiya",
    "hərb.": "hərbi",
    "mal.": "maliyyə",
    "əcz.": "əczaçılıq",
    "mat.": "riyaziyyat",
    "biol.": "biologiya",
  };

  const expandPos = (value) => {
    const raw = normalizeText(value);
    if (!raw || raw === "—") return "—";
    return raw
      .split(/\s*,\s*/)
      .map((part) => {
        const key = part.trim();
        if (!key) return "";
        if (POS_FULL[key]) return POS_FULL[key];
        const lower = key.toLocaleLowerCase("az");
        if (POS_FULL[lower]) return POS_FULL[lower];
        if (POS_FULL[lower + "."]) return POS_FULL[lower + "."];
        return key;
      })
      .filter(Boolean)
      .join(", ");
  };

  const resolvePosAndGloss = (entry) => {
    let pos = normalizeText(entry.pos);
    let gloss = normalizeText(entry.gloss);
    if (!pos && gloss) {
      const m = gloss.match(POS_LEAD_RE);
      if (m) {
        pos = m[0].replace(/\s+/g, " ").trim();
        gloss = gloss.slice(m[0].length).replace(/^[\s.;:–—-]+/, "").trim();
      }
    }
    return {
      pos: expandPos(pos || "is."),
      gloss: gloss || "—",
    };
  };

  const formatOrigin = (origin) => {
    const o = origin || {};
    const parts = [];
    if (o.uncertain) parts.push("Mənşəi dəqiq / mübahisəsiz deyil");
    if (o.language) parts.push(languageLabel(o.language) + " mənşəli");
    else if (o.raw) parts.push(String(o.raw).replace(/^\[|\]$/g, "").trim());
    else parts.push("mənşə dəqiqləşdirilməyib");
    return parts.filter(Boolean).join("; ");
  };

  const SOURCE_FULL = "Azərbaycan dilinin izahlı lüğəti.";

  const formatSourceDocument = (doc) => {
    const raw = String(doc || "").trim();
    if (!raw || /^ADİL$/i.test(raw)) return SOURCE_FULL;
    return raw;
  };

  const fillNote = (entry) => {
    const note = ensureNote();
    note.querySelector("[data-lex-lemma]").textContent = entry.lemma || "";

    const { pos, gloss } = resolvePosAndGloss(entry);
    const posRow = note.querySelector("[data-lex-pos-row]");
    // One atomic line: label + value (never wrap between them).
    posRow.replaceChildren();
    const label = document.createElement("span");
    label.className = "az-lex-note__label";
    label.textContent = "Nitq hissəsi:";
    const value = document.createElement("span");
    value.className = "az-lex-note__pos-value";
    value.textContent = pos;
    posRow.append(label, value);

    note.querySelector("[data-lex-gloss]").textContent = gloss;
    note.querySelector("[data-lex-ety]").textContent = formatOrigin(entry.origin || {});

    const src = entry.source || {};
    const PUBLISHER = ', "Şərq-Qərb" nəşriyyatı, Bakı, 2006';
    let vol = "";
    if (src.volume) {
      const volText = String(src.volume).replace(
        /^Azərbaycan dilinin izahlı lüğəti\s*-?\s*/i,
        ""
      );
      vol = " · " + volText + (/cild\b/i.test(volText) ? PUBLISHER : "");
    }
    note.querySelector("[data-lex-src]").textContent =
      formatSourceDocument(src.document) + vol + (src.entry ? " · " + src.entry : "");

    const warn = note.querySelector("[data-lex-warn]");
    if (entry.origin && entry.origin.uncertain) {
      warn.hidden = false;
      warn.textContent =
        "Qeyd: mənbədə mənşə qeyri-müəyyən və ya mübahisəli işarələnib; ehtimal fakt kimi verilmir.";
    } else {
      warn.hidden = true;
      warn.textContent = "";
    }
  };

  const positionNote = (trigger) => {
    const note = ensureNote();
    note.hidden = false;
    note.classList.add("is-open");
    note.setAttribute("aria-hidden", "false");
    void note.offsetWidth;

    const pad = 10;
    const gap = 10;
    const rect = trigger.getBoundingClientRect();
    const noteRect = note.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.left + rect.width / 2 - noteRect.width / 2;
    left = Math.max(pad, Math.min(left, vw - noteRect.width - pad));

    let top = rect.top - noteRect.height - gap;
    let place = "above";
    if (top < pad) {
      top = rect.bottom + gap;
      place = "below";
      if (top + noteRect.height > vh - pad) {
        top = Math.max(pad, Math.min(vh - noteRect.height - pad, rect.top));
        place = "overlay";
      }
    }
    note.style.left = Math.round(left) + "px";
    note.style.top = Math.round(top) + "px";
    note.dataset.place = place;
  };

  const setExpanded = (trigger, open) => {
    if (!trigger) return;
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
    trigger.classList.toggle("is-lex-active", open);
  };

  const closeNote = () => {
    clearTimers();
    const note = ensureNote();
    note.hidden = true;
    note.classList.remove("is-open");
    note.setAttribute("aria-hidden", "true");
    if (activeTrigger) setExpanded(activeTrigger, false);
    activeTrigger = null;
    pinned = false;
  };

  const scheduleClose = () => {
    clearTimers();
    closeTimer = window.setTimeout(() => {
      if (!pinned) closeNote();
    }, CLOSE_DELAY);
  };

  const openNote = (trigger, { pin = false } = {}) => {
    if (!pack || !isAzUiLang()) return;
    const lemmaId = trigger.getAttribute("data-lex");
    const entry = pack.entries && pack.entries[lemmaId];
    if (!entry) return;

    clearTimers();
    if (activeTrigger && activeTrigger !== trigger) setExpanded(activeTrigger, false);
    activeTrigger = trigger;
    pinned = !!pin;
    setExpanded(trigger, true);
    fillNote(entry);
    positionNote(trigger);
  };

  const scheduleOpen = (trigger) => {
    clearTimers();
    openTimer = window.setTimeout(() => openNote(trigger, { pin: false }), OPEN_DELAY);
  };

  const unwrap = (root) => {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll("span.az-lex").forEach((span) => {
      const parent = span.parentNode;
      if (!parent) return;
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      parent.removeChild(span);
      try {
        parent.normalize();
      } catch (_) {}
    });
  };

  const wrapTextNode = (node, formToId) => {
    const text = node.nodeValue;
    if (!text || !/[A-Za-zÇçƏəĞğIıİiÖöŞşÜü]/.test(text)) return;
    const re = /[A-Za-zÇçƏəĞğIıİiÖöŞşÜü]+/g;
    let match;
    let last = 0;
    let frag = null;
    while ((match = re.exec(text))) {
      const word = match[0];
      const id = formToId[lowerAz(word)];
      if (!id) continue;
      if (!frag) frag = document.createDocumentFragment();
      if (match.index > last) {
        frag.appendChild(document.createTextNode(text.slice(last, match.index)));
      }
      const span = document.createElement("span");
      span.className = "az-lex";
      span.tabIndex = 0;
      span.setAttribute("data-lex", id);
      span.setAttribute("aria-expanded", "false");
      span.setAttribute("aria-haspopup", "true");
      span.title = "Lüğət izahı (Azərbaycan dilinin izahlı lüğəti)";
      span.textContent = word;
      frag.appendChild(span);
      last = match.index + word.length;
    }
    if (!frag) return;
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    if (node.parentNode) node.parentNode.replaceChild(frag, node);
  };

  const wrapRoot = (root) => {
    if (!root || !pack || !pack.formToId) return;
    const formToId = pack.formToId;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !/\S/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        const el = node.parentElement;
        if (!el) return NodeFilter.FILTER_REJECT;
        if (el.closest(SKIP_CLOSEST)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => wrapTextNode(node, formToId));
  };

  const clear = (root) => {
    closeNote();
    const scope =
      root ||
      document.querySelector(".story-list") ||
      document.querySelector("[data-stories-list]") ||
      document.querySelector(".category-main") ||
      document.querySelector("main") ||
      document.body;
    if (scope) unwrap(scope);
    document.documentElement.setAttribute("data-az-lexicon", "off");
  };

  const refresh = (root) => {
    closeNote();
    if (!pack) return;
    if (!isAzUiLang()) {
      clear(root);
      return;
    }
    const scope =
      root ||
      document.querySelector(".story-list") ||
      document.querySelector("[data-stories-list]") ||
      document.querySelector(".category-main") ||
      document.querySelector("main") ||
      document.body;
    if (!scope) return;
    unwrap(scope);
    // Only mark full story bodies — not cards, nav, or chrome.
    const storyTexts = scope.querySelectorAll(".story__text");
    storyTexts.forEach((node) => wrapRoot(node));
    const n = scope.querySelectorAll(".az-lex").length;
    document.documentElement.setAttribute("data-az-lexicon", n ? "ready:" + n : "empty");
  };

  const onPointerOver = (event) => {
    if (!isAzUiLang()) return;
    const trigger = event.target.closest && event.target.closest(".az-lex");
    if (!trigger || event.pointerType === "touch") return;
    scheduleOpen(trigger);
  };

  const onPointerOut = (event) => {
    if (!isAzUiLang()) return;
    const trigger = event.target.closest && event.target.closest(".az-lex");
    if (!trigger || event.pointerType === "touch") return;
    const related = event.relatedTarget;
    if (related && related.nodeType === 1) {
      if (trigger.contains(related)) return;
      if (noteEl && noteEl.contains(related)) return;
      if (related.closest && related.closest(".az-lex") === trigger) return;
    }
    if (!pinned) scheduleClose();
  };

  const onFocusIn = (event) => {
    if (!isAzUiLang()) return;
    const trigger = event.target.closest && event.target.closest(".az-lex");
    if (!trigger) return;
    openNote(trigger, { pin: true });
  };

  const onFocusOut = (event) => {
    if (!isAzUiLang()) return;
    const trigger = event.target.closest && event.target.closest(".az-lex");
    if (!trigger) return;
    const related = event.relatedTarget;
    if (related && related.closest && related.closest(".az-lex")) return;
    if (related && noteEl && noteEl.contains(related)) return;
    pinned = false;
    scheduleClose();
  };

  const onClick = (event) => {
    if (!isAzUiLang()) {
      if (noteEl && noteEl.classList.contains("is-open")) closeNote();
      return;
    }
    const trigger = event.target.closest && event.target.closest(".az-lex");
    if (trigger) {
      if (trigger.closest("a.cat-card, a.page-card, a.inventions-card, a.primary-nav__link")) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (activeTrigger === trigger && noteEl && noteEl.classList.contains("is-open")) {
        closeNote();
        return;
      }
      openNote(trigger, { pin: true });
      return;
    }
    if (noteEl && noteEl.classList.contains("is-open") && !noteEl.contains(event.target)) {
      closeNote();
    }
  };

  const onKeyDown = (event) => {
    if (event.key === "Escape") closeNote();
  };

  const onScrollOrResize = () => {
    if (!activeTrigger || !noteEl || !noteEl.classList.contains("is-open")) return;
    positionNote(activeTrigger);
  };

  const boot = () => {
    if (!isAzUiLang()) {
      clear();
      return 0;
    }
    pack = window.__BIRINCI_AZ_POPUP__;
    if (!pack || !pack.formToId || !pack.entries) {
      throw new Error("popup-data-missing");
    }
    window.__BIRINCI_AZ_LEXICON__ = {
      version: pack.version,
      lang: "az",
      formToLemma: pack.formToId,
      entries: pack.entries,
      source: "Azərbaycan dilinin izahlı lüğəti (popup-data.js)",
    };
    if (!listenersBound) {
      document.addEventListener("pointerover", onPointerOver, true);
      document.addEventListener("pointerout", onPointerOut, true);
      document.addEventListener("focusin", onFocusIn);
      document.addEventListener("focusout", onFocusOut);
      document.addEventListener("click", onClick, true);
      document.addEventListener("keydown", onKeyDown);
      window.addEventListener("scroll", onScrollOrResize, true);
      window.addEventListener("resize", onScrollOrResize);
      listenersBound = true;
    }
    window.__birinciRefreshAzLexicon = refresh;
    window.__birinciClearAzLexicon = clear;
    window.__birinciCloseAzLexicon = closeNote;
    refresh();
    return pack.count || 0;
  };

  window.__birinciBootAzLexicon = boot;
})();
