
(() => {
  const dropdown = document.querySelector(".nav-dropdown");
  if (dropdown) {
    document.addEventListener("click", (event) => {
      if (!dropdown.open) return;
      if (!dropdown.contains(event.target)) dropdown.open = false;
    });
    dropdown.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        dropdown.open = false;
      });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") dropdown.open = false;
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
      matches.forEach((row) => {
        const a = document.createElement("a");
        a.className = "global-search__item";
        a.href = inCategories
          ? `${encodeURIComponent(row.slug)}.html#${encodeURIComponent(row.stem)}`
          : `categories/${encodeURIComponent(row.slug)}.html#${encodeURIComponent(row.stem)}`;
        a.innerHTML =
          `<span class="global-search__item-title"></span>` +
          `<span class="global-search__item-meta"></span>`;
        a.querySelector(".global-search__item-title").textContent = row.title;
        a.querySelector(".global-search__item-meta").textContent = row.category;
        a.addEventListener("click", closeSearch);
        results.appendChild(a);
      });
    };

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

  const initTools = () => {
    const bar = document.querySelector("[data-tools]");
    if (!bar) return;
    const mode = bar.getAttribute("data-tools");
    const searchInput = bar.querySelector("[data-tools-search]");
    const sortSelect = bar.querySelector("[data-tools-sort]");
    const status = bar.querySelector("[data-tools-status]");
    const empty = document.querySelector("[data-tools-empty]");
    const list = document.querySelector("[data-tools-list]");
    const imagesBtn = bar.querySelector("[data-tools-images]");
    const imagesLabel = bar.querySelector("[data-tools-images-label]");
    if (!searchInput || !sortSelect || !list) return;

    if (imagesBtn && mode === "stories") {
      const storageKey = "birinci-images-collapsed";
      const applyImagesState = (collapsed) => {
        document.body.classList.toggle("images-collapsed", collapsed);
        imagesBtn.setAttribute("aria-pressed", collapsed ? "true" : "false");
        if (imagesLabel) {
          imagesLabel.textContent = collapsed ? "Şəkilləri göstər" : "Şəkilləri gizlət";
        }
        try {
          localStorage.setItem(storageKey, collapsed ? "1" : "0");
        } catch (_) {}
      };
      let collapsed = false;
      try {
        collapsed = localStorage.getItem(storageKey) === "1";
      } catch (_) {}
      applyImagesState(collapsed);
      imagesBtn.addEventListener("click", () => {
        applyImagesState(!document.body.classList.contains("images-collapsed"));
      });
    }

    const applyCategories = () => {
      const q = searchInput.value.trim().toLocaleLowerCase("az");
      const sort = sortSelect.value;
      const items = Array.from(list.querySelectorAll(".cat-card"));
      items.sort((a, b) => {
        if (sort === "count-desc" || sort === "count-asc") {
          const ca = Number(a.dataset.count || 0);
          const cb = Number(b.dataset.count || 0);
          return sort === "count-desc" ? cb - ca : ca - cb;
        }
        const cmp = localeCompareAz(a.dataset.title, b.dataset.title);
        return sort === "za" ? -cmp : cmp;
      });
      items.forEach((item) => list.appendChild(item));

      let visible = 0;
      items.forEach((item) => {
        const hay = `${item.dataset.title || ""} ${item.dataset.blurb || ""}`.toLocaleLowerCase("az");
        const show = !q || hay.includes(q);
        item.hidden = !show;
        if (show) visible += 1;
      });
      if (status) status.textContent = `${visible} / ${items.length}`;
      if (empty) empty.hidden = visible !== 0;
    };

    const applyStories = () => {
      const q = searchInput.value.trim().toLocaleLowerCase("az");
      const sort = sortSelect.value;
      const stories = Array.from(list.querySelectorAll(".story"));
      const navList = document.querySelector("[data-tools-nav]");
      const navItems = navList ? Array.from(navList.querySelectorAll("li[data-stem]")) : [];
      const countEl = document.querySelector("[data-tools-count]");

      stories.sort((a, b) => {
        const cmp = localeCompareAz(a.dataset.title, b.dataset.title);
        return sort === "za" ? -cmp : cmp;
      });
      stories.forEach((story) => list.appendChild(story));

      if (navList) {
        navItems.sort((a, b) => {
          const cmp = localeCompareAz(a.dataset.title, b.dataset.title);
          return sort === "za" ? -cmp : cmp;
        });
        navItems.forEach((item) => navList.appendChild(item));
      }

      let visible = 0;
      stories.forEach((story) => {
        const textEl = story.querySelector(".story__text");
        const hay = `${story.dataset.title || ""} ${textEl ? textEl.textContent : ""}`.toLocaleLowerCase("az");
        const show = !q || hay.includes(q);
        story.hidden = !show;
        if (show) visible += 1;
        const navItem = navItems.find((li) => li.dataset.stem === story.dataset.stem);
        if (navItem) navItem.hidden = !show;
      });

      if (status) status.textContent = `${visible} / ${stories.length}`;
      if (countEl) countEl.textContent = String(visible);
      if (empty) empty.hidden = visible !== 0;
    };

    const apply = () => {
      if (mode === "categories") applyCategories();
      else applyStories();
    };

    searchInput.addEventListener("input", apply);
    sortSelect.addEventListener("change", apply);
    apply();
  };

  initTools();

  const nav = document.querySelector(".story-nav");
  if (!nav) return;

  const widget = nav.querySelector(".sidebar-widget");
  const toggle = nav.querySelector(".events-menu-toggle");
  const mobileQuery = window.matchMedia("(max-width: 1060px)");

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
  if (toggle) {
    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleMenu();
    });
  }
  mobileQuery.addEventListener("change", () => {
    if (!mobileQuery.matches) closeMenu();
  });

  const refreshSpyTargets = () => {
    const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
    return links
      .map((link) => {
        const id = decodeURIComponent(link.getAttribute("href").slice(1));
        const el = document.getElementById(id);
        return el ? { link, el } : null;
      })
      .filter(Boolean);
  };

  let storyPairs = refreshSpyTargets();
  if (!storyPairs.length) return;

  const setActive = (activeLink) => {
    nav.querySelectorAll("a").forEach((link) => {
      link.classList.toggle("is-active", link === activeLink);
    });
  };

  nav.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = decodeURIComponent((link.getAttribute("href") || "").slice(1));
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      setActive(link);
      const html = document.documentElement;
      const prevBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";
      target.scrollIntoView({ block: "start", behavior: "auto" });
      html.style.scrollBehavior = prevBehavior;
      history.pushState(null, "", `#${id}`);
      if (mobileQuery.matches) closeMenu();
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const match = storyPairs.find((s) => s.el === visible.target);
      if (match) setActive(match.link);
    },
    { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.25, 0.5] }
  );
  storyPairs.forEach(({ el }) => observer.observe(el));
})();
