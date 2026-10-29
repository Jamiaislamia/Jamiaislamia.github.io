/* ═══════════════════════════════════════════════════════════════
   BOOT — content loading on a slow link, preloading on a good one.

   The site is static, so there is no build-time render to wait for; what
   actually makes a page feel slow on 2G/3G is the document + the photos.
   This file therefore does one of two things:

     · SLOW  (saveData, or effectiveType slow-2g/2g/3g, or the document is
              still not loaded 700 ms after this script ran)
         → the wifi-loader overlay is shown straight away with the text
           “কনটেন্ট লোড হচ্ছে…”, and it stays until the page has actually
           loaded. Clicking a link keeps it up while the next page arrives.

     · FAST  (anything else)
         → the overlay never paints (no flash on a fast load); instead the
           next pages and the JSON data files are prefetched while the
           browser is idle, so navigation is instant.

   Nothing here blocks the page: a 15 s cap always removes the overlay, and
   `prefers-reduced-motion` freezes the rings in CSS rather than delaying it.

   State is exposed for the test-suite and for debugging:
     <html data-conn="slow|fast" data-loading="on|off">
     window.__siteLoader = { conn, prefetched, show, hide }
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var root = document.documentElement;
  var t0 = Date.now();
  var loader = null;
  var shown = false;
  var shownAt = 0;
  var loaded = false;
  var prefetched = [];

  var MIN_SHOW = 420;      /* long enough to read, short enough not to annoy */
  var GUARD_MS = 700;      /* fast link: only paint if the page is genuinely slow */
  var CAP_MS = 15000;      /* never trap a visitor behind the overlay */

  /* ── how good is this connection? ────────────────────────── */
  function connectionInfo() {
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
    var type = (c && c.effectiveType) || '';
    var saveData = !!(c && c.saveData);
    var slow = saveData || type === 'slow-2g' || type === '2g' || type === '3g';
    return { type: type || 'unknown', saveData: saveData, slow: slow };
  }
  var conn = connectionInfo();
  root.setAttribute('data-conn', conn.slow ? 'slow' : 'fast');
  root.setAttribute('data-loading', 'off');

  /* ── the overlay ─────────────────────────────────────────── */
  function setText(msg) {
    if (!loader) return;
    var t = loader.querySelector('.text');
    if (t) t.setAttribute('data-text', msg);
  }

  function show(msg) {
    if (!loader || shown) return;
    if (msg) setText(msg);
    loader.classList.add('is-on');
    loader.setAttribute('aria-hidden', 'false');
    root.setAttribute('data-loading', 'on');
    shown = true;
    shownAt = Date.now();
  }

  function hide() {
    if (!loader) return;
    loader.classList.remove('is-on');
    loader.setAttribute('aria-hidden', 'true');
    root.setAttribute('data-loading', 'off');
    shown = false;
  }

  /* keep it on screen long enough to read when it did appear */
  function hideSoon() {
    var held = Date.now() - shownAt;
    if (shown && held < MIN_SHOW) setTimeout(hide, MIN_SHOW - held);
    else hide();
  }

  /* ── preloading (fast connection only) ───────────────────── */
  function prefetch(url, as) {
    if (!url) return;
    try {
      var l = document.createElement('link');
      l.rel = 'prefetch';
      if (as) l.as = as;
      l.href = url;
      document.head.appendChild(l);
      prefetched.push(url);
    } catch (e) { /* a missing prefetch must never break the page */ }
  }

  function preloadNext() {
    if (conn.slow || conn.saveData || navigator.onLine === false) return;
    var pages = ['teachers.html', 'explore.html', 'apply-student.html', 'apply-teacher.html'];
    var data = ['history.json', 'different.json', 'teachers.json', 'photos.json'];
    pages.forEach(function (p) { prefetch(p, 'document'); });
    data.forEach(function (d) { prefetch(d, 'fetch'); });
  }

  function whenIdle(fn) {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(fn, { timeout: 2500 });
    else setTimeout(fn, 600);
  }

  /* ── wire it up ──────────────────────────────────────────── */
  function onLoaded() {
    if (loaded) return;
    loaded = true;
    if (shown) hideSoon();
    else hide();
    whenIdle(preloadNext);
  }

  function boot() {
    loader = document.getElementById('siteLoader');
    if (!loader) return;

    /* a slow link: show immediately, with the honest message */
    if (conn.slow) {
      show('কনটেন্ট লোড হচ্ছে…');
    } else {
      /* a good link: stay out of the way unless the page really is slow */
      setTimeout(function () {
        if (!loaded) show('লোড হচ্ছে…');
      }, GUARD_MS);
    }

    /* slow link: keep the overlay up while the next page is fetched */
    document.addEventListener('click', function (ev) {
      if (!conn.slow) return;
      var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#' || /^(https?:)?\/\//i.test(href) || href.indexOf('mailto:') === 0) return;
      if (a.target === '_blank') return;
      show('পৃষ্ঠা লোড হচ্ছে…');
    }, true);

    /* the page may already be complete when this runs */
    if (document.readyState === 'complete') onLoaded();
    else window.addEventListener('load', onLoaded);

    /* absolute safety net */
    setTimeout(function () { if (shown) hide(); }, CAP_MS);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.__siteLoader = {
    conn: conn,
    prefetched: prefetched,
    show: show,
    hide: hide
  };
})();
