import { Router } from 'express';
import { db, hydrate, hydrateAll } from '../db.js';

export const router = Router();

// ---- Pages -----------------------------------------------------------------

router.get('/pages', (req, res) => {
  const rows = db.prepare('SELECT slug, path, title, description FROM pages ORDER BY slug').all();
  res.json(rows);
});

router.get('/pages/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM pages WHERE slug = ?').get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Page not found' });
  res.json(hydrate('pages', row));
});

// ---- News ------------------------------------------------------------------

router.get('/news', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;
  const category = req.query.category;

  let sql = 'SELECT * FROM news WHERE published = 1';
  const params = [];
  if (category) {
    sql += ' AND categories LIKE ?';
    params.push(`%"${category}"%`);
  }
  sql += ' ORDER BY date DESC, id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = hydrateAll('news', db.prepare(sql).all(...params));
  const total = db.prepare('SELECT COUNT(*) c FROM news WHERE published = 1').get().c;
  res.json({ total, items: rows });
});

router.get('/news/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM news WHERE slug = ? AND published = 1').get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Article not found' });
  res.json(hydrate('news', row));
});

// ---- Events ----------------------------------------------------------------

router.get('/events', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM events WHERE published = 1 ORDER BY starts_at DESC, id DESC')
    .all();
  res.json(rows);
});

// ---- Gallery ---------------------------------------------------------------

router.get('/gallery', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 500);
  const rows = db.prepare('SELECT id, src, alt, album FROM gallery ORDER BY sort LIMIT ?').all(limit);
  const albums = db.prepare('SELECT album, COUNT(*) c FROM gallery GROUP BY album ORDER BY album DESC').all();
  res.json({ albums, items: rows });
});

// ---- Contact ---------------------------------------------------------------

router.post('/contact', (req, res) => {
  const { name, email, phone = '', subject = '', message } = req.body || {};
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Name, email and message are required.' });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }
  db.prepare(
    'INSERT INTO messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)'
  ).run(name.trim(), email.trim(), String(phone).trim(), String(subject).trim(), message.trim());

  res.status(201).json({ ok: true, message: 'Thank you — your message has been received.' });
});
