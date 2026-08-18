/**
 * Collapsible filter panel for Knowledge Treasury catalog toolbars (all viewports).
 * Shared by prominent figures and inventions research pages.
 */
(function (window) {
  "use strict";

  var STORAGE_PREFIX = "kt-catalog-filters-open";

  function storageKey() {
    var pageId =
      document.documentElement.getAttribute("data-kt-page-id") || "catalog";
    return STORAGE_PREFIX + ":" + pageId;
  }

  function labels() {
    var lang =
      document.documentElement.getAttribute("data-kt-lang") ||
      document.documentElement.lang ||
      "az";
    if (lang === "en") {
      return {
        open: "Show filters",
        close: "Hide filters",
      };
    }
    return {
      open: "Filtrləri göstər",
      close: "Filtrləri gizlət",
    };
  }

  function filterSelectIds() {
    var pageId =
      document.documentElement.getAttribute("data-kt-page-id") || "";
    if (pageId === "prominent-figures" || pageId === "encyclopedia") {
      return [
        "filterCategory",
        "filterPeriod",
        "filterField",
        "filterCountry",
      ];
    }
    if (
      pageId === "discoveries-and-inventions" ||
      pageId === "scientific-inventions-research"
    ) {
      return ["filterCategory", "filterPeriod"];
    }
    return ["filterCountry", "filterIxtilas", "filterDegree"];
  }

  function searchInputId() {
    var pageId =
      document.documentElement.getAttribute("data-kt-page-id") || "";
    if (
      pageId === "discoveries-and-inventions" ||
      pageId === "scientific-inventions-research"
    ) {
      if (document.getElementById("researchSearch")) return "researchSearch";
      if (document.getElementById("inventionsSearch")) return "inventionsSearch";
    }
    return "searchInput";
  }

  function activeFilterCount(root) {
    var count = 0;
    var search = root.querySelector("#" + searchInputId());
    if (search && search.value.trim()) count += 1;
    filterSelectIds().forEach(function (id) {
      if (window.KT_CATALOG_MULTI_FILTER) {
        if (window.KT_CATALOG_MULTI_FILTER.isActive(id)) count += 1;
        return;
      }
      var el = root.querySelector("#" + id);
      if (el && el.value) count += 1;
    });
    return count;
  }

  function updateBadge(toolbar, badge) {
    if (!badge) return;
    var n = activeFilterCount(toolbar);
    if (n > 0) {
      badge.textContent = String(n);
      badge.removeAttribute("hidden");
    } else {
      badge.textContent = "";
      badge.setAttribute("hidden", "");
    }
    toolbar.classList.toggle("has-active-filters", n > 0);
  }

  function setOpen(toolbar, toggle, open, persist) {
    toolbar.classList.toggle("is-filters-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    var L = labels();
    toggle.setAttribute("aria-label", open ? L.close : L.open);
    if (persist) {
      try {
        sessionStorage.setItem(storageKey(), open ? "1" : "0");
      } catch (e) { /* ignore */ }
    }
  }

  function readPersistedOpen() {
    try {
      return sessionStorage.getItem(storageKey()) === "1";
    } catch (e) {
      return false;
    }
  }

  function initialOpenState() {
    return readPersistedOpen();
  }

  function initToolbar(toolbar) {
    if (toolbar.getAttribute("data-kt-toolbar-mobile") === "1") return;

    var toggle = toolbar.querySelector(".catalog-toolbar__toggle");
    var panel = toolbar.querySelector("#catalogFilterPanel");
    var badge = toolbar.querySelector(".catalog-toolbar__badge");
    if (!toggle || !panel) return;

    toolbar.setAttribute("data-kt-toolbar-mobile", "1");
    if (!toolbar.classList.contains("catalog-toolbar")) {
      toolbar.classList.add("catalog-toolbar");
    }

    function syncBadge() {
      updateBadge(toolbar, badge);
    }

    setOpen(toolbar, toggle, initialOpenState(), false);
    syncBadge();

    toggle.addEventListener("click", function () {
      var open = !toolbar.classList.contains("is-filters-open");
      setOpen(toolbar, toggle, open, true);
    });

    ["input", "change"].forEach(function (evt) {
      toolbar.addEventListener(
        evt,
        function (e) {
          if (!e.target || !e.target.id) return;
          if (
            e.target.id === searchInputId() ||
            filterSelectIds().indexOf(e.target.id) >= 0
          ) {
            syncBadge();
          }
        },
        true
      );
    });

    document.addEventListener("kt-catalog-filter-change", syncBadge);

    toolbar.addEventListener("click", function (e) {
      var target = e.target;
      if (!target || !target.closest) return;
      if (
        target.closest(".sel-clear") ||
        target.closest("#clearFilters") ||
        target.closest("#clearEncyclopediaFilters")
      ) {
        window.setTimeout(syncBadge, 0);
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toolbar.classList.contains("is-filters-open")) {
        setOpen(toolbar, toggle, false, true);
        toggle.focus();
      }
    });

    toolbar._ktSyncFilterBadge = syncBadge;
  }

  function boot() {
    document.querySelectorAll(".toolbar.catalog-toolbar").forEach(initToolbar);
  }

  function runBoot() {
    boot();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runBoot);
  } else {
    runBoot();
  }

  document.addEventListener("kt-catalog-ready", runBoot);

  window.KT_SCIENTISTS_TOOLBAR = {
    initToolbar: initToolbar,
    syncAll: function () {
      document.querySelectorAll(".toolbar.catalog-toolbar").forEach(function (tb) {
        if (typeof tb._ktSyncFilterBadge === "function") {
          tb._ktSyncFilterBadge();
        }
      });
    },
  };
})(typeof window !== "undefined" ? window : this);
