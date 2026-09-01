// Collects FOSCO news posts: walks the paginated /news/ listing, then fetches and
// parses each full article. Writes .scrape/content/news.json
// Usage: node scripts/scrape-news.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'node-html-parser';

const OUT_DIR = path.join(process.cwd(), '.scrape', 'content');
const RAW_DIR = path.join(process.cwd(), '.scrape', 'posts');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const UPLOADS = 'degniboo';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (s = '') => s.replace(/\s+/g, ' ').trim();

// Genuine posts the archived /news/ listing no longer paginates to, recovered from
// the homepage feed and the archive index.
const EXTRA_SLUGS = [
  '1986-post-middle-year-group-donates-furniture-to-fosco',
  'national-teachers-standards-to-guide-teacher-training-and-practice-launched',
  '15th-annual-congregation',
  '2019/11/27/oranging-the-fosco-community-off-campus',
  '2019/11/27/the-16-days-of-activism-against-gender-base-violence-continues-launching-and-candle-light-procession',
];

function rewriteMedia(url = '') {
  if (!url) return '';
  const u = url.replace(/^\/\//, 'https://');
  const m = u.match(new RegExp(`/${UPLOADS}/(.+)$`));
  if (!m) return u;
  return '/media/' + m[1].replace(/-\d+x\d+(\.(?:jpe?g|png|webp|gif|svg))$/i, '$1');
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * The theme renders only "12 Jun", with no year anywhere in the markup. WordPress
 * stores uploads under /YYYY/MM/, and a post's images are uploaded when it is
 * written — so the image path supplies the missing year. Prefer an image whose
 * month matches the rendered month; otherwise fall back to the earliest image year.
 */
function resolveDate(dayMonth, images = [], slug = '') {
  // Some posts live under a dated permalink: /2019/11/27/slug
  const fromSlug = slug.match(/^(\d{4})\/(\d{2})\/(\d{2})\//);
  if (fromSlug) return `${fromSlug[1]}-${fromSlug[2]}-${fromSlug[3]}`;

  const m = dayMonth.match(/(\d{1,2})\s*([A-Za-z]{3})/);
  if (!m) return '';
  const day = m[1].padStart(2, '0');
  const monIdx = MONTHS.indexOf(m[2].toLowerCase());
  if (monIdx < 0) return '';
  const mon = String(monIdx + 1).padStart(2, '0');

  const stamps = images
    .map((i) => i.match(/\/media\/(\d{4})\/(\d{2})\//))
    .filter(Boolean)
    .map((x) => ({ year: x[1], month: x[2] }));

  const exact = stamps.find((s) => s.month === mon);
  const year = exact?.year || stamps.sort((a, b) => a.year.localeCompare(b.year))[0]?.year;
  return year ? `${year}-${mon}-${day}` : '';
}

async function fetchArchived(url, cacheName) {
  const cachePath = path.join(RAW_DIR, cacheName);
  if (existsSync(cachePath)) {
    const cached = await readFile(cachePath, 'utf8');
    if (cached.length > 2000) return cached;
  }
  const archiveUrl = `https://web.archive.org/web/2026id_/${url}`;
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(archiveUrl, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(120000) });
      if (res.ok) {
        const html = await res.text();
        if (html.length > 2000) {
          await mkdir(RAW_DIR, { recursive: true });
          await writeFile(cachePath, html, 'utf8');
          return html;
        }
      }
      if (res.status === 404) return null;
    } catch { /* retry */ }
    await sleep(3000 * (i + 1));
  }
  return null;
}

/** Reads the post cards off one listing page. */
function parseListing(html) {
  const root = parse(html);
  const out = [];
  for (const card of root.querySelectorAll('.blog-post')) {
    const link = card.querySelector('.blog-post_title a, h2 a, h3 a');
    const href = link?.getAttribute('href') || '';
    if (!href || !/fosco\.edu\.gh/.test(href)) continue;
    const img = card.querySelector('.blog-post_media img, img');
    out.push({
      title: clean(link.text),
      url: href,
      slug: href.replace(/^https?:\/\/(www\.)?fosco\.edu\.gh\//, '').replace(/\/$/, ''),
      date: clean(card.querySelector('.post_date')?.text || ''),
      categories: card.querySelectorAll('.post_categories a').map((a) => clean(a.text)).filter(Boolean),
      image: img ? rewriteMedia(img.getAttribute('data-src') || img.getAttribute('src')) : '',
    });
  }
  return out;
}

/** Extracts the article body from a single post page. */
function parsePost(html) {
  const root = parse(html);
  const main = root.querySelector('main#main') || root;

  const title = clean(root.querySelector('h1, .blog-post_title')?.text || '');

  // The post body sits in the theme's content wrapper; fall back to Elementor text widgets.
  let bodyNode =
    main.querySelector('.blog-post_content .post_content') ||
    main.querySelector('.post_content') ||
    main.querySelector('.entry-content');

  let paragraphs = [];
  if (bodyNode) {
    bodyNode.querySelectorAll('script,style,noscript,.share_post-container,.post_meta-wrap').forEach((n) => n.remove());
    paragraphs = bodyNode.querySelectorAll('p')
      .map((p) => clean(p.text))
      .filter((t) => t.length > 30);
  }
  if (!paragraphs.length) {
    paragraphs = main.querySelectorAll('.elementor-widget-text-editor p')
      .map((p) => clean(p.text))
      .filter((t) => t.length > 30);
  }

  const images = [...new Set(
    (bodyNode || main).querySelectorAll('img')
      .map((i) => rewriteMedia(i.getAttribute('data-src') || i.getAttribute('src')))
      .filter((s) => s.startsWith('/media/') && !/shape_|logo|icon|avatar/i.test(s))
  )];

  // Posts reached directly (not via a listing card) carry their own meta.
  const date = clean(
    root.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
    root.querySelector('.post_date, time')?.text || ''
  );
  const categories = main.querySelectorAll('.post_categories a').map((a) => clean(a.text)).filter(Boolean);
  const ogImage = rewriteMedia(root.querySelector('meta[property="og:image"]')?.getAttribute('content') || '');

  return { title, paragraphs, images, date, categories, ogImage };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(RAW_DIR, { recursive: true });

  // Walk the listing pages until one yields nothing new.
  const cards = new Map();
  for (let page = 1; page <= 12; page++) {
    const url = page === 1 ? 'https://fosco.edu.gh/news/' : `https://fosco.edu.gh/news/page/${page}/`;
    process.stdout.write(`listing page ${page} ... `);
    const html = await fetchArchived(url, `listing-${page}.html`);
    if (!html) { console.log('none'); break; }
    const found = parseListing(html);
    const fresh = found.filter((c) => !cards.has(c.slug));
    fresh.forEach((c) => cards.set(c.slug, c));
    console.log(`${found.length} cards (${fresh.length} new)`);
    if (!fresh.length) break;
    await sleep(1200);
  }

  for (const slug of EXTRA_SLUGS) {
    if (cards.has(slug)) continue;
    cards.set(slug, {
      title: '', url: `https://fosco.edu.gh/${slug}/`, slug,
      date: '', categories: [], image: '',
    });
  }

  console.log(`\n${cards.size} distinct posts; fetching bodies...\n`);

  const posts = [];
  for (const card of cards.values()) {
    process.stdout.write(`  ${card.slug.slice(0, 55).padEnd(57)}`);
    const html = await fetchArchived(card.url, `${card.slug.replace(/[^a-z0-9-]/gi, '_')}.html`);
    if (!html) { console.log('MISSING'); continue; }
    const detail = parsePost(html);
    const image = card.image || detail.ogImage || detail.images[0] || '';
    const allImages = [...new Set([image, ...detail.images].filter(Boolean))];

    // Posts with neither prose nor imagery are archive stubs, not real content.
    if (!detail.paragraphs.length && !allImages.length) {
      console.log('empty - skipped');
      continue;
    }

    posts.push({
      slug: card.slug.replace(/^\d{4}\/\d{2}\/\d{2}\//, ''),
      title: detail.title || card.title,
      date: resolveDate(card.date || detail.date, allImages, card.slug),
      categories: card.categories.length ? card.categories : detail.categories,
      image,
      excerpt: detail.paragraphs[0]?.slice(0, 220) || '',
      body: detail.paragraphs,
      gallery: allImages,
    });
    console.log(`${detail.paragraphs.length} paras`);
    await sleep(900);
  }

  posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  await writeFile(path.join(OUT_DIR, 'news.json'), JSON.stringify(posts, null, 2));
  console.log(`\nwrote ${posts.length} posts -> .scrape/content/news.json`);
}

main();
