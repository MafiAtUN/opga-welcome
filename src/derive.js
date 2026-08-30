// Derives every statistic shown in the presentation from data/staff.js.
// No number in any scene is hardcoded — they all come from here.

import { STAFF, TEAMS, PENDING_COUNTRIES, INCLUDE_PENDING } from '../data/staff.js';
import { COUNTRIES, UN_OFFICIAL_LANGUAGES } from '../data/countries.js';

/**
 * The mother tongue implied by a nationality: the first language listed for
 * that country in data/countries.js. Only the principal one — we do not claim
 * a Moroccan colleague speaks Tamazight or an Iraqi one Kurdish just because
 * the country does.
 */
export const nativeLanguageOf = (country) => COUNTRIES[country]?.languages?.[0] ?? null;

/**
 * Guarantees the language list nobody should be missing: the native language
 * of their nationality, plus English as the working language of the office.
 * Anything the directory states is kept, in the order it was written.
 */
function withNativeLanguage(p) {
  const stated = p.languages || [];
  const native = nativeLanguageOf(p.country);
  let languages = stated;
  if (native && !languages.includes(native)) languages = [native, ...languages];
  if (p.country && !languages.includes('English')) languages = [...languages, 'English'];
  return languages === stated ? p : { ...p, languages };
}

/** Everyone the presentation counts: excludes vacant posts. */
export const people = STAFF.filter((p) => !p.vacant).map(withNativeLanguage);

/**
 * Rows whose native language came from their nationality rather than from the
 * directory — i.e. an inference to sanity-check before the meeting.
 */
export const inferredLanguages = STAFF.filter((p) => !p.vacant)
  .map((p) => ({ p, added: withNativeLanguage(p).languages.filter((l) => !(p.languages || []).includes(l)) }))
  .filter((r) => r.added.length)
  .map(({ p, added }) => ({ id: p.id, name: p.name, country: p.country, added }));

/** People we can actually show a card for: has a name. */
export const named = people.filter((p) => p.name);

/** Countries with at least one person. Sorted for a stable ignition order. */
export const countries = (() => {
  const set = new Set(people.map((p) => p.country).filter(Boolean));
  if (INCLUDE_PENDING) PENDING_COUNTRIES.forEach((c) => set.add(c));
  return [...set];
})();

/** country name -> people from it */
export const byCountry = (() => {
  const m = new Map();
  for (const p of people) {
    if (!p.country) continue;
    if (!m.has(p.country)) m.set(p.country, []);
    m.get(p.country).push(p);
  }
  return m;
})();

/** team name -> people, in the directory's own order */
export const byTeam = (() => {
  const m = new Map(TEAMS.map((t) => [t, []]));
  for (const p of people) if (m.has(p.team)) m.get(p.team).push(p);
  return m;
})();

/** language -> people who speak it, most-spoken first */
export const byLanguage = (() => {
  const m = new Map();
  for (const p of people) {
    for (const l of p.languages || []) {
      if (!m.has(l)) m.set(l, []);
      m.get(l).push(p);
    }
  }
  return new Map([...m].sort((a, b) => b[1].length - a[1].length));
})();

/** UN regional group -> number of people */
export const byRegionalGroup = (() => {
  const m = new Map();
  for (const p of people) {
    const g = COUNTRIES[p.country]?.group;
    if (!g) continue;
    m.set(g, (m.get(g) || 0) + 1);
  }
  return new Map([...m].sort((a, b) => b[1] - a[1]));
})();

/** contract type -> number of people */
export const byContract = (() => {
  const m = new Map();
  for (const p of people) {
    // "Consultant (XB)" and "Secondment (UN Women)" collapse to their head noun.
    const c = (p.contract || 'Not stated').replace(/\s*\(.*\)$/, '');
    m.set(c, (m.get(c) || 0) + 1);
  }
  return new Map([...m].sort((a, b) => b[1] - a[1]));
})();

export const genderSplit = {
  F: people.filter((p) => p.gender === 'F').length,
  M: people.filter((p) => p.gender === 'M').length,
  unknown: people.filter((p) => !p.gender).length,
};

/** Which of the six UN official languages are actually spoken in the office. */
export const officialLanguages = (() => {
  const present = UN_OFFICIAL_LANGUAGES.filter((l) => byLanguage.has(l));
  return {
    present,
    missing: UN_OFFICIAL_LANGUAGES.filter((l) => !byLanguage.has(l)),
    all: present.length === UN_OFFICIAL_LANGUAGES.length,
  };
})();

/** The headline figures used by the count-up scene. */
export const STATS = {
  people: people.length,
  teams: [...byTeam].filter(([, v]) => v.length).length,
  countries: countries.length,
  languages: byLanguage.size,
  regionalGroups: byRegionalGroup.size,
};

/** Rows needing Mafi's confirmation, for verify.html. */
export const unverified = STAFF.filter((p) => p.verified === false);

/**
 * Ignition order for the globe: west to east, so the sweep reads as one
 * continuous eastward motion rather than jumping around the sphere.
 */
export const ignitionOrder = [...countries].sort(
  (a, b) => (COUNTRIES[a]?.lng ?? 0) - (COUNTRIES[b]?.lng ?? 0),
);

/** Continent-ish buckets for the faces scene camera sweep. */
export const REGION_SWEEP = [
  { label: 'Africa',        test: (c) => COUNTRIES[c]?.group === 'African Group' },
  { label: 'Middle East',   test: (c) => ['Saudi Arabia', 'Oman', 'Iraq', 'Qatar'].includes(c) },
  { label: 'South Asia',    test: (c) => ['Bangladesh', 'Pakistan', 'India'].includes(c) },
  { label: 'East Asia',     test: (c) => ['China', 'Japan', 'Republic of Korea'].includes(c) },
  { label: 'Southeast Asia & Oceania', test: (c) => ['Malaysia', 'Indonesia', 'Australia'].includes(c) },
  { label: 'Europe',        test: (c) => ['Germany', 'Spain', 'Norway', 'Ireland', 'United Kingdom', 'Türkiye', 'France', 'Russian Federation'].includes(c) },
  { label: 'The Americas',  test: (c) => COUNTRIES[c]?.group === 'Latin American and Caribbean Group' || ['United States', 'Canada'].includes(c) },
];

/** [{ label, people[] }] in sweep order, skipping empty regions. */
export const peopleByRegion = REGION_SWEEP
  .map(({ label, test }) => ({
    label,
    people: named.filter((p) => p.country && test(p.country)),
  }))
  .filter((r) => r.people.length);
