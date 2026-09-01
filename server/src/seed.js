// Loads the extracted archive content into SQLite and creates the initial admin user.
// Usage: npm run seed   (from repo root: npm run seed)
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { db } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const CONTENT = path.join(ROOT, '.scrape', 'content');
const MEDIA_ROOT = path.join(ROOT, 'client', 'public', 'media');

const readJson = async (p, fallback) => (existsSync(p) ? JSON.parse(await readFile(p, 'utf8')) : fallback);

/** Decorative theme furniture that should never reach the rebuilt site. */
const isDecorative = (src = '') =>
  /shape_\d+|pagetitle|logo|site-icon|favicon|dummy|placeholder|ajax-loader|avatar|pattern/i.test(src);

/** Index of every downloaded image, keyed by filename, for resolving stale references. */
async function buildMediaIndex(dir = MEDIA_ROOT, prefix = '') {
  const index = new Map();
  if (!existsSync(dir)) return index;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      for (const [k, v] of await buildMediaIndex(path.join(dir, entry.name), rel)) index.set(k, v);
    } else {
      index.set(entry.name.toLowerCase(), `/media/${rel}`);
    }
  }
  return index;
}

/**
 * Elementor caches cropped copies under /elementor/thumbs/<original>-<hash>.<ext>.
 * Those crops were never archived, but the source image was — strip the hash and
 * point at the original so the reference still resolves.
 */
function resolveMedia(src = '', index) {
  if (!src.startsWith('/media/elementor/thumbs/')) return src;
  const file = decodeURIComponent(path.posix.basename(src));
  const ext = path.posix.extname(file);
  const stem = file.slice(0, -ext.length);

  // The cache-busting hash is the final dash-separated segment.
  const original = stem.replace(/-[a-z0-9]{25,}$/i, '') + ext;
  return index.get(original.toLowerCase()) || '';
}

async function seedPages(mediaIndex) {
  const pages = await readJson(path.join(CONTENT, 'pages.json'), []);
  const stmt = db.prepare(`
    INSERT INTO pages (slug, path, title, description, hero_title, hero_image, blocks, updated_at)
    VALUES (@slug, @path, @title, @description, @hero_title, @hero_image, @blocks, datetime('now'))
    ON CONFLICT(slug) DO UPDATE SET
      path=excluded.path, title=excluded.title, description=excluded.description,
      hero_title=excluded.hero_title, hero_image=excluded.hero_image,
      blocks=excluded.blocks, updated_at=datetime('now')
  `);

  const run = db.transaction((rows) => {
    for (const p of rows) {
      // Strip the theme's decorative blobs; they carry no meaning without the old CSS.
      const blocks = (p.blocks || [])
        .map((b) => {
          const next = { ...b };
          if (next.src) next.src = resolveMedia(next.src, mediaIndex);
          if (next.image) next.image = resolveMedia(next.image, mediaIndex);
          return next;
        })
        // Drop image blocks that are decorative or whose file could not be resolved.
        .filter((b) => !(b.type === 'image' && (!b.src || isDecorative(b.src))));
      stmt.run({
        slug: p.slug,
        path: p.path,
        title: p.title || p.slug,
        description: p.description || '',
        hero_title: p.hero?.title || p.title || '',
        hero_image: p.hero?.image && !isDecorative(p.hero.image) ? resolveMedia(p.hero.image, mediaIndex) : '',
        blocks: JSON.stringify(blocks),
      });
    }
  });
  run(pages);
  return pages.length;
}

async function seedNews(mediaIndex) {
  const posts = await readJson(path.join(CONTENT, 'news.json'), []);
  const stmt = db.prepare(`
    INSERT INTO news (slug, title, date, categories, image, excerpt, body, gallery, published, updated_at)
    VALUES (@slug, @title, @date, @categories, @image, @excerpt, @body, @gallery, 1, datetime('now'))
    ON CONFLICT(slug) DO UPDATE SET
      title=excluded.title, date=excluded.date, categories=excluded.categories,
      image=excluded.image, excerpt=excluded.excerpt, body=excluded.body,
      gallery=excluded.gallery, updated_at=datetime('now')
  `);

  const run = db.transaction((rows) => {
    for (const p of rows) {
      const gallery = (p.gallery || [])
        .map((g) => resolveMedia(g, mediaIndex))
        .filter((g) => g && !isDecorative(g));

      stmt.run({
        slug: p.slug,
        title: p.title,
        date: p.date || '',
        categories: JSON.stringify(p.categories || []),
        image: resolveMedia(p.image || '', mediaIndex) || gallery[0] || '',
        excerpt: p.excerpt || '',
        body: JSON.stringify(p.body || []),
        gallery: JSON.stringify([...new Set(gallery)]),
      });
    }
  });
  run(posts);
  return posts.length;
}

/**
 * Seeds the gallery from the College's own curation on the archived /gallery/ page
 * (albums and image order included) rather than from every file in the media
 * library, which also holds theme stock art and one-off page graphics.
 */
async function seedGallery() {
  const curated = (await readJson(path.join(CONTENT, 'gallery.json'), [])).filter((g) =>
    existsSync(path.join(MEDIA_ROOT, g.src.replace('/media/', '')))
  );

  // Replace wholesale so images dropped from the curation do not linger.
  const stmt = db.prepare('INSERT INTO gallery (src, alt, album, sort) VALUES (?, ?, ?, ?)');
  const run = db.transaction((rows) => {
    db.prepare('DELETE FROM gallery').run();
    rows.forEach((g, i) => {
      stmt.run(g.src, g.alt || 'Foso College of Education', g.album || 'Campus', g.sort ?? i);
    });
  });
  run(curated);
  return curated.length;
}

async function seedAdmin() {
  const username = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'fosco-admin';
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return { username, created: false };
  db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
    .run(username, bcrypt.hashSync(password, 10), 'admin');
  return { username, password, created: true };
}

const mediaIndex = await buildMediaIndex();
const pages = await seedPages(mediaIndex);
const news = await seedNews(mediaIndex);
const gallery = await seedGallery();
const admin = await seedAdmin();

console.log(`seeded: ${pages} pages, ${news} news posts, ${gallery} gallery images`);
console.log(
  admin.created
    ? `admin user created: ${admin.username} / ${admin.password}  (change this before deploying)`
    : `admin user already present: ${admin.username}`
);
