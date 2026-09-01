// Extracts the College's own curated gallery (albums + full-size images) from the
// archived /gallery/ page, and downloads any originals not already on disk.
// Usage: node scripts/extract-gallery.mjs
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'node-html-parser';

const ROOT = process.cwd();
const PAGE = path.join(ROOT, '.scrape', 'pages', 'gallery.html');
const OUT = path.join(ROOT, '.scrape', 'content', 'gallery.json');
const MEDIA = path.join(ROOT, 'client', 'public', 'media');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const UPLOADS = 'degniboo';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (s = '') => s.replace(/\s+/g, ' ').trim();

const toLocal = (url) => {
  const m = url.match(new RegExp(`/${UPLOADS}/(.+)$`));
  return m ? '/media/' + decodeURIComponent(m[1]) : '';
};

/** Title-cases the theme's shouty album headings. */
const titleCase = (s) =>
  s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());

async function download(url, dest) {
  await mkdir(path.dirname(dest), { recursive: true });
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(`https://web.archive.org/web/2026id_/${url}`, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(120000),
      });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 500) {
          await writeFile(dest, buf);
          return buf.length;
        }
      } else if (res.status === 404) return 0;
    } catch { /* retry */ }
    await sleep(2000 * (i + 1));
  }
  return 0;
}

const html = await readFile(PAGE, 'utf8');
const root = parse(html);
const main = root.querySelector('main#main') || root;

// Album names come from the headings that precede each gallery widget, in order.
const headings = main
  .querySelectorAll('h1,h2,h3,h4')
  .map((h) => clean(h.text))
  .filter((t) => t && t.length < 60);

const albums = [];
main.querySelectorAll('.wgl-gallery_items').forEach((grid, i) => {
  const name = titleCase(headings[i] || `Album ${i + 1}`);
  const items = grid.querySelectorAll('a.wgl-gallery_item').map((a) => ({
    // href is the unresized original; the img src is a square crop.
    src: toLocal(a.getAttribute('href') || ''),
    alt: clean(a.getAttribute('data-elementor-lightbox-title') || '').replace(/^_/, ''),
  }));
  albums.push({ album: name, items: items.filter((it) => it.src) });
});

console.log(`albums found: ${albums.map((a) => `${a.album} (${a.items.length})`).join(', ')}`);

// Fetch any originals the bulk image pass did not already capture.
let fetched = 0;
const out = [];
let sort = 0;
for (const album of albums) {
  for (const item of album.items) {
    const rel = item.src.replace('/media/', '');
    const dest = path.join(MEDIA, rel);
    if (!existsSync(dest) || (await stat(dest)).size < 500) {
      const bytes = await download(`https://fosco.edu.gh/${UPLOADS}/${rel}`, dest);
      if (bytes) {
        fetched++;
        console.log(`  fetched ${rel} (${Math.round(bytes / 1024)} KB)`);
      } else {
        console.log(`  MISSING ${rel} — skipped`);
        continue;
      }
      await sleep(400);
    }
    out.push({ ...item, album: album.album, sort: sort++ });
  }
}

await writeFile(OUT, JSON.stringify(out, null, 2));
console.log(`\nwrote ${out.length} gallery images (${fetched} newly downloaded) -> .scrape/content/gallery.json`);
