require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const compression = require('compression');
const SqliteStore = require('better-sqlite3-session-store')(session);
const Database = require('better-sqlite3');
const sessionDb = new Database(process.env.SESSION_DB || path.join(__dirname, 'sessions.db'));
sessionDb.pragma('journal_mode = WAL');

for (const k of ['SESSION_SECRET', 'ADMIN_PATH', 'ADMIN_PASSWORD_HASH'])
  if (!process.env[k]) { console.error(`Missing ${k}. Copy .env.example to .env and fill it in.`); process.exit(1); }
if (!/^\/[a-z0-9-]{8,}$/i.test(process.env.ADMIN_PATH)) { console.error('ADMIN_PATH must look like /studio-xxxxxx (8+ chars).'); process.exit(1); }

const app = express();
const prod = process.env.NODE_ENV === 'production';
if (prod) app.set('trust proxy', 1);
// Set FORCE_HTTPS=true once your host sends X-Forwarded-Proto.
if (process.env.FORCE_HTTPS === 'true') app.use((req, res, next) => req.secure ? next() : res.redirect(301, `https://${req.headers.host}${req.originalUrl}`));
app.use(compression());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ['https://fonts.gstatic.com'],
    scriptSrc: ["'self'", 'https://www.googletagmanager.com'],
    connectSrc: ["'self'", 'https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com'],
    imgSrc: ["'self'", 'data:', 'https://i.ytimg.com', 'https://*.google-analytics.com', 'https://*.googletagmanager.com'], formAction: ["'self'"] } },
  hsts: prod
}));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: prod ? '7d' : 0 }));
app.use(rateLimit({ windowMs: 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false }));
app.use(session({
  store: new SqliteStore({ client: sessionDb, expired: { clear: true, intervalMs: 15 * 60 * 1000 } }),
  name: 'co.sid', secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'strict', secure: prod, maxAge: 1000 * 60 * 60 * 4 }
}));
const { socials } = require('./src/config');
app.use((req, res, next) => {
  res.locals.siteLikes = null; res.locals.siteLiked = false; // real values are set for public pages
  res.locals.noindex = false; res.locals.base = ''; res.locals.socials = socials;
  res.locals.req = req; res.locals.siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '');
  res.locals.gaId = /^G-[A-Z0-9]{8,12}$/.test(process.env.GA_ID || '') && !/X{4,}/.test(process.env.GA_ID) ? process.env.GA_ID : ''; res.locals.siteVerification = process.env.SITE_VERIFICATION || '';
  next();
});
app.use(process.env.ADMIN_PATH, require('./src/routes/admin'));
app.use(require('./src/routes/public'));
app.use((req, res) => res.status(404).render('404', { title: 'Lost in orbit | CodeOrbit', active: '', desc: '' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).send('Something went wrong.'); });

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`CodeOrbit on http://localhost:${port}`));
