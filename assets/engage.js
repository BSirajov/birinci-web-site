(function () {
  const FALLBACK = {
    like: "Like",
    dislike: "Dislike",
    likes_count: "Likes",
    dislikes_count: "Dislikes",
    comments: "Comments",
    comments_empty: "No comments yet.",
    comment_placeholder: "Write a comment…",
    comment_reply_placeholder: "Write a reply…",
    comment_submit: "Post comment",
    comment_reply: "Reply",
    comment_edit: "Edit",
    comment_delete: "Delete",
    comment_pending: "Waiting for review",
    comment_rejected: "Not published",
    comment_signin: "Sign in to comment.",
    comment_verify: "Verify your email to comment.",
    comment_posted: "Submitted for review.",
    reaction_signin: "Sign in to like or dislike.",
    feedback_nav: "Feedback",
  };

  const t = (key) => {
    const ui = (window.__BIRINCI_I18N__ && window.__BIRINCI_I18N__.ui) || {};
    if (ui[key]) return ui[key];
    if (window.__birinciAuth && typeof window.__birinciAuth.t === "function") {
      const value = window.__birinciAuth.t(key);
      if (value && value !== key) return value;
    }
    return FALLBACK[key] || key;
  };

  const esc = (value) =>
    String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch]));

  const currentLang = () => {
    if (window.__birinciAuth && window.__birinciAuth.currentLang) return window.__birinciAuth.currentLang();
    return (document.body.getAttribute("data-lang") || "en").toLowerCase();
  };

  const currentUser = () => (window.__birinciUser || (window.__birinciAuth && window.__birinciAuth.user && window.__birinciAuth.user()) || null);

  const apiFetch = (path, opts) => {
    if (window.__birinciAuth && window.__birinciAuth.apiFetch) return window.__birinciAuth.apiFetch(path, opts);
    return fetch(path, Object.assign({ credentials: "include" }, opts || {}));
  };

  const postAuth = (url, body, method) => {
    if (window.__birinciAuth && window.__birinciAuth.postAuth) return window.__birinciAuth.postAuth(url, body, method);
    return Promise.reject(new Error("API is not ready."));
  };

  const qs = (target) =>
    "locale=" +
    encodeURIComponent(target.locale) +
    "&target_type=" +
    encodeURIComponent(target.type) +
    "&target_slug=" +
    encodeURIComponent(target.slug);

  const thumb = (kind, active) => {
    if (kind === "like") {
      return (
        '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="' +
        (active ? "currentColor" : "none") +
        '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11v10H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3Zm0 0 4.2-7.3A2 2 0 0 1 13 2.7V8h5.4a2 2 0 0 1 2 2.3l-1.1 7A2 2 0 0 1 17.4 19H7"/></svg>'
      );
    }
    return (
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="' +
      (active ? "currentColor" : "none") +
      '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 13V3h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3Zm0 0-4.2 7.3A2 2 0 0 1 11 21.3V16H5.6a2 2 0 0 1-2-2.3l1.1-7A2 2 0 0 1 6.6 5H17"/></svg>'
    );
  };

  const statusLabel = (status) => {
    if (status === "pending") return t("comment_pending");
    if (status === "rejected") return t("comment_rejected");
    return "";
  };

  const commentHtml = (item, target) => {
    const mine = item.mine;
    const name = (item.author && item.author.display_name) || "Reader";
    const status = statusLabel(item.status);
    const replyBtn = item.parent_comment_id
      ? ""
      : '<button type="button" class="engage-link" data-engage-reply="' + esc(item.id) + '">' + esc(t("comment_reply")) + "</button>";
    const ownBtns = mine
      ? '<button type="button" class="engage-link" data-engage-edit="' +
        esc(item.id) +
        '">' +
        esc(t("comment_edit")) +
        '</button><button type="button" class="engage-link" data-engage-delete="' +
        esc(item.id) +
        '">' +
        esc(t("comment_delete")) +
        "</button>"
      : "";
    return (
      '<article class="engage-comment' +
      (item.parent_comment_id ? " engage-comment--reply" : "") +
      '" data-comment-id="' +
      esc(item.id) +
      '" data-parent="' +
      esc(item.parent_comment_id || "") +
      '"><p class="engage-comment__meta"><strong>' +
      esc(name) +
      "</strong>" +
      (status ? '<span class="engage-comment__status">' + esc(status) + "</span>" : "") +
      '</p><p class="engage-comment__body">' +
      esc(item.body) +
      '</p><div class="engage-comment__actions">' +
      replyBtn +
      ownBtns +
      "</div></article>"
    );
  };

  const composerHtml = (placeholder, submitLabel, parentId) =>
    '<form class="engage-form" data-parent="' +
    esc(parentId || "") +
    '"><label class="visually-hidden" for="">' +
    esc(placeholder) +
    '</label><textarea name="body" rows="3" maxlength="2000" required placeholder="' +
    esc(placeholder) +
    '"></textarea><button type="submit" class="engage-submit">' +
    esc(submitLabel) +
    "</button></form>";

  const renderMount = (root, data) => {
    const user = currentUser();
    const reactions = data.reactions || { likes: 0, dislikes: 0, mine: null };
    const comments = data.comments || [];
    const likeOn = reactions.mine === "like";
    const dislikeOn = reactions.mine === "dislike";
    let commentGate = "";
    if (!user) {
      commentGate =
        '<p class="engage-note"><button type="button" class="engage-link" data-engage-signin>' +
        esc(t("comment_signin")) +
        "</button></p>";
    } else if (!user.is_verified) {
      commentGate = '<p class="engage-note">' + esc(t("comment_verify")) + "</p>";
    } else {
      commentGate = composerHtml(t("comment_placeholder"), t("comment_submit"));
    }

    const tops = comments.filter((c) => !c.parent_comment_id);
    const replies = comments.filter((c) => c.parent_comment_id);
    const thread = tops
      .map((top) => {
        const kids = replies.filter((r) => r.parent_comment_id === top.id).map((r) => commentHtml(r)).join("");
        return commentHtml(top) + kids;
      })
      .join("");

    root.innerHTML =
      '<div class="engage-reactions" role="group" aria-label="' +
      esc(t("likes_count")) +
      '">' +
      '<button type="button" class="engage-react' +
      (likeOn ? " is-on" : "") +
      '" data-react="like" aria-pressed="' +
      (likeOn ? "true" : "false") +
      '" aria-label="' +
      esc(t("like")) +
      '">' +
      thumb("like", likeOn) +
      "<span>" +
      esc(t("like")) +
      '</span><span class="engage-react__count">' +
      esc(reactions.likes || 0) +
      "</span></button>" +
      '<button type="button" class="engage-react' +
      (dislikeOn ? " is-on" : "") +
      '" data-react="dislike" aria-pressed="' +
      (dislikeOn ? "true" : "false") +
      '" aria-label="' +
      esc(t("dislike")) +
      '">' +
      thumb("dislike", dislikeOn) +
      "<span>" +
      esc(t("dislike")) +
      '</span><span class="engage-react__count">' +
      esc(reactions.dislikes || 0) +
      "</span></button></div>" +
      '<section class="engage-comments"><h3 class="engage-comments__title">' +
      esc(t("comments")) +
      "</h3>" +
      (thread || '<p class="engage-note">' + esc(t("comments_empty")) + "</p>") +
      commentGate +
      "</section>";
  };

  const loadTarget = (root) => {
    const target = {
      locale: root.getAttribute("data-engage-locale"),
      type: root.getAttribute("data-engage-type"),
      slug: root.getAttribute("data-engage-slug"),
    };
    return Promise.all([
      apiFetch("/api/reactions?" + qs(target)).then((res) => (res.ok ? res.json() : { likes: 0, dislikes: 0, mine: null })),
      apiFetch("/api/comments?" + qs(target)).then((res) => (res.ok ? res.json() : { comments: [] })),
    ])
      .then(([reactions, comments]) => {
        root._engageReady = true;
        renderMount(root, { reactions, comments: comments.comments || [] });
      })
      .catch(() => {
        root.hidden = true;
      });
  };

  const bindMount = (root) => {
    if (root.dataset.bound === "1") return;
    root.dataset.bound = "1";
    root.addEventListener("click", (event) => {
      const signin = event.target.closest("[data-engage-signin]");
      if (signin) {
        if (typeof window.__birinciOpenAuth === "function") window.__birinciOpenAuth("login");
        return;
      }
      const reactBtn = event.target.closest("[data-react]");
      if (reactBtn) {
        if (!currentUser()) {
          if (typeof window.__birinciOpenAuth === "function") window.__birinciOpenAuth("login");
          return;
        }
        const value = reactBtn.getAttribute("data-react");
        const mine = reactBtn.classList.contains("is-on");
        const target = {
          locale: root.getAttribute("data-engage-locale"),
          target_type: root.getAttribute("data-engage-type"),
          target_slug: root.getAttribute("data-engage-slug"),
        };
        const req = mine
          ? postAuth("/api/reactions", target, "DELETE")
          : postAuth("/api/reactions", Object.assign({ value }, target), "PUT");
        req.then(() => loadTarget(root)).catch(() => {
          if (typeof window.__birinciOpenAuth === "function") window.__birinciOpenAuth("login");
        });
        return;
      }
      const replyBtn = event.target.closest("[data-engage-reply]");
      if (replyBtn) {
        const host = replyBtn.closest(".engage-comment");
        if (!host || host.querySelector(".engage-form")) return;
        host.insertAdjacentHTML("beforeend", composerHtml(t("comment_reply_placeholder"), t("comment_reply"), replyBtn.getAttribute("data-engage-reply")));
        return;
      }
      const deleteBtn = event.target.closest("[data-engage-delete]");
      if (deleteBtn) {
        postAuth("/api/comments/" + deleteBtn.getAttribute("data-engage-delete"), {}, "DELETE")
          .then(() => loadTarget(root))
          .catch(() => {});
        return;
      }
      const editBtn = event.target.closest("[data-engage-edit]");
      if (editBtn) {
        const host = editBtn.closest(".engage-comment");
        const body = host && host.querySelector(".engage-comment__body");
        if (!host || !body || host.querySelector(".engage-form")) return;
        host.insertAdjacentHTML(
          "beforeend",
          '<form class="engage-form" data-edit="' +
            esc(editBtn.getAttribute("data-engage-edit")) +
            '"><textarea name="body" rows="3" maxlength="2000" required>' +
            esc(body.textContent) +
            '</textarea><button type="submit" class="engage-submit">' +
            esc(t("comment_edit")) +
            "</button></form>"
        );
      }
    });
    root.addEventListener("submit", (event) => {
      const form = event.target.closest(".engage-form");
      if (!form) return;
      event.preventDefault();
      const body = (form.body && form.body.value) || "";
      const editId = form.getAttribute("data-edit");
      const parent = form.getAttribute("data-parent") || "";
      const target = {
        locale: root.getAttribute("data-engage-locale"),
        target_type: root.getAttribute("data-engage-type"),
        target_slug: root.getAttribute("data-engage-slug"),
        body,
      };
      const req = editId
        ? postAuth("/api/comments/" + editId, { body }, "PATCH")
        : postAuth("/api/comments", Object.assign({ parent_comment_id: parent || null }, target));
      req.then(() => loadTarget(root)).catch((err) => {
        const note = document.createElement("p");
        note.className = "engage-note engage-note--error";
        note.textContent = err.message || t("comment_verify");
        form.appendChild(note);
      });
    });
  };

  const targetsOnPage = () => {
    if (document.body.getAttribute("data-kt-page-id") === "prominent-figures-preview") return [];
    if (/\/prominent-figures\//.test(location.pathname)) return [];
    const lang = currentLang();
    const found = [];
    document.querySelectorAll("article.story[data-stem]").forEach((el) => {
      found.push({ host: el, type: "story", slug: el.getAttribute("data-stem"), locale: lang });
    });
    document.querySelectorAll("article.inventions-entry[id]").forEach((el) => {
      if (el.closest(".engage")) return;
      found.push({ host: el, type: "discovery", slug: el.id, locale: lang });
    });
    return found;
  };

  const ensureMount = (item) => {
    let root = item.host.querySelector(":scope > .engage");
    if (!root) {
      root = document.createElement("div");
      root.className = "engage";
      item.host.appendChild(root);
    }
    root.setAttribute("data-engage-type", item.type);
    root.setAttribute("data-engage-slug", item.slug);
    root.setAttribute("data-engage-locale", item.locale);
    bindMount(root);
    return root;
  };

  const refreshAll = () => {
    targetsOnPage().forEach((item) => {
      const root = ensureMount(item);
      loadTarget(root);
    });
  };

  const injectFooterLink = () => {
    const list = document.querySelector(".footer-contact");
    if (!list || list.querySelector("[data-feedback-link]")) return;
    const lang = currentLang();
    const item = document.createElement("li");
    item.innerHTML =
      '<a class="footer-contact__link" data-feedback-link href="/feedback?lang=' +
      encodeURIComponent(lang) +
      "&page=" +
      encodeURIComponent(location.href) +
      '"><span class="footer-contact__value">' +
      esc(t("feedback_nav")) +
      "</span></a>";
    list.appendChild(item);
  };

  const start = () => {
    injectFooterLink();
    refreshAll();
  };

  window.__birinciRefreshEngage = start;

  const observer = new MutationObserver(() => {
    if (!targetsOnPage().some((item) => !item.host.querySelector(":scope > .engage"))) return;
    start();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
