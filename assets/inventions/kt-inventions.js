(function () {
  "use strict";

  var widget = document.getElementById("inventionsArticlesWidget");

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
  var clearFilters = document.getElementById("clearFilters");
  var catalogToolbar = document.querySelector(
    ".tools-bar--inventions, .toolbar.catalog-toolbar"
  );
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

  function enrichEntryMetadata() {
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
    var root = document.documentElement;
    var style = window.getComputedStyle(root);
    var stack = parseFloat(style.getPropertyValue("--kt-sticky-top-stack"));
    if (!isFinite(stack) || stack <= 0) {
      stack = parseFloat(style.getPropertyValue("--kt-nav-height"));
      if (!isFinite(stack) || stack <= 0) {
        var nav = document.querySelector(".nav-strip");
        stack = nav ? nav.getBoundingClientRect().height : 86;
      }
      var crumbsH = parseFloat(style.getPropertyValue("--kt-breadcrumbs-height"));
      if (isFinite(crumbsH) && crumbsH > 0) {
        stack += crumbsH;
      } else {
        var crumbs = document.getElementById("kt-breadcrumbs");
        if (crumbs) stack += crumbs.getBoundingClientRect().height;
      }
    }
    var gap = parseFloat(style.getPropertyValue("--kt-scroll-anchor-gap"));
    if (!isFinite(gap) || gap <= 0) gap = 20;
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

  function writeInventionsUrlState(activeId) {
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
      history.replaceState(null, "", url.pathname + url.search + url.hash);
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

    if (Array.isArray(ctx.tocCollapsed) && window.KT_SIDEBAR_TOC_GROUPS) {
      ctx.tocCollapsed.forEach(function (slug) {
        var group = document.querySelector('.toc-group[data-toc-cat="' + slug + '"]');
        if (group && window.KT_SIDEBAR_TOC_GROUPS.setGroupExpanded) {
          window.KT_SIDEBAR_TOC_GROUPS.setGroupExpanded(group, false);
        }
      });
    }

    var targetId = "";
    try {
      targetId = decodeURIComponent((window.location.hash || "").replace(/^#/, ""));
    } catch (_) {
      targetId = (window.location.hash || "").replace(/^#/, "");
    }
    if (targetId && document.getElementById(targetId)) {
      setTimeout(function () {
        scrollToSection(targetId);
      }, 80);
      return;
    }
    if (ctx.sectionId && document.getElementById(ctx.sectionId)) {
      setTimeout(function () {
        scrollToSection(ctx.sectionId);
      }, 80);
      return;
    }
    if (ctx.categoryId && document.getElementById(ctx.categoryId)) {
      setTimeout(function () {
        jumpToTarget(ctx.categoryId);
        if (typeof ctx.scrollRatio === "number" && isFinite(ctx.scrollRatio)) {
          restoreScrollRatio(ctx.scrollRatio, ctx.categoryId);
        }
      }, 100);
      return;
    }
    if (typeof ctx.scrollRatio === "number" && isFinite(ctx.scrollRatio)) {
      setTimeout(function () {
        restoreScrollRatio(ctx.scrollRatio, null);
      }, 100);
    }
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

  function applyFilters() {
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
    });

    tocEntries.forEach(function (item) {
      var slug = item.getAttribute("data-toc-entry");
      var entry = slug ? document.getElementById(slug) : null;
      var hidden = entry ? entry.classList.contains("is-hidden") : false;
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

    var visibleCount = entries.filter(function (entry) {
      return !entry.classList.contains("is-hidden");
    }).length;
    syncSearchChip(searchInput.value, visibleCount);
    syncCardVisibility();

    updateFilterStyles();
    syncToolbarFilterBadge();
    updateActiveFromScroll(true);
    writeInventionsUrlState();
    if (window.KT_SIDEBAR_TOC_GROUPS && widget) {
      window.KT_SIDEBAR_TOC_GROUPS.refreshArticlesSidebarButtons(widget);
    }
  }

  function clearFilterInputs() {
    if (searchInput) searchInput.value = "";
    if (window.KT_CATALOG_MULTI_FILTER) {
      window.KT_CATALOG_MULTI_FILTER.clearMany(["filterCategory", "filterPeriod"]);
      return;
    }
    if (filterCategory) filterCategory.value = "";
    if (filterPeriod) filterPeriod.value = "";
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
    if (li && window.KT_SIDEBAR_TOC_GROUPS) {
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

    var root = document.documentElement;
    var prevBehavior = root.style.scrollBehavior;
    var top =
      target.getBoundingClientRect().top +
      (window.pageYOffset || root.scrollTop || 0) -
      stickyScrollOffset();

    root.style.scrollBehavior = "auto";
    window.scrollTo({ top: Math.max(0, Math.round(top)), left: 0, behavior: "auto" });
    window.requestAnimationFrame(function () {
      root.style.scrollBehavior = prevBehavior;
    });
    return true;
  }

  function scrollToSection(id) {
    if (!id || !document.getElementById(id)) return;

    lockSpy(480);
    setActive(id, { force: true, forceSidebarScroll: true });
    jumpToTarget(id);

    writeInventionsUrlState(id);

    if (mobileMq.matches) {
      closeEventsMenu();
    }

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        setActive(id, { force: true, forceSidebarScroll: true });
      });
    });
  }

  enrichEntryMetadata();

  applyInventionsUrlState(readInventionsUrlState());
  applyFilters();

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
    var clearChip = document.querySelector(
      ".tools-bar--inventions [data-search-filter-clear]"
    );
    if (clearChip) {
      clearChip.addEventListener("click", function () {
        searchInput.value = "";
        applyFilters();
        searchInput.focus();
      });
    }
  }

  if (filterCategory) {
    filterCategory.addEventListener("change", applyFilters);
  }

  if (filterPeriod) {
    filterPeriod.addEventListener("change", applyFilters);
  }

  document.addEventListener("kt-catalog-filter-change", function () {
    applyFilters();
  });

  document.querySelectorAll(".sel-clear").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (window.KT_CATALOG_MULTI_FILTER) {
        window.KT_CATALOG_MULTI_FILTER.clear(btn.dataset.for);
      } else {
        var el = document.getElementById(btn.dataset.for);
        if (el) {
          el.value = "";
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
      applyFilters();
    });
  });

  if (clearFilters) {
    clearFilters.addEventListener("click", function () {
      clearFilterInputs();
      applyFilters();
    });
  }

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
        heading.textContent = head.textContent;
        section.appendChild(heading);
      }
      var grid = document.createElement("div");
      grid.className = "inventions-card-grid";
      Array.prototype.forEach.call(
        cat.querySelectorAll(".inventions-entry"),
        function (entry) {
          var nameEl = entry.querySelector(".inventions-entry-name");
          var numEl = entry.querySelector(".inventions-entry-num");
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
          if (numEl) {
            var num = document.createElement("p");
            num.className = "inventions-card__num";
            num.textContent = numEl.textContent;
            body.appendChild(num);
          }
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
          card.addEventListener("click", function (e) {
            e.preventDefault();
            setInventionsView("list");
            scrollToSection(entry.id);
          });
          grid.appendChild(card);
          cardById[entry.id] = card;
        }
      );
      section.appendChild(grid);
      cardsHost.appendChild(section);
    });
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
  }

  buildCards();
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
