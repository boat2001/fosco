// Accurate screenshots via the Chrome DevTools Protocol. Unlike `--screenshot`,
// this sets a real device viewport, so mobile widths render (and capture) correctly.
// Usage: node scripts/screenshot.mjs <url> <width> <out.png> [--full]
import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const [, , url = 'http://localhost:4000/', widthArg = '1440', out = 'shot.png'] = process.argv;
const WIDTH = Number(widthArg);
const FULL = process.argv.includes('--full');
const MOBILE = WIDTH < 768;
const PORT = 9400 + (WIDTH % 100);
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const edge = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${process.env.TEMP}\\fosco-shot-${WIDTH}`,
  'about:blank',
]);

try {
  let target = null;
  for (let i = 0; i < 40 && !target; i++) {
    await sleep(400);
    try {
      const list = await (await fetch(`http://localhost:${PORT}/json`)).json();
      target = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
    } catch { /* not ready */ }
  }
  if (!target) throw new Error('DevTools endpoint unreachable');

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

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: WIDTH,
    height: MOBILE ? 844 : 1000,
    deviceScaleFactor: 1,
    mobile: MOBILE,
  });

  await send('Page.navigate', { url });
  await sleep(5000); // React render + image decode

  // --scroll=N jumps down the page before capturing, so a long page can be
  // reviewed in readable slices instead of one giant downscaled image.
  const scrollArg = process.argv.find((a) => a.startsWith('--scroll='));
  if (scrollArg) {
    const y = Number(scrollArg.split('=')[1]);
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${y})` });
    await sleep(1800); // let scroll-reveal animations settle
  }

  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: FULL,
  });

  await mkdir(path.dirname(path.resolve(out)), { recursive: true });
  await writeFile(out, Buffer.from(shot.data, 'base64'));

  const metrics = await send('Runtime.evaluate', {
    expression: `JSON.stringify({vw: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth})`,
    returnByValue: true,
  });
  console.log(`${out}  ${metrics.result.value}`);
  ws.close();
} finally {
  edge.kill();
}
