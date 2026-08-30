// ═══════════════════════════════════════════════════════════════════════════
//  DOM builders.
//
//  All typography lives in the DOM rather than in WebGL, because projector
//  text has to be genuinely sharp and because non-Latin scripts should be
//  shaped by the system, not by a texture atlas.
// ═══════════════════════════════════════════════════════════════════════════

import { COUNTRIES, UN_OFFICIAL_LANGUAGES } from '../data/countries.js';

const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

/** Strip the honorific so we can take real initials. */
export function bareName(name) {
  return (name || '').replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.)\s*/i, '').trim();
}

export function initials(name) {
  const parts = bareName(name).split(/\s+/).filter(Boolean);
  if (!parts.length) return '·';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** Family name only, for the compact ticker. */
export function shortName(name) {
  const parts = bareName(name).split(/\s+/).filter(Boolean);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0] || '';
}

// ── 1 · Welcome words ───────────────────────────────────────────────────────

export function buildWelcomeWords(host, entries) {
  host.innerHTML = '';
  return entries.map((e, i) => {
    const n = el('div', 'welcome-word');
    if (e.rtl) n.dir = 'rtl';
    n.innerHTML = `${e.text}<span class="tag">${e.lang}</span>`;
    // Three concentric rings rather than one spiral. Words that share a radius
    // are spaced a full slice apart, and neighbouring indices land on
    // different rings — so wide words in wide scripts don't collide.
    // The horizontal reach stays conservative: a word clipped at the frame
    // edge looks broken, and these vary enormously in width.
    const RINGS = 3;
    const ring = i % RINGS;
    const perRing = Math.ceil(entries.length / RINGS);
    const slot = Math.floor(i / RINGS);
    const a = (slot / perRing) * Math.PI * 2 + ring * 0.7 + 0.35;
    const rad = 0.15 + ring * 0.07;
    n.style.left = `${50 + Math.cos(a) * rad * 100 * 1.20}%`;
    n.style.top = `${50 + Math.sin(a) * rad * 100 * 1.25}%`;
    n.style.transform = 'translate(-50%, -50%)';
    host.appendChild(n);
    return n;
  });
}

// ── 2 · Headline numbers ────────────────────────────────────────────────────

export function buildStatRow(host, stats) {
  host.innerHTML = '';
  return stats.map(({ value, label }) => {
    const n = el('div', 'stat');
    n.innerHTML = `<div class="n">0</div><div class="l">${label}</div>`;
    host.appendChild(n);
    return { node: n, num: n.querySelector('.n'), value };
  });
}

/** Count a number up, writing into a node. Returns a tween-able proxy object. */
export function counter(node, to, { from = 0 } = {}) {
  const state = { v: from };
  return {
    state,
    onUpdate: () => { node.textContent = Math.round(state.v); },
    to,
  };
}

// ── 3 · Globe ticker ────────────────────────────────────────────────────────

/**
 * One line of the globe ticker: the faces of the colleagues from that country,
 * then the country and their names. Capped at four portraits so a country like
 * Bangladesh or the United States does not run off the frame.
 */
const TICKER_FACES = 4;

export function buildTickerItem(host, country, people) {
  const meta = COUNTRIES[country] || {};
  const n = el('div', 'ticker-item');

  const named = people.filter((p) => p.name);
  const faces = el('div', 'faces');
  named.slice(0, TICKER_FACES).forEach((p, i) => {
    const port = buildPortrait(p, 'tface');
    // Later portraits sit behind earlier ones, so the overlap reads cleanly.
    port.style.zIndex = String(TICKER_FACES - i);
    faces.appendChild(port);
  });
  const extra = named.length - TICKER_FACES;
  if (extra > 0) faces.appendChild(el('div', 'tface more', `+${extra}`));
  if (named.length) n.appendChild(faces);

  const txt = el('div', 'txt');
  txt.appendChild(el('div', 'name', `<span class="flag">${meta.flag || '🏳'}</span>${country}`));
  const who = named.length
    ? named.map((p) => shortName(p.name)).join(' · ')
    : `${people.length} colleague${people.length === 1 ? '' : 's'}`;
  txt.appendChild(el('div', 'who', who));
  n.appendChild(txt);

  host.appendChild(n);
  return n;
}

// ── 4 · Portraits and person cards ──────────────────────────────────────────

/**
 * A circular portrait that falls back to an initials monogram. The photo
 * replaces the monogram only once it has actually loaded, so a missing file is
 * invisible rather than a broken image — which means headshots can be dropped
 * in right up to the morning of the meeting.
 */
export function buildPortrait(person, cls = 'portrait') {
  const portrait = el('div', cls);
  const mono = el('span', 'mono', initials(person.name));
  portrait.appendChild(mono);
  if (person.photo) {
    const img = new Image();
    img.alt = '';
    img.onload = () => { mono.remove(); portrait.appendChild(img); };
    img.src = `assets/photos/${person.photo}`;
  }
  return portrait;
}

export function buildCard(person) {
  const meta = COUNTRIES[person.country] || {};
  const n = el('div', 'card');
  n.appendChild(buildPortrait(person));
  const meta2 = el('div', 'meta');
  meta2.appendChild(el('div', 'nm', bareName(person.name)));
  meta2.appendChild(el('div', 'rl', person.title || ''));
  n.appendChild(meta2);
  n.appendChild(el('div', 'fl', meta.flag || ''));
  return n;
}

// ── 5 · Language cloud ──────────────────────────────────────────────────────

/**
 * Words distributed on a sphere and projected to 2D each frame. Size encodes
 * how many people speak the language; the six UN official languages are gold.
 */
export class LangCloud {
  constructor(host, byLanguage, { radius = 300 } = {}) {
    host.innerHTML = '';
    this.host = host;
    this.radius = radius;
    this.rot = 0;

    const langs = [...byLanguage.entries()];
    const max = Math.max(...langs.map(([, p]) => p.length));
    const GOLDEN = Math.PI * (3 - Math.sqrt(5));

    this.items = langs.map(([lang, people], i) => {
      const node = el('div', 'lang-word');
      const official = UN_OFFICIAL_LANGUAGES.includes(lang);
      if (official) node.classList.add('is-official');
      node.innerHTML = `${lang}<span class="cnt">${people.length}</span>`;

      // Bigger languages sit larger and nearer the front.
      const w = people.length / max;
      node.style.fontSize = `calc(var(--u) * ${(1.15 + w * 2.5).toFixed(2)})`;

      const y = 1 - (i / Math.max(langs.length - 1, 1)) * 2;
      const r = Math.sqrt(Math.max(1 - y * y, 0));
      const th = i * GOLDEN;
      host.appendChild(node);
      return { node, official, x: Math.cos(th) * r, y, z: Math.sin(th) * r, w };
    });
    this.update(0);
  }

  update(rot) {
    this.rot = rot;
    const cos = Math.cos(rot), sin = Math.sin(rot);
    for (const it of this.items) {
      const x = it.x * cos - it.z * sin;
      const z = it.x * sin + it.z * cos;
      const depth = (z + 1) / 2;                       // 0 back → 1 front
      const persp = 0.62 + depth * 0.62;
      const px = x * this.radius * 1.65 * persp;
      const py = it.y * this.radius * 0.78 * persp;
      it.node.style.transform =
        `translate(-50%, -50%) translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) scale(${persp.toFixed(3)})`;
      it.node.style.filter = depth < 0.45 ? `blur(${((0.45 - depth) * 5).toFixed(2)}px)` : 'none';
      it.node.style.zIndex = Math.round(depth * 100);
      it.node.dataset.depth = depth.toFixed(3);
    }
  }

  /** Per-word opacity target, so the reveal can stagger and the front stays brightest. */
  depthOpacity(it) {
    const d = parseFloat(it.node.dataset.depth || '0.5');
    return 0.30 + d * 0.70;
  }
}

// ── 6 · Composition panels ──────────────────────────────────────────────────

const PERSON_GLYPH = `<svg viewBox="0 0 24 54" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="8" r="6.6" fill="currentColor"/>
  <path d="M12 17.5c-6 0-9.5 3.6-9.5 9.2V44c0 1.4 1.1 2.5 2.5 2.5h1.6l.8 5.2c.1.9.9 1.6 1.8 1.6h5.6c.9 0 1.7-.7 1.8-1.6l.8-5.2h1.6c1.4 0 2.5-1.1 2.5-2.5V26.7c0-5.6-3.5-9.2-9.5-9.2Z" fill="currentColor"/>
</svg>`;

export function buildGlyphField(host, { F, M, unknown }) {
  host.innerHTML = '';
  const make = (cls, color) => {
    const n = el('div', `glyph ${cls}`, PERSON_GLYPH);
    n.style.color = color;
    host.appendChild(n);
    return n;
  };
  // Built in the final sorted order; the animation reveals them as two streams.
  const f = Array.from({ length: F }, () => make('is-f', 'var(--gold)'));
  const m = Array.from({ length: M }, () => make('is-m', 'var(--blue-bright)'));
  const u = Array.from({ length: unknown }, () => make('is-u', 'var(--dimmer)'));
  return { f, m, u, all: [...f, ...m, ...u] };
}

export function buildSplitLegend(host, { F, M }) {
  const total = F + M;
  host.innerHTML = '';
  const item = (cls, pct, lbl, n) => {
    const d = el('div', `item ${cls}`);
    d.innerHTML = `<div class="pct">${pct}%</div><div class="lbl">${lbl} · ${n}</div>`;
    host.appendChild(d);
    return d;
  };
  return [
    item('f', Math.round((F / total) * 100), 'Women', F),
    item('m', Math.round((M / total) * 100), 'Men', M),
  ];
}

/**
 * How we came here. Deliberately not a contract breakdown: governments
 * released their people to this Office, and the United Nations staffed the
 * rest. Those are the only two categories anyone in the room needs, and it is
 * the framing the Office asked for.
 */
export function buildOrigin(host, { seconded, un, sendingCountries }) {
  host.innerHTML = '';

  const wrap = el('div', 'origin-rows');
  const block = (n, label, sub) => {
    const d = el('div', 'origin-block');
    d.innerHTML = `<div class="on">${n}</div><div class="ol">${label}</div>` +
                  (sub ? `<div class="os">${sub}</div>` : '');
    return d;
  };
  const a = block(seconded, 'seconded to this Office',
    `by ${sendingCountries.length} governments`);
  const b = block(un, 'United Nations colleagues', '&nbsp;');
  wrap.appendChild(a);
  wrap.appendChild(el('div', 'origin-div'));
  wrap.appendChild(b);
  host.appendChild(wrap);

  const flags = el('div', 'origin-flags');
  sendingCountries.forEach((c) => {
    const f = el('span', 'oflag', COUNTRIES[c]?.flag || '\u{1F3F3}');
    f.title = c;
    flags.appendChild(f);
  });
  host.appendChild(flags);

  const line = el('div', 'origin-line',
    'Governments sent their best people. The United Nations sent its own. ' +
    '<b>One Office.</b>');
  host.appendChild(line);

  return { blocks: [a, b], flags: [...flags.children], line, div: wrap.querySelector('.origin-div') };
}

export function buildGroupBloom(host, byRegionalGroup, total) {
  host.innerHTML = '';
  const C = 2 * Math.PI * 42;
  return [...byRegionalGroup].map(([name, n]) => {
    const d = el('div', 'gb');
    const frac = n / total;
    d.innerHTML =
      `<div class="ring">
         <svg viewBox="0 0 100 100">
           <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(79,200,245,0.16)" stroke-width="4"/>
           <circle class="arc" cx="50" cy="50" r="42" fill="none" stroke="var(--blue)" stroke-width="4"
                   stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}"/>
         </svg>
         <div class="rn">${n}</div>
       </div>
       <div class="gname">${name.replace(' Group', '')}</div>`;
    host.appendChild(d);
    return { node: d, arc: d.querySelector('.arc'), offset: C * (1 - frac) };
  });
}


// ── 7 · The President's six priorities ──────────────────────────────────────

export function buildPillars(host, pillars) {
  host.innerHTML = '';
  return pillars.map((p) => {
    const n = el('div', 'pillar');
    n.innerHTML =
      `<div class="pnum">${p.numeral}</div>` +
      `<div class="ptitle">${p.title}</div>` +
      `<div class="pfocus">${p.focus}</div>`;
    host.appendChild(n);
    return n;
  });
}


// ── 1 · The President's career ──────────────────────────────────────────────

/**
 * One line per post, arriving in turn. The last is marked so the scene can
 * hold on it — being elected to this chair is the point the list is making.
 */
export function buildCareer(host, entries) {
  host.innerHTML = '';
  return entries.map((e) => {
    const n = el('div', 'pga-role' + (e.final ? ' is-final' : ''));
    n.innerHTML = `<span class="dot"></span>` +
      `<span class="rl">${e.label}</span>` +
      (e.sub ? `<span class="rs">${e.sub}</span>` : '');
    host.appendChild(n);
    return n;
  });
}
