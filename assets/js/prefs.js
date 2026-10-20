/* ═══════════════════════════════════════════════════════════════
   PREFS — applied before first paint (loaded in <head>, no defer)

   The site has ONE theme and ONE language mode, so there is nothing to
   restore and nothing to toggle:
     • theme  — "Madrasah Dusk" (teal + gold on blue-black) is fixed; it is
                high-contrast in daylight and glare-free at night, so no
                day/night switch is needed.
     • lang   — bilingual by default: every label renders Bangla · English
                (see assets/js/i18n.js → applyBilingual()). No EN/বাং switch.
   The attributes are still written so the CSS and the scripts have one
   authoritative state to read.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var root = document.documentElement;
  root.setAttribute('data-theme', 'dusk');
  root.setAttribute('data-lang', 'bi');
  root.setAttribute('lang', 'bn');

  /* Older builds stored sms_site_theme / sms_site_lang; clear them so a
     returning visitor never boots into a half-applied old preference. */
  try {
    localStorage.removeItem('sms_site_theme');
    localStorage.removeItem('sms_site_lang');
  } catch (e) {}
})();
