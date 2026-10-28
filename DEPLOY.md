# How to put this website on GitHub Pages

This folder is the **whole public website**, ready to upload: 41 files, 1.42 MB.
It is the `website/` folder from the project minus the React teacher-form source (which is
already published separately as `teacher-form`).

```
website-upload/
├── index.html            home
├── teachers.html         our teachers            (reads teachers.json)
├── explore.html          photo albums            (reads photos.json)
├── apply-student.html    built-in student form   (fallback, unlinked)
├── apply-teacher.html    built-in teacher form   (fallback, unlinked)
├── history.json          the timeline entries    ← edit this to change the timeline
├── different.json        the "why we are different" reasons  ← edit this to change the list
├── teachers.json         the faculty list        ← edit this to change teachers
├── photos.json           album → photo mapping   ← edit this to change the gallery
├── assets/
│   ├── css/site.css      one stylesheet
│   ├── js/               site.js · site-links.js · i18n.js · social-icons.js · prefs.js
│   │                     teachers.js · explore.js · history.js · firebase-rt.js
│   │                     apply-student.js · apply-teacher.js · apply-track.js
│   └── img/              logo, map thumbnails, etc.
├── Photos/               8 albums, 15 photos
├── .nojekyll             tells GitHub Pages to serve the files as-is
├── README.md             full documentation
└── PLAN.md               design plan / decisions
```

---

## 1. Create the repository — use this exact name

**`Jamiaislamia.github.io`**

That is GitHub's special *user site* name: the site is published at the **root** of your domain,
`https://jamiaislamia.github.io/`. That matters, because three other pages already link back to it:

* the apply portal's “← ওয়েবসাইটে ফিরে যান”
* the teacher form's “← Back to website”
* `website/Teacher registration/src/lib/site.ts` → `SITE_HOME`

Your existing project sites keep working at their own paths:
`/admission-form/`, `/teacher-form/`, `/apply-portal/`.

*(If you would rather use a normal name such as `website`, the site lands at
`https://jamiaislamia.github.io/website/` instead — then tell me and I'll update those three
back-links. The root name is the simpler choice.)*

---

## 2. Upload

### Option A — the web uploader (fine here: 41 files, 1.42 MB)

1. New repository → name `Jamiaislamia.github.io` → **Public** → no README / no .gitignore.
2. On the empty repo page click **uploading an existing file**.
3. Open this folder, select **everything inside it** (`Ctrl+A`) and drag it onto the page —
   including the `assets`, `Photos` folders and `.nojekyll`.
   *Upload folders, not their contents*: the drop zone must show
   `assets/css/site.css`, `Photos/Campus/campus.jpg`, … with the folder prefix.
4. Commit message: `site: first upload` → **Commit changes**.

> GitHub's web uploader accepts up to **100 files per drop** and **25 MB per file** — this site is
> well inside both.

### Option B — command line (only if you prefer git)

```powershell
cd "C:\Users\ASUS\Desktop\The admission application fixes\website-upload"
git init
git add .
git commit -m "site: first upload"
git branch -M main
git remote add origin https://github.com/Jamiaislamia/Jamiaislamia.github.io.git
git push -u origin main
```

### Option C — GitHub Desktop

*File → Add local repository* → pick `website-upload` → *Publish repository* (untick “Keep this code
private”) → repository name `Jamiaislamia.github.io`.

---

## 3. Turn Pages on

Repository → **Settings** → **Pages** → *Build and deployment*:

* **Source:** `Deploy from a branch`
* **Branch:** `main`, **Folder:** `/ (root)` → **Save**

Wait ~1 minute. The page shows *“Your site is live at https://jamiaislamia.github.io/”*.

---

## 4. Check it (2 minutes)

| Open | Expect |
|---|---|
`https://jamiaislamia.github.io/` | hero, history timeline, four stream cards, campus gallery, contact ledger |
`…/teachers.html` | সুপার card + faculty grid with photos |
`…/explore.html` | 8 albums, click a photo for the lightbox |
Header **আবেদন · Apply** | opens `…/apply-portal/` in a new tab |
`#contact` APPLY column | student → `…/admission-form/`, teacher → `…/teacher-form/`, track → `…/apply-portal/#track` |

If a page looks unstyled, the `assets` folder didn't land at the root — re-upload it as a folder.
If the timeline, teachers or gallery are empty, the matching `.json` file is missing.

---

## 5. Updating it later

Everything that changes regularly is a **data file** — no HTML editing needed:

| To change | Edit |
|---|---|
| teachers / their photos / subjects | `teachers.json` |
| history milestones | `history.json` |
| the "why we are different" reasons (two columns of six) | `different.json` |
| gallery albums | `photos.json` (and drop the images into `Photos/<Album>/`) |
| application form URLs, Maps link, social links | `assets/js/site-links.js` |

Commit the edited file in GitHub's web editor (pencil icon) — Pages redeploys in ~40 seconds.

---

## 6. What is *not* in this folder

* `Teacher registration/` — the React source of the teacher form. It is already published as the
  `teacher-form` repository; do not upload the source (180 MB of `node_modules`). Publish a rebuild
  with: `cd "website/Teacher registration" && npm run build` → copy `dist/` to that repo.
* `website-preview.html` / `Jamia-Islamia-Madrasah-Website.html` — the single-file offline demo kept
  in the project root for sharing; not part of the public site.
