import { normalize } from './normalize';

export { normalize, matchRange } from './normalize';
export { listTimeZones, groupTimeZones, zoneRegion, ZONE_REGIONS } from './zones';

/** A searchable birth place. */
export interface Place {
  name: string;
  admin?: string;
  country: string;
  countryCode: string;
  timeZone: string;
  population: number;
}

/** Credit line required by the GeoNames CC BY 4.0 licence. */
export const PLACES_ATTRIBUTION = 'City data © GeoNames, CC BY 4.0, geonames.org';

/** On-disk format of public/places.json (see scripts/build-places.ts). */
export interface PlacesFile {
  v: number;
  countries: [string, string][];
  zones: string[];
  admins: string[];
  rows: [string, string, number, number, number, number, string][];
}

interface Entry {
  place: Place;
  /** Folded name fields, filled on first search. */
  name: string;
  /** Folded ascii name and alternates (names only, no duplicates of `name`). */
  alts: string[];
  /** Folded admin + country words used to resolve "forli italy". */
  context: string[];
  altText: string[];
}

/** A parsed, searchable set of places. Opaque: use {@link searchPlaces}. */
export interface PlaceIndex {
  readonly size: number;
  /** @internal */
  entries: Entry[];
  /** @internal */
  folded: boolean;
}

/** Build an index from the compact JSON format. Pure and synchronous. */
export function parsePlaces(data: PlacesFile): PlaceIndex {
  const entries: Entry[] = [];
  for (const row of data.rows) {
    const [name, ascii, ccIdx, tzIdx, population, adminIdx, alternates] = row;
    const country = data.countries[ccIdx];
    const timeZone = data.zones[tzIdx];
    if (!country || !timeZone) continue;
    const admin = adminIdx > 0 ? data.admins[adminIdx - 1] : undefined;
    const place: Place = {
      name,
      country: country[1],
      countryCode: country[0],
      timeZone,
      population,
    };
    if (admin) place.admin = admin;
    const altText = [ascii, ...(alternates ? alternates.split('|') : [])].filter(Boolean);
    entries.push({ place, name: '', alts: [], context: [], altText });
  }
  return { size: entries.length, entries, folded: false };
}

function foldIndex(index: PlaceIndex): void {
  if (index.folded) return;
  for (const e of index.entries) {
    e.name = normalize(e.place.name);
    const seen = new Set([e.name]);
    for (const a of e.altText) {
      const f = normalize(a);
      if (f && !seen.has(f)) {
        seen.add(f);
        e.alts.push(f);
      }
    }
    e.context = normalize(`${e.place.admin ?? ''} ${e.place.country} ${e.place.countryCode}`)
      .split(' ')
      .filter(Boolean);
  }
  index.folded = true;
}

const SCORE = {
  exactName: 100,
  exactAlt: 75,
  prefixName: 80,
  prefixAlt: 70,
  wordName: 50,
  wordAlt: 40,
  subName: 20,
  subAlt: 10,
} as const;

function scoreField(field: string, q: string, name: boolean): number {
  if (field === q) return name ? SCORE.exactName : SCORE.exactAlt;
  if (field.startsWith(q)) return name ? SCORE.prefixName : SCORE.prefixAlt;
  const at = field.indexOf(q);
  if (at < 0) return 0;
  if (field.charAt(at - 1) === ' ') return name ? SCORE.wordName : SCORE.wordAlt;
  return name ? SCORE.subName : SCORE.subAlt;
}

function scoreNames(e: Entry, q: string): number {
  let best = scoreField(e.name, q, true);
  if (best >= SCORE.exactName) return best;
  for (const a of e.alts) {
    const s = scoreField(a, q, false);
    if (s > best) best = s;
  }
  return best;
}

function contextMatches(e: Entry, tokens: string[]): boolean {
  return tokens.every((t) => e.context.some((w) => w.startsWith(t)));
}

function scoreEntry(e: Entry, q: string, tokens: string[]): number {
  let best = scoreNames(e, q);
  if (best >= SCORE.exactName) return best;
  for (let k = 1; k < tokens.length; k++) {
    const rest = tokens.slice(k);
    if (!contextMatches(e, rest)) continue;
    const s = scoreNames(e, tokens.slice(0, k).join(' '));
    // A name-plus-place query is a precise request: lift it above substring noise.
    if (s > 0 && s + 1 > best) best = s + 1;
  }
  return best;
}

/**
 * Search places. Ranking: exact name, name prefix, alternate/ascii prefix,
 * word start, substring; ties by population. Queries like "forli italy" or
 * "springfield illinois" match name plus country/region words. Fewer than two
 * characters returns [].
 *
 * @param index Index from {@link loadPlaces} or {@link parsePlaces}.
 * @param query What the user typed.
 * @param limit Maximum results.
 */
export function searchPlaces(index: PlaceIndex, query: string, limit = 8): Place[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  foldIndex(index);
  const tokens = q.split(' ');
  const hits: { score: number; pop: number; place: Place }[] = [];
  for (const e of index.entries) {
    const score = scoreEntry(e, q, tokens);
    if (score > 0) hits.push({ score, pop: e.place.population, place: e.place });
  }
  hits.sort((a, b) => b.score - a.score || b.pop - a.pop);
  return hits.slice(0, limit).map((h) => h.place);
}

/** Full label: `Forlì, Emilia-Romagna, Italy` (admin omitted when absent or equal to the name). */
export function formatPlace(place: Place): string {
  const parts = [place.name];
  if (place.admin && normalize(place.admin) !== normalize(place.name)) parts.push(place.admin);
  parts.push(place.country);
  return parts.join(', ');
}

/** Short label stored as `BirthInput.place`: `Forlì, Italy`. */
export function placeLabel(place: Place): string {
  return `${place.name}, ${place.country}`;
}

let loading: Promise<PlaceIndex> | undefined;

/**
 * Fetch and parse `./places.json` (relative to the page, so the GitHub Pages
 * base path works). Memoised; a failure is not cached, so calling again retries.
 */
export function loadPlaces(): Promise<PlaceIndex> {
  if (!loading) {
    const base = typeof document !== 'undefined' ? document.baseURI : undefined;
    const url = base ? new URL('./places.json', base).href : './places.json';
    loading = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load places (HTTP ${res.status}).`);
        return res.json() as Promise<PlacesFile>;
      })
      .then(parsePlaces)
      .catch((err: unknown) => {
        loading = undefined;
        throw err instanceof Error ? err : new Error('Could not load places.');
      });
  }
  return loading;
}
