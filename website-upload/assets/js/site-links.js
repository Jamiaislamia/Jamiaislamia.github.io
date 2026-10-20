/* ═══════════════════════════════════════════════════════════════
   EXTERNAL LINKS  ←  edit this file only

   The website's Apply buttons point at the institute's GitHub-hosted
   application forms. Leave a value empty and the button falls back to
   the built-in page in this website (apply-student.html /
   apply-teacher.html), so a link is never broken.

   Social platforms: paste a URL to switch that icon on. Icons without a
   URL render muted (set showUnlinkedIcons:false to hide them instead).
   ═══════════════════════════════════════════════════════════════ */
window.SITE_LINKS = {
  /* Apply hub (GitHub Pages) — the page with the three doors: student form,
     teacher form, and the status checker for both. The header's Apply button
     opens this. While empty it falls back to studentForm below. */
  applyPortal: 'https://jamiaislamia.github.io/apply-portal/',

  /* Student admission form (GitHub Pages) */
  studentForm: 'https://jamiaislamia.github.io/admission-form/',

  /* Teacher application form (GitHub Pages) */
  teacherForm: 'https://jamiaislamia.github.io/teacher-form/',

  /* Campus location — every "Find us here" link uses this one URL */
  mapUrl: 'https://maps.app.goo.gl/WCHuTP543BiybpHY9',

  /* Social platforms (footer icons) */
  social: {
    facebook: 'https://www.facebook.com/share/1F2TQ94nvF/?mibextid=wwXIfr',
    youtube: '',
    whatsapp: '',
    instagram: '',
    x: ''
  },

  /* show the platforms that have no URL yet as muted, non-clickable icons */
  showUnlinkedIcons: true
};
