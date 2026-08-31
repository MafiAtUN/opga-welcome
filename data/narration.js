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
  { at:    17, text: 'Everything since has been an argument about whether we meant them.',
    note: 'lands under the title block, before it lifts away' },

  // 1 · The President, and his theme ─────────────────────────── 22–58 ──
  //     The list on screen carries the detail; the voice carries the shape of
  //     a career. Saying both would run past the end of the scene.
  { at:  23.4, text:
      'We work for a President who has spent his life inside this system.',
    note: 'his name has just resolved; the career list begins at 25.0' },
  { at:  28.3, text:
      'A career diplomat. An academic. A United Nations official in New York and Geneva.',
    note: 'the first three posts arrive at 25.0, 27.4 and 29.7 — UNCTAD is on screen' },
  { at:  35.5, text:
      'Adviser to the interim government of Bangladesh. Then its Foreign Minister.',
    note: 'those two land at 34.4 and 36.7' },
  { at:  41.3, text:
      'And then elected by the Member States to preside over this Assembly.',
    note: 'the last line of the list, in gold, at 39.1' },
  { at:  46.0, text:
      'Every President chooses a theme. It is not a slogan. It is a job description.',
    note: 'the career lifts away at 43; the theme headline resolves from 45' },
  { at:  52.0, ssml:
      'Restoring trust. <break time="260ms"/> Managing transformation. ' +
      '<break time="380ms"/> A United Nations that delivers for all.',
    note: 'runs a moment past the scene, landing under the first welcome words' },

  // ═══ II. Who walked in ═══════════════════════════════════════════════════
  // 2 · Welcome, in the scripts of the office ──────────────────── 38–53 ──
  { at:  60.2, text: 'An office like this one is built from nothing, in a matter of weeks.',
    note: 'the logo dissolves; the ring of scripts begins to arrive' },
  { at:  65.3, text:
      'Strangers arrive from twenty-five countries and are asked, immediately, to work as one.',
    note: 'the words are cycling through the office’s own languages' },
  { at:  72.3, text: 'So we start where the Assembly starts. With welcome.',
    note: 'the words bloom together and hand over' },

  // 3 · The headline numbers ──────────────────────────────────── 53–65 ──
  { at:  77.9, text: 'Nine teams — and not one of them can finish a day’s work without another.',
    note: 'the second counter' },
  { at:  83.4, text: 'And twenty-five places we call home.',
    note: 'the third counter, handing off to the globe' },

  // ═══ III. Where we come from ═════════════════════════════════════════════
  // 4 · The globe — the hero ─────────────────────────────────── 65–141 ──
  { at:  87.3, text: 'This is where the people in this room come from.',
    note: 'the nebula folds into the Earth' },
  { at:  92.5, text:
      'Not an abstraction. A childhood. A first language. A reason someone came into this work.',
    note: 'ignition begins — Canada first, then west to east' },
  { at:   102, text:
      'Some of us come from countries that have sent hundreds of thousands of peacekeepers into other people’s wars.',
    note: 'the Americas and West Africa are alight' },
  { at: 110.9, text:
      'Some from islands so small the atlas leaves them out — and whose coastline is a running argument with the sea.',
    note: 'literally true of this build: three of our nations need dots drawn by hand' },
  { at: 120.8, text:
      'Some from countries sheltering more than a million people who could not go home.',
    note: 'South Asia is lighting up' },
  { at: 128.8, text:
      'Every one of them sends a line back to New York. Not one of us arrived here by accident.',
    note: 'the arcs are the point of the scene' },
  { at: 137.8, text:
      'Whatever the Assembly argues about this year, someone in this room has lived it.',
    note: 'the last countries ignite; the camera starts to pull back' },
  { at: 146.2, ssml: 'Twenty-five nations. <break time="300ms"/> One Assembly.',
    note: 'the closing card appears at 133' },

  // ═══ IV. Who we are to each other ════════════════════════════════════════
  // 5 · Faces, region by region ─────────────────────────────── 141–185 ──
  { at: 154.7, text: 'Now the harder thing to put on a map. The people.',
    note: 'the globe slides right; the first cards come in' },
  { at: 159.5, text: 'We are an intergenerational team.',
    note: 'the first region’s cards are on screen' },
  { at: 162.7, text:
      'Colleagues in their mid-twenties, working beside people who were negotiating ' +
      'in this building before the youngest of us were born.',
    note: 'the sweep moves through the middle regions' },
  { at: 170.8, ssml:
      'One brings the assumption that all of this could work better. ' +
      '<break time="300ms"/> The other knows exactly why it does not — ' +
      'and how to move it anyway.',
    note: 'the point of the scene: neither half is the junior partner' },
  { at: 179.8, text:
      'And there is no flag to defend at this desk. Only a hundred and ninety-three ' +
      'Member States who have to be able to trust us equally.',
    note: 'the President’s own commitment: everyone’s President, without fear or favour' },

  // ═══ V. What we can do that a smaller office could not ═══════════════════
  // 6 · Languages ───────────────────────────────────────────── 185–212 ──
  { at: 193.6, text:
      'Multilingualism is not decoration here. It sits in the President’s mandate, next to gender parity, geographic balance and accessibility.',
    note: 'the word cloud rises out of the dust' },
  { at: 204.4, text:
      'It is the difference between a delegation being heard and a delegation being handled.',
    note: 'the cloud is at its fullest' },
  { at: 212.2, text: 'Nineteen languages, in one office.',
    note: 'the number resolves at 205.6' },
  { at: 215.7, text:
      'Five of the six official languages of the United Nations are already in this room.',
    note: 'the on-screen line names them; the voice does not repeat the list' },

  // ═══ VI. The work itself ═════════════════════════════════════════════════
  // 7 · The six pillars ─────────────────────────────────────── 212–245 ──
  { at: 221.6, text: 'Six pillars. This is the actual work.',
    note: 'the first cards are landing' },
  { at: 225.7, ssml:
      'Peace that is prevented rather than ended. <break time="300ms"/> ' +
      'Development that reaches the countries everyone else forgets.',
    note: 'pillars I and II, as all six settle into place' },
  { at: 234.3, ssml:
      'A planet we are holding in trust for people who are not born yet. <break time="300ms"/> ' +
      'Rights defended in the small places, close to home.',
    note: 'pillars III and IV — Kofi Annan and Eleanor Roosevelt, both quoted in the vision statement' },
  { at: 242.4, ssml:
      'Technology governed rather than merely adopted. <break time="300ms"/> ' +
      'And an Assembly willing to reform itself.',
    note: 'pillars V and VI, on the hold before the cards lift' },

  // ═══ VII. Who carries it ═════════════════════════════════════════════════
  // 8 · Composition ─────────────────────────────────────────── 245–274 ──
  { at: 250.5, text: 'Sixty-five per cent of this Office is women.',
    note: 'the glyph field fills in' },
  { at: 254.1, text:
      'In a system still arguing about who belongs at the peace table, that is worth saying.',
    note: 'the legend appears at 248 — resolution 1325 is in the President’s first pillar' },
  { at: 260.1, text:
      'Fourteen of us were sent to this work by our own governments — governments ' +
      'that could have kept their best people at home.',
    note: 'the "how we came here" panel. Fourteen people came from THIRTEEN ' +
          'governments, because Japan seconded two. Saying both numbers aloud ' +
          'made listeners stop and do the arithmetic mid-sentence, so the voice ' +
          'now says only the number of people and the panel carries the rest: ' +
          'it shows "14 seconded · by 13 governments" above thirteen flags, ' +
          'where the difference can be seen instead of worked out.' },
  { at: 268.2, ssml:
      'They work beside twenty colleagues of the United Nations itself. ' +
      '<break time="280ms"/> Different routes in. <break time="260ms"/> One Office.',
    note: 'both figures on screen; the flags of the sending countries are landing' },
  { at: 276.3, text:
      'Four of the five regional groups are already here. We speak for all five.',
    note: 'the regional bloom opens at 264.3 — Eastern Europe is the group we are missing' },

  // ═══ VIII. Handing it over ═══════════════════════════════════════════════
  // 9 · Close — everything returns to the mark ──────────────── 274–293 ──
  { at: 282.7, ssml:
      'Hammarskjöld said this Organization was not built to bring us to heaven. ' +
      '<break time="320ms"/> It was built to save us from hell.',
    note: 'the field is folding back into the mark' },
  { at: 290.4, text:
      'That is the work. Welcome to the Office of the President of the General Assembly.',
    note: 'the closing title reveals from 279.8' },
  { at: 296.4, ssml:
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
  countries: 25,
  languages: 19,
  womenPct: 65,
  officialLanguagesPresent: 5,
  regionalGroups: 4,
  seconded: 14,
  unStaff: 20,
  // sendingCountries (13) is deliberately absent: it is shown on the panel but
  // no longer spoken, and this list is only for figures the voice says aloud.
};
