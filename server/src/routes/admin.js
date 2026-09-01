import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import rateLimit from 'express-rate-limit';
import { db, hydrate, hydrateAll } from '../db.js';
import { login, requireAuth, cookieOptions, COOKIE_NAME } from '../auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', '..', '..', 'client', 'public', 'uploads');
mkdirSync(UPLOAD_DIR, { recursive: true });

export const router = Router();

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 90);

// ---- Session ---------------------------------------------------------------

// Brute-force protection on the only unauthenticated write endpoint.
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  const result = login(String(username || ''), String(password || ''));
  if (!result) return res.status(401).json({ error: 'Incorrect username or password.' });
  res.cookie(COOKIE_NAME, result.token, cookieOptions);
  res.json({ user: result.user });
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: { username: req.user.username, role: req.user.role } });
});

// Everything below requires a valid session.
router.use(requireAuth);

// ---- News management -------------------------------------------------------

router.get('/news', (req, res) => {
  res.json(hydrateAll('news', db.prepare('SELECT * FROM news ORDER BY date DESC, id DESC').all()));
});

router.post('/news', (req, res) => {
  const { title, date = '', excerpt = '', image = '', categories = [], body = [], published = true } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required.' });

  let slug = slugify(req.body.slug || title);
  // Guarantee uniqueness rather than failing on the UNIQUE constraint.
  if (db.prepare('SELECT 1 FROM news WHERE slug = ?').get(slug)) slug = `${slug}-${Date.now().toString(36)}`;

  const info = db.prepare(`
    INSERT INTO news (slug, title, date, categories, image, excerpt, body, gallery, published)
    VALUES (?, ?, ?, ?, ?, ?, ?, '[]', ?)
  `).run(
    slug, title.trim(), date, JSON.stringify(categories), image, excerpt,
    JSON.stringify(Array.isArray(body) ? body : String(body).split(/\n{2,}/).filter(Boolean)),
    published ? 1 : 0
  );

  res.status(201).json(hydrate('news', db.prepare('SELECT * FROM news WHERE id = ?').get(info.lastInsertRowid)));
});

router.put('/news/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Article not found' });

  const b = req.body || {};
  const body = b.body === undefined
    ? existing.body
    : JSON.stringify(Array.isArray(b.body) ? b.body : String(b.body).split(/\n{2,}/).filter(Boolean));

  db.prepare(`
    UPDATE news SET title=?, date=?, categories=?, image=?, excerpt=?, body=?, published=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    b.title ?? existing.title,
    b.date ?? existing.date,
    b.categories === undefined ? existing.categories : JSON.stringify(b.categories),
    b.image ?? existing.image,
    b.excerpt ?? existing.excerpt,
    body,
    b.published === undefined ? existing.published : (b.published ? 1 : 0),
    req.params.id
  );

  res.json(hydrate('news', db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id)));
});

router.delete('/news/:id', (req, res) => {
  const info = db.prepare('DELETE FROM news WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Article not found' });
  res.json({ ok: true });
});

// ---- Events management -----------------------------------------------------

router.get('/events', (req, res) => {
  res.json(db.prepare('SELECT * FROM events ORDER BY starts_at DESC, id DESC').all());
});

router.post('/events', (req, res) => {
  const { title, starts_at = '', ends_at = '', location = '', description = '', image = '', published = true } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required.' });

  let slug = slugify(req.body.slug || title);
  if (db.prepare('SELECT 1 FROM events WHERE slug = ?').get(slug)) slug = `${slug}-${Date.now().toString(36)}`;

  const info = db.prepare(`
    INSERT INTO events (slug, title, starts_at, ends_at, location, description, image, published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(slug, title.trim(), starts_at, ends_at, location, description, image, published ? 1 : 0);

  res.status(201).json(db.prepare('SELECT * FROM events WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/events/:id', (req, res) => {
  const e = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!e) return res.status(404).json({ error: 'Event not found' });
  const b = req.body || {};
  db.prepare(`
    UPDATE events SET title=?, starts_at=?, ends_at=?, location=?, description=?, image=?, published=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    b.title ?? e.title, b.starts_at ?? e.starts_at, b.ends_at ?? e.ends_at,
    b.location ?? e.location, b.description ?? e.description, b.image ?? e.image,
    b.published === undefined ? e.published : (b.published ? 1 : 0),
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id));
});

router.delete('/events/:id', (req, res) => {
  const info = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Event not found' });
  res.json({ ok: true });
});

// ---- Contact messages ------------------------------------------------------

router.get('/messages', (req, res) => {
  res.json(db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all());
});

router.put('/messages/:id', (req, res) => {
  db.prepare('UPDATE messages SET handled = ? WHERE id = ?').run(req.body?.handled ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

// ---- Image upload ----------------------------------------------------------

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const now = new Date();
      const dir = path.join(UPLOAD_DIR, String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'));
      mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().slice(0, 5);
      cb(null, `${slugify(path.basename(file.originalname, path.extname(file.originalname)))}-${Date.now().toString(36)}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => cb(null, ALLOWED.has(file.mimetype)),
});

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Please attach a JPEG, PNG, WebP or GIF under 8 MB.' });
  const rel = path.relative(UPLOAD_DIR, req.file.path).replace(/\\/g, '/');
  res.status(201).json({ url: `/uploads/${rel}` });
});
