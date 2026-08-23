window.__BIRINCI_STORY_ICONS__ = {"text": "<svg class=\"tools-bar__glyph\" viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" aria-hidden=\"true\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M7 3h7l5 5v13H7z\"/><path d=\"M14 3v5h5\"/><path d=\"M9 13h6\"/><path d=\"M9 17h6\"/></svg>", "text-off": "<svg class=\"tools-bar__glyph\" viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" aria-hidden=\"true\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M7 3h7l5 5v13H7z\"/><path d=\"M14 3v5h5\"/><path d=\"M9 13h6\"/><path d=\"M9 17h6\"/><path d=\"M5 5l14 14\"/></svg>", "eye": "<svg class=\"tools-bar__glyph\" viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" aria-hidden=\"true\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></svg>", "eye-off": "<svg class=\"tools-bar__glyph\" viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" aria-hidden=\"true\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 3l18 18\"/><path d=\"M10.6 10.6a3 3 0 0 0 4.2 4.2\"/><path d=\"M9.9 5.1A11 11 0 0 1 12 5c6.5 0 10 7 10 7a19 19 0 0 1-3.2 4.1\"/><path d=\"M6.1 6.1C3.6 7.8 2 12 2 12s3.5 7 10 7c1.6 0 3.1-.3 4.4-.9\"/></svg>", "listen": "<svg class=\"tools-bar__glyph\" viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" aria-hidden=\"true\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polygon points=\"11 5 6 9 2 9 2 15 6 15 11 19 11 5\"/><path d=\"M15.54 8.46a5 5 0 0 1 0 7.07\"/><path d=\"M19.07 4.93a10 10 0 0 1 0 14.14\"/></svg>", "stop": "<svg class=\"tools-bar__glyph\" viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" aria-hidden=\"true\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polygon points=\"11 5 6 9 2 9 2 15 6 15 11 19 11 5\"/><path d=\"M15.54 8.46a5 5 0 0 1 0 7.07\"/><path d=\"M19.07 4.93a10 10 0 0 1 0 14.14\"/><path d=\"M3 3l18 18\"/></svg>"};

(() => {
  const I18N = window.__BIRINCI_I18N__ || { lang: "az", ui: {}, js: {} };
  const LOCALE_TAG = I18N.lang || document.documentElement.lang || "az";
  const SHOW_AUDIO_CONTROLS = I18N.show_audio_controls !== false;

  const hideAudioChrome = (root = document) => {
    if (SHOW_AUDIO_CONTROLS) return;
    (root || document).querySelectorAll("[data-story-tts], [data-tools-play-visible], [data-story-tts-note], .story-tts__note").forEach((el) => {
      const group = el.closest(".story__action-group, .tools-bar__field, .text-lightbox__tts");
      if (group) group.hidden = true;
      else el.hidden = true;
    });
  };
  const liveI18n = () => window.__BIRINCI_I18N__ || I18N;
  const tUi = (key, fallback) => {
    const ui = liveI18n().ui || {};
    return ui[key] || fallback || key;
  };
  const tJs = (key, fallback) => {
    const pack = liveI18n().js || {};
    return pack[key] || fallback || key;
  };

  const prefersReducedMotion = () => {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (_) {
      return false;
    }
  };

  /** Same-document UI updates (cards↔list, etc.). Cross-page uses CSS @view-transition. */
  const runViewTransition = (update) => {
    if (typeof update !== "function") return;
    if (prefersReducedMotion() || typeof document.startViewTransition !== "function") {
      update();
      return null;
    }
    try {
      return document.startViewTransition(() => {
        update();
      });
    } catch (_) {
      update();
      return null;
    }
  };

  const syncSearchFilterUi = (q, total) => {
    const wrap = document.querySelector(".tools-bar__search");
    if (!wrap) return;
    const chip = wrap.querySelector("[data-search-filter]");
    const textEl = wrap.querySelector("[data-search-filter-text]");
    const raw = String(q || "").trim();
    const active = raw.length > 0;
    wrap.classList.toggle("tools-bar__search--active", active);
    if (!chip) return;
    if (!active) {
      chip.hidden = true;
      if (textEl) textEl.textContent = "";
      return;
    }
    chip.hidden = false;
    if (textEl) {
      const label = tUi("search_filter_label", "Axtarış");
      const count = tUi("search_results_count", "{n} nəticə").replace(/\{n\}/g, String(total));
      textEl.textContent = `${label}: ${raw} · ${count}`;
    }
  };

  const SEARCH_HIT_CLASS = "search-hit";
  const SEARCH_HIT_SELECTOR = `mark.${SEARCH_HIT_CLASS}`;

  const clearSearchHighlights = (root) => {
    const scope = root || document;
    if (!scope || !scope.querySelectorAll) return;
    scope.querySelectorAll(SEARCH_HIT_SELECTOR).forEach((mark) => {
      const parent = mark.parentNode;
      if (!parent) return;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      try {
        parent.normalize();
      } catch (_) {}
    });
  };

  /** Word-style yellow marks for the current search string (case-insensitive). */
  const applySearchHighlights = (root, query, { locale } = {}) => {
    if (!root || !root.querySelectorAll) return;
    clearSearchHighlights(root);
    const raw = String(query || "").trim();
    if (!raw) return;
    const tag = locale || LOCALE_TAG || "az";
    const needle = raw.toLocaleLowerCase(tag);
    if (!needle) return;

    const skipClosest =
      "script, style, noscript, textarea, input, select, button, option, " +
      SEARCH_HIT_SELECTOR +
      ", .tools-bar, .lang-switcher, .visually-hidden, .sr-only, " +
      "[data-tools-search], #sitemap-search-input, #global-search-input, #inventionsSearch";

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !/\S/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        const el = node.parentElement;
        if (!el) return NodeFilter.FILTER_REJECT;
        if (el.closest(skipClosest)) return NodeFilter.FILTER_REJECT;
        if (el.closest("[hidden], .is-hidden")) return NodeFilter.FILTER_REJECT;
        if (el.closest(".inventions-category.is-collapsed")) {
          const entry = el.closest(".inventions-entry");
          if (entry) return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach((textNode) => {
      const text = textNode.nodeValue;
      const lower = text.toLocaleLowerCase(tag);
      let from = 0;
      let at = lower.indexOf(needle, from);
      if (at < 0) return;

      const frag = document.createDocumentFragment();
      while (at >= 0) {
        if (at > from) frag.appendChild(document.createTextNode(text.slice(from, at)));
        const mark = document.createElement("mark");
        mark.className = SEARCH_HIT_CLASS;
        mark.textContent = text.slice(at, at + needle.length);
        frag.appendChild(mark);
        from = at + needle.length;
        at = lower.indexOf(needle, from);
      }
      if (from < text.length) frag.appendChild(document.createTextNode(text.slice(from)));
      if (textNode.parentNode) textNode.parentNode.replaceChild(frag, textNode);
    });
  };

  window.__birinciClearSearchHighlights = clearSearchHighlights;
  window.__birinciApplySearchHighlights = applySearchHighlights;

  const isAzStoryLexiconPage = () => {
    const body = document.body;
    if (!body) return false;
    return body.classList.contains("page-category") || body.classList.contains("page-home");
  };

  const refreshAzLexicon = (root) => {
    if (typeof window.__birinciRefreshAzLexicon !== "function") return;
    if (!isAzStoryLexiconPage()) return;
    try {
      window.__birinciRefreshAzLexicon(root || null);
    } catch (_) {}
  };

  const paintSearchAndLexicon = (root, query) => {
    refreshAzLexicon(root);
    applySearchHighlights(root, query);
  };

  const initAzLexicon = () => {
    const lang = String(
      document.documentElement.lang || document.body.getAttribute("data-lang") || ""
    ).toLowerCase();
    if (lang !== "az") return;
    // Sticky-note underlines on AZ wisdom-story home + category pages only.
    if (!isAzStoryLexiconPage()) return;

    const siteScript = document.querySelector('script[src*="site.js"]');
    if (!siteScript || !siteScript.src) return;
    const assetsBase = siteScript.src.replace(/site\.js(?:\?[^#]*)?(?:#.*)?$/i, "");
    const stamp = "20260823j";

    const loadScript = (src, marker) =>
      new Promise((resolve, reject) => {
        if (document.querySelector(`script[data-az-lex="${marker}"]`)) {
          resolve();
          return;
        }
        const s = document.createElement("script");
        s.src = `${assetsBase}${src}?v=${stamp}`;
        s.async = false;
        s.dataset.azLex = marker;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("lexicon-load-failed:" + src));
        document.head.appendChild(s);
      });

    loadScript("lexicon/popup-data.js", "data")
      .then(() => loadScript("lexicon/az-lexicon-ui.js", "ui"))
      .then(() => {
        if (typeof window.__birinciBootAzLexicon !== "function") {
          throw new Error("lexicon-boot-missing");
        }
        return window.__birinciBootAzLexicon();
      })
      .then(() => {
        const input = document.querySelector("[data-tools-search]");
        const q = input ? String(input.value || "") : "";
        const root =
          document.querySelector(".story-list") ||
          document.querySelector("[data-stories-list]") ||
          document.querySelector(".category-main") ||
          document.querySelector("main") ||
          document.body;
        paintSearchAndLexicon(root, q);
      })
      .catch((err) => {
        console.error("Az lexicon failed to load", err);
        document.documentElement.setAttribute("data-az-lexicon", "error");
      });
  };

  const bindSearchFilterClear = (searchInput) => {
    const wrap = searchInput && searchInput.closest(".tools-bar__search");
    const btn = wrap && wrap.querySelector("[data-search-filter-clear]");
    if (!btn || !searchInput || btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", () => {
      searchInput.value = "";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      searchInput.focus();
    });
  };
  const STORY_ICONS = window.__BIRINCI_STORY_ICONS__ || {
    text: "",
    "text-off": "",
    eye: "",
    "eye-off": "",
    listen: "",
    stop: "",
  };
  const setStoryModePressed = (root, attr, visible) => {
    if (!root) return;
    root.querySelectorAll("[" + attr + "]").forEach((btn) => {
      const mode = btn.getAttribute(attr);
      const pressed = visible ? mode === "show" : mode === "hide";
      btn.setAttribute("aria-pressed", pressed ? "true" : "false");
    });
  };

  const initLangSwitcher = () => {
    const root = document.querySelector(".lang-switcher");
    const toggle = root && root.querySelector(".lang-switcher__toggle");
    const menu = root && root.querySelector(".lang-switcher__menu");
    if (!root || !toggle || !menu) return;

    const supportsPopover = typeof menu.showPopover === "function";
    if (supportsPopover && menu.getAttribute("popover") !== "manual") {
      menu.setAttribute("popover", "manual");
    }
    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
    const canHoverLang = () => finePointerQuery.matches && !coarsePointerQuery.matches;
    let hideTimer = 0;
    let ignoreOutside = false;
    let outsideBound = false;

    const isPopoverOpen = () => supportsPopover && menu.matches(":popover-open");
    const isOpen = () => root.classList.contains("is-open") || isPopoverOpen();

    const decodeHash = () => {
      try {
        return decodeURIComponent((window.location.hash || "").replace(/^#/, ""));
      } catch (_) {
        return (window.location.hash || "").replace(/^#/, "");
      }
    };

    const resolveActiveAnchor = () => {
      const hash = decodeHash();
      if (hash && hash !== "top" && hash !== "main" && document.getElementById(hash)) {
        return hash;
      }
      const activeLink =
        document.querySelector(".timeline-list a.tl-active[href^='#']") ||
        document.querySelector(".story-nav a.tl-active[href^='#']") ||
        document.querySelector(".story-nav a.is-active[href^='#']");
      if (activeLink) {
        const id = (activeLink.getAttribute("href") || "").replace(/^#/, "");
        if (id && document.getElementById(id)) return id;
      }
      if (typeof window.__birinciInventionsContext === "function") {
        try {
          const inv = window.__birinciInventionsContext();
          if (inv && inv.sectionId && document.getElementById(inv.sectionId)) {
            return inv.sectionId;
          }
        } catch (_) {}
      }
      const story = document.querySelector("article.story:not([hidden])");
      if (story && story.id && story.getBoundingClientRect().top < window.innerHeight) {
        const mid = window.scrollY + window.innerHeight * 0.35;
        const stories = Array.from(document.querySelectorAll("article.story[id]"));
        let best = "";
        for (let i = stories.length - 1; i >= 0; i -= 1) {
          const top = stories[i].getBoundingClientRect().top + window.scrollY;
          if (top <= mid) {
            best = stories[i].id;
            break;
          }
        }
        if (best) return best;
      }
      return "";
    };

    const resolveCategoryFallback = (stem) => {
      if (!stem) return "";
      const el = document.getElementById(stem);
      if (el) {
        const cat = el.closest(".inventions-category");
        if (cat && cat.id) return cat.id;
      }
      const toc = document.querySelector(`.inventions-toc-entry[data-toc-entry="${stem}"]`);
      return (toc && toc.getAttribute("data-toc-cat")) || "";
    };

    const browseContext = () => {
      const params = new URLSearchParams(window.location.search || "");
      const searchInput =
        document.querySelector("[data-tools-search]") ||
        document.getElementById("inventionsSearch");
      const typedQ = searchInput ? String(searchInput.value || "").trim() : "";
      const q = typedQ || String(params.get("q") || "").trim();
      const isCategory = document.body.classList.contains("page-category");
      const isHome = document.body.classList.contains("page-home");
      const isInventions =
        document.body.classList.contains("page-inventions") ||
        document.body.classList.contains("inventions-preview-page");
      const langPage = String(document.body.getAttribute("data-lang-page") || "").replace(/^\/+/, "");
      const catMatch = (window.location.pathname || "").match(/\/categories\/([^/]+)\.html$/i);
      let view = params.get("view");
      if (isHome) {
        const stemProbe = resolveActiveAnchor() || decodeHash();
        if (stemProbe) view = "list";
        else if (view !== "list" && view !== "cards") {
          if (window.__birinciHomeView === "list" || window.__birinciHomeView === "cards") {
            view = window.__birinciHomeView;
          }
        }
      }

      let cat = String(params.get("cat") || "").trim();
      let period = String(params.get("period") || "").trim();
      let sort = String(params.get("sort") || "").trim();
      let start = String(params.get("start") || "").trim();
      let batch = String(params.get("batch") || "").trim();
      let tocCollapsed = [];

      if (isInventions && typeof window.__birinciInventionsContext === "function") {
        try {
          const inv = window.__birinciInventionsContext();
          if (inv) {
            if (Array.isArray(inv.cat) && inv.cat.length) cat = inv.cat.join(",");
            if (Array.isArray(inv.period) && inv.period.length) period = inv.period.join(",");
            if (inv.q) {
              /* prefer live search box already in q */
            }
            if (Array.isArray(inv.tocCollapsed)) tocCollapsed = inv.tocCollapsed.slice();
          }
        } catch (_) {}
      }

      if (!start && window.__birinciListStart != null) {
        start = String(window.__birinciListStart);
      }
      if (!batch) {
        const batchInput = document.querySelector("[data-home-batch-size]");
        if (batchInput && batchInput.value) batch = String(batchInput.value).trim();
      }

      const stem = resolveActiveAnchor() || decodeHash();
      const categoryId = resolveCategoryFallback(stem);
      const maxScroll = Math.max(
        0,
        (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight
      );
      const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      const scrollRatio = maxScroll > 0 ? Math.max(0, Math.min(1, scrollY / maxScroll)) : 0;

      return {
        isCategory,
        isHome,
        isInventions,
        langPage,
        slug: catMatch ? catMatch[1] : "",
        view: view === "list" ? "list" : view === "cards" ? "cards" : "",
        q,
        cat,
        period,
        sort,
        start,
        batch,
        stem,
        categoryId,
        tocCollapsed,
        scrollY,
        scrollRatio,
      };
    };

    const hrefForLang = (code, ctx) => {
      let path = `../${code}/index.html`;
      if (ctx.isCategory && ctx.slug) {
        path = `../../${code}/categories/${encodeURIComponent(ctx.slug)}.html`;
      } else if (ctx.langPage) {
        const depth = ctx.langPage.split("/").filter(Boolean).length;
        path = `${"../".repeat(depth)}${code}/${ctx.langPage}`;
      } else if (ctx.isHome) {
        path = `../${code}/index.html`;
      }

      const params = new URLSearchParams();
      if (ctx.isHome && (ctx.view === "list" || ctx.stem)) {
        params.set("view", "list");
      } else if (ctx.view === "list" || ctx.view === "cards") {
        params.set("view", ctx.view);
      }
      if (ctx.q) params.set("q", ctx.q);
      if (ctx.cat) params.set("cat", ctx.cat);
      if (ctx.period) params.set("period", ctx.period);
      if (ctx.sort) params.set("sort", ctx.sort);
      if (ctx.start && Number(ctx.start) > 0) params.set("start", String(ctx.start));
      if (ctx.batch && Number(ctx.batch) > 0) params.set("batch", String(ctx.batch));

      const qs = params.toString();
      let hash = "";
      if (ctx.stem) hash = `#${encodeURIComponent(ctx.stem).replace(/%2F/gi, "/")}`;
      else if (ctx.categoryId) hash = `#${encodeURIComponent(ctx.categoryId).replace(/%2F/gi, "/")}`;
      return `${path}${qs ? `?${qs}` : ""}${hash}`;
    };

    const stashLangContext = (ctx) => {
      try {
        sessionStorage.setItem(
          "birinci-lang-ctx",
          JSON.stringify({
            sectionId: ctx.stem || "",
            categoryId: ctx.categoryId || "",
            scrollY: ctx.scrollY || 0,
            scrollRatio: ctx.scrollRatio || 0,
            tocCollapsed: ctx.tocCollapsed || [],
            q: ctx.q || "",
            cat: ctx.cat || "",
            period: ctx.period || "",
            view: ctx.view || "",
            start: ctx.start || "",
            batch: ctx.batch || "",
            sort: ctx.sort || "",
            ts: Date.now(),
          })
        );
      } catch (_) {}
    };

    const syncLangHrefs = () => {
      const ctx = browseContext();
      root.querySelectorAll("a[data-lang]").forEach((link) => {
        const code = link.getAttribute("data-lang");
        if (!code) return;
        link.setAttribute("href", hrefForLang(code, ctx));
      });
    };

    const placeMenu = () => {
      const rect = toggle.getBoundingClientRect();
      const gap = 6;
      const top = Math.round(rect.bottom + gap);
      const right = Math.round(Math.max(8, window.innerWidth - rect.right));
      menu.style.position = "fixed";
      menu.style.inset = "auto";
      menu.style.margin = "0";
      menu.style.top = `${top}px`;
      menu.style.right = `${right}px`;
      menu.style.left = "auto";
      menu.style.bottom = "auto";
    };

    const onOutsidePointer = (event) => {
      if (ignoreOutside || !isOpen()) return;
      const target = event.target;
      if (root.contains(target) || menu.contains(target)) return;
      closeMenu();
    };

    const bindOutside = () => {
      if (outsideBound) return;
      outsideBound = true;
      document.addEventListener("pointerdown", onOutsidePointer, true);
    };

    const unbindOutside = () => {
      if (!outsideBound) return;
      outsideBound = false;
      document.removeEventListener("pointerdown", onOutsidePointer, true);
    };

    const openMenu = () => {
      window.clearTimeout(hideTimer);
      syncLangHrefs();
      menu.hidden = false;
      placeMenu();
      root.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      if (supportsPopover) {
        try {
          menu.showPopover();
        } catch (_) {}
      }
      ignoreOutside = true;
      window.setTimeout(() => {
        ignoreOutside = false;
        bindOutside();
      }, 0);
    };

    const closeMenu = () => {
      window.clearTimeout(hideTimer);
      root.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      if (supportsPopover) {
        try {
          menu.hidePopover();
        } catch (_) {}
      }
      menu.hidden = true;
      unbindOutside();
    };

    const scheduleClose = () => {
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(closeMenu, 160);
    };

    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (isOpen()) closeMenu();
      else openMenu();
    });

    root.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse" && canHoverLang()) openMenu();
    });
    root.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse" && canHoverLang()) scheduleClose();
    });
    menu.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse" && canHoverLang()) window.clearTimeout(hideTimer);
    });
    menu.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse" && canHoverLang()) scheduleClose();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen()) closeMenu();
    });
    window.addEventListener("resize", () => {
      if (isOpen()) placeMenu();
    }, { passive: true });
    window.addEventListener("scroll", () => {
      if (isOpen()) placeMenu();
    }, { passive: true, capture: true });

    root.addEventListener("click", (event) => {
      const link = event.target.closest("a[data-lang]");
      if (!link) return;
      const ctx = browseContext();
      syncLangHrefs();
      stashLangContext(ctx);
      try {
        localStorage.setItem("birinci-lang", link.getAttribute("data-lang") || "");
      } catch (_) {}
    });

    syncLangHrefs();
    window.addEventListener("hashchange", syncLangHrefs);
    window.addEventListener("popstate", syncLangHrefs);
    document.addEventListener("kt-catalog-filter-change", syncLangHrefs);
    const inventionsSearch = document.getElementById("inventionsSearch");
    if (inventionsSearch) {
      inventionsSearch.addEventListener("input", syncLangHrefs);
    }
    document.querySelectorAll("[data-tools-search]").forEach((el) => {
      el.addEventListener("input", syncLangHrefs);
    });
  };
  initLangSwitcher();

  // Restore approximate scroll after a language switch when no exact hash target applied.
  (function restoreGenericLangScroll() {
    if (document.body.classList.contains("page-inventions")) return;
    let raw = "";
    try {
      raw = sessionStorage.getItem("birinci-lang-ctx") || "";
    } catch (_) {
      return;
    }
    if (!raw) return;
    let ctx = null;
    try {
      ctx = JSON.parse(raw);
    } catch (_) {
      return;
    }
    const hash = (window.location.hash || "").replace(/^#/, "");
    if (hash && document.getElementById(decodeURIComponent(hash))) {
      // Hash navigation handles focus; keep ctx for inventions-only fields already consumed there.
      try {
        sessionStorage.removeItem("birinci-lang-ctx");
      } catch (_) {}
      return;
    }
    try {
      sessionStorage.removeItem("birinci-lang-ctx");
    } catch (_) {}
    if (!ctx || typeof ctx.scrollRatio !== "number" || !isFinite(ctx.scrollRatio)) return;
    const apply = () => {
      const root = document.documentElement;
      const max = Math.max(0, (root.scrollHeight || document.body.scrollHeight) - window.innerHeight);
      const y = Math.round(Math.max(0, Math.min(1, ctx.scrollRatio)) * max);
      window.scrollTo({ top: y, left: 0, behavior: "auto" });
    };
    window.requestAnimationFrame(() => window.requestAnimationFrame(apply));
  })();

  const header = document.querySelector(".site-header");
  const dropdowns = Array.from(document.querySelectorAll(".nav-dropdown"));
  const navToggle = document.getElementById("nav-toggle");
  const mobileNavQuery = window.matchMedia("(max-width: 1400px)");
  const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  const canHoverNav = () => finePointerQuery.matches && !mobileNavQuery.matches;

  const syncStickyChrome = () => {
    const root = document.documentElement;
    if (header) {
      root.style.setProperty("--header-h", `${Math.ceil(header.getBoundingClientRect().height)}px`);
    }
    const crumbs = document.querySelector(".breadcrumbs");
    if (crumbs) {
      root.style.setProperty("--breadcrumb-h", `${Math.ceil(crumbs.getBoundingClientRect().height)}px`);
    }
  };

  /**
   * Append the active story / discovery article to the sticky breadcrumb trail.
   * Base crumbs stay page-level in HTML; deep segment is managed here.
   * Story trails always keep the Wisdom Stories section crumb:
   * Home > Wisdom Stories > [Category?] > Story
   */
  const initDeepBreadcrumbs = () => {
    const list = document.querySelector(".breadcrumbs__list");
    if (!list) return;

    const pageHref = `${window.location.pathname}${window.location.search || ""}`;
    let lastDeepId = null;

    const escapeHtml = (value) =>
      String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const titleForEl = (el) => {
      if (!el) return "";
      const dataTitle = el.getAttribute("data-title");
      if (dataTitle && dataTitle.trim()) return dataTitle.trim();
      const name = el.querySelector(".inventions-entry-name");
      if (name && name.textContent.trim()) return name.textContent.trim();
      const catHead = el.querySelector(".inventions-category-head");
      if (catHead && catHead.textContent.trim()) return catHead.textContent.trim();
      const heading = el.querySelector("h1, h2, .story__title, .story-title");
      if (heading && heading.textContent.trim()) return heading.textContent.trim();
      return (el.id || "").replace(/[-_]+/g, " ").trim();
    };

    const storiesSectionLabel = () => {
      const navLabel = document.querySelector(
        "[data-nav-stories-all] span:not(.menu-icon), .nav-dropdown--literature .nav-dropdown__summary > span:not(.menu-icon)"
      );
      if (navLabel && navLabel.textContent.trim()) return navLabel.textContent.trim();
      const lang =
        (document.body && document.body.getAttribute("data-lang")) ||
        document.documentElement.lang ||
        "en";
      const labels = {
        az: "İbrətamiz hekayələr",
        en: "Wisdom stories",
        ru: "Нравоучительные рассказы",
        ky: "Үлгүлүү аңгемелер",
      };
      return labels[lang] || labels.en;
    };

    const storiesSectionHref = () => {
      const nav = document.querySelector("[data-nav-stories-all]");
      const href = nav && nav.getAttribute("href");
      if (href) return href;
      const existing = list.querySelector('a[href*="#kateqoriyalar"]');
      if (existing) return existing.getAttribute("href");
      const inCategory = /\/categories\//.test(window.location.pathname || "");
      return inCategory ? "../index.html?view=list" : "index.html?view=list";
    };

    const baseCrumbItems = () =>
      Array.from(list.querySelectorAll(".breadcrumbs__item:not([data-deep-crumb])"));

    const isStoriesSectionItem = (item) => {
      if (!item) return false;
      if (item.hasAttribute("data-stories-crumb")) return true;
      const a = item.querySelector("a");
      if (!a) return false;
      const href = a.getAttribute("href") || "";
      // Home often becomes ?view=list after demote — never treat the first crumb as the section.
      const items = baseCrumbItems();
      if (items[0] === item) return false;
      return (
        href.includes("#kateqoriyalar") ||
        href.includes("view=list") ||
        href.includes("view=cards")
      );
    };

    const hasStoriesSectionCrumb = () => baseCrumbItems().some(isStoriesSectionItem);

    const ensureStoriesSectionCrumb = () => {
      if (hasStoriesSectionCrumb()) return;
      const items = baseCrumbItems();
      const li = document.createElement("li");
      li.className = "breadcrumbs__item";
      li.setAttribute("data-stories-crumb", "1");
      li.innerHTML = `<a href="${escapeHtml(storiesSectionHref())}">${escapeHtml(
        storiesSectionLabel()
      )}</a>`;
      const home = items[0];
      if (home && home.nextSibling) list.insertBefore(li, home.nextSibling);
      else if (home) home.after(li);
      else list.appendChild(li);
    };

    const siteRootHref = () => {
      const brand = document.querySelector("a.brand[href]");
      const brandHref = brand && brand.getAttribute("href");
      if (brandHref) return brandHref;
      const path = String(window.location.pathname || "");
      if (/\/(categories|discoveries|about|prominent-figures)\//.test(path)) {
        return "../../index.html";
      }
      if (/\/(az|en|ru|ky)(?:\/|$)/.test(path)) return "../index.html";
      return "index.html";
    };

    const demoteCurrentToLink = () => {
      const current = list.querySelector('.breadcrumbs__item[aria-current="page"]');
      if (!current) return;
      if (current.hasAttribute("data-deep-crumb")) return;
      const labelEl = current.querySelector("span, a");
      const label = (labelEl && labelEl.textContent.trim()) || "";
      if (!label) return;
      const items = baseCrumbItems();
      const href = items[0] === current ? siteRootHref() : pageHref;
      current.removeAttribute("aria-current");
      current.innerHTML = `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
    };

    const fixHomeCrumbHref = () => {
      const first = list.querySelector(".breadcrumbs__item");
      if (!first || first.hasAttribute("data-deep-crumb") || first.hasAttribute("data-stories-crumb")) {
        return;
      }
      const a = first.querySelector("a");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      // Leave Wisdom Stories / section crumbs alone.
      if (/#kateqoriyalar|[?&]view=/.test(href)) return;
      a.setAttribute("href", siteRootHref());
    };

    const restorePageCurrent = () => {
      list.querySelectorAll("[data-stories-crumb]").forEach((el) => el.remove());
      const deep = list.querySelector('[data-deep-crumb="1"]');
      if (deep) deep.remove();
      let pageItem = list.querySelector(".breadcrumbs__item:last-child");
      if (!pageItem) return;
      if (pageItem.querySelector("a") && !pageItem.hasAttribute("aria-current")) {
        const label = pageItem.querySelector("a").textContent.trim();
        pageItem.setAttribute("aria-current", "page");
        pageItem.innerHTML = `<span>${escapeHtml(label)}</span>`;
      }
    };

    const setDeepCrumb = (id, title, kind) => {
      const cleanTitle = String(title || "").trim();
      const cleanId = String(id || "").trim();
      if (!cleanId || !cleanTitle) {
        clearDeepCrumb();
        return;
      }
      if (cleanId === lastDeepId) {
        const existing = list.querySelector('[data-deep-crumb="1"] span');
        if (existing && existing.textContent === cleanTitle) return;
      }
      demoteCurrentToLink();
      if (kind === "story") ensureStoriesSectionCrumb();
      let deep = list.querySelector('[data-deep-crumb="1"]');
      if (!deep) {
        deep = document.createElement("li");
        deep.className = "breadcrumbs__item";
        deep.setAttribute("data-deep-crumb", "1");
        list.appendChild(deep);
      }
      deep.setAttribute("aria-current", "page");
      deep.innerHTML = `<span>${escapeHtml(cleanTitle)}</span>`;
      lastDeepId = cleanId;
      syncStickyChrome();
    };

    const clearDeepCrumb = () => {
      if (
        !lastDeepId &&
        !list.querySelector('[data-deep-crumb="1"]') &&
        !list.querySelector("[data-stories-crumb]")
      ) {
        return;
      }
      lastDeepId = null;
      restorePageCurrent();
      syncStickyChrome();
    };

    const applyFromId = (id) => {
      if (!id) {
        clearDeepCrumb();
        return;
      }
      const el = document.getElementById(id);
      if (
        !el ||
        !(
          el.classList.contains("story") ||
          el.classList.contains("inventions-entry") ||
          el.classList.contains("inventions-category")
        )
      ) {
        clearDeepCrumb();
        return;
      }
      const kind = el.classList.contains("story")
        ? "story"
        : el.classList.contains("inventions-entry")
          ? "invention"
          : "invention-category";
      setDeepCrumb(id, titleForEl(el), kind);
    };

    window.__birinciSetDeepCrumb = (payload) => {
      if (!payload || !payload.id) {
        clearDeepCrumb();
        return;
      }
      const el = document.getElementById(payload.id);
      const title = payload.title || titleForEl(el);
      const kind =
        payload.kind ||
        (el && el.classList.contains("story")
          ? "story"
          : el && el.classList.contains("inventions-entry")
            ? "invention"
            : "invention-category");
      setDeepCrumb(payload.id, title, kind);
    };
    window.__birinciClearDeepCrumb = clearDeepCrumb;

    const syncFromLocation = () => {
      let hash = "";
      try {
        hash = decodeURIComponent((window.location.hash || "").replace(/^#/, ""));
      } catch (_) {
        hash = (window.location.hash || "").replace(/^#/, "");
      }
      if (hash) applyFromId(hash);
      else clearDeepCrumb();
    };

    window.addEventListener("hashchange", syncFromLocation);
    window.addEventListener("popstate", syncFromLocation);
    fixHomeCrumbHref();
    if (window.__birinciPendingDeepCrumb) {
      window.__birinciSetDeepCrumb(window.__birinciPendingDeepCrumb);
      try {
        delete window.__birinciPendingDeepCrumb;
      } catch (_) {
        window.__birinciPendingDeepCrumb = null;
      }
    } else {
      syncFromLocation();
    }
  };
  try {
    initDeepBreadcrumbs();
  } catch (err) {
    console.error("initDeepBreadcrumbs failed", err);
  }
  if (typeof ResizeObserver !== "undefined") {
    const stickyRo = new ResizeObserver(() => syncStickyChrome());
    if (header) stickyRo.observe(header);
    const crumbsEl = document.querySelector(".breadcrumbs");
    if (crumbsEl) stickyRo.observe(crumbsEl);
  }
  window.addEventListener("resize", syncStickyChrome, { passive: true });
  syncStickyChrome();

  const resetMobileNavSections = () => {
    dropdowns.forEach((dropdown) => {
      dropdown.open = false;
      dropdown.classList.remove("is-hover-open");
    });
    document.querySelectorAll(".nav-dropdown--nested.is-mega-open").forEach((group) => {
      group.classList.remove("is-mega-open");
      const btn = group.querySelector("[data-nav-mega-toggle]");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  };

  const closeMobileNav = () => {
    if (!header || !navToggle) return;
    header.classList.remove("is-nav-open");
    document.body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", tUi("open_menu", "Menyunu aç"));
    resetMobileNavSections();
    const y = Number(document.body.dataset.navScrollY || "0");
    document.body.style.top = "";
    delete document.body.dataset.navScrollY;
    window.scrollTo(0, y);
    syncStickyChrome();
  };

  const openMobileNav = () => {
    if (!header || !navToggle || !dropdowns.length) return;
    resetMobileNavSections();
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.dataset.navScrollY = String(y);
    document.body.style.top = `-${y}px`;
    header.classList.add("is-nav-open");
    document.body.classList.add("nav-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", tUi("close_menu", "Menyunu bağla"));
    syncStickyChrome();
  };

  if (navToggle && header && dropdowns.length) {
    navToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      if (header.classList.contains("is-nav-open")) closeMobileNav();
      else openMobileNav();
    });
    mobileNavQuery.addEventListener("change", (event) => {
      if (!event.matches) {
        closeMobileNav();
        dropdowns.forEach((dropdown) => {
          dropdown.open = false;
          dropdown.classList.remove("is-hover-open");
        });
      }
    });
  }

  const nestedGroups = Array.from(
    document.querySelectorAll(".nav-dropdown--nested.nav-dropdown--has-mega")
  );

  const setMegaOpen = (target, open) => {
    const scope = target ? target.closest(".nav-dropdown") : null;
    nestedGroups.forEach((group) => {
      if (scope && !scope.contains(group)) return;
      const shouldOpen = !!open && group === target;
      group.classList.toggle("is-mega-open", shouldOpen);
      const btn = group.querySelector("[data-nav-mega-toggle]");
      if (btn) btn.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
    });
  };

  const closeMegasIn = (dropdown) => {
    if (!dropdown) return;
    nestedGroups.forEach((group) => {
      if (!dropdown.contains(group)) return;
      group.classList.remove("is-mega-open");
      const btn = group.querySelector("[data-nav-mega-toggle]");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  };

  const setDropdownOpen = (dropdown, open) => {
    if (!dropdown) return;
    dropdown.open = !!open;
    dropdown.classList.toggle("is-hover-open", !!open);
    if (!open) closeMegasIn(dropdown);
  };

  const closeAllDropdowns = () => {
    dropdowns.forEach((dropdown) => setDropdownOpen(dropdown, false));
  };

  nestedGroups.forEach((group) => {
    const megaToggle = group.querySelector("[data-nav-mega-toggle]");
    if (megaToggle) {
      megaToggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const next = !group.classList.contains("is-mega-open");
        setMegaOpen(group, next);
      });
    }
    group.addEventListener("mouseenter", () => {
      if (canHoverNav()) setMegaOpen(group, true);
    });
    group.addEventListener("mouseleave", () => {
      if (canHoverNav()) setMegaOpen(group, false);
    });
  });

  dropdowns.forEach((dropdown) => {
    dropdown.addEventListener("mouseenter", () => {
      if (!canHoverNav()) return;
      dropdowns.forEach((other) => {
        if (other !== dropdown) setDropdownOpen(other, false);
      });
      setDropdownOpen(dropdown, true);
    });
    dropdown.addEventListener("mouseleave", () => {
      if (canHoverNav()) setDropdownOpen(dropdown, false);
    });
    dropdown.addEventListener("toggle", () => {
      if (!dropdown.open) {
        dropdown.classList.remove("is-hover-open");
        closeMegasIn(dropdown);
        return;
      }
      if (mobileNavQuery.matches) {
        dropdowns.forEach((other) => {
          if (other !== dropdown) setDropdownOpen(other, false);
        });
      }
    });
    dropdown.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (link.getAttribute("aria-disabled") === "true") {
          event.preventDefault();
          return;
        }
        setDropdownOpen(dropdown, false);
        closeMobileNav();
      });
    });
  });

  if (dropdowns.length) {
    document.addEventListener("click", (event) => {
      if (mobileNavQuery.matches) {
        if (!header || !header.classList.contains("is-nav-open")) return;
        if (header.contains(event.target)) return;
        closeMobileNav();
        return;
      }
      const inside = dropdowns.some((dropdown) => dropdown.contains(event.target));
      if (!inside) closeAllDropdowns();
    });
    document.querySelectorAll(".primary-nav__link").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (link.getAttribute("aria-disabled") === "true") {
          event.preventDefault();
        }
        closeMobileNav();
      });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      closeAllDropdowns();
      closeMobileNav();
    });
  }

  const markCurrentPrimaryNav = () => {
    const nav = document.getElementById("primaryNav") || document.querySelector(".primary-nav");
    if (!nav) return;
    const body = document.body;
    const path = (window.location.pathname || "").replace(/\\/g, "/").toLowerCase();
    const pageHint = (body.getAttribute("data-lang-page") || "").replace(/\\/g, "/").toLowerCase();
    const fileOf = (value) => {
      const clean = String(value || "").split("?")[0].split("#")[0];
      const parts = clean.split("/").filter(Boolean);
      return parts.length ? parts[parts.length - 1] : "";
    };
    const isRootHome = body.classList.contains("page-root-home");
    const isSitemap =
      body.classList.contains("page-sitemap") ||
      pageHint === "sitemap.html" ||
      /\/sitemap\.html$/.test(path);
    const isAbout =
      body.classList.contains("page-about") ||
      pageHint.startsWith("about/") ||
      /\/about\//.test(path);
    const isDiscoveries =
      body.classList.contains("page-inventions") ||
      pageHint.startsWith("discoveries/") ||
      /\/discoveries\//.test(path);
    const isStories =
      !isRootHome &&
      !isSitemap &&
      !isAbout &&
      !isDiscoveries &&
      (body.classList.contains("page-home") ||
        body.classList.contains("page-category") ||
        pageHint.startsWith("categories/") ||
        /\/categories\//.test(path) ||
        /\/(az|en|ru|ky)\/(index\.html)?$/.test(path));

    nav.querySelectorAll(".primary-nav__link").forEach((link) => {
      link.classList.remove("is-active", "is-current");
      link.removeAttribute("aria-current");
    });
    nav.querySelectorAll(".nav-dropdown").forEach((dropdown) => {
      dropdown.classList.remove("is-current");
    });
    nav.querySelectorAll(".nav-dropdown-link").forEach((link) => {
      link.classList.remove("is-active");
      link.removeAttribute("aria-current");
    });

    const setLinkCurrent = (link) => {
      if (!link) return;
      link.classList.add("is-current", "is-active");
      link.setAttribute("aria-current", "page");
    };

    if (isSitemap) {
      setLinkCurrent(nav.querySelector("[data-nav-sitemap]"));
      return;
    }
    if (isDiscoveries) {
      const disc = Array.from(nav.querySelectorAll(".primary-nav__link")).find((link) =>
        (link.getAttribute("href") || "").includes("discoveries")
      );
      setLinkCurrent(disc);
      return;
    }
    if (isAbout) {
      const about = nav.querySelector(".nav-dropdown--about");
      if (!about) return;
      about.classList.add("is-current");
      const currentFile = fileOf(pageHint) || fileOf(path);
      about.querySelectorAll(".nav-dropdown-link").forEach((link) => {
        const match = fileOf(link.getAttribute("href")) === currentFile;
        link.classList.toggle("is-active", match);
        if (match) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
      return;
    }
    if (isStories) {
      setLinkCurrent(nav.querySelector("[data-nav-stories-all]"));
    }
  };
  markCurrentPrimaryNav();

  const backToTop = document.getElementById("back-to-top");
  if (backToTop) {
    backToTop.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const html = document.documentElement;
      html.classList.add("no-smooth-scroll");
      html.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      window.scrollTo(0, 0);
      history.replaceState(null, "", window.location.pathname + window.location.search);
      requestAnimationFrame(() => {
        html.classList.remove("no-smooth-scroll");
      });
    });
  }


  const goToBottom = document.getElementById("go-to-bottom");
  if (goToBottom) {
    goToBottom.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const html = document.documentElement;
      const footer = document.getElementById("site-footer") || document.querySelector("footer.footer-pro, footer");
      html.classList.add("no-smooth-scroll");
      if (footer) {
        const top = Math.round(footer.getBoundingClientRect().top + window.pageYOffset);
        html.scrollTop = top;
        if (document.body) document.body.scrollTop = top;
        window.scrollTo(0, top);
      } else {
        const max = Math.max(html.scrollHeight, document.body ? document.body.scrollHeight : 0);
        window.scrollTo(0, max);
      }
      history.replaceState(null, "", window.location.pathname + window.location.search);
      requestAnimationFrame(() => {
        html.classList.remove("no-smooth-scroll");
      });
    });
  }

  const initGlobalSearch = () => {
    const root = document.getElementById("global-search");
    const toggle = document.getElementById("global-search-toggle");
    const input = document.getElementById("global-search-input");
    const results = document.getElementById("global-search-results");
    const status = document.getElementById("global-search-status");
    if (!root || !toggle || !input || !results) return;

    let index = null;
    let loading = null;
    let lastQuery = "";
    let loadedUrl = "";

    const searchLang = () =>
      (window.__BIRINCI_I18N__ && window.__BIRINCI_I18N__.lang) || LOCALE_TAG || "az";
    const currentSearchUrl = () => root.getAttribute("data-search-index") || "";
    const countStatus = (n) => `${n} ${tUi("stories_count_suffix", "hekayə")}`;
    const resetIndex = () => {
      index = null;
      loading = null;
      loadedUrl = "";
      window.__BIRINCI_SEARCH__ = undefined;
    };

    const closeSearch = () => {
      root.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("global-search-open");
    };

    const openSearch = () => {
      root.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("global-search-open");
      window.setTimeout(() => input.focus(), 20);
      ensureIndex();
    };

    const ensureIndex = () => {
      const url = currentSearchUrl();
      if (loadedUrl && url && loadedUrl !== url) resetIndex();
      if (index && loadedUrl === url) {
        if (status && !lastQuery) status.textContent = countStatus(index.length);
        return Promise.resolve(index);
      }
      if (loading) return loading;
      if (!url) return null;
      if (status) status.textContent = tJs("index_loading", "İndeks yüklənir…");
      loadedUrl = url;
      loading = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.async = true;
        script.onload = () => {
          if (Array.isArray(window.__BIRINCI_SEARCH__)) resolve(window.__BIRINCI_SEARCH__);
          else reject(new Error("empty-index"));
        };
        script.onerror = () => reject(new Error("script-error"));
        document.head.appendChild(script);
      })
        .then((rows) => {
          index = rows || [];
          if (status) status.textContent = lastQuery ? status.textContent : countStatus(index.length);
          if (lastQuery) render(lastQuery);
        })
        .catch(() => {
          index = [];
          loadedUrl = "";
          if (status) {
            status.textContent = tJs("index_failed", "Axtarış indeksi yüklənmədi.").replace(
              /\{lang\}/g,
              searchLang()
            );
          }
        })
        .finally(() => {
          loading = null;
        });
      return loading;
    };

    const render = (query) => {
      lastQuery = query;
      const q = query.trim().toLocaleLowerCase(searchLang());
      results.innerHTML = "";
      if (!q) {
        if (status) status.textContent = index ? countStatus(index.length) : "";
        return;
      }
      if (!index) {
        if (status) status.textContent = tJs("index_loading", "İndeks yüklənir…");
        return;
      }
      const matches = index.filter((row) => row.hay.includes(q)).slice(0, 40);
      if (status) {
        status.textContent = matches.length
          ? tJs("results_n", "{n} nəticə").replace(/\{n\}/g, String(matches.length))
          : tJs("no_match", "Uyğun hekayə tapılmadı.");
      }
      const onRoot = document.body.classList.contains("page-root-home");
      const inCategories = window.location.pathname.includes("/categories/");
      const homeListBase = onRoot
        ? `${searchLang()}/index.html`
        : inCategories
          ? "../index.html"
          : "index.html";
      matches.forEach((row) => {
        const a = document.createElement("a");
        a.className = "global-search__item";
        a.href = `${homeListBase}?view=list#${encodeURIComponent(row.stem)}`;
        a.innerHTML =
          `<span class="global-search__item-title"></span>` +
          `<span class="global-search__item-meta"></span>`;
        a.querySelector(".global-search__item-title").textContent = row.title;
        a.querySelector(".global-search__item-meta").textContent = row.category;
        if (q) {
          applySearchHighlights(a.querySelector(".global-search__item-title"), q);
          applySearchHighlights(a.querySelector(".global-search__item-meta"), q);
        }
        a.addEventListener("click", closeSearch);
        results.appendChild(a);
      });
    };

    const kbdHint = toggle.querySelector(".global-search-toggle__kbd");
    if (kbdHint && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || "")) {
      kbdHint.textContent = "⌘K";
      toggle.title = tUi("global_search_title_attr", "Axtar (Ctrl+K)").replace("Ctrl+K", "⌘K");
      toggle.setAttribute(
        "aria-label",
        tUi("global_search_toggle", "Qlobal axtarış, Ctrl+K").replace("Ctrl+K", "Command+K")
      );
    }


    if (typeof MutationObserver === "function") {
      new MutationObserver(() => {
        const url = currentSearchUrl();
        if (!url || url === loadedUrl) return;
        resetIndex();
        results.innerHTML = "";
        if (!root.hidden) ensureIndex();
      }).observe(root, { attributes: true, attributeFilter: ["data-search-index"] });
    }

    toggle.addEventListener("click", () => {
      if (root.hidden) openSearch();
      else closeSearch();
    });
    root.querySelectorAll("[data-global-search-close]").forEach((el) => {
      el.addEventListener("click", closeSearch);
    });
    input.addEventListener("input", () => render(input.value));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !root.hidden) {
        closeSearch();
        toggle.focus();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }
    });
  };

  initGlobalSearch();

  const localeCompareAz = (a, b) =>
    String(a || "").localeCompare(String(b || ""), LOCALE_TAG, { sensitivity: "base" });

  const initCategoryTools = () => {
    if (!document.body.classList.contains("page-category")) return;
    const bar = document.querySelector('[data-tools="category"]');
    const list = document.querySelector("[data-tools-list]");
    const empty = document.querySelector("[data-tools-empty]");
    if (!bar || !list) return;

    const searchInput = bar.querySelector("[data-tools-search]");
    if (!searchInput) return;
    bindSearchFilterClear(searchInput);

    const cardsPanel = document.querySelector('[data-view="cards"]');
    const listPanel = document.querySelector('[data-view="list"]');
    const cardGrid = document.querySelector("[data-tools-cards]");
    const applyCategoryView = (view, { animate = true } = {}) => {
      const next = view === "cards" ? "cards" : "list";
      const apply = () => {
        if (cardsPanel) {
          cardsPanel.hidden = next !== "cards";
          if (next === "cards") cardsPanel.removeAttribute("hidden");
          else cardsPanel.setAttribute("hidden", "");
        }
        if (listPanel) {
          listPanel.hidden = next !== "list";
          if (next === "list") listPanel.removeAttribute("hidden");
          else listPanel.setAttribute("hidden", "");
        }
        bar.querySelectorAll("[data-home-view]").forEach((btn) => {
          btn.setAttribute("aria-pressed", btn.getAttribute("data-home-view") === next ? "true" : "false");
        });
        document.body.classList.toggle("category-view-cards", next === "cards");
      };
      if (animate) runViewTransition(apply);
      else apply();
      try {
        localStorage.setItem("birinci-category-view", next);
      } catch (_) {}
      // Lexicon wraps hidden panels too, but refresh after toggle so tips stay bound.
      window.requestAnimationFrame(() => {
        refreshAzLexicon(document.querySelector(".category-main") || document.querySelector("main"));
      });
      return false;
    };
    window.__birinciSetHomeView = applyCategoryView;

    const imagesToggle = bar.querySelector("[data-tools-images]");
    const imagesBtns = Array.from(bar.querySelectorAll("[data-images-mode]"));
    const textsToggle = bar.querySelector("[data-tools-texts]");
    const textsBtns = Array.from(bar.querySelectorAll("[data-texts-mode]"));
    const batchSizeInput = bar.querySelector("[data-home-batch-size]");
    const batchDecBtn = bar.querySelector('[data-home-batch="dec"]');
    const batchIncBtn = bar.querySelector('[data-home-batch="inc"]');
    const batchPrevBtn = bar.querySelector('[data-home-batch="prev"]');
    const batchNextBtn = bar.querySelector('[data-home-batch="next"]');
    const batchRandomBtn = bar.querySelector('[data-home-batch="random"]');
    const batchAllBtn = bar.querySelector('[data-home-batch="all"]');
    const batchRangeEl = bar.querySelector("[data-home-batch-range]");
    const navList = document.querySelector("[data-tools-nav]");
    const countEl = document.querySelector("[data-tools-count]");
    const batchSizeStorageKey = "birinci-category-batch-size";
    const batchAllStorageKey = "birinci-category-batch-all";
    // One-shot migration from the pre-pager page-size key; removed after read/persist.
    const legacyPageSizeStorageKey = "birinci-category-page-size";

    const allStories = Array.from(list.querySelectorAll(".story"));
    allStories.sort((a, b) => localeCompareAz(a.dataset.title, b.dataset.title));
    allStories.forEach((story) => list.appendChild(story));
    const allCards = cardGrid ? Array.from(cardGrid.querySelectorAll("[data-stem]")) : [];
    const cardsByStem = new Map(allCards.map((card) => [card.dataset.stem, card]));
    allCards.sort((a, b) => localeCompareAz(a.dataset.title, b.dataset.title));
    if (cardGrid) allCards.forEach((card) => cardGrid.appendChild(card));
    if (navList) {
      const navItems = Array.from(navList.querySelectorAll("li[data-stem]"));
      navItems.sort((a, b) => localeCompareAz(a.dataset.title, b.dataset.title));
      navItems.forEach((item) => navList.appendChild(item));
    }

    let filtered = [];
    let batchSize = 12;
    let windowStart = 0;
    let randomStems = null;
    let allMode = false;
    let pendingStem = null;

    const batchCap = () => {
      const n =
        (filtered && filtered.length) ||
        (allStories && allStories.length) ||
        0;
      return Math.max(1, n);
    };

    const inputRaw = () =>
      batchSizeInput ? String(batchSizeInput.value || "").trim() : "";

    const readBatchSize = () => {
      const raw = inputRaw();
      if (!raw) return batchSize || 12;
      const n = Number(raw);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : batchSize || 12;
    };

    const persistBatchSize = () => {
      try {
        localStorage.setItem(batchSizeStorageKey, String(batchSize));
        localStorage.removeItem(legacyPageSizeStorageKey);
      } catch (_) {}
    };

    const persistAllMode = () => {
      try {
        if (allMode) localStorage.setItem(batchAllStorageKey, "1");
        else localStorage.removeItem(batchAllStorageKey);
      } catch (_) {}
    };

    const syncBatchUi = (visibleCount = 0) => {
      const total = (filtered && filtered.length) || 0;
      const cap = batchCap();
      if (batchSizeInput) {
        batchSizeInput.min = "1";
        batchSizeInput.max = String(cap);
        batchSizeInput.value = String(batchSize);
      }
      const inRandom = !!(randomStems && randomStems.length);
      const atStart = !inRandom && windowStart <= 0;
      const atEnd = allMode || total === 0 || inRandom || windowStart + batchSize >= total;
      if (batchDecBtn) batchDecBtn.disabled = total === 0 || batchSize <= 1;
      if (batchIncBtn) batchIncBtn.disabled = total === 0 || batchSize >= cap;
      if (batchPrevBtn) batchPrevBtn.disabled = total === 0 || allMode || (!inRandom && atStart);
      if (batchNextBtn) batchNextBtn.disabled = total === 0 || allMode || inRandom || atEnd;
      if (batchRandomBtn) batchRandomBtn.disabled = total === 0;
      bar.querySelectorAll("[data-tools-play-visible]").forEach((btn) => {
        btn.disabled = total === 0;
      });
      if (typeof window.__birinciSyncPlayVisibleUi === "function") {
        window.__birinciSyncPlayVisibleUi();
      }
      if (batchAllBtn) {
        const showingAll = allMode && !inRandom && total > 0;
        batchAllBtn.disabled = total === 0;
        batchAllBtn.classList.toggle("is-active", showingAll);
        batchAllBtn.setAttribute("aria-pressed", showingAll ? "true" : "false");
        batchAllBtn.removeAttribute("aria-disabled");
      }
      if (batchRangeEl) {
        if (total === 0) {
          batchRangeEl.hidden = true;
          batchRangeEl.textContent = "";
        } else {
          batchRangeEl.hidden = false;
          batchRangeEl.removeAttribute("hidden");
          if (inRandom) {
            batchRangeEl.textContent = `${tUi("batch_random", "Təsadüfi")}·${visibleCount}/${total}`;
          } else if (allMode) {
            batchRangeEl.textContent = `1–${total}/${total}`;
          } else {
            const from = windowStart + 1;
            const to = Math.max(from, windowStart + visibleCount);
            batchRangeEl.textContent = `${from}–${to}/${total}`;
          }
        }
      }
    };

    const applyPageSize = (n, { persist = true, render = false } = {}) => {
      const cap = batchCap();
      let size = Number(n);
      if (!Number.isFinite(size) || size < 1) size = batchSize || 12;
      size = Math.min(Math.floor(size), cap);
      if (size < 1) size = 1;
      batchSize = size;
      allMode = false;
      randomStems = null;
      windowStart = 0;
      if (batchSizeInput) batchSizeInput.value = String(batchSize);
      if (persist) {
        persistBatchSize();
        persistAllMode();
      }
      if (render) {
        pendingStem = null;
        renderList();
      } else {
        syncBatchUi(0);
      }
    };

    const commitBatchSize = ({ persist = true, render = false } = {}) => {
      applyPageSize(readBatchSize(), { persist, render });
    };

    const applyStoredBatchSize = () => {
      let stored = "";
      let storedAll = false;
      try {
        storedAll = localStorage.getItem(batchAllStorageKey) === "1";
        stored = localStorage.getItem(batchSizeStorageKey) || "";
        if (!stored) {
          const legacy = localStorage.getItem(legacyPageSizeStorageKey) || "";
          if (legacy && legacy !== "all") stored = legacy;
          else if (legacy === "all") storedAll = true;
        }
      } catch (_) {}
      const n = Number(stored);
      batchSize = Number.isFinite(n) && n > 0 ? Math.floor(n) : 12;
      allMode = !!storedAll;
      if (batchSizeInput) batchSizeInput.value = String(batchSize);
      syncBatchUi(0);
    };

    applyStoredBatchSize();

    const pickRandomStems = (count) => {
      const total = filtered.length;
      if (!total) return [];
      const n = Math.min(Math.max(1, count), total);
      const idxs = Array.from({ length: total }, (_, i) => i);
      for (let i = idxs.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = idxs[i];
        idxs[i] = idxs[j];
        idxs[j] = tmp;
      }
      return idxs.slice(0, n).map((i) => filtered[i].dataset.stem);
    };

    const applyImagesState = (collapsed) => {
      document.body.classList.toggle("images-collapsed", collapsed);
      imagesBtns.forEach((btn) => {
        const mode = btn.getAttribute("data-images-mode");
        const pressed = collapsed ? mode === "hide" : mode === "show";
        btn.setAttribute("aria-pressed", pressed ? "true" : "false");
      });
      if (typeof window.__birinciSetAllStoryFigures === "function") {
        window.__birinciSetAllStoryFigures(!collapsed);
      } else {
        document.querySelectorAll("article.story").forEach((story) => {
          story.classList.toggle("story--figure-hidden", collapsed);
          setStoryModePressed(story, "data-images-mode", !collapsed);
        });
      }
      try {
        localStorage.setItem("birinci-images-collapsed", collapsed ? "1" : "0");
      } catch (_) {}
    };

    if (imagesToggle && imagesBtns.length) {
      let collapsed = false;
      try {
        collapsed = localStorage.getItem("birinci-images-collapsed") === "1";
      } catch (_) {}
      applyImagesState(collapsed);
      imagesBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          applyImagesState(btn.getAttribute("data-images-mode") === "hide");
        });
      });
    }

    const applyTextsState = (collapsed) => {
      document.body.classList.toggle("texts-collapsed", collapsed);
      textsBtns.forEach((btn) => {
        const mode = btn.getAttribute("data-texts-mode");
        const pressed = collapsed ? mode === "hide" : mode === "show";
        btn.setAttribute("aria-pressed", pressed ? "true" : "false");
      });
      if (typeof window.__birinciSetAllStoryTexts === "function") {
        window.__birinciSetAllStoryTexts(!collapsed);
      } else {
        document.querySelectorAll("article.story").forEach((story) => {
          story.classList.toggle("story--text-hidden", collapsed);
          setStoryModePressed(story, "data-texts-mode", !collapsed);
        });
      }
      try {
        localStorage.setItem("birinci-texts-collapsed", collapsed ? "1" : "0");
      } catch (_) {}
    };

    if (textsToggle && textsBtns.length) {
      let textsCollapsed = false;
      try {
        textsCollapsed = localStorage.getItem("birinci-texts-collapsed") === "1";
      } catch (_) {}
      applyTextsState(textsCollapsed);
      textsBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          applyTextsState(btn.getAttribute("data-texts-mode") === "hide");
        });
      });
    }

    const escapeHtml = (value) =>
      String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const refreshSidebarNav = (visibleStories) => {
      if (navList) {
        navList.innerHTML = visibleStories
          .map(
            (s) =>
              `<li data-stem="${escapeHtml(s.dataset.stem)}" data-title="${escapeHtml(s.dataset.title)}"><a href="#${escapeHtml(
                s.dataset.stem
              )}">${escapeHtml(s.dataset.title)}</a></li>`
          )
          .join("");
      }
      const layout = document.querySelector(".category-layout");
      if (layout && typeof window.__birinciBindStorySidebar === "function") {
        window.__birinciBindStorySidebar(layout);
      } else if (layout && layout.__birinciSidebar) {
        layout.__birinciSidebar.refresh();
      }
    };

    const scrollToolsIntoView = () => {
      try {
        bar.scrollIntoView({ block: "nearest", behavior: "auto" });
      } catch (_) {}
    };

    const writeCategoryUrlState = () => {
      try {
        const params = new URLSearchParams();
        const q = searchInput.value.trim();
        if (q) params.set("q", q);
        if (windowStart > 0) params.set("start", String(windowStart));
        if (batchSize > 0) params.set("batch", String(batchSize));
        const url = new URL(window.location.href);
        url.search = params.toString();
        const hash = (window.location.hash || "").replace(/^#/, "");
        url.hash = hash;
        history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
        window.__birinciListStart = windowStart;
      } catch (_) {}
    };

    const renderList = ({ resetWindow = false } = {}) => {
      if (typeof window.__birinciStopStoryTts === "function") window.__birinciStopStoryTts();
      const q = searchInput.value.trim().toLocaleLowerCase(LOCALE_TAG);
      filtered = allStories.filter((story) => {
        const textEl = story.querySelector(".story__text");
        const hay = `${story.dataset.title || ""} ${textEl ? textEl.textContent : ""}`.toLocaleLowerCase(LOCALE_TAG);
        return !q || hay.includes(q);
      });

      const total = filtered.length;
      syncSearchFilterUi(searchInput.value.trim(), total);
      const cap = Math.max(1, total || 1);
      let n = readBatchSize();
      if (!Number.isFinite(n) || n < 1) n = batchSize || 12;
      if (n > cap) n = cap;
      batchSize = n;
      if (batchSizeInput && String(batchSizeInput.value) !== String(n)) {
        batchSizeInput.value = String(n);
      }
      if (!allMode) {
        try {
          localStorage.setItem(batchSizeStorageKey, String(n));
        } catch (_) {}
      }

      if (resetWindow) {
        windowStart = 0;
        randomStems = null;
      }

      if (pendingStem) {
        const idx = filtered.findIndex(
          (story) => story.dataset.stem === pendingStem || story.dataset.stem === String(pendingStem)
        );
        if (idx >= 0) {
          randomStems = null;
          if (!allMode) {
            windowStart = Math.floor(idx / batchSize) * batchSize;
          }
        }
      }

      let visibleStories = [];
      if (total === 0) {
        windowStart = 0;
        randomStems = null;
        visibleStories = [];
      } else if (randomStems && randomStems.length) {
        allMode = false;
        const byStem = new Map(filtered.map((story) => [story.dataset.stem, story]));
        visibleStories = randomStems.map((stem) => byStem.get(stem)).filter(Boolean);
        if (!visibleStories.length) {
          randomStems = null;
          windowStart = 0;
          visibleStories = filtered.slice(0, batchSize);
        }
      } else if (allMode) {
        randomStems = null;
        windowStart = 0;
        visibleStories = filtered.slice();
      } else {
        randomStems = null;
        const maxStart = Math.max(0, total - 1);
        if (windowStart > maxStart) windowStart = Math.floor(maxStart / batchSize) * batchSize;
        if (windowStart < 0) windowStart = 0;
        visibleStories = filtered.slice(windowStart, windowStart + batchSize);
      }

      const visibleSet = new Set(visibleStories.map((s) => s.dataset.stem));
      allStories.forEach((story) => {
        story.hidden = !visibleSet.has(story.dataset.stem);
      });
      visibleStories.forEach((story) => list.appendChild(story));
      allStories
        .filter((story) => !visibleSet.has(story.dataset.stem))
        .forEach((story) => list.appendChild(story));
      allCards.forEach((card) => {
        card.hidden = !visibleSet.has(card.dataset.stem);
      });
      if (cardGrid) {
        visibleStories.forEach((story) => {
          const card = cardsByStem.get(story.dataset.stem);
          if (card) cardGrid.appendChild(card);
        });
        allCards
          .filter((card) => !visibleSet.has(card.dataset.stem))
          .forEach((card) => cardGrid.appendChild(card));
      }

      if (typeof window.__birinciSetAllStoryFigures === "function") {
        window.__birinciSetAllStoryFigures(!document.body.classList.contains("images-collapsed"));
      }
      if (typeof window.__birinciSetAllStoryTexts === "function") {
        window.__birinciSetAllStoryTexts(!document.body.classList.contains("texts-collapsed"));
      }
      refreshSidebarNav(visibleStories);
      if (countEl) countEl.textContent = String(total);
      if (empty) empty.hidden = total !== 0;
      if (typeof window.__birinciClearListenQueue === "function") {
        window.__birinciClearListenQueue({ keepTrack: true });
      }
      syncBatchUi(visibleStories.length);
      persistAllMode();
      writeCategoryUrlState();
      if (pendingStem) {
        const el = document.getElementById(pendingStem);
        if (el) {
          window.requestAnimationFrame(() => {
            el.scrollIntoView({ block: "start", behavior: "auto" });
          });
        }
        pendingStem = null;
      }
      const highlightRoot =
        document.querySelector(".category-main") ||
        list.closest("main") ||
        list;
      paintSearchAndLexicon(highlightRoot, searchInput.value.trim());
    };

    searchInput.addEventListener("input", () => {
      pendingStem = null;
      renderList({ resetWindow: true });
    });
    if (batchSizeInput) {
      batchSizeInput.addEventListener("change", () => {
        commitBatchSize({ persist: true, render: true });
      });
      batchSizeInput.addEventListener("blur", () => {
        commitBatchSize({ persist: true, render: true });
      });
      batchSizeInput.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        commitBatchSize({ persist: true, render: true });
        batchSizeInput.blur();
      });
    }
    const runBatchAction = (action) => {
      const total = filtered.length;
      if (!total) {
        randomStems = null;
        windowStart = 0;
        persistBatchSize();
        persistAllMode();
        renderList();
        return;
      }
      if (action === "all") {
        if (allMode && !randomStems) {
          allMode = false;
        } else {
          allMode = true;
          randomStems = null;
        }
        windowStart = 0;
        persistBatchSize();
        persistAllMode();
        pendingStem = null;
        renderList();
        scrollToolsIntoView();
        return;
      }
      if (action === "dec") {
        applyPageSize(batchSize - 1, { persist: true, render: true });
        scrollToolsIntoView();
        return;
      }
      if (action === "inc") {
        applyPageSize(batchSize + 1, { persist: true, render: true });
        scrollToolsIntoView();
        return;
      }
      if (action === "prev") {
        allMode = false;
        if (randomStems) {
          randomStems = null;
          windowStart = 0;
        } else {
          windowStart = Math.max(0, windowStart - batchSize);
        }
      } else if (action === "next") {
        allMode = false;
        randomStems = null;
        if (windowStart + batchSize < total) {
          windowStart += batchSize;
        }
      } else if (action === "random") {
        allMode = false;
        randomStems = pickRandomStems(batchSize);
      } else {
        return;
      }
      persistBatchSize();
      persistAllMode();
      pendingStem = null;
      renderList();
      scrollToolsIntoView();
    };
    if (batchDecBtn) batchDecBtn.addEventListener("click", () => runBatchAction("dec"));
    if (batchIncBtn) batchIncBtn.addEventListener("click", () => runBatchAction("inc"));
    if (batchPrevBtn) batchPrevBtn.addEventListener("click", () => runBatchAction("prev"));
    if (batchNextBtn) batchNextBtn.addEventListener("click", () => runBatchAction("next"));
    if (batchRandomBtn) batchRandomBtn.addEventListener("click", () => runBatchAction("random"));
    if (batchAllBtn) batchAllBtn.addEventListener("click", () => runBatchAction("all"));

    try {
      const params = new URLSearchParams(window.location.search || "");
      const qParam = String(params.get("q") || "").trim();
      if (qParam) searchInput.value = qParam;
      const batchParam = Number(params.get("batch") || "");
      if (Number.isFinite(batchParam) && batchParam > 0) {
        batchSize = Math.floor(batchParam);
        if (batchSizeInput) batchSizeInput.value = String(batchSize);
        try {
          localStorage.setItem(batchSizeStorageKey, String(batchSize));
        } catch (_) {}
      }
      const startParam = Number(params.get("start") || "");
      if (Number.isFinite(startParam) && startParam > 0) {
        windowStart = Math.floor(startParam);
      }
      window.__birinciListStart = windowStart;
      const hash = decodeURIComponent((window.location.hash || "").replace(/^#/, ""));
      if (hash) pendingStem = hash;
    } catch (_) {}

    if (cardGrid) {
      cardGrid.addEventListener("click", (event) => {
        const card = event.target.closest("[data-stem]");
        if (!card || !cardGrid.contains(card)) return;
        event.preventDefault();
        pendingStem = card.getAttribute("data-stem") || "";
        applyCategoryView("list");
        renderList();
      });
    }
    if (navList) {
      navList.addEventListener("click", (event) => {
        const link = event.target.closest("a[href^='#']");
        if (!link || !navList.contains(link)) return;
        const stem = (link.getAttribute("href") || "").replace(/^#/, "");
        if (!stem || !document.body.classList.contains("category-view-cards")) return;
        event.preventDefault();
        pendingStem = stem;
        applyCategoryView("list");
        renderList();
      });
    }

    if (pendingStem) applyCategoryView("list", { animate: false });
    else {
      let stored = "list";
      try {
        stored = localStorage.getItem("birinci-category-view") || "list";
      } catch (_) {}
      applyCategoryView(stored === "cards" ? "cards" : "list", { animate: false });
    }

    renderList();
  };

  initCategoryTools();

  /**
   * DAAB News-style sidebar: sticky TOC, scroll-spy, mobile accordion.
   * (No dual-panel scroll sync — it fought page scroll.)
   */
  const bindStorySidebarLayout = (layout) => {
    if (!layout) return null;
    if (layout.__birinciSidebar) {
      layout.__birinciSidebar.refresh();
      return layout.__birinciSidebar;
    }

    const nav = layout.querySelector(".story-nav.sidebar");
    if (!nav) return null;
    const widget = nav.querySelector(".sidebar-widget");
    const toggle = nav.querySelector(".events-menu-toggle");
    const mobileQuery = window.matchMedia("(max-width: 1060px)");

    let links = [];
    let cards = [];

    const closeMenu = () => {
      if (!widget || !toggle) return;
      widget.classList.remove("events-open");
      toggle.setAttribute("aria-expanded", "false");
    };
    const toggleMenu = () => {
      if (!widget || !toggle) return;
      const open = widget.classList.toggle("events-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    };

    const setActive = (activeLink) => {
      links.forEach((link) => {
        const on = link === activeLink;
        link.classList.toggle("is-active", on);
        link.classList.toggle("tl-active", on);
      });
      if (typeof window.__birinciSetDeepCrumb !== "function") return;
      if (!activeLink) {
        let hash = "";
        try {
          hash = decodeURIComponent((window.location.hash || "").replace(/^#/, ""));
        } catch (_) {
          hash = (window.location.hash || "").replace(/^#/, "");
        }
        const hashed = hash ? document.getElementById(hash) : null;
        if (hashed && hashed.classList.contains("story")) {
          window.__birinciSetDeepCrumb({
            id: hash,
            title: (hashed.getAttribute("data-title") || "").trim(),
          });
        } else if (typeof window.__birinciClearDeepCrumb === "function") {
          window.__birinciClearDeepCrumb();
        }
        return;
      }
      const raw = (activeLink.getAttribute("href") || "").slice(1);
      let id = raw;
      try {
        id = decodeURIComponent(raw);
      } catch (_) {}
      const el = document.getElementById(id);
      const title =
        (el && (el.getAttribute("data-title") || "").trim()) ||
        (el && el.querySelector("h2") && el.querySelector("h2").textContent.trim()) ||
        (activeLink.textContent || "").trim();
      window.__birinciSetDeepCrumb({ id, title });
    };

    const updateActive = () => {
      if (!cards.length) {
        setActive(null);
        return;
      }
      const mid = window.scrollY + window.innerHeight * 0.35;
      let active = null;
      for (let i = cards.length - 1; i >= 0; i -= 1) {
        const top = cards[i].el.getBoundingClientRect().top + window.scrollY;
        if (top <= mid) {
          active = cards[i].link;
          break;
        }
      }
      setActive(active);
    };

    const refresh = () => {
      links = Array.from(nav.querySelectorAll('.timeline-list a[href^="#"]'));
      cards = links
        .map((link) => {
          const raw = (link.getAttribute("href") || "").slice(1);
          let id = raw;
          try {
            id = decodeURIComponent(raw);
          } catch (_) {}
          const el = document.getElementById(id);
          return el ? { link, el, id } : null;
        })
        .filter(Boolean);
      updateActive();
    };

    if (toggle) {
      toggle.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleMenu();
      });
    }
    document.addEventListener("click", (event) => {
      if (!mobileQuery.matches || !widget || !widget.classList.contains("events-open")) return;
      if (widget.contains(event.target)) return;
      closeMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
    mobileQuery.addEventListener("change", () => {
      if (!mobileQuery.matches) closeMenu();
    });

    nav.addEventListener("click", (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || !nav.contains(link)) return;
      const raw = (link.getAttribute("href") || "").slice(1);
      let id = raw;
      try {
        id = decodeURIComponent(raw);
      } catch (_) {}
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      setActive(link);
      const html = document.documentElement;
      const prevBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";
      target.scrollIntoView({ block: "start", behavior: "auto" });
      html.style.scrollBehavior = prevBehavior;
      try {
        history.pushState(null, "", `${window.location.pathname}${window.location.search}#${id}`);
      } catch (_) {}
      if (mobileQuery.matches) closeMenu();
    });

    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive, { passive: true });

    const api = { refresh, closeMenu, updateActive };
    layout.__birinciSidebar = api;
    refresh();
    return api;
  };

  window.__birinciBindStorySidebar = bindStorySidebarLayout;

  const initHomeViews = () => {
    if (!document.body.classList.contains("page-home")) return;
    const bar = document.querySelector('[data-tools="home"]');
    const cardsPanel = document.querySelector('[data-view="cards"]');
    const listPanel = document.querySelector('[data-view="list"]');
    if (!bar || !cardsPanel || !listPanel) return;

    const searchInput = bar.querySelector("[data-tools-search]");
    if (!searchInput) return;
    bindSearchFilterClear(searchInput);

    const cardsList = cardsPanel.querySelector("[data-tools-list]");
    const cardsEmpty = cardsPanel.querySelector("[data-tools-empty]");
    const storiesList = listPanel.querySelector("[data-stories-list]");
    const listEmpty = listPanel.querySelector("[data-home-list-empty]");
    const navList = listPanel.querySelector("[data-home-nav]");
    const imagesToggle = bar.querySelector("[data-tools-images]");
    const imagesBtns = Array.from(bar.querySelectorAll("[data-images-mode]"));
    const textsToggle = bar.querySelector("[data-tools-texts]");
    const textsBtns = Array.from(bar.querySelectorAll("[data-texts-mode]"));
    const batchSizeInput = bar.querySelector("[data-home-batch-size]");
    const batchDecBtn = bar.querySelector('[data-home-batch="dec"]');
    const batchIncBtn = bar.querySelector('[data-home-batch="inc"]');
    const batchPrevBtn = bar.querySelector('[data-home-batch="prev"]');
    const batchNextBtn = bar.querySelector('[data-home-batch="next"]');
    const batchRandomBtn = bar.querySelector('[data-home-batch="random"]');
    const batchAllBtn = bar.querySelector('[data-home-batch="all"]');
    const batchRangeEl = bar.querySelector("[data-home-batch-range]");
    const viewBtns = Array.from(bar.querySelectorAll("[data-home-view]"));
    const listOnly = Array.from(bar.querySelectorAll("[data-home-list-only]"));
    const assetVersion = listPanel.getAttribute("data-asset-version") || "";
    const viewStorageKey = "birinci-home-view";
    const batchSizeStorageKey = "birinci-home-batch-size";
    const batchAllStorageKey = "birinci-home-batch-all";
    const legacyPageSizeStorageKey = "birinci-home-page-size";
    // One-shot migration from the pre-pager page-size key; removed after read/persist.

    let view = "cards";
    let allStories = null;
    let filtered = [];
    let loading = null;
    let pendingStem = null;
    let batchSize = 12;
    let windowStart = 0;
    let randomStems = null;
    let allMode = false;
    let listRenderKey = "";

    const batchCap = () => {
      const n =
        (filtered && filtered.length) ||
        (allStories && allStories.length) ||
        0;
      return Math.max(1, n);
    };

    const inputRaw = () =>
      batchSizeInput ? String(batchSizeInput.value || "").trim() : "";

    const readBatchSize = () => {
      const raw = inputRaw();
      if (!raw) return batchSize || 12;
      const n = Number(raw);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : batchSize || 12;
    };

    const persistBatchSize = () => {
      try {
        localStorage.setItem(batchSizeStorageKey, String(batchSize));
        localStorage.removeItem(legacyPageSizeStorageKey);
      } catch (_) {}
    };

    const persistAllMode = () => {
      try {
        if (allMode) localStorage.setItem(batchAllStorageKey, "1");
        else localStorage.removeItem(batchAllStorageKey);
      } catch (_) {}
    };

    const syncBatchUi = (visibleCount = 0) => {
      const total = (filtered && filtered.length) || 0;
      const cap = batchCap();
      if (batchSizeInput) {
        batchSizeInput.min = "1";
        batchSizeInput.max = String(cap);
        batchSizeInput.value = String(batchSize);
      }
      const inRandom = !!(randomStems && randomStems.length);
      const atStart = !inRandom && windowStart <= 0;
      const atEnd = allMode || total === 0 || inRandom || windowStart + batchSize >= total;
      if (batchDecBtn) batchDecBtn.disabled = total === 0 || batchSize <= 1;
      if (batchIncBtn) batchIncBtn.disabled = total === 0 || batchSize >= cap;
      if (batchPrevBtn) batchPrevBtn.disabled = total === 0 || allMode || (!inRandom && atStart);
      if (batchNextBtn) batchNextBtn.disabled = total === 0 || allMode || inRandom || atEnd;
      if (batchRandomBtn) batchRandomBtn.disabled = total === 0;
      bar.querySelectorAll("[data-tools-play-visible]").forEach((btn) => {
        btn.disabled = total === 0;
      });
      if (typeof window.__birinciSyncPlayVisibleUi === "function") {
        window.__birinciSyncPlayVisibleUi();
      }
      if (batchAllBtn) {
        const showingAll = allMode && !inRandom && total > 0;
        batchAllBtn.disabled = total === 0;
        batchAllBtn.classList.toggle("is-active", showingAll);
        batchAllBtn.setAttribute("aria-pressed", showingAll ? "true" : "false");
        batchAllBtn.removeAttribute("aria-disabled");
      }
      if (batchRangeEl) {
        if (total === 0) {
          batchRangeEl.hidden = true;
          batchRangeEl.textContent = "";
        } else {
          batchRangeEl.hidden = false;
          batchRangeEl.removeAttribute("hidden");
          if (inRandom) {
            batchRangeEl.textContent = `${tUi("batch_random", "Təsadüfi")}·${visibleCount}/${total}`;
          } else if (allMode) {
            batchRangeEl.textContent = `1–${total}/${total}`;
          } else {
            const from = windowStart + 1;
            const to = Math.max(from, windowStart + visibleCount);
            batchRangeEl.textContent = `${from}–${to}/${total}`;
          }
        }
      }
    };

    const applyPageSize = (n, { persist = true, render = false } = {}) => {
      const cap = batchCap();
      let size = Number(n);
      if (!Number.isFinite(size) || size < 1) size = batchSize || 12;
      size = Math.min(Math.floor(size), cap);
      if (size < 1) size = 1;
      batchSize = size;
      allMode = false;
      randomStems = null;
      windowStart = 0;
      if (batchSizeInput) batchSizeInput.value = String(batchSize);
      if (persist) {
        persistBatchSize();
        persistAllMode();
      }
      if (render && view === "list") {
        pendingStem = null;
        renderList();
      } else {
        syncBatchUi(0);
      }
    };

    const commitBatchSize = ({ persist = true, render = false } = {}) => {
      applyPageSize(readBatchSize(), { persist, render });
    };

    const applyStoredBatchSize = () => {
      let stored = "";
      let storedAll = false;
      try {
        storedAll = localStorage.getItem(batchAllStorageKey) === "1";
        stored = localStorage.getItem(batchSizeStorageKey) || "";
        if (!stored) {
          const legacy = localStorage.getItem(legacyPageSizeStorageKey) || "";
          if (legacy && legacy !== "all") stored = legacy;
          else if (legacy === "all") storedAll = true;
        }
      } catch (_) {}
      const n = Number(stored);
      batchSize = Number.isFinite(n) && n > 0 ? Math.floor(n) : 12;
      allMode = !!storedAll;
      if (batchSizeInput) batchSizeInput.value = String(batchSize);
      syncBatchUi(0);
    };

    applyStoredBatchSize();

    const pickRandomStems = (count) => {
      const total = filtered.length;
      if (!total) return [];
      const n = Math.min(Math.max(1, count), total);
      const idxs = Array.from({ length: total }, (_, i) => i);
      for (let i = idxs.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = idxs[i];
        idxs[i] = idxs[j];
        idxs[j] = tmp;
      }
      return idxs.slice(0, n).map((i) => filtered[i].stem);
    };

    const escapeHtml = (value) =>
      String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const readUrlState = () => {
      const params = new URLSearchParams(window.location.search);
      const hash = decodeURIComponent((window.location.hash || "").replace(/^#/, ""));
      return {
        view: params.get("view"),
        q: params.get("q"),
        stem: hash || null,
        start: params.get("start"),
        batch: params.get("batch"),
      };
    };

    const writeUrlState = () => {
      try {
        const params = new URLSearchParams();
        if (view === "list") params.set("view", "list");
        const q = searchInput.value.trim();
        if (view === "list" && q) params.set("q", q);
        if (view === "list" && windowStart > 0) params.set("start", String(windowStart));
        if (view === "list" && batchSize > 0) params.set("batch", String(batchSize));
        const url = new URL(window.location.href);
        url.search = params.toString();
        url.hash = pendingStem ? pendingStem : "";
        history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
        window.__birinciListStart = windowStart;
      } catch (_) {
        /* file:// or sandboxed histories must not block view switching */
      }
    };

    const applyImagesState = (collapsed) => {
      document.body.classList.toggle("images-collapsed", collapsed);
      imagesBtns.forEach((btn) => {
        const mode = btn.getAttribute("data-images-mode");
        const pressed = collapsed ? mode === "hide" : mode === "show";
        btn.setAttribute("aria-pressed", pressed ? "true" : "false");
      });
      if (typeof window.__birinciSetAllStoryFigures === "function") {
        window.__birinciSetAllStoryFigures(!collapsed);
      } else {
        document.querySelectorAll("article.story").forEach((story) => {
          story.classList.toggle("story--figure-hidden", collapsed);
          setStoryModePressed(story, "data-images-mode", !collapsed);
        });
      }
      try {
        localStorage.setItem("birinci-images-collapsed", collapsed ? "1" : "0");
      } catch (_) {}
    };

    if (imagesToggle && imagesBtns.length) {
      let collapsed = false;
      try {
        collapsed = localStorage.getItem("birinci-images-collapsed") === "1";
      } catch (_) {}
      applyImagesState(collapsed);
      imagesBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          applyImagesState(btn.getAttribute("data-images-mode") === "hide");
        });
      });
    }

    const applyTextsState = (collapsed) => {
      document.body.classList.toggle("texts-collapsed", collapsed);
      textsBtns.forEach((btn) => {
        const mode = btn.getAttribute("data-texts-mode");
        const pressed = collapsed ? mode === "hide" : mode === "show";
        btn.setAttribute("aria-pressed", pressed ? "true" : "false");
      });
      if (typeof window.__birinciSetAllStoryTexts === "function") {
        window.__birinciSetAllStoryTexts(!collapsed);
      } else {
        document.querySelectorAll("article.story").forEach((story) => {
          story.classList.toggle("story--text-hidden", collapsed);
          setStoryModePressed(story, "data-texts-mode", !collapsed);
        });
      }
      try {
        localStorage.setItem("birinci-texts-collapsed", collapsed ? "1" : "0");
      } catch (_) {}
    };

    if (textsToggle && textsBtns.length) {
      let textsCollapsed = false;
      try {
        textsCollapsed = localStorage.getItem("birinci-texts-collapsed") === "1";
      } catch (_) {}
      applyTextsState(textsCollapsed);
      textsBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          applyTextsState(btn.getAttribute("data-texts-mode") === "hide");
        });
      });
    }

    const applyCards = () => {
      if (!cardsList) return;
      const q = searchInput.value.trim().toLocaleLowerCase(LOCALE_TAG);
      const items = Array.from(cardsList.querySelectorAll(".cat-card"));
      items.sort((a, b) => localeCompareAz(a.dataset.title, b.dataset.title));
      items.forEach((item) => cardsList.appendChild(item));
      let visible = 0;
      items.forEach((item) => {
        const hay = `${item.dataset.title || ""} ${item.dataset.blurb || ""}`.toLocaleLowerCase(LOCALE_TAG);
        const show = !q || hay.includes(q);
        item.hidden = !show;
        if (show) visible += 1;
      });
      if (cardsEmpty) cardsEmpty.hidden = visible !== 0;
      syncSearchFilterUi(searchInput.value.trim(), visible);
      paintSearchAndLexicon(cardsPanel || cardsList, searchInput.value.trim());
    };

    const flattenStories = (catalog) => {
      const rows = [];
      (catalog.categories || []).forEach((cat) => {
        (cat.stories || []).forEach((story) => {
          rows.push({
            stem: story.stem,
            title: story.title,
            paragraphs: story.paragraphs || [],
            categoryTitle: cat.title,
            categorySlug: cat.slug,
            hasAudio: !!story.hasAudio,
            hasImage: !!story.hasImage,
            hay: `${story.title || ""} ${(story.paragraphs || []).join(" ")}`.toLocaleLowerCase(LOCALE_TAG),
          });
        });
      });
      return rows;
    };

    const storiesScriptUrl =
      listPanel.getAttribute("data-stories-script") || `assets/stories-data.js?v=${assetVersion}`;

    const loadCatalogViaScript = () => {
      if (window.__BIRINCI_STORIES__) return Promise.resolve(window.__BIRINCI_STORIES__);
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = storiesScriptUrl;
        script.async = true;
        script.onload = () => {
          if (window.__BIRINCI_STORIES__) resolve(window.__BIRINCI_STORIES__);
          else reject(new Error("empty-stories"));
        };
        script.onerror = () => reject(new Error("script-error"));
        document.head.appendChild(script);
      });
    };

    const ensureStories = () => {
      if (allStories) return Promise.resolve(allStories);
      if (loading) return loading;
      loading = Promise.resolve()
        .then(() => {
          if (window.__BIRINCI_STORIES__) return window.__BIRINCI_STORIES__;
          return loadCatalogViaScript();
        })
        .then((catalog) => {
          window.__BIRINCI_STORIES__ = catalog;
          allStories = flattenStories(catalog);
          return allStories;
        })
        .catch(() => {
          allStories = [];
          return allStories;
        })
        .finally(() => {
          loading = null;
        });
      return loading;
    };

    const paragraphsHtml = (paragraphs, stem) => {
      if (!paragraphs.length) return "";
      const last = paragraphs.length - 1;
      const foldAzI = (s) => String(s || "").replace(/[İIı]/g, "i");
      const srcRe = /(internet\s+sources|internet\s+mənb|internet\s+kaynak|открыт\w*\s+источник|интернет|(?:source|mənbə|kaynak|источник|булак|булагы)\s*:)/i;
      const moralRe = /^(ibrət|ibret|moral|мораль|үлгү)\s*:/i;
      const authorSrcStems = { "everyone-has-work-to-do": 1, "weeds-must-be-pulled-from-the-root": 1, "the-silent-corridor": 1, "if-fate-allows-we-will-meet": 1 };
      const authorSrc = !!(stem && authorSrcStems[stem]);
      const lastIsSrc = last >= 0 && (authorSrc || srcRe.test(foldAzI(paragraphs[last] || "")));
      const srcLabel = (I18N.ui && I18N.ui.story_source) || "";
      let moralI = -1;
      for (let j = lastIsSrc ? last - 1 : last; j >= 0; j--) {
        if (moralRe.test(foldAzI(String(paragraphs[j] || "").trim()))) {
          moralI = j;
          break;
        }
      }
      if (moralI < 0) moralI = lastIsSrc && last >= 1 ? last - 1 : last;
      return paragraphs
        .map((p, i) => {
          const isSrc = lastIsSrc && i === last;
          const cls = isSrc ? "story__source" : i === moralI ? "story__moral" : "";
          const text = isSrc && srcLabel && !authorSrc ? srcLabel : p;
          return `<p${cls ? ` class="${cls}"` : ""}>${escapeHtml(text)}</p>`;
        })
        .join("");
    };

    const storyArticleHtml = (story) => {
      const audioAttr = story.hasAudio
        ? ` data-audio="audio/${escapeHtml(story.stem)}.mp3?v=${escapeHtml(assetVersion)}"`
        : "";
      const audioLabel = escapeHtml(tUi("story_audio_label", "Səs"));
      const imageLabel = escapeHtml(tUi("story_image_label", "Şəkil"));
      const textLabel = escapeHtml(tUi("story_text_label", "Mətn"));
      const audioToggle = SHOW_AUDIO_CONTROLS
        ? `
          <div class="story__action-group">
            <span class="tools-bar__label">${audioLabel}</span>
            <div class="tools-bar__views" role="group" aria-label="${audioLabel}">
            <button type="button" class="story-tts tools-bar__view-btn tools-bar__view-btn--icon" data-story-tts data-tts-mode="listen" aria-pressed="false" title="${escapeHtml(tUi("listen", "Mətni dinlə"))}" aria-label="${escapeHtml(tUi("listen", "Mətni dinlə"))}">
              ${STORY_ICONS.listen}
            </button>
            <button type="button" class="story-tts tools-bar__view-btn tools-bar__view-btn--icon" data-story-tts data-tts-mode="stop" aria-pressed="true" title="${escapeHtml(tUi("stop", "Dayandır"))}" aria-label="${escapeHtml(tUi("stop", "Dayandır"))}">
              ${STORY_ICONS.stop}
            </button>
            </div>
          </div>`
        : "";
      const figureToggle = story.hasImage
        ? `
          <div class="story__action-group">
            <span class="tools-bar__label">${imageLabel}</span>
            <div class="tools-bar__views" role="group" aria-label="${imageLabel}">
            <button type="button" class="tools-bar__view-btn tools-bar__view-btn--icon" data-images-mode="show" aria-pressed="true" aria-controls="figure-${escapeHtml(story.stem)}" title="${escapeHtml(tUi("show_image", "Şəkli göstər"))}" aria-label="${escapeHtml(tUi("show_image", "Şəkli göstər"))}">
              ${STORY_ICONS.eye}
            </button>
            <button type="button" class="tools-bar__view-btn tools-bar__view-btn--icon" data-images-mode="hide" aria-pressed="false" aria-controls="figure-${escapeHtml(story.stem)}" title="${escapeHtml(tUi("hide_image", "Şəkli gizlət"))}" aria-label="${escapeHtml(tUi("hide_image", "Şəkli gizlət"))}">
              ${STORY_ICONS["eye-off"]}
            </button>
            </div>
          </div>`
        : "";
      const enlargeLabel = escapeHtml(
        tUi("enlarge_image", "{title} şəklini böyüt").replace("{title}", story.title || "")
      );
      const figAlt = escapeHtml(
        tUi("illustration_alt", "{title} illüstrasiyası").replace("{title}", story.title || "")
      );
      const figureHtml = story.hasImage
        ? `
    <figure class="story__figure" id="figure-${escapeHtml(story.stem)}">
      <button type="button" class="story__figure-open" aria-label="${enlargeLabel}">
        <img src="illustrations/${escapeHtml(story.stem)}.webp" alt="${figAlt}" loading="lazy" width="1536" height="1024" />
      </button>
    </figure>`
        : "";
      return `
<article class="story news-card" id="${escapeHtml(story.stem)}" data-stem="${escapeHtml(story.stem)}" data-title="${escapeHtml(story.title)}"${audioAttr}>
  <div class="card-header">
    <h2 class="card-title story__title">${escapeHtml(story.title)}</h2>
  </div>
  <div class="card-body">
    <div class="story__content">
      <div class="story__panel">
        <div class="story__actions">
          ${audioToggle}
          ${figureToggle}
          <div class="story__action-group">
            <span class="tools-bar__label">${textLabel}</span>
            <div class="tools-bar__views" role="group" aria-label="${textLabel}">
            <button type="button" class="tools-bar__view-btn tools-bar__view-btn--icon" data-texts-mode="show" aria-pressed="true" aria-controls="text-${escapeHtml(story.stem)}" title="${escapeHtml(tUi("show_text", "Mətni göstər"))}" aria-label="${escapeHtml(tUi("show_text", "Mətni göstər"))}">
              ${STORY_ICONS.text}
            </button>
            <button type="button" class="tools-bar__view-btn tools-bar__view-btn--icon" data-texts-mode="hide" aria-pressed="false" aria-controls="text-${escapeHtml(story.stem)}" title="${escapeHtml(tUi("hide_text", "Mətni gizlət"))}" aria-label="${escapeHtml(tUi("hide_text", "Mətni gizlət"))}">
              ${STORY_ICONS["text-off"]}
            </button>
            </div>
          </div>
          <p class="story-tts__note" data-story-tts-note hidden></p>
        </div>
        <div class="story__text card-text" id="text-${escapeHtml(story.stem)}">
          ${paragraphsHtml(story.paragraphs, story.stem)}
        </div>
      </div>
    </div>
    ${figureHtml}
  </div>
</article>`.trim();
    };

    const refreshSidebarNav = (items) => {
      if (navList) {
        navList.innerHTML = items
          .map(
            (s) =>
              `<li data-stem="${escapeHtml(s.stem)}" data-title="${escapeHtml(s.title)}"><a href="#${escapeHtml(
                s.stem
              )}">${escapeHtml(s.title)}</a></li>`
          )
          .join("");
      }
      if (typeof window.__birinciBindStorySidebar === "function") {
        const layout = listPanel.querySelector(".category-layout");
        if (layout) window.__birinciBindStorySidebar(layout);
      }
    };

    const bindHomeNav = () => {
      const layout = listPanel.querySelector(".category-layout");
      if (!layout) return;
      if (typeof window.__birinciBindStorySidebar === "function") {
        window.__birinciBindStorySidebar(layout);
      }
    };

    const renderList = ({ resetWindow = false, force = false } = {}) => {
      if (!storiesList) return;
      if (typeof window.__birinciStopStoryTts === "function") window.__birinciStopStoryTts();
      const q = searchInput.value.trim().toLocaleLowerCase(LOCALE_TAG);
      filtered = (allStories || []).filter((story) => !q || story.hay.includes(q));
      filtered.sort((a, b) => localeCompareAz(a.title, b.title));

      const total = filtered.length;
      syncSearchFilterUi(searchInput.value.trim(), total);
      const cap = Math.max(1, total || 1);
      let n = readBatchSize();
      if (!Number.isFinite(n) || n < 1) n = batchSize || 12;
      if (n > cap) n = cap;
      batchSize = n;
      if (batchSizeInput && String(batchSizeInput.value) !== String(n)) {
        batchSizeInput.value = String(n);
      }
      if (!allMode) {
        try {
          localStorage.setItem(batchSizeStorageKey, String(n));
        } catch (_) {}
      }

      if (resetWindow) {
        windowStart = 0;
        randomStems = null;
      }

      if (pendingStem) {
        const idx = filtered.findIndex(
          (story) => story.stem === pendingStem || story.stem === String(pendingStem)
        );
        if (idx >= 0) {
          randomStems = null;
          if (!allMode) {
            windowStart = Math.floor(idx / batchSize) * batchSize;
          }
        }
      }

      let visibleStories = [];
      if (total === 0) {
        windowStart = 0;
        randomStems = null;
        visibleStories = [];
      } else if (randomStems && randomStems.length) {
        allMode = false;
        const byStem = new Map(filtered.map((story) => [story.stem, story]));
        visibleStories = randomStems.map((stem) => byStem.get(stem)).filter(Boolean);
        if (!visibleStories.length) {
          randomStems = null;
          windowStart = 0;
          visibleStories = filtered.slice(0, batchSize);
        }
      } else if (allMode) {
        randomStems = null;
        windowStart = 0;
        visibleStories = filtered.slice();
      } else {
        randomStems = null;
        const maxStart = Math.max(0, total - 1);
        if (windowStart > maxStart) windowStart = Math.floor(maxStart / batchSize) * batchSize;
        if (windowStart < 0) windowStart = 0;
        visibleStories = filtered.slice(windowStart, windowStart + batchSize);
      }

      const nextKey = `${visibleStories.map((s) => s.stem).join("\n")}|t${total}|a${allMode ? 1 : 0}|b${batchSize}`;
      const reuseDom =
        !force &&
        nextKey === listRenderKey &&
        storiesList.childElementCount === visibleStories.length;

      if (!reuseDom) {
        listRenderKey = nextKey;
        storiesList.innerHTML = visibleStories.map(storyArticleHtml).join("");
        hideAudioChrome(storiesList);
        if (typeof window.__birinciSetAllStoryFigures === "function") {
          window.__birinciSetAllStoryFigures(!document.body.classList.contains("images-collapsed"));
        }
        if (typeof window.__birinciSetAllStoryTexts === "function") {
          window.__birinciSetAllStoryTexts(!document.body.classList.contains("texts-collapsed"));
        }
        refreshSidebarNav(visibleStories);
        if (typeof window.__birinciClearListenQueue === "function") {
          window.__birinciClearListenQueue({ keepTrack: true });
        }
      }
      if (listEmpty) listEmpty.hidden = total !== 0;
      syncBatchUi(visibleStories.length);
      persistAllMode();
      writeUrlState();
      if (pendingStem) {
        const el = document.getElementById(pendingStem);
        if (el) {
          window.requestAnimationFrame(() => {
            el.scrollIntoView({ block: "start", behavior: "auto" });
          });
        }
        pendingStem = null;
      }
      paintSearchAndLexicon(listPanel || storiesList, searchInput.value.trim());
    };

    const setHidden = (el, hide) => {
      if (!el) return;
      el.hidden = !!hide;
      if (hide) el.setAttribute("hidden", "");
      else el.removeAttribute("hidden");
    };

    const applyHomeViewChrome = () => {
      setHidden(cardsPanel, view !== "cards");
      setHidden(listPanel, view !== "list");
      viewBtns.forEach((btn) => {
        btn.setAttribute("aria-pressed", btn.getAttribute("data-home-view") === view ? "true" : "false");
      });
      listOnly.forEach((el) => {
        setHidden(el, view !== "list");
      });
    };

    const setView = (nextView, { persist = true, scrollTools = true, forceList = false, animate = true } = {}) => {
      const prevView = view;
      view = nextView === "list" ? "list" : "cards";
      window.__birinciHomeView = view;
      try {
        document.documentElement.setAttribute("data-home-view", view);
      } catch (_) {}
      if (persist) {
        try {
          localStorage.setItem(viewStorageKey, view);
        } catch (_) {}
      }
      const transition = animate ? runViewTransition : (fn) => fn();
      if (view === "cards") {
        if (typeof window.__birinciStopStoryTts === "function") window.__birinciStopStoryTts();
        transition(() => {
          applyHomeViewChrome();
          applyCards();
        });
        writeUrlState();
        return;
      }
      writeUrlState();
      try {
        bindHomeNav();
      } catch (_) {}
      const maybeScrollTools = () => {
        if (!scrollTools || prevView === "list") return;
        if (typeof window.__birinciScrollHomeTools === "function") {
          window.__birinciScrollHomeTools();
          return;
        }
        window.scrollTo(0, 0);
      };
      // Show list chrome immediately so the switch never waits on fetch.
      transition(() => {
        applyHomeViewChrome();
      });
      ensureStories()
        .then(() => {
          const needsDomPaint =
            forceList || !listRenderKey || !storiesList.childElementCount;
          if (needsDomPaint) {
            transition(() => renderList({ force: forceList }));
          } else {
            renderList();
          }
          maybeScrollTools();
        })
        .catch(() => {
          if (listEmpty) listEmpty.hidden = false;
          maybeScrollTools();
        });
      maybeScrollTools();
    };

    const onViewButton = (event) => {
      const btn = event.target.closest("[data-home-view]");
      if (!btn || !bar.contains(btn)) return;
      const next = btn.getAttribute("data-home-view");
      if (next !== "list" && next !== "cards") return;
      // Re-clicking the active list control recovers a stalled list; cards↔list reuses DOM.
      pendingStem = null;
      setView(next, { forceList: next === "list" && view === "list" });
    };
    viewBtns.forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        onViewButton(event);
      });
    });
    bar.addEventListener("click", onViewButton);

    searchInput.addEventListener("input", () => {
      if (view === "cards") {
        applyCards();
        return;
      }
      pendingStem = null;
      renderList({ resetWindow: true });
    });
    if (batchSizeInput) {
      batchSizeInput.addEventListener("change", () => {
        commitBatchSize({ persist: true, render: true });
      });
      batchSizeInput.addEventListener("blur", () => {
        commitBatchSize({ persist: true, render: true });
      });
      batchSizeInput.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        commitBatchSize({ persist: true, render: true });
        batchSizeInput.blur();
      });
    }
    const runBatchAction = (action) => {
      if (view !== "list") return;
      const total = filtered.length;
      const scrollHomeTools = () => {
        if (typeof window.__birinciScrollHomeTools === "function") {
          window.__birinciScrollHomeTools();
        }
      };
      if (!total) {
        randomStems = null;
        windowStart = 0;
        persistBatchSize();
        persistAllMode();
        renderList();
        return;
      }
      if (action === "all") {
        if (allMode && !randomStems) {
          allMode = false;
        } else {
          allMode = true;
          randomStems = null;
        }
        windowStart = 0;
        persistBatchSize();
        persistAllMode();
        pendingStem = null;
        renderList();
        scrollHomeTools();
        return;
      }
      if (action === "dec") {
        applyPageSize(batchSize - 1, { persist: true, render: true });
        scrollHomeTools();
        return;
      }
      if (action === "inc") {
        applyPageSize(batchSize + 1, { persist: true, render: true });
        scrollHomeTools();
        return;
      }
      if (action === "prev") {
        allMode = false;
        if (randomStems) {
          randomStems = null;
          windowStart = 0;
        } else {
          windowStart = Math.max(0, windowStart - batchSize);
        }
      } else if (action === "next") {
        allMode = false;
        randomStems = null;
        if (windowStart + batchSize < total) {
          windowStart += batchSize;
        }
      } else if (action === "random") {
        allMode = false;
        randomStems = pickRandomStems(batchSize);
      } else {
        return;
      }
      persistBatchSize();
      persistAllMode();
      pendingStem = null;
      renderList();
      scrollHomeTools();
    };
    if (batchDecBtn) batchDecBtn.addEventListener("click", () => runBatchAction("dec"));
    if (batchIncBtn) batchIncBtn.addEventListener("click", () => runBatchAction("inc"));
    if (batchPrevBtn) {
      batchPrevBtn.addEventListener("click", () => runBatchAction("prev"));
    }
    if (batchNextBtn) {
      batchNextBtn.addEventListener("click", () => runBatchAction("next"));
    }
    if (batchRandomBtn) {
      batchRandomBtn.addEventListener("click", () => runBatchAction("random"));
    }
    if (batchAllBtn) {
      batchAllBtn.addEventListener("click", () => runBatchAction("all"));
    }

    const urlState = readUrlState();
    let initialView = "cards";
    // Prefer view already chosen by the inline bootstrap (avoids reset race).
    if (window.__birinciHomeView === "list" || window.__birinciHomeView === "cards") {
      initialView = window.__birinciHomeView;
    } else if (urlState.view === "list" || urlState.view === "cards") {
      initialView = urlState.view;
    } else {
      try {
        const stored = localStorage.getItem(viewStorageKey);
        if (stored === "list" || stored === "cards") initialView = stored;
      } catch (_) {}
    }
    if (urlState.stem) {
      initialView = "list";
      pendingStem = urlState.stem;
    }
    if (urlState.q) searchInput.value = urlState.q;
    const batchFromUrl = Number(urlState.batch || "");
    if (Number.isFinite(batchFromUrl) && batchFromUrl > 0) {
      batchSize = Math.floor(batchFromUrl);
      if (batchSizeInput) batchSizeInput.value = String(batchSize);
      try {
        localStorage.setItem(batchSizeStorageKey, String(batchSize));
      } catch (_) {}
    }
    const startFromUrl = Number(urlState.start || "");
    if (Number.isFinite(startFromUrl) && startFromUrl > 0) {
      windowStart = Math.floor(startFromUrl);
    }
    window.__birinciListStart = windowStart;

    try {
      setView(initialView, { persist: false, scrollTools: false, animate: false });
    } catch (_) {
      setHidden(cardsPanel, initialView !== "cards");
      setHidden(listPanel, initialView !== "list");
    }
  };

  const initStoryTts = () => {
    const unsupportedMessage =
      "Hörmətli oxucu, təəssüf ki, bu cihazda və ya brauzerdə səsə çevirmə (TTS) xidməti mövcud deyil. Zəhmət olmasa hekayəni oxuyaraq davam edin.";
    const noVoiceMessage =
      "Hörmətli oxucu, bu cihazda Azərbaycan nitq səsi tapılmadı.";
    const failedMessage =
      "Hörmətli oxucu, hazırda səsə çevirməni başlatmaq mümkün olmadı. Zəhmət olmasa bir az sonra yenidən cəhd edin və ya hekayəni oxuyun.";
    const audioFailedMessage =
      "Hörmətli oxucu, səs faylını oxumaq mümkün olmadı. Zəhmət olmasa bir az sonra yenidən cəhd edin.";

    const SPEED_STEPS = [0.75, 1, 1.25, 1.5, 1.75, 2];
    const SPEED_KEY = "birinci-audio-rate";
    const VOLUME_KEY = "birinci-audio-volume";
    const MUTE_KEY = "birinci-audio-muted";

    let activeBtn = null;
    let activeStem = "";
    let utterance = null;
    let audioPlayer = null;
    let suppressError = false;
    let ignoreClicksUntil = 0;
    let startGuardUntil = 0;
    let playerShell = null;
    let playerEls = null;
    let seeking = false;
    let playbackRate = 1;
    let savedVolume = 1;
    let savedMuted = false;
    let objectUrl = "";
    let activeSourceKey = "";
    let loadToken = 0;
    let speakToken = 0;
    let fetchController = null;
    let queueActive = false;
    let queueStems = [];
    let queueIndex = 0;

    const setLabel = (btn, text) => {
      if (!btn) return;
      btn.setAttribute("aria-label", text);
      btn.setAttribute("title", text);
    };

    const showNote = (btn, message) => {
      const root =
        (btn && btn.closest(".story__actions, .text-lightbox__tts")) ||
        (btn && btn.parentElement);
      const note = root && root.querySelector("[data-story-tts-note]");
      if (!note) return;
      note.hidden = !message;
      note.textContent = message || "";
    };

    const resolveStory = (btn) => {
      if (!btn) return null;
      const nested = btn.closest("article.story");
      if (nested) return nested;
      const stem = (btn.getAttribute("data-story-stem") || "").trim();
      if (!stem) return null;
      return (
        document.getElementById(stem) ||
        document.querySelector(`article.story[data-stem="${stem}"]`)
      );
    };

    const stemFor = (btn) => {
      if (!btn) return "";
      const fromAttr = (btn.getAttribute("data-story-stem") || "").trim();
      if (fromAttr) return fromAttr;
      const story = resolveStory(btn);
      return ((story && (story.dataset.stem || story.id)) || "").trim();
    };

    const titleFor = (btn, story) => {
      const fromStory = ((story && story.dataset.title) || "").trim();
      if (fromStory) return fromStory;
      const titleNode =
        story &&
        (story.querySelector(".story__title, .card-title") || story.querySelector("h2"));
      if (titleNode) return titleNode.textContent.trim();
      return "Hekayə";
    };

    const escapeStem = (stem) =>
      window.CSS && typeof window.CSS.escape === "function"
        ? window.CSS.escape(stem)
        : stem.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

    const buttonsForStem = (stem, btn) => {
      const buttons = new Set();
      if (btn) buttons.add(btn);
      if (!stem) return buttons;
      const esc = escapeStem(stem);
      document
        .querySelectorAll(
          `[data-story-tts][data-story-stem="${esc}"], article.story[data-stem="${esc}"] [data-story-tts], article.story#${esc} [data-story-tts]`
        )
        .forEach((el) => buttons.add(el));
      return buttons;
    };

    const syncTtsPairUi = (btn, state) => {
      const stem = stemFor(btn) || activeStem;
      const roots = new Set();
      buttonsForStem(stem, btn).forEach((el) => {
        const root = el.closest(".tools-bar__views") || el.parentElement;
        if (root) roots.add(root);
      });
      const listenOn = state === "playing" || state === "paused";
      roots.forEach((root) => {
        root.querySelectorAll("[data-tts-mode]").forEach((el) => {
          const mode = el.getAttribute("data-tts-mode");
          const pressed = listenOn ? mode === "listen" : mode === "stop";
          el.setAttribute("aria-pressed", pressed ? "true" : "false");
          el.setAttribute("data-tts-state", state);
        });
      });
    };

    const syncPlayingUi = (btn, playing) => {
      syncTtsPairUi(btn, playing ? "playing" : "idle");
    };

    const syncPausedUi = (btn) => {
      syncTtsPairUi(btn, "paused");
    };

    const formatTime = (seconds) => {
      if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
      const total = Math.floor(seconds);
      const m = Math.floor(total / 60);
      const s = total % 60;
      return `${m}:${String(s).padStart(2, "0")}`;
    };

    const readPrefs = () => {
      try {
        const rate = Number(localStorage.getItem(SPEED_KEY));
        if (SPEED_STEPS.includes(rate)) playbackRate = rate;
      } catch (_) {}
      try {
        const vol = Number(localStorage.getItem(VOLUME_KEY));
        if (Number.isFinite(vol) && vol >= 0 && vol <= 1) savedVolume = vol;
      } catch (_) {}
      try {
        savedMuted = localStorage.getItem(MUTE_KEY) === "1";
      } catch (_) {}
    };

    const writePrefs = () => {
      try {
        localStorage.setItem(SPEED_KEY, String(playbackRate));
        localStorage.setItem(VOLUME_KEY, String(savedVolume));
        localStorage.setItem(MUTE_KEY, savedMuted ? "1" : "0");
      } catch (_) {}
    };

    const updatePlayButton = (playing) => {
      if (!playerEls || !playerEls.playBtn) return;
      playerEls.playBtn.setAttribute("aria-label", playing ? "Fasilə" : "Oynat");
      playerEls.playBtn.setAttribute("aria-pressed", playing ? "true" : "false");
      playerEls.playBtn.innerHTML = playing
        ? '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"></rect><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"></rect></svg>'
        : '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><polygon points="8 5 20 12 8 19" fill="currentColor"></polygon></svg>';
    };

    const updateSpeedLabel = () => {
      if (!playerEls || !playerEls.speedBtns) return;
      playerEls.speedBtns.forEach((btn) => {
        const rate = Number(btn.getAttribute("data-speed"));
        const active = rate === playbackRate;
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
    };

    const updateMuteUi = () => {
      if (!playerEls) return;
      if (playerEls.muteBtn) {
        playerEls.muteBtn.setAttribute("aria-pressed", savedMuted ? "true" : "false");
        playerEls.muteBtn.setAttribute("aria-label", savedMuted ? "Səsi aç" : "Səssiz");
        playerEls.muteBtn.innerHTML = savedMuted
          ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>'
          : '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>';
      }
      if (playerEls.volume) {
        playerEls.volume.value = String(savedMuted ? 0 : savedVolume);
      }
    };

    const updateProgressUi = () => {
      if (!audioPlayer || !playerEls) return;
      const duration = Number.isFinite(audioPlayer.duration) ? audioPlayer.duration : 0;
      const current = Number.isFinite(audioPlayer.currentTime) ? audioPlayer.currentTime : 0;
      if (playerEls.current) playerEls.current.textContent = formatTime(current);
      if (playerEls.duration) playerEls.duration.textContent = formatTime(duration);
      if (playerEls.seek && !seeking) {
        playerEls.seek.max = String(duration || 0);
        playerEls.seek.value = String(current || 0);
      }
    };

    const applyAudioSettings = () => {
      if (!audioPlayer) return;
      audioPlayer.playbackRate = playbackRate;
      audioPlayer.volume = savedVolume;
      audioPlayer.muted = savedMuted;
      updateSpeedLabel();
      updateMuteUi();
    };

    const syncAudioPlayerInset = () => {
      if (!playerShell || playerShell.hidden) {
        document.documentElement.style.removeProperty("--audio-player-h");
        return;
      }
      const h = Math.ceil(playerShell.getBoundingClientRect().height || 0);
      if (h > 0) {
        document.documentElement.style.setProperty("--audio-player-h", `${h}px`);
      }
    };

    const hidePlayerShell = () => {
      if (!playerShell) return;
      playerShell.hidden = true;
      playerShell.setAttribute("hidden", "");
      document.body.classList.remove("audio-player-open");
      syncAudioPlayerInset();
    };

    const showPlayerShell = () => {
      if (!playerShell) return;
      playerShell.hidden = false;
      playerShell.removeAttribute("hidden");
      document.body.classList.add("audio-player-open");
      syncAudioPlayerInset();
      window.requestAnimationFrame(syncAudioPlayerInset);
    };

    const clearActive = () => {
      if (activeBtn) syncPlayingUi(activeBtn, false);
      activeBtn = null;
      activeStem = "";
      utterance = null;
    };

    const revokeObjectUrl = () => {
      if (!objectUrl) return;
      try {
        URL.revokeObjectURL(objectUrl);
      } catch (_) {}
      objectUrl = "";
    };

    const stopAudioElement = ({ clearSrc = true } = {}) => {
      if (fetchController) {
        try {
          fetchController.abort();
        } catch (_) {}
        fetchController = null;
      }
      if (!audioPlayer) return;
      try {
        audioPlayer.pause();
      } catch (_) {}
      if (clearSrc) {
        try {
          audioPlayer.removeAttribute("src");
          audioPlayer.load();
        } catch (_) {}
        revokeObjectUrl();
        activeSourceKey = "";
      }
    };

    const stopCurrentMedia = () => {
      suppressError = true;
      loadToken += 1;
      speakToken += 1;
      stopAudioElement({ clearSrc: true });
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      window.setTimeout(() => {
        suppressError = false;
      }, 120);
    };

    const clearQueue = ({ keepTrack = true } = {}) => {
      queueActive = false;
      queueStems = [];
      queueIndex = 0;
      if (!keepTrack) highlightPlaying(null);
      updateQueueChrome();
      syncPlayVisibleButton();
    };

    const idleProbeForStem = (stem) => {
      if (!stem) return null;
      const esc = escapeStem(stem);
      return document.querySelector(
        `[data-story-tts][data-story-stem="${esc}"], article.story[data-stem="${esc}"] [data-story-tts], article.story#${esc} [data-story-tts]`
      );
    };

    const closePlayer = () => {
      const btn = activeBtn;
      const stem = activeStem;
      clearQueue({ keepTrack: false });
      hidePlayerShell();
      stopCurrentMedia();
      const probe = btn || idleProbeForStem(stem);
      if (probe) syncTtsPairUi(probe, "idle");
      activeBtn = null;
      activeStem = "";
      utterance = null;
      updatePlayButton(false);
      updateProgressUi();
      syncPlayVisibleButton();
    };

    const stopSpeech = () => {
      closePlayer();
    };

    window.__birinciStopStoryTts = stopSpeech;
    window.__birinciIgnoreStoryTtsClicks = (ms) => {
      ignoreClicksUntil = Date.now() + Math.max(0, Number(ms) || 0);
    };
    window.__birinciSyncStoryTtsUi = (stem, playing) => {
      if (!stem) return;
      const probe = document.querySelector(
        `[data-story-tts][data-story-stem="${escapeStem(stem)}"], article.story[data-stem="${escapeStem(stem)}"] [data-story-tts], article.story#${escapeStem(stem)} [data-story-tts]`
      );
      if (probe) {
        if (playing) syncPlayingUi(probe, true);
        else if (window.__birinciIsStoryAudioActive(stem)) syncPausedUi(probe);
        else syncPlayingUi(probe, false);
      }
    };
    window.__birinciIsStoryAudioActive = (stem) =>
      !!(stem && activeStem === stem && playerShell && !playerShell.hidden);

    const isActivelyPlaying = () => {
      if (audioPlayer && !audioPlayer.paused && !audioPlayer.ended) return true;
      if (window.speechSynthesis && window.speechSynthesis.speaking) return true;
      return false;
    };

    const isSameStoryActive = (btn) => {
      if (!btn) return false;
      const stem = stemFor(btn);
      if (stem && activeStem) return stem === activeStem;
      if (activeBtn === btn) return true;
      if (activeBtn) {
        const a = activeBtn.closest(".tools-bar__views");
        const b = btn.closest(".tools-bar__views");
        if (a && b && a === b) return true;
      }
      return false;
    };

    const collectVisibleStems = () =>
      Array.from(document.querySelectorAll("article.story"))
        .filter((el) => !el.hidden && !el.closest("[hidden]"))
        .map((el) => (el.dataset.stem || el.id || "").trim())
        .filter(Boolean);

    const storyElForStem = (stem) => {
      if (!stem) return null;
      const esc = escapeStem(stem);
      return (
        document.getElementById(stem) ||
        document.querySelector(`article.story[data-stem="${esc}"]`)
      );
    };

    const listenBtnForStem = (stem) => {
      const story = storyElForStem(stem);
      return (
        (story && story.querySelector('[data-tts-mode="listen"]')) ||
        (story && story.querySelector("[data-story-tts]")) ||
        null
      );
    };

    const isPausedPlayback = () => {
      if (audioPlayer && audioPlayer.src && audioPlayer.paused && !audioPlayer.ended) return true;
      if (window.speechSynthesis && window.speechSynthesis.paused) return true;
      return false;
    };

    const highlightPlaying = (story, { scroll = false } = {}) => {
      document.querySelectorAll("article.story.story--playing").forEach((el) => {
        el.classList.remove("story--playing");
      });
      if (!story) return;
      story.classList.add("story--playing");
      if (scroll) {
        try {
          story.scrollIntoView({ block: "start", behavior: "smooth" });
        } catch (_) {}
      }
    };

    const syncPlayVisibleButton = () => {
      const stems = collectVisibleStems();
      const listenOn = queueActive && (isActivelyPlaying() || isPausedPlayback());
      const base = tUi("listen_page", "Səhifəni dinlə");
      const stop = tUi("stop", "Dayandır");
      const suffix = tUi("stories_count_suffix", "hekayə");
      const listenLabel = stems.length ? `${base} · ${stems.length} ${suffix}` : base;
      document.querySelectorAll("[data-tools-play-visible]").forEach((btn) => {
        btn.disabled = stems.length === 0;
        const mode = btn.getAttribute("data-tts-mode") || "listen";
        const pressed = listenOn ? mode === "listen" : mode === "stop";
        btn.setAttribute("aria-pressed", pressed ? "true" : "false");
        if (mode === "listen") {
          btn.title = listenLabel;
          btn.setAttribute("aria-label", listenLabel);
        } else {
          btn.title = stop;
          btn.setAttribute("aria-label", stop);
        }
      });
    };

    const updateQueueChrome = (title) => {
      if (!playerEls) return;
      const hasQueue = queueActive && queueStems.length > 0;
      if (playerShell) playerShell.classList.toggle("audio-player--queue", hasQueue);
      if (playerEls.storyPrev) {
        playerEls.storyPrev.hidden = !hasQueue;
        playerEls.storyPrev.disabled = !hasQueue || queueIndex <= 0;
      }
      if (playerEls.storyNext) {
        playerEls.storyNext.hidden = !hasQueue;
        playerEls.storyNext.disabled = !hasQueue || queueIndex >= queueStems.length - 1;
      }
      if (playerEls.title) {
        if (title) {
          playerEls.title.textContent = hasQueue
            ? `${queueIndex + 1} / ${queueStems.length}  ·  ${title}`
            : title;
        } else if (!hasQueue) {
          playerEls.title.textContent = String(playerEls.title.textContent || "").replace(
            /^\d+\s*\/\s*\d+\s*·\s*/,
            ""
          );
        }
      }
    };

    const sameVisibleQueue = () => {
      if (!queueActive) return false;
      const now = collectVisibleStems();
      return (
        now.length === queueStems.length && now.every((stem, i) => stem === queueStems[i])
      );
    };

    const pauseCurrent = () => {
      if (audioPlayer && audioPlayer.src && !audioPlayer.paused && !audioPlayer.ended) {
        audioPlayer.pause();
        return;
      }
      if (window.speechSynthesis && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        if (activeBtn) syncPausedUi(activeBtn);
        updatePlayButton(false);
      }
    };

    const resumeCurrent = () => {
      if (audioPlayer && audioPlayer.src && audioPlayer.paused) {
        const start = audioPlayer.play();
        if (start && typeof start.catch === "function") {
          start.catch(() => showNote(activeBtn, audioFailedMessage));
        }
        return;
      }
      if (window.speechSynthesis && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        if (activeBtn) markPlaying(activeBtn, true);
      }
    };

    const loadVoices = () =>
      new Promise((resolve) => {
        if (!window.speechSynthesis) {
          resolve([]);
          return;
        }
        const current = () => window.speechSynthesis.getVoices() || [];
        const now = current();
        if (now.length) {
          resolve(now);
          return;
        }
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          window.speechSynthesis.onvoiceschanged = null;
          resolve(current());
        };
        window.speechSynthesis.onvoiceschanged = finish;
        window.setTimeout(finish, 800);
      });

    const warmVoices = () => {
      if (!window.speechSynthesis) return;
      try {
        window.speechSynthesis.getVoices();
      } catch (_) {}
    };
    document.addEventListener("pointerdown", warmVoices, { once: true, passive: true });

    const pickVoice = (voices) => {
      const lang = String(LOCALE_TAG || "az").toLowerCase();
      const nameRe = {
        az: /azərbaycan|azerbaijani/i,
        en: /english/i,
        ru: /russian|русск/i,
        tr: /turkish|türk/i,
        ky: /kyrgyz|kirghiz|кыргыз/i,
      }[lang];
      const byLang = voices.find((v) => (v.lang || "").toLowerCase().startsWith(lang));
      const byName = nameRe ? voices.find((v) => nameRe.test(v.name || "")) : null;
      const turkicFallback =
        lang === "az" || lang === "ky"
          ? voices.find((v) => (v.lang || "").toLowerCase().startsWith("tr")) ||
            voices.find((v) => /turkish|türk/i.test(v.name || ""))
          : null;
      return byLang || byName || turkicFallback || null;
    };

    const textForSpeech = (story) => {
      const textEl = story && story.querySelector(".story__text");
      const title = ((story && story.dataset.title) || "").trim();
      const paras = textEl
        ? Array.from(textEl.querySelectorAll("p"))
            .map((p) => p.textContent.replace(/\s+/g, " ").trim())
            .filter(Boolean)
        : [];
      let body = paras.join(" ");
      body = body
        .replace(/[\u00AD\u200B-\u200D\uFEFF]/g, "")
        .replace(/[«»„“”]/g, "")
        .replace(/[‘’']/g, "")
        .replace(/[—–-]+\s*/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (!body) return title;
      if (title && body.toLocaleLowerCase(LOCALE_TAG).startsWith(title.toLocaleLowerCase(LOCALE_TAG))) {
        return body;
      }
      return title ? `${title}. ${body}` : body;
    };

    const resolveAudioUrl = (src) => {
      try {
        return new URL(src, document.baseURI).href;
      } catch (_) {
        return src;
      }
    };

    const markPlaying = (btn, playing = true) => {
      activeBtn = btn;
      activeStem = stemFor(btn);
      startGuardUntil = Date.now() + 450;
      syncPlayingUi(btn, playing);
      showNote(btn, "");
      updatePlayButton(playing);
    };

    const ensurePlayer = () => {
      if (playerShell && playerEls && audioPlayer) return playerEls;
      readPrefs();
      playerShell = document.createElement("div");
      playerShell.className = "audio-player";
      playerShell.hidden = true;
      playerShell.setAttribute("hidden", "");
      playerShell.setAttribute("role", "region");
      playerShell.setAttribute("aria-label", "Səs pleyeri");
      playerShell.innerHTML = `
        <div class="audio-player__inner">
          <div class="audio-player__meta">
            <p class="audio-player__title" data-audio-title>Hekayə</p>
          </div>
          <div class="audio-player__progress">
            <span class="audio-player__time" data-audio-current>0:00</span>
            <input class="audio-player__seek" data-audio-seek type="range" min="0" max="0" value="0" step="0.1" aria-label="İrəliləmə" />
            <span class="audio-player__time audio-player__time--duration" data-audio-duration>0:00</span>
          </div>
          <div class="audio-player__controls">
            <button type="button" class="audio-player__btn audio-player__btn--story" data-audio-story-prev hidden aria-label="${tUi("queue_prev", "Əvvəlki hekayə")}">⏮</button>
            <button type="button" class="audio-player__btn" data-audio-skip-back aria-label="15 saniyə geriyə">−15</button>
            <button type="button" class="audio-player__btn audio-player__btn--play" data-audio-play aria-label="Oynat" aria-pressed="false"></button>
            <button type="button" class="audio-player__btn" data-audio-skip-fwd aria-label="15 saniyə irəli">+15</button>
            <button type="button" class="audio-player__btn audio-player__btn--story" data-audio-story-next hidden aria-label="${tUi("queue_next", "Növbəti hekayə")}">⏭</button>
            <div class="audio-player__speed" data-audio-speed role="group" aria-label="Sürət">
              <span class="audio-player__speed-label">Sürət</span>
              <button type="button" class="audio-player__speed-btn" data-speed="0.75" aria-pressed="false">0.75×</button>
              <button type="button" class="audio-player__speed-btn" data-speed="1" aria-pressed="true">1×</button>
              <button type="button" class="audio-player__speed-btn" data-speed="1.25" aria-pressed="false">1.25×</button>
              <button type="button" class="audio-player__speed-btn" data-speed="1.5" aria-pressed="false">1.5×</button>
              <button type="button" class="audio-player__speed-btn" data-speed="1.75" aria-pressed="false">1.75×</button>
              <button type="button" class="audio-player__speed-btn" data-speed="2" aria-pressed="false">2×</button>
            </div>
            <div class="audio-player__volume-wrap">
              <button type="button" class="audio-player__btn" data-audio-mute aria-label="Səssiz" aria-pressed="false"></button>
              <input class="audio-player__volume" data-audio-volume type="range" min="0" max="1" value="1" step="0.01" aria-label="Səs səviyyəsi" />
            </div>
            <button type="button" class="audio-player__btn audio-player__btn--close" data-audio-close aria-label="Pleyeri bağla">&times;</button>
          </div>
        </div>
        <audio data-audio-el preload="auto" playsinline webkit-playsinline></audio>
      `.trim();
      document.body.appendChild(playerShell);

      audioPlayer = playerShell.querySelector("[data-audio-el]");
      playerEls = {
        title: playerShell.querySelector("[data-audio-title]"),
        current: playerShell.querySelector("[data-audio-current]"),
        duration: playerShell.querySelector("[data-audio-duration]"),
        seek: playerShell.querySelector("[data-audio-seek]"),
        playBtn: playerShell.querySelector("[data-audio-play]"),
        storyPrev: playerShell.querySelector("[data-audio-story-prev]"),
        storyNext: playerShell.querySelector("[data-audio-story-next]"),
        skipBack: playerShell.querySelector("[data-audio-skip-back]"),
        skipFwd: playerShell.querySelector("[data-audio-skip-fwd]"),
        speedGroup: playerShell.querySelector("[data-audio-speed]"),
        speedBtns: Array.from(playerShell.querySelectorAll("[data-speed]")),
        muteBtn: playerShell.querySelector("[data-audio-mute]"),
        volume: playerShell.querySelector("[data-audio-volume]"),
        closeBtn: playerShell.querySelector("[data-audio-close]"),
      };

      updatePlayButton(false);
      updateSpeedLabel();
      updateMuteUi();
      applyAudioSettings();

      if (typeof ResizeObserver !== "undefined") {
        const audioRo = new ResizeObserver(() => syncAudioPlayerInset());
        audioRo.observe(playerShell);
      }
      window.addEventListener("resize", syncAudioPlayerInset, { passive: true });
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", syncAudioPlayerInset, { passive: true });
      }

      playerEls.playBtn.addEventListener("click", () => {
        if (utterance && window.speechSynthesis) {
          if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) pauseCurrent();
          else if (window.speechSynthesis.paused) resumeCurrent();
          return;
        }
        if (!audioPlayer || !audioPlayer.src) return;
        if (audioPlayer.paused) {
          const start = audioPlayer.play();
          if (start && typeof start.catch === "function") {
            start.catch(() => showNote(activeBtn, audioFailedMessage));
          }
        } else {
          audioPlayer.pause();
        }
      });
      if (playerEls.storyPrev) {
        playerEls.storyPrev.addEventListener("click", () => {
          if (typeof window.__birinciQueuePrev === "function") window.__birinciQueuePrev();
        });
      }
      if (playerEls.storyNext) {
        playerEls.storyNext.addEventListener("click", () => {
          if (typeof window.__birinciQueueNext === "function") window.__birinciQueueNext();
        });
      }

      playerEls.skipBack.addEventListener("click", () => {
        if (!audioPlayer) return;
        audioPlayer.currentTime = Math.max(0, (audioPlayer.currentTime || 0) - 15);
        updateProgressUi();
      });

      playerEls.skipFwd.addEventListener("click", () => {
        if (!audioPlayer) return;
        const duration = Number.isFinite(audioPlayer.duration) ? audioPlayer.duration : 0;
        const next = (audioPlayer.currentTime || 0) + 15;
        audioPlayer.currentTime = duration ? Math.min(duration, next) : next;
        updateProgressUi();
      });

      playerEls.speedBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const rate = Number(btn.getAttribute("data-speed"));
          if (!SPEED_STEPS.includes(rate)) return;
          playbackRate = rate;
          if (audioPlayer) audioPlayer.playbackRate = playbackRate;
          updateSpeedLabel();
          writePrefs();
        });
      });

      playerEls.muteBtn.addEventListener("click", () => {
        savedMuted = !savedMuted;
        if (audioPlayer) audioPlayer.muted = savedMuted;
        updateMuteUi();
        writePrefs();
      });

      playerEls.volume.addEventListener("input", () => {
        const next = Number(playerEls.volume.value);
        savedVolume = Number.isFinite(next) ? Math.min(1, Math.max(0, next)) : 1;
        savedMuted = savedVolume === 0;
        if (audioPlayer) {
          audioPlayer.volume = savedVolume;
          audioPlayer.muted = savedMuted;
        }
        updateMuteUi();
        writePrefs();
      });

      const onSeekInput = () => {
        seeking = true;
        if (playerEls.current) {
          playerEls.current.textContent = formatTime(Number(playerEls.seek.value) || 0);
        }
      };
      const onSeekCommit = () => {
        if (!audioPlayer) {
          seeking = false;
          return;
        }
        audioPlayer.currentTime = Number(playerEls.seek.value) || 0;
        seeking = false;
        updateProgressUi();
      };
      playerEls.seek.addEventListener("input", onSeekInput);
      playerEls.seek.addEventListener("change", onSeekCommit);
      playerEls.seek.addEventListener("pointerup", onSeekCommit);
      playerEls.seek.addEventListener("touchend", onSeekCommit);

      playerEls.closeBtn.addEventListener("click", () => closePlayer());

      audioPlayer.addEventListener("timeupdate", updateProgressUi);
      audioPlayer.addEventListener("loadedmetadata", updateProgressUi);
      audioPlayer.addEventListener("durationchange", updateProgressUi);
      audioPlayer.addEventListener("play", () => {
        if (activeBtn) markPlaying(activeBtn, true);
        else updatePlayButton(true);
        syncPlayVisibleButton();
      });
      audioPlayer.addEventListener("pause", () => {
        if (playerShell && playerShell.hidden) {
          updatePlayButton(false);
          syncPlayVisibleButton();
          return;
        }
        if (audioPlayer && !audioPlayer.ended && activeBtn) syncPausedUi(activeBtn);
        updatePlayButton(false);
        syncPlayVisibleButton();
      });
      audioPlayer.addEventListener("ended", () => {
        updatePlayButton(false);
        updateProgressUi();
        if (queueActive) {
          if (typeof window.__birinciQueueAdvance === "function") window.__birinciQueueAdvance();
          return;
        }
        if (playerShell && playerShell.hidden) {
          syncPlayVisibleButton();
          return;
        }
        if (activeBtn) syncPausedUi(activeBtn);
        syncPlayVisibleButton();
      });
      audioPlayer.addEventListener("error", () => {
        if (suppressError) return;
        const btn = activeBtn;
        if (queueActive) {
          if (btn) showNote(btn, audioFailedMessage);
          if (typeof window.__birinciQueueAdvance === "function") window.__birinciQueueAdvance();
          return;
        }
        closePlayer();
        if (btn) showNote(btn, audioFailedMessage);
      });

      return playerEls;
    };

    const startPlayback = (btn) => {
      applyAudioSettings();
      updateProgressUi();
      markPlaying(btn, true);
      const start = audioPlayer.play();
      if (start && typeof start.catch === "function") {
        start.catch(() => {
          if (queueActive) {
            showNote(btn, audioFailedMessage);
            advanceQueue();
            return;
          }
          closePlayer();
          showNote(btn, audioFailedMessage);
        });
      }
    };

    const openPlayer = ({ btn, src, title, stem }) => {
      ensurePlayer();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      utterance = null;

      const absolute = resolveAudioUrl(src);
      const sameTrack = activeSourceKey === absolute && !!audioPlayer && !!audioPlayer.src;

      activeBtn = btn;
      activeStem = stem || stemFor(btn);
      startGuardUntil = Date.now() + 450;
      showNote(btn, "");
      if (playerEls.title) {
        const rawTitle = title || "Hekayə";
        playerEls.title.textContent =
          queueActive && queueStems.length
            ? `${queueIndex + 1} / ${queueStems.length}  ·  ${rawTitle}`
            : rawTitle;
      }
      updateQueueChrome(title || "Hekayə");
      showPlayerShell();
      applyAudioSettings();

      if (sameTrack) {
        if (audioPlayer.paused || audioPlayer.ended) {
          if (audioPlayer.ended) audioPlayer.currentTime = 0;
          startPlayback(btn);
        } else {
          markPlaying(btn, true);
        }
        return;
      }

      const token = ++loadToken;
      suppressError = true;
      stopAudioElement({ clearSrc: true });
      window.setTimeout(() => {
        suppressError = false;
      }, 120);

      activeSourceKey = absolute;
      markPlaying(btn, true);
      updatePlayButton(true);

      // Load as a blob so seeking works even when the server lacks Range support.
      fetchController = typeof AbortController === "function" ? new AbortController() : null;
      const fetchOpts = fetchController ? { signal: fetchController.signal } : {};
      fetch(absolute, fetchOpts)
        .then((res) => {
          if (!res.ok) throw new Error("audio fetch failed");
          return res.blob();
        })
        .then((blob) => {
          if (token !== loadToken) return;
          revokeObjectUrl();
          objectUrl = URL.createObjectURL(blob);
          audioPlayer.src = objectUrl;
          startPlayback(btn);
        })
        .catch((err) => {
          if (fetchController && err && err.name === "AbortError") return;
          if (token !== loadToken) return;
          // Fallback: direct URL (may not seek on some local servers).
          try {
            audioPlayer.src = absolute;
            startPlayback(btn);
          } catch (_) {
            closePlayer();
            showNote(btn, audioFailedMessage);
          }
        });
    };

    const playAudioStory = (btn, src, story) => {
      openPlayer({
        btn,
        src,
        title: titleFor(btn, story),
        stem: stemFor(btn),
      });
    };

    const speakStory = async (btn, { fromQueue = false } = {}) => {
      if (!("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance !== "function") {
        showNote(btn, unsupportedMessage);
        if (fromQueue && queueActive && typeof window.__birinciQueueAdvance === "function") {
          window.__birinciQueueAdvance();
        }
        return;
      }

      const story = resolveStory(btn);
      const text = textForSpeech(story);
      if (!text) {
        showNote(btn, failedMessage);
        if (fromQueue && queueActive && typeof window.__birinciQueueAdvance === "function") {
          window.__birinciQueueAdvance();
        }
        return;
      }

      const voices = await loadVoices();
      const voice = pickVoice(voices);
      if (!voice) {
        if (fromQueue && queueActive) {
          showNote(btn, noVoiceMessage);
          if (typeof window.__birinciQueueAdvance === "function") window.__birinciQueueAdvance();
          return;
        }
        stopSpeech();
        showNote(btn, noVoiceMessage);
        return;
      }

      if (!fromQueue) {
        clearQueue({ keepTrack: false });
        closePlayer();
      } else {
        ensurePlayer();
        stopCurrentMedia();
        showPlayerShell();
        updateQueueChrome(titleFor(btn, story));
      }
      markPlaying(btn, true);
      syncPlayVisibleButton();

      const token = ++speakToken;
      const startSpeak = () => {
        if (token !== speakToken) return;
        utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = (voice.lang || "az-AZ").startsWith("tr") ? "tr-TR" : "az-AZ";
        utterance.voice = voice;
        utterance.rate = 1;
        utterance.pitch = 1;

        utterance.onstart = () => {
          if (token !== speakToken) return;
          markPlaying(btn, true);
          syncPlayVisibleButton();
        };
        utterance.onend = () => {
          if (suppressError || token !== speakToken) return;
          if (fromQueue && queueActive && typeof window.__birinciQueueAdvance === "function") {
            window.__birinciQueueAdvance();
            return;
          }
          clearActive();
          hidePlayerShell();
          syncPlayVisibleButton();
        };
        utterance.onerror = () => {
          if (suppressError || token !== speakToken) return;
          if (fromQueue && queueActive) {
            showNote(btn, failedMessage);
            if (typeof window.__birinciQueueAdvance === "function") window.__birinciQueueAdvance();
            return;
          }
          clearActive();
          showNote(btn, failedMessage);
        };

        try {
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          if (fromQueue && queueActive && typeof window.__birinciQueueAdvance === "function") {
            window.__birinciQueueAdvance();
            return;
          }
          clearActive();
          showNote(btn, unsupportedMessage);
        }
      };

      window.setTimeout(startSpeak, 60);
    };

    const playQueueIndex = (index, { scroll = false, skipCount = 0 } = {}) => {
      if (!queueActive || !queueStems.length) return;
      if (index < 0 || index >= queueStems.length || skipCount >= queueStems.length) {
        closePlayer();
        return;
      }
      queueIndex = index;
      const stem = queueStems[index];
      const story = storyElForStem(stem);
      const btn = listenBtnForStem(stem);
      if (!story || !btn) {
        playQueueIndex(index + 1, { scroll, skipCount: skipCount + 1 });
        return;
      }
      highlightPlaying(story, { scroll });
      updateQueueChrome(titleFor(btn, story));
      const audioSrc = story.dataset.audio;
      if (audioSrc) playAudioStory(btn, audioSrc, story);
      else speakStory(btn, { fromQueue: true });
      syncPlayVisibleButton();
    };

    const advanceQueue = () => {
      if (!queueActive) return;
      if (queueIndex + 1 >= queueStems.length) {
        closePlayer();
        return;
      }
      playQueueIndex(queueIndex + 1, { scroll: true });
    };

    const playVisible = () => {
      const stems = collectVisibleStems();
      if (!stems.length) return;
      if (sameVisibleQueue() && isActivelyPlaying()) {
        return;
      }
      if (sameVisibleQueue() && activeStem && !isActivelyPlaying()) {
        resumeCurrent();
        syncPlayVisibleButton();
        return;
      }
      queueStems = stems.slice();
      queueActive = true;
      queueIndex = 0;
      playQueueIndex(0, { scroll: true });
    };

    window.__birinciPlayVisible = playVisible;
    window.__birinciQueueAdvance = advanceQueue;
    window.__birinciQueuePrev = () => {
      if (!queueActive || queueIndex <= 0) return;
      playQueueIndex(queueIndex - 1, { scroll: true });
    };
    window.__birinciQueueNext = () => {
      if (!queueActive || queueIndex + 1 >= queueStems.length) return;
      playQueueIndex(queueIndex + 1, { scroll: true });
    };
    window.__birinciClearListenQueue = (opts) => clearQueue(opts || { keepTrack: true });
    window.__birinciSyncPlayVisibleUi = syncPlayVisibleButton;

    document.addEventListener("click", (event) => {
      const playVisibleBtn = event.target.closest("[data-tools-play-visible]");
      if (playVisibleBtn) {
        event.preventDefault();
        event.stopPropagation();
        const mode = playVisibleBtn.getAttribute("data-tts-mode") || "listen";
        if (mode === "stop") {
          stopSpeech();
          syncPlayVisibleButton();
          return;
        }
        playVisible();
        return;
      }
      const btn = event.target.closest("[data-story-tts]");
      if (!btn) return;
      event.preventDefault();
      event.stopPropagation();
      if (Date.now() < ignoreClicksUntil) return;

      const story = resolveStory(btn);
      const stem = stemFor(btn);
      const audioSrc = story && story.dataset.audio;
      const same = isSameStoryActive(btn);
      const mode = btn.getAttribute("data-tts-mode") || "listen";

      if (mode === "stop") {
        const root = btn.closest(".tools-bar__views") || btn.parentElement;
        const listenEl = root && root.querySelector('[data-tts-mode="listen"]');
        const pairOn =
          btn.getAttribute("data-tts-state") === "playing" ||
          btn.getAttribute("data-tts-state") === "paused" ||
          (listenEl && listenEl.getAttribute("aria-pressed") === "true");
        if (same || (stem && activeStem === stem) || pairOn) {
          stopSpeech();
        }
        syncTtsPairUi(btn, "idle");
        showNote(btn, "");
        return;
      }

      if (queueActive) {
        const idx = queueStems.indexOf(stem);
        if (idx >= 0) {
          if (same && isPausedPlayback()) {
            resumeCurrent();
            return;
          }
          if (same && isActivelyPlaying()) return;
          if (same && !isActivelyPlaying()) {
            resumeCurrent();
            return;
          }
          playQueueIndex(idx, { scroll: true });
          return;
        }
        clearQueue({ keepTrack: false });
      }

      if (audioSrc) {
        ensurePlayer();
        playAudioStory(btn, audioSrc, story);
        return;
      }

      if (same && isPausedPlayback()) {
        resumeCurrent();
        return;
      }
      if (same && isActivelyPlaying()) return;
      speakStory(btn);
    });

    document.addEventListener(
      "mouseleave",
      (event) => {
        const actions = event.target && event.target.closest && event.target.closest(".story__actions");
        if (!actions) return;
        const btn = actions.querySelector("[data-story-tts]");
        if (btn) showNote(btn, "");
      },
      true
    );

    document.addEventListener(
      "focusout",
      (event) => {
        const actions = event.target && event.target.closest && event.target.closest(".story__actions");
        if (!actions) return;
        if (!actions.contains(event.relatedTarget)) {
          const btn = actions.querySelector("[data-story-tts]");
          if (btn) showNote(btn, "");
        }
      },
      true
    );

    window.addEventListener("beforeunload", stopSpeech);
  };

  const initSitemapSearch = () => {
    if (!document.body.classList.contains("page-sitemap")) return;
    const page = document.querySelector(".sitemap-page");
    const main = page && page.querySelector(".sitemap-main");
    const input = document.getElementById("sitemap-search-input");
    const status = document.getElementById("sitemap-search-status");
    if (!page || !main || !input) return;

    const normalize = (value) =>
      String(value || "")
        .toLocaleLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const textOf = (el) => normalize(el ? el.textContent : "");

    const apply = () => {
      const q = normalize(input.value.trim());
      let shown = 0;

      main.querySelectorAll(".sitemap-links > li").forEach((li) => {
        const hit = !q || textOf(li).includes(q);
        li.hidden = Boolean(q) && !hit;
        if (!li.hidden) shown += 1;
      });

      main.querySelectorAll(".sitemap-block").forEach((block) => {
        const heading = textOf(block.querySelector("h3"));
        const blurb = textOf(block.querySelector(".sitemap-block__blurb"));
        const headingHit = !q || heading.includes(q) || blurb.includes(q);
        const links = block.querySelectorAll(".sitemap-links > li");
        if (q && headingHit) {
          links.forEach((li) => {
            if (li.hidden) {
              li.hidden = false;
              shown += 1;
            }
          });
        }
        const anyLink = Array.prototype.some.call(links, (li) => !li.hidden);
        const show = !q || headingHit || anyLink;
        block.hidden = Boolean(q) && !show;
        if (!q) block.hidden = false;
        if (show && !links.length && headingHit) shown += 1;
      });

      main.querySelectorAll(".sitemap-card, .sitemap-lang").forEach((card) => {
        const hit = !q || textOf(card).includes(q);
        card.hidden = Boolean(q) && !hit;
        if (!card.hidden) shown += 1;
      });

      main.querySelectorAll(".sitemap-section").forEach((section) => {
        const kids = section.querySelectorAll(
          ".sitemap-block, .sitemap-card, .sitemap-lang"
        );
        if (!kids.length) {
          section.hidden = false;
          return;
        }
        const any = Array.prototype.some.call(kids, (el) => !el.hidden);
        section.hidden = Boolean(q) && !any;
      });

      if (!status) {
        paintSearchAndLexicon(main, input.value.trim());
        return;
      }
      if (!q) {
        status.hidden = true;
        status.textContent = "";
        paintSearchAndLexicon(main, "");
        return;
      }
      status.hidden = false;
      if (shown === 0) {
        status.textContent =
          status.getAttribute("data-empty") ||
          tJs("no_match", "No matching items on this page.");
      } else {
        status.textContent = tJs("results_n", "{n} results").replace(
          "{n}",
          String(shown)
        );
      }
      paintSearchAndLexicon(main, input.value.trim());
    };

    let timer = 0;
    input.addEventListener("input", () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(apply, 80);
    });
    input.addEventListener("search", apply);
  };

  const initAboutValuesHighlight = () => {
    if (!document.body.classList.contains("page-about")) return;
    const pills = document.querySelector(".about-pills");
    const grid = document.querySelector(".about-vd-grid");
    const links = document.querySelectorAll(".about-pill");
    const boxes = document.querySelectorAll(".about-vd");
    if (!pills || !grid || !links.length) return;
    const clearHighlight = () => {
      boxes.forEach((box) => box.classList.remove("is-active"));
      grid.classList.remove("is-dimmed");
    };
    const highlightBox = (targetId) => {
      clearHighlight();
      const target = document.getElementById(targetId);
      if (!target) return;
      grid.classList.add("is-dimmed");
      target.classList.add("is-active");
    };
    links.forEach((link) => {
      const href = link.getAttribute("href") || "";
      const targetId = href.startsWith("#") ? href.slice(1) : "";
      if (!targetId) return;
      link.addEventListener("mouseenter", () => highlightBox(targetId));
      link.addEventListener("focus", () => highlightBox(targetId));
      link.addEventListener("click", () => highlightBox(targetId));
    });
    pills.addEventListener("mouseleave", clearHighlight);
  };

  const initIllustrationLightbox = () => {
    let overlay = null;
    let dialog = null;
    let imageEl = null;
    let captionEl = null;
    let closeBtn = null;
    let lastFocus = null;

    const ensureOverlay = () => {
      if (overlay) return overlay;
      overlay = document.createElement("div");
      overlay.className = "illustration-lightbox";
      overlay.hidden = true;
      overlay.setAttribute("hidden", "");
      overlay.innerHTML = `
        <div class="illustration-lightbox__dialog" role="dialog" aria-modal="true" aria-label="${tUi("lightbox_illustration", "Böyüdülmüş illüstrasiya")}">
          <button type="button" class="illustration-lightbox__close" aria-label="${tUi("close", "Bağla")}">&times;</button>
          <div class="illustration-lightbox__frame">
            <img class="illustration-lightbox__image" alt="" />
          </div>
          <p class="illustration-lightbox__caption"></p>
        </div>
      `.trim();
      document.body.appendChild(overlay);
      dialog = overlay.querySelector(".illustration-lightbox__dialog");
      imageEl = overlay.querySelector(".illustration-lightbox__image");
      captionEl = overlay.querySelector(".illustration-lightbox__caption");
      closeBtn = overlay.querySelector(".illustration-lightbox__close");

      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) close();
      });
      if (closeBtn) closeBtn.addEventListener("click", close);
      return overlay;
    };

    const close = () => {
      if (!overlay || overlay.hidden) return;
      overlay.hidden = true;
      overlay.setAttribute("hidden", "");
      document.body.classList.remove("illustration-lightbox-open");
      if (imageEl) {
        imageEl.removeAttribute("src");
        imageEl.alt = "";
      }
      if (captionEl) captionEl.textContent = "";
      if (lastFocus && typeof lastFocus.focus === "function") {
        try {
          lastFocus.focus();
        } catch (_) {}
      }
      lastFocus = null;
    };

    const open = (img) => {
      if (!img || !img.getAttribute("src")) return;
      ensureOverlay();
      lastFocus = document.activeElement;
      const src = img.currentSrc || img.getAttribute("src");
      const alt = img.getAttribute("alt") || "";
      imageEl.src = src;
      imageEl.alt = alt;
      captionEl.textContent = alt;
      captionEl.hidden = !alt;
      overlay.hidden = false;
      overlay.removeAttribute("hidden");
      document.body.classList.add("illustration-lightbox-open");
      window.requestAnimationFrame(() => {
        if (closeBtn) closeBtn.focus();
      });
    };

    document.addEventListener("click", (event) => {
      const openBtn = event.target.closest(".story__figure-open");
      if (!openBtn) return;
      const story = openBtn.closest(".story");
      if (story && story.classList.contains("story--figure-hidden")) return;
      const img = openBtn.querySelector("img");
      if (!img) return;
      event.preventDefault();
      open(img);
    });

    document.addEventListener("keydown", (event) => {
      if (!overlay || overlay.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    });
  };

  const initTextLightbox = () => {
    let overlay = null;
    let titleEl = null;
    let bodyEl = null;
    let closeBtn = null;
    let ttsBtn = null;
    let ttsBtns = [];
    let ttsNote = null;
    let lastFocus = null;

    const ensureOverlay = () => {
      if (overlay) return overlay;
      overlay = document.createElement("div");
      overlay.className = "text-lightbox";
      overlay.hidden = true;
      overlay.setAttribute("hidden", "");
      overlay.innerHTML = `
        <div class="text-lightbox__dialog" role="dialog" aria-modal="true" aria-label="${tUi("lightbox_text", "Böyüdülmüş hekayə mətni")}">
          <button type="button" class="text-lightbox__close" aria-label="${tUi("close", "Bağla")}">&times;</button>
          <div class="text-lightbox__header">
            <h2 class="text-lightbox__title"></h2>
          </div>
          ${SHOW_AUDIO_CONTROLS ? `<div class="text-lightbox__tts">
            <div class="story__action-group">
              <span class="tools-bar__label">${tUi("story_audio_label", "Səs")}</span>
              <div class="tools-bar__views" role="group" aria-label="${tUi("story_audio_label", "Səs")}">
            <button type="button" class="story-tts tools-bar__view-btn tools-bar__view-btn--icon" data-story-tts data-lightbox-tts data-tts-mode="listen" aria-pressed="false" title="${tUi("listen", "Mətni dinlə")}" aria-label="${tUi("listen", "Mətni dinlə")}">
              ${STORY_ICONS.listen}
            </button>
            <button type="button" class="story-tts tools-bar__view-btn tools-bar__view-btn--icon" data-story-tts data-lightbox-tts data-tts-mode="stop" aria-pressed="true" title="${tUi("stop", "Dayandır")}" aria-label="${tUi("stop", "Dayandır")}">
              ${STORY_ICONS.stop}
            </button>
              </div>
            </div>
            <p class="story-tts__note" data-story-tts-note hidden></p>
          </div>` : ""}
          <div class="text-lightbox__body"></div>
        </div>
      `.trim();
      document.body.appendChild(overlay);
      titleEl = overlay.querySelector(".text-lightbox__title");
      bodyEl = overlay.querySelector(".text-lightbox__body");
      closeBtn = overlay.querySelector(".text-lightbox__close");
      ttsBtns = Array.from(overlay.querySelectorAll("[data-lightbox-tts]"));
      ttsBtn =
        overlay.querySelector('[data-lightbox-tts][data-tts-mode="listen"]') || ttsBtns[0] || null;
      ttsNote = overlay.querySelector("[data-story-tts-note]");
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) close();
      });
      if (closeBtn) closeBtn.addEventListener("click", close);
      return overlay;
    };

    const resetTtsUi = () => {
      ttsBtns.forEach((el) => {
        el.removeAttribute("data-story-stem");
        el.setAttribute("data-tts-state", "idle");
        const mode = el.getAttribute("data-tts-mode");
        el.setAttribute("aria-pressed", mode === "stop" ? "true" : "false");
      });
      if (ttsNote) {
        ttsNote.hidden = true;
        ttsNote.textContent = "";
      }
    };

    const close = () => {
      if (!overlay || overlay.hidden) return;
      // Keep sticky audio player running while the text overlay closes.
      overlay.hidden = true;
      overlay.setAttribute("hidden", "");
      document.body.classList.remove("text-lightbox-open");
      if (titleEl) titleEl.textContent = "";
      if (bodyEl) bodyEl.innerHTML = "";
      resetTtsUi();
      if (lastFocus && typeof lastFocus.focus === "function") {
        try {
          lastFocus.focus();
        } catch (_) {}
      }
      lastFocus = null;
    };

    const open = (story, textEl) => {
      if (!story || !textEl) return;
      ensureOverlay();
      lastFocus = document.activeElement;
      const titleNode =
        story.querySelector(".story__title, .card-title") ||
        story.querySelector("h2");
      titleEl.textContent = titleNode ? titleNode.textContent.trim() : "Hekayə";
      bodyEl.innerHTML = textEl.innerHTML;
      const stem = ((story.dataset.stem || story.id) || "").trim();
      ttsBtns.forEach((el) => {
        if (stem) el.setAttribute("data-story-stem", stem);
        else el.removeAttribute("data-story-stem");
        el.setAttribute("data-tts-state", "idle");
        const mode = el.getAttribute("data-tts-mode");
        el.setAttribute("aria-pressed", mode === "stop" ? "true" : "false");
      });
      if (ttsNote) {
        ttsNote.hidden = true;
        ttsNote.textContent = "";
      }
      // Same tap that opens the overlay can land on the listen button (esp. mobile).
      if (typeof window.__birinciIgnoreStoryTtsClicks === "function") {
        window.__birinciIgnoreStoryTtsClicks(500);
      }
      overlay.hidden = false;
      overlay.removeAttribute("hidden");
      document.body.classList.add("text-lightbox-open");
      if (stem && typeof window.__birinciSyncStoryTtsUi === "function") {
        const cardBtn =
          story.querySelector('[data-tts-mode="listen"]') || story.querySelector("[data-story-tts]");
        const pressed = cardBtn && cardBtn.getAttribute("aria-pressed") === "true";
        const pausedLabel =
          cardBtn && cardBtn.getAttribute("data-tts-state") === "paused";
        const active =
          typeof window.__birinciIsStoryAudioActive === "function" &&
          window.__birinciIsStoryAudioActive(stem);
        if (pressed) window.__birinciSyncStoryTtsUi(stem, true);
        else if (active || pausedLabel) window.__birinciSyncStoryTtsUi(stem, false);
      }
      window.requestAnimationFrame(() => {
        // Focus close — not the listen button — to avoid ghost-click start/stop.
        if (closeBtn) closeBtn.focus();
        else if (overlay) overlay.focus();
      });
    };

    document.addEventListener("click", (event) => {
      if (event.target.closest("button, a, input, select, textarea, label")) return;
      const textEl = event.target.closest(".story__text, .story .card-text");
      if (!textEl) return;
      const story = textEl.closest("article.story");
      if (!story || story.classList.contains("story--text-hidden")) return;
      if (textEl.closest(".text-lightbox")) return;
      event.preventDefault();
      open(story, textEl);
    });

    document.addEventListener("keydown", (event) => {
      if (!overlay || overlay.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    });
  };

  const initStoryFigureToggle = () => {
    const setFigureState = (story, visible) => {
      if (!story) return;
      story.classList.toggle("story--figure-hidden", !visible);
      setStoryModePressed(story, "data-images-mode", visible);
    };

    const setAllFigures = (visible) => {
      document.querySelectorAll("article.story").forEach((story) => {
        setFigureState(story, visible);
      });
    };

    window.__birinciSetStoryFigure = setFigureState;
    window.__birinciSetAllStoryFigures = setAllFigures;

    document.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-images-mode]");
      if (!btn || btn.closest("[data-tools]")) return;
      const story = btn.closest("article.story");
      if (!story) return;
      event.preventDefault();
      setFigureState(story, btn.getAttribute("data-images-mode") === "show");
    });

    setAllFigures(!document.body.classList.contains("images-collapsed"));
  };

  const initStoryTextToggle = () => {
    const setTextState = (story, visible) => {
      if (!story) return;
      story.classList.toggle("story--text-hidden", !visible);
      setStoryModePressed(story, "data-texts-mode", visible);
    };

    const setAllTexts = (visible) => {
      document.querySelectorAll("article.story").forEach((story) => {
        setTextState(story, visible);
      });
    };

    window.__birinciSetStoryText = setTextState;
    window.__birinciSetAllStoryTexts = setAllTexts;

    document.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-texts-mode]");
      if (!btn || btn.closest("[data-tools]")) return;
      const story = btn.closest("article.story");
      if (!story) return;
      event.preventDefault();
      setTextState(story, btn.getAttribute("data-texts-mode") === "show");
    });

    setAllTexts(!document.body.classList.contains("texts-collapsed"));
  };

  try {
    initIllustrationLightbox();
  } catch (err) {
    console.error("initIllustrationLightbox failed", err);
  }
  try {
    initTextLightbox();
  } catch (err) {
    console.error("initTextLightbox failed", err);
  }
  try {
    initStoryFigureToggle();
  } catch (err) {
    console.error("initStoryFigureToggle failed", err);
  }
  try {
    initStoryTextToggle();
  } catch (err) {
    console.error("initStoryTextToggle failed", err);
  }
  // Temporary kill-switch: keep auth UI code below, but do not mount Sign in / Sign up
  // until server-side hosting is ready. Set to true to reactivate.
  const AUTH_UI_ENABLED = false;

  const initAccountEntry = () => {
    if (!AUTH_UI_ENABLED) {
      const leftover = document.querySelector(".auth-entry");
      if (leftover) leftover.remove();
      return;
    }
    const authCopy = {
      az: {
        sign_in: "Daxil ol",
        sign_up: "Qeyd ol",
        sign_out: "Çıxış",
        auth_email: "E-poçt",
        auth_first_name: "Ad",
        auth_last_name: "Soyad",
        auth_password: "Şifrə",
        auth_password_confirm: "Şifrəni təkrar daxil edin",
        auth_password_mismatch: "Şifrələr uyğun gəlmir.",
        auth_password_show: "Şifrəni göstər",
        auth_password_hide: "Şifrəni gizlət",
        auth_display_name: "Göstərilən ad (istəyə bağlı)",
        auth_lead_login: "Tərcihləri saxlamaq, şərh və reaksiya üçün daxil olun.",
        auth_lead_register: "Hekayələr və kəşflər üçün hesab yaradın.",
        auth_close: "Bağla",
        auth_have_account: "Hesabınız var?",
        auth_need_account: "Yeni istifadəçi?",
        auth_forgot: "Şifrəni unutmusunuz?",
        auth_lead_forgot: "E-poçtunuza sıfırlama linki göndəriləcək.",
        auth_forgot_submit: "Sıfırlama linki göndər",
        auth_back_to_signin: "Daxil olmaya qayıt",
        auth_account: "Hesab",
        settings: "Ayarlar",
        settings_lead: "Adınız və oxu tərcihləriniz.",
        settings_save: "Tərcihləri saxla",
        settings_saved: "Tərcihlər saxlanıldı.",
        settings_delete: "Hesabı sil",
        settings_delete_lead: "Hesabınızı və şəxsi məlumatlarınızı həmişəlik silin.",
        settings_delete_confirm: "Bu əməliyyat geri qaytarılmır. Hesabınız, profil şəkiliniz və saxlanmış tərcihləriniz silinəcək.",
        settings_delete_forever: "Həmişəlik sil",
        settings_delete_cancel: "Ləğv et",
        pref_view_stories: "Hekayələr ana səhifə görünüşü",
        pref_view_category: "Kateqoriya səhifələri",
        pref_view_discoveries: "Kəşflər görünüşü",
        pref_view_list: "Siyahı",
        pref_view_cards: "Kartlar",
        pref_hide_images: "Hekayə şəkillərini gizlət",
        pref_hide_texts: "Hekayə mətnini gizlət",
        pref_verified: "E-poçt təsdiqlənib",
        pref_unverified: "E-poçt təsdiqlənməyib",
        pref_locale: "Tərcih etdiyiniz dil",
        auth_no_account: "Bu e-poçt üçün hesab tapılmadı. Şərh, reaksiya və tərcihləri saxlamaq üçün hesab yaradın.",
        auth_create_account: "Hesab yarat",
        auth_bad_password: "Şifrə bu hesabla uyğun gəlmir.",
        auth_need_signin: "Bu funksiyadan istifadə üçün daxil olun.",
        auth_photo: "Profil şəkli",
        auth_photo_hint: "JPEG, PNG və ya WebP. İstəyə bağlı, ən çox 2 MB.",
      },
      en: {
        sign_in: "Sign in",
        sign_up: "Sign up",
        sign_out: "Sign out",
        auth_email: "Email",
        auth_first_name: "Name",
        auth_last_name: "Surname",
        auth_password: "Password",
        auth_password_confirm: "Re-enter password",
        auth_password_mismatch: "Passwords do not match.",
        auth_password_show: "Show password",
        auth_password_hide: "Hide password",
        auth_display_name: "Display name (optional)",
        auth_lead_login: "Sign in to save preferences, comment, and react.",
        auth_lead_register: "Create an account for Stories and Discoveries.",
        auth_close: "Close",
        auth_have_account: "Already have an account?",
        auth_need_account: "New here?",
        auth_forgot: "Forgot password?",
        auth_lead_forgot: "We’ll email you a reset link.",
        auth_forgot_submit: "Send reset link",
        auth_back_to_signin: "Back to sign in",
        auth_account: "Account",
        settings: "Settings",
        settings_lead: "Your name and reading preferences.",
        settings_save: "Save preferences",
        settings_saved: "Preferences saved.",
        settings_delete: "Delete account",
        settings_delete_lead: "Permanently delete your account and personal data.",
        settings_delete_confirm: "This cannot be undone. Your account, profile photo, and saved preferences will be deleted.",
        settings_delete_forever: "Delete permanently",
        settings_delete_cancel: "Cancel",
        pref_view_stories: "Stories home view",
        pref_view_category: "Category pages view",
        pref_view_discoveries: "Discoveries view",
        pref_view_list: "List",
        pref_view_cards: "Cards",
        pref_hide_images: "Hide story images",
        pref_hide_texts: "Hide story text",
        pref_verified: "Email verified",
        pref_unverified: "Email not verified",
        pref_locale: "Preferred language",
        auth_no_account: "No account was found for this email. Create an account to comment, react, and save preferences.",
        auth_create_account: "Create an account",
        auth_bad_password: "That password does not match this account.",
        auth_need_signin: "Sign in to use this feature.",
        auth_photo: "Profile picture",
        auth_photo_hint: "JPEG, PNG, or WebP. Optional, up to 2 MB.",
      },
      ru: {
        sign_in: "Войти",
        sign_up: "Регистрация",
        sign_out: "Выйти",
        auth_email: "Эл. почта",
        auth_first_name: "Имя",
        auth_last_name: "Фамилия",
        auth_password: "Пароль",
        auth_password_confirm: "Повторите пароль",
        auth_password_mismatch: "Пароли не совпадают.",
        auth_password_show: "Показать пароль",
        auth_password_hide: "Скрыть пароль",
        auth_display_name: "Имя (необязательно)",
        auth_lead_login: "Войдите, чтобы сохранять настройки, комментировать и ставить реакции.",
        auth_lead_register: "Создайте аккаунт для историй и открытий.",
        auth_close: "Закрыть",
        auth_have_account: "Уже есть аккаунт?",
        auth_need_account: "Впервые здесь?",
        auth_forgot: "Забыли пароль?",
        auth_lead_forgot: "Мы отправим ссылку для сброса пароля.",
        auth_forgot_submit: "Отправить ссылку",
        auth_back_to_signin: "Вернуться ко входу",
        auth_account: "Аккаунт",
        settings: "Настройки",
        settings_lead: "Ваше имя и настройки чтения.",
        settings_save: "Сохранить настройки",
        settings_saved: "Настройки сохранены.",
        settings_delete: "Удалить аккаунт",
        settings_delete_lead: "Безвозвратно удалить аккаунт и персональные данные.",
        settings_delete_confirm: "Это действие нельзя отменить. Аккаунт, фото профиля и сохранённые настройки будут удалены.",
        settings_delete_forever: "Удалить навсегда",
        settings_delete_cancel: "Отмена",
        pref_view_stories: "Вид главной страницы историй",
        pref_view_category: "Вид страниц категорий",
        pref_view_discoveries: "Вид открытий",
        pref_view_list: "Список",
        pref_view_cards: "Карточки",
        pref_hide_images: "Скрыть изображения рассказов",
        pref_hide_texts: "Скрыть текст рассказов",
        pref_verified: "Почта подтверждена",
        pref_unverified: "Почта не подтверждена",
        pref_locale: "Предпочитаемый язык",
        auth_no_account: "Для этой почты аккаунт не найден. Создайте аккаунт, чтобы комментировать, ставить реакции и сохранять настройки.",
        auth_create_account: "Создать аккаунт",
        auth_bad_password: "Пароль не подходит к этому аккаунту.",
        auth_need_signin: "Чтобы пользоваться этой функцией, войдите в аккаунт.",
        auth_photo: "Фото профиля",
        auth_photo_hint: "JPEG, PNG или WebP. Необязательно, до 2 МБ.",
      },
      ky: {
        sign_in: "Кирүү",
        sign_up: "Каттоо",
        sign_out: "Чыгуу",
        auth_email: "Электрондук почта",
        auth_first_name: "Ат",
        auth_last_name: "Фамилия",
        auth_password: "Сырсөз",
        auth_password_confirm: "Сырсөздү кайталаңыз",
        auth_password_mismatch: "Сырсөздөр дал келбейт.",
        auth_password_show: "Сырсөздү көрсөтүү",
        auth_password_hide: "Сырсөздү жашыруу",
        auth_display_name: "Көрсөтүлүүчү ат (милдеттүү эмес)",
        auth_lead_login: "Жөндөөлөрдү сактоо, комментарий жана реакция үчүн кириңиз.",
        auth_lead_register: "Окуялар жана ачылыштар үчүн аккаунт түзүңүз.",
        auth_close: "Жабуу",
        auth_have_account: "Аккаунтуңуз барбы?",
        auth_need_account: "Жаңысызбы?",
        auth_forgot: "Сырсөздү унуттуңузбу?",
        auth_lead_forgot: "Сырсөздү калыбына келтирүү шилтемеси жөнөтүлөт.",
        auth_forgot_submit: "Шилтеме жөнөтүү",
        auth_back_to_signin: "Кирүүгө кайтуу",
        auth_account: "Аккаунт",
        settings: "Жөндөөлөр",
        settings_lead: "Атыңыз жана окуу жөндөөлөрү.",
        settings_save: "Жөндөөлөрдү сактоо",
        settings_saved: "Жөндөөлөр сакталды.",
        settings_delete: "Аккаунтту өчүрүү",
        settings_delete_lead: "Аккаунтуңузду жана жеке маалыматтарды биротоло өчүрүңүз.",
        settings_delete_confirm: "Бул аракет кайтарылбайт. Аккаунтуңуз, профиль сүрөтүңүз жана сакталган жөндөөлөр өчүрүлөт.",
        settings_delete_forever: "Биротоло өчүрүү",
        settings_delete_cancel: "Жокко чыгаруу",
        pref_view_stories: "Окуялар башкы көрүнүшү",
        pref_view_category: "Категория барактары",
        pref_view_discoveries: "Ачылыштар көрүнүшү",
        pref_view_list: "Тизме",
        pref_view_cards: "Карточкалар",
        pref_hide_images: "Окуя сүрөттөрүн жашыруу",
        pref_hide_texts: "Окуя текстин жашыруу",
        pref_verified: "Почта ырасталды",
        pref_unverified: "Почта ырастала элек",
        pref_locale: "Тандалган тил",
        auth_no_account: "Бул почта үчүн аккаунт табылган жок. Комментарий, реакция жана жөндөөлөрдү сактоо үчүн аккаунт түзүңүз.",
        auth_create_account: "Аккаунт түзүү",
        auth_bad_password: "Сырсөз бул аккаунтка туура келбейт.",
        auth_need_signin: "Бул функцияны колдонуу үчүн кириңиз.",
        auth_photo: "Профиль сүрөтү",
        auth_photo_hint: "JPEG, PNG же WebP. Милдеттүү эмес, 2 МБ чейин.",
      },
    };

    const currentLang = () => {
      const fromBody = document.body && document.body.getAttribute("data-lang");
      const fromI18n = liveI18n().lang;
      // Prefer the page language attribute so root-home client switches
      // update auth UI even before __BIRINCI_I18N__.lang is rewritten.
      const code = String(fromBody || fromI18n || "en").toLowerCase();
      return authCopy[code] ? code : "en";
    };
    const t = (key) => {
      const lang = currentLang();
      const ui = liveI18n().ui || {};
      // Prefer authCopy for the active page language so header Sign in / Sign up
      // track language switches (root home i18n packs may omit these keys).
      return (authCopy[lang] && authCopy[lang][key]) || ui[key] || (authCopy.en && authCopy.en[key]) || key;
    };

    let chromeUser = null;
    const DEFAULT_API_ORIGIN = "http://127.0.0.1:8088";
    let apiOrigin = "";
    const apiUrl = (path) => (apiOrigin || "") + path;
    const apiFetch = (path, opts) => {
      const options = Object.assign({ credentials: "include" }, opts || {});
      return fetch(apiUrl(path), options).catch(() => {
        const err = new Error(
          "Cannot reach the API. Open http://127.0.0.1:8088/ with the API running."
        );
        err.code = "api_unreachable";
        throw err;
      });
    };
    const resolveApiOrigin = () =>
      fetch("/api/health", { credentials: "include" })
        .then((res) => {
          if (!res.ok) throw new Error("no api");
          apiOrigin = "";
          return apiOrigin;
        })
        .catch(() =>
          fetch(DEFAULT_API_ORIGIN + "/api/health", { credentials: "include" }).then((res) => {
            if (!res.ok) throw new Error("no api");
            apiOrigin = DEFAULT_API_ORIGIN;
            return apiOrigin;
          })
        )
        .catch(() => {
          apiOrigin = "";
          return "";
        });

    const csrfHeader = (token) => ({ "Content-Type": "application/json", "X-CSRF-Token": token });
    const getCsrf = () =>
      apiFetch("/api/auth/csrf").then((res) => res.json()).then((data) => data.csrf_token);
    const failAuth = (data) => {
      const detail = data && data.detail;
      const err = new Error("Request failed");
      if (typeof detail === "string") err.message = detail;
      else if (Array.isArray(detail)) err.message = detail.map((d) => d.msg || d).join(" ");
      else if (detail && typeof detail === "object") {
        err.message = detail.message || "Request failed";
        err.code = detail.code;
      }
      throw err;
    };
    const postAuth = (url, body, method) =>
      getCsrf().then((token) =>
        apiFetch(url, {
          method: method || "POST",
          headers: csrfHeader(token),
          body: JSON.stringify(body || {}),
        }).then((res) =>
          res.json().then((data) => {
            if (!res.ok) failAuth(data);
            return data;
          })
        )
      );
    window.__birinciAuth = {
      apiFetch,
      postAuth,
      t,
      currentLang,
      user: () => chromeUser,
    };
    const uploadAvatar = (file) =>
      getCsrf().then((token) => {
        const body = new FormData();
        body.append("file", file);
        return apiFetch("/api/auth/me/avatar", {
          method: "POST",
          headers: { "X-CSRF-Token": token },
          body,
        }).then((res) =>
          res.json().then((data) => {
            if (!res.ok) failAuth(data);
            return data;
          })
        );
      });
    const bindPhotoPreview = (input, preview) => {
      if (!input || !preview) return;
      input.addEventListener("change", () => {
        const file = input.files && input.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        preview.innerHTML = '<img alt="" src="' + url + '" />';
        preview.hidden = false;
      });
    };
    const passwordFieldHtml = (attrs) =>
      '<div class="auth-password">' +
      "<input " +
      attrs +
      " />" +
      '<button type="button" class="auth-password__toggle" data-password-toggle aria-pressed="false" aria-label="">' +
      '<svg class="auth-password__icon auth-password__icon--show" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>' +
      '<svg class="auth-password__icon auth-password__icon--hide" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>' +
      "</button></div>";
    const syncPasswordToggle = (btn) => {
      const wrap = btn.closest(".auth-password");
      const input = wrap && wrap.querySelector("input");
      if (!input) return;
      const shown = input.type === "text";
      btn.setAttribute("aria-pressed", shown ? "true" : "false");
      btn.classList.toggle("is-revealed", shown);
      btn.setAttribute("aria-label", shown ? t("auth_password_hide") : t("auth_password_show"));
    };
    const bindPasswordToggles = (root) => {
      if (!root) return;
      root.querySelectorAll("[data-password-toggle]").forEach((btn) => {
        syncPasswordToggle(btn);
        if (btn.dataset.bound === "1") return;
        btn.dataset.bound = "1";
        const wrap = btn.closest(".auth-password");
        const input = wrap && wrap.querySelector("input");
        if (!input) return;
        btn.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          input.type = input.type === "password" ? "text" : "password";
          syncPasswordToggle(btn);
        });
      });
    };
    const LOCALE_META = {
      az: { short: "AZ", title: "Azərbaycan" },
      en: { short: "EN", title: "English" },
      ru: { short: "RU", title: "Русский" },
      ky: { short: "KY", title: "Кыргызча" },
    };
    const localeCodes = Object.keys(LOCALE_META);
    const flagSrc = (code) => {
      const sample = document.querySelector(".lang-switcher__flag");
      const src = sample && sample.getAttribute("src");
      if (src) return src.replace(/\/[a-z]{2}\.svg(?:\?.*)?$/i, "/" + code + ".svg");
      return "/flags/" + code + ".svg";
    };
    const normalizeLocale = (code) => {
      const c = String(code || "").toLowerCase();
      return LOCALE_META[c] ? c : "en";
    };
    const prefLocaleHtml = (idPrefix, selected) => {
      const value = normalizeLocale(selected || currentLang());
      const meta = LOCALE_META[value];
      const menuId = idPrefix + "-menu";
      const options = localeCodes
        .map((code) => {
          const m = LOCALE_META[code];
          const selectedAttr = code === value ? "true" : "false";
          return (
            '<button type="button" class="lang-switcher__option" role="option" data-lang="' +
            code +
            '" aria-selected="' +
            selectedAttr +
            '" title="' +
            m.title +
            '"><img class="lang-switcher__flag" src="' +
            flagSrc(code) +
            '" alt="" width="20" height="14" decoding="async" /><span>' +
            m.short +
            "</span></button>"
          );
        })
        .join("");
      return (
        '<div class="lang-switcher lang-switcher--embedded" data-pref-locale>' +
        '<input type="hidden" name="preferred_locale" value="' +
        value +
        '" />' +
        '<button type="button" class="lang-switcher__toggle" aria-expanded="false" aria-haspopup="listbox" aria-controls="' +
        menuId +
        '" title="' +
        meta.title +
        '"><img class="lang-switcher__flag" src="' +
        flagSrc(value) +
        '" alt="" width="20" height="14" decoding="async" /><span class="lang-switcher__name">' +
        meta.short +
        '</span><span class="lang-switcher__caret" aria-hidden="true"></span></button>' +
        '<div class="lang-switcher__menu" id="' +
        menuId +
        '" role="listbox" hidden>' +
        options +
        "</div></div>"
      );
    };
    const setPrefLocaleValue = (wrap, code) => {
      if (!wrap) return;
      const value = normalizeLocale(code);
      const meta = LOCALE_META[value];
      const input = wrap.querySelector('input[name="preferred_locale"]');
      const toggle = wrap.querySelector(".lang-switcher__toggle");
      const flag = toggle && toggle.querySelector(".lang-switcher__flag");
      const name = toggle && toggle.querySelector(".lang-switcher__name");
      if (input) input.value = value;
      if (toggle) toggle.title = meta.title;
      if (flag) flag.src = flagSrc(value);
      if (name) name.textContent = meta.short;
      wrap.querySelectorAll(".lang-switcher__option").forEach((opt) => {
        opt.setAttribute("aria-selected", opt.getAttribute("data-lang") === value ? "true" : "false");
      });
    };
    const closePrefLocale = (wrap) => {
      if (!wrap) return;
      wrap.classList.remove("is-open");
      const toggle = wrap.querySelector(".lang-switcher__toggle");
      const menu = wrap.querySelector(".lang-switcher__menu");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
      if (menu) {
        menu.hidden = true;
        menu.style.top = "";
        menu.style.left = "";
        menu.style.minWidth = "";
      }
    };
    const placePrefLocaleMenu = (wrap) => {
      const toggle = wrap.querySelector(".lang-switcher__toggle");
      const menu = wrap.querySelector(".lang-switcher__menu");
      if (!toggle || !menu) return;
      const rect = toggle.getBoundingClientRect();
      menu.style.top = Math.round(rect.bottom + 4) + "px";
      menu.style.left = Math.round(rect.left) + "px";
      menu.style.minWidth = Math.round(rect.width) + "px";
    };
    const bindPrefLocale = (wrap) => {
      if (!wrap || wrap.dataset.bound === "1") return;
      wrap.dataset.bound = "1";
      const toggle = wrap.querySelector(".lang-switcher__toggle");
      const menu = wrap.querySelector(".lang-switcher__menu");
      if (!toggle || !menu) return;
      const open = () => {
        document.querySelectorAll(".lang-switcher--embedded.is-open").forEach((other) => {
          if (other !== wrap) closePrefLocale(other);
        });
        wrap.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");
        menu.hidden = false;
        placePrefLocaleMenu(wrap);
      };
      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        if (wrap.classList.contains("is-open")) closePrefLocale(wrap);
        else open();
      });
      menu.addEventListener("click", (event) => {
        const opt = event.target.closest(".lang-switcher__option[data-lang]");
        if (!opt || !menu.contains(opt)) return;
        event.preventDefault();
        setPrefLocaleValue(wrap, opt.getAttribute("data-lang"));
        closePrefLocale(wrap);
      });
      document.addEventListener("click", (event) => {
        if (!wrap.classList.contains("is-open")) return;
        if (wrap.contains(event.target) || menu.contains(event.target)) return;
        closePrefLocale(wrap);
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closePrefLocale(wrap);
      });
      window.addEventListener(
        "resize",
        () => {
          if (wrap.classList.contains("is-open")) placePrefLocaleMenu(wrap);
        },
        { passive: true }
      );
    };

    const refreshAuthModalCopy = () => {
      const root = document.getElementById("auth-modal");
      if (!root) return;
      root.querySelectorAll("[data-auth-i18n]").forEach((el) => {
        const key = el.getAttribute("data-auth-i18n");
        if (key) el.textContent = t(key);
      });
      root.querySelectorAll("[data-auth-close]").forEach((el) => {
        el.setAttribute("aria-label", t("auth_close"));
      });
      const localeWrap = root.querySelector("#auth-form-register [data-pref-locale]");
      if (localeWrap) {
        const input = localeWrap.querySelector('input[name="preferred_locale"]');
        const keep = (input && input.value) || currentLang();
        setPrefLocaleValue(localeWrap, keep);
        bindPrefLocale(localeWrap);
        localeWrap.setAttribute("aria-label", t("pref_locale"));
      }
      const mode =
        root.dataset.mode === "register"
          ? "register"
          : root.dataset.mode === "forgot"
            ? "forgot"
            : "login";
      const title = document.getElementById("auth-modal-title");
      const lead = document.getElementById("auth-modal-lead");
      if (title) {
        title.textContent =
          mode === "register" ? t("sign_up") : mode === "forgot" ? t("auth_forgot") : t("sign_in");
      }
      if (lead) {
        lead.textContent =
          mode === "register"
            ? t("auth_lead_register")
            : mode === "forgot"
              ? t("auth_lead_forgot")
              : t("auth_lead_login");
      }
      const sw = root.querySelector("[data-auth-switch]");
      if (sw) {
        if (mode === "forgot") {
          sw.dataset.authSwitch = "login";
          sw.textContent = t("auth_back_to_signin");
        } else {
          const isLogin = mode === "login";
          sw.dataset.authSwitch = isLogin ? "register" : "login";
          sw.textContent = isLogin
            ? t("auth_need_account") + " " + t("sign_up")
            : t("auth_have_account") + " " + t("sign_in");
        }
      }
      const forgot = root.querySelector("[data-auth-forgot]");
      if (forgot) forgot.textContent = t("auth_forgot");
      const loginSubmit = root.querySelector("#auth-form-login .auth-modal__submit");
      if (loginSubmit) loginSubmit.textContent = t("sign_in");
      const registerSubmit = root.querySelector("#auth-form-register .auth-modal__submit");
      if (registerSubmit) registerSubmit.textContent = t("sign_up");
      const forgotSubmit = root.querySelector("#auth-form-forgot .auth-modal__submit");
      if (forgotSubmit) forgotSubmit.textContent = t("auth_forgot_submit");
      const inviteBtn = root.querySelector("[data-open-signup]");
      if (inviteBtn) inviteBtn.textContent = t("auth_create_account");
      bindPasswordToggles(root);
    };

    const ensureModal = () => {
      if (document.getElementById("auth-modal")) return;
      const root = document.createElement("div");
      root.id = "auth-modal";
      root.className = "auth-modal";
      root.dataset.mode = "login";
      root.hidden = true;
      root.innerHTML =
        '<button type="button" class="auth-modal__backdrop" data-auth-close tabindex="-1" aria-label=""></button>' +
        '<div class="auth-modal__panel" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">' +
        '<div class="auth-modal__head"><p id="auth-modal-title" class="auth-modal__title"></p>' +
        '<button type="button" class="auth-modal__close" data-auth-close aria-label="">×</button></div>' +
        '<p class="auth-modal__lead" id="auth-modal-lead"></p>' +
        '<p class="auth-modal__msg" id="auth-modal-msg" hidden></p>' +
        '<form class="auth-modal__form" id="auth-form-login">' +
        '<label><span data-auth-i18n="auth_email"></span><input type="email" name="email" autocomplete="email" required /></label>' +
        '<label><span data-auth-i18n="auth_password"></span>' +
        passwordFieldHtml(
          'type="password" name="password" autocomplete="current-password" minlength="10" required'
        ) +
        "</label>" +
        '<p class="auth-modal__forgot-wrap"><button type="button" class="auth-modal__forgot" data-auth-forgot></button></p>' +
        '<button type="submit" class="auth-modal__submit"></button></form>' +
        '<p class="auth-modal__invite" id="auth-invite" hidden>' +
        '<button type="button" class="auth-modal__invite-btn" data-open-signup></button></p>' +
        '<form class="auth-modal__form" id="auth-form-forgot" hidden>' +
        '<label><span data-auth-i18n="auth_email"></span><input type="email" name="email" autocomplete="email" required /></label>' +
        '<button type="submit" class="auth-modal__submit"></button></form>' +
        '<form class="auth-modal__form" id="auth-form-register" hidden>' +
        '<label><span data-auth-i18n="auth_first_name"></span><input type="text" name="first_name" maxlength="80" autocomplete="given-name" required /></label>' +
        '<label><span data-auth-i18n="auth_last_name"></span><input type="text" name="last_name" maxlength="80" autocomplete="family-name" required /></label>' +
        '<label><span data-auth-i18n="auth_email"></span><input type="email" name="email" autocomplete="email" required /></label>' +
        '<label><span data-auth-i18n="auth_display_name"></span><input type="text" name="display_name" maxlength="80" autocomplete="nickname" /></label>' +
        '<div class="auth-photo"><span class="auth-photo__preview" id="register-photo-preview" hidden></span>' +
        '<label><span data-auth-i18n="auth_photo"></span><input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" />' +
        '<small class="auth-photo__hint" data-auth-i18n="auth_photo_hint"></small></label></div>' +
        '<label><span data-auth-i18n="pref_locale"></span>' +
        prefLocaleHtml("auth-pref-locale", currentLang()) +
        "</label>" +
        '<label><span data-auth-i18n="auth_password"></span>' +
        passwordFieldHtml(
          'type="password" name="password" autocomplete="new-password" minlength="10" required'
        ) +
        "</label>" +
        '<label><span data-auth-i18n="auth_password_confirm"></span>' +
        passwordFieldHtml(
          'type="password" name="password_confirm" autocomplete="new-password" minlength="10" required'
        ) +
        "</label>" +
        '<button type="submit" class="auth-modal__submit"></button></form>' +
        '<p class="auth-modal__alt"><button type="button" class="auth-modal__switch" data-auth-switch></button></p>' +
        "</div>";
      document.body.appendChild(root);
      refreshAuthModalCopy();
      bindPasswordToggles(root);

      const showMsg = (text, isError) => {
        const msg = document.getElementById("auth-modal-msg");
        msg.hidden = false;
        msg.textContent = text;
        msg.classList.toggle("is-error", !!isError);
      };

      const setMode = (mode) => {
        const next =
          mode === "register" ? "register" : mode === "forgot" ? "forgot" : "login";
        root.dataset.mode = next;
        document.getElementById("auth-form-login").hidden = next !== "login";
        document.getElementById("auth-form-register").hidden = next !== "register";
        document.getElementById("auth-form-forgot").hidden = next !== "forgot";
        document.getElementById("auth-modal-msg").hidden = true;
        const invite = document.getElementById("auth-invite");
        if (invite) invite.hidden = true;
        refreshAuthModalCopy();
      };

      const close = () => {
        root.hidden = true;
        document.body.classList.remove("auth-modal-open");
      };

      window.__birinciOpenAuth = (mode, email) => {
        const next =
          mode === "register" ? "register" : mode === "forgot" ? "forgot" : "login";
        setMode(next);
        root.hidden = false;
        document.body.classList.add("auth-modal-open");
        const formId =
          next === "register"
            ? "auth-form-register"
            : next === "forgot"
              ? "auth-form-forgot"
              : "auth-form-login";
        const form = document.getElementById(formId);
        const input = form.querySelector(
          next === "register" ? "input[name='first_name']" : "input[name='email']"
        );
        if (email) {
          root.querySelectorAll("input[name='email']").forEach((el) => {
            el.value = email;
          });
        }
        if (input) input.focus();
      };

      root.addEventListener("click", (event) => {
        if (event.target.closest("[data-auth-close]")) close();
        const forgotBtn = event.target.closest("[data-auth-forgot]");
        if (forgotBtn) {
          const loginEmail = document.querySelector("#auth-form-login input[name='email']");
          window.__birinciOpenAuth("forgot", loginEmail && loginEmail.value);
          return;
        }
        const sw = event.target.closest("[data-auth-switch]");
        if (sw) {
          const fromRegister = root.dataset.mode === "register";
          const emailInput = document.querySelector(
            (fromRegister ? "#auth-form-register" : "#auth-form-login") + " input[name='email']"
          );
          const forgotEmail = document.querySelector("#auth-form-forgot input[name='email']");
          const email =
            (emailInput && emailInput.value) || (forgotEmail && forgotEmail.value) || "";
          window.__birinciOpenAuth(sw.dataset.authSwitch, email);
        }
        if (event.target.closest("[data-open-signup]")) {
          const loginEmail = document.querySelector("#auth-form-login input[name='email']");
          window.__birinciOpenAuth("register", loginEmail && loginEmail.value);
        }
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !root.hidden) close();
      });

      document.getElementById("auth-form-login").addEventListener("submit", (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        const email = fd.get("email");
        postAuth("/api/auth/login", { email: email, password: fd.get("password") })
          .then((data) => {
            close();
            renderChrome(data.user);
            if (goPreferredLocale(data.user)) return;
            return syncPrefsFromServer({ reloadIfChanged: true });
          })
          .catch((err) => {
            const invite = document.getElementById("auth-invite");
            if (err.code === "account_not_found") {
              showMsg(t("auth_no_account"), true);
              if (invite) invite.hidden = false;
            } else if (err.code === "invalid_password") {
              showMsg(t("auth_bad_password"), true);
              if (invite) invite.hidden = true;
            } else {
              showMsg(err.message, true);
              if (invite) invite.hidden = true;
            }
          });
      });
      document.getElementById("auth-form-forgot").addEventListener("submit", (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        postAuth("/api/auth/password-reset/request", { email: fd.get("email") })
          .then((data) => {
            let text = data.message || t("auth_lead_forgot");
            if (data.reset_url) text += " " + data.reset_url;
            showMsg(text, false);
          })
          .catch((err) => showMsg(err.message, true));
      });
      document.getElementById("auth-form-register").addEventListener("submit", (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        const password = String(fd.get("password") || "");
        const confirm = String(fd.get("password_confirm") || "");
        if (password !== confirm) {
          showMsg(t("auth_password_mismatch"), true);
          return;
        }
        const photo = fd.get("avatar");
        postAuth("/api/auth/register", {
          email: fd.get("email"),
          password: password,
          first_name: fd.get("first_name"),
          last_name: fd.get("last_name"),
          display_name: fd.get("display_name") || null,
          preferred_locale: fd.get("preferred_locale") || currentLang(),
        })
          .then((data) => {
            if (photo && photo.size) {
              return uploadAvatar(photo).then((av) => Object.assign({}, data, { user: av.user }));
            }
            return data;
          })
          .then((data) => {
            close();
            renderChrome(data.user);
            if (goPreferredLocale(data.user)) return;
            return syncPrefsFromServer({ reloadIfChanged: true });
          })
          .catch((err) => showMsg(err.message, true));
      });
      bindPhotoPreview(
        document.querySelector("#auth-form-register input[name='avatar']"),
        document.getElementById("register-photo-preview")
      );
    };

    window.__birinciRequireAuth = (reason) => {
      if (window.__birinciUser) return true;
      ensureModal();
      window.__birinciOpenAuth("login");
      const msg = document.getElementById("auth-modal-msg");
      if (msg && reason) {
        msg.hidden = false;
        msg.textContent = reason;
        msg.classList.add("is-error");
      }
      return false;
    };

    const renderChrome = (user) => {
      const actions = document.querySelector(".site-header__actions");
      if (!actions) return;
      chromeUser = user || null;
      let box = actions.querySelector("[data-account-entry]");
      if (!box) {
        box = document.createElement("div");
        box.className = "auth-entry";
        box.dataset.accountEntry = "1";
        actions.insertBefore(box, actions.firstChild);
      }
      window.__birinciUser = chromeUser;
      if (typeof window.__birinciRefreshEngage === "function") window.__birinciRefreshEngage();
      if (user) {
        const shown = user.display_name || user.email.split("@")[0];
        const esc = (value) =>
          String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
        const initial = esc(String(shown).trim().charAt(0).toUpperCase() || "?");
        const photo = user.avatar_url
          ? '<img class="auth-user__photo" src="' +
            esc(user.avatar_url) +
            '" alt="" width="36" height="36" />'
          : '<span class="auth-user__photo auth-user__photo--fallback" aria-hidden="true">' + initial + "</span>";
        box.innerHTML =
          '<span class="auth-user" title="' +
          esc(user.email) +
          '">' +
          photo +
          '<span class="auth-user__meta"><span class="auth-user__label">' +
          t("auth_account") +
          '</span><strong class="auth-user__name">' +
          esc(shown) +
          "</strong></span></span>" +
          '<button type="button" class="auth-entry__btn auth-entry__btn--primary" data-open-settings>' +
          t("settings") +
          "</button>" +
          '<button type="button" class="auth-entry__btn" data-auth-logout>' +
          t("sign_out") +
          "</button>";
        box.querySelector("[data-auth-logout]").addEventListener("click", () => {
          postAuth("/api/auth/logout", {})
            .then(() => {
              clearReadingPrefs();
              renderChrome(null);
            })
            .catch(() => {});
        });
        box.querySelector("[data-open-settings]").addEventListener("click", () => openSettings(user));
        return;
      }
      box.innerHTML =
        '<button type="button" class="auth-entry__btn" data-auth-open="login">' +
        t("sign_in") +
        '</button><button type="button" class="auth-entry__btn" data-auth-open="register">' +
        t("sign_up") +
        "</button>";
      box.querySelectorAll("[data-auth-open]").forEach((btn) => {
        btn.addEventListener("click", () => {
          ensureModal();
          const mode = btn.getAttribute("data-auth-open") || "login";
          if (typeof window.__birinciOpenAuth === "function") {
            window.__birinciOpenAuth(mode);
            return;
          }
          const lang = currentLang();
          window.location.href =
            "/account/" +
            (mode === "register" ? "register" : "login") +
            "?lang=" +
            encodeURIComponent(lang);
        });
      });
    };

    const AUTH_LOCALES = ["az", "en", "ru", "ky"];
    const prefKeys = {
      home_view: "birinci-home-view",
      category_view: "birinci-category-view",
      inventions_view: "birinci-inventions-view",
      images_collapsed: "birinci-images-collapsed",
      texts_collapsed: "birinci-texts-collapsed",
    };

    const readLocalPrefs = () => ({
      home_view: localStorage.getItem(prefKeys.home_view) || "list",
      category_view: localStorage.getItem(prefKeys.category_view) || "list",
      inventions_view: localStorage.getItem(prefKeys.inventions_view) || "list",
      images_collapsed: localStorage.getItem(prefKeys.images_collapsed) === "1",
      texts_collapsed: localStorage.getItem(prefKeys.texts_collapsed) === "1",
    });

    const prefsSnapshot = () => JSON.stringify(readLocalPrefs());

    const applyLocalPrefs = (data) => {
      if (!data) return;
      if (data.home_view) localStorage.setItem(prefKeys.home_view, data.home_view);
      if (data.category_view) localStorage.setItem(prefKeys.category_view, data.category_view);
      if (data.inventions_view) localStorage.setItem(prefKeys.inventions_view, data.inventions_view);
      if (typeof data.images_collapsed === "boolean") {
        localStorage.setItem(prefKeys.images_collapsed, data.images_collapsed ? "1" : "0");
      }
      if (typeof data.texts_collapsed === "boolean") {
        localStorage.setItem(prefKeys.texts_collapsed, data.texts_collapsed ? "1" : "0");
      }
    };

    const clearReadingPrefs = () => {
      Object.values(prefKeys).forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch (_) {}
      });
    };

    const pathForLocale = (targetLang) => {
      const path = (window.location.pathname || "/").replace(/\\/g, "/");
      const parts = path.split("/").filter(Boolean);
      const qs = window.location.search || "";
      const hash = window.location.hash || "";
      if (!parts.length || (parts.length === 1 && parts[0] === "index.html")) {
        return "/" + targetLang + "/index.html" + qs + hash;
      }
      if (AUTH_LOCALES.indexOf(parts[0]) >= 0) {
        parts[0] = targetLang;
        return "/" + parts.join("/") + qs + hash;
      }
      if (parts[0] === "account") {
        const url = new URL(window.location.href);
        url.searchParams.set("lang", targetLang);
        return url.pathname + url.search + url.hash;
      }
      return "/" + targetLang + "/index.html";
    };

    const goPreferredLocale = (user) => {
      const want = user && String(user.preferred_locale || "").toLowerCase();
      if (!want || AUTH_LOCALES.indexOf(want) < 0) return false;
      if (want === currentLang()) return false;
      try {
        localStorage.setItem("birinci-lang", want);
      } catch (_) {}
      window.location.assign(pathForLocale(want));
      return true;
    };

    const syncPrefsFromServer = (opts) => {
      const reloadIfChanged = !!(opts && opts.reloadIfChanged);
      const before = prefsSnapshot();
      const local = readLocalPrefs();
      return fetch(apiUrl("/api/preferences"), { credentials: "include" })
        .then((res) => {
          if (!res.ok) throw new Error("prefs");
          return res.json();
        })
        .then((payload) => {
          const remote = (payload && payload.data) || {};
          const missing = {};
          Object.keys(local).forEach((key) => {
            if (!Object.prototype.hasOwnProperty.call(remote, key)) missing[key] = local[key];
          });
          const merged = Object.assign({}, local, remote);
          applyLocalPrefs(merged);
          const changed = before !== prefsSnapshot();
          const upload = Object.keys(missing).length
            ? postAuth("/api/preferences", { data: missing }, "PUT")
            : Promise.resolve();
          return upload.then(() => {
            if (reloadIfChanged && changed) {
              window.location.reload();
              return true;
            }
            return false;
          });
        })
        .catch(() => false);
    };

    const ensureSettings = () => {
      if (document.getElementById("settings-modal")) return;
      const root = document.createElement("div");
      root.id = "settings-modal";
      root.className = "auth-modal settings-modal";
      root.hidden = true;
      root.innerHTML =
        '<button type="button" class="auth-modal__backdrop" data-settings-close tabindex="-1"></button>' +
        '<div class="auth-modal__panel settings-modal__panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">' +
        '<div class="auth-modal__head"><p id="settings-title" class="auth-modal__title">' +
        t("settings") +
        '</p><button type="button" class="auth-modal__close" data-settings-close aria-label="' +
        t("auth_close") +
        '">×</button></div>' +
        '<p class="auth-modal__lead">' +
        t("settings_lead") +
        "</p>" +
        '<p class="auth-modal__msg" id="settings-msg" hidden></p>' +
        '<form class="auth-modal__form" id="settings-form">' +
        '<div class="auth-photo"><span class="auth-photo__preview" id="settings-avatar-preview" hidden></span>' +
        "<label><span>" +
        t("auth_photo") +
        '</span><input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" />' +
        '<small class="auth-photo__hint">' +
        t("auth_photo_hint") +
        "</small></label></div>" +
        "<label><span>" +
        t("auth_first_name") +
        '</span><input type="text" name="first_name" maxlength="80" autocomplete="given-name" required /></label>' +
        "<label><span>" +
        t("auth_last_name") +
        '</span><input type="text" name="last_name" maxlength="80" autocomplete="family-name" required /></label>' +
        "<label><span>" +
        t("auth_display_name") +
        '</span><input type="text" name="display_name" maxlength="80" autocomplete="nickname" /></label>' +
        "<label><span>" +
        t("auth_email") +
        '</span><input type="email" name="email" readonly /></label>' +
        '<p class="settings-verified" id="settings-verified"></p>' +
        "<label><span>" +
        t("pref_locale") +
        "</span>" +
        prefLocaleHtml("settings-pref-locale", currentLang()) +
        "</label>" +
        "<label><span>" +
        t("pref_view_stories") +
        '</span><select name="home_view"><option value="list">' +
        t("pref_view_list") +
        '</option><option value="cards">' +
        t("pref_view_cards") +
        "</option></select></label>" +
        "<label><span>" +
        t("pref_view_category") +
        '</span><select name="category_view"><option value="list">' +
        t("pref_view_list") +
        '</option><option value="cards">' +
        t("pref_view_cards") +
        "</option></select></label>" +
        "<label><span>" +
        t("pref_view_discoveries") +
        '</span><select name="inventions_view"><option value="list">' +
        t("pref_view_list") +
        '</option><option value="cards">' +
        t("pref_view_cards") +
        "</option></select></label>" +
        '<label class="settings-check"><input type="checkbox" name="images_collapsed" /> ' +
        t("pref_hide_images") +
        "</label>" +
        '<label class="settings-check"><input type="checkbox" name="texts_collapsed" /> ' +
        t("pref_hide_texts") +
        "</label>" +
        '<button type="submit" class="auth-modal__submit">' +
        t("settings_save") +
        "</button></form>" +
        '<div class="settings-danger">' +
        '<p class="settings-danger__title">' +
        t("settings_delete") +
        "</p>" +
        '<p class="settings-danger__lead">' +
        t("settings_delete_lead") +
        "</p>" +
        '<button type="button" class="settings-danger__open" data-delete-account>' +
        t("settings_delete") +
        "</button>" +
        '<div class="settings-confirm" id="settings-delete-confirm" hidden>' +
        '<p class="settings-confirm__text">' +
        t("settings_delete_confirm") +
        "</p>" +
        '<div class="settings-confirm__actions">' +
        '<button type="button" class="settings-confirm__cancel" data-delete-cancel>' +
        t("settings_delete_cancel") +
        "</button>" +
        '<button type="button" class="settings-confirm__yes" data-delete-confirm>' +
        t("settings_delete_forever") +
        "</button></div></div></div></div>";
      document.body.appendChild(root);
      const hideDeleteConfirm = () => {
        const panel = document.getElementById("settings-delete-confirm");
        if (panel) panel.hidden = true;
      };
      root.addEventListener("click", (event) => {
        if (event.target.closest("[data-settings-close]")) {
          hideDeleteConfirm();
          root.hidden = true;
          document.body.classList.remove("auth-modal-open");
        }
        if (event.target.closest("[data-delete-account]")) {
          const panel = document.getElementById("settings-delete-confirm");
          if (panel) panel.hidden = false;
        }
        if (event.target.closest("[data-delete-cancel]")) hideDeleteConfirm();
        if (event.target.closest("[data-delete-confirm]")) {
          const btn = event.target.closest("[data-delete-confirm]");
          btn.disabled = true;
          postAuth("/api/auth/me", { confirm: true }, "DELETE")
            .then(() => {
              clearReadingPrefs();
              hideDeleteConfirm();
              root.hidden = true;
              document.body.classList.remove("auth-modal-open");
              renderChrome(null);
            })
            .catch((err) => {
              btn.disabled = false;
              const msg = document.getElementById("settings-msg");
              msg.hidden = false;
              msg.classList.add("is-error");
              msg.textContent = err.message;
            });
        }
      });
      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || root.hidden) return;
        const panel = document.getElementById("settings-delete-confirm");
        if (panel && !panel.hidden) {
          hideDeleteConfirm();
          return;
        }
        root.hidden = true;
        document.body.classList.remove("auth-modal-open");
      });
      document.getElementById("settings-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const fd = new FormData(form);
        const firstName = String(fd.get("first_name") || "").trim();
        const lastName = String(fd.get("last_name") || "").trim();
        const displayName = String(fd.get("display_name") || "").trim();
        const locale = String(fd.get("preferred_locale") || currentLang());
        const prefs = {
          home_view: fd.get("home_view"),
          category_view: fd.get("category_view"),
          inventions_view: fd.get("inventions_view"),
          images_collapsed: form.images_collapsed.checked,
          texts_collapsed: form.texts_collapsed.checked,
        };
        const msg = document.getElementById("settings-msg");
        const photo = form.avatar && form.avatar.files && form.avatar.files[0];
        const beforePrefs = prefsSnapshot();
        Promise.all([
          postAuth(
            "/api/auth/me",
            {
              first_name: firstName,
              last_name: lastName,
              display_name: displayName || null,
              preferred_locale: locale,
            },
            "PATCH"
          ),
          postAuth("/api/preferences", { data: prefs }, "PUT"),
        ])
          .then(([meRes]) => (photo && photo.size ? uploadAvatar(photo) : meRes))
          .then((meRes) => {
            applyLocalPrefs(prefs);
            const prefsChanged = beforePrefs !== prefsSnapshot();
            msg.hidden = false;
            msg.classList.remove("is-error");
            msg.textContent = t("settings_saved");
            renderChrome(meRes.user);
            if (goPreferredLocale(meRes.user)) return;
            if (prefsChanged) window.location.reload();
          })
          .catch((err) => {
            msg.hidden = false;
            msg.classList.add("is-error");
            msg.textContent = err.message;
          });
      });
      bindPhotoPreview(
        document.querySelector("#settings-form input[name='avatar']"),
        document.getElementById("settings-avatar-preview")
      );
    };

    const openSettings = (user) => {
      ensureSettings();
      const root = document.getElementById("settings-modal");
      const form = document.getElementById("settings-form");
      const local = readLocalPrefs();
      fetch(apiUrl("/api/preferences"), { credentials: "include" })
        .then((res) => res.json())
        .then((payload) => {
          const data = Object.assign({}, local, payload.data || {});
          form.display_name.value = user.display_name || "";
          form.first_name.value = user.first_name || "";
          form.last_name.value = user.last_name || "";
          form.email.value = user.email;
          setPrefLocaleValue(form.querySelector("[data-pref-locale]"), user.preferred_locale || currentLang());
          bindPrefLocale(form.querySelector("[data-pref-locale]"));
          form.home_view.value = data.home_view === "cards" ? "cards" : "list";
          form.category_view.value = data.category_view === "cards" ? "cards" : "list";
          form.inventions_view.value = data.inventions_view === "cards" ? "cards" : "list";
          form.images_collapsed.checked = !!data.images_collapsed;
          form.texts_collapsed.checked = !!data.texts_collapsed;
          document.getElementById("settings-verified").textContent = user.is_verified
            ? t("pref_verified")
            : t("pref_unverified");
          document.getElementById("settings-msg").hidden = true;
          const preview = document.getElementById("settings-avatar-preview");
          if (preview) {
            if (user.avatar_url) {
              preview.innerHTML = '<img alt="" src="' + user.avatar_url + '" />';
              preview.hidden = false;
            } else {
              preview.innerHTML = "";
              preview.hidden = true;
            }
          }
          if (form.avatar) form.avatar.value = "";
          const confirmPanel = document.getElementById("settings-delete-confirm");
          if (confirmPanel) confirmPanel.hidden = true;
          const yes = root.querySelector("[data-delete-confirm]");
          if (yes) yes.disabled = false;
          root.hidden = false;
          document.body.classList.add("auth-modal-open");
          form.display_name.focus();
        })
        .catch(() => {
          form.first_name.value = user.first_name || "";
          form.last_name.value = user.last_name || "";
          form.display_name.value = user.display_name || "";
          form.email.value = user.email;
          root.hidden = false;
        });
    };

    window.__birinciRefreshAuthChrome = () => {
      if (!document.querySelector(".site-header__actions")) return;
      renderChrome(chromeUser);
      refreshAuthModalCopy();
      // Rebuild settings next open so its labels match the active language.
      const settings = document.getElementById("settings-modal");
      if (settings) settings.remove();
    };
    if (document.body) {
      const langObserver = new MutationObserver(() => {
        window.__birinciRefreshAuthChrome();
      });
      langObserver.observe(document.body, { attributes: true, attributeFilter: ["data-lang"] });
    }

    // Build the modal before painting buttons so root-home language applyLang
    // (MutationObserver) cannot leave Sign in / Sign up without a click handler.
    ensureModal();
    renderChrome(null);

    resolveApiOrigin()
      .then(() => apiFetch("/api/auth/me"))
      .then((res) => res.json())
      .then((data) => {
        const user = data.user || null;
        renderChrome(user);
        if (user) syncPrefsFromServer({ reloadIfChanged: true });
      })
      .catch(() => {
        renderChrome(null);
      });
  };

  try {
    initHomeViews();
  } catch (err) {
    console.error("initHomeViews failed", err);
  }
  try {
    hideAudioChrome();
  } catch (err) {
    console.error("hideAudioChrome failed", err);
  }
  try {
    initStoryTts();
  } catch (err) {
    console.error("initStoryTts failed", err);
  }
  try {
    initAboutValuesHighlight();
  } catch (err) {
    console.error("initAboutValuesHighlight failed", err);
  }

  try {
    initSitemapSearch();
  } catch (err) {
    console.error("initSitemapSearch failed", err);
  }

  try {
    initAzLexicon();
  } catch (err) {
    console.error("initAzLexicon failed", err);
  }

  try {
    initAccountEntry();
  } catch (err) {
    console.error("initAccountEntry failed", err);
  }

  try {
    const current = document.querySelector('script[src*="site.js"]');
    const src = ((current && current.getAttribute("src")) || "/assets/site.js").replace(/site\.js[^/]*$/, "engage.js?v=20260823k");
    if (!document.querySelector("script[data-birinci-engage]")) {
      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.dataset.birinciEngage = "1";
      document.body.appendChild(script);
    }
  } catch (err) {
    console.error("engage.js load failed", err);
  }

  document.querySelectorAll(".category-layout").forEach((layout) => {
    try {
      bindStorySidebarLayout(layout);
    } catch (err) {
      console.error("bindStorySidebarLayout failed", err);
    }
  });
})();
