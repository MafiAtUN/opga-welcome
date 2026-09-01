// Country reference data for the OPGA 81 welcome presentation.
//
// `lat`/`lng` are visual centroids used to place globe markers, light pillars and
// the great-circle arcs to UN Headquarters. They are chosen to look right on a
// rotating globe, not to be survey-grade.
//
// `group` is the UN regional group. `atlas` is the country's name in
// vendor/countries-110m.json, or null where the 110m atlas is too coarse to
// include it (small island states) — those get a centroid bloom instead.

export const UN_HQ = { name: 'United Nations Headquarters', lat: 40.7489, lng: -73.968 };

export const REGIONAL_GROUPS = {
  AFRICAN: 'African Group',
  ASIA_PACIFIC: 'Asia-Pacific Group',
  EASTERN_EUROPEAN: 'Eastern European Group',
  GRULAC: 'Latin American and Caribbean Group',
  WEOG: 'Western European and Others Group',
};

const G = REGIONAL_GROUPS;

export const COUNTRIES = {
  'Senegal':                 { flag: '🇸🇳', lat: 14.5,  lng: -14.5,  group: G.AFRICAN,          atlas: 'Senegal',                  languages: ['Wolof', 'French'] },
  'Bangladesh':              { flag: '🇧🇩', lat: 23.7,  lng: 90.4,   group: G.ASIA_PACIFIC,     atlas: 'Bangladesh',               languages: ['Bangla'] },
  'Germany':                 { flag: '🇩🇪', lat: 51.2,  lng: 10.4,   group: G.WEOG,             atlas: 'Germany',                  languages: ['German'] },
  'Qatar':                   { flag: '🇶🇦', lat: 25.3,  lng: 51.2,   group: G.ASIA_PACIFIC,     atlas: 'Qatar',                    languages: ['Arabic'] },
  'Malaysia':                { flag: '🇲🇾', lat: 3.5,   lng: 102.0,  group: G.ASIA_PACIFIC,     atlas: 'Malaysia',                 languages: ['Malay'] },
  'Venezuela':               { flag: '🇻🇪', lat: 6.4,   lng: -66.6,  group: G.GRULAC,           atlas: 'Venezuela',                languages: ['Spanish'] },
  'China':                   { flag: '🇨🇳', lat: 35.0,  lng: 104.2,  group: G.ASIA_PACIFIC,     atlas: 'China',                    languages: ['Mandarin Chinese'] },
  'South Africa':            { flag: '🇿🇦', lat: -29.0, lng: 24.7,   group: G.AFRICAN,          atlas: 'South Africa',             languages: ['isiZulu', 'Afrikaans'] },
  'Saudi Arabia':            { flag: '🇸🇦', lat: 23.9,  lng: 45.1,   group: G.ASIA_PACIFIC,     atlas: 'Saudi Arabia',             languages: ['Arabic'] },
  'Spain':                   { flag: '🇪🇸', lat: 40.2,  lng: -3.7,   group: G.WEOG,             atlas: 'Spain',                    languages: ['Spanish'] },
  'Japan':                   { flag: '🇯🇵', lat: 36.2,  lng: 138.3,  group: G.ASIA_PACIFIC,     atlas: 'Japan',                    languages: ['Japanese'] },
  // Both are officially anglophone, but the everyday mother tongue is the
  // English-lexified creole, so it leads the list — see `nativeLanguageOf`.
  'Barbados':                { flag: '🇧🇧', lat: 13.19, lng: -59.54, group: G.GRULAC,           atlas: null,                       languages: ['Bajan Creole', 'English'] },
  'Saint Kitts and Nevis':   { flag: '🇰🇳', lat: 17.36, lng: -62.78, group: G.GRULAC,           atlas: null,                       languages: ['Kittitian Creole', 'English'] },
  'Botswana':                { flag: '🇧🇼', lat: -22.3, lng: 24.7,   group: G.AFRICAN,          atlas: 'Botswana',                 languages: ['Setswana'] },
  'Iraq':                    { flag: '🇮🇶', lat: 33.2,  lng: 43.7,   group: G.ASIA_PACIFIC,     atlas: 'Iraq',                     languages: ['Arabic', 'Kurdish'] },
  'Guinea-Bissau':           { flag: '🇬🇼', lat: 11.8,  lng: -15.2,  group: G.AFRICAN,          atlas: 'Guinea-Bissau',            languages: ['Portuguese', 'Guinea-Bissau Creole'] },
  'Pakistan':                { flag: '🇵🇰', lat: 30.4,  lng: 69.3,   group: G.ASIA_PACIFIC,     atlas: 'Pakistan',                 languages: ['Urdu'] },
  'Norway':                  { flag: '🇳🇴', lat: 60.5,  lng: 8.5,    group: G.WEOG,             atlas: 'Norway',                   languages: ['Norwegian'] },
  'Türkiye':                 { flag: '🇹🇷', lat: 39.0,  lng: 35.2,   group: G.WEOG,             atlas: 'Turkey',                   languages: ['Turkish'] },
  'Ireland':                 { flag: '🇮🇪', lat: 53.1,  lng: -8.0,   group: G.WEOG,             atlas: 'Ireland',                  languages: ['English', 'Irish'] },
  'Oman':                    { flag: '🇴🇲', lat: 21.5,  lng: 55.9,   group: G.ASIA_PACIFIC,     atlas: 'Oman',                     languages: ['Arabic'] },
  'Australia':               { flag: '🇦🇺', lat: -25.3, lng: 133.8,  group: G.WEOG,             atlas: 'Australia',                languages: ['English'] },
  'Morocco':                 { flag: '🇲🇦', lat: 31.8,  lng: -7.1,   group: G.AFRICAN,          atlas: 'Morocco',                  languages: ['Arabic', 'Tamazight', 'French'] },
  'Dominican Republic':      { flag: '🇩🇴', lat: 18.7,  lng: -70.2,  group: G.GRULAC,           atlas: null,                       languages: ['Spanish'] },
  'Indonesia':               { flag: '🇮🇩', lat: -2.5,  lng: 118.0,  group: G.ASIA_PACIFIC,     atlas: 'Indonesia',                languages: ['Indonesian'] },
  'United States':           { flag: '🇺🇸', lat: 39.8,  lng: -98.6,  group: G.WEOG,             atlas: 'United States of America', languages: ['English'] },
  'United Kingdom':          { flag: '🇬🇧', lat: 54.0,  lng: -2.5,   group: G.WEOG,             atlas: 'United Kingdom',           languages: ['English'] },
  'Canada':                  { flag: '🇨🇦', lat: 56.1,  lng: -106.3, group: G.WEOG,             atlas: 'Canada',                   languages: ['English', 'French'] },
  'Thailand':                { flag: '🇹🇭', lat: 15.0,  lng: 101.0,  group: G.ASIA_PACIFIC,     atlas: 'Thailand',                 languages: ['Thai'] },

  // Inferred nationalities — see `verified: false` rows in staff.js
  'India':                   { flag: '🇮🇳', lat: 22.4,  lng: 78.9,   group: G.ASIA_PACIFIC,     atlas: 'India',                    languages: ['Hindi'] },
  'Haiti':                   { flag: '🇭🇹', lat: 19.0,  lng: -72.3,  group: G.GRULAC,           atlas: 'Haiti',                    languages: ['Haitian Creole', 'French'] },

  // The Russian Federation arrived on 1 September 2026 and is now a counted
  // nationality like any other — it is what brings the Office to five regional
  // groups and to all six official languages.
  'Russian Federation':      { flag: '🇷🇺', lat: 61.5,  lng: 96.0,   group: G.EASTERN_EUROPEAN, atlas: 'Russia',                   languages: ['Russian'] },

  // Listed in the directory's trailing note ("ROK, UK, Russia, USA, México, France").
  // Not attached to any named person yet — excluded from counts until confirmed.
  'Republic of Korea':       { flag: '🇰🇷', lat: 36.5,  lng: 127.9,  group: G.ASIA_PACIFIC,     atlas: 'South Korea',              languages: ['Korean'] },
  'Mexico':                  { flag: '🇲🇽', lat: 23.6,  lng: -102.5, group: G.GRULAC,           atlas: 'Mexico',                   languages: ['Spanish'] },
  'France':                  { flag: '🇫🇷', lat: 46.6,  lng: 2.5,    group: G.WEOG,             atlas: 'France',                   languages: ['French'] },
};

// The six official languages of the United Nations, highlighted in the languages scene.
export const UN_OFFICIAL_LANGUAGES = [
  'Arabic', 'Mandarin Chinese', 'English', 'French', 'Russian', 'Spanish',
];

// "Welcome" for the opening scene, one entry per language.
//
// ⚠️  The four marked `confirm` below are not in staff.js — nobody on the team
//     is recorded as speaking them yet, and the greeting itself wants a native
//     speaker's eye before we put it on the screen.
export const WELCOME_IN = [
  { text: 'Welcome',        lang: 'English',          script: 'latin' },
  { text: 'مرحباً',          lang: 'Arabic',           script: 'arabic', rtl: true },
  { text: 'স্বাগতম',          lang: 'Bangla',           script: 'bengali' },
  { text: '欢迎',            lang: 'Mandarin Chinese', script: 'han' },
  { text: 'Bienvenue',      lang: 'French',           script: 'latin' },
  { text: 'Bienvenida',     lang: 'Spanish',          script: 'latin' },
  { text: 'Добро пожаловать', lang: 'Russian',        script: 'cyrillic' },
  { text: 'ようこそ',         lang: 'Japanese',         script: 'kana' },
  { text: 'Hoş geldiniz',   lang: 'Turkish',          script: 'latin' },
  { text: 'Fáilte',         lang: 'Irish',            script: 'latin' },
  { text: 'Selamat datang', lang: 'Malay',            script: 'latin' },
  { text: 'ยินดีต้อนรับ', lang: 'Thai',             script: 'thai' },
  { text: 'Bem-vindo',      lang: 'Portuguese',       script: 'latin' },
  { text: 'Welkom',         lang: 'Afrikaans',        script: 'latin' },
  { text: 'Siyakwamukela',  lang: 'isiZulu',          script: 'latin' },
  { text: 'خوش آمدید',       lang: 'Urdu',             script: 'arabic', rtl: true },
  { text: 'Willkommen',     lang: 'German',           script: 'latin' },
  { text: 'Velkommen',      lang: 'Norwegian',        script: 'latin' },
  { text: 'Dumela',         lang: 'Setswana',         script: 'latin' },
  { text: 'Dalal ak jàmm',  lang: 'Wolof',            script: 'latin' },
  { text: 'स्वागत है',         lang: 'Hindi',            script: 'devanagari' },
  { text: 'Benvenuto',      lang: 'Italian',          script: 'latin', confirm: 'No Italian speaker in staff.js yet.' },
  { text: 'Selamat datang', lang: 'Indonesian',       script: 'latin', confirm: 'Same phrase as Malay — see note below.' },
  { text: 'Horas',          lang: 'Bataknese',        script: 'latin', confirm: 'No Batak speaker in staff.js yet.' },
  { text: 'I danta',        lang: 'Mandinka',         script: 'latin', confirm: 'Gambian/Senegalese Mandinka — ask Dr. Diallo.' },
  { text: 'A jaaraama',     lang: 'Fulani',           script: 'latin', confirm: 'Pulaar greeting — ask Dr. Diallo.' },
];
