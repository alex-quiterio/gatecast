import type { BirthInput } from '@/types';
import { validateBirthInput } from '@engine';

/** Longest name accepted from a link or the form. */
export const MAX_NAME_LENGTH = 80;

/** Longest birth place display string accepted from a link or the form. */
export const MAX_PLACE_LENGTH = 120;

/**
 * Encode a person as a query string (`n=&d=&t=&u=&z=&p=`), the form used inside
 * share links. The result is already percent-encoded.
 */
export function encodePerson(input: BirthInput): string {
  const params = new URLSearchParams();
  if (input.name) params.set('n', input.name);
  params.set('d', input.date);
  params.set('t', input.time);
  params.set('u', String(input.utcOffset));
  if (input.timeZone) params.set('z', input.timeZone);
  if (input.place) params.set('p', input.place);
  return params.toString();
}

/**
 * Decode a person from share-link parameters. Returns `undefined` for
 * anything missing, malformed or rejected by `validateBirthInput`.
 */
export function decodePerson(source: URLSearchParams | string): BirthInput | undefined {
  const params = typeof source === 'string' ? new URLSearchParams(source) : source;
  const date = params.get('d');
  const time = params.get('t');
  const offsetText = params.get('u');
  if (date === null || time === null || offsetText === null) return undefined;
  if (offsetText.trim() === '') return undefined;
  const utcOffset = Number(offsetText);
  if (!Number.isFinite(utcOffset)) return undefined;
  const name = (params.get('n') ?? '').trim().slice(0, MAX_NAME_LENGTH);
  const zone = params.get('z');
  const input: BirthInput = { name, date, time, utcOffset };
  if (zone && zone.length <= 64 && /^[A-Za-z0-9_+\-/]+$/.test(zone)) input.timeZone = zone;
  // eslint-disable-next-line no-control-regex
  const place = (params.get('p') ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (place) input.place = place.slice(0, MAX_PLACE_LENGTH);
  try {
    if (validateBirthInput(input).length > 0) return undefined;
  } catch {
    return undefined;
  }
  return input;
}

/** Encode two people for `#/compare?a=...&b=...`. */
export function encodeComparison(a: BirthInput, b: BirthInput): string {
  const params = new URLSearchParams();
  params.set('a', encodePerson(a));
  params.set('b', encodePerson(b));
  return params.toString();
}

/** Decode a comparison; either side may be missing or invalid. */
export function decodeComparison(source: URLSearchParams | string): {
  a?: BirthInput;
  b?: BirthInput;
} {
  const params = typeof source === 'string' ? new URLSearchParams(source) : source;
  const result: { a?: BirthInput; b?: BirthInput } = {};
  const a = decodePerson(params.get('a') ?? '');
  const b = decodePerson(params.get('b') ?? '');
  if (a) result.a = a;
  if (b) result.b = b;
  return result;
}
