/**
 * Collapsible TOC groups inside sidebar widgets — matches Articles panel
 * expand/collapse timing (0.28s max-height) and events-open state class.
 */
(function (global) {
  "use strict";

  var ENHANCED_ATTR = "data-kt-toc-groups";

  function slugify(text) {
    return (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function createToggle(groupId, label) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toc-group__toggle";
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-controls", groupId);
    btn.setAttribute("aria-label", "Toggle " + (label || "section"));
    var chevron = document.createElement("span");
    chevron.className = "toc-group__chevron";
    chevron.setAttribute("aria-hidden", "true");
    btn.appendChild(chevron);
    return btn;
  }

  function buildTocGroup(options) {
    var slug = options.slug || slugify(options.label) || "group";
    var bodyId = "toc-group-body-" + slug;
    var hasBody = options.bodyItems && options.bodyItems.length > 0;

    var group = document.createElement("li");
    group.className = "toc-group events-open" + (hasBody ? " toc-group--has-body" : "");
    if (options.tocCat) {
      group.setAttribute("data-toc-cat", options.tocCat);
      group.setAttribute("data-toc-level", "category");
    }
    if (options.tocLevel) group.setAttribute("data-toc-level", options.tocLevel);
    if (options.category) group.setAttribute("data-category", options.category);
    if (options.tocGroup) group.setAttribute("data-toc-group", options.tocGroup);

    var head = document.createElement("div");
    head.className = "toc-group__head";

    if (options.dateText) {
      var date = document.createElement("span");
      date.className = "tl-date";
      date.textContent = options.dateText;
      head.appendChild(date);
    }

    if (options.href) {
      var link = document.createElement("a");
      link.href = options.href;
      link.textContent = options.label || "";
      if (options.linkClass) link.className = options.linkClass;
      head.appendChild(link);
    } else if (options.label) {
      var title = document.createElement("span");
      title.className = "toc-group__label";
      title.textContent = options.label;
      head.appendChild(title);
    }

    if (options.count != null && options.count !== "") {
      var count = document.createElement("span");
      count.className = "toc-group__count";
      count.textContent = String(options.count);
      head.appendChild(count);
    }

    if (hasBody) {
      head.appendChild(createToggle(bodyId, options.label));
    }

    group.appendChild(head);

    if (hasBody) {
      var body = document.createElement("div");
      body.className = "toc-group__body";
      body.id = bodyId;

      var inner = document.createElement("ul");
      inner.className = "toc-group__list";
      options.bodyItems.forEach(function (item) {
        inner.appendChild(item);
      });
      body.appendChild(inner);
      group.appendChild(body);
    }

    return group;
  }

  function flattenArticleLeaves(container) {
    if (!container) return;
    var leaves = container.querySelectorAll(
      "li.toc-group--leaf, li[data-toc-level=\"article\"].toc-group"
    );
    Array.prototype.forEach.call(leaves, function (leaf) {
      var head = leaf.querySelector(".toc-group__head");
      if (!head) return;

      var simple = document.createElement("li");
      Array.prototype.slice.call(leaf.attributes).forEach(function (attr) {
        if (attr.name === "class" || attr.name === "data-toc-level") return;
        simple.setAttribute(attr.name, attr.value);
      });

      var classNames = [];
      if (leaf.classList.contains("inventions-toc-entry")) classNames.push("inventions-toc-entry");
      if (leaf.classList.contains("research-toc-entry")) classNames.push("research-toc-entry");
      if (leaf.classList.contains("inventions-toc-ref-row")) classNames.push("inventions-toc-ref-row");
      if (!classNames.length) {
        classNames.push(
          leaf.getAttribute("data-toc-entry") ? "research-toc-entry" : "inventions-toc-entry"
        );
      }
      if (leaf.classList.contains("is-hidden")) classNames.push("is-hidden");
      simple.className = classNames.join(" ");

      var dateEl = head.querySelector(".tl-date");
      var link = head.querySelector("a");
      if (dateEl) simple.appendChild(dateEl);
      if (link) simple.appendChild(link);

      if (leaf.parentNode) leaf.parentNode.replaceChild(simple, leaf);
    });
  }

  function setGroupExpanded(group, expanded) {
    if (!group || !group.classList.contains("toc-group--has-body")) return;
    group.classList.toggle("events-open", expanded);
    var toggle = group.querySelector(".toc-group__toggle");
    if (toggle) toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
  }

  function bindTocGroups(container) {
    if (!container) return;
    var groups = container.querySelectorAll(".toc-group.toc-group--has-body");
    groups.forEach(function (group) {
      if (group.getAttribute("data-kt-toc-bound")) return;
      group.setAttribute("data-kt-toc-bound", "1");

      var toggle = group.querySelector(".toc-group__toggle");
      if (!toggle) return;

      var expanded = group.classList.contains("events-open");
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");

      toggle.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        setGroupExpanded(group, !group.classList.contains("events-open"));
      });

      toggle.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setGroupExpanded(group, !group.classList.contains("events-open"));
        }
      });
    });
  }

  function enhanceInventionsTocList(list) {
    if (!list || list.getAttribute(ENHANCED_ATTR)) return list;
    if (list.querySelector(".toc-group")) {
      list.setAttribute(ENHANCED_ATTR, "1");
      flattenArticleLeaves(list);
      bindTocGroups(list);
      return list;
    }
    list.setAttribute(ENHANCED_ATTR, "1");

    var items = Array.prototype.slice.call(list.children);
    var fragment = document.createDocumentFragment();
    var pendingEntries = [];
    var currentCat = null;
    var refRows = [];
    var referencesExtra = null;

    function flushCategory() {
      if (!currentCat) return;
      var dateEl = currentCat.querySelector(".tl-date");
      var link = currentCat.querySelector("a");
      fragment.appendChild(
        buildTocGroup({
          slug: currentCat.getAttribute("data-toc-cat"),
          tocCat: currentCat.getAttribute("data-toc-cat"),
          dateText: dateEl ? dateEl.textContent : "",
          href: link ? link.getAttribute("href") : "",
          label: link ? link.textContent.trim() : "",
          bodyItems: pendingEntries.slice(),
        })
      );
      currentCat = null;
      pendingEntries = [];
    }

    function flushReferences() {
      if (!referencesExtra && !refRows.length) return;
      var link = referencesExtra ? referencesExtra.querySelector("a") : null;
      var dateEl = referencesExtra ? referencesExtra.querySelector(".tl-date") : null;
      fragment.appendChild(
        buildTocGroup({
          slug: "references",
          tocGroup: "references",
          tocLevel: "category",
          dateText: dateEl ? dateEl.textContent : "⊕",
          href: link ? link.getAttribute("href") : "#references",
          label: link ? link.textContent.trim() : "References",
          bodyItems: refRows.slice(),
        })
      );
      referencesExtra = null;
      refRows = [];
    }

    items.forEach(function (li) {
      if (li.classList.contains("inventions-toc-cat-row")) {
        flushReferences();
        flushCategory();
        currentCat = li;
      } else if (li.classList.contains("inventions-toc-entry")) {
        pendingEntries.push(li);
      } else if (li.classList.contains("inventions-toc-ref-row")) {
        refRows.push(li);
      } else if (li.classList.contains("inventions-toc-extra")) {
        flushCategory();
        var extraLink = li.querySelector("a");
        var href = extraLink ? extraLink.getAttribute("href") : "";
        if (href === "#references") {
          referencesExtra = li;
        } else {
          flushReferences();
          var extraDate = li.querySelector(".tl-date");
          fragment.appendChild(
            buildTocGroup({
              slug: href ? href.slice(1) : slugify(extraLink && extraLink.textContent),
              tocGroup: href ? href.slice(1) : "extra",
              dateText: extraDate ? extraDate.textContent : "⊕",
              href: href,
              label: extraLink ? extraLink.textContent.trim() : "",
              bodyItems: [],
            })
          );
        }
      } else {
        flushReferences();
        flushCategory();
        fragment.appendChild(li);
      }
    });

    flushCategory();
    flushReferences();

    while (list.firstChild) list.removeChild(list.firstChild);
    list.appendChild(fragment);
    flattenArticleLeaves(list);
    bindTocGroups(list);
    return list;
  }

  function enhanceResearchTocList(list) {
    if (!list || list.getAttribute(ENHANCED_ATTR)) return list;
    if (list.querySelector(".toc-group")) {
      list.setAttribute(ENHANCED_ATTR, "1");
      flattenArticleLeaves(list);
      bindTocGroups(list);
      return list;
    }
    list.setAttribute(ENHANCED_ATTR, "1");

    var items = Array.prototype.slice.call(list.children);
    var fragment = document.createDocumentFragment();

    for (var i = 0; i < items.length; i += 1) {
      var li = items[i];

      if (li.classList.contains("toc-group")) {
        fragment.appendChild(li);
        continue;
      }

      if (li.classList.contains("research-toc-cat")) {
        var groupLi = items[i + 1];
        if (!groupLi || !groupLi.classList.contains("research-toc-group")) {
          fragment.appendChild(li);
          continue;
        }
        i += 1;

        var btn = li.querySelector(".research-toc-cat__btn");
        var labelEl = li.querySelector(".research-toc-cat__label");
        var countEl = li.querySelector(".research-toc-cat__count");
        var dateEl = btn ? btn.querySelector(".tl-date") : null;
        var catSlug = li.getAttribute("data-toc-cat");
        var catNum = li.getAttribute("data-category");
        var entries = Array.prototype.slice.call(
          groupLi.querySelectorAll(".research-toc-entry")
        );

        fragment.appendChild(
          buildTocGroup({
            slug: catSlug || "cat-" + catNum,
            tocCat: catSlug,
            category: catNum,
            dateText: dateEl ? dateEl.textContent : "",
            href: catSlug ? "#" + catSlug : "",
            label: labelEl ? labelEl.textContent.trim() : "",
            count: countEl ? countEl.textContent.trim() : "",
            bodyItems: entries,
          })
        );
        continue;
      }

      if (li.classList.contains("research-toc-group")) {
        continue;
      }

      if (li.classList.contains("research-toc-extra")) {
        var extraLink = li.querySelector("a");
        var extraDate = li.querySelector(".tl-date");
        fragment.appendChild(
          buildTocGroup({
            slug: extraLink ? slugify(extraLink.getAttribute("href")) : "bibliography",
            tocGroup: "bibliography",
            dateText: extraDate ? extraDate.textContent : "⊕",
            href: extraLink ? extraLink.getAttribute("href") : "",
            label: extraLink ? extraLink.textContent.trim() : "",
            bodyItems: [],
          })
        );
        continue;
      }

      fragment.appendChild(li);
    }

    while (list.firstChild) list.removeChild(list.firstChild);
    list.appendChild(fragment);
    flattenArticleLeaves(list);
    bindTocGroups(list);
    return list;
  }

  function enhanceList(list) {
    if (!list) return list;
    if (list.id === "inventionsTocList") return enhanceInventionsTocList(list);
    if (list.id === "researchTocList" || list.classList.contains("research-toc")) {
      return enhanceResearchTocList(list);
    }
    if (list.querySelector(".inventions-toc-cat-row, .research-toc-cat")) {
      if (list.querySelector(".inventions-toc-cat-row")) return enhanceInventionsTocList(list);
      return enhanceResearchTocList(list);
    }
    bindTocGroups(list);
    return list;
  }

  function getCollapsibleGroups(container) {
    if (!container) return [];
    var root = container.classList && container.classList.contains("sidebar-widget")
      ? container
      : container.closest(".sidebar-widget") || container;
    var list = root.querySelector(".timeline-list");
    if (!list) return [];
    return Array.prototype.slice.call(
      list.querySelectorAll(".toc-group.toc-group--has-body:not(.is-hidden)")
    );
  }

  function expandAll(container) {
    getCollapsibleGroups(container).forEach(function (group) {
      setGroupExpanded(group, true);
    });
  }

  function collapseAll(container) {
    getCollapsibleGroups(container).forEach(function (group) {
      setGroupExpanded(group, false);
    });
  }

  function panelLabel(widget) {
    if (!widget) return "Contents";
    var title =
      widget.querySelector(".widget-head__title") ||
      widget.querySelector(".widget-head > span");
    if (!title) return "Contents";
    var text = title.textContent.trim();
    var space = text.indexOf(" ");
    return space >= 0 ? text.slice(space + 1).trim() : text;
  }

  function getGroupsInWidget(widget, level) {
    var list = widget && widget.querySelector(".timeline-list");
    if (!list) return [];
    return Array.prototype.slice.call(
      list.querySelectorAll(
        '[data-toc-level="' + level + '"]:not(.is-hidden)'
      )
    );
  }

  function allGroupsExpanded(groups) {
    if (!groups.length) return true;
    return groups.every(function (group) {
      return group.classList.contains("events-open");
    });
  }

  function bulkActionLabels(kind, willExpand, btn) {
    var collapse = (btn && btn.getAttribute("data-label-collapse")) || "";
    var expand = (btn && btn.getAttribute("data-label-expand")) || "";
    var label = willExpand
      ? expand || "Expand All Categories"
      : collapse || "Collapse All Categories";
    return {
      label: label,
      ariaLabel: label,
      title: label,
      action: willExpand ? "expand" : "collapse",
    };
  }

  function ensureBulkActionButtonStructure(btn) {
    if (!btn || btn.querySelector(".widget-action-btn__label")) return;
    var text = btn.textContent.trim();
    btn.textContent = "";
    var icon = document.createElement("span");
    icon.className = "widget-action-btn__icon";
    icon.setAttribute("aria-hidden", "true");
    var label = document.createElement("span");
    label.className = "widget-action-btn__label";
    label.textContent = text;
    btn.appendChild(icon);
    btn.appendChild(label);
  }

  function updateBulkActionButton(btn, allExpanded, kind) {
    if (!btn) return;
    ensureBulkActionButtonStructure(btn);
    var willExpand = !allExpanded;
    var copy = bulkActionLabels(kind, willExpand, btn);
    var labelEl = btn.querySelector(".widget-action-btn__label");
    if (labelEl) labelEl.textContent = copy.label;
    btn.setAttribute("aria-label", copy.ariaLabel);
    btn.setAttribute("title", copy.title);
    btn.setAttribute("aria-expanded", allExpanded ? "true" : "false");
    btn.setAttribute("aria-pressed", allExpanded ? "true" : "false");
    btn.setAttribute("data-bulk-action", copy.action);
    btn.classList.toggle("widget-action-btn--will-expand", willExpand);
    btn.classList.toggle("widget-action-btn--will-collapse", !willExpand);
  }

  function syncToggleButton(btn, groups, kind) {
    updateBulkActionButton(btn, allGroupsExpanded(groups), kind);
  }

  function toggleGroups(groups) {
    var expand = !allGroupsExpanded(groups);
    groups.forEach(function (group) {
      setGroupExpanded(group, expand);
    });
    return expand;
  }

  function refreshArticlesSidebarButtons(widget) {
    if (!widget) return;
    var actions = widget.querySelector(".widget-actions");
    if (!actions) return;
    syncToggleButton(
      actions.querySelector('[data-toc-action="toggle-categories"]'),
      getGroupsInWidget(widget, "category"),
      "categories"
    );
  }

  function attachGroupSync(widget) {
    var list = widget && widget.querySelector(".timeline-list");
    if (!list || list.getAttribute("data-kt-sync-bound")) return;
    list.setAttribute("data-kt-sync-bound", "1");
    list.addEventListener("click", function (e) {
      if (!e.target.closest(".toc-group__toggle")) return;
      window.requestAnimationFrame(function () {
        refreshArticlesSidebarButtons(widget);
      });
    });
  }

  function wireTocSidebarControls(widget) {
    if (!widget) return widget;

    var actions = widget.querySelector(".widget-actions");
    if (!actions) return widget;

    var categoriesBtn = actions.querySelector('[data-toc-action="toggle-categories"]');

    if (categoriesBtn && !categoriesBtn.getAttribute("data-kt-toc-bound")) {
      categoriesBtn.setAttribute("data-kt-toc-bound", "1");
      categoriesBtn.addEventListener("click", function () {
        toggleGroups(getGroupsInWidget(widget, "category"));
        refreshArticlesSidebarButtons(widget);
      });
    }

    attachGroupSync(widget);
    refreshArticlesSidebarButtons(widget);
    return widget;
  }

  function wireTocActionButtons(widget, actions) {
    if (!widget || !actions) return;

    var label = panelLabel(widget);
    var expandBtn = actions.querySelector('[data-toc-action="expand-all"]');
    var collapseBtn = actions.querySelector('[data-toc-action="collapse-all"]');

    if (expandBtn && !expandBtn.getAttribute("data-kt-toc-bound")) {
      expandBtn.setAttribute("data-kt-toc-bound", "1");
      if (!expandBtn.getAttribute("aria-label")) {
        expandBtn.setAttribute(
          "aria-label",
          "Expand all " + label.toLowerCase() + " sections"
        );
      }
      expandBtn.addEventListener("click", function () {
        expandAll(widget);
      });
    }

    if (collapseBtn && !collapseBtn.getAttribute("data-kt-toc-bound")) {
      collapseBtn.setAttribute("data-kt-toc-bound", "1");
      if (!collapseBtn.getAttribute("aria-label")) {
        collapseBtn.setAttribute(
          "aria-label",
          "Collapse all " + label.toLowerCase() + " sections"
        );
      }
      collapseBtn.addEventListener("click", function () {
        collapseAll(widget);
      });
    }
  }

  function bindPanelControls(widget) {
    if (!widget) return widget;

    var actions = widget.querySelector(".widget-actions");
    if (actions && actions.querySelector('[data-toc-action="toggle-categories"]')) {
      return wireTocSidebarControls(widget);
    }

    if (!actions) {
      var label = panelLabel(widget);
      actions = document.createElement("div");
      actions.className = "widget-actions";
      actions.setAttribute("role", "group");
      actions.setAttribute("aria-label", label + " section controls");

      var expandBtn = document.createElement("button");
      expandBtn.type = "button";
      expandBtn.className = "widget-action-btn";
      expandBtn.setAttribute("data-toc-action", "expand-all");
      expandBtn.textContent = "Expand all";

      var collapseBtn = document.createElement("button");
      collapseBtn.type = "button";
      collapseBtn.className = "widget-action-btn";
      collapseBtn.setAttribute("data-toc-action", "collapse-all");
      collapseBtn.textContent = "Collapse all";

      actions.appendChild(expandBtn);
      actions.appendChild(collapseBtn);

      var body = widget.querySelector(".widget-body");
      if (!body) return widget;
      widget.insertBefore(actions, body);
    }

    wireTocActionButtons(widget, actions);
    return widget;
  }

  function enhance(root) {
    root = root || document;
    var lists = root.querySelectorAll("#inventionsTocList, #researchTocList");
    lists.forEach(enhanceList);
  }

  function expandGroupContaining(element) {
    var group = element && element.closest ? element.closest(".toc-group") : null;
    if (!group) return;
    setGroupExpanded(group, true);
  }

  global.KT_SIDEBAR_TOC_GROUPS = {
    enhance: enhance,
    enhanceList: enhanceList,
    bind: bindTocGroups,
    bindPanelControls: bindPanelControls,
    expandAll: expandAll,
    collapseAll: collapseAll,
    expandGroupContaining: expandGroupContaining,
    setGroupExpanded: setGroupExpanded,
    refreshArticlesSidebarButtons: refreshArticlesSidebarButtons,
    updateBulkActionButton: updateBulkActionButton,
  };
})(typeof window !== "undefined" ? window : this);
