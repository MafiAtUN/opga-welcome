// ─────────────────────────────────────────────────────────────────────────────
//  OPGA 81 — Welcome · narration
//
//  A spoken piece in a woman's voice, running the length of the presentation.
//
//  It is written to be a journey, not a caption track. The screen already
//  carries every number; the voice carries the argument — where this Office
//  is standing in the UN's eightieth year, who has walked into it, and what
//  the six pillars actually ask of the people in the room.
//
//  Sources it draws on, so the words can be checked:
//    · assets/Vision-Statement-Bangaldesh-PGA81.docx — the President's own
//      framing, its Charter and Hammarskjöld references, Bangladesh's
//      peacekeeping and refugee record, the mandate on multilingualism.
//    · data/staff.js via src/derive.js — every figure spoken (see
//      SPOKEN_FIGURES; `node tools/narrate.mjs --check` verifies them).
//
//  Edit the words here, run `node tools/narrate.mjs`, and the audio rebuilds.
//
//  ⚠️  Figures are BAKED INTO THE AUDIO. If the roster changes, --check
//      says which lines have gone stale and a re-render fixes them.
// ─────────────────────────────────────────────────────────────────────────────

/** The voice. Any female neural voice from `node tools/narrate.mjs --voices`. */
export const VOICE = 'en-US-AvaMultilingualNeural';

/**
 * Global delivery. A little under the voice's default pace — this is a room
 * being spoken to, not a bulletin being read.
 */
export const PROSODY = { rate: '-7%', pitch: '0%' };

/**
 * The script. `at` is an absolute position on the master timeline in
 * src/main.js, so the words and the picture are timed together in one place.
 * `note` records what is on screen at that moment, and why the line sits there.
 *
 * `ssml` replaces `text` where a line needs a pause the prose cannot carry.
 * The <speak>/<voice>/<prosody> wrapper is added by the renderer.
 */
export const CUES = [
  // ═══ I. Where we are standing ════════════════════════════════════════════
  // 0 · Cold open — the mark assembles out of the dark ──────────── 0–22 ──
  { at:   5.6, ssml:
      'Eighty years ago, in San Francisco, fifty nations signed a charter ' +
      'that opened with three words. <break time="420ms"/> We the peoples.',
    note: 'the field is still finding its shape; nothing on screen yet but dust' },
  { at:  17.0, text: 'Everything since has been an argument about whether we meant them.',
    note: 'lands under the title block, before it lifts away' },

  // 1 · The session theme ──────────────────────────────────────── 22–38 ──
  { at:  23.4, text:
      'Every President of the General Assembly chooses a theme. It is not a slogan. It is a job description.',
    note: 'the theme headline is resolving; frame it before it is read' },
  { at:  32.2, ssml:
      'Restoring trust. <break time="260ms"/> Managing transformation. ' +
      '<break time="380ms"/> A United Nations that delivers for all.',
    note: 'headline and subline together, over the President’s name card' },

  // ═══ II. Who walked in ═══════════════════════════════════════════════════
  // 2 · Welcome, in the scripts of the office ──────────────────── 38–53 ──
  { at:  40.2, text: 'An office like this one is built from nothing, in a matter of weeks.',
    note: 'the logo dissolves; the ring of scripts begins to arrive' },
  { at:  45.3, text:
      'Strangers arrive from thirty-one countries and are asked, immediately, to work as one.',
    note: 'the words are cycling through the office’s own languages' },
  { at:  52.3, text: 'So we start where the Assembly starts. With welcome.',
    note: 'the words bloom together and hand over' },

  // 3 · The headline numbers ──────────────────────────────────── 53–65 ──
  { at:  57.9, text: 'Nine teams — and not one of them can finish a day’s work without another.',
    note: 'the second counter' },
  { at:  63.4, text: 'And thirty-one places we call home.',
    note: 'the third counter, handing off to the globe' },

  // ═══ III. Where we come from ═════════════════════════════════════════════
  // 4 · The globe — the hero ─────────────────────────────────── 65–141 ──
  { at:  67.6, text: 'This is where the people in this room come from.',
    note: 'the nebula folds into the Earth' },
  { at:  73.4, text:
      'Not an abstraction. A childhood. A first language. A reason someone came into this work.',
    note: 'ignition begins — Canada first, then west to east' },
  { at:  84.0, text:
      'Some of us come from countries that have sent hundreds of thousands of peacekeepers into other people’s wars.',
    note: 'the Americas and West Africa are alight' },
  { at:  94.0, text:
      'Some from islands so small the atlas leaves them out — and whose coastline is a running argument with the sea.',
    note: 'literally true of this build: three of our nations need dots drawn by hand' },
  { at: 105.0, text:
      'Some from countries sheltering more than a million people who could not go home.',
    note: 'South Asia is lighting up' },
  { at: 114.0, text:
      'Every one of them sends a line back to New York. Not one of us arrived here by accident.',
    note: 'the arcs are the point of the scene' },
  { at: 124.0, text:
      'Whatever the Assembly argues about this year, someone in this room has lived it.',
    note: 'the last countries ignite; the camera starts to pull back' },
  { at: 133.4, ssml: 'Thirty-one nations. <break time="300ms"/> One Assembly.',
    note: 'the closing card appears at 133' },

  // ═══ IV. Who we are to each other ════════════════════════════════════════
  // 5 · Faces, region by region ─────────────────────────────── 141–185 ──
  { at: 143.0, text: 'Now the harder thing to put on a map. The people.',
    note: 'the globe slides right; the first cards come in' },
  { at: 149.6, text:
      'Some of you have served several sessions and know exactly what late September will feel like.',
    note: 'over the middle of the region sweep' },
  { at: 158.0, text:
      'Some of you started this month and are still learning where the good coffee is.',
    note: 'the room should smile here' },
  { at: 166.4, text: 'By next September, nobody will remember which was which.',
    note: 'the sweep is nearing its last regions' },
  { at: 174.0, text:
      'Because this is not a delegation. There is no flag to defend at this desk — only a hundred and ninety-three Member States who have to be able to trust us equally.',
    note: 'the President’s own commitment: everyone’s President, without fear or favour' },

  // ═══ V. What we can do that a smaller office could not ═══════════════════
  // 6 · Languages ───────────────────────────────────────────── 185–212 ──
  { at: 187.6, text:
      'Multilingualism is not decoration here. It sits in the President’s mandate, next to gender parity, geographic balance and accessibility.',
    note: 'the word cloud rises out of the dust' },
  { at: 198.4, text:
      'It is the difference between a delegation being heard and a delegation being handled.',
    note: 'the cloud is at its fullest' },
  { at: 206.2, text: 'Twenty-three languages, in one office.',
    note: 'the number resolves at 205.6' },
  { at: 209.7, text:
      'Five of the six official languages of the United Nations are already in this room.',
    note: 'the on-screen line names them; the voice does not repeat the list' },

  // ═══ VI. The work itself ═════════════════════════════════════════════════
  // 7 · The six pillars ─────────────────────────────────────── 212–245 ──
  { at: 215.8, text: 'Six pillars. This is the actual work.',
    note: 'the first cards are landing' },
  { at: 220.2, ssml:
      'Peace that is prevented rather than ended. <break time="300ms"/> ' +
      'Development that reaches the countries everyone else forgets.',
    note: 'pillars I and II, as all six settle into place' },
  { at: 229.4, ssml:
      'A planet we are holding in trust for people who are not born yet. <break time="300ms"/> ' +
      'Rights defended in the small places, close to home.',
    note: 'pillars III and IV — Kofi Annan and Eleanor Roosevelt, both quoted in the vision statement' },
  { at: 237.4, ssml:
      'Technology governed rather than merely adopted. <break time="300ms"/> ' +
      'And an Assembly willing to reform itself.',
    note: 'pillars V and VI, on the hold before the cards lift' },

  // ═══ VII. Who carries it ═════════════════════════════════════════════════
  // 8 · Composition ─────────────────────────────────────────── 245–274 ──
  { at: 246.8, text: 'Sixty-three per cent of this Office is women.',
    note: 'the glyph field fills in' },
  { at: 250.6, text:
      'In a system still arguing about who belongs at the peace table, that is worth saying out loud.',
    note: 'the legend appears at 248 — resolution 1325 is in the President’s first pillar' },
  { at: 258.2, text:
      'We are paid for in half a dozen different ways — secondments, consultancies, regular and extra-budgetary posts.',
    note: 'the funding bar grows from 255.4' },
  { at: 265.8, ssml:
      'Different contracts. <break time="260ms"/> One standard. <break time="400ms"/> ' +
      'And four of the five regional groups are already here — we will be speaking for all five.',
    note: 'the segments settle, then the regional bloom opens at 264.3 — ' +
          'Eastern Europe is the group we are missing' },

  // ═══ VIII. Handing it over ═══════════════════════════════════════════════
  // 9 · Close — everything returns to the mark ──────────────── 274–293 ──
  { at: 275.8, ssml:
      'Hammarskjöld said this Organization was not built to bring us to heaven. ' +
      '<break time="320ms"/> It was built to save us from hell.',
    note: 'the field is folding back into the mark' },
  { at: 285.2, text:
      'That is the work. Welcome to the Office of the President of the General Assembly.',
    note: 'the closing title reveals from 279.8' },
  { at: 291.4, ssml:
      'Multilateralism is not only relevant. <break time="260ms"/> ' +
      'It is indispensable to a future of peace, dignity, and prosperity for all.',
    note: 'the vision statement’s own last sentence, spoken over the held final card ' +
          'after the timeline has come to rest' },
];

/**
 * Every figure the voice actually speaks, checked against data/staff.js by
 * `node tools/narrate.mjs --check`. Constants of the Organization itself
 * (193 Member States, six official languages, five regional groups, eighty
 * years) are not derived and are not listed here.
 */
export const SPOKEN_FIGURES = {
  teams: 9,
  countries: 31,
  languages: 23,
  womenPct: 63,
  officialLanguagesPresent: 5,
  regionalGroups: 4,
};
