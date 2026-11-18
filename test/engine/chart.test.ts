import { describe, expect, test } from 'bun:test';
import { computeChart, designMoment, sunLongitude, trueNodeLongitude } from '@engine';
import type { BirthInput } from '@/types';
import { PLANET_NAMES } from '@/types';

const input: BirthInput = { name: 'Fictional', date: '1985-04-12', time: '09:20', utcOffset: 2 };

describe('computeChart', () => {
  const chart = computeChart(input);

  test('has 13 activations per set in order, with valid values', () => {
    for (const set of [chart.personality, chart.design]) {
      expect(set.map((a) => a.planet)).toEqual([...PLANET_NAMES]);
      for (const a of set) {
        expect(a.longitude).toBeGreaterThanOrEqual(0);
        expect(a.longitude).toBeLessThan(360);
        expect(a.gate).toBeGreaterThanOrEqual(1);
        expect(a.gate).toBeLessThanOrEqual(64);
        for (const v of [a.line, a.color, a.tone]) expect(v >= 1 && v <= 6).toBe(true);
      }
    }
  });

  test('Earth and South Node are opposite the Sun and North Node', () => {
    for (const set of [chart.personality, chart.design]) {
      const get = (n: string) => set.find((a) => a.planet === n)?.longitude as number;
      expect((get('Sun') + 180) % 360).toBeCloseTo(get('Earth'), 9);
      expect((get('NorthNode') + 180) % 360).toBeCloseTo(get('SouthNode'), 9);
    }
  });

  test('birth and design moments, 88 degrees of Sun arc apart', () => {
    expect(chart.birthUtc).toBe('1985-04-12T07:20:00.000Z');
    const days = (Date.parse(chart.birthUtc) - Date.parse(chart.designUtc)) / 86_400_000;
    expect(days).toBeGreaterThan(84);
    expect(days).toBeLessThan(92);
    const arc =
      (sunLongitude(new Date(chart.birthUtc)) - sunLongitude(new Date(chart.designUtc)) + 360) %
      360;
    expect(arc).toBeCloseTo(88, 3);
    expect(designMoment(new Date(chart.birthUtc)).toISOString()).toBe(chart.designUtc);
  });

  test('derived fields are internally consistent', () => {
    expect(chart.definedCenters.length + chart.openCenters.length).toBe(9);
    expect(chart.profile).toBe(`${chart.personality[0]?.line}/${chart.design[0]?.line}`);
    expect(chart.crossGates.personalitySun).toBe(chart.personality[0]?.gate as number);
    expect(chart.crossGates.designEarth).toBe(chart.design[1]?.gate as number);
    expect(
      Object.keys(chart.gateSources)
        .map(Number)
        .sort((a, b) => a - b),
    ).toEqual(chart.activeGates);
    const inChannels = new Set(chart.channels.flatMap((c) => c.gates));
    expect(chart.hangingGates).toEqual(chart.activeGates.filter((g) => !inChannels.has(g)));
    expect(chart.strategy.length).toBeGreaterThan(0);
    expect(chart.notSelfTheme.length).toBeGreaterThan(0);
  });

  test('gateSources distinguishes personality, design and both', () => {
    const p = new Set(chart.personality.map((a) => a.gate));
    const d = new Set(chart.design.map((a) => a.gate));
    for (const [gate, source] of Object.entries(chart.gateSources)) {
      const g = Number(gate);
      expect(source).toBe(p.has(g) && d.has(g) ? 'both' : p.has(g) ? 'personality' : 'design');
    }
  });

  test('is deterministic', () => {
    expect(computeChart(input)).toEqual(chart);
  });

  test('throws a clear error on invalid input', () => {
    expect(() => computeChart({ ...input, date: '1990-02-30' })).toThrow(/Invalid birth data/);
    expect(() => computeChart({ ...input, utcOffset: 20 })).toThrow(/UTC offset/);
  });

  test('true node is retrograde-ish: moves roughly -0.053 degrees per day', () => {
    const t = Date.UTC(2000, 0, 1);
    const d =
      ((trueNodeLongitude(new Date(t + 86_400_000 * 10)) - trueNodeLongitude(new Date(t)) + 540) %
        360) -
      180;
    expect(d).toBeLessThan(0.5);
    expect(d).toBeGreaterThan(-1.5);
  });
});
