# CLAUDE.md

Guidance for Claude Code working in this repository.

## What this is

A 4:56 narrated opening presentation for the first all-staff meeting of the
Office of the President of the General Assembly, 81st Session. It is shown once,
in a room, to the people it is about. Read `README.md` first — it is written for
the person presenting and is the fuller document; this file is the working
brief for changing the thing.

**There is no build step and no framework.** ES modules loaded straight from
`index.html`, three.js + GSAP + d3-geo pinned in `vendor/`. Do not add a
bundler, a package manager step, or a runtime dependency: the presentation must
run from a local folder with the wifi switched off.

## Commands

```
open present.command       serve on 127.0.0.1:8113 and open Chrome fullscreen
npm run check              drive real Chrome via Playwright — sync, keys, the close
npm run check:full         the same, playing the whole 4:56
npm run figures            are the numbers the voice speaks still true?
npm run narrate            re-render the voice (network — Azure Speech)
npm run score              mix the music bed under the voice
npm run verify             rendered line durations; flags any line that overruns
npm run video              render opga-welcome.mp4 (gitignored, ~136MB)
```

`npm install` is needed only for the checks, never to present.

**Run `npm run figures` and `npm run check` before committing anything that
touches `data/` or `src/`.** They are fast and they catch the two failures that
matter: a spoken number that no longer matches the roster, and a scene that no
longer plays.

## The one rule about data

`data/staff.js` is the **single source of truth** for everyone in the Office.
`src/derive.js` computes every figure from it at runtime — headline counts,
globe markers, the language cloud, the gender split, regional groups, how we
came here. **Nothing derived from the roster may be hardcoded anywhere else**,
including in the README, in scene code, or in a comment that will quietly go
stale. If you need a number, import it from `derive.js`.

The narration is the exception, because speech has to be rendered ahead of
time: figures spoken aloud are baked into `assets/narration.m4a`. That is why
`npm run figures` exists — it diffs the spoken figures in `data/narration.js`
against `derive.js` and names the stale lines. After a roster change:
`npm run figures`, fix the words, then `npm run narrate && npm run score`.

Other data files: `data/countries.js` (flags, centroids, regional group, atlas
name, principal language) and `data/vision.js` (the President's career, theme
and six priorities, transcribed from the vision statement).

## Conventions that are deliberate, not accidental

- **Never invent a fact about a colleague.** A missing name, team or title is
  left blank and the UI degrades — a nameless row is still counted in every
  figure and still lights its country on the globe, but draws no face card. An
  honest gap beats a placeholder on a welcome slide. Anything uncertain gets
  `verified: false` and a `note`, and surfaces in `verify.html`.
- **Nothing about money on screen.** No contract type, grade or funding line, by
  request of the Office. The composition scene says only how many colleagues
  governments released to this work and how many the UN employs.
- **Claims that flip themselves.** Where the presentation asserts something
  about the data — "all six official languages", "all five regional groups" —
  the line must fall back honestly if the data stops supporting it. Write the
  fallback, do not assume the roster is final.
- **A dual national is counted once**, under the first nationality listed, so
  the regional groups still sum to the size of the Office. Both countries light
  up on the globe.
- **The comments carry the reasoning.** This codebase explains *why* at length —
  why the rate steering does not seek, why the land mask is rasterised, why a
  panel was cut. Match that when you change something: leave the reason behind,
  not just the change. Commit messages are prose sentences in the same voice.
- Typography lives in the DOM, never in WebGL — projector sharpness and proper
  shaping of Arabic, Bangla and CJK.

## Architecture

One GSAP master timeline (`src/main.js`) holds every tween, so the whole run is
scrubbable and a seek reproduces the exact frame. One continuous particle field
of 16,000 points (`src/particles.js`) is created once and never destroyed: logo
→ Earth → lit countries → closing mark, with no cut between scenes. Morphing and
country ignition are GPU-side — one uniform write, one array write.

`src/globe.js` places land points with a Fibonacci sphere filtered against a
rasterised land mask, and resolves country membership with `d3.geoContains`
against only the nations we have staff from. Small island states missing from
the 110m atlas get an explicit centroid cluster — they are real colleagues and
are not going to be invisible because of map resolution.

`src/narration.js` follows the timeline rather than being triggered by it: every
frame it compares its own position with `app.tl.time()` and corrects by
**steering the playback rate, never by seeking** — a seek re-buffers and every
re-buffer is an audible drop-out. Hard seeks are reserved for scene jumps and
restarts.

`SCENE_LIST` in `src/main.js` holds the scene durations; they sum to 296s. Scene
timings inside a scene are hand-tuned against the voice, not divided evenly —
the narration does not fall into equal parts.

## Watch out for

- **Chrome only.** It is the tested path and the only one `tools/` runs against.
  Safari's `preservesPitch` stretcher reports a phantom position and defeats the
  rate steering.
- **`tools/narrate.mjs` is the only thing in the repo that touches the network.**
  It needs `az login` or `AZURE_SPEECH_KEY`/`AZURE_SPEECH_REGION`. The
  presentation never runs it; the rendered audio is committed so the room stays
  offline.
- **Do not commit `*.mp4`** — GitHub rejects files over 100MB and it is
  gitignored. Source documents (the 93MB PDF, the internal `.docx`) are excluded
  too; everything transcribed from them lives in `data/`.
- **The published copy is public** (GitHub Pages) and carries the real roster and
  headshots. Think before adding a field to `data/staff.js`.

## Git

Commit as **Mafizul Islam <islam50@un.org>** — the global config is already
right; check that no local `.git/config` overrides it. Work goes straight to
`main`, which is what the history does.
