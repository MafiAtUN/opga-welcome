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
  const native = nativeLanguageOf(p.countries?.[0]);
  let languages = stated;
  if (native && !languages.includes(native)) languages = [native, ...languages];
  if (p.countries?.length && !languages.includes('English')) languages = [...languages, 'English'];
  return languages === stated ? p : { ...p, languages };
}

/** Everyone the presentation counts. */
export const people = STAFF.map(withNativeLanguage);

/**
 * A person's primary nationality — the first listed. Used wherever someone
 * must be counted exactly once (regional groups, region sweep). Both of a
 * dual national's countries still light up on the globe.
 */
export const primaryCountry = (p) => p.countries?.[0] ?? null;

/**
 * Rows whose native language came from their nationality rather than from the
 * directory — i.e. an inference to sanity-check before the meeting.
 */
export const inferredLanguages = STAFF
  .map((p) => ({ p, added: withNativeLanguage(p).languages.filter((l) => !(p.languages || []).includes(l)) }))
  .filter((r) => r.added.length)
  .map(({ p, added }) => ({ id: p.id, name: p.name, country: primaryCountry(p), added }));

/** People we can actually show a card for: has a name. */
export const named = people.filter((p) => p.name);

/** Countries with at least one person. Sorted for a stable ignition order. */
export const countries = (() => {
  const set = new Set(people.flatMap((p) => p.countries || []));
  if (INCLUDE_PENDING) PENDING_COUNTRIES.forEach((c) => set.add(c));
  return [...set];
})();

/** country name -> people from it */
export const byCountry = (() => {
  const m = new Map();
  for (const p of people) {
    for (const c of p.countries || []) {
      if (!m.has(c)) m.set(c, []);
      m.get(c).push(p);
    }
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
    // Primary nationality only, so a dual national is not counted twice and
    // the groups still add up to the size of the Office.
    const g = COUNTRIES[primaryCountry(p)]?.group;
    if (!g) continue;
    m.set(g, (m.get(g) || 0) + 1);
  }
  return new Map([...m].sort((a, b) => b[1] - a[1]));
})();

/**
 * How people came to be here, framed the way the Office wants it said: not a
 * breakdown of contract types, but governments releasing their people to this
 * work alongside colleagues employed by the United Nations.
 */
export const howWeCameHere = (() => {
  const seconded = people.filter((p) => p.seconded);
  const un = people.filter((p) => !p.seconded);
  const sendingCountries = [...new Set(seconded.map(primaryCountry).filter(Boolean))];
  return {
    seconded: seconded.length,
    un: un.length,
    sendingCountries,
    sendingCountryCount: sendingCountries.length,
  };
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
  { label: 'Southeast Asia & Oceania',
    test: (c) => ['Malaysia', 'Indonesia', 'Thailand', 'Australia'].includes(c) },
  { label: 'Europe',        test: (c) => ['Germany', 'Spain', 'Norway', 'Ireland', 'United Kingdom', 'Türkiye', 'France', 'Russian Federation'].includes(c) },
  // Split in two: as one bucket the Americas held ten of the thirty-four and
  // wrapped into a wall of cards while every other panel showed four to six.
  { label: 'North America', test: (c) => ['United States', 'Canada'].includes(c) },
  { label: 'Latin America & the Caribbean',
    test: (c) => COUNTRIES[c]?.group === 'Latin American and Caribbean Group' },
];

/** [{ label, people[] }] in sweep order, skipping empty regions. */
export const peopleByRegion = REGION_SWEEP
  .map(({ label, test }) => ({
    label,
    people: named.filter((p) => primaryCountry(p) && test(primaryCountry(p))),
  }))
  .filter((r) => r.people.length);
