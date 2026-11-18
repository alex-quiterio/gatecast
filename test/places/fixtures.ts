import { parsePlaces, type PlaceIndex, type PlacesFile } from '@/places';

/** Tiny dataset: [name, ascii, country, zone, pop, admin, alts]. */
const countries: [string, string][] = [
  ['IT', 'Italy'],
  ['VE', 'Venezuela'],
  ['US', 'United States'],
  ['PT', 'Portugal'],
  ['DK', 'Denmark'],
  ['NL', 'Netherlands'],
];
const zones = [
  'Europe/Rome',
  'America/Caracas',
  'America/Chicago',
  'Europe/Lisbon',
  'Europe/Copenhagen',
  'Europe/Amsterdam',
];
const admins = [
  'Veneto',
  'Emilia-Romagna',
  'Illinois',
  'Missouri',
  'Lazio',
  'Zealand',
  'North Holland',
];

/** Fictional-sized fixture rows for deterministic ranking tests. */
export const FIXTURE: PlacesFile = {
  v: 1,
  countries,
  zones,
  admins,
  rows: [
    ['Rome', '', 0, 0, 2800000, 5, 'Roma'],
    ['Venice', '', 0, 0, 260000, 1, 'Venezia'],
    ['Forlì', '', 0, 0, 117000, 2, ''],
    ['Venezuela Town', '', 1, 1, 900000, 0, ''],
    ['Romano di Lombardia', '', 0, 0, 20000, 0, ''],
    ['Springfield', '', 2, 2, 116000, 3, ''],
    ['Springfield', '', 2, 2, 114000, 4, ''],
    ['Porto', '', 3, 3, 237000, 0, ''],
    ['Santa Rome', '', 2, 2, 16000, 0, ''],
    ['Københavns Forli', 'Kobenhavns Forli', 4, 4, 15000, 6, ''],
    ['Amsterdam', '', 5, 5, 742000, 7, ''],
    ['Amsterdam', '', 2, 2, 18000, 3, ''],
    ['Trome', '', 0, 0, 30000, 0, ''],
  ],
};

/** Fresh index from {@link FIXTURE}. */
export function fixtureIndex(): PlaceIndex {
  return parsePlaces(FIXTURE);
}
