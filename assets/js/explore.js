/* ═══════════════════════════════════════════════════════════════
   EXPLORE — photo collections
   Reads website/photos.json (built by _build_photos.js).
   On GitHub Pages it can also discover the folders live via the
   GitHub contents API, so photos appear without a rebuild.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var listEl, statsEl, lb, lbImg, lbCap, lbClose, lbPrev, lbNext;
  var flat = [];          /* every photo in order, for the lightbox */
  var idx = -1;
  var lastFocus = null;

  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  var BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  function bn(n) {
    return String(n).replace(/\d/g, function (d) { return BN_DIGITS[+d]; });
  }
  function titleFromName(name) {
    return String(name)
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }
  function fetchJson(url) {
    return fetch(url, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  /* ── live discovery on GitHub Pages ─────────────────── */
  function githubTarget() {
    var host = location.hostname || '';
    if (!/\.github\.io$/i.test(host)) return null;
    var owner = host.split('.')[0];
    var parts = (location.pathname || '/').split('/').filter(Boolean);
    var repo = parts.length ? parts[0] : null;
    return (owner && repo) ? { owner: owner, repo: repo } : null;
  }
  function isImage(name) { return /\.(jpe?g|png|webp|gif|avif)$/i.test(name); }

  function discoverOnGithub() {
    var t = githubTarget();
    if (!t) return Promise.resolve(null);
    var base = 'https://api.github.com/repos/' + t.owner + '/' + t.repo + '/contents/Photos';
    return fetchJson(base).then(function (items) {
      if (!Array.isArray(items)) return null;
      var dirs = items.filter(function (i) { return i.type === 'dir'; }).map(function (i) { return i.name; });
      if (!dirs.length) return null;
      return Promise.all(dirs.map(function (name) {
        return fetchJson(base + '/' + encodeURIComponent(name)).then(function (list) {
          if (!Array.isArray(list)) return null;
          var photos = list
            .filter(function (f) { return f.type === 'file' && isImage(f.name); })
            .map(function (f) {
              return { src: 'Photos/' + name + '/' + f.name, file: f.name, caption: titleFromName(f.name) };
            });
          return photos.length ? { name: name, photos: photos } : null;
        });
      })).then(function (albums) {
        albums = albums.filter(Boolean);
        return albums.length ? { albums: albums, source: 'github' } : null;
      });
    }).catch(function () { return null; });
  }

  function loadManifest() {
    return fetchJson('photos.json').then(function (data) {
      if (data && data.albums && data.albums.length) { data.source = 'manifest'; return data; }
      return discoverOnGithub();
    });
  }

  /* ── rendering ─────────────────────────────────────── */
  function renderStats(data) {
    var isEn = !!(window.siteLang && window.siteLang() === 'en');
    var num = function (v) { return isEn ? v : bn(v); };
    var photos = 0;
    data.albums.forEach(function (a) { photos += a.photos.length; });
    statsEl.innerHTML =
      '<span class="stat"><b>' + num(data.albums.length) + '</b> albums</span>' +
      '<span class="stat"><b>' + num(photos) + '</b> photos</span>' +
      (data.source === 'github' ? '<span class="stat stat-live">live from repository</span>' : '');
  }

  function renderAlbums(data) {
    var isEn = !!(window.siteLang && window.siteLang() === 'en');
    flat = [];
    var html = '';
    data.albums.forEach(function (album) {
      var title = (isEn && album.titleEn) ? album.titleEn : (album.title || titleFromName(album.name));
      var titleHtml = (window.siteBi && album.title)
        ? window.siteBi(album.title, album.titleEn || '')
        : esc(title);
      html += '<section class="section album">' +
        '<div class="sec-head rv">' +
          '<span class="eyebrow" lang="en">' + album.photos.length + ' PHOTO' + (album.photos.length > 1 ? 'S' : '') + '</span>' +
          '<h2 class="sec-title">' + titleHtml + '</h2>' +
          '<span class="sec-rule"></span>' +
        '</div>' +
        '<div class="photo-grid' + (album.photos.length <= 2 ? ' photo-grid--sparse' : '') + '">';
      album.photos.forEach(function (p) {
        var i = flat.push({ src: p.src, caption: p.caption || titleFromName(p.file || p.src) }) - 1;
        var size = (p.w && p.h) ? ' width="' + p.w + '" height="' + p.h + '"' : '';
        html += '<button class="ph rv" type="button" data-i="' + i + '" aria-label="' + esc(p.caption || '') + (isEn ? ' — view photo' : ' — ছবি দেখুন') + '">' +
            '<img src="' + esc(p.src) + '" alt="' + esc(p.caption || title) + '" loading="lazy"' + size + '>' +
            '<span class="ph-cap">' + esc(p.caption || titleFromName(p.file || '')) + '</span>' +
          '</button>';
      });
      html += '</div></section>';
    });
    listEl.innerHTML = html;
  }

  function renderNotice(kind) {
    var T = function (s) { return window.siteT ? window.siteT(s) : s; };
    var isEn = !!(window.siteLang && window.siteLang() === 'en');
    var msg = kind === 'empty'
      ? '<div class="panel"><div class="panel-title">' + esc(T('এখনও কোনো ছবি যোগ করা হয়নি · No photos yet')) + '</div>' +
        '<p><strong>website/Photos/</strong> ' + (isEn
          ? 'Upload images into the album folders under <strong>website/Photos/</strong>, then run <code>node _build_photos.js</code> from the project root.'
          : 'ফোল্ডারের অ্যালবামগুলোতে ছবি আপলোড করুন, তারপর প্রজেক্ট রুট থেকে <code>node _build_photos.js</code> চালান — ছবিগুলো এখানে দেখা যাবে।') + '</p></div>'
      : '<div class="panel panel-warn"><div class="panel-title">' + esc(T('ছবি লোড করা যায়নি · Could not load the collections')) + '</div>' +
        '<p>' + esc(T('ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।')) + '</p></div>';
    listEl.innerHTML = msg;
    statsEl.innerHTML = '';
  }

  /* ── lightbox ──────────────────────────────────────── */
  function paint() {
    var item = flat[idx];
    if (!item) return;
    var isEn = !!(window.siteLang && window.siteLang() === 'en');
    lbImg.src = item.src;
    lbImg.alt = item.caption || '';
    lbCap.textContent = (isEn ? (idx + 1) : bn(idx + 1)) + ' / ' + (isEn ? flat.length : bn(flat.length)) + '  ·  ' + (item.caption || '');
  }
  function openLightbox(i, trigger) {
    if (!flat.length) return;
    idx = i;
    lastFocus = trigger || null;
    paint();
    lb.hidden = false;
    requestAnimationFrame(function () { lb.classList.add('open'); });
    if (lbClose) lbClose.focus();
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    if (lb.hidden) return;
    lb.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(function () { lb.hidden = true; }, 180);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function step(d) {
    if (!flat.length) return;
    idx = (idx + d + flat.length) % flat.length;
    paint();
  }

  function initLightbox() {
    lb = el('lightbox'); lbImg = el('lbImg'); lbCap = el('lbCap');
    lbClose = el('lbClose'); lbPrev = el('lbPrev'); lbNext = el('lbNext');
    if (!lb) return;

    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev) lbPrev.addEventListener('click', function () { step(-1); });
    if (lbNext) lbNext.addEventListener('click', function () { step(1); });
    lb.addEventListener('click', function (e) {
      if (e.target === lb) closeLightbox();          /* backdrop click */
    });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    });

    /* one delegated handler for every photo tile */
    listEl.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.ph') : null;
      if (!btn) return;
      openLightbox(parseInt(btn.getAttribute('data-i'), 10) || 0, btn);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    listEl = el('albumList');
    statsEl = el('exploreStats');
    if (!listEl) return;
    initLightbox();
    listEl.innerHTML = '<div class="panel"><p style="color:var(--muted)">' +
      (window.siteT ? window.siteT('ছবি লোড হচ্ছে… · Loading photos…') : 'ছবি লোড হচ্ছে… · Loading photos…') + '</p></div>';

    loadManifest().then(function (data) {
      if (!data || !data.albums || !data.albums.length) { renderNotice('empty'); return; }
      renderAlbums(data);
      renderStats(data);
      if (window.__siteReveal) window.__siteReveal();
    });
  });
})();
