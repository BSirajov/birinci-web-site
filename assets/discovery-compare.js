/* Discovery adapter for the shared multilingual compare window.
   Same open/close/toggle/pager/listen path as Wisdom. No Image/Text. */
(function () {
  "use strict";

  document.documentElement.classList.remove("discovery-audio-hidden");

  const CW = window.__birinciCompareWindow;
  if (!CW || typeof window.__birinciBootCompareWindow !== "function") {
    return;
  }

  const LANG_META = CW.LANG_META;
  const escapeHtml = CW.escapeHtml;
  const tUi = CW.tUi;
  const flagImgHtml = CW.flagImgHtml;
  const VIEW_ICONS = CW.VIEW_ICONS;

  const seedCache = {};

  const assetQuery = () => {
    const tag = document.querySelector('script[src*="discovery-compare.js"]');
    const match = tag && tag.src && tag.src.match(/[?&]v=([^&#]+)/);
    return match ? "?v=" + match[1] : "";
  };

  const pageUrlsFor = (lang) => {
    const q = assetQuery();
    const here = window.location.href;
    const origin = window.location.origin || "";
    const urls = [
      new URL("../../tools/inventions/" + lang + "-body.html" + q, here).href,
      new URL("../../" + lang + "/discoveries/discoveries-and-inventions.html" + q, here).href,
    ];
    if (origin && origin !== "null" && origin !== "file://") {
      urls.push(origin + "/tools/inventions/" + lang + "-body.html" + q);
      urls.push(origin + "/" + lang + "/discoveries/discoveries-and-inventions.html" + q);
    }
    return urls.filter((url, idx, all) => all.indexOf(url) === idx);
  };

  const cleanCompareText = (value) => String(value || "").replace(/\s+/g, " ").trim();

  const collectEntryParagraphs = (entry) => {
    const paragraphs = [];
    const seen = Object.create(null);
    const push = (text, bullet) => {
      const clean = cleanCompareText(text);
      if (!clean || seen[clean]) return;
      seen[clean] = 1;
      paragraphs.push(bullet ? "• " + clean : clean);
    };
    const summary = entry.querySelector(".inventions-entry-visual-summary");
    if (summary) push(summary.textContent);
    Array.prototype.forEach.call(entry.querySelectorAll(".inventions-key-facts li"), (li) => {
      push(li.textContent, true);
    });
    const sections = entry.querySelectorAll(
      ".inventions-entry-section, section.inventions-entry-section, [class*='inventions-entry-section']"
    );
    Array.prototype.forEach.call(sections, (sec) => {
      if (sec.closest(".inventions-entry-references")) return;
      const h = sec.querySelector("h3, h2, h4");
      if (h) push(h.textContent);
      Array.prototype.forEach.call(sec.querySelectorAll("p"), (p) => {
        push(p.textContent);
      });
    });
    if (paragraphs.length < 2) {
      Array.prototype.forEach.call(entry.querySelectorAll("p"), (p) => {
        if (p.closest(".inventions-entry-references, .inventions-entry-meta, .inventions-entry-visual-figures")) {
          return;
        }
        push(p.textContent);
      });
    }
    if (!paragraphs.length) {
      push(entry.textContent);
    }
    return paragraphs;
  };

  const parseArticlesFromHtml = (html) => {
    const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
    const articles = [];
    const byStem = Object.create(null);
    const nodes = doc.querySelectorAll(
      "article.inventions-entry[id], .inventions-entry[id], article[id].inventions-entry"
    );
    Array.prototype.forEach.call(nodes, (entry) => {
      const stem = String(entry.id || entry.getAttribute("data-article-stem") || "").trim();
      if (!stem || byStem[stem]) return;
      const nameEl =
        entry.querySelector(".inventions-entry-name") ||
        entry.querySelector(".inventions-entry-title") ||
        entry.querySelector("h2");
      const title = cleanCompareText((nameEl && nameEl.textContent) || stem);
      const audio = (entry.getAttribute("data-audio") || "").trim();
      const article = {
        stem,
        title,
        paragraphs: collectEntryParagraphs(entry),
        hasAudio: !!audio,
        audioPath: audio,
      };
      byStem[stem] = article;
      articles.push(article);
    });
    return { articles, byStem };
  };

  const mergePack = (existing, incoming) => {
    if (!existing || !incoming || !incoming.articles) return existing || incoming;
    if (!existing.articles || !existing.articles.length) {
      existing.articles = incoming.articles.slice();
      existing.byStem = Object.assign(Object.create(null), incoming.byStem || {});
      if (incoming.baseUrl) existing.baseUrl = incoming.baseUrl;
      return existing;
    }
    if (existing.articles.length === 1 && incoming.articles.length > 1) {
      existing.articles = incoming.articles.slice();
      existing.byStem = Object.assign(Object.create(null), incoming.byStem || {});
      if (incoming.baseUrl) existing.baseUrl = incoming.baseUrl;
      return existing;
    }
    incoming.articles.forEach((article) => {
      const prev = existing.byStem[article.stem];
      if (!prev || (prev.paragraphs || []).length < (article.paragraphs || []).length) {
        existing.byStem[article.stem] = article;
        if (!prev) existing.articles.push(article);
        else {
          const idx = existing.articles.findIndex((row) => row.stem === article.stem);
          if (idx >= 0) existing.articles[idx] = article;
        }
      }
    });
    if (incoming.baseUrl && !existing.baseUrl) existing.baseUrl = incoming.baseUrl;
    return existing;
  };

  const cacheSeed = (payload, api) => {
    const data = payload || {};
    const html = String(data.html || "");
    if (!html) return false;
    const parsed = parseArticlesFromHtml("<div>" + html + "</div>");
    if (!parsed.articles.length) return false;
    const fromApi = api && api.fromLang;
    const lang = String(data.from || fromApi || "")
      .toLowerCase()
      .slice(0, 2);
    const code = LANG_META[lang] ? lang : fromApi || "en";
    parsed.baseUrl = data.baseUrl || parsed.baseUrl;
    seedCache[code] = seedCache[code] ? mergePack(seedCache[code], parsed) : parsed;
    // Keep the one-article parent seed out of the live catalog. Boot fetch
    // supplies the full list; seed is a fallback when that fetch fails.
    return true;
  };

  const loadLangPack = async (lang) => {
    let lastErr = "";
    const urls = pageUrlsFor(lang);
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        const res = await fetch(url, { cache: "no-cache", credentials: "same-origin" });
        if (!res.ok) {
          lastErr = "HTTP " + res.status + " for " + url;
          continue;
        }
        const html = await res.text();
        const parsed = parseArticlesFromHtml(html);
        if (!parsed.articles.length) {
          lastErr = "no articles in " + url;
          continue;
        }
        parsed.baseUrl = url;
        return parsed;
      } catch (err) {
        lastErr = String((err && err.message) || err || "error");
      }
    }
    if (seedCache[lang] && seedCache[lang].articles && seedCache[lang].articles.length) {
      return seedCache[lang];
    }
    throw new Error(lastErr || "no pack for " + lang);
  };

  const resolveUrl = (base, relative) => {
    if (!relative) return "";
    try {
      return new URL(relative, base).href;
    } catch (_) {
      return relative;
    }
  };

  const findArticle = (pack, stem) => {
    if (!pack || !pack.byStem) return null;
    if (pack.byStem[stem]) return pack.byStem[stem];
    const lower = String(stem || "").toLowerCase();
    if (pack.byStem[lower]) return pack.byStem[lower];
    const keys = Object.keys(pack.byStem);
    for (let i = 0; i < keys.length; i++) {
      if (String(keys[i] || "").toLowerCase() === lower) return pack.byStem[keys[i]];
    }
    return null;
  };

  const flattenStems = (pack) => {
    const articles = (pack && pack.articles) || [];
    const out = [];
    const seen = Object.create(null);
    articles.forEach((article) => {
      const stem = article && String(article.stem || "").trim();
      if (!stem || seen[stem]) return;
      seen[stem] = 1;
      out.push(stem);
    });
    return out;
  };

  const renderColumn = (code, ctx) => {
    const article = ctx.state.byLang[code];
    const meta = ctx.LANG_META[code];
    const title = (article && article.title) || "";
    const bodyHtml = ((article && article.paragraphs) || [])
      .map((p) => '<p class="sc-col__text">' + escapeHtml(p) + "</p>")
      .join("");
    const audioLabel = escapeHtml(tUi("story_audio_label", "Audio"));
    const listenTip = escapeHtml(tUi("listen", "Listen"));
    const stopTip = escapeHtml(tUi("stop", "Stop"));
    const audioEnabled = window.__BIRINCI_AUDIO_CONTROLS_ENABLED__ === true;
    const disabledAttrs = audioEnabled ? "" : ' disabled aria-disabled="true"';
    const audioHtml = !article
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
      "</div>" +
      "</article>"
    );
  };

  const columnSpeakText = (code, ctx) => {
    const article = ctx.state.byLang[code];
    if (!article) return "";
    return [article.title || "", ...(article.paragraphs || [])]
      .map((p) => String(p || "").trim())
      .filter(Boolean)
      .join(". ");
  };

  const audioUrl = (code, ctx) => {
    const article = ctx.state.byLang[code];
    const pack = ctx.state.catalogs[code];
    const audioPath = article && article.audioPath;
    if (!audioPath || !pack) return "";
    return resolveUrl(pack.baseUrl, audioPath);
  };

  window.__birinciBootCompareWindow({
    scriptName: "discovery-compare.js",
    showContentViews: false,
    pagerLabelKey: "articles_nav",
    pagerLabelFallback: "Articles",
    loadLang: loadLangPack,
    findItem: findArticle,
    flattenStems,
    mergeCatalog: mergePack,
    renderColumn,
    columnSpeakText,
    audioUrl,
    receiveSeed: cacheSeed,
    logLoadFailure: (info) => {
      try {
        console.error("discovery-compare catalog load failed", info);
      } catch (_) {}
    },
  });
})();
