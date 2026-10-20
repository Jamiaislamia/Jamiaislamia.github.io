/* ═══════════════════════════════════════════════════════════════
   HISTORY TIMELINE ("the chain")
   Reads website/history.json (owned by the authority) and renders the
   institute's milestones, newest first.

   Layout (owner request): ONE column — filter chips + a year row sit in a
   toolbar above the stepper, so nothing is squeezed into a ~200px rail.
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
  /* "২০২৬ 2026" — Bangla numerals first, the Latin year as a quiet suffix */
  function yearChip(y) {
    if (!isYear(y)) return '<span class="stepper-year">' + esc(y) + '</span>';
    return '<span class="stepper-year" title="' + esc(y) + '">' + esc(bn(y)) +
      '<em>' + esc(y) + '</em></span>';
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
    var html = '<button class="hist-filter" type="button" data-tag="" aria-pressed="' +
      (activeTag === '' ? 'true' : 'false') + '" title="All milestones"><span>' +
      esc('সব') + '</span><b>' + esc(bn(entries.length)) + '</b></button>';
    order.forEach(function (t) {
      html += '<button class="hist-filter" type="button" data-tag="' + esc(t) + '" aria-pressed="' +
        (activeTag === t ? 'true' : 'false') + '" title="' + esc(ens[t] || t) + '"><span>' +
        esc(t) + '</span><b>' + esc(bn(counts[t])) + '</b></button>';
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

  /* Year row — replaces the old "on this page" card. Jumping to a milestone
     that is still behind the toggle expands the feed first. */
  function renderYears(shown, all) {
    var box = el('historyYears');
    if (!box) return;
    if (!shown.length) { box.innerHTML = ''; return; }
    var html = '';
    shown.forEach(function (e) {
      var i = all.indexOf(e);
      var y = yearOf(e);
      html += '<a href="#milestone-' + i + '" data-i="' + i + '" title="' + esc(e.title || '') + '">' +
        esc(isYear(y) ? bn(y) : y) + '</a>';
    });
    box.innerHTML = html;
    Array.prototype.forEach.call(box.querySelectorAll('a'), function (a) {
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        var i = parseInt(a.getAttribute('data-i'), 10) || 0;
        if (!chainExpanded && i >= CHAIN_LIMIT) {
          chainExpanded = true;
          renderChain(lastData);
          setTimeout(function () { jumpTo(i); }, 0);
          return;
        }
        jumpTo(i);
      });
    });
    initSpy();
  }
  function jumpTo(i) {
    var node = document.getElementById('milestone-' + i);
    if (node) node.scrollIntoView({ block: 'start' });
  }

  /* Active year chip follows the step nearest the top of the viewport. */
  var spy = null;
  function initSpy() {
    var box = el('historyYears');
    if (!box || !('IntersectionObserver' in window)) return;
    if (spy) spy.disconnect();
    var links = Array.prototype.slice.call(box.querySelectorAll('a'));
    var map = {};
    links.forEach(function (a) { map['milestone-' + a.getAttribute('data-i')] = a; });
    function setActive(id) {
      links.forEach(function (a) { a.removeAttribute('aria-current'); });
      if (map[id]) map[id].setAttribute('aria-current', 'true');
    }
    spy = new IntersectionObserver(function (rows) {
      rows.forEach(function (r) { if (r.isIntersecting) setActive(r.target.id); });
    }, { rootMargin: '-92px 0px -58% 0px', threshold: 0 });
    Object.keys(map).forEach(function (id) {
      var node = document.getElementById(id);
      if (node) spy.observe(node);
    });
    if (links[0]) setActive('milestone-' + links[0].getAttribute('data-i'));
  }


  /* The show-more control lives in the toolbar, not under the feed. */
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
    var years = el('historyYears');
    if (years) years.innerHTML = '';
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

    /* Each milestone is one step on the heritage rail: a numbered gold node,
       then a card whose meta row is the year + English tag chip, then the
       Bangla title, ONE English line and the Bangla note. */
    /* Numbering runs with the calendar, not with the visible slice: the newest
       milestone carries the highest number and the rail counts down to ০১ at
       the founding year. Filtering or expanding therefore never renumbers a
       step — the gaps a filter leaves are honest. */
    var html = '<div class="stepper">';
    shown.forEach(function (e, n) {
      var i = entries.indexOf(e);
      var year = yearOf(e);
      var te = enOf(e, 'tag') || e.tag;   /* chip label: English, Bangla fallback */
      var de = enOf(e, 'desc');
      html +=
        '<div class="stepper-step' + (i === 0 ? ' stepper-step--now' : '') + '" id="milestone-' + i + '">' +
          '<span class="stepper-node" aria-hidden="true">' + esc(stepNumber(entries.length - i)) + '</span>' +
          '<article class="card chain-item">' +
            '<div class="stepper-body">' +
              '<div class="stepper-meta">' + yearChip(year) +
                (te ? '<span class="stepper-chip" lang="en">' + esc(te) + '</span>' : '') +
              '</div>' +
              (e.title ? '<h3 class="stepper-title">' + esc(e.title) + '</h3>' : '') +
              (de ? '<p class="stepper-en" lang="en">' + esc(de) + '</p>' : '') +
              (e.desc ? '<p class="stepper-desc">' + esc(e.desc) + '</p>' : '') +
            '</div>' +
          '</article>' +
        '</div>';
    });
    html += '</div>';
    html += '<p class="chain-note">' + esc(T('প্রতি বছর নতুন অর্জন এই ধারায় যোগ করা হয় · This timeline is updated every year.')) + '</p>';
    host.innerHTML = html;

    renderToggle(filtered.length);
    renderYears(shown, entries);
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

