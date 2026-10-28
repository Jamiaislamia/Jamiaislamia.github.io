/* ═══════════════════════════════════════════════════════════════
   WHY WE ARE DIFFERENT — the two-column list of reasons
   Reads different.json (owned by the authority) and renders the reasons as two
   equal columns. Each column is a vertical timeline: a round node carrying a
   line icon, joined by a hairline down to the next node, with the heading and
   the note beside it. The first half of the list fills the left column, so the
   order in the file IS the reading order.

   Icons are inline SVG from a fixed set — the data names one, the page draws it
   (blueprint 10.1: inline SVG only, never an icon font or an emoji). An unknown
   name falls back to the book, so a typo can never leave an empty circle.

   READ-ONLY BY DESIGN — the published page:
     • only ever issues GET requests (no write endpoint exists),
     • escapes every value before it touches the DOM,
     • offers no editing UI of any kind.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var host;

  function el(id) { return document.getElementById(id); }
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function T(s) { return window.siteT ? window.siteT(s) : s; }

  function fetchJson(url) {
    return fetch(url, { cache: 'no-cache', method: 'GET' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  /* ── the icon set ───────────────────────────────────────
     One line drawing per name, drawn on a 24×24 grid in currentColor. */
  var ICONS = {
    book: '<path d="M12 7.2C10.5 6 8.6 5.4 6.2 5.4c-.7 0-1.3 0-1.9.1v12.4c.6-.1 1.2-.1 1.9-.1 2.4 0 4.3.6 5.8 1.8 1.5-1.2 3.4-1.8 5.8-1.8.7 0 1.3 0 1.9.1V5.5c-.6-.1-1.2-.1-1.9-.1-2.4 0-4.3.6-5.8 1.8Z"/>' +
      '<path d="M12 7.2v12.4"/>',
    people: '<circle cx="9" cy="8.2" r="3.2"/><path d="M3.4 19.4c0-3.1 2.5-5.3 5.6-5.3s5.6 2.2 5.6 5.3"/>' +
      '<path d="M16.4 5.6a3 3 0 0 1 0 5.9"/><path d="M17.6 14.4c2.1.5 3.5 2.2 3.5 4.5"/>',
    award: '<circle cx="12" cy="9.4" r="4.9"/><path d="M8.6 13.6 7.2 20.6l4.8-2.4 4.8 2.4-1.4-7"/>',
    chart: '<path d="M4 20h16"/><path d="M7.5 20v-5.5"/><path d="M12 20V8.5"/><path d="M16.5 20v-8.5"/>',
    shield: '<path d="M12 3.6 5.4 6.2v5.4c0 4.1 2.8 7.2 6.6 8.4 3.8-1.2 6.6-4.3 6.6-8.4V6.2Z"/>' +
      '<path d="m9.2 11.8 2.1 2.1 3.6-3.6"/>',
    message: '<path d="M20.2 12.1c0 3.4-3.7 6.2-8.2 6.2-.8 0-1.6-.1-2.4-.2L5.2 20.2l1.2-3.1c-1.2-1.1-1.9-2.6-1.9-4.2 0-3.4 3.7-6.2 8.2-6.2s7.5 2.8 7.5 6.2Z"/>'
  };
  function iconSvg(name) {
    var d = ICONS[name] || ICONS.book;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  }

  /* Two equal columns: the first half fills the left one. */
  function columns(items) {
    var mid = Math.ceil(items.length / 2);
    return [items.slice(0, mid), items.slice(mid)];
  }

  function renderItem(it) {
    var o = it || {};
    var title = String(o.title == null ? '' : o.title).trim();
    var desc = String(o.desc == null ? '' : o.desc).trim();
    if (!title && !desc) return '';
    var titleEn = String(o.titleEn == null ? '' : o.titleEn).trim();
    return '<div class="why-item">' +
      '<span class="why-node" aria-hidden="true">' + iconSvg(o.icon) + '</span>' +
      '<div class="why-body">' +
        (title ? '<h3 class="why-title"' + (titleEn ? ' title="' + esc(titleEn) + '"' : '') + '>' +
          esc(title) + '</h3>' : '') +
        (desc ? '<p class="why-desc">' + esc(desc) + '</p>' : '') +
      '</div>' +
    '</div>';
  }

  function render(data) {
    var html = '';
    columns((data && data.items) || []).forEach(function (col) {
      var rows = col.map(renderItem).join('');
      if (rows) html += '<div class="why-col">' + rows + '</div>';
    });
    host.innerHTML = html;
  }

  function renderEmpty() {
    host.innerHTML =
      '<div class="panel">' +
        '<div class="panel-title">' + esc('এখনও কোনো কারণ যোগ করা হয়নি') + '</div>' +
        '<p><strong>different.json</strong> ফাইলের <code>items</code> তালিকায় কারণ ও বিবরণ যোগ করুন — ' +
          'দুটি কলাম স্বয়ংক্রিয়ভাবে তৈরি হবে।</p>' +
      '</div>';
  }

  function renderUnavailable() {
    host.innerHTML =
      '<div class="panel panel-warn">' +
        '<div class="panel-title">' + esc('তালিকাটি লোড করা যায়নি') + '</div>' +
        '<p>' + esc('ইন্টারনেট সংযোগ পরীক্ষা করে পেজটি রিফ্রেশ করুন।') + '</p>' +
      '</div>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    host = el('differentGrid');
    if (!host) return;
    fetchJson('different.json').then(function (data) {
      if (!data) { renderUnavailable(); return; }
      if (!((data.items || []).length)) { renderEmpty(); return; }
      render(data);
      if (window.__siteReveal) window.__siteReveal();
    });
  });
})();
