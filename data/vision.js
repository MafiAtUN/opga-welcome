// ─────────────────────────────────────────────────────────────────────────────
//  The President's vision for the 81st Session.
//
//  Transcribed from: assets/Vision-Statement-Bangaldesh-PGA81.docx
//
//  The source document was written as a candidacy statement; H.E. Dr. Khalilur
//  Rahman has since taken office as President of the 81st Session, confirmed by
//  the Office on 30 August 2026. The six pillars below are his programme.
// ─────────────────────────────────────────────────────────────────────────────

export const PGA = {
  // Shown under the theme in the opening. Set `show: false` to omit the name
  // entirely and lead with the theme alone.
  name: 'H.E. Dr. Khalilur Rahman',
  role: 'President of the 81st Session of the General Assembly',
  show: true,
};

/**
 * The President's career, shown one line at a time before the theme resolves.
 *
 * SOURCES — worth knowing which is which before this goes on a screen:
 *   `src: 'vision'` is stated in Vision-Statement-Bangaldesh-PGA81.docx and can
 *                   be checked against the file in assets/.
 *   `src: 'office'` was given by the Office on 30 August and is not in that
 *                   document. Confirm the wording before the meeting.
 *
 * Trim or reorder freely — the scene lays out however many entries are here.
 */
export const PGA_CAREER = [
  {
    label: 'Career diplomat',
    sub: 'Representing Bangladesh across sixteen sessions of this Assembly',
    src: 'office',       // the 'sixteen sessions' half is from the vision statement
  },
  {
    label: 'Academic',
    sub: null,
    src: 'office',
  },
  {
    label: 'United Nations official',
    sub: 'The Secretariat in New York, and UNCTAD in Geneva',
    src: 'vision',
  },
  {
    label: 'Led UNCTAD\u2019s Technology Division',
    sub: 'And the High-Level Panel of the Technology Bank for the Least Developed Countries',
    src: 'vision',
  },
  {
    label: 'Adviser to the Interim Government of Bangladesh',
    sub: null,
    src: 'office',
  },
  {
    label: 'Foreign Minister of Bangladesh',
    sub: 'In ministerial office since 2024',
    src: 'office',       // 'ministerial level positions since 2024' is from the vision statement
  },
  {
    label: 'Elected by the Member States',
    sub: 'President of the eighty-first session of the General Assembly',
    src: 'office',
    final: true,
  },
];

/** The session theme, used in the opening and echoed at the close. */
export const THEME = {
  headline: 'Restoring Trust, Managing Transformation',
  subline: 'A United Nations That Delivers for All',
};

/**
 * The six interlocking pillars, in the order the vision statement gives them.
 * `focus` is the "Core Focus" column of the statement's own table.
 */
export const PILLARS = [
  {
    numeral: 'I',
    title: 'Silence the Guns, Amplify the Voices',
    focus: 'Peace, Security and Justice for All',
  },
  {
    numeral: 'II',
    title: 'No One Left Behind, No Country Left Out',
    focus: 'Sustainable Development, SDG Acceleration and Countries in Special Situations',
  },
  {
    numeral: 'III',
    title: 'Our Planet, Our Pact',
    focus: 'Climate Resilience and Environmental Sustainability',
  },
  {
    numeral: 'IV',
    title: 'Rights and Protection — Freedom from Fear and Want',
    focus: 'Human Rights, Humanitarian Action, Refugees and Migrants',
  },
  {
    numeral: 'V',
    title: 'Innovation with Inclusion',
    focus: 'Digital Governance, AI and the Next Generation',
  },
  {
    numeral: 'VI',
    title: 'We the Peoples — Reimagined',
    focus: 'Renewed Multilateralism, UN80 Reforms and Inclusive Global Governance',
  },
];

/** Closing line of the vision statement, used over the final card. */
export const CLOSING_LINE =
  'Multilateralism is not only relevant, but indispensable to a future of ' +
  'peace, dignity and prosperity for all.';
