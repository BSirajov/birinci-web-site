(function () {
  "use strict";

  var page = document.querySelector(".page-inventions");
  if (!page) return;

  var i18nEl = document.getElementById("ocaq-video-i18n");
  var i18n = { close: "Close", series: "Ocaq", note: "" };
  if (i18nEl) {
    try {
      i18n = Object.assign(i18n, JSON.parse(i18nEl.textContent || "{}"));
    } catch (err) {
      /* keep defaults */
    }
  }

  var dialog = null;
  var video = null;
  var titleEl = null;

  function ensureDialog() {
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.className = "ocaq-video-dialog";
    dialog.setAttribute("aria-labelledby", "ocaq-video-dialog-title");
    dialog.innerHTML =
      '<div class="ocaq-video-dialog__panel">' +
      '<div class="ocaq-video-dialog__head">' +
      '<div><p class="ocaq-video-dialog__kicker"></p>' +
      '<h3 class="ocaq-video-dialog__title" id="ocaq-video-dialog-title"></h3></div>' +
      '<button type="button" class="ocaq-video-dialog__close" data-ocaq-close aria-label=""></button>' +
      "</div>" +
      "<video controls playsinline preload=\"metadata\"></video>" +
      '<p class="ocaq-video-dialog__note"></p>' +
      "</div>";
    document.body.appendChild(dialog);
    video = dialog.querySelector("video");
    titleEl = dialog.querySelector(".ocaq-video-dialog__title");
    dialog.querySelector(".ocaq-video-dialog__kicker").textContent = i18n.series || "Ocaq";
    dialog.querySelector("[data-ocaq-close]").textContent = "×";
    dialog.querySelector("[data-ocaq-close]").setAttribute("aria-label", i18n.close || "Close");
    dialog.querySelector(".ocaq-video-dialog__note").textContent = i18n.note || "";
    dialog.querySelector("[data-ocaq-close]").addEventListener("click", closePlayer);
    dialog.addEventListener("close", stopPlayer);
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) closePlayer();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && dialog && dialog.open) closePlayer();
    });
    return dialog;
  }

  function stopPlayer() {
    if (!video) return;
    video.pause();
    video.removeAttribute("src");
    video.load();
  }

  function closePlayer() {
    if (!dialog) return;
    stopPlayer();
    if (dialog.open) dialog.close();
  }

  function openPlayer(btn) {
    var src = btn.getAttribute("data-video-src");
    var title = btn.getAttribute("data-video-title") || "";
    if (!src) return;
    ensureDialog();
    titleEl.textContent = title;
    video.src = src;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    var play = video.play();
    if (play && typeof play.catch === "function") play.catch(function () {});
  }

  document.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-ocaq-open]");
    if (!btn || !page.contains(btn)) return;
    event.preventDefault();
    openPlayer(btn);
  });
})();
