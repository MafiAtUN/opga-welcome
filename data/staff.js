// ─────────────────────────────────────────────────────────────────────────────
//  SINGLE SOURCE OF TRUTH — OPGA 81st Session staff
// ─────────────────────────────────────────────────────────────────────────────
//
//  Every number in the presentation is derived from this array at runtime:
//  the headline counts, the globe markers, the language cloud, the gender
//  split, the contract bar and the regional bloom. Nothing is hardcoded
//  anywhere else. Correct a row here and the whole presentation updates.
//
//  Transcribed from: assets/81st Staff Directory - 18 August 26 (1).docx
//
//  ⚠️  ROWS WITH `verified: false` NEED MAFI'S CONFIRMATION.
//      Open verify.html to see them all listed. Fields marked there are my
//      inference from the person's name, not something the directory states.
//
//  FIELDS
//    country   — nationality. `null` means genuinely unknown; that person is
//                excluded from the nationality count and the globe.
//    gender    — 'M' | 'F' | null. From the Mr./Ms. title in the directory.
//    languages — first entry is treated as the mother tongue for the cloud.
//                You do not have to remember to write the native language of
//                someone's nationality or English: derive.js adds both if they
//                are missing (see `withNativeLanguage`). Add here only the
//                extra languages a person actually speaks.
//    photo     — filename in assets/photos/. Missing file falls back to an
//                elegant monogram card automatically, so you can drop images
//                in right up to the morning of the meeting.
//    verified  — false means at least one field is my inference. Check it.
//    note      — anything the directory flagged as uncertain (??, TBC, dates).
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
  // ── Senior Cabinet ─────────────────────────────────────────────────────────
  {
    id: 'diallo', name: 'Dr. Djibril Diallo', title: 'Chef de Cabinet',
    team: 'Senior Cabinet', grade: 'D-2', contract: 'RB',
    country: 'Senegal', gender: 'M', languages: ['Wolof', 'French', 'English'],
    photo: 'diallo.jpg', verified: true,
  },
  {
    id: 'alim', name: 'Mr. Abdul Alim', title: 'Deputy Chef de Cabinet',
    team: 'Senior Cabinet', grade: 'D-1', contract: 'RB',
    country: 'Bangladesh', gender: 'M', languages: ['Bangla', 'English'],
    photo: 'alim.jpg', verified: true,
  },
  {
    id: 'eleid', name: 'Mr. Nabil El Eid', title: 'Special Adviser',
    team: 'Senior Cabinet', grade: null, contract: 'Secondment',
    country: 'Germany', gender: 'M', languages: ['German', 'Arabic', 'English'],
    photo: 'eleid.jpg', verified: false,
    note: 'Country (Germany) is stated. Arabic is inferred from the name — confirm.',
  },
  {
    id: 'althani', name: 'Ms. Haya Abdulrahman Al-Thani',
    title: 'Special Adviser on Sustainable Development',
    team: 'Senior Cabinet', grade: null, contract: null,
    country: 'Qatar', gender: 'F', languages: ['Arabic', 'English'],
    photo: 'althani.jpg', verified: false,
    note: 'Directory states NO country, grade or contract. Qatar inferred from the name.',
  },

  // ── Executive Office ───────────────────────────────────────────────────────
  {
    id: 'sofia', name: 'Ms. Sharifah Sofia Syed Mokhtar Shah',
    title: 'Adviser / Special Assistant to the PGA',
    team: 'Executive Office', grade: 'P-4', contract: 'XB',
    country: 'Malaysia', gender: 'F', languages: ['Malay', 'English'],
    photo: 'sofia.jpg', verified: true,
  },
  {
    id: 'zaima', name: 'Ms. Zaima Rahman', title: 'Legal Officer',
    team: 'Executive Office', grade: 'P-3', contract: 'RB',
    country: 'Bangladesh', gender: 'F', languages: ['Bangla', 'English'],
    photo: 'zaima.jpg', verified: true,
  },
  {
    id: 'andrade', name: 'Ms. Claire Ivett Andrade Piro', title: 'Executive Assistant',
    team: 'Executive Office', grade: 'G-7', contract: 'RB',
    country: 'Venezuela', gender: 'F', languages: ['Spanish', 'English'],
    photo: 'andrade.jpg', verified: true,
  },
  {
    id: 'staffassistant', name: null, title: 'Staff Assistant',
    team: 'Executive Office', grade: null, contract: 'Secondment',
    country: 'Bangladesh', gender: 'M', languages: ['Bangla', 'English'],
    photo: null, verified: false, incomplete: true,
    note: 'Directory row reads only "Mr." with no name. Needs a name or removal.',
  },

  // ── Political Affairs, Peace and Security ──────────────────────────────────
  {
    id: 'lu', name: 'Mr. Lu Jingchun', title: 'Senior Adviser',
    team: 'Political Affairs, Peace and Security', grade: null, contract: 'Secondment',
    country: 'China', gender: 'M', languages: ['Mandarin Chinese', 'English'],
    photo: 'lu.jpg', verified: false,
    note: 'Directory marks "Possible Team Leader??" — confirm whether to show as Team Leader.',
  },
  {
    id: 'tshabalala', name: 'Ms. Thandekile Tshabalala', title: 'Adviser',
    team: 'Political Affairs, Peace and Security', grade: 'P-4', contract: 'RB',
    country: 'South Africa', gender: 'F', languages: ['isiZulu', 'English'],
    photo: 'tshabalala.jpg', verified: false,
    note: 'Country stated. isiZulu inferred from the name — confirm.',
  },
  {
    id: 'altalhi', name: 'Ms. Ibtihal Masoud Altalhi', title: 'Adviser',
    team: 'Political Affairs, Peace and Security', grade: null, contract: 'Secondment',
    country: 'Saudi Arabia', gender: 'F', languages: ['Arabic', 'English'],
    photo: 'altalhi.jpg', verified: true,
  },
  {
    id: 'angaron', name: 'Ms. Maria del Mar Angaron Bolea', title: 'Senior Adviser',
    team: 'Political Affairs, Peace and Security', grade: null, contract: 'Secondment',
    country: 'Spain', gender: 'F', languages: ['Spanish', 'English'],
    photo: 'angaron.jpg', verified: true,
  },
  {
    id: 'ishizaki', name: 'Ms. Takako Ishizaki', title: 'Senior Adviser',
    team: 'Political Affairs, Peace and Security', grade: null, contract: 'Secondment',
    country: 'Japan', gender: 'F', languages: ['Japanese', 'English'],
    photo: 'ishizaki.jpg', verified: true,
    note: 'Directory: "Till December".',
  },

  // ── Sustainable Development, Climate and Countries in Special Situations ────
  {
    id: 'whyte', name: 'Ms. Kereeta Whyte', title: 'Team Leader · focal point for SIDS',
    team: 'Sustainable Development, Climate and Countries in Special Situations',
    grade: null, contract: 'Consultant (XB)',
    country: 'Barbados', gender: 'F', languages: ['English'],
    photo: 'whyte.jpg', verified: true,
  },
  {
    id: 'wallace', name: 'Mr. Eustace Theodore Wallace Jr.', title: 'Senior Adviser',
    team: 'Sustainable Development, Climate and Countries in Special Situations',
    grade: null, contract: 'Secondment',
    country: 'Saint Kitts and Nevis', gender: 'M', languages: ['English'],
    photo: 'wallace.jpg', verified: true,
  },
  {
    id: 'sesinyi', name: 'Ms. Bokani Sesinyi-Supang',
    title: 'Senior Adviser · focal point for Africa and LLDCs',
    team: 'Sustainable Development, Climate and Countries in Special Situations',
    grade: 'P-5', contract: 'XB',
    country: 'Botswana', gender: 'F', languages: ['Setswana', 'English'],
    photo: 'sesinyi.jpg', verified: false,
    note: 'Country stated. Setswana inferred — confirm.',
  },
  {
    id: 'alimuhammed', name: 'Mr. Ali Muhammed', title: 'Senior Adviser',
    team: 'Sustainable Development, Climate and Countries in Special Situations',
    grade: null, contract: 'Secondment',
    country: 'Iraq', gender: 'M', languages: ['Arabic', 'English'],
    photo: 'alimuhammed.jpg', verified: false,
    note: 'Directory marks the role "[TBC]".',
  },
  {
    id: 'molla', name: 'Mr. Md Rafiqul Alam Molla',
    title: 'Senior Adviser · focal point for LDCs',
    team: 'Sustainable Development, Climate and Countries in Special Situations',
    grade: null, contract: null,
    country: 'Bangladesh', gender: 'M', languages: ['Bangla', 'English'],
    photo: 'molla.jpg', verified: false,
    note: 'Directory states NO country, grade or contract. Bangladesh inferred from the name.',
  },
  {
    id: 'cabral', name: 'Mr. Raul Antonio De Melo Cabral', title: 'Senior Adviser',
    team: 'Sustainable Development, Climate and Countries in Special Situations',
    grade: null, contract: 'Consultant (XB)',
    country: 'Guinea-Bissau', gender: 'M',
    languages: ['Portuguese', 'Guinea-Bissau Creole', 'English'],
    photo: 'cabral.jpg', verified: false,
    note: 'Country stated. Creole inferred — confirm.',
  },
  {
    id: 'majeed', name: 'Ms. Aleena Majeed', title: 'Adviser',
    team: 'Sustainable Development, Climate and Countries in Special Situations',
    grade: 'P-3', contract: 'XB',
    country: 'Pakistan', gender: 'F', languages: ['Urdu', 'English'],
    photo: 'majeed.jpg', verified: true,
  },

  // ── Human Rights and Humanitarian Affairs ──────────────────────────────────
  {
    id: 'amanshah', name: 'Ms. Khairee Shahdila Binti Aman Shah', title: 'Senior Adviser',
    team: 'Human Rights and Humanitarian Affairs', grade: null, contract: 'Secondment',
    country: 'Malaysia', gender: 'F', languages: ['Malay', 'English'],
    photo: 'amanshah.jpg', verified: true,
  },
  {
    id: 'havn', name: 'Ms. Anne Havn', title: 'Senior Adviser',
    team: 'Human Rights and Humanitarian Affairs', grade: null, contract: 'Secondment',
    country: 'Norway', gender: 'F', languages: ['Norwegian', 'English'],
    photo: 'havn.jpg', verified: false,
    note: 'Directory marks the country "[TBC]" and the post "till December 2026".',
  },
  {
    id: 'sari', name: 'Ms. Eda Sari', title: 'Senior Adviser',
    team: 'Human Rights and Humanitarian Affairs', grade: null, contract: 'Secondment',
    country: 'Türkiye', gender: 'F', languages: ['Turkish', 'English'],
    photo: 'sari.jpg', verified: true,
  },
  {
    id: 'acuna', name: 'Ms. Estefania Acuna Lacarieri', title: 'Adviser',
    team: 'Human Rights and Humanitarian Affairs', grade: null, contract: 'Consultant (XB)',
    country: 'Mexico', gender: 'F', languages: ['Spanish', 'English'],
    photo: 'acuna.jpg', verified: true,
    // Nationality self-reported by her on the Colleague Profile Collection form
    // (25 Aug 2026); the printed directory left it blank.
  },
  {
    id: 'odwyer', name: "Ms. Caoimhe O'Dwyer", title: 'Adviser',
    team: 'Human Rights and Humanitarian Affairs', grade: null, contract: 'Consultant (XB)',
    country: 'Ireland', gender: 'F', languages: ['English', 'Irish'],
    photo: 'odwyer.jpg', verified: true,
  },
  {
    id: 'alruqaishi', name: 'Ms. Maisa Al-Ruqaishi', title: 'Adviser',
    team: 'Human Rights and Humanitarian Affairs', grade: null, contract: 'Secondment',
    country: 'Oman', gender: 'F', languages: ['Arabic', 'English'],
    photo: 'alruqaishi.jpg', verified: true,
  },
  {
    id: 'genderadviser', name: null, title: 'Senior Adviser (Gender Adviser)',
    team: 'Human Rights and Humanitarian Affairs', grade: null,
    contract: 'Secondment (UN Women)',
    country: null, gender: null, languages: [],
    photo: null, verified: false, incomplete: true, vacant: true,
    note: 'Vacant post — no name in the directory. Excluded from all counts by default.',
  },

  // ── Reform, Budget and Administration ──────────────────────────────────────
  {
    id: 'stone', name: 'Mr. Peter Stone', title: 'Team Leader',
    team: 'Reform, Budget and Administration', grade: 'P-5', contract: 'XB',
    country: 'Australia', gender: 'M', languages: ['English'],
    photo: 'stone.jpg', verified: true,
  },
  {
    id: 'benziane', name: 'Ms. Imane Benziane', title: 'Senior Adviser',
    team: 'Reform, Budget and Administration', grade: null, contract: 'Secondment',
    country: 'Morocco', gender: 'F', languages: ['Arabic', 'French', 'English'],
    photo: 'benziane.jpg', verified: false,
    note: 'Country stated. French inferred (widely used in Morocco) — confirm.',
  },
  {
    id: 'yuancheng', name: 'Ms. Yuan Cheng', title: 'Staff Support',
    team: 'Reform, Budget and Administration', grade: 'G-6', contract: 'DGACM',
    country: 'China', gender: 'F', languages: ['Mandarin Chinese', 'English'],
    photo: 'yuancheng.jpg', verified: false,
    note: 'Directory states NO country. China inferred from the name.',
  },
  {
    id: 'resolus', name: 'Ms. Marie Resolus', title: 'Staff Support',
    team: 'Reform, Budget and Administration', grade: 'G-5', contract: 'DGACM',
    country: 'Haiti', gender: 'F', languages: ['Haitian Creole', 'French', 'English'],
    photo: 'resolus.jpg', verified: false,
    note: 'Directory states NO country. Haiti inferred from the name — low confidence, please check.',
  },
  {
    id: 'carlson', name: 'Ms. Carla Maria Carlson Serrano', title: 'Senior Adviser',
    team: 'Reform, Budget and Administration', grade: null, contract: 'Secondment',
    country: 'Dominican Republic', gender: 'F', languages: ['Spanish', 'English'],
    photo: 'carlson.jpg', verified: true,
  },
  {
    id: 'simanjuntak', name: 'Mr. Daniel Ardiles M. Simanjuntak', title: 'Senior Adviser',
    team: 'Reform, Budget and Administration', grade: null, contract: 'Secondment',
    country: 'Indonesia', gender: 'M', languages: ['Indonesian', 'English'],
    photo: 'simanjuntak.jpg', verified: true,
  },

  // ── Communications and Media ───────────────────────────────────────────────
  {
    id: 'lyons', name: 'Ms. Gabrielle Lyons', title: 'Adviser',
    team: 'Communications and Media', grade: null, contract: 'Consultant (XB)',
    country: 'Australia', gender: 'F', languages: ['English'],
    photo: 'lyons.jpg', verified: false,
    note: 'Directory marks the contract "Consultant ??".',
  },
  {
    id: 'summers', name: 'Ms. Melissa Summers', title: 'Spokesperson',
    team: 'Communications and Media', grade: 'P-4', contract: 'GDC',
    country: 'United States', gender: 'F', languages: ['English'],
    photo: 'summers.jpg', verified: true,
  },
  {
    id: 'sellers', name: 'Mr. Jack Sellers', title: 'Senior Adviser',
    team: 'Communications and Media', grade: 'P-5', contract: 'XB',
    country: 'United Kingdom', gender: 'M', languages: ['English'],
    photo: 'sellers.jpg', verified: false,
    note: 'Directory marks both the name and the grade with "??".',
  },
  {
    id: 'bois', name: 'Ms. Genevieve Erin Bois', title: 'Adviser (social media)',
    team: 'Communications and Media', grade: null, contract: 'Consultant (XB)',
    country: 'United States', gender: 'F', languages: ['English', 'French'],
    photo: 'bois.jpg', verified: false,
    note: 'Directory says "(UNICEF/USA)". French inferred from the name — confirm.',
  },
  {
    id: 'misra', name: 'Ms. Saranya Misra', title: 'Adviser (social media)',
    team: 'Communications and Media', grade: null, contract: 'Consultant (XB)',
    country: 'India', gender: 'F', languages: ['Hindi', 'English'],
    photo: 'misra.jpg', verified: false,
    note: 'Directory states NO country and marks the post "(1 month)??". India inferred from the name.',
  },
  {
    id: 'dalci', name: 'Mr. Emirhan Dalci', title: 'Adviser (social media)',
    team: 'Communications and Media', grade: null, contract: 'Consultant (XB)',
    country: 'Türkiye', gender: 'M', languages: ['Turkish', 'English'],
    photo: 'dalci.jpg', verified: false,
    note: 'Directory states NO country. Türkiye inferred from the name.',
  },
  {
    id: 'foxen', name: 'Ms. Julia Foxen', title: 'Adviser',
    team: 'Communications and Media', grade: null, contract: 'Consultant (XB)',
    country: 'United States', gender: 'F', languages: ['English'],
    photo: 'foxen.jpg', verified: true,
  },

  // ── Digital Innovation and AI ──────────────────────────────────────────────
  {
    id: 'furumoto', name: 'Mr. Tatsuhiko Furumoto', title: 'Senior Adviser',
    team: 'Digital Innovation and AI', grade: null, contract: 'Secondment',
    country: 'Japan', gender: 'M', languages: ['Japanese', 'English'],
    photo: 'furumoto.jpg', verified: true,
  },
  {
    id: 'mafizul', name: 'Mr. Mafizul Islam', title: 'Adviser',
    team: 'Digital Innovation and AI', grade: 'P-4', contract: 'XB',
    country: 'Bangladesh', gender: 'M', languages: ['Bangla', 'English'],
    photo: 'mafizul.jpg', verified: true,
  },

  // ── Speechwriting ──────────────────────────────────────────────────────────
  {
    id: 'mercer', name: 'Mr. Carl Mercer', title: 'Team Leader',
    team: 'Speechwriting', grade: 'P-5', contract: 'RB',
    country: 'Canada', gender: 'M', languages: ['English', 'French'],
    photo: 'mercer.jpg', verified: false,
    note: 'Country stated. French inferred — confirm.',
  },
  {
    id: 'stephan', name: 'Ms. Katherina Stephan', title: 'Speechwriter',
    team: 'Speechwriting', grade: 'P-4', contract: 'RB',
    country: 'United States', gender: 'F', languages: ['English'],
    photo: 'stephan.jpg', verified: true,
  },
];

// Countries named in the directory's trailing note but not yet tied to a person.
// Set INCLUDE_PENDING to true once these secondments are confirmed and they will
// appear on the globe in a distinct "incoming" treatment.
export const PENDING_COUNTRIES = [
  'Republic of Korea', 'United Kingdom', 'Russian Federation',
  'United States', 'Mexico', 'France',
];
export const INCLUDE_PENDING = false;
