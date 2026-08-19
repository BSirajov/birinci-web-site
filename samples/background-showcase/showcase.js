(function () {
  const buttons = Array.from(document.querySelectorAll("[data-filter]"));
  const cards = Array.from(document.querySelectorAll(".option[data-style]"));

  function applyFilter(key) {
    cards.forEach((card) => {
      const style = card.getAttribute("data-style");
      const show = key === "all" || style === key;
      card.classList.toggle("is-hidden", !show);
    });
    buttons.forEach((btn) => {
      const active = btn.getAttribute("data-filter") === key;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      applyFilter(btn.getAttribute("data-filter") || "all");
    });
  });
})();
