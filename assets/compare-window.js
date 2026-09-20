/* Shared multilingual compare controls. Wisdom Stories is the source of truth. */
(function (global) {
  "use strict";

  try {
    if (typeof location !== "undefined" && location.protocol === "file:") {
      var raw = decodeURIComponent(String(location.pathname || "").replace(/\\/g, "/"));
      var lower = raw.toLowerCase();
      var marker = "birinci-web-site/";
      var at = lower.lastIndexOf(marker);
      var rel = at >= 0 ? raw.slice(at + marker.length) : "";
      if (!rel) {
        var parts = raw.replace(/^\/+[a-zA-Z]:/, "").split("/").filter(Boolean);
        rel = parts.length ? parts[parts.length - 1] : "index.html";
      }
      if (!rel || rel.charAt(rel.length - 1) === "/") rel += "index.html";
      location.replace(
        "http://127.0.0.1:8765/" + rel + (location.search || "") + (location.hash || "")
      );
      return;
    }
  } catch (_) {}

  const LANG_ORDER = ["az", "en", "ru", "ky"];
  const LANG_META = {
    az: { short: "AZ", title: "Azərbaycan" },
    en: { short: "EN", title: "English" },
    ru: { short: "RU", title: "Русский" },
    ky: { short: "KY", title: "Кыргызча" },
  };
  const TTS_LANG = { az: "az-AZ", en: "en-US", ru: "ru-RU", ky: "ky-KG" };
  const LANG_PREF_KEY = "birinci-compare-langs";

  const normalizeLangList = (items) => {
    if (!Array.isArray(items)) return [];
    return LANG_ORDER.filter((code) =>
      items.some((item) => String(item || "").toLowerCase().slice(0, 2) === code)
    );
  };

  const readSavedVisibleLangs = () => {
    try {
      const raw = localStorage.getItem(LANG_PREF_KEY);
      if (raw == null) return null;
      const trimmed = String(raw).trim();
      if (!trimmed) return null;
      let items = null;
      if (trimmed.charAt(0) === "[") {
        const parsed = JSON.parse(trimmed);
        items = Array.isArray(parsed) ? parsed : null;
      } else if (trimmed.charAt(0) === "{") {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object") {
          items = LANG_ORDER.filter((code) => {
            const value = parsed[code];
            return value === true || value === 1 || value === "1";
          });
        }
      } else {
        items = trimmed.split(/[,\s]+/);
      }
      const codes = normalizeLangList(items);
      return codes.length ? codes : null;
    } catch (_) {
      return null;
    }
  };

  const ui = () => ((global.__BIRINCI_I18N__ || {}).ui || {});
  const tUi = (key, fallback) => {
    const value = ui()[key];
    return value == null || value === "" ? fallback : String(value);
  };

  const escapeHtml = (value) =>
    String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const flagSrc = (code) => "../../flags/" + code + ".svg";

  const flagImgHtml = (code, width, height) =>
    '<img class="sc-lang__flag" src="' +
    flagSrc(code) +
    '" alt="" width="' +
    width +
    '" height="' +
    height +
    '" decoding="async" draggable="false" />';

  const VIEW_ICONS = global.__BIRINCI_STORY_ICONS__ || {
    text:
      '<svg class="tools-bar__glyph" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>',
    "text-off":
      '<svg class="tools-bar__glyph" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h6"/><path d="M5 5l14 14"/></svg>',
    eye:
      '<svg class="tools-bar__glyph" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    "eye-off":
      '<svg class="tools-bar__glyph" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 10.6a3 3 0 0 0 4.2 4.2"/><path d="M9.9 5.1A11 11 0 0 1 12 5c6.5 0 10 7 10 7a19 19 0 0 1-3.2 4.1"/><path d="M6.1 6.1C3.6 7.8 2 12 2 12s3.5 7 10 7c1.6 0 3.1-.3 4.4-.9"/></svg>',
    listen:
      '<svg class="tools-bar__glyph" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
    stop:
      '<svg class="tools-bar__glyph" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M3 3l18 18"/></svg>',
  };

  const CONTENT_VIEWS = [
    {
      key: "text",
      labelKey: "story_text_label",
      fallback: "Text",
      modeAttr: "data-sc-texts-mode",
      showIcon: "text",
      hideIcon: "text-off",
      showTipKey: "show_text",
      showTipFallback: "Show text",
      hideTipKey: "hide_text",
      hideTipFallback: "Hide text",
    },
    {
      key: "illustrations",
      labelKey: "story_image_label",
      fallback: "Image",
      modeAttr: "data-sc-images-mode",
      showIcon: "eye",
      hideIcon: "eye-off",
      showTipKey: "show_image",
      showTipFallback: "Show image",
      hideTipKey: "hide_image",
      hideTipFallback: "Hide image",
    },
  ];

  const bootCompareWindow = (adapter) => {
    const options = adapter || {};
    const scriptName = String(options.scriptName || "compare-window.js");
    const showContentViews = options.showContentViews !== false;
    const pagerLabelKey = options.pagerLabelKey || "stories_nav";
    const pagerLabelFallback = options.pagerLabelFallback || "Stories";

    const params = new URLSearchParams(window.location.search || "");
    const stemFromQuery = String(params.get("stem") || "")
      .trim()
      .replace(/^#/, "");
    let stemFromSession = "";
    try {
      stemFromSession = String(sessionStorage.getItem("birinci-compare-stem") || "")
        .trim()
        .replace(/^#/, "");
    } catch (_) {}
    const pageLang = String(
      (document.body && document.body.getAttribute("data-lang")) ||
        document.documentElement.lang ||
        "en"
    )
      .toLowerCase()
      .slice(0, 2);
    const fromLang = (() => {
      let raw = String(params.get("from") || "").toLowerCase().slice(0, 2);
      if (!LANG_META[raw]) {
        try {
          raw = String(sessionStorage.getItem("birinci-compare-from") || pageLang)
            .toLowerCase()
            .slice(0, 2);
        } catch (_) {
          raw = pageLang;
        }
      }
      return LANG_META[raw] ? raw : pageLang;
    })();

    const assetQuery = () => {
      const tag = document.querySelector('script[src*="' + scriptName + '"]');
      const match = tag && tag.src && tag.src.match(/[?&]v=([^&#]+)/);
      return match ? "?v=" + match[1] : "";
    };

    const els = {
      langs: document.getElementById("sc-langs"),
      views: document.getElementById("sc-views"),
      scroll: document.getElementById("sc-scroll"),
      grid: document.getElementById("sc-grid"),
      status: document.getElementById("sc-status"),
      brand: document.getElementById("sc-brand"),
      globe: document.querySelector(".sc-toolbar__globe"),
      pager: document.getElementById("sc-pager"),
      pagerLabel: document.getElementById("sc-pager-label"),
      first: document.getElementById("sc-pager-first"),
      prev: document.getElementById("sc-pager-prev"),
      next: document.getElementById("sc-pager-next"),
      last: document.getElementById("sc-pager-last"),
      num: document.getElementById("sc-pager-num"),
    };

    let activeGlobeLang = fromLang;

    const assetVerQuery = () => {
      const link = document.querySelector('link[href*="story-compare.css"]');
      const match = link && String(link.getAttribute("href") || "").match(/[?&]v=([^&]+)/);
      return match ? "?v=" + match[1] : "";
    };

    const languageGlobeSrc = (lang) => {
      const code = LANG_META[lang] ? lang : activeGlobeLang;
      return (
        "../../assets/language-globe-turk-plus-" +
        String(code).toUpperCase() +
        ".webp" +
        assetVerQuery()
      );
    };

    const applyToolbarGlobe = (lang) => {
      const code = LANG_META[lang] ? lang : activeGlobeLang;
      activeGlobeLang = code;
      if (!els.globe) return;
      const next = languageGlobeSrc(code);
      if (els.globe.getAttribute("src") !== next) {
        els.globe.setAttribute("src", next);
      }
      els.globe.setAttribute("data-globe-lang", code);
      try {
        document.body.setAttribute("data-lang", code);
      } catch (_) {}
    };

    const savedLangPrefs = readSavedVisibleLangs();
    const state = {
      stem: stemFromQuery || stemFromSession,
      catalogs: {},
      stems: [],
      index: -1,
      byLang: {},
      available: {},
      visible: new Set(),
      prefOn: new Set(savedLangPrefs || LANG_ORDER),
      prefReady: true,
      userAdjustedLangs: !!savedLangPrefs,
      catalogsReady: false,
      showText: true,
      showIllustrations: false,
      togglesBound: false,
      viewsBound: false,
      audioBound: false,
      pagerBound: false,
    };

    const ctx = () => ({
      state,
      fromLang,
      pageLang,
      assetQuery,
      escapeHtml,
      tUi,
      flagImgHtml,
      VIEW_ICONS,
      LANG_ORDER,
      LANG_META,
    });

    const setStatus = (text, hidden) => {
      if (!els.status) return;
      els.status.textContent = text || "";
      els.status.hidden = !!hidden;
    };

    const buildToggles = () => {
      if (!els.langs) return;
      const label = escapeHtml(tUi("multilingual_langs_label", "Languages"));
      const parts = [
        '<div class="sc-langs__group story__action-group">',
        '<span class="tools-bar__label">' + label + "</span>",
        '<div class="sc-langs__toggles" role="group" aria-label="' + label + '">',
      ];
      LANG_ORDER.forEach((code) => {
        const meta = LANG_META[code];
        const available = !!state.available[code];
        const on = state.visible.has(code);
        const locked = on && state.visible.size === 1;
        parts.push(
          '<button type="button" class="sc-lang' +
            (on ? " is-on" : "") +
            (available ? "" : " is-disabled") +
            (locked ? " is-locked" : "") +
            '" data-lang="' +
            code +
            '" aria-pressed="' +
            (on ? "true" : "false") +
            '"' +
            (available ? "" : ' aria-disabled="true" disabled') +
            ' title="' +
            escapeHtml(meta.title) +
            '">' +
            flagImgHtml(code, 20, 14) +
            "<span>" +
            escapeHtml(meta.short) +
            "</span></button>"
        );
      });
      parts.push("</div></div>");
      els.langs.innerHTML = parts.join("");
    };

    const syncToggles = () => {
      if (!els.langs) return;
      if (!els.langs.querySelector("button.sc-lang[data-lang]")) {
        buildToggles();
        return;
      }
      LANG_ORDER.forEach((code) => {
        const btn = els.langs.querySelector('button.sc-lang[data-lang="' + code + '"]');
        if (!btn) return;
        const available = !!state.available[code];
        const on = state.visible.has(code);
        const locked = on && state.visible.size === 1;
        btn.classList.toggle("is-on", on);
        btn.classList.toggle("is-disabled", !available);
        btn.classList.toggle("is-locked", locked);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        if (available) {
          btn.removeAttribute("aria-disabled");
          btn.disabled = false;
        } else {
          btn.setAttribute("aria-disabled", "true");
          btn.disabled = true;
        }
      });
    };

    const isContentOn = (key) =>
      key === "text" ? state.showText : state.showIllustrations;

    const setContentOn = (key, on) => {
      if (key === "text") state.showText = !!on;
      else state.showIllustrations = !!on;
    };

    const applyContentVisibility = () => {
      try {
        document.body.setAttribute("data-sc-show-text", state.showText ? "true" : "false");
        document.body.setAttribute(
          "data-sc-show-illus",
          state.showIllustrations ? "true" : "false"
        );
      } catch (_) {}
    };

    const buildViewModeButtons = (view) => {
      const on = isContentOn(view.key);
      const label = escapeHtml(tUi(view.labelKey, view.fallback));
      const showTip = escapeHtml(tUi(view.showTipKey, view.showTipFallback));
      const hideTip = escapeHtml(tUi(view.hideTipKey, view.hideTipFallback));
      return (
        '<div class="sc-views__group story__action-group">' +
        '<span class="tools-bar__label">' +
        label +
        "</span>" +
        '<div class="tools-bar__views" role="group" aria-label="' +
        label +
        '">' +
        '<button type="button" class="tools-bar__view-btn tools-bar__view-btn--icon" ' +
        view.modeAttr +
        '="show" aria-pressed="' +
        (on ? "true" : "false") +
        '" title="' +
        showTip +
        '" aria-label="' +
        showTip +
        '">' +
        VIEW_ICONS[view.showIcon] +
        "</button>" +
        '<button type="button" class="tools-bar__view-btn tools-bar__view-btn--icon" ' +
        view.modeAttr +
        '="hide" aria-pressed="' +
        (on ? "false" : "true") +
        '" title="' +
        hideTip +
        '" aria-label="' +
        hideTip +
        '">' +
        VIEW_ICONS[view.hideIcon] +
        "</button>" +
        "</div></div>"
      );
    };

    const buildViewToggles = () => {
      if (!showContentViews || !els.views) return;
      els.views.innerHTML = CONTENT_VIEWS.map(buildViewModeButtons).join("");
    };

    const visibleLangs = () => LANG_ORDER.filter((code) => state.visible.has(code));

    const persistVisibleLangs = () => {
      if (!state.prefReady) return;
      const langs = LANG_ORDER.filter((code) => state.prefOn.has(code));
      if (!langs.length) return;
      try {
        localStorage.setItem(LANG_PREF_KEY, JSON.stringify(langs));
      } catch (_) {}
    };

    global.__birinciPersistCompareLangs = persistVisibleLangs;

    let audioEl = null;
    let audioPlayingLang = "";
    let mp3FallbackLang = "";

    const ensureAudioEl = () => {
      if (audioEl) return audioEl;
      audioEl = document.createElement("audio");
      audioEl.setAttribute("preload", "auto");
      audioEl.setAttribute("playsinline", "");
      audioEl.addEventListener("ended", () => {
        audioPlayingLang = "";
        mp3FallbackLang = "";
        syncColumnAudioButtons();
      });
      audioEl.addEventListener("error", () => {
        const code = mp3FallbackLang;
        mp3FallbackLang = "";
        if (code) startColumnTts(code);
      });
      document.body.appendChild(audioEl);
      return audioEl;
    };

    const columnSpeakText = (code) => {
      if (typeof options.columnSpeakText === "function") {
        return String(options.columnSpeakText(code, ctx()) || "");
      }
      return "";
    };

    const pickTtsVoice = (code) => {
      if (!window.speechSynthesis) return null;
      const wanted = String(TTS_LANG[code] || "en-US").toLowerCase();
      const prefix = wanted.slice(0, 2);
      const voices = window.speechSynthesis.getVoices() || [];
      return (
        voices.find((v) => String(v.lang || "").toLowerCase() === wanted) ||
        voices.find((v) => String(v.lang || "").toLowerCase().startsWith(prefix)) ||
        null
      );
    };

    const syncColumnAudioButtons = () => {
      if (!els.grid) return;
      els.grid.querySelectorAll(".sc-col").forEach((col) => {
        const lang = col.getAttribute("data-lang");
        const playing = audioPlayingLang === lang;
        col.querySelectorAll("[data-sc-tts]").forEach((btn) => {
          const mode = btn.getAttribute("data-sc-tts");
          const pressed = mode === "listen" ? playing : !playing;
          btn.setAttribute("aria-pressed", pressed ? "true" : "false");
        });
      });
    };

    const stopColumnAudio = () => {
      audioPlayingLang = "";
      mp3FallbackLang = "";
      try {
        if (audioEl) {
          audioEl.pause();
          audioEl.removeAttribute("src");
          audioEl.load();
        }
      } catch (_) {}
      try {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      } catch (_) {}
      syncColumnAudioButtons();
    };

    const startColumnTts = (code) => {
      if (!window.speechSynthesis) {
        audioPlayingLang = "";
        syncColumnAudioButtons();
        setStatus(
          tUi("audio_failed", "Could not play the audio file. Please try again later."),
          false
        );
        window.setTimeout(() => setStatus("", true), 2200);
        return;
      }
      const text = columnSpeakText(code);
      if (!text) {
        audioPlayingLang = "";
        syncColumnAudioButtons();
        return;
      }
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = TTS_LANG[code] || "en-US";
      const voice = pickTtsVoice(code);
      if (voice) utter.voice = voice;
      utter.onend = () => {
        if (audioPlayingLang === code) {
          audioPlayingLang = "";
          syncColumnAudioButtons();
        }
      };
      utter.onerror = () => {
        if (audioPlayingLang === code) {
          audioPlayingLang = "";
          syncColumnAudioButtons();
        }
      };
      audioPlayingLang = code;
      syncColumnAudioButtons();
      window.speechSynthesis.speak(utter);
    };

    const startColumnMp3 = (code) => {
      const url =
        typeof options.audioUrl === "function" ? String(options.audioUrl(code, ctx()) || "") : "";
      if (!url) {
        startColumnTts(code);
        return;
      }
      const el = ensureAudioEl();
      mp3FallbackLang = code;
      audioPlayingLang = code;
      syncColumnAudioButtons();
      el.src = url;
      const start = el.play();
      if (start && typeof start.catch === "function") {
        start.catch(() => {
          if (mp3FallbackLang === code) {
            mp3FallbackLang = "";
            startColumnTts(code);
          }
        });
      }
    };

    const onColumnAudio = (event) => {
      const btn = event.target.closest("[data-sc-tts]");
      if (!btn || !els.grid || !els.grid.contains(btn)) return;
      const mode = btn.getAttribute("data-sc-tts");
      const code = btn.getAttribute("data-lang");
      if (!code) return;
      if (mode === "stop" || (mode === "listen" && audioPlayingLang === code)) {
        stopColumnAudio();
        return;
      }
      if (mode === "listen") {
        stopColumnAudio();
        startColumnMp3(code);
      }
    };

    const renderGrid = () => {
      if (!els.grid) return;
      const langs = visibleLangs();
      els.grid.style.setProperty("--sc-cols", String(Math.max(langs.length, 1)));
      if (!langs.length) {
        stopColumnAudio();
        els.grid.innerHTML = "";
        return;
      }
      stopColumnAudio();
      els.grid.innerHTML = langs
        .map((code) =>
          typeof options.renderColumn === "function" ? options.renderColumn(code, ctx()) : ""
        )
        .join("");
      syncColumnAudioButtons();
    };

    const formatPagerValue = (current, total) =>
      String(current) + " / " + String(total);

    const parsePagerNumber = (raw) => {
      const text = String(raw || "").trim();
      if (!text) return NaN;
      const match = text.match(/^\s*(\d+)\s*(?:\/\s*\d+)?\s*$/);
      if (!match) return NaN;
      return parseInt(match[1], 10);
    };

    const setControlTip = (el, label) => {
      if (!el) return;
      const text = String(label || "");
      el.setAttribute("aria-label", text);
      el.setAttribute("title", text);
    };

    const updatePagerUi = () => {
      const total = state.stems.length;
      const idx = state.index;
      const has = total > 0 && idx >= 0;
      const atFirst = !has || idx <= 0;
      const atLast = !has || idx >= total - 1;
      if (els.pager) {
        els.pager.hidden = !has;
        if (has) els.pager.removeAttribute("hidden");
        else els.pager.setAttribute("hidden", "");
        els.pager.setAttribute("aria-hidden", has ? "false" : "true");
      }
      if (els.num) {
        els.num.value = has ? formatPagerValue(idx + 1, total) : "";
        els.num.disabled = !has;
        els.num.setAttribute("data-total", String(total || 0));
        const numTip = has
          ? tUi(
              "multilingual_story_number_tip",
              "Current story / total — enter a number to jump"
            )
              .replace("{n}", String(idx + 1))
              .replace("{total}", String(total))
          : tUi("multilingual_story_number", "Story number");
        setControlTip(els.num, numTip);
      }
      if (els.first) {
        els.first.disabled = atFirst;
        setControlTip(els.first, tUi("multilingual_first_story", "First story"));
      }
      if (els.prev) {
        els.prev.disabled = atFirst;
        setControlTip(els.prev, tUi("multilingual_prev_story", "Previous story"));
      }
      if (els.next) {
        els.next.disabled = atLast;
        setControlTip(els.next, tUi("multilingual_next_story", "Next story"));
      }
      if (els.last) {
        els.last.disabled = atLast;
        setControlTip(els.last, tUi("multilingual_last_story", "Last story"));
      }
    };

    const refresh = () => {
      syncToggles();
      if (showContentViews) buildViewToggles();
      applyContentVisibility();
      renderGrid();
      updatePagerUi();
    };

    const initDefaults = () => {
      // First visit (no saved prefs): every lang that has text.
      // Saved on/off flags apply after catalogs load. A lang with no item
      // stays off/disabled; never paint a one-language seed as the default.
      const defaults = LANG_ORDER.filter((code) => state.available[code]);
      const wanted = LANG_ORDER.filter(
        (code) => state.prefOn.has(code) && state.available[code]
      );
      if (state.userAdjustedLangs || savedLangPrefs) {
        state.visible = new Set(wanted.length ? wanted : defaults);
        return;
      }
      state.visible = new Set(defaults);
      state.prefOn = new Set(LANG_ORDER);
    };

    const applyItemLookup = (itemStem) => {
      state.stem = itemStem;
      state.byLang = {};
      state.available = {};
      LANG_ORDER.forEach((lang) => {
        const item =
          typeof options.findItem === "function"
            ? options.findItem(state.catalogs[lang], itemStem)
            : null;
        state.available[lang] = !!item;
        if (item) state.byLang[lang] = item;
      });
      state.index = state.stems.indexOf(itemStem);
    };

    const syncLocation = (itemStem, opts) => {
      const syncOpts = opts || {};
      try {
        sessionStorage.setItem("birinci-compare-stem", itemStem);
        sessionStorage.setItem("birinci-compare-from", fromLang);
      } catch (_) {}
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("stem", itemStem);
        url.searchParams.set("from", fromLang);
        const next = url.pathname + url.search + url.hash;
        if (typeof window.__birinciCommitHistoryHref === "function") {
          window.__birinciCommitHistoryHref(next, { replace: syncOpts.replace !== false });
        } else if (syncOpts.replace !== false) {
          window.history.replaceState({}, "", next);
        } else {
          window.history.pushState({}, "", next);
        }
      } catch (_) {}
    };

    const showPrimaryTitle = () => {
      const primary =
        state.byLang[fromLang] ||
        state.byLang.en ||
        state.byLang[LANG_ORDER.find((c) => state.available[c])];
      if (primary && primary.title) {
        document.title =
          primary.title + " · " + tUi("multilingual_view", "Multilingual View");
        if (els.brand) {
          els.brand.innerHTML = "<span>" + escapeHtml(primary.title) + "</span>";
        }
      } else if (els.brand) {
        els.brand.textContent = "";
      }
    };

    const goToStem = (itemStem, opts) => {
      const goOpts = opts || {};
      const stem = String(itemStem || "").trim();
      if (!stem) return false;
      applyItemLookup(stem);
      const any = LANG_ORDER.some((lang) => state.available[lang]);
      if (!any) {
        setStatus(
          tUi("multilingual_missing", "This story could not be found.") +
            (stem ? " [" + stem + "]" : ""),
          false
        );
        updatePagerUi();
        return false;
      }
      initDefaults();
      syncLocation(stem, { replace: goOpts.replace === true });
      showPrimaryTitle();
      setStatus("", true);
      refresh();
      if (els.scroll && !goOpts.keepScroll) {
        try {
          els.scroll.scrollTop = 0;
        } catch (_) {}
      }
      return true;
    };

    const goToIndex = (index) => {
      const total = state.stems.length;
      if (!total) return false;
      const clamped = Math.max(0, Math.min(total - 1, index | 0));
      return goToStem(state.stems[clamped]);
    };

    const goToNumber = (raw) => {
      const total = state.stems.length;
      if (!total) return false;
      const n = parsePagerNumber(raw);
      if (!Number.isFinite(n)) {
        updatePagerUi();
        setStatus(
          tUi("multilingual_invalid_story_number", "Enter a valid story number."),
          false
        );
        window.setTimeout(() => setStatus("", true), 2200);
        return false;
      }
      if (n < 1 || n > total) {
        updatePagerUi();
        setStatus(
          tUi("multilingual_story_out_of_range", "Story number must be between 1 and ") +
            total +
            ".",
          false
        );
        window.setTimeout(() => setStatus("", true), 2200);
        return false;
      }
      return goToIndex(n - 1);
    };

    const onToggle = (event) => {
      const btn = event.target.closest("button.sc-lang[data-lang]");
      if (!btn || !els.langs || !els.langs.contains(btn)) return;
      event.preventDefault();
      const code = btn.getAttribute("data-lang");
      if (!code || !state.available[code]) return;
      if (state.visible.has(code)) {
        if (state.visible.size <= 1) {
          setStatus(tUi("multilingual_need_one", "Keep at least one language visible."), false);
          window.setTimeout(() => setStatus("", true), 2200);
          return;
        }
        state.visible.delete(code);
        state.prefOn.delete(code);
      } else {
        state.visible.add(code);
        state.prefOn.add(code);
      }
      state.userAdjustedLangs = true;
      persistVisibleLangs();
      setStatus("", true);
      refresh();
    };

    const onViewToggle = (event) => {
      if (!showContentViews) return;
      const textBtn = event.target.closest("[data-sc-texts-mode]");
      const imageBtn = event.target.closest("[data-sc-images-mode]");
      const btn = textBtn || imageBtn;
      if (!btn) return;
      const mode = btn.getAttribute(textBtn ? "data-sc-texts-mode" : "data-sc-images-mode");
      const key = textBtn ? "text" : "illustrations";
      const otherKey = key === "text" ? "illustrations" : "text";
      if (mode === "show") {
        setContentOn(key, true);
      } else if (mode === "hide") {
        if (!isContentOn(otherKey)) {
          setStatus(
            tUi(
              "multilingual_need_content",
              "Keep at least one of text or illustrations visible."
            ),
            false
          );
          window.setTimeout(() => setStatus("", true), 2200);
          return;
        }
        setContentOn(key, false);
      } else {
        return;
      }
      setStatus("", true);
      refresh();
    };

    const bindPager = () => {
      if (state.pagerBound) return;
      state.pagerBound = true;
      if (els.first) {
        els.first.addEventListener("click", () => {
          if (state.index > 0) goToIndex(0);
        });
      }
      if (els.prev) {
        els.prev.addEventListener("click", () => {
          if (state.index > 0) goToIndex(state.index - 1);
        });
      }
      if (els.next) {
        els.next.addEventListener("click", () => {
          if (state.index >= 0 && state.index < state.stems.length - 1) {
            goToIndex(state.index + 1);
          }
        });
      }
      if (els.last) {
        els.last.addEventListener("click", () => {
          if (state.stems.length && state.index < state.stems.length - 1) {
            goToIndex(state.stems.length - 1);
          }
        });
      }
      if (els.num) {
        els.num.addEventListener("focus", () => {
          if (!state.stems.length || state.index < 0) return;
          els.num.value = String(state.index + 1);
          try {
            els.num.select();
          } catch (_) {}
        });
        els.num.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            goToNumber(els.num.value);
            els.num.blur();
          } else if (event.key === "Escape") {
            event.preventDefault();
            updatePagerUi();
            els.num.blur();
          }
        });
        els.num.addEventListener("change", () => {
          goToNumber(els.num.value);
        });
        els.num.addEventListener("blur", () => {
          updatePagerUi();
        });
      }
    };

    const flattenPack = (pack) =>
      typeof options.flattenStems === "function" ? options.flattenStems(pack) || [] : [];

    const normalizeStem = (value) => String(value || "").trim().replace(/^#/, "");

    const adoptStemList = (list) => {
      const incoming = (Array.isArray(list) ? list : []).map(normalizeStem).filter(Boolean);
      if (!incoming.length) return false;
      if (!state.stems.length) {
        state.stems = incoming.slice();
        return true;
      }
      if (incoming.length <= state.stems.length) return false;
      const seen = Object.create(null);
      const next = [];
      incoming.forEach((stem) => {
        if (seen[stem]) return;
        seen[stem] = 1;
        next.push(stem);
      });
      state.stems.forEach((stem) => {
        if (seen[stem]) return;
        seen[stem] = 1;
        next.push(stem);
      });
      state.stems = next;
      return true;
    };

    const buildStemIndex = () => {
      const rows = LANG_ORDER.map((lang) => ({
        lang,
        stems: flattenPack(state.catalogs[lang]),
      }));
      // A 1-item parent seed is not a catalog. Prefer a real list.
      const real = rows.filter((row) => row.stems.length > 1);
      const preferredRow =
        real.find((row) => row.lang === fromLang) ||
        real.find((row) => row.lang === "en") ||
        real.slice().sort((a, b) => b.stems.length - a.stems.length)[0];
      let preferred = (preferredRow && preferredRow.stems) || [];
      if (!preferred.length) {
        const longest = rows.slice().sort((a, b) => b.stems.length - a.stems.length)[0];
        preferred = (longest && longest.stems) || [];
      }
      const seen = Object.create(null);
      const stems = [];
      const pushAll = (list) => {
        (list || []).forEach((stem) => {
          const next = normalizeStem(stem);
          if (!next || seen[next]) return;
          seen[next] = 1;
          stems.push(next);
        });
      };
      pushAll(preferred);
      LANG_ORDER.forEach((lang) => pushAll(flattenPack(state.catalogs[lang])));
      pushAll(state.stems);
      state.stems = stems;
    };

    const catalogSize = (lang) => flattenPack(state.catalogs[lang]).length;

    const mergeCatalog = (lang, pack) => {
      if (!LANG_META[lang] || !pack) return false;
      const incomingSize = flattenPack(pack).length;
      if (!incomingSize) return false;
      const existing = state.catalogs[lang];
      if (!existing) {
        state.catalogs[lang] = pack;
        return true;
      }
      const existingSize = flattenPack(existing).length;
      // A one-item parent seed must never replace a real catalog.
      if (incomingSize <= 1 && existingSize > incomingSize) return false;
      if (typeof options.mergeCatalog === "function") {
        options.mergeCatalog(existing, pack);
        return true;
      }
      if (incomingSize < existingSize) return false;
      state.catalogs[lang] = pack;
      return true;
    };

    const fillMissingCatalogs = async () => {
      if (typeof options.loadLang !== "function") return false;
      const missing = LANG_ORDER.filter((lang) => catalogSize(lang) <= 1);
      if (!missing.length) return false;
      const retried = await Promise.all(
        missing.map(async (lang) => {
          try {
            const catalog = await options.loadLang(lang, ctx());
            return { lang, catalog };
          } catch (_) {
            return { lang, catalog: null };
          }
        })
      );
      let changed = false;
      retried.forEach(({ lang, catalog }) => {
        if (!catalog) return;
        const incoming = flattenPack(catalog).length;
        if (incoming <= catalogSize(lang) && catalogSize(lang) > 1) return;
        if (mergeCatalog(lang, catalog)) changed = true;
      });
      return changed;
    };

    let seedReloadTimer = 0;
    const applySeedCacheOnly = (payload) => {
      const data = payload || {};
      const seedStem = normalizeStem(data.stem);
      if (seedStem && !state.stem) state.stem = seedStem;
      adoptStemList(data.stems);
      if (typeof options.receiveSeed === "function") {
        try {
          options.receiveSeed(data, { mergeCatalog, state, fromLang, LANG_META });
        } catch (_) {}
      }
      // Parent HTML seed is a fetch fallback only. Never paint a one-lang
      // seed as the default. Pager may use the ID list immediately.
      if (!state.catalogsReady) {
        updatePagerUi();
        return;
      }
      if (!state.stem || state.userAdjustedLangs) return;
      if (seedReloadTimer) window.clearTimeout(seedReloadTimer);
      seedReloadTimer = window.setTimeout(() => {
        seedReloadTimer = 0;
        Promise.resolve(fillMissingCatalogs())
          .then(() => {
            if (!state.stem || state.userAdjustedLangs) return;
            buildStemIndex();
            applyItemLookup(state.stem);
            initDefaults();
            if (LANG_ORDER.some((lang) => state.available[lang])) {
              showPrimaryTitle();
              refresh();
            }
          })
          .catch(() => {});
      }, 0);
    };

    global.__birinciReceiveCompareSeed = applySeedCacheOnly;

    const boot = async () => {
      if (els.pagerLabel) {
        els.pagerLabel.textContent = tUi(pagerLabelKey, pagerLabelFallback);
      }
      if (els.langs) {
        els.langs.setAttribute("aria-label", tUi("multilingual_langs_label", "Languages"));
      }
      applyContentVisibility();
      if (showContentViews) buildViewToggles();
      applyToolbarGlobe(fromLang);
      window.addEventListener("pagehide", persistVisibleLangs);
      window.addEventListener("beforeunload", persistVisibleLangs);
      window.addEventListener("message", (event) => {
        const data = event && event.data;
        if (!data) return;
        if (data.type === "birinci:compare-seed") {
          applySeedCacheOnly(data);
          return;
        }
        if (data.type === "birinci:compare-close") {
          persistVisibleLangs();
          return;
        }
        if (data.type !== "birinci:lang-globe") return;
        const code = String(data.lang || "")
          .toLowerCase()
          .slice(0, 2);
        if (!LANG_META[code]) return;
        applyToolbarGlobe(code);
        try {
          sessionStorage.setItem("birinci-compare-from", code);
        } catch (_) {}
      });
      bindPager();
      updatePagerUi();

      if (!state.stem) {
        setStatus(tUi("multilingual_missing", "This story could not be found."), false);
        return;
      }

      setStatus(tUi("multilingual_loading", "Loading…"), false);
      const loadOne = async (lang) => {
        try {
          const catalog = await Promise.race([
            options.loadLang(lang, ctx()),
            new Promise((_, reject) => {
              window.setTimeout(() => reject(new Error("timeout")), 15000);
            }),
          ]);
          return { lang, catalog, error: "" };
        } catch (err) {
          return {
            lang,
            catalog: null,
            error: String((err && err.message) || err || "error"),
          };
        }
      };
      let results = await Promise.all(LANG_ORDER.map(loadOne));
      const missing = results.filter((row) => !row.catalog).map((row) => row.lang);
      if (missing.length) {
        await new Promise((resolve) => window.setTimeout(resolve, 200));
        const retried = await Promise.all(missing.map(loadOne));
        const byLang = Object.create(null);
        results.forEach((row) => {
          byLang[row.lang] = row;
        });
        retried.forEach((row) => {
          if (row.catalog) byLang[row.lang] = row;
        });
        results = LANG_ORDER.map((lang) => byLang[lang]);
      }

      results.forEach(({ lang, catalog }) => {
        if (catalog) mergeCatalog(lang, catalog);
      });
      await fillMissingCatalogs();
      state.catalogsReady = true;

      buildStemIndex();

      if (!state.stems.length) {
        const loadErrors = results
          .filter((row) => row.error)
          .map((row) => row.lang + ": " + row.error);
        if (loadErrors.length && typeof options.logLoadFailure === "function") {
          options.logLoadFailure({ stem: state.stem, errors: loadErrors });
        }
        setStatus(
          tUi("multilingual_missing", "This story could not be found.") +
            (loadErrors.length ? " — " + loadErrors[0] : ""),
          false
        );
        return;
      }

      if (state.stems.indexOf(state.stem) < 0) {
        state.stems.push(state.stem);
      }

      if (!goToStem(state.stem, { keepScroll: true, replace: true })) {
        return;
      }

      window.addEventListener("popstate", () => {
        const run =
          typeof window.__birinciRunApplyingHistory === "function"
            ? window.__birinciRunApplyingHistory
            : (fn) => fn();
        run(() => {
          try {
            const nextParams = new URLSearchParams(window.location.search || "");
            const stem = String(nextParams.get("stem") || "").trim();
            if (stem) goToStem(stem, { keepScroll: true, replace: true });
          } catch (_) {}
        });
      });

      if (els.langs && !state.togglesBound) {
        state.togglesBound = true;
        els.langs.addEventListener("click", onToggle);
      }
      if (showContentViews && els.views && !state.viewsBound) {
        state.viewsBound = true;
        els.views.addEventListener("click", onViewToggle);
      }
      if (els.grid && !state.audioBound) {
        state.audioBound = true;
        els.grid.addEventListener("click", onColumnAudio);
      }
    };

    return boot().catch(() => {
      setStatus(tUi("multilingual_missing", "This story could not be found."), false);
    });
  };

  global.__birinciBootCompareWindow = bootCompareWindow;
  global.__birinciCompareWindow = {
    LANG_ORDER,
    LANG_META,
    TTS_LANG,
    LANG_PREF_KEY,
    escapeHtml,
    tUi,
    flagImgHtml,
    VIEW_ICONS,
    boot: bootCompareWindow,
  };
})(window);
