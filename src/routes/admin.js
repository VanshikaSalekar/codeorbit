const router = require('express').Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('../db');

const base = process.env.ADMIN_PATH;
const HASH = process.env.ADMIN_PASSWORD_HASH;
const login = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false,
  handler: (req, res) => res.status(429).render('admin/login', { error: 'Too many attempts. Try again in 15 minutes.' }) });

router.use((req, res, next) => {
  res.set('X-Robots-Tag', 'noindex, nofollow');
  res.set('Cache-Control', 'no-store');
  req.session.csrf ||= crypto.randomBytes(16).toString('hex');
  res.locals.csrf = req.session.csrf; res.locals.base = base; res.locals.title = 'Admin'; res.locals.active = ''; res.locals.desc = ''; res.locals.noindex = true;
  if (req.method === 'POST') {
    const a = Buffer.from(String(req.body._csrf || '')), b = Buffer.from(req.session.csrf);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(403).send('Invalid form token. Reload and try again.');
  }
  next();
});
const guard = (req, res, next) => req.session.admin ? next() : res.redirect(base + '/login');

router.get('/login', (req, res) => res.render('admin/login', { error: '' }));
router.post('/login', login, (req, res) => {
  if (!HASH || !bcrypt.compareSync(String(req.body.password || ''), HASH)) return res.status(401).render('admin/login', { error: 'Wrong password.' });
  const csrf = req.session.csrf;
  req.session.regenerate(() => { req.session.admin = true; req.session.csrf = csrf; res.redirect(base); });
});
router.post('/logout', guard, (req, res) => req.session.destroy(() => res.redirect('/')));

router.get('/', guard, (req, res) => res.render('admin/dash', { items: db.all() }));
router.get('/new/:type', guard, (req, res, next) => db.TYPES.includes(req.params.type)
  ? res.render('admin/form', { type: req.params.type, item: null, error: '' }) : next());
router.post('/new/:type', guard, (req, res) => {
  try { db.save(req.params.type, req.body); res.redirect(base); }
  catch (e) { res.status(400).render('admin/form', { type: req.params.type, item: { ...req.body, tags: [] }, error: e.message }); }
});
router.get('/edit/:id', guard, (req, res, next) => {
  const item = db.byId(req.params.id);
  return item ? res.render('admin/form', { type: item.type, item, error: '' }) : next();
});
router.post('/edit/:id', guard, (req, res, next) => {
  const item = db.byId(req.params.id);
  if (!item) return next();
  try { db.save(item.type, req.body, item.id); res.redirect(base); }
  catch (e) { res.status(400).render('admin/form', { type: item.type, item: { ...req.body, id: item.id, tags: [] }, error: e.message }); }
});
router.post('/delete/:id', guard, (req, res) => { db.remove(req.params.id); res.redirect(base); });
router.get('/messages', guard, (req, res) => res.render('admin/messages', { messages: db.messages() }));
router.post('/messages/delete/:id', guard, (req, res) => { db.deleteMessage(req.params.id); res.redirect(base + '/messages'); });
module.exports = router;
