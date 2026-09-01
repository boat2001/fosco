// Parses the archived Elementor HTML into clean, structured JSON blocks that the
// React front-end and the SQLite seed both consume.
// Usage: node scripts/extract-content.mjs
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'node-html-parser';

const PAGES_DIR = path.join(process.cwd(), '.scrape', 'pages');
const OUT_DIR = path.join(process.cwd(), '.scrape', 'content');

const UPLOADS = 'degniboo';

/** Rewrites live upload URLs onto our locally hosted /media tree. */
function rewriteMedia(url = '') {
  if (!url) return '';
  let u = url.replace(/^\/\//, 'https://');
  const m = u.match(new RegExp(`/${UPLOADS}/(.+)$`));
  if (!m) return u;
  // Drop WordPress's generated size suffix so we point at the original we downloaded.
  return '/media/' + m[1].replace(/-\d+x\d+(\.(?:jpe?g|png|webp|gif|svg))$/i, '$1');
}

/** Turns an absolute FOSCO link into an app-relative route. */
function rewriteLink(href = '') {
  if (!href) return '';
  const u = href.replace(/^https?:\/\/(www\.)?fosco\.edu\.gh/i, '');
  if (/^https?:/i.test(u)) return u; // genuinely external
  return u || '/';
}

const clean = (s = '') => s.replace(/\s+/g, ' ').trim();

const decode = (s = '') =>
  s
    .replace(/&#8211;/g, '–').replace(/&#8212;/g, '—')
    .replace(/&#8216;|&#8217;/g, "'").replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#038;|&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d));

/** Strips Elementor/theme scaffolding out of a rich-text fragment. */
function sanitizeHtml(node) {
  if (!node) return '';
  const copy = parse(node.innerHTML || '');
  copy.querySelectorAll('script,style,noscript,iframe').forEach((n) => n.remove());
  copy.querySelectorAll('*').forEach((el) => {
    // Keep only attributes that carry meaning once the theme CSS is gone.
    for (const attr of Object.keys(el.attributes || {})) {
      if (attr === 'href') el.setAttribute('href', rewriteLink(el.getAttribute('href')));
      else if (attr === 'src') el.setAttribute('src', rewriteMedia(el.getAttribute('src')));
      else if (attr === 'alt') continue;
      else el.removeAttribute(attr);
    }
  });
  return decode(copy.innerHTML)
    .replace(/<p>\s*(?:&nbsp;)?\s*<\/p>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function widgetType(el) {
  return (el.getAttribute('data-widget_type') || '').split('.')[0];
}

/** Converts one Elementor widget into a portable content block. */
function widgetToBlock(el) {
  const type = widgetType(el);
  const box = el.querySelector('.elementor-widget-container') || el;

  switch (type) {
    case 'heading': {
      const h = box.querySelector('h1,h2,h3,h4,h5,h6,.elementor-heading-title');
      const text = decode(clean(h?.text || ''));
      if (!text) return null;
      const level = /^h([1-6])$/i.exec(h?.rawTagName || '')?.[1];
      return { type: 'heading', level: level ? +level : 2, text };
    }

    case 'wgl-double-headings': {
      const sub = decode(clean(box.querySelector('.subtitle, .wgl-subtitle, .double-headings-subtitle')?.text || ''));
      const title = decode(clean(box.querySelector('h1,h2,h3,h4,.title, .wgl-title')?.text || ''));
      if (!title && !sub) return null;
      return { type: 'sectionHeading', eyebrow: sub, text: title };
    }

    case 'text-editor': {
      const html = sanitizeHtml(box);
      if (!html) return null;
      return { type: 'richText', html };
    }

    case 'image':
    case 'wgl-image-animate': {
      const img = box.querySelector('img');
      if (!img) return null;
      const src = rewriteMedia(img.getAttribute('data-src') || img.getAttribute('src'));
      if (!src) return null;
      return { type: 'image', src, alt: decode(img.getAttribute('alt') || '') };
    }

    case 'wgl-info-box': {
      const title = decode(clean(box.querySelector('.info-box_title, h1,h2,h3,h4,h5,h6')?.text || ''));
      const desc = decode(clean(box.querySelector('.info-box_description, p')?.text || ''));
      const img = box.querySelector('img');
      const a = box.querySelector('a');
      if (!title && !desc) return null;
      return {
        type: 'infoBox',
        title,
        description: desc,
        image: img ? rewriteMedia(img.getAttribute('data-src') || img.getAttribute('src')) : '',
        href: a ? rewriteLink(a.getAttribute('href')) : '',
      };
    }

    case 'wgl-button':
    case 'button': {
      const a = box.querySelector('a');
      const text = decode(clean(box.querySelector('.button-content-wrapper, .elementor-button-text')?.text || a?.text || ''));
      if (!text) return null;
      return { type: 'button', text, href: a ? rewriteLink(a.getAttribute('href')) : '' };
    }

    case 'divider':
      return { type: 'divider' };

    default:
      return null; // spacer, menus, search, social icons — chrome we rebuild natively
  }
}

/** Pulls the page banner title and background image. */
function extractHero(root) {
  const header = root.querySelector('.page-header, .page-header_content');
  if (!header) return null;
  const title = decode(clean(header.querySelector('h1, .page-header_title')?.text || ''));
  const style = header.getAttribute('style') || '';
  const bg = /url\((['"]?)(.*?)\1\)/.exec(style)?.[2];
  return { title, image: bg ? rewriteMedia(bg) : '' };
}

async function extractPage(file) {
  const slug = path.basename(file, '.html');
  const html = await readFile(path.join(PAGES_DIR, file), 'utf8');
  const root = parse(html);

  const title = decode(clean(root.querySelector('title')?.text || '')).replace(/\s*[–-]\s*FOSCO.*$/i, '').trim();
  const metaDesc = root.querySelector('meta[name="description"]')?.getAttribute('content') || '';

  const main = root.querySelector('main#main') || root.querySelector('#main') || root;
  const blocks = [];
  for (const el of main.querySelectorAll('[data-widget_type]')) {
    const b = widgetToBlock(el);
    if (b) blocks.push(b);
  }

  // Collapse runs of identical text, an artefact of Elementor's duplicated mobile/desktop widgets.
  const deduped = [];
  for (const b of blocks) {
    const key = JSON.stringify(b);
    if (deduped.length && JSON.stringify(deduped[deduped.length - 1]) === key) continue;
    deduped.push(b);
  }

  return {
    slug,
    path: slug === 'home' ? '/' : `/${slug.replace(/__/g, '/')}/`,
    title,
    description: decode(metaDesc),
    hero: extractHero(root),
    blocks: deduped,
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const files = (await readdir(PAGES_DIR)).filter((f) => f.endsWith('.html'));

  const pages = [];
  for (const f of files) {
    try {
      const p = await extractPage(f);
      pages.push(p);
      console.log(`${p.slug.padEnd(42)} ${String(p.blocks.length).padStart(3)} blocks`);
    } catch (e) {
      console.log(`ERROR ${f}: ${e.message}`);
    }
  }

  await writeFile(path.join(OUT_DIR, 'pages.json'), JSON.stringify(pages, null, 2));
  console.log(`\nwrote ${pages.length} pages -> .scrape/content/pages.json`);
}

main();
