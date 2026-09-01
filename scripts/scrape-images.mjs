// Downloads every real FOSCO upload (photos, logos, graphics) from the Wayback Machine
// at full resolution into client/public/media.
// Usage: node scripts/scrape-images.mjs
import { mkdir, writeFile, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'client', 'public', 'media');
const CACHE = path.join(process.cwd(), '.scrape', 'image-list.json');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

// `degniboo` is this site's obfuscated wp-content/uploads directory
// (the WP Hide & Security Enhancer plugin renames the standard WordPress paths).
const UPLOADS = 'degniboo';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** WordPress writes resized copies as name-800x600.jpg; we only want the original. */
function stripSizeSuffix(url) {
  return url.replace(/-\d+x\d+(\.(?:jpe?g|png|webp|gif|svg))$/i, '$1');
}

async function getImageList() {
  if (existsSync(CACHE)) {
    const cached = JSON.parse(await readFile(CACHE, 'utf8'));
    console.log(`using cached list: ${cached.length} images`);
    return cached;
  }
  // matchType=prefix is required for a directory scan; the mimetype filter is
  // unreliable when combined with it, so images are selected by extension below.
  const cdx =
    `https://web.archive.org/cdx/search/cdx?url=fosco.edu.gh/${UPLOADS}/&matchType=prefix` +
    `&output=text&fl=original,timestamp&filter=statuscode:200&collapse=urlkey&limit=20000`;

  console.log('querying archive index for images...');
  const res = await fetch(cdx, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(300000) });
  const text = await res.text();

  // Group every archived size under its canonical original, so that when the
  // original itself was never captured we can still fall back to the widest copy.
  const groups = new Map(); // canonical url -> [{ url, ts, width }]
  for (const line of text.split('\n')) {
    const [orig, ts] = line.trim().split(/\s+/);
    if (!orig) continue;
    if (!/\.(jpe?g|png|webp|gif|svg)$/i.test(orig)) continue;
    // Skip Elementor's generated thumbnail cache and theme placeholder art.
    if (/\/elementor\/thumbs\//i.test(orig)) continue;

    const canonical = stripSizeSuffix(orig);
    const width = orig === canonical ? Infinity : Number(orig.match(/-(\d+)x\d+\.\w+$/)?.[1] || 0);
    if (!groups.has(canonical)) groups.set(canonical, []);
    groups.get(canonical).push({ url: orig, ts, width });
  }

  // Widest first: the true original (Infinity) leads, then the largest thumbnail.
  const list = [...groups.entries()].map(([canonical, variants]) => ({
    url: canonical,
    candidates: variants.sort((a, b) => b.width - a.width),
  }));
  await mkdir(path.dirname(CACHE), { recursive: true });
  await writeFile(CACHE, JSON.stringify(list, null, 2));
  console.log(`found ${list.length} distinct images`);
  return list;
}

/** https://fosco.edu.gh/degniboo/2022/07/foo.jpg -> 2022/07/foo.jpg */
function localPath(url) {
  const m = url.match(new RegExp(`/${UPLOADS}/(.+)$`));
  return m ? decodeURIComponent(m[1]) : null;
}

async function main() {
  const list = await getImageList();
  let ok = 0, skip = 0, fail = 0;
  const manifest = [];

  for (const { url, candidates } of list) {
    const rel = localPath(url);
    if (!rel) continue;
    const dest = path.join(OUT, rel);

    if (existsSync(dest) && (await stat(dest)).size > 500) {
      skip++;
      manifest.push({ rel, source: url });
      continue;
    }
    await mkdir(path.dirname(dest), { recursive: true });

    // Try the original, then progressively smaller archived copies. Whatever we
    // get is written under the canonical name so page references stay valid.
    let saved = false;
    for (const cand of candidates) {
      if (saved) break;
      for (let i = 0; i < 2 && !saved; i++) {
        try {
          const res = await fetch(`https://web.archive.org/web/${cand.ts}id_/${cand.url}`, {
            headers: { 'User-Agent': UA },
            signal: AbortSignal.timeout(120000),
          });
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            if (buf.length > 500) {
              await writeFile(dest, buf);
              saved = true;
              ok++;
              const note = cand.width === Infinity ? '' : ` [fallback ${cand.width}w]`;
              manifest.push({ rel, source: cand.url, bytes: buf.length, fallback: cand.width !== Infinity });
              console.log(`ok   ${rel} (${Math.round(buf.length / 1024)} KB)${note}`);
            }
          } else if (res.status === 404) break;
        } catch {
          /* fall through to retry */
        }
        if (!saved) await sleep(2000 * (i + 1));
      }
    }
    if (!saved) { fail++; console.log(`FAIL ${rel}`); }
    await sleep(350);
  }

  await writeFile(path.join(process.cwd(), '.scrape', 'media-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nDONE  downloaded=${ok} cached=${skip} failed=${fail}`);
}

main();
