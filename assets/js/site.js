/* navyashah.me — shared behaviour. No build step, no dependencies. */

// Highlights unconfirmed facts (.verify) and missing numbers (.todo) with a pill to step through them.
// Set to false once every highlighted item is resolved, before the site goes live.
const DRAFT = false;

document.documentElement.classList.add('js');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Display typeface tester: add ?type=fraunces or ?type=instrument to any URL ── */
(function typeTester() {
  const pick = new URLSearchParams(location.search).get('type');
  const options = {
    bodoni: ['Bodoni+Moda:ital,opsz,wght@0,6..96,400..600;1,6..96,400..600', "'Bodoni Moda', serif"],
    fraunces: ['Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600', "'Fraunces', serif"],
    instrument: ['Instrument+Serif:ital@0;1', "'Instrument Serif', serif"],
  };
  if (!pick || !options[pick]) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${options[pick][0]}&display=swap`;
  document.head.appendChild(link);
  document.documentElement.style.setProperty('--display', options[pick][1]);
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (href && href.endsWith('.html') || /\.html#/.test(href || '')) {
      const [path, hash] = href.split('#');
      a.setAttribute('href', `${path}?type=${pick}${hash ? '#' + hash : ''}`);
    }
  });
})();

/* ── Nav border on scroll ── */
const nav = document.querySelector('.nav');
if (nav) {
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ── Hero load sequence ── */
requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('loaded')));

/* ── Image slots: show the real image if the file exists, otherwise a labelled placeholder ── */
function buildShot(fig) {
  if (fig.dataset.built) return;
  fig.dataset.built = '1';
  const title = fig.dataset.title || '';
  const ph = document.createElement('div');
  ph.className = 'ph';
  ph.innerHTML =
    (fig.dataset.tag ? `<span class="ph-tag">${fig.dataset.tag}</span>` : '') +
    `<span class="ph-title">${title}</span>` +
    (fig.dataset.img ? `<code>${fig.dataset.img.replace(/^(\.\.\/)+/, '')}</code>` : '');
  fig.prepend(ph);
  if (!fig.dataset.img) return;
  // The img sits in the page (hidden) so lazy loading works; it shows once it loads.
  const img = document.createElement('img');
  img.alt = fig.dataset.alt || title;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.onload = () => fig.classList.add('has-img');
  img.onerror = () => img.remove();
  img.src = fig.dataset.img;
  fig.prepend(img);
}
document.querySelectorAll('.shot').forEach(buildShot);

/* ── Rotating badges: <a class="badge" data-text="Try it"> ── */
document.querySelectorAll('.badge').forEach((b, i) => {
  const text = (b.dataset.text || 'View') + ' · ';
  const repeated = text.repeat(Math.max(2, Math.round(28 / text.length)));
  const id = `badge-path-${i}`;
  const arrow = b.classList.contains('try')
    ? '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 2.5v11l9-5.5z"/></svg>'
    : '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5"/></svg>';
  b.innerHTML = `
    <svg class="ring" viewBox="0 0 100 100" aria-hidden="true">
      <defs><path id="${id}" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0"/></defs>
      <text><textPath href="#${id}" textLength="236">${repeated}</textPath></text>
    </svg>
    <span class="core">${arrow}</span>`;
  if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', b.dataset.text || 'Open');
});

/* ── Reveal on scroll (used sparingly) ── */
if (!reduceMotion && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
}

/* ── Opt-in switcher: the same banner used for the launch flips classic ↔ new ── */
document.querySelectorAll('.optin').forEach(box => {
  const msg = box.querySelector('[data-msg]');
  const btn = box.querySelector('[data-toggle]');
  const copy = {
    classic: ['You’re using the classic view.', 'Try the new one'],
    new: ['You’re on the new Ren.', 'Go back to classic'],
  };
  const set = view => {
    box.dataset.view = view;
    msg.textContent = copy[view][0];
    btn.textContent = copy[view][1];
    btn.className = view === 'classic' ? 'btn small' : 'btn ghost small';
  };
  btn.addEventListener('click', () => set(box.dataset.view === 'classic' ? 'new' : 'classic'));
  set(box.dataset.view || 'classic');
});

/* ── Segmented controls that just set data-state on a target ── */
document.querySelectorAll('[data-seg-target]').forEach(seg => {
  const target = document.getElementById(seg.dataset.segTarget);
  const buttons = [...seg.querySelectorAll('button')];
  const select = btn => {
    buttons.forEach(b => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
    target.dataset.state = btn.dataset.value;
    target.dispatchEvent(new CustomEvent('statechange', { detail: btn.dataset.value }));
  };
  buttons.forEach(b => b.addEventListener('click', () => select(b)));
  select(buttons.find(b => b.getAttribute('aria-pressed') === 'true') || buttons[0]);
});

/* ── Screen wall: <div id="wall" data-src="screens-json-id"> ── */
(function screenWall() {
  const wall = document.getElementById('wall');
  const data = document.getElementById('screens-data');
  if (!wall || !data) return;
  const screens = JSON.parse(data.textContent);
  const base = wall.dataset.base || '';
  const slug = s => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  screens.forEach(s => {
    const file = `${base}${s.platform}-${slug(s.name)}.png`;
    const li = document.createElement('div');
    li.className = s.platform;
    li.dataset.platform = s.platform;
    li.innerHTML = `
      <button type="button" aria-label="Enlarge: ${s.name} (${s.platform})">
        <figure class="shot" data-img="${file}" data-title="${s.name}" data-alt="${s.name}, ${s.platform} screen"></figure>
        <div class="tile-name">${s.name}<span>${s.group}</span></div>
      </button>`;
    wall.appendChild(li);
    buildShot(li.querySelector('.shot'));
    li.querySelector('button').addEventListener('click', () => openLightbox(s, file));
  });

  const counts = { all: screens.length, desktop: 0, mobile: 0 };
  screens.forEach(s => counts[s.platform]++);
  const countEl = document.getElementById('wall-count');
  const filter = document.getElementById('wall-filter-state');
  const apply = value => {
    wall.querySelectorAll('[data-platform]').forEach(el => { el.hidden = value !== 'all' && el.dataset.platform !== value; });
    if (countEl) countEl.textContent = `${counts[value]} screens`;
  };
  filter && filter.addEventListener('statechange', e => apply(e.detail));
  apply('all');

  const lb = document.getElementById('lightbox');
  function openLightbox(s, file) {
    if (!lb) return;
    lb.querySelector('.lb-title').textContent = `${s.name} · ${s.platform}`;
    const holder = lb.querySelector('.lb-shot');
    holder.innerHTML = `<figure class="shot ${s.platform === 'mobile' ? 'contain' : ''}" data-img="${file}" data-title="${s.name}" data-tag="${s.group}"></figure>`;
    buildShot(holder.firstElementChild);
    lb.showModal();
  }
  lb && lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('[data-close]')) lb.close(); });
})();

/* ── Draft notes pill ── */
(function draftNotes() {
  if (!DRAFT) return;
  const items = [...document.querySelectorAll('.todo, .verify')];
  if (!items.length) return;
  document.body.classList.add('draft');
  items.forEach(el => { if (el.dataset.note && !el.title) el.title = el.dataset.note; });
  const todos = items.filter(el => el.classList.contains('todo')).length;
  const verifies = items.length - todos;
  const pill = document.createElement('div');
  pill.className = 'draft-pill';
  pill.setAttribute('role', 'region');
  pill.setAttribute('aria-label', 'Draft notes');
  pill.innerHTML = `
    <span class="full"><span class="k" style="background:#FFE9A8"></span>${todos} to fill &nbsp;<span class="k" style="background:#E3E6FF"></span>${verifies} to confirm</span>
    <button type="button" data-next>Next</button>
    <button type="button" data-min aria-label="Hide draft highlights">Hide</button>`;
  document.body.appendChild(pill);
  let i = -1;
  pill.querySelector('[data-next]').addEventListener('click', () => {
    i = (i + 1) % items.length;
    const el = items[i];
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  });
  pill.querySelector('[data-min]').addEventListener('click', e => {
    const on = document.body.classList.toggle('draft');
    pill.classList.toggle('min', !on);
    e.target.textContent = on ? 'Hide' : 'Draft';
  });
})();

/* ── Case study table of contents: highlight the section you're reading ── */
(function tocSpy() {
  const links = [...document.querySelectorAll('.toc a[href^="#"]')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const sections = [...byId.keys()].map(id => document.getElementById(id)).filter(Boolean);
  const visible = new Set();
  const set = id => {
    links.forEach(a => a.classList.toggle('active', a === byId.get(id)));
    const a = byId.get(id), bar = a && a.closest('.toc');
    if (bar && bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: a.offsetLeft - bar.clientWidth / 2 + a.offsetWidth / 2 });
  };
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id));
    const first = sections.find(s => visible.has(s.id));
    if (first) set(first.id);
  }, { rootMargin: '-20% 0px -65% 0px' });
  sections.forEach(s => io.observe(s));
})();

/* ── Project cards: a "View case study" pill follows the cursor over the image ── */
document.querySelectorAll('.pcard-media').forEach(media => {
  const pill = media.querySelector('.pcard-pill');
  if (!pill || !window.matchMedia('(hover: hover)').matches) return;
  media.addEventListener('pointermove', e => {
    const r = media.getBoundingClientRect();
    pill.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px) translate(-50%, -50%)`;
  });
});

/* ── Hero: dot grid; the pointer sends orange ripples through it ── */
(function rippleGrid() {
  const hero = document.querySelector('.hero'), cv = hero && hero.querySelector('.hero-grid');
  if (!cv) return;
  const ctx = cv.getContext('2d'), GAP = 28, SPEED = 0.32, LIFE = 1800, BAND = 46;
  let w, h, dpr, dots = [], waves = [], last = 0, lx = -999, ly = -999, raf = 0;
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2); w = hero.clientWidth; h = hero.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); dots = [];
    for (let y = GAP / 2; y < h; y += GAP) for (let x = GAP / 2; x < w; x += GAP) dots.push([x, y]);
    draw(performance.now());
  }
  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    waves = waves.filter(v => t - v.t < LIFE);
    for (const [x, y] of dots) {
      let e = 0;
      for (const v of waves) {
        const age = t - v.t, r = age * SPEED, d = Math.hypot(x - v.x, y - v.y), k = 1 - Math.abs(d - r) / BAND;
        if (k > 0) e = Math.max(e, k * (1 - age / LIFE) * v.s);
      }
      const fade = Math.min(1, (h - y) / (h * .35) + .25);
      ctx.fillStyle = e > 0.02 ? `rgba(234,88,12,${Math.min(1, 0.45 + e) * fade})` : `rgba(35,35,35,${.26 * fade})`;
      ctx.beginPath(); ctx.arc(x, y, 1.6 + e * 2.8, 0, 6.283); ctx.fill();
    }
    raf = waves.length ? requestAnimationFrame(draw) : 0;
  }
  function wave(x, y, s) { waves.push({ x, y, t: performance.now(), s }); if (!raf) raf = requestAnimationFrame(draw); }
  if (!reduceMotion) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, t = performance.now();
      if (t - last > 120 && Math.hypot(x - lx, y - ly) > 30) { wave(x, y, .8); last = t; lx = x; ly = y; }
    });
    hero.addEventListener('pointerdown', e => { const r = hero.getBoundingClientRect(); wave(e.clientX - r.left, e.clientY - r.top, 1); });
    setTimeout(() => wave(w * .7, h * .55, 1), 600);
  }
  addEventListener('resize', size); size();
})();

/* ── Mockups: switch every prototype screen between light and dark ── */
(function mockupMode() {
  const sw = document.querySelector('.mode-switch');
  if (!sw) return;
  const imgs = [...document.querySelectorAll('img[src*="/proto/"]')].filter(i => /\/(fr|team)-[^/]+\.webp$/.test(i.src) && !/-dark\.webp$/.test(i.src));
  imgs.forEach(i => { i.dataset.light = i.getAttribute('src'); i.dataset.dark = i.dataset.light.replace(/(-wide)?\.webp$/, (m, w) => '-dark' + (w || '') + '.webp'); });
  const set = m => {
    imgs.forEach(i => i.setAttribute('src', i.dataset[m]));
    sw.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === m));
    try { localStorage.setItem('mockup-mode', m); } catch (e) {}
  };
  sw.addEventListener('click', e => { const b = e.target.closest('button'); if (b) set(b.dataset.mode); });
  let saved = 'light'; try { saved = localStorage.getItem('mockup-mode') || 'light'; } catch (e) {}
  if (saved === 'dark') set('dark');
})();

/* ── Before/after slider ── */
document.querySelectorAll('.ba-slider').forEach(fig => {
  const r = fig.querySelector('.ba-range');
  const set = v => fig.style.setProperty('--pos', v + '%');
  r.addEventListener('input', () => set(r.value)); set(r.value);
});
