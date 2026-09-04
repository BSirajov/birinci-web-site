window.__BIRINCI_STORY_ICONS__ = {"text": "<svg class=\"tools-bar__glyph\" viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" aria-hidden=\"true\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M7 3h7l5 5v13H7z\"/><path d=\"M14 3v5h5\"/><path d=\"M9 13h6\"/><path d=\"M9 17h6\"/></svg>", "text-off": "<svg class=\"tools-bar__glyph\" viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" aria-hidden=\"true\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M7 3h7l5 5v13H7z\"/><path d=\"M14 3v5h5\"/><path d=\"M9 13h6\"/><path d=\"M9 17h6\"/><path d=\"M5 5l14 14\"/></svg>", "eye": "<svg class=\"tools-bar__glyph\" viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" aria-hidden=\"true\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></svg>", "eye-off": "<svg class=\"tools-bar__glyph\" viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" aria-hidden=\"true\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 3l18 18\"/><path d=\"M10.6 10.6a3 3 0 0 0 4.2 4.2\"/><path d=\"M9.9 5.1A11 11 0 0 1 12 5c6.5 0 10 7 10 7a19 19 0 0 1-3.2 4.1\"/><path d=\"M6.1 6.1C3.6 7.8 2 12 2 12s3.5 7 10 7c1.6 0 3.1-.3 4.4-.9\"/></svg>", "listen": "<svg class=\"tools-bar__glyph\" viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" aria-hidden=\"true\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polygon points=\"11 5 6 9 2 9 2 15 6 15 11 19 11 5\"/><path d=\"M15.54 8.46a5 5 0 0 1 0 7.07\"/><path d=\"M19.07 4.93a10 10 0 0 1 0 14.14\"/></svg>", "stop": "<svg class=\"tools-bar__glyph\" viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" aria-hidden=\"true\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polygon points=\"11 5 6 9 2 9 2 15 6 15 11 19 11 5\"/><path d=\"M15.54 8.46a5 5 0 0 1 0 7.07\"/><path d=\"M19.07 4.93a10 10 0 0 1 0 14.14\"/><path d=\"M3 3l18 18\"/></svg>"};

(() => {
  const I18N = window.__BIRINCI_I18N__ || { lang: "az", ui: {}, js: {} };
  const PAGE_LANG = String(
    I18N.lang ||
      (document.body && document.body.getAttribute("data-lang")) ||
      document.documentElement.lang ||
      "az"
  )
    .toLowerCase()
    .split(/[-_]/)[0];
  const audioFlagsForLang = (code) => {
    const lang = String(code || "az")
      .toLowerCase()
      .split(/[-_]/)[0];
    const on = lang !== "ky";
    return { stories: on, discoveries: on };
  };
  let LOCALE_TAG = I18N.lang || document.documentElement.lang || "az";
  const catalogLocale = String(LOCALE_TAG || "az")
    .toLowerCase()
    .split(/[-_]/)[0] || "az";
  const catalogCollator = (() => {
    try {
      return new Intl.Collator(catalogLocale, { sensitivity: "base" });
    } catch (_) {
      return new Intl.Collator("en", { sensitivity: "base" });
    }
  })();
  const compareCatalogTitles = (a, b) =>
    catalogCollator.compare(String(a || ""), String(b || ""));
  const NUMBERED_LABEL_RE = /^(?:§\s*)?\d+(?:\.\d+)*\.?\s+/;
  const visibleCatalogLabel = (text) =>
    String(text || "").replace(NUMBERED_LABEL_RE, "").trim();
  // Ignore stale i18n `show_audio_controls: false` from older Hostinger uploads.
  // Listen stays on for AZ/EN/RU even when that flag is still false on the live site.
  let SHOW_AUDIO_CONTROLS = audioFlagsForLang(PAGE_LANG).stories;
  // No native Kyrgyz neural voice — keep Listen off on KY articles.
  let SHOW_DISCOVERY_LISTEN = audioFlagsForLang(PAGE_LANG).discoveries;
  const applyAudioFlags = (code) => {
    const flags = audioFlagsForLang(code);
    SHOW_AUDIO_CONTROLS = flags.stories;
    SHOW_DISCOVERY_LISTEN = flags.discoveries;
  };

  // Wisdom illustrations default to hidden. One-time migration overrides older
  // sessions that stored "show" ("0") before this product default.
  const IMAGES_COLLAPSED_KEY = "birinci-images-collapsed";
  const IMAGES_COLLAPSED_DEFAULT_V2 = "birinci-images-collapsed-default-v2";
  const readImagesCollapsedPref = () => {
    try {
      if (localStorage.getItem(IMAGES_COLLAPSED_DEFAULT_V2) !== "1") {
        localStorage.setItem(IMAGES_COLLAPSED_DEFAULT_V2, "1");
        localStorage.setItem(IMAGES_COLLAPSED_KEY, "1");
        return true;
      }
      const stored = localStorage.getItem(IMAGES_COLLAPSED_KEY);
      if (stored != null) return stored === "1";
    } catch (_) {}
    return true;
  };

  const hideAudioChrome = (root = document) => {
    (root || document)
      .querySelectorAll(
        "[data-story-tts], [data-tools-play-visible], [data-story-tts-note], .story-tts__note, [data-discovery-tts], .inventions-entry__tts, .tools-bar__field--listen"
      )
      .forEach((el) => {
        const isDiscovery = !!(
          el.closest(
            "[data-discovery-tts], .inventions-entry__tts, .inventions-entry, .tools-bar--inventions, [data-tools='inventions']"
          )
        );
        if (isDiscovery) {
          if (SHOW_DISCOVERY_LISTEN) return;
        } else if (SHOW_AUDIO_CONTROLS) {
          return;
        }
        const group = el.closest(
          ".story__action-group, .tools-bar__field, .text-lightbox__tts, .inventions-entry__tts"
        );
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

  const escapeStoryNav = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const storyNavGroupsFromCatalog = (catalog) =>
    ((catalog && catalog.categories) || []).map((cat) => ({
      slug: cat.slug,
      title: cat.title,
      stories: (cat.stories || [])
        .map((story) => ({
          stem: story.stem,
          title: story.title,
        }))
        .sort((a, b) => compareCatalogTitles(a.title, b.title)),
    }));

  const groupedStoryNavMarkup = (groups, options = {}) => {
    const visible = options.visibleStems || null;
    const hrefForStory =
      options.hrefForStory ||
      ((stem) => `#${stem}`);
    const hrefForCategory =
      options.hrefForCategory ||
      ((group) => {
        const first = (group.stories || []).find((story) => !visible || visible.has(story.stem));
        return first ? hrefForStory(first.stem, group) : `#${group.slug}`;
      });
    if (options.flat) {
      const flat = [];
      (groups || []).forEach((group) => {
        (group.stories || []).forEach((story) => {
          if (visible && !visible.has(story.stem)) return;
          flat.push({ stem: story.stem, title: story.title, group });
        });
      });
      flat.sort((a, b) => compareCatalogTitles(a.title, b.title));
      return flat
        .map(
          (story) =>
            `<li class="inventions-toc-entry" data-toc-entry="${escapeStoryNav(
              story.stem
            )}" data-stem="${escapeStoryNav(story.stem)}" data-title="${escapeStoryNav(
              story.title
            )}"><a href="${escapeStoryNav(hrefForStory(story.stem, story.group))}">${escapeStoryNav(
              story.title
            )}</a></li>`
        )
        .join("");
    }
    return groups
      .map((group) => {
        const stories = group.stories || [];
        const shown = stories.filter((story) => !visible || visible.has(story.stem));
        if (!shown.length) return "";
        const catHref = hrefForCategory(group);
        const catLabel = categoryTitleWithCount(visibleCatalogLabel(group.title), shown.length);
        let html = `<li class="inventions-toc-cat-row" data-toc-cat="${escapeStoryNav(
          group.slug
        )}"><a href="${escapeStoryNav(catHref)}">${escapeStoryNav(
          catLabel
        )}</a></li>`;
        shown.forEach((story) => {
          html += `<li class="inventions-toc-entry" data-toc-entry="${escapeStoryNav(
            story.stem
          )}" data-toc-cat="${escapeStoryNav(group.slug)}" data-stem="${escapeStoryNav(
            story.stem
          )}" data-title="${escapeStoryNav(story.title)}"><a href="${escapeStoryNav(
            hrefForStory(story.stem, group)
          )}">${escapeStoryNav(story.title)}</a></li>`;
        });
        return html;
      })
      .join("");
  };

  const fillGroupedStoryNav = (list, options = {}) => {
    if (!list) return;
    const collapsed = new Set();
    list.querySelectorAll(".toc-group[data-toc-cat]:not(.events-open)").forEach((group) => {
      const slug = group.getAttribute("data-toc-cat");
      if (slug) collapsed.add(slug);
    });
    if (options.syncRoot) {
      collectCollapsedStoryCategories(options.syncRoot).forEach((slug) => collapsed.add(slug));
    }
    const catalog = options.catalog || window.__BIRINCI_STORIES__;
    let groups = storyNavGroupsFromCatalog(catalog);
    if (!groups.length) {
      const items = Array.from(list.querySelectorAll("li[data-stem]"));
      if (!items.length) return;
      groups = [
        {
          slug: options.fallbackSlug || "stories",
          title: options.fallbackTitle || tUi("nav_stories_all", "Hekayələr"),
          stories: items.map((item) => ({
            stem: item.getAttribute("data-stem"),
            title: item.getAttribute("data-title") || (item.querySelector("a") && item.querySelector("a").textContent) || "",
          })),
        },
      ];
    }
    list.removeAttribute("data-kt-toc-groups");
    list.innerHTML = groupedStoryNavMarkup(groups, options);
    const api = window.KT_SIDEBAR_TOC_GROUPS;
    if (api && typeof api.enhanceList === "function") api.enhanceList(list);
    if (api && typeof api.bindPanelControls === "function") {
      api.bindPanelControls(list.closest(".sidebar-widget"));
    }
    syncStoryExpandCollapseChrome();
    if (options.expandAll && api && typeof api.expandAll === "function") {
      api.expandAll(list.closest(".sidebar-widget"));
    } else {
      collapsed.forEach((slug) => {
        const group = list.querySelector(`.toc-group[data-toc-cat="${cssEscapeAttr(slug)}"]`);
        if (group && api && typeof api.setGroupExpanded === "function") {
          api.setGroupExpanded(group, false);
        }
      });
    }
    const visible = options.visibleStems || null;
    const shownCount = Number(options.shownCount);
    const total = Number.isFinite(shownCount)
      ? Math.floor(shownCount)
      : groups.reduce((sum, group) => {
          const stories = group.stories || [];
          return (
            sum +
            stories.filter((story) => !visible || visible.has(story.stem)).length
          );
        }, 0);
    setWidgetHeadCount(list.closest(".sidebar-widget"), total);
  };

  const categoryTitleWithCount = (title, count) => {
    const base = visibleCatalogLabel(String(title || "").replace(/\s*\(\d+\)\s*$/, ""));
    const n = Number(count);
    if (!base || !Number.isFinite(n) || n < 0) return base;
    return `${base} (${Math.floor(n)})`;
  };

  const setWidgetHeadCount = (widget, count) => {
    if (!widget) return;
    const title =
      widget.querySelector(".widget-head__title") || widget.querySelector(".widget-head > span");
    if (!title) return;
    const n = Math.floor(Number(count));
    if (!Number.isFinite(n) || n < 0) return;
    let textNode = null;
    for (let node = title.firstChild; node; node = node.nextSibling) {
      if (node.nodeType === 3 && String(node.textContent || "").trim()) textNode = node;
    }
    if (!textNode) {
      title.appendChild(document.createTextNode(""));
      textNode = title.lastChild;
    }
    const base = String(textNode.textContent || "").replace(/\s*\(\d+\)\s*$/, "").replace(/\s+$/, "");
    textNode.textContent = `${base} (${n})`;
  };

  const cssEscapeAttr = (value) =>
    window.CSS && typeof window.CSS.escape === "function"
      ? window.CSS.escape(value)
      : String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  const storyCatalogNumbering = (catalog) => {
    const byStem = new Map();
    ((catalog && catalog.categories) || []).forEach((cat, catIndex) => {
      (cat.stories || []).forEach((story, storyIndex) => {
        byStem.set(story.stem, {
          num: `${catIndex + 1}.${storyIndex + 1}`,
          categoryIndex: catIndex + 1,
          categorySlug: cat.slug,
          categoryTitle: cat.title,
        });
      });
    });
    return byStem;
  };

  const groupStoriesByCategory = (stories, catalog) => {
    const cats = (catalog && catalog.categories) || [];
    const order = cats.map((cat) => cat.slug).filter(Boolean);
    const titles = new Map(cats.map((cat) => [cat.slug, cat.title]));
    titles.set(STORY_UNCATEGORIZED_SLUG, uncategorizedStoriesLabel());
    const totals = new Map(cats.map((cat) => [cat.slug, (cat.stories || []).length]));
    const buckets = new Map();
    (stories || []).forEach((story) => {
      const raw =
        story.categorySlug ||
        (story.dataset && story.dataset.categorySlug) ||
        "";
      const slug = String(raw).trim() || STORY_UNCATEGORIZED_SLUG;
      if (!buckets.has(slug)) buckets.set(slug, []);
      buckets.get(slug).push(story);
    });
    const slugs = order.filter((slug) => buckets.has(slug));
    if (buckets.has(STORY_UNCATEGORIZED_SLUG) && !slugs.includes(STORY_UNCATEGORIZED_SLUG)) {
      slugs.push(STORY_UNCATEGORIZED_SLUG);
    }
    buckets.forEach((_, slug) => {
      if (!slugs.includes(slug)) slugs.push(slug);
    });
    return slugs.map((slug) => {
      const idx = order.indexOf(slug);
      const n = idx >= 0 ? idx + 1 : slugs.indexOf(slug) + 1;
      const first = buckets.get(slug)[0];
      const title =
        titles.get(slug) ||
        (first && (first.categoryTitle || (first.dataset && first.dataset.categoryTitle))) ||
        (slug === STORY_UNCATEGORIZED_SLUG ? uncategorizedStoriesLabel() : slug);
      return {
        slug,
        title,
        n,
        stories: buckets
          .get(slug)
          .slice()
          .sort((a, b) =>
            compareCatalogTitles(
              a.title || (a.dataset && a.dataset.title) || "",
              b.title || (b.dataset && b.dataset.title) || ""
            )
          ),
        total: totals.get(slug) || buckets.get(slug).length,
      };
    });
  };

  const collectCollapsedStoryCategories = (root) => {
    const collapsed = new Set();
    (root || document).querySelectorAll(".inventions-category.is-collapsed[id]").forEach((cat) => {
      collapsed.add(cat.id);
    });
    return collapsed;
  };

  const bindStoryCategoryToggles = (root) => {
    const host = root || document;
    const api = window.KT_SIDEBAR_TOC_GROUPS;
    host.querySelectorAll(".inventions-category").forEach((cat) => {
      if (cat.getAttribute("data-kt-cat-toggle")) return;
      cat.setAttribute("data-kt-cat-toggle", "1");
      const head = cat.querySelector(".inventions-category-head");
      if (!head) return;
      head.classList.add("inventions-category-head--collapsible");
      let btn = head.querySelector(".inventions-category-toggle");
      if (!btn) {
        btn = document.createElement("button");
        btn.type = "button";
        btn.className = "inventions-category-toggle";
        const chevron = document.createElement("span");
        chevron.className = "inventions-category-toggle__chevron";
        chevron.setAttribute("aria-hidden", "true");
        btn.appendChild(chevron);
        head.appendChild(btn);
      }
      btn.setAttribute("aria-expanded", cat.classList.contains("is-collapsed") ? "false" : "true");
      btn.setAttribute(
        "aria-label",
        "Toggle " + (head.textContent || "category").replace(/\s+/g, " ").trim()
      );
      const togglePair = () => {
        const next = cat.classList.contains("is-collapsed");
        if (cat.id && api && typeof api.setGroupExpanded === "function") {
          const group = document.querySelector(`.toc-group[data-toc-cat="${cssEscapeAttr(cat.id)}"]`);
          if (group) {
            api.setGroupExpanded(group, next);
            return;
          }
        }
        cat.classList.toggle("is-collapsed", !next);
        btn.setAttribute("aria-expanded", next ? "true" : "false");
      };
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        togglePair();
      });
      head.addEventListener("click", (event) => {
        if (event.target.closest("a, button")) return;
        togglePair();
      });
    });
    if (api && typeof api.syncAllMainCategoriesFromToc === "function") {
      api.syncAllMainCategoriesFromToc(host);
    }
  };

  const applyStoryTitleNumber = (titleEl, _num, title) => {
    if (!titleEl) return;
    const next = visibleCatalogLabel(title || titleEl.textContent || "");
    if (!next) return;
    const name = titleEl.querySelector(".inventions-entry-name");
    if (name) name.textContent = next;
    else titleEl.textContent = next;
  };

  const loadStoriesCatalog = (scriptUrl) => {
    if (window.__BIRINCI_STORIES__) return Promise.resolve(window.__BIRINCI_STORIES__);
    if (!scriptUrl) return Promise.resolve(null);
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      script.onload = () => resolve(window.__BIRINCI_STORIES__ || null);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  };

  const storyCategorySlugFromHref = (href) => {
    const match = String(href || "").match(/([^/]+)\.html(?:[?#].*)?$/i);
    return match ? decodeURIComponent(match[1]) : "";
  };

  const parseStoryCatParam = (params) => {
    const raw = params && typeof params.get === "function" ? params.get("cat") || "" : "";
    return String(raw)
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  };

  const storyCategoriesForFilter = () => {
    const cats = ((window.__BIRINCI_STORIES__ || {}).categories) || [];
    let rows;
    if (cats.length) {
      rows = cats.map((cat, index) => ({
        slug: cat.slug,
        title: cat.title,
        label: `${index + 1}. ${cat.title}`,
      }));
    } else {
      rows = Array.from(document.querySelectorAll(".cat-card[href], .cat-card[data-slug]"))
        .map((card, index) => {
          const slug = card.getAttribute("data-slug") || storyCategorySlugFromHref(card.getAttribute("href"));
          const title =
            card.getAttribute("data-title") ||
            ((card.querySelector(".card-title, h2") || {}).textContent || "").trim() ||
            slug;
          return { slug, title, label: `${index + 1}. ${title}` };
        })
        .filter((row) => row.slug);
    }
    const uncatLabel = uncategorizedStoriesLabel();
    if (!rows.some((row) => row.slug === STORY_UNCATEGORIZED_SLUG)) {
      rows.push({
        slug: STORY_UNCATEGORIZED_SLUG,
        title: uncatLabel,
        label: uncatLabel,
      });
    }
    return rows;
  };

  const STORY_UNCATEGORIZED_SLUG = "__uncategorized__";

  const activeStoryCategorySlugs = () => {
    const api = window.KT_CATALOG_MULTI_FILTER;
    if (api && typeof api.getActiveValues === "function") {
      return api.getActiveValues("filterStoryCategory") || [];
    }
    const select = document.getElementById("filterStoryCategory");
    return select && select.value ? [select.value] : [];
  };

  /** True when Category multi-filter is active but no category boxes are checked (Select All unchecked). */
  const storyCategoryFilterNoneSelected = () => {
    const api = window.KT_CATALOG_MULTI_FILTER;
    if (api && typeof api.isActive === "function" && typeof api.getActiveValues === "function") {
      return (
        !!api.isActive("filterStoryCategory") &&
        !(api.getActiveValues("filterStoryCategory") || []).length
      );
    }
    return false;
  };

  const isStoryUncategorizedSlug = (slug) => {
    const s = String(slug || "").trim();
    return !s || s === STORY_UNCATEGORIZED_SLUG;
  };

  const uncategorizedStoriesLabel = () =>
    tUi("uncategorized_stories", "Kateqoriyasız");

  const storyCategoryPasses = (slug) => {
    const api = window.KT_CATALOG_MULTI_FILTER;
    if (api && typeof api.isActive === "function") {
      if (!api.isActive("filterStoryCategory")) return true;
      const active = api.getActiveValues("filterStoryCategory") || [];
      // Select All unchecked: list view uses a dedicated uncategorized render path;
      // category cards stay hidden (they all have real slugs).
      if (!active.length) return isStoryUncategorizedSlug(slug);
      if (active.indexOf(STORY_UNCATEGORIZED_SLUG) >= 0 && isStoryUncategorizedSlug(slug)) {
        return true;
      }
      return active.indexOf(String(slug || "")) >= 0;
    }
    const active = activeStoryCategorySlugs();
    return !active.length || active.indexOf(String(slug || "")) >= 0;
  };

  const clearStoryCatalogFilters = (searchInput) => {
    if (searchInput) searchInput.value = "";
    const api = window.KT_CATALOG_MULTI_FILTER;
    if (api && typeof api.setActiveValues === "function") {
      api.setActiveValues("filterStoryCategory", [], { silent: true });
    } else {
      const select = document.getElementById("filterStoryCategory");
      if (select) select.value = "";
    }
  };

  /**
   * Expand/Collapse when category groups are on screen:
   * - Select All (all categories) → show
   * - 2+ individual categories → show
   * - flat list (Select All unchecked) or a single category → hide
   */
  const storyExpandCollapseShouldShow = () => {
    if (storyCategoryFilterNoneSelected()) return false;
    const active = (activeStoryCategorySlugs() || []).filter(
      (slug) => slug && slug !== STORY_UNCATEGORIZED_SLUG
    );
    const api = window.KT_CATALOG_MULTI_FILTER;
    const selectAllOn =
      api && typeof api.isActive === "function" && !api.isActive("filterStoryCategory");
    if (selectAllOn) return true;
    if (active.length >= 2) return true;
    const listRoot =
      document.querySelector('[data-view="list"]:not([hidden])') ||
      document.querySelector(".home-stories-layout, .page-home .stories-layout");
    if (!listRoot) return false;
    return listRoot.querySelectorAll("section.stories-category, .stories-category").length >= 2;
  };

  const syncStoryExpandCollapseChrome = () => {
    const show = storyExpandCollapseShouldShow();
    document.body.classList.toggle("story-expand-collapse-on", show);
    document.querySelectorAll(".story-nav .sidebar-widget").forEach((widget) => {
      const actions = widget.querySelector(".widget-actions");
      if (!actions) return;
      if (
        !actions.querySelector(
          '[data-toc-action="expand-all"], [data-toc-action="collapse-all"], [data-toc-action="toggle-categories"]'
        )
      ) {
        return;
      }
      if (show) {
        actions.hidden = false;
        actions.removeAttribute("hidden");
        actions.classList.remove("is-hidden");
        actions.setAttribute("aria-hidden", "false");
      } else {
        actions.hidden = true;
        actions.setAttribute("hidden", "");
        actions.classList.add("is-hidden");
        actions.setAttribute("aria-hidden", "true");
      }
    });
  };

  if (!window.__birinciStoryExpandCollapseFilterBound) {
    window.__birinciStoryExpandCollapseFilterBound = true;
    document.addEventListener("kt-catalog-filter-change", (event) => {
      const id = event && event.detail && event.detail.id;
      if (id && id !== "filterStoryCategory") return;
      window.requestAnimationFrame(() => syncStoryExpandCollapseChrome());
    });
  }

  const syncStoryCategoryFilterChrome = () => {
    const label = tUi("category_filter", "Kateqoriya");
    const clear = tUi("clear_filter", "Filtri sil");
    const labelEl = document.getElementById("story-cat-label");
    if (labelEl) labelEl.textContent = label;
    const select = document.getElementById("filterStoryCategory");
    if (select) {
      const placeholder = select.querySelector('option[value=""]');
      if (placeholder) placeholder.textContent = label;
      select.setAttribute("aria-label", label);
    }
    const clearBtn = document.querySelector('.sel-clear[data-for="filterStoryCategory"]');
    if (clearBtn) {
      clearBtn.title = clear;
      clearBtn.setAttribute("aria-label", clear);
    }
  };

  const fillStoryCategorySelect = (select, selected) => {
    if (!select) return;
    const cats = storyCategoriesForFilter();
    if (!cats.length) return;
    const keep = Array.isArray(selected) ? selected.slice() : activeStoryCategorySlugs();
    const label = tUi("category_filter", "Kateqoriya");
    select.innerHTML =
      `<option value="">${escapeStoryNav(label)}</option>` +
      cats
        .map(
          (cat) =>
            `<option value="${escapeStoryNav(cat.slug)}">${escapeStoryNav(cat.label)}</option>`
        )
        .join("");
    const api = window.KT_CATALOG_MULTI_FILTER;
    if (api && typeof api.refresh === "function" && api.enhanceSelect) {
      api.enhanceSelect(select);
      api.refresh(select.id);
      if (keep.length) api.setActiveValues(select.id, keep, { silent: true });
    } else if (keep.length === 1) {
      select.value = keep[0];
    }
    syncStoryCategoryFilterChrome();
  };

  const bindStoryCategoryFilter = (bar, { initialSlugs, onChange } = {}) => {
    if (!bar) return null;
    let field = bar.querySelector("[data-story-cat-filter]");
    if (!field) {
      const label = tUi("category_filter", "Kateqoriya");
      const clear = tUi("clear_filter", "Filtri sil");
      field = document.createElement("div");
      field.className = "tools-bar__field tools-bar__field--filter";
      field.setAttribute("data-story-cat-filter", "");
      field.setAttribute("data-home-list-only", "");
      field.innerHTML =
        `<span class="tools-bar__label" id="story-cat-label">${escapeStoryNav(label)}</span>` +
        `<div class="sel-wrap">` +
        `<select id="filterStoryCategory" aria-labelledby="story-cat-label"><option value="">${escapeStoryNav(
          label
        )}</option></select>` +
        `<button class="sel-clear" data-for="filterStoryCategory" title="${escapeStoryNav(
          clear
        )}" type="button" aria-label="${escapeStoryNav(clear)}">×</button>` +
        `</div>`;
      ensureStoryToolsSearchRow(bar);
      const searchRow = bar.querySelector(":scope > .tools-bar__search-row");
      if (searchRow) searchRow.appendChild(field);
      else {
        const search = bar.querySelector(".tools-bar__search");
        if (search) search.after(field);
        else bar.insertBefore(field, bar.firstChild);
      }
    } else {
      field.setAttribute("data-home-list-only", "");
    }
    const select = field.querySelector("#filterStoryCategory");
    fillStoryCategorySelect(select, initialSlugs);
    const api = window.KT_CATALOG_MULTI_FILTER;
    if (api && typeof api.enhanceSelect === "function") {
      api.enhanceSelect(select);
      if (initialSlugs && initialSlugs.length) {
        api.setActiveValues(select.id, initialSlugs, { silent: true });
      }
      const clearBtn = field.querySelector(".sel-clear");
      if (clearBtn && clearBtn.getAttribute("data-kt-multi-clear") !== "1") {
        clearBtn.setAttribute("data-kt-multi-clear", "1");
        clearBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          api.clear(select.id);
        });
      }
    }
    if (!select.dataset.storyCatBound) {
      select.dataset.storyCatBound = "1";
      select.addEventListener("change", () => {
        if (typeof onChange === "function") onChange(activeStoryCategorySlugs());
      });
    }
    window.__birinciRefreshStoryCategoryFilter = () => {
      const current = activeStoryCategorySlugs();
      fillStoryCategorySelect(
        select,
        current.length ? current : initialSlugs
      );
    };
    ensureStoryToolsSearchRow(bar);
    ensureStoryToolsControlRow(bar);
    // Category filter is list-view only (cards show the category grid).
    const homeView =
      window.__birinciHomeView ||
      document.documentElement.getAttribute("data-home-view") ||
      "cards";
    field.hidden = homeView !== "list";
    if (homeView !== "list") field.setAttribute("hidden", "");
    else field.removeAttribute("hidden");
    return select;
  };

  const isStoryCategoryFilter = (el) =>
    !!(
      el &&
      el.nodeType === 1 &&
      (el.matches("[data-story-cat-filter]") ||
        (el.classList.contains("tools-bar__field--filter") &&
          el.querySelector("#filterStoryCategory")))
    );

  const isInventionsFilterField = (el) =>
    !!(
      el &&
      el.nodeType === 1 &&
      el.classList.contains("tools-bar__field--filter") &&
      el.querySelector("#filterCategory, #filterPeriod")
    );

  const TOOLBAR_CONTROL_SELECTORS =
    "[data-home-view], [data-inventions-view], [data-tools-images], [data-tools-texts]";

  const isStoryToolsControlChild = (el) => {
    if (!el || el.nodeType !== 1) return false;
    if (
      el.classList.contains("tools-bar__search") ||
      el.classList.contains("tools-bar__search-row") ||
      el.classList.contains("tools-bar__control-row") ||
      el.classList.contains("tools-bar__field--listen")
    ) {
      return false;
    }
    if (el.querySelector("[data-tools-play-visible]")) return false;
    if (isStoryCategoryFilter(el) || isInventionsFilterField(el)) return false;
    if (el.matches("[data-home-list-only], [data-inventions-list-only]")) {
      return !!el.querySelector(TOOLBAR_CONTROL_SELECTORS);
    }
    if (el.classList.contains("tools-bar__field")) {
      return !!el.querySelector(TOOLBAR_CONTROL_SELECTORS);
    }
    return false;
  };

  const ensureStoryToolsSearchRow = (bar) => {
    if (!bar || !bar.classList.contains("tools-bar--inventions")) return;
    const search =
      bar.querySelector(":scope > .tools-bar__search") ||
      bar.querySelector(":scope > .tools-bar__control-row > .tools-bar__search");
    const filters = Array.from(
      bar.querySelectorAll(
        ":scope > [data-story-cat-filter], :scope > .tools-bar__field--filter, :scope > .tools-bar__control-row > [data-story-cat-filter], :scope > .tools-bar__control-row > .tools-bar__field--filter"
      )
    ).filter((el) => isStoryCategoryFilter(el) || isInventionsFilterField(el));
    if (!search && !filters.length) return;

    let row = bar.querySelector(":scope > .tools-bar__search-row");
    if (!row) {
      row = document.createElement("div");
      row.className = "tools-bar__search-row";
      row.setAttribute("role", "group");
      const anchor = search || filters[0] || bar.firstChild;
      bar.insertBefore(row, anchor);
    }
    if (search && search.parentElement !== row) row.appendChild(search);
    filters.forEach((field) => {
      if (field.parentElement !== row) row.appendChild(field);
    });
  };

  const ensureStoryToolsControlRow = (bar) => {
    if (!bar || !bar.classList.contains("tools-bar--inventions")) return;
    ensureStoryToolsSearchRow(bar);
    const existing = bar.querySelector(":scope > .tools-bar__control-row");
    const controls = Array.from(bar.children).filter(isStoryToolsControlChild);
    if (!controls.length) return;
    const row =
      existing ||
      (() => {
        const el = document.createElement("div");
        el.className = "tools-bar__control-row";
        el.setAttribute("role", "group");
        return el;
      })();
    if (!existing) {
      bar.insertBefore(row, controls[0]);
    }
    controls.forEach((el) => {
      if (el.parentElement !== row) row.appendChild(el);
    });
  };

  window.__birinciEnsureStoryToolsSearchRow = ensureStoryToolsSearchRow;
  window.__birinciEnsureStoryToolsControlRow = ensureStoryToolsControlRow;

  const historyHref = () =>
    String(window.location.pathname || "/") +
    String(window.location.search || "") +
    String(window.location.hash || "");

  const pagePathKey = (pathname) => {
    const path = String(pathname || "/").replace(/\\/g, "/");
    const stripped = path.replace(/^\/(az|en|ru|ky)(?=\/|$)/i, "") || "/";
    return stripped.replace(/\/index\.html$/i, "/").replace(/\/+$/, "") || "/";
  };

  const commitHistoryHref = (nextHref, { replace = false } = {}) => {
    const next = String(nextHref || "");
    if (!next || next === historyHref()) return false;
    try {
      if (replace) history.replaceState({ birinci: 1 }, "", next);
      else history.pushState({ birinci: 1 }, "", next);
      window.__birinciPageKey = pagePathKey(window.location.pathname);
      return true;
    } catch (_) {
      return false;
    }
  };

  window.__birinciHistoryHref = historyHref;
  window.__birinciPagePathKey = pagePathKey;
  window.__birinciCommitHistoryHref = commitHistoryHref;
  window.__birinciPageKey = pagePathKey(window.location.pathname);

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

  const isAzUiLang = () => {
    // Fail closed: only enable when the active UI language is explicitly Azerbaijani.
    const lang = String(
      (document.body && document.body.getAttribute("data-lang")) ||
        document.documentElement.getAttribute("data-kt-lang") ||
        document.documentElement.lang ||
        ""
    ).toLowerCase();
    return lang === "az" || lang.startsWith("az-");
  };

  const isAzStoryLexiconPage = () => {
    const body = document.body;
    if (!body) return false;
    return body.classList.contains("page-category") || body.classList.contains("page-home");
  };

  const shouldUseAzLexicon = () => isAzUiLang() && isAzStoryLexiconPage();

  const clearAzLexiconMarks = (root) => {
    if (typeof window.__birinciClearAzLexicon === "function") {
      try {
        window.__birinciClearAzLexicon(root || null);
      } catch (_) {}
      return;
    }
    if (typeof window.__birinciCloseAzLexicon === "function") {
      try {
        window.__birinciCloseAzLexicon();
      } catch (_) {}
    }
    const scope = root || document.body;
    if (!scope || !scope.querySelectorAll) return;
    scope.querySelectorAll("span.az-lex").forEach((span) => {
      const parent = span.parentNode;
      if (!parent) return;
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      parent.removeChild(span);
      try {
        parent.normalize();
      } catch (_) {}
    });
  };

  const refreshAzLexicon = (root) => {
    if (!shouldUseAzLexicon()) {
      clearAzLexiconMarks(root);
      return;
    }
    if (typeof window.__birinciRefreshAzLexicon !== "function") return;
    try {
      window.__birinciRefreshAzLexicon(root || null);
    } catch (_) {}
  };

  const paintSearchAndLexicon = (root, query) => {
    refreshAzLexicon(root);
    applySearchHighlights(root, query);
  };

  const initAzLexicon = () => {
    // Sticky-note underlines: Azerbaijani wisdom-story home + category pages only.
    // Never mark EN / RU / KY (including after live language switch away from AZ).
    if (!shouldUseAzLexicon()) {
      clearAzLexiconMarks();
      return;
    }

    const siteScript = document.querySelector('script[src*="site.js"]');
    if (!siteScript || !siteScript.src) return;
    const assetsBase = siteScript.src.replace(/site\.js(?:\?[^#]*)?(?:#.*)?$/i, "");
    const stampMatch = siteScript.src.match(/[?&]v=([^&#]+)/i);
    const stamp = stampMatch ? decodeURIComponent(stampMatch[1]) : "1";

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

  const syncAzLexiconForLang = () => {
    if (shouldUseAzLexicon()) {
      if (typeof window.__birinciRefreshAzLexicon === "function") {
        const root =
          document.querySelector(".story-list") ||
          document.querySelector("[data-stories-list]") ||
          document.querySelector(".category-main") ||
          document.querySelector("main") ||
          document.body;
        refreshAzLexicon(root);
      } else {
        initAzLexicon();
      }
      return;
    }
    clearAzLexiconMarks();
  };
  window.__birinciSyncAzLexiconForLang = syncAzLexiconForLang;

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
  const escListen = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  const mountStoryTts = () => {
    if (!SHOW_AUDIO_CONTROLS) return;
    const listen = tUi("listen", "Mətni dinlə");
    const stop = tUi("stop", "Dayandır");
    const audioLabel = tUi("story_audio_label", "Səs");
    document.querySelectorAll("article.story").forEach((story) => {
      const actions = story.querySelector(".story__actions");
      if (!actions || actions.querySelector("[data-story-tts]")) return;
      const wrap = document.createElement("div");
      wrap.innerHTML = `
        <div class="story__action-group">
          <span class="tools-bar__label">${escListen(audioLabel)}</span>
          <div class="tools-bar__views" role="group" aria-label="${escListen(audioLabel)}">
            <button type="button" class="story-tts tools-bar__view-btn tools-bar__view-btn--icon" data-story-tts data-tts-mode="listen" aria-pressed="false" title="${escListen(listen)}" aria-label="${escListen(listen)}">${STORY_ICONS.listen}</button>
            <button type="button" class="story-tts tools-bar__view-btn tools-bar__view-btn--icon" data-story-tts data-tts-mode="stop" aria-pressed="true" title="${escListen(stop)}" aria-label="${escListen(stop)}">${STORY_ICONS.stop}</button>
          </div>
        </div>`;
      const group = wrap.firstElementChild;
      if (!group) return;
      const first = actions.querySelector(".story__action-group");
      if (first) actions.insertBefore(group, first);
      else actions.insertBefore(group, actions.firstChild);
    });
    const stripToolsBarListenPage = () => {
      document.querySelectorAll('[data-tools="home"], [data-tools="category"]').forEach((bar) => {
        bar.querySelectorAll("[data-tools-play-visible]").forEach((btn) => {
          let field = btn.closest(".tools-bar__field");
          if (!field || !bar.contains(field)) return;
          const outer =
            field.parentElement &&
            field.parentElement !== bar &&
            field.parentElement.classList.contains("tools-bar__field")
              ? field.parentElement
              : null;
          if (
            outer &&
            outer.querySelector(TOOLBAR_CONTROL_SELECTORS)
          ) {
            field.remove();
          } else if (outer && outer.querySelector("[data-tools-play-visible]")) {
            outer.remove();
          } else {
            field.remove();
          }
        });
      });
    };
    stripToolsBarListenPage();
    document.querySelectorAll('[data-tools="category"], [data-tools="home"], [data-tools="inventions"]').forEach((bar) => {
      ensureStoryToolsControlRow(bar);
    });
    document.querySelectorAll("a.cat-card[data-stem]").forEach((card) => {
      if (card.querySelector("[data-story-tts]")) return;
      const stem = (card.getAttribute("data-stem") || "").trim();
      if (!stem) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "story-tts cat-card__listen";
      btn.setAttribute("data-story-tts", "");
      btn.setAttribute("data-tts-mode", "listen");
      btn.setAttribute("data-story-stem", stem);
      btn.setAttribute("aria-pressed", "false");
      btn.title = listen;
      btn.setAttribute("aria-label", listen);
      btn.innerHTML = STORY_ICONS.listen;
      card.appendChild(btn);
    });
    if (typeof window.__birinciSyncPlayVisibleUi === "function") {
      window.__birinciSyncPlayVisibleUi();
    }
  };
  window.__birinciMountStoryTts = mountStoryTts;
  const ensureStoryListenButtons = (root) => {
    mountStoryTts();
    return root;
  };
  const ensurePageListenButtons = () => {
    mountStoryTts();
  };
  const setStoryModePressed = (root, attr, visible) => {
    if (!root) return;
    root.querySelectorAll("[" + attr + "]").forEach((btn) => {
      const mode = btn.getAttribute(attr);
      const pressed = visible ? mode === "show" : mode === "hide";
      btn.setAttribute("aria-pressed", pressed ? "true" : "false");
    });
  };

  const setMediaToggleDisabled = (btn, disabled) => {
    if (!btn) return;
    btn.disabled = !!disabled;
    btn.setAttribute("aria-disabled", disabled ? "true" : "false");
  };

  const storyHasImageControls = (story) =>
    !!(
      story &&
      (story.querySelector(".story__figure") || story.querySelector("[data-images-mode]"))
    );

  const isStoryTextVisible = (story) =>
    !!(story && !story.classList.contains("story--text-hidden"));

  const isStoryFigureVisible = (story) =>
    !!(
      story &&
      storyHasImageControls(story) &&
      !story.classList.contains("story--figure-hidden")
    );

  /** Hide figure only when text (or ensureOther) keeps content on screen. */
  const canCollapseStoryFigure = (story) => isStoryTextVisible(story);

  /** Hide text only when a visible illustration remains (stories without images stay text-on). */
  const canCollapseStoryText = (story) =>
    storyHasImageControls(story) ? isStoryFigureVisible(story) : false;

  const syncStoryMediaGuards = (story) => {
    if (!story) return;
    setMediaToggleDisabled(
      story.querySelector('[data-images-mode="hide"]'),
      !canCollapseStoryFigure(story)
    );
    setMediaToggleDisabled(
      story.querySelector('[data-texts-mode="hide"]'),
      !canCollapseStoryText(story)
    );
  };

  const syncAllStoryMediaGuards = () => {
    document.querySelectorAll("article.story").forEach(syncStoryMediaGuards);
  };

  const syncGlobalMediaGuards = (imagesBtns, textsBtns) => {
    const imagesCollapsed = document.body.classList.contains("images-collapsed");
    const textsCollapsed = document.body.classList.contains("texts-collapsed");
    (imagesBtns || []).forEach((btn) => {
      if (btn.getAttribute("data-images-mode") === "hide") {
        // Illustration-only: cannot turn images off until text is shown.
        setMediaToggleDisabled(btn, textsCollapsed);
      }
    });
    (textsBtns || []).forEach((btn) => {
      if (btn.getAttribute("data-texts-mode") === "hide") {
        // Text-only: cannot turn text off until images are shown.
        setMediaToggleDisabled(btn, imagesCollapsed);
      }
    });
  };

  /**
   * Atomically set global Text/Image visibility. At least one channel stays on.
   * Prefer keeping text if a caller asks to clear both.
   */
  const applyGlobalMediaVisibility = (
    imagesVisible,
    textsVisible,
    imagesBtns,
    textsBtns,
    opts = {}
  ) => {
    let showImages = !!imagesVisible;
    let showTexts = !!textsVisible;
    if (!showImages && !showTexts) showTexts = true;

    const prevImages = !document.body.classList.contains("images-collapsed");
    const prevTexts = !document.body.classList.contains("texts-collapsed");

    document.body.classList.toggle("images-collapsed", !showImages);
    document.body.classList.toggle("texts-collapsed", !showTexts);

    (imagesBtns || []).forEach((btn) => {
      const mode = btn.getAttribute("data-images-mode");
      const pressed = showImages ? mode === "show" : mode === "hide";
      btn.setAttribute("aria-pressed", pressed ? "true" : "false");
    });
    (textsBtns || []).forEach((btn) => {
      const mode = btn.getAttribute("data-texts-mode");
      const pressed = showTexts ? mode === "show" : mode === "hide";
      btn.setAttribute("aria-pressed", pressed ? "true" : "false");
    });

    try {
      localStorage.setItem(IMAGES_COLLAPSED_KEY, showImages ? "0" : "1");
      localStorage.setItem("birinci-texts-collapsed", showTexts ? "0" : "1");
    } catch (_) {}

    const syncFigures =
      opts.forceAll || showImages !== prevImages || (!showImages && !showTexts);
    const syncTexts =
      opts.forceAll || showTexts !== prevTexts || (!showImages && !showTexts);

    if (syncFigures) {
      if (typeof window.__birinciSetAllStoryFigures === "function") {
        window.__birinciSetAllStoryFigures(showImages);
      } else {
        document.querySelectorAll("article.story").forEach((story) => {
          if (!showImages && !isStoryTextVisible(story)) {
            story.classList.remove("story--text-hidden");
            setStoryModePressed(story, "data-texts-mode", true);
          }
          if (storyHasImageControls(story)) {
            story.classList.toggle("story--figure-hidden", !showImages);
            setStoryModePressed(story, "data-images-mode", showImages);
          }
          syncStoryMediaGuards(story);
        });
      }
    }
    if (syncTexts) {
      if (typeof window.__birinciSetAllStoryTexts === "function") {
        window.__birinciSetAllStoryTexts(showTexts);
      } else {
        document.querySelectorAll("article.story").forEach((story) => {
          if (!showTexts) {
            if (!storyHasImageControls(story)) {
              syncStoryMediaGuards(story);
              return;
            }
            if (!isStoryFigureVisible(story)) {
              story.classList.remove("story--figure-hidden");
              setStoryModePressed(story, "data-images-mode", true);
            }
          }
          story.classList.toggle("story--text-hidden", !showTexts);
          setStoryModePressed(story, "data-texts-mode", showTexts);
          syncStoryMediaGuards(story);
        });
      }
    }

    syncGlobalMediaGuards(imagesBtns, textsBtns);
    syncAllStoryMediaGuards();
    return { imagesVisible: showImages, textsVisible: showTexts };
  };

  const readTextsCollapsedPref = () => {
    try {
      return localStorage.getItem("birinci-texts-collapsed") === "1";
    } catch (_) {
      return false;
    }
  };

  /** Never start with both media channels off. */
  const resolveInitialMediaCollapsed = () => {
    let imagesCollapsed = readImagesCollapsedPref();
    let textsCollapsed = readTextsCollapsedPref();
    if (imagesCollapsed && textsCollapsed) textsCollapsed = false;
    return { imagesCollapsed, textsCollapsed };
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
      const code = (link.getAttribute("data-lang") || "").toLowerCase();
      try {
        localStorage.setItem("birinci-lang", code);
      } catch (_) {}
      if (typeof window.__birinciSetLiveLang === "function") {
        event.preventDefault();
        closeMenu();
        window.__birinciSetLiveLang(code).catch(() => {
          if (modalHostOpen()) return;
          window.location.href = link.href;
        });
      }
    });

    window.__birinciSyncLangHrefs = syncLangHrefs;
    window.__birinciHrefForLang = (code) => hrefForLang(code, browseContext());

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

  const LANG_META = {
    az: { short: "AZ", title: "Azərbaycan" },
    en: { short: "EN", title: "English" },
    ru: { short: "RU", title: "Русский" },
    ky: { short: "KY", title: "Кыргызча" },
  };

  const currentPageLang = () =>
    (
      (document.body && document.body.getAttribute("data-lang")) ||
      document.documentElement.getAttribute("data-kt-lang") ||
      document.documentElement.lang ||
      "az"
    )
      .toLowerCase()
      .slice(0, 2);

  const normalizePageLang = (code) => {
    const key = String(code || "").toLowerCase().slice(0, 2);
    return LANG_META[key] ? key : currentPageLang();
  };

  const flagSrcFor = (code) => {
    const sample = document.querySelector(".lang-switcher__flag");
    const src = sample && sample.getAttribute("src");
    if (src) return src.replace(/\/[a-z]{2}\.svg(?:\?.*)?$/i, "/" + code + ".svg");
    return "/flags/" + code + ".svg";
  };

  const assetQuery = () => {
    const tag = document.querySelector('script[src*="site.js"]');
    const match = tag && tag.src && tag.src.match(/[?&]v=([^&#]+)/);
    return match ? "?v=" + match[1] : "";
  };

  const languageGlobeUrls = (lang) => {
    const code = normalizePageLang(lang || currentPageLang());
    const fileBase = "language-globe-turk-plus-" + code.toUpperCase();
    const q = assetQuery();
    let webp = "/assets/" + fileBase + ".webp" + q;
    let png = "/assets/" + fileBase + ".png" + q;
    try {
      const tag = document.querySelector('script[src*="site.js"]');
      if (tag && tag.src) {
        webp = new URL(fileBase + ".webp" + q, tag.src).href;
        png = new URL(fileBase + ".png" + q, tag.src).href;
      }
    } catch (_) {}
    return { webp, png, code };
  };

  const applyLanguageGlobeIcons = (lang) => {
    const urls = languageGlobeUrls(lang);
    document.querySelectorAll(".story-multilingual-btn").forEach((btn) => {
      btn.setAttribute("data-globe-lang", urls.code);
      const source = btn.querySelector("source[type='image/webp']");
      const img = btn.querySelector("img.story-multilingual-btn__icon");
      if (source) source.setAttribute("srcset", urls.webp);
      if (img) {
        img.setAttribute("src", urls.png);
        img.setAttribute("data-globe-lang", urls.code);
      }
    });
    // Keep the multilingual overlay toolbar globe in sync with the page language.
    const frame = document.querySelector("#story-compare-overlay iframe.story-compare-overlay__frame");
    if (frame) {
      try {
        frame.contentWindow.postMessage(
          { type: "birinci:lang-globe", lang: urls.code },
          "*"
        );
      } catch (_) {}
      try {
        const doc = frame.contentDocument;
        const globe = doc && doc.querySelector(".sc-toolbar__globe");
        if (globe) {
          globe.setAttribute("src", urls.webp);
          globe.setAttribute("data-globe-lang", urls.code);
        }
      } catch (_) {}
    }
  };

  const langAssetUrl = (lang, file) => {
    const path = String(location.pathname || "").replace(/\\/g, "/");
    if (/\/(categories|discoveries|about|prominent-figures)\//i.test(path)) {
      return new URL("../../" + lang + "/assets/" + file + assetQuery(), location.href).href;
    }
    return new URL("../" + lang + "/assets/" + file + assetQuery(), location.href).href;
  };

  const setSwitcherAppearance = (root, code) => {
    if (!root) return;
    const value = normalizePageLang(code);
    const meta = LANG_META[value];
    const toggle = root.querySelector(".lang-switcher__toggle");
    const flag = toggle && toggle.querySelector(".lang-switcher__flag");
    const name = toggle && toggle.querySelector(".lang-switcher__name");
    if (toggle) toggle.title = meta.title;
    if (flag) flag.src = flagSrcFor(value);
    if (name) name.textContent = meta.short;
    root.querySelectorAll("[data-lang]").forEach((opt) => {
      opt.setAttribute("aria-selected", opt.getAttribute("data-lang") === value ? "true" : "false");
    });
    if (root.getAttribute("aria-label") != null) {
      root.setAttribute("aria-label", tUi("lang_switcher_label", meta.title));
    }
  };

  const LANG_ORDER = ["az", "en", "ru", "ky"];

  const hrefForStoryLang = (code, stem) => {
    const catMatch = (window.location.pathname || "").match(/\/categories\/([^/]+)\.html$/i);
    let path = "";
    if (document.body.classList.contains("page-category") && catMatch) {
      path = "../../" + code + "/categories/" + encodeURIComponent(catMatch[1]) + ".html";
    } else if (document.body.classList.contains("page-home")) {
      path = "../" + code + "/index.html";
    } else if (typeof window.__birinciHrefForLang === "function") {
      path = String(window.__birinciHrefForLang(code) || "")
        .split("#")[0]
        .split("?")[0];
    }
    if (!path) path = "../" + code + "/index.html";
    const hash = stem ? "#" + encodeURIComponent(stem).replace(/%2F/gi, "/") : "";
    return path + "?view=list" + hash;
  };

  const hrefForStoryCompare = (stem) => {
    const cur = currentPageLang();
    const path = String(location.pathname || "").replace(/\\/g, "/");
    let base = "stories/compare.html";
    if (/\/(categories|discoveries|about|prominent-figures)\//i.test(path)) {
      base = "../stories/compare.html";
    } else if (/\/stories\//i.test(path)) {
      base = "compare.html";
    }
    return (
      base +
      "?stem=" +
      encodeURIComponent(stem) +
      "&from=" +
      encodeURIComponent(cur)
    );
  };

  const closeStoryCompareOverlay = () => {
    const overlay = document.getElementById("story-compare-overlay");
    if (!overlay) return;
    const previouslyFocused = overlay._birinciPrevFocus;
    overlay.remove();
    document.body.classList.remove("story-compare-open");
    document.documentElement.classList.remove("story-compare-open");
    try {
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    } catch (_) {}
  };

  const openStoryCompareWindow = (href, stem) => {
    const url = new URL(href, window.location.href);
    if (stem) url.searchParams.set("stem", stem);
    url.searchParams.set("_t", String(Date.now()));
    try {
      if (stem) sessionStorage.setItem("birinci-compare-stem", stem);
      sessionStorage.setItem("birinci-compare-from", currentPageLang());
    } catch (_) {}
    const absolute = url.href;
    const title = tUi("multilingual_view", "Multilingual View");
    const closeLabel = tUi("close", "Bağla");

    // In-page overlay (no popup address bar / browser download control).
    closeStoryCompareOverlay();
    const overlay = document.createElement("div");
    overlay.id = "story-compare-overlay";
    overlay.className = "story-compare-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", title);
    overlay._birinciPrevFocus = document.activeElement;
    overlay.innerHTML =
      '<div class="story-compare-overlay__chrome">' +
      '<p class="story-compare-overlay__title">' +
      title +
      "</p>" +
      '<button type="button" class="story-compare-overlay__close" data-story-compare-close aria-label="' +
      closeLabel +
      '">&times;</button>' +
      "</div>" +
      '<iframe class="story-compare-overlay__frame" title="' +
      title +
      '" src="' +
      absolute.replace(/"/g, "&quot;") +
      '"></iframe>';

    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeStoryCompareOverlay();
      }
    };
    overlay._birinciOnKey = onKey;
    document.addEventListener("keydown", onKey);
    const originalRemove = overlay.remove.bind(overlay);
    overlay.remove = () => {
      document.removeEventListener("keydown", onKey);
      originalRemove();
    };

    overlay.addEventListener("click", (event) => {
      if (event.target.closest("[data-story-compare-close]")) {
        event.preventDefault();
        closeStoryCompareOverlay();
      }
    });

    document.body.appendChild(overlay);
    document.body.classList.add("story-compare-open");
    document.documentElement.classList.add("story-compare-open");
    const frame = overlay.querySelector("iframe.story-compare-overlay__frame");
    if (frame) {
      const pushGlobeLang = () => {
        applyLanguageGlobeIcons(currentPageLang());
      };
      frame.addEventListener("load", pushGlobeLang);
      // In case the frame is already cached/complete.
      window.setTimeout(pushGlobeLang, 0);
    }
    const closeBtn = overlay.querySelector("[data-story-compare-close]");
    if (closeBtn) closeBtn.focus();
    return true;
  };

  const storyMultilingualIconHtml = () => {
    const urls = languageGlobeUrls(currentPageLang());
    return (
      '<picture class="story-multilingual-btn__picture">' +
      '<source type="image/webp" srcset="' +
      urls.webp +
      '" />' +
      '<img class="story-multilingual-btn__icon" src="' +
      urls.png +
      '" alt="" width="28" height="28" decoding="async" draggable="false" data-globe-lang="' +
      urls.code +
      '" />' +
      "</picture>"
    );
  };

  const buildStoryMultilingualBtnHtml = (stem) => {
    const title = tUi("multilingual_view_title", "Open this story in Multilingual View");
    const urls = languageGlobeUrls(currentPageLang());
    return (
      '<a class="story-multilingual-btn" href="' +
      hrefForStoryCompare(stem) +
      '" data-story-multilingual data-stem="' +
      stem +
      '" data-globe-lang="' +
      urls.code +
      '" title="' +
      title +
      '" aria-label="' +
      title +
      '">' +
      storyMultilingualIconHtml() +
      "</a>"
    );
  };

  const ensureStoryMultilingualBtn = (story) => {
    if (!story || !story.classList || !story.classList.contains("story")) return;
    const header = story.querySelector(".card-header");
    if (!header) return;
    const stem = (story.getAttribute("data-stem") || story.id || "").trim();
    if (!stem) return;
    const href = hrefForStoryCompare(stem);
    const title = tUi("multilingual_view_title", "Open this story in Multilingual View");
    const existing = header.querySelector("[data-story-multilingual]");
    if (existing) {
      existing.setAttribute("href", href);
      existing.setAttribute("data-stem", stem);
      existing.setAttribute("data-globe-lang", languageGlobeUrls(currentPageLang()).code);
      existing.removeAttribute("target");
      existing.removeAttribute("rel");
      existing.setAttribute("title", title);
      existing.setAttribute("aria-label", title);
      existing.innerHTML = storyMultilingualIconHtml();
      return;
    }
    header.insertAdjacentHTML("afterbegin", buildStoryMultilingualBtnHtml(stem));
  };

  const buildStoryLangNavHtml = (stem, currentLang) => {
    const cur = normalizePageLang(currentLang || currentPageLang());
    const label = tUi("lang_switcher_label", "Language");
    const parts = [
      '<nav class="story-lang-switcher" aria-label="' +
        label +
        '" data-story-lang-switcher data-stem="' +
        stem +
        '" data-current-lang="' +
        cur +
        '">',
    ];
    LANG_ORDER.forEach((code) => {
      if (code === cur) return;
      const meta = LANG_META[code];
      if (!meta) return;
      parts.push(
        '<a class="story-lang-switcher__pill" href="' +
          hrefForStoryLang(code, stem) +
          '" hreflang="' +
          code +
          '" data-lang="' +
          code +
          '" data-story-stem="' +
          stem +
          '" title="' +
          meta.title +
          '" aria-label="' +
          meta.title +
          '"><img class="story-lang-switcher__flag" src="' +
          flagSrcFor(code) +
          '" alt="" width="20" height="14" decoding="async" /><span class="story-lang-switcher__code">' +
          meta.short +
          "</span></a>"
      );
    });
    parts.push("</nav>");
    return parts.join("");
  };

  const ensureStoryLangSwitcher = (story) => {
    if (!story || !story.classList || !story.classList.contains("story")) return;
    const header = story.querySelector(".card-header");
    if (!header) return;
    const stem = (story.getAttribute("data-stem") || story.id || "").trim();
    if (!stem) return;
    const cur = currentPageLang();
    const existing = header.querySelector("[data-story-lang-switcher]");
    if (
      existing &&
      existing.getAttribute("data-stem") === stem &&
      existing.getAttribute("data-current-lang") === cur &&
      existing.querySelectorAll("a.story-lang-switcher__pill[data-lang]").length === LANG_ORDER.length - 1
    ) {
      existing.querySelectorAll("a.story-lang-switcher__pill[data-lang]").forEach((link) => {
        const code = link.getAttribute("data-lang");
        if (code) link.setAttribute("href", hrefForStoryLang(code, stem));
      });
      ensureStoryMultilingualBtn(story);
      return;
    }
    const html = buildStoryLangNavHtml(stem, cur);
    if (existing) existing.outerHTML = html;
    else header.insertAdjacentHTML("beforeend", html);
    ensureStoryMultilingualBtn(story);
  };

  const refreshAllStoryLangSwitchers = () => {
    document.querySelectorAll("article.story").forEach((story) => {
      ensureStoryLangSwitcher(story);
      ensureStoryMultilingualBtn(story);
    });
  };

  const initStoryLangSwitchers = () => {
    refreshAllStoryLangSwitchers();
    applyLanguageGlobeIcons(currentPageLang());
    // Capture phase so Multilingual View always wins over text-lightbox / other
    // document click handlers (those are active when Dev Edit mode is off).
    document.addEventListener(
      "click",
      (event) => {
        if (document.body.classList.contains("dev-story-edit")) return;
        const raw = event.target;
        const el =
          raw && typeof raw.closest === "function"
            ? raw
            : raw && raw.parentElement
              ? raw.parentElement
              : null;
        const compareBtn =
          el && el.closest && el.closest("a.story-multilingual-btn[data-story-multilingual]");
        if (!compareBtn) return;
        const stem = (compareBtn.getAttribute("data-stem") || "").trim();
        const href =
          compareBtn.getAttribute("href") ||
          (stem ? hrefForStoryCompare(stem) : "");
        if (!href && !stem) return;
        const openHref = href || hrefForStoryCompare(stem);
        try {
          if (stem) sessionStorage.setItem("birinci-compare-stem", stem);
          sessionStorage.setItem("birinci-compare-from", currentPageLang());
        } catch (_) {}
        event.preventDefault();
        event.stopPropagation();
        openStoryCompareWindow(openHref, stem);
      },
      true
    );
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a.story-lang-switcher__pill[data-lang]");
      if (!link) return;
      const code = (link.getAttribute("data-lang") || "").toLowerCase();
      const stem = (link.getAttribute("data-story-stem") || "").trim();
      if (!code || !LANG_META[code] || !stem) return;
      const href = hrefForStoryLang(code, stem);
      link.setAttribute("href", href);
      try {
        sessionStorage.setItem(
          "birinci-lang-ctx",
          JSON.stringify({
            sectionId: stem,
            categoryId: "",
            view: "list",
            clearFilters: true,
            ts: Date.now(),
          })
        );
        localStorage.setItem("birinci-lang", code);
        localStorage.setItem("birinci-home-view", "list");
        if (document.body.classList.contains("page-category")) {
          localStorage.setItem("birinci-category-view", "list");
        }
      } catch (_) {}
      event.preventDefault();
      event.stopPropagation();

      // Keep the target story in the URL so SPA lang swap preserves it.
      try {
        const nextHash = "#" + encodeURIComponent(stem).replace(/%2F/gi, "/");
        const params = new URLSearchParams(window.location.search || "");
        params.set("view", "list");
        history.replaceState(
          history.state,
          "",
          window.location.pathname + "?" + params.toString() + nextHash
        );
      } catch (_) {}
      if (typeof window.__birinciSyncLangHrefs === "function") {
        window.__birinciSyncLangHrefs();
      }

      if (typeof window.__birinciSetLiveLang === "function") {
        window.__birinciSetLiveLang(code).catch(() => {
          window.location.assign(new URL(href, window.location.href).href);
        });
        return;
      }
      window.location.assign(new URL(href, window.location.href).href);
    });
    document.addEventListener("birinci:lang-change", () => {
      refreshAllStoryLangSwitchers();
    });
    window.addEventListener("hashchange", refreshAllStoryLangSwitchers);
    window.addEventListener("load", refreshAllStoryLangSwitchers);
  };
  initStoryLangSwitchers();
  window.__birinciRefreshStoryLangSwitchers = refreshAllStoryLangSwitchers;
  window.__birinciBuildStoryLangNavHtml = buildStoryLangNavHtml;
  window.__birinciBuildStoryMultilingualBtnHtml = buildStoryMultilingualBtnHtml;
  window.__birinciHrefForStoryCompare = hrefForStoryCompare;

  const syncAllLangSwitchers = (code) => {
    document.querySelectorAll(".lang-switcher:not([data-pref-locale])").forEach((root) => {
      setSwitcherAppearance(root, code);
    });
  };

  const ignoreModalBackdrop = () => {
    window.__birinciIgnoreModalBackdropUntil = Date.now() + 600;
  };

  const prefetchModalLangPacks = () => {
    if (window.__birinciLangPrefetchStarted) return;
    window.__birinciLangPrefetchStarted = true;
    const current = currentPageLang();
    Object.keys(LANG_META).forEach((code) => {
      if (code === current) return;
      try {
        const href =
          typeof window.__birinciHrefForLang === "function" ? window.__birinciHrefForLang(code) : "";
        if (href) fetch(new URL(href, location.href).href, { credentials: "same-origin" });
        fetch(langAssetUrl(code, "i18n.js"), { credentials: "same-origin" });
      } catch (_) {}
    });
  };

  const modalHostOpen = () =>
    !!(
      document.querySelector(".text-lightbox:not([hidden])") ||
      document.querySelector(".inventions-article-modal:not([hidden])")
    );

  const replaceNodeInner = (target, source) => {
    if (!target || !source) return;
    target.innerHTML = source.innerHTML;
  };

  const copyMatchingText = (fromRoot, toRoot, selector, keyFn) => {
    if (!fromRoot || !toRoot) return;
    const fromMap = new Map();
    fromRoot.querySelectorAll(selector).forEach((el) => {
      const key = keyFn(el);
      if (key) fromMap.set(key, el);
    });
    toRoot.querySelectorAll(selector).forEach((el) => {
      const src = fromMap.get(keyFn(el));
      if (!src) return;
      if (el.tagName === "A" || src.tagName === "A") {
        el.textContent = src.textContent;
      } else {
        el.innerHTML = src.innerHTML;
      }
      if (src.getAttribute && src.getAttribute("data-title") != null) {
        el.setAttribute("data-title", src.getAttribute("data-title"));
      }
    });
  };

  const setControlTooltip = (el, text) => {
    if (!el || !text) return;
    el.title = text;
    el.setAttribute("aria-label", text);
  };

  const syncToolsBarTooltips = () => {
    const labelMap = [
      ["#home-view-label", "view", "Görüntü"],
      ["#inv-view-label", "view", "Görüntü"],
      ["#tools-images-label", "images", "Şəkillər"],
      ["#tools-texts-label", "texts", "Mətnlər"],
      ["#tools-listen-page-label", "listen_page", "Səhifəni dinlə"],
    ];
    labelMap.forEach(([sel, key, fallback]) => {
      const el = document.querySelector(sel);
      if (el) el.textContent = tUi(key, fallback);
    });

    document
      .querySelectorAll("[data-home-view='cards'], [data-inventions-view='cards']")
      .forEach((btn) => {
        setControlTooltip(btn, tUi("view_cards", "Təsnifatlı"));
      });
    document
      .querySelectorAll("[data-home-view='list'], [data-inventions-view='list']")
      .forEach((btn) => {
        setControlTooltip(btn, tUi("view_list", "Ardıcıl"));
      });
    document.querySelectorAll("[data-search-filter-clear]").forEach((btn) => {
      setControlTooltip(btn, tUi("clear_search_filter", "Filtri təmizlə"));
    });
    document.querySelectorAll("[data-search-field-clear]").forEach((btn) => {
      setControlTooltip(btn, tUi("clear_search", "Axtarışı təmizlə"));
    });
    document.querySelectorAll(".sel-clear").forEach((btn) => {
      setControlTooltip(btn, tUi("clear_filter", "Filtri sil"));
    });
    document.querySelectorAll("[data-images-mode='show']").forEach((btn) => {
      setControlTooltip(btn, tUi("show_image", "Şəkli göstər"));
    });
    document.querySelectorAll("[data-images-mode='hide']").forEach((btn) => {
      setControlTooltip(btn, tUi("hide_image", "Şəkli gizlət"));
    });
    document.querySelectorAll("[data-texts-mode='show']").forEach((btn) => {
      setControlTooltip(btn, tUi("show_text", "Mətni göstər"));
    });
    document.querySelectorAll("[data-texts-mode='hide']").forEach((btn) => {
      setControlTooltip(btn, tUi("hide_text", "Mətni gizlət"));
    });
    document
      .querySelectorAll(
        '[data-tts-mode="listen"], [data-story-tts][data-tts-mode="listen"], [data-discovery-tts][data-tts-mode="listen"], [data-article-tts][data-tts-mode="listen"]'
      )
      .forEach((btn) => {
        setControlTooltip(btn, tUi("listen", "Mətni dinlə"));
      });
    document
      .querySelectorAll(
        '[data-tts-mode="stop"], [data-story-tts][data-tts-mode="stop"], [data-discovery-tts][data-tts-mode="stop"], [data-article-tts][data-tts-mode="stop"]'
      )
      .forEach((btn) => {
        setControlTooltip(btn, tUi("stop", "Dayandır"));
      });

    const websiteTip = tUi("footer_website", "Veb sayt");
    const emailTip = tUi("footer_email", "E-poçt");
    document.querySelectorAll(".footer-contact__link").forEach((link) => {
      const href = link.getAttribute("href") || "";
      const tip = href.startsWith("mailto:")
        ? emailTip
        : href.includes("birinci.cloud")
          ? websiteTip
          : "";
      if (!tip) return;
      link.title = tip;
      const icon = link.querySelector(".menu-icon");
      const value = link.querySelector(".footer-contact__value");
      if (icon) icon.title = tip;
      if (value) value.title = tip;
    });
  };

  window.__birinciSyncToolsBarTooltips = syncToolsBarTooltips;

  const applyFetchedChrome = (doc) => {
    if (!doc) return;
    if (doc.title) document.title = doc.title;
    const fromNav = doc.querySelector(".primary-nav");
    const toNav = document.querySelector(".primary-nav");
    if (fromNav && toNav) {
      const copyLink = (fromSel, toSel) => {
        const from = fromNav.querySelector(fromSel);
        const to = toNav.querySelector(toSel);
        if (!from || !to) return;
        const href = from.getAttribute("href");
        if (href) to.setAttribute("href", href);
        const fromLabel = from.querySelector(":scope > span:not(.menu-icon)");
        const toLabel = to.querySelector(":scope > span:not(.menu-icon)");
        if (fromLabel && toLabel) toLabel.textContent = fromLabel.textContent;
      };
      copyLink("[data-nav-stories-all]", "[data-nav-stories-all]");
      copyLink('a[href*="discoveries-and-inventions"]', 'a[href*="discoveries-and-inventions"]');
      copyLink("[data-nav-sitemap]", "[data-nav-sitemap]");
      const fromAbout = fromNav.querySelector(".nav-dropdown--about");
      const toAbout = toNav.querySelector(".nav-dropdown--about");
      if (fromAbout && toAbout) {
        const fromSum = fromAbout.querySelector(".nav-dropdown__summary > span:not(.menu-icon)");
        const toSum = toAbout.querySelector(".nav-dropdown__summary > span:not(.menu-icon)");
        if (fromSum && toSum) toSum.textContent = fromSum.textContent;
        const fromTitle = fromAbout.querySelector(".nav-dropdown-link-title");
        const toTitle = toAbout.querySelector(".nav-dropdown-link-title");
        if (fromTitle && toTitle) toTitle.textContent = fromTitle.textContent;
        const fromHref = fromAbout.querySelector(".nav-dropdown-link");
        const toHref = toAbout.querySelector(".nav-dropdown-link");
        if (fromHref && toHref && fromHref.getAttribute("href")) {
          toHref.setAttribute("href", fromHref.getAttribute("href"));
        }
      }
      toNav.setAttribute("aria-label", tUi("main_menu", "Əsas menyu"));
    }

    const fromCrumbs = doc.querySelector(".breadcrumbs");
    const toCrumbs = document.querySelector(".breadcrumbs");
    if (fromCrumbs && toCrumbs) replaceNodeInner(toCrumbs, fromCrumbs);

    const skip = document.querySelector(".skip-link");
    const fromSkip = doc.querySelector(".skip-link");
    if (skip && fromSkip) skip.textContent = fromSkip.textContent;

    const fromFooter = doc.querySelector("#site-footer, footer.footer-pro, footer");
    const toFooter = document.querySelector("#site-footer, footer.footer-pro, footer");
    if (fromFooter && toFooter) {
      const fromAbout = fromFooter.querySelector(".footer-about");
      const toAbout = toFooter.querySelector(".footer-about");
      if (fromAbout && toAbout) toAbout.textContent = fromAbout.textContent;
      const fromContact = fromFooter.querySelector(".footer-contact__title");
      const toContact = toFooter.querySelector(".footer-contact__title");
      if (fromContact && toContact) toContact.textContent = fromContact.textContent;
      const fromTag = fromFooter.querySelector(".footer-logo__tagline");
      const toTag = toFooter.querySelector(".footer-logo__tagline");
      if (fromTag && toTag) toTag.textContent = fromTag.textContent;
    }

    const fromSearch = doc.querySelector("#global-search");
    const toSearch = document.querySelector("#global-search");
    if (fromSearch && toSearch) {
      const fromIndex = fromSearch.getAttribute("data-search-index");
      if (fromIndex) toSearch.setAttribute("data-search-index", fromIndex);
    }
    const searchToggle = document.getElementById("global-search-toggle");
    if (searchToggle) {
      searchToggle.title = tUi("global_search_title_attr", "Axtar (Ctrl+K)");
      searchToggle.setAttribute("aria-label", tUi("global_search_toggle", "Qlobal axtarış, Ctrl+K"));
      const label = searchToggle.querySelector(".global-search-toggle__label");
      if (label) label.textContent = tUi("search", "Axtar…");
    }
    const searchTitle = document.getElementById("global-search-title");
    if (searchTitle) searchTitle.textContent = tUi("global_search", "Qlobal axtarış");
    const searchInput = document.getElementById("global-search-input");
    if (searchInput) searchInput.placeholder = tUi("search_stories_placeholder", "Bütün hekayələrdə axtar…");
    document.querySelectorAll("[data-global-search-close]").forEach((el) => {
      if (el.classList.contains("global-search__close")) {
        el.setAttribute("aria-label", tUi("close", "Bağla"));
      } else {
        el.setAttribute("aria-label", tUi("close_search", "Axtarışı bağla"));
      }
    });

    const jump = document.querySelector(".page-jump");
    if (jump) {
      jump.setAttribute("aria-label", tUi("skip_to_content", "Səhifə naviqasiyası"));
      const top = jump.querySelector(".back-to-top");
      const bottom = jump.querySelector(".go-to-bottom");
      if (top) {
        top.title = tUi("back_to_top", "Səhifənin yuxarısına qayıt");
        top.setAttribute("aria-label", tUi("back_to_top", "Səhifənin yuxarısına qayıt"));
      }
      if (bottom) {
        bottom.title = tUi("go_to_bottom", "Səhifənin aşağısına get");
        bottom.setAttribute("aria-label", tUi("go_to_bottom", "Səhifənin aşağısına get"));
      }
    }

    const navToggle = document.getElementById("nav-toggle");
    if (navToggle) navToggle.setAttribute("aria-label", tUi("open_menu", "Menyunu aç"));

    document.querySelectorAll("[data-tools-search]").forEach((el) => {
      el.placeholder = tUi("search", "Axtar…");
      el.setAttribute("aria-label", tUi("search_aria", "Axtar"));
    });
    const toolsCount = document.querySelector("[data-tools-count]");
    const fromCount = doc.querySelector("[data-tools-count]");
    if (toolsCount && fromCount) toolsCount.textContent = fromCount.textContent;
    const hero = document.querySelector(
      ".category-hero h1, .about-hero__title, .intro__brand#about-hero-title, .page-home:not(.page-root-home) .intro__brand"
    );
    const fromHero = doc.querySelector(
      ".category-hero h1, .about-hero__title, .intro__brand#about-hero-title, .page-home:not(.page-root-home) .intro__brand"
    );
    if (hero && fromHero) hero.innerHTML = fromHero.innerHTML;
    const lead = document.querySelector(
      ".category-hero__lead, .page-home:not(.page-root-home) .intro__lead"
    );
    const fromLead = doc.querySelector(
      ".category-hero__lead, .page-home:not(.page-root-home) .intro__lead"
    );
    if (lead && fromLead) lead.innerHTML = fromLead.innerHTML;
    const source = document.querySelector(
      ".page-home:not(.page-root-home) .intro__source-text"
    );
    const fromSource = doc.querySelector(
      ".page-home:not(.page-root-home) .intro__source-text"
    );
    if (source && fromSource) source.textContent = fromSource.textContent;
    const visual = document.querySelector(
      ".page-home:not(.page-root-home) .intro__visual img"
    );
    const fromVisual = doc.querySelector(
      ".page-home:not(.page-root-home) .intro__visual img"
    );
    if (visual && fromVisual) {
      if (fromVisual.getAttribute("alt") != null) visual.alt = fromVisual.alt;
    }

    syncToolsBarTooltips();
  };

  const applyFetchedStories = (doc) => {
    if (!doc) return;
    document.querySelectorAll("article.story").forEach((story) => {
      const stem = (story.dataset.stem || story.id || "").trim();
      if (!stem) return;
      const src =
        doc.getElementById(stem) ||
        doc.querySelector('article.story[data-stem="' + stem + '"]');
      if (!src) return;
      const title = src.getAttribute("data-title") || "";
      if (title) story.setAttribute("data-title", title);
      const audio = src.getAttribute("data-audio");
      if (audio) story.setAttribute("data-audio", audio);
      else story.removeAttribute("data-audio");
      const fromTitle = src.querySelector(".story__title, .card-title, h2");
      const toTitle = story.querySelector(".story__title, .card-title, h2");
      if (fromTitle && toTitle) {
        const toName = toTitle.querySelector(".inventions-entry-name");
        const fromName = fromTitle.querySelector(".inventions-entry-name");
        if (toName) toName.textContent = (fromName && fromName.textContent) || fromTitle.textContent;
        else toTitle.textContent = fromTitle.textContent;
      }
      const fromText = src.querySelector(".story__text, .card-text");
      const toText = story.querySelector(".story__text, .card-text");
      if (fromText && toText) toText.innerHTML = fromText.innerHTML;
      const fromImg = src.querySelector(".story__figure img");
      const toImg = story.querySelector(".story__figure img");
      if (fromImg && toImg) {
        toImg.alt = fromImg.alt || "";
        const open = toImg.closest(".story__figure-open");
        const fromOpen = fromImg.closest(".story__figure-open");
        if (open && fromOpen) open.setAttribute("aria-label", fromOpen.getAttribute("aria-label") || "");
      }
    });
    copyMatchingText(
      doc,
      document,
      "[data-tools-cards] [data-stem], [data-tools-nav] [data-stem], .home-card[data-stem], [data-view='cards'] [data-stem]",
      (el) => el.getAttribute("data-stem")
    );
    document.querySelectorAll("[data-tools-nav] li[data-stem] a, .story-nav li[data-stem] a").forEach((a) => {
      const li = a.closest("[data-stem]");
      if (li && li.getAttribute("data-title")) a.textContent = li.getAttribute("data-title");
    });
    document.querySelectorAll(".story-nav .toc-group[data-toc-cat] .toc-group__head a").forEach((a) => {
      const group = a.closest("[data-toc-cat]");
      const slug = group && group.getAttribute("data-toc-cat");
      if (!slug) return;
      const cat = ((window.__BIRINCI_STORIES__ || {}).categories || []).find((row) => row.slug === slug);
      if (cat && cat.title) a.textContent = cat.title;
    });
    document.querySelectorAll(".story__action-group .tools-bar__label").forEach((label) => {
      const group = label.closest(".story__action-group");
      if (!group) return;
      if (group.querySelector("[data-story-tts], [data-discovery-tts], [data-article-tts]")) {
        label.textContent = tUi("story_audio_label", "Səsləndir");
        const views = group.querySelector(".tools-bar__views");
        if (views) views.setAttribute("aria-label", label.textContent);
      } else if (group.querySelector("[data-images-mode]")) {
        label.textContent = tUi("story_image_label", "Şəkil");
      } else if (group.querySelector("[data-texts-mode]")) {
        label.textContent = tUi("story_text_label", "Mətn");
      }
    });
    document.querySelectorAll("[data-story-tts][data-tts-mode='listen']").forEach((btn) => {
      btn.title = tUi("listen", "Mətni dinlə");
      btn.setAttribute("aria-label", tUi("listen", "Mətni dinlə"));
    });
    document.querySelectorAll("[data-story-tts][data-tts-mode='stop']").forEach((btn) => {
      btn.title = tUi("stop", "Dayandır");
      btn.setAttribute("aria-label", tUi("stop", "Dayandır"));
    });
  };

  const applyFetchedInventions = (doc) => {
    if (!doc) return;
    document.querySelectorAll(".inventions-entry").forEach((entry) => {
      const src = doc.getElementById(entry.id);
      if (!src) return;
      const audio = src.getAttribute("data-audio");
      if (audio) entry.setAttribute("data-audio", audio);
      else entry.removeAttribute("data-audio");
      entry.innerHTML = src.innerHTML;
    });
    document.querySelectorAll(".inventions-category").forEach((cat) => {
      if (!cat.id) return;
      const src = doc.getElementById(cat.id);
      if (!src) return;
      const fromHead = src.querySelector(".inventions-category-head");
      const toHead = cat.querySelector(".inventions-category-head");
      if (fromHead && toHead) {
        const label = fromHead.textContent.replace(/\s+/g, " ").trim();
        const toggle = toHead.querySelector(".inventions-category-toggle, button");
        if (toggle) {
          Array.from(toHead.childNodes).forEach((node) => {
            if (node.nodeType === 3) node.textContent = node === toHead.firstChild ? label + " " : "";
          });
          if (![...toHead.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim())) {
            toHead.insertBefore(document.createTextNode(label + " "), toggle);
          }
          toggle.setAttribute("aria-label", "Toggle " + label);
        } else {
          toHead.textContent = label;
        }
      }
      if (src.getAttribute("data-category")) {
        cat.setAttribute("data-category", src.getAttribute("data-category"));
      }
    });
    copyMatchingText(doc, document, ".inventions-toc-entry a, .inventions-toc-cat-row a", (el) => {
      const row = el.closest("[data-toc-entry], [data-toc-cat]");
      return (
        (row && (row.getAttribute("data-toc-entry") || "cat:" + row.getAttribute("data-toc-cat"))) ||
        el.getAttribute("href")
      );
    });
    const fromCat = doc.getElementById("filterCategory");
    const toCat = document.getElementById("filterCategory");
    if (fromCat && toCat) {
      Array.from(toCat.options).forEach((opt, i) => {
        if (fromCat.options[i]) opt.textContent = fromCat.options[i].textContent;
      });
    }
    const fromPeriod = doc.getElementById("filterPeriod");
    const toPeriod = document.getElementById("filterPeriod");
    if (fromPeriod && toPeriod) {
      Array.from(toPeriod.options).forEach((opt, i) => {
        if (fromPeriod.options[i]) opt.textContent = fromPeriod.options[i].textContent;
      });
    }
    const fromTools = doc.querySelector(".tools-bar--inventions");
    const toTools = document.querySelector(".tools-bar--inventions");
    if (fromTools && toTools) {
      const fromLabels = fromTools.querySelectorAll(".tools-bar__label");
      const toLabels = toTools.querySelectorAll(".tools-bar__label");
      toLabels.forEach((el, i) => {
        if (fromLabels[i]) el.textContent = fromLabels[i].textContent;
      });
    }
  };

  const applyDocumentLangAttrs = (code) => {
    document.documentElement.lang = code;
    document.documentElement.setAttribute("lang", code);
    document.documentElement.setAttribute("data-kt-lang", code);
    if (document.body) document.body.setAttribute("data-lang", code);
  };

  const syncAudioChromeForLang = () => {
    applyAudioFlags(liveI18n().lang || LOCALE_TAG || PAGE_LANG);
    if (SHOW_AUDIO_CONTROLS) {
      document.querySelectorAll(".story__action-group[hidden], .tools-bar__field[hidden], .text-lightbox__tts[hidden]").forEach((el) => {
        if (el.querySelector("[data-story-tts], [data-tools-play-visible]")) {
          if (
            el.hasAttribute("data-inventions-list-only") &&
            !document.body.classList.contains("inventions-view-list")
          ) {
            return;
          }
          el.hidden = false;
          el.removeAttribute("hidden");
        }
      });
      ensureStoryListenButtons(document);
      ensurePageListenButtons();
    }
    hideAudioChrome(document);
  };

  let liveLangBusy = false;
  const fetchParsedDocument = async (url) => {
    const res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) throw new Error("lang-page-" + res.status);
    const html = await res.text();
    return new DOMParser().parseFromString(html, "text/html");
  };

  const loadI18nForLang = async (lang) => {
    const res = await fetch(langAssetUrl(lang, "i18n.js"), { credentials: "same-origin" });
    if (!res.ok) throw new Error("lang-i18n-" + res.status);
    const source = await res.text();
    new Function(source)();
  };

  const escapeLiveHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const applyStoriesFromCatalog = (catalog) => {
    if (!catalog) return;
    const byStem = new Map();
    (catalog.categories || []).forEach((cat) => {
      (cat.stories || []).forEach((story) => {
        if (story && story.stem) byStem.set(story.stem, story);
      });
    });
    document.querySelectorAll("article.story").forEach((el) => {
      const stem = (el.dataset.stem || el.id || "").trim();
      const story = byStem.get(stem);
      if (!story) return;
      if (story.title) {
        el.setAttribute("data-title", story.title);
        const title = el.querySelector(".story__title, .card-title, h2");
        if (title) {
          const name = title.querySelector(".inventions-entry-name");
          if (name) name.textContent = story.title;
          else title.textContent = story.title;
        }
      }
      const text = el.querySelector(".story__text, .card-text");
      if (text && Array.isArray(story.paragraphs)) {
        text.innerHTML = story.paragraphs
          .map((p) => "<p>" + escapeLiveHtml(p) + "</p>")
          .join("");
      }
    });
    if (typeof window.__birinciRefreshStoryCategoryFilter === "function") {
      window.__birinciRefreshStoryCategoryFilter();
    } else {
      syncStoryCategoryFilterChrome();
    }
    if (window.__birinciQuietStoryRefresh) {
      if (typeof window.__birinciOnStoriesCatalog === "function") {
        window.__birinciOnStoriesCatalog(catalog, { quiet: true });
      } else if (typeof window.__birinciRefreshStoryNav === "function") {
        window.__birinciRefreshStoryNav();
      }
    } else if (typeof window.__birinciOnStoriesCatalog === "function") {
      window.__birinciOnStoriesCatalog(catalog);
    } else if (typeof window.__birinciRefreshStoryNav === "function") {
      window.__birinciRefreshStoryNav();
    }
    if (typeof window.__birinciRefreshStoryLangSwitchers === "function") {
      window.__birinciRefreshStoryLangSwitchers();
    }
    (catalog.categories || []).forEach((cat) => {
      if (!cat.slug) return;
      document.querySelectorAll('[data-cat="' + cat.slug + '"], [data-slug="' + cat.slug + '"]').forEach((card) => {
        const title = card.querySelector(".card-title, h2, h3");
        const blurb = card.querySelector(".card-blurb, .home-card__blurb, p");
        if (title && cat.title) title.textContent = cat.title;
        if (blurb && cat.blurb) blurb.textContent = cat.blurb;
        if (cat.title) card.setAttribute("data-title", cat.title);
      });
    });
  };

  const clearLangSwitchFilters = () => {
    document.querySelectorAll("[data-tools-search], #inventionsSearch").forEach((input) => {
      if (input && "value" in input) input.value = "";
    });
    if (typeof clearStoryCatalogFilters === "function") {
      clearStoryCatalogFilters(document.querySelector("[data-tools-search]"));
    }
    if (typeof window.__birinciClearInventionsCatalogFilters === "function") {
      window.__birinciClearInventionsCatalogFilters();
    } else {
      const mf = window.KT_CATALOG_MULTI_FILTER;
      if (mf && typeof mf.setActiveValues === "function") {
        mf.setActiveValues("filterCategory", [], { silent: true });
        mf.setActiveValues("filterPeriod", [], { silent: true });
      }
    }
    document.querySelectorAll(".tools-bar__search").forEach((wrap) => {
      wrap.classList.remove("tools-bar__search--active");
      const chip = wrap.querySelector("[data-search-filter]");
      const textEl = wrap.querySelector("[data-search-filter-text]");
      if (chip) chip.hidden = true;
      if (textEl) textEl.textContent = "";
    });
  };

  const alignElementHeaderBelowSticky = (el) => {
    if (!el) return false;
    const headerEl =
      el.querySelector(
        ".card-header, .inventions-entry-title, .inventions-category-head, .story__title, h2, h1"
      ) || el;
    if (typeof window.__birinciSyncStickyChrome === "function") {
      window.__birinciSyncStickyChrome();
    }
    const stickyBottom = (() => {
      const header = document.querySelector(".site-header");
      const crumbs = document.querySelector(".breadcrumbs");
      let stack = 0;
      if (header) stack = Math.max(stack, header.getBoundingClientRect().bottom);
      if (crumbs) stack = Math.max(stack, crumbs.getBoundingClientRect().bottom);
      return Math.ceil(stack) + 16;
    })();
    const y =
      headerEl.getBoundingClientRect().top +
      (window.pageYOffset || document.documentElement.scrollTop || 0) -
      stickyBottom;
    const html = document.documentElement;
    html.classList.add("no-smooth-scroll");
    window.scrollTo(0, Math.max(0, Math.round(y)));
    requestAnimationFrame(() => {
      const top = headerEl.getBoundingClientRect().top;
      if (Math.abs(top - stickyBottom) > 2) {
        window.scrollTo(
          0,
          Math.max(
            0,
            Math.round(
              headerEl.getBoundingClientRect().top +
                (window.pageYOffset || document.documentElement.scrollTop || 0) -
                stickyBottom
            )
          )
        );
      }
      html.classList.remove("no-smooth-scroll");
    });
    return true;
  };

  const scrollLangTargetIntoView = (id) => {
    if (!id) return false;
    if (
      (document.body.classList.contains("page-inventions") ||
        document.body.classList.contains("inventions-preview-page")) &&
      typeof window.__birinciScrollInventionsTo === "function"
    ) {
      return !!window.__birinciScrollInventionsTo(id);
    }
    if (typeof window.__birinciScrollToStoryOrArticle === "function") {
      if (window.__birinciScrollToStoryOrArticle(id)) return true;
    }
    let el = null;
    try {
      el = document.getElementById(decodeURIComponent(id));
    } catch (_) {
      el = document.getElementById(id);
    }
    if (!el && typeof window.__birinciRevealStory === "function") {
      window.__birinciRevealStory(id);
      try {
        el = document.getElementById(decodeURIComponent(id));
      } catch (_) {
        el = document.getElementById(id);
      }
    }
    if (!el) return false;
    return alignElementHeaderBelowSticky(el);
  };

  const applyLangSwitchBrowseReset = () => {
    let ctx = null;
    try {
      const raw = sessionStorage.getItem("birinci-lang-ctx") || "";
      if (raw) ctx = JSON.parse(raw);
    } catch (_) {
      ctx = null;
    }
    // Only run when a language switch stashed browse context.
    if (!ctx || typeof ctx !== "object") return;

    clearLangSwitchFilters();

    let targetId = "";
    try {
      targetId = decodeURIComponent((window.location.hash || "").replace(/^#/, ""));
    } catch (_) {
      targetId = (window.location.hash || "").replace(/^#/, "");
    }
    if (!targetId) targetId = ctx.sectionId || ctx.categoryId || "";

    const view = ctx.view || "";
    const nextView = targetId ? "list" : view === "cards" ? "cards" : view === "list" ? "list" : "";
    if (
      document.body.classList.contains("page-inventions") ||
      document.body.classList.contains("inventions-preview-page")
    ) {
      if (nextView && typeof window.__birinciSetInventionsView === "function") {
        window.__birinciSetInventionsView(nextView);
      }
    } else if (document.body.classList.contains("page-home") && typeof window.__birinciSetHomeView === "function") {
      if (nextView) {
        window.__birinciSetHomeView(nextView, {
          scrollTools: false,
          animate: false,
          forceList: !!targetId,
        });
      }
    } else if (
      document.body.classList.contains("page-category") &&
      typeof window.__birinciSetHomeView === "function"
    ) {
      if (nextView) window.__birinciSetHomeView(nextView, { animate: false });
    }

    if (targetId && document.getElementById(targetId)) {
      /* Story already in DOM — scroll only; avoid list rebuild flicker. */
    } else if (targetId && typeof window.__birinciRevealStory === "function") {
      window.__birinciRevealStory(targetId);
    } else if (typeof window.__birinciOnStoriesCatalog === "function" && window.__BIRINCI_STORIES__) {
      try {
        window.__birinciOnStoriesCatalog(window.__BIRINCI_STORIES__);
      } catch (_) {}
    }

    const finish = (attempt) => {
      const ok = targetId ? scrollLangTargetIntoView(targetId) : true;
      if (targetId && !ok && attempt < 6) {
        window.setTimeout(() => finish(attempt + 1), 60 + attempt * 40);
        return;
      }
      if (typeof window.__birinciRefreshStoryNav === "function") {
        window.__birinciRefreshStoryNav();
      }
      if (targetId && typeof window.__birinciSelectStoryInSidebar === "function") {
        window.__birinciSelectStoryInSidebar(targetId);
      }
      if (typeof window.__birinciRefreshStoryLangSwitchers === "function") {
        window.__birinciRefreshStoryLangSwitchers();
      }
      try {
        sessionStorage.removeItem("birinci-lang-ctx");
      } catch (_) {}
    };
    window.setTimeout(() => finish(0), 80);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => finish(0)));
  };
  window.__birinciApplyLangSwitchBrowseReset = applyLangSwitchBrowseReset;

  const setLiveLang = async (code, { fromHistory = false } = {}) => {
    const next = normalizePageLang(code);
    const prev = currentPageLang();
    if (!next || (next === prev && !fromHistory)) {
      syncAllLangSwitchers(next);
      return;
    }
    if (liveLangBusy) return;
    liveLangBusy = true;
    const mainEl = document.getElementById("main");
    const useFade = !!(mainEl && !prefersReducedMotion());
    if (useFade) {
      mainEl.classList.add("is-lang-switching");
    }
    try {
      if (typeof window.__birinciSyncLangHrefs === "function") window.__birinciSyncLangHrefs();
      const href =
        (typeof window.__birinciHrefForLang === "function" && window.__birinciHrefForLang(next)) ||
        "";
      const target = href ? new URL(href, location.href) : null;
      if (!target) throw new Error("lang-href");
      const [doc] = await Promise.all([fetchParsedDocument(target.href), loadI18nForLang(next)]);
      LOCALE_TAG = next;
      applyAudioFlags(next);
      window.__BIRINCI_STORIES__ = undefined;
      if (typeof window.__birinciStopStoryTts === "function") window.__birinciStopStoryTts();
      applyDocumentLangAttrs(next);
      syncAllLangSwitchers(next);
      const keepModal = modalHostOpen();
      if (typeof window.__birinciRefreshTextLightbox === "function") {
        window.__birinciRefreshTextLightbox(doc);
      }
      if (typeof window.__birinciRefreshArticleModal === "function") {
        window.__birinciRefreshArticleModal(doc);
      }
      if (!fromHistory) {
        const nextUrl = target.pathname + target.search + (target.hash || location.hash || "");
        commitHistoryHref(nextUrl, { replace: true });
      }
      applyFetchedChrome(doc);
      const liveBody = document.body.className || "";
      if (
        !keepModal &&
        !/page-category|page-home|page-inventions|inventions-preview-page/.test(liveBody)
      ) {
        const fromMain = doc.getElementById("main");
        const toMain = document.getElementById("main");
        if (fromMain && toMain) toMain.innerHTML = fromMain.innerHTML;
      }
      applyFetchedStories(doc);
      applyFetchedInventions(doc);
      if (
        document.body.classList.contains("page-home") ||
        document.body.classList.contains("page-category")
      ) {
        try {
          const storiesRes = await fetch(langAssetUrl(next, "stories-data.js"), {
            credentials: "same-origin",
          });
          if (storiesRes.ok) {
            new Function(await storiesRes.text())();
            window.__birinciQuietStoryRefresh = true;
            try {
              applyStoriesFromCatalog(window.__BIRINCI_STORIES__);
            } finally {
              window.__birinciQuietStoryRefresh = false;
            }
          }
        } catch (_) {}
      }
      syncAudioChromeForLang();
      syncAllLangSwitchers(next);
      try {
        localStorage.setItem("birinci-lang", next);
      } catch (_) {}
      if (typeof window.__birinciRefreshTextLightbox === "function") {
        window.__birinciRefreshTextLightbox(doc);
      }
      if (typeof window.__birinciRefreshArticleModal === "function") {
        window.__birinciRefreshArticleModal(doc);
      }
      if (keepModal) ignoreModalBackdrop();
      document.dispatchEvent(new CustomEvent("birinci:lang-change", { detail: { lang: next, prev } }));
      applyLanguageGlobeIcons(next);
      syncAzLexiconForLang();
      if (typeof window.__birinciSyncLangHrefs === "function") window.__birinciSyncLangHrefs();
      if (typeof window.__birinciRefreshStoryLangSwitchers === "function") {
        window.__birinciRefreshStoryLangSwitchers();
      }
      if (keepModal) {
        try {
          sessionStorage.removeItem("birinci-lang-ctx");
        } catch (_) {}
      } else {
        window.setTimeout(() => {
          if (typeof window.__birinciRefreshInventionsAfterLang === "function") {
            window.__birinciRefreshInventionsAfterLang();
          }
          applyLangSwitchBrowseReset();
        }, 0);
      }
    } finally {
      liveLangBusy = false;
      if (useFade && mainEl) {
        window.requestAnimationFrame(() => {
          mainEl.classList.remove("is-lang-switching");
        });
      }
    }
  };

  window.__birinciSetLiveLang = setLiveLang;
  window.__birinciCurrentLang = currentPageLang;
  window.__birinciSyncAllLangSwitchers = syncAllLangSwitchers;
  window.__birinciPrefetchModalLangPacks = prefetchModalLangPacks;

  window.addEventListener("popstate", () => {
    const path = String(location.pathname || "");
    const key = pagePathKey(path);
    const known = window.__birinciPageKey || key;
    if (key !== known) {
      window.__birinciPageKey = key;
      window.location.reload();
      return;
    }
    const match = path.match(/\/(az|en|ru|ky)(?:\/|$)/i);
    const lang = match ? match[1].toLowerCase() : "";
    if (lang && lang !== currentPageLang()) {
      setLiveLang(lang, { fromHistory: true }).catch(() => {});
    }
  });

  // Full-page language navigation: clear filters, keep target + view, scroll to item header.
  (function restoreGenericLangScroll() {
    if (document.body.classList.contains("page-inventions")) return;
    let raw = "";
    try {
      raw = sessionStorage.getItem("birinci-lang-ctx") || "";
    } catch (_) {
      return;
    }
    if (!raw) return;
    window.setTimeout(() => {
      if (typeof window.__birinciApplyLangSwitchBrowseReset === "function") {
        window.__birinciApplyLangSwitchBrowseReset();
      }
    }, 40);
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
  window.__birinciSyncStickyChrome = syncStickyChrome;

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
      if (dataTitle && dataTitle.trim()) return visibleCatalogLabel(dataTitle);
      const name = el.querySelector(".inventions-entry-name");
      if (name && name.textContent.trim()) return visibleCatalogLabel(name.textContent);
      const catHead = el.querySelector(".inventions-category-head");
      if (catHead && catHead.textContent.trim()) return visibleCatalogLabel(catHead.textContent);
      const heading = el.querySelector("h1, h2, .story__title, .story-title");
      if (heading && heading.textContent.trim()) return visibleCatalogLabel(heading.textContent);
      return visibleCatalogLabel((el.id || "").replace(/[-_]+/g, " "));
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
      const cleanTitle = visibleCatalogLabel(title);
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
  window.__birinciMarkCurrentPrimaryNav = markCurrentPrimaryNav;
  window.addEventListener("popstate", markCurrentPrimaryNav);
  document.addEventListener("birinci:lang-change", markCurrentPrimaryNav);

  const scrollPageToTop = () => {
    const html = document.documentElement;
    html.classList.add("no-smooth-scroll");
    html.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    window.scrollTo(0, 0);
    history.replaceState(null, "", window.location.pathname + window.location.search);
    if (typeof window.__birinciClearDeepCrumb === "function") {
      window.__birinciClearDeepCrumb();
    }
    requestAnimationFrame(() => {
      html.classList.remove("no-smooth-scroll");
    });
  };

  const backToTop = document.getElementById("back-to-top");
  if (backToTop) {
    backToTop.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      scrollPageToTop();
    });
  }

  const initHeaderBlankScrollToTop = () => {
    const header = document.querySelector(".site-header");
    if (!header || header.dataset.blankScrollTop === "1") return;
    header.dataset.blankScrollTop = "1";

    const interactiveSelector = [
      "a",
      "button",
      "input",
      "select",
      "textarea",
      "summary",
      "label",
      '[role="button"]',
      '[role="menuitem"]',
      '[role="option"]',
      ".brand",
      ".nav-toggle",
      ".lang-switcher",
      ".global-search-toggle",
      ".global-search",
    ].join(", ");

    const isBlankHeaderClick = (event) => {
      if (!header.contains(event.target)) return false;
      if (event.target.closest(interactiveSelector)) return false;
      if (header.classList.contains("is-nav-open") && event.target.closest(".primary-nav")) {
        return false;
      }
      if (event.target.closest(".nav-dropdown-panel, .nav-dropdown-panel--mega")) {
        return false;
      }
      return true;
    };

    header.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (!isBlankHeaderClick(event)) return;
      event.preventDefault();
      event.stopPropagation();
      scrollPageToTop();
    });
  };
  initHeaderBlankScrollToTop();


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

    const searchLang = () =>
      (window.__BIRINCI_I18N__ && window.__BIRINCI_I18N__.lang) || LOCALE_TAG || "az";
    const countStatus = (rows) => {
      const list = Array.isArray(rows) ? rows : [];
      const byLang = {};
      LANG_ORDER.forEach((lang) => {
        byLang[lang] = 0;
      });
      list.forEach((row) => {
        const lang = normalizePageLang(row && row.lang);
        if (byLang[lang] != null) byLang[lang] += 1;
      });
      const parts = LANG_ORDER.map((lang) => {
        const short = (LANG_META[lang] && LANG_META[lang].short) || String(lang).toUpperCase();
        return `${short} (${byLang[lang]})`;
      });
      return `${list.length} ${tUi("stories_count_suffix", "hekayə")} - ${parts.join(", ")}`;
    };

    const parseSearchIndexSource = (source) => {
      const prev = window.__BIRINCI_SEARCH__;
      try {
        new Function(source)();
        return Array.isArray(window.__BIRINCI_SEARCH__) ? window.__BIRINCI_SEARCH__.slice() : [];
      } finally {
        window.__BIRINCI_SEARCH__ = prev;
      }
    };

    const loadLangSearchIndex = async (lang) => {
      const res = await fetch(langAssetUrl(lang, "search-index.js"), { credentials: "same-origin" });
      if (!res.ok) throw new Error("fetch-failed:" + lang);
      const rows = parseSearchIndexSource(await res.text());
      return rows.map((row) => Object.assign({}, row, { lang }));
    };

    const hrefForSearchResult = (row) => {
      const lang = normalizePageLang(row.lang || searchLang());
      const slug = encodeURIComponent(row.slug || "");
      const stem = encodeURIComponent(row.stem || "");
      const path = String(location.pathname || "").replace(/\\/g, "/");
      let base;
      if (/\/(categories|discoveries|about|prominent-figures)\//i.test(path)) {
        base = `../../${lang}/categories/${slug}.html`;
      } else if (document.body.classList.contains("page-root-home")) {
        base = `${lang}/categories/${slug}.html`;
      } else {
        base = `../${lang}/categories/${slug}.html`;
      }
      return `${base}#${stem}`;
    };

    const queryVariants = (query) => {
      const raw = query.trim();
      if (!raw) return [];
      const variants = new Set([raw.toLowerCase()]);
      LANG_ORDER.forEach((lang) => {
        try {
          variants.add(raw.toLocaleLowerCase(lang));
        } catch (_) {}
      });
      return [...variants].filter(Boolean);
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
      if (index) {
        if (status && !lastQuery) status.textContent = countStatus(index);
        return Promise.resolve(index);
      }
      if (loading) return loading;
      if (status) status.textContent = tJs("index_loading", "İndeks yüklənir…");
      loading = Promise.all(LANG_ORDER.map((lang) => loadLangSearchIndex(lang)))
        .then((chunks) => {
          index = chunks.flat();
          if (status) status.textContent = lastQuery ? status.textContent : countStatus(index);
          if (lastQuery) render(lastQuery);
          return index;
        })
        .catch(() => {
          index = [];
          if (status) {
            status.textContent = tJs("index_failed", "Axtarış indeksi yüklənmədi.").replace(
              /\{lang\}/g,
              searchLang()
            );
          }
          return index;
        })
        .finally(() => {
          loading = null;
        });
      return loading;
    };

    const render = (query) => {
      lastQuery = query;
      const variants = queryVariants(query);
      const highlightQ = variants[0] || "";
      results.innerHTML = "";
      if (!variants.length) {
        if (status) status.textContent = index ? countStatus(index) : "";
        return;
      }
      if (!index) {
        if (status) status.textContent = tJs("index_loading", "İndeks yüklənir…");
        return;
      }
      const current = normalizePageLang(searchLang());
      const matches = index
        .filter((row) => {
          const hay = row.hay || "";
          return variants.some((q) => hay.includes(q));
        })
        .sort((a, b) => {
          const aCur = a.lang === current ? 0 : 1;
          const bCur = b.lang === current ? 0 : 1;
          if (aCur !== bCur) return aCur - bCur;
          return LANG_ORDER.indexOf(a.lang) - LANG_ORDER.indexOf(b.lang);
        })
        .slice(0, 40);
      if (status) {
        status.textContent = matches.length
          ? tJs("results_n", "{n} nəticə").replace(/\{n\}/g, String(matches.length))
          : tJs("no_match", "Uyğun hekayə tapılmadı.");
      }
      matches.forEach((row) => {
        const a = document.createElement("a");
        a.className = "global-search__item";
        a.href = hrefForSearchResult(row);
        a.innerHTML =
          `<span class="global-search__item-title"></span>` +
          `<span class="global-search__item-meta"></span>`;
        a.querySelector(".global-search__item-title").textContent = row.title;
        const langMeta = LANG_META[row.lang] || LANG_META.en;
        a.querySelector(".global-search__item-meta").textContent = langMeta
          ? `${langMeta.short} · ${row.category}`
          : row.category;
        if (highlightQ) {
          applySearchHighlights(a.querySelector(".global-search__item-title"), highlightQ);
          applySearchHighlights(a.querySelector(".global-search__item-meta"), highlightQ);
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
        if (root.hidden || !index) return;
        render(input.value);
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

  const localeCompareAz = (a, b) => compareCatalogTitles(a, b);

  const primeStoryToolsBarLayout = () => {
    document
      .querySelectorAll('[data-tools="home"], [data-tools="category"], [data-tools="inventions"]')
      .forEach((bar) => {
        ensureStoryToolsSearchRow(bar);
        ensureStoryToolsControlRow(bar);
      });
  };

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
        document.body.classList.toggle("inventions-view-cards", next === "cards");
        document.body.classList.toggle("inventions-view-list", next === "list");
        bar.querySelectorAll("[data-inventions-list-only], [data-home-list-only]").forEach((el) => {
          el.hidden = next !== "list";
          if (next === "list") el.removeAttribute("hidden");
          else el.setAttribute("hidden", "");
        });
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
    const navList = document.querySelector("[data-tools-nav]");
    const countEl = document.querySelector("[data-tools-count]");

    const allStories = Array.from(list.querySelectorAll(".story"));
    const categorySection = (() => {
      let section = list.querySelector(":scope > .inventions-category");
      if (!section) {
        section = document.createElement("section");
        section.className = "inventions-category stories-category";
        const head = document.createElement("h2");
        head.className = "inventions-category-head";
        const h1 = document.querySelector(".about-hero h1, .category-hero h1, h1");
        head.textContent = ((h1 && h1.textContent) || "").trim();
        section.appendChild(head);
        list.insertBefore(section, list.firstChild);
      }
      allStories.sort((a, b) =>
        compareCatalogTitles(a.dataset.title || "", b.dataset.title || "")
      );
      allStories.forEach((story) => section.appendChild(story));
      return section;
    })();
    const allCards = cardGrid ? Array.from(cardGrid.querySelectorAll("[data-stem]")) : [];
    const cardsByStem = new Map(allCards.map((card) => [card.dataset.stem, card]));
    allCards.sort((a, b) => localeCompareAz(a.dataset.title, b.dataset.title));
    if (cardGrid) allCards.forEach((card) => cardGrid.appendChild(card));
    const currentCategorySlug = (() => {
      try {
        const path = window.location.pathname || "";
        const match = path.match(/\/([^/]+)\.html$/i);
        return match ? decodeURIComponent(match[1]) : "";
      } catch (_) {
        return "";
      }
    })();
    if (currentCategorySlug) categorySection.id = currentCategorySlug;
    bindStoryCategoryToggles(list);
    const storiesCatalogUrl = (() => {
      const tagged = document.querySelector('script[src*="site.js"]');
      const src = tagged && tagged.getAttribute("src");
      const ver = src && /[?&]v=([^&]+)/.exec(src);
      return `../assets/stories-data.js${ver ? `?v=${ver[1]}` : ""}`;
    })();

    let filtered = [];
    let pendingStem = null;
    let lastShownCount = 0;
    let lastVisibleStems = new Set();
    let expandAllOnNextNav = false;

    const syncPlayVisibleUi = (total = 0) => {
      bar.querySelectorAll("[data-tools-play-visible]").forEach((btn) => {
        btn.disabled = total === 0;
      });
      if (typeof window.__birinciSyncPlayVisibleUi === "function") {
        window.__birinciSyncPlayVisibleUi();
      }
    };

    const applyImagesState = (collapsed) => {
      const showImages = !collapsed;
      const showTexts = !document.body.classList.contains("texts-collapsed");
      if (!showImages && !showTexts) return;
      applyGlobalMediaVisibility(showImages, showTexts, imagesBtns, textsBtns);
    };

    const applyTextsState = (collapsed) => {
      const showTexts = !collapsed;
      const showImages = !document.body.classList.contains("images-collapsed");
      if (!showImages && !showTexts) return;
      applyGlobalMediaVisibility(showImages, showTexts, imagesBtns, textsBtns);
    };

    if ((imagesToggle && imagesBtns.length) || (textsToggle && textsBtns.length)) {
      const initial = resolveInitialMediaCollapsed();
      applyGlobalMediaVisibility(
        !initial.imagesCollapsed,
        !initial.textsCollapsed,
        imagesBtns,
        textsBtns,
        { forceAll: true }
      );
      imagesBtns.forEach((btn) => {
        btn.addEventListener("click", (event) => {
          if (btn.disabled || btn.getAttribute("aria-disabled") === "true") {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          const hide = btn.getAttribute("data-images-mode") === "hide";
          if (hide && document.body.classList.contains("texts-collapsed")) return;
          applyImagesState(hide);
        });
      });
      textsBtns.forEach((btn) => {
        btn.addEventListener("click", (event) => {
          if (btn.disabled || btn.getAttribute("aria-disabled") === "true") {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          const hide = btn.getAttribute("data-texts-mode") === "hide";
          if (hide && document.body.classList.contains("images-collapsed")) return;
          applyTextsState(hide);
        });
      });
      syncGlobalMediaGuards(imagesBtns, textsBtns);
    }

    const escapeHtml = (value) =>
      String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const refreshSidebarNav = () => {
      if (!navList) return;
      const visibleStems =
        lastVisibleStems.size
          ? new Set(lastVisibleStems)
          : new Set((filtered || []).map((story) => story.dataset.stem));
      fillGroupedStoryNav(navList, {
        catalog: window.__BIRINCI_STORIES__,
        visibleStems,
        shownCount: lastShownCount,
        expandAll: expandAllOnNextNav,
        syncRoot: list,
        fallbackSlug: currentCategorySlug || "stories",
        fallbackTitle:
          (document.querySelector(".about-hero h1, .category-hero h1, h1") || {}).textContent ||
          tUi("nav_stories_all", "Hekayələr"),
        hrefForStory: (stem, group) =>
          group.slug === currentCategorySlug ? `#${stem}` : `${group.slug}.html#${stem}`,
        hrefForCategory: (group) => {
          if (group.slug === currentCategorySlug) return `#${group.slug}`;
          return `${group.slug}.html`;
        },
      });
      const layout = document.querySelector(".category-layout");
      if (layout && typeof window.__birinciBindStorySidebar === "function") {
        window.__birinciBindStorySidebar(layout);
      } else if (layout && layout.__birinciSidebar) {
        layout.__birinciSidebar.refresh();
      }
      syncStoryExpandCollapseChrome();
    };
    window.__birinciRefreshStoryNav = refreshSidebarNav;
    window.__birinciRevealStory = (stem) => {
      if (!stem) return;
      pendingStem = stem;
      applyCategoryView("list", { animate: false });
      renderList();
    };
    const applyCatalogStoryOrder = () => {
      const catalog = window.__BIRINCI_STORIES__;
      if (!catalog) return;
      const numbering = storyCatalogNumbering(catalog);
      const cats = catalog.categories || [];
      const catIndex = cats.findIndex((cat) => cat.slug === currentCategorySlug);
      allStories.sort((a, b) =>
        compareCatalogTitles(a.dataset.title || "", b.dataset.title || "")
      );
      allStories.forEach((story) => {
        const info = numbering.get(story.dataset.stem);
        if (info) {
          story.dataset.categorySlug = info.categorySlug || currentCategorySlug;
        }
        applyStoryTitleNumber(
          story.querySelector(".story__title, .card-title"),
          null,
          story.dataset.title
        );
      });
      if (currentCategorySlug) categorySection.id = currentCategorySlug;
      const head = categorySection.querySelector(".inventions-category-head");
      if (head) {
        const cat = catIndex >= 0 ? cats[catIndex] : null;
        const title =
          (cat && cat.title) ||
          (document.querySelector(".about-hero h1, .category-hero h1, h1") || {}).textContent ||
          currentCategorySlug;
        const count =
          (cat && cat.stories && cat.stories.length) || allStories.length || 0;
        const label = categoryTitleWithCount(visibleCatalogLabel(title), count);
        const toggle = head.querySelector(".inventions-category-toggle");
        head.textContent = label;
        if (toggle) head.appendChild(toggle);
        categorySection.setAttribute("data-category", label);
      }
    };

    window.__birinciOnStoriesCatalog = (catalog, opts) => {
      const quiet = !!(opts && opts.quiet);
      applyCatalogStoryOrder();
      if (!quiet) renderList();
      refreshSidebarNav();
      bindStoryCategoryToggles(list);
    };
    bindStoryCategoryFilter(bar, {
      initialSlugs: currentCategorySlug ? [currentCategorySlug] : [],
      onChange: (slugs) => {
        if (slugs.length === 1 && slugs[0] === currentCategorySlug) return;
        if (slugs.length === 1) {
          window.location.assign(`${slugs[0]}.html`);
          return;
        }
        const params = new URLSearchParams();
        params.set("view", "list");
        if (slugs.length) params.set("cat", slugs.join(","));
        window.location.assign(`../index.html?${params.toString()}`);
      },
    });
    loadStoriesCatalog(storiesCatalogUrl).then(() => {
      applyCatalogStoryOrder();
      if (typeof window.__birinciRefreshStoryCategoryFilter === "function") {
        window.__birinciRefreshStoryCategoryFilter();
      }
      renderList();
      refreshSidebarNav();
      bindStoryCategoryToggles(list);
    });

    const scrollToolsIntoView = () => {
      try {
        bar.scrollIntoView({ block: "nearest", behavior: "auto" });
      } catch (_) {}
    };

    let applyingHistory = false;
    const writeCategoryUrlState = () => {
      if (applyingHistory) return;
      try {
        const params = new URLSearchParams();
        const q = searchInput.value.trim();
        if (q) params.set("q", q);
        const url = new URL(window.location.href);
        url.search = params.toString();
        url.hash = pendingStem || (window.location.hash || "").replace(/^#/, "");
        const next = `${url.pathname}${url.search}${url.hash}`;
        const prevHash = window.location.hash || "";
        const nextHash = url.hash ? `#${String(url.hash).replace(/^#/, "")}` : "";
        commitHistoryHref(next, { replace: prevHash === nextHash });
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
      const visibleStories = filtered.slice();

      const visibleSet = new Set(visibleStories.map((s) => s.dataset.stem));
      allStories.forEach((story) => {
        story.hidden = !visibleSet.has(story.dataset.stem);
      });
      lastShownCount = visibleStories.length;
      lastVisibleStems = visibleSet;
      if (expandAllOnNextNav) {
        categorySection.classList.remove("is-collapsed");
      }
      const categoryHead = categorySection.querySelector(".inventions-category-head");
      if (categoryHead) {
        const base = String(categoryHead.textContent || "").replace(/\s*\(\d+\)\s*$/, "").trim();
        const toggle = categoryHead.querySelector(".inventions-category-toggle");
        categoryHead.textContent = categoryTitleWithCount(base, visibleStories.length);
        if (toggle) categoryHead.appendChild(toggle);
      }
      visibleStories.forEach((story) => categorySection.appendChild(story));
      allStories
        .filter((story) => !visibleSet.has(story.dataset.stem))
        .forEach((story) => categorySection.appendChild(story));
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
      refreshSidebarNav();
      bindStoryCategoryToggles(list);
      if (countEl) countEl.textContent = String(total);
      if (empty) empty.hidden = total !== 0;
      if (typeof window.__birinciClearListenQueue === "function") {
        window.__birinciClearListenQueue({ keepTrack: true });
      }
      syncPlayVisibleUi(total);
      writeCategoryUrlState();
      if (pendingStem) {
        const stemToShow = pendingStem;
        const el = document.getElementById(stemToShow);
        if (el) {
          window.requestAnimationFrame(() => {
            if (typeof window.__birinciScrollToStoryOrArticle === "function") {
              window.__birinciScrollToStoryOrArticle(stemToShow);
            } else {
              el.scrollIntoView({ block: "start", behavior: "auto" });
            }
          });
        }
        pendingStem = null;
      }
      const highlightRoot =
        document.querySelector(".category-main") ||
        list.closest("main") ||
        list;
      paintSearchAndLexicon(highlightRoot, searchInput.value.trim());
      mountStoryTts();
      if (typeof window.__birinciRefreshStoryLangSwitchers === "function") {
        window.__birinciRefreshStoryLangSwitchers();
      }
      expandAllOnNextNav = false;
    };

    searchInput.addEventListener("input", () => {
      pendingStem = null;
      renderList({ resetWindow: true });
    });

    try {
      const params = new URLSearchParams(window.location.search || "");
      const qParam = String(params.get("q") || "").trim();
      if (qParam) searchInput.value = qParam;
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

    window.addEventListener("popstate", () => {
      if (pagePathKey(window.location.pathname) !== (window.__birinciPageKey || pagePathKey(window.location.pathname))) {
        return;
      }
      applyingHistory = true;
      try {
        const params = new URLSearchParams(window.location.search || "");
        const qParam = String(params.get("q") || "").trim();
        searchInput.value = qParam;
        let hash = "";
        try {
          hash = decodeURIComponent((window.location.hash || "").replace(/^#/, ""));
        } catch (_) {
          hash = (window.location.hash || "").replace(/^#/, "");
        }
        pendingStem = hash || null;
        if (hash) applyCategoryView("list", { animate: false });
        renderList();
      } finally {
        applyingHistory = false;
      }
    });
  };

  primeStoryToolsBarLayout();
  initCategoryTools();
  try {
    mountStoryTts();
    if (typeof window.__birinciRefreshStoryLangSwitchers === "function") {
      window.__birinciRefreshStoryLangSwitchers();
    }
  } catch (err) {
    console.error("mountStoryTts failed", err);
  }

  /**
   * DAAB News-style sidebar: sticky TOC, scroll-spy, mobile accordion.
   * Main-page scroll updates the TOC highlight; clicking a TOC item scrolls
   * the story into view. Sidebar list scrolling does not drive the page.
   */
  const bindStorySidebarLayout = (layout) => {
    if (!layout) return null;
    // Discoveries uses kt-inventions.js scroll-spy; avoid a second sidebar→main sync.
    if (document.body.classList.contains("page-inventions")) return null;
    if (layout.__birinciSidebar) {
      layout.__birinciSidebar.refresh();
      return layout.__birinciSidebar;
    }

    const nav = layout.querySelector(".charter-sidebar, .story-nav.sidebar");
    if (!nav) return null;
    const widget = nav.querySelector(".sidebar-widget");
    const widgetBody = nav.querySelector(".widget-body");
    const toggle = nav.querySelector(".events-menu-toggle");
    const mobileQuery = window.matchMedia("(max-width: 1060px)");

    let links = [];
    let cards = [];
    let lastActiveLink = null;
    let programmaticLock = false;
    let lockTimer = null;
    let sidebarScrollSilent = false;

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

    const stickyScrollOffset = () => {
      // Prefer live sticky chrome (header + breadcrumbs) — matches --sticky-stack-bottom.
      const headerEl = document.querySelector(".site-header");
      const crumbsEl = document.querySelector(".breadcrumbs");
      let stack = 0;
      if (headerEl) stack = Math.max(stack, headerEl.getBoundingClientRect().bottom);
      if (crumbsEl) stack = Math.max(stack, crumbsEl.getBoundingClientRect().bottom);
      if (stack <= 0) {
        const root = document.documentElement;
        const style = window.getComputedStyle(root);
        const cssStack = parseFloat(style.getPropertyValue("--sticky-stack-bottom"));
        if (Number.isFinite(cssStack) && cssStack > 0) {
          stack = cssStack;
        } else {
          const headerH = parseFloat(style.getPropertyValue("--header-h")) || 68;
          const crumbH = parseFloat(style.getPropertyValue("--breadcrumb-h")) || 43;
          stack = headerH + crumbH;
        }
      }
      let gap = parseFloat(
        window.getComputedStyle(document.documentElement).getPropertyValue("--kt-scroll-anchor-gap")
      );
      if (!Number.isFinite(gap) || gap <= 0) gap = 16;
      return Math.ceil(stack) + gap;
    };

    const storyHeaderEl = (storyEl) =>
      (storyEl &&
        (storyEl.querySelector(".card-header") ||
          storyEl.querySelector(".story__title, .card-title, h2, h1"))) ||
      storyEl;

    const scrollMainToStory = (link, options = {}) => {
      const resolved = resolveStoryTarget(link);
      if (!resolved) return false;
      const { id, target } = resolved;
      expandStoryContext(link, target);
      setActive(link, {
        skipSidebarScroll: !options.forceSidebarScroll,
        force: !!options.force,
        forceSidebarScroll: !!options.forceSidebarScroll,
      });
      if (typeof syncStickyChrome === "function") syncStickyChrome();

      const alignStoryHeader = () => {
        const scrollTarget = storyHeaderEl(target);
        if (!scrollTarget) return;
        const root = document.documentElement;
        const prevBehavior = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        const offset = stickyScrollOffset();
        const y =
          scrollTarget.getBoundingClientRect().top +
          (window.pageYOffset || root.scrollTop || 0) -
          offset;
        window.scrollTo(0, Math.max(0, Math.round(y)));
        // Second pass: breadcrumb depth / sticky heights can change after setActive.
        const topAfter = scrollTarget.getBoundingClientRect().top;
        if (Math.abs(topAfter - offset) > 2) {
          window.scrollTo(
            0,
            Math.max(
              0,
              Math.round(
                scrollTarget.getBoundingClientRect().top +
                  (window.pageYOffset || root.scrollTop || 0) -
                  stickyScrollOffset()
              )
            )
          );
        }
        root.style.scrollBehavior = prevBehavior;
      };

      alignStoryHeader();
      requestAnimationFrame(() => {
        requestAnimationFrame(alignStoryHeader);
      });

      try {
        commitHistoryHref(`${window.location.pathname}${window.location.search}#${id}`);
      } catch (_) {}
      return true;
    };

    window.__birinciScrollToStoryOrArticle = (id) => {
      if (!id) return false;
      let decoded = id;
      try {
        decoded = decodeURIComponent(id);
      } catch (_) {}
      if (
        document.body.classList.contains("page-inventions") ||
        document.body.classList.contains("inventions-preview-page")
      ) {
        if (typeof window.__birinciScrollInventionsTo === "function") {
          return !!window.__birinciScrollInventionsTo(decoded);
        }
        return false;
      }
      let target = document.getElementById(decoded);
      if (!target && typeof window.__birinciRevealStory === "function") {
        window.__birinciRevealStory(decoded);
        target = document.getElementById(decoded);
      }
      if (!target || !layout.contains(target)) return false;
      const nav = layout.querySelector(
        ".charter-toc, .inventions-toc, [data-home-nav], [data-tools-nav], nav"
      );
      const link =
        (nav &&
          (nav.querySelector(`a[href="#${decoded}"]`) ||
            nav.querySelector(`a[href="#${encodeURIComponent(decoded)}"]`))) ||
        null;
      if (link) return scrollMainToStory(link, { force: true, forceSidebarScroll: true });
      const scrollTarget =
        target.querySelector(".card-header, .story__title, .inventions-category-head, h2, h1") ||
        target;
      if (typeof syncStickyChrome === "function") syncStickyChrome();
      const offset = stickyScrollOffset();
      const root = document.documentElement;
      const prevBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo(
        0,
        Math.max(
          0,
          Math.round(
            scrollTarget.getBoundingClientRect().top +
              (window.pageYOffset || root.scrollTop || 0) -
              offset
          )
        )
      );
      requestAnimationFrame(() => {
        const topAfter = scrollTarget.getBoundingClientRect().top;
        if (Math.abs(topAfter - stickyScrollOffset()) > 2) {
          window.scrollTo(
            0,
            Math.max(
              0,
              Math.round(
                scrollTarget.getBoundingClientRect().top +
                  (window.pageYOffset || root.scrollTop || 0) -
                  stickyScrollOffset()
              )
            )
          );
        }
        root.style.scrollBehavior = prevBehavior;
      });
      return true;
    };

    const isStoryVisible = (el) => {
      if (!el || el.hidden) return false;
      if (el.classList.contains("is-hidden")) return false;
      if (el.offsetParent === null) return false;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;
      if (el.closest(".inventions-category.is-collapsed, .stories-category.is-collapsed")) return false;
      return el.getBoundingClientRect().height > 0;
    };

    const scrollSidebarLinkIntoView = (link) => {
      if (!widgetBody || mobileQuery.matches || !link) return;
      const row = link.closest("li") || link;
      const bodyRect = widgetBody.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      const pad = 10;
      let delta = 0;
      if (rowRect.top < bodyRect.top + pad) {
        delta = rowRect.top - bodyRect.top - pad;
      } else if (rowRect.bottom > bodyRect.bottom - pad) {
        delta = rowRect.bottom - bodyRect.bottom + pad;
      }
      if (!delta) return;
      sidebarScrollSilent = true;
      widgetBody.scrollTop += delta;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          sidebarScrollSilent = false;
        });
      });
    };

    const resolveStoryTarget = (link) => {
      if (!link) return null;
      const raw = (link.getAttribute("href") || "").slice(1);
      let id = raw;
      try {
        id = decodeURIComponent(raw);
      } catch (_) {}
      if (!id) return null;
      let target = document.getElementById(id);
      if (!target && typeof window.__birinciRevealStory === "function") {
        window.__birinciRevealStory(id);
        target = document.getElementById(id);
      }
      if (!target || !layout.contains(target)) return null;
      return { id, target, link };
    };

    // Intentionally no sidebar→main sync on TOC scroll. Browsing the list must
    // not jump the page (or yank the list back via scroll-spy). Clicks still
    // call scrollMainToStory; main→sidebar spy keeps the highlight in sync.

    const expandStoryContext = (link, targetEl) => {
      const li = link && link.closest("li");
      const tocApi = window.KT_SIDEBAR_TOC_GROUPS;
      if (li && tocApi && typeof tocApi.expandGroupContaining === "function") {
        tocApi.expandGroupContaining(li);
        return;
      }
      const el = targetEl || (link && document.getElementById((link.getAttribute("href") || "").slice(1)));
      const cat = el && el.closest(".inventions-category, .stories-category");
      if (!cat) return;
      cat.classList.remove("is-collapsed");
      const catToggle = cat.querySelector(".inventions-category-toggle");
      if (catToggle) catToggle.setAttribute("aria-expanded", "true");
    };

    const lockSpy = (ms = 900) => {
      programmaticLock = true;
      clearTimeout(lockTimer);
      lockTimer = setTimeout(() => {
        programmaticLock = false;
        updateActive(true);
      }, ms);
    };

    const setActive = (activeLink, options = {}) => {
      const force = !!options.force;
      const skipSidebarScroll = !!options.skipSidebarScroll;

      if (!force && activeLink === lastActiveLink) {
        if (options.forceSidebarScroll && activeLink) scrollSidebarLinkIntoView(activeLink);
        return;
      }
      lastActiveLink = activeLink;

      links.forEach((link) => {
        const on = link === activeLink;
        link.classList.toggle("is-active", on);
        link.classList.toggle("tl-active", on);
        if (on) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });

      if (activeLink) {
        expandStoryContext(activeLink);
        if (!skipSidebarScroll) scrollSidebarLinkIntoView(activeLink);
      }

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

    const pickActiveStory = () => {
      const visible = cards.filter((entry) => isStoryVisible(entry.el));
      if (!visible.length) return null;
      const offset = stickyScrollOffset();
      let active = null;
      for (let i = 0; i < visible.length; i += 1) {
        const top = visible[i].el.getBoundingClientRect().top;
        if (top - offset <= 2) {
          active = visible[i].link;
        } else if (active) {
          break;
        }
      }
      return active || visible[0].link;
    };

    const updateActive = (force = false, options = {}) => {
      if (programmaticLock && !force) return;
      if (!cards.length) {
        setActive(null, { force, skipSidebarScroll: true });
        return;
      }
      setActive(pickActiveStory(), {
        force,
        skipSidebarScroll: options.skipSidebarScroll === true,
      });
    };

    let resizeTimer = null;
    const handleLayoutResize = () => {
      sidebarScrollSilent = true;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        sidebarScrollSilent = false;
        if (mobileQuery.matches) closeMenu();
        updateActive(true, { skipSidebarScroll: true });
      }, 120);
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
      closeMenu();
      programmaticLock = false;
      clearTimeout(lockTimer);
      sidebarScrollSilent = true;
      window.requestAnimationFrame(() => {
        sidebarScrollSilent = false;
        updateActive(true, { skipSidebarScroll: true });
      });
    });

    nav.addEventListener("click", (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || !nav.contains(link)) return;
      const resolved = resolveStoryTarget(link);
      if (!resolved) {
        const raw = (link.getAttribute("href") || "").slice(1);
        if (raw && typeof window.__birinciRevealStory === "function") {
          event.preventDefault();
          window.__birinciRevealStory(raw);
        }
        return;
      }
      event.preventDefault();
      lockSpy();
      scrollMainToStory(link);
      if (mobileQuery.matches) closeMenu();
    });

    const restoreHashTarget = () => {
      let id = "";
      try {
        id = decodeURIComponent((window.location.hash || "").replace(/^#/, ""));
      } catch (_) {
        id = (window.location.hash || "").replace(/^#/, "");
      }
      if (!id) return;
      let target = document.getElementById(id);
      if (!target && typeof window.__birinciRevealStory === "function") {
        window.__birinciRevealStory(id);
        target = document.getElementById(id);
      }
      if (!target || !layout.contains(target)) return;
      const link = nav.querySelector(`a[href="#${id}"], a[href="#${encodeURIComponent(id)}"]`);
      expandStoryContext(link, target);
      if (link) scrollMainToStory(link, { force: true });
      else {
        programmaticLock = true;
        const scrollTarget =
          target.querySelector(".card-header, .story__title, .inventions-category-head, h2, h1") ||
          target;
        const root = document.documentElement;
        const prevBehavior = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        const top =
          scrollTarget.getBoundingClientRect().top +
          (window.pageYOffset || root.scrollTop || 0) -
          stickyScrollOffset();
        window.scrollTo({ top: Math.max(0, Math.round(top)), left: 0, behavior: "auto" });
        root.style.scrollBehavior = prevBehavior;
      }
      lockSpy();
    };
    window.addEventListener("popstate", restoreHashTarget);

    window.addEventListener("scroll", () => updateActive(false, { skipSidebarScroll: false }), {
      passive: true,
    });
    window.addEventListener("resize", handleLayoutResize, { passive: true });

    const selectStem = (stem, options = {}) => {
      if (!stem) return false;
      refresh();
      let decoded = stem;
      try {
        decoded = decodeURIComponent(stem);
      } catch (_) {}
      const esc =
        typeof CSS !== "undefined" && typeof CSS.escape === "function"
          ? CSS.escape(decoded)
          : String(decoded).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      const link =
        links.find((a) => {
          const href = (a.getAttribute("href") || "").replace(/^#/, "");
          let id = href;
          try {
            id = decodeURIComponent(href);
          } catch (_) {}
          return id === decoded;
        }) ||
        (nav &&
          (nav.querySelector(`a[href="#${esc}"]`) ||
            nav.querySelector(`a[href="#${encodeURIComponent(decoded)}"]`)));
      if (!link) {
        updateActive(true, { skipSidebarScroll: false });
        return false;
      }
      expandStoryContext(link);
      setActive(link, {
        force: true,
        skipSidebarScroll: false,
        forceSidebarScroll: options.forceSidebarScroll !== false,
      });
      lockSpy(options.lockMs || 1200);
      return true;
    };

    const api = { refresh, closeMenu, updateActive, setActive, selectStem };
    layout.__birinciSidebar = api;
    refresh();
    return api;
  };

  window.__birinciBindStorySidebar = bindStorySidebarLayout;

  const selectStoryInSidebar = (stem) => {
    if (!stem) return false;
    const layout = document.querySelector(
      ".charter-layout.stories-layout, .category-layout, .charter-layout.category-layout"
    );
    if (layout && typeof window.__birinciBindStorySidebar === "function") {
      window.__birinciBindStorySidebar(layout);
    }
    const api = layout && layout.__birinciSidebar;
    if (api && typeof api.selectStem === "function") {
      return api.selectStem(stem, { forceSidebarScroll: true });
    }
    return false;
  };
  window.__birinciSelectStoryInSidebar = selectStoryInSidebar;

  const initHomeViews = () => {
    if (!document.body.classList.contains("page-home")) return;
    primeStoryToolsBarLayout();
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
    const viewBtns = Array.from(bar.querySelectorAll("[data-home-view]"));
    const assetVersion = listPanel.getAttribute("data-asset-version") || "";
    const viewStorageKey = "birinci-home-view";

    let view = "cards";
    let allStories = null;
    let filtered = [];
    let loading = null;
    let pendingStem = null;
    let listRenderKey = "";
    let lastShownCount = 0;
    let lastVisibleStems = new Set();
    let expandAllOnNextNav = false;

    const syncPlayVisibleUi = (total = 0) => {
      bar.querySelectorAll("[data-tools-play-visible]").forEach((btn) => {
        btn.disabled = total === 0;
      });
      if (typeof window.__birinciSyncPlayVisibleUi === "function") {
        window.__birinciSyncPlayVisibleUi();
      }
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
        cat: parseStoryCatParam(params),
        stem: hash || null,
      };
    };

    let applyingHistory = false;
    const writeUrlState = () => {
      if (applyingHistory) return;
      try {
        const params = new URLSearchParams();
        if (view === "list") params.set("view", "list");
        const q = searchInput.value.trim();
        if (view === "list" && q) params.set("q", q);
        const cats = activeStoryCategorySlugs();
        if (cats.length) params.set("cat", cats.join(","));
        const url = new URL(window.location.href);
        url.search = params.toString();
        if (view === "cards") url.hash = "";
        else url.hash = pendingStem || (window.location.hash || "").replace(/^#/, "");
        const next = `${url.pathname}${url.search}${url.hash}`;
        const prev = new URL(historyHref(), window.location.href);
        const navChanged =
          (prev.searchParams.get("view") || "") !== (params.get("view") || "") ||
          (prev.hash || "") !== (url.hash ? `#${String(url.hash).replace(/^#/, "")}` : "");
        commitHistoryHref(next, { replace: !navChanged });
      } catch (_) {
        /* file:// or sandboxed histories must not block view switching */
      }
    };

    const applyImagesState = (collapsed) => {
      const showImages = !collapsed;
      const showTexts = !document.body.classList.contains("texts-collapsed");
      if (!showImages && !showTexts) return;
      applyGlobalMediaVisibility(showImages, showTexts, imagesBtns, textsBtns);
    };

    const applyTextsState = (collapsed) => {
      const showTexts = !collapsed;
      const showImages = !document.body.classList.contains("images-collapsed");
      if (!showImages && !showTexts) return;
      applyGlobalMediaVisibility(showImages, showTexts, imagesBtns, textsBtns);
    };

    if ((imagesToggle && imagesBtns.length) || (textsToggle && textsBtns.length)) {
      const initial = resolveInitialMediaCollapsed();
      applyGlobalMediaVisibility(
        !initial.imagesCollapsed,
        !initial.textsCollapsed,
        imagesBtns,
        textsBtns,
        { forceAll: true }
      );
      imagesBtns.forEach((btn) => {
        btn.addEventListener("click", (event) => {
          if (btn.disabled || btn.getAttribute("aria-disabled") === "true") {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          const hide = btn.getAttribute("data-images-mode") === "hide";
          if (hide && document.body.classList.contains("texts-collapsed")) return;
          applyImagesState(hide);
        });
      });
      textsBtns.forEach((btn) => {
        btn.addEventListener("click", (event) => {
          if (btn.disabled || btn.getAttribute("aria-disabled") === "true") {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          const hide = btn.getAttribute("data-texts-mode") === "hide";
          if (hide && document.body.classList.contains("images-collapsed")) return;
          applyTextsState(hide);
        });
      });
      syncGlobalMediaGuards(imagesBtns, textsBtns);
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
        // Card view has no Category dropdown — show all categories (search only).
        const show = !q || hay.includes(q);
        item.hidden = !show;
        if (show) visible += 1;
      });
      if (cardsEmpty) cardsEmpty.hidden = visible !== 0;
      syncSearchFilterUi(searchInput.value.trim(), visible);
      paintSearchAndLexicon(cardsPanel || cardsList, searchInput.value.trim());
    };

    if (cardsList) {
      cardsList.addEventListener("click", (event) => {
        if (event.target.closest(".cat-card__listen, [data-story-tts]")) return;
        const card = event.target.closest(".cat-card");
        if (!card || !cardsList.contains(card)) return;
        const slug =
          card.getAttribute("data-slug") ||
          storyCategorySlugFromHref(card.getAttribute("href"));
        if (!slug) return;
        event.preventDefault();
        const api = window.KT_CATALOG_MULTI_FILTER;
        if (api && typeof api.setActiveValues === "function") {
          api.setActiveValues("filterStoryCategory", [slug], { silent: true });
        } else {
          const select = document.getElementById("filterStoryCategory");
          if (select) select.value = slug;
        }
        pendingStem = slug;
        setView("list", { persist: true, forceList: true });
      });
    }

    const flattenStories = (catalog) => {
      const rows = [];
      const seen = new Set();
      const pushStory = (story, categoryTitle, categorySlug) => {
        const stem = story && story.stem;
        if (!stem || seen.has(stem)) return;
        seen.add(stem);
        rows.push({
          stem,
          title: story.title,
          paragraphs: story.paragraphs || [],
          categoryTitle: categoryTitle || "",
          categorySlug: categorySlug || "",
          hasAudio: !!story.hasAudio,
          hasImage: !!story.hasImage,
          hay: `${story.title || ""} ${(story.paragraphs || []).join(" ")}`.toLocaleLowerCase(LOCALE_TAG),
        });
      };
      (catalog.categories || []).forEach((cat) => {
        (cat.stories || []).forEach((story) => {
          pushStory(story, cat.title || "", cat.slug || "");
        });
      });
      const orphans = []
        .concat(catalog.uncategorized || [])
        .concat(catalog.stories || []);
      orphans.forEach((story) => pushStory(story, "", ""));
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
      const authorSrcStems = { "everyone-has-work-to-do": 1, "weeds-must-be-pulled-from-the-root": 1, "silent-corridor": 1, "if-fate-allows-we-will-meet": 1 };
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

    const storyArticleHtml = (story, numInfo) => {
      const audioAttr = story.hasAudio
        ? ` data-audio="wisdom-stories/audio/${escapeHtml(story.stem)}.mp3?v=${escapeHtml(assetVersion)}"`
        : "";
      const audioLabel = escapeHtml(tUi("story_audio_label", "Səsləndir"));
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
            <button type="button" class="tools-bar__view-btn tools-bar__view-btn--icon" data-images-mode="show" aria-pressed="false" aria-controls="figure-${escapeHtml(story.stem)}" title="${escapeHtml(tUi("show_image", "Şəkli göstər"))}" aria-label="${escapeHtml(tUi("show_image", "Şəkli göstər"))}">
              ${STORY_ICONS.eye}
            </button>
            <button type="button" class="tools-bar__view-btn tools-bar__view-btn--icon" data-images-mode="hide" aria-pressed="true" aria-controls="figure-${escapeHtml(story.stem)}" title="${escapeHtml(tUi("hide_image", "Şəkli gizlət"))}" aria-label="${escapeHtml(tUi("hide_image", "Şəkli gizlət"))}">
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
        <img src="wisdom-stories/illustrations/${escapeHtml(story.stem)}.webp" alt="${figAlt}" loading="lazy" width="1536" height="1024" />
      </button>
    </figure>`
        : "";
      const titleInner = escapeHtml(story.title);
      const langNav =
        typeof window.__birinciBuildStoryLangNavHtml === "function"
          ? window.__birinciBuildStoryLangNavHtml(story.stem, currentPageLang())
          : "";
      const multilingualBtn =
        typeof window.__birinciBuildStoryMultilingualBtnHtml === "function"
          ? window.__birinciBuildStoryMultilingualBtnHtml(story.stem)
          : "";
      return `
<article class="story news-card${story.hasImage ? " story--figure-hidden" : ""}" id="${escapeHtml(story.stem)}" data-stem="${escapeHtml(story.stem)}" data-title="${escapeHtml(story.title)}" data-category-slug="${escapeHtml(story.categorySlug || "")}"${audioAttr}>
  <div class="card-header">
    ${multilingualBtn}
    <h2 class="card-title story__title">${titleInner}</h2>
    ${langNav}
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

    const refreshSidebarNav = () => {
      if (!navList) return;
      const visibleStems =
        lastVisibleStems.size
          ? lastVisibleStems
          : new Set((filtered || []).map((story) => story.stem));
      const flat = storyCategoryFilterNoneSelected();
      fillGroupedStoryNav(navList, {
        visibleStems,
        shownCount: lastShownCount,
        expandAll: expandAllOnNextNav || flat,
        syncRoot: storiesList,
        flat,
        hrefForStory: (stem) => `#${stem}`,
        hrefForCategory: (group) => `#${group.slug}`,
      });
      if (typeof window.__birinciBindStorySidebar === "function") {
        const layout = listPanel.querySelector(".charter-layout.stories-layout, .category-layout");
        if (layout) window.__birinciBindStorySidebar(layout);
      }
      syncStoryExpandCollapseChrome();
    };
    window.__birinciRefreshStoryNav = refreshSidebarNav;
    window.__birinciRevealStory = (stem) => {
      if (!stem) return;
      pendingStem = stem;
      if (view !== "list") {
        setView("list", { persist: true, animate: false, forceList: true });
        return;
      }
      renderList({ force: true });
    };
    window.__birinciOnStoriesCatalog = (catalog, opts) => {
      allStories = flattenStories(catalog || window.__BIRINCI_STORIES__);
      if (opts && opts.quiet) {
        refreshSidebarNav();
        return;
      }
      listRenderKey = "";
      if (view === "list") renderList({ force: true });
      else {
        applyCards();
        refreshSidebarNav();
      }
    };

    const bindHomeNav = () => {
      const layout = listPanel.querySelector(".charter-layout.stories-layout, .category-layout");
      if (!layout) return;
      if (typeof window.__birinciBindStorySidebar === "function") {
        window.__birinciBindStorySidebar(layout);
      }
    };

    const renderList = ({ resetWindow = false, force = false } = {}) => {
      if (!storiesList) return;
      if (typeof window.__birinciStopStoryTts === "function") window.__birinciStopStoryTts();
      const q = searchInput.value.trim().toLocaleLowerCase(LOCALE_TAG);
      const noneSelected = storyCategoryFilterNoneSelected();
      if (noneSelected) {
        // Select All unchecked → uncategorized stories (no category), A–Z by title.
        // If the catalog has no uncategorized stories yet, fall back to a flat A–Z
        // list of all stories so this mode does not blank the page.
        const orphans = (allStories || []).filter((story) =>
          isStoryUncategorizedSlug(story.categorySlug)
        );
        const pool = orphans.length ? orphans : allStories || [];
        filtered = pool
          .filter((story) => !q || story.hay.includes(q))
          .slice()
          .sort((a, b) => compareCatalogTitles(a.title, b.title))
          .map((story) => ({
            ...story,
            categorySlug: STORY_UNCATEGORIZED_SLUG,
            categoryTitle: uncategorizedStoriesLabel(),
          }));
      } else {
        filtered = (allStories || []).filter(
          (story) => storyCategoryPasses(story.categorySlug) && (!q || story.hay.includes(q))
        );
      }

      const total = filtered.length;
      syncSearchFilterUi(searchInput.value.trim(), total);
      const visibleStories = filtered.slice();

      lastShownCount = visibleStories.length;
      lastVisibleStems = new Set(visibleStories.map((s) => s.stem));
      const nextKey = `${visibleStories.map((s) => s.stem).join("\n")}|t${total}|u${
        noneSelected ? 1 : 0
      }`;
      const reuseDom =
        !force &&
        nextKey === listRenderKey &&
        storiesList.querySelectorAll("article.story").length === visibleStories.length;

      if (!reuseDom) {
        const collapsed =
          expandAllOnNextNav || q || noneSelected
            ? new Set()
            : collectCollapsedStoryCategories(storiesList);
        if (pendingStem) {
          const reveal = visibleStories.find(
            (story) => story.stem === pendingStem || story.categorySlug === pendingStem
          );
          if (reveal) collapsed.delete(reveal.categorySlug);
          collapsed.delete(pendingStem);
        }
        const catalog = window.__BIRINCI_STORIES__;
        const numbering = noneSelected ? new Map() : storyCatalogNumbering(catalog);
        listRenderKey = nextKey;
        if (noneSelected) {
          // Flat list: story titles only — no category section headings.
          storiesList.innerHTML = visibleStories
            .map((story) => storyArticleHtml(story, null))
            .join("");
        } else {
          const groups = groupStoriesByCategory(visibleStories, catalog);
          storiesList.innerHTML = groups
            .map((group) => {
              const collapsedClass = collapsed.has(group.slug) ? " is-collapsed" : "";
              return `<section class="inventions-category stories-category${collapsedClass}" id="${escapeHtml(
                group.slug
              )}" data-category="${escapeHtml(group.title)}"><h2 class="inventions-category-head">${escapeHtml(
                categoryTitleWithCount(visibleCatalogLabel(group.title), group.stories.length)
              )}</h2>${group.stories
                .map((story) => storyArticleHtml(story, numbering.get(story.stem)))
                .join("")}</section>`;
            })
            .join("");
        }
        hideAudioChrome(storiesList);
        ensureStoryListenButtons(storiesList);
        if (typeof window.__birinciSetAllStoryFigures === "function") {
          window.__birinciSetAllStoryFigures(!document.body.classList.contains("images-collapsed"));
        }
        if (typeof window.__birinciSetAllStoryTexts === "function") {
          window.__birinciSetAllStoryTexts(!document.body.classList.contains("texts-collapsed"));
        }
        if (typeof window.__birinciClearListenQueue === "function") {
          window.__birinciClearListenQueue({ keepTrack: true });
        }
      }
      refreshSidebarNav();
      bindStoryCategoryToggles(storiesList);
      if (listEmpty) listEmpty.hidden = total !== 0;
      syncPlayVisibleUi(total);
      writeUrlState();
      if (pendingStem) {
        const stemToShow = pendingStem;
        const el = document.getElementById(stemToShow);
        const cat =
          el && el.classList.contains("inventions-category")
            ? el
            : el && el.closest(".inventions-category");
        if (cat) {
          cat.classList.remove("is-collapsed");
          const api = window.KT_SIDEBAR_TOC_GROUPS;
          const group =
            cat.id &&
            document.querySelector(`.toc-group[data-toc-cat="${cssEscapeAttr(cat.id)}"]`);
          if (group && api && typeof api.setGroupExpanded === "function") {
            api.setGroupExpanded(group, true);
          }
        }
        if (el) {
          window.requestAnimationFrame(() => {
            if (typeof window.__birinciScrollToStoryOrArticle === "function") {
              window.__birinciScrollToStoryOrArticle(stemToShow);
            } else {
              el.scrollIntoView({ block: "start", behavior: "auto" });
            }
          });
        }
        pendingStem = null;
      }
      paintSearchAndLexicon(listPanel || storiesList, searchInput.value.trim());
      if (typeof window.__birinciRefreshStoryLangSwitchers === "function") {
        window.__birinciRefreshStoryLangSwitchers();
      }
      expandAllOnNextNav = false;
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
      document.body.classList.toggle("inventions-view-cards", view === "cards");
      document.body.classList.toggle("inventions-view-list", view === "list");
      bar.querySelectorAll("[data-inventions-list-only], [data-home-list-only], [data-story-cat-filter]").forEach((el) => {
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
    window.__birinciSetHomeView = setView;

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
        writeUrlState();
        return;
      }
      pendingStem = null;
      renderList({ resetWindow: true });
    });

    const urlState = readUrlState();
    let initialView = "list";
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

    bindStoryCategoryFilter(bar, {
      initialSlugs: urlState.cat,
      onChange: (slugs) => {
        pendingStem = slugs && slugs.length === 1 ? slugs[0] : null;
        // Category filter is list-only; always refresh the story list.
        if (view !== "list") {
          setView("list", { persist: true, forceList: true });
          return;
        }
        renderList({ resetWindow: true, force: true });
      },
    });

    try {
      setView(initialView, { persist: false, scrollTools: false, animate: false });
    } catch (_) {
      setHidden(cardsPanel, initialView !== "cards");
      setHidden(listPanel, initialView !== "list");
    }

    window.addEventListener("popstate", () => {
      if (pagePathKey(window.location.pathname) !== (window.__birinciPageKey || pagePathKey(window.location.pathname))) {
        return;
      }
      const state = readUrlState();
      applyingHistory = true;
      try {
        searchInput.value = state.q || "";
        pendingStem = state.stem || null;
        const catApi = window.KT_CATALOG_MULTI_FILTER;
        if (catApi && typeof catApi.setActiveValues === "function") {
          catApi.setActiveValues("filterStoryCategory", state.cat || [], { silent: true });
        }
        const nextView = state.stem ? "list" : state.view === "list" ? "list" : "cards";
        setView(nextView, { persist: false, scrollTools: false, animate: false });
      } finally {
        applyingHistory = false;
      }
    });
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
        (btn &&
          btn.closest(
            ".story__actions, .text-lightbox__tts, .inventions-entry__tts, .tools-bar__field--listen, article.inventions-entry"
          )) ||
        (btn && btn.parentElement);
      let note = root && root.querySelector("[data-story-tts-note]");
      if (!note && root) {
        note = document.createElement("p");
        note.className = "story-tts__note";
        note.setAttribute("data-story-tts-note", "");
        root.appendChild(note);
      }
      if (!note) return;
      note.hidden = !message;
      note.textContent = message || "";
    };

    const resolveStory = (btn) => {
      if (!btn) return null;
      const nested = btn.closest("article.story, article.inventions-entry");
      if (nested) return nested;
      const stem = (btn.getAttribute("data-story-stem") || "").trim();
      if (!stem) return null;
      return (
        document.getElementById(stem) ||
        document.querySelector(`article.story[data-stem="${stem}"]`) ||
        document.querySelector(`article.inventions-entry#${window.CSS && CSS.escape ? CSS.escape(stem) : stem}`)
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
      const discoveryName = story && story.querySelector(".inventions-entry-name");
      if (discoveryName) return discoveryName.textContent.trim();
      const titleNode =
        story &&
        (story.querySelector(".story__title, .card-title, .inventions-entry-name") ||
          story.querySelector("h2"));
      if (titleNode) return titleNode.textContent.trim();
      return story && story.classList.contains("inventions-entry") ? "Məqalə" : "Hekayə";
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
          `[data-story-tts][data-story-stem="${esc}"], article.story[data-stem="${esc}"] [data-story-tts], article.story#${esc} [data-story-tts], .inventions-entry#${esc} [data-story-tts], .inventions-entry#${esc} [data-article-tts]`
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

    const notifyAudioPlayer = (detail) => {
      try {
        document.dispatchEvent(new CustomEvent("birinci:audio-player-change", { detail }));
      } catch (_) {}
    };

    const hidePlayerShell = () => {
      if (!playerShell) return;
      playerShell.hidden = true;
      playerShell.setAttribute("hidden", "");
      document.body.classList.remove("audio-player-open");
      syncAudioPlayerInset();
      notifyAudioPlayer({ open: false, playing: false });
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
        `[data-story-tts][data-story-stem="${esc}"], article.story[data-stem="${esc}"] [data-story-tts], article.story#${esc} [data-story-tts], .inventions-entry#${esc} [data-article-tts]`
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
      notifyAudioPlayer({ open: false, playing: false, ended: true, stem });
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

    const collectVisibleStems = () => {
      const stories = Array.from(document.querySelectorAll("article.story"))
        .filter((el) => !el.hidden && !el.closest("[hidden]"))
        .map((el) => (el.dataset.stem || el.id || "").trim())
        .filter(Boolean);
      if (stories.length) return stories;
      return Array.from(document.querySelectorAll(".inventions-entry"))
        .filter(
          (el) =>
            !el.hidden &&
            !el.classList.contains("is-hidden")
        )
        .map((el) => (el.id || "").trim())
        .filter(Boolean);
    };

    const storyElForStem = (stem) => {
      if (!stem) return null;
      const esc = escapeStem(stem);
      return (
        document.getElementById(stem) ||
        document.querySelector(`article.story[data-stem="${esc}"]`) ||
        document.querySelector(`article.inventions-entry#${esc}`)
      );
    };

    const listenBtnForStem = (stem) => {
      const story = storyElForStem(stem);
      return (
        (story && story.querySelector('[data-article-tts][data-tts-mode="listen"]')) ||
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
      document.querySelectorAll("article.story.story--playing, .inventions-entry.story--playing").forEach((el) => {
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
      const suffix = document.body.classList.contains("page-inventions")
        ? tUi("articles_count_suffix", "məqalə")
        : tUi("stories_count_suffix", "hekayə");
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

    const currentVoices = () => {
      if (!window.speechSynthesis) return [];
      try {
        return window.speechSynthesis.getVoices() || [];
      } catch (_) {
        return [];
      }
    };

    const warmVoices = () => {
      currentVoices();
    };
    warmVoices();
    document.addEventListener("pointerdown", warmVoices, { passive: true });
    try {
      window.speechSynthesis &&
        window.speechSynthesis.addEventListener("voiceschanged", warmVoices);
    } catch (_) {}

    const hasAzVoice = (voices) =>
      (Array.isArray(voices) ? voices : []).some((v) => {
        const lang = String((v && v.lang) || "");
        const name = String((v && v.name) || "");
        return /^az\b/i.test(lang) || /babek|azerbaijani|azərbaycan/i.test(name);
      });

    const isDesktopEdge = () => {
      const ua = String((window.navigator && window.navigator.userAgent) || "");
      return /\bEdg\//.test(ua) && !/\bEdgA\/|\bEdgiOS\//.test(ua);
    };

    const hasSpeechSynthesis = () =>
      typeof window.speechSynthesis === "object" &&
      window.speechSynthesis &&
      typeof window.SpeechSynthesisUtterance === "function";

    const browserSupportsAzTts = () =>
      hasAzVoice(currentVoices()) || isDesktopEdge();
    window.__birinciHasAzVoice = hasAzVoice;
    window.__birinciIsDesktopEdge = isDesktopEdge;
    window.__birinciBrowserSupportsAzTts = browserSupportsAzTts;

    const pageLocaleCode = () => {
      const raw = String(
        (document.body && document.body.getAttribute("data-lang")) ||
          (document.documentElement && document.documentElement.lang) ||
          LOCALE_TAG ||
          "az"
      ).toLowerCase();
      return raw.split(/[-_]/)[0] || "az";
    };

    const localeSpeechSpec = (code) => {
      const lang = code || pageLocaleCode();
      const configured = String((liveI18n().tts_voice || "")).trim();
      const specs = {
        az: {
          bcp47: "az-AZ",
          configured: configured || "az-AZ-BabekNeural",
          preferName: /babek/i,
          langOk: (l) => /^az\b/i.test(l),
          nameOk: (n) => /azərbaycan|azerbaijani|babek/i.test(n),
          fallbackLang: (l) => /^tr\b/i.test(l),
          fallbackName: (n) => /turkish|türk/i.test(n),
          reject: (l, n) =>
            /^en\b/i.test(l) ||
            /english|david|zira|mark\b|susan|george|hazel|google us english|google uk english/i.test(
              n
            ),
        },
        en: {
          bcp47: "en-US",
          configured: configured || "en-US-GuyNeural",
          preferName: /guyneural|\bguy\b/i,
          langOk: (l) => /^en\b/i.test(l),
          nameOk: (n) => /english/i.test(n),
          fallbackLang: () => false,
          fallbackName: () => false,
          reject: () => false,
        },
        ru: {
          bcp47: "ru-RU",
          configured: configured || "ru-RU-DmitryNeural",
          preferName: /dmitry/i,
          langOk: (l) => /^ru\b/i.test(l),
          nameOk: (n) => /russian|русск/i.test(n),
          fallbackLang: () => false,
          fallbackName: () => false,
          reject: () => false,
        },
        ky: {
          bcp47: "ky-KG",
          configured: configured || "kk-KZ-DauletNeural",
          preferName: /daulet/i,
          langOk: (l) => /^(ky|kk)\b/i.test(l),
          nameOk: (n) => /kyrgyz|kirghiz|кыргыз|kazakh|қазақ|daulet/i.test(n),
          fallbackLang: (l) => /^(kk|tr)\b/i.test(l),
          fallbackName: (n) => /kazakh|қазақ|turkish|türk/i.test(n),
          reject: (l, n) => /^en\b/i.test(l) || /english/i.test(n),
        },
      };
      return specs[lang] || specs.az;
    };

    const pickVoice = (voices, localeHint) => {
      const spec = localeSpeechSpec(localeHint);
      const list = Array.isArray(voices) ? voices.filter(Boolean) : [];
      const wanted = spec.configured.toLowerCase();
      const score = (v) => {
        const lang = String(v.lang || "");
        const name = String(v.name || "");
        const nameL = name.toLowerCase();
        if (spec.reject(lang, nameL)) return -1000;
        let s = 0;
        if (wanted && (nameL.includes(wanted) || nameL.includes(wanted.replace(/neural$/i, "")))) {
          s += 120;
        }
        if (spec.preferName.test(name)) s += 100;
        if (spec.langOk(lang)) s += 60;
        if (spec.nameOk(name)) s += 50;
        if (/male/i.test(name) && spec.langOk(lang)) s += 8;
        return s;
      };
      let best = null;
      let bestScore = 0;
      list.forEach((v) => {
        const s = score(v);
        if (s > bestScore) {
          best = v;
          bestScore = s;
        }
      });
      if (best) return best;
      return (
        list.find(
          (v) =>
            !spec.reject(v.lang || "", String(v.name || "").toLowerCase()) &&
            (spec.fallbackLang(v.lang || "") || spec.fallbackName(v.name || ""))
        ) || null
      );
    };
    window.__birinciPickTtsVoice = pickVoice;
    window.__birinciTtsLocale = pageLocaleCode;

    const cleanSpeechText = (value) =>
      String(value || "")
        .replace(/[\u00AD\u200B-\u200D\uFEFF]/g, "")
        .replace(/[«»„“”]/g, "")
        .replace(/[‘’']/g, "")
        .replace(/[—–-]+\s*/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const textForSpeech = (story) => {
      if (story && story.classList && story.classList.contains("inventions-entry")) {
        const title = (
          (story.querySelector(".inventions-entry-name") || {}).textContent || ""
        ).trim();
        const parts = [];
        const summary = story.querySelector(".inventions-entry-visual-summary");
        if (summary) parts.push(cleanSpeechText(summary.textContent));
        story.querySelectorAll(".inventions-entry-section").forEach((sec) => {
          if (sec.closest(".inventions-entry-references")) return;
          const heading = sec.querySelector("h3");
          if (heading) parts.push(cleanSpeechText(heading.textContent));
          Array.from(sec.querySelectorAll("p"))
            .map((p) => cleanSpeechText(p.textContent))
            .filter(Boolean)
            .forEach((p) => parts.push(p));
        });
        const body = parts.filter(Boolean).join(" ");
        if (!body) return title;
        if (
          title &&
          body.toLocaleLowerCase(LOCALE_TAG).startsWith(title.toLocaleLowerCase(LOCALE_TAG))
        ) {
          return body;
        }
        return title ? `${title}. ${body}` : body;
      }
      const textEl = story && story.querySelector(".story__text");
      const title = ((story && story.dataset.title) || "").trim();
      const paras = textEl
        ? Array.from(textEl.querySelectorAll("p"))
            .filter((p) => !p.classList.contains("story__source"))
            .map((p) => p.textContent.replace(/\s+/g, " ").trim())
            .filter(Boolean)
        : [];
      let body = cleanSpeechText(paras.join(" "));
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
      const nextStem = stemFor(btn);
      if (nextStem) activeStem = nextStem;
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
        notifyAudioPlayer({ open: !playerShell.hidden, playing: false, ended: true, stem: activeStem });
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
        start.catch((err) => {
          if (err && err.name === "NotAllowedError") {
            updatePlayButton(false);
            return;
          }
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

      loadToken += 1;
      suppressError = true;
      stopAudioElement({ clearSrc: true });
      window.setTimeout(() => {
        suppressError = false;
      }, 120);

      activeSourceKey = absolute;
      markPlaying(btn, true);
      updatePlayButton(true);

      // Play the MP3 URL in the same click turn. Fetching a blob first
      // loses the user-gesture and Chrome/Edge block audio.play().
      revokeObjectUrl();
      audioPlayer.src = absolute;
      startPlayback(btn);
    };

    const playAudioStory = (btn, src, story) => {
      openPlayer({
        btn,
        src,
        title: titleFor(btn, story),
        stem: stemFor(btn),
      });
    };

    const speakStory = (btn, { fromQueue = false } = {}) => {
      if (!hasSpeechSynthesis()) {
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

      const spec = localeSpeechSpec();
      let voice = pickVoice(currentVoices());
      if (voice && spec.reject && spec.reject(voice.lang || "", String(voice.name || "").toLowerCase())) {
        voice = null;
      }

      if (!fromQueue) {
        clearQueue({ keepTrack: false });
        if (window.speechSynthesis && (window.speechSynthesis.speaking || window.speechSynthesis.paused)) {
          suppressError = true;
          window.speechSynthesis.cancel();
          window.setTimeout(() => {
            suppressError = false;
          }, 120);
        }
        hidePlayerShell();
      } else {
        ensurePlayer();
        stopCurrentMedia();
        showPlayerShell();
        updateQueueChrome(titleFor(btn, story));
      }
      markPlaying(btn, true);
      syncPlayVisibleButton();
      showNote(btn, "");

      const token = ++speakToken;
      const chunks = [];
      const CHUNK = 14000;
      if (text.length <= CHUNK) {
        chunks.push(text);
      } else {
        let rest = text;
        while (rest.length) {
          if (rest.length <= CHUNK) {
            chunks.push(rest);
            break;
          }
          let cut = rest.lastIndexOf(". ", CHUNK);
          if (cut < CHUNK * 0.5) cut = rest.lastIndexOf(" ", CHUNK);
          if (cut < 1) cut = CHUNK;
          chunks.push(rest.slice(0, cut + 1).trim());
          rest = rest.slice(cut + 1).trim();
        }
      }
      let chunkIndex = 0;
      let retriedWithoutVoice = false;
      const startSpeak = () => {
        if (token !== speakToken) return;
        const piece = chunks[chunkIndex] || text;
        utterance = new SpeechSynthesisUtterance(piece);
        utterance.lang = spec.bcp47;
        if (voice) utterance.voice = voice;
        utterance.rate = 1;
        utterance.pitch = 1;

        utterance.onstart = () => {
          if (token !== speakToken) return;
          markPlaying(btn, true);
          syncPlayVisibleButton();
        };
        utterance.onend = () => {
          if (suppressError || token !== speakToken) return;
          if (chunkIndex + 1 < chunks.length) {
            chunkIndex += 1;
            startSpeak();
            return;
          }
          if (fromQueue && queueActive && typeof window.__birinciQueueAdvance === "function") {
            window.__birinciQueueAdvance();
            return;
          }
          clearActive();
          hidePlayerShell();
          syncPlayVisibleButton();
        };
        utterance.onerror = (event) => {
          if (suppressError || token !== speakToken) return;
          const err = String((event && event.error) || "");
          if (
            voice &&
            !retriedWithoutVoice &&
            /voice-unavailable|language-unavailable|synthesis-failed|network|invalid-argument/i.test(err)
          ) {
            retriedWithoutVoice = true;
            voice = null;
            startSpeak();
            return;
          }
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
          if (voice && !retriedWithoutVoice) {
            retriedWithoutVoice = true;
            voice = null;
            startSpeak();
            return;
          }
          if (fromQueue && queueActive && typeof window.__birinciQueueAdvance === "function") {
            window.__birinciQueueAdvance();
            return;
          }
          clearActive();
          showNote(btn, unsupportedMessage);
        }
      };

      startSpeak();
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

    window.__birinciPlayStoredMp3 = ({ src, title, stem, btn }) => {
      if (!src) return;
      openPlayer({
        btn: btn || null,
        src,
        title: title || "Məqalə",
        stem: stem || "",
      });
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

    const currentDiscoveryEntry = () => {
      if (typeof window.__birinciInventionsContext === "function") {
        try {
          const ctx = window.__birinciInventionsContext();
          if (ctx && ctx.sectionId) {
            const el = document.getElementById(ctx.sectionId);
            if (el && el.classList.contains("inventions-entry")) return el;
          }
        } catch (_) {}
      }
      let hash = "";
      try {
        hash = decodeURIComponent((window.location.hash || "").replace(/^#/, ""));
      } catch (_) {
        hash = (window.location.hash || "").replace(/^#/, "");
      }
      if (hash) {
        const hashed = document.getElementById(hash);
        if (hashed && hashed.classList.contains("inventions-entry")) return hashed;
      }
      const entries = Array.from(document.querySelectorAll("article.inventions-entry")).filter(
        (el) => !el.classList.contains("is-hidden") && !el.hidden
      );
      const mid = window.scrollY + window.innerHeight * 0.35;
      let best = entries[0] || null;
      for (let i = entries.length - 1; i >= 0; i -= 1) {
        const top = entries[i].getBoundingClientRect().top + window.scrollY;
        if (top <= mid) {
          best = entries[i];
          break;
        }
      }
      return best;
    };

    const escAttr = (value) =>
      String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;");

    const discoveryTtsPairHtml = (stem) => {
      const listen = tUi("listen", "Mətni dinlə");
      const stop = tUi("stop", "Dayandır");
      const stemAttr = stem ? ` data-story-stem="${escAttr(stem)}"` : "";
      return `
        <div class="tools-bar__views inventions-tts-pair" role="group" aria-label="${escAttr(listen)}">
          <button type="button" class="story-tts tools-bar__view-btn tools-bar__view-btn--icon" data-story-tts data-discovery-tts data-tts-mode="listen"${stemAttr} aria-pressed="false" title="${escAttr(listen)}" aria-label="${escAttr(listen)}">${STORY_ICONS.listen}</button>
          <button type="button" class="story-tts tools-bar__view-btn tools-bar__view-btn--icon" data-story-tts data-discovery-tts data-tts-mode="stop"${stemAttr} aria-pressed="true" title="${escAttr(stop)}" aria-label="${escAttr(stop)}">${STORY_ICONS.stop}</button>
        </div>
        <p class="story-tts__note" data-story-tts-note hidden></p>`;
    };

    const mountDiscoveryTts = () => {
      // Yesterday's Discoveries listen lives in the toolbar (list-only) and
      // in each article's Image/Text action bar — not in the title header.
    };
    mountStoryTts();
    mountDiscoveryTts();
    document.querySelectorAll("[data-az-tts-help], .az-tts-help").forEach((el) => el.remove());

    document.addEventListener("click", (event) => {
      const playVisibleBtn = event.target.closest("[data-tools-play-visible]");
      if (playVisibleBtn) {
        if (!SHOW_AUDIO_CONTROLS) return;
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
      const btn = event.target.closest("[data-story-tts], [data-discovery-tts]");
      if (!btn) return;
      event.preventDefault();
      event.stopPropagation();
      if (Date.now() < ignoreClicksUntil) return;
      if (!SHOW_DISCOVERY_LISTEN && btn.hasAttribute("data-discovery-tts")) return;
      if (!SHOW_AUDIO_CONTROLS && !btn.hasAttribute("data-discovery-tts")) return;

      if (btn.hasAttribute("data-discovery-tts") && !stemFor(btn) && !btn.closest("article.inventions-entry")) {
        const current = currentDiscoveryEntry();
        if (current && current.id) {
          const pair = btn.closest(".tools-bar__views") || btn.parentElement;
          (pair ? pair.querySelectorAll("[data-story-tts], [data-discovery-tts]") : [btn]).forEach(
            (el) => el.setAttribute("data-story-stem", current.id)
          );
        }
      }

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

    main.querySelectorAll(".sitemap-block--discoveries .sitemap-block__heading a, .sitemap-block--discoveries h3").forEach((el) => {
      const next = visibleCatalogLabel(el.textContent);
      if (next) el.textContent = next;
    });
    main.querySelectorAll(".sitemap-block--stories .sitemap-links").forEach((list) => {
      const items = Array.from(list.children);
      items.sort((a, b) => compareCatalogTitles(a.textContent || "", b.textContent || ""));
      items.forEach((li) => list.appendChild(li));
    });

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
    let activeStem = "";

    const syncLightboxLabels = () => {
      if (!overlay) return;
      const dialog = overlay.querySelector(".text-lightbox__dialog");
      if (dialog) dialog.setAttribute("aria-label", tUi("lightbox_text", "Böyüdülmüş hekayə mətni"));
      if (closeBtn) closeBtn.setAttribute("aria-label", tUi("close", "Bağla"));
      const ttsWrap = overlay.querySelector(".text-lightbox__tts");
      if (ttsWrap) {
        const show = liveI18n().show_audio_controls !== false;
        ttsWrap.hidden = !show;
        if (show) ttsWrap.removeAttribute("hidden");
        else ttsWrap.setAttribute("hidden", "");
        const label = ttsWrap.querySelector(".tools-bar__label");
        const views = ttsWrap.querySelector(".tools-bar__views");
        const audio = tUi("story_audio_label", "Səsləndir");
        if (label) label.textContent = audio;
        if (views) views.setAttribute("aria-label", audio);
      }
      ttsBtns.forEach((el) => {
        const mode = el.getAttribute("data-tts-mode");
        if (mode === "stop") {
          el.title = tUi("stop", "Dayandır");
          el.setAttribute("aria-label", tUi("stop", "Dayandır"));
        } else {
          el.title = tUi("listen", "Mətni dinlə");
          el.setAttribute("aria-label", tUi("listen", "Mətni dinlə"));
        }
      });
    };

    const fillFromStory = (story, textEl) => {
      const titleNode =
        story.querySelector(".story__title, .card-title") || story.querySelector("h2");
      titleEl.textContent = titleNode ? titleNode.textContent.trim() : tUi("stories_nav", "Hekayə");
      bodyEl.innerHTML = textEl.innerHTML;
      activeStem = ((story.dataset.stem || story.id) || "").trim();
      ttsBtns.forEach((el) => {
        if (activeStem) el.setAttribute("data-story-stem", activeStem);
        else el.removeAttribute("data-story-stem");
        el.setAttribute("data-tts-state", "idle");
        const mode = el.getAttribute("data-tts-mode");
        el.setAttribute("aria-pressed", mode === "stop" ? "true" : "false");
      });
      if (ttsNote) {
        ttsNote.hidden = true;
        ttsNote.textContent = "";
      }
      refreshAzLexicon(bodyEl);
    };

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
          <div class="text-lightbox__tts">
            <div class="story__action-group">
              <span class="tools-bar__label">${tUi("story_audio_label", "Səsləndir")}</span>
              <div class="tools-bar__views" role="group" aria-label="${tUi("story_audio_label", "Səsləndir")}">
            <button type="button" class="story-tts tools-bar__view-btn tools-bar__view-btn--icon" data-story-tts data-lightbox-tts data-tts-mode="listen" aria-pressed="false" title="${tUi("listen", "Mətni dinlə")}" aria-label="${tUi("listen", "Mətni dinlə")}">
              ${STORY_ICONS.listen}
            </button>
            <button type="button" class="story-tts tools-bar__view-btn tools-bar__view-btn--icon" data-story-tts data-lightbox-tts data-tts-mode="stop" aria-pressed="true" title="${tUi("stop", "Dayandır")}" aria-label="${tUi("stop", "Dayandır")}">
              ${STORY_ICONS.stop}
            </button>
              </div>
            </div>
            <p class="story-tts__note" data-story-tts-note hidden></p>
          </div>
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
        if (Date.now() < (window.__birinciIgnoreModalBackdropUntil || 0)) return;
        if (event.target === overlay) close();
      });
      if (closeBtn) closeBtn.addEventListener("click", close);
      syncLightboxLabels();
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
      if (typeof window.__birinciStopStoryTts === "function") window.__birinciStopStoryTts();
      overlay.hidden = true;
      overlay.setAttribute("hidden", "");
      document.body.classList.remove("text-lightbox-open");
      if (titleEl) titleEl.textContent = "";
      if (bodyEl) bodyEl.innerHTML = "";
      activeStem = "";
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
      prefetchModalLangPacks();
      fillFromStory(story, textEl);
      syncLightboxLabels();
      const stem = activeStem;
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

    window.__birinciRefreshTextLightbox = (doc) => {
      if (!overlay || overlay.hidden || !activeStem) return;
      overlay.hidden = false;
      overlay.removeAttribute("hidden");
      document.body.classList.add("text-lightbox-open");
      const liveStory =
        document.getElementById(activeStem) ||
        document.querySelector('article.story[data-stem="' + activeStem + '"]');
      const fetched =
        doc &&
        (doc.getElementById(activeStem) ||
          doc.querySelector('article.story[data-stem="' + activeStem + '"]'));
      if (fetched && liveStory && fetched !== liveStory) {
        const fromTitle = fetched.querySelector(".story__title, .card-title, h2");
        const toTitle = liveStory.querySelector(".story__title, .card-title, h2");
        if (fromTitle && toTitle) toTitle.textContent = fromTitle.textContent;
        const fromText = fetched.querySelector(".story__text, .card-text");
        const toText = liveStory.querySelector(".story__text, .card-text");
        if (fromText && toText) toText.innerHTML = fromText.innerHTML;
        const title = fetched.getAttribute("data-title");
        if (title) liveStory.setAttribute("data-title", title);
        const audio = fetched.getAttribute("data-audio");
        if (audio) liveStory.setAttribute("data-audio", audio);
        else liveStory.removeAttribute("data-audio");
      }
      const story = fetched || liveStory;
      const textEl = story && story.querySelector(".story__text, .story .card-text");
      if (story && textEl) fillFromStory(story, textEl);
      syncLightboxLabels();
    };

    document.addEventListener("click", (event) => {
      if (document.body.classList.contains("dev-story-edit")) return;
      if (event.target.closest("a.story-multilingual-btn, [data-story-multilingual]")) return;
      if (event.target.closest("[contenteditable='true'], [contenteditable='']")) return;
      if (event.target.closest("button, a, input, select, textarea, label, .story__actions")) return;
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
    const setFigureState = (story, visible, opts = {}) => {
      if (!story) return false;
      if (!visible) {
        if (!isStoryTextVisible(story)) {
          if (opts.ensureOther) {
            story.classList.remove("story--text-hidden");
            setStoryModePressed(story, "data-texts-mode", true);
          } else {
            syncStoryMediaGuards(story);
            return false;
          }
        }
      }
      story.classList.toggle("story--figure-hidden", !visible);
      setStoryModePressed(story, "data-images-mode", visible);
      syncStoryMediaGuards(story);
      return true;
    };

    const setAllFigures = (visible) => {
      document.querySelectorAll("article.story").forEach((story) => {
        setFigureState(story, visible, { ensureOther: !visible });
      });
      syncAllStoryMediaGuards();
    };

    window.__birinciSetStoryFigure = setFigureState;
    window.__birinciSetAllStoryFigures = setAllFigures;
    window.__birinciSyncStoryMediaGuards = syncAllStoryMediaGuards;

    document.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-images-mode]");
      if (!btn || btn.closest("[data-tools]") || btn.disabled) return;
      const story = btn.closest("article.story");
      if (!story) return;
      event.preventDefault();
      setFigureState(story, btn.getAttribute("data-images-mode") === "show");
    });

    const imagesCollapsed =
      document.body.classList.contains("images-collapsed") ||
      resolveInitialMediaCollapsed().imagesCollapsed;
    if (imagesCollapsed) document.body.classList.add("images-collapsed");
    setAllFigures(!imagesCollapsed);
  };

  const initStoryTextToggle = () => {
    const setTextState = (story, visible, opts = {}) => {
      if (!story) return false;
      if (!visible) {
        if (!storyHasImageControls(story)) {
          syncStoryMediaGuards(story);
          return false;
        }
        if (!isStoryFigureVisible(story)) {
          if (opts.ensureOther) {
            story.classList.remove("story--figure-hidden");
            setStoryModePressed(story, "data-images-mode", true);
          } else {
            syncStoryMediaGuards(story);
            return false;
          }
        }
      }
      story.classList.toggle("story--text-hidden", !visible);
      setStoryModePressed(story, "data-texts-mode", visible);
      syncStoryMediaGuards(story);
      return true;
    };

    const setAllTexts = (visible) => {
      document.querySelectorAll("article.story").forEach((story) => {
        setTextState(story, visible, { ensureOther: !visible });
      });
      syncAllStoryMediaGuards();
    };

    window.__birinciSetStoryText = setTextState;
    window.__birinciSetAllStoryTexts = setAllTexts;

    document.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-texts-mode]");
      if (!btn || btn.closest("[data-tools]") || btn.disabled) return;
      const story = btn.closest("article.story");
      if (!story) return;
      event.preventDefault();
      setTextState(story, btn.getAttribute("data-texts-mode") === "show");
    });

    const textsCollapsed =
      document.body.classList.contains("texts-collapsed") ||
      resolveInitialMediaCollapsed().textsCollapsed;
    if (textsCollapsed && document.body.classList.contains("images-collapsed")) {
      document.body.classList.remove("texts-collapsed");
      setAllTexts(true);
    } else {
      if (textsCollapsed) document.body.classList.add("texts-collapsed");
      setAllTexts(!textsCollapsed);
    }
    syncAllStoryMediaGuards();
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
      images_collapsed: readImagesCollapsedPref(),
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
    syncToolsBarTooltips();
  } catch (err) {
    console.error("syncToolsBarTooltips failed", err);
  }
  try {
    hideAudioChrome();
  } catch (err) {
    console.error("hideAudioChrome failed", err);
  }
  try {
    ensurePageListenButtons();
    ensureStoryListenButtons();
  } catch (err) {
    console.error("ensureAudioControls failed", err);
  }
  try {
    initStoryTts();
  } catch (err) {
    console.error("initStoryTts failed", err);
  }
  const initDevStoryEditor = () => {
    const host = (location.hostname || "").toLowerCase();
    const isLocal =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "[::1]" ||
      host === "::1";
    if (!isLocal) return;

    const API = "http://127.0.0.1:8768";
    const force =
      /(?:^|[?&])edit=1(?:&|$)/.test(location.search) ||
      localStorage.getItem("birinci-dev-story-edit") === "1";

    const pageLang = () =>
      (
        (document.body && document.body.getAttribute("data-lang")) ||
        document.documentElement.getAttribute("data-kt-lang") ||
        document.documentElement.lang ||
        "az"
      )
        .toLowerCase()
        .slice(0, 2);

    const panel = document.createElement("aside");
    panel.className = "dev-story-edit-panel";
    panel.hidden = true;
    panel.innerHTML = `
      <p class="dev-story-edit-panel__title">Dev story edit</p>
      <div class="dev-story-edit-panel__row">
        <button type="button" data-dev-edit-toggle aria-pressed="false">Edit off</button>
        <button type="button" data-dev-edit-save-focused disabled>Save story</button>
      </div>
      <p class="dev-story-edit-panel__status" data-dev-edit-status>Checking local API…</p>
    `;
    document.body.appendChild(panel);

    const toggleBtn = panel.querySelector("[data-dev-edit-toggle]");
    const saveBtn = panel.querySelector("[data-dev-edit-save-focused]");
    const statusEl = panel.querySelector("[data-dev-edit-status]");
    let apiReady = false;
    let editOn = false;
    let activeStory = null;

    const setStatus = (msg, kind) => {
      if (!statusEl) return;
      statusEl.textContent = msg || "";
      statusEl.classList.toggle("is-error", kind === "error");
      statusEl.classList.toggle("is-ok", kind === "ok");
    };

    const storyEls = () => Array.from(document.querySelectorAll("article.story[data-stem], article.story[id]"));

    const readStory = (story) => {
      const stem = story.getAttribute("data-stem") || story.id || "";
      const titleEl = story.querySelector(".story__title, .card-title, h2");
      const textEl = story.querySelector(".story__text, .card-text");
      if (!stem || !titleEl || !textEl) return null;
      const nameEl = titleEl.querySelector(".inventions-entry-name");
      const title = ((nameEl || titleEl).textContent || "").replace(/\s+/g, " ").trim();
      const moralEl = textEl.querySelector(".story__moral");
      const sourceEl = textEl.querySelector(".story__source");
      const body = Array.from(textEl.querySelectorAll("p"))
        .filter((p) => p !== moralEl && p !== sourceEl)
        .map((p) => (p.textContent || "").replace(/\s+/g, " ").trim())
        .filter(Boolean);
      const moral = ((moralEl && moralEl.textContent) || "").replace(/\s+/g, " ").trim();
      return { stem, title, body, moral, titleEl, textEl, moralEl };
    };

    const markEditable = (on) => {
      storyEls().forEach((story) => {
        const data = readStory(story);
        if (!data) return;
        data.titleEl.contentEditable = on ? "true" : "false";
        data.titleEl.spellcheck = true;
        Array.from(data.textEl.querySelectorAll("p")).forEach((p) => {
          if (p.classList.contains("story__source")) {
            p.contentEditable = "false";
            return;
          }
          p.contentEditable = on ? "true" : "false";
          p.spellcheck = true;
        });
        let save = story.querySelector("[data-dev-story-save]");
        if (on) {
          if (!save) {
            const actions = story.querySelector(".story__actions");
            save = document.createElement("button");
            save.type = "button";
            save.className = "tools-bar__view-btn story__dev-save";
            save.setAttribute("data-dev-story-save", "1");
            save.textContent = "Save";
            save.title = "Save title, body, and moral to DOCX + site files";
            if (actions) actions.appendChild(save);
            else story.querySelector(".card-header")?.appendChild(save);
          }
        } else if (save) {
          save.remove();
        }
      });
    };

    const setEditMode = (on) => {
      editOn = !!on && apiReady;
      document.body.classList.toggle("dev-story-edit", editOn);
      if (toggleBtn) {
        toggleBtn.setAttribute("aria-pressed", editOn ? "true" : "false");
        toggleBtn.textContent = editOn ? "Edit on" : "Edit off";
      }
      if (saveBtn) saveBtn.disabled = !editOn;
      markEditable(editOn);
      localStorage.setItem("birinci-dev-story-edit", editOn ? "1" : "0");
      // Multilingual View is independent of Edit mode — keep buttons present either way.
      if (typeof window.__birinciRefreshStoryLangSwitchers === "function") {
        window.__birinciRefreshStoryLangSwitchers();
      }
      setStatus(
        editOn
          ? "Click a story title or paragraph, then Save. Writes DOCX + HTML + catalog."
          : apiReady
            ? "API ready. Turn Edit on to change stories."
            : "Start: python tools/dev_story_edit_server.py",
        apiReady ? "ok" : "error"
      );
    };

    const saveStory = async (story) => {
      const data = readStory(story);
      if (!data) {
        setStatus("Could not read story fields.", "error");
        return;
      }
      if (!data.moral) {
        setStatus("Moral paragraph missing (needs Moral:/İbrət:/Мораль:/Сабак:).", "error");
        return;
      }
      setStatus(`Saving ${data.stem}…`);
      try {
        const res = await fetch(`${API}/api/dev/save-story`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lang: pageLang(),
            stem: data.stem,
            title: data.title,
            body: data.body,
            moral: data.moral,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) {
          throw new Error((json && json.error) || res.statusText || "save failed");
        }
        story.setAttribute("data-title", data.title);
        const card = document.querySelector(
          `a.cat-card[href="#${CSS.escape(data.stem)}"], a.cat-card[data-stem="${CSS.escape(data.stem)}"]`
        );
        if (card) {
          card.setAttribute("data-title", data.title);
          card.setAttribute("data-blurb", data.body[0] || data.title);
          const cardTitle = card.querySelector(".card-title");
          const cardDesc = card.querySelector(".card-desc");
          if (cardTitle) cardTitle.textContent = data.title;
          if (cardDesc) cardDesc.textContent = data.body[0] || data.title;
        }
        const toc = document.querySelector(`li[data-stem="${CSS.escape(data.stem)}"] a`);
        if (toc) toc.textContent = data.title;
        if (window.__BIRINCI_STORIES__) {
          (window.__BIRINCI_STORIES__.categories || []).forEach((cat) => {
            (cat.stories || []).forEach((row) => {
              if (row.stem === data.stem) {
                row.title = data.title;
                row.paragraphs = data.body.concat([
                  data.moral,
                  (row.paragraphs && row.paragraphs[row.paragraphs.length - 1]) || "",
                ]);
              }
            });
          });
        }
        setStatus(`Saved ${data.stem} → ${json.docx}`, "ok");
      } catch (err) {
        setStatus(String((err && err.message) || err), "error");
      }
    };

    panel.addEventListener("click", (event) => {
      const t = event.target;
      if (t.closest("[data-dev-edit-toggle]")) {
        setEditMode(!editOn);
        return;
      }
      if (t.closest("[data-dev-edit-save-focused]")) {
        const story =
          activeStory ||
          (document.activeElement && document.activeElement.closest("article.story"));
        if (story) saveStory(story);
        else setStatus("Focus a story field first.", "error");
      }
    });

    document.addEventListener("click", (event) => {
      const save = event.target.closest("[data-dev-story-save]");
      if (!save) return;
      event.preventDefault();
      event.stopPropagation();
      const story = save.closest("article.story");
      if (story) saveStory(story);
    });

    document.addEventListener("focusin", (event) => {
      const story = event.target.closest && event.target.closest("article.story");
      if (story) activeStory = story;
    });

    document.addEventListener("keydown", (event) => {
      if (!editOn) return;
      if ((event.ctrlKey || event.metaKey) && String(event.key).toLowerCase() === "s") {
        const story =
          (document.activeElement && document.activeElement.closest("article.story")) ||
          activeStory;
        if (!story) return;
        event.preventDefault();
        saveStory(story);
      }
    });

    const ping = () =>
      fetch(`${API}/api/dev/ping`, { method: "GET" })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then(() => {
          apiReady = true;
          panel.hidden = false;
          setEditMode(force || localStorage.getItem("birinci-dev-story-edit") === "1");
        })
        .catch(() => {
          apiReady = false;
          panel.hidden = false;
          setEditMode(false);
          setStatus("Edit API offline. Run: python tools/dev_story_edit_server.py", "error");
        });

    ping();
    // Re-apply editable flags when home list re-renders stories.
    const root = document.getElementById("stories-list") || document.querySelector("main");
    if (root && typeof MutationObserver === "function") {
      let timer = 0;
      const obs = new MutationObserver(() => {
        if (!editOn) return;
        window.clearTimeout(timer);
        timer = window.setTimeout(() => markEditable(true), 80);
      });
      obs.observe(root, { childList: true, subtree: true });
    }
  };

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
    initDevStoryEditor();
  } catch (err) {
    console.error("initDevStoryEditor failed", err);
  }

  document.querySelectorAll(".category-layout, .charter-layout.stories-layout").forEach((layout) => {
    try {
      bindStorySidebarLayout(layout);
    } catch (err) {
      console.error("bindStorySidebarLayout failed", err);
    }
  });
})();
