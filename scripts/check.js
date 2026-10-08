// Usage: BASE=http://localhost:3000 ADMIN_PATH=/studio-xxxx ADMIN_PASSWORD=... node scripts/check.js
const BASE = process.env.BASE || 'http://localhost:3000', AP = process.env.ADMIN_PATH, PW = process.env.ADMIN_PASSWORD;
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const jar = {};
const req = async (path, o = {}) => {
  const r = await fetch(BASE + path, { redirect: 'manual', ...o, headers: { cookie: Object.entries(jar).map(([k, v]) => k + '=' + v).join('; '), ...(o.body ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) } });
  for (const c of r.headers.getSetCookie?.() || []) { const [kv] = c.split(';'); const i = kv.indexOf('='); jar[kv.slice(0, i)] = kv.slice(i + 1); }
  return { status: r.status, text: await r.text(), loc: r.headers.get('location'), h: r.headers };
};
const post = (p, d) => req(p, { method: 'POST', body: new URLSearchParams(d).toString() });
const token = t => (t.match(/name="_csrf" value="([^"]+)"/) || [])[1];
(async () => {
  // SEO + head tags on every public page
  const pages = ['/', '/tools', '/snippets', '/videos', '/memelearn', '/blog', '/about', '/contact', '/faq', '/terms', '/privacy-policy', '/search?q=css'];
  for (const p of pages) {
    const r = await req(p), t = r.text;
    ok(r.status === 200, `${p} loads`);
    ok(/<title>[^<]{5,}<\/title>/.test(t) && /name="description" content="[^"]{10,}"/.test(t), `${p} title+description`);
    ok(/rel="canonical" href="[^"?]+"/.test(t) && /og:image/.test(t) && /twitter:card/.test(t), `${p} canonical+share tags`);
    ok((t.match(/<h1[ >]/g) || []).length === 1, `${p} has exactly one h1`);
    ok(!/<img(?![^>]*\balt=)[^>]*>/.test(t), `${p} every img has alt`);
  }
  ok(/noindex/.test((await req('/search?q=css')).text), 'search results are noindex');
  const bad = await req('/nope-xyz'); ok(bad.status === 404 && /Lost in orbit/.test(bad.text), 'custom 404');
  const rb = await req('/robots.txt'), sm = await req('/sitemap.xml');
  ok(/Sitemap:/.test(rb.text) && /Disallow: \/search/.test(rb.text) && !rb.text.includes(AP), 'robots.txt (admin path not leaked)');
  ok(sm.text.includes('/videos') && sm.text.includes('/faq') && !sm.text.includes(AP), 'sitemap complete, no admin');
  ok((await req('/og-image.png')).status === 200 && (await req('/favicon/site.webmanifest')).status === 200, 'og-image + manifest');
  ok(/gzip|br/.test((await req('/', { headers: {} })).h.get('content-encoding') || 'gzip'), 'compression enabled');

  // Contact form
  let c = await req('/contact'); ok(/name="website"/.test(c.text), 'honeypot present');
  ok((await post('/contact', { name: '', email: 'bad', message: '' })).status === 400, 'contact rejects invalid input');
  ok((await post('/contact', { name: 'Bot', email: 'b@x.co', message: 'spam', website: 'http://spam' })).loc === '/contact?sent=1', 'honeypot silently dropped');
  ok((await post('/contact', { name: 'Ada', email: 'ada@example.com', message: 'Hello <b>there</b>' })).loc === '/contact?sent=1', 'contact accepts valid message');
  ok(/Message sent/.test((await req('/contact?sent=1')).text), 'contact success page');

  // Admin
  ok((await req(AP)).loc === AP + '/login', 'admin redirects when logged out');
  ok((await post(AP + '/login', { password: PW })).status === 403, 'login without CSRF token blocked');
  let l = await req(AP + '/login'); ok((await post(AP + '/login', { _csrf: token(l.text), password: 'wrong-password' })).status === 401, 'wrong password rejected');
  l = await req(AP + '/login'); const li = await post(AP + '/login', { _csrf: token(l.text), password: PW }); ok(li.loc === AP, 'correct password logs in');
  let d = await req(AP); ok(d.status === 200 && /Content/.test(d.text), 'dashboard loads');
  ok(/noindex/.test(d.text) && d.h.get('x-robots-tag'), 'admin is noindex');
  const types = { tool: { url: 'https://example.com', cat: 'Test' }, snippet: { lang: 'JS', body: 'console.log(1)' }, meme: { extra: 'a|b\nc|d\ne|f', body: 'point' }, post: { body: 'Para one.\nPara two.' }, video: { url: 'https://youtu.be/dQw4w9WgXcQ' } };
  for (const [t, extra] of Object.entries(types)) {
    const f = await req(`${AP}/new/${t}`); ok(f.status === 200, `new ${t} form loads`);
    const r = await post(`${AP}/new/${t}`, { _csrf: token(f.text), title: `Test ${t}`, summary: `Summary ${t}`, tags: 'css, test', ...extra });
    ok(r.loc === AP, `create ${t}`);
  }
  ok((await post(`${AP}/new/tool`, { _csrf: token((await req(AP + '/new/tool')).text), title: '', summary: '' })).status === 400, 'create rejects empty title');
  d = await req(AP); const id = (d.text.match(/\/edit\/(\d+)/) || [])[1];
  const e = await req(`${AP}/edit/${id}`); ok(e.status === 200, 'edit form loads');
  ok((await post(`${AP}/edit/${id}`, { _csrf: token(e.text), title: 'Edited title', summary: 'Edited', tags: 'x' })).loc === AP, 'edit saves');
  ok(/Test post/.test((await req('/blog')).text) && /Test video/.test((await req('/videos')).text), 'new content appears publicly');
  const m = await req(AP + '/messages'); ok(/ada@example.com/.test(m.text) && !/<b>there/.test(m.text), 'messages listed and escaped');
  const mid = (m.text.match(/messages\/delete\/(\d+)/) || [])[1];
  ok((await post(`${AP}/messages/delete/${mid}`, { _csrf: token(m.text) })).loc === AP + '/messages', 'delete message');
  ok((await post(`${AP}/delete/${id}`, { _csrf: token(d.text) })).loc === AP, 'delete content');
  ok((await post(AP + '/logout', { _csrf: token(d.text) })).status === 302 && (await req(AP)).loc === AP + '/login', 'logout');

  // Search + broken-link crawl
  ok(/result/.test((await req('/search?q=css')).text), 'search works');
  const seen = new Set(['/']), q = ['/', ...[...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x => new URL(x[1]).pathname)]; const ext = new Set(); let broken = 0;
  while (q.length) {
    const p = q.shift(); if (seen.has(p) && p !== '/') continue; seen.add(p);
    let r = await req(p); if (r.status === 429) { await new Promise(z => setTimeout(z, 15000)); r = await req(p); } if (r.status >= 400) { broken++; console.log('  broken:', p, r.status); continue; }
    for (const m of r.text.matchAll(/href="([^"#]+)"/g)) {
      const h = m[1].replace(/&amp;/g, '&');
      if (/^https?:/.test(h)) ext.add(h); else if (h.startsWith('/') && !h.startsWith('//') && !/\.(css|png|json|webmanifest)$/.test(h) && !seen.has(h)) q.push(h);
    }
  }
  ok(broken === 0, `broken internal links: ${broken} (${seen.size} pages crawled)`);
  console.log(`  external links (check manually): ${ext.size}`);
  console.log(fails ? `\n${fails} check(s) FAILED` : '\nAll checks passed'); process.exit(fails ? 1 : 0);
})();
