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

  const illustrationUrl = (lang, storyStem, assetQuery) => {
    const q = typeof assetQuery === "function" ? assetQuery() : "";
    const stamp = lang === "ky" ? "?v=20260924kyill" : q;
    return new URL(
      "../../" + lang + "/wisdom-stories/illustrations/" + storyStem + ".webp" + stamp,
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
    const disabledAttrs = audioEnabled ? "" : ' disabled aria-disabled="true"';
    const audioHtml =
      '<div class="sc-col__audio" role="group" aria-label="' +
      audioLabel +
      '">' +
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
    const figureHtml = showImage
      ? '<figure class="sc-col__figure">' +
        '<img class="sc-col__image" src="' +
        escapeHtml(illustrationUrl(code, story.stem, ctx.assetQuery)) +
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
