// End-to-end smoke test against a running server (npm start).
// Usage: node scripts/smoke-test.mjs
const BASE = process.env.BASE || 'http://localhost:4000';

let pass = 0;
let fail = 0;
let cookie = '';

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  const data = res.headers.get('content-type')?.includes('json') ? await res.json().catch(() => null) : null;
  return { status: res.status, data };
}

function check(label, condition, detail = '') {
  if (condition) {
    pass++;
    console.log(`  PASS  ${label}`);
  } else {
    fail++;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

console.log('\nPublic API');
const health = await call('GET', '/api/health');
check('health responds', health.status === 200 && health.data?.ok);

const news = await call('GET', '/api/news');
check('news list returns posts', news.data?.items?.length > 0, `got ${news.data?.items?.length}`);
check('news posts have resolved images', news.data.items.every((p) => !p.image || p.image.startsWith('/media/')));
check('news posts are date-sorted', news.data.items[0].date >= news.data.items[news.data.items.length - 1].date);

const page = await call('GET', '/api/pages/about-us');
check('page returns parsed blocks', Array.isArray(page.data?.blocks) && page.data.blocks.length > 0);

const gallery = await call('GET', '/api/gallery');
check('gallery has curated albums', gallery.data?.albums?.length === 2, JSON.stringify(gallery.data?.albums));

check('unknown page 404s', (await call('GET', '/api/pages/does-not-exist')).status === 404);
check('unknown endpoint 404s', (await call('GET', '/api/nope')).status === 404);

console.log('\nContact form');
check('rejects empty submission', (await call('POST', '/api/contact', {})).status === 400);
check('rejects malformed email', (await call('POST', '/api/contact', { name: 'A', email: 'bad', message: 'hi there' })).status === 400);
const sent = await call('POST', '/api/contact', {
  name: 'Smoke Test', email: 'smoke@example.com', message: 'Automated smoke test message.',
});
check('accepts a valid submission', sent.status === 201);

console.log('\nAdmin auth');
check('admin news blocked when signed out', (await call('GET', '/api/admin/news')).status === 401);
check('rejects wrong password', (await call('POST', '/api/admin/login', { username: 'admin', password: 'wrong' })).status === 401);

const login = await call('POST', '/api/admin/login', {
  username: process.env.ADMIN_USER || 'admin',
  password: process.env.ADMIN_PASSWORD || 'fosco-admin',
});
check('signs in with correct credentials', login.status === 200, JSON.stringify(login.data));

console.log('\nAdmin CRUD');
const list = await call('GET', '/api/admin/news');
check('lists news when signed in', list.status === 200 && Array.isArray(list.data));

const created = await call('POST', '/api/admin/news', {
  title: 'Smoke Test Article', date: '2026-01-01', excerpt: 'Temporary.',
  categories: ['College News'], body: 'First paragraph.\n\nSecond paragraph.', published: true,
});
check('creates an article', created.status === 201 && created.data?.id, JSON.stringify(created.data));
check('splits body into paragraphs', created.data?.body?.length === 2);

const publicCheck = await call('GET', `/api/news/${created.data.slug}`);
check('new article is publicly visible', publicCheck.status === 200);

const updated = await call('PUT', `/api/admin/news/${created.data.id}`, { published: false });
check('unpublishes an article', updated.status === 200 && updated.data.published === false);
check('unpublished article is hidden publicly', (await call('GET', `/api/news/${created.data.slug}`)).status === 404);

check('deletes the article', (await call('DELETE', `/api/admin/news/${created.data.id}`)).status === 200);
check('deleted article is gone', (await call('GET', `/api/news/${created.data.slug}`)).status === 404);

const messages = await call('GET', '/api/admin/messages');
check('contact message was stored', messages.data?.some((m) => m.email === 'smoke@example.com'));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
