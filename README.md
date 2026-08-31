# OPGA 81 — Welcome

A 4 minute 56 second opening presentation for the first all-staff meeting of the
Office of the President of the General Assembly, 81st Session.

**Review copy — https://mafiatun.github.io/opga-welcome/**
Click once to start; the browser will not play sound until you do. Everything
else is identical to what runs in the room.

It runs hands-free, entirely offline, in Chrome, and it is narrated
end to end in a woman's voice.

---

## Running it in the room

**Double-click `present.command`.**

It serves the folder locally and opens Chrome fullscreen. A Terminal window stays
open behind it — leave it there and close it when the meeting is over.

There is no internet dependency of any kind. Try it with wifi switched off; it
will behave identically.

### Controls

| Key | |
|---|---|
| `Space` | pause / resume |
| `→` `←` | next / previous scene |
| `1`–`9`, `0` | jump to a scene (`0` is the tenth) |
| `F` | toggle fullscreen |
| `R` | restart from the beginning |
| `M` | mute the narration |
| `M` | mute / unmute the voiceover |
| `D` | debug overlay (scene, elapsed time, fps) |

It auto-plays the whole run. The keys are there so you can hold on a moment if
the room reacts, or skip ahead if you are short on time.

### Hosted vs. the room

`present.command` opens the page as `index.html?room=1` and launches Chrome with
`--autoplay-policy`, so the voice starts on its own and there is no start card.

A hosted copy cannot be given that flag — no web page can — so anywhere else the
presentation holds on a **start card** and begins the picture and the voice
together on the first click. That is why the GitHub Pages link asks for a click
and the room does not.

The card appears as soon as the picture is ready and the six-megabyte voice
track keeps downloading behind it, counting up on the card as it goes. Reading
the card and reaching for the mouse covers most of the download; throttled to
3 Mbps that is the difference between the card appearing at 5.9s and at 22.3s.
Clicking before the voice has arrived is safe — the picture is held until it
has, rather than run against silence.

In the room it still waits: the file is on local disk and loads in a moment,
and there is no click to hide a wait behind.

### Before you present

- Open it once on the machine you will actually present from, and let it run
  through. It is ready in about three seconds: it samples the logo into
  particles, rasterises a land mask and places 16,000 points on it, then waits
  for the voice track to be loaded and seekable.
- Set the display to 1920×1080 or any 16:9 mode. The layout scales off viewport
  width, so it adapts, but 16:9 is what it was composed for.
- Flag emoji and non-Latin scripts (Arabic, Bangla, CJK) use the system fonts.
  They render correctly on macOS. If you ever present from Windows or Linux,
  check the welcome scene first.
- **Check the room's sound before the room is in it.** The narration carries
  the argument; the screen only carries the evidence. Run it once at the
  volume you will actually use.

---

## Changing the content

**Staff data comes from `data/staff.js`.** It is the single source of truth for
everyone in the office.

**The President's career, theme and six priorities come from `data/vision.js`.**
Each career entry carries a `src` field: `vision` means it is stated in the
vision statement and can be checked against the file in `assets/`; `office`
means it came from the Office directly and is not in that document. Confirm the
`office` lines before the meeting.

The rest of that file is
transcribed from `assets/Vision-Statement-Bangaldesh-PGA81.docx`. Setting
`PGA.show = false` drops the name from the theme card and leads with the theme
alone.

Every number in the presentation — the headline counts, which countries light up
on the globe, the language cloud, the gender split, the funding bar, the regional
groups — is derived from that file at runtime by `src/derive.js`. Nothing is
hardcoded anywhere else.

Correct one person's country and the globe, the nationality count, the regional
bloom and the closing line all update together.

### Checking the data

**Open `verify.html`** (`http://127.0.0.1:8113/verify.html` while
`present.command` is running). It lists:

- every row where a field is inferred rather than read from the directory,
  with a note saying exactly what to check
- a photo grid, flagging every portrait taken from the 80th-session page
- languages added by inference rather than read from the directory
- the headline numbers the presentation will show
- the full language and nationality breakdowns
- the complete roster

### Adding photos

Drop headshots into `assets/photos/`, named to match the `photo` field in
`data/staff.js` (e.g. `diallo.jpg`). Square images work best; 512×512 is plenty.

Portraits appear in two places: beside each country as it lights up on the globe
(up to three, overlapped, with the colleagues' names beneath), and on the person
cards in the faces scene.

Anyone without a photo file falls back to an initials monogram automatically —
the layout does not shift and nothing looks broken. You can add photos right up
to the morning of the meeting without touching any code.

**Where the current photos came from.** Thirteen were lifted from the *80th*
session cabinet page (`assets/Cabinet of the President of the 80th Session…pdf`)
by reading the name burned into each portrait and matching it to our roster.
That match is by name alone. `verify.html` has a photo grid that flags every one
of them — check each is the right person and still current before the meeting.

### The voiceover

Two build steps produce one file:

1. `npm run narrate` renders the words in `data/narration.js` into
   `assets/narration.voice.m4a` — **voice only**.
2. `npm run score` synthesises the music bed and mixes it under the voice,
   writing `assets/narration.m4a`, which is what the page plays.

Keeping them separate means re-mixing never layers music on music.

The bed is generated, not licensed, so nothing in the presentation needs
clearing: a slow four-chord cycle in D minor with sustained pads, a sub and one
bell per act. ffmpeg ducks it under the voice with a sidechain compressor, so it
steps back whenever she speaks and swells into the silences.

Levels, measured rather than judged by ear: about **−15 dB in the gaps** and
**−17.7 dB under speech**, against a voice-only reference of −17.7 dB — so the
music fills the silences without taking anything off the voice. Whole track
−18.4 dB, peaks −3.8 dB.

Tune it from the command line without editing anything:

```
node tools/score.mjs --bed 0.9        louder bed (default 0.78)
node tools/score.mjs --duck 4         ducks less under the voice (default 6)
node tools/score.mjs --release 500    slower recovery after a line (default 320ms)
```

The bed passes through `dynaudnorm` before mixing. A pad built from detuned
partials wanders several decibels as they drift in and out of phase, and an
uneven bed is usually what "the music is too low" actually means — it is not
too quiet everywhere, it disappears in places.

Nothing is synthesised at run time and nothing touches the network during the
meeting.

The voice follows the master timeline rather than being triggered by it: every
frame it compares itself with `app.tl.time()` and corrects if it has drifted.
Pause, scene jumps, restart and mute therefore all work without the audio
needing to know they happened.

**It corrects by steering the playback rate, not by seeking.** Seeking a media
element makes the browser re-buffer, and every re-buffer is an audible
drop-out; the first version seeked whenever drift passed a quarter of a second
and produced about twenty of them across a run. Nudging the rate by up to three
per cent is inaudible — `preservesPitch` means it does not even change the
pitch of her voice — and it holds sync tighter as a side effect: mean drift
went from 0.096s to 0.045s. A hard seek is reserved for genuine
discontinuities, which is to say a scene jump or a restart.

Figures spoken aloud are baked into the audio. If the roster changes, run
`npm run figures` — it says which lines have gone stale — then re-render with
`npm run narrate && npm run score`.

`npm run verify` reads the rendered durations and reports any line that
actually overruns the next. The `--dry` estimate is only an estimate and runs
up to ~1.5s short; `--verify` is the one to trust.

`M` mutes the voice mid-presentation without stopping the picture.

### After editing

**`npm run check`** (or `node tools/check-playback.mjs`) drives the real Google
Chrome via Playwright
and plays the presentation for real: it checks the voice autoplays, stays in
sync, survives pause and scene jumps, and that the last line still lands over
the held final card. Use `npm run check:full` to play the whole 4:56, or add
`--headed` to watch it and get a true frame-rate reading.

**`npm run check:hosted`** proves the start card behaves in both cases: shown
where sound needs a gesture, absent where it does not. Point it at the live site
with `node tools/check-hosted.mjs --url https://mafiatun.github.io/opga-welcome/`.

Playwright is a development dependency only — `npm install` is needed to run the
checks, never to present. If `node_modules/` is missing, `present.command` still
works exactly as it does now.

Open `selfcheck.html` to step the whole timeline and confirm it still runs clean.
It reports the duration, any runtime errors, and whether every scene is reachable.

---

## The narration

**The words live in `data/narration.js`.** It is a script, not a caption track:
the screen already carries every number, so the voice carries the argument —
where this Office is standing in the UN's eightieth year, who has walked into
it, and what the six pillars actually ask of the people in the room. It draws
on the President's vision statement directly, including its Charter,
Hammarskjöld, Annan and Roosevelt references.

Each cue carries an absolute position on the master timeline, so the words and
the picture are timed in one place. `assets/narration.json` is the rendered
transcript, with the timings, for the record.

### Re-recording it

```
node tools/narrate.mjs            re-render assets/narration.m4a
node tools/narrate.mjs --dry      timing report only, no network
node tools/narrate.mjs --check    are the spoken figures still true?
node tools/narrate.mjs --voices   the female voices available
node tools/narrate.mjs --sample   one paragraph in each candidate voice
```

This is the **only** thing in the repo that touches the network, and the
presentation never runs it. It synthesises each line separately through Azure
AI Speech, then places every one at its exact position in a single track — so
the timings hold no matter how fast a given voice turns out to be. Commit the
rendered file and the room stays offline.

It needs the Azure CLI signed in (`az login`), or `AZURE_SPEECH_KEY` and
`AZURE_SPEECH_REGION` in the environment. It uses the Speech endpoint on the
existing `osaa-foundry-dev` AI Services account in `eastus2` — neural
text-to-speech is part of that account, so there is no model to deploy.

The voice is set at the top of `data/narration.js`. The current one is
`en-US-AvaMultilingualNeural`, chosen because it handles the non-English names
in this script without flattening them. Auditions of the alternatives are in
`.narration-build/samples/`.

### Two things to watch

- **Every figure the voice speaks is baked into the audio.** If the roster
  changes, `node tools/narrate.mjs --check` tells you which lines have gone
  stale; re-rendering fixes them. It is wired to `src/derive.js`, so it checks
  against the same numbers the screen shows.
- **The last line lands about seven seconds after the timeline stops**, over
  the final card, which holds. That is deliberate. If you shorten the closing
  line, the timing report will tell you.

### How it stays in sync

`src/narration.js` does not listen for events. Every frame it compares the
audio's position with the master timeline's own clock and corrects it if they
have drifted. Pause, `←` `→`, a jump to scene 6, `R` to restart — none of them
need to know the narration exists.

---

## What is on screen

| # | Scene | Length |
|---|---|---|
| 0 | Cold open — particles assemble the PGA81 mark | 22s |
| 1 | The President — his career, then his theme for the session | 36s |
| 2 | "Welcome" in the scripts spoken in the office | 15s |
| 3 | The headline numbers | 12s |
| 4 | The globe — each nation ignites with the faces of its colleagues, arcs converge on New York | 68s |
| 5 | The people, region by region | 38s |
| 6 | Languages | 27s |
| 7 | The President's six priorities | 31s |
| 8 | Gender, how we came here, regional groups | 28s |
| 9 | Close — everything returns to the mark | 19s |

Stills of each are in `preview/`.

---

## How it works

The whole presentation is **one continuous particle field** of 16,000 points.
They are created once and never destroyed. They form the logo, then the Earth,
then the ignited countries, then the closing mark. There is never a cut — each
scene transforms into the next.

- **`src/particles.js`** — the field. Morphing happens on the GPU: the shader is
  given a "from" and a "to" position per particle and one uniform is tweened, so
  a full-field transformation costs a single uniform write per frame. Country
  ignition is also GPU-side: each particle carries the timestamp at which its
  country lights up, and the shader derives the flash and the lasting highlight
  from that. Lighting a country is one array write, not an animation.

- **`src/globe.js`** — land points are distributed with a Fibonacci sphere and
  filtered against a rasterised land mask. Testing 60,000 candidates with
  `d3.geoContains` took fifteen seconds of loading screen; drawing the same
  geometry into a bitmap and sampling it takes milliseconds, and at one dot per
  few hundred kilometres nothing on screen can tell the difference. Country membership is resolved with
  `d3.geoContains` against only the ~31 nations we have staff from, rejected by
  bounding box first. Barbados, Saint Kitts and Nevis and the Dominican Republic
  are too small for the 110m atlas, so they get an explicit cluster of dots at
  their centroid — they are real colleagues and are not going to be invisible
  because of map resolution.

- **`src/main.js`** — one GSAP master timeline holds every tween, which makes the
  full 4:56 scrubbable: seeking to a scene renders the correct state instantly.
  The globe's orientation is a tweened value, never integrated per frame, so a
  seek always reproduces the exact framing.

- Typography lives in the DOM rather than in WebGL, so it stays sharp on a
  projector and non-Latin scripts are shaped by the system.

- **`src/narration.js`** — the spoken track. It loads the whole file into a blob
  before use, because seeking a streamed file needs HTTP Range support and
  `python3 -m http.server` does not implement it. Without that, the first pause
  or scene jump would silently send the voice back to the beginning. Sync is
  held by playback rate rather than by seeking, so routine correction never
  causes a re-buffer.

No build step. No package installs to present. `vendor/` holds pinned copies of
three.js, GSAP, d3-geo, topojson, the world atlas and Inter — about 1.6MB, all
local. Playwright is needed only to run `tools/check-playback.mjs`, never to
present.

---

## Published copy

The review link above is a **public** GitHub Pages site: anyone with the URL can
open it, and it carries the real roster — names, nationalities, gender, titles,
grades, contract types and 23 headshots. Twenty of those rows still contain a
nationality or language that was inferred rather than read from the directory
(see `verify.html`). Take the site down with `gh api -X DELETE repos/MafiAtUN/opga-welcome/pages`,
or make the repository private, if that is not wanted.

The source documents are deliberately **not** committed — the 93MB 80th-session
PDF and the two internal `.docx` drafts are excluded in `.gitignore`. Everything
transcribed from them lives in `data/`.

## Known limits

- **One nationality is still unconfirmed** — the roster reads "Ms. Yuan Cheng —
  China (??)". Everything else was confirmed by the Office on 30 August.
- **No contract type, grade or funding line appears anywhere on screen**, by
  request. The composition scene says only how many colleagues governments
  seconded and how many the United Nations employs.
- **Five of the six official UN languages** are spoken in the office — Russian is
  the gap. The presentation says so honestly rather than overclaiming, and the
  line updates itself if that changes. The directory's trailing note mentions
  Russia among incoming secondments, which would complete the set.
- **The "Welcome." card in scene 2 is never seen.** It is set to fade in at
  15.6s into a scene that is 15s long, so it reveals after its own container
  has been hidden. Either lengthen scene 2 in `SCENE_LIST` or bring the reveal
  forward. The narration reaches the same beat by voice, so it is not a hole in
  the run — but it was meant to be on screen.
- The trailing note also lists ROK, UK, Russia, USA, México and France. They are
  in `PENDING_COUNTRIES` in `data/staff.js` but excluded from the counts. Set
  `INCLUDE_PENDING = true` once they are confirmed.
