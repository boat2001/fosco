import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(path.join(DATA_DIR, 'fosco.db'));

// WAL keeps reads fast while an admin write is in flight.
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS pages (
    slug        TEXT PRIMARY KEY,
    path        TEXT NOT NULL UNIQUE,
    title       TEXT NOT NULL,
    description TEXT DEFAULT '',
    hero_title  TEXT DEFAULT '',
    hero_image  TEXT DEFAULT '',
    blocks      TEXT NOT NULL DEFAULT '[]',
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS news (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    slug       TEXT NOT NULL UNIQUE,
    title      TEXT NOT NULL,
    date       TEXT NOT NULL DEFAULT '',
    categories TEXT NOT NULL DEFAULT '[]',
    image      TEXT DEFAULT '',
    excerpt    TEXT DEFAULT '',
    body       TEXT NOT NULL DEFAULT '[]',
    gallery    TEXT NOT NULL DEFAULT '[]',
    published  INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_news_date ON news(published, date DESC);

  CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT NOT NULL UNIQUE,
    title       TEXT NOT NULL,
    starts_at   TEXT NOT NULL DEFAULT '',
    ends_at     TEXT DEFAULT '',
    location    TEXT DEFAULT '',
    description TEXT DEFAULT '',
    image       TEXT DEFAULT '',
    published   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_events_start ON events(published, starts_at DESC);

  CREATE TABLE IF NOT EXISTS gallery (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    src      TEXT NOT NULL UNIQUE,
    alt      TEXT DEFAULT '',
    album    TEXT DEFAULT 'Campus',
    sort     INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'editor',
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    phone      TEXT DEFAULT '',
    subject    TEXT DEFAULT '',
    message    TEXT NOT NULL,
    handled    INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

/** Columns stored as JSON text; parsed on the way out, stringified on the way in. */
const JSON_FIELDS = {
  pages: ['blocks'],
  news: ['categories', 'body', 'gallery'],
};

export function hydrate(table, row) {
  if (!row) return row;
  const out = { ...row };
  for (const f of JSON_FIELDS[table] || []) {
    try {
      out[f] = JSON.parse(out[f] ?? '[]');
    } catch {
      out[f] = [];
    }
  }
  if ('published' in out) out.published = !!out.published;
  return out;
}

export const hydrateAll = (table, rows) => rows.map((r) => hydrate(table, r));
