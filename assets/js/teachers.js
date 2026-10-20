/* ═══════════════════════════════════════════════════════════════
   TEACHERS — the faculty page
   Reads website/teachers.json (authority-owned, read-only here):
     { "super": { … }, "teachers": [ { … } ] }
   Each profile: name / nameEn · role / roleEn · photo ·
                 qualification / qualificationEn · fields[] / fieldsEn[] · bio / bioEn
   BILINGUAL BY DEFAULT: Bangla is always shown, the English field becomes the
   gloss beside it (names, roles, subjects) or beneath it (qualification, bio).
   Photos live in website/Photos/Teachers/ (square ~400×400 JPG is ideal; a
   taller portrait is cropped to the square tile from the top, so the head is
   never cut off).
   A profile without a photo — or with a broken path — shows a
   dashed placeholder tile instead, so the grid never looks broken.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var superBox, grid;

  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function T(s) { return window.siteT ? window.siteT(s) : s; }

  function fetchJson(url) {
    return fetch(url, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  /* Bangla value + the English gloss, never one instead of the other */
  function pick(o, base) { return (o && o[base]) || ''; }
  function pickEn(o, base) { return (o && o[base + 'En']) || ''; }
  function list(o, base) { var v = o && o[base]; return Array.isArray(v) ? v : []; }
  function listEn(o, base) { var v = o && o[base + 'En']; return Array.isArray(v) ? v : []; }

  function hasBangla(s) { return /[\u0980-\u09FF]/.test(String(s == null ? '' : s)); }
  function isBilingual(s) {
    var str = String(s == null ? '' : s);
    var i = str.lastIndexOf(' · ');
    if (i < 0) return false;
    var right = str.slice(i + 3);
    return /[A-Za-z]/.test(right) && !hasBangla(right);
  }

  /* "[ … ]" entries are the authority's to-fill placeholders (see the
     founder field on the home page) — they render in the muted style. */
  function isPlaceholder(v) { return /^\s*\[/.test(String(v == null ? '' : v)); }

  function gloss(en) {
    if (!en) return '';
    return '<span class="bi-en">' + esc(en) + '</span>';
  }

  /* value with its English gloss (used for names and qualifications) */
  function pair(bn, en) {
    var s = String(bn == null ? '' : bn);
    if (!s) return '';
    var out = '<span' + (isPlaceholder(s) ? ' class="tch-empty"' : '') + '>' + esc(s) + '</span>';
    if (en && en !== s && !isBilingual(s)) out += gloss(en);
    return out;
  }

  function photoTile(photo, cls, alt) {
    if (photo) {
      return '<div class="' + cls + '"><img class="tch-img" src="' + esc(photo) + '" alt="' + esc(alt) + '" loading="lazy"></div>';
    }
    return '<div class="' + cls + ' ph-missing"><span>' + esc(T('ছবি · Photo')) + '</span></div>';
  }

  function fieldTags(o) {
    var f = list(o, 'fields'), fe = listEn(o, 'fieldsEn');
    if (!f.length) return '';
    return '<div class="tch-fields">' + f.map(function (x, i) {
      var en = fe[i] || '';
      var inner = esc(x) + (en && en !== x && !isBilingual(x) ? gloss(en) : '');
      return '<span class="tag' + (isPlaceholder(x) ? ' tch-empty' : '') + '">' + inner + '</span>';
    }).join('') + '</div>';
  }

  function qualLine(o, cls) {
    var q = pick(o, 'qualification');
    if (!q) return '';
    return '<div class="' + cls + '"><span class="tch-k">' + esc(T('যোগ্যতা · Qualification')) +
      '</span>' + pair(q, pickEn(o, 'qualification')) + '</div>';
  }

  function renderSuper(s) {
    if (!s) { superBox.innerHTML = emptyPanel(); return; }
    var name = pick(s, 'name');
    var role = pick(s, 'role') || T('সুপার · Head teacher');
    var roleEn = pickEn(s, 'role');
    var bio = pick(s, 'bio');
    superBox.innerHTML =
      '<div class="super-card">' +
        photoTile(s.photo, 'super-photo', name || T('সুপার · Head teacher')) +
        '<div class="super-info">' +
          '<div class="super-role">' + esc(role) + (!isBilingual(role) ? gloss(roleEn) : '') + '</div>' +
          '<h3 class="super-name">' + pair(name, pickEn(s, 'name')) + '</h3>' +
          fieldTags(s) +
          qualLine(s, 'super-qual') +
          (bio ? '<p class="super-bio">' + pair(bio, pickEn(s, 'bio')) + '</p>' : '') +
        '</div>' +
      '</div>';
    wireBrokenPhotos(superBox);
  }

  function renderTeacher(t) {
    var name = pick(t, 'name');
    var role = pick(t, 'role') || T('শিক্ষক · Teacher');
    var roleEn = pickEn(t, 'role');
    return '<article class="card card--sub rv"><div class="card-pad tch">' +
      photoTile(t.photo, 'tch-photo', name || T('শিক্ষক · Teacher')) +
      '<div class="tch-name">' + pair(name, pickEn(t, 'name')) + '</div>' +
      '<div class="tch-role">' + esc(role) + (!isBilingual(role) ? gloss(roleEn) : '') + '</div>' +
      fieldTags(t) +
      qualLine(t, 'tch-qual') +
    '</div></article>';
  }

  /* a broken photo path falls back to the dashed placeholder tile */
  function wireBrokenPhotos(root) {
    Array.prototype.forEach.call(root.querySelectorAll('img.tch-img'), function (img) {
      img.addEventListener('error', function () {
        var box = img.parentNode;
        if (!box) return;
        box.className = box.className.replace(/\s*$/, '') + ' ph-missing';
        box.innerHTML = '<span>' + esc(T('ছবি · Photo')) + '</span>';
      });
    });
  }

  function emptyPanel() {
    return '<div class="panel"><div class="panel-title">' +
      esc(T('এখনও কোনো শিক্ষকের তথ্য যোগ করা হয়নি · No teacher profiles yet')) +
      '</div></div>';
  }
  function unavailablePanel() {
    return '<div class="panel panel-warn"><div class="panel-title">' +
      esc(T('শিক্ষকদের তথ্য লোড করা যায়নি · Could not load the faculty list')) +
      '</div><p>' + esc(T('ইন্টারনেট সংযোগ পরীক্ষা করে পেজটি রিফ্রেশ করুন।')) + '</p></div>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    superBox = el('superBox');
    grid = el('teacherGrid');
    if (!superBox || !grid) return;

    superBox.innerHTML = '<p style="color:var(--muted)">' + esc(T('লোড হচ্ছে… · Loading…')) + '</p>';

    fetchJson('teachers.json').then(function (data) {
      if (!data) { superBox.innerHTML = unavailablePanel(); grid.innerHTML = ''; return; }
      var teachers = Array.isArray(data.teachers) ? data.teachers : [];
      renderSuper(data.super);
      if (!teachers.length && !data.super) { superBox.innerHTML = emptyPanel(); }
      grid.innerHTML = teachers.length
        ? '<div class="grid grid-values">' + teachers.map(renderTeacher).join('') + '</div>'
        : '<div class="panel"><div class="panel-title">' +
            esc(T('এখনও কোনো শিক্ষকের তথ্য যোগ করা হয়নি · No teacher profiles yet')) + '</div></div>';
      wireBrokenPhotos(grid);
      if (window.siteApplyBilingual) window.siteApplyBilingual(grid);
      if (window.__siteReveal) window.__siteReveal();
    });
  });
})();
