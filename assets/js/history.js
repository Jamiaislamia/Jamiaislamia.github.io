/* ═══════════════════════════════════════════════════════════════
   HISTORY TIMELINE ("the chain")
   Reads website/history.json (owned by the authority) and renders the
   institute's milestones, oldest first (the rail reads left → right, founding
   year to today).

   Layout (owner request): the horizontal HERITAGE RAIL — one column per
   milestone, the node (year pill + numbered circle) above the line and the story
   below, alternating down the line, with an arrow into the next segment. The
   columns are cells of one grid, so every rail segment sits on the same line.
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

  /* How many milestones show before the "Show all" toggle */
  var CHAIN_LIMIT = 4;
  var chainExpanded = false;
  var activeTag = '';            /* '' = every milestone */
  var lastData = null;

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
  function stepNumber(n) {
    return bn(('0' + n).slice(-2));
  }

  /* Filter chips above the rail — one per tag the data actually uses, plus
     "all". Bangla label, count at the right, pressed chip keeps the gold. */
  function renderFilters(entries) {
    var box = el('historyFilters');
    if (!box) return;
    var counts = {}, ens = {}, order = [];
    entries.forEach(function (e) {
      var t = e.tag || '';
      if (!t) return;
      if (!counts[t]) { counts[t] = 0; ens[t] = enOf(e, 'tag'); order.push(t); }
      counts[t]++;
    });
    if (!order.length) { box.innerHTML = ''; return; }
    /* The count is decoration for the eye: it sits behind a hairline so it
       cannot be mistaken for a dropdown caret, and it is kept out of the
       button's accessible name (aria-label carries it) so "সব৭" is never read
       aloud as one word. */
    var html = '<button class="hist-filter" type="button" data-tag="" aria-pressed="' +
      (activeTag === '' ? 'true' : 'false') + '" aria-label="' + esc('সব · ' + bn(entries.length) + 'টি মাইলফলক') +
      '" title="All milestones"><span>' +
      esc('সব') + '</span><b aria-hidden="true">' + esc(bn(entries.length)) + '</b></button>';
    order.forEach(function (t) {
      html += '<button class="hist-filter" type="button" data-tag="' + esc(t) + '" aria-pressed="' +
        (activeTag === t ? 'true' : 'false') + '" aria-label="' + esc(t + ' · ' + bn(counts[t]) + 'টি') +
        '" title="' + esc(ens[t] || t) + '"><span>' +
        esc(t) + '</span><b aria-hidden="true">' + esc(bn(counts[t])) + '</b></button>';
    });
    box.innerHTML = html;
    Array.prototype.forEach.call(box.querySelectorAll('.hist-filter'), function (b) {
      b.addEventListener('click', function () {
        activeTag = b.getAttribute('data-tag') || '';
        chainExpanded = false;
        renderChain(lastData);
      });
    });
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
  /* the step is a display:contents wrapper (it owns the grid cells), so scroll
     its first real box instead of the wrapper itself */
  function jumpTo(i) {
    var step = document.getElementById('milestone-' + i);
    if (!step) return;
    var box = step.getBoundingClientRect().height ? step : step.firstElementChild;
    if (box && box.scrollIntoView) box.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  /* The section's ONE English orientation line + the count label — both read
     from the data, so an 8th milestone can never make the copy lie. */
  function renderSummary(entries) {
    var en = el('historyCount');
    var total = el('historyTotal');
    if (!en && !total) return;
    if (!entries.length) {
      if (en) en.textContent = '';
      if (total) total.textContent = '';
      return;
    }
    var first = yearNumber(entries[0].year);
    var last = yearNumber(entries[entries.length - 1].year);
    if (en) en.textContent = entries.length + ' milestones · ' + first + ' → ' + last +
      ' — the rail below jumps to any year.';
    if (total) total.textContent = bn(entries.length) + 'টি মাইলফলক';
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


  /* The show-more control closes the band — it belongs to the timeline it
     reveals, not to the filter toolbar. */
  function renderToggle(total) {
    var btn = el('chainToggle');
    if (!btn) return;
    if (total <= CHAIN_LIMIT) {
      btn.hidden = true;
      btn.textContent = '';
      btn.onclick = null;
      return;
    }
    btn.hidden = false;
    btn.setAttribute('aria-expanded', chainExpanded ? 'true' : 'false');
    btn.textContent = chainExpanded
      ? T('কম দেখুন · Show less') + ' ▲'
      : T('সব দেখুন · Show all') + ' ▼';
    btn.onclick = function () { chainExpanded = !chainExpanded; renderChain(lastData); };
  }

  /* nothing to show → clear the toolbar too */
  function clearPanels() {
    var filters = el('historyFilters');
    if (filters) filters.innerHTML = '';
    var total = el('historyTotal');
    if (total) total.textContent = '';
    var count = el('historyCount');
    if (count) count.textContent = '';
    var toggle = el('chainToggle');
    if (toggle) { toggle.hidden = true; toggle.textContent = ''; toggle.onclick = null; }
    if (spy) { spy.disconnect(); spy = null; }
  }

  function renderChain(data) {
    var entries = (data && data.entries) || [];
    if (!entries.length) { renderEmpty(); return; }
    lastData = data;
    entries = sortEntries(entries, data.sort || 'newest-first');

    renderFilters(entries);

    var filtered = activeTag
      ? entries.filter(function (e) { return (e.tag || '') === activeTag; })
      : entries;

    /* keep the stepper short: 4 milestones, the rest behind a toggle */
    var collapsed = !chainExpanded && filtered.length > CHAIN_LIMIT;
    var shown = collapsed ? filtered.slice(0, CHAIN_LIMIT) : filtered;

    /* The infographic rail: one column per milestone. The node (year pill +
       numbered circle) sits on one side of the horizontal rail and the story on
       the other, alternating down the line, with an arrow into the next segment.
       The step number runs with the calendar — ০১ at the founding year. */
    var html = '<div class="hist-scroll"><nav class="hist-strip" aria-label="Milestone years">';
    shown.forEach(function (e, n) {
      var i = entries.indexOf(e);
      var year = yearOf(e);
      var te = enOf(e, 'tag') || e.tag;   /* chip label: English, Bangla fallback */
      var de = enOf(e, 'desc');
      var isNow = i === entries.length - 1;   /* chronological: today is the last step */
      var nodeUp = (n % 2 === 0);             /* alternate: node above, then below */
      var node =
        '<a class="hist-node' + (isNow ? ' hist-node--now' : '') + '" href="#milestone-' + i +
          '" data-i="' + i + '" title="' + esc(e.title || '') + '">' +
          '<span class="stepper-year"' + (isYear(year) ? ' title="' + esc(year) + '"' : '') + '>' +
            esc(isYear(year) ? bn(year) : year) +
            (isYear(year) ? '<em>' + esc(year) + '</em>' : '') +
          '</span>' +
          '<span class="stepper-node" aria-hidden="true">' + esc(stepNumber(i + 1)) + '</span>' +
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
    html += '</nav></div>';
    html += '<p class="chain-note">' + esc(T('প্রতি বছর নতুন অর্জন এই ধারায় যোগ করা হয় · This timeline is updated every year.')) + '</p>';
    host.innerHTML = html;

    wireNodes();
    initSpy();
    renderToggle(filtered.length);
    renderSummary(entries);
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
      if (window.__siteReveal) window.__siteReveal();
    });
  });
})();

