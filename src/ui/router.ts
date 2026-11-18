import type { BirthInput } from '@/types';
import { decodeComparison, decodePerson, encodeComparison, encodePerson } from './share';

/** Reference sections of the library, in tab order. */
export const LIBRARY_TABS = [
  'gate',
  'channel',
  'center',
  'type',
  'authority',
  'profile',
  'glossary',
] as const;
export type LibraryTab = (typeof LIBRARY_TABS)[number];

export type Route =
  | { name: 'chart'; person?: BirthInput }
  | { name: 'compare'; a?: BirthInput; b?: BirthInput }
  | { name: 'library'; tab: LibraryTab; id?: string }
  | { name: 'about' }
  | { name: 'notFound'; path: string };

const MAX_HASH_LENGTH = 2000;
const MAX_ID_LENGTH = 60;

function isLibraryTab(value: string): value is LibraryTab {
  return (LIBRARY_TABS as readonly string[]).includes(value);
}

function safeDecode(segment: string): string | undefined {
  try {
    return decodeURIComponent(segment);
  } catch {
    return undefined;
  }
}

/**
 * Parse `location.hash` into a route. Total: never throws, and anything
 * unrecognised or hostile becomes `notFound` or an empty route.
 */
export function parseRoute(hash: string): Route {
  if (hash.length > MAX_HASH_LENGTH) return { name: 'notFound', path: '' };
  let rest = hash.startsWith('#') ? hash.slice(1) : hash;
  const queryAt = rest.indexOf('?');
  const query = queryAt >= 0 ? rest.slice(queryAt + 1) : '';
  rest = queryAt >= 0 ? rest.slice(0, queryAt) : rest;
  const segments = rest.split('/').filter((s) => s !== '');
  const decoded = segments.map(safeDecode);
  const first = decoded[0];
  if (decoded.some((s) => s === undefined)) {
    return { name: 'notFound', path: '/' + segments.join('/').slice(0, 80) };
  }
  if (first === undefined || first === 'chart') {
    if (decoded.length > 1) return { name: 'notFound', path: '/' + decoded.join('/').slice(0, 80) };
    const person = query ? decodePerson(query) : undefined;
    return person ? { name: 'chart', person } : { name: 'chart' };
  }
  if (first === 'compare' && decoded.length === 1) {
    return { name: 'compare', ...decodeComparison(query) };
  }
  if (first === 'about' && decoded.length === 1) return { name: 'about' };
  if (first === 'library' && decoded.length <= 3) {
    const tab = decoded[1];
    const id = decoded[2];
    if (tab === undefined) return { name: 'library', tab: 'gate' };
    if (isLibraryTab(tab)) {
      if (id === undefined) return { name: 'library', tab };
      if (id.length <= MAX_ID_LENGTH && /^[\w .'/+-]+$/u.test(id)) {
        return { name: 'library', tab, id };
      }
      return { name: 'library', tab };
    }
  }
  return { name: 'notFound', path: '/' + decoded.join('/').slice(0, 80) };
}

/** Build the canonical hash (with leading `#`) for a route. */
export function buildHash(route: Route): string {
  switch (route.name) {
    case 'chart':
      return route.person ? `#/chart?${encodePerson(route.person)}` : '#/';
    case 'compare':
      return route.a && route.b ? `#/compare?${encodeComparison(route.a, route.b)}` : '#/compare';
    case 'library': {
      const base = `#/library/${route.tab}`;
      return route.id ? `${base}/${encodeURIComponent(route.id)}` : base;
    }
    case 'about':
      return '#/about';
    case 'notFound':
      return '#/';
  }
}
