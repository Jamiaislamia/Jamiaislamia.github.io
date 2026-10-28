/* ═══════════════════════════════════════════════════════════════
   TEACHER APPLICATION — validation, photo, submit to /teacher-applications
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var _photo = '';
  var _appId = makeAppId('TCH-');
  var _payload = null;

  function el(id) { return document.getElementById(id); }
  function val(id) { var e = el(id); return e ? String(e.value || '').trim() : ''; }
  function setErr(id, msg) {
    var input = el(id); if (!input) return;
    input.classList.toggle('err', !!msg);
    var box = input.parentElement.querySelector('.fm');
    if (box) box.textContent = msg || '';
  }
  function checkedVals(name) {
    return Array.prototype.slice
      .call(document.querySelectorAll('input[name="' + name + '"]:checked'))
      .map(function (i) { return i.value; });
  }
  function clearErrs() {
    Array.prototype.forEach.call(document.querySelectorAll('#tchForm .err'), function (e) { e.classList.remove('err'); });
    Array.prototype.forEach.call(document.querySelectorAll('#tchForm .fm'), function (e) { if (e.id !== 't-photoMsg') e.textContent = ''; });
    var se = el('t-subjErr'); if (se) se.textContent = '';
    var g = el('t-globalErr'); if (g) g.textContent = '';
  }
  function isPhone(v) { return /^01[3-9]\d{8}$/.test(v); }
  function isEmail(v) { return /^\S+@\S+\.\S+$/.test(v); }

  function validate() {
    var firstBad = null;
    function fail(id, msg) { setErr(id, msg); if (!firstBad) firstBad = el(id); }

    if (val('t-nameEn').length < 3) fail('t-nameEn', 'ইংরেজি নাম লিখুন (কমপক্ষে ৩ অক্ষর)');
    if (!val('t-gen')) fail('t-gen', 'লিঙ্গ নির্বাচন করুন');
    if (!val('t-ph')) fail('t-ph', 'মোবাইল নম্বর দিন');
    else if (!isPhone(val('t-ph'))) fail('t-ph', 'সঠিক মোবাইল নম্বর দিন (যেমন: 01712345678)');
    if (val('t-gph') && !isPhone(val('t-gph'))) fail('t-gph', 'সঠিক মোবাইল নম্বর দিন');
    if (val('t-em') && !isEmail(val('t-em'))) fail('t-em', 'সঠিক ইমেইল ঠিকানা লিখুন');
    if (!val('t-addr')) fail('t-addr', 'ঠিকানা লিখুন');
    if (!val('t-degree')) fail('t-degree', 'সর্বোচ্চ শিক্ষাগত যোগ্যতা নির্বাচন করুন');

    var subjects = checkedVals('t-subj');
    if (!subjects.length) {
      var se = el('t-subjErr');
      if (se) { se.textContent = 'কমপক্ষে একটি বিষয় নির্বাচন করুন · Select at least one subject'; se.style.color = 'var(--crimson)'; }
      if (!firstBad) firstBad = el('t-subjects');
    }

    if (firstBad) {
      firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
      try { firstBad.focus({ preventScroll: true }); } catch (e) {}
      return false;
    }
    return true;
  }

  function buildPayload() {
    return {
      appId: _appId,
      nameBn: val('t-nameBn') || val('t-nameEn'),
      nameEn: val('t-nameEn'),
      gen: val('t-gen'),
      gender: val('t-gen'),
      dob: val('t-dob'),
      rel: val('t-rel'),
      nat: val('t-nat'),
      phone: val('t-ph'),
      em: val('t-em'),
      email: val('t-em'),
      guardianName: val('t-guardian'),
      guardianPhone: val('t-gph'),
      address: val('t-addr'),
      degree: val('t-degree'),
      institute: val('t-institute'),
      passingYear: val('t-year'),
      grade: val('t-grade'),
      hafiz: val('t-hafiz'),
      islamicQual: val('t-islamicQual'),
      experienceYears: val('t-exp'),
      workplace: val('t-workplace'),
      subjects: checkedVals('t-subj'),
      roles: checkedVals('t-role'),
      photo: _photo || '',
      note: val('t-note'),
      status: 'pending',
      submittedAt: new Date().toISOString(),
      source: 'website'
    };
  }

  function showSuccess(offline) {
    var form = el('tchForm');
    if (form) form.style.display = 'none';
    var box = el('t-success');
    if (box) box.style.display = '';
    var idEl = el('t-appId');
    if (idEl) { idEl.textContent = _appId; idEl.setAttribute('data-copy', _appId); }
    var note = el('t-offlineNote');
    if (note) {
      note.textContent = offline
        ? '⚠ ইন্টারনেট সংযোগ পাওয়া যায়নি — আবেদনটি এই ব্রাউজারে সংরক্ষিত হয়েছে। "আবার জমা দিন" চাপুন। (Application kept locally — press Retry submit.)'
        : '';
    }
    var retry = el('t-retryBtn');
    if (retry) retry.style.display = offline ? '' : 'none';
    var trackInput = el('t-checkId');
    if (trackInput) trackInput.value = _appId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function send(payload) {
    var btn = el('t-submit');
    var guard = (typeof rtBotCheck === 'function') ? rtBotCheck('tchForm') : { ok: true };
    if (!guard.ok) {
      window.siteToast && window.siteToast('একটু অপেক্ষা করে আবার চেষ্টা করুন · Please wait a moment and try again');
      return Promise.resolve();
    }
    if (btn) { btn.disabled = true; btn.textContent = 'জমা হচ্ছে… · Submitting…'; }
    return rtPut('teacher-applications', payload.appId, payload)
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
    var box = el('t-photoBox'), input = el('t-photo'), msg = el('t-photoMsg');
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
        box.innerHTML = '<img src="' + url + '" alt="শিক্ষকের ছবি">';
        if (msg) { msg.textContent = '✓ ছবি যোগ হয়েছে · Photo added'; msg.style.color = 'var(--teal)'; }
      }).catch(function () {
        _photo = '';
        if (msg) { msg.textContent = 'ছবি যোগ করা যায়নি · Could not process image'; msg.style.color = 'var(--crimson)'; }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var form = el('tchForm');
    if (form) form.addEventListener('submit', onSubmit);
    var resetBtn = el('t-reset');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      _photo = '';
      clearErrs();
      var box = el('t-photoBox');
      if (box) box.innerHTML = '<span class="ph-hint" id="t-photoHint">ছবি<br>যোগ করুন</span>';
      var msg = el('t-photoMsg'); if (msg) msg.textContent = '';
      _appId = makeAppId('TCH-');
    });

    var copyBtn = el('t-copyBtn');
    if (copyBtn) copyBtn.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(_appId).then(function () {
          window.siteToast && window.siteToast('আইডি কপি হয়েছে · ID copied');
        }).catch(function () { window.siteToast && window.siteToast('আইডি: ' + _appId); });
      } else {
        window.siteToast && window.siteToast('আইডি: ' + _appId);
      }
    });

    var againBtn = el('t-againBtn');
    if (againBtn) againBtn.addEventListener('click', function () {
      var box = el('t-success'); if (box) box.style.display = 'none';
      var form = el('tchForm'); if (form) { form.style.display = ''; form.reset(); }
      _appId = makeAppId('TCH-');
      _payload = null;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    var retryBtn = el('t-retryBtn');
    if (retryBtn) retryBtn.addEventListener('click', function () {
      if (!_payload) return;
      retryBtn.disabled = true;
      rtPut('teacher-applications', _payload.appId, _payload).then(function () {
        showSuccess(false);
        window.siteToast && window.siteToast('আবেদন সার্ভারে জমা হয়েছে · Submitted');
      }).catch(function () {
        window.siteToast && window.siteToast('এখনও সংযোগ পাওয়া যায়নি · Still offline');
      }).then(function () { retryBtn.disabled = false; });
    });

    initPhoto();
    if (typeof rtArmForm === 'function') rtArmForm('tchForm');
  });
})();
