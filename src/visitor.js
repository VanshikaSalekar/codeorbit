const crypto = require('crypto');
const NAME = 'co_vid';
const sig = id => crypto.createHmac('sha256', process.env.SESSION_SECRET).update(id).digest('hex').slice(0, 24);
const same = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

// Returns the visitor id from a valid signed cookie, or null.
function read(req) {
  const c = (req.headers.cookie || '').split(/;\s*/).find(x => x.startsWith(NAME + '='));
  if (!c) return null;
  const [id, s] = c.slice(NAME.length + 1).split('.');
  return /^[a-f0-9]{32}$/.test(id || '') && s && same(s, sig(id)) ? id : null;
}
// Creates a new anonymous id and sets the cookie. Only called when someone clicks like.
function issue(res) {
  const id = crypto.randomBytes(16).toString('hex');
  res.cookie(NAME, `${id}.${sig(id)}`, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 24 * 730 });
  return id;
}
module.exports = { read, issue };