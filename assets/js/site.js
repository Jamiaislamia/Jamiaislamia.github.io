/* ═══════════════════════════════════════════════════════════════
   SITE SHARED — header/footer injection, nav, entrance stagger, toast
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var NAV = [
    ['index.html', 'হোম', 'Home'],
    ['index.html#about', 'পরিচিতি', 'About'],
    ['index.html#streams', 'শাখা', 'Streams'],
    ['index.html#different', 'ব্যতিক্রম', 'Why us'],
    ['teachers.html', 'শিক্ষক', 'Teachers'],
    ['index.html#campus', 'ক্যাম্পাস', 'Campus'],
    ['index.html#culture', 'সংস্কৃতি', 'Culture'],
    ['explore.html', 'এক্সপ্লোর', 'Explore'],
    ['index.html#contact', 'যোগাযোগ', 'Contact']
  ];

  function currentPage() {
    var path = (location.pathname || '').split(/[\\/]/).pop();
    return path || 'index.html';
  }

  /* ── Application form links (GitHub-hosted; see assets/js/site-links.js) ── */
  function formLinks() {
    var cfg = window.SITE_LINKS || {};
    return {
      student: cfg.studentForm || 'apply-student.html',
      teacher: cfg.teacherForm || 'apply-teacher.html'
    };
  }
  function isExternal(url) { return /^https?:\/\//i.test(url); }
  function linkAttrs(url) {
    return isExternal(url) ? ' target="_blank" rel="noopener"' : '';
  }

  function buildHeader() {
    var host = document.getElementById('siteHeader');
    if (!host) return;
    var page = currentPage();
    var forms = formLinks();
    /* The header CTA opens the institute's apply hub (the page with the
       student / teacher / track doors). While no applyPortal is configured
       it keeps pointing straight at the student form, so the button can
       never be dead. */
    var portal = (window.SITE_LINKS || {}).applyPortal || forms.student;
    var links = NAV.map(function (item) {
      var target = item[0].split('#')[0];
      var active = (target === page && item[0].indexOf('#') === -1) ? ' class="active"' : '';
      /* Bangla label only — the English name is the hover/AT label, so the
         bar never reads as a translation table. */
      return '<a href="' + item[0] + '"' + active + ' title="' + item[2] +
        '" aria-label="' + item[1] + ' · ' + item[2] + '">' + item[1] + '</a>';
    }).join('');
    host.innerHTML =
      '<div class="header-in">' +
        '<a class="brand" href="index.html" aria-label="জামিয়া ইসলামিয়া মাদরাসা · Jamia Islamia Madrasah — home">' +
          '<img src="assets/img/logo.png" alt="জামিয়া ইসলামিয়া মাদরাসা · Jamia Islamia Madrasah">' +
          '<span class="brand-name">জামিয়া ইসলামিয়া মাদরাসা<span class="brand-sub">Jamia Islamia Madrasah</span></span>' +
        '</a>' +
        '<nav class="nav" id="siteNav">' + links + '</nav>' +
        '<div class="apply-wrap">' +
          '<a class="apply-btn" id="applyBtn" href="' + portal + '"' + linkAttrs(portal) + ' aria-label="আবেদন করুন · Apply now">' +
            '<span class="apply-btn-label">আবেদন</span>' +
            '<span class="apply-btn-en" lang="en">Apply</span>' +
            '<span class="apply-caret" aria-hidden="true">→</span>' +
          '</a>' +
        '</div>' +
        '<button class="menu-btn" id="menuBtn" aria-label="মেনু · Open menu" aria-expanded="false">☰<span class="menu-btn-label"> Menu</span></button>' +
      '</div>';

    var btn = document.getElementById('menuBtn');
    var nav = document.getElementById('siteNav');
    if (btn && nav) {
      btn.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    /* The CTA links straight to the institute's application form
       (assets/js/site-links.js → studentForm). It carries no `active` class:
       a permanent active state painted the hover fill at rest. */
  }

  /* Social row — icons come from assets/js/social-icons.js, URLs from
     site-links.js. Platforms without a URL render muted (unless disabled). */
  function socialRow() {
    var cfg = (window.SITE_LINKS && window.SITE_LINKS.social) || {};
    var icons = window.SITE_SOCIAL || [];
    var showOff = !(window.SITE_LINKS && window.SITE_LINKS.showUnlinkedIcons === false);
    var out = '';
    icons.forEach(function (s) {
      var url = cfg[s[0]] || '';
      var svg = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + s[2] + '"/></svg>';
      if (url) {
        out += '<a class="soc" href="' + url + '" target="_blank" rel="noopener"' +
          ' aria-label="' + s[1] + '" title="' + s[1] + '">' + svg + '</a>';
      } else if (showOff) {
        out += '<span class="soc soc--off" aria-label="' + s[1] + '"' +
          ' title="' + s[1] + ' — শীঘ্রই যুক্ত হবে · link coming soon">' + svg + '</span>';
      }
    });
    return out ? '<div class="footer-social">' + out + '</div>' : '';
  }

  /* Footer — identity + sitemap + legal notice.
     Contact facts (email / address / map) are deliberately NOT repeated
     here: #contact is their single home, which removes the footer/contact
     duplication. */
  function buildFooter() {
    var host = document.getElementById('siteFooter');
    if (!host) return;
    var name = 'জামিয়া ইসলামিয়া মদরাসা';
    var cols = [
      ['প্রতিষ্ঠান', 'Institute', [
        ['index.html#about', 'পরিচিতি'],
        ['index.html#history', 'পথচলা'],
        ['index.html#streams', 'শাখা'],
        ['index.html#different', 'ব্যতিক্রম'],
        ['index.html#campus', 'ক্যাম্পাস'],
        ['index.html#culture', 'সংস্কৃতি']
      ]],
      ['ভর্তি', 'Admission', [
        ['apply-student.html', 'শিক্ষার্থী আবেদন', 'student'],
        ['apply-teacher.html', 'শিক্ষক আবেদন', 'teacher'],
        ['https://jamiaislamia.github.io/apply-portal/#track', 'অবস্থা যাচাই']
      ]],
      ['আরও', 'More', [
        ['teachers.html', 'শিক্ষকগণ'],
        ['explore.html', 'এক্সপ্লোর'],
        ['index.html#contact', 'যোগাযোগ']
      ]]
    ];
    var nav = cols.map(function (col) {
      var items = col[2].map(function (link) {
        var applyAttr = link[2] ? ' data-apply-link="' + link[2] + '"' : '';
        /* a plain external row (the portal's checker) opens in a new tab;
           student / teacher rows get theirs from initApplyLinks() */
        var extAttr = (!link[2] && isExternal(link[0])) ? ' target="_blank" rel="noopener"' : '';
        return '<li><a href="' + link[0] + '"' + applyAttr + extAttr + '>' + link[1] + '</a></li>';
      }).join('');
      return '<div class="footer-col">' +
        '<div class="footer-col-title">' + col[0] + ' · ' + col[1] + '</div>' +
        '<ul>' + items + '</ul>' +
      '</div>';
    }).join('');

    host.innerHTML =
      '<div class="footer-in">' +
        '<div class="footer-top">' +
          '<div class="footer-brand">' +
            '<img class="footer-logo" src="assets/img/logo.png" alt="' + name + '">' +
            '<div>' +
              '<span class="footer-name">' + name + '</span>' +
              '<span class="footer-slogan">Promises to Quality and Morality</span>' +
            '</div>' +
          '</div>' +
          socialRow() +
        '</div>' +
        '<nav class="footer-nav" aria-label="Footer">' + nav + '</nav>' +
        '<div class="footer-base">© <span id="fy"></span> <span>' + name + '</span> · প্রতিষ্ঠিত ২০০৩</div>' +
      '</div>';
    var fy = document.getElementById('fy');
    if (fy) fy.textContent = new Date().getFullYear();
  }

  /* Staggered section-level reveals (also re-runnable for injected content) */
  function initReveal() {
    var els = Array.prototype.slice.call(document.querySelectorAll('.rv:not(.in):not([data-rv])'));
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });

    els.forEach(function (el) {
      el.setAttribute('data-rv', '1');
      /* each block staggers relative to its own section, so a section flows in */
      var scope = el.closest ? el.closest('.section') : null;
      var siblings = scope ? Array.prototype.slice.call(scope.querySelectorAll('.rv')) : els;
      var i = siblings.indexOf(el);
      if (i < 0) i = 0;
      el.style.setProperty('--d', Math.min(i, 6) * 70 + 'ms');
      io.observe(el);
    });
  }
  window.__siteReveal = initReveal;

  /* Toast */
  var toastTimer = null;
  window.siteToast = function (msg) {
    var t = document.getElementById('siteToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'siteToast';
      t.className = 'toast';
      t.setAttribute('role', 'status');
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  };

  /* Copy helper (buttons use data-copy) */
  function initCopy() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('[data-copy]') : null;
      if (!el) return;
      var text = el.getAttribute('data-copy');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          window.siteToast('কপি হয়েছে · Copied');
        }).catch(function () { window.siteToast('কপি করা যায়নি · Copy failed'); });
      } else {
        window.siteToast('আইডি: ' + text);
      }
    });
  }

  /* Any [data-apply-link="student|teacher"] anchor follows the configured URL */
  function initApplyLinks() {
    var forms = formLinks();
    Array.prototype.forEach.call(document.querySelectorAll('[data-apply-link]'), function (a) {
      var which = a.getAttribute('data-apply-link');
      var url = forms[which];
      if (!url) return;
      a.setAttribute('href', url);
      if (isExternal(url)) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
      } else {
        a.removeAttribute('target');
        a.removeAttribute('rel');
      }
    });
  }

  /* Any [data-map-link] anchor follows the one Maps URL (site-links.js) */
  function initMapLinks() {
    var url = (window.SITE_LINKS && window.SITE_LINKS.mapUrl) || '';
    if (!url) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-map-link]'), function (a) {
      a.setAttribute('href', url);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    });
  }

  /* Nav highlight follows the section you are actually looking at */
  function initNavSpy() {
    var nav = document.getElementById('siteNav');
    if (!nav) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll('a'));
    if (!links.length) return;
    var page = currentPage();
    var home = null;
    var sections = [];
    links.forEach(function (a) {
      var href = a.getAttribute('href') || '';
      var parts = href.split('#');
      var file = parts[0] || page;
      var hash = parts[1];
      if (!hash && file === 'index.html') home = a;
      if (hash && page === 'index.html' && file === 'index.html') {
        var el = document.getElementById(hash);
        if (el) sections.push({ el: el, a: a });
      }
    });
    if (!sections.length) return;          /* other pages keep the page-level highlight */

    function clearActive() { links.forEach(function (a) { a.classList.remove('active'); }); }
    function setActive(a) { clearActive(); if (a) a.classList.add('active'); }

    function update() {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (y < 90) { setActive(home); return; }       /* hero → Home */
      var current = null;
      sections.forEach(function (item) {
        var top = item.el.getBoundingClientRect().top + y - 140;   /* allow for the sticky header */
        if (y >= top) current = item.a;
      });
      setActive(current || home);
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('hashchange', update);
    update();
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildHeader();
    buildFooter();
    initReveal();
    initCopy();
    initApplyLinks();
    initMapLinks();
    initNavSpy();
    if (window.siteApplyLang) window.siteApplyLang();
  });
})();
