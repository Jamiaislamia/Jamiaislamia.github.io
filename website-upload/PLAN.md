# 🕌 JAMIA ISLAMIA MADRASAH — OFFICIAL WEBSITE PLAN
**Standalone plan for the `website/` folder · Independent of the management app's plan docs**

> Single source of truth for the public website.
> The website is a **separate, fully static** product that lives *beside* the
> management application and talks to the same free Firebase backend.
>
> **v4 (this revision)** — one fixed theme for day *and* night, a language law of
> **one slot = one language** (English labels + one orientation line per section,
> Bangla prose), four equal stream cards, a single-column heritage stepper and a
> footer that no longer repeats the contact section.
> There are **no theme or language buttons** anywhere on the site.

---

## 1. Project overview
- **What**: The official public website of **Jamia Islamia Madrasah (জামিয়া ইসলামিয়া মাদরাসা)** —
  an Islamic educational institute in Bangladesh. It represents the institute (heritage &
  history, curriculum, campus, culture) and hosts its two online application paths.
- **Why**: Give parents/teachers a calm, dignified, bilingual place to know the institute and
  apply online; applications flow straight into the school's management system (admission
  cards) with **zero manual entry**.
- **Where**: `website/` folder — deployable anywhere static (GitHub Pages ready).

## 2. Goals
1. **Look like an actual Islamic school** — emerald/teal + gold, a girih lattice, serif-free
   but respectful typography, generous whitespace. Not a generic tech landing page.
2. **One theme that works in daylight and at night** — no day/night switch to explain.
3. **Both languages, always** — Bangla first (the community reads it), English immediately
   beside/beneath it (visitors, donors, search engines). No EN/বাং switch.
4. Two application paths: **Apply as Student** and **Apply as Teacher**.
5. 100% digital pipeline: form → Firebase Realtime Database → management app.
6. Applicants can **track** their application status by ID, anytime.
7. Zero cost: static hosting (GitHub Pages) + Firebase free tier. No build step, no framework.

---

## 3. Pages

| Page | Purpose |
|---|---|
| `index.html` | Home — logo & hero, heritage/history (`#about`, est. 2003, Brahmanpara/Cumilla), **heritage stepper** (`#history` — filter chips · year row · numbered rail, 4 newest + “Show all”), mission & values, **streams** (`#streams` — four equal cards: General + Hifzul Qur’an live, Science + Commerce soon), campus mosaic (`#campus`), culture sheet, contact ledger + footer sitemap |
| `teachers.html` | **Our Teachers** — the **সুপার** (head teacher) in a featured card, then a grid of every teacher: photo, name (bn + en), role, subjects, qualification |
| `explore.html` | Photo collections — one section per album from `Photos/<Album>/`, keyboard-navigable lightbox |
| `apply-student.html` | Student admission form (photo upload, validation, success screen with App ID, inline status checker) |
| `apply-teacher.html` | Teacher application form (qualifications, subjects to teach, experience, photo) |

---

## 4. Design direction — **“Madrasah Dusk”**

### 4.1 Why one theme for day *and* night
A single **deep blue-black** theme is the only family that behaves in both conditions:

- At **night** it is glare-free: the page background sits at `#090D12` (not pure black, so the
  card surfaces above it stay distinguishable instead of dissolving).
- In **daylight** the ink clears far more than WCAG AA — body copy is **≈11:1**, headings
  **≈15.5:1**, the teal accent **≈7.4:1** — so it stays readable on a phone in the sun
  without a white blast of light.
- `color-scheme: dark` makes native controls (date pickers, selects, scrollbars) match.
- One palette = one design to maintain, one set of contrast tests, no “wrong theme flash”.

**Nothing is stored or toggled.** `prefs.js` writes `data-theme="dusk"`, `data-lang="bi"` and
`lang="bn"` before first paint and clears the old `sms_site_theme` / `sms_site_lang` keys.

### 4.2 Neutral grading — blue-black, green-free so the teal reads as *the* accent

| Token | Hex | Role | Contrast on `--surface` |
|---|---|---|---|
| `--bg` | `#090D12` | page | — |
| `--surface` | `#0F151C` | cards, header, footer | — |
| `--surface2` | `#151E28` | subtle fills, hover, chips | — |
| `--field` | `#0B1118` | inputs (a step darker than the card) | — |
| `--border` | `#1D2835` | 1px hairlines | — |
| `--border2` | `#2A3A4C` | emphasized borders (inputs, buttons) | — |
| `--glass` | `rgba(9,13,18,.82)` | sticky header over content | — |
| `--text` | `#EAF1F6` | headings, primary ink | **≈15.5:1** |
| `--body` | `#BFCEDD` | long-form copy | **≈11:1** |
| `--nav` | `#C3D4E2` | nav link ink | ≈12:1 |
| `--muted` | `#8CA1B3` | captions, glosses, labels | **≈6.5:1** |
| `--muted2` | `#5B7080` | micro-labels only (uppercase, tracked) | ≈3.6:1 — never for prose |

### 4.3 Teal grading — the accent (one accent per screen)

| Step | Hex | Use |
|---|---|---|
| 50 | `#E6F7F4` | (reserved: light artifacts, never on this theme) |
| 100 | `#C2EBE4` | tint for inverted chips |
| 200 | `#93DBCF` | hover on filled controls |
| 300 | `#6FDCC8` | **`--accent-d`** — hover ink, links on dark |
| 400 | `#46C2AC` | **`--accent`** — buttons, active states, focus ring |
| 500 | `#2E9784` | pressed state |
| 600 | `#227A6B` | borders over tint |
| 700 | `#1A5F55` | deep accents |
| 800 | `#12453E` | tinted surfaces (not used unmodified) |
| 900 | `#0B2E2A` | deepest tint |

Tints: `--accent-t` `rgba(70,194,172,.12)` · `--accent-edge` `rgba(70,194,172,.32)` ·
`--accent-ring` `rgba(70,194,172,.24)` · `--accent-glow` `rgba(70,194,172,.32)` ·
`--accent-ink` `#052A24` (text **on** a filled teal control — ≈6.6:1).

### 4.4 Gold grading — the heritage layer

| Step | Hex | Use |
|---|---|---|
| 50 | `#FBF5E3` | (reserved) |
| 100 | `#F4E7C3` | (reserved) |
| 200 | `#EAD69C` | bright ornament on hover |
| 300 | `#EDCF8F` (`--gold-bright`) | TOC hover, ornament highlights |
| 400 | `#D8B45E` (`--gold`) | **the heritage accent** — eyebrows, ◆ rules, stepper nodes/rail, year frame |
| 500 | `#C49A3F` | pressed |
| 600 | `#A9873D` (`--gold-deep`) | small gold text (labels, `fact-k`, subj-en) |
| 700 | `#7A5E24` | borders |
| 800 | `#54411A` | tinted surfaces |
| 900 | `#33270F` | deepest tint |

Tints: `--gold-t` `rgba(216,180,94,.10)` · `--gold-edge` `rgba(216,180,94,.30)`.
Gold never carries prose: it is for **eyebrows, rules, ornaments, the stepper, and the
“current” node**. Teal stays the interactive accent.

### 4.5 Semantic status (only on status tags, form messages, danger/success)
| Token | Hex | Tint background |
|---|---|---|
| `--teal` (success / active) | `#4FD6A5` | `rgba(79,214,165,.10)` |
| `--amber` (pending / soon) | `#F2BE5C` | `rgba(242,190,92,.10)` |
| `--crimson` (danger / declined) | `#F0645C` | `rgba(240,100,92,.10)` |

### 4.6 Islamic identity (no new image assets)
- **Basmala masthead** — the hero opens with one gold line,
  `بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ`, set in **Amiri** (Naskh book face) at 25px with two
  hairlines that fade outward into the lattice. One line, no artwork: it reads as a seal above the
  identity, not a second headline, and it is `aria-hidden` because the logo alt and the `<h1>`
  already state the same identity.
- **Girih lattice** — an eight-point star drawn as an inline SVG data-URI (`--girih`: two
  squares rotated 45° over each other at 13 % gold), masked to fade out down the hero and the
  footer. Pure CSS, zero requests.
- **Gold rule with a diamond** — every section title’s trailing rule starts with a 6px gold
  ◆ (`--gold`), the classic manuscript divider.
- **Logo tile** — the logo always sits on a `--surface2` tile with a **gold hairline**
  (header, hero, footer).
- **Eyebrows** (the small label above each section title) are gold-on-gold-tint chips.

### 4.7 Typography — unchanged on owner request
| Role | Family |
|---|---|
| Headings | `Inter Tight` → `Hind Siliguri` for Bangla, **600**, `-.01em` |
| Body | `Inter` → `Hind Siliguri` |
| Mono / labels / chips / English gloss on headings | `DM Mono` |

Micro-label tracking stays fixed: `.18em` eyebrow · `.14em` badge · `.12em` button · `.08–.1em` tab.

### 4.8 Shape, elevation, motion
- Radius: cards `6px` · buttons/inputs `4px` · chips `3px`. No pill/rounded-xl shapes.
- **Borders over shadows**: 1px hairline by default; shadows only for hover-lift, modals, toasts.
- Cards keep the signature **40px → full-width accent bar** on hover; heritage cards run it in
  **gold**, every other module in **teal**.
- Motion: entrances 300–380ms `cubic-bezier(.22,1,.36,1)` with 70ms stagger; micro 150–200ms;
  `prefers-reduced-motion` honoured.

### 4.9 Contrast audit (measured pairings)
| Foreground | Background | Ratio | Verdict |
|---|---|---|---|
| `--text` #EAF1F6 | `--surface` #0F151C | ≈15.5:1 | AAA |
| `--body` #BFCEDD | `--surface` #0F151C | ≈11:1 | AAA |
| `--muted` #8CA1B3 | `--surface` #0F151C | ≈6.5:1 | AA (all sizes) |
| `--muted2` #5B7080 | `--surface` #0F151C | ≈3.6:1 | micro-labels only, uppercase |
| `--accent` #46C2AC | `--bg` #090D12 | ≈7.4:1 | AAA for large, AA+ for small |
| `--gold` #D8B45E | `--surface` #0F151C | ≈8.9:1 | AAA |
| `--accent-ink` #052A24 | `--accent` #46C2AC | ≈6.6:1 | AA (button label) |
| `--gold` #D8B45E | `--gold-t` over `--surface` | ≈8.5:1 | AA |
| `--crimson` #F0645C | `--surface` #0F151C | ≈5.2:1 | AA |

---

## 5. Language system — **one slot, one language**

English is not a translation of the page; it is a **labelling and orientation layer**.
Every string appears once, in the language that slot belongs to. Nothing is duplicated.

### 5.1 The rule
| Where | Language | Example |
|---|---|---|
| Eyebrows / overlines | **English only** | `MILESTONES`, `STREAMS`, `CONTACT` |
| Card micro-labels (`subj-en`, `fact-k`, `contact-label`) | **English only** | `MISSION`, `ESTABLISHED`, `VISIT` |
| Section titles, page titles, card titles | Bangla only | `আমাদের পথচলা` |
| Body prose (paragraphs, cards, notes) | Bangla only | — |
| Section deck (`sec-sub`) | Bangla only | — |
| Section orientation line (`.sec-en`) | **one** English sentence, ≤ 100 chars | `Two streams run today. Two more open next, inshaAllah.` |
| Names / terms in card titles | Bangla + English name | `হিফজুল কুরআন · Hifzul Qur’an` |
| Status chips, buttons | Bangla word + English label | `চালু · ACTIVE`, `ভর্তি · Apply` |
| Header nav | Bangla label; English in `title` + `aria-label` | `পরিচিতি` / title="About" |
| Footer | Bangla labels, bilingual column headers | `ভর্তি · Admission` |
| Form section titles (`apply-*.html`) | bilingual pair — forms are functional | `০১ · শিক্ষার্থীর তথ্য · Student information` |
| `<html lang>` | `bn` | — |

### 5.2 How it works
- **Authored markup owns the copy.** English eyebrows, micro-labels, chips, buttons and the
  one `.sec-en` line are written directly in the HTML — no DOM walking, no flash, no
  double-insert on re-render, and the copy is *written* for English readers rather than
  translated word-for-word.
- `applyBilingual()` is a **no-op shim**: older modules still call it, nothing is injected.
- `siteT(str)` → `"বাংলা · English"` only for **JS-rendered strings** (toasts, empty states,
  timeline chrome); `siteBi(bn, en)` pairs a name; `siteEn()` answers the dictionary.
- Structured data supplies its own English: `titleEn`, `tagEn`, and a `descEn` that is a
  **result-first one-liner**, never a translated paragraph (`history.json` `_readme` says so).

### 5.3 Styling hooks
`.sec-en` (the one orientation line: mono 11 px, muted) · `.bi-en` (inline English fragment
that JS sets beside a Bangla label) · `.bi-en.is-block` (smaller line under a heading).
`.bi-en.is-para` was **removed** — the duplicated English paragraph no longer exists.
The English fragment always inherits the surrounding typeface; only size, weight and colour
change, so English never introduces a font of its own.

---

## 6. The heritage stepper (`#history`)

One column — the two ~200 px side rails were removed (owner: they read as stranded boxes).
Filters and year jumps are chips in a toolbar above the rail.

| Reference element | Here |
|---|---|
| Filter row | `.hist-toolbar` → `.hist-filter` chips: one per tag + “সব”, count at the right, pressed chip = gold fill/edge (English tag name in `title`) |
| Year jump row | `.hist-years` — `২০২৬ · ২০২৪ · …`, active year carries `aria-current="true"` + gold edge |
| “Show all” control | `#chainToggle` in the toolbar: 4 milestones by default, flips label + `aria-expanded` |
| Centre vertical rail | `.stepper::before` — 1px gold-to-transparent hairline |
| Numbered circle nodes | `.stepper-node` — 31px circle, hairline border, Bangla step number |
| Filled “current” node | newest milestone: `.stepper-step--now .stepper-node` — solid gold, dark glyph, gold halo |
| Mono chips per step | `.stepper-meta` → `.stepper-year` (`২০২৬ 2026`) + English `.stepper-chip` (`ACHIEVEMENT`) |
| Content card | `.card.chain-item` — gold top bar, Bangla title, **one** English line (`.stepper-en`), Bangla note |

Mobile (≤900px): single column throughout — chips wrap, the rail tightens to 37px with 25px
nodes, and the feed takes the full container width.

**Numbering law.** The node numbers run with the calendar, not with the visible slice: the newest
milestone carries the highest number (today `০৭`) and the rail counts **down** to `০১` at the
founding year. Expanding or filtering never renumbers a step — a filtered view leaves honest gaps
(e.g. `০৬ · ০৫`), which is why the number reads as the milestone's place in the institute's history.

---

## 7. Architecture

### 7.1 Scripts
| File | Role |
|---|---|
| `assets/js/prefs.js` | **head, synchronous** — locks `data-theme="dusk"`, `data-lang="bi"`, `lang="bn"`; clears retired preference keys |
| `assets/js/i18n.js` | dictionary + `siteT()` / `siteBi()` / `siteEn()`; `applyBilingual()` is a no-op shim (English is authored in the markup) |
| `assets/js/site.js` | injects header (brand · Bangla nav with English `title` · Apply) + footer (brand · social · sitemap · ©); menu toggle; reveal stagger; nav scroll-spy; toast; copy/map/apply-link wiring |
| `assets/js/history.js` | reads `history.json` (or a published Sheet CSV), renders the **stepper**, toolbar chips, year row + scroll-spy |
| `assets/js/teachers.js` | reads `teachers.json`, renders the Super card + faculty grid with bn/en pairs |
| `assets/js/explore.js` | reads `photos.json`, builds album sections + lightbox |
| `assets/js/apply-student.js` · `apply-teacher.js` · `apply-track.js` | form validation, photo compression, POST, offline retry, status lookup |
| `assets/js/site-links.js` · `social-icons.js` · `firebase-rt.js` | link config · SVG icon paths · RTDB helpers |

### 7.2 Data
```
history.json   → { sheetCsvUrl, sort, entries:[{ year, title, titleEn, desc, descEn, tag, tagEn }] }
teachers.json  → { super:{ name, nameEn, role, roleEn, photo, qualification, qualificationEn, fields[], fieldsEn[], bio, bioEn }, teachers:[ … ] }
photos.json    → { albums:[ { name, photos:[ { src, caption } ] } ] }   (generated by ../_build_photos.js)
```

### 7.3 Data pipeline (unchanged)
Backend: Firebase RTDB `https://sms-admission-4f632-default-rtdb.asia-southeast1.firebasedatabase.app`
(open rules; same backend the management app uses).

| Form | Writes to | Payload essentials | Lands in |
|---|---|---|---|
| Student | `POST /admissions.json` | `appId (APP-XXXXXXXX)`, canonical fields + legacy short names, `status:'pending'`, `submittedAt`, `source:'website'` | Pending admission card in Student Management → Admission |
| Teacher | `POST /teacher-applications.json` | `appId (TCH-XXXXXXXX)`, qualification/subject/experience, `status:'pending'` | Isolated teacher store |
| Track | `GET /admissions.json` + `/teacher-applications.json` | lookup by `appId` | Status panel (pending / approved / declined / waitlisted) |

### 7.4 Tech approach
- Pure HTML/CSS/JS, relative paths only, **no build step** → drag-and-drop deployable.
- No Tailwind, no framework: hand-written, namespaced CSS in one stylesheet.
- Firebase via plain REST `fetch` (no SDK) → works from any origin incl. `file://`.
- Offline resilience: failed POST is kept in `localStorage` (`sms_admissions`) with **Retry submit**.
- Logo: `assets/img/logo.png` (320×480 web copy of `Logo/Logo-01.png`).
- `_build_preview.js` inlines CSS, JS, JSON and every image into one sendable
  `website-preview.html` (all five pages, navigated through the site's own header/footer links,
with no preview toolbar) for offline review.

### 7.5 File manifest
```
website/
├── PLAN.md · README.md
├── index.html · teachers.html · explore.html
├── apply-student.html · apply-teacher.html
├── history.json · teachers.json · photos.json
├── Photos/  (Campus · Students · Classrooms · Mosque · Events · Programmes · Teachers)
└── assets/
    ├── css/site.css          ← the single theme + all components
    ├── js/  (prefs · i18n · site · history · teachers · explore · apply-* · site-links · social-icons)
    └── img/ (logo · campus/event photos · teachers/)
```

---

## 8. Validation checklist

- [ ] `node --check` every edited script
- [ ] `node _test_prefs.js` — one theme, no toggles, bilingual rendering on all five pages,
      old storage ignored, stepper anatomy, dictionary coverage ≥ 90 %
- [ ] `node _test_website.js` — full jsdom smoke suite (forms, tracker, timeline, CSS laws)
- [ ] `node _test_full_load.js`, `_test_admission_ui.js` still pass
- [ ] `node _serve.js` → `http://localhost:8080/website/` — visual pass at 1440 and 390 px
- [ ] `node _build_preview.js` → `node _probe_preview.js` — the single-file preview opens from
      `file://` with all five pages, photos, the stepper and the simulated forms

---

## 9. Content hand-off (institute facts to verify)

Confirmed: slogan “গুণমান ও নৈতিকতার অঙ্গীকার · Promises to Quality and Morality”, **established
২০০৩**, **ব্রাহ্মণপাড়া, কুমিল্লা, বাংলাদেশ**, curriculum follows **NCTB** and the **Madrasah
Education Board, Dhaka**, contact **info.jamiaislamia.edu.bd@gmail.com**, four streams (General +
Hifzul Qur’an active with নূরানী · নাযেরা · হিফজ stages; Science + Commerce coming soon).

| Location | Placeholder | Owner action |
|---|---|---|
| `index.html` → `#about` fact strip | `[ নাম যোগ করুন ]` (Founder) | enter founder name |
| `index.html` → `#contact` | upazila/district + email only | add street/postal address + phone |
| `teachers.json` | three `[ শিক্ষকের নাম ]` rows | add real faculty (bn + en fields) |
| `history.json` | — | add a new entry each year (bn + en fields) |

---

## 10. Change log (v3)

| Area | Before | Now |
|---|---|---|
| Theme | light “editorial” + `[data-theme="dark"]` night palette, OS-driven | **one fixed “Madrasah Dusk” theme** (teal + gold on blue-black) |
| Theme control | `☾ Night` / `☀ Day` button in the header | **removed**; `prefs.js` locks the theme and clears old keys |
| Language | `EN` / `বাং` toggle swapped the whole page | **removed**; English is authored as the labelling/orientation layer (eyebrows, labels, chips, one line per section) — one slot, one language, nothing duplicated |
| Accent | indigo `#4a5aec` / `#5c6ef8` | teal `#46C2AC` (interactive) + gold `#D8B45E` (heritage) |
| Identity | ruled-line hero texture | eight-point **girih lattice** (hero + footer), gold ◆ title rules, gold-edged logo tile |
| Heritage | three-column cards with `chain-*` blocks | **stepper**: numbered gold nodes on a rail, mono year+tag chips, filled “current” node, scroll-spy TOC |
| Data | `history.json` Bangla only | `titleEn / descEn / tagEn` added for all seven milestones |
