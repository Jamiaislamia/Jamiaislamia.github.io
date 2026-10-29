/* ═══════════════════════════════════════════════════════════════
   NOTICE BOARD — publish a notice from a phone, no laptop needed.

   Used by /notice/ (notice/index.html). Flow:
     sign in (an APPROVED institute account) → type the notice →
     Publish → it appears on the public website within a refresh.
     “সরিয়ে নিন” deletes it again.

   Storage: Firebase Realtime Database
     /site/notices/{id}   id = NT-<yyyymmddHHMMSS>   (sortable)
       text        the notice, 3–600 characters, required
       tag         admission | hiring | closure | general
       publishedAt ISO timestamp
       expiresAt   '' or 'YYYY-MM-DD' — the public site hides it after that day
       by          the author's email (shown in the list, never on the site)

   Auth reuses the accounts the dashboard already uses:
     identitytoolkit signInWithPassword  → idToken
     securetoken    refresh_token        → fresh idToken
   The token lives in localStorage on that phone, so the authority stays
   signed in; the password is never stored.

   SECURITY: the write is only allowed by the database rules
   (/site/notices  write = approved account or staff). A visitor who
   opens this page without an approved login cannot publish anything.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var API_KEY = 'AIzaSyBS3Z879firMRNhROoK0Q12D7bWY2UQ_lo';
  var RTDB = (window.SITE_LINKS && window.SITE_LINKS.rtdb) || 'https://sms-admission-4f632-default-rtdb.asia-southeast1.firebasedatabase.app';
  var STORE = 'sms_notice_auth';
  var MAX_LEN = 600;
  var MIN_LEN = 3;

  var TAGS = [
    { id: 'admission', bn: 'ভর্তি চলছে', cls: 'is-open' },
    { id: 'hiring', bn: 'শিক্ষক নিয়োগ', cls: 'is-open' },
    { id: 'closure', bn: 'বন্ধ / ছুটি', cls: 'is-warn' },
    { id: 'general', bn: 'সাধারণ নোটিশ', cls: '' }
  ];

  var auth = null;         /* { idToken, refreshToken, expiresAt, email, uid } */
  var notices = [];
  var busy = false;

  /* ── tiny helpers ─────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function bn(n) {
    return String(n).replace(/[0-9]/g, function (d) { return '০১২৩৪৫৬৭৮৯'[+d]; });
  }
  function tagOf(id) {
    for (var i = 0; i < TAGS.length; i++) if (TAGS[i].id === id) return TAGS[i];
    return TAGS[3];
  }
  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return bn(d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()));
  }
  function stamp() {
    var d = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return 'NT-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
      pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
  }

  function say(msg, kind) {
    var box = $('nbMsg');
    if (!box) return;
    box.className = 'nb-msg' + (kind ? ' ' + kind : '');
    box.textContent = msg || '';
    box.hidden = !msg;
  }

  /* ── auth ─────────────────────────────────────────────────── */
  function loadAuth() {
    try { auth = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) { auth = null; }
    if (!auth || !auth.refreshToken) auth = null;
    return auth;
  }
  function saveAuth(a) {
    auth = a;
    try {
      if (a) localStorage.setItem(STORE, JSON.stringify(a));
      else localStorage.removeItem(STORE);
    } catch (e) { /* private mode — session only */ }
  }
  function authError(message) {
    if (message === 'INVALID_LOGIN_CREDENTIALS' || message === 'EMAIL_NOT_FOUND' || message === 'INVALID_PASSWORD') {
      return 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।';
    }
    if (message === 'USER_DISABLED') return 'এই অ্যাকাউন্টটি বন্ধ করা আছে। অ্যাডমিনের সাথে যোগাযোগ করুন।';
    if (message === 'TOO_MANY_ATTEMPTS_TRY_LATER') return 'অনেকবার ভুল হয়েছে — কিছুক্ষণ পরে চেষ্টা করুন।';
    return 'লগইন করা যায়নি' + (message ? ' (' + message + ')' : '') + '।';
  }

  function signIn(email, password) {
    return fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password, returnSecureToken: true })
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) {
          var m = (j && j.error && j.error.message) || ('HTTP ' + r.status);
          throw new Error(m);
        }
        return j;
      });
    }).then(function (j) {
      saveAuth({
        idToken: j.idToken,
        refreshToken: j.refreshToken,
        expiresAt: Date.now() + (parseInt(j.expiresIn, 10) || 3600) * 1000,
        email: j.email || email,
        uid: j.localId
      });
      return auth;
    });
  }

  function refreshAuth() {
    if (!auth || !auth.refreshToken) return Promise.reject(new Error('NO_SESSION'));
    return fetch('https://securetoken.googleapis.com/v1/token?key=' + API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(auth.refreshToken)
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) throw new Error('SESSION_EXPIRED');
        saveAuth({
          idToken: j.id_token,
          refreshToken: j.refresh_token || auth.refreshToken,
          expiresAt: Date.now() + (parseInt(j.expires_in, 10) || 3600) * 1000,
          email: auth.email,
          uid: j.user_id || auth.uid
        });
        return auth;
      });
    });
  }

  function validToken() {
    if (!auth) return Promise.reject(new Error('NO_SESSION'));
    if (auth.idToken && auth.expiresAt - 90000 > Date.now()) return Promise.resolve(auth.idToken);
    return refreshAuth().then(function (a) { return a.idToken; });
  }

  /* ── database ─────────────────────────────────────────────── */
  function rt(method, path, body, retry) {
    return validToken().then(function (tok) {
      return fetch(RTDB + path + '.json?auth=' + encodeURIComponent(tok), {
        method: method,
        cache: 'no-store',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined
      });
    }).then(function (r) {
      if (r.status === 401 || r.status === 403) {
        if (!retry) return refreshAuth().then(function () { return rt(method, path, body, true); });
        var e403 = new Error('NOT_ALLOWED');
        throw e403;
      }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json().catch(function () { return null; });
    });
  }

  /* public read — no token needed */
  function fetchNotices() {
    return fetch(RTDB + '/site/notices.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  /* ── rendering ────────────────────────────────────────────── */
  function renderShell() {
    var signedIn = !!auth;
    $('nbLogin').hidden = signedIn;
    $('nbEditor').hidden = !signedIn;
    $('nbWho').textContent = signedIn ? ((auth.email || '') + (auth.uid ? '  ·  ' + auth.uid : '')) : '';
    if ($('nbOut')) $('nbOut').hidden = !signedIn;
    if (signedIn) { $('nbEmail').value = ''; $('nbPass').value = ''; }
  }

  function renderList() {
    var host = $('nbList');
    if (!host) return;
    var now = Date.now();
    if (!notices.length) {
      host.innerHTML = '<div class="nb-empty">এখন কোনো নোটিশ প্রকাশিত নেই। উপরে লিখে <b>প্রকাশ করুন</b> চাপলে সেটি সঙ্গে সঙ্গে ওয়েবসাইটে দেখা যাবে।</div>';
      return;
    }
    host.innerHTML = notices.map(function (n) {
      var t = tagOf(n.tag);
      var expired = n.expiresAt && new Date(n.expiresAt + 'T23:59:59').getTime() < now;
      return '<div class="nb-item' + (expired ? ' is-expired' : '') + '" data-id="' + esc(n.id) + '">' +
        '<div class="nb-item-head">' +
          '<span class="nb-tag ' + t.cls + '">' + esc(t.bn) + '</span>' +
          (expired ? '<span class="nb-exp">সময় শেষ — ওয়েবসাইটে দেখাবে না</span>' : '') +
        '</div>' +
        '<p class="nb-item-text">' + esc(n.text) + '</p>' +
        '<div class="nb-item-foot">' +
          '<span class="nb-meta">' + esc(fmtDate(n.publishedAt)) +
            (n.expiresAt ? ' · শেষ ' + esc(fmtDate(n.expiresAt + 'T00:00:00')) : '') + '</span>' +
          '<button class="nb-del" type="button" data-del="' + esc(n.id) + '">সরিয়ে নিন</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function sortNotices(map) {
    var list = [];
    if (map && typeof map === 'object') {
      Object.keys(map).forEach(function (k) {
        var v = map[k] || {};
        list.push({
          id: k,
          text: v.text == null ? '' : String(v.text),
          tag: v.tag || 'general',
          publishedAt: v.publishedAt || '',
          expiresAt: v.expiresAt || '',
          by: v.by || ''
        });
      });
    }
    list.sort(function (a, b) { return a.id < b.id ? 1 : (a.id > b.id ? -1 : 0); });
    return list;
  }

  function loadList() {
    return fetchNotices().then(function (map) {
      notices = sortNotices(map);
      renderList();
    });
  }

  /* ── actions ──────────────────────────────────────────────── */
  function publish() {
    if (busy) return;
    var text = ($('nbText').value || '').trim();
    var tag = ($('nbTag') && $('nbTag').value) || 'general';
    var exp = ($('nbExpire') && $('nbExpire').value) || '';

    if (text.length < MIN_LEN) { say('নোটিশটি লিখুন (অন্তত ' + bn(MIN_LEN) + ' অক্ষর)।', 'is-err'); return; }
    if (text.length > MAX_LEN) { say('নোটিশটি ' + bn(MAX_LEN) + ' অক্ষরের মধ্যে রাখুন।', 'is-err'); return; }

    busy = true;
    $('nbPublish').disabled = true;
    say('প্রকাশ করা হচ্ছে…', 'is-busy');

    rt('PUT', '/site/notices/' + stamp(), {
      text: text,
      tag: tag,
      publishedAt: new Date().toISOString(),
      expiresAt: exp,
      by: (auth && auth.email) || ''
    }).then(function () {
      $('nbText').value = '';
      if ($('nbExpire')) $('nbExpire').value = '';
      say('প্রকাশিত হয়েছে — ওয়েবসাইটে এখনই দেখা যাবে।', 'is-ok');
      return loadList();
    }).catch(function (e) {
      say(failText(e), 'is-err');
    }).then(function () {
      busy = false;
      $('nbPublish').disabled = false;
    });
  }

  function takeDown(id) {
    if (busy || !id) return;
    if (!window.confirm('এই নোটিশটি ওয়েবসাইট থেকে সরিয়ে নেবেন?')) return;
    busy = true;
    say('সরিয়ে নেওয়া হচ্ছে…', 'is-busy');
    rt('DELETE', '/site/notices/' + id).then(function () {
      say('নোটিশটি সরিয়ে নেওয়া হয়েছে।', 'is-ok');
      return loadList();
    }).catch(function (e) {
      say(failText(e), 'is-err');
    }).then(function () {
      busy = false;
    });
  }

  function failText(e) {
    var m = (e && e.message) || '';
    if (m === 'NOT_ALLOWED') {
      return 'এই অ্যাকাউন্টটি অ্যাডমিন তালিকায় নেই — নোটিশ শুধু অ্যাডমিন অ্যাকাউন্ট দিতে পারে।' +
        (auth && auth.uid ? '  (uid: ' + auth.uid + ')' : '');
    }
    if (m === 'SESSION_EXPIRED' || m === 'NO_SESSION') return 'সেশন শেষ — আবার লগইন করুন।';
    if (m === 'Failed to fetch') return 'ইন্টারনেট সংযোগ পাওয়া যায়নি — আবার চেষ্টা করুন।';
    return 'কাজটি সম্পন্ন হয়নি' + (m ? ' (' + m + ')' : '') + '।';
  }

  /* ── boot ─────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    if (!$('nbText')) return;

    var tagSel = $('nbTag');
    if (tagSel) {
      tagSel.innerHTML = TAGS.map(function (t) {
        return '<option value="' + t.id + '">' + esc(t.bn) + '</option>';
      }).join('');
    }

    loadAuth();
    renderShell();

    $('nbLoginBtn').addEventListener('click', function () {
      var email = ($('nbEmail').value || '').trim();
      var pass = $('nbPass').value || '';
      if (!email || !pass) { say('ইমেইল ও পাসওয়ার্ড দুটোই দিন।', 'is-err'); return; }
      if (busy) return;
      busy = true;
      $('nbLoginBtn').disabled = true;
      say('লগইন হচ্ছে…', 'is-busy');
      signIn(email, pass).then(function () {
        say('', '');
        renderShell();
        return loadList();
      }).catch(function (e) {
        say(authError((e && e.message) || ''), 'is-err');
      }).then(function () {
        busy = false;
        $('nbLoginBtn').disabled = false;
      });
    });

    $('nbPass').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') $('nbLoginBtn').click();
    });

    $('nbPublish').addEventListener('click', publish);

    $('nbText').addEventListener('input', function () {
      $('nbCount').textContent = bn($('nbText').value.length) + ' / ' + bn(MAX_LEN);
    });

    $('nbOut').addEventListener('click', function () {
      saveAuth(null);
      notices = [];
      renderShell();
      renderList();
      say('লগআউট হয়েছে।', 'is-ok');
    });

    $('nbList').addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-del]') : null;
      if (btn) takeDown(btn.getAttribute('data-del'));
    });

    loadList();
  });
})();
