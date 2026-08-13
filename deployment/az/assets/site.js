
(() => {
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
    navToggle.setAttribute("aria-label", "Menyunu aç");
    resetMobileNavSections();
  };

  const openMobileNav = () => {
    if (!header || !navToggle || !dropdowns.length) return;
    resetMobileNavSections();
    header.classList.add("is-nav-open");
    document.body.classList.add("nav-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Menyunu bağla");
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
      if (index || loading) return loading;
      if (Array.isArray(window.__BIRINCI_SEARCH__)) {
        index = window.__BIRINCI_SEARCH__;
        if (status) status.textContent = `${index.length} hekayə`;
        if (lastQuery) render(lastQuery);
        return Promise.resolve(index);
      }
      const url = root.getAttribute("data-search-index");
      if (!url) return null;
      if (status) status.textContent = "İndeks yüklənir…";
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
          if (status) status.textContent = lastQuery ? status.textContent : `${index.length} hekayə`;
          if (lastQuery) render(lastQuery);
        })
        .catch(() => {
          index = [];
          if (status) {
            status.textContent =
              "Axtarış indeksi yüklənmədi. Saytı http://localhost:8765/az/ ünvanından açın.";
          }
        })
        .finally(() => {
          loading = null;
        });
      return loading;
    };

    const render = (query) => {
      lastQuery = query;
      const q = query.trim().toLocaleLowerCase("az");
      results.innerHTML = "";
      if (!q) {
        if (status) status.textContent = index ? `${index.length} hekayə` : "";
        return;
      }
      if (!index) {
        if (status) status.textContent = "İndeks yüklənir…";
        return;
      }
      const matches = index.filter((row) => row.hay.includes(q)).slice(0, 40);
      if (status) {
        status.textContent = matches.length
          ? `${matches.length} nəticə`
          : "Uyğun hekayə tapılmadı.";
      }
      const inCategories = window.location.pathname.includes("/categories/");
      const homeListBase = inCategories ? "../index.html" : "index.html";
      matches.forEach((row) => {
        const a = document.createElement("a");
        a.className = "global-search__item";
        a.href = `${homeListBase}?view=list#${encodeURIComponent(row.stem)}`;
        a.innerHTML =
          `<span class="global-search__item-title"></span>` +
          `<span class="global-search__item-meta"></span>`;
        a.querySelector(".global-search__item-title").textContent = row.title;
        a.querySelector(".global-search__item-meta").textContent = row.category;
        a.addEventListener("click", closeSearch);
        results.appendChild(a);
      });
    };

    const kbdHint = toggle.querySelector(".global-search-toggle__kbd");
    if (kbdHint && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || "")) {
      kbdHint.textContent = "⌘K";
      toggle.title = "Axtar (⌘K)";
      toggle.setAttribute("aria-label", "Qlobal axtarış, Command+K");
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
    String(a || "").localeCompare(String(b || ""), "az", { sensitivity: "base" });

  const initCategoryTools = () => {
    if (!document.body.classList.contains("page-category")) return;
    const bar = document.querySelector('[data-tools="category"]');
    const list = document.querySelector("[data-tools-list]");
    const empty = document.querySelector("[data-tools-empty]");
    if (!bar || !list) return;

    const searchInput = bar.querySelector("[data-tools-search]");
    if (!searchInput) return;

    const imagesToggle = bar.querySelector("[data-tools-images]");
    const imagesBtns = Array.from(bar.querySelectorAll("[data-images-mode]"));
    const textsToggle = bar.querySelector("[data-tools-texts]");
    const textsBtns = Array.from(bar.querySelectorAll("[data-texts-mode]"));
    const batchSizeInput = bar.querySelector("[data-home-batch-size]");
    const batchPrevBtn = bar.querySelector('[data-home-batch="prev"]');
    const batchNextBtn = bar.querySelector('[data-home-batch="next"]');
    const batchRandomBtn = bar.querySelector('[data-home-batch="random"]');
    const batchAllBtn = bar.querySelector('[data-home-batch="all"]');
    const batchRangeEl = bar.querySelector("[data-home-batch-range]");
    const navList = document.querySelector("[data-tools-nav]");
    const countEl = document.querySelector("[data-tools-count]");
    const batchSizeStorageKey = "birinci-category-batch-size";
    const batchAllStorageKey = "birinci-category-batch-all";
    const legacyPageSizeStorageKey = "birinci-category-page-size";

    const allStories = Array.from(list.querySelectorAll(".story"));
    allStories.sort((a, b) => localeCompareAz(a.dataset.title, b.dataset.title));
    allStories.forEach((story) => list.appendChild(story));
    if (navList) {
      const navItems = Array.from(navList.querySelectorAll("li[data-stem]"));
      navItems.sort((a, b) => localeCompareAz(a.dataset.title, b.dataset.title));
      navItems.forEach((item) => navList.appendChild(item));
    }

    let filtered = [];
    let batchSize = 10;
    let windowStart = 0;
    let randomStems = null;
    let allMode = true;
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
      if (!raw) return batchSize || 10;
      const n = Number(raw);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : batchSize || 10;
    };

    const persistBatchSize = () => {
      try {
        if (allMode || !inputRaw()) {
          localStorage.removeItem(batchSizeStorageKey);
          localStorage.removeItem(legacyPageSizeStorageKey);
        } else {
          localStorage.setItem(batchSizeStorageKey, String(batchSize));
          localStorage.removeItem(legacyPageSizeStorageKey);
        }
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
        batchSizeInput.value = allMode ? "" : String(batchSize);
      }
      const showingAll =
        total > 0 &&
        !randomStems &&
        (allMode || (windowStart <= 0 && visibleCount >= total && visibleCount > 0));
      const atStart = !randomStems && !allMode && windowStart <= 0;
      const atEnd =
        !randomStems && (allMode || total === 0 || windowStart + batchSize >= total);
      const needsSize = allMode || !inputRaw();
      if (batchPrevBtn) batchPrevBtn.disabled = total === 0 || needsSize || atStart;
      if (batchNextBtn) batchNextBtn.disabled = total === 0 || needsSize || atEnd;
      if (batchRandomBtn) batchRandomBtn.disabled = total === 0 || needsSize;
      const hintEl = bar.querySelector("[data-batch-hint]");
      if (hintEl) {
        const showHint = total > 0 && needsSize;
        hintEl.hidden = !showHint;
        if (showHint) hintEl.removeAttribute("hidden");
        else hintEl.setAttribute("hidden", "");
      }
      if (batchAllBtn) {
        batchAllBtn.disabled = total === 0;
        batchAllBtn.classList.toggle("is-active", showingAll);
        batchAllBtn.setAttribute("aria-pressed", showingAll ? "true" : "false");
        batchAllBtn.setAttribute("aria-disabled", showingAll || total === 0 ? "true" : "false");
      }
      if (batchRangeEl) {
        if (total === 0) {
          batchRangeEl.hidden = true;
          batchRangeEl.textContent = "";
        } else if (randomStems) {
          batchRangeEl.hidden = false;
          batchRangeEl.textContent = `Təsadüfi · ${visibleCount} / ${total}`;
        } else if (allMode || showingAll) {
          batchRangeEl.hidden = false;
          batchRangeEl.textContent = `1–${total} / ${total}`;
        } else {
          const from = windowStart + 1;
          const to = windowStart + visibleCount;
          batchRangeEl.hidden = false;
          batchRangeEl.textContent = `${from}–${to} / ${total}`;
        }
      }
    };

    const commitBatchSize = ({ persist = true, render = false, resetWindow = false } = {}) => {
      const cap = batchCap();
      const raw = inputRaw();
      if (!raw) {
        allMode = true;
        randomStems = null;
        windowStart = 0;
        if (batchSizeInput) batchSizeInput.value = "";
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
        return;
      }
      let n = Number(raw);
      if (!Number.isFinite(n) || n < 1) n = 1;
      n = Math.min(Math.floor(n), cap);
      if (n < 1) n = 1;
      if (batchSizeInput) batchSizeInput.value = String(n);
      batchSize = n;
      allMode = false;
      if (resetWindow) {
        windowStart = 0;
        randomStems = null;
      } else if (randomStems) {
        randomStems = null;
      }
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
      if (storedAll || !stored) {
        allMode = true;
        if (batchSizeInput) batchSizeInput.value = "";
      } else if (Number.isFinite(n) && n > 0) {
        allMode = false;
        batchSize = Math.floor(n);
        if (batchSizeInput) batchSizeInput.value = String(batchSize);
      } else {
        allMode = true;
        if (batchSizeInput) batchSizeInput.value = "";
      }
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
          const btn = story.querySelector("[data-story-figure-toggle]");
          if (!btn) return;
          btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
          const label = btn.querySelector("[data-story-figure-label]");
          if (label) label.textContent = collapsed ? "Şəkli göstər" : "Şəkli gizlət";
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
          const btn = story.querySelector("[data-story-text-toggle]");
          if (!btn) return;
          btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
          const label = btn.querySelector("[data-story-text-label]");
          if (label) label.textContent = collapsed ? "Mətni göstər" : "Mətni gizlət";
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

    const renderList = ({ resetWindow = false } = {}) => {
      if (typeof window.__birinciStopStoryTts === "function") window.__birinciStopStoryTts();
      const q = searchInput.value.trim().toLocaleLowerCase("az");
      filtered = allStories.filter((story) => {
        const textEl = story.querySelector(".story__text");
        const hay = `${story.dataset.title || ""} ${textEl ? textEl.textContent : ""}`.toLocaleLowerCase("az");
        return !q || hay.includes(q);
      });

      const total = filtered.length;
      const cap = Math.max(1, total || 1);
      if (allMode) {
        if (batchSizeInput) batchSizeInput.value = "";
      } else {
        let n = readBatchSize();
        if (!Number.isFinite(n) || n < 1) n = 1;
        if (n > cap) n = cap;
        if (batchSizeInput && String(batchSizeInput.value) !== String(n)) {
          batchSizeInput.value = String(n);
        }
        batchSize = n;
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

      if (typeof window.__birinciSetAllStoryFigures === "function") {
        window.__birinciSetAllStoryFigures(!document.body.classList.contains("images-collapsed"));
      }
      if (typeof window.__birinciSetAllStoryTexts === "function") {
        window.__birinciSetAllStoryTexts(!document.body.classList.contains("texts-collapsed"));
      }
      refreshSidebarNav(visibleStories);
      if (countEl) countEl.textContent = String(total);
      if (empty) empty.hidden = total !== 0;
      syncBatchUi(visibleStories.length);
      persistAllMode();
      if (pendingStem) {
        const el = document.getElementById(pendingStem);
        if (el) {
          window.requestAnimationFrame(() => {
            el.scrollIntoView({ block: "start", behavior: "auto" });
          });
        }
        pendingStem = null;
      }
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
        allMode = true;
        if (batchSizeInput) batchSizeInput.value = "";
        persistBatchSize();
        persistAllMode();
        renderList();
        return;
      }
      if (action === "all") {
        if (allMode) {
          syncBatchUi(filtered.length);
          return;
        }
        allMode = true;
        randomStems = null;
        windowStart = 0;
        if (batchSizeInput) batchSizeInput.value = "";
        persistBatchSize();
        persistAllMode();
        pendingStem = null;
        renderList();
        scrollToolsIntoView();
        return;
      }
      if (!inputRaw()) {
        // Require an explicit count — never invent a default like 10.
        syncBatchUi((filtered && filtered.length) || 0);
        return;
      }
      commitBatchSize({ persist: true, render: false });
      allMode = false;
      if (action === "prev") {
        randomStems = null;
        windowStart = Math.max(0, windowStart - batchSize);
      } else if (action === "next") {
        randomStems = null;
        if (windowStart + batchSize < total) {
          windowStart += batchSize;
        }
      } else if (action === "random") {
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
    if (batchPrevBtn) batchPrevBtn.addEventListener("click", () => runBatchAction("prev"));
    if (batchNextBtn) batchNextBtn.addEventListener("click", () => runBatchAction("next"));
    if (batchRandomBtn) batchRandomBtn.addEventListener("click", () => runBatchAction("random"));
    if (batchAllBtn) batchAllBtn.addEventListener("click", () => runBatchAction("all"));

    try {
      const hash = decodeURIComponent((window.location.hash || "").replace(/^#/, ""));
      if (hash) pendingStem = hash;
    } catch (_) {}

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
        history.pushState(null, "", `#${id}`);
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
    const batchPrevBtn = bar.querySelector('[data-home-batch="prev"]');
    const batchNextBtn = bar.querySelector('[data-home-batch="next"]');
    const batchRandomBtn = bar.querySelector('[data-home-batch="random"]');
    const batchAllBtn = bar.querySelector('[data-home-batch="all"]');
    const batchRangeEl = bar.querySelector("[data-home-batch-range]");
    const viewBtns = Array.from(bar.querySelectorAll("[data-home-view]"));
    const listOnly = Array.from(bar.querySelectorAll("[data-home-list-only]"));
    const storiesUrl = listPanel.getAttribute("data-stories-url") || "data/stories.json";
    const assetVersion = listPanel.getAttribute("data-asset-version") || "";
    const viewStorageKey = "birinci-home-view";
    const batchSizeStorageKey = "birinci-home-batch-size";
    const batchAllStorageKey = "birinci-home-batch-all";
    const legacyPageSizeStorageKey = "birinci-home-page-size";

    let view = "cards";
    let allStories = null;
    let filtered = [];
    let loading = null;
    let pendingStem = null;
    let batchSize = 10;
    let windowStart = 0;
    let randomStems = null;
    let allMode = true;

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
      if (!raw) return batchSize || 10;
      const n = Number(raw);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : batchSize || 10;
    };

    const persistBatchSize = () => {
      try {
        if (allMode || !inputRaw()) {
          localStorage.removeItem(batchSizeStorageKey);
          localStorage.removeItem(legacyPageSizeStorageKey);
        } else {
          localStorage.setItem(batchSizeStorageKey, String(batchSize));
          localStorage.removeItem(legacyPageSizeStorageKey);
        }
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
        batchSizeInput.value = allMode ? "" : String(batchSize);
      }
      const showingAll =
        total > 0 &&
        !randomStems &&
        (allMode || (windowStart <= 0 && visibleCount >= total && visibleCount > 0));
      const atStart = !randomStems && !allMode && windowStart <= 0;
      const atEnd =
        !randomStems && (allMode || total === 0 || windowStart + batchSize >= total);
      const needsSize = allMode || !inputRaw();
      if (batchPrevBtn) batchPrevBtn.disabled = total === 0 || needsSize || atStart;
      if (batchNextBtn) batchNextBtn.disabled = total === 0 || needsSize || atEnd;
      if (batchRandomBtn) batchRandomBtn.disabled = total === 0 || needsSize;
      const hintEl = bar.querySelector("[data-batch-hint]");
      if (hintEl) {
        const showHint = total > 0 && needsSize;
        hintEl.hidden = !showHint;
        if (showHint) hintEl.removeAttribute("hidden");
        else hintEl.setAttribute("hidden", "");
      }
      if (batchAllBtn) {
        batchAllBtn.disabled = total === 0;
        batchAllBtn.classList.toggle("is-active", showingAll);
        batchAllBtn.setAttribute("aria-pressed", showingAll ? "true" : "false");
        batchAllBtn.setAttribute("aria-disabled", showingAll || total === 0 ? "true" : "false");
      }
      if (batchRangeEl) {
        if (total === 0) {
          batchRangeEl.hidden = true;
          batchRangeEl.textContent = "";
        } else if (randomStems) {
          batchRangeEl.hidden = false;
          batchRangeEl.textContent = `Təsadüfi · ${visibleCount} / ${total}`;
        } else if (allMode || showingAll) {
          batchRangeEl.hidden = false;
          batchRangeEl.textContent = `1–${total} / ${total}`;
        } else {
          const from = windowStart + 1;
          const to = windowStart + visibleCount;
          batchRangeEl.hidden = false;
          batchRangeEl.textContent = `${from}–${to} / ${total}`;
        }
      }
    };

    const commitBatchSize = ({ persist = true, render = false, resetWindow = false } = {}) => {
      const cap = batchCap();
      const raw = inputRaw();
      if (!raw) {
        allMode = true;
        randomStems = null;
        windowStart = 0;
        if (batchSizeInput) batchSizeInput.value = "";
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
        return;
      }
      let n = Number(raw);
      if (!Number.isFinite(n) || n < 1) n = 1;
      n = Math.min(Math.floor(n), cap);
      if (n < 1) n = 1;
      if (batchSizeInput) batchSizeInput.value = String(n);
      batchSize = n;
      allMode = false;
      if (resetWindow) {
        windowStart = 0;
        randomStems = null;
      } else if (randomStems) {
        randomStems = null;
      }
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

    const applyStoredBatchSize = () => {
      try {
        // One-time: older home builds always persisted a numeric size (often 10).
        // Align with category empty→all default for returning visitors.
        if (!localStorage.getItem("birinci-home-batch-empty-default")) {
          localStorage.setItem("birinci-home-batch-empty-default", "1");
          localStorage.removeItem(batchSizeStorageKey);
          localStorage.removeItem(legacyPageSizeStorageKey);
        }
      } catch (_) {}
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
      if (storedAll || !stored) {
        allMode = true;
        if (batchSizeInput) batchSizeInput.value = "";
      } else if (Number.isFinite(n) && n > 0) {
        allMode = false;
        batchSize = Math.floor(n);
        if (batchSizeInput) batchSizeInput.value = String(batchSize);
      } else {
        allMode = true;
        if (batchSizeInput) batchSizeInput.value = "";
      }
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
      };
    };

    const writeUrlState = () => {
      try {
        const params = new URLSearchParams();
        if (view === "list") params.set("view", "list");
        const q = searchInput.value.trim();
        if (view === "list" && q) params.set("q", q);
        const url = new URL(window.location.href);
        url.search = params.toString();
        url.hash = pendingStem ? pendingStem : "";
        history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
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
          const btn = story.querySelector("[data-story-figure-toggle]");
          if (!btn) return;
          btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
          const label = btn.querySelector("[data-story-figure-label]");
          if (label) label.textContent = collapsed ? "Şəkli göstər" : "Şəkli gizlət";
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
          const btn = story.querySelector("[data-story-text-toggle]");
          if (!btn) return;
          btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
          const label = btn.querySelector("[data-story-text-label]");
          if (label) label.textContent = collapsed ? "Mətni göstər" : "Mətni gizlət";
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
      const q = searchInput.value.trim().toLocaleLowerCase("az");
      const items = Array.from(cardsList.querySelectorAll(".cat-card"));
      items.sort((a, b) => localeCompareAz(a.dataset.title, b.dataset.title));
      items.forEach((item) => cardsList.appendChild(item));
      let visible = 0;
      items.forEach((item) => {
        const hay = `${item.dataset.title || ""} ${item.dataset.blurb || ""}`.toLocaleLowerCase("az");
        const show = !q || hay.includes(q);
        item.hidden = !show;
        if (show) visible += 1;
      });
      if (cardsEmpty) cardsEmpty.hidden = visible !== 0;
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
            hay: `${story.title || ""} ${(story.paragraphs || []).join(" ")}`.toLocaleLowerCase("az"),
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
          return loadCatalogViaScript().catch(() =>
            fetch(storiesUrl).then((res) => {
              if (!res.ok) throw new Error("fetch-failed");
              return res.json();
            })
          );
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

    const paragraphsHtml = (paragraphs) => {
      if (!paragraphs.length) return "";
      return paragraphs
        .map((p, i) => {
          const cls = i === paragraphs.length - 1 ? ' class="story__moral"' : "";
          return `<p${cls}>${escapeHtml(p)}</p>`;
        })
        .join("");
    };

    const storyArticleHtml = (story) => {
      const audioAttr = story.hasAudio
        ? ` data-audio="audio/${escapeHtml(story.stem)}.mp3?v=${escapeHtml(assetVersion)}"`
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
          <button type="button" class="story-tts" data-story-tts aria-pressed="false">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg>
            <span data-story-tts-label>Mətni dinlə</span>
          </button>
          <button type="button" class="story-text-toggle" data-story-text-toggle aria-expanded="true" aria-controls="text-${escapeHtml(story.stem)}">
            <span data-story-text-label>Mətni gizlət</span>
          </button>
          <button type="button" class="story-figure-toggle" data-story-figure-toggle aria-expanded="true" aria-controls="figure-${escapeHtml(story.stem)}">
            <span data-story-figure-label>Şəkli gizlət</span>
          </button>
          <p class="story-tts__note" data-story-tts-note hidden></p>
        </div>
        <div class="story__text card-text" id="text-${escapeHtml(story.stem)}">
          ${paragraphsHtml(story.paragraphs)}
        </div>
      </div>
    </div>
    <figure class="story__figure" id="figure-${escapeHtml(story.stem)}">
      <button type="button" class="story__figure-open" aria-label="${escapeHtml(story.title)} şəklini böyüt">
        <img src="illustrations/${escapeHtml(story.stem)}.webp" alt="${escapeHtml(story.title)} illüstrasiyası" loading="lazy" width="1536" height="1024" />
      </button>
    </figure>
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

    const renderList = ({ resetWindow = false } = {}) => {
      if (!storiesList) return;
      if (typeof window.__birinciStopStoryTts === "function") window.__birinciStopStoryTts();
      const q = searchInput.value.trim().toLocaleLowerCase("az");
      filtered = (allStories || []).filter((story) => !q || story.hay.includes(q));
      filtered.sort((a, b) => localeCompareAz(a.title, b.title));

      const total = filtered.length;
      const cap = Math.max(1, total || 1);
      if (allMode) {
        if (batchSizeInput) batchSizeInput.value = "";
      } else {
        let n = readBatchSize();
        if (!Number.isFinite(n) || n < 1) n = 1;
        if (n > cap) n = cap;
        if (batchSizeInput && String(batchSizeInput.value) !== String(n)) {
          batchSizeInput.value = String(n);
        }
        batchSize = n;
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

      storiesList.innerHTML = visibleStories.map(storyArticleHtml).join("");
      if (typeof window.__birinciSetAllStoryFigures === "function") {
        window.__birinciSetAllStoryFigures(!document.body.classList.contains("images-collapsed"));
      }
      if (typeof window.__birinciSetAllStoryTexts === "function") {
        window.__birinciSetAllStoryTexts(!document.body.classList.contains("texts-collapsed"));
      }
      refreshSidebarNav(visibleStories);
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
    };

    const setHidden = (el, hide) => {
      if (!el) return;
      el.hidden = !!hide;
      if (hide) el.setAttribute("hidden", "");
      else el.removeAttribute("hidden");
    };

    const setView = (nextView, { persist = true } = {}) => {
      const prevView = view;
      view = nextView === "list" ? "list" : "cards";
      window.__birinciHomeView = view;
      // Panels first — never gated on fetch / history / TTS.
      setHidden(cardsPanel, view !== "cards");
      setHidden(listPanel, view !== "list");
      viewBtns.forEach((btn) => {
        btn.setAttribute("aria-pressed", btn.getAttribute("data-home-view") === view ? "true" : "false");
      });
      listOnly.forEach((el) => {
        setHidden(el, view !== "list");
      });
      if (persist) {
        try {
          localStorage.setItem(viewStorageKey, view);
        } catch (_) {}
      }
      if (view === "cards") {
        if (typeof window.__birinciStopStoryTts === "function") window.__birinciStopStoryTts();
        applyCards();
        writeUrlState();
        return;
      }
      writeUrlState();
      try {
        bindHomeNav();
      } catch (_) {}
      const scrollToTools = () => {
        if (typeof window.__birinciScrollHomeTools === "function") {
          window.__birinciScrollHomeTools();
          return;
        }
        window.scrollTo(0, 0);
      };
      ensureStories()
        .then(() => {
          renderList();
          if (prevView !== "list") scrollToTools();
        })
        .catch(() => {
          if (listEmpty) listEmpty.hidden = false;
          if (prevView !== "list") scrollToTools();
        });
      if (prevView !== "list") scrollToTools();
    };

    const onViewButton = (event) => {
      const btn = event.target.closest("[data-home-view]");
      if (!btn || !bar.contains(btn)) return;
      const next = btn.getAttribute("data-home-view");
      if (next !== "list" && next !== "cards") return;
      // Re-apply even if already selected so a stalled list can recover.
      pendingStem = null;
      setView(next);
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
      if (!total) {
        allMode = true;
        if (batchSizeInput) batchSizeInput.value = "";
        persistBatchSize();
        persistAllMode();
        renderList();
        return;
      }
      if (action === "all") {
        if (allMode) {
          syncBatchUi(filtered.length);
          return;
        }
        allMode = true;
        randomStems = null;
        windowStart = 0;
        if (batchSizeInput) batchSizeInput.value = "";
        persistBatchSize();
        persistAllMode();
        pendingStem = null;
        renderList();
        if (typeof window.__birinciScrollHomeTools === "function") {
          window.__birinciScrollHomeTools();
        }
        return;
      }
      if (!inputRaw()) {
        // Require an explicit count — never invent a default like 10.
        syncBatchUi((filtered && filtered.length) || 0);
        return;
      }
      commitBatchSize({ persist: true, render: false });
      allMode = false;
      if (action === "prev") {
        randomStems = null;
        windowStart = Math.max(0, windowStart - batchSize);
      } else if (action === "next") {
        randomStems = null;
        if (windowStart + batchSize < total) {
          windowStart += batchSize;
        }
      } else if (action === "random") {
        randomStems = pickRandomStems(batchSize);
      } else {
        return;
      }
      persistBatchSize();
      persistAllMode();
      pendingStem = null;
      renderList();
      if (typeof window.__birinciScrollHomeTools === "function") {
        window.__birinciScrollHomeTools();
      }
    };
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

    try {
      setView(initialView, { persist: false });
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
    let fetchController = null;

    const setLabel = (btn, text) => {
      const label = btn.querySelector("[data-story-tts-label]");
      if (label) label.textContent = text;
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

    const syncPlayingUi = (btn, playing) => {
      const stem = stemFor(btn) || activeStem;
      buttonsForStem(stem, btn).forEach((el) => {
        el.setAttribute("aria-pressed", playing ? "true" : "false");
        setLabel(el, playing ? "Dayandır" : "Mətni dinlə");
      });
    };

    const syncPausedUi = (btn) => {
      const stem = stemFor(btn) || activeStem;
      buttonsForStem(stem, btn).forEach((el) => {
        el.setAttribute("aria-pressed", "false");
        setLabel(el, "Davam et");
      });
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

    const hidePlayerShell = () => {
      if (!playerShell) return;
      playerShell.hidden = true;
      playerShell.setAttribute("hidden", "");
      document.body.classList.remove("audio-player-open");
    };

    const showPlayerShell = () => {
      if (!playerShell) return;
      playerShell.hidden = false;
      playerShell.removeAttribute("hidden");
      document.body.classList.add("audio-player-open");
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

    const closePlayer = () => {
      suppressError = true;
      loadToken += 1;
      stopAudioElement({ clearSrc: true });
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      clearActive();
      hidePlayerShell();
      updatePlayButton(false);
      updateProgressUi();
      window.setTimeout(() => {
        suppressError = false;
      }, 120);
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
      return activeBtn === btn;
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

    const pickVoice = (voices) =>
      voices.find((v) => (v.lang || "").toLowerCase().startsWith("az")) ||
      voices.find((v) => /azərbaycan|azerbaijani/i.test(v.name || "")) ||
      voices.find((v) => (v.lang || "").toLowerCase().startsWith("tr")) ||
      voices.find((v) => /turkish|türk/i.test(v.name || "")) ||
      null;

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
      if (title && body.toLocaleLowerCase("az").startsWith(title.toLocaleLowerCase("az"))) {
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
            <button type="button" class="audio-player__btn" data-audio-skip-back aria-label="15 saniyə geriyə">−15</button>
            <button type="button" class="audio-player__btn audio-player__btn--play" data-audio-play aria-label="Oynat" aria-pressed="false"></button>
            <button type="button" class="audio-player__btn" data-audio-skip-fwd aria-label="15 saniyə irəli">+15</button>
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

      playerEls.playBtn.addEventListener("click", () => {
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
      });
      audioPlayer.addEventListener("pause", () => {
        if (audioPlayer && !audioPlayer.ended && activeBtn) syncPausedUi(activeBtn);
        updatePlayButton(false);
      });
      audioPlayer.addEventListener("ended", () => {
        updatePlayButton(false);
        updateProgressUi();
        if (activeBtn) syncPausedUi(activeBtn);
      });
      audioPlayer.addEventListener("error", () => {
        if (suppressError) return;
        const btn = activeBtn;
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
      if (playerEls.title) playerEls.title.textContent = title || "Hekayə";
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

    const speakStory = async (btn) => {
      if (!("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance !== "function") {
        showNote(btn, unsupportedMessage);
        return;
      }

      const story = resolveStory(btn);
      const text = textForSpeech(story);
      if (!text) {
        showNote(btn, failedMessage);
        return;
      }

      const voices = await loadVoices();
      const voice = pickVoice(voices);
      if (!voice) {
        stopSpeech();
        showNote(btn, noVoiceMessage);
        return;
      }

      closePlayer();
      markPlaying(btn, true);

      const startSpeak = () => {
        utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = (voice.lang || "az-AZ").startsWith("tr") ? "tr-TR" : "az-AZ";
        utterance.voice = voice;
        utterance.rate = 1;
        utterance.pitch = 1;

        utterance.onstart = () => markPlaying(btn, true);
        utterance.onend = () => clearActive();
        utterance.onerror = () => {
          if (suppressError) return;
          clearActive();
          showNote(btn, failedMessage);
        };

        try {
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          clearActive();
          showNote(btn, unsupportedMessage);
        }
      };

      window.setTimeout(startSpeak, 60);
    };

    document.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-story-tts]");
      if (!btn) return;
      event.preventDefault();
      event.stopPropagation();
      if (Date.now() < ignoreClicksUntil) return;

      const story = resolveStory(btn);
      const audioSrc = story && story.dataset.audio;
      const same = isSameStoryActive(btn);

      if (audioSrc) {
        ensurePlayer();
        if (same && audioPlayer && !audioPlayer.paused && !audioPlayer.ended) {
          audioPlayer.pause();
          return;
        }
        playAudioStory(btn, audioSrc, story);
        return;
      }

      if (same && isActivelyPlaying()) {
        stopSpeech();
        showNote(btn, "");
        return;
      }
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
        <div class="illustration-lightbox__dialog" role="dialog" aria-modal="true" aria-label="Böyüdülmüş illüstrasiya">
          <button type="button" class="illustration-lightbox__close" aria-label="Bağla">&times;</button>
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
    let ttsNote = null;
    let lastFocus = null;

    const ensureOverlay = () => {
      if (overlay) return overlay;
      overlay = document.createElement("div");
      overlay.className = "text-lightbox";
      overlay.hidden = true;
      overlay.setAttribute("hidden", "");
      overlay.innerHTML = `
        <div class="text-lightbox__dialog" role="dialog" aria-modal="true" aria-label="Böyüdülmüş hekayə mətni">
          <button type="button" class="text-lightbox__close" aria-label="Bağla">&times;</button>
          <div class="text-lightbox__header">
            <h2 class="text-lightbox__title"></h2>
          </div>
          <div class="text-lightbox__tts">
            <button type="button" class="story-tts" data-story-tts data-lightbox-tts aria-pressed="false">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
              <span data-story-tts-label>Mətni dinlə</span>
            </button>
            <p class="story-tts__note" data-story-tts-note hidden></p>
          </div>
          <div class="text-lightbox__body"></div>
        </div>
      `.trim();
      document.body.appendChild(overlay);
      titleEl = overlay.querySelector(".text-lightbox__title");
      bodyEl = overlay.querySelector(".text-lightbox__body");
      closeBtn = overlay.querySelector(".text-lightbox__close");
      ttsBtn = overlay.querySelector("[data-lightbox-tts]");
      ttsNote = overlay.querySelector("[data-story-tts-note]");
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) close();
      });
      if (closeBtn) closeBtn.addEventListener("click", close);
      return overlay;
    };

    const resetTtsUi = () => {
      if (!ttsBtn) return;
      ttsBtn.setAttribute("aria-pressed", "false");
      ttsBtn.removeAttribute("data-story-stem");
      const label = ttsBtn.querySelector("[data-story-tts-label]");
      if (label) label.textContent = "Mətni dinlə";
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
      if (ttsBtn) {
        if (stem) ttsBtn.setAttribute("data-story-stem", stem);
        else ttsBtn.removeAttribute("data-story-stem");
        ttsBtn.setAttribute("aria-pressed", "false");
        const label = ttsBtn.querySelector("[data-story-tts-label]");
        if (label) label.textContent = "Mətni dinlə";
      }
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
        const cardBtn = story.querySelector("[data-story-tts]");
        const pressed = cardBtn && cardBtn.getAttribute("aria-pressed") === "true";
        const pausedLabel =
          cardBtn &&
          (cardBtn.querySelector("[data-story-tts-label]") || {}).textContent === "Davam et";
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
      const btn = story.querySelector("[data-story-figure-toggle]");
      if (!btn) return;
      btn.setAttribute("aria-expanded", visible ? "true" : "false");
      const label = btn.querySelector("[data-story-figure-label]");
      if (label) label.textContent = visible ? "Şəkli gizlət" : "Şəkli göstər";
    };

    const setAllFigures = (visible) => {
      document.querySelectorAll("article.story").forEach((story) => {
        setFigureState(story, visible);
      });
    };

    window.__birinciSetStoryFigure = setFigureState;
    window.__birinciSetAllStoryFigures = setAllFigures;

    document.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-story-figure-toggle]");
      if (!btn) return;
      event.preventDefault();
      const story = btn.closest(".story");
      if (!story) return;
      const visible = btn.getAttribute("aria-expanded") !== "true";
      setFigureState(story, visible);
    });

    setAllFigures(!document.body.classList.contains("images-collapsed"));
  };

  const initStoryTextToggle = () => {
    const setTextState = (story, visible) => {
      if (!story) return;
      story.classList.toggle("story--text-hidden", !visible);
      const btn = story.querySelector("[data-story-text-toggle]");
      if (!btn) return;
      btn.setAttribute("aria-expanded", visible ? "true" : "false");
      const label = btn.querySelector("[data-story-text-label]");
      if (label) label.textContent = visible ? "Mətni gizlət" : "Mətni göstər";
    };

    const setAllTexts = (visible) => {
      document.querySelectorAll("article.story").forEach((story) => {
        setTextState(story, visible);
      });
    };

    window.__birinciSetStoryText = setTextState;
    window.__birinciSetAllStoryTexts = setAllTexts;

    document.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-story-text-toggle]");
      if (!btn) return;
      event.preventDefault();
      const story = btn.closest(".story");
      if (!story) return;
      const visible = btn.getAttribute("aria-expanded") !== "true";
      setTextState(story, visible);
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
  try {
    initHomeViews();
  } catch (err) {
    console.error("initHomeViews failed", err);
  }
  try {
    initStoryTts();
  } catch (err) {
    console.error("initStoryTts failed", err);
  }

  document.querySelectorAll(".category-layout").forEach((layout) => {
    try {
      bindStorySidebarLayout(layout);
    } catch (err) {
      console.error("bindStorySidebarLayout failed", err);
    }
  });
})();
