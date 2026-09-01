import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { router as contentRouter } from './routes/content.js';
import { router as adminRouter } from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const CLIENT_DIST = path.join(ROOT, 'client', 'dist');
const CLIENT_PUBLIC = path.join(ROOT, 'client', 'public');

const PORT = process.env.PORT || 4000;
const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        // React writes element styles through CSSOM, but the page still carries a
        // handful of style attributes that need this.
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        // The contact page embeds an OpenStreetMap view.
        frameSrc: ["'self'", 'https://www.openstreetmap.org'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
  })
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---- API -------------------------------------------------------------------

app.get('/api/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));
app.use('/api', contentRouter);
app.use('/api/admin', adminRouter);

app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown endpoint' }));

// ---- Static assets ---------------------------------------------------------

const YEAR = '31536000';

// Archive media and staff uploads are content-addressed by path and effectively immutable.
app.use(
  '/media',
  express.static(path.join(CLIENT_PUBLIC, 'media'), { maxAge: YEAR * 1000, immutable: true, fallthrough: true })
);
app.use('/uploads', express.static(path.join(CLIENT_PUBLIC, 'uploads'), { maxAge: 86400000 }));

// In production the built SPA is served from here; in dev, Vite handles it.
if (existsSync(CLIENT_DIST)) {
  app.use(
    express.static(CLIENT_DIST, {
      maxAge: YEAR * 1000,
      index: false,
      setHeaders(res, filePath) {
        // Hashed bundles cache forever; the HTML shell must always revalidate.
        if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache');
      },
    })
  );
  app.get('*', (req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
} else {
  app.get('*', (req, res) =>
    res.status(200).type('text').send('FOSCO API is running. Start the client with `npm run dev` and open http://localhost:5173')
  );
}

// ---- Errors ----------------------------------------------------------------

app.use((err, req, res, next) => {
  if (err?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File is larger than 8 MB.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side.' });
});

app.listen(PORT, () => {
  console.log(`FOSCO server listening on http://localhost:${PORT}`);
});
