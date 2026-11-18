import { describe, expect, test } from 'bun:test';
import { gzipSync } from 'node:zlib';
import { formatPlace, placeLabel, parsePlaces, searchPlaces, type PlacesFile } from '@/places';

const file = Bun.file(new URL('../../public/places.json', import.meta.url).pathname);
const text = await file.text();
const data = JSON.parse(text) as PlacesFile;
const index = parsePlaces(data);

const FALLBACK = { name: '', country: '', countryCode: '', timeZone: '', population: 0 };
const top = (q: string) => searchPlaces(index, q, 1)[0];

describe('public/places.json', () => {
  test('size budget', () => {
    expect(index.size).toBeGreaterThan(30000);
    expect(text.length).toBeLessThan(1.8 * 1024 * 1024);
    expect(gzipSync(text).length).toBeLessThan(800 * 1024);
  });
  test('every zone is a valid IANA zone', () => {
    for (const z of data.zones)
      expect(() => new Intl.DateTimeFormat('en', { timeZone: z })).not.toThrow();
  });
  test('Venice and Forlì are findable', () => {
    for (const q of ['venice', 'venezia']) {
      const p = top(q);
      expect(p?.name).toBe('Venice');
      expect(p?.country).toBe('Italy');
      expect(p?.timeZone).toBe('Europe/Rome');
    }
    for (const q of ['forli', 'forlì', 'Forlì', 'FORLI']) {
      const p = top(q);
      expect(p?.name).toBe('Forlì');
      expect(p?.timeZone).toBe('Europe/Rome');
      expect(p?.country).toBe('Italy');
    }
  });
  test('Amsterdam, Netherlands comes first', () => {
    for (const q of ['amsterdam', 'AMSTERDAM', 'amsterdam netherlands']) {
      const p = top(q);
      expect([q, p?.name, p?.country, p?.timeZone]).toEqual([
        q,
        'Amsterdam',
        'Netherlands',
        'Europe/Amsterdam',
      ]);
      expect(p && placeLabel(p)).toBe('Amsterdam, Netherlands');
    }
  });
  test('sanity cities', () => {
    const cases: [string, string, string][] = [
      ['rome', 'Rome', 'Europe/Rome'],
      ['milan', 'Milan', 'Europe/Rome'],
      ['lisbon', 'Lisbon', 'Europe/Lisbon'],
      ['porto', 'Porto', 'Europe/Lisbon'],
      ['sao paulo', 'São Paulo', 'America/Sao_Paulo'],
      ['zurich', 'Zürich', 'Europe/Zurich'],
      ['mumbai', 'Mumbai', 'Asia/Kolkata'],
      ['bombay', 'Mumbai', 'Asia/Kolkata'],
      ['kolkata', 'Kolkata', 'Asia/Kolkata'],
      ['kathmandu', 'Kathmandu', 'Asia/Kathmandu'],
      ['auckland', 'Auckland', 'Pacific/Auckland'],
      ['reykjavik', 'Reykjavík', 'Atlantic/Reykjavik'],
    ];
    for (const [q, name, zone] of cases) {
      const p = top(q);
      expect([q, p?.name, p?.timeZone]).toEqual([q, name, zone]);
    }
    expect(formatPlace(top('new york') ?? FALLBACK)).toContain('New York');
  });
  test('"forli italy" works and search is fast', () => {
    expect(top('forli italy')?.name).toBe('Forlì');
    const start = performance.now();
    for (const q of ['ro', 'san', 'new yo', 'zurich']) searchPlaces(index, q);
    expect((performance.now() - start) / 4).toBeLessThan(50);
  });
});
