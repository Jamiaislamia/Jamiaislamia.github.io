# 🕌 জামিয়া ইসলামিয়া মাদরাসা · Jamia Islamia Madrasah

**The official website of the institute** — bilingual (Bangla-first), minimal and dark.
It presents the madrasah to the world (heritage, curriculum, campus, culture) **and**
handles the two online application paths, which flow straight into the school's
management system as admission cards.

> Plan / design source of truth: [`PLAN.md`](./PLAN.md)

## Institute facts (as published on the site)

| | |
|---|---|
| **Name** | জামিয়া ইসলামিয়া মাদরাসা · Jamia Islamia Madrasah |
| **Slogan** | গুণমান ও নৈতিকতার অঙ্গীকার · **Promises to Quality and Morality** |
| **Established** | 2003 (২০০৩) |
| **Location** | Brahmanpara, Cumilla, Bangladesh (ব্রাহ্মণপাড়া, কুমিল্লা) |
| **Divisions** | ১) মূল ক্যাম্পাস ও প্রতিষ্ঠান · ২) হিফজুল কুরআন বিভাগ — নূরানী → নাযেরা → হিফজ |
| **Curriculum** | Follows **NCTB** (National Curriculum and Textbook Board) and **Madrasah Education Board, Dhaka** |
| **Email** | info.jamiaislamia.edu.bd@gmail.com |
| **Map** | [Google Maps listing](https://maps.app.goo.gl/WCHuTP543BiybpHY9) — a single **“আমাদের অবস্থান · Find us here”** button in `#campus` (and in `#contact`) opens the location in Google Maps. No embedded map, no third-party iframe. |

### Header call-to-action

The two application buttons no longer sit in the hero, and the old dropdown is gone. The header
carries **one** compact button, bottom-right of the bar: **“আবেদন · Apply →”**, 34px tall (the same
height as the logo and the nav rows, so the bar never grows a second baseline), on a teal tint with
a teal hairline at rest and a solid teal fill on hover / keyboard focus. It opens
`SITE_LINKS.applyPortal` — the **Firebase-hosted application portal** (student form, teacher form and
the status checker, one page) — in a new tab; while that key is empty it falls back to
`SITE_LINKS.studentForm`, so the button is never dead. On phones the English suffix is dropped and
the button tightens to 32px.

## Motion & interaction

- **Madrasah Dusk**: one fixed theme for day and night — teal accent (`#46C2AC`) and a gold
  heritage layer (`#D8B45E`) on blue-black surfaces (`#090D12` page, `#0F151C` cards), with a faint
  eight-point girih lattice in the hero and footer. Body copy uses **Inter** (Bangla via Hind
  Siliguri), headings **Inter Tight**, micro-labels DM Mono — the English glosses inherit the same
  face, never a different font. No pure-white or pure-black surfaces — that is what keeps the glare
  down in both daylight and darkness.
- **Nav highlight follows the section you are in** (scroll-spy): the header link for the section
  currently on screen is highlighted, and *হোম* is highlighted only at the top of the page.
  Nav links are 14px (13px ≤1280px) in a brighter ink than the muted text, for legibility.
- **Explore photos share the site's 3-up grid**: three tiles per row (two ≤760px) with a uniform
  4:3 crop, so albums look like an even contact sheet. An album with only one or two photos uses a
  2-up row, so its row is filled rather than half-empty. Click any tile for the lightbox.
- **Cards lift on hover** (blueprint hover law): the card rises 5px, its hairline turns indigo, the
  signature 3px accent bar grows from its 40px stub to the full card width and an 8 % accent bloom
  fades in — all on the card easing. List rows and the culture cells only tint their background.
- **Sections reveal on scroll**: each block fades + rises 620ms `cubic-bezier(.16,1,.3,1)` with a
  per-section stagger (70ms × index, capped at 6), and each section's title rule draws in
  (`scaleX 0 → 1`, 800ms).
- `prefers-reduced-motion` disables all of it.

---

## Boot: content loading vs preloading

`assets/js/loader.js` + the `#siteLoader` block at the top of every page decide what to
spend on the visitor's connection (it reads `navigator.connection`):

| Connection | What happens |
|---|---|
| **Slow** — `saveData`, or `effectiveType` `slow-2g` / `2g` / `3g` | The **wifi-loader** overlay (three animated rings, token-coloured — teal on the hairline grey) paints immediately with **“কনটেন্ট লোড হচ্ছে…”**, stays until the document has actually loaded, and comes back with **“পৃষ্ঠা লোড হচ্ছে…”** when a link is clicked. Nothing is prefetched — the bandwidth is the visitor's. |
| **Fast** — anything else | The overlay **never paints**; instead the four other pages (`teachers`, `explore`, the two forms) and the four data files (`history`, `different`, `teachers`, `photos`) are added as `link[rel=prefetch]` once the browser is idle, so the next click is instant. |

Safety rails: a 15 s cap always removes the overlay, a minimum 420 ms display stops it
flashing, `aria-hidden` is toggled with it, `prefers-reduced-motion` freezes the rings, and
with JavaScript off a `<noscript>` rule hides it entirely. State is exposed for tests and
debugging as `<html data-conn="slow|fast" data-loading="on|off">` and `window.__siteLoader`.

---

## Pages

| File | Purpose |
|---|---|
| `index.html` | **Institute home** — logo & hero, heritage/history (established 2003), **yearly history timeline (`#history`, one column: filter chips + year row, 4 newest + “Show all”)**, mission & values, **streams** (`#streams`: four equal cards — General and Hifzul Qur’an live, Science and Commerce soon), **campus mosaic** (`#campus`: first photo is the 2×2 feature), culture (`.aspects` spec sheet), contact ledger |
| `teachers.html` | **Our Teachers** — the **সুপার** (head teacher) in a dedicated card, then every teacher with photo, subjects and qualification (`teachers.json`) |
| `explore.html` | **Explore** — photo collections, one section per album, click any photo for a full-screen lightbox (← → / Esc) |
| `apply-student.html` · `apply-teacher.html` | **Built-in fallback forms** (nothing links to them while the hosted form is configured) — each posts to Firebase (`/admissions`, `/teacher-applications`) and carries the inline status tracker |

## 🔗 Apply flow — one portal, three doors

The application entry point is a **separate page on Firebase Hosting** (`apply-portal/` in this project,
published by `_build_firebase_release.js` → `firebase deploy --only hosting`). The header's Apply button opens it:

| Where | Button | Target |
|---|---|---|
| Header (every page) | **আবেদন · Apply →** | `site-links.js` → `applyPortal` |
| Home · `#streams` (General and Hifzul Qur’an cards) | **ভর্তি · Apply** | `studentForm` directly (stream-specific) |
| `#contact` APPLY column · footer sitemap | শিক্ষার্থী আবেদন | `studentForm` |
| `#contact` APPLY column · footer sitemap | শিক্ষক আবেদন | `teacherForm` |
| `#contact` APPLY column · footer sitemap | অবস্থা যাচাই | `applyPortal` → `#track` (the portal's checker) |

The portal is where the three doors live — student form, teacher form, and a status checker that
accepts both `APP-…` and `TCH-…` — so no application form is implemented inside this website.

```js
window.SITE_LINKS = {
  applyPortal: 'https://jamiaislamia.web.app/apply-portal/', /* header Apply button + Track links */
  studentForm: 'https://jamiaislamia.web.app/admission-form/',
  teacherForm: 'https://jamiaislamia.web.app/teacher-form/',
  mapUrl: 'https://maps.app.goo.gl/WCHuTP543BiybpHY9' /* every "Find us here" link */
};
```

External links open in a **new tab**. The built-in `apply-student.html` / `apply-teacher.html`
remain in the folder as an offline/no-JS fallback but are linked from nowhere: the student and
teacher rows keep them as their `href`, and `data-apply-link` rewrites it at load — so a browser
without JS still reaches a working form.

> While `applyPortal` is empty the header falls back to `studentForm`, and while `teacherForm` is
> empty the teacher rows fall back to `apply-teacher.html` — the CTA can never 404.

### Tracking (both kinds of application)

| Where | What |
|---|---|
| Built-in form pages (`apply-student.html`, `apply-teacher.html`) | the inline tracker sits under the form — type `APP-…` or `TCH-…` |

`APP-XXXXXXXX` is looked up in `/admissions`, `TCH-XXXXXXXX` in `/teacher-applications`; if the
prefix does not match, the other node is checked as a fallback. All lookups are **GET only**.

## 🧱 Footer

A **compact, three-band footer** injected on every page by
`assets/js/site.js → buildFooter()`:

| Band | Content |
|---|---|
| top | **brand** (logo + name + English motto) on the left · the **social icons** on the right |
| middle | a **sitemap** — প্রতিষ্ঠান · Institute / ভর্তি · Admission / আরও · More |
| base | the **© line** with the year and “প্রতিষ্ঠিত ২০০৩” |

It deliberately **does not repeat the contact facts** (email, address, map). Those live in
`#contact` only — that keeps the footer and the contact section from saying the same thing twice.

### Social icons

`assets/js/social-icons.js` holds the icon set — official brand paths from **Simple Icons** (CC0),
inlined so the page makes **no external requests**. Paste a URL into
`assets/js/site-links.js → social` and that icon becomes a live link; platforms without a URL render
muted (set `showUnlinkedIcons: false` to hide them instead):

```js
social: {
  facebook: 'https://www.facebook.com/share/1F2TQ94nvF/?mibextid=wwXIfr',
  youtube: '', whatsapp: '', instagram: '', x: ''
}
```

The Maps URL comes from the same file (`mapUrl`), so the “আমাদের অবস্থান · Map” links (campus
section and contact ledger) change in one place.

## 📷 Photos — drop files in, they show up

All photos live in **`website/Photos/`**, one sub-folder per album:

```
website/Photos/
├── Campus/        main building, gate, grounds
├── Students/      students, classes, study time
├── Classrooms/    teaching, blackboards, hifz room
├── Mosque/        prayer hall, jamaat, tilawat
├── Events/        programmes, competitions, ceremonies
└── Programmes/    hifz / nurani / nazera activities
```

**To add photos**

1. Copy your image files into the right album folder (`.jpg` `.jpeg` `.png` `.webp` `.gif` `.avif`).
   Recommended: **1000–1400px wide, under 300 KB** each.
2. Run the builder from the project root:

   ```powershell
   node _build_photos.js
   ```

   It scans the folders, reads each image's real dimensions and writes `website/photos.json`.
3. Refresh the site — the new photos appear on **Explore** (`explore.html`) and in the
   home page campus strip.

**Filenames become captions:** `main-gate-2019.jpg` → “Main Gate 2019”.
Empty albums are skipped automatically, and albums with no photos yet show a friendly
“no photos yet” note with these instructions.

**On GitHub Pages you don't even need step 2** — if `photos.json` is missing or stale, the
Explore page reads the folder listing straight from the GitHub contents API (no key, no build).
That means: upload photos to `Photos/<Album>/` → push → they appear.

### Current photos

Six photos are already wired in (the campus shot is the institute's own; the rest came from its
Google Maps photo links — optimised for the web, up to 1600px JPEGs, ~990 KB total, lazy-loaded): `Campus/campus.jpg`,
`Students/students-1.jpg`, `Students/students-2.jpg`, `Mosque/mosque.jpg`,
`Events/event-1.jpg`, `Events/event-2.jpg`.

**Note:** these came from the school's Google Maps photos — if you have the original camera
files, dropping them over the same filenames keeps maximum quality.

## 🕰 Institute history — the yearly timeline (“chain”)

The **“আমাদের পথচলা”** milestones in `index.html` → `#history` are driven by
**`website/history.json`**: one object per milestone, sorted automatically (newest first) and laid out
as **one column** — filter chips and a year jump row in a toolbar above the numbered rail, then the
milestone as a **distinct card**. There are no side rails. Filtering and the year row are client-side;
the page still only ever reads the file. Each entry carries `titleEn` / `tagEn` and a `descEn` that is
**one short result-first English line**, never a translated paragraph.

The home page stays short: it shows the **4 newest milestones** with a compact **আরও দেখুন ·
Show more ▼** button that reveals the rest and flips to **কম দেখুন · Show less ▲** (`aria-expanded`
follows the state). Change the number in `assets/js/history.js` → `var CHAIN_LIMIT = 4;`.

The gold node numbers run **with the calendar, not with the slice**: the newest milestone carries the
highest number (৭ today) and the rail counts **down** to ১ at the founding year, so expanding or
filtering never renumbers a step — a filtered view keeps honest gaps (e.g. ৬ · ৫).

```json
{
  "year": "2011",
  "title": "হিফজ বিভাগের সূচনা",
  "desc": "নূরানী ও নাযেরা স্তর চালু করে হিফজ বিভাগের যাত্রা শুরু।",
  "tag": "নতুন বিভাগ"
}
```

| Field | Required | Notes |
|---|---|---|
| `year` | yes | a 4-digit year renders in Bengali numerals and becomes a proper `<time datetime="…">` |
| `title` | yes | short heading (Bangla and/or English) |
| `desc` | no | one or two sentences of detail |
| `tag` | no | small chip, e.g. `সূচনা` / `নতুন অর্জন` |

Set `"sort": "oldest-first"` if you want the chain to start at the founding year instead of the
newest milestone. An empty list shows a short “no milestones yet” note.

### Who can update it

| Who | Access |
|---|---|
| **The authority** | Edit `website/history.json` in the repository (or a published Google Sheet, below) and push. **Only people with that access can change the timeline.** |
| **Website visitors** | **Read-only.** The page only ever issues **GET** requests, the site exposes **no write endpoint**, there is **no editing UI** anywhere, and every value is **HTML-escaped** before rendering — so even a bad edit cannot inject markup or scripts. |

### What is in the timeline today

| Year | Tag | Milestone |
|---|---|---|
| ২০২৬ | বর্তমান ধারা | দুই বিভাগে পরিচালিত পাঠদান (মূল ক্যাম্পাস + হিফজুল কুরআন) |
| ২০২৪ | সাফল্য | দাখিল পরীক্ষায় ২১ জনে ১০টি A+ সহ শতভাগ পাশ |
| ২০২৩ | ঈর্ষণীয় সাফল্য | মেধা মূল্যায়ন-২০২৩: ২৩টি ট্যালেন্টপুলসহ মোট ৩৪টি বৃত্তি, জেলা পর্যায়ে প্রথম স্থান |
| ২০২১ | ঈর্ষণীয় সাফল্য | দাখিল পরীক্ষায় ১৪ জনে ৯টি A+ সহ শতভাগ পাশ |
| ২০১৮ | বিশেষ সাফল্য | ৫ম শ্রেণি সমাপনী: ৪টি A+, ৫টি টেলেন্টপুল + ১টি সাধারণ গ্রেড বৃত্তি, উপজেলায় তৃতীয় |
| ২০১৭ | বিশেষ সাফল্য | এবতেদায়ীতে ১টি A+ সহ ৫টি বৃত্তি; জেডিসিতে ৩টি A+ সহ শতভাগ পাশ |
| ২০০৩ | সূচনা | প্রতিষ্ঠা — ব্রাহ্মণপাড়া, কুমিল্লা |

**Next year:** add one more object to `entries` (e.g. the ২০২৫/২০২৬ board results) — the chain re-sorts
itself automatically.

### Optional: update it from a spreadsheet (no git needed)

1. Create a Google Sheet whose first row is `year,title,desc,tag`, one row per milestone.
2. **File → Share → Publish to web →** choose **CSV** → copy the link.
3. Paste it into `"sheetCsvUrl"` in `history.json` and push once.

After that the office can simply add a row each year — the site reads it live and falls back to the
local `entries` list if the sheet is ever unreachable.

## 👤 Our teachers — the faculty page

`teachers.html` (nav: **শিক্ষক · Teachers**) is driven by **`website/teachers.json`**. The page has a
clear hierarchy: the **Principal** (`super`) is one **featured card** — a two-column split with a large
4:5 portrait on the left and the identity block (role, name, subject chips, qualification, bio) on the
right, carrying a subtle accent border and the 8 % accent glow — while every entry in `teachers[]` is a
**vertical profile card** (photo container on top, then the identity block) with the blueprint's
sub-card hover (lift 1px + accent hairline). Subject chips use the 10px chip radius; a missing photo
falls back to a dashed placeholder tile.

```json
{
  "super":   { … },
  "teachers": [ { … } ]
}
```

| Field | Meaning |
|---|---|
| `name` / `nameEn` | Bangla name + English name |
| `role` / `roleEn` | e.g. `"সুপার · Head teacher"` · `"শিক্ষক · Teacher"` |
| `photo` | photo path, e.g. `"Photos/Teachers/Super.jpg"` (empty → dashed placeholder tile) |
| `qualification` / `qualificationEn` | e.g. `"দাওরায়ে হাদিস (তাকমিল)"` |
| `fields` / `fieldsEn` | the subjects they teach — an array, rendered as chips |
| `bio` / `bioEn` | optional short paragraph (used on the Super card) |

- **The Super** (the head teacher, as the institute calls the post) is the `super` object and renders in
  its own section at the top of the page; `teachers[]` fills the grid below.
- **Photos** go in `website/Photos/Teachers/` — JPG, under 100 KB, square ~400×400 px is ideal. A taller
  portrait is cropped to the square tile from the **top**, so a face is never cut off. A profile with
  no `photo` (or a broken path) shows a dashed placeholder tile, so the grid never looks broken.
- Anything written as `[ … ]` is a **placeholder** — it renders in the muted mono style until you replace
  it, exactly like the Founder field on the home page.
- Editing the JSON is the only step: no rebuild, no code change. Edit it on GitHub and commit.

## Streams (fields of study)

`#streams` on the home page is the single place where the institute's fields of study are listed —
**four equal cards** (2 live, 2 upcoming), each with its own status chip, one-line note, subject
chips and a footer rule:

| Stream | Status | Card |
|---|---|---|
| **সাধারণ** · General | **চালু · ACTIVE** (teal) | main curriculum (Islamic + modern subjects) + apply button |
| **হিফজুল কুরআন** · Hifzul Qur’an | **চালু · ACTIVE** (teal) | নূরানী → নাযেরা → হিফজ as subject chips + apply button |
| **বিজ্ঞান** · Science | **শীঘ্রই · SOON** (amber) | Physics · Chemistry · Biology · Higher Maths · ICT |
| **ব্যবসায় শিক্ষা** · Commerce | **শীঘ্রই · SOON** (amber) | Accounting · Finance · Banking · Management |

All four are flex columns, so the footer rule sits at the same height in every card — no dead space
in the middle of a card. The older `#sections` “two divisions” block was folded into this section
(owner decision): the main campus & institute is the **General** stream, and the Hifzul Quran
division is its own card. Teachers can indicate interest in a field via the subject chips on
`apply-teacher.html` (incl. **হিফজুল কুরআন · Hifzul Quran**).

## Run locally

From the project root:

```powershell
node _serve.js
```

Then open **http://localhost:8080/website/**

The pages fetch `teachers.json` / `photos.json` / `history.json`, and browsers block
`fetch()` on `file://` URLs — so double-clicking `website/index.html` shows the page but
leaves the timeline, the faculty page and the albums empty. To hand the site to somebody
who has no server, build the single-file preview below.

## Send the whole site as one file (no server, no install)

```powershell
node _build_preview.js
```

writes **`website-preview.html`** in the project root — one self-contained file (~5 MB)
with all five pages, the stylesheet, every script and every photo inlined:

- **Double-click it.** It opens in any browser and works offline, straight on the home page —
  **there is no preview toolbar**. Pages switch through the site's own header and footer links
  (Home · Teachers · Explore · Apply, plus the back links), exactly as on the live site.
- **Sending it is one attachment** — no zip, no server, no install. (The Google font files
  are still fetched from the web; offline the site falls back to system fonts.)
- The two application forms are **simulated** in the preview: submitting shows the real success
  panel with a generated `APP-…` / `TCH-…` id, but nothing is written to the institute's records
  (the tracker therefore reports “not found”). To make the preview post for real, delete the `RTDB`
  branch in `SHIM` in `_build_preview.js` and rebuild.
- Re-run `node _build_preview.js` after editing any page, stylesheet, script, photo or JSON
  — it always rebuilds from the live site files.
- The bundle carries its own data, so it works with the network off. If a section ever shows
  “Could not load …” in the **preview**, the file is stale — rebuild it. (The **served** site shows
  those same panels when `node _serve.js` is not running — a different thing.)

### Sending it to a phone

The file itself is phone-ready — it opens full-screen on the home page and the pages use their
≤430px layout (the header brand shrinks to the logo so the Apply button fits). How you *open* it on
a phone is the part that differs:

- **Android** — tap the attachment → *Open with* → **Chrome** (or save it and open it from Files).
  It then runs offline, exactly like on a desktop.
- **iPhone / iPad** — iOS will not run a local `.html` file from Files or WhatsApp (it shows the
  source). The reliable route on iOS is a **link**: publish the `website/` folder (see *Deploy*
  below) and send that URL — the live site needs no server of its own and opens on every phone.
  The single file remains the best option for desktop and email.

## Deploy (Firebase Hosting)

The public site and the three forms are served by **Firebase Hosting** — source stays in this
(private) repository, the live files are staged and deployed:

```powershell
node _build_firebase_release.js
firebase deploy --only hosting --project sms-admission-4f632
```

Live at `https://jamiaislamia.web.app/`. The full runbook (layout, cache policy, rollback,
custom domain) is `DEPLOY.md`; the project-level summary is `../FIREBASE_HOSTING.md`.

All asset paths are **relative**, so nothing needs configuring per environment.

Nothing else to configure — the Firebase Realtime Database already allows the public
`admissions` writes this site uses (`database.rules.json`).

## How the wiring works

```
apply-student.html ──POST──▶ Firebase RTDB  /admissions
                                  │
                                  ├─▶ Student Management → Admission  (pending card, badge count)
                                  ├─▶ sms_sync_daemon.js (mirrors to CouchDB every 20s)
                                  └─▶ the inline tracker on the form page (reads the admin's decision)

apply-teacher.html ──POST──▶ Firebase RTDB  /teacher-applications ──▶ the inline tracker on the form page
```

**Field contract:** the student payload writes both the canonical card fields the
management app reads (`nameBn, nameEn, dob, admClass, prevClass, fatherBn/En/Phone,
motherBn/En/Phone, occupation, presentAddr, permAddr, photo, status, submittedAt`)
**and** the legacy short names (`cls, fnm, fph, paddr, ses, med, ph, em …`) so older
tools and the previous GitHub form keep working.

## 🎨 One theme · both languages

There are **no appearance buttons** in the header — on purpose.

| Decision | How it works |
|---|---|
| **One theme for day *and* night** | “Madrasah Dusk”: teal accent + gold heritage layer on blue-black (`--bg:#090D12`). High contrast in daylight (body ≈11:1, headings ≈15.5:1), glare-free at night, native controls follow via `color-scheme:dark`. Nothing is stored, nothing flashes. |
| **Bangla + English: one slot, one language** | English is the labelling/orientation layer — eyebrows, micro-labels, chips, buttons and **one short English line per section**; Bangla carries all prose. No line is said twice, so nothing reads like a machine translation. Header nav stays Bangla with the English name in `title`/`aria-label`; forms keep explicit bilingual labels. No EN/বাং switch. |

The header nav reads **হোম / HOME**, section titles read **আমাদের পথচলা / OUR JOURNEY**, and the
English paragraph sits under the Bangla one behind a gold hairline.

### Editing the English text

| What | Where |
|---|---|
| Any English wording | `assets/js/i18n.js` → `SITE_I18N.en`: `'বাংলা লেখা': 'English text'` |
| Find what is still untranslated | run `node _test_prefs.js` → the list is written to `_i18n_missing.txt` |
| Timeline English copy | `history.json` → `titleEn`, `descEn`, `tagEn` per entry (falls back to Bangla) |
| Faculty English copy | `teachers.json` → `nameEn`, `roleEn`, `qualificationEn`, `fieldsEn[]` |
| Album English titles | `photos.json` → optional `titleEn` per album (falls back to Bangla) |

Labels already written as `বাংলা · English` are left as they are — the merge never duplicates an
English half that is already on the page.

Labels written as `বাংলা · English` (the site's own convention) need **no** dictionary entry — the
English half is used automatically when English is selected. The English copy is hand-written for
the institute's real content; nothing is machine-translated.

## ⚠ Content to complete (placeholders in the site)

Nothing about the institute's real history, campus or contacts was invented — these
items are marked in the page and must be filled with verified information:

| Where | What to fill |
|---|---|
| `index.html` → `#about` fact strip | **প্রতিষ্ঠাতা / Founder** — still `[ নাম যোগ করুন ]`. (Established **২০০৩** and location **ব্রাহ্মণপাড়া, কুমিল্লা** are already filled in.) |
| `index.html` → `#about` narrative | Optionally add real milestones to the heritage text |
| `teachers.json` | **Every teacher** — name, role, photo, qualification and the subjects they teach. The file ships with the **সুপার + 3 teacher slots** as `[ … ]` placeholders |
| `index.html` → `#contact` | Add the full street/postal address and phone number (email **info.jamiaislamia.edu.bd@gmail.com** + upazila/district are set) |

## Validation

```powershell
node _test_website.js     # smoke test: pages, sections, CTA links, forms, tracker, Explore albums + lightbox
node _test_prefs.js       # one theme + bilingual merge: no toggles, both languages on every page, stepper, coverage
node _build_photos.js     # rebuild website/photos.json after changing the Photos/ folders
```

## Offline behaviour

If the POST fails (no internet), the application is stored in `localStorage`
(`sms_admissions`) and the success screen shows an amber warning plus a
**“আবার জমা দিন · Retry submit”** button.

## Customising

| What | Where |
|---|---|
| Institute name / tagline / hero text | `index.html` (hero section) + `assets/js/site.js` (header/footer brand) |
| Heritage / history text | `index.html` → `#about` narrative card |
| Mission & values cards | `index.html` → `#about` `grid-values` block |
| Streams (4 equal cards, status tags) | `index.html` → `#streams` `.stream-grid` |
| Teachers (Super + faculty) | `teachers.json` + photos in `Photos/Teachers/` — see “Our teachers” above |
| Culture aspects (6-item spec sheet in one card) | `index.html` → `#culture` `.aspects` |
| Campus mosaic (first photo is the 2×2 feature) | `index.html` → `#campus` `.gallery` |
| Class list / session list | `apply-student.html` → selects `#s-cls`, `#s-ses` |
| Colors / typography / radius | `assets/css/site.css` → the single `:root` token block (teal accent + gold heritage layer); heading face = `--font-head` (Inter Tight 600), shape tokens `--r-card/--r-btn/--r-input/--r-tag` — see `PLAN.md` §4 |
| Theme (fixed) / language law | `assets/js/prefs.js` (locks the theme at first paint) + authored English in the HTML (`PLAN.md` §5); `assets/js/i18n.js` only serves JS-rendered strings |
| Header (brand · Bangla nav with English `title` · Apply) | `assets/js/site.js` → `buildHeader()` |
| Footer contents | `assets/js/site.js` → `buildFooter()` (identity + social + sitemap + © line; contact facts stay in `#contact`) |
| Firebase URL | `assets/js/firebase-rt.js` → `RTDB_URL` |
| Logo | replace `assets/img/logo.png` (portrait 2:3 asset, 320×480, ~78 KB) |
| Navigation links | `assets/js/site.js` → `NAV` array |

## Validation

```powershell
node _test_website.js     # smoke test: pages, institute sections, CTA links, submit wiring, tracker
```

The website is fully static — no build step, no dependencies.
