const router = require('express').Router();
const db = require('../db');
const page = (res, view, data) => res.render(view, data);
const rateLimit = require('express-rate-limit');
const visitor = require('../visitor');

// Every public page knows which items this visitor already liked.
router.use((req, res, next) => {
  req.visitor = visitor.read(req);
  res.locals.liked = new Set(req.visitor ? db.likedBy(req.visitor) : []);
  res.locals.siteLikes = db.siteLikes();
  res.locals.siteLiked = req.visitor ? db.siteLiked(req.visitor) : false;
  next();
});
const likeLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many likes. Try again later.' } });

router.post('/api/like-site', likeLimit, (req, res) => {
  if (req.get('x-requested-with') !== 'fetch') return res.status(403).json({ error: 'Forbidden' });
  res.json({ likes: db.siteLike(req.visitor || visitor.issue(res)), liked: true });
});

router.post('/api/like/:id', likeLimit, (req, res) => {
  if (req.get('x-requested-with') !== 'fetch') return res.status(403).json({ error: 'Forbidden' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Bad id' });
  const likes = db.like(id, req.visitor || visitor.issue(res));
  if (likes === null) return res.status(404).json({ error: 'Not found' });
  res.json({ likes, liked: true });
});

router.get('/', (req, res) => page(res, 'home', {
  title: 'CodeOrbit: dev tools, snippets, memes and articles', active: 'home',
  desc: 'A bold directory of developer tools, copy-ready code snippets, programming memes that teach, and dev articles.',
  tools: db.list('tool', { limit: 4 }), snippet: db.list('snippet', { limit: 1 })[0],
  meme: db.list('meme', { limit: 1 })[0], posts: db.list('post', { limit: 3 }), toolCount: db.list('tool').length }));

router.get('/tools', (req, res) => page(res, 'tools', {
  title: 'Developer tools | CodeOrbit', active: 'tools', desc: 'Useful developer utilities worth bookmarking.',
  cats: db.cats(), cat: req.query.cat || '', tools: db.list('tool', { cat: req.query.cat }) }));

router.get('/snippets', (req, res) => page(res, 'snippets', {
  title: 'Code snippets | CodeOrbit', active: 'snippets', desc: 'Copy-ready code snippets for everyday problems.', items: db.list('snippet') }));

router.get('/memelearn', (req, res) => page(res, 'memes', {
  title: 'MemeLearn | CodeOrbit', active: 'memelearn', desc: 'Programming concepts explained through humor and comics.', items: db.list('meme') }));

router.get('/blog', (req, res) => page(res, 'blog', {
  title: 'Blog | CodeOrbit', active: 'blog', desc: 'Developer articles with a point of view.', posts: db.list('post') }));

router.get('/blog/:slug', (req, res, next) => {
  const post = db.bySlug('post', req.params.slug);
  if (!post) return next();
    page(res, 'post', { title: `${post.title} | CodeOrbit`, active: 'blog', desc: post.summary, ogType: 'article', post, related: db.related(post) });
});

router.get('/search', (req, res) => {
  const term = String(req.query.q || '').trim().slice(0, 80);
  page(res, 'search', { title: `Search${term ? ': ' + term : ''} | CodeOrbit`, active: 'search', desc: 'Search CodeOrbit.',
  term, noindex: !!term, results: term ? db.search(term) : [] });
});

router.get('/robots.txt', (req, res) => res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /search\nSitemap: ${(process.env.SITE_URL || '').replace(/\/$/, '')}/sitemap.xml\n`));
router.get('/sitemap.xml', (req, res) => {
  const base = (process.env.SITE_URL || '').replace(/\/$/, '');
  const fixed = ['/', '/tools', '/snippets', '/videos', '/memelearn', '/blog', '/about', '/contact', '/faq', '/terms', '/privacy-policy'].map(u => [u, '']);
  const posts = db.list('post').map(p => ['/blog/' + p.slug, p.created.slice(0, 10)]);
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...fixed, ...posts].map(([u, d]) => `<url><loc>${base}${u}</loc>${d ? `<lastmod>${d}</lastmod>` : ''}</url>`).join('')}</urlset>`);
});

router.get('/about', (req, res) => page(res, 'about', {
  title: 'About | CodeOrbit', active: '', desc: 'Why CodeOrbit exists and what you will find here.' }));

router.get('/contact', (req, res) => page(res, 'contact', {
  title: 'Contact | CodeOrbit', active: '', desc: 'Get in touch with CodeOrbit.',
  sent: req.query.sent === '1', error: '', values: { name: '', email: '', message: '' } }));

router.get('/videos', (req, res) => page(res, 'videos', {
  title: 'Videos | CodeOrbit', active: 'videos', desc: 'CodeOrbit video tutorials on YouTube.',
  items: db.list('video') }));  
 
router.get('/terms', (req, res) => page(res, 'terms', {
  title: 'Terms of Service | CodeOrbit', active: '', desc: 'The terms that govern your use of CodeOrbit.' }));  

router.get('/faq', (req, res) => page(res, 'faq', {
  title: 'FAQ | CodeOrbit', active: '', desc: 'Answers to common questions about CodeOrbit.' }));  

const contactLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });
router.post('/contact', contactLimit, (req, res) => {
  if (req.body.website) return res.redirect('/contact?sent=1');
  const v = { name: String(req.body.name || '').trim().slice(0, 100),
    email: String(req.body.email || '').trim().slice(0, 200),
    message: String(req.body.message || '').trim().slice(0, 2000) };
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email);
  if (!v.name || !emailOk || !v.message) {
    return res.status(400).render('contact', { title: 'Contact | CodeOrbit', active: '',
      desc: 'Get in touch with CodeOrbit.', sent: false,
      error: 'Please fill in every field with a valid email.', values: v });
  }
  db.saveMessage(v);
  res.redirect('/contact?sent=1');
});

router.get('/privacy-policy', (req, res) => page(res, 'privacy-policy', {
  title: 'Privacy Policy | CodeOrbit', active: '', desc: 'How CodeOrbit collects, uses and protects your information.' }));
module.exports = router;
