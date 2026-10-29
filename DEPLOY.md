# Publish — Firebase Hosting

The public website **and** the three application forms are served by **Firebase Hosting**
(project `sms-admission-4f632`). GitHub is source control only.

| URL | What it is | Built from |
| - | - | - |
| `https://jamiaislamia.web.app/` | the institute website | this folder (`website-upload/`) |
| `https://jamiaislamia.web.app/admission-form/` | student registration | `admission-form/index.html` |
| `https://jamiaislamia.web.app/teacher-form/` | teacher registration | `teacher-portal/` (built Vite app) |
| `https://jamiaislamia.web.app/apply-portal/` | apply hub + status checker | `apply-portal/index.html` |

`sms-admission-4f632.web.app` mirrors the same release (a second site entry in `firebase.json`), so
older links never break — but the `jamiaislamia.web.app` URLs above are the ones to share.

---

## 1. Why a staging folder instead of deploying this folder

This folder is a **git clone**, so it carries things that must never sit on a public web
server: `README.md`, `PLAN.md`, `DEPLOY.md`, `.gitattributes`, the per-album `README.txt`
notes, and the `_readme` documentation keys inside the JSON data files. Those are *source*,
not *site*.

`_build_firebase_release.js` (project root) copies only what a visitor may fetch into
`_deploy/`, then `firebase.json` publishes that folder:

```
_deploy/                     ← generated, git-ignored, never edited by hand
├── index.html  teachers.html  explore.html  apply-*.html
├── history.json  different.json  teachers.json  photos.json   (no _readme keys)
├── assets/  Photos/
├── admission-form/index.html
├── teacher-form/            (index.html + assets/)
└── apply-portal/index.html
```

## 2. Publish (two commands)

```powershell
cd "C:\Users\ASUS\Desktop\The admission application fixes"
node _build_firebase_release.js
firebase deploy --only hosting --project sms-admission-4f632
```

The first command prints what it staged (40 files, ~2.1 MB) and confirms the four entry
points exist. The second prints `Hosting URL: https://jamiaislamia.web.app`.

`--only hosting` matters: it deploys **only** the web files. It never touches the live
Realtime Database rules (`firebase deploy --only database` is a separate, deliberate step
tracked in `TODO_SECURITY_ROLLOUT.md`).

### First time on a new machine

```powershell
firebase login          # sign in as info.jamiaislamia.edu.bd@gmail.com
firebase projects:list  # must show sms-admission-4f632
```

## 3. What is never published

| Excluded | Why |
| - | - |
| `README.md` · `PLAN.md` · `DEPLOY.md` · `.gitattributes` · `.nojekyll` | repo/doc furniture |
| `Photos/**/README.txt` | per-album editing notes |
| the `_readme` key in `history.json` / `different.json` | explains how to edit the file — authority-facing |
| `project/**` (the dashboard) | local-only admin system; `…/project/dashboard/dashboard.html` returns **404** |
| `website/Teacher registration/**` | the Vite source; only its `dist/` build is published |

## 4. Updating the content

Everything that changes regularly is a **data file** — no HTML editing needed:

| To change | Edit |
|---|---|
| teachers / their photos / subjects | `teachers.json` |
| history milestones | `history.json` |
| the "why we are different" reasons | `different.json` |
| gallery albums | `photos.json` (and drop images into `Photos/<Album>/`) |
| application form URLs, Maps link, social links | `assets/js/site-links.js` |
| a new photo | put it in `Photos/<Album>/`, update `photos.json`, and add `?v=<stamp>` to the URL so browsers fetch it |

Then re-run the two publish commands. Changes are live in ~30 seconds.

## 5. Cache policy (set in `firebase.json`)

| Files | Header | Effect |
| - | - | - |
| `*.html`, `*.json`, `/` | `no-cache` | an edit is visible on the next load — no stale pages or stale data |
| `assets/**/*.js`, `assets/**/*.css` | `public, max-age=604800` | 7 days; the `?v=` stamp in the include forces a refetch when the file changes |
| `*.jpg|jpeg|png|webp|svg|ico|woff2` | `public, max-age=86400` | 1 day |

If you replace an image **without** changing its URL, use `firebase hosting:channel`… no —
simply add or bump a `?v=` query on that URL (that is how the campus photo was fixed).

## 6. Rollback

```powershell
firebase hosting:rollback --project sms-admission-4f632
```

Releases the previous deploy immediately. `firebase hosting:releases:list` shows the history.

## 7. Custom domain (optional)

Firebase console → Hosting → **Add custom domain** (`jamiaislamia.edu.bd` or `www.…`) and add
the TXT/A records it shows at your DNS provider. HTTPS is provisioned automatically. After the
domain is live, update the four URLs in `assets/js/site-links.js` + `apply-portal/index.html`
+ `website/Teacher registration/src/lib/site.ts` (`SITE_HOME`) and redeploy.

## 8. The GitHub side (already done, keep it this way)

The four publish repositories are **private** and their GitHub Pages sites are **off**. That is
what hides the source tree, the commit history and these internal docs. If a repository is ever
made public again, do not re-enable Pages — publish through Firebase as above.
