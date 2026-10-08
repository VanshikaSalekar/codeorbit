document.addEventListener('click', e => {
  const b = e.target.closest('.cp');
  if (!b) return;
  const code = document.getElementById(b.dataset.target);
  navigator.clipboard.writeText(code.textContent).then(() => toast('Copied'), () => toast('Copy blocked. Select the code instead.'));
});
document.addEventListener('submit', e => {
  const m = e.target.dataset.confirm;
  if (m && !confirm(m)) e.preventDefault();
});
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 1600);
}

/* Cookie consent + Google Analytics (loads only after "Accept") */
(function () {
  const KEY = 'co_consent';
  const gaId = (document.querySelector('meta[name="ga-id"]') || {}).content;
  const get = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const set = v => { try { localStorage.setItem(KEY, v); } catch (e) {} };
  function loadGA() {
    if (!gaId || window.__gaLoaded) return;
    window.__gaLoaded = true;
    const s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', gaId, { anonymize_ip: true });
  }
  function banner() {
    if (document.getElementById('consent')) return;
    const d = document.createElement('div');
    d.id = 'consent'; d.className = 'consent'; d.setAttribute('role', 'region'); d.setAttribute('aria-label', 'Cookie consent');
    d.innerHTML = '<p><strong>Cookies?</strong> We use Google Analytics to see which pages help people. It only runs if you accept. <a href="/privacy-policy">Details</a></p>' +
      '<div><button type="button" class="btn" data-c="yes">Accept</button><button type="button" class="btn pk" data-c="no">Decline</button></div>';
    d.addEventListener('click', e => {
      const c = e.target.dataset.c; if (!c) return;
      set(c); d.remove();
      if (c === 'yes') loadGA();
    });
    document.body.appendChild(d);
    d.querySelector('button').focus({ preventScroll: true });
  }
  document.addEventListener('click', e => { if (e.target.closest('[data-cookie-settings]')) banner(); });
  document.addEventListener('DOMContentLoaded', () => {
    const c = get();
    if (c === 'yes') loadGA();
    else if (!c && !location.pathname.startsWith('/studio')) banner();
  });
})();


/* Like buttons: one like per visitor, stored on the server */
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-like]');
  if (!b || b.disabled) return;
  b.disabled = true;
  try {
    const r = await fetch('/api/like/' + b.dataset.like, { method: 'POST', headers: { 'X-Requested-With': 'fetch' } });
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    document.querySelectorAll('[data-like="' + b.dataset.like + '"]').forEach(x => {
      x.classList.add('is-liked'); x.disabled = true; x.setAttribute('aria-pressed', 'true');
      x.querySelector('.n').textContent = d.likes;
    });
  } catch (err) { b.disabled = false; toast('Could not save your like. Try again.'); }
});

/* Site-wide like (navbar) */
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-like-site]');
  if (!b || b.disabled) return;
  b.disabled = true;
  try {
    const r = await fetch('/api/like-site', { method: 'POST', headers: { 'X-Requested-With': 'fetch' } });
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    b.classList.add('is-liked'); b.setAttribute('aria-pressed', 'true'); b.setAttribute('aria-label', 'You liked CodeOrbit');
    b.querySelector('.n').textContent = d.likes;
    toast('Thanks for the love!');
  } catch (err) { b.disabled = false; toast('Could not save your like. Try again.'); }
});
/* Share buttons: native share sheet on touch devices, link menu elsewhere */
(function () {
  let menu = null, opener = null;
  function close(refocus) {
    if (!menu) return;
    menu.remove(); menu = null;
    if (opener) { opener.setAttribute('aria-expanded', 'false'); if (refocus) opener.focus(); opener = null; }
  }
  const track = (method, b) => { if (window.gtag) gtag('event', 'share', { method: method, content_type: 'page', item_id: b.dataset.url }); };
  function open(b, title, url) {
    close(false);
    const enc = encodeURIComponent, t = enc(title), u = enc(url);
    const items = [
      ['WhatsApp', 'https://wa.me/?text=' + enc(title + ' ' + url)],
      ['X (Twitter)', 'https://twitter.com/intent/tweet?text=' + t + '&url=' + u],
      ['LinkedIn', 'https://www.linkedin.com/sharing/share-offsite/?url=' + u],
      ['Facebook', 'https://www.facebook.com/sharer/sharer.php?u=' + u],
      ['Reddit', 'https://www.reddit.com/submit?url=' + u + '&title=' + t],
      ['Email', 'mailto:?subject=' + t + '&body=' + enc(title + '\n' + url)]
    ];
    menu = document.createElement('div');
    menu.className = 'sharemenu'; menu.setAttribute('role', 'dialog'); menu.setAttribute('aria-label', 'Share ' + title);
    const copy = document.createElement('button');
    copy.type = 'button'; copy.textContent = 'Copy link';
    copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(url); toast('Link copied'); track('copy', b); }
      catch (err) { toast('Copy blocked. Copy the address bar instead.'); }
      close(true);
    });
    menu.appendChild(copy);
    items.forEach(([name, href]) => {
      const a = document.createElement('a');
      a.href = href; a.textContent = name;
      if (!href.startsWith('mailto:')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      a.addEventListener('click', () => { track(name, b); close(false); });
      menu.appendChild(a);
    });
    document.body.appendChild(menu);
    const r = b.getBoundingClientRect(), w = menu.offsetWidth, vw = document.documentElement.clientWidth;
    menu.style.top = (window.scrollY + r.bottom + 8) + 'px';
    menu.style.left = Math.max(8, Math.min(r.left, vw - w - 8)) + window.scrollX + 'px';
    b.setAttribute('aria-expanded', 'true'); opener = b;
    copy.focus({ preventScroll: true });
  }
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-share]');
    if (!b) { if (menu && !e.target.closest('.sharemenu')) close(false); return; }
    e.preventDefault();
    if (menu && opener === b) return close(true);
    const url = new URL(b.dataset.url, location.href).href, title = b.dataset.title;
    if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
      try { await navigator.share({ title: title, text: title, url: url }); track('native', b); } catch (err) { /* cancelled */ }
      return;
    }
    open(b, title, url);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(true); });
  window.addEventListener('resize', () => close(false));
})();
