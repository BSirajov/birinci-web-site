
(() => {
  const header = document.querySelector(".site-header");
  const dropdown = document.querySelector(".nav-dropdown");
  const navToggle = document.getElementById("nav-toggle");
  const primaryNav = document.getElementById("primaryNav");
  const mobileNavQuery = window.matchMedia("(max-width: 860px)");

  const closeMobileNav = () => {
    if (!header || !navToggle) return;
    header.classList.remove("is-nav-open");
    document.body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Menyunu aç");
  };

  const openMobileNav = () => {
    if (!header || !navToggle || !dropdown) return;
    header.classList.add("is-nav-open");
    document.body.classList.add("nav-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Menyunu bağla");
    dropdown.open = true;
  };

  if (navToggle && header && dropdown) {
    navToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      if (header.classList.contains("is-nav-open")) closeMobileNav();
      else openMobileNav();
    });
    mobileNavQuery.addEventListener("change", (event) => {
      if (!event.matches) {
        closeMobileNav();
        dropdown.open = false;
      }
    });
  }

  if (dropdown) {
    document.addEventListener("click", (event) => {
      if (mobileNavQuery.matches) {
        if (!header || !header.classList.contains("is-nav-open")) return;
        if (header.contains(event.target)) return;
        closeMobileNav();
        return;
      }
      if (!dropdown.open) return;
      if (!dropdown.contains(event.target)) dropdown.open = false;
    });
    dropdown.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        dropdown.open = false;
        closeMobileNav();
      });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      dropdown.open = false;
      closeMobileNav();
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

    const kbdHint = toggle.querySelector(".global-search-toggle__kbd");
    if (kbdHint && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || "")) {
      kbdHint.textContent = "⌘K";
      toggle.title = "Axtar (⌘K)";
      toggle.setAttribute("aria-label", "Qlobal axtarış, Command+K");
    }

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

  const initStoryTts = () => {
    const buttons = Array.from(document.querySelectorAll("[data-story-tts]"));
    if (!buttons.length) return;

    const unsupportedMessage =
      "Hörmətli oxucu, təəssüf ki, bu cihazda və ya brauzerdə səsə çevirmə (TTS) xidməti mövcud deyil. Zəhmət olmasa hekayəni oxuyaraq davam edin.";
    const noVoiceMessage =
      "Hörmətli oxucu, bu cihazda Azərbaycan nitq səsi tapılmadı.";
    const failedMessage =
      "Hörmətli oxucu, hazırda səsə çevirməni başlatmaq mümkün olmadı. Zəhmət olmasa bir az sonra yenidən cəhd edin və ya hekayəni oxuyun.";
    const audioFailedMessage =
      "Hörmətli oxucu, səs faylını oxumaq mümkün olmadı. Zəhmət olmasa bir az sonra yenidən cəhd edin.";

    let activeBtn = null;
    let utterance = null;
    let audioPlayer = null;
    let suppressError = false;

    const setLabel = (btn, text) => {
      const label = btn.querySelector("[data-story-tts-label]");
      if (label) label.textContent = text;
    };

    const showNote = (btn, message) => {
      const note = btn.parentElement && btn.parentElement.querySelector("[data-story-tts-note]");
      if (!note) return;
      note.hidden = !message;
      note.textContent = message || "";
    };

    const clearActive = () => {
      if (!activeBtn) return;
      activeBtn.setAttribute("aria-pressed", "false");
      setLabel(activeBtn, "Dinlə");
      activeBtn = null;
      utterance = null;
    };

    const stopAudio = () => {
      if (!audioPlayer) return;
      audioPlayer.pause();
      audioPlayer.removeAttribute("src");
      audioPlayer.load();
      audioPlayer = null;
    };

    const stopSpeech = () => {
      suppressError = true;
      stopAudio();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      clearActive();
      window.setTimeout(() => {
        suppressError = false;
      }, 80);
    };

    const isPlaying = (btn) => {
      if (activeBtn !== btn) return false;
      if (audioPlayer && !audioPlayer.paused && !audioPlayer.ended) return true;
      if (window.speechSynthesis && window.speechSynthesis.speaking) return true;
      return false;
    };

    const loadVoices = () =>
      new Promise((resolve) => {
        if (!window.speechSynthesis) {
          resolve([]);
          return;
        }
        const current = () => window.speechSynthesis.getVoices() || [];
        const now = current();
        if (now.length) {
          resolve(now);
          return;
        }
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          window.speechSynthesis.onvoiceschanged = null;
          resolve(current());
        };
        window.speechSynthesis.onvoiceschanged = finish;
        window.setTimeout(finish, 800);
      });

    const pickVoice = (voices) =>
      voices.find((v) => (v.lang || "").toLowerCase().startsWith("az")) ||
      voices.find((v) => /azərbaycan|azerbaijani/i.test(v.name || "")) ||
      voices.find((v) => (v.lang || "").toLowerCase().startsWith("tr")) ||
      voices.find((v) => /turkish|türk/i.test(v.name || "")) ||
      null;

    const textForSpeech = (story) => {
      const textEl = story && story.querySelector(".story__text");
      const title = ((story && story.dataset.title) || "").trim();
      const paras = textEl
        ? Array.from(textEl.querySelectorAll("p"))
            .map((p) => p.textContent.replace(/\s+/g, " ").trim())
            .filter(Boolean)
        : [];
      let body = paras.join(" ");
      body = body
        .replace(/[\u00AD\u200B-\u200D\uFEFF]/g, "")
        .replace(/[«»„“”]/g, "")
        .replace(/[‘’]/g, "")
        .replace(/[—–-]+\s*/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (!body) return title;
      if (title && body.toLocaleLowerCase("az").startsWith(title.toLocaleLowerCase("az"))) {
        return body;
      }
      return title ? `${title}. ${body}` : body;
    };

    const playAudioStory = (btn, src) => {
      stopSpeech();
      showNote(btn, "");

      const player = new Audio(src);
      audioPlayer = player;

      player.addEventListener("playing", () => {
        activeBtn = btn;
        btn.setAttribute("aria-pressed", "true");
        setLabel(btn, "Dayandır");
      });
      player.addEventListener("ended", () => {
        if (audioPlayer === player) audioPlayer = null;
        clearActive();
      });
      player.addEventListener("error", () => {
        if (suppressError) {
          clearActive();
          return;
        }
        if (audioPlayer === player) audioPlayer = null;
        clearActive();
        showNote(btn, audioFailedMessage);
      });

      const start = player.play();
      if (start && typeof start.catch === "function") {
        start.catch(() => {
          if (audioPlayer === player) audioPlayer = null;
          clearActive();
          showNote(btn, audioFailedMessage);
        });
      }
    };

    const speakStory = async (btn) => {
      if (!("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance !== "function") {
        showNote(btn, unsupportedMessage);
        return;
      }

      const story = btn.closest(".story");
      const text = textForSpeech(story);
      if (!text) {
        showNote(btn, failedMessage);
        return;
      }

      const voices = await loadVoices();
      const voice = pickVoice(voices);
      if (!voice) {
        stopSpeech();
        showNote(btn, noVoiceMessage);
        return;
      }

      stopSpeech();
      showNote(btn, "");

      utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = (voice.lang || "az-AZ").startsWith("tr") ? "tr-TR" : "az-AZ";
      utterance.voice = voice;
      utterance.rate = 1;
      utterance.pitch = 1;

      utterance.onstart = () => {
        activeBtn = btn;
        btn.setAttribute("aria-pressed", "true");
        setLabel(btn, "Dayandır");
      };
      utterance.onend = () => clearActive();
      utterance.onerror = () => {
        if (suppressError) {
          clearActive();
          return;
        }
        clearActive();
        showNote(btn, failedMessage);
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        clearActive();
        showNote(btn, unsupportedMessage);
      }
    };

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (isPlaying(btn)) {
          stopSpeech();
          showNote(btn, "");
          return;
        }
        const story = btn.closest(".story");
        const audioSrc = story && story.dataset.audio;
        if (audioSrc) {
          playAudioStory(btn, audioSrc);
          return;
        }
        speakStory(btn);
      });

      const actions = btn.closest(".story__actions") || btn.parentElement;
      if (actions) {
        actions.addEventListener("mouseleave", () => showNote(btn, ""));
        actions.addEventListener("focusout", (event) => {
          if (!actions.contains(event.relatedTarget)) showNote(btn, "");
        });
      }
    });

    window.addEventListener("beforeunload", stopSpeech);
  };

  initStoryTts();

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
