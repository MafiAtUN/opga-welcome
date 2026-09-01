// ─────────────────────────────────────────────────────────────────────────────
//  SINGLE SOURCE OF TRUTH — OPGA 81st Session staff
// ─────────────────────────────────────────────────────────────────────────────
//
//  Every number in the presentation is derived from this array at runtime:
//  the headline counts, the globe markers, the language cloud, the gender
//  split and the regional groups. Nothing is hardcoded anywhere else.
//  Correct a row here and the whole presentation updates.
//
//  Roster confirmed by the Office on 30 August 2026 — 34 colleagues, plus the
//  three arrivals confirmed on 1 September 2026 (Thailand, Qatar and the
//  Russian Federation), which brings the Office to 37. This supersedes the 18 August
//  directory, which listed posts since filled, vacated or withdrawn, and whose
//  own tally (34) never matched its tables.
//
//  The Russian Federation arrival closes the last gap in both of the things
//  this presentation claims: the fifth regional group and the sixth official
//  language of the United Nations.
//
//  FIELDS
//    countries — nationality, in order. Two entries means dual nationality:
//                BOTH light up on the globe, and the FIRST is used for the
//                regional-group count so the totals still sum to 37.
//    gender    — 'M' | 'F', from the honorific on the roster.
//    languages — first is treated as the mother tongue. English is included
//                for everyone as the working language of the Office.
//    seconded  — true if a government released them to this Office, false if
//                they are employed by the United Nations. Used only for the
//                inclusive "how we came here" panel; no contract type, grade
//                or funding line appears anywhere on screen.
//    photo     — filename in assets/photos/. A missing file falls back to a
//                monogram, so headshots can be added at any time.
//    verified  — false where something is still unconfirmed; see `note`.
//
// ─────────────────────────────────────────────────────────────────────────────

export const TEAMS = [
  'Senior Cabinet',
  'Executive Office',
  'Political Affairs, Peace and Security',
  'Sustainable Development, Climate and Countries in Special Situations',
  'Human Rights and Humanitarian Affairs',
  'Reform, Budget and Administration',
  'Communications and Media',
  'Digital Innovation and AI',
  'Speechwriting',
];

export const STAFF = [
  // ── Senior Cabinet ────────────────────────────────────────────────────────────
  {
    id: 'diallo', name: 'Dr. Djibril Diallo',
    title: 'Chef de Cabinet',
    team: 'Senior Cabinet',
    countries: ['Senegal'], gender: 'M',
    languages: ['Wolof', 'French', 'English'],
    seconded: false, photo: 'diallo.jpg',
    verified: true
  },
  {
    id: 'alim', name: 'Mr. Abdul Alim',
    title: 'Deputy Chef de Cabinet',
    team: 'Senior Cabinet',
    countries: ['Bangladesh'], gender: 'M',
    languages: ['Bangla', 'English'],
    seconded: false, photo: 'alim.jpg',
    verified: true
  },
  {
    id: 'eleid', name: 'Mr. Nabil El Eid',
    title: 'Special Adviser',
    team: 'Senior Cabinet',
    countries: ['Germany'], gender: 'M',
    languages: ['German', 'Arabic', 'English'],
    seconded: true, photo: 'eleid.jpg',
    verified: true,
    note: 'Arabic is inferred from the name — confirm with him.',
  },

  // ── Executive Office ──────────────────────────────────────────────────────────
  {
    id: 'sofia', name: 'Ms. Sharifah Sofia Syed Mokhtar Shah',
    title: 'Adviser / Special Assistant to the PGA',
    team: 'Executive Office',
    countries: ['Malaysia'], gender: 'F',
    languages: ['Malay', 'English'],
    seconded: false, photo: 'sofia.jpg',
    verified: true
  },
  {
    id: 'zaima', name: 'Ms. Zaima Rahman',
    title: 'Legal and Policy Officer',
    team: 'Executive Office',
    countries: ['Bangladesh'], gender: 'F',
    languages: ['Bangla', 'English'],
    seconded: false, photo: 'zaima.jpg',
    verified: true
  },
  {
    id: 'andrade', name: 'Ms. Claire Ivett Andrade Piro',
    title: 'Executive Assistant',
    team: 'Executive Office',
    countries: ['Venezuela'], gender: 'F',
    languages: ['Spanish', 'English'],
    seconded: false, photo: 'andrade.jpg',
    verified: true
  },

  // ── Political Affairs, Peace and Security ─────────────────────────────────────
  {
    id: 'lu', name: 'Mr. Lu Jingchun',
    title: '',
    team: 'Political Affairs, Peace and Security',
    countries: ['China'], gender: 'M',
    languages: ['Mandarin Chinese', 'English'],
    seconded: true, photo: 'lu.jpg',
    verified: true,
    note: 'Title left blank: the directory marked him "Possible Team Leader??" and his own form said "Counsellor", his rank at the Mission. No card line until the Office settles it.',
  },
  {
    id: 'tshabalala', name: 'Ms. Thandekile Tshabalala',
    title: 'Adviser',
    team: 'Political Affairs, Peace and Security',
    countries: ['South Africa'], gender: 'F',
    languages: ['isiZulu', 'English'],
    seconded: false, photo: 'tshabalala.jpg',
    verified: true,
    note: 'isiZulu is inferred from the name — confirm with her.',
  },
  {
    id: 'altalhi', name: 'Ms. Ibtihal Masoud Altalhi',
    title: 'Adviser',
    team: 'Political Affairs, Peace and Security',
    countries: ['Saudi Arabia'], gender: 'F',
    languages: ['Arabic', 'English'],
    seconded: true, photo: 'altalhi.jpg',
    verified: true
  },
  {
    id: 'angaron', name: 'Ms. Maria del Mar Angaron Bolea',
    title: 'Senior Adviser',
    team: 'Political Affairs, Peace and Security',
    countries: ['Spain'], gender: 'F',
    languages: ['Spanish', 'English'],
    seconded: true, photo: 'angaron.jpg',
    verified: true
  },
  {
    id: 'ishizaki', name: 'Ms. Takako Ishizaki',
    title: 'Senior Adviser',
    team: 'Political Affairs, Peace and Security',
    countries: ['Japan'], gender: 'F',
    languages: ['Japanese', 'English'],
    seconded: true, photo: 'ishizaki.jpg',
    verified: true
  },

  // ── Sustainable Development, Climate and Countries in Special Situations ──────
  {
    id: 'whyte', name: 'Ms. Kereeta Whyte',
    title: '',
    team: 'Sustainable Development, Climate and Countries in Special Situations',
    countries: ['Barbados'], gender: 'F',
    languages: ['English'],
    seconded: false, photo: 'whyte.jpg',
    verified: true,
    note: 'Title left blank: she answered "TBD" on her own form. No card line until the Office settles it.',
  },
  {
    id: 'wallace', name: 'Mr. Eustace Theodore Wallace Jr.',
    title: 'Senior Adviser',
    team: 'Sustainable Development, Climate and Countries in Special Situations',
    countries: ['Saint Kitts and Nevis'], gender: 'M',
    languages: ['English'],
    seconded: true, photo: 'wallace.jpg',
    verified: true
  },
  {
    id: 'sesinyi', name: 'Ms. Bokani Sesinyi-Supang',
    title: 'Senior Adviser · focal point for Africa and LLDCs',
    team: 'Sustainable Development, Climate and Countries in Special Situations',
    countries: ['Botswana'], gender: 'F',
    languages: ['Setswana', 'English'],
    seconded: false, photo: 'sesinyi.jpg',
    verified: true,
    note: 'Setswana is inferred — confirm with her.',
  },
  {
    id: 'molla', name: 'Mr. Md Rafiqul Alam Molla',
    title: 'Senior Adviser · focal point for LDCs',
    team: 'Sustainable Development, Climate and Countries in Special Situations',
    countries: ['Bangladesh'], gender: 'M',
    languages: ['Bangla', 'English'],
    seconded: false, photo: 'molla.jpg',
    verified: true
  },

  // ── Human Rights and Humanitarian Affairs ─────────────────────────────────────
  {
    id: 'sari', name: 'Ms. Eda Sari',
    title: '',
    team: 'Human Rights and Humanitarian Affairs',
    countries: ['Türkiye'], gender: 'F',
    languages: ['Turkish', 'English'],
    seconded: true, photo: 'sari.jpg',
    verified: true,
    note: 'Title left blank: her form said "First Secretary", her rank at the Mission, not her role here. No card line until the Office settles it.',
  },
  {
    id: 'havn', name: 'Ms. Anne Havn',
    title: 'Senior Adviser',
    team: 'Human Rights and Humanitarian Affairs',
    countries: ['Norway'], gender: 'F',
    languages: ['Norwegian', 'English'],
    seconded: true, photo: 'havn.jpg',
    verified: true
  },
  {
    id: 'amanshah', name: 'Ms. Khairee Shahdila Binti Aman Shah',
    title: 'Senior Adviser',
    team: 'Human Rights and Humanitarian Affairs',
    countries: ['Malaysia'], gender: 'F',
    languages: ['Malay', 'English'],
    seconded: true, photo: 'amanshah.jpg',
    verified: true
  },
  {
    id: 'acuna', name: 'Ms. Estefania Acuna Lacarieri',
    title: 'Adviser',
    team: 'Human Rights and Humanitarian Affairs',
    countries: ['Mexico'], gender: 'F',
    languages: ['Spanish', 'English'],
    seconded: false, photo: 'acuna.jpg',
    verified: true,
  },
  {
    id: 'odwyer', name: 'Ms. Caoimhe O\'Dwyer',
    title: 'Adviser',
    team: 'Human Rights and Humanitarian Affairs',
    countries: ['Ireland'], gender: 'F',
    languages: ['English', 'Irish'],
    seconded: false, photo: 'odwyer.jpg',
    verified: true
  },
  {
    id: 'alruqaishi', name: 'Ms. Maisa Al-Ruqaishi',
    title: 'Adviser',
    team: 'Human Rights and Humanitarian Affairs',
    countries: ['Oman'], gender: 'F',
    languages: ['Arabic', 'English'],
    seconded: true, photo: 'alruqaishi.jpg',
    verified: true
  },

  // ── Reform, Budget and Administration ─────────────────────────────────────────
  {
    id: 'stone', name: 'Mr. Peter Stone',
    title: 'Team Leader',
    team: 'Reform, Budget and Administration',
    countries: ['Australia'], gender: 'M',
    languages: ['English'],
    seconded: false, photo: 'stone.jpg',
    verified: true
  },
  {
    id: 'benziane', name: 'Ms. Imane Benziane',
    title: 'Senior Adviser',
    team: 'Reform, Budget and Administration',
    countries: ['Morocco'], gender: 'F',
    languages: ['Arabic', 'French', 'English'],
    seconded: true, photo: 'benziane.jpg',
    verified: true
  },
  {
    id: 'carlson', name: 'Ms. Carla Maria Carlson Serrano',
    title: 'Senior Adviser',
    team: 'Reform, Budget and Administration',
    countries: ['Dominican Republic'], gender: 'F',
    languages: ['Spanish', 'English'],
    seconded: true, photo: 'carlson.jpg',
    verified: true
  },
  {
    id: 'simanjuntak', name: 'Mr. Daniel Ardiles M. Simanjuntak',
    title: 'Senior Adviser',
    team: 'Reform, Budget and Administration',
    countries: ['Indonesia'], gender: 'M',
    languages: ['Indonesian', 'English'],
    seconded: true, photo: 'simanjuntak.jpg',
    verified: true
  },
  {
    id: 'resolus', name: 'Ms. Marie Iselande Resolus',
    title: 'Staff Assistant',
    team: 'Reform, Budget and Administration',
    countries: ['Haiti'], gender: 'F',
    languages: ['Haitian Creole', 'French', 'English'],
    seconded: false, photo: 'resolus.jpg',
    verified: true
  },
  {
    id: 'yuancheng', name: 'Ms. Yuan Cheng',
    title: 'Staff Support',
    team: 'Reform, Budget and Administration',
    countries: ['China'], gender: 'F',
    languages: ['Mandarin Chinese', 'English'],
    seconded: false, photo: 'yuancheng.jpg',
    verified: true
  },

  // ── Communications and Media ──────────────────────────────────────────────────
  {
    id: 'summers', name: 'Ms. Melissa Summers',
    title: 'Spokesperson',
    team: 'Communications and Media',
    countries: ['United States'], gender: 'F',
    languages: ['English'],
    seconded: false, photo: 'summers.jpg',
    verified: true
  },
  {
    id: 'dalci', name: 'Mr. Emirhan Dalci',
    title: 'Communications Adviser',
    team: 'Communications and Media',
    // Dual national. Both light up on the globe; Türkiye stays first, so he is
    // counted once — under WEOG — in the regional groups.
    countries: ['Türkiye', 'Germany'], gender: 'M',
    languages: ['Turkish', 'German', 'English', 'French'],
    seconded: false, photo: 'dalci.jpg',
    verified: true,
  },
  {
    id: 'foxen', name: 'Ms. Julia Foxen',
    title: 'Adviser',
    team: 'Communications and Media',
    countries: ['United States'], gender: 'F',
    languages: ['English'],
    seconded: false, photo: 'foxen.jpg',
    verified: true
  },

  // ── Digital Innovation and AI ─────────────────────────────────────────────────
  {
    id: 'furumoto', name: 'Mr. Tatsuhiko Furumoto',
    title: 'Senior Adviser',
    team: 'Digital Innovation and AI',
    countries: ['Japan'], gender: 'M',
    languages: ['Japanese', 'English'],
    seconded: true, photo: 'furumoto.jpg',
    verified: true
  },
  {
    id: 'mafizul', name: 'Mr. Mafizul Islam',
    title: 'Senior Adviser, Data and AI',
    team: 'Digital Innovation and AI',
    countries: ['Bangladesh'], gender: 'M',
    languages: ['Bangla', 'English'],
    seconded: false, photo: 'mafizul.jpg',
    verified: true
  },

  // ── Speechwriting ─────────────────────────────────────────────────────────────
  {
    id: 'mercer', name: 'Mr. Carl Mercer',
    title: 'Team Leader',
    team: 'Speechwriting',
    countries: ['Canada'], gender: 'M',
    languages: ['English', 'French'],
    seconded: false, photo: 'mercer.jpg',
    verified: true
  },
  {
    id: 'stephan', name: 'Ms. Katherine Stephan',
    title: 'Speechwriter',
    team: 'Speechwriting',
    countries: ['United States'], gender: 'F',
    languages: ['English', 'French'],
    seconded: false, photo: 'stephan.jpg',
    verified: true
  },

  // ── Joining · team and title to be confirmed ──────────────────────────────
  //
  //  Confirmed to the Office on 1 September 2026. None has been placed on a
  //  team yet, so `team` is left blank rather than guessed — exactly as the
  //  blank titles above are. They are still counted everywhere a person is
  //  counted: the globe, the languages, the gender split, the regional groups.
  {
    id: 'devakula', name: 'Ms. Devikara Prim Devakula',
    title: 'Senior Adviser',
    team: '',
    countries: ['Thailand'], gender: 'F',
    languages: ['Thai', 'Mandarin Chinese', 'English'],
    seconded: true, photo: 'devakula.jpg',
    verified: false,
    note: 'Title confirmed as Senior Adviser; team not yet assigned by the Office. ' +
          'Secondment is assumed from the pattern of the other Senior Advisers — ' +
          'confirm before the meeting, it moves the "how we came here" figures.',
  },
  {
    id: 'althani', name: 'Ms. Haya Abdulrahman Al Thani',
    title: '',
    team: '',
    countries: ['Qatar'], gender: 'F',
    languages: ['Arabic', 'English'],
    seconded: true, photo: 'althani.jpg',
    verified: false,
    note: 'Team and title not yet assigned by the Office — confirm both before the meeting.',
  },
  {
    // Name withheld until the Office confirms it. A row with no name is counted
    // in every figure and lights the Russian Federation on the globe, but draws
    // no face card and no name in the ticker — better an honest gap than a
    // placeholder on a welcome slide. Fill in `name` and a card appears.
    id: 'ru-incoming', name: '',
    title: '',
    team: '',
    countries: ['Russian Federation'], gender: 'M',
    languages: ['Russian', 'English'],
    seconded: true, photo: '',
    verified: false,
    note: 'Name, team and title all still to be confirmed. Until `name` is filled in the ' +
          'faces scene shows no card for him and the globe ticker reads "1 colleague".',
  },
];

/**
 * Countries named in the 18 August directory's trailing note as possible
 * incoming secondments, not yet attached to anyone on the 30 August roster.
 * Set INCLUDE_PENDING to true once confirmed and they appear on the globe.
 */
export const PENDING_COUNTRIES = [
  'Republic of Korea', 'United Kingdom', 'France',
];
export const INCLUDE_PENDING = false;
