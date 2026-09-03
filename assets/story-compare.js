/* Focused multilingual story comparison window. */
(function () {
  "use strict";

  const LANG_ORDER = ["az", "en", "ru", "ky"];
  const LANG_META = {
    az: { short: "AZ", title: "Azərbaycan" },
    en: { short: "EN", title: "English" },
    ru: { short: "RU", title: "Русский" },
    ky: { short: "KY", title: "Кыргызча" },
  };

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

  const ui = () => ((window.__BIRINCI_I18N__ || {}).ui || {});
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

  const foldAzI = (s) => String(s || "").replace(/[İIı]/g, "i");

  const classifyParagraphs = (paragraphs, storyStem) => {
    const list = Array.isArray(paragraphs) ? paragraphs.map((p) => String(p || "")) : [];
    if (!list.length) return { body: [], moral: "", source: "" };
    const last = list.length - 1;
    const srcRe =
      /(internet\s+sources|internet\s+mənb|internet\s+kaynak|открыт\w*\s+источник|интернет|(?:source|mənbə|kaynak|источник|булак|булагы)\s*:)/i;
    const moralRe = /^(ibrət|ibret|moral|мораль|үлгү|сабак)\s*:/i;
    const authorSrcStems = {
      "everyone-has-work-to-do": 1,
      "weeds-must-be-pulled-from-the-root": 1,
      "silent-corridor": 1,
      "if-fate-allows-we-will-meet": 1,
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
    for (let i = 0; i < cats.length; i++) {
      const stories = cats[i].stories || [];
      for (let j = 0; j < stories.length; j++) {
        if (stories[j] && stories[j].stem === storyStem) return stories[j];
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

  const assetQuery = () => {
    const tag = document.querySelector('script[src*="story-compare.js"]');
    const match = tag && tag.src && tag.src.match(/[?&]v=([^&#]+)/);
    return match ? "?v=" + match[1] : "";
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

  const catalogUrlsFor = (lang) => {
    const q = assetQuery() || "";
    const base = new URL("../../" + lang + "/assets/", window.location.href);
    return [
      new URL("stories-data.json" + q, base).href,
      new URL("stories-data.js" + q, base).href,
    ];
  };

  const loadCatalogViaFetch = async (lang) => {
    const urls = catalogUrlsFor(lang);
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

  const loadCatalogViaScript = (lang) =>
    new Promise((resolve, reject) => {
      const urls = catalogUrlsFor(lang).filter((url) => /\.js(\?|$)/i.test(url));
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

  // Sequential script loads avoid clobbering window.__BIRINCI_STORIES__.
  let scriptQueue = Promise.resolve();
  const loadCatalog = (lang) =>
    loadCatalogViaFetch(lang).catch(() => {
      const job = scriptQueue.then(() => loadCatalogViaScript(lang));
      scriptQueue = job.catch(() => {});
      return job;
    });

  const flagSrc = (code) => "../../flags/" + code + ".svg";

  const flagImgHtml = (code, width, height) =>
    '<img class="sc-lang__flag" src="' +
    flagSrc(code) +
    '" alt="" width="' +
    width +
    '" height="' +
    height +
    '" decoding="async" draggable="false" />';

  const VIEW_ICONS = window.__BIRINCI_STORY_ICONS__ || {
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

  const TTS_LANG = { az: "az-AZ", en: "en-US", ru: "ru-RU", ky: "ky-KG" };

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

  const state = {
    stem: stemFromQuery || stemFromSession,
    catalogs: {},
    stems: [],
    index: -1,
    byLang: {},
    available: {},
    visible: new Set(),
    showText: true,
    showIllustrations: false,
    togglesBound: false,
    viewsBound: false,
    audioBound: false,
    pagerBound: false,
  };

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
        '<label class="sc-lang' +
          (on ? " is-on" : "") +
          (available ? "" : " is-disabled") +
          (locked ? " is-locked" : "") +
          '"' +
          (available ? "" : ' aria-disabled="true"') +
          ">" +
          '<input type="checkbox" data-lang="' +
          code +
          '"' +
          (on ? " checked" : "") +
          (available ? "" : " disabled") +
          " />" +
          flagImgHtml(code, 20, 14) +
          "<span>" +
          escapeHtml(meta.short) +
          "</span></label>"
      );
    });
    parts.push("</div></div>");
    els.langs.innerHTML = parts.join("");
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
    if (!els.views) return;
    els.views.innerHTML = CONTENT_VIEWS.map(buildViewModeButtons).join("");
  };

  const visibleLangs = () => LANG_ORDER.filter((code) => state.visible.has(code));

  const illustrationUrl = (lang, storyStem) =>
    new URL(
      "../../" + lang + "/wisdom-stories/illustrations/" + storyStem + ".webp" + assetQuery(),
      window.location.href
    ).href;

  const renderColumn = (code) => {
    const story = state.byLang[code];
    const meta = LANG_META[code];
    const parts = classifyParagraphs(story ? story.paragraphs : [], state.stem);
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
    // Kyrgyz has no story MP3s yet — hide the Audio control for KY columns.
    const audioHtml =
      code === "ky"
        ? ""
        : '<div class="sc-col__audio" role="group" aria-label="' +
          audioLabel +
          '">' +
          '<button type="button" class="tools-bar__view-btn tools-bar__view-btn--icon" data-sc-tts="listen" data-lang="' +
          code +
          '" aria-pressed="false" title="' +
          listenTip +
          '" aria-label="' +
          listenTip +
          '">' +
          VIEW_ICONS.listen +
          "</button>" +
          '<button type="button" class="tools-bar__view-btn tools-bar__view-btn--icon" data-sc-tts="stop" data-lang="' +
          code +
          '" aria-pressed="true" title="' +
          stopTip +
          '" aria-label="' +
          stopTip +
          '">' +
          VIEW_ICONS.stop +
          "</button>" +
          "</div>";
    const showImage = !!(story && story.stem && story.hasImage !== false);
    const alt = tUi("illustration_alt", "{title} illustration").replace(
      "{title}",
      title || story.stem || ""
    );
    const figureHtml = showImage
      ? '<figure class="sc-col__figure">' +
        '<img class="sc-col__image" src="' +
        escapeHtml(illustrationUrl(code, story.stem)) +
        '" alt="' +
        escapeHtml(alt) +
        '" loading="lazy" decoding="async" width="768" height="512" onerror="this.closest(\'figure\').hidden=true" />' +
        "</figure>"
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
      '<div class="sc-col__title-row">' +
      '<h2 class="sc-col__title">' +
      escapeHtml(title || "—") +
      "</h2>" +
      audioHtml +
      "</div>" +
      bodyHtml +
      moralHtml +
      figureHtml +
      "</div>" +
      "</article>"
    );
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
    els.grid.innerHTML = langs.map(renderColumn).join("");
    syncColumnAudioButtons();
  };

  const audioUrl = (lang, storyStem) =>
    new URL(
      "../../" + lang + "/wisdom-stories/audio/" + storyStem + ".mp3" + assetQuery(),
      window.location.href
    ).href;

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
    const story = state.byLang[code];
    if (!story) return "";
    const parts = classifyParagraphs(story.paragraphs, state.stem);
    return [story.title || "", ...(parts.body || []), parts.moral || ""]
      .map((p) => String(p || "").trim())
      .filter(Boolean)
      .join(". ");
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
    const story = state.byLang[code];
    const stem = (story && story.stem) || state.stem;
    if (!stem) return;
    const el = ensureAudioEl();
    mp3FallbackLang = code;
    audioPlayingLang = code;
    syncColumnAudioButtons();
    el.src = audioUrl(code, stem);
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
    if (!btn || !els.grid.contains(btn)) return;
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
          ).replace("{n}", String(idx + 1)).replace("{total}", String(total))
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
    buildToggles();
    buildViewToggles();
    applyContentVisibility();
    renderGrid();
    updatePagerUi();
  };

  const initDefaults = () => {
    // Show every language that has this story; user can turn any off (keep ≥1).
    const defaults = LANG_ORDER.filter((code) => state.available[code]);
    // Keep previously visible langs when paging, if still available.
    if (state.visible.size) {
      const kept = LANG_ORDER.filter(
        (code) => state.visible.has(code) && state.available[code]
      );
      state.visible = new Set(kept.length ? kept : defaults);
    } else {
      state.visible = new Set(defaults);
    }
  };

  const applyStoryLookup = (storyStem) => {
    state.stem = storyStem;
    state.byLang = {};
    state.available = {};
    LANG_ORDER.forEach((lang) => {
      const story = findStory(state.catalogs[lang], storyStem);
      state.available[lang] = !!story;
      if (story) state.byLang[lang] = story;
    });
    state.index = state.stems.indexOf(storyStem);
  };

  const syncLocation = (storyStem) => {
    try {
      sessionStorage.setItem("birinci-compare-stem", storyStem);
      sessionStorage.setItem("birinci-compare-from", fromLang);
    } catch (_) {}
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("stem", storyStem);
      url.searchParams.set("from", fromLang);
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
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

  const goToStem = (storyStem, opts) => {
    const options = opts || {};
    const stem = String(storyStem || "").trim();
    if (!stem) return false;
    applyStoryLookup(stem);
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
    syncLocation(stem);
    showPrimaryTitle();
    setStatus("", true);
    refresh();
    if (els.scroll && !options.keepScroll) {
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
    const input = event.target.closest('input[type="checkbox"][data-lang]');
    if (!input) return;
    const code = input.getAttribute("data-lang");
    if (!code || !state.available[code]) {
      event.preventDefault();
      return;
    }
    if (input.checked) {
      state.visible.add(code);
    } else {
      if (state.visible.size <= 1) {
        input.checked = true;
        setStatus(tUi("multilingual_need_one", "Keep at least one language visible."), false);
        window.setTimeout(() => setStatus("", true), 2200);
        return;
      }
      state.visible.delete(code);
    }
    setStatus("", true);
    refresh();
  };

  const onViewToggle = (event) => {
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
        // Select the current number so typing replaces it quickly.
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

  const buildStemIndex = () => {
    let preferred = flattenStems(state.catalogs[fromLang]);
    if (!preferred.length) preferred = flattenStems(state.catalogs.en);
    const seen = Object.create(null);
    const stems = [];
    preferred.forEach((stem) => {
      if (seen[stem]) return;
      seen[stem] = 1;
      stems.push(stem);
    });
    // Append stems present only in other languages, preserving category order.
    LANG_ORDER.forEach((lang) => {
      flattenStems(state.catalogs[lang]).forEach((stem) => {
        if (seen[stem]) return;
        seen[stem] = 1;
        stems.push(stem);
      });
    });
    state.stems = stems;
  };

  const boot = async () => {
    if (els.pagerLabel) {
      els.pagerLabel.textContent = tUi("stories_nav", "Stories");
    }
    if (els.langs) {
      els.langs.setAttribute("aria-label", tUi("multilingual_langs_label", "Languages"));
    }
    applyContentVisibility();
    buildViewToggles();
    applyToolbarGlobe(fromLang);
    window.addEventListener("message", (event) => {
      const data = event && event.data;
      if (!data || data.type !== "birinci:lang-globe") return;
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
    const results = await Promise.all(
      LANG_ORDER.map(async (lang) => {
        try {
          const catalog = await loadCatalog(lang);
          return { lang, catalog, error: "" };
        } catch (err) {
          return {
            lang,
            catalog: null,
            error: String((err && err.message) || err || "error"),
          };
        }
      })
    );

    results.forEach(({ lang, catalog }) => {
      if (catalog) state.catalogs[lang] = catalog;
    });

    buildStemIndex();

    if (!state.stems.length) {
      const loadErrors = results
        .filter((row) => row.error)
        .map((row) => row.lang + ": " + row.error);
      if (loadErrors.length) {
        try {
          console.error("story-compare catalog load failed", {
            stem: state.stem,
            errors: loadErrors,
          });
        } catch (_) {}
      }
      setStatus(
        tUi("multilingual_missing", "This story could not be found.") +
          (loadErrors.length ? " — " + loadErrors[0] : ""),
        false
      );
      return;
    }

    // If the requested stem is missing from the index, keep it addressable.
    if (state.stems.indexOf(state.stem) < 0) {
      state.stems.push(state.stem);
    }

    if (!goToStem(state.stem, { keepScroll: true })) {
      return;
    }

    if (els.langs && !state.togglesBound) {
      state.togglesBound = true;
      els.langs.addEventListener("change", onToggle);
    }
    if (els.views && !state.viewsBound) {
      state.viewsBound = true;
      els.views.addEventListener("click", onViewToggle);
    }
    if (els.grid && !state.audioBound) {
      state.audioBound = true;
      els.grid.addEventListener("click", onColumnAudio);
    }
  };

  boot().catch(() => {
    setStatus(tUi("multilingual_missing", "This story could not be found."), false);
  });
})();
