/* ═══════════════════════════════════════════════════════════════
   STUDENT APPLICATION — validation, photo, submit to /admissions
   Payload carries BOTH canonical card fields and legacy short names
   so the management app renders a complete admission card.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var _photo = '';
  var _appId = makeAppId('APP-');
  var _payload = null;

  function el(id) { return document.getElementById(id); }
  function val(id) { var e = el(id); return e ? String(e.value || '').trim() : ''; }
  function msgBox(input) { return input ? input.parentElement.querySelector('.fm') : null; }
  function setErr(id, msg) {
    var input = el(id); if (!input) return;
    input.classList.toggle('err', !!msg);
    var box = msgBox(input); if (box) box.textContent = msg || '';
  }
  function clearErrs() {
    Array.prototype.forEach.call(document.querySelectorAll('#appForm .err'), function (e) { e.classList.remove('err'); });
    Array.prototype.forEach.call(document.querySelectorAll('#appForm .fm'), function (e) { if (e.id !== 's-photoMsg') e.textContent = ''; });
    var g = el('s-globalErr'); if (g) g.textContent = '';
  }
  function isPhone(v) { return /^01[3-9]\d{8}$/.test(v); }
  function isEmail(v) { return /^\S+@\S+\.\S+$/.test(v); }

  function validate() {
    var firstBad = null;
    function fail(id, msg) { setErr(id, msg); if (!firstBad) firstBad = el(id); }

    if (val('s-nameEn').length < 3) fail('s-nameEn', 'ইংরেজি নাম লিখুন (কমপক্ষে ৩ অক্ষর)');
    if (!val('s-gen')) fail('s-gen', 'লিঙ্গ নির্বাচন করুন');
    if (!val('s-dob')) fail('s-dob', 'জন্ম তারিখ দিন');
    else if (new Date(val('s-dob')).getTime() > Date.now()) fail('s-dob', 'জন্ম তারিখ ভবিষ্যতের হতে পারে না');
    if (!val('s-fnm')) fail('s-fnm', 'পিতার নাম লিখুন');
    if (!val('s-fph')) fail('s-fph', 'পিতার মোবাইল নম্বর দিন');
    else if (!isPhone(val('s-fph'))) fail('s-fph', 'সঠিক মোবাইল নম্বর দিন (যেমন: 01712345678)');
    if (!val('s-paddr')) fail('s-paddr', 'বর্তমান ঠিকানা লিখুন');
    if (!val('s-cls')) fail('s-cls', 'যে শ্রেণিতে ভর্তি হতে চান তা নির্বাচন করুন');
    if (!val('s-ses')) fail('s-ses', 'শিক্ষাবর্ষ নির্বাচন করুন');
    if (!val('s-med')) fail('s-med', 'মাধ্যম নির্বাচন করুন');
    if (!val('s-ph')) fail('s-ph', 'যোগাযোগের মোবাইল নম্বর দিন');
    else if (!isPhone(val('s-ph'))) fail('s-ph', 'সঠিক মোবাইল নম্বর দিন (যেমন: 01712345678)');
    if (val('s-em') && !isEmail(val('s-em'))) fail('s-em', 'সঠিক ইমেইল ঠিকানা লিখুন');

    if (firstBad) {
      firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
      try { firstBad.focus({ preventScroll: true }); } catch (e) {}
      return false;
    }
    return true;
  }

  /* Canonical (management-app card) fields + legacy short names */
  function buildPayload() {
    var father = val('s-fnm'), mother = val('s-mnm');
    return {
      appId: _appId,
      /* ── canonical fields the admission cards read ── */
      nameBn: val('s-nameBn') || val('s-nameEn'),
      nameEn: val('s-nameEn'),
      gender: val('s-gen'),
      dob: val('s-dob'),
      blood: val('s-blood'),
      rel: val('s-rel'),
      nat: val('s-nat'),
      admClass: val('s-cls'),
      prevClass: val('s-lastcl'),
      fatherBn: father, fatherEn: father, fatherPhone: val('s-fph'),
      motherBn: mother, motherEn: mother, motherPhone: val('s-mph'),
      occupation: val('s-foc'),
      presentAddr: val('s-paddr'),
      permAddr: val('s-peraddr') || val('s-paddr'),
      photo: _photo || '',
      tc: '', tcPhoto: '',
      status: 'pending',
      submittedAt: new Date().toISOString(),
      source: 'website',
      /* ── legacy short names (older form/tools compatibility) ── */
      gen: val('s-gen'),
      fnm: father, fph: val('s-fph'), foc: val('s-foc'),
      mnm: mother, mph: val('s-mph'), moc: val('s-moc'),
      paddr: val('s-paddr'), peraddr: val('s-peraddr'),
      prev: val('s-prev'), lastcl: val('s-lastcl'),
      ssc: val('s-ssc'), grp: val('s-grp'),
      cls: val('s-cls'), ses: val('s-ses'), med: val('s-med'),
      ph: val('s-ph'), em: val('s-em'), note: val('s-note')
    };
  }

  function showSuccess(offline) {
    var form = el('appForm');
    if (form) form.style.display = 'none';
    var box = el('s-success');
    if (box) box.style.display = '';
    var idEl = el('s-appId');
    if (idEl) { idEl.textContent = _appId; idEl.setAttribute('data-copy', _appId); }
    var note = el('s-offlineNote');
    if (note) {
      note.textContent = offline
        ? '⚠ ইন্টারনেট সংযোগ পাওয়া যায়নি — আবেদনটি এই ব্রাউজারে সংরক্ষিত হয়েছে। "আবার জমা দিন" চাপুন। (Application kept locally — press Retry submit.)'
        : '';
    }
    var retry = el('s-retryBtn');
    if (retry) retry.style.display = offline ? '' : 'none';
    var checkId = el('s-checkId');
    if (checkId) checkId.value = _appId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function hideSuccess() {
    var box = el('s-success'); if (box) box.style.display = 'none';
    var form = el('appForm'); if (form) form.style.display = '';
  }

  function send(payload) {
    var btn = el('s-submit');
    var guard = (typeof rtBotCheck === 'function') ? rtBotCheck('appForm') : { ok: true };
    if (!guard.ok) {
      window.siteToast && window.siteToast('একটু অপেক্ষা করে আবার চেষ্টা করুন · Please wait a moment and try again');
      return Promise.resolve();
    }
    if (btn) { btn.disabled = true; btn.textContent = 'জমা হচ্ছে… · Submitting…'; }
    return rtPut('admissions', payload.appId || _appId, payload)
      .then(function () { showSuccess(false); window.siteToast && window.siteToast('আবেদন জমা হয়েছে · Submitted'); })
      .catch(function () {
        rtSaveLocalFallback(payload);
        showSuccess(true);
      })
      .then(function () {
        if (btn) { btn.disabled = false; btn.textContent = 'আবেদন জমা দিন · Submit →'; }
      });
  }

  function onSubmit(e) {
    if (e) e.preventDefault();
    clearErrs();
    if (!validate()) return;
    _payload = buildPayload();
    send(_payload);
  }

  function initPhoto() {
    var box = el('s-photoBox'), input = el('s-photo'), msg = el('s-photoMsg');
    if (!box || !input) return;
    function pick() { input.click(); }
    box.addEventListener('click', pick);
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
    });
    input.addEventListener('change', function () {
      var f = input.files && input.files[0];
      if (!f) return;
      if (msg) { msg.textContent = 'সংকুচিত হচ্ছে… · Compressing…'; msg.style.color = 'var(--muted)'; }
      rtResizeImage(f, 180).then(function (url) {
        _photo = url;
        box.innerHTML = '<img src="' + url + '" alt="শিক্ষার্থীর ছবি">';
        if (msg) { msg.textContent = '✓ ছবি যোগ হয়েছে · Photo added'; msg.style.color = 'var(--teal)'; }
      }).catch(function () {
        _photo = '';
        if (msg) { msg.textContent = 'ছবি যোগ করা যায়নি · Could not process image'; msg.style.color = 'var(--crimson)'; }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var form = el('appForm');
    if (form) form.addEventListener('submit', onSubmit);
    if (typeof rtArmForm === 'function') rtArmForm('appForm');

    var resetBtn = el('s-reset');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      _photo = '';
      clearErrs();
      var box = el('s-photoBox');
      if (box) box.innerHTML = '<span class="ph-hint" id="s-photoHint">ছবি<br>যোগ করুন</span>';
      var msg = el('s-photoMsg'); if (msg) { msg.textContent = ''; }
      _appId = makeAppId('APP-');
    });

    var copyBtn = el('s-copyBtn');
    if (copyBtn) copyBtn.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(_appId).then(function () {
          window.siteToast && window.siteToast('আইডি কপি হয়েছে · ID copied');
        }).catch(function () { window.siteToast && window.siteToast('আইডি: ' + _appId); });
      } else {
        window.siteToast && window.siteToast('আইডি: ' + _appId);
      }
    });

    var againBtn = el('s-againBtn');
    if (againBtn) againBtn.addEventListener('click', function () {
      hideSuccess();
      var form = el('appForm'); if (form) form.reset();
      _appId = makeAppId('APP-');
      _payload = null;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    var retryBtn = el('s-retryBtn');
    if (retryBtn) retryBtn.addEventListener('click', function () {
      if (!_payload) return;
      retryBtn.disabled = true;
      rtPut('admissions', _payload.appId || _appId, _payload).then(function () {
        showSuccess(false);
        window.siteToast && window.siteToast('আবেদন সার্ভারে জমা হয়েছে · Submitted');
      }).catch(function () {
        window.siteToast && window.siteToast('এখনও সংযোগ পাওয়া যায়নি · Still offline');
      }).then(function () { retryBtn.disabled = false; });
    });

    initPhoto();
  });
})();
