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

  const foldAzI = (s) => String(s || "").replace(/[İIı]/g, "i");
  const classifyParagraphs = (paragraphs, storyStem, lang) => {
    const list = Array.isArray(paragraphs) ? paragraphs.map((p) => String(p || "")) : [];
    if (!list.length) return { body: [], moral: "", source: "" };
    const last = list.length - 1;
    const srcRe =
      /(internet|открыт\w*\s+источник|интернет|(?:source|quelle|quellen|mənbə|kaynak|источник|булак|булагы)\s*:)/i;
    const moralRe = /^(ibrət|ibret|nəticə|moral|lesson|(?:die\s+)?lehre|мораль|урок|үлгү|сабак)\s*:/i;
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
    const stamp = "?v=20261110auditfixes";
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
    if (window.__BIRINCI_AUDIO_CONTROLS_ENABLED__ !== true) return "";
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
      ? '<p class="sc-col__moral story__moral" style="white-space: pre-line">' + escapeHtml(parts.moral.replace(/^\s*(?:[İiIı]brət|ibret|nəticə|moral|lesson|(?:die\s+)?lehre|мораль|урок|үлгү|сабак)\s*:\s*/i, "")) + "</p>"
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
    const illustW = String(story.imageWidth || 1530);
    const illustH = String(story.imageHeight || 1200);
    const imgSrc = escapeHtml(
      illustrationUrl(code, story && (story.imageStem || story.stem), ctx.assetQuery, story && story.image)
    );
    const imgHtml =
      '<img class="sc-col__image" src="' +
      imgSrc +
      '" srcset="' + escapeHtml(new URL('../../' + code + '/assets/story-previews/' + story.stem + '.webp' + (typeof ctx.assetQuery === 'function' ? ctx.assetQuery() : ctx.assetQuery || ''), window.location.href).href) + ' 960w, ' + imgSrc + ' ' + illustW + 'w" sizes="(max-width: 768px) 90vw, 40vw" alt="' +
      escapeHtml(alt) +
      '" loading="lazy" decoding="async" width="' +
      illustW +
      '" height="' +
      illustH +
      '" onerror="this.closest(\'figure\').hidden=true" />';
    let figureHtml = "";
    if (showImage) {
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
