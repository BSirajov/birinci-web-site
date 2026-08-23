(function () {
  var lang = document.body.getAttribute("data-lang") || "en";
  var page = document.body.getAttribute("data-page") || "";
  var msg = document.getElementById("account-msg");

  function show(text, isError) {
    if (!msg) return;
    msg.hidden = false;
    msg.textContent = text;
    msg.classList.toggle("is-error", !!isError);
  }

  function csrfHeader(token) {
    return { "Content-Type": "application/json", "X-CSRF-Token": token };
  }

  async function csrf() {
    var res = await fetch("/api/auth/csrf", { credentials: "same-origin" });
    var data = await res.json();
    return data.csrf_token;
  }

  async function post(url, body, method) {
    var token = await csrf();
    var res = await fetch(url, {
      method: method || "POST",
      credentials: "same-origin",
      headers: csrfHeader(token),
      body: JSON.stringify(body),
    });
    var data = {};
    try {
      data = await res.json();
    } catch (e) {
      data = {};
    }
    if (!res.ok) {
      var detail = data.detail;
      var err = new Error("Request failed");
      if (typeof detail === "string") err.message = detail;
      else if (Array.isArray(detail)) err.message = detail.map(function (d) { return d.msg || d; }).join(" ");
      else if (detail && typeof detail === "object") {
        err.message = detail.message || "Request failed";
        err.code = detail.code;
      }
      throw err;
    }
    return data;
  }

  async function postFile(url, file) {
    var token = await csrf();
    var body = new FormData();
    body.append("file", file);
    var res = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "X-CSRF-Token": token },
      body: body,
    });
    var data = {};
    try {
      data = await res.json();
    } catch (e) {
      data = {};
    }
    if (!res.ok) {
      var detail = data.detail;
      var err = new Error("Request failed");
      if (typeof detail === "string") err.message = detail;
      else if (Array.isArray(detail)) err.message = detail.map(function (d) { return d.msg || d; }).join(" ");
      else if (detail && typeof detail === "object") {
        err.message = detail.message || "Request failed";
        err.code = detail.code;
      }
      throw err;
    }
    return data;
  }

  async function loadMe() {
    var res = await fetch("/api/auth/me", { credentials: "same-origin" });
    return res.json();
  }

  var form = document.querySelector("form[data-form]");
  var needAccount = document.getElementById("account-need-account");
  var emailInput = form ? form.querySelector("input[name='email']") : null;
  document.querySelectorAll("[data-password-toggle]").forEach(function (btn) {
    var wrap = btn.closest(".auth-password");
    var input = wrap && wrap.querySelector("input");
    if (!input) return;
    var formEl = btn.closest("form");
    var showLabel = (formEl && formEl.getAttribute("data-password-show")) || "Show password";
    var hideLabel = (formEl && formEl.getAttribute("data-password-hide")) || "Hide password";
    var sync = function () {
      var shown = input.type === "text";
      btn.setAttribute("aria-pressed", shown ? "true" : "false");
      btn.classList.toggle("is-revealed", shown);
      btn.setAttribute("aria-label", shown ? hideLabel : showLabel);
    };
    sync();
    btn.addEventListener("click", function (ev) {
      ev.preventDefault();
      input.type = input.type === "password" ? "text" : "password";
      sync();
    });
  });
  function registerHref(email) {
    var href = "/account/register?lang=" + encodeURIComponent(lang);
    if (email) href += "&email=" + encodeURIComponent(email);
    return href;
  }
  if (needAccount && emailInput) {
    emailInput.addEventListener("input", function () {
      needAccount.href = registerHref(emailInput.value);
    });
    needAccount.href = registerHref(emailInput.value);
  }

  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var type = form.getAttribute("data-form");
      var fd = new FormData(form);
      var body = {};
      fd.forEach(function (v, k) {
        if (k === "avatar") return;
        if (v) body[k] = v;
      });
      var photo = fd.get("avatar");
      var token = form.getAttribute("data-token");
      if (type === "register") {
        if (String(body.password || "") !== String(fd.get("password_confirm") || "")) {
          show(form.getAttribute("data-password-mismatch") || "Passwords do not match.", true);
          return;
        }
        delete body.password_confirm;
      }
      var req;
      if (type === "register") req = post("/api/auth/register", body);
      else if (type === "login") req = post("/api/auth/login", body);
      else if (type === "forgot") req = post("/api/auth/password-reset/request", { email: body.email });
      else if (type === "reset") req = post("/api/auth/password-reset/confirm", { token: token, password: body.password });
      else if (type === "feedback") req = post("/api/feedback", body);
      else return;
      req
        .then(function (data) {
          if (type === "register" && photo && photo.size) {
            return postFile("/api/auth/me/avatar", photo).then(function () { return data; });
          }
          return data;
        })
        .then(function (data) {
          if (type === "register" || type === "login") {
            window.location.href = "/account?lang=" + encodeURIComponent(lang);
            return;
          }
          if (type === "feedback") {
            form.reset();
            show(form.getAttribute("data-sent") || data.message || "Done.");
            return;
          }
          show(data.message || "Done.");
          if (data.reset_url) show((data.message || "Done.") + " " + data.reset_url);
        })
        .catch(function (err) {
          var invite = document.getElementById("account-invite");
          var create = document.getElementById("account-create");
          if (type === "login" && err.code === "account_not_found") {
            show((invite && invite.getAttribute("data-no-account")) || err.message, true);
            if (create) {
              create.href =
                "/account/register?lang=" +
                encodeURIComponent(lang) +
                "&email=" +
                encodeURIComponent(body.email || "");
            }
            if (invite) invite.hidden = false;
            return;
          }
          if (invite) invite.hidden = true;
          if (type === "login" && err.code === "invalid_password") {
            show((invite && invite.getAttribute("data-bad-password")) || err.message, true);
            return;
          }
          show(err.message, true);
        });
    });
  }

  if (page === "verify") {
    var el = document.querySelector("[data-token]");
    var verifyToken = el ? el.getAttribute("data-token") : "";
    if (!verifyToken) {
      show("Missing verification token.", true);
    } else {
      csrf()
        .then(function (token) {
          return fetch("/api/auth/verify-email", {
            method: "POST",
            credentials: "same-origin",
            headers: csrfHeader(token),
            body: JSON.stringify({ token: verifyToken }),
          });
        })
        .then(function (res) {
          return res.json().then(function (data) {
            if (!res.ok) throw new Error(data.detail || "Verification failed");
            show("Email verified. You can now comment.");
          });
        })
        .catch(function (err) {
          show(err.message, true);
        });
    }
  }

  if (page === "register") {
    var preview = document.getElementById("register-photo-preview");
    var photoInput = form && form.querySelector("input[name='avatar']");
    if (photoInput && preview) {
      photoInput.addEventListener("change", function () {
        var file = photoInput.files && photoInput.files[0];
        if (!file) return;
        preview.innerHTML = '<img alt="" src="' + URL.createObjectURL(file) + '" />';
        preview.hidden = false;
      });
    }
    var localeMeta = {
      az: { short: "AZ", title: "Azərbaycan" },
      en: { short: "EN", title: "English" },
      ru: { short: "RU", title: "Русский" },
      ky: { short: "KY", title: "Кыргызча" },
    };
    var wrap = form && form.querySelector("[data-pref-locale]");
    if (wrap) {
      var toggle = wrap.querySelector(".lang-switcher__toggle");
      var menu = wrap.querySelector(".lang-switcher__menu");
      var input = wrap.querySelector('input[name="preferred_locale"]');
      var closeLocale = function () {
        wrap.classList.remove("is-open");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
        if (menu) menu.hidden = true;
      };
      var setLocale = function (code) {
        var meta = localeMeta[code] || localeMeta.en;
        if (input) input.value = code;
        if (toggle) {
          toggle.title = meta.title;
          var flag = toggle.querySelector(".lang-switcher__flag");
          var name = toggle.querySelector(".lang-switcher__name");
          if (flag) flag.src = "/flags/" + code + ".svg";
          if (name) name.textContent = meta.short;
        }
        wrap.querySelectorAll(".lang-switcher__option").forEach(function (opt) {
          opt.setAttribute("aria-selected", opt.getAttribute("data-lang") === code ? "true" : "false");
        });
      };
      if (toggle && menu) {
        toggle.addEventListener("click", function (ev) {
          ev.preventDefault();
          if (wrap.classList.contains("is-open")) closeLocale();
          else {
            wrap.classList.add("is-open");
            toggle.setAttribute("aria-expanded", "true");
            menu.hidden = false;
          }
        });
        menu.addEventListener("click", function (ev) {
          var opt = ev.target.closest(".lang-switcher__option[data-lang]");
          if (!opt) return;
          ev.preventDefault();
          setLocale(opt.getAttribute("data-lang"));
          closeLocale();
        });
        document.addEventListener("click", function (ev) {
          if (!wrap.classList.contains("is-open") || wrap.contains(ev.target)) return;
          closeLocale();
        });
        document.addEventListener("keydown", function (ev) {
          if (ev.key === "Escape") closeLocale();
        });
      }
    }
  }

  var READING_PREF_KEYS = [
    "birinci-home-view",
    "birinci-category-view",
    "birinci-inventions-view",
    "birinci-images-collapsed",
    "birinci-texts-collapsed",
  ];

  function clearReadingPrefs() {
    READING_PREF_KEYS.forEach(function (key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    });
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  if (page === "account") {
    var status = document.getElementById("account-status");
    var dl = document.getElementById("account-dl");
    var guestNav = document.querySelector("[data-account-guest-nav]");
    loadMe().then(function (data) {
      if (!data.user) {
        window.location.href = "/account/login?lang=" + encodeURIComponent(lang);
        return;
      }
      var u = data.user;
      if (guestNav) guestNav.hidden = true;
      status.textContent = u.is_verified
        ? status.getAttribute("data-verified") || ""
        : status.getAttribute("data-unverified") || "";
      var photoWrap = document.getElementById("account-photo");
      var photoPreview = document.getElementById("account-photo-preview");
      if (photoWrap && photoPreview && u.avatar_url) {
        photoPreview.innerHTML = '<img alt="" src="' + esc(u.avatar_url) + '" />';
        photoWrap.hidden = false;
      }
      dl.hidden = false;
      dl.innerHTML =
        "<dt>" +
        esc(dl.getAttribute("data-label-email")) +
        "</dt><dd>" +
        esc(u.email) +
        "</dd><dt>" +
        esc(dl.getAttribute("data-label-name")) +
        "</dt><dd>" +
        esc(u.first_name || "—") +
        "</dd><dt>" +
        esc(dl.getAttribute("data-label-surname")) +
        "</dt><dd>" +
        esc(u.last_name || "—") +
        "</dd><dt>" +
        esc(dl.getAttribute("data-label-display-name")) +
        "</dt><dd>" +
        esc(u.display_name || "—") +
        "</dd><dt>" +
        esc(dl.getAttribute("data-label-locale")) +
        "</dt><dd>" +
        esc((u.preferred_locale || "").toUpperCase()) +
        "</dd>";
      if (u.role === "admin" || u.role === "moderator") {
        var actions = document.querySelector(".account-actions");
        if (actions) {
          var link = document.createElement("a");
          link.className = "account-link";
          link.href = "/account/moderation?lang=" + encodeURIComponent(lang);
          link.textContent = "Moderation";
          actions.appendChild(link);
        }
      }
    });
    document.querySelector("[data-action='logout']").addEventListener("click", function () {
      post("/api/auth/logout", {})
        .then(function () {
          clearReadingPrefs();
          window.location.href = "/account/login?lang=" + encodeURIComponent(lang);
        })
        .catch(function (err) {
          show(err.message, true);
        });
    });
    var deleteConfirm = document.getElementById("account-delete-confirm");
    var deleteOpen = document.querySelector("[data-action='delete']");
    var deleteCancel = document.querySelector("[data-action='delete-cancel']");
    var deleteYes = document.querySelector("[data-action='delete-confirm']");
    if (deleteOpen && deleteConfirm) {
      deleteOpen.addEventListener("click", function () {
        deleteConfirm.hidden = false;
      });
    }
    if (deleteCancel && deleteConfirm) {
      deleteCancel.addEventListener("click", function () {
        deleteConfirm.hidden = true;
      });
    }
    if (deleteYes) {
      deleteYes.addEventListener("click", function () {
        deleteYes.disabled = true;
        post("/api/auth/me", { confirm: true }, "DELETE")
          .then(function () {
            clearReadingPrefs();
            window.location.href = "/" + encodeURIComponent(lang) + "/index.html";
          })
          .catch(function (err) {
            deleteYes.disabled = false;
            show(err.message, true);
          });
      });
    }
  }

  if (page === "feedback") {
    loadMe().then(function (data) {
      if (!data.user) return;
      var emailField = document.querySelector("input[name='contact_email']");
      var nameField = document.querySelector("input[name='name']");
      if (emailField && !emailField.value) emailField.value = data.user.email || "";
      if (nameField && !nameField.value) nameField.value = data.user.display_name || "";
    });
  }

  if (page === "moderation") {
    var queue = document.getElementById("moderation-queue");
    function renderQueue(items) {
      if (!queue) return;
      if (!items.length) {
        queue.innerHTML = "<p class=\"account-lead\">" + esc(queue.getAttribute("data-empty") || "") + "</p>";
        return;
      }
      queue.innerHTML = items
        .map(function (item) {
          return (
            '<article class="mod-item" data-id="' +
            esc(item.id) +
            '"><p class="mod-item__meta">' +
            esc(item.locale) +
            " · " +
            esc(item.target_type) +
            " · " +
            esc(item.target_slug) +
            " · " +
            esc((item.author && item.author.display_name) || "") +
            '</p><p class="mod-item__body">' +
            esc(item.body) +
            '</p><div class="account-confirm__actions"><button type="button" class="account-btn" data-mod="approve">' +
            esc(queue.getAttribute("data-approve")) +
            '</button><button type="button" class="account-btn account-btn--danger" data-mod="reject">' +
            esc(queue.getAttribute("data-reject")) +
            "</button></div></article>"
          );
        })
        .join("");
    }
    function refreshQueue() {
      fetch("/api/comments/moderation?status=pending", { credentials: "same-origin" })
        .then(function (res) {
          if (res.status === 401 || res.status === 403) {
            window.location.href = "/account/login?lang=" + encodeURIComponent(lang);
            return null;
          }
          return res.json();
        })
        .then(function (data) {
          if (!data) return;
          renderQueue(data.comments || []);
        })
        .catch(function (err) {
          show(err.message, true);
        });
    }
    if (queue) {
      queue.addEventListener("click", function (ev) {
        var btn = ev.target.closest("[data-mod]");
        var item = ev.target.closest(".mod-item");
        if (!btn || !item) return;
        post("/api/comments/" + item.getAttribute("data-id") + "/moderate", { action: btn.getAttribute("data-mod") })
          .then(refreshQueue)
          .catch(function (err) {
            show(err.message, true);
          });
      });
    }
    refreshQueue();
  }
})();
