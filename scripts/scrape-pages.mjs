// Downloads the real FOSCO pages from the Wayback Machine as raw (un-rewritten) HTML.
// Usage: node scripts/scrape-pages.mjs
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), '.scrape', 'pages');
const SNAP = '2026';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

// The genuine site pages, taken from the live navigation menu.
export const PAGES = [
  '/',
  '/about-us/', '/mission-vision/', '/principal/', '/management/', '/officers/',
  '/accreditation/', '/library/',
  '/admission-to-foso-college-of-education/', '/admission-list/', '/admission-policy/',
  '/departments/',
  '/science-department/', '/languages-department/', '/creative-arts-department/',
  '/social-sciences-department/', '/vocational-skills-department/',
  '/education-department/', '/mathematics-ict/',
  '/academic-calendar/', '/academic-programmes/', '/primary-education/', '/jhs-education/',
  '/alumni/', '/campus-life/', '/fees-schedule/',
  '/gallery/', '/policies/', '/counselling/', '/student_handbook/',
  '/news/', '/events/', '/contact-us/',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function slugFor(p) {
  const s = p.replace(/^\/|\/$/g, '');
  return (s === '' ? 'home' : s.replace(/\//g, '__'));
}

export async function fetchRaw(url, { retries = 4 } = {}) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(120000) });
      if (res.ok) return await res.text();
      // 404 in the archive is final; rate limits and 5xx are worth another go.
      if (res.status === 404) return null;
      console.log(`  retry ${i + 1} (HTTP ${res.status})`);
    } catch (e) {
      console.log(`  retry ${i + 1} (${e.message})`);
    }
    await sleep(3000 * (i + 1));
  }
  return null;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const report = [];

  for (const p of PAGES) {
    const slug = slugFor(p);
    const dest = path.join(OUT, `${slug}.html`);
    if (existsSync(dest) && (await readFile(dest, 'utf8')).length > 5000) {
      console.log(`skip  ${p}`);
      report.push({ path: p, slug, status: 'cached' });
      continue;
    }
    const url = `https://web.archive.org/web/${SNAP}id_/https://fosco.edu.gh${p}`;
    process.stdout.write(`get   ${p} ... `);
    const html = await fetchRaw(url);
    if (html && html.length > 1000) {
      await writeFile(dest, html, 'utf8');
      console.log(`ok (${Math.round(html.length / 1024)} KB)`);
      report.push({ path: p, slug, status: 'ok', bytes: html.length });
    } else {
      console.log('MISSING');
      report.push({ path: p, slug, status: 'missing' });
    }
    await sleep(1200);
  }

  await writeFile(path.join(OUT, '_report.json'), JSON.stringify(report, null, 2));
  const ok = report.filter((r) => r.status !== 'missing').length;
  console.log(`\nDONE: ${ok}/${report.length} pages retrieved`);
}

main();
