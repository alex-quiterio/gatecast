import { describe, expect, test } from 'bun:test';
import { formatOffset, resolveOffset, validateForm, type FormValues } from '@ui/form';

const valid: FormValues = {
  name: 'Example Person',
  date: '1990-03-14',
  time: '09:30',
  timeZone: 'Europe/Lisbon',
  manualOffset: false,
  offset: '0',
};

describe('validateForm', () => {
  test('accepts a valid zone-based form and resolves the offset', () => {
    const result = validateForm(valid, ['Europe/Lisbon']);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.timeZone).toBe('Europe/Lisbon');
      expect(result.input.utcOffset).toBe(0);
    }
  });
  test('resolves DST offsets by date', () => {
    expect(resolveOffset('Europe/Lisbon', '2020-07-01', '12:00')).toBe(1);
    expect(resolveOffset('Europe/Lisbon', '2020-01-01', '12:00')).toBe(0);
    expect(resolveOffset('Not/AZone', '2020-01-01', '12:00')).toBeUndefined();
  });
  test('manual offset', () => {
    const result = validateForm({ ...valid, manualOffset: true, offset: '5,5', timeZone: '' });
    expect(result.ok && result.input.utcOffset).toBe(5.5);
    expect(result.ok && result.input.timeZone).toBeUndefined();
  });
  test('reports field errors', () => {
    const bad = validateForm({ ...valid, date: '', time: '', name: 'x'.repeat(200) });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(Object.keys(bad.errors).sort()).toEqual(['date', 'name', 'time']);
  });
  test('rejects bad offsets and unknown zones', () => {
    const offset = validateForm({ ...valid, manualOffset: true, offset: '30' });
    expect(!offset.ok && offset.errors.offset).toBeTruthy();
    const blank = validateForm({ ...valid, manualOffset: true, offset: ' ' });
    expect(blank.ok).toBe(false);
    const zone = validateForm({ ...valid, timeZone: 'Mars/Base' }, ['Europe/Lisbon']);
    expect(!zone.ok && zone.errors.timeZone).toBeTruthy();
    const empty = validateForm({ ...valid, timeZone: '' });
    expect(!empty.ok && empty.errors.timeZone).toBeTruthy();
  });
  test('engine validation errors surface as a form error', () => {
    const result = validateForm({ ...valid, date: '2000-02-30' });
    expect(result.ok).toBe(false);
  });
});

describe('formatOffset', () => {
  test('formats', () => {
    expect(formatOffset(1)).toBe('UTC+1');
    expect(formatOffset(-5)).toBe('UTC-5');
    expect(formatOffset(5.5)).toBe('UTC+5:30');
    expect(formatOffset(0)).toBe('UTC+0');
  });
});
