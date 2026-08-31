#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  Renders the presentation to a video file.
//
//  Not a screen recording. The whole run is one scrubbable GSAP timeline, so
//  each frame can be asked for by name — `app.renderFrame(t)` draws exactly the
//  state at t — and the frames are captured one at a time, as slowly as they
//  need to be. The output is therefore identical whatever the machine was
//  doing: no dropped frames, no stutter, no throttling, and it can be rendered
//  larger than the screen it was captured on.
//
//  The voice track is muxed in afterwards rather than recorded, so it is the
//  original file, bit for bit.
//
//  Usage
//    node tools/export-video.mjs                        1080p, 30fps
//    node tools/export-video.mjs --fps 60               smoother, twice as long
//    node tools/export-video.mjs --width 3840           4K
//    node tools/export-video.mjs --from 85 --to 100     a section, to check
//    node tools/export-video.mjs --out talk.mp4
// ─────────────────────────────────────────────────────────────────────────────

import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8241;

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 && process.argv[i + 1] ? Number(process.argv[i + 1]) : fallback;
};
const argS = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const FPS = arg('--fps', 30);
// 17 is visually lossless and produced a gigabyte: this picture is sixteen
// thousand moving points, which is close to the worst case for an encoder.
// 20 is indistinguishable at viewing distance and roughly half the size.
const CRF = arg('--crf', 20);
const WIDTH = arg('--width', 1920);
const HEIGHT = Math.round((WIDTH / 16) * 9);
// resolve, not join: an absolute --out must stay absolute.
const OUT = resolve(ROOT, argS('--out', 'opga-welcome.mp4'));
const VOICE = join(ROOT, 'assets/narration.m4a');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mmss = (v) => `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, '0')}`;

// ── Serve the folder ────────────────────────────────────────────────────────
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
  { cwd: ROOT, stdio: 'ignore' });
const shutdown = () => { try { server.kill(); } catch {} };
process.on('exit', shutdown);
process.on('SIGINT', () => { shutdown(); process.exit(130); });
await sleep(900);

// ── Open the presentation in export mode ────────────────────────────────────
// Headed: a real GPU renders each frame in a fraction of the time software
// rasterisation takes, and the window is never looked at.
const browser = await chromium.launch({
  channel: 'chrome',
  headless: false,
  args: ['--hide-scrollbars', '--force-device-scale-factor=1', '--mute-audio'],
});
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
const problems = [];
page.on('pageerror', (e) => problems.push(e.message));

console.log(`\n  ${WIDTH}×${HEIGHT} at ${FPS}fps`);
process.stdout.write('  opening… ');
await page.goto(`http://127.0.0.1:${PORT}/index.html?export=1`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__app?.renderFrame && !document.getElementById('boot'),
  null, { timeout: 180000, polling: 400 });

const total = await page.evaluate(() => window.__app.tl.duration());

// The last spoken line runs on past the end of the timeline, over the held
// final card. Carry the video to the end of the voice rather than the end of
// the timeline, or the encoder cuts her off mid-sentence. Seeking past the
// duration clamps, so those frames simply hold the closing card.
const voiceSeconds = existsSync(VOICE)
  ? Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
      '-of', 'csv=p=0', VOICE]).toString().trim())
  : total;
const FROM = arg('--from', 0);
const TO = arg('--to', Math.max(total, voiceSeconds));
const frames = Math.round((TO - FROM) * FPS);
console.log(`ready · ${mmss(TO - FROM)} = ${frames} frames` +
  (TO > total ? `  (${(TO - total).toFixed(1)}s holding the final card while she finishes)` : ''));

// ── ffmpeg, fed frames on stdin ─────────────────────────────────────────────
const hasVoice = existsSync(VOICE) && FROM === 0 && TO >= total;
const ff = spawn('ffmpeg', [
  '-y', '-loglevel', 'error',
  // mjpeg must be named: ffmpeg will not reliably guess the codec of a stream
  // of concatenated JPEGs arriving on a pipe.
  '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', String(FPS), '-i', 'pipe:0',
  ...(hasVoice ? ['-i', VOICE] : []),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF),
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  ...(hasVoice ? ['-c:a', 'aac', '-b:a', '192k'] : []),
  OUT,
], { stdio: ['pipe', 'inherit', 'pipe'] });
let ffErr = '';
ff.stderr.on('data', (d) => { ffErr += d.toString(); });
ff.on('close', (code) => {
  if (code !== 0) console.error(`\n  ffmpeg exited ${code}:\n${ffErr.trim()}`);
});
// A dead encoder must not surface as an unhandled EPIPE from the writer.
ff.stdin.on('error', (e) => {
  if (e.code !== 'EPIPE') throw e;
  console.error(`\n  ffmpeg closed the pipe early.\n${ffErr.trim()}`);
});

// ── Capture ─────────────────────────────────────────────────────────────────
const started = Date.now();
let wrote = 0;

for (let i = 0; i < frames; i++) {
  const t = FROM + i / FPS;
  await page.evaluate(([tt, dt]) => window.__app.renderFrame(tt, dt), [t, 1 / FPS]);

  // Must be a page screenshot, not canvas.toDataURL. Only the globe and the
  // particles live in the canvas; every word — titles, the career list, the
  // country ticker, the panels, the pillar cards — is DOM layered above it.
  // Reading the canvas alone produced a five-minute film with no text in it.
  const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  wrote++;

  if (i % Math.max(1, Math.round(FPS * 5)) === 0 || i === frames - 1) {
    const done = (i + 1) / frames;
    const elapsed = (Date.now() - started) / 1000;
    const left = elapsed / done - elapsed;
    process.stdout.write(
      `\r  ${String(Math.round(done * 100)).padStart(3)}%  ` +
      `frame ${i + 1}/${frames}  at ${mmss(t)}  ` +
      `${(elapsed / (i + 1) * 1000).toFixed(0)}ms/frame  ` +
      `about ${mmss(left)} left      `);
  }
}

ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await browser.close();
shutdown();

console.log(`\n\n  wrote ${wrote} frames in ${mmss((Date.now() - started) / 1000)}`);
if (problems.length) problems.slice(0, 5).forEach((p) => console.log(`  page error: ${p}`));

const probe = (f, s) => execFileSync('ffprobe',
  ['-v', 'error', '-show_entries', s, '-of', 'csv=p=0', f]).toString().trim();
console.log(`  ${OUT}`);
console.log(`  ${probe(OUT, 'format=duration')}s · ` +
            `${(Number(probe(OUT, 'format=size')) / 1e6).toFixed(1)}MB · ` +
            `${hasVoice ? 'with the voice' : 'no audio (partial range)'}\n`);
