// Finds elements wider than the viewport at a given width, using the Chrome
// DevTools Protocol over Node's built-in WebSocket.
// Usage: node scripts/find-overflow.mjs [url] [width]
import { spawn } from 'node:child_process';

const URL_ = process.argv[2] || 'http://localhost:4000/';
const WIDTH = Number(process.argv[3] || 390);
const PORT = 9333;
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const edge = spawn(EDGE, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${process.env.TEMP}\\fosco-cdp`,
  `--window-size=${WIDTH},1200`,
  URL_,
]);

try {
  // Wait for the debugging endpoint to come up.
  let target = null;
  for (let i = 0; i < 30 && !target; i++) {
    await sleep(500);
    try {
      const list = await (await fetch(`http://localhost:${PORT}/json`)).json();
      target = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
    } catch { /* not ready */ }
  }
  if (!target) throw new Error('could not reach DevTools endpoint');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });

  let id = 0;
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const msgId = ++id;
      const onMsg = (ev) => {
        const m = JSON.parse(ev.data);
        if (m.id === msgId) {
          ws.removeEventListener('message', onMsg);
          resolve(m.result);
        }
      };
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

  await sleep(4000); // let React render and images settle

  const expression = `
    (() => {
      const vw = document.documentElement.clientWidth;
      const offenders = [];

      // An element that sits inside a clipping ancestor cannot widen the page
      // (e.g. marquee tracks), so skip those to leave only genuine offenders.
      const isClipped = (el) => {
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const o = getComputedStyle(p);
          if (o.overflowX === 'hidden' || o.overflowX === 'clip' ||
              o.overflow === 'hidden' || o.overflow === 'clip') return true;
        }
        return false;
      };

      for (const el of document.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        if (isClipped(el)) continue;
        // Report only elements that actually extend past the viewport edge.
        if (r.right > vw + 1 || r.left < -1) {
          offenders.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className && el.className.baseVal !== undefined ? el.className.baseVal : String(el.className || '')).slice(0, 60),
            left: Math.round(r.left),
            right: Math.round(r.right),
            width: Math.round(r.width),
            text: (el.textContent || '').trim().slice(0, 40),
          });
        }
      }
      // The decisive test: can the user actually scroll sideways? scrollWidth
      // alone over-reports when overflow is clipped rather than removed.
      window.scrollTo(400, 0);
      const canScrollX = window.scrollX > 0;
      window.scrollTo(0, 0);

      return JSON.stringify({
        viewport: vw,
        canScrollX,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        count: offenders.length,
        // Widest first — the root cause is usually the biggest box.
        offenders: offenders.sort((a, b) => b.right - a.right).slice(0, 18),
      }, null, 2);
    })()
  `;

  const res = await send('Runtime.evaluate', { expression, returnByValue: true });
  console.log(res?.result?.value ?? JSON.stringify(res, null, 2));
  ws.close();
} finally {
  edge.kill();
}
