/**
 * Preview helpers for prominent figures page (category filter + search fallback).
 */
(() => {
  "use strict";

  const searchInput = document.getElementById("inventionsSearch");
  const catSelect = document.getElementById("filterCategory");
  const entries = Array.from(document.querySelectorAll(".inventions-entry"));
  const categories = Array.from(document.querySelectorAll(".inventions-category"));
  const tocEntries = Array.from(document.querySelectorAll("#inventionsTocList .inventions-toc-entry"));
  const tocCats = Array.from(document.querySelectorAll("#inventionsTocList .inventions-toc-cat-row"));
  const chip = document.querySelector("[data-search-filter]");
  const chipText = document.querySelector("[data-search-filter-text]");
  const chipClear = document.querySelector("[data-search-filter-clear]");

  const normalize = (value) =>
    String(value || "")
      .toLocaleLowerCase("en")
      .replace(/\s+/g, " ")
      .trim();

  const apply = () => {
    const q = normalize(searchInput && searchInput.value);
    const cat = catSelect ? String(catSelect.value || "") : "";

    if (chip && chipText) {
      if (q) {
        chip.hidden = false;
        chipText.textContent = "Filter: “" + (searchInput.value || "").trim() + "”";
      } else {
        chip.hidden = true;
        chipText.textContent = "";
      }
    }

    const visibleCats = new Set();

    entries.forEach((entry) => {
      const entryCat = entry.getAttribute("data-figure-cat") || "";
      const hay = normalize(entry.textContent);
      const matchQ = !q || hay.includes(q);
      const matchCat = !cat || entryCat === cat;
      const show = matchQ && matchCat;
      entry.hidden = !show;
      if (show) visibleCats.add(entryCat);

      const toc = document.querySelector(
        '#inventionsTocList .inventions-toc-entry[data-toc-entry="' + entry.id + '"]'
      );
      if (toc) toc.hidden = !show;
    });

    categories.forEach((section) => {
      const id = section.id;
      const any = visibleCats.has(id);
      section.hidden = !any;
    });

    tocCats.forEach((row) => {
      const id = row.getAttribute("data-toc-cat") || "";
      row.hidden = !visibleCats.has(id);
    });
  };

  if (searchInput) {
    searchInput.addEventListener("input", apply);
  }
  if (catSelect) {
    catSelect.addEventListener("change", apply);
  }
  if (chipClear && searchInput) {
    chipClear.addEventListener("click", () => {
      searchInput.value = "";
      apply();
      searchInput.focus();
    });
  }

  const catClear = document.querySelector('.sel-clear[data-for="filterCategory"]');
  if (catClear && catSelect) {
    catClear.addEventListener("click", () => {
      catSelect.value = "";
      apply();
    });
  }

  apply();
})();
