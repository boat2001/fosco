// Integrity check: every /media/ reference stored in the database must exist on disk.
// Usage: node scripts/check-media.mjs
import { existsSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const ROOT = process.cwd();
const MEDIA = path.join(ROOT, 'client', 'public', 'media');
const db = new Database(path.join(ROOT, 'server', 'data', 'fosco.db'), { readonly: true });

const refs = new Map(); // url -> [where]
const note = (url, where) => {
  if (!url || !url.startsWith('/media/')) return;
  if (!refs.has(url)) refs.set(url, []);
  refs.get(url).push(where);
};

for (const p of db.prepare('SELECT slug, hero_image, blocks FROM pages').all()) {
  note(p.hero_image, `page:${p.slug}:hero`);
  for (const b of JSON.parse(p.blocks || '[]')) {
    note(b.src, `page:${p.slug}`);
    note(b.image, `page:${p.slug}`);
  }
}

for (const n of db.prepare('SELECT slug, image, gallery FROM news').all()) {
  note(n.image, `news:${n.slug}`);
  for (const g of JSON.parse(n.gallery || '[]')) note(g, `news:${n.slug}`);
}

for (const g of db.prepare('SELECT src FROM gallery').all()) note(g.src, 'gallery');

let missing = 0;
for (const [url, where] of refs) {
  const file = path.join(MEDIA, decodeURIComponent(url.replace('/media/', '')));
  if (!existsSync(file)) {
    missing++;
    console.log(`MISSING ${url}\n        referenced by: ${[...new Set(where)].join(', ')}`);
  }
}

console.log(`\nchecked ${refs.size} distinct media references — ${missing} missing`);
process.exit(missing ? 1 : 0);
