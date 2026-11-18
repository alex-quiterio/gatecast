import { describe, expect, test } from 'bun:test';
import type { BirthInput } from '@/types';
import { decodeComparison, decodePerson, encodeComparison, encodePerson } from '@ui/share';

const base: BirthInput = {
  name: 'Example Person',
  date: '1990-03-14',
  time: '09:30',
  utcOffset: 1,
  timeZone: 'Europe/Lisbon',
};

describe('share encode/decode', () => {
  test('round trip', () => {
    expect(decodePerson(encodePerson(base))).toEqual(base);
  });
  test('unicode names and special characters', () => {
    for (const name of ['João Conceição', 'Zoë & "Q" <b>', '李小龙', 'a=b&c=d#e']) {
      const input = { ...base, name };
      expect(decodePerson(encodePerson(input))?.name).toBe(name);
    }
  });
  test('fractional and negative offsets, no zone', () => {
    const input: BirthInput = { name: '', date: '2001-12-31', time: '23:59', utcOffset: -9.5 };
    expect(decodePerson(encodePerson(input))).toEqual(input);
    expect(decodePerson('d=2001-12-31&t=23:59&u=5.5')?.utcOffset).toBe(5.5);
  });
  test('rejects invalid values', () => {
    expect(decodePerson('')).toBeUndefined();
    expect(decodePerson('d=2000-02-30&t=09:30&u=1')).toBeUndefined();
    expect(decodePerson('d=2000-01-31&t=25:61&u=1')).toBeUndefined();
    expect(decodePerson('d=2000-01-31&t=09:30&u=99')).toBeUndefined();
    expect(decodePerson('d=2000-01-31&t=09:30&u=')).toBeUndefined();
    expect(decodePerson('d=2000-01-31&t=09:30&u=NaN')).toBeUndefined();
    expect(decodePerson('d=2000-01-31&t=09:30')).toBeUndefined();
  });
  test('trims, caps name length and drops unsafe zones', () => {
    const long = decodePerson(`n=${'x'.repeat(500)}&d=2000-01-31&t=09:30&u=1`);
    expect(long?.name.length).toBe(80);
    const zone = decodePerson('d=2000-01-31&t=09:30&u=1&z=%3Cscript%3E');
    expect(zone?.timeZone).toBeUndefined();
  });
  test('comparison round trip and partial', () => {
    const b: BirthInput = { name: 'Sample Two', date: '1985-07-02', time: '21:05', utcOffset: -4 };
    expect(decodeComparison(encodeComparison(base, b))).toEqual({ a: base, b });
    expect(decodeComparison('a=garbage')).toEqual({});
  });
});
