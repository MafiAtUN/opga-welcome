// ═══════════════════════════════════════════════════════════════════════════
//  OPGA 81 — Welcome
//  Master timeline, scene choreography and playback control.
//
//  Nearly everything on screen is a GSAP tween on the one master timeline,
//  which makes the whole 4:48 scrubbable: seeking to a scene label renders the
//  correct state instantly. The only state a seek cannot reconstruct is the
//  particle field's shape and its ignition timestamps, so each scene declares
//  the shape it begins in and `prime()` restores that on a jump.
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from '../vendor/three.module.js';
import { ParticleField, sampleImage, nebula, scatter } from './particles.js';
import * as G from './globe.js';
import * as UI from './ui.js';
import { attachNarration } from './narration.js';
import { COUNTRIES, WELCOME_IN, UN_HQ } from '../data/countries.js';
import { PGA, PGA_CAREER, THEME, PILLARS } from '../data/vision.js';
import * as D from './derive.js';

const gsap = window.gsap;
const COUNT = 16000;

// ── Scene schedule ──────────────────────────────────────────────────────────
// Durations only; `at` is accumulated below, so a scene can be added, removed
// or retimed without hand-recomputing every start time after it.
const SCENE_LIST = [
  { key: 's0', name: 'Cold open',   dur: 22, shape: ['scatter', 'logo'] },
  { key: 's1', name: 'The President', dur: 36, shape: ['logo', 'logo'] },
  { key: 's2', name: 'Welcome',     dur: 15, shape: ['logo', 'nebula'] },
  { key: 's3', name: 'Numbers',     dur: 12, shape: ['nebula', 'nebula'] },
  { key: 's4', name: 'Globe',       dur: 68, shape: ['nebula', 'globe'] },
  { key: 's5', name: 'Faces',       dur: 38, shape: ['globe', 'globe'] },
  { key: 's6', name: 'Languages',   dur: 27, shape: ['globe', 'sphere'] },
  { key: 's7', name: 'Priorities',  dur: 31, shape: ['sphere', 'sphere'] },
  { key: 's8', name: 'Composition', dur: 28, shape: ['sphere', 'sphere'] },
  { key: 's9', name: 'Close',       dur: 19, shape: ['sphere', 'logo'] },
];
const SCENES = (() => {
  let at = 0;
  return SCENE_LIST.map((s) => { const o = { ...s, at }; at += s.dur; return o; });
})();
const S = Object.fromEntries(SCENES.map((s, i) => [s.key, i]));   // 's4' -> 4

const TOTAL = SCENES.at(-1).at + SCENES.at(-1).dur;

// Orientation checkpoints, in radians, shared between scene builders so each
// scene knows exactly where the previous one left the globe.
const AIM_AFTER_FORM = -0.7;
let AIM_AFTER_GLOBE = 0;

// Ignition colours: gold while countries light up, cooled to brand blue for
// the closing mark. Set as THREE.Colors so the colour-space conversion matches.
const LIT_GOLD = new THREE.Color('#F2B233');
const LIT_COOLED = new THREE.Color('#58C4EC');

// ── Boot ────────────────────────────────────────────────────────────────────

const boot = document.createElement('div');
boot.id = 'boot';
boot.textContent = 'Preparing';
document.body.appendChild(boot);

const app = {};
window.__app = app;   // exposed for the automated run check
app.__scenes = SCENES;

init().catch((err) => {
  console.error(err);
  boot.textContent = 'Could not start — see the browser console';
});

async function init() {
  setupThree();

  // Start the voiceover downloading immediately, so the megabytes come over
  // the wire while the globe is being built rather than after it. On a hosted
  // copy that is several seconds off the wait before anything appears.
  app.narration = attachNarration(app, TOTAL);

  const [logoShape, landTopo, countriesTopo] = await Promise.all([
    sampleImage('assets/logo.png', COUNT, { width: 320, targetHeight: 118 }),
    fetch('vendor/land-110m.json').then((r) => r.json()),
    fetch('vendor/countries-110m.json').then((r) => r.json()),
  ]);

  const landFeature = window.topojson.feature(landTopo, landTopo.objects.land);
  const land = G.buildLandPoints(COUNT, landFeature, D.countries);
  const { indicesByCountry, missing } = G.assignCountries(
    land.countryOf, land.positions, land.landWanted, countriesTopo, D.countries,
  );
  if (missing.length) console.warn('Countries not matched in the atlas:', missing);

  app.shapes = {
    scatter: scatter(COUNT),
    logo: logoShape,
    nebula: nebula(COUNT, 205, 0.6),
    globe: { positions: land.positions, colors: land.colors },
    sphere: nebula(COUNT, 250, 0.14),
  };
  app.indicesByCountry = indicesByCountry;

  // Start with the field flung out into the dark, so the very first frame is
  // already the cold open rather than a point at the origin.
  forceShape('scatter', 'scatter');

  buildGlobeDecor();
  buildDom();
  buildTimeline();
  bindKeys();

  requestAnimationFrame(render);

  // ?t=<seconds> seeks and holds — used for reviewing and screenshotting
  // individual moments without waiting through the whole run.
  const t = new URL(location.href).searchParams.get('t');
  if (t !== null) {
    const secs = parseFloat(t) || 0;
    let i = 0;
    for (let k = SCENES.length - 1; k >= 0; k--) if (secs >= SCENES[k].at) { i = k; break; }
    prime(i, secs);
    app.tl.seek(secs, true);
    app.tl.pause();
    app.narration.toggleMute();
  } else {
    await startRun();
  }
}

/**
 * Begin the presentation.
 *
 * `?room=1` means present.command opened this — it launched Chrome with
 * --autoplay-policy, so sound is permitted and the run starts hands-free.
 *
 * Anything else is a hosted copy or a plain double-click, where a page cannot
 * be given that flag and the browser will refuse to make sound until someone
 * interacts. Those get a start card, so the picture and the voice begin
 * together on the click instead of five minutes playing silently.
 *
 * This is decided by the URL rather than by probing the browser, because a
 * probe answers differently depending on whether an audio output device
 * exists — which makes it exactly the wrong thing to depend on.
 */
function hideBoot() {
  boot.style.transition = 'opacity 0.5s ease';
  boot.style.opacity = '0';
  setTimeout(() => boot.remove(), 600);
}

async function startRun() {
  // In the room the file is on local disk and loads in a moment, and there is
  // no click to hide a wait behind — so wait for it, and be certain sound is
  // ready before anything runs hands-free.
  if (new URL(location.href).searchParams.has('room')) {
    boot.textContent = 'Preparing the voice';
    await app.narration.ready;
    hideBoot();
    app.tl.play(0);
    return;
  }

  // Hosted, the voice is six megabytes over whatever connection is going. Put
  // the card up the moment the picture is ready and let the rest arrive behind
  // it: reading the card and reaching for the mouse covers most of the
  // download, and on a slow line that is the difference between waiting four
  // seconds and twenty-two.
  hideBoot();

  const gate = document.createElement('div');
  gate.id = 'startgate';
  gate.innerHTML =
    '<div class="sg-inner">' +
      '<div class="sg-eyebrow">Office of the President of the General Assembly</div>' +
      '<div class="sg-title">Eighty&#8209;first Session</div>' +
      '<div class="sg-cta">Click to begin</div>' +
      '<div class="sg-note" id="sgNote">4 minutes 56 seconds &middot; with sound</div>' +
    '</div>';
  document.body.appendChild(gate);

  const go = async () => {
    // Claim the gesture synchronously, before any await — a play() that starts
    // after the handler yields is no longer inside the gesture and is refused.
    app.narration.startFromGesture();

    // Usually already settled. If someone clicks the instant the card appears
    // on a slow line, hold the picture rather than run it against silence.
    gate.classList.add('is-waiting');
    await app.narration.ready;
    app.narration.startFromGesture();     // line the voice up with t=0

    app.tl.play(0);
    gate.classList.add('is-going');
    setTimeout(() => gate.remove(), 700);
  };
  gate.addEventListener('click', go, { once: true });
  addEventListener('keydown', go, { once: true });

  // While the voice is still arriving, say so. Someone who clicks early is
  // then waiting on something they can see, rather than on nothing.
  const note = gate.querySelector('#sgNote');
  const settled = () => { note.textContent = '4 minutes 56 seconds \u00b7 with sound'; };
  app.narration.onProgress((f) => {
    if (f >= 1) return settled();
    note.textContent = `Loading the voice \u2014 ${Math.round(f * 100)}%`;
  });
  app.narration.ready.then(settled);
}

// ── three.js scaffolding ────────────────────────────────────────────────────

function setupThree() {
  const canvas = document.getElementById('stage');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x00121f, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 1, 4000);
  camera.position.set(0, 0, 430);

  const field = new ParticleField(COUNT);

  // globeRoot carries scene-level moves (sliding aside for the faces scene);
  // globeGroup carries the aim + spin rotation.
  const globeRoot = new THREE.Group();
  const globeGroup = new THREE.Group();
  globeRoot.add(globeGroup);
  globeGroup.add(field.points);
  scene.add(globeRoot);

  Object.assign(app, {
    canvas, renderer, scene, camera, field, globeRoot, globeGroup,
    clock: new THREE.Clock(),
    // The globe's orientation. Tweened by the timeline only — never
    // integrated per-frame, so a seek always reproduces the exact framing
    // and the flat shapes (logo, nebula) always face the camera squarely.
    aim: { x: 0, y: 0 },
    // Numbers that count up. Written in the render loop rather than from a
    // tween's onUpdate, because seeking suppresses callbacks — otherwise a
    // jumped-to scene would show a stale figure.
    counters: [],
    // Rendering eases itself down if frames get slow. See trackQuality().
    quality: { step: 0, samples: [], lastCheck: 0 },
    cloudRot: { v: 0, speed: 0 },
  });
  resize();
  addEventListener('resize', resize);
}

function resize() {
  const w = innerWidth, h = innerHeight;
  app.renderer.setSize(w, h, false);
  app.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  app.camera.aspect = w / h;
  app.camera.updateProjectionMatrix();
  app.field.onResize();
  // Keep the composition identical on any projector aspect.
  app.camera.position.z = 430 * Math.max(1, 1.62 / (w / h));
}

function buildGlobeDecor() {
  const { globeGroup } = app;

  app.atmosphere = G.makeAtmosphere();
  globeGroup.add(app.atmosphere);

  const { group, markers } = G.makeMarkers(D.countries);
  app.markerGroup = group;
  app.markers = markers;
  globeGroup.add(group);

  app.hq = G.makeHQMarker();
  globeGroup.add(app.hq);

  app.arcs = new Map();
  for (const name of D.countries) {
    const m = COUNTRIES[name];
    if (!m) continue;
    const arc = G.makeArc(m.lat, m.lng);
    app.arcs.set(name, arc);
    globeGroup.add(arc);
  }
}

// ── DOM construction ────────────────────────────────────────────────────────

const $ = (s) => document.querySelector(s);
const scenesEl = [...document.querySelectorAll('.scene')];

function buildDom() {
  app.progressBar = document.querySelector('#progress span');

  // The session theme, from the President's vision statement.
  $('#themeHead').textContent = THEME.headline;
  $('#themeSub').textContent = THEME.subline;
  $('#themePga').innerHTML = PGA.show
    ? `<b>${PGA.name}</b>${PGA.role}`
    : '';
  $('#pgaName').textContent = PGA.name;
  app.career = UI.buildCareer($('#pgaRoles'), PGA_CAREER);
  $('#pillarsTheme').textContent = THEME.headline;
  $('#closingTheme').textContent = THEME.headline;
  app.pillars = UI.buildPillars($('#pillarGrid'), PILLARS);

  app.welcomeWords = UI.buildWelcomeWords($('#welcomeStack'), WELCOME_IN);

  app.stats = UI.buildStatRow($('#statRow'), [
    { value: D.STATS.people,    label: 'colleagues' },
    { value: D.STATS.teams,     label: 'teams' },
    { value: D.STATS.countries, label: 'nationalities' },
  ]);

  app.tickers = D.ignitionOrder.map((c) =>
    UI.buildTickerItem($('#countryTicker'), c, D.byCountry.get(c) || []));

  $('#closingCount').textContent = D.STATS.countries;

  // Faces: every card built once, in a container per region. Each region
  // centres on its own, and regions overlap rather than stacking — only one
  // is ever visible.
  const grid = $('#faceGrid');
  app.regionCards = D.peopleByRegion.map(({ label, people }) => {
    const box = document.createElement('div');
    box.className = 'region-cards';
    const cards = people.map((p) => { const c = UI.buildCard(p); box.appendChild(c); return c; });
    grid.appendChild(box);
    return { label, box, cards };
  });

  app.cloud = new UI.LangCloud($('#langCloud'), D.byLanguage);
  $('#langCount').textContent = D.STATS.languages;
  $('#langOfficial').innerHTML = officialLanguageLine();

  app.glyphs = UI.buildGlyphField($('#glyphField'), D.genderSplit);
  app.splitLegend = UI.buildSplitLegend($('#splitLegend'), D.genderSplit);
  app.origin = UI.buildOrigin($('#originPanel'), D.howWeCameHere);
  app.bloom = UI.buildGroupBloom($('#groupBloom'), D.byRegionalGroup, D.STATS.people);

  $('#closingLine').textContent =
    `${D.STATS.countries} nationalities · ${D.STATS.languages} languages · one team`;
}

/**
 * Stated honestly: we claim all six official languages only if the data
 * actually supports it, and name what is missing if it does not.
 */
function officialLanguageLine() {
  const { present, missing, all } = D.officialLanguages;
  if (all) {
    return 'Among them, <b>all six official languages of the United Nations</b>.';
  }
  const n = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'][present.length];
  return `Among them, <b>${n} of the six official languages</b> of the United Nations` +
         ` — ${present.join(', ')}.`;
}

// ── Scene helpers ───────────────────────────────────────────────────────────

/** Fade a scene's container in and out around its slot on the master timeline. */
function sceneShell(i, tl, { fadeIn = 1.1, fadeOut = 1.1 } = {}) {
  const s = SCENES[i];
  const node = scenesEl[i];
  tl.set(node, { visibility: 'visible' }, s.at)
    .fromTo(node, { opacity: 0 }, { opacity: 1, duration: fadeIn, ease: 'power2.out' }, s.at)
    .to(node, { opacity: 0, duration: fadeOut, ease: 'power2.in' }, s.at + s.dur - fadeOut)
    .set(node, { visibility: 'hidden' }, s.at + s.dur);
}

/** Tween the particle field from its current shape into the next one. */
function morphTo(tl, at, shapeKey, { duration = 3, stagger = 0.55, curl = 26, ease = 'none' } = {}) {
  tl.call(() => stageShape(shapeKey, { stagger, curl }), null, at)
    .fromTo(app.field.uniforms.uMorph, { value: 0 }, { value: 1, duration, ease }, at);
}

function stageShape(key, { stagger = 0.55, curl = 26 } = {}) {
  const f = app.field;
  f.commit();
  f.reshuffleStagger();
  const s = app.shapes[key];
  f.setTarget(s.positions, s.colors);
  f.uniforms.uStagger.value = stagger;
  f.uniforms.uCurl.value = curl;
  app.currentShape = key;
}

/** Force the field into a shape with no animation (used when jumping scenes). */
function forceShape(fromKey, toKey) {
  const f = app.field;
  const a = app.shapes[fromKey], b = app.shapes[toKey];
  f.aFrom.set(a.positions); f.aColorFrom.set(a.colors);
  f.aTo.set(b.positions); f.aColorTo.set(b.colors);
  f.geometry.attributes.aFrom.needsUpdate = true;
  f.geometry.attributes.aColorFrom.needsUpdate = true;
  f.geometry.attributes.aTo.needsUpdate = true;
  f.geometry.attributes.aColorTo.needsUpdate = true;
  app.currentShape = toKey;
}

// ── The master timeline ─────────────────────────────────────────────────────

function buildTimeline() {
  const tl = gsap.timeline({ paused: true });
  app.tl = tl;
  SCENES.forEach((s) => tl.addLabel(s.key, s.at));

  sceneColdOpen(tl, S.s0);
  sceneTheme(tl, S.s1);
  sceneWelcome(tl, S.s2);
  sceneNumbers(tl, S.s3);
  sceneGlobe(tl, S.s4);
  sceneFaces(tl, S.s5);
  sceneLanguages(tl, S.s6);
  scenePriorities(tl, S.s7);
  sceneComposition(tl, S.s8);
  sceneClose(tl, S.s9);

  tl.set({}, {}, TOTAL);   // pin the timeline's full duration
}

// 0 · Cold open — the field rushes in and becomes the mark.
function sceneColdOpen(tl, i) {
  const s = SCENES[i], node = scenesEl[i];
  const [eyebrow, h1, rule, session] = node.querySelectorAll('.reveal');

  tl.set(node, { visibility: 'visible', opacity: 1 }, s.at)
    .set(app.aim, { x: 0, y: 0 }, s.at)
    .set(app.field.uniforms.uOpacity, { value: 1 }, s.at)
    .set(app.field.uniforms.uSize, { value: 4.2 }, s.at)
    .set(app.field.uniforms.uDrift, { value: 0.3 }, s.at)
    .set(app.field.uniforms.uFadeRadius, { value: 420 }, s.at)
    .set(app.field.uniforms.uFadeAmount, { value: 0.3 }, s.at);

  morphTo(tl, s.at, 'logo', { duration: 5.4, stagger: 0.62, curl: 90, ease: 'power1.inOut' });

  // The mark settles, drifts back, and the title rises through it.
  tl.fromTo(app.globeRoot.position, { z: -260 }, { z: 0, duration: 6, ease: 'power2.out' }, s.at)
    .to(app.field.uniforms.uSize, { value: 5.8, duration: 3, ease: 'power2.out' }, s.at + 4)
    .to(app.globeRoot.position, { y: 80, duration: 4, ease: 'power2.inOut' }, s.at + 7.5)
    .to(app.field.uniforms.uOpacity, { value: 0.55, duration: 3 }, s.at + 8);

  tl.fromTo(eyebrow, { opacity: 0, y: 26, letterSpacing: '0.9em' },
      { opacity: 1, y: 0, letterSpacing: '0.42em', duration: 2.2, ease: 'power3.out' }, s.at + 8.6)
    .fromTo(h1, { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 2.4, ease: 'power3.out' }, s.at + 9.4)
    .fromTo(rule, { opacity: 0, scaleX: 0 },
      { opacity: 1, scaleX: 1, duration: 1.8, ease: 'power3.out' }, s.at + 10.6)
    .fromTo(session, { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 2, ease: 'power3.out' }, s.at + 11.2);

  // Move the title block down so it sits under the mark rather than over it.
  tl.set(node.querySelector('.titleblock'), { y: 165 }, s.at);

  tl.to([eyebrow, h1, rule, session], {
    opacity: 0, y: -26, duration: 1.6, stagger: 0.08, ease: 'power2.in',
  }, s.at + s.dur - 2.6)
    .set(node, { visibility: 'hidden' }, s.at + s.dur);
}

// 1 · The President's theme for the session. The mark stays on screen behind
//     it, dimmed, so the theme reads as belonging to the office rather than
//     arriving as a separate slide.
function sceneTheme(tl, i) {
  const s = SCENES[i], node = scenesEl[i];
  const [eyebrow, head, rule, sub, pga] = node.querySelectorAll('.theme-block .reveal');
  const block = $('#pgaBlock');
  const roles = app.career;

  tl.set(node, { visibility: 'visible', opacity: 1 }, s.at)
    .set(app.aim, { x: 0, y: 0 }, s.at);

  // The mark drops to a faint watermark — the theme and the man are the
  // message here, and the mark behind must read as texture, not competition.
  tl.to(app.globeRoot.position, { y: 0, duration: 3, ease: 'power2.inOut' }, s.at)
    // Fainter than the other scenes: this one is a wall of words and the mark
    // sits directly behind them.
    .to(app.field.uniforms.uOpacity, { value: 0.035, duration: 2.5 }, s.at)
    .to(app.field.uniforms.uSize, { value: 3.0, duration: 2.5 }, s.at);

  // ── The career, one post at a time. The list is an argument: by the time
  //    the last line lands, the election reads as a conclusion rather than an
  //    announcement.
  tl.fromTo($('#pgaEyebrow'), { opacity: 0, y: 18, letterSpacing: '0.9em' },
      { opacity: 1, y: 0, letterSpacing: '0.42em', duration: 1.6, ease: 'power3.out' }, s.at + 0.5)
    .fromTo($('#pgaName'), { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 1.8, ease: 'power3.out' }, s.at + 1.1);

  const first = s.at + 3.0;
  const per = 2.35;
  roles.forEach((r, k) => {
    tl.fromTo(r, { opacity: 0, x: -26 },
      { opacity: k === roles.length - 1 ? 1 : 0.72, x: 0,
        duration: 1.1, ease: 'power3.out' }, first + k * per);
  });
  // Everything lifts to full for a beat, so the whole career is read at once.
  tl.to(roles, { opacity: 1, duration: 0.9, stagger: 0.04 }, first + roles.length * per);

  const OUT = s.at + s.dur - 15;
  tl.to(block, { opacity: 0, y: -34, duration: 1.5, ease: 'power2.in' }, OUT);

  // ── And his theme, which is the job he was elected to do.
  const T = OUT + 1.4;
  tl.fromTo(eyebrow, { opacity: 0, y: 22, letterSpacing: '0.9em' },
      { opacity: 1, y: 0, letterSpacing: '0.42em', duration: 1.6, ease: 'power3.out' }, T)
    .fromTo(head, { opacity: 0, y: 44 },
      { opacity: 1, y: 0, duration: 2.4, ease: 'power3.out' }, T + 0.6)
    .fromTo(rule, { opacity: 0, scaleX: 0 },
      { opacity: 1, scaleX: 1, duration: 1.5, ease: 'power3.out' }, T + 2.2)
    .fromTo(sub, { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 2, ease: 'power3.out' }, T + 2.5)
    .fromTo(pga, { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1.8, ease: 'power3.out' }, T + 4.2);

  tl.to([eyebrow, head, rule, sub, pga], {
    opacity: 0, y: -26, duration: 1.4, stagger: 0.06, ease: 'power2.in',
  }, s.at + s.dur - 2.2)
    .set(node, { visibility: 'hidden' }, s.at + s.dur);
}

// 2 · Welcome, in the scripts spoken in the office.
function sceneWelcome(tl, i) {
  const s = SCENES[i], node = scenesEl[i];
  const final = node.querySelector('.welcome-final h2');

  tl.set(node, { visibility: 'visible', opacity: 1 }, s.at);

  // The logo dissolves into a nebula so the words have a field to sit in.
  morphTo(tl, s.at, 'nebula', { duration: 4.5, stagger: 0.7, curl: 60, ease: 'power1.inOut' });
  tl.to(app.globeRoot.position, { y: 0, duration: 3, ease: 'power2.inOut' }, s.at)
    .to(app.field.uniforms.uOpacity, { value: 0.32, duration: 2.5 }, s.at)
    .to(app.field.uniforms.uSize, { value: 3.4, duration: 3 }, s.at);

  // Words arrive in a ring, each one holding briefly.
  const words = app.welcomeWords;
  const per = 11 / words.length;
  words.forEach((w, i) => {
    const t = s.at + 1.4 + i * per;
    tl.fromTo(w, { opacity: 0, scale: 0.72, filter: 'blur(14px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.5, ease: 'power3.out' }, t)
      .to(w, { opacity: 0.22, scale: 0.94, duration: 1.8, ease: 'power2.inOut' }, t + 3.2);
  });

  // They all bloom once together, then give way to the English.
  tl.to(words, { opacity: 0.5, duration: 1, stagger: { each: 0.02, from: 'random' } }, s.at + 13.4)
    .to(words, { opacity: 0, scale: 1.5, filter: 'blur(18px)', duration: 2.2,
      stagger: { each: 0.03, from: 'random' }, ease: 'power2.in' }, s.at + 15);

  tl.fromTo(final, { opacity: 0, scale: 0.9, filter: 'blur(20px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 2.2, ease: 'power3.out' }, s.at + 15.6)
    .to(final, { opacity: 0, scale: 1.06, duration: 1.4, ease: 'power2.in' }, s.at + s.dur - 1.6)
    .set(node, { visibility: 'hidden' }, s.at + s.dur);
}

// 2 · The headline numbers.
function sceneNumbers(tl, i) {
  const s = SCENES[i], node = scenesEl[i];
  tl.set(node, { visibility: 'visible', opacity: 1 }, s.at);

  app.stats.forEach((st, i) => {
    const t = s.at + 0.8 + i * 3.4;
    const c = { v: 0 };
    app.counters.push({ node: st.num, obj: c });
    tl.fromTo(st.node, { opacity: 0, y: 46, scale: 0.94 },
        { opacity: 1, y: 0, scale: 1, duration: 1.5, ease: 'power3.out' }, t)
      .to(c, { v: st.value, duration: 1.9, ease: 'power2.out' }, t)
      // A breath of light through the field as each number lands.
      .to(app.field.uniforms.uSize, { value: 5.4, duration: 0.3, ease: 'power2.out' }, t + 1.8)
      .to(app.field.uniforms.uSize, { value: 3.4, duration: 1.4, ease: 'power2.out' }, t + 2.1);
  });

  tl.to(app.stats.map((s2) => s2.node), {
    opacity: 0, y: -30, duration: 1.3, stagger: 0.06, ease: 'power2.in',
  }, s.at + s.dur - 2)
    .set(node, { visibility: 'hidden' }, s.at + s.dur);
}

// 3 · The globe. The hero.
function sceneGlobe(tl, i) {
  const s = SCENES[i], node = scenesEl[i];
  const tally = $('#globeTally');
  const tallyN = tally.querySelector('.n');
  const closing = $('#globeClosing');

  tl.set(node, { visibility: 'visible', opacity: 1 }, s.at)
    .call(() => { app.field.clearIgnitions(); }, null, s.at);

  // Earth forms out of the nebula.
  morphTo(tl, s.at, 'globe', { duration: 6, stagger: 0.68, curl: 120, ease: 'power1.inOut' });
  tl.to(app.field.uniforms.uOpacity, { value: 1, duration: 3 }, s.at)
    .to(app.field.uniforms.uSize, { value: 3.6, duration: 3 }, s.at)
    .to(app.field.uniforms.uDrift, { value: 0.12, duration: 3 }, s.at)
    .to(app.field.uniforms.uFadeRadius, { value: 95, duration: 3 }, s.at)
    .to(app.field.uniforms.uFadeAmount, { value: 0.92, duration: 3 }, s.at)
    .fromTo(app.atmosphere.material.uniforms.uOpacity, { value: 0 },
      { value: 0.85, duration: 4, ease: 'power2.out' }, s.at + 2)
    .to(app.hq.material, { opacity: 0.9, duration: 2 }, s.at + 4.5);

  // A slow quarter-turn as the Earth assembles, settling where the first
  // country will be waiting.
  tl.fromTo(app.aim, { x: 0, y: 0 },
    { x: 0.16, y: AIM_AFTER_FORM, duration: 8, ease: 'power2.inOut' }, s.at);

  // Country by country, west to east.
  const order = D.ignitionOrder;
  const START = s.at + 8;
  const END = s.at + s.dur - 11;
  const per = (END - START) / order.length;

  let prev = { x: 0.16, y: AIM_AFTER_FORM };
  const tallyC = { v: 0 };
  app.counters.push({ node: tallyN, obj: tallyC });

  // Remembered so a jump into the middle of this scene can restore exactly
  // which countries should already be alight.
  app.ignitionSchedule = [];

  tl.fromTo(tally, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.2 }, START - 0.5);

  order.forEach((name, i) => {
    const meta = COUNTRIES[name];
    if (!meta) return;
    const t = START + i * per;

    // Turn the globe to face this country, taking the short way round.
    const aim = G.facingRotation(meta.lat, meta.lng);
    const target = { x: aim.x, y: G.shortestAngle(prev.y, aim.y) };
    prev = target;
    tl.to(app.aim, {
      x: target.x, y: target.y,
      duration: Math.max(per * 0.82, 0.9), ease: 'power2.inOut',
    }, t);

    // Light the land.
    const idx = app.indicesByCountry.get(name);
    if (idx && idx.length) {
      const when = t + per * 0.55;
      app.ignitionSchedule.push({ at: when, idx });
      tl.call(() => app.field.ignite(idx, app.clock.elapsedTime), null, when);
    }

    // Marker, pillar, arc.
    const mk = app.markers.get(name);
    if (mk) {
      tl.fromTo(mk.marker.material, { opacity: 0 },
          { opacity: 0.95, duration: 0.5, ease: 'power2.out' }, t + per * 0.55)
        .fromTo(mk.marker.scale, { x: 0.001, y: 0.001, z: 0.001 },
          { x: 11, y: 11, z: 11, duration: 0.8, ease: 'back.out(2)' }, t + per * 0.55)
        .to(mk.marker.scale, { x: 6, y: 6, z: 6, duration: 1.2, ease: 'power2.out' }, t + per * 0.55 + 0.8)
        .fromTo(mk.pillar.scale, { y: 0.001 },
          { y: 11, duration: 1.1, ease: 'power3.out' }, t + per * 0.55)
        .fromTo(mk.pillar.material.uniforms.uOpacity, { value: 0 },
          { value: 0.85, duration: 0.4 }, t + per * 0.55)
        .to(mk.pillar.material.uniforms.uOpacity, { value: 0.30, duration: 1.6 }, t + per * 0.55 + 0.7);
    }

    const arc = app.arcs.get(name);
    if (arc) {
      tl.fromTo(arc.material.uniforms.uProgress, { value: 0 },
        { value: 1, duration: Math.max(per * 0.9, 1), ease: 'power2.inOut' }, t + per * 0.6);
    }

    // Ticker line.
    const tick = app.tickers[i];
    tl.fromTo(tick, { opacity: 0, y: 34, filter: 'blur(6px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, ease: 'power3.out' }, t + per * 0.5)
      .to(tick, { opacity: 0, y: -30, filter: 'blur(5px)', duration: 0.55, ease: 'power2.in' },
        t + per * 0.5 + Math.max(per * 0.72, 0.8));

    tl.to(tallyC, { v: i + 1, duration: 0.5, ease: 'power2.out' }, t + per * 0.55);
  });

  // Pull back on the whole lit sphere.
  tl.to(app.aim, { x: 0.28, y: prev.y + 0.9, duration: 5, ease: 'power2.inOut' }, END)
    .to(app.globeRoot.scale, { x: 0.86, y: 0.86, z: 0.86, duration: 5, ease: 'power2.inOut' }, END)
    .to(tally, { opacity: 0, duration: 1 }, END + 2.5)
    .fromTo(closing, { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 2, ease: 'power3.out' }, END + 3)
    .to(closing, { opacity: 0, duration: 1.4 }, s.at + s.dur - 1.6)
    .set(node, { visibility: 'hidden' }, s.at + s.dur);

  AIM_AFTER_GLOBE = prev.y + 0.9;
}

// 4 · The people behind the markers.
function sceneFaces(tl, i) {
  const s = SCENES[i], node = scenesEl[i];
  const label = $('#regionLabel');

  tl.set(node, { visibility: 'visible', opacity: 1 }, s.at);

  // Globe slides right and shrinks; cards occupy the left.
  tl.to(app.globeRoot.position, { x: 168, duration: 3, ease: 'power2.inOut' }, s.at)
    .to(app.globeRoot.scale, { x: 0.62, y: 0.62, z: 0.62, duration: 3, ease: 'power2.inOut' }, s.at)
    .to(app.aim, { x: 0.18, duration: 3, ease: 'power2.inOut' }, s.at)
    .fromTo(app.aim, { y: AIM_AFTER_GLOBE },
      { y: AIM_AFTER_GLOBE + 1.6, duration: s.dur, ease: 'none' }, s.at);

  const regions = app.regionCards;
  const per = (s.dur - 4) / regions.length;

  regions.forEach((r, i) => {
    const t = s.at + 2 + i * per;

    tl.call(() => { label.textContent = r.label; }, null, t)
      .fromTo(label, { opacity: 0, x: -24 },
        { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }, t)
      .to(label, { opacity: 0, x: 20, duration: 0.6, ease: 'power2.in' }, t + per - 0.7);

    tl.fromTo(r.cards, { opacity: 0, x: -70, scale: 0.9 },
        { opacity: 1, x: 0, scale: 1, duration: 1.1, ease: 'power3.out',
          stagger: { each: Math.min(0.16, (per * 0.4) / r.cards.length) } }, t + 0.2)
      .to(r.cards, { opacity: 0, x: 40, scale: 0.94, duration: 0.7,
        stagger: { each: 0.04 }, ease: 'power2.in' }, t + per - 0.9);
  });

  tl.set(node, { visibility: 'hidden' }, s.at + s.dur);
}

// 5 · Languages.
function sceneLanguages(tl, i) {
  const s = SCENES[i], node = scenesEl[i];
  const resolve = $('#langResolve');
  const nodes = app.cloud.items.map((it) => it.node);

  tl.set(node, { visibility: 'visible', opacity: 1 }, s.at);

  // Globe returns to centre and dissolves into a plain sphere of dust.
  tl.to(app.globeRoot.position, { x: 0, duration: 2.5, ease: 'power2.inOut' }, s.at)
    .to(app.globeRoot.scale, { x: 1, y: 1, z: 1, duration: 2.5, ease: 'power2.inOut' }, s.at)
    .to(app.atmosphere.material.uniforms.uOpacity, { value: 0, duration: 2 }, s.at)
    .to(app.hq.material, { opacity: 0, duration: 1.5 }, s.at)
    .to([...app.arcs.values()].map((a) => a.material.uniforms.uOpacity),
      { value: 0, duration: 2 }, s.at)
    .to([...app.markers.values()].map((m) => m.marker.material),
      { opacity: 0, duration: 2 }, s.at)
    .to([...app.markers.values()].map((m) => m.pillar.material.uniforms.uOpacity),
      { value: 0, duration: 2 }, s.at);

  morphTo(tl, s.at + 1.5, 'sphere', { duration: 4, stagger: 0.6, curl: 40, ease: 'power1.inOut' });
  tl.to(app.field.uniforms.uOpacity, { value: 0.22, duration: 3 }, s.at + 1.5)
    .to(app.field.uniforms.uSize, { value: 3.0, duration: 3 }, s.at + 1.5)
    .to(app.field.uniforms.uFadeRadius, { value: 420, duration: 3 }, s.at + 1.5)
    .to(app.field.uniforms.uFadeAmount, { value: 0.3, duration: 3 }, s.at + 1.5)
    .to(app.cloudRot, { speed: 0.11, duration: 3 }, s.at);

  // The words drift up out of the dust.
  tl.fromTo(nodes, { opacity: 0, filter: 'blur(18px)' },
    { opacity: 1, filter: 'blur(0px)', duration: 1.6, ease: 'power2.out',
      stagger: { each: 0.08, from: 'random' } }, s.at + 2.5);

  // Then converge and hand over to the number.
  tl.to(app.cloudRot, { speed: 0.02, duration: 4, ease: 'power2.out' }, s.at + 17)
    .to(nodes, { opacity: 0, scale: 0.4, filter: 'blur(12px)', duration: 1.8,
      stagger: { each: 0.035, from: 'edges' }, ease: 'power2.in' }, s.at + 19)
    .fromTo(resolve, { opacity: 0 }, { opacity: 1, duration: 1.4 }, s.at + 20.6)
    .fromTo($('#langCount'), { scale: 0.6, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.6, ease: 'power3.out' }, s.at + 20.6)
    .fromTo($('.bigcaption'), { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }, s.at + 21.4)
    .fromTo($('#langOfficial'), { opacity: 0, y: 26 },
      { opacity: 1, y: 0, duration: 1.6, ease: 'power3.out' }, s.at + 22.6)
    .to(resolve, { opacity: 0, duration: 1.3 }, s.at + s.dur - 1.8)
    .set(node, { visibility: 'hidden' }, s.at + s.dur);
}

// 7 · The President's six priorities for the session.
function scenePriorities(tl, i) {
  const s = SCENES[i], node = scenesEl[i];
  const head = $('#pillarsHead');

  tl.set(node, { visibility: 'visible', opacity: 1 }, s.at);

  // Keep the dust quiet — this scene is dense with words.
  tl.to(app.field.uniforms.uOpacity, { value: 0.13, duration: 2 }, s.at)
    .to(app.cloudRot, { speed: 0.02, duration: 2 }, s.at);

  tl.fromTo(head, { opacity: 0, y: -20 },
    { opacity: 1, y: 0, duration: 1.6, ease: 'power3.out' }, s.at + 0.4);

  // Each pillar arrives in turn, then all six hold together long enough to
  // be read as a set.
  const cards = app.pillars;
  const per = 1.55;
  cards.forEach((c, k) => {
    const t = s.at + 1.6 + k * per;
    tl.fromTo(c, { opacity: 0, y: 42, scale: 0.94 },
        { opacity: 1, y: 0, scale: 1, duration: 1.5, ease: 'power3.out' }, t)
      // A brief gold lift as it lands, settling back so no one card dominates.
      .fromTo(c, { borderTopColor: 'rgba(242,178,51,0.95)' },
        { borderTopColor: 'rgba(242,178,51,0.5)', duration: 2.2, ease: 'power2.out' }, t + 0.4);
  });

  tl.to([head, ...cards], {
    opacity: 0, y: -26, duration: 1.3, stagger: 0.04, ease: 'power2.in',
  }, s.at + s.dur - 1.9)
    .set(node, { visibility: 'hidden' }, s.at + s.dur);
}

// 8 · Composition: gender, funding, regional groups.
function sceneComposition(tl, i) {
  const s = SCENES[i], node = scenesEl[i];
  const [pGender, pOrigin, pGroups] = node.querySelectorAll('.comp-panel');
  const slot = s.dur / 3;

  tl.set(node, { visibility: 'visible', opacity: 1 }, s.at);

  // — Gender
  const t0 = s.at + 0.4;
  tl.fromTo(pGender, { opacity: 0 }, { opacity: 1, duration: 0.8 }, t0)
    .fromTo(pGender.querySelector('.panel-title'), { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 1 }, t0)
    .fromTo(app.glyphs.all, { opacity: 0, y: 34, scale: 0.7 },
      { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'back.out(1.6)',
        stagger: { each: 0.035, from: 'center' } }, t0 + 0.5)
    .fromTo(app.splitLegend, { opacity: 0, y: 26 },
      { opacity: 1, y: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out' }, t0 + 2.6)
    .to(pGender, { opacity: 0, y: -30, duration: 0.9, ease: 'power2.in' }, t0 + slot - 1.2);

  // — How we came here
  const t1 = s.at + slot + 0.2;
  tl.fromTo(pOrigin, { opacity: 0 }, { opacity: 1, duration: 0.8 }, t1)
    .fromTo(pOrigin.querySelector('.panel-title'), { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 1 }, t1)
    .fromTo(app.origin.blocks, { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1.2, stagger: 0.35, ease: 'power3.out' }, t1 + 0.5)
    .fromTo(app.origin.div, { opacity: 0, scaleY: 0 },
      { opacity: 1, scaleY: 1, duration: 1, ease: 'power2.out' }, t1 + 0.9)
    .fromTo(app.origin.flags, { opacity: 0, y: 14, scale: 0.6 },
      { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out(2)',
        stagger: { each: 0.07, from: 'center' } }, t1 + 1.8)
    .fromTo(app.origin.line, { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' }, t1 + 3.0)
    .to(pOrigin, { opacity: 0, y: -30, duration: 0.9, ease: 'power2.in' }, t1 + slot - 1.2);

  // — Regional groups
  const t2 = s.at + slot * 2;
  tl.fromTo(pGroups, { opacity: 0 }, { opacity: 1, duration: 0.8 }, t2)
    .fromTo(pGroups.querySelector('.panel-title'), { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 1 }, t2);
  app.bloom.forEach((b, i) => {
    tl.fromTo(b.node, { opacity: 0, y: 34, scale: 0.86 },
        { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: 'power3.out' }, t2 + 0.4 + i * 0.18)
      .fromTo(b.arc, { strokeDashoffset: 2 * Math.PI * 42 },
        { strokeDashoffset: b.offset, duration: 1.6, ease: 'power2.out' }, t2 + 0.6 + i * 0.18);
  });

  tl.to(node, { opacity: 0, duration: 1.4, ease: 'power2.in' }, s.at + s.dur - 1.6)
    .set(node, { visibility: 'hidden' }, s.at + s.dur);
}

// 7 · Close — everything returns to the mark.
function sceneClose(tl, i) {
  const s = SCENES[i], node = scenesEl[i];
  const [eyebrow, h1, rule, session] = node.querySelectorAll('.reveal');

  tl.set(node, { visibility: 'visible', opacity: 1 }, s.at);

  // Square to the camera, or the flat mark would be edge-on and invisible.
  tl.to(app.aim, { x: 0, y: 0, duration: 3.5, ease: 'power2.inOut' }, s.at)
    .to(app.cloudRot, { speed: 0, duration: 2 }, s.at);

  // Cool the ignited countries from gold back to brand blue, so the mark
  // reassembles in the same colour it opened in instead of gold-flecked.
  tl.to(app.field.uniforms.uLitColor.value,
    { r: LIT_COOLED.r, g: LIT_COOLED.g, b: LIT_COOLED.b, duration: 4, ease: 'power2.inOut' },
    s.at + 0.5);

  morphTo(tl, s.at + 0.5, 'logo', { duration: 5, stagger: 0.6, curl: 80, ease: 'power1.inOut' });
  tl.to(app.field.uniforms.uOpacity, { value: 0.62, duration: 3 }, s.at + 0.5)
    .to(app.field.uniforms.uSize, { value: 5.6, duration: 3 }, s.at + 0.5)
    .to(app.globeRoot.position, { y: 80, duration: 4, ease: 'power2.inOut' }, s.at + 3);
  tl.set(node.querySelector('.titleblock'), { y: 175 }, s.at);

  tl.fromTo(eyebrow, { opacity: 0, y: 24, letterSpacing: '0.9em' },
      { opacity: 1, y: 0, letterSpacing: '0.42em', duration: 2, ease: 'power3.out' }, s.at + 5)
    .fromTo(h1, { opacity: 0, y: 36 },
      { opacity: 1, y: 0, duration: 2.2, ease: 'power3.out' }, s.at + 5.8)
    .fromTo(rule, { opacity: 0, scaleX: 0 },
      { opacity: 1, scaleX: 1, duration: 1.6, ease: 'power3.out' }, s.at + 7)
    .fromTo(session, { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 1.8, ease: 'power3.out' }, s.at + 7.6);

  // Hold. The last card stays up for the room to look at.
}

// ── Playback ────────────────────────────────────────────────────────────────

function updateChrome() {
  const p = app.tl.time() / TOTAL;
  app.progressBar.style.width = `${(p * 100).toFixed(2)}%`;
  for (const c of app.counters) {
    const v = Math.round(c.obj.v);
    if (v !== c.last) { c.node.textContent = v; c.last = v; }
  }
}

let last = 0;
function render() {
  requestAnimationFrame(render);
  const t = app.clock.getElapsedTime();
  const dt = Math.min(t - last, 0.05);
  last = t;

  app.field.update(t);
  trackQuality(t, dt * 1000);
  updateChrome();

  if (!app.tl.paused()) app.cloudRot.v += app.cloudRot.speed * dt;
  app.globeGroup.rotation.x = app.aim.x;
  app.globeGroup.rotation.y = app.aim.y;
  app.cloud.update(app.cloudRot.v);

  app.narration?.update();

  if (app.debugOn) updateDebug(t);
  app.renderer.render(app.scene, app.camera);
}

// The presentation may end up on a machine nobody tested: a different browser,
// an external 4K display, or simply a laptop on battery, where macOS throttles
// the GPU hard. Rather than assume the room's conditions, watch the frame times
// and give back resolution until it keeps up. Halving the pixel ratio quarters
// the fill cost, and this scene is fill-bound — sixteen thousand additively
// blended points.
//
// It only ever steps down. Stepping back up on a brief recovery would oscillate,
// and a presentation that visibly changes quality twice is worse than one that
// settled slightly softer and stayed there.
const QUALITY_STEPS = [2, 1.5, 1.25, 1];
const SLOW_FRAME_MS = 22;        // below ~45fps
const QUALITY_WINDOW = 2;        // seconds of evidence before acting

function trackQuality(now, frameMs) {
  const q = app.quality;
  q.samples.push(frameMs);
  if (now - q.lastCheck < QUALITY_WINDOW) return;
  q.lastCheck = now;

  const sorted = q.samples.sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  q.samples = [];

  if (median <= SLOW_FRAME_MS || q.step >= QUALITY_STEPS.length - 1) return;

  q.step++;
  const ratio = Math.min(devicePixelRatio, QUALITY_STEPS[q.step]);
  app.renderer.setPixelRatio(ratio);
  app.renderer.setSize(innerWidth, innerHeight, false);
  app.field.uniforms.uPixelRatio.value = ratio;
  flashDebug(`eased to ${ratio}x — frames were ${median.toFixed(0)}ms`);
  console.info(`[opga] frames at ${median.toFixed(0)}ms; eased rendering to ${ratio}x`);
}

function currentSceneIndex() {
  const t = app.tl.time();
  for (let i = SCENES.length - 1; i >= 0; i--) if (t >= SCENES[i].at) return i;
  return 0;
}

/**
 * Restore the state a seek cannot: the particle field's shape and which
 * countries are already lit. `at` is the timeline position being jumped to.
 */
function prime(i, at = SCENES[i].at) {
  const s = SCENES[i];
  forceShape(s.shape[0], s.shape[1]);

  const f = app.field;
  f.clearIgnitions();
  // Countries are gold everywhere except the closing scene, which cools them.
  if (i < S.s9) f.uniforms.uLitColor.value.copy(LIT_GOLD);
  // Far enough in the past that the ignition flash has fully decayed. May be
  // negative if the clock has barely started; the shader's sentinel allows it.
  const settled = app.clock.elapsedTime - 10;

  if (i > S.s4) {
    for (const idx of app.indicesByCountry.values()) f.ignite(idx, settled);
  } else if (i === S.s4 && app.ignitionSchedule) {
    for (const { at: when, idx } of app.ignitionSchedule) {
      if (when <= at) f.ignite(idx, settled);
    }
  }
}

function goToScene(i) {
  const n = Math.max(0, Math.min(SCENES.length - 1, i));
  prime(n);
  app.tl.seek(SCENES[n].at, true);
  app.tl.play();
  flashDebug(`→ ${n}  ${SCENES[n].name}`);
}

function bindKeys() {
  addEventListener('keydown', (e) => {
    switch (e.key) {
      case ' ':
        e.preventDefault();
        app.tl.paused() ? app.tl.play() : app.tl.pause();
        flashDebug(app.tl.paused() ? 'paused' : 'playing');
        break;
      case 'ArrowRight': e.preventDefault(); goToScene(currentSceneIndex() + 1); break;
      case 'ArrowLeft':  e.preventDefault(); goToScene(currentSceneIndex() - 1); break;
      case 'r': case 'R': goToScene(0); break;
      case 'f': case 'F':
        document.fullscreenElement ? document.exitFullscreen()
                                   : document.documentElement.requestFullscreen();
        break;
      case 'm': case 'M':
        flashDebug(app.narration?.toggleMute() ? 'voice muted' : 'voice on');
        break;
      case 'd': case 'D':
        app.debugOn = !app.debugOn;
        document.getElementById('debug').hidden = !app.debugOn;
        break;
      default:
        // 1–9 select scenes 1–9; 0 selects the tenth.
        if (/^[0-9]$/.test(e.key)) {
          const n = e.key === '0' ? 9 : parseInt(e.key, 10) - 1;
          if (n < SCENES.length) goToScene(n);
        }
    }
  });
}

function updateDebug(t) {
  const i = currentSceneIndex();
  const tt = app.tl.time();
  const mmss = (v) => `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, '0')}`;
  document.getElementById('debug').textContent =
    `scene ${i}  ${SCENES[i].name}\n` +
    `t     ${mmss(tt)} / ${mmss(TOTAL)}\n` +
    `shape ${app.currentShape}\n` +
    `fps   ${(1 / Math.max(t - last, 1 / 240)).toFixed(0)}\n` +
    `${app.tl.paused() ? 'PAUSED' : 'playing'}${app.flash ? `\n${app.flash}` : ''}`;
}

let flashTimer;
function flashDebug(msg) {
  app.flash = msg;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { app.flash = ''; }, 1400);
}
