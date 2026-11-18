import { describe, expect, test } from 'bun:test';
import {
  formatPlace,
  groupTimeZones,
  listTimeZones,
  matchRange,
  normalize,
  parsePlaces,
  placeLabel,
  searchPlaces,
  type PlacesFile,
} from '@/places';
import { fixtureIndex } from './fixtures';

const names = (q: string, limit?: number) =>
  searchPlaces(fixtureIndex(), q, limit).map((p) => formatPlace(p));

describe('normalize', () => {
  test('folds accents and case', () => {
    expect(normalize('Forlì')).toBe('forli');
    expect(normalize('ZÜRICH')).toBe('zurich');
    expect(normalize('São  Paulo')).toBe('sao paulo');
  });
  test('handles letters that do not decompose', () => {
    expect(normalize('Ørsted')).toBe('orsted');
    expect(normalize('Straße')).toBe('strasse');
    expect(normalize('Łódź')).toBe('lodz');
    expect(normalize('Đà Nẵng')).toBe('da nang');
    expect(normalize('Œuvre Æther')).toBe('oeuvre aether');
  });
  test('collapses punctuation and whitespace', () => {
    expect(normalize("  St.  John's,  Canada ")).toBe('st john s canada');
    expect(normalize('')).toBe('');
  });
});

describe('matchRange', () => {
  test('maps back onto the accented original', () => {
    expect(matchRange('Forlì', 'forl')).toEqual([0, 4]);
    expect(matchRange('São Paulo', 'paul')).toEqual([4, 8]);
    expect(matchRange('Rome', 'zz')).toBeNull();
  });
});

describe('searchPlaces', () => {
  test('empty and one-character queries return nothing', () => {
    expect(names('')).toEqual([]);
    expect(names('r')).toEqual([]);
    expect(names('  ')).toEqual([]);
  });
  test('exact name beats prefix', () => {
    expect(names('rome')[0]).toBe('Rome, Lazio, Italy');
  });
  test('prefix beats substring and word start; Rome first for "rom"', () => {
    const r = names('rom');
    expect(r[0]).toBe('Rome, Lazio, Italy');
    expect(r.indexOf('Romano di Lombardia, Italy')).toBeLessThan(
      r.indexOf('Santa Rome, United States'),
    );
    expect(r.indexOf('Santa Rome, United States')).toBeLessThan(r.indexOf('Trome, Italy'));
  });
  test('Venice and Venezia resolve to Venice, not Venezuela', () => {
    expect(names('venice')[0]).toBe('Venice, Veneto, Italy');
    expect(names('venezia')[0]).toBe('Venice, Veneto, Italy');
    expect(names('venez')[0]).toBe('Venezuela Town, Venezuela');
  });
  test('accents work in both directions', () => {
    expect(names('forli')[0]).toBe('Forlì, Emilia-Romagna, Italy');
    expect(names('forlì')[0]).toBe('Forlì, Emilia-Romagna, Italy');
    expect(names('FORLI')[0]).toBe('Forlì, Emilia-Romagna, Italy');
    expect(names('kobenhavn')[0]).toContain('Københavns');
  });
  test('name plus country or region', () => {
    expect(names('forli italy')[0]).toBe('Forlì, Emilia-Romagna, Italy');
    expect(names('forli denmark')[0]).toContain('Københavns Forli');
    expect(names('springfield missouri')[0]).toBe('Springfield, Missouri, United States');
    expect(names('springfield illinois')[0]).toBe('Springfield, Illinois, United States');
    expect(names('rome, it')[0]).toBe('Rome, Lazio, Italy');
  });
  test('duplicates are disambiguated by admin and ordered by population', () => {
    const r = names('springfield');
    expect(r.slice(0, 2)).toEqual([
      'Springfield, Illinois, United States',
      'Springfield, Missouri, United States',
    ]);
  });
  test('Amsterdam, Netherlands outranks the smaller Amsterdam', () => {
    for (const q of ['amsterdam', 'AMSTERDAM', 'amsterdam netherlands']) {
      expect(names(q)[0]).toBe('Amsterdam, North Holland, Netherlands');
    }
  });
  test('respects the limit', () => {
    expect(names('ro', 2)).toHaveLength(2);
  });
  test('formatting', () => {
    const [forli] = searchPlaces(fixtureIndex(), 'forli');
    expect(forli && placeLabel(forli)).toBe('Forlì, Italy');
    const same: PlacesFile = {
      v: 1,
      countries: [['SG', 'Singapore']],
      zones: ['Asia/Singapore'],
      admins: ['Singapore'],
      rows: [['Singapore', '', 0, 0, 5000000, 1, '']],
    };
    const [sg] = searchPlaces(parsePlaces(same), 'singapore');
    expect(sg && formatPlace(sg)).toBe('Singapore, Singapore');
  });
});

describe('time zones', () => {
  test('every listed zone is valid for Intl', () => {
    const zones = listTimeZones();
    expect(zones.length).toBeGreaterThan(50);
    for (const z of zones)
      expect(() => new Intl.DateTimeFormat('en', { timeZone: z })).not.toThrow();
  });
  test('grouping by region', () => {
    const g = groupTimeZones(['Europe/Rome', 'UTC', 'Etc/GMT+1', 'America/Chicago', 'Mars/Base']);
    expect(Object.keys(g)).toEqual(['America', 'Europe', 'UTC / Etc', 'Mars']);
    expect(g['UTC / Etc']).toEqual(['Etc/GMT+1', 'UTC']);
  });
});
