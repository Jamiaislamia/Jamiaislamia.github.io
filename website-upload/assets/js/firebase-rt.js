/* ═══════════════════════════════════════════════════════════════
   FIREBASE RTDB — plain REST helpers (no SDK, any-origin)
   Same backend the management app already uses:
   https://sms-admission-4f632-default-rtdb.asia-southeast1.firebasedatabase.app
   ═══════════════════════════════════════════════════════════════ */
var RTDB_URL = 'https://sms-admission-4f632-default-rtdb.asia-southeast1.firebasedatabase.app';

/* POST a record to a node → resolves with the pushed key */
function rtPost(node, payload) {
  return fetch(RTDB_URL + '/' + node + '.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
}

/* GET the whole node → object of key→record (or null when empty) */
function rtGetAll(node) {
  return fetch(RTDB_URL + '/' + node + '.json').then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
}

/* Find one record by its appId inside a node */
function rtFind(node, appId) {
  return rtGetAll(node).then(function (data) {
    if (!data || typeof data !== 'object') return null;
    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) {
      var rec = data[keys[i]];
      if (rec && String(rec.appId || '') === String(appId)) {
        return Object.assign({ _key: keys[i] }, rec);
      }
    }
    return null;
  });
}

/* Human-friendly app ID: APP-XXXXXXXX / TCH-XXXXXXXX (no look-alike chars) */
function makeAppId(prefix) {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var out = '';
  for (var i = 0; i < 8; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return (prefix || 'APP-') + out;
}

/* Resize an image File to a JPEG data-URL no larger than maxKB */
function rtResizeImage(file, maxKB) {
  maxKB = maxKB || 180;
  return new Promise(function (resolve, reject) {
    if (!file || !file.type || file.type.indexOf('image/') !== 0) {
      reject(new Error('Not an image file'));
      return;
    }
    var reader = new FileReader();
    reader.onerror = function () { reject(new Error('Could not read file')); };
    reader.onload = function () {
      var img = new Image();
      img.onerror = function () { reject(new Error('Could not load image')); };
      img.onload = function () {
        var MAXDIM = 640;
        var scale = Math.min(1, MAXDIM / Math.max(img.width, img.height));
        var w = Math.max(1, Math.round(img.width * scale));
        var h = Math.max(1, Math.round(img.height * scale));
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        var q = 0.82;
        function toBlobURL() {
          return new Promise(function (res) {
            if (canvas.toBlob) {
              canvas.toBlob(function (b) { res(b); }, 'image/jpeg', q);
            } else { res(null); }
          });
        }
        function tryCompress() {
          toBlobURL().then(function (blob) {
            if (blob && blob.size <= maxKB * 1024) {
              var fr2 = new FileReader();
              fr2.onload = function () { resolve(fr2.result); };
              fr2.readAsDataURL(blob);
              return;
            }
            if (!blob || q > 0.35) {           // data-URL fallback / keep lowering quality
              if (q > 0.35) { q -= 0.15; tryCompress(); }
              else {
                var url = canvas.toDataURL('image/jpeg', 0.3);
                if (url.length > maxKB * 1024 * 1.34) reject(new Error('Photo too large'));
                else resolve(url);
              }
              return;
            }
            q -= 0.15; tryCompress();
          });
        }
        tryCompress();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* Local fallback mirror (same key the management app reads) */
function rtSaveLocalFallback(payload) {
  try {
    var list = JSON.parse(localStorage.getItem('sms_admissions') || '[]');
    list.push(payload);
    localStorage.setItem('sms_admissions', JSON.stringify(list));
    return true;
  } catch (e) { return false; }
}

/* ── Shared status rendering (used by apply-student / apply-teacher / track) ── */
function rtEsc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
var RT_STATUS_META = {
  pending:    { label: 'পর্যালোচনাধীন · Under review', cls: 'tag-pending' },
  approved:   { label: 'অনুমোদিত · Approved', cls: 'tag-approved' },
  declined:   { label: 'প্রত্যাখ্যাত · Declined', cls: 'tag-declined' },
  waitlisted: { label: 'অপেক্ষমাণ · Waitlisted', cls: 'tag-waitlisted' }
};
function rtStatusMeta(status) {
  return RT_STATUS_META[String(status || 'pending').toLowerCase()] || RT_STATUS_META.pending;
}

/* Renders a status card for one application record.
   kind: 'student' | 'teacher'  ·  language-aware (bn/en) */
function rtStatusPanel(rec, kind) {
  if (!rec) return '';
  var T = function (s) { return window.siteT ? window.siteT(s) : s; };
  var isEn = !!(window.siteLang && window.siteLang() === 'en');
  var status = String(rec.status || 'pending').toLowerCase();
  var meta = rtStatusMeta(status);
  var rows = [];
  function row(k, v) {
    if (v === undefined || v === null || String(v).trim() === '') return;
    rows.push('<div class="row"><span class="k">' + rtEsc(k) + '</span><span class="v">' + rtEsc(v) + '</span></div>');
  }
  row(T('আবেদন আইডি · ID'), rec.appId);
  row(T('নাম · Name'), rec.nameEn || rec.nameBn);
  if (kind === 'teacher') {
    row(T('যোগ্যতা · Qualification'), rec.degree);
    row(T('বিষয় · Subjects'), Array.isArray(rec.subjects) ? rec.subjects.join(', ') : rec.subjects);
    row(T('অভিজ্ঞতা · Experience'), rec.experienceYears ? rec.experienceYears + ' ' + T('বছর · years') : '');
  } else {
    row(T('শ্রেণি · Class'), rec.admClass || rec.cls);
    row(T('শিক্ষাবর্ষ · Session'), rec.ses || rec.session);
    row(T('মাধ্যম · Medium'), rec.med);
  }
  row(T('জমা দেওয়ার সময় · Submitted'), rtFormatDate(rec.submittedAt));
  if (status === 'approved') {
    row(T('শিক্ষার্থী আইডি · Student ID'), rec.assignedStudentId);
    row(T('USI / ফর্ম নং'), rec.assignedFormNo);
    row(T('রোল · Roll'), rec.assignedRoll);
    row(T('অনুমোদনের সময় · Approved'), rtFormatDate(rec.approvedAt || rec.actionAt));
  }
  if (status === 'declined') {
    row(T('কারণ · Reason'), rec.declineReason);
    row(T('প্রত্যাখ্যানের সময় · Declined'), rtFormatDate(rec.declinedAt || rec.actionAt));
  }
  if (status === 'waitlisted') row(T('তালিকাভুক্ত · Waitlisted'), rtFormatDate(rec.waitlistedAt || rec.actionAt));

  var NOTE = {
    approved: ['🎉 অভিনন্দন! আপনার আবেদন অনুমোদিত হয়েছে।', '🎉 Congratulations! Your application has been approved.'],
    declined: ['দুঃখিত, আপনার আবেদনটি প্রত্যাখ্যান করা হয়েছে।', 'We regret to inform you that your application was declined.'],
    waitlisted: ['⏳ আপনার আবেদন অপেক্ষমাণ তালিকায় রয়েছে। শীঘ্রই জানানো হবে।', '⏳ Your application is on the waitlist. You will be notified soon.'],
    pending: ['⏳ আপনার আবেদন পর্যালোচনাধীন। অনুগ্রহ করে কমপক্ষে <strong>৫ কার্যদিবস</strong> অপেক্ষা করুন।', '⏳ Under review. Please allow at least <strong>5 business days</strong>.']
  };
  var pair = NOTE[status] || NOTE.pending;
  var note = pair[isEn ? 1 : 0];
  if (status === 'pending' && rec.viewedAt) {
    note += '<div style="margin-top:8px;color:var(--accent-d);font-size:11.5px">' +
      (isEn
        ? '👀 An admin has reviewed your application — the result may come soon.'
        : '👀 একজন প্রশাসক আপনার আবেদন দেখেছেন — ফলাফল শীঘ্রই পেতে পারেন।') + '</div>';
  }
  var cls = status === 'approved' ? 'panel-ok' : (status === 'declined' ? 'panel-err' : (status === 'waitlisted' ? 'panel-warn' : ''));
  return '<div class="panel ' + cls + '">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">' +
        '<div class="panel-title" style="margin:0">' + rtEsc(rec.nameEn || rec.nameBn || T('আবেদন · Application')) + '</div>' +
        '<span class="tag ' + meta.cls + '">' + rtEsc(T(meta.label)) + '</span>' +
      '</div>' +
      '<div class="result-rows">' + rows.join('') + '</div>' +
      '<p style="margin-top:12px">' + note + '</p>' +
    '</div>';
}

/* Bilingual date display */
function rtFormatDate(value) {
  if (!value) return '—';
  var d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}
