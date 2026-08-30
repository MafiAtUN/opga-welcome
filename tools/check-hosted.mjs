#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  Checks the presentation behaves correctly in a browser that will NOT play
//  sound on its own — which is every browser opening a hosted copy, because a
//  web page cannot be given Chrome's --autoplay-policy flag.
//
//  The presentation must then hold on a start card and begin the picture and
//  the voice together on the click. This test proves both halves: the gate
//  appears without the flag, and does not appear with it.
//
//    node tools/check-hosted.mjs [--url https://…]
//
//  With no --url it serves the local folder, which is the same code the hosted
//  copy runs.
// ─────────────────────────────────────────────────────────────────────────────

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8232;

const urlArg = process.argv.indexOf('--url');
const REMOTE = urlArg > -1 ? process.argv[urlArg + 1] : null;
const URL = REMOTE || `http://127.0.0.1:${PORT}/index.html`;

let failures = 0;
const pass = (m, d = '') => console.log(`  \x1b[32mok\x1b[0m   ${m}${d ? `  \x1b[2m${d}\x1b[0m` : ''}`);
const fail = (m, d = '') => { failures++; console.log(`  \x1b[31mFAIL\x1b[0m ${m}${d ? `  ${d}` : ''}`); };
const info = (m) => console.log(`  \x1b[2m·    ${m}\x1b[0m`);
const head = (m) => console.log(`\n\x1b[1m${m}\x1b[0m`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let server = null;
if (!REMOTE) {
  server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
    { cwd: ROOT, stdio: 'ignore' });
  process.on('exit', () => { try { server.kill(); } catch {} });
  await sleep(900);
}

const state = (page) => page.evaluate(() => {
  const a = window.__app;
  const au = a?.narration?.audio;
  return {
    t: a?.tl?.time() ?? -1,
    paused: a?.tl?.paused() ?? true,
    audioTime: au?.currentTime ?? -1,
    audioPaused: au?.paused ?? true,
    audioDur: Number.isFinite(au?.duration) ? au.duration : -1,
    gate: !!document.getElementById('startgate'),
  };
});

head('OPGA 81 — hosted-copy check');
info(URL);

// ── A browser with no autoplay permission: what a reviewer will actually get ─
head('Without autoplay permission (a hosted copy)');
const strict = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
         '--autoplay-policy=document-user-activation-required'],
});
{
  const page = await strict.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__app?.tl && !document.getElementById('boot'),
    null, { timeout: 120000 });
  await sleep(2500);

  const before = await state(page);
  before.gate ? pass('start card is shown') : fail('no start card — the run would play silently');
  before.paused && before.t < 0.5
    ? pass('presentation waits for the click', `t=${before.t.toFixed(2)}s`)
    : fail('presentation started without sound', `t=${before.t.toFixed(2)}s`);
  before.audioDur > 0
    ? pass('narration loaded and ready', `${before.audioDur.toFixed(1)}s`)
    : fail('narration did not load');

  await page.click('#startgate');
  await sleep(2500);
  const after = await state(page);
  !after.paused ? pass('click starts the picture', `t=${after.t.toFixed(2)}s`)
                : fail('click did not start the picture');
  !after.audioPaused ? pass('click starts the voice') : fail('voice still silent after the click');
  Math.abs(after.audioTime - after.t) < 0.5
    ? pass('both begin together', `drift ${Math.abs(after.audioTime - after.t).toFixed(3)}s`)
    : fail('picture and voice began apart', `drift ${Math.abs(after.audioTime - after.t).toFixed(3)}s`);
  await sleep(1200);
  (await state(page)).gate ? fail('start card did not go away') : pass('start card clears');

  errors.length ? errors.slice(0, 5).forEach((e) => fail(`uncaught: ${e}`))
                : pass('no uncaught errors');
  await strict.close();
}

// ── And with permission — present.command's case — the gate must NOT appear ──
head('With autoplay permission (present.command)');
const relaxed = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
         '--autoplay-policy=no-user-gesture-required'],
});
{
  const page = await relaxed.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`${URL}${URL.includes('?') ? '&' : '?'}room=1`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__app?.tl && !document.getElementById('boot'),
    null, { timeout: 120000 });
  await sleep(3000);
  const s = await state(page);
  !s.gate ? pass('no start card — runs hands-free') : fail('start card appeared unnecessarily');
  !s.paused && !s.audioPaused
    ? pass('picture and voice both running', `t=${s.t.toFixed(1)}s`)
    : fail('did not start on its own', JSON.stringify(s));
  await relaxed.close();
}

if (server) server.kill();
console.log();
if (failures === 0) {
  console.log('\x1b[1;32mALL CLEAR\x1b[0m — correct in both a hosted copy and the room.\n');
  process.exit(0);
}
console.log(`\x1b[1;31m${failures} FAILURE(S)\x1b[0m\n`);
process.exit(1);
