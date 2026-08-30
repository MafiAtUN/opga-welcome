#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  Renders data/narration.js into assets/narration.m4a using Azure AI Speech.
//
//  This is a BUILD-TIME tool. It is the only thing in the repo that touches
//  the network, and the presentation itself never runs it — `present.command`
//  plays the rendered file and nothing else. Run it on a machine with the
//  Azure CLI signed in, commit the audio, and the room stays offline.
//
//  Usage
//    node tools/narrate.mjs                 render the whole track
//    node tools/narrate.mjs --check         figures vs data/staff.js, no network
//    node tools/narrate.mjs --dry           timing report only, no network
//    node tools/narrate.mjs --voices        list the female voices available
//    node tools/narrate.mjs --sample        one paragraph in each candidate voice
//    node tools/narrate.mjs --voice NAME    override the voice in narration.js
//
//  Credentials, in order of preference:
//    $AZURE_SPEECH_KEY + $AZURE_SPEECH_REGION
//    otherwise `az cognitiveservices account keys list` on the account below.
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'assets');
const WORK = join(ROOT, '.narration-build');

// The Azure AI Services account that carries the Speech endpoint. Neural TTS
// is part of the account itself — there is no model deployment to create.
const ACCOUNT = { name: 'osaa-foundry-dev', group: 'osaa-oai-dev', region: 'eastus2' };

const SAMPLE_VOICES = [
  'en-US-AvaMultilingualNeural',
  'en-GB-SoniaNeural',
  'en-US-Emma2:DragonHDLatestNeural',
  'en-GB-Ada:DragonHDLatestNeural',
];

const SAMPLE_TEXT =
  'Thirty-one nations. One Assembly. Welcome to the Office of the President ' +
  'of the General Assembly, eighty-first session.';

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const opt = (f) => { const i = args.indexOf(f); return i < 0 ? null : args[i + 1]; };

const { CUES, VOICE, PROSODY, SPOKEN_FIGURES } = await import(join(ROOT, 'data/narration.js'));
const voice = opt('--voice') || VOICE;

// ── Credentials ─────────────────────────────────────────────────────────────

function credentials() {
  if (process.env.AZURE_SPEECH_KEY) {
    return { key: process.env.AZURE_SPEECH_KEY, region: process.env.AZURE_SPEECH_REGION || ACCOUNT.region };
  }
  try {
    const key = execFileSync('az', [
      'cognitiveservices', 'account', 'keys', 'list',
      '-n', ACCOUNT.name, '-g', ACCOUNT.group, '--query', 'key1', '-o', 'tsv',
    ], { encoding: 'utf8' }).trim();
    if (!key) throw new Error('empty');
    return { key, region: ACCOUNT.region };
  } catch {
    console.error(
      'Could not get a Speech key.\n' +
      '  Either  az login   (then re-run)\n' +
      '  or      export AZURE_SPEECH_KEY=…  AZURE_SPEECH_REGION=…');
    process.exit(1);
  }
}

// ── Speech REST ─────────────────────────────────────────────────────────────

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Wrap a cue's body in the document Azure expects. `ssml` is passed through. */
function ssmlFor(cue, v) {
  const body = cue.ssml ?? escape(cue.text);
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" ` +
         `xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">` +
         `<voice name="${v}">` +
         `<prosody rate="${PROSODY.rate}" pitch="${PROSODY.pitch}">${body}</prosody>` +
         `</voice></speak>`;
}

async function synthesize(ssml, { key, region }, file) {
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      // 48kHz PCM: assembled losslessly, encoded once at the end.
      'X-Microsoft-OutputFormat': 'riff-48khz-16bit-mono-pcm',
      'User-Agent': 'opga-welcome-narrate',
    },
    body: ssml,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${(await res.text()).slice(0, 300)}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

const ffprobe = (f) => parseFloat(execFileSync('ffprobe', [
  '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f,
], { encoding: 'utf8' }).trim());

// ── Modes ───────────────────────────────────────────────────────────────────

if (has('--voices')) {
  const { key, region } = credentials();
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`,
    { headers: { 'Ocp-Apim-Subscription-Key': key } });
  const list = await res.json();
  for (const v of list.filter((x) => x.Gender === 'Female' && x.Locale.startsWith('en-'))) {
    console.log(v.ShortName.padEnd(42), v.LocaleName);
  }
  process.exit(0);
}

if (has('--check')) {
  const D = await import(join(ROOT, 'src/derive.js'));
  const actual = {
    people: D.STATS.people,
    teams: D.STATS.teams,
    countries: D.STATS.countries,
    languages: D.STATS.languages,
    women: D.genderSplit.F,
    men: D.genderSplit.M,
    womenPct: Math.round((D.genderSplit.F / (D.genderSplit.F + D.genderSplit.M)) * 100),
    officialLanguagesPresent: D.officialLanguages.present.length,
    regionalGroups: D.byRegionalGroup.size,
    secondment: D.byContract.get('Secondment') ?? 0,
    consultant: D.byContract.get('Consultant') ?? 0,
  };
  let stale = 0;
  for (const [k, spoken] of Object.entries(SPOKEN_FIGURES)) {
    const now = actual[k];
    const ok = now === spoken;
    if (!ok) stale++;
    console.log(`${ok ? '  ok ' : ' ✗   '} ${k.padEnd(26)} spoken ${String(spoken).padStart(4)}   data ${String(now).padStart(4)}`);
  }
  console.log(stale
    ? `\n${stale} figure(s) have moved. Update the wording in data/narration.js and re-render.`
    : '\nEvery spoken figure still matches data/staff.js.');
  process.exit(stale ? 1 : 0);
}

// ── Render ──────────────────────────────────────────────────────────────────

// Must match SCENE_LIST in src/main.js. The last cue is written to land a few
// seconds past it, over the final card, which the timeline holds indefinitely.
const TOTAL = 293;

if (has('--sample')) {
  const creds = credentials();
  mkdirSync(WORK, { recursive: true });
  for (const v of SAMPLE_VOICES) {
    const f = join(WORK, `sample-${v.replace(/[^\w.-]/g, '_')}.wav`);
    await synthesize(ssmlFor({ text: SAMPLE_TEXT }, v), creds, f);
    console.log(`${ffprobe(f).toFixed(1)}s  ${f}`);
  }
  process.exit(0);
}

const creds = has('--dry') ? null : credentials();
rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

const rendered = [];
for (const [i, cue] of CUES.entries()) {
  const file = join(WORK, `cue-${String(i).padStart(2, '0')}.wav`);
  let dur;
  if (creds) {
    await synthesize(ssmlFor(cue, voice), creds, file);
    dur = ffprobe(file);
  } else {
    // ~2.4 words a second, which is what the voice averages at this rate.
    dur = ((cue.ssml ?? cue.text).replace(/<[^>]+>/g, '').split(/\s+/).length) / 2.4;
  }
  rendered.push({ ...cue, file, dur });
  process.stdout.write(`\r  ${i + 1}/${CUES.length} cues`);
}
console.log('');

// ── Timing report ───────────────────────────────────────────────────────────

const mmss = (v) => `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, '0')}`;
let problems = 0;
console.log('\n  start    end   len   line');
rendered.forEach((c, i) => {
  const end = c.at + c.dur;
  const next = rendered[i + 1];
  // Less than a breath between two cues reads as one run-on sentence, so
  // treat a missing gap as a timing problem rather than only an overlap.
  const clash = next && end > next.at - 0.35;
  const over = c.at >= TOTAL;
  if (clash || over) problems++;
  console.log(
    `  ${mmss(c.at).padStart(5)}  ${mmss(end).padStart(5)}  ${c.dur.toFixed(1).padStart(4)}  ` +
    `${(c.ssml ?? c.text).replace(/<[^>]+>/g, '').slice(0, 62)}` +
    `${clash ? `   ⚠ leaves only ${(next.at - end).toFixed(1)}s before the next cue` : ''}` +
    `${over ? '   ⚠ starts after the timeline has ended' : ''}`);
});
const trackEnd = Math.max(TOTAL, ...rendered.map((c) => c.at + c.dur)) + 1.2;
const tail = trackEnd - 1.2 - TOTAL;
const speech = rendered.reduce((a, c) => a + c.dur, 0);
if (tail > 0.05) {
  console.log(`\n  the last line finishes ${tail.toFixed(1)}s after the timeline stops, ` +
              'over the final card. That is deliberate — the close holds.');
}
console.log(`\n  ${rendered.length} cues · ${speech.toFixed(0)}s of speech in ${mmss(TOTAL)} ` +
            `(${Math.round((speech / TOTAL) * 100)}% of the run)`);
if (problems) console.log(`  ${problems} timing problem(s) above — adjust \`at\` in data/narration.js.`);

if (!creds) process.exit(problems ? 1 : 0);

// ── Assemble ────────────────────────────────────────────────────────────────
// One silent bed the exact length of the timeline, with each cue mixed in at
// its own position. adelay places them to the millisecond, so the spoken track
// lines up with the picture no matter how fast the voice turns out to be.

const inputs = rendered.flatMap((c) => ['-i', c.file]);
const filter = rendered
  .map((c, i) => `[${i}:a]adelay=${Math.round(c.at * 1000)}:all=1[d${i}]`)
  .join(';') +
  ';' + rendered.map((_, i) => `[d${i}]`).join('') +
  `amix=inputs=${rendered.length}:normalize=0:dropout_transition=0[mix];` +
  // Normalised to -16 LUFS: loud enough for a room with the air conditioning
  // on, and identical whichever voice the script is rendered in.
  `[mix]apad,atrim=0:${trackEnd.toFixed(3)},loudnorm=I=-16:TP=-1.5:LRA=9,aresample=48000[out]`;

const m4a = join(OUT_DIR, 'narration.m4a');
execFileSync('ffmpeg', [
  '-y', '-hide_banner', '-loglevel', 'error',
  ...inputs, '-filter_complex', filter, '-map', '[out]',
  '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', m4a,
], { stdio: 'inherit' });

writeFileSync(join(OUT_DIR, 'narration.json'), JSON.stringify({
  voice, prosody: PROSODY, timeline: TOTAL, track: +trackEnd.toFixed(2),
  renderedAt: new Date().toISOString(),
  cues: rendered.map(({ at, dur, text, ssml, note }) => ({
    at, dur: +dur.toFixed(2), text: (ssml ?? text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), note,
  })),
}, null, 2) + '\n');

rmSync(WORK, { recursive: true, force: true });
console.log(`\n  ${m4a}  ${mmss(ffprobe(m4a))}  ${voice}`);
console.log(`  ${join(OUT_DIR, 'narration.json')}  (transcript, for the record)`);
