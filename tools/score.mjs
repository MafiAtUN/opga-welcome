#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  Writes the music bed and mixes it under the voice.
//
//  The score is synthesised here rather than licensed, so the whole
//  presentation stays offline and nothing in it needs clearing. It is a slow
//  four-chord cycle in D minor — i · VI · III · VII — which is solemn without
//  being funereal and resolves rather than merely stopping.
//
//  It is deliberately plain: sustained pads, a sub, a breath of air, and a
//  single bell at each act. There is a voice on top of this for four of its
//  five minutes, and anything with a melody would fight her.
//
//  Levels are set by the mix, not by ear-guessing here: ffmpeg ducks the music
//  under the narration with a sidechain compressor, so the bed drops a few dB
//  whenever she speaks and swells back in the gaps.
//
//  Usage
//    node tools/score.mjs              render the bed and mix the final track
//    node tools/score.mjs --music-only leave the mix alone, just write the bed
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'assets');
const WORK = join(ROOT, '.narration-build');
const VOICE = join(ASSETS, 'narration.voice.m4a');
const OUT = join(ASSETS, 'narration.m4a');
const BED_WAV = join(WORK, 'score.wav');

const SR = 44100;

// How loud the bed sits against the voice, and how hard it steps back when she
// speaks. Raising BED lifts the music everywhere; raising DUCK_RATIO pulls it
// further down under speech, so the two together control "louder in the gaps
// without crowding the voice". Override from the command line while tuning:
//   node tools/score.mjs --bed 0.75
const argOf = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 && process.argv[i + 1] ? Number(process.argv[i + 1]) : fallback;
};
const BED = argOf('--bed', 0.78);
const DUCK_RATIO = argOf('--duck', 6);
const DUCK_THRESHOLD = argOf('--threshold', 0.02);
// Short pauses between sentences are the bulk of the silence. A slow release
// meant the bed never climbed back during them and the music read as absent;
// recovering in about a third of a second fills those without pumping.
const DUCK_RELEASE = argOf('--release', 320);

// ── The piece ───────────────────────────────────────────────────────────────

// Scene boundaries from SCENE_LIST in src/main.js, used to place the bells and
// shape the dynamics. Kept as plain numbers so this file needs no imports.
const SCENES = [0, 22, 58, 73, 85, 153, 191, 218, 249, 277, 296];

/** i · VI · III · VII in D minor. Frequencies in Hz, low to high. */
const CHORDS = [
  { name: 'Dm',  sub: 73.42, tones: [146.83, 174.61, 220.00] },  // D  F  A
  { name: 'B♭',  sub: 58.27, tones: [116.54, 146.83, 174.61] },  // B♭ D  F
  { name: 'F',   sub: 87.31, tones: [130.81, 174.61, 220.00] },  // C  F  A
  { name: 'C',   sub: 65.41, tones: [130.81, 164.81, 196.00] },  // C  E  G
];
const CHORD_SECONDS = 20;
const CROSSFADE = 3.5;

/**
 * How present the bed is, section by section. The globe and the six pillars
 * carry it; the quiet scenes stay quiet so the voice has room.
 */
const DYNAMICS = [
  [0, 0.00], [3, 0.42], [22, 0.50], [58, 0.46], [73, 0.50],
  [85, 0.72], [125, 0.80], [153, 0.52], [191, 0.46], [218, 0.68],
  [249, 0.58], [277, 0.72], [295, 0.60], [305, 0.00],
];

const lerp = (a, b, t) => a + (b - a) * t;

function envelopeAt(t) {
  for (let i = 0; i < DYNAMICS.length - 1; i++) {
    const [t0, v0] = DYNAMICS[i], [t1, v1] = DYNAMICS[i + 1];
    if (t >= t0 && t <= t1) {
      const k = (t - t0) / (t1 - t0);
      return lerp(v0, v1, k * k * (3 - 2 * k));      // smoothstep
    }
  }
  return DYNAMICS.at(-1)[1];
}

/** Equal-power crossfade between the chord playing and the one arriving. */
function chordMix(t) {
  const idx = Math.floor(t / CHORD_SECONDS);
  const into = t - idx * CHORD_SECONDS;
  const cur = CHORDS[idx % CHORDS.length];
  const nxt = CHORDS[(idx + 1) % CHORDS.length];
  if (into < CHORD_SECONDS - CROSSFADE) return [[cur, 1]];
  const k = (into - (CHORD_SECONDS - CROSSFADE)) / CROSSFADE;
  return [[cur, Math.cos(k * Math.PI / 2)], [nxt, Math.sin(k * Math.PI / 2)]];
}

// ── Reverb: four combs into two allpasses, the usual Schroeder arrangement ──

function makeReverb(roomSize = 0.86, damp = 0.28) {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356].map((n) => ({
    buf: new Float32Array(n), i: 0, store: 0,
  }));
  const allpass = [225, 556, 441, 341].map((n) => ({ buf: new Float32Array(n), i: 0 }));
  return (x) => {
    let out = 0;
    for (const c of combs) {
      const y = c.buf[c.i];
      c.store = y * (1 - damp) + c.store * damp;
      c.buf[c.i] = x + c.store * roomSize;
      c.i = (c.i + 1) % c.buf.length;
      out += y;
    }
    out /= combs.length;
    for (const a of allpass) {
      const y = a.buf[a.i];
      a.buf[a.i] = out + y * 0.5;
      a.i = (a.i + 1) % a.buf.length;
      out = y - out;
    }
    return out;
  };
}

// ── Render ──────────────────────────────────────────────────────────────────

function render(seconds) {
  const n = Math.ceil(seconds * SR);
  const dry = new Float32Array(n);

  // Slow independent drifts, so nothing in the pad ever lines up exactly and
  // the texture keeps moving without anything appearing to happen.
  const drift = (t, k) => 1 + 0.06 * Math.sin(t * (0.031 + k * 0.017) + k * 2.4);

  // One bell at the top of each act, on a chord tone, very soft.
  const bells = SCENES.slice(0, -1).map((at, i) => ({
    at, freq: CHORDS[Math.floor(at / CHORD_SECONDS) % CHORDS.length]
      .tones[i % 3] * (i % 2 ? 2 : 4),
  }));

  let air = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let s = 0;

    for (const [chord, w] of chordMix(t)) {
      // Sub: felt more than heard.
      s += Math.sin(2 * Math.PI * chord.sub * t) * 0.30 * w * drift(t, 0);

      chord.tones.forEach((f, k) => {
        // Three slightly detuned partials make one voice that breathes.
        //
        // They each get their own phase offset. Started together they drift in
        // and out of alignment as one, which swung the whole bed by five
        // decibels — loud enough to sound present, then quiet enough to sound
        // missing. Offsetting them keeps the beating but stops it lining up.
        for (let d = -1; d <= 1; d++) {
          const fd = f * (1 + d * 0.0016);
          const phase = k * 1.31 + (d + 1) * 2.09;
          s += Math.sin(2 * Math.PI * fd * t + phase) * 0.085 * w * drift(t, k + d + 2);
        }
        // An octave up, quieter, for air at the top of the chord.
        s += Math.sin(2 * Math.PI * f * 2 * t + k * 1.7) * 0.030 * w * drift(t, k + 7);
      });
    }

    // A breath of filtered noise, so the pad is not purely synthetic.
    air = air * 0.9992 + (Math.random() * 2 - 1) * 0.0008;
    s += air * (0.5 + 0.5 * Math.sin(t * 0.07));

    for (const b of bells) {
      const dt = t - b.at;
      if (dt >= 0 && dt < 9) {
        s += Math.sin(2 * Math.PI * b.freq * dt) * 0.055 * Math.exp(-dt * 0.85);
      }
    }

    dry[i] = s * envelopeAt(t);
  }

  // Reverb, then a gentle one-pole low pass to take the edge off.
  const revL = makeReverb(0.86, 0.26);
  const revR = makeReverb(0.87, 0.30);
  const out = new Float32Array(n * 2);
  let lpL = 0, lpR = 0;
  const DELAY = Math.round(SR * 0.013);          // Haas widening
  for (let i = 0; i < n; i++) {
    const x = dry[i];
    const xr = i >= DELAY ? dry[i - DELAY] : 0;
    let l = x * 0.55 + revL(x) * 0.80;
    let r = xr * 0.55 + revR(xr) * 0.80;
    lpL += (l - lpL) * 0.34; lpR += (r - lpR) * 0.34;
    out[i * 2] = lpL;
    out[i * 2 + 1] = lpR;
  }

  // Normalise with headroom; the mix sets the final level.
  let peak = 0;
  for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]));
  const g = peak > 0 ? 0.82 / peak : 1;
  for (let i = 0; i < out.length; i++) out[i] *= g;
  return out;
}

function writeWav(path, samples) {
  const bytes = samples.length * 2;
  const buf = Buffer.alloc(44 + bytes);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + bytes, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(bytes, 40);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  writeFileSync(path, buf);
}

const ff = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
const dur = (f) => Number(execFileSync('ffprobe',
  ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());

// ── Main ────────────────────────────────────────────────────────────────────

mkdirSync(WORK, { recursive: true });

if (!existsSync(VOICE)) {
  console.error(`\n  Voice track not found: ${VOICE}`);
  console.error('  Run `node tools/narrate.mjs` first.\n');
  process.exit(1);
}

const voiceSeconds = dur(VOICE);
console.log(`\n  voice   ${voiceSeconds.toFixed(2)}s`);
process.stdout.write('  score   synthesising… ');
writeWav(BED_WAV, render(voiceSeconds + 1.5));
console.log(`${(statSync(BED_WAV).size / 1e6).toFixed(1)}MB wav`);

if (process.argv.includes('--music-only')) {
  console.log(`\n  ${BED_WAV}\n`);
  process.exit(0);
}

process.stdout.write(`  mix     bed ${BED}, duck ${DUCK_RATIO}:1, release ${DUCK_RELEASE}ms… `);
ff([
  '-i', VOICE, '-i', BED_WAV,
  '-filter_complex',
  // Both sides are forced to 48k stereo BEFORE anything is summed. Left to
  // itself amix adopts the first input's layout, which collapsed the mix to
  // mono — and mono-summing the bed's Haas widening comb-filters it into
  // something hollow. The voice is duplicated to both channels, centred.
  // The voice is split in two: one copy is mixed, the other only steers the
  // compressor. A label may be consumed once, and `[v]` would additionally be
  // read as a video stream specifier — hence the names.
  '[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,' +
    'asplit=2[voice][key];' +
  // dynaudnorm evens the bed out over a long window. A pad built from detuned
  // partials still wanders a few decibels, and an uneven bed is what "the
  // music is too low" usually means — it is not too quiet everywhere, it
  // disappears in places.
  '[1:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,' +
    'dynaudnorm=f=500:g=31:p=0.85:m=6:s=8,' +
    `volume=${BED}[bed];` +
  // The bed is compressed by the voice, so it steps back whenever she speaks
  // and swells back in the gaps.
  `[bed][key]sidechaincompress=threshold=${DUCK_THRESHOLD}:ratio=${DUCK_RATIO}` +
    `:attack=25:release=${DUCK_RELEASE}:makeup=1[ducked];` +
  '[voice][ducked]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0[m];' +
  '[m]afade=t=in:st=0:d=2,afade=t=out:st=' + (voiceSeconds - 3).toFixed(2) + ':d=3,' +
  // -17 rather than -18: the extra music energy made loudnorm pull the whole
  // mix down, which quietly cost the voice about a decibel it did not need to
  // lose.
  'alimiter=limit=0.95,loudnorm=I=-17:TP=-2:LRA=11,' +
  'aformat=sample_rates=48000:channel_layouts=stereo[out]',
  '-map', '[out]', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-ac', '2',
  '-movflags', '+faststart',
  OUT,
]);
console.log('done');

console.log(`\n  ${OUT}  ${dur(OUT).toFixed(2)}s  ${(statSync(OUT).size / 1e6).toFixed(1)}MB\n`);
