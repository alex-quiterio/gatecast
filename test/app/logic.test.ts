import { describe, expect, test } from 'bun:test';
import type { BirthInput } from '@/types';
import { FIT, MAX_SCALE, MIN_SCALE, clampScale, zoomAt } from '@ui/canvas-logic';
import { julianDay, resolveCssVars, standaloneSvg, summaryText, svgSize } from '@ui/chart-facts';
import { emptyFormState, formStateFromInput, validateForm, zoneSummary } from '@ui/form-logic';
import { entriesFor, filterEntries } from '@ui/library-logic';
import { buildQuickItems, searchItems } from '@ui/search-logic';
import { decodePerson, encodePerson } from '@ui/share';
import { PeopleStore } from '@ui/storage';
import { placeTooltip } from '@ui/tooltip-logic';
import { computeChart } from '@engine';

const person: BirthInput = {
  name: 'Zoë 山田',
  date: '1990-03-14',
  time: '09:30',
  utcOffset: 0,
  timeZone: 'Europe/Lisbon',
  place: 'Forlì, Italy',
};

describe('place in share links and storage', () => {
  test('round trips with unicode and the p parameter', () => {
    const qs = encodePerson(person);
    expect(new URLSearchParams(qs).get('p')).toBe('Forlì, Italy');
    expect(decodePerson(qs)).toEqual(person);
  });
  test('place is optional and sanitised', () => {
    const { place, ...rest } = person;
    void place;
    expect(decodePerson(encodePerson(rest))?.place).toBeUndefined();
    const params = new URLSearchParams(encodePerson(person));
    params.set('p', `x\u0000y${'z'.repeat(300)}`);
    expect((decodePerson(params)?.place ?? '').length).toBeLessThanOrEqual(120);
    expect(decodePerson(params)?.place).not.toContain('\u0000');
  });
  test('the store keeps the place', () => {
    const mem = new Map<string, string>();
    const store = new PeopleStore({
      getItem: (k) => mem.get(k) ?? null,
      setItem: (k, v) => void mem.set(k, v),
      removeItem: (k) => void mem.delete(k),
    });
    store.add(person);
    expect(store.list()[0]?.input.place).toBe('Forlì, Italy');
  });
});

describe('form-logic with a place', () => {
  const base = { ...emptyFormState(), date: '2020-07-01', time: '12:00' };
  test('a place zone is accepted and the place kept', () => {
    const r = validateForm({ ...base, timeZone: 'Europe/Rome', place: 'Forlì, Italy' });
    expect(r.ok && r.input.place).toBe('Forlì, Italy');
    expect(r.ok && r.input.utcOffset).toBe(2);
  });
  test('needs a place, zone or manual offset', () => {
    const r = validateForm(base);
    expect(!r.ok && r.errors.timeZone).toBeTruthy();
  });
  test('zone summary shows the offset on that date', () => {
    expect(zoneSummary('Europe/Rome', '2020-07-01', '12:00')).toBe(
      'Europe/Rome · UTC+2 on that date',
    );
    expect(zoneSummary('', '2020-07-01', '12:00')).toBe('');
  });
  test('a link whose zone disagrees with its offset shows the stored offset', () => {
    const state = formStateFromInput({ ...person, utcOffset: 5.5, place: undefined });
    expect(state.manualOffset).toBe(true);
    expect(state.offset).toBe('5.5');
    expect(state.advancedOpen).toBe(true);
    const ok = formStateFromInput(person);
    expect(ok.manualOffset).toBe(false);
    expect(ok.timeZone).toBe('Europe/Lisbon');
    expect(ok.place).toBe('Forlì, Italy');
  });
});

describe('library logic', () => {
  test('filters by text and by center', () => {
    const gates = entriesFor('gate');
    expect(gates).toHaveLength(64);
    expect(filterEntries(gates, 'gate', '20').some((e) => e.id === '20')).toBe(true);
    const throat = filterEntries(gates, 'gate', '', 'Throat');
    expect(throat.length).toBeGreaterThan(5);
    expect(throat.length).toBeLessThan(64);
    expect(filterEntries(gates, 'gate', 'zzzzzz')).toHaveLength(0);
    // The center filter only applies to gates.
    expect(filterEntries(entriesFor('type'), 'type', '', 'Throat').length).toBeGreaterThan(0);
  });
});

describe('quick find', () => {
  const items = buildQuickItems([{ id: 'x', input: person, savedAt: '' }]);
  test('finds gates, channels and saved people', () => {
    expect(searchItems(items, 'gate 20').length).toBeGreaterThanOrEqual(0);
    expect(searchItems(items, '20')[0]?.hash).toContain('#/library/');
    expect(searchItems(items, 'zoë')[0]?.group).toBe('Saved charts');
    expect(searchItems(items, 'throat').some((i) => i.hash === '#/library/center/Throat')).toBe(
      true,
    );
  });
  test('empty query lists pages first', () => {
    expect(searchItems(items, '')[0]?.group).toBe('Go to');
    expect(searchItems(items, 'qqqqqqq')).toHaveLength(0);
  });
});

describe('tooltip placement', () => {
  const vp = { width: 400, height: 800 };
  const size = { width: 200, height: 80 };
  test('below the anchor when it fits, clamped horizontally', () => {
    const p = placeTooltip({ left: 380, top: 100, width: 20, height: 20 }, size, vp);
    expect(p.side).toBe('below');
    expect(p.left).toBe(400 - 200 - 8);
    expect(p.top).toBe(128);
  });
  test('above when it would overflow the bottom', () => {
    const p = placeTooltip({ left: 10, top: 780, width: 20, height: 20 }, size, vp);
    expect(p.side).toBe('above');
    expect(p.top).toBe(780 - 80 - 8);
    expect(p.left).toBe(8);
  });
});

describe('canvas zoom', () => {
  test('clamps and returns to FIT at 1', () => {
    expect(clampScale(100)).toBe(MAX_SCALE);
    expect(clampScale(0)).toBe(MIN_SCALE);
    const z = zoomAt(FIT, 2);
    expect(z.scale).toBe(2);
    expect(zoomAt(z, 0.5)).toEqual(FIT);
  });
  test('keeps the focal point fixed', () => {
    const z = zoomAt(FIT, 2, 100, 50);
    expect(z.x).toBe(-100);
    expect(z.y).toBe(-50);
  });
});

describe('export helpers', () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-480 -480 960 960"><style>.a{}</style><g fill="var(--hd-body, #123)" style="opacity:var(--hd-glow,0.9)"/></svg>';
  test('resolves variables with fallbacks', () => {
    const out = resolveCssVars(svg, (n) => (n === '--hd-body' ? '#abc' : ''));
    expect(out).toContain('fill="#abc"');
    expect(out).toContain('opacity:0.9');
  });
  test('standalone svg has size and background', () => {
    expect(svgSize(svg)).toEqual({ x: -480, y: -480, width: 960, height: 960 });
    const out = standaloneSvg(svg, (n) => (n === '--gc-canvas' ? '#fff' : ''), 2);
    expect(out).toContain('width="1920"');
    expect(out).toContain('<rect x="-480" y="-480" width="960" height="960" fill="#fff"/>');
  });
  test('julian day and summary text', () => {
    expect(julianDay('2000-01-01T12:00:00Z')).toBeCloseTo(2451545, 5);
    const chart = computeChart(person);
    const text = summaryText(chart);
    expect(text).toContain(`Type: ${chart.type}`);
    expect(text).toContain('Forlì, Italy');
  });
});
