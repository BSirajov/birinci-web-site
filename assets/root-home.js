(function () {
  var body = document.body;
  if (!body || !body.classList.contains("page-root-home")) return;
  var dataEl = document.getElementById("root-entry-i18n");
  if (!dataEl) return;
  var pack;
  try {
    pack = JSON.parse(dataEl.textContent || "{}");
  } catch (_) {
    return;
  }
  var langs = Object.keys(pack);
  function normLang(code) {
    return langs.indexOf(code) >= 0 ? code : "az";
  }
  function readLang() {
    try {
      var stored = localStorage.getItem("birinci-lang");
      if (stored && langs.indexOf(stored) >= 0) return stored;
    } catch (_) {}
    return "az";
  }
  function applyLang(code) {
    code = normLang(code);
    var L = pack[code] || pack.az;
    if (!L) return;
    document.documentElement.lang = code;
    body.setAttribute("data-lang", code);
    if (L.page_title) {
      document.title = L.page_title;
      var ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", L.page_title);
      var twTitle = document.querySelector('meta[name="twitter:title"]');
      if (twTitle) twTitle.setAttribute("content", L.page_title);
    }
    document.querySelectorAll("[data-root-entry]").forEach(function (link) {
      var key = link.getAttribute("data-root-entry");
      var card = L.cards && L.cards[key];
      if (!card) return;
      link.href = card.href;
      var title = link.querySelector(".card-title");
      var desc = link.querySelector(".card-desc");
      if (title) title.textContent = card.title || "";
      if (desc) desc.textContent = card.desc || "";
    });
    var sectionTitle = document.getElementById("root-entry-title");
    if (sectionTitle && L.section_label) sectionTitle.textContent = L.section_label;
    var tagline = document.querySelector(".intro__tagline");
    if (tagline && L.hero_lead) tagline.textContent = L.hero_lead;
    var lead = document.querySelector(".intro__lead");
    if (lead && L.intro_lead) lead.textContent = L.intro_lead;
    var source = document.querySelector(".intro__source-text");
    if (source && L.intro_source) {
      var srcLines = String(L.intro_source).split(/\n+/).map(function (line) {
        return String(line || "").trim();
      }).filter(Boolean);
      source.textContent = "";
      srcLines.forEach(function (line) {
        var row = document.createElement("span");
        row.className = "intro__source-line";
        row.textContent = line;
        source.appendChild(row);
      });
    }
    var footerAbout = document.querySelector(".footer-about");
    if (footerAbout && L.footer_about) footerAbout.textContent = L.footer_about;
    var storiesAll = document.querySelector("[data-nav-stories-all]");
    if (storiesAll) {
      if (L.stories_all_href) storiesAll.href = L.stories_all_href;
      var litNav = storiesAll.querySelector("span:not(.menu-icon)");
      if (litNav && L.nav_label) litNav.textContent = L.nav_label;
    }
    var search = document.getElementById("global-search");
    if (search && L.search_index) search.setAttribute("data-search-index", L.search_index);
    var ui = L.ui || {};
    var homeCrumb = document.querySelector('.breadcrumbs__item[aria-current="page"] span');
    if (homeCrumb) homeCrumb.textContent = L.home_crumb;
    var legal = document.querySelector('.footer-legal');
    if (legal) {
      legal.setAttribute('aria-label', L.footer_legal_label);
      legal.querySelectorAll('a').forEach(function (link) {
        var filename = (link.getAttribute('href') || '').split('/').pop();
        var item = (L.about_menu || []).find(function (entry) { return entry.href.split('/').pop() === filename; });
        if (item) { link.href = item.href; link.textContent = item.title; }
      });
    }
    var qr = document.querySelector('.footer-qr');
    if (qr) {
      qr.title = L.qr_label;
      var qrImage = qr.querySelector('img');
      if (qrImage) qrImage.alt = L.qr_label;
    }
    function setText(el, text) {
      if (el && text) el.textContent = text;
    }
    function setAttr(el, name, value) {
      if (el && value) el.setAttribute(name, value);
    }
    setText(document.querySelector(".skip-link"), ui.skip_to_content);
    setAttr(document.getElementById("nav-toggle"), "aria-label", ui.open_menu);
    setAttr(document.getElementById("primaryNav"), "aria-label", ui.main_menu);
    setAttr(document.querySelector(".lang-switcher"), "aria-label", ui.lang_switcher_label);
    var disc = document.querySelector('.primary-nav a[href*="discoveries"]');
    if (disc) {
      if (L.discoveries_href) disc.setAttribute("href", L.discoveries_href);
      setText(disc.querySelector("span:not(.menu-icon)"), L.discoveries_label);
    }
    setText(
      document.querySelector(".nav-dropdown--about .nav-dropdown__summary > span:not(.menu-icon)"),
      L.about_label
    );
    (L.about_menu || []).forEach(function (item) {
      if (!item || !item.id) return;
      var el = document.querySelector('.primary-nav [data-nav-id="' + item.id + '"]');
      if (!el) return;
      if (item.href) el.setAttribute("href", item.href);
      setText(el.querySelector(".nav-dropdown-link-title") || el.querySelector("span:not(.menu-icon)"), item.title);
    });
    var legalTitle = document.querySelector(
      ".nav-dropdown--about [data-nav-legal-group] .nav-dropdown-link-title"
    );
    if (legalTitle && L.about_legal && L.about_legal.title) {
      legalTitle.textContent = L.about_legal.title;
    }
    var searchToggle = document.getElementById("global-search-toggle");
    setAttr(searchToggle, "title", ui.global_search_title_attr);
    setAttr(searchToggle, "aria-label", ui.global_search_toggle);
    setText(document.querySelector(".global-search-toggle__label"), ui.search);
    setText(document.getElementById("global-search-title"), ui.global_search);
    document.querySelectorAll("[data-global-search-close]").forEach(function (btn) {
      setAttr(
        btn,
        "aria-label",
        btn.classList.contains("global-search__backdrop") ? ui.close_search : ui.close
      );
    });
    setText(document.querySelector(".global-search__field .visually-hidden"), ui.search_stories_label);
    var searchInput = document.getElementById("global-search-input");
    if (searchInput && ui.search_stories_placeholder) {
      searchInput.setAttribute("placeholder", ui.search_stories_placeholder);
    }
    setAttr(document.querySelector(".page-jump"), "aria-label", L.page_jump);
    var goBottom = document.getElementById("go-to-bottom");
    setAttr(goBottom, "title", ui.go_to_bottom);
    setAttr(goBottom, "aria-label", ui.go_to_bottom);
    var backTop = document.getElementById("back-to-top");
    setAttr(backTop, "title", ui.back_to_top);
    setAttr(backTop, "aria-label", ui.back_to_top);
    setText(document.querySelector(".footer-logo__tagline"), L.hero_lead);
    setText(document.querySelector(".footer-contact__title"), ui.footer_contact);
    document.querySelectorAll(".footer-contact li").forEach(function (li) {
      if (li.querySelector(".footer-contact__link")) return;
      var label = li.querySelector(".footer-contact__label");
      if (!label) return;
      if (li.querySelector(".menu-icon--phone")) setText(label, ui.footer_phone);
      if (li.querySelector(".menu-icon--map-pin")) setText(label, ui.footer_address);
    });
    document.querySelectorAll(".footer-contact__link").forEach(function (link) {
      var href = link.getAttribute("href") || "";
      var tip = "";
      if (href.indexOf("mailto:") === 0) tip = ui.footer_email;
      else if (href.indexOf("birinci.cloud") !== -1) tip = ui.footer_website;
      if (!tip) return;
      setAttr(link, "title", tip);
      setAttr(link.querySelector(".menu-icon"), "title", tip);
      setAttr(link.querySelector(".footer-contact__value"), "title", tip);
    });
    var meta = document.querySelector('meta[name="description"]');
    if (meta && L.meta_description) meta.setAttribute("content", L.meta_description);
    if (L.meta_description) {
      var ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", L.meta_description);
      var twDesc = document.querySelector('meta[name="twitter:description"]');
      if (twDesc) twDesc.setAttribute("content", L.meta_description);
    }
    var ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale && L.og_locale) ogLocale.setAttribute("content", L.og_locale);
    var runtime = window.__BIRINCI_I18N__;
    if (runtime) {
      runtime.lang = code;
      if (!runtime.ui) runtime.ui = {};
      Object.keys(ui).forEach(function (key) {
        runtime.ui[key] = ui[key];
      });
      if (L.js) {
        if (!runtime.js) runtime.js = {};
        Object.keys(L.js).forEach(function (key) {
          runtime.js[key] = L.js[key];
        });
      }
    }
    var switcher = document.querySelector(".lang-switcher");
    if (switcher) {
      switcher.querySelectorAll("a[data-lang]").forEach(function (link) {
        var lc = link.getAttribute("data-lang");
        var selected = lc === code;
        link.setAttribute("aria-selected", selected ? "true" : "false");
        if (selected) {
          var toggle = switcher.querySelector(".lang-switcher__toggle");
          var flag = link.querySelector(".lang-switcher__flag");
          var label = link.querySelector("span:last-child");
          if (toggle && flag) {
            var toggleFlag = toggle.querySelector(".lang-switcher__flag");
            var toggleName = toggle.querySelector(".lang-switcher__name");
            if (toggleFlag) toggleFlag.src = flag.src;
            if (toggleName && label) toggleName.textContent = label.textContent;
            if (link.title) toggle.title = link.title;
          }
        }
      });
    }
    if (typeof window.__birinciRefreshAuthChrome === "function") {
      window.__birinciRefreshAuthChrome();
    }
    var copyright = document.querySelector('.footer-copy');
    if (copyright && ui.footer_rights_reserved) {
      var stamp = copyright.querySelector('.footer-build');
      copyright.textContent = '© Birİnci – ' + ui.footer_rights_reserved;
      if (stamp) copyright.appendChild(stamp);
    }
    if (typeof window.__birinciRenderFooterBuild === 'function') window.__birinciRenderFooterBuild();
  }
  document.addEventListener(
    "click",
    function (event) {
      var link =
        event.target.closest &&
        event.target.closest(".lang-switcher a[data-lang]");
      if (!link) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      var code = link.getAttribute("data-lang") || "az";
      try {
        localStorage.setItem("birinci-lang", code);
      } catch (_) {}
      if (!pack[code]) {
        window.location.assign(link.href);
        return;
      }
      applyLang(code);
      var menu = document.querySelector('.lang-switcher__menu');
      if (menu) {
        if (typeof menu.hidePopover === 'function') menu.hidePopover();
        menu.hidden = true;
      }
      var toggle = document.querySelector('.lang-switcher__toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    },
    true
  );
  document.querySelectorAll("[data-root-entry]").forEach(function (link) {
    link.addEventListener("click", function () {
      var key = link.getAttribute("data-root-entry");
      try {
        if (key === "stories") localStorage.setItem("birinci-home-view", "cards");
        if (key === "discoveries") localStorage.setItem("birinci-inventions-view", "cards");
      } catch (_) {}
    });
  });
  var storiesAllLink = document.querySelector("[data-nav-stories-all]");
  if (storiesAllLink) {
    storiesAllLink.addEventListener("click", function () {
      try {
        localStorage.setItem("birinci-home-view", "list");
      } catch (_) {}
    });
  }
  applyLang(readLang());
  document.addEventListener("DOMContentLoaded", function () {
    applyLang(readLang());
  });
})();
