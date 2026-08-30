#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  Drives the presentation in a real browser and checks that the picture and
//  the voice actually stay together.
//
//  This is the test that `selfcheck.html` cannot be: it plays in real time, in
//  Google Chrome, with the audio decoding — so it catches drift, autoplay
//  failures, resync-after-jump bugs and frame-rate problems that stepping the
//  timeline by hand will never show.
//
//  It drives **Google Chrome**, not Playwright's bundled Chromium, for two
//  reasons: Chromium's open-source build has no AAC decoder and would fail on
//  narration.m4a, and Chrome is what the room will actually be running.
//
//  Usage
//    node tools/check-playback.mjs            the standard pass (~2 min)
//    node tools/check-playback.mjs --full     plays all 4:53 end to end
//    node tools/check-playback.mjs --headed   watch it happen
// ─────────────────────────────────────────────────────────────────────────────

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8231;
const URL = `http://127.0.0.1:${PORT}/index.html?room=1`;

const FULL = process.argv.includes('--full');
const HEADED = process.argv.includes('--headed');

// How far the voice may sit from the picture before we call it broken. The
// player corrects at 0.25s; allow a little more for the sampling itself.
const DRIFT_LIMIT = 0.45;
const MIN_FPS = 50;
const SOFTWARE_MIN_FPS = 15;   // headless swiftshader; not representative of the room

let failures = 0;
const pass = (m, d = '') => console.log(`  \x1b[32mok\x1b[0m   ${m}${d ? `  \x1b[2m${d}\x1b[0m` : ''}`);
const fail = (m, d = '') => { failures++; console.log(`  \x1b[31mFAIL\x1b[0m ${m}${d ? `  ${d}` : ''}`); };
const info = (m) => console.log(`  \x1b[2m·    ${m}\x1b[0m`);
const head = (m) => console.log(`\n\x1b[1m${m}\x1b[0m`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── A local server, so the test never depends on one already running ────────
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
  { cwd: ROOT, stdio: 'ignore' });
const shutdown = () => { try { server.kill(); } catch {} };
process.on('exit', shutdown);
process.on('SIGINT', () => { shutdown(); process.exit(130); });
await sleep(900);

const browser = await chromium.launch({
  channel: 'chrome',
  headless: !HEADED,
  args: [
    // Without this the voice waits for a click, exactly as it would in the room
    // if present.command did not pass the same flag.
    '--autoplay-policy=no-user-gesture-required',
    // Headless has no GPU, so it needs software rasterisation — but then the
    // frame rate it reports is meaningless. Run --headed for a real number.
    ...(HEADED ? [] : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']),
  ],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });

// ── Anything the page complains about is a failure ──────────────────────────
const problems = [];
let missingPhotos = 0;

// A missing headshot is the designed monogram fallback, not a fault — count
// them, don't fail on them. Everything else the page complains about is real.
const expected = (url) => /favicon/.test(url) || /assets\/photos\//.test(url);

page.on('console', (m) => {
  if (m.type() !== 'error') return;
  const text = m.text();
  // A 404 console line carries no URL, so pair it with the response log below.
  if (/Failed to load resource/.test(text)) return;
  problems.push(`console.error: ${text}`);
});
page.on('response', (r) => {
  if (r.status() < 400) return;
  if (/assets\/photos\//.test(r.url())) { missingPhotos++; return; }
  if (!expected(r.url())) problems.push(`HTTP ${r.status()}: ${r.url()}`);
});
page.on('pageerror', (e) => problems.push(`uncaught: ${e.message}`));
page.on('requestfailed', (r) => {
  if (!expected(r.url())) problems.push(`request failed: ${r.url()} — ${r.failure()?.errorText}`);
});

const state = () => page.evaluate(() => {
  const a = window.__app;
  const au = a?.narration?.audio;
  return {
    t: a?.tl?.time() ?? -1,
    dur: a?.tl?.duration() ?? -1,
    paused: a?.tl?.paused() ?? true,
    audioTime: au?.currentTime ?? -1,
    audioPaused: au?.paused ?? true,
    audioDur: Number.isFinite(au?.duration) ? au.duration : -1,
    readyState: au?.readyState ?? -1,
    muted: a?.narration?.isMuted?.() ?? null,
    scene: a?.currentShape ?? '?',
    hintShown: !document.getElementById('audiohint')?.hidden,
  };
});

// ── Pre-flight: does what is on disk still match the roster? ────────────────
// Removing someone from data/staff.js does not remove their headshot, and a
// published copy would go on carrying the face of a colleague who has left.
{
  const { readdirSync } = await import('node:fs');
  const { STAFF } = await import(`file://${join(ROOT, 'data/staff.js')}`);
  const ids = new Set(STAFF.map((p) => p.id));
  const files = readdirSync(join(ROOT, 'assets/photos'))
    .filter((f) => /\.(jpe?g|png)$/i.test(f));
  const orphans = files.filter((f) => !ids.has(f.replace(/\.[^.]+$/, '')));
  head('Roster and assets');
  orphans.length === 0
    ? pass('every headshot belongs to someone on the roster', `${files.length} files`)
    : orphans.forEach((f) => fail(`assets/photos/${f} is not on the roster — delete it`));
}

head('OPGA 81 — real-browser playback check');
info(`Google Chrome · ${FULL ? 'full run' : 'sampled run'} · ${HEADED ? 'headed' : 'headless'}`);

// ── 1 · Boot ────────────────────────────────────────────────────────────────
head('Boot');
const t0 = Date.now();
await page.goto(URL, { waitUntil: 'load' });
await page.waitForFunction(() => window.__app?.tl && !document.getElementById('boot'),
  null, { timeout: 40000 });
pass('presentation booted', `${((Date.now() - t0) / 1000).toFixed(1)}s`);

const s0 = await state();
s0.dur > 290 && s0.dur < 300
  ? pass('timeline duration', `${s0.dur.toFixed(2)}s`)
  : fail('timeline duration out of range', `${s0.dur}`);
s0.audioDur > 0
  ? pass('narration decoded', `${s0.audioDur.toFixed(2)}s track`)
  : fail('narration did not decode — check the AAC codec / file path');
s0.audioDur >= s0.dur
  ? pass('track covers the timeline', `+${(s0.audioDur - s0.dur).toFixed(1)}s tail`)
  : fail('track is shorter than the timeline', `${s0.audioDur} < ${s0.dur}`);

// ── 2 · Autoplay ────────────────────────────────────────────────────────────
head('Autoplay');
await sleep(1200);
const s1 = await state();
!s1.audioPaused ? pass('voice started without a gesture')
                : fail('voice did not autoplay', 'present.command must pass --autoplay-policy');
!s1.hintShown ? pass('no "press any key" hint shown')
              : fail('audio was blocked — hint is visible');

// ── 3 · Sync while playing ──────────────────────────────────────────────────
head(`Sync${FULL ? ' (full run)' : ' (sampled)'}`);
const watchFor = FULL ? 300 : 30;
let worst = 0, worstAt = 0, samples = 0, everPaused = 0;
const started = Date.now();
while ((Date.now() - started) / 1000 < watchFor) {
  await sleep(500);
  const s = await state();
  if (s.t >= s.dur - 0.2) break;           // timeline finished
  if (s.audioPaused) { everPaused++; continue; }
  const d = Math.abs(s.audioTime - s.t);
  samples++;
  if (d > worst) { worst = d; worstAt = s.t; }
  if (FULL && samples % 40 === 0) info(`t=${s.t.toFixed(0)}s  drift ${d.toFixed(3)}s`);
}
samples > 10 ? pass(`${samples} sync samples taken`) : fail('too few sync samples', `${samples}`);
worst <= DRIFT_LIMIT
  ? pass('voice stays with the picture', `worst drift ${worst.toFixed(3)}s at t=${worstAt.toFixed(0)}s`)
  : fail('voice drifted from the picture', `${worst.toFixed(3)}s at t=${worstAt.toFixed(0)}s`);
everPaused === 0
  ? pass('voice never stalled mid-run')
  : fail('voice stalled during playback', `${everPaused} samples`);

// ── 4 · Frame rate ──────────────────────────────────────────────────────────
head('Frame rate');
const gpu = await page.evaluate(() => {
  const gl = document.createElement('canvas').getContext('webgl');
  const ext = gl?.getExtension('WEBGL_debug_renderer_info');
  return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown';
});
const software = /swiftshader|llvmpipe|software/i.test(gpu);
const fps = await page.evaluate(() => new Promise((res) => {
  let n = 0; const start = performance.now();
  const tick = () => { n++; performance.now() - start < 3000 ? requestAnimationFrame(tick)
                                                             : res(n / ((performance.now() - start) / 1000)); };
  requestAnimationFrame(tick);
}));
info(`renderer: ${gpu}`);
// Software rasterisation is not what the room will run on, so it gets a much
// lower bar — it is here to catch a pathological stall, not to judge the GPU.
const bar = software ? SOFTWARE_MIN_FPS : MIN_FPS;
fps >= bar
  ? pass('frame rate', `${fps.toFixed(1)} fps${software ? ' (software GL — a real GPU will be far higher)' : ''}`)
  : fail('frame rate too low', `${fps.toFixed(1)} fps, needed ${bar}`);

// ── 5 · Pause and resume ────────────────────────────────────────────────────
// After a --full watch the timeline has finished, and the interaction tests
// below are only meaningful while it is still running. Put the playhead back.
if (FULL) {
  await page.evaluate(() => {
    const a = window.__app;
    a.tl.seek(40, true);
    a.narration.audio.currentTime = 40;
    a.tl.play();
  });
  await sleep(1500);
  info('rewound to t=40s for the interaction tests');
}

head('Space — pause and resume');
await page.keyboard.press('Space');
await sleep(700);
const sp = await state();
sp.paused && sp.audioPaused ? pass('both picture and voice pause')
                            : fail('pause did not stop both', JSON.stringify(sp));
const heldT = sp.t, heldA = sp.audioTime;
await sleep(1500);
const sp2 = await state();
Math.abs(sp2.t - heldT) < 0.05 && Math.abs(sp2.audioTime - heldA) < 0.05
  ? pass('nothing advances while paused')
  : fail('something kept moving while paused', `Δt=${(sp2.t - heldT).toFixed(2)} Δa=${(sp2.audioTime - heldA).toFixed(2)}`);
await page.keyboard.press('Space');
await sleep(1200);
const sp3 = await state();
!sp3.paused && !sp3.audioPaused && Math.abs(sp3.audioTime - sp3.t) <= DRIFT_LIMIT
  ? pass('resumes together', `drift ${Math.abs(sp3.audioTime - sp3.t).toFixed(3)}s`)
  : fail('did not resume in sync', JSON.stringify(sp3));

// ── 6 · Jumping between scenes ──────────────────────────────────────────────
head('Scene jumps');
for (const [key, wantScene] of [['5', 4], ['8', 7], ['2', 1], ['0', 9]]) {
  await page.keyboard.press(key);
  await sleep(1400);
  const s = await state();
  const want = await page.evaluate((i) => window.__app.__scenes[i].at, wantScene);
  const okT = s.t >= want - 0.5 && s.t < want + 3.5;
  const okA = Math.abs(s.audioTime - s.t) <= DRIFT_LIMIT;
  okT && okA
    ? pass(`"${key}" → scene ${wantScene}`, `t=${s.t.toFixed(1)}s  drift ${Math.abs(s.audioTime - s.t).toFixed(3)}s`)
    : fail(`"${key}" → scene ${wantScene}`, `t=${s.t.toFixed(1)} (want ~${want})  drift ${Math.abs(s.audioTime - s.t).toFixed(3)}`);
}

head('Arrow keys');
await page.keyboard.press('ArrowLeft');
await sleep(1200);
const back = await state();
Math.abs(back.audioTime - back.t) <= DRIFT_LIMIT
  ? pass('← resyncs the voice', `t=${back.t.toFixed(1)}s`)
  : fail('← left the voice behind', `drift ${Math.abs(back.audioTime - back.t).toFixed(3)}s`);

// ── 7 · Mute ────────────────────────────────────────────────────────────────
head('M — mute');
await page.keyboard.press('m');
await sleep(800);
const m1 = await state();
m1.muted && m1.audioPaused ? pass('voice mutes, picture keeps running')
                           : fail('mute did not silence the voice', JSON.stringify(m1));
const stillMoving = await (async () => { const a = (await state()).t; await sleep(1000); return (await state()).t > a; })();
stillMoving ? pass('picture continues while muted') : fail('picture stopped when muted');
await page.keyboard.press('m');
await sleep(1200);
const m2 = await state();
!m2.muted && !m2.audioPaused && Math.abs(m2.audioTime - m2.t) <= DRIFT_LIMIT
  ? pass('unmutes back in sync', `drift ${Math.abs(m2.audioTime - m2.t).toFixed(3)}s`)
  : fail('unmute did not resync', JSON.stringify(m2));

// ── 8 · The tail past the end of the timeline ───────────────────────────────
head('The close');
await page.evaluate(() => {
  const a = window.__app;
  a.tl.seek(a.tl.duration() - 6, true);
  a.narration.audio.currentTime = a.tl.duration() - 6;
  a.tl.play();
});
await sleep(9000);
const end = await state();
end.t >= end.dur - 0.3 ? pass('timeline reaches the end', `${end.t.toFixed(1)}s`)
                       : fail('timeline did not finish', `${end.t.toFixed(1)}s`);
!end.audioPaused && end.audioTime > end.dur
  ? pass('last line still speaking over the held card', `audio at ${end.audioTime.toFixed(1)}s`)
  : fail('voice stopped at the timeline end', `audio ${end.audioTime.toFixed(1)}s, paused=${end.audioPaused}`);

// ── 9 · Anything the page reported ──────────────────────────────────────────
head('Page errors');
info(`${missingPhotos} missing headshot request(s) — these fall back to monograms, by design`);
problems.length === 0
  ? pass('no console errors, no failed requests')
  : problems.slice(0, 12).forEach((p) => fail(p));

// ── Result ──────────────────────────────────────────────────────────────────
await browser.close();
shutdown();
console.log();
if (failures === 0) {
  console.log('\x1b[1;32mALL CLEAR\x1b[0m — picture and voice verified in Google Chrome.\n');
  process.exit(0);
} else {
  console.log(`\x1b[1;31m${failures} FAILURE(S)\x1b[0m — see above.\n`);
  process.exit(1);
}
