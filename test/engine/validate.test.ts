import { describe, expect, test } from 'bun:test';
import { birthToUtcDate, utcOffsetForZone, validateBirthInput } from '@engine';
import type { BirthInput } from '@/types';

const ok: BirthInput = { name: 'Test', date: '1990-06-15', time: '14:30', utcOffset: 1 };
const errs = (patch: Partial<BirthInput>) => validateBirthInput({ ...ok, ...patch });

describe('validateBirthInput', () => {
  test('accepts a valid input', () => {
    expect(validateBirthInput(ok)).toEqual([]);
    expect(errs({ name: '', date: '1800-01-01', time: '00:00', utcOffset: -12 })).toEqual([]);
    expect(errs({ date: '2100-12-31', time: '23:59', utcOffset: 14 })).toEqual([]);
    expect(errs({ utcOffset: 5.75 })).toEqual([]);
  });

  test('rejects impossible dates', () => {
    expect(errs({ date: '1990-02-30' })).not.toEqual([]);
    expect(errs({ date: '1991-02-29' })).not.toEqual([]);
    expect(errs({ date: '1900-02-29' })).not.toEqual([]);
    expect(errs({ date: '2000-02-29' })).toEqual([]);
    expect(errs({ date: '1992-02-29' })).toEqual([]);
    expect(errs({ date: '1990-04-31' })).not.toEqual([]);
    expect(errs({ date: '1990-13-01' })).not.toEqual([]);
    expect(errs({ date: '1990-00-10' })).not.toEqual([]);
    expect(errs({ date: '1990-01-00' })).not.toEqual([]);
  });

  test('rejects malformed dates and years out of range', () => {
    expect(errs({ date: '15/06/1990' })).not.toEqual([]);
    expect(errs({ date: '1990-6-5' })).not.toEqual([]);
    expect(errs({ date: '' })).not.toEqual([]);
    expect(errs({ date: '1799-12-31' })).not.toEqual([]);
    expect(errs({ date: '2101-01-01' })).not.toEqual([]);
  });

  test('rejects bad times', () => {
    expect(errs({ time: '24:00' })).not.toEqual([]);
    expect(errs({ time: '12:60' })).not.toEqual([]);
    expect(errs({ time: '9:30' })).not.toEqual([]);
    expect(errs({ time: '12:30:00' })).not.toEqual([]);
    expect(errs({ time: '' })).not.toEqual([]);
  });

  test('rejects offsets out of range or non-finite', () => {
    expect(errs({ utcOffset: 14.5 })).not.toEqual([]);
    expect(errs({ utcOffset: -12.5 })).not.toEqual([]);
    expect(errs({ utcOffset: Number.NaN })).not.toEqual([]);
    expect(errs({ utcOffset: Infinity })).not.toEqual([]);
  });

  test('rejects names longer than 80 characters', () => {
    expect(errs({ name: 'x'.repeat(80) })).toEqual([]);
    expect(errs({ name: 'x'.repeat(81) })).not.toEqual([]);
  });

  test('reports several problems at once', () => {
    expect(errs({ date: 'nope', time: 'nope', utcOffset: 99 }).length).toBe(3);
  });
});

describe('birthToUtcDate', () => {
  test('subtracts the offset', () => {
    expect(birthToUtcDate({ ...ok, utcOffset: 1 }).toISOString()).toBe('1990-06-15T13:30:00.000Z');
    expect(birthToUtcDate({ ...ok, utcOffset: -5 }).toISOString()).toBe('1990-06-15T19:30:00.000Z');
    expect(birthToUtcDate({ ...ok, utcOffset: 5.75 }).toISOString()).toBe(
      '1990-06-15T08:45:00.000Z',
    );
  });

  test('crosses midnight', () => {
    const d = birthToUtcDate({ ...ok, date: '2000-01-01', time: '00:30', utcOffset: 2 });
    expect(d.toISOString()).toBe('1999-12-31T22:30:00.000Z');
  });
});

describe('utcOffsetForZone', () => {
  test('Lisbon: summer vs winter', () => {
    expect(utcOffsetForZone('Europe/Lisbon', '2020-07-15', '12:00')).toBe(1);
    expect(utcOffsetForZone('Europe/Lisbon', '2020-01-15', '12:00')).toBe(0);
  });

  test('New York across DST', () => {
    expect(utcOffsetForZone('America/New_York', '2021-03-14', '01:30')).toBe(-5);
    expect(utcOffsetForZone('America/New_York', '2021-03-14', '03:30')).toBe(-4);
    expect(utcOffsetForZone('America/New_York', '2021-11-07', '00:30')).toBe(-4);
    expect(utcOffsetForZone('America/New_York', '2021-11-07', '03:00')).toBe(-5);
    expect(utcOffsetForZone('America/New_York', '2021-12-25', '12:00')).toBe(-5);
  });

  test('half-hour and 45-minute zones', () => {
    expect(utcOffsetForZone('Asia/Kolkata', '1995-08-01', '08:00')).toBe(5.5);
    expect(utcOffsetForZone('Asia/Kathmandu', '2015-08-01', '08:00')).toBe(5.75);
  });

  test('UTC and the southern hemisphere', () => {
    expect(utcOffsetForZone('UTC', '2020-05-05', '05:05')).toBe(0);
    expect(utcOffsetForZone('Australia/Sydney', '2020-01-15', '12:00')).toBe(11);
    expect(utcOffsetForZone('Australia/Sydney', '2020-07-15', '12:00')).toBe(10);
  });

  test('unknown zones throw a clear error', () => {
    expect(() => utcOffsetForZone('Mars/Olympus', '2020-01-01', '00:00')).toThrow(
      /Unknown time zone/,
    );
  });
});
