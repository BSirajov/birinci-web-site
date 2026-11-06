/* Shared language navigation. Routes are generated from the published manifest. */
(() => {
  'use strict';
  const map = window.__BIRINCI_STORY_ROUTES__;
  if (!map) return;
  const script = document.currentScript;
  const base = new URL('../', script.src);
  const initial = new URL(location.href);
  let pinned = initial.searchParams.get('story-context') || '';
  let restoring = !!pinned;
  const expanded = initial.searchParams.get('reading') === 'expanded';
  const unavailable = initial.searchParams.get('unavailable-story') || '';
  const languages = Object.keys(map.categories);
  const unavailablePoem = (stem, code) => !!map.poems?.[stem] && !map.poems[stem].includes(code);
  const currentLanguage = () => (document.documentElement.lang || 'az').slice(0, 2);
  const usable = el => el && !el.hidden && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
  function activeStory() {
    const modal = document.querySelector('.text-lightbox:not([hidden])');
    if (modal && map.stories[modal.dataset.storyStem]) return modal.dataset.storyStem;
    if (restoring && map.stories[pinned]) return pinned;
    const articles = Array.from(document.querySelectorAll('article.story[id]')).filter(usable);
    let line = 220;
    for (const el of document.querySelectorAll('.site-header,.breadcrumbs,.tools-bar')) {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (usable(el) && ['fixed', 'sticky'].includes(style.position) && r.top <= line && r.bottom < innerHeight * .65) line = Math.max(line, r.bottom + 16);
    }
    // On phones the sticky toolbar wraps onto extra rows. Its outer wrapper,
    // rather than the non-sticky inner tools bar, defines the reading edge.
    if (innerWidth <= 768) {
      const toolbar = document.querySelector('.page-toolbar');
      const rect = toolbar?.getBoundingClientRect();
      if (usable(toolbar) && rect.top >= 0 && rect.bottom < innerHeight * .65) {
        line = Math.max(line, rect.bottom + 24);
      }
    }
    line = Math.min(line, innerHeight * .6);
    const visible = articles.filter(el => { const r = el.getBoundingClientRect(); return r.bottom > line && r.top < innerHeight - 20; });
    const reading = visible.find(el => el.getBoundingClientRect().top <= line) || visible[0];
    return reading && map.stories[reading.id] ? reading.id : '';
  }
  function href(code, context = {}) {
    if (!languages.includes(code)) return '';
    const stem = context.stem || activeStory();
    const translations = map.stories[stem];
    if (!translations) return '';
    if (unavailablePoem(stem, code)) return location.href;
    const source = translations[currentLanguage()] || Object.values(translations)[0];
    let route = translations[code];
    if (!route) {
      const category = source.match(/categories\/([^/#?]+)\.html/);
      route = category && map.categories[code].includes(category[1])
        ? `${code}/categories/${category[1]}.html` : `${code}/index.html`;
      const target = new URL(route, base);
      target.searchParams.set('unavailable-story', stem);
      return target.href;
    }
    // Keep the reading context on all-stories/search pages, using the same ID map.
    if (document.body.classList.contains('page-home')) route = `${code}/index.html#${encodeURIComponent(stem)}`;
    const target = new URL(route, base);
    const params = new URLSearchParams(location.search);
    for (const key of ['q','cat','author','sort']) {
      if (params.has(key)) target.searchParams.set(key, params.get(key));
    }
    const search = document.querySelector('[data-tools-search]');
    if (search) { if (search.value.trim()) target.searchParams.set('q', search.value.trim()); else target.searchParams.delete('q'); }
    if (document.body.classList.contains('page-home')) target.searchParams.set('view', 'list');
    target.searchParams.set('story-context', stem);
    if (document.querySelector('.text-lightbox:not([hidden])')) target.searchParams.set('reading', 'expanded');
    return target.href;
  }
  function sync() {
    const stem = activeStory();
    if (!stem) return;
    document.querySelectorAll('.lang-switcher a[data-lang]').forEach(a => { const url = href(a.dataset.lang, {stem}); if (url) a.href = url; });
  }
  window.BirinciStoryNavigation = {
    activeStory, href, sync,
    pinned: stem => !!pinned && stem === pinned,
  };
  let noticeTimer;
  const poemMessages = {
    az: 'Bu şeir hələ Azərbaycan dilinə tərcümə olunmayıb.',
    en: 'This poem is not yet available in English.',
    de: 'Dieses Gedicht ist noch nicht auf Deutsch verfügbar.',
    ru: 'Это стихотворение пока недоступно на русском языке.',
    ky: 'Бул ыр кыргыз тилине азырынча которула элек.',
  };
  function showPoemNotice(code) {
    let notice = document.querySelector('[data-poem-translation-notice]');
    if (!notice) {
      notice = document.createElement('p');
      notice.dataset.poemTranslationNotice = '';
      notice.className = 'poem-translation-notice';
      notice.setAttribute('role', 'status');
      notice.setAttribute('aria-live', 'polite');
      document.body.append(notice);
    }
    notice.lang = code;
    notice.textContent = poemMessages[code];
    notice.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { notice.hidden = true; }, 6000);
    // Close the menu without moving focus or changing the active language.
    window.__birinciCloseLangMenu?.();
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('.lang-switcher a[data-lang]');
    if (!link) return;
    if (unavailablePoem(activeStory(), link.dataset.lang)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showPoemNotice(link.dataset.lang);
      return;
    }
    const url = href(link.dataset.lang);
    if (!url) return;
    link.href = url;
    // Preserve native new-tab behavior and make ordinary switches deterministic.
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) { event.stopImmediatePropagation(); return; }
    event.preventDefault();
    event.stopImmediatePropagation();
    try { localStorage.setItem('birinci-lang', link.dataset.lang); sessionStorage.removeItem('birinci-lang-ctx'); } catch (_) {}
    location.assign(url);
  }, true);
  document.addEventListener('pointerdown', event => { if (event.target.closest('.lang-switcher')) sync(); }, true);
  document.addEventListener('focusin', event => { if (event.target.closest('.lang-switcher')) sync(); }, true);
  document.addEventListener('input', event => {
    if (event.target.matches('[data-tools-search],#filterStoryAuthor')) {
      pinned = '';
      const url = new URL(location.href);
      url.searchParams.delete('story-context'); url.searchParams.delete('reading');
      history.replaceState(history.state, '', url);
    }
  }, true);
  let scheduled = false;
  addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; sync(); });
  }, {passive: true});
  const notices = {
    az: ['Bu hekayənin seçilmiş dilə tərcüməsi hələ yoxdur. Müvafiq bölmə açılıb. Mövcud dillər:', 'Axtarışınız saxlanılıb. Hazırda oxuduğunuz hekayə axtarışa uyğun gəlməsə də göstərilir.'],
    en: ['This story is not yet available in the selected language. The closest section is shown. Available languages:', 'Your search has been kept. The story you are reading stays visible even if it does not match.'],
    de: ['Diese Geschichte ist in der gewählten Sprache noch nicht verfügbar. Die passende Rubrik wurde geöffnet. Verfügbare Sprachen:', 'Ihre Suche bleibt erhalten. Die gerade gelesene Geschichte bleibt sichtbar, auch wenn sie nicht zur Suche passt.'],
    ru: ['Перевода этого рассказа на выбранный язык пока нет. Открыт соответствующий раздел. Доступные языки:', 'Ваш поисковый запрос сохранён. Рассказ, который вы читаете, остаётся видимым, даже если он не соответствует запросу.'],
    ky: ['Бул аңгеме тандалган тилге азырынча которула элек. Тиешелүү бөлүм ачылды. Аңгеме бар тилдер:', 'Издөө сурамыңыз сакталды. Окуп жаткан аңгемеңиз сурамга туура келбесе да көрсөтүлөт.'],
  };
  document.addEventListener('DOMContentLoaded', () => {
    // A retired story keeps its old address, but the page no longer contains it.
    let hashId = '';
    try { hashId = decodeURIComponent((location.hash || '').replace(/^#/, '')); }
    catch (_) { hashId = (location.hash || '').replace(/^#/, ''); }
    const context = new URL(location.href).searchParams.get('story-context') || '';
    const missing = stem => stem && !map.stories[stem] && !document.getElementById(stem);
    if (missing(hashId) || missing(context)) {
      const url = new URL(location.href);
      if (missing(hashId)) url.hash = '';
      if (missing(context)) url.searchParams.delete('story-context');
      history.replaceState(history.state, '', url.pathname + url.search + url.hash);
      if (missing(context)) pinned = '';
    }
    const text = notices[currentLanguage()] || notices.en;
    if (map.stories[unavailable] || (pinned && initial.searchParams.get('q'))) {
      const notice = document.createElement('p');
      notice.className = 'story-translation-notice';
      notice.setAttribute('role', 'status');
      notice.dataset.storyTranslationNotice = '';
      notice.textContent = text[unavailable ? 0 : 1] + ' ';
      if (map.stories[unavailable]) for (const [lang, route] of Object.entries(map.stories[unavailable])) {
        const link = document.createElement('a'); link.href = new URL(route, base).href; link.textContent = lang.toUpperCase();
        notice.append(link, document.createTextNode(' '));
      }
      (document.querySelector('#main') || document.body).prepend(notice);
    }
    sync();
    if (pinned) {
      let attempts = 0;
      const restore = () => {
        const el = document.getElementById(pinned);
        // Category ordering is applied when the catalog arrives. Align after it,
        // not against the temporary server-rendered order.
        const ready = window.__BIRINCI_STORIES__?.lang === currentLanguage();
        if ((!usable(el) || !ready) && attempts++ < 50) { setTimeout(restore, 100); return; }
        if (!usable(el)) { restoring = false; return; }
        if (typeof window.__birinciScrollToStoryOrArticle === 'function') window.__birinciScrollToStoryOrArticle(pinned);
        else el.scrollIntoView();
        if (expanded) el.querySelector('.story__title')?.click();
        requestAnimationFrame(() => requestAnimationFrame(() => { restoring = false; sync(); }));
      };
      setTimeout(restore, 100);
    }
  });
})();
