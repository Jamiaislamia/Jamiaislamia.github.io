/* ═══════════════════════════════════════════════════════════════
   INLINE APPLICATION TRACKER (shared)
   Any block marked [data-apply-track] gets a working status lookup:
     <div data-apply-track>
       <input> <button> <div data-track-result></div>
     </div>
   Handles BOTH kinds of application:
     APP-XXXXXXXX  → /admissions
     TCH-XXXXXXXX  → /teacher-applications
   Read-only: GET requests only (see firebase-rt.js).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  function panel(cls, title, body) {
    return '<div class="panel ' + (cls || '') + '">' +
      (title ? '<div class="panel-title">' + title + '</div>' : '') +
      '<p>' + body + '</p></div>';
  }
  /* language-aware text helper (dictionary lives in i18n.js) */
  function T(s) { return window.siteT ? window.siteT(s) : s; }
  function isEn() { return !!(window.siteLang && window.siteLang() === 'en'); }

  function notFoundPanel() {
    return panel('panel-err', T('কোনো আবেদন পাওয়া যায়নি · No application found'),
      T('এই আইডিতে কোনো আবেদন খুঁজে পাওয়া যায়নি। আইডিটি পুনরায় যাচাই করুন।') +
      (isEn() ? '' : '<br><span style="color:var(--muted)">Please check the Application ID and try again.</span>'));
  }
  function offlinePanel() {
    return panel('panel-warn', T('সার্ভারে সংযোগ করা যায়নি · Could not reach the server'),
      T('ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।') +
      (isEn() ? '' : '<br><span style="color:var(--muted)">Please check your connection and try again.</span>'));
  }

  function initOne(root) {
    var input = root.querySelector('input');
    var btn = root.querySelector('button');
    var out = root.querySelector('[data-track-result]');
    if (!input || !btn || !out) return;

    function search() {
      var id = String(input.value || '').trim().toUpperCase();
      if (!id) {
        out.innerHTML = panel('panel-warn', '', T('আবেদন আইডি লিখুন · Please enter your Application ID'));
        return;
      }
      if (!/^(APP|TCH)-[A-Z0-9]{4,}$/.test(id)) {
        out.innerHTML = panel('panel-warn', '', T('আইডির ধরন সঠিক নয় — যেমন APP-XXXXXXXX বা TCH-XXXXXXXX'));
        return;
      }
      var kind = id.indexOf('TCH-') === 0 ? 'teacher' : 'student';
      var node = kind === 'teacher' ? 'teacher-applications' : 'admissions';
      var other = kind === 'teacher' ? 'admissions' : 'teacher-applications';

      btn.disabled = true;
      out.innerHTML = '<div class="panel"><p style="color:var(--muted)">' + T('অনুসন্ধান করা হচ্ছে… · Searching…') + '</p></div>';
      rtFind(node, id).then(function (rec) {
        if (rec) { out.innerHTML = rtStatusPanel(rec, kind); return; }
        return rtFind(other, id).then(function (rec2) {
          if (rec2) { out.innerHTML = rtStatusPanel(rec2, kind === 'teacher' ? 'student' : 'teacher'); return; }
          out.innerHTML = notFoundPanel();
        });
      }).catch(function () { out.innerHTML = offlinePanel(); })
        .then(function () { btn.disabled = false; });
    }

    btn.addEventListener('click', search);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); search(); }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('[data-apply-track]'), initOne);
  });
})();
