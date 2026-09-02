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
  const stem = stemFromQuery || stemFromSession;
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

  const els = {
    langs: document.getElementById("sc-langs"),
    scroll: document.getElementById("sc-scroll"),
    grid: document.getElementById("sc-grid"),
    status: document.getElementById("sc-status"),
    brand: document.getElementById("sc-brand"),
  };

  const state = {
    byLang: {},
    available: {},
    visible: new Set(),
  };

  const setStatus = (text, hidden) => {
    if (!els.status) return;
    els.status.textContent = text || "";
    els.status.hidden = !!hidden;
  };

  const buildToggles = () => {
    if (!els.langs) return;
    const label = escapeHtml(tUi("multilingual_langs_label", "Languages"));
    const parts = ['<span class="sc-langs__label">' + label + "</span>"];
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
    els.langs.innerHTML = parts.join("");
  };

  const visibleLangs = () => LANG_ORDER.filter((code) => state.visible.has(code));

  const renderColumn = (code) => {
    const story = state.byLang[code];
    const meta = LANG_META[code];
    const parts = classifyParagraphs(story ? story.paragraphs : [], stem);
    const bodyHtml = parts.body
      .map((p) => '<p class="sc-col__text">' + escapeHtml(p) + "</p>")
      .join("");
    const moralHtml = parts.moral
      ? '<p class="sc-col__text sc-col__moral">' + escapeHtml(parts.moral) + "</p>"
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
      '<h2 class="sc-col__title">' +
      escapeHtml((story && story.title) || "—") +
      "</h2>" +
      bodyHtml +
      moralHtml +
      "</div>" +
      "</article>"
    );
  };

  const renderGrid = () => {
    if (!els.grid) return;
    const langs = visibleLangs();
    els.grid.style.setProperty("--sc-cols", String(Math.max(langs.length, 1)));
    if (!langs.length) {
      els.grid.innerHTML = "";
      return;
    }
    els.grid.innerHTML = langs.map(renderColumn).join("");
  };

  const refresh = () => {
    buildToggles();
    renderGrid();
  };

  const initDefaults = () => {
    // Show every language that has this story; user can turn any off (keep ≥1).
    const defaults = LANG_ORDER.filter((code) => state.available[code]);
    state.visible = new Set(defaults);
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

  const boot = async () => {
    if (els.langs) {
      els.langs.setAttribute("aria-label", tUi("multilingual_langs_label", "Languages"));
    }
    if (!stem) {
      setStatus(tUi("multilingual_missing", "This story could not be found."), false);
      return;
    }
    try {
      sessionStorage.setItem("birinci-compare-stem", stem);
      sessionStorage.setItem("birinci-compare-from", fromLang);
    } catch (_) {}
    setStatus(tUi("multilingual_loading", "Loading…"), false);
    const results = await Promise.all(
      LANG_ORDER.map(async (lang) => {
        try {
          const catalog = await loadCatalog(lang);
          const story = findStory(catalog, stem);
          return { lang, story, error: "" };
        } catch (err) {
          return { lang, story: null, error: String((err && err.message) || err || "error") };
        }
      })
    );

    results.forEach(({ lang, story }) => {
      state.available[lang] = !!story;
      if (story) state.byLang[lang] = story;
    });

    const any = LANG_ORDER.some((lang) => state.available[lang]);
    if (!any) {
      const loadErrors = results.filter((row) => row.error).map((row) => row.lang + ": " + row.error);
      if (loadErrors.length) {
        try {
          console.error("story-compare catalog load failed", { stem: stem, errors: loadErrors });
        } catch (_) {}
      }
      setStatus(
        tUi("multilingual_missing", "This story could not be found.") +
          (stem ? " [" + stem + "]" : "") +
          (loadErrors.length ? " — " + loadErrors[0] : ""),
        false
      );
      return;
    }

    initDefaults();
    const primary =
      state.byLang[fromLang] ||
      state.byLang.en ||
      state.byLang[LANG_ORDER.find((c) => state.available[c])];
    if (primary && primary.title) {
      document.title = primary.title + " · " + tUi("multilingual_view", "Multilingual View");
      if (els.brand) {
        els.brand.innerHTML = "<span>" + escapeHtml(primary.title) + "</span>";
      }
    }
    setStatus("", true);
    refresh();
    if (els.langs) els.langs.addEventListener("change", onToggle);
  };

  boot().catch(() => {
    setStatus(tUi("multilingual_missing", "This story could not be found."), false);
  });
})();
