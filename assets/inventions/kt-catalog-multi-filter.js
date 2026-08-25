/**
 * Excel-style multi-select filter dropdowns for catalog toolbars.
 * Enhances native <select> elements inside .sel-wrap with checkbox menus.
 */
(function (window) {
  "use strict";

  var instances = Object.create(null);
  var openId = null;
  var SEARCH_MIN = 12;
  var PANEL_GAP = 6;
  var VIEWPORT_PAD = 8;
  var MIN_PANEL_HEIGHT = 120;
  var MAX_LIST_HEIGHT = 320;

  function lang() {
    var raw = (
      document.documentElement.getAttribute("data-kt-lang") ||
      document.documentElement.lang ||
      (document.body && document.body.getAttribute("data-lang")) ||
      "az"
    ).toLowerCase();
    if (raw.indexOf("en") === 0) return "en";
    if (raw.indexOf("ru") === 0) return "ru";
    if (raw.indexOf("ky") === 0) return "ky";
    return "az";
  }

  function strings() {
    var pack = {
      en: {
        selectAll: "Select all",
        search: "Search options…",
        selected: function (n) {
          return n + " selected";
        },
        clear: "Clear filter",
      },
      ru: {
        selectAll: "Выбрать все",
        search: "Поиск по списку…",
        selected: function (n) {
          return "Выбрано: " + n;
        },
        clear: "Сбросить фильтр",
      },
      ky: {
        selectAll: "Баарын тандоо",
        search: "Тизмеден издөө…",
        selected: function (n) {
          return n + " тандалды";
        },
        clear: "Фильтрди тазалоо",
      },
      az: {
        selectAll: "Hamısını seç",
        search: "Seçimləri axtar…",
        selected: function (n) {
          return n + " seçilib";
        },
        clear: "Filtri sil",
      },
    };
    return pack[lang()] || pack.az;
  }

  function parseOptions(select) {
    var placeholder = "";
    var options = [];
    Array.prototype.forEach.call(select.options, function (opt) {
      if (!opt.value) {
        if (!placeholder) placeholder = opt.textContent.trim();
        return;
      }
      options.push({ value: opt.value, label: opt.textContent.trim() });
    });
    return { placeholder: placeholder || select.getAttribute("aria-label") || "Filter", options: options };
  }

  function isFilterActive(state) {
    if (!state || !state.options.length) return false;
    return state.selected.size < state.options.length;
  }

  function getActiveValues(state) {
    if (!state || !state.options.length) return [];
    if (state.selected.size === state.options.length) return [];
    return state.options
      .filter(function (opt) {
        return state.selected.has(opt.value);
      })
      .map(function (opt) {
        return opt.value;
      });
  }

  function passesFilter(state, value) {
    if (!isFilterActive(state)) return true;
    var active = getActiveValues(state);
    if (!active.length) return false;
    return active.indexOf(String(value || "")) >= 0;
  }

  function syncNativeSelect(state) {
    var select = state.select;
    var active = getActiveValues(state);
    if (active.length === 1) {
      select.value = active[0];
    } else {
      select.value = "";
    }
  }

  function updateSummary(state) {
    var active = getActiveValues(state);
    var summary = state.summary;
    var trigger = state.trigger;
    if (!summary || !trigger) return;

    if (!active.length) {
      summary.textContent = "";
      summary.hidden = true;
      trigger.classList.remove("has-selection");
      state.wrap.classList.remove("active");
      return;
    }

    state.wrap.classList.add("active");
    trigger.classList.add("has-selection");
    summary.hidden = false;

    if (active.length === 1) {
      var one = state.options.find(function (o) {
        return o.value === active[0];
      });
      summary.textContent = one ? one.label : active[0];
      return;
    }

    if (active.length <= 2) {
      var labels = active
        .map(function (v) {
          var o = state.options.find(function (x) {
            return x.value === v;
          });
          return o ? o.label : v;
        })
        .join(", ");
      summary.textContent =
        labels.length > 42 ? labels.slice(0, 39) + "…" : labels;
      return;
    }

    summary.textContent = strings().selected(active.length);
  }

  function updateSelectAllCheckbox(state) {
    var allCb = state.panel
      ? state.panel.querySelector('[data-kt-select-all="1"]')
      : null;
    if (!allCb) return;
    var visible = state.filteredOptions || state.options;
    if (!visible.length) {
      allCb.checked = false;
      allCb.indeterminate = false;
      return;
    }
    var selectedVisible = visible.filter(function (opt) {
      return state.selected.has(opt.value);
    }).length;
    allCb.checked = selectedVisible === visible.length;
    allCb.indeterminate =
      selectedVisible > 0 && selectedVisible < visible.length;
  }

  function renderList(state) {
    var list = state.list;
    if (!list) return;
    var L = strings();
    var query = (state.searchQuery || "").toLowerCase();
    var options = state.options.filter(function (opt) {
      if (!query) return true;
      return opt.label.toLowerCase().indexOf(query) >= 0;
    });
    state.filteredOptions = options;

    list.innerHTML = "";

    var allLi = document.createElement("li");
    allLi.className = "kt-multi-filter__item kt-multi-filter__item--all";
    allLi.setAttribute("role", "presentation");
    var allLabel = document.createElement("label");
    allLabel.className = "kt-multi-filter__option";
    var allCb = document.createElement("input");
    allCb.type = "checkbox";
    allCb.setAttribute("data-kt-select-all", "1");
    allCb.addEventListener("change", function () {
      if (allCb.checked) {
        options.forEach(function (opt) {
          state.selected.add(opt.value);
        });
      } else {
        options.forEach(function (opt) {
          state.selected.delete(opt.value);
        });
      }
      finishSelectionChange(state);
      renderList(state);
    });
    var allText = document.createElement("span");
    allText.className = "kt-multi-filter__option-text";
    allText.textContent = L.selectAll;
    allLabel.appendChild(allCb);
    allLabel.appendChild(allText);
    allLi.appendChild(allLabel);
    list.appendChild(allLi);

    options.forEach(function (opt, index) {
      var li = document.createElement("li");
      li.className = "kt-multi-filter__item";
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", state.selected.has(opt.value) ? "true" : "false");
      li.setAttribute("data-index", String(index));

      var label = document.createElement("label");
      label.className = "kt-multi-filter__option";
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = opt.value;
      cb.checked = state.selected.has(opt.value);
      cb.addEventListener("change", function () {
        if (cb.checked) state.selected.add(opt.value);
        else state.selected.delete(opt.value);
        finishSelectionChange(state);
        updateSelectAllCheckbox(state);
        li.setAttribute("aria-selected", cb.checked ? "true" : "false");
      });

      var text = document.createElement("span");
      text.className = "kt-multi-filter__option-text";
      text.textContent = opt.label;

      label.appendChild(cb);
      label.appendChild(text);
      li.appendChild(label);
      list.appendChild(li);
    });

    updateSelectAllCheckbox(state);
  }

  function finishSelectionChange(state) {
    syncNativeSelect(state);
    updateSummary(state);
    state.select.dispatchEvent(
      new CustomEvent("change", { bubbles: true, detail: { multi: true } })
    );
    document.dispatchEvent(
      new CustomEvent("kt-catalog-filter-change", {
        bubbles: true,
        detail: { id: state.id },
      })
    );
  }

  function unbindReposition(state) {
    if (!state || !state._reposition) return;
    window.removeEventListener("scroll", state._reposition, true);
    window.removeEventListener("resize", state._reposition);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener("resize", state._reposition);
      window.visualViewport.removeEventListener("scroll", state._reposition);
    }
    state._reposition = null;
  }

  function bindReposition(state) {
    unbindReposition(state);
    state._reposition = function () {
      if (state.root.classList.contains("is-open")) positionPanel(state);
    };
    window.addEventListener("scroll", state._reposition, true);
    window.addEventListener("resize", state._reposition);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", state._reposition);
      window.visualViewport.addEventListener("scroll", state._reposition);
    }
  }

  function resetPanelStyles(state) {
    if (!state.panel) return;
    state.panel.classList.remove(
      "is-open",
      "kt-multi-filter__panel--floating",
      "kt-multi-filter__panel--above"
    );
    state.panel.removeAttribute("style");
    if (state.list) state.list.removeAttribute("style");
  }

  function positionPanel(state) {
    var panel = state.panel;
    var trigger = state.trigger;
    if (!panel || !trigger || !state.root.classList.contains("is-open")) return;

    var rect = trigger.getBoundingClientRect();
    if (!rect.width && !rect.height) return;

    var width = Math.max(Math.round(rect.width), 240);
    var maxWidth = Math.min(360, window.innerWidth - VIEWPORT_PAD * 2);
    width = Math.min(width, maxWidth);

    var left = rect.left;
    if (left + width > window.innerWidth - VIEWPORT_PAD) {
      left = window.innerWidth - VIEWPORT_PAD - width;
    }
    left = Math.max(VIEWPORT_PAD, left);

    panel.style.position = "fixed";
    panel.style.left = Math.round(left) + "px";
    panel.style.width = Math.round(width) + "px";
    panel.style.zIndex = "10050";
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    panel.style.margin = "0";

    var belowTop = rect.bottom + PANEL_GAP;
    var spaceBelow = window.innerHeight - belowTop - VIEWPORT_PAD;
    var spaceAbove = rect.top - PANEL_GAP - VIEWPORT_PAD;
    var openAbove = spaceBelow < MIN_PANEL_HEIGHT && spaceAbove > spaceBelow;
    var maxPanelHeight = Math.max(
      MIN_PANEL_HEIGHT,
      Math.min(MAX_LIST_HEIGHT + 96, openAbove ? spaceAbove : spaceBelow)
    );

    panel.style.maxHeight = Math.round(maxPanelHeight) + "px";
    panel.classList.toggle("kt-multi-filter__panel--above", openAbove);

    if (state.list) {
      var searchWrap = state.searchEl
        ? state.searchEl.closest(".kt-multi-filter__search-wrap")
        : null;
      var chrome = (searchWrap ? searchWrap.offsetHeight : 0) + 16;
      var listMax = Math.max(80, maxPanelHeight - chrome);
      state.list.style.maxHeight = Math.min(MAX_LIST_HEIGHT, listMax) + "px";
    }

    panel.style.visibility = "hidden";
    panel.style.top = "0";
    var panelHeight = panel.offsetHeight;
    var top = openAbove
      ? Math.max(VIEWPORT_PAD, rect.top - PANEL_GAP - panelHeight)
      : belowTop;
    panel.style.top = Math.round(top) + "px";
    panel.style.visibility = "";
  }

  function closePanel(state) {
    if (!state) return;
    state.root.classList.remove("is-open");
    unbindReposition(state);
    if (state.trigger) state.trigger.setAttribute("aria-expanded", "false");
    if (state.panel) {
      resetPanelStyles(state);
      if (state.panel.parentNode !== state.root) {
        state.root.appendChild(state.panel);
      }
    }
    if (openId === state.id) openId = null;
    if (!openId) {
      document.documentElement.classList.remove("kt-catalog-filter-dropdown-open");
    }
  }

  function openPanel(state) {
    if (openId && openId !== state.id && instances[openId]) {
      closePanel(instances[openId]);
    }
    state.root.classList.add("is-open");
    if (state.trigger) {
      state.trigger.setAttribute("aria-expanded", "true");
      state.trigger.focus();
    }
    openId = state.id;
    state.searchQuery = "";
    if (state.searchEl) state.searchEl.value = "";
    renderList(state);

    if (state.panel) {
      document.body.appendChild(state.panel);
      state.panel.classList.add("kt-multi-filter__panel--floating", "is-open");
      document.documentElement.classList.add("kt-catalog-filter-dropdown-open");
      requestAnimationFrame(function () {
        positionPanel(state);
        bindReposition(state);
      });
    }
  }

  function buildUi(select) {
    var parsed = parseOptions(select);
    var id = select.id;
    if (!id) return null;

    var wrap = select.closest(".sel-wrap");
    if (!wrap || wrap.querySelector(".kt-multi-filter")) return null;

    select.classList.add("kt-multi-filter__native");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");

    var root = document.createElement("div");
    root.className = "kt-multi-filter";
    root.setAttribute("data-kt-multi-filter-for", id);

    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "kt-multi-filter__trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute(
      "aria-label",
      select.getAttribute("aria-label") || parsed.placeholder
    );

    var label = document.createElement("span");
    label.className = "kt-multi-filter__placeholder";
    label.textContent = parsed.placeholder;

    var summary = document.createElement("span");
    summary.className = "kt-multi-filter__summary";
    summary.hidden = true;

    var chevron = document.createElement("span");
    chevron.className = "kt-multi-filter__chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.innerHTML =
      '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';

    trigger.appendChild(label);
    trigger.appendChild(summary);
    trigger.appendChild(chevron);

    var panel = document.createElement("div");
    panel.className = "kt-multi-filter__panel";
    panel.setAttribute("role", "presentation");

    var panelInner = document.createElement("div");
    panelInner.className = "kt-multi-filter__panel-inner";

    var searchInput = null;
    if (parsed.options.length >= SEARCH_MIN) {
      var searchWrap = document.createElement("div");
      searchWrap.className = "kt-multi-filter__search-wrap";
      searchInput = document.createElement("input");
      searchInput.type = "search";
      searchInput.className = "kt-multi-filter__search";
      searchInput.placeholder = strings().search;
      searchInput.autocomplete = "off";
      searchWrap.appendChild(searchInput);
      panelInner.appendChild(searchWrap);
    }

    var list = document.createElement("ul");
    list.className = "kt-multi-filter__list";
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-multiselectable", "true");
    panelInner.appendChild(list);
    panel.appendChild(panelInner);

    root.appendChild(trigger);
    root.appendChild(panel);
    select.parentNode.insertBefore(root, select.nextSibling);

    var state = {
      id: id,
      select: select,
      wrap: wrap,
      root: root,
      trigger: trigger,
      panel: panel,
      panelInner: panelInner,
      list: list,
      summary: summary,
      placeholderEl: label,
      searchEl: searchInput,
      placeholder: parsed.placeholder,
      options: parsed.options,
      selected: new Set(parsed.options.map(function (opt) {
        return opt.value;
      })),
      searchQuery: "",
      filteredOptions: parsed.options.slice(),
    };

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        state.searchQuery = searchInput.value.trim();
        renderList(state);
        if (state.root.classList.contains("is-open")) {
          requestAnimationFrame(function () {
            positionPanel(state);
          });
        }
      });
      searchInput.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }

    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      if (state.root.classList.contains("is-open")) closePanel(state);
      else openPanel(state);
    });

    trigger.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!state.root.classList.contains("is-open")) openPanel(state);
      }
      if (e.key === "Escape") closePanel(state);
    });

    panel.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    instances[id] = state;
    renderList(state);
    updateSummary(state);
    return state;
  }

  function refresh(id) {
    var state = instances[id];
    var select = document.getElementById(id);
    if (!select) return;
    if (!state) {
      enhanceSelect(select);
      return;
    }
    var parsed = parseOptions(select);
    state.placeholder = parsed.placeholder;
    state.options = parsed.options;
    state.selected.clear();
    parsed.options.forEach(function (opt) {
      state.selected.add(opt.value);
    });
    var ph = state.placeholderEl;
    if (ph) ph.textContent = state.placeholder;
    renderList(state);
    updateSummary(state);
    syncNativeSelect(state);
  }

  function enhanceSelect(select) {
    if (!select || !select.id) return null;
    if (instances[select.id]) return instances[select.id];
    return buildUi(select);
  }

  function enhanceAll(root) {
    var scope = root || document;
    scope
      .querySelectorAll(
        ".toolbar.catalog-toolbar .sel-wrap select[id], .tools-bar--inventions .sel-wrap select[id], .tools-bar .sel-wrap select[id]"
      )
      .forEach(function (select) {
        enhanceSelect(select);
      });
  }

  function setActiveValues(id, values, options) {
    var opts = options || {};
    var state = instances[id];
    var list = Array.isArray(values)
      ? values.map(String).filter(Boolean)
      : String(values || "")
          .split(",")
          .map(function (v) {
            return v.trim();
          })
          .filter(Boolean);

    if (!state) {
      var el = document.getElementById(id);
      if (!el) return;
      el.value = list.length === 1 ? list[0] : "";
      if (!opts.silent) {
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
      return;
    }

    var allowed = Object.create(null);
    state.options.forEach(function (opt) {
      allowed[opt.value] = true;
    });

    state.selected.clear();
    if (!list.length) {
      state.options.forEach(function (opt) {
        state.selected.add(opt.value);
      });
    } else {
      list.forEach(function (v) {
        if (allowed[v]) state.selected.add(v);
      });
      if (!state.selected.size) {
        state.options.forEach(function (opt) {
          state.selected.add(opt.value);
        });
      }
    }
    syncNativeSelect(state);
    updateSummary(state);
    renderList(state);
    if (!opts.silent) {
      finishSelectionChange(state);
    }
  }

  function clear(id) {
    var state = instances[id];
    if (!state) {
      var el = document.getElementById(id);
      if (el) {
        el.value = "";
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
      return;
    }
    state.selected.clear();
    state.options.forEach(function (opt) {
      state.selected.add(opt.value);
    });
    finishSelectionChange(state);
    renderList(state);
    closePanel(state);
  }

  document.addEventListener("click", function () {
    if (openId && instances[openId]) closePanel(instances[openId]);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && openId && instances[openId]) {
      closePanel(instances[openId]);
    }
  });

  function boot() {
    enhanceAll();
    document.querySelectorAll(".toolbar .sel-clear[data-for]").forEach(function (btn) {
      if (btn.getAttribute("data-kt-multi-clear") === "1") return;
      btn.setAttribute("data-kt-multi-clear", "1");
      btn.addEventListener("click", function (e) {
        var id = btn.getAttribute("data-for");
        if (id) {
          e.stopPropagation();
          clear(id);
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  document.addEventListener("kt-catalog-ready", function () {
    enhanceAll();
  });

  window.KT_CATALOG_MULTI_FILTER = {
    enhanceAll: enhanceAll,
    enhanceSelect: enhanceSelect,
    refresh: refresh,
    clear: clear,
    setActiveValues: setActiveValues,
    clearMany: function (ids) {
      (ids || []).forEach(clear);
    },
    getActiveValues: function (id) {
      var state = instances[id];
      if (!state) {
        var el = document.getElementById(id);
        if (el && el.value) return [el.value];
        return [];
      }
      return getActiveValues(state);
    },
    isActive: function (id) {
      var state = instances[id];
      if (!state) {
        var el = document.getElementById(id);
        return !!(el && el.value);
      }
      return isFilterActive(state);
    },
    passesFilter: function (id, value) {
      var state = instances[id];
      if (!state) {
        var el = document.getElementById(id);
        if (!el || !el.value) return true;
        return String(value || "") === el.value;
      }
      return passesFilter(state, value);
    },
    matches: function (datasetValue, activeValues) {
      if (!activeValues || !activeValues.length) {
        return activeValues && activeValues.length === 0 ? false : true;
      }
      return activeValues.indexOf(String(datasetValue || "")) >= 0;
    },
  };
})(typeof window !== "undefined" ? window : this);
