// ─────────────────────────────────────────────────────────────────────────────
//  The President's vision for the 81st Session.
//
//  Transcribed from: assets/Vision-Statement-Bangaldesh-PGA81.docx
//
//  ⚠️  That document is a CANDIDACY vision statement — its cover reads
//      "CANDIDATE FOR PRESIDENT, 81st SESSION". Confirm the styling below is
//      how the Office wants the President referred to on screen before the
//      meeting, and confirm the six pillar titles against the final published
//      version if one exists.
// ─────────────────────────────────────────────────────────────────────────────

export const PGA = {
  // Shown under the theme in the opening. Set `show: false` to omit the name
  // entirely and lead with the theme alone.
  name: 'H.E. Dr. Khalilur Rahman',
  role: 'President of the 81st Session of the General Assembly',
  show: true,
};

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
