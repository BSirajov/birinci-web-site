(function () {
  "use strict";

  (function loadTtsProxyIfNeeded() {
    if (window.BirinciTtsProxy) return;
    var cur = document.currentScript;
    if (!cur || !cur.src) return;
    var src = cur.src.replace(/inventions\/kt-inventions\.js[^/]*$/i, "tts-proxy.js");
    if (src === cur.src) return;
    var tag = document.createElement("script");
    tag.src = src;
    tag.defer = true;
    document.head.appendChild(tag);
  })();

  var widget = document.getElementById("inventionsArticlesWidget");

  function isDiscoveriesPage() {
    return (
      (document.documentElement.getAttribute("data-kt-page-id") || "") ===
      "discoveries-and-inventions"
    );
  }

  function pageCatalogLocale() {
    return (
      (document.body && document.body.getAttribute("data-lang")) ||
      document.documentElement.getAttribute("data-kt-lang") ||
      document.documentElement.lang ||
      "en"
    )
      .toLowerCase()
      .slice(0, 2);
  }

  function discoveriesTitleCollator() {
    try {
      return new Intl.Collator(pageCatalogLocale(), {
        sensitivity: "base",
        numeric: true,
      });
    } catch (_) {
      return new Intl.Collator("en", { sensitivity: "base", numeric: true });
    }
  }

  function discoveriesEntryName(entry) {
    if (!entry) return "";
    var nameEl = entry.querySelector(".inventions-entry-name");
    if (nameEl && nameEl.textContent) return nameEl.textContent.trim();
    if (entry.getAttribute("data-title")) {
      return String(entry.getAttribute("data-title") || "").trim();
    }
    return String(entry.id || "").replace(/-/g, " ");
  }

  function discoveriesCategoryPrefix(cat) {
    if (!cat) return "";
    var fromData = String(cat.getAttribute("data-category") || "").match(/^(\d+)/);
    if (fromData) return fromData[1];
    var head = cat.querySelector(".inventions-category-head");
    var fromHead = head && String(head.textContent || "").match(/^(\d+)/);
    return fromHead ? fromHead[1] : "";
  }

  function sortDiscoveriesArticlesAlphabetically() {
    if (!isDiscoveriesPage()) return;
    var collator = discoveriesTitleCollator();
    Array.prototype.forEach.call(
      document.querySelectorAll(".inventions-category"),
      function (cat) {
        var articles = Array.prototype.slice.call(
          cat.querySelectorAll(":scope > .inventions-entry")
        );
        if (articles.length < 2) return;
        articles.sort(function (a, b) {
          return collator.compare(discoveriesEntryName(a), discoveriesEntryName(b));
        });
        var prefix = discoveriesCategoryPrefix(cat);
        articles.forEach(function (entry, index) {
          cat.appendChild(entry);
          var numEl = entry.querySelector(".inventions-entry-num");
          if (numEl && prefix) numEl.textContent = prefix + "." + (index + 1);
        });
      }
    );
  }

  function sortDiscoveriesTocAlphabetically() {
    if (!isDiscoveriesPage()) return;
    var list = document.getElementById("inventionsTocList");
    if (!list) return;
    var collator = discoveriesTitleCollator();

    function tocLabel(li) {
      var link = li.querySelector("a");
      return link && link.textContent ? link.textContent.trim() : "";
    }

    function renumberBucket(bucket, prefix) {
      bucket.forEach(function (li, index) {
        var tl = li.querySelector(".tl-date");
        if (tl && prefix) tl.textContent = prefix + "." + (index + 1);
      });
    }

    // Already grouped by sidebar enhancer.
    var groups = list.querySelectorAll(".toc-group[data-toc-cat]");
    if (groups.length) {
      Array.prototype.forEach.call(groups, function (group) {
        var body =
          group.querySelector(".toc-group__list") ||
          group.querySelector(".toc-group__body");
        if (!body) return;
        var bucket = Array.prototype.slice.call(
          body.querySelectorAll(":scope > .inventions-toc-entry, :scope > li.inventions-toc-entry")
        );
        if (!bucket.length) {
          bucket = Array.prototype.slice.call(body.children).filter(function (li) {
            return (
              li.classList.contains("inventions-toc-entry") ||
              li.getAttribute("data-toc-entry")
            );
          });
        }
        if (bucket.length < 2) return;
        bucket.sort(function (a, b) {
          return collator.compare(tocLabel(a), tocLabel(b));
        });
        var dateEl = group.querySelector(".toc-group__head .tl-date, .tl-date");
        var prefixMatch = dateEl && String(dateEl.textContent || "").match(/(\d+)/);
        var prefix = prefixMatch ? prefixMatch[1] : "";
        bucket.forEach(function (li) {
          body.appendChild(li);
        });
        renumberBucket(bucket, prefix);
      });
      return;
    }

    // Flat TOC list (pre-enhance).
    var children = Array.prototype.slice.call(list.children);
    var ordered = [];
    var i = 0;
    while (i < children.length) {
      var item = children[i];
      if (item.classList.contains("inventions-toc-cat-row")) {
        ordered.push(item);
        i += 1;
        var catId = item.getAttribute("data-toc-cat") || "";
        var bucket = [];
        while (
          i < children.length &&
          children[i].classList.contains("inventions-toc-entry") &&
          (children[i].getAttribute("data-toc-cat") || "") === catId
        ) {
          bucket.push(children[i]);
          i += 1;
        }
        bucket.sort(function (a, b) {
          return collator.compare(tocLabel(a), tocLabel(b));
        });
        var catDate = item.querySelector(".tl-date");
        var catPrefixMatch =
          catDate && String(catDate.textContent || "").match(/(\d+)/);
        var catPrefix = catPrefixMatch ? catPrefixMatch[1] : "";
        renumberBucket(bucket, catPrefix);
        Array.prototype.push.apply(ordered, bucket);
      } else {
        ordered.push(item);
        i += 1;
      }
    }
    ordered.forEach(function (el) {
      list.appendChild(el);
    });
  }

  sortDiscoveriesArticlesAlphabetically();
  sortDiscoveriesTocAlphabetically();

  if (window.KT_SIDEBAR_TOC_GROUPS) {
    window.KT_SIDEBAR_TOC_GROUPS.enhance();
    if (widget) {
      window.KT_SIDEBAR_TOC_GROUPS.bindPanelControls(widget);
    }
  }

  var rawHash = (window.location.hash || "").replace(/^#/, "");
  var hasSectionHash = !!(
    rawHash &&
    rawHash !== "main" &&
    rawHash !== "top" &&
    rawHash !== "about-hero-title" &&
    document.getElementById(rawHash)
  );

  var searchInput = document.getElementById("inventionsSearch");
  var filterCategory = document.getElementById("filterCategory");
  var filterPeriod = document.getElementById("filterPeriod");
  var catalogToolbar = document.querySelector(
    ".tools-bar--inventions, .toolbar.catalog-toolbar"
  );
  var inventionsListState = {
    bound: false,
  };
  var entries = Array.prototype.slice.call(document.querySelectorAll(".inventions-entry"));
  var categories = Array.prototype.slice.call(document.querySelectorAll(".inventions-category"));
  var widgetBody = widget ? widget.querySelector(".widget-body") : null;
  var tocEntries = Array.prototype.slice.call(
    document.querySelectorAll(".inventions-toc-entry")
  );
  var tocCats = Array.prototype.slice.call(
    document.querySelectorAll(".toc-group[data-toc-cat]")
  );
  var mobileMq = window.matchMedia("(max-width: 1060px)");

  function setMainCategoryExpanded(cat, expanded) {
    if (!cat) return;
    cat.classList.toggle("is-collapsed", !expanded);
    var toggle = cat.querySelector(".inventions-category-toggle");
    if (toggle) toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    if (cat.id) {
      var cards = document.querySelector(
        '.inventions-cards-category[data-cards-cat="' + cat.id + '"]'
      );
      if (cards) {
        cards.classList.toggle("is-collapsed", !expanded);
        var cardToggle = cards.querySelector(".inventions-category-toggle");
        if (cardToggle) cardToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
      }
    }
  }

  function syncCategoryPair(catId, expanded) {
    if (!catId) return;
    var group = document.querySelector('.toc-group[data-toc-cat="' + catId + '"]');
    if (group && window.KT_SIDEBAR_TOC_GROUPS && window.KT_SIDEBAR_TOC_GROUPS.setGroupExpanded) {
      window.KT_SIDEBAR_TOC_GROUPS.setGroupExpanded(group, expanded);
      if (widget && window.KT_SIDEBAR_TOC_GROUPS.refreshArticlesSidebarButtons) {
        window.KT_SIDEBAR_TOC_GROUPS.refreshArticlesSidebarButtons(widget);
      }
      return;
    }
    setMainCategoryExpanded(document.getElementById(catId), expanded);
  }

  function visibleCatalogLabel(text) {
    return String(text || "").replace(/^(?:§\s*)?\d+(?:\.\d+)*\.?\s+/, "").trim();
  }

  function categoryTitleWithCount(title, count) {
    var base = visibleCatalogLabel(String(title || "").replace(/\s*\(\d+\)\s*$/, ""));
    var n = Number(count);
    if (!base || !isFinite(n) || n < 0) return base;
    return base + " (" + Math.floor(n) + ")";
  }

  function setHeadingCountText(el, count) {
    if (!el) return;
    var btn = el.querySelector(".inventions-category-toggle");
    var text = "";
    var node = el.firstChild;
    while (node) {
      if (node.nodeType === 3) text += node.textContent;
      node = node.nextSibling;
    }
    text = text.replace(/\s+/g, " ").trim();
    if (!text) text = String(el.textContent || "").replace(/\s+/g, " ").trim();
    var next = categoryTitleWithCount(text, count);
    if (btn) {
      el.textContent = next;
      el.appendChild(btn);
      return;
    }
    el.textContent = next;
  }

  function setWidgetHeadCount(widget, count) {
    if (!widget) return;
    var title =
      widget.querySelector(".widget-head__title") || widget.querySelector(".widget-head > span");
    if (!title) return;
    var n = Math.floor(Number(count));
    if (!isFinite(n) || n < 0) return;
    var textNode = null;
    var node = title.firstChild;
    while (node) {
      if (node.nodeType === 3 && String(node.textContent || "").trim()) textNode = node;
      node = node.nextSibling;
    }
    if (!textNode) {
      title.appendChild(document.createTextNode(""));
      textNode = title.lastChild;
    }
    var base = String(textNode.textContent || "").replace(/\s*\(\d+\)\s*$/, "").replace(/\s+$/, "");
    textNode.textContent = base + " (" + n + ")";
  }

  function annotateDiscoveriesCategoryCounts() {
    Array.prototype.forEach.call(document.querySelectorAll(".inventions-category"), function (cat) {
      var count = cat.querySelectorAll(
        ".inventions-entry:not(.is-hidden)"
      ).length;
      setHeadingCountText(cat.querySelector(".inventions-category-head"), count);
      if (!cat.id) return;
      var tocLink = document.querySelector(
        '.toc-group[data-toc-cat="' + cat.id + '"] .toc-group__head > a'
      );
      if (tocLink) tocLink.textContent = categoryTitleWithCount(tocLink.textContent, count);
      var cardHead = document.querySelector(
        '.inventions-cards-category[data-cards-cat="' + cat.id + '"] .inventions-cards-head'
      );
      if (cardHead) setHeadingCountText(cardHead, count);
    });
    var widget =
      document.getElementById("inventionsArticlesWidget") ||
      document.querySelector(".charter-sidebar .sidebar-widget");
    setWidgetHeadCount(
      widget,
      document.querySelectorAll(
        ".inventions-layout .inventions-entry:not(.is-hidden)"
      ).length
    );
  }

  function enhanceMainCategoryToggles() {
    annotateDiscoveriesCategoryCounts();
    categories.forEach(function (cat) {
      if (cat.getAttribute("data-kt-cat-toggle")) return;
      cat.setAttribute("data-kt-cat-toggle", "1");
      var head = cat.querySelector(".inventions-category-head");
      if (!head) return;

      head.classList.add("inventions-category-head--collapsible");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "inventions-category-toggle";
      btn.setAttribute("aria-expanded", cat.classList.contains("is-collapsed") ? "false" : "true");
      btn.setAttribute(
        "aria-label",
        "Toggle " + (head.textContent || "category").replace(/\s+/g, " ").trim()
      );
      var chevron = document.createElement("span");
      chevron.className = "inventions-category-toggle__chevron";
      chevron.setAttribute("aria-hidden", "true");
      btn.appendChild(chevron);
      head.appendChild(btn);

      var togglePair = function () {
        var next = cat.classList.contains("is-collapsed");
        syncCategoryPair(cat.id, next);
      };

      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        togglePair();
      });

      head.addEventListener("click", function (e) {
        if (e.target.closest("a, button")) return;
        togglePair();
      });
    });

    if (window.KT_SIDEBAR_TOC_GROUPS && window.KT_SIDEBAR_TOC_GROUPS.syncAllMainCategoriesFromToc) {
      window.KT_SIDEBAR_TOC_GROUPS.syncAllMainCategoriesFromToc();
    }
  }

  enhanceMainCategoryToggles();

  var navLinks = widget
    ? Array.prototype.slice.call(
        widget.querySelectorAll('.timeline-list a[href^="#"]')
      )
    : [];
  var linkById = {};
  var sections = [];

  navLinks.forEach(function (a) {
    var id = a.getAttribute("href").slice(1);
    if (!id) return;
    linkById[id] = a;
    var el = document.getElementById(id);
    if (el) sections.push(el);
  });

  sections.sort(function (a, b) {
    if (a === b) return 0;
    return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  });

  var programmaticLock = false;
  var lockTimer = null;
  var scrollTick = false;
  var lastActiveId = "";

  function normalize(text) {
    return (text || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function inferPeriodSlug(text, slug) {
    var hp = window.KT_HISTORICAL_PERIODS;
    if (hp) return hp.inferPeriodSlug(text, null, slug);
    return "modern";
  }

  function categoryNumberFromTitle(title) {
    var m = String(title || "").match(/^(\d+)/);
    return m ? m[1] : "";
  }

  function stripVisibleCatalogNumbers() {
    document.querySelectorAll("#filterCategory option").forEach(function (opt) {
      if (!opt.value) return;
      var next = visibleCatalogLabel(opt.textContent);
      if (next) opt.textContent = next;
    });
    document.querySelectorAll(".inventions-category-head, .inventions-cards-head").forEach(function (head) {
      var btn = head.querySelector(".inventions-category-toggle");
      var text = "";
      var node = head.firstChild;
      while (node) {
        if (node.nodeType === 3) text += node.textContent;
        node = node.nextSibling;
      }
      text = visibleCatalogLabel(text.replace(/\s+/g, " "));
      if (!text) text = visibleCatalogLabel(head.textContent);
      if (!text) return;
      if (btn) {
        head.textContent = text;
        head.appendChild(btn);
      } else {
        head.textContent = text;
      }
    });
    document.querySelectorAll(".inventions-toc-cat-row > a, .toc-group[data-toc-cat] > .toc-group__head > a").forEach(function (link) {
      var next = visibleCatalogLabel(link.textContent);
      if (next) link.textContent = next;
    });
  }

  function enrichEntryMetadata() {
    stripVisibleCatalogNumbers();
    categories.forEach(function (cat) {
      var num = categoryNumberFromTitle(cat.getAttribute("data-category"));
      if (num) cat.setAttribute("data-category", num);
    });

    entries.forEach(function (entry) {
      var cat = entry.closest(".inventions-category");
      if (cat && !entry.getAttribute("data-category")) {
        entry.setAttribute("data-category", cat.getAttribute("data-category") || "");
      }
      var meta = entry.querySelector(".inventions-entry-meta");
        var blob = [
          entry.getAttribute("data-search") || "",
          meta ? meta.textContent : "",
        ].join(" ");
        entry.setAttribute("data-period", inferPeriodSlug(blob, entry.id || ""));
    });

    tocEntries.forEach(function (item) {
      var slug = item.getAttribute("data-toc-entry");
      var entry = slug ? document.getElementById(slug) : null;
      if (!entry) return;
      if (!item.getAttribute("data-category")) {
        item.setAttribute("data-category", entry.getAttribute("data-category") || "");
      }
      if (!item.getAttribute("data-period")) {
        item.setAttribute("data-period", entry.getAttribute("data-period") || "");
      }
    });
  }

  function stickyScrollOffset() {
    // Prefer live sticky chrome (header + breadcrumbs) — matches --sticky-stack-bottom.
    var headerEl = document.querySelector(".site-header");
    var crumbsEl = document.querySelector(".breadcrumbs");
    var stack = 0;
    if (headerEl) stack = Math.max(stack, headerEl.getBoundingClientRect().bottom);
    if (crumbsEl) stack = Math.max(stack, crumbsEl.getBoundingClientRect().bottom);
    if (stack <= 0) {
      var root = document.documentElement;
      var style = window.getComputedStyle(root);
      var cssStack = parseFloat(style.getPropertyValue("--sticky-stack-bottom"));
      if (isFinite(cssStack) && cssStack > 0) {
        stack = cssStack;
      } else {
        var headerH = parseFloat(style.getPropertyValue("--header-h")) || 68;
        var crumbH = parseFloat(style.getPropertyValue("--breadcrumb-h")) || 43;
        stack = headerH + crumbH;
      }
    }
    var gap = parseFloat(
      window.getComputedStyle(document.documentElement).getPropertyValue("--kt-scroll-anchor-gap")
    );
    if (!isFinite(gap) || gap <= 0) gap = 16;
    return Math.ceil(stack) + gap;
  }

  function lockSpy(ms) {
    programmaticLock = true;
    clearTimeout(lockTimer);
    lockTimer = setTimeout(function () {
      programmaticLock = false;
      updateActiveFromScroll(true);
    }, ms || 900);
  }

  function activeFilterValues(id) {
    var mf = window.KT_CATALOG_MULTI_FILTER;
    if (mf) return mf.getActiveValues(id);
    var el = document.getElementById(id);
    return el && el.value ? [el.value] : [];
  }

  function updateFilterStyles() {
    ["filterCategory", "filterPeriod"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var wrap = el.closest(".sel-wrap");
      if (!wrap) return;
      var active = window.KT_CATALOG_MULTI_FILTER
        ? window.KT_CATALOG_MULTI_FILTER.isActive(id)
        : el.value !== "";
      wrap.classList.toggle("active", active);
    });
  }

  function syncToolbarFilterBadge() {
    if (catalogToolbar && catalogToolbar._ktSyncFilterBadge) {
      catalogToolbar._ktSyncFilterBadge();
    }
  }

  function filterIsActive(id) {
    var mf = window.KT_CATALOG_MULTI_FILTER;
    if (mf) return mf.isActive(id);
    var el = document.getElementById(id);
    return !!(el && el.value);
  }


  function clearInventionsCatalogFilters() {
    if (searchInput) searchInput.value = "";
    var mf = window.KT_CATALOG_MULTI_FILTER;
    if (mf && typeof mf.setActiveValues === "function") {
      mf.setActiveValues("filterCategory", [], { silent: true });
      mf.setActiveValues("filterPeriod", [], { silent: true });
    } else {
      if (filterCategory) filterCategory.value = "";
      if (filterPeriod) filterPeriod.value = "";
    }
  }

  window.__birinciClearInventionsCatalogFilters = function () {
    clearInventionsCatalogFilters();
    if (typeof applyFilters === "function") applyFilters({ resetWindow: true });
  };

  function itemMatches(el, q) {
    var mf = window.KT_CATALOG_MULTI_FILTER;
    if (mf) {
      if (!mf.passesFilter("filterCategory", el.getAttribute("data-category") || ""))
        return false;
      if (!mf.passesFilter("filterPeriod", el.getAttribute("data-period") || ""))
        return false;
    } else {
      if (
        filterCategory &&
        filterCategory.value &&
        el.getAttribute("data-category") !== filterCategory.value
      ) {
        return false;
      }
      if (
        filterPeriod &&
        filterPeriod.value &&
        el.getAttribute("data-period") !== filterPeriod.value
      ) {
        return false;
      }
    }
    var hay = normalize(el.getAttribute("data-search") || el.textContent);
    if (q && hay.indexOf(q) === -1) return false;
    return true;
  }

  function parseCsvParam(raw) {
    return String(raw || "")
      .split(",")
      .map(function (v) {
        return v.trim();
      })
      .filter(Boolean);
  }

  var applyingHistory = false;

  function writeInventionsUrlState(activeId) {
    if (applyingHistory) return;
    try {
      var url = new URL(window.location.href);
      var params = url.searchParams;
      var q = searchInput ? String(searchInput.value || "").trim() : "";
      if (q) params.set("q", q);
      else params.delete("q");

      var cats = activeFilterValues("filterCategory");
      if (cats.length) params.set("cat", cats.join(","));
      else params.delete("cat");

      var periods = activeFilterValues("filterPeriod");
      if (periods.length) params.set("period", periods.join(","));
      else params.delete("period");

      params.delete("start");
      params.delete("batch");

      var hashId = "";
      if (typeof activeId === "string" && activeId) {
        hashId = activeId;
      } else {
        try {
          hashId = decodeURIComponent((window.location.hash || "").replace(/^#/, ""));
        } catch (_) {
          hashId = (window.location.hash || "").replace(/^#/, "");
        }
      }
      if (
        hashId &&
        hashId !== "top" &&
        hashId !== "main" &&
        hashId !== "about-hero-title" &&
        document.getElementById(hashId)
      ) {
        url.hash = hashId;
      } else {
        url.hash = "";
      }
      var next = url.pathname + url.search + url.hash;
      var prevHash = window.location.hash || "";
      var nextHash = url.hash || "";
      if (typeof window.__birinciCommitHistoryHref === "function") {
        window.__birinciCommitHistoryHref(next, { replace: prevHash === nextHash });
      } else if (prevHash === nextHash) {
        history.replaceState(null, "", next);
      } else {
        history.pushState(null, "", next);
      }
    } catch (_) {}
  }

  function readInventionsUrlState() {
    var params = new URLSearchParams(window.location.search || "");
    return {
      q: String(params.get("q") || "").trim(),
      cat: parseCsvParam(params.get("cat")),
      period: parseCsvParam(params.get("period")),
    };
  }

  function applyInventionsUrlState(state) {
    if (!state) return;
    if (searchInput && state.q) searchInput.value = state.q;
    var mf = window.KT_CATALOG_MULTI_FILTER;
    if (mf && typeof mf.setActiveValues === "function") {
      if (state.cat.length) {
        mf.setActiveValues("filterCategory", state.cat, { silent: true });
      }
      if (state.period.length) {
        mf.setActiveValues("filterPeriod", state.period, { silent: true });
      }
    } else {
      if (filterCategory && state.cat.length === 1) filterCategory.value = state.cat[0];
      if (filterPeriod && state.period.length === 1) filterPeriod.value = state.period[0];
    }
  }

  function restoreScrollRatio(ratio, withinId) {
    var root = document.documentElement;
    var max = Math.max(
      0,
      (root.scrollHeight || document.body.scrollHeight) - window.innerHeight
    );
    var y = Math.round(Math.max(0, Math.min(1, ratio)) * max);
    if (withinId) {
      var section = document.getElementById(withinId);
      if (section) {
        var top =
          section.getBoundingClientRect().top +
          (window.pageYOffset || root.scrollTop || 0);
        var height = Math.max(section.offsetHeight || 0, 1);
        if (y < top - 40 || y > top + height) {
          y = Math.round(top - stickyScrollOffset());
        }
      }
    }
    window.scrollTo({ top: Math.max(0, y), left: 0, behavior: "auto" });
    updateActiveFromScroll(true);
  }

  function restoreLangContext() {
    var raw = "";
    try {
      raw = sessionStorage.getItem("birinci-lang-ctx") || "";
    } catch (_) {
      return;
    }
    if (!raw) return;
    var ctx = null;
    try {
      ctx = JSON.parse(raw);
    } catch (_) {
      ctx = null;
    }
    try {
      sessionStorage.removeItem("birinci-lang-ctx");
    } catch (_) {}
    if (!ctx || typeof ctx !== "object") return;

    clearInventionsCatalogFilters();
    if (typeof applyFilters === "function") applyFilters({ resetWindow: true });

    var targetId = "";
    try {
      targetId = decodeURIComponent((window.location.hash || "").replace(/^#/, ""));
    } catch (_) {
      targetId = (window.location.hash || "").replace(/^#/, "");
    }
    if (!targetId) targetId = ctx.sectionId || ctx.categoryId || "";

    var nextView = targetId ? "list" : ctx.view === "cards" ? "cards" : ctx.view === "list" ? "list" : "";
    if (nextView && typeof setInventionsView === "function") {
      try {
        setInventionsView(nextView);
      } catch (_) {}
    }

    if (!targetId || !document.getElementById(targetId)) return;
    setTimeout(function () {
      if (linkById && linkById[targetId]) scrollToSection(targetId);
      else jumpToTarget(targetId);
    }, 80);
  }

  function syncSearchChip(q, visibleCount) {
    var wrap = document.querySelector(".tools-bar--inventions .tools-bar__search");
    if (!wrap) return;
    var chip = wrap.querySelector("[data-search-filter]");
    var textEl = wrap.querySelector("[data-search-filter-text]");
    var raw = String(q || "").trim();
    var active = raw.length > 0;
    wrap.classList.toggle("tools-bar__search--active", active);
    if (!chip) return;
    if (!active) {
      chip.hidden = true;
      if (textEl) textEl.textContent = "";
      return;
    }
    chip.hidden = false;
    if (textEl) {
      var lang =
        document.documentElement.getAttribute("data-kt-lang") ||
        document.documentElement.lang ||
        "az";
      var label = lang.indexOf("en") === 0 ? "Search" : "Axtarış";
      var count =
        lang.indexOf("en") === 0
          ? visibleCount + " results"
          : visibleCount + " nəticə";
      textEl.textContent = label + ": " + raw + " · " + count;
    }
  }

  function tInvUi(key, fallback) {
    var ui = (window.__BIRINCI_I18N__ && window.__BIRINCI_I18N__.ui) || {};
    return ui[key] || fallback || key;
  }

  function inventionsListBar() {
    return document.querySelector('.tools-bar--inventions[data-tools="inventions"]');
  }

  function isInventionsListView() {
    return document.body.classList.contains("inventions-view-list");
  }

  function filteredInventionEntries() {
    return entries.filter(function (entry) {
      return !entry.classList.contains("is-hidden");
    });
  }

  function syncInventionsListOnly() {
    var show = isInventionsListView();
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-inventions-list-only]"),
      function (el) {
        el.hidden = !show;
        if (show) el.removeAttribute("hidden");
        else el.setAttribute("hidden", "");
      }
    );
  }

  function syncInventionsPlayVisibleUi() {
    var bar = inventionsListBar();
    if (!bar) return;
    var total = filteredInventionEntries().length;
    bar.querySelectorAll("[data-tools-play-visible]").forEach(function (btn) {
      btn.disabled = total === 0;
    });
    if (typeof window.__birinciSyncPlayVisibleUi === "function") {
      window.__birinciSyncPlayVisibleUi();
    }
  }

  function syncInventionsTocVisibility() {
    tocEntries.forEach(function (item) {
      var slug = item.getAttribute("data-toc-entry");
      var entry = slug ? document.getElementById(slug) : null;
      var hidden =
        !entry ||
        entry.classList.contains("is-hidden");
      item.classList.toggle("is-hidden", hidden);
    });
    tocCats.forEach(function (item) {
      var slug = item.getAttribute("data-toc-cat");
      var related = tocEntries.filter(function (e) {
        return e.getAttribute("data-toc-cat") === slug;
      });
      var anyVisible = related.some(function (e) {
        return !e.classList.contains("is-hidden");
      });
      item.classList.toggle("is-hidden", !anyVisible);
    });
    if (window.KT_SIDEBAR_TOC_GROUPS && widget) {
      window.KT_SIDEBAR_TOC_GROUPS.refreshArticlesSidebarButtons(widget);
    }
  }

  function applyInventionsListWindow() {
    syncInventionsListOnly();
    var visibleCount = 0;
    entries.forEach(function (entry) {
      if (!entry.classList.contains("is-hidden")) visibleCount += 1;
    });
    syncInventionsTocVisibility();
    annotateDiscoveriesCategoryCounts();
    syncInventionsPlayVisibleUi();
    setWidgetHeadCount(
      document.getElementById("inventionsArticlesWidget") ||
        document.querySelector(".charter-sidebar .sidebar-widget"),
      visibleCount
    );
    writeInventionsUrlState();
  }

  function revealInventionsEntry(id) {
    if (!id) return;
    applyInventionsListWindow();
  }

  function setInventionsEntryModePressed(entry, attr, visible) {
    if (!entry) return;
    Array.prototype.forEach.call(entry.querySelectorAll("[" + attr + "]"), function (btn) {
      var mode = btn.getAttribute(attr);
      btn.setAttribute("aria-pressed", (visible ? mode === "show" : mode === "hide") ? "true" : "false");
    });
  }

  function setInventionsEntryFigure(entry, visible) {
    if (!entry) return;
    entry.classList.toggle("inventions-entry--figure-hidden", !visible);
    setInventionsEntryModePressed(entry, "data-images-mode", visible);
  }

  function setInventionsEntryText(entry, visible) {
    if (!entry) return;
    entry.classList.toggle("inventions-entry--text-hidden", !visible);
    setInventionsEntryModePressed(entry, "data-texts-mode", visible);
  }

  function applyInventionsImagesState(collapsed) {
    document.body.classList.toggle("images-collapsed", collapsed);
    document.querySelectorAll("[data-images-mode]").forEach(function (btn) {
      if (!btn.closest(".tools-bar--inventions")) return;
      var mode = btn.getAttribute("data-images-mode");
      btn.setAttribute(
        "aria-pressed",
        (collapsed ? mode === "hide" : mode === "show") ? "true" : "false"
      );
    });
    entries.forEach(function (entry) {
      setInventionsEntryFigure(entry, !collapsed);
    });
    try {
      localStorage.setItem("birinci-images-collapsed", collapsed ? "1" : "0");
    } catch (_) {}
  }

  function applyInventionsTextsState(collapsed) {
    document.body.classList.toggle("texts-collapsed", collapsed);
    document.querySelectorAll("[data-texts-mode]").forEach(function (btn) {
      if (!btn.closest(".tools-bar--inventions")) return;
      var mode = btn.getAttribute("data-texts-mode");
      btn.setAttribute(
        "aria-pressed",
        (collapsed ? mode === "hide" : mode === "show") ? "true" : "false"
      );
    });
    entries.forEach(function (entry) {
      setInventionsEntryText(entry, !collapsed);
    });
    try {
      localStorage.setItem("birinci-texts-collapsed", collapsed ? "1" : "0");
    } catch (_) {}
  }

  function bindInventionsListTools() {
    if (!isDiscoveriesPage() || inventionsListState.bound) return;
    var bar = inventionsListBar();
    if (!bar) return;
    inventionsListState.bound = true;

    var imagesCollapsed = false;
    var textsCollapsed = false;
    try {
      imagesCollapsed = localStorage.getItem("birinci-images-collapsed") === "1";
      textsCollapsed = localStorage.getItem("birinci-texts-collapsed") === "1";
    } catch (_) {}
    applyInventionsImagesState(imagesCollapsed);
    applyInventionsTextsState(textsCollapsed);

    bar.querySelectorAll("[data-images-mode]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyInventionsImagesState(btn.getAttribute("data-images-mode") === "hide");
      });
    });
    bar.querySelectorAll("[data-texts-mode]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyInventionsTextsState(btn.getAttribute("data-texts-mode") === "hide");
      });
    });

    applyInventionsListWindow();
  }

  window.__birinciRefreshInventionsListTools = function () {
    if (!isDiscoveriesPage()) return;
    try {
      applyInventionsImagesState(
        localStorage.getItem("birinci-images-collapsed") === "1"
      );
      applyInventionsTextsState(localStorage.getItem("birinci-texts-collapsed") === "1");
    } catch (_) {}
    applyInventionsListWindow();
  };

  function applyFilters(options) {
    if (!searchInput) return;
    var q = normalize(searchInput.value);
    var filtering = !!(
      q ||
      filterIsActive("filterCategory") ||
      filterIsActive("filterPeriod")
    );

    entries.forEach(function (entry) {
      var match = itemMatches(entry, q);
      entry.classList.toggle("is-hidden", filtering && !match);
    });

    categories.forEach(function (cat) {
      var visible = cat.querySelectorAll(".inventions-entry:not(.is-hidden)").length;
      cat.classList.toggle("is-hidden", filtering && visible === 0);
      // Filtering should reveal matching articles even if the category was collapsed.
      if (filtering && visible > 0 && cat.classList.contains("is-collapsed") && cat.id) {
        syncCategoryPair(cat.id, true);
      }
    });

    var visibleCount = entries.filter(function (entry) {
      return !entry.classList.contains("is-hidden");
    }).length;
    syncSearchChip(searchInput.value, visibleCount);
    syncSearchFieldClear();
    syncCardVisibility();

    updateFilterStyles();
    syncToolbarFilterBadge();
    updateActiveFromScroll(true);
    writeInventionsUrlState();
    if (window.KT_SIDEBAR_TOC_GROUPS && widget) {
      window.KT_SIDEBAR_TOC_GROUPS.refreshArticlesSidebarButtons(widget);
    }
    var highlightRoot =
      document.querySelector(".inventions-page-body") ||
      document.getElementById("main") ||
      document.body;
    applyInventionsListWindow();
    var q = searchInput ? searchInput.value : "";
    var paint = function () {
      if (typeof window.__birinciRefreshAzLexicon === "function") {
        window.__birinciRefreshAzLexicon(highlightRoot);
      }
      if (typeof window.__birinciApplySearchHighlights === "function") {
        window.__birinciApplySearchHighlights(highlightRoot, q);
      }
    };
    // site.js / lexicon UI may load after this file (defer order); retry once if needed.
    if (
      typeof window.__birinciApplySearchHighlights === "function" ||
      typeof window.__birinciRefreshAzLexicon === "function"
    ) {
      paint();
    } else window.setTimeout(paint, 0);
  }

  function searchFieldClearLabel() {
    var ui = (window.__BIRINCI_I18N__ && window.__BIRINCI_I18N__.ui) || {};
    return ui.clear_search || ui.clear_search_filter || "Axtarışı təmizlə";
  }

  function getSearchFieldClearBtn() {
    if (!searchInput) return null;
    var field = searchInput.closest(".tools-bar__search-field") || searchInput.parentNode;
    if (!field) return null;
    var btn = field.querySelector("[data-search-field-clear]");
    if (btn) return btn;
    btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tools-bar__field-clear";
    btn.setAttribute("data-search-field-clear", "");
    btn.hidden = true;
    btn.textContent = "×";
    var label = searchFieldClearLabel();
    btn.title = label;
    btn.setAttribute("aria-label", label);
    field.appendChild(btn);
    return btn;
  }

  function syncSearchFieldClear() {
    var btn = getSearchFieldClearBtn();
    if (!btn) return;
    btn.hidden = !String(searchInput.value || "").length;
  }

  function clearActiveStates() {
    navLinks.forEach(function (l) {
      l.classList.remove("tl-active");
      l.removeAttribute("aria-current");
    });
    tocCats.forEach(function (row) {
      row.classList.remove("toc-active");
    });
  }

  function closeEventsMenu() {
    if (!widget) return;
    var toggle = widget.querySelector(".events-menu-toggle");
    widget.classList.remove("events-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  function toggleEventsMenu() {
    if (!widget) return;
    var toggle = widget.querySelector(".events-menu-toggle");
    var open = widget.classList.toggle("events-open");
    if (toggle) toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function scrollSidebarLinkIntoView(link) {
    if (!widgetBody || mobileMq.matches || !link) return;

    var row = link.closest("li") || link;
    var bodyRect = widgetBody.getBoundingClientRect();
    var rowRect = row.getBoundingClientRect();
    var pad = 10;

    if (rowRect.top < bodyRect.top + pad) {
      widgetBody.scrollTop += rowRect.top - bodyRect.top - pad;
    } else if (rowRect.bottom > bodyRect.bottom - pad) {
      widgetBody.scrollTop += rowRect.bottom - bodyRect.bottom + pad;
    }
  }

  function setActive(id, options) {
    options = options || {};
    var force = !!options.force;
    if (!id || (id === lastActiveId && !force)) {
      if (options.forceSidebarScroll && linkById[id]) {
        scrollSidebarLinkIntoView(linkById[id]);
      }
      return;
    }

    lastActiveId = id;
    clearActiveStates();

    var link = linkById[id];
    if (!link) return;

    link.classList.add("tl-active");
    link.setAttribute("aria-current", "true");

    var li = link.closest("li");
    // Discoveries: fold state is user-controlled only. Scroll-spy may
    // highlight the active item but must not unfold a collapsed category.
    if (li && window.KT_SIDEBAR_TOC_GROUPS && !isDiscoveriesPage()) {
      window.KT_SIDEBAR_TOC_GROUPS.expandGroupContaining(li);
    }

    if (li && li.classList.contains("inventions-toc-entry")) {
      var catSlug = li.getAttribute("data-toc-cat");
      if (catSlug) {
        var catGroup = widget.querySelector('.toc-group[data-toc-cat="' + catSlug + '"]');
        if (catGroup) catGroup.classList.add("toc-active");
      }
    }

    if (!options.skipSidebarScroll) {
      scrollSidebarLinkIntoView(link);
    }

    var section = document.getElementById(id);
    var title = "";
    if (section) {
      var nameEl = section.querySelector(".inventions-entry-name");
      var headEl = section.querySelector(".inventions-category-head");
      if (nameEl && nameEl.textContent) title = nameEl.textContent.trim();
      else if (headEl && headEl.textContent) title = headEl.textContent.trim();
      else if (section.getAttribute("data-title")) title = section.getAttribute("data-title").trim();
    }
    if (!title && link.textContent) title = link.textContent.trim();
    var crumbPayload = { id: id, title: title };
    if (typeof window.__birinciSetDeepCrumb === "function") {
      window.__birinciSetDeepCrumb(crumbPayload);
    } else {
      window.__birinciPendingDeepCrumb = crumbPayload;
    }
  }

  function isSectionVisible(section) {
    if (!section || section.offsetParent === null) return false;
    if (section.classList.contains("is-hidden")) return false;
    return true;
  }

  function pickActiveSection() {
    if (!sections.length) return null;

    var offset = stickyScrollOffset();
    var active = null;
    var i;

    for (i = 0; i < sections.length; i += 1) {
      var section = sections[i];
      if (!isSectionVisible(section)) continue;
      var sectionTop = section.getBoundingClientRect().top;
      if (sectionTop - offset <= 2) {
        active = section;
      } else if (active) {
        break;
      }
    }

    if (active) return active;

    for (i = 0; i < sections.length; i += 1) {
      if (isSectionVisible(sections[i])) return sections[i];
    }

    return null;
  }

  function updateActiveFromScroll(force) {
    if (programmaticLock && !force) return;

    var active = pickActiveSection();
    if (active && active.id) {
      setActive(active.id, { skipSidebarScroll: false });
    }
  }

  function resolveScrollTarget(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    if (el.classList.contains("inventions-entry")) {
      return el.querySelector(".inventions-entry-title") || el;
    }
    if (el.classList.contains("inventions-category")) {
      return el.querySelector(".inventions-category-head") || el;
    }
    return el.querySelector("h2, h1") || el;
  }

  function jumpToTarget(id) {
    var target = resolveScrollTarget(id);
    if (!target) return false;

    var Pos = window.KT_LANG_POSITION;
    if (Pos && Pos.scrollToAnchor) {
      return Pos.scrollToAnchor(id, false);
    }

    if (typeof window.__birinciSyncStickyChrome === "function") {
      window.__birinciSyncStickyChrome();
    }

    var align = function () {
      var el = resolveScrollTarget(id);
      if (!el) return;
      var root = document.documentElement;
      var prevBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      var offset = stickyScrollOffset();
      var y =
        el.getBoundingClientRect().top +
        (window.pageYOffset || root.scrollTop || 0) -
        offset;
      window.scrollTo(0, Math.max(0, Math.round(y)));
      // Second pass: deep breadcrumb / sticky heights can change after setActive.
      var topAfter = el.getBoundingClientRect().top;
      if (Math.abs(topAfter - offset) > 2) {
        window.scrollTo(
          0,
          Math.max(
            0,
            Math.round(
              el.getBoundingClientRect().top +
                (window.pageYOffset || root.scrollTop || 0) -
                stickyScrollOffset()
            )
          )
        );
      }
      root.style.scrollBehavior = prevBehavior;
    };

    align();
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(align);
    });
    return true;
  }

  function scrollToSection(id) {
    if (!id || !document.getElementById(id)) return false;

    revealInventionsEntry(id);
    lockSpy(480);
    setActive(id, { force: true, forceSidebarScroll: true });
    jumpToTarget(id);

    writeInventionsUrlState(id);

    if (mobileMq.matches) {
      closeEventsMenu();
    }

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        jumpToTarget(id);
        setActive(id, { force: true, forceSidebarScroll: true });
      });
    });
    return true;
  }
  window.__birinciScrollInventionsTo = scrollToSection;

  enrichEntryMetadata();

  applyInventionsUrlState(readInventionsUrlState());
  applyFilters();

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      applyFilters({ resetWindow: true });
    });
    var clearChip = document.querySelector(
      ".tools-bar--inventions [data-search-filter-clear]"
    );
    if (clearChip) {
      clearChip.addEventListener("click", function () {
        searchInput.value = "";
        applyFilters({ resetWindow: true });
        searchInput.focus();
      });
    }
    var fieldClear = getSearchFieldClearBtn();
    if (fieldClear && fieldClear.getAttribute("data-kt-field-clear") !== "1") {
      fieldClear.setAttribute("data-kt-field-clear", "1");
      fieldClear.addEventListener("click", function () {
        searchInput.value = "";
        applyFilters({ resetWindow: true });
        searchInput.focus();
      });
    }
    syncSearchFieldClear();
  }

  if (filterCategory) {
    filterCategory.addEventListener("change", function () {
      applyFilters({ resetWindow: true });
    });
  }

  if (filterPeriod) {
    filterPeriod.addEventListener("change", function () {
      applyFilters({ resetWindow: true });
    });
  }

  document.addEventListener("kt-catalog-filter-change", function () {
    applyFilters({ resetWindow: true });
  });

  window.addEventListener("popstate", function () {
    applyingHistory = true;
    try {
      var urlState = readInventionsUrlState();
      applyInventionsUrlState(urlState);
      applyFilters();
      var hash = "";
      try {
        hash = decodeURIComponent((window.location.hash || "").replace(/^#/, ""));
      } catch (_) {
        hash = (window.location.hash || "").replace(/^#/, "");
      }
      if (hash && document.getElementById(hash)) {
        jumpToTarget(hash);
        setActive(hash, { force: true, forceSidebarScroll: true });
      }
    } finally {
      applyingHistory = false;
    }
  });

  document.querySelectorAll(".sel-clear").forEach(function (btn) {
    if (window.KT_CATALOG_MULTI_FILTER || btn.getAttribute("data-kt-multi-clear") === "1") return;
    btn.addEventListener("click", function (event) {
      event.stopPropagation();
      var el = document.getElementById(btn.dataset.for);
      if (el) {
        el.value = "";
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
      applyFilters({ resetWindow: true });
    });
  });

  function inventionsUiLang() {
    return (
      (document.body && document.body.getAttribute("data-lang")) ||
      document.documentElement.getAttribute("data-kt-lang") ||
      document.documentElement.lang ||
      "az"
    ).toLowerCase();
  }

  function articleModalLabels() {
    var lang = inventionsUiLang();
    if (lang.indexOf("en") === 0) {
      return { close: "Close", dialog: "Article text", listen: "Listen", stop: "Stop" };
    }
    if (lang.indexOf("ru") === 0) {
      return { close: "Закрыть", dialog: "Текст статьи", listen: "Слушать", stop: "Стоп" };
    }
    if (lang.indexOf("ky") === 0) {
      return { close: "Жабуу", dialog: "Макала тексти", listen: "Угуу", stop: "Токтотуу" };
    }
    return { close: "Bağla", dialog: "Məqalə mətni", listen: "Dinlə", stop: "Dayandır" };
  }

  function articleModalSpeechLang() {
    var lang = inventionsUiLang();
    if (lang.indexOf("en") === 0) return { ui: "en", bcp: "en-US" };
    if (lang.indexOf("ru") === 0) return { ui: "ru", bcp: "ru-RU" };
    if (lang.indexOf("ky") === 0) return { ui: "ky", bcp: "ky-KG" };
    return { ui: "az", bcp: "az-AZ" };
  }

  function voiceBlob(voice) {
    if (!voice) return "";
    return ((voice.name || "") + " " + (voice.lang || "") + " " + (voice.voiceURI || "")).toLowerCase();
  }

  function voiceLooksFemale(voice) {
    return /female|woman|girl|zira|hazel|susan|samantha|victoria|moira|karen|tessa|fiona|veena|allison|ava|banu|aylin|emel|filiz|yeliz|zira|hazel/.test(
      voiceBlob(voice)
    );
  }

  function voiceLooksMale(voice) {
    return /male|\bman\b|david|mark|george|james|daniel|thomas|ryan|\bguy\b|ravi|fred|\balex\b|babek|babək|babekneural|tolga|ahmet|mehmet/.test(
      voiceBlob(voice)
    );
  }

  function voiceLangPref(voice, prefix) {
    var lang = ((voice && voice.lang) || "").toLowerCase();
    var blob = voiceBlob(voice);
    if (lang.indexOf(prefix) === 0) return true;
    if (prefix === "az") return /azərbaycan|azerbaijani|az-az|\baz\b/.test(blob);
    if (prefix === "en") return /english/.test(blob);
    if (prefix === "ru") return /russian|русск/.test(blob);
    if (prefix === "ky") return /kyrgyz|kirghiz|кыргыз/.test(blob);
    if (prefix === "tr") return /turkish|türk/.test(blob);
    return false;
  }

  function isAzerbaijaniVoice(voice) {
    var lang = ((voice && voice.lang) || "").toLowerCase();
    if (lang.indexOf("az") === 0) return true;
    return /azərbaycan|azerbaijani|az-az/.test(voiceBlob(voice));
  }

  function pickArticleModalVoice(voices, uiLang) {
    var list = Array.prototype.slice.call(voices || []);
    var spec = uiLang || articleModalSpeechLang();
    var ui = typeof spec === "string" ? spec : spec.ui;
    var bcp = typeof spec === "string" ? (spec === "az" ? "az-AZ" : spec) : spec.bcp;
    var preferMale = ui === "az";

    function first(pred) {
      var i;
      for (i = 0; i < list.length; i++) {
        if (pred(list[i])) return list[i];
      }
      return null;
    }

    var voice = null;
    var engine = "speechSynthesis";
    if (ui === "az") {
      voice = first(function (v) {
        return isAzerbaijaniVoice(v) && voiceLooksMale(v);
      });
      if (!voice) {
        engine = "edge-tts";
      }
    } else if (ui === "ky") {
      voice =
        first(function (v) {
          return voiceLangPref(v, "ky") && voiceLooksMale(v);
        }) ||
        first(function (v) {
          return voiceLangPref(v, "ky");
        });
      if (!voice) {
        engine = "ky-tts";
      }
    } else {
      voice =
        first(function (v) {
          return voiceLangPref(v, ui);
        }) ||
        first(function (v) {
          return ((v.lang || "").toLowerCase().indexOf(ui) === 0);
        }) ||
        (ui === "ky"
          ? first(function (v) {
              return voiceLangPref(v, "ru");
            })
          : null);
    }

    if (engine === "edge-tts") {
      return {
        voice: null,
        name: "az-AZ-BabekNeural",
        lang: "az-AZ",
        utterLang: "az-AZ",
        male: true,
        preferMale: true,
        engine: engine,
      };
    }

    if (engine === "ky-tts") {
      return {
        voice: null,
        name: "kk-KZ-DauletNeural",
        lang: "ky-KG",
        utterLang: "ky-KG",
        male: true,
        preferMale: true,
        engine: engine,
      };
    }

    return {
      voice: voice,
      name: voice ? voice.name || "" : "",
      lang: voice && voice.lang ? voice.lang : bcp,
      utterLang: ui === "az" ? "az-AZ" : voice && voice.lang ? voice.lang : bcp,
      male: !!(voice && voiceLooksMale(voice)),
      preferMale: preferMale,
      engine: engine,
    };
  }

  var articleModal = {
    overlay: null,
    dialog: null,
    titleEl: null,
    bodyEl: null,
    closeBtn: null,
    lastFocus: null,
    open: false,
    mode: "",
    entryId: "",
    tts: {
      speaking: false,
      token: 0,
      lastVoice: null,
      lastSpokenText: "",
      audio: null,
      activeGroup: null,
      usingMp3: false,
    },
  };

  function articleModalFocusables() {
    if (!articleModal.dialog) return [];
    return Array.prototype.slice
      .call(
        articleModal.dialog.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )
      .filter(function (el) {
        return !el.hasAttribute("hidden") && el.offsetParent !== null;
      });
  }

  function ensureArticleModal() {
    if (articleModal.overlay) return articleModal.overlay;
    var labels = articleModalLabels();
    var overlay = document.createElement("div");
    overlay.className = "inventions-article-modal";
    overlay.hidden = true;
    overlay.setAttribute("hidden", "");
    overlay.innerHTML =
      '<div class="inventions-article-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="inventions-article-modal-title" aria-label="' +
      labels.dialog +
      '">' +
      '<button type="button" class="inventions-article-modal__close" aria-label="' +
      labels.close +
      '">&times;</button>' +
      '<div class="inventions-article-modal__header">' +
      '<h2 class="inventions-article-modal__title" id="inventions-article-modal-title"></h2>' +
      "</div>" +
      '<div class="inventions-article-modal__body"></div>' +
      "</div>";
    document.body.appendChild(overlay);
    articleModal.overlay = overlay;
    articleModal.dialog = overlay.querySelector(".inventions-article-modal__dialog");
    articleModal.titleEl = overlay.querySelector(".inventions-article-modal__title");
    articleModal.bodyEl = overlay.querySelector(".inventions-article-modal__body");
    articleModal.closeBtn = overlay.querySelector(".inventions-article-modal__close");

    overlay.addEventListener("click", function (event) {
      if (Date.now() < (window.__birinciIgnoreModalBackdropUntil || 0)) return;
      if (event.target === overlay) closeArticleModal();
    });
    if (articleModal.closeBtn) {
      articleModal.closeBtn.addEventListener("click", closeArticleModal);
    }
    return overlay;
  }

  function stripCloneIds(root) {
    if (!root) return;
    if (root.id) root.removeAttribute("id");
    Array.prototype.forEach.call(root.querySelectorAll("[id]"), function (el) {
      el.removeAttribute("id");
    });
  }

  function prepareModalArticleImages(root) {
    if (!root) return;
    Array.prototype.forEach.call(root.querySelectorAll("img"), function (img) {
      var src = (img.getAttribute("src") || img.currentSrc || "").trim();
      if (!src) return;
      img.setAttribute("src", src);
      img.loading = "eager";
      img.decoding = "async";
    });
  }

  function stripModalEntryTitle(clone) {
    if (!clone) return;
    Array.prototype.forEach.call(
      clone.querySelectorAll(".inventions-entry-title"),
      function (heading) {
        if (heading.parentNode) heading.parentNode.removeChild(heading);
      }
    );
    Array.prototype.slice.call(clone.children).forEach(function (child) {
      if (!child || !child.tagName) return;
      var tag = child.tagName.toLowerCase();
      if (tag === "h1" || tag === "h2") {
        clone.removeChild(child);
      }
    });
  }

  function collectArticleModalBody(entry) {
    var wrap = document.createElement("div");
    wrap.className = "inventions-article-modal__article";
    if (!entry) return wrap;

    var clone = entry.cloneNode(true);
    var stem = entry.id || "";
    var audio = (entry.getAttribute("data-audio") || "").trim();
    stripCloneIds(clone);
    if (stem) clone.setAttribute("data-article-stem", stem);
    if (audio) clone.setAttribute("data-audio", audio);
    clone.classList.add("inventions-article-modal__entry");
    stripModalEntryTitle(clone);
    prepareModalArticleImages(clone);
    stripListenGroups(clone);
    relocateEntryBelowImageBlocks(clone);
    wrap.appendChild(clone);
    placeEntryActions(clone);
    return wrap;
  }

  function articleModalListenButton() {
    var group = articleModal.tts.activeGroup;
    if (group && group.isConnected) {
      return group.querySelector('[data-story-tts][data-tts-mode="listen"], [data-article-tts][data-tts-mode="listen"]');
    }
    return articleModal.bodyEl
      ? articleModal.bodyEl.querySelector(
          '[data-story-tts][data-tts-mode="listen"], [data-article-tts][data-tts-mode="listen"]'
        )
      : null;
  }

  function setListenGroupState(group, speaking) {
    if (!group) return;
    var listenBtn = group.querySelector('[data-tts-mode="listen"]');
    var stopBtn = group.querySelector('[data-tts-mode="stop"]');
    if (listenBtn) {
      listenBtn.setAttribute("aria-pressed", speaking ? "true" : "false");
      listenBtn.setAttribute("data-tts-state", speaking ? "playing" : "idle");
    }
    if (stopBtn) {
      stopBtn.setAttribute("aria-pressed", speaking ? "false" : "true");
      stopBtn.setAttribute("data-tts-state", speaking ? "playing" : "idle");
    }
  }

  function syncArticleModalListenButton(speaking) {
    var scope = articleModal.overlay || document;
    Array.prototype.forEach.call(
      scope.querySelectorAll(".story__actions .story__action-group"),
      function (group) {
        if (!group.querySelector("[data-story-tts], [data-article-tts]")) return;
        setListenGroupState(group, !!(speaking && group === articleModal.tts.activeGroup));
      }
    );
  }

  function stopArticleModalSpeech() {
    articleModal.tts.token += 1;
    articleModal.tts.speaking = false;
    articleModal.tts.usingMp3 = false;
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } catch (_) {}
    if (articleModal.tts.audio) {
      try {
        articleModal.tts.audio.pause();
        articleModal.tts.audio.removeAttribute("src");
        articleModal.tts.audio.load();
      } catch (_) {}
      articleModal.tts.audio = null;
    }
    if (typeof window.__birinciStopStoryTts === "function") {
      window.__birinciStopStoryTts();
    }
    syncArticleModalListenButton(false);
  }

  function chunkArticleSpeechText(text) {
    var max = 240;
    var chunks = [];
    var rest = String(text || "").replace(/\s+/g, " ").trim();
    while (rest.length > max) {
      var slice = rest.slice(0, max);
      var cut = Math.max(
        slice.lastIndexOf(". "),
        slice.lastIndexOf("? "),
        slice.lastIndexOf("! "),
        slice.lastIndexOf(" ")
      );
      if (cut < 40) cut = max;
      chunks.push(rest.slice(0, cut + 1).trim());
      rest = rest.slice(cut + 1).trim();
    }
    if (rest) chunks.push(rest);
    return chunks;
  }

  function cleanArticleSpeechChunk(text) {
    return String(text || "")
      .replace(/[\u00AD\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function articleSpeechText(root, title) {
    var parts = [];
    if (title) parts.push(title);
    if (!root) return parts.join(". ");
    var summary = root.querySelector(".inventions-entry-visual-summary");
    if (summary) {
      var sum = cleanArticleSpeechChunk(summary.textContent);
      if (sum) parts.push(sum);
    }
    Array.prototype.forEach.call(root.querySelectorAll(".inventions-key-facts li"), function (li) {
      var fact = cleanArticleSpeechChunk(li.textContent);
      if (fact) parts.push(fact);
    });
    Array.prototype.forEach.call(root.querySelectorAll(".inventions-entry-section"), function (section) {
      var heading = section.querySelector("h3");
      var paras = section.querySelectorAll("p");
      if (heading) {
        var h = cleanArticleSpeechChunk(heading.textContent);
        if (h) parts.push(h);
      }
      Array.prototype.forEach.call(paras, function (p) {
        var sent = cleanArticleSpeechChunk(p.textContent);
        if (sent) parts.push(sent);
      });
    });
    var text = parts.join(". ").replace(/\s+/g, " ").trim();
    articleModal.tts.lastSpokenText = text;
    return text;
  }

  function articleModalSpeechText() {
    var title = articleModal.titleEl ? articleModal.titleEl.textContent.trim() : "";
    return articleSpeechText(articleModal.bodyEl, title);
  }

  function applyVoiceChoiceToButton(choice) {
    var btn = articleModalListenButton();
    articleModal.tts.lastVoice = choice;
    if (!btn || !choice) return;
    btn.setAttribute("data-tts-voice-name", choice.name || "");
    btn.setAttribute("data-tts-voice-lang", choice.utterLang || choice.lang || "");
    btn.setAttribute("data-tts-voice-male", choice.male ? "true" : "false");
    btn.setAttribute("data-tts-prefer-male", choice.preferMale ? "true" : "false");
    btn.setAttribute("data-tts-engine", choice.engine || "");
  }

  function loadArticleModalVoices(done) {
    if (!window.speechSynthesis) {
      done([]);
      return;
    }
    var current = function () {
      try {
        return window.speechSynthesis.getVoices() || [];
      } catch (_) {
        return [];
      }
    };
    var now = current();
    if (now.length) {
      done(now);
      return;
    }
    var finished = false;
    var finish = function () {
      if (finished) return;
      finished = true;
      done(current());
    };
    try {
      window.speechSynthesis.onvoiceschanged = finish;
    } catch (_) {}
    window.setTimeout(finish, 700);
  }

  function hexUpper(buffer) {
    var bytes = new Uint8Array(buffer);
    var out = "";
    var i;
    for (i = 0; i < bytes.length; i++) {
      out += (bytes[i] + 256).toString(16).slice(1).toUpperCase();
    }
    return out;
  }

  function generateSecMsGec() {
    var winEpoch = 11644473600;
    var ticks = Date.now() / 1000 + winEpoch;
    ticks -= ticks % 300;
    ticks = Math.floor(ticks * 1e7);
    var raw = String(ticks) + "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
    var encoded = new TextEncoder().encode(raw);
    return crypto.subtle.digest("SHA-256", encoded).then(hexUpper);
  }

  function escapeSsml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function connectId() {
    return "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx".replace(/x/g, function () {
      return ((Math.random() * 16) | 0).toString(16);
    });
  }

  function edgeDateStamp() {
    return new Date().toUTCString().replace("GMT", "GMT+0000 (Coordinated Universal Time)");
  }

  function synthesizeViaLangProxy(lang, text) {
    if (window.BirinciTtsProxy && window.BirinciTtsProxy.synthesize) {
      return window.BirinciTtsProxy.synthesize(lang, text);
    }
    if (lang === "az") return synthesizeViaAzProxy(text);
    if (lang === "ky") return synthesizeViaKyProxy(text);
    return Promise.reject(new Error(lang + "-tts-proxy-missing"));
  }

  function azTtsProxyUrls() {
    var urls = [];
    try {
      urls.push(new URL("../../api/az-tts", document.baseURI).href);
    } catch (_) {}
    if (/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(location.origin)) {
      urls.push("http://127.0.0.1:8767/api/az-tts");
    }
    return urls;
  }

  function synthesizeViaAzProxy(text) {
    var urls = azTtsProxyUrls();
    var attempt = function (index) {
      if (index >= urls.length) {
        return Promise.reject(new Error("az-tts-proxy-missing"));
      }
      return fetch(urls[index], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text }),
      }).then(function (res) {
        if (!res.ok) throw new Error("az-tts-proxy-" + res.status);
        return res.blob();
      }).catch(function () {
        return attempt(index + 1);
      });
    };
    return attempt(0);
  }

  function kyTtsProxyUrls() {
    var urls = [];
    try {
      urls.push(new URL("../../api/ky-tts", document.baseURI).href);
    } catch (_) {}
    if (/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(location.origin)) {
      urls.push("http://127.0.0.1:8767/api/ky-tts");
    }
    return urls;
  }

  function synthesizeViaKyProxy(text) {
    var urls = kyTtsProxyUrls();
    var attempt = function (index) {
      if (index >= urls.length) {
        return Promise.reject(new Error("ky-tts-proxy-missing"));
      }
      return fetch(urls[index], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text }),
      }).then(function (res) {
        if (!res.ok) throw new Error("ky-tts-proxy-" + res.status);
        return res.blob();
      }).catch(function () {
        return attempt(index + 1);
      });
    };
    return attempt(0);
  }

  function synthesizeAzMaleChunk(text) {
    return synthesizeViaLangProxy("az", text).catch(function () {
      return synthesizeEdgeBabekChunk(text);
    });
  }

  function synthesizeKyMaleChunk(text) {
    return synthesizeViaLangProxy("ky", text);
  }

  function synthesizeEdgeBabekChunk(text) {
    return generateSecMsGec().then(function (gec) {
      return new Promise(function (resolve, reject) {
        var id = connectId();
        var url =
          "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1" +
          "?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4" +
          "&ConnectionId=" +
          id +
          "&Sec-MS-GEC=" +
          gec +
          "&Sec-MS-GEC-Version=1-143.0.3650.75";
        var socket;
        try {
          socket = new WebSocket(url);
        } catch (err) {
          reject(err);
          return;
        }
        socket.binaryType = "arraybuffer";
        var chunks = [];
        var settled = false;
        var finish = function (err, blob) {
          if (settled) return;
          settled = true;
          try {
            socket.close();
          } catch (_) {}
          if (err) reject(err);
          else resolve(blob);
        };
        window.setTimeout(function () {
          finish(new Error("edge-tts-timeout"));
        }, 20000);
        socket.onerror = function () {
          finish(new Error("edge-tts-socket"));
        };
        socket.onopen = function () {
          var stamp = edgeDateStamp();
          socket.send(
            "X-Timestamp:" +
              stamp +
              "\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n" +
              '{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"true","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n'
          );
          var ssml =
            "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='az-AZ'>" +
            "<voice name='az-AZ-BabekNeural'>" +
            "<prosody pitch='+0Hz' rate='-6%' volume='+0%'>" +
            escapeSsml(text) +
            "</prosody></voice></speak>";
          socket.send(
            "X-RequestId:" +
              connectId() +
              "\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:" +
              stamp +
              "Z\r\nPath:ssml\r\n\r\n" +
              ssml
          );
        };
        socket.onmessage = function (event) {
          if (typeof event.data === "string") {
            if (event.data.indexOf("Path:turn.end") !== -1) {
              if (!chunks.length) {
                finish(new Error("edge-tts-empty"));
                return;
              }
              finish(null, new Blob(chunks, { type: "audio/mpeg" }));
            }
            return;
          }
          var buf = event.data;
          if (!(buf instanceof ArrayBuffer) || buf.byteLength < 2) return;
          var view = new DataView(buf);
          var headerLen = view.getUint16(0, false);
          if (headerLen + 2 >= buf.byteLength) return;
          var header = new TextDecoder().decode(buf.slice(2, 2 + headerLen));
          if (header.indexOf("Path:audio") === -1) return;
          chunks.push(buf.slice(2 + headerLen));
        };
      });
    });
  }

  function playArticleModalAudioBlob(blob, token, onDone) {
    if (token !== articleModal.tts.token) return;
    var url = URL.createObjectURL(blob);
    var audio = document.createElement("audio");
    audio.setAttribute("data-article-modal-tts", "");
    audio.preload = "auto";
    if (articleModal.bodyEl) articleModal.bodyEl.appendChild(audio);
    articleModal.tts.audio = audio;
    audio.src = url;
    audio.onended = function () {
      URL.revokeObjectURL(url);
      if (token !== articleModal.tts.token) return;
      onDone();
    };
    audio.onerror = function () {
      URL.revokeObjectURL(url);
      if (token !== articleModal.tts.token) return;
      onDone(new Error("audio-play"));
    };
    var start = audio.play();
    if (start && typeof start.catch === "function") {
      start.catch(function () {
        URL.revokeObjectURL(url);
        if (token !== articleModal.tts.token) return;
        onDone(new Error("audio-play"));
      });
    }
  }

  function speakArticleModalWithEdgeBabek(text, token) {
    var chunks = chunkArticleSpeechText(text);
    var index = 0;
    var next = function () {
      if (token !== articleModal.tts.token) return;
      if (index >= chunks.length) {
        articleModal.tts.speaking = false;
        syncArticleModalListenButton(false);
        return;
      }
      synthesizeAzMaleChunk(chunks[index])
        .then(function (blob) {
          playArticleModalAudioBlob(blob, token, function (err) {
            if (err) {
              articleModal.tts.speaking = false;
              syncArticleModalListenButton(false);
              return;
            }
            index += 1;
            next();
          });
        })
        .catch(function () {
          if (token !== articleModal.tts.token) return;
          articleModal.tts.speaking = false;
          syncArticleModalListenButton(false);
        });
    };
    next();
  }

  function speakArticleModalWithKyProxy(text, token) {
    var chunks = chunkArticleSpeechText(text);
    var index = 0;
    var next = function () {
      if (token !== articleModal.tts.token) return;
      if (index >= chunks.length) {
        articleModal.tts.speaking = false;
        syncArticleModalListenButton(false);
        return;
      }
      synthesizeKyMaleChunk(chunks[index])
        .then(function (blob) {
          playArticleModalAudioBlob(blob, token, function (err) {
            if (err) {
              articleModal.tts.speaking = false;
              syncArticleModalListenButton(false);
              return;
            }
            index += 1;
            next();
          });
        })
        .catch(function () {
          if (token !== articleModal.tts.token) return;
          articleModal.tts.speaking = false;
          syncArticleModalListenButton(false);
        });
    };
    next();
  }

  function speakArticleModalWithBrowser(choice, text, spec, token) {
    if (!choice.voice || !("speechSynthesis" in window)) {
      articleModal.tts.speaking = false;
      syncArticleModalListenButton(false);
      return;
    }
    var chunks = chunkArticleSpeechText(text);
    var index = 0;
    var speakNext = function () {
      if (token !== articleModal.tts.token) return;
      if (index >= chunks.length) {
        articleModal.tts.speaking = false;
        syncArticleModalListenButton(false);
        return;
      }
      var chunk = chunks[index];
      var utter = new SpeechSynthesisUtterance(chunk);
      utter.lang = spec.ui === "az" ? "az-AZ" : choice.utterLang || spec.bcp;
      utter.voice = choice.voice;
      utter.rate = 1;
      utter.pitch = 1;
      utter.onend = function () {
        index += 1;
        speakNext();
      };
      utter.onerror = function () {
        if (token !== articleModal.tts.token) return;
        articleModal.tts.speaking = false;
        syncArticleModalListenButton(false);
      };
      try {
        window.speechSynthesis.speak(utter);
      } catch (_) {
        articleModal.tts.speaking = false;
        syncArticleModalListenButton(false);
      }
    };
    window.setTimeout(speakNext, 40);
  }

  function isEdgeBrowser() {
    return /\bEdg\//.test(navigator.userAgent || "");
  }

  function pickAzBrowserVoice(voices) {
    var list = Array.prototype.slice.call(voices || []);
    var i;
    var az = [];
    for (i = 0; i < list.length; i++) {
      if (isAzerbaijaniVoice(list[i])) az.push(list[i]);
    }
    if (!az.length) return null;
    for (i = 0; i < az.length; i++) {
      if (voiceLooksMale(az[i])) return az[i];
    }
    return az[0];
  }

  function articleStoredAudioUrl(root) {
    if (!root) return "";
    if (root.getAttribute && (root.getAttribute("data-audio") || "").trim()) {
      return root.getAttribute("data-audio").trim();
    }
    var entry =
      (root.querySelector && root.querySelector(".inventions-entry[data-audio]")) ||
      (root.querySelector && root.querySelector("[data-audio]"));
    return entry && entry.getAttribute ? (entry.getAttribute("data-audio") || "").trim() : "";
  }

  function articleStemFromRoot(root) {
    if (!root) return "";
    if (root.getAttribute) {
      var marked = (root.getAttribute("data-article-stem") || "").trim();
      if (marked) return marked;
    }
    if (root.id && root.classList && root.classList.contains("inventions-entry")) return root.id;
    var entry =
      (root.querySelector && root.querySelector(".inventions-entry[data-article-stem]")) ||
      (root.querySelector && root.querySelector(".inventions-entry[id]"));
    if (!entry) return "";
    return (entry.getAttribute("data-article-stem") || entry.id || "").trim();
  }

  function playArticleStoredMp3(root, title, src) {
    articleModal.tts.usingMp3 = true;
    articleModal.tts.speaking = true;
    var spoken = articleSpeechText(root, title) || title || "";
    articleModal.tts.lastSpokenText = spoken;
    syncArticleModalListenButton(true);
    if (typeof window.__birinciPlayStoredMp3 === "function") {
      var stem = articleStemFromRoot(root);
      var btn = articleModalListenButton();
      if (btn && stem) btn.setAttribute("data-story-stem", stem);
      window.__birinciPlayStoredMp3({
        src: src,
        title: title || "Məqalə",
        stem: stem,
        btn: btn,
      });
      return;
    }
    articleModal.tts.usingMp3 = false;
    articleModal.tts.speaking = false;
    syncArticleModalListenButton(false);
  }

  function currentSpeechVoices() {
    try {
      return window.speechSynthesis ? window.speechSynthesis.getVoices() || [] : [];
    } catch (_) {
      return [];
    }
  }

  function speakAzWithBrowserVoice(voice, text, spec) {
    var token = (articleModal.tts.token += 1);
    var choice = {
      voice: voice,
      name: voice.name || "",
      lang: voice.lang || "az-AZ",
      utterLang: "az-AZ",
      male: voiceLooksMale(voice),
      preferMale: true,
      engine: "speechSynthesis",
    };
    applyVoiceChoiceToButton(choice);
    articleModal.tts.usingMp3 = false;
    articleModal.tts.lastSpokenText = text;
    articleModal.tts.speaking = true;
    syncArticleModalListenButton(true);
    speakArticleModalWithBrowser(choice, text, spec, token);
  }

  function startAzArticleSpeech(root, title, text) {
    var spec = articleModalSpeechLang();
    if (isEdgeBrowser()) {
      loadArticleModalVoices(function (voices) {
        var voice = pickAzBrowserVoice(voices);
        if (voice) {
          speakAzWithBrowserVoice(voice, text, spec);
          return;
        }
        var lateSrc = articleStoredAudioUrl(root);
        if (lateSrc) playArticleStoredMp3(root, title, lateSrc);
      });
      return;
    }
    var voices = currentSpeechVoices();
    var azVoice = pickAzBrowserVoice(voices);
    if (azVoice) {
      speakAzWithBrowserVoice(azVoice, text, spec);
      return;
    }
    var src = articleStoredAudioUrl(root);
    if (src) playArticleStoredMp3(root, title, src);
  }

  function startArticleSpeech(root, title) {
    var spec = articleModalSpeechLang();
    if (spec.ui === "ky") return;
    var text = articleSpeechText(root, title);
    if (!text && spec.ui !== "az") return;

    if (spec.ui === "az") {
      startAzArticleSpeech(root, title, text);
      return;
    }

    if (!text) return;
    var token = (articleModal.tts.token += 1);
    loadArticleModalVoices(function (voices) {
      if (token !== articleModal.tts.token) return;
      var choice = pickArticleModalVoice(voices, spec);
      applyVoiceChoiceToButton(choice);
      articleModal.tts.lastSpokenText = text;
      articleModal.tts.speaking = true;
      syncArticleModalListenButton(true);
      speakArticleModalWithBrowser(choice, text, spec, token);
    });
  }

  function startArticleModalSpeech() {
    var title = articleModal.titleEl ? articleModal.titleEl.textContent.trim() : "";
    startArticleSpeech(articleModal.bodyEl, title);
  }

  var LISTEN_ICON =
    '<svg class="tools-bar__glyph" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
  var STOP_ICON =
    '<svg class="tools-bar__glyph" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M3 3l18 18"/></svg>';
  var EYE_ICON =
    '<svg class="tools-bar__glyph" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
  var EYE_OFF_ICON =
    '<svg class="tools-bar__glyph" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 10.6a3 3 0 0 0 4.2 4.2"/><path d="M9.9 5.1A11 11 0 0 1 12 5c6.5 0 10 7 10 7a19 19 0 0 1-3.2 4.1"/><path d="M6.1 6.1C3.6 7.8 2 12 2 12s3.5 7 10 7c1.6 0 3.1-.3 4.4-.9"/></svg>';
  var TEXT_ICON =
    '<svg class="tools-bar__glyph" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>';
  var TEXT_OFF_ICON =
    '<svg class="tools-bar__glyph" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h6"/><path d="M5 5l14 14"/></svg>';

  function listenGroupLabels() {
    var i18n = window.__BIRINCI_I18N__ || {};
    var ui = i18n.ui || {};
    return {
      audio: ui.story_audio_label || "Səs",
      listen: ui.listen || "Mətni dinlə",
      stop: ui.stop || "Dayandır",
    };
  }

  function stripListenGroups(root) {
    if (!root || !root.querySelectorAll) return;
    Array.prototype.forEach.call(root.querySelectorAll(".inventions-article-listen"), function (el) {
      if (el.closest(".story__actions")) return;
      if (el.parentNode) el.parentNode.removeChild(el);
    });
  }

  function storyIcon(name, fallback) {
    var pack = window.__BIRINCI_STORY_ICONS__ || {};
    return pack[name] || fallback || "";
  }

  function entryActionLabels() {
    var ui = (window.__BIRINCI_I18N__ && window.__BIRINCI_I18N__.ui) || {};
    return {
      audio: ui.story_audio_label || "Səs",
      image: ui.story_image_label || "Şəkil",
      text: ui.story_text_label || "Mətn",
      listen: ui.listen || "Mətni dinlə",
      stop: ui.stop || "Dayandır",
      showImage: ui.show_image || "Şəkli göstər",
      hideImage: ui.hide_image || "Şəkli gizlət",
      showText: ui.show_text || "Mətni göstər",
      hideText: ui.hide_text || "Mətni gizlət",
    };
  }

  function appendStoryActionGroup(parent, labelText, buttonsHtml) {
    var group = document.createElement("div");
    group.className = "story__action-group";
    var label = document.createElement("span");
    label.className = "tools-bar__label";
    label.textContent = labelText;
    var views = document.createElement("div");
    views.className = "tools-bar__views";
    views.setAttribute("role", "group");
    views.setAttribute("aria-label", labelText);
    views.innerHTML = buttonsHtml;
    group.appendChild(label);
    group.appendChild(views);
    parent.appendChild(group);
    return group;
  }

  function buildEntryActionsBar(entry) {
    var labels = entryActionLabels();
    var stem = entry && entry.id ? entry.id : "";
    var stemAttr = stem ? ' data-story-stem="' + stem.replace(/"/g, "&quot;") + '"' : "";
    var actions = document.createElement("div");
    actions.className = "story__actions inventions-entry-actions";

    if (articleModalSpeechLang().ui !== "ky") {
      appendStoryActionGroup(
        actions,
        labels.audio,
        '<button type="button" class="story-tts tools-bar__view-btn tools-bar__view-btn--icon" data-story-tts data-discovery-tts data-tts-mode="listen"' +
          stemAttr +
          ' aria-pressed="false" title="' +
          labels.listen.replace(/"/g, "&quot;") +
          '" aria-label="' +
          labels.listen.replace(/"/g, "&quot;") +
          '">' +
          storyIcon("listen", LISTEN_ICON) +
          '</button><button type="button" class="story-tts tools-bar__view-btn tools-bar__view-btn--icon" data-story-tts data-discovery-tts data-tts-mode="stop"' +
          stemAttr +
          ' aria-pressed="true" title="' +
          labels.stop.replace(/"/g, "&quot;") +
          '" aria-label="' +
          labels.stop.replace(/"/g, "&quot;") +
          '">' +
          storyIcon("stop", STOP_ICON) +
          "</button>"
      );
    }

    appendStoryActionGroup(
      actions,
      labels.image,
      '<button type="button" class="tools-bar__view-btn tools-bar__view-btn--icon" data-images-mode="show" aria-pressed="true" title="' +
        labels.showImage.replace(/"/g, "&quot;") +
        '" aria-label="' +
        labels.showImage.replace(/"/g, "&quot;") +
        '">' +
        storyIcon("eye", EYE_ICON) +
        '</button><button type="button" class="tools-bar__view-btn tools-bar__view-btn--icon" data-images-mode="hide" aria-pressed="false" title="' +
        labels.hideImage.replace(/"/g, "&quot;") +
        '" aria-label="' +
        labels.hideImage.replace(/"/g, "&quot;") +
        '">' +
        storyIcon("eye-off", EYE_OFF_ICON) +
        "</button>"
    );

    appendStoryActionGroup(
      actions,
      labels.text,
      '<button type="button" class="tools-bar__view-btn tools-bar__view-btn--icon" data-texts-mode="show" aria-pressed="true" title="' +
        labels.showText.replace(/"/g, "&quot;") +
        '" aria-label="' +
        labels.showText.replace(/"/g, "&quot;") +
        '">' +
        storyIcon("text", TEXT_ICON) +
        '</button><button type="button" class="tools-bar__view-btn tools-bar__view-btn--icon" data-texts-mode="hide" aria-pressed="false" title="' +
        labels.hideText.replace(/"/g, "&quot;") +
        '" aria-label="' +
        labels.hideText.replace(/"/g, "&quot;") +
        '">' +
        storyIcon("text-off", TEXT_OFF_ICON) +
        "</button>"
    );

    var note = document.createElement("p");
    note.className = "story-tts__note";
    note.setAttribute("data-story-tts-note", "");
    note.hidden = true;
    actions.appendChild(note);
    return actions;
  }

  function entryActionsNeedRefresh(actions) {
    if (!actions) return true;
    if (actions.querySelector(".inventions-article-listen, [data-article-tts]")) return true;
    if (!actions.querySelector(".story-tts__note")) return true;
    if (!actions.querySelector("[data-texts-mode]")) return true;
    var wantsAudio = articleModalSpeechLang().ui !== "ky";
    if (wantsAudio && !actions.querySelector("[data-story-tts]")) return true;
    if (!wantsAudio && actions.querySelector("[data-story-tts]")) return true;
    return false;
  }

  function bindInventionsEntryActionClicks() {
    if (bindInventionsEntryActionClicks.bound) return;
    bindInventionsEntryActionClicks.bound = true;
    document.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-images-mode], [data-texts-mode]");
      if (!btn || btn.closest("[data-tools]")) return;
      var entry = btn.closest(".inventions-entry");
      if (!entry || entry.closest(".inventions-article-modal")) return;
      event.preventDefault();
      event.stopPropagation();
      if (btn.hasAttribute("data-images-mode")) {
        setInventionsEntryFigure(entry, btn.getAttribute("data-images-mode") === "show");
        return;
      }
      setInventionsEntryText(entry, btn.getAttribute("data-texts-mode") === "show");
    });
  }

  function placeEntryActionsBar(entry, actions) {
    if (!entry || !actions) return;
    var copy = entry.querySelector(".inventions-entry-visual-copy");
    if (copy) {
      var figures = copy.querySelector(".inventions-entry-visual-figures");
      if (figures && figures.parentNode === copy && copy.firstElementChild !== figures) {
        copy.insertBefore(figures, copy.firstChild);
      }
      if (actions.parentNode !== copy || (figures && actions.previousElementSibling !== figures) || (!figures && copy.firstElementChild !== actions)) {
        if (figures && figures.parentNode === copy) copy.insertBefore(actions, figures.nextSibling);
        else copy.insertBefore(actions, copy.firstChild);
      }
      return;
    }
    var title = entry.querySelector(".inventions-entry-title");
    if (title && title.parentNode === entry) {
      title.insertAdjacentElement("afterend", actions);
      return;
    }
    if (!actions.parentNode) entry.insertBefore(actions, entry.firstChild);
  }

  function placeEntryActions(entry) {
    if (!entry) return null;
    bindInventionsEntryActionClicks();
    stripListenGroups(entry);
    var existing = entry.querySelector(".inventions-entry-actions, .story__actions");
    if (existing && entryActionsNeedRefresh(existing)) {
      existing.remove();
      existing = null;
    }
    var actions = existing || buildEntryActionsBar(entry);
    placeEntryActionsBar(entry, actions);
    setInventionsEntryFigure(entry, !entry.classList.contains("inventions-entry--figure-hidden"));
    setInventionsEntryText(entry, !entry.classList.contains("inventions-entry--text-hidden"));
    return actions;
  }

  function placeListenGroup() {
    return null;
  }

  function insertArticleModalListenButton(root) {
    placeListenGroup(root, startArticleModalSpeech);
  }

  function relocateEntryPeriodLine(entry) {
    relocateEntryBelowImageBlocks(entry);
  }

  function relocateEntryKeyFacts(entry) {
    relocateEntryBelowImageBlocks(entry);
  }

  function relocateEntryBelowImageBlocks(entry) {
    if (!entry) return;
    var visual = entry.querySelector(".inventions-entry-visual");
    if (!visual) return;
    var copy = visual.querySelector(".inventions-entry-visual-copy");
    var facts = entry.querySelector(".inventions-key-facts");
    var meta = entry.querySelector(".inventions-entry-meta");
    var summary = copy && copy.querySelector(".inventions-entry-visual-summary");
    if (facts && facts.parentNode !== visual) visual.appendChild(facts);
    if (meta && copy) {
      if (summary) {
        if (meta.previousElementSibling !== summary) copy.insertBefore(meta, summary.nextSibling);
      } else if (meta.parentNode !== copy) {
        copy.appendChild(meta);
      }
    }
  }

  function insertPageEntryListenButtons() {
    Array.prototype.forEach.call(
      document.querySelectorAll(".inventions-layout .inventions-entry"),
      function (entry) {
        relocateEntryBelowImageBlocks(entry);
        placeEntryActions(entry);
      }
    );
  }

  window.__inventionsArticleModalTts = {
    pickVoice: pickArticleModalVoice,
    lastVoice: function () {
      return articleModal.tts.lastVoice;
    },
    lastSpokenText: function () {
      return articleModal.tts.lastSpokenText || "";
    },
    isSpeaking: function () {
      return !!articleModal.tts.speaking;
    },
  };

  function closeArticleModal() {
    if (!articleModal.overlay || !articleModal.open) return;
    stopArticleModalSpeech();
    articleModal.open = false;
    articleModal.mode = "";
    articleModal.overlay.hidden = true;
    articleModal.overlay.setAttribute("hidden", "");
    document.body.classList.remove("inventions-article-modal-open");
    if (articleModal.dialog) {
      articleModal.dialog.classList.remove("inventions-article-modal__dialog--wide");
    }
    articleModal.entryId = "";
    if (articleModal.titleEl) articleModal.titleEl.textContent = "";
    if (articleModal.bodyEl) articleModal.bodyEl.innerHTML = "";
    if (articleModal.lastFocus && typeof articleModal.lastFocus.focus === "function") {
      try {
        articleModal.lastFocus.focus();
      } catch (_) {}
    }
    articleModal.lastFocus = null;
  }

  function syncArticleModalChrome() {
    var labels = articleModalLabels();
    var actionLabels = entryActionLabels();
    if (articleModal.dialog) {
      articleModal.dialog.setAttribute("aria-label", labels.dialog);
    }
    if (articleModal.closeBtn) {
      articleModal.closeBtn.setAttribute("aria-label", labels.close);
    }
    Array.prototype.forEach.call(
      (articleModal.overlay || document).querySelectorAll(
        ".story__actions .story__action-group"
      ),
      function (group) {
        var labelEl = group.querySelector(".tools-bar__label");
        var views = group.querySelector(".tools-bar__views");
        if (group.querySelector("[data-story-tts], [data-article-tts]")) {
          if (labelEl) labelEl.textContent = actionLabels.audio;
          if (views) views.setAttribute("aria-label", actionLabels.audio);
          var listenBtn = group.querySelector('[data-tts-mode="listen"]');
          var stopBtn = group.querySelector('[data-tts-mode="stop"]');
          if (listenBtn) {
            listenBtn.setAttribute("title", actionLabels.listen);
            listenBtn.setAttribute("aria-label", actionLabels.listen);
          }
          if (stopBtn) {
            stopBtn.setAttribute("title", actionLabels.stop);
            stopBtn.setAttribute("aria-label", actionLabels.stop);
          }
          return;
        }
        if (group.querySelector("[data-images-mode]")) {
          if (labelEl) labelEl.textContent = actionLabels.image;
          if (views) views.setAttribute("aria-label", actionLabels.image);
          group.querySelectorAll("[data-images-mode='show']").forEach(function (btn) {
            btn.setAttribute("title", actionLabels.showImage);
            btn.setAttribute("aria-label", actionLabels.showImage);
          });
          group.querySelectorAll("[data-images-mode='hide']").forEach(function (btn) {
            btn.setAttribute("title", actionLabels.hideImage);
            btn.setAttribute("aria-label", actionLabels.hideImage);
          });
          return;
        }
        if (group.querySelector("[data-texts-mode]")) {
          if (labelEl) labelEl.textContent = actionLabels.text;
          if (views) views.setAttribute("aria-label", actionLabels.text);
          group.querySelectorAll("[data-texts-mode='show']").forEach(function (btn) {
            btn.setAttribute("title", actionLabels.showText);
            btn.setAttribute("aria-label", actionLabels.showText);
          });
          group.querySelectorAll("[data-texts-mode='hide']").forEach(function (btn) {
            btn.setAttribute("title", actionLabels.hideText);
            btn.setAttribute("aria-label", actionLabels.hideText);
          });
        }
      }
    );
  }

  function hideDiscoveriesSectionSources() {
    var overview = document.getElementById("overview-by-category");
    var refs = document.getElementById("references");
    if (overview) {
      overview.hidden = true;
      overview.classList.add("inventions-section-source");
    }
    if (refs) {
      refs.hidden = true;
      refs.classList.add("inventions-section-source");
    }
  }

  function pruneDiscoveriesExtraNav() {
    document
      .querySelectorAll(
        '.inventions-toc-extra a[href="#overview-by-category"], .inventions-toc-extra a[href="#references"], .inventions-toc-ref-row, .toc-group[data-toc-group="overview-by-category"], .toc-group[data-toc-group="references"]'
      )
      .forEach(function (el) {
        var row = el.closest("li, .toc-group") || el;
        if (row.parentNode) row.parentNode.removeChild(row);
      });
  }

  function sectionModalTitle(source, opener) {
    if (!source) return opener && opener.textContent ? visibleCatalogLabel(opener.textContent) : "";
    var heading = source.querySelector("h2");
    if (heading && heading.textContent) return visibleCatalogLabel(heading.textContent);
    if (opener && opener.textContent) return visibleCatalogLabel(opener.textContent);
    return "";
  }

  function collectSectionModalBody(source) {
    var wrap = document.createElement("div");
    wrap.className = "inventions-section-modal__content";
    if (!source) return wrap;
    var clone = source.cloneNode(true);
    clone.hidden = false;
    clone.removeAttribute("hidden");
    clone.classList.remove("inventions-section-source");
    stripCloneIds(clone);
    var heading = clone.querySelector("h2");
    if (heading && heading.parentNode) heading.parentNode.removeChild(heading);
    wrap.appendChild(clone);
    return wrap;
  }

  function openSectionModal(source, opener) {
    if (!source) return;
    stopArticleModalSpeech();
    ensureArticleModal();
    articleModal.lastFocus =
      opener && opener.focus
        ? opener
        : document.activeElement && document.activeElement !== document.body
          ? document.activeElement
          : null;
    articleModal.mode = "section";
    articleModal.entryId = source.id || "";
    if (articleModal.titleEl) articleModal.titleEl.textContent = sectionModalTitle(source, opener);
    if (articleModal.dialog) {
      articleModal.dialog.classList.add("inventions-article-modal__dialog--wide");
    }
    if (articleModal.bodyEl) {
      articleModal.bodyEl.innerHTML = "";
      articleModal.bodyEl.appendChild(collectSectionModalBody(source));
    }
    syncArticleModalChrome();
    articleModal.bodyEl.scrollTop = 0;
    articleModal.overlay.hidden = false;
    articleModal.overlay.removeAttribute("hidden");
    document.body.classList.add("inventions-article-modal-open");
    articleModal.open = true;
    window.requestAnimationFrame(function () {
      if (articleModal.closeBtn) articleModal.closeBtn.focus();
    });
  }

  function fillSectionModal(source) {
    if (!source || !articleModal.bodyEl) return;
    articleModal.mode = "section";
    if (articleModal.dialog) {
      articleModal.dialog.classList.add("inventions-article-modal__dialog--wide");
    }
    if (articleModal.titleEl) articleModal.titleEl.textContent = sectionModalTitle(source);
    var keepScroll = articleModal.bodyEl.scrollTop;
    articleModal.bodyEl.innerHTML = "";
    articleModal.bodyEl.appendChild(collectSectionModalBody(source));
    articleModal.bodyEl.scrollTop = keepScroll;
    syncArticleModalChrome();
  }

  function fillArticleModal(entry) {
    if (!entry) return;
    articleModal.mode = "article";
    if (articleModal.dialog) {
      articleModal.dialog.classList.remove("inventions-article-modal__dialog--wide");
    }
    var nameEl = entry.querySelector(".inventions-entry-name");
    var titleEl = entry.querySelector(".inventions-entry-title");
    var title = "";
    if (nameEl && nameEl.textContent) title = nameEl.textContent.trim();
    else if (titleEl && titleEl.textContent) title = titleEl.textContent.trim();
    else if (entry.getAttribute("data-title")) title = entry.getAttribute("data-title").trim();
    title = visibleCatalogLabel(title);
    articleModal.entryId = entry.id || entry.getAttribute("data-article-stem") || "";
    if (articleModal.titleEl) articleModal.titleEl.textContent = title;
    if (articleModal.bodyEl) {
      articleModal.bodyEl.innerHTML = "";
      articleModal.bodyEl.appendChild(collectArticleModalBody(entry));
    }
    syncArticleModalChrome();
  }

  function openArticleModal(entry, opener) {
    if (!entry) return;
    stopArticleModalSpeech();
    ensureArticleModal();
    articleModal.lastFocus =
      opener && opener.focus
        ? opener
        : document.activeElement && document.activeElement !== document.body
          ? document.activeElement
          : null;
    if (typeof window.__birinciPrefetchModalLangPacks === "function") {
      window.__birinciPrefetchModalLangPacks();
    }
    fillArticleModal(entry);
    articleModal.bodyEl.scrollTop = 0;
    articleModal.overlay.hidden = false;
    articleModal.overlay.removeAttribute("hidden");
    document.body.classList.add("inventions-article-modal-open");
    articleModal.open = true;
    window.requestAnimationFrame(function () {
      if (articleModal.closeBtn) articleModal.closeBtn.focus();
    });
  }

  function isArticleModalInteractive(target) {
    if (!target || !target.closest) return false;
    var hit = target.closest("a, button, input, select, textarea, label");
    if (!hit) return false;
    if (hit.classList.contains("inventions-card")) return false;
    return true;
  }

  function entryFromCard(card) {
    if (!card) return null;
    var id = card.getAttribute("data-entry");
    return id ? document.getElementById(id) : null;
  }

  function bindArticleModalTriggers() {
    document.addEventListener("click", function (event) {
      var sectionBtn = event.target.closest("[data-inventions-section]");
      if (sectionBtn) {
        var source = document.getElementById(sectionBtn.getAttribute("data-inventions-section") || "");
        if (source) {
          event.preventDefault();
          openSectionModal(source, sectionBtn);
        }
        return;
      }
      if (articleModal.open && event.target.closest(".inventions-article-modal")) return;
      if (isArticleModalInteractive(event.target)) return;

      var cardBody = event.target.closest(".inventions-card__body");
      if (cardBody) {
        var card = cardBody.closest(".inventions-card");
        var cardEntry = entryFromCard(card);
        if (cardEntry) {
          event.preventDefault();
          openArticleModal(cardEntry, card);
        }
        return;
      }

      var textHit = event.target.closest(
        ".inventions-entry-section, .inventions-entry-visual-copy, .inventions-entry-visual-summary"
      );
      if (!textHit || textHit.closest(".inventions-article-modal")) return;
      var entry = textHit.closest(".inventions-entry");
      if (!entry) return;
      event.preventDefault();
      openArticleModal(entry, textHit);
    });

    document.addEventListener("keydown", function (event) {
      if (!articleModal.open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeArticleModal();
        return;
      }
      if (event.key !== "Tab") return;
      var items = articleModalFocusables();
      if (!items.length) {
        event.preventDefault();
        if (articleModal.closeBtn) articleModal.closeBtn.focus();
        return;
      }
      var first = items[0];
      var last = items[items.length - 1];
      var active = document.activeElement;
      if (event.shiftKey) {
        if (active === first || !articleModal.dialog.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  window.__birinciRefreshArticleModal = function (doc) {
    if (!articleModal.open || !articleModal.entryId) return;
    if (articleModal.mode === "section") {
      var liveSection = document.getElementById(articleModal.entryId);
      var fetchedSection = doc && doc.getElementById(articleModal.entryId);
      fillSectionModal(fetchedSection || liveSection);
      return;
    }
    var live = document.getElementById(articleModal.entryId);
    var fetched =
      doc &&
      (doc.getElementById(articleModal.entryId) ||
        doc.querySelector('.inventions-entry[data-article-stem="' + articleModal.entryId + '"]'));
    if (fetched && live && fetched !== live) {
      var audio = fetched.getAttribute("data-audio");
      if (audio) live.setAttribute("data-audio", audio);
      else live.removeAttribute("data-audio");
      live.innerHTML = fetched.innerHTML;
    }
    var entry = fetched || live;
    if (!entry) return;
    if (articleModal.overlay) {
      articleModal.overlay.hidden = false;
      articleModal.overlay.removeAttribute("hidden");
    }
    document.body.classList.add("inventions-article-modal-open");
    articleModal.open = true;
    var keepScroll = articleModal.bodyEl ? articleModal.bodyEl.scrollTop : 0;
    stopArticleModalSpeech();
    fillArticleModal(entry);
    if (articleModal.bodyEl) articleModal.bodyEl.scrollTop = keepScroll;
    syncArticleModalChrome();
  };

  window.__birinciRefreshInventionsAfterLang = function () {
    insertPageEntryListenButtons();
    if (cardsHost && cardsHost.parentNode) {
      cardsHost.parentNode.removeChild(cardsHost);
    }
    cardsHost = null;
    cardById = {};
    buildCards();
    enhanceCardCategoryToggles();
    var view = document.body.classList.contains("inventions-view-cards") ? "cards" : "list";
    setInventionsView(view);
    if (typeof applyFilters === "function") applyFilters();
    if (typeof window.__birinciRefreshInventionsListTools === "function") {
      window.__birinciRefreshInventionsListTools();
    }
    hideDiscoveriesSectionSources();
    pruneDiscoveriesExtraNav();
    window.__birinciRefreshArticleModal();
    if (typeof window.__birinciSyncToolsBarTooltips === "function") {
      window.__birinciSyncToolsBarTooltips();
    }
  };

  hideDiscoveriesSectionSources();
  pruneDiscoveriesExtraNav();
  bindArticleModalTriggers();
  insertPageEntryListenButtons();
  document.addEventListener("birinci:audio-player-change", function (event) {
    var detail = (event && event.detail) || {};
    if (!articleModal.tts.usingMp3) return;
    if (detail.open === false || detail.ended) {
      articleModal.tts.usingMp3 = false;
      articleModal.tts.speaking = false;
      articleModal.tts.token += 1;
      syncArticleModalListenButton(false);
    }
  });

  var viewStorageKey = "birinci-inventions-view";
  var viewBtns = Array.prototype.slice.call(
    document.querySelectorAll("[data-inventions-view]")
  );
  var cardsHost = null;
  var cardById = {};

  function buildCards() {
    var layout = document.querySelector(".inventions-layout");
    if (!layout || cardsHost) return;
    cardsHost = document.createElement("div");
    cardsHost.className = "inventions-cards";
    cardsHost.setAttribute("hidden", "");
    layout.parentNode.insertBefore(cardsHost, layout);

    categories.forEach(function (cat) {
      var section = document.createElement("section");
      section.className = "inventions-cards-category";
      if (cat.id) section.setAttribute("data-cards-cat", cat.id);
      var head = cat.querySelector(".inventions-category-head");
      if (head) {
        var heading = document.createElement("h2");
        heading.className = "inventions-cards-head";
        var label = "";
        var node = head.firstChild;
        while (node) {
          if (node.nodeType === 3) label += node.textContent;
          node = node.nextSibling;
        }
        heading.textContent = label.replace(/\s+/g, " ").trim() || head.textContent.trim();
        section.appendChild(heading);
      }
      var grid = document.createElement("div");
      grid.className = "inventions-card-grid";
      Array.prototype.forEach.call(
        cat.querySelectorAll(".inventions-entry"),
        function (entry) {
          var nameEl = entry.querySelector(".inventions-entry-name");
          var summaryEl = entry.querySelector(".inventions-entry-visual-summary");
          var imgEl = entry.querySelector(".inventions-entry-icon img");
          var card = document.createElement("a");
          card.className = "inventions-card";
          card.href = "#" + entry.id;
          card.setAttribute("data-entry", entry.id);
          var media = document.createElement("div");
          media.className = "inventions-card__media";
          if (imgEl) {
            var img = document.createElement("img");
            img.src = imgEl.getAttribute("src") || "";
            img.alt = nameEl ? nameEl.textContent : "";
            img.loading = "lazy";
            img.decoding = "async";
            media.appendChild(img);
          }
          var body = document.createElement("div");
          body.className = "inventions-card__body";
          body.setAttribute("data-article-read", "");
          var title = document.createElement("h3");
          title.className = "inventions-card__title";
          title.textContent = nameEl ? nameEl.textContent : entry.id;
          body.appendChild(title);
          if (summaryEl) {
            var sum = document.createElement("p");
            sum.className = "inventions-card__summary";
            sum.textContent = summaryEl.textContent;
            body.appendChild(sum);
          }
          card.appendChild(media);
          card.appendChild(body);
          card.setAttribute("aria-haspopup", "dialog");
          card.addEventListener("click", function (e) {
            if (e.target.closest(".inventions-card__body")) {
              e.preventDefault();
              return;
            }
            e.preventDefault();
            setInventionsView("list");
            scrollToSection(entry.id);
          });
          grid.appendChild(card);
          cardById[entry.id] = card;
        }
      );
      section.appendChild(grid);
      if (cat.classList.contains("is-collapsed")) {
        section.classList.add("is-collapsed");
      }
      cardsHost.appendChild(section);
    });
    annotateDiscoveriesCategoryCounts();
  }

  function syncCardVisibility() {
    if (!cardsHost) return;
    Object.keys(cardById).forEach(function (id) {
      var entry = document.getElementById(id);
      cardById[id].classList.toggle(
        "is-hidden",
        !entry || entry.classList.contains("is-hidden")
      );
    });
    Array.prototype.forEach.call(
      cardsHost.querySelectorAll(".inventions-cards-category"),
      function (sec) {
        var visible = sec.querySelectorAll(".inventions-card:not(.is-hidden)").length;
        sec.classList.toggle("is-hidden", visible === 0);
      }
    );
  }

  function setInventionsView(next) {
    var view = next === "list" ? "list" : "cards";
    document.body.classList.toggle("inventions-view-cards", view === "cards");
    document.body.classList.toggle("inventions-view-list", view === "list");
    if (cardsHost) {
      if (view === "cards") cardsHost.removeAttribute("hidden");
      else cardsHost.setAttribute("hidden", "");
    }
    viewBtns.forEach(function (btn) {
      btn.setAttribute(
        "aria-pressed",
        btn.getAttribute("data-inventions-view") === view ? "true" : "false"
      );
    });
    try {
      localStorage.setItem(viewStorageKey, view);
    } catch (_) {}
    if (
      isDiscoveriesPage() &&
      window.KT_SIDEBAR_TOC_GROUPS &&
      window.KT_SIDEBAR_TOC_GROUPS.syncAllMainCategoriesFromToc
    ) {
      window.KT_SIDEBAR_TOC_GROUPS.syncAllMainCategoriesFromToc();
    }
    applyInventionsListWindow();
  }
  window.__birinciSetInventionsView = setInventionsView;

  function selectDiscoveriesCategoryFromCards(catId) {
    var cat = catId ? document.getElementById(catId) : null;
    var value = cat ? String(cat.getAttribute("data-category") || "") : "";
    if (!value) return;
    var mf = window.KT_CATALOG_MULTI_FILTER;
    if (mf && typeof mf.setActiveValues === "function") {
      mf.setActiveValues("filterCategory", [value]);
    } else if (filterCategory) {
      filterCategory.value = value;
      applyFilters({ resetWindow: true });
    }
    setInventionsView("list");
  }

  function enhanceCardCategoryToggles() {
    if (!isDiscoveriesPage() || !cardsHost) return;
    Array.prototype.forEach.call(
      cardsHost.querySelectorAll(".inventions-cards-category[data-cards-cat]"),
      function (section) {
        if (section.getAttribute("data-kt-cat-toggle")) return;
        var catId = section.getAttribute("data-cards-cat");
        var head = section.querySelector(".inventions-cards-head");
        if (!catId || !head) return;
        section.setAttribute("data-kt-cat-toggle", "1");
        head.classList.add("inventions-category-head--collapsible");
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "inventions-category-toggle";
        btn.setAttribute(
          "aria-expanded",
          section.classList.contains("is-collapsed") ? "false" : "true"
        );
        btn.setAttribute(
          "aria-label",
          "Toggle " + (head.textContent || "category").replace(/\s+/g, " ").trim()
        );
        var chevron = document.createElement("span");
        chevron.className = "inventions-category-toggle__chevron";
        chevron.setAttribute("aria-hidden", "true");
        btn.appendChild(chevron);
        head.appendChild(btn);

        var togglePair = function () {
          var next = section.classList.contains("is-collapsed");
          syncCategoryPair(catId, next);
        };
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          togglePair();
        });
        head.addEventListener("click", function (e) {
          if (e.target.closest("a, button")) return;
          e.preventDefault();
          selectDiscoveriesCategoryFromCards(catId);
        });
      }
    );
  }

  buildCards();
  enhanceCardCategoryToggles();
  syncCardVisibility();

  if (viewBtns.length) {
    var savedView = "cards";
    try {
      savedView = localStorage.getItem(viewStorageKey) || "cards";
    } catch (_) {}
    if (savedView === "category") savedView = "cards";
    if (hasSectionHash) savedView = "list";
    setInventionsView(savedView);
    viewBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        setInventionsView(btn.getAttribute("data-inventions-view"));
      });
    });
  }
  bindInventionsListTools();

  if (widget) {
    var toggle = widget.querySelector(".events-menu-toggle");

    if (toggle) {
      toggle.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleEventsMenu();
      });
    }

    document.addEventListener("click", function (e) {
      if (!mobileMq.matches || !widget.classList.contains("events-open")) return;
      if (widget.contains(e.target)) return;
      closeEventsMenu();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeEventsMenu();
    });

    navLinks.forEach(function (a) {
      var hrefId = a.getAttribute("href").slice(1);
      var row = a.closest("[data-toc-entry]");
      if (row && row.getAttribute("data-toc-entry") !== hrefId) {
        console.warn("TOC entry mismatch:", row.getAttribute("data-toc-entry"), hrefId);
      }
      if (hrefId && !document.getElementById(hrefId)) {
        console.warn("TOC link missing section:", hrefId);
      }

      a.addEventListener("click", function (e) {
        e.preventDefault();
        scrollToSection(hrefId);
      });
    });

    window.addEventListener(
      "scroll",
      function () {
        if (scrollTick) return;
        scrollTick = true;
        requestAnimationFrame(function () {
          scrollTick = false;
          updateActiveFromScroll(false);
        });
      },
      { passive: true }
    );

    window.addEventListener("resize", function () {
      updateActiveFromScroll(true);
    });

    mobileMq.addEventListener("change", function () {
      updateActiveFromScroll(true);
    });

    var incomingHash = "";
    try {
      incomingHash = decodeURIComponent(rawHash);
    } catch (_) {
      incomingHash = rawHash;
    }
    if (hasSectionHash && linkById[incomingHash]) {
      setTimeout(function () {
        scrollToSection(incomingHash);
        restoreLangContext();
      }, 100);
    } else {
      if (!hasSectionHash) {
        var html = document.documentElement;
        html.classList.add("no-smooth-scroll");
        html.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
        window.scrollTo(0, 0);
        requestAnimationFrame(function () {
          html.classList.remove("no-smooth-scroll");
        });
      }
      updateActiveFromScroll(true);
      restoreLangContext();
    }
  } else {
    restoreLangContext();
  }

  window.__birinciInventionsContext = function () {
    var active = pickActiveSection();
    var sectionId = (active && active.id) || lastActiveId || "";
    var categoryId = "";
    if (sectionId) {
      var el = document.getElementById(sectionId);
      var cat = el && el.closest(".inventions-category");
      categoryId = (cat && cat.id) || "";
      if (!categoryId) {
        var toc = document.querySelector(
          '.inventions-toc-entry[data-toc-entry="' + sectionId + '"]'
        );
        categoryId = (toc && toc.getAttribute("data-toc-cat")) || "";
      }
    }
    var tocCollapsed = [];
    document.querySelectorAll(".toc-group[data-toc-cat]").forEach(function (group) {
      if (!group.classList.contains("events-open")) {
        tocCollapsed.push(group.getAttribute("data-toc-cat"));
      }
    });
    return {
      sectionId: sectionId,
      categoryId: categoryId,
      q: searchInput ? String(searchInput.value || "").trim() : "",
      cat: activeFilterValues("filterCategory"),
      period: activeFilterValues("filterPeriod"),
      tocCollapsed: tocCollapsed,
    };
  };
})();
