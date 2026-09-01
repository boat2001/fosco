# FOSCO — Foso College of Education

A React + Express rebuild of [fosco.edu.gh](https://fosco.edu.gh), replacing the previous
WordPress stack (Unicoach theme, Elementor, LearnPress, WooCommerce, Revolution Slider).

All content, photography and page copy is the College's own, recovered from the site itself.

## Stack

| Layer | Choice |
|---|---|
| Front-end | React 18 + Vite, plain CSS (no UI framework) |
| Routing | react-router-dom |
| Back-end | Express 4 |
| Database | SQLite via better-sqlite3 (WAL) |
| Auth | JWT in an httpOnly cookie, bcrypt password hashes |
| Assets | 175 original images served locally, immutable-cached |
| Type | Public Sans, Red Hat Display, Rajdhani — the original theme's families, self-hosted |

Production bundle: **~72 KB gzipped** (54 KB React, 13 KB app, 5 KB CSS).

## Quick start

```bash
npm install
npm run seed     # loads content into server/data/fosco.db, creates the admin user
npm run dev      # Express on :4000, Vite on :5173 — open http://localhost:5173
```

For a production-style run:

```bash
npm run build    # builds client/dist
npm start        # Express serves the API and the built SPA on :4000
```

### Before deploying

1. `cp server/.env.example server/.env` and set a real `JWT_SECRET` — the server
   refuses to issue sessions without one when `NODE_ENV=production`.
2. Change the admin password. The seed creates `admin` / `fosco-admin` on first run;
   set `ADMIN_USER` / `ADMIN_PASSWORD` before seeding, or change it afterwards.

## Layout

```
client/          React app
  public/media/  175 original site images (committed)
  public/uploads/ staff-uploaded images (gitignored, created at runtime)
  src/
    data/site.js     navigation, contact details, curated homepage content
    styles/          tokens → base → layout → components → chrome → pages
    components/      Header, Footer, Blocks, Icons, shared UI
    pages/           Home, ContentPage, News, Article, Gallery, Events, Contact, Admin
server/
  src/db.js        schema + JSON column hydration
  src/seed.js      loads .scrape/content into SQLite
  src/routes/      content.js (public), admin.js (authenticated)
scripts/         content recovery pipeline (see below)
```

## Content model

Two kinds of content, deliberately separated:

- **Pages** (`/about-us`, `/science-department`, …) are stored as extracted *blocks* —
  `heading`, `sectionHeading`, `richText`, `image`, `infoBox`, `button`, `divider` —
  and rendered generically by `ContentPage` via `components/Blocks.jsx`. Any of the 33
  recovered pages renders without bespoke code.
- **News, events and gallery** are first-class tables with a full admin UI, because
  they change regularly.

The homepage is hand-built (`pages/Home.jsx`) from curated copy in `data/site.js`
rather than generic blocks, so its layout is deliberate rather than a stack of divs.

## Admin

`/admin` — sign in to create, edit, unpublish and delete news and events, upload
images, and read contact-form enquiries.

- Login is rate-limited to 10 attempts per 15 minutes.
- Uploads are capped at 8 MB and restricted to JPEG/PNG/WebP/GIF.
- Unpublished items return 404 from the public API.

## Content recovery pipeline

The live site sits behind a Cloudflare interactive challenge, so content was recovered
from the Internet Archive's February 2026 snapshot. These scripts are re-runnable and
idempotent; `.scrape/` is gitignored.

```bash
npm run scrape:pages    # 33 real pages (menu structure, not the ~2,000 demo URLs)
npm run scrape:images   # 175 images, falling back to the largest archived variant
npm run scrape:news     # 8 news posts, bodies and galleries
npm run fonts           # self-hosts Public Sans / Red Hat Display / Rajdhani
npm run extract         # parses Elementor HTML into blocks + the curated gallery
npm run seed            # loads it all into SQLite
npm run check:media     # asserts every /media reference resolves on disk (currently 0 missing)
```

Notes on the recovery:

- Theme demo content was excluded — the archive holds ~2,000 URLs, but only ~33 are
  genuine College pages. The rest are 2017 health-blog posts and `lesson-copy-copy-copy`
  duplicates left over from the theme.
- The old site used WP Hide & Security Enhancer, which renames WordPress paths
  (`wp-content/uploads` → `degniboo`, `wp-includes` → `kaluksis`). The scripts map these back.
- News dates rendered only as "12 Jun" with no year. Years are recovered from the
  WordPress upload path (`/media/2025/06/…`), which matches when a post was written.
- The gallery uses the College's own curation from the archived `/gallery/` page
  (Campus Life, Staff Routine) rather than every file in the media library.

## Testing

```bash
npm start                        # in one terminal
node scripts/smoke-test.mjs      # 23 checks: public API, contact form, auth, admin CRUD
```

Two browser tools drive headless Edge over the DevTools Protocol:

```bash
node scripts/screenshot.mjs http://localhost:4000/ 390 shot.png   # real device viewport
node scripts/find-overflow.mjs http://localhost:4000/ 390         # lists elements past the viewport edge
```

Use `screenshot.mjs` rather than Edge's `--screenshot` flag: the flag renders at a
viewport wider than the window and crops the result, which makes correct mobile
layouts look broken.

## Not carried over

LearnPress courses and the WooCommerce cart/checkout were dropped by decision — the
course pages were unused theme demo data, and removing them accounts for most of the
speed gain over the WordPress original.
