/* ═══════════════════════════════════════════════════════════════
   HISTORY TIMELINE ("the chain")
   Reads website/history.json (owned by the authority) and renders the
   institute's milestones, oldest first (the rail reads left → right, founding
   year to today).

   Layout (owner request): the horizontal HERITAGE RAIL — one column per
   milestone, the node (the YEAR pill) above the line and the story
   below, alternating down the line, with an arrow into the next segment. The
   columns are cells of one grid, so every rail segment sits on the same line.
   The whole line is always rendered; a round arrow at each end walks it one
   column at a time, the frame opens on the latest milestone, and the edges fade
   so a half-visible column reads as the previous / next step.
   Owner follow-up (2026-10-29): the ০১–০৭ step numbers were REMOVED. The node
   carries the year only, so the rail reads as a chronology rather than a short
   numbered list — and the section's English line no longer states a count for
   the same reason.
   Language law: the year chip and the English tag chip are the only chrome;
   the title and note are Bangla, and `descEn` supplies ONE short result-first
   English line (never a translated paragraph).

   READ-ONLY BY DESIGN — the published page:
     • only ever issues GET requests (no write endpoint exists),
     • escapes every value before it touches the DOM,
     • offers no editing UI of any kind.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var host;
  var BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

  function el(id) { return document.getElementById(id); }
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function bn(n) { return String(n).replace(/\d/g, function (d) { return BN_DIGITS[+d]; }); }
  function yearNumber(v) {
    var m = String(v == null ? '' : v).match(/\d{4}/);
    return m ? parseInt(m[0], 10) : 0;
  }

  /* ── data ───────────────────────────────────────────── */
  function fetchJson(url) {
    return fetch(url, { cache: 'no-cache', method: 'GET' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }
  function fetchText(url) {
    return fetch(url, { cache: 'no-cache', method: 'GET' })
      .then(function (r) { return r.ok ? r.text() : null; })
      .catch(function () { return null; });
  }

  /* small CSV reader (quotes + commas + CRLF) for the optional sheet mode */
  function parseCsv(text) {
    var rows = [], row = [], cur = '', inQuotes = false, i;
    for (i = 0; i < text.length; i++) {
      var c = text.charAt(i);
      if (inQuotes) {
        if (c === '"') {
          if (text.charAt(i + 1) === '"') { cur += '"'; i++; } else { inQuotes = false; }
        } else { cur += c; }
      } else if (c === '"') { inQuotes = true; }
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (c !== '\r') { cur += c; }
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows;
  }
  function entriesFromCsv(text) {
    var rows = parseCsv(text).filter(function (r) { return r.join('').trim() !== ''; });
    if (rows.length < 2) return [];
    var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    var yi = head.indexOf('year'), ti = head.indexOf('title');
    var di = head.indexOf('desc'), gi = head.indexOf('tag');
    if (yi === -1 || ti === -1) return [];
    return rows.slice(1).map(function (r) {
      return {
        year: (r[yi] || '').trim(),
        title: (r[ti] || '').trim(),
        desc: di > -1 ? (r[di] || '').trim() : '',
        tag: gi > -1 ? (r[gi] || '').trim() : ''
      };
    }).filter(function (e) { return e.year || e.title; });
  }

  function loadHistory() {
    return fetchJson('history.json').then(function (data) {
      if (!data) return null;
      if (data.sheetCsvUrl) {
        return fetchText(data.sheetCsvUrl).then(function (csv) {
          var rows = csv ? entriesFromCsv(csv) : [];
          if (rows.length) return { entries: rows, sort: data.sort, source: 'sheet' };
          return data;                       /* fall back to the local file */

        });
      }
      return data;
    });
  }
  /* ── render ─────────────────────────────────────────── */
  function sortEntries(list, mode) {
    var out = list.slice();
    out.sort(function (a, b) {
      var ay = yearNumber(a.year), by = yearNumber(b.year);
      return mode === 'oldest-first' ? ay - by : by - ay;
    });
    return out;
  }

  function T(s) { return window.siteT ? window.siteT(s) : s; }
  function yearOf(e) { return String(e.year == null ? '' : e.year).trim(); }
  function isYear(y) { return /^\d{4}$/.test(y); }

  /* Structured data may carry its own English (*En); the dictionary is the
     fallback for JS-rendered strings only. */
  function enOf(e, base) {
    var own = e[base + 'En'];
    if (own) return own;
    if (window.siteEn && e[base]) return window.siteEn(e[base]) || '';
    return '';
  }

  /* ── the rail's two arrows ──────────────────────────────
     Inline SVG only (blueprint 10.1) — a chevron, never a glyph. */
  var CHEVRON_PREV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg>';
  var CHEVRON_NEXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';

  function scroller() { return host ? host.querySelector('.hist-scroll') : null; }
  function navBtn(dir) { return host ? host.querySelector('.hist-nav--' + dir) : null; }
  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  /* One column's width — the unit the arrows step by. */
  function columnWidth() {
    var cell = host ? host.querySelector('.hist-rail-cell') : null;
    return cell ? cell.getBoundingClientRect().width : 0;
  }
  /* iOS-style glide: a single ease-out over ~520ms, never linear — and an
     instant jump when the reader has asked for reduced motion. */
  function glide(el, to) {
    var max = Math.max(0, el.scrollWidth - el.clientWidth);
    to = Math.max(0, Math.min(max, to));
    if (reduced() || !window.requestAnimationFrame) { el.scrollLeft = to; syncNav(); return; }
    var from = el.scrollLeft, start = 0, DUR = 520;
    function ease(t) { return 1 - Math.pow(1 - t, 5); }
    function frame(now) {
      if (!start) start = now;
      var p = Math.min(1, (now - start) / DUR);
      el.scrollLeft = from + (to - from) * ease(p);
      if (p < 1) window.requestAnimationFrame(frame);
      else { el.scrollLeft = to; syncNav(); }
    }
    window.requestAnimationFrame(frame);
  }
  /* Which end of the line are we on? Drives the edge fades and the arrows. */
  function syncNav() {
    var el = scroller();
    if (!el) return;
    var max = Math.max(0, el.scrollWidth - el.clientWidth);
    var atStart = el.scrollLeft <= 1, atEnd = el.scrollLeft >= max - 1;
    el.classList.toggle('is-start', atStart);
    el.classList.toggle('is-end', atEnd);
    var p = navBtn('prev'), n = navBtn('next');
    if (p) p.setAttribute('aria-disabled', atStart ? 'true' : 'false');
    if (n) n.setAttribute('aria-disabled', atEnd ? 'true' : 'false');
  }
  function wireNav() {
    var el = scroller();
    if (!el) return;
    var p = navBtn('prev'), n = navBtn('next');
    function step(dir) {
      var w = columnWidth();
      if (w) glide(el, el.scrollLeft + dir * w);
    }
    if (p) p.addEventListener('click', function () { step(-1); });
    if (n) n.addEventListener('click', function () { step(1); });
    el.addEventListener('scroll', syncNav, { passive: true });
    window.addEventListener('resize', syncNav);
  }
  /* The rail is chronological, so the LATEST milestones are at the far end —
     that is where the frame opens. */
  function showLatest(instant) {
    var el = scroller();
    if (!el) return;
    var to = Math.max(0, el.scrollWidth - el.clientWidth);
    if (instant) { el.scrollLeft = to; syncNav(); } else glide(el, to);
  }

  /* The year pills ARE the nav: each one sits on the stem of its own column, so
     clicking it brings that milestone into view along the rail. */
  function wireNodes() {
    Array.prototype.forEach.call(document.querySelectorAll('#historyTimeline .hist-node'), function (a) {
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        jumpTo(parseInt(a.getAttribute('data-i'), 10) || 0);
      });
    });
  }
  /* the step is a display:contents wrapper (it owns the grid cells), so measure
     its first real box; the jump glides, landing the column centred */
  function jumpTo(i) {
    var step = document.getElementById('milestone-' + i);
    var el = scroller();
    if (!step || !el) return;
    var box = step.getBoundingClientRect().height ? step : step.firstElementChild;
    if (!box) return;
    var colW = box.getBoundingClientRect().width;
    var delta = box.getBoundingClientRect().left - el.getBoundingClientRect().left;
    glide(el, el.scrollLeft + delta - (el.clientWidth - colW) / 2);
  }

  /* The section's ONE English orientation line — read from the data, so an 8th
     milestone can never make the copy lie. It deliberately states NO COUNT:
     "7 milestones" made a 23-year record read as a short list, which is the
     opposite of what the section is for. The span and the habit say it instead. */
  function renderSummary(entries) {
    var en = el('historyCount');
    if (!en) return;
    if (!entries.length) { en.textContent = ''; return; }
    var first = yearNumber(entries[0].year);
    en.textContent = 'From ' + first + ' to today — use the arrows to walk the line.';
  }

  /* The pill of the column nearest the top of the viewport carries the gold
     "you are here" state. The observer watches each column's first real box —
     the step wrapper itself is display:contents and has no box to watch. */
  var spy = null;
  function initSpy() {
    var hostBox = el('historyTimeline');
    if (!hostBox || !('IntersectionObserver' in window)) return;
    if (spy) spy.disconnect();
    var links = Array.prototype.slice.call(hostBox.querySelectorAll('.hist-node'));
    var cells = [], owners = [];
    links.forEach(function (a) {
      var step = a.closest('.stepper-step');
      var cell = step ? step.querySelector('.hist-cell') : null;
      if (cell) { cells.push(cell); owners.push(a); }
    });
    function setActive(link) {
      links.forEach(function (a) { a.removeAttribute('aria-current'); });
      if (link) link.setAttribute('aria-current', 'true');
    }
    spy = new IntersectionObserver(function (rows) {
      rows.forEach(function (r) {
        if (!r.isIntersecting) return;
        var k = cells.indexOf(r.target);
        if (k !== -1) setActive(owners[k]);
      });
    }, { rootMargin: '-92px 0px -58% 0px', threshold: 0 });
    cells.forEach(function (c) { spy.observe(c); });
    if (links[0]) setActive(links[0]);
  }


  /* nothing to show → clear the summary line too */
  function clearPanels() {
    var count = el('historyCount');
    if (count) count.textContent = '';
    if (spy) { spy.disconnect(); spy = null; }
  }

  function renderChain(data) {
    var entries = (data && data.entries) || [];
    if (!entries.length) { renderEmpty(); return; }
    entries = sortEntries(entries, data.sort || 'newest-first');

    /* The infographic rail: EVERY milestone is on the line at once — one column
       each. The node (the year pill) sits on one side and the story on the
       other, alternating down the line, with an arrow into the next segment.
       The year IS the node — there is no step number, so the rail reads as a
       chronology rather than a short numbered list (owner request).
       The two round buttons walk the line; the edge fade shows what is coming
       and what has just gone. */
    var html = '<div class="hist-band">' +
      '<button class="hist-nav hist-nav--prev" type="button" aria-disabled="true" aria-label="' +
        esc('আগের মাইলফলক · Previous milestone') + '">' + CHEVRON_PREV + '</button>' +
      '<div class="hist-scroll"><nav class="hist-strip" aria-label="' +
        esc('Milestone years') + '">';
    entries.forEach(function (e, i) {
      var year = yearOf(e);
      var te = enOf(e, 'tag') || e.tag;   /* chip label: English, Bangla fallback */
      var de = enOf(e, 'desc');
      var isNow = i === entries.length - 1;   /* chronological: today is the last step */
      var nodeUp = (i % 2 === 0);             /* alternate: node above, then below */
      var node =
        '<a class="hist-node' + (isNow ? ' hist-node--now' : '') + '" href="#milestone-' + i +
          '" data-i="' + i + '" title="' + esc(e.title || '') + '">' +
          /* the node carries the YEAR and nothing else — no step number */
          '<span class="stepper-year"' + (isYear(year) ? ' title="' + esc(year) + '"' : '') + '>' +
            esc(isYear(year) ? bn(year) : year) +
            (isYear(year) ? '<em>' + esc(year) + '</em>' : '') +
          '</span>' +
        '</a>';
      var story =
        '<div class="hist-text">' +
          (te ? '<span class="stepper-chip" lang="en">' + esc(te) + '</span>' : '') +
          (e.title ? '<h3 class="stepper-title">' + esc(e.title) + '</h3>' : '') +
          (e.desc ? '<p class="stepper-desc">' + esc(e.desc) + '</p>' : '') +
          (de ? '<p class="stepper-en" lang="en">' + esc(de) + '</p>' : '') +
        '</div>';
      html +=
        '<div class="stepper-step chain-item' + (isNow ? ' stepper-step--now' : '') + '" id="milestone-' + i + '">' +
          '<div class="hist-cell hist-up ' + (nodeUp ? 'hist-cell--node' : 'hist-cell--story') + '">' +
            (nodeUp ? node : story) +
          '</div>' +
          '<div class="hist-rail-cell" aria-hidden="true">' +
            '<span class="hist-dot"></span><span class="hist-arrow"></span>' +
          '</div>' +
          '<div class="hist-cell hist-down ' + (nodeUp ? 'hist-cell--story' : 'hist-cell--node') + '">' +
            (nodeUp ? story : node) +
          '</div>' +
        '</div>';
    });
    html += '</nav></div>' +
      '<button class="hist-nav hist-nav--next" type="button" aria-label="' +
        esc('পরের মাইলফলক · Next milestone') + '">' + CHEVRON_NEXT + '</button>' +
      '</div>';
    html += '<p class="chain-note">' + esc(T('প্রতি বছর নতুন অর্জন এই ধারায় যোগ করা হয় · This timeline is updated every year.')) + '</p>';
    host.innerHTML = html;

    wireNodes();
    wireNav();
    initSpy();
    renderSummary(entries);
    showLatest(true);   /* open on the latest milestones */
  }

  function renderEmpty() {
    clearPanels();
    host.innerHTML =
      '<div class="panel">' +
        '<div class="panel-title">' + esc('এখনও কোনো মাইলফলক যোগ করা হয়নি') + '</div>' +
        '<p><strong>website/history.json</strong> ফাইলের <code>entries</code> তালিকায় বছর ও বিবরণ যোগ করুন — ধারাবাহিকতা স্বয়ংক্রিয়ভাবে সাজানো হবে।</p>' +
      '</div>';
  }

  function renderUnavailable() {
    clearPanels();
    host.innerHTML =
      '<div class="panel panel-warn">' +
        '<div class="panel-title">' + esc('ধারাবাহিকতা লোড করা যায়নি') + '</div>' +
        '<p>' + esc('ইন্টারনেট সংযোগ পরীক্ষা করে পেজটি রিফ্রেশ করুন।') + '</p>' +
      '</div>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    host = el('historyTimeline');
    if (!host) return;
    loadHistory().then(function (data) {
      if (!data) { renderUnavailable(); return; }
      renderChain(data);
      /* fonts and lazy images settle after the first paint — re-assert the frame
         and the edge fades once the page has fully loaded */
      window.addEventListener('load', function () { showLatest(true); });
      if (window.__siteReveal) window.__siteReveal();
    });
  });
})();

