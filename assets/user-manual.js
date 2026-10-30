/* Progressive enhancement: the complete guide remains readable without JS. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const search = $('#guide-search'), topic = $('#guide-topic');
  const sections = [...document.querySelectorAll('.guide-section')];
  const texts = [...document.querySelectorAll('[data-search-text]')];
  const originals = new Map(texts.map(n => [n, n.textContent]));
  const normalize = s => s.toLocaleLowerCase(document.documentElement.lang).normalize('NFD').replace(/\p{M}/gu, '');
  const hay = new Map(sections.map(s => [s, normalize(s.textContent)]));
  const params = new URLSearchParams(location.search);
  search.value = params.get('q') || '';
  if ([...topic.options].some(o => o.value === params.get('topic'))) topic.value = params.get('topic');
  function updateUrl() {
    const p = new URLSearchParams();
    if (search.value.trim()) p.set('q', search.value.trim());
    if (topic.value !== 'all') p.set('topic', topic.value);
    try { history.replaceState(null, '', location.pathname + (p.size ? '?' + p : '') + location.hash); } catch (_) { /* file preview */ }
  }
  function highlight(node, terms) {
    const text = originals.get(node);
    node.textContent = '';
    // Map normalized offsets back to Unicode source offsets (including accents).
    let folded = '', offsets = [];
    for (let i = 0; i < text.length;) {
      const ch = String.fromCodePoint(text.codePointAt(i));
      const part = normalize(ch);
      for (let j = 0; j < part.length; j++) offsets.push([i, i + ch.length]);
      folded += part; i += ch.length;
    }
    const ranges = [];
    for (const term of terms) {
      let pos = 0;
      while ((pos = folded.indexOf(term, pos)) !== -1) {
        ranges.push([offsets[pos][0], offsets[pos + term.length - 1][1]]); pos += term.length;
      }
    }
    ranges.sort((a,b) => a[0]-b[0]);
    const merged = [];
    for (const r of ranges) {
      if (merged.length && r[0] <= merged.at(-1)[1]) merged.at(-1)[1] = Math.max(r[1], merged.at(-1)[1]);
      else merged.push(r);
    }
    let end = 0;
    for (const [a,b] of merged) {
      node.append(document.createTextNode(text.slice(end,a)));
      const mark = document.createElement('mark'); mark.textContent = text.slice(a,b); node.append(mark); end = b;
    }
    node.append(document.createTextNode(text.slice(end)));
  }
  function filter() {
    const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    let count = 0;
    for (const s of sections) {
      s.hidden = !((topic.value === 'all' || s.dataset.topic === topic.value) && terms.every(t => hay.get(s).includes(t)));
      document.querySelector(`[data-section="${s.id}"]`).parentElement.hidden = s.hidden;
      if (!s.hidden) { count++; if (terms.length) s.querySelector('details').open = true; }
    }
    for (const n of texts) highlight(n, terms);
    $('#no-results').hidden = count !== 0;
    updateUrl();
  }
  search.addEventListener('input', filter); topic.addEventListener('change', filter);
  function revealAnchor() {
    const s = sections.find(s => '#' + s.id === location.hash);
    if (!s) return;
    if (s.hidden) { search.value = ''; topic.value = 'all'; filter(); }
    s.querySelector('details').open = true;
    requestAnimationFrame(() => s.scrollIntoView());
  }
  window.addEventListener('hashchange', revealAnchor);
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', () => {
    const s = sections.find(s => '#' + s.id === a.getAttribute('href')); if (s) s.querySelector('details').open = true;
  }));
  const dialog = $('#screenshot-dialog');
  document.querySelectorAll('.screenshot').forEach(a => a.addEventListener('click', event => {
    if (!dialog.showModal) return;
    event.preventDefault(); const img = a.querySelector('img');
    dialog.querySelector('img').src = a.href; dialog.querySelector('img').alt = img.alt;
    $('#screenshot-caption').textContent = img.alt; dialog.showModal();
  }));
  $('#close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r=dialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) dialog.close(); } });
  let printState;
  window.addEventListener('beforeprint', () => { printState = sections.map(s => s.querySelector('details').open); sections.forEach(s => { s.querySelector('details').open = true; }); });
  window.addEventListener('afterprint', () => { if (printState) sections.forEach((s,i) => { s.querySelector('details').open = printState[i]; }); });
  document.querySelectorAll('.lang-switcher__option').forEach(a => a.addEventListener('click', () => { const url = new URL(a.href); url.hash = location.hash; if (topic.value !== 'all') url.searchParams.set('topic',topic.value); a.href = url.href; a.setAttribute('data-lang-target',url.href); }));
  $('.controls').hidden = false;
  const toolbar = $('.manual-tools');
  const measureToolbar = () => document.documentElement.style.setProperty('--manual-tools-h', `${Math.ceil(toolbar.getBoundingClientRect().height)}px`);
  measureToolbar();
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(measureToolbar).observe(toolbar);
  else window.addEventListener('resize', measureToolbar);
  const sidebar = $('.layout > aside');
  const list = $('#manual-contents-list');
  const toggle = $('.contents-toggle');
  const compact = matchMedia('(max-width:900px)');
  toggle.hidden = false;
  sidebar.classList.add('contents-enhanced');
  function closeContents(returnFocus = false) {
    sidebar.classList.remove('contents-open');
    toggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) toggle.focus();
  }
  toggle.addEventListener('click', () => {
    const open = sidebar.classList.toggle('contents-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sidebar.classList.contains('contents-open')) closeContents(true);
  });
  document.addEventListener('click', e => { if (!sidebar.contains(e.target)) closeContents(); });
  list.addEventListener('click', e => { if (e.target.closest('a')) closeContents(); });
  compact.addEventListener('change', () => closeContents());
  let activeSection, scheduled = false;
  function syncContents() {
    scheduled = false;
    const visible = sections.filter(s => !s.hidden);
    const edge = toolbar.getBoundingClientRect().bottom + (compact.matches ? sidebar.querySelector('h2').offsetHeight : 0) + 24;
    let current = visible[0];
    for (const s of visible) { if (s.getBoundingClientRect().top <= edge) current = s; }
    if (current === activeSection) return;
    activeSection = current;
    list.querySelectorAll('a').forEach(a => {
      const on = current && a.dataset.section === current.id;
      a.classList.toggle('is-active', !!on);
      if (on) {
        a.setAttribute('aria-current', 'location');
        const r = a.getBoundingClientRect(), box = list.getBoundingClientRect();
        if (r.top < box.top || r.bottom > box.bottom) list.scrollTop += r.top - box.top - box.height / 2 + r.height / 2;
      } else a.removeAttribute('aria-current');
    });
  }
  const scheduleContents = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(syncContents); } };
  window.addEventListener('scroll', scheduleContents, {passive:true});
  window.addEventListener('resize', scheduleContents);
  search.addEventListener('input', scheduleContents);
  topic.addEventListener('change', scheduleContents);
  sidebar.addEventListener('toggle', scheduleContents, true);
  filter(); revealAnchor();
  scheduleContents();
})();
