const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(process.env.DB_FILE || path.join(__dirname, '..', 'data.db'));
const ytId = url => (String(url || '').match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/) || [])[1] || '';
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS content(
  id INTEGER PRIMARY KEY, type TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL, summary TEXT NOT NULL, body TEXT DEFAULT '', url TEXT DEFAULT '',
  lang TEXT DEFAULT '', cat TEXT DEFAULT '', tags TEXT DEFAULT '', extra TEXT DEFAULT '',
  created TEXT DEFAULT CURRENT_TIMESTAMP);
  CREATE INDEX IF NOT EXISTS idx_type ON content(type);`);

db.exec(`CREATE TABLE IF NOT EXISTS messages(
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, message TEXT NOT NULL,
  created TEXT DEFAULT CURRENT_TIMESTAMP)`); 
  
db.exec(`CREATE TABLE IF NOT EXISTS likes(
  content_id INTEGER NOT NULL, visitor TEXT NOT NULL, created TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(content_id, visitor))`);
try { db.exec('ALTER TABLE content ADD COLUMN likes INTEGER NOT NULL DEFAULT 0'); } catch (e) { /* column already exists */ }

db.exec(`CREATE TABLE IF NOT EXISTS site_likes(visitor TEXT PRIMARY KEY, created TEXT DEFAULT CURRENT_TIMESTAMP)`);

const TYPES = ['tool', 'snippet', 'meme', 'post', 'video'];
const hydrate = r => r && ({ ...r,
  tags: r.tags ? r.tags.split(',').filter(Boolean) : [],
  panels: r.type === 'meme' ? r.extra.split('\n').filter(Boolean).map(l => l.split('|').map(s => s.trim())) : [],
  paras: r.type === 'post' ? r.body.split(/\n+/).filter(Boolean) : [],
  ytId: r.type === 'video' ? ytId(r.url) : '' });
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'item';
const cleanTags = t => [...new Set(String(t || '').toLowerCase().split(',').map(x => x.trim().replace(/[^a-z0-9+#.-]/g, '')).filter(Boolean))].join(',');

const q = {
  list: (type, { cat, limit = 100 } = {}) => db.prepare(
    `SELECT * FROM content WHERE type=? ${cat ? 'AND cat=?' : ''} ORDER BY created DESC, id DESC LIMIT ?`)
    .all(...[type, ...(cat ? [cat] : []), limit]).map(hydrate),
  cats: () => db.prepare(`SELECT DISTINCT cat FROM content WHERE type='tool' AND cat<>'' ORDER BY cat`).all().map(r => r.cat),
  bySlug: (type, slug) => hydrate(db.prepare('SELECT * FROM content WHERE type=? AND slug=?').get(type, slug)),
  byId: id => hydrate(db.prepare('SELECT * FROM content WHERE id=?').get(id)),
  all: () => db.prepare('SELECT * FROM content ORDER BY type, created DESC').all().map(hydrate),
  search(term) {
    const like = `%${term.replace(/[%_]/g, '')}%`;
    return db.prepare(`SELECT * FROM content WHERE title LIKE ? OR summary LIKE ? OR body LIKE ? OR tags LIKE ? LIMIT 60`)
      .all(like, like, like, like).map(hydrate);
  },
  related(item, n = 3) {
    if (!item.tags.length) return [];
    const cond = item.tags.map(() => 'tags LIKE ?').join(' OR ');
    return db.prepare(`SELECT * FROM content WHERE id<>? AND (${cond}) LIMIT ?`)
      .all(item.id, ...item.tags.map(t => `%${t}%`), n).map(hydrate);
  },
  save(type, f, id) {
    if (!TYPES.includes(type)) throw new Error('bad type');
    const v = { title: String(f.title || '').trim().slice(0, 140), summary: String(f.summary || '').trim().slice(0, 400),
      body: String(f.body || '').slice(0, 50000), url: /^https?:\/\//.test(f.url || '') ? f.url.trim() : '',
      lang: String(f.lang || '').slice(0, 12), cat: String(f.cat || '').trim().slice(0, 30),
      tags: cleanTags(f.tags), extra: type === 'meme' ? String(f.extra || '').slice(0, 1000) : '' };
    if (!v.title || !v.summary) throw new Error('Title and summary are required.');
    if (id) {
      db.prepare(`UPDATE content SET title=@title,summary=@summary,body=@body,url=@url,lang=@lang,cat=@cat,tags=@tags,extra=@extra WHERE id=@id`).run({ ...v, id });
      return id;
    }
    let slug = slugify(v.title);
    if (db.prepare('SELECT 1 FROM content WHERE slug=?').get(slug)) slug += '-' + Date.now().toString(36);
    return db.prepare(`INSERT INTO content(type,slug,title,summary,body,url,lang,cat,tags,extra) VALUES(@type,@slug,@title,@summary,@body,@url,@lang,@cat,@tags,@extra)`)
      .run({ ...v, type, slug }).lastInsertRowid;
  },
  saveMessage: ({ name, email, message }) =>
  db.prepare('INSERT INTO messages(name,email,message) VALUES(?,?,?)').run(name, email, message),
  messages: () => db.prepare('SELECT * FROM messages ORDER BY created DESC').all(),
  deleteMessage: id => db.prepare('DELETE FROM messages WHERE id=?').run(id),

    siteLikes: () => db.prepare('SELECT COUNT(*) c FROM site_likes').get().c,
  siteLiked: v => !!db.prepare('SELECT 1 FROM site_likes WHERE visitor=?').get(v),
  siteLike: v => { db.prepare('INSERT OR IGNORE INTO site_likes(visitor) VALUES(?)').run(v); return db.prepare('SELECT COUNT(*) c FROM site_likes').get().c; },

    likedBy: v => db.prepare('SELECT content_id FROM likes WHERE visitor=?').all(v).map(r => r.content_id),
  like: db.transaction((id, v) => {
    if (!db.prepare('SELECT 1 FROM content WHERE id=?').get(id)) return null;
    if (db.prepare('INSERT OR IGNORE INTO likes(content_id,visitor) VALUES(?,?)').run(id, v).changes)
      db.prepare('UPDATE content SET likes=likes+1 WHERE id=?').run(id);
    return db.prepare('SELECT likes FROM content WHERE id=?').get(id).likes;
  }),
  remove: id => { db.prepare('DELETE FROM likes WHERE content_id=?').run(id); db.prepare('DELETE FROM content WHERE id=?').run(id); }
};

if (db.prepare('SELECT COUNT(*) c FROM content').get().c === 0) require('./seed')(q);
module.exports = { ...q, TYPES };