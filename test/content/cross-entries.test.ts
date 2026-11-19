import { describe, expect, test } from 'bun:test';
import { computeChart } from '@engine';
import { GATE_WHEEL } from '@engine/data';
import {
  CROSS_ANGLES,
  CROSS_ENTRIES,
  CROSS_NAMES,
  crossAngleFor,
  crossEntry,
  crossKey,
} from '@content';
import type { CrossAngle } from '@content';

const ANGLES = Object.keys(CROSS_ANGLES) as CrossAngle[];
const pos = (gate: number): number => GATE_WHEEL.indexOf(gate);

describe('CROSS_ENTRIES table', () => {
  test('192 entries, 64 per angle, each Sun gate once per angle', () => {
    expect(CROSS_ENTRIES).toHaveLength(192);
    expect(new Set(CROSS_ENTRIES.map((e) => crossKey(e.angle, e.sunGate))).size).toBe(192);
    for (const angle of ANGLES) {
      const gates = CROSS_ENTRIES.filter((e) => e.angle === angle).map((e) => e.sunGate);
      expect(gates).toHaveLength(64);
      expect([...gates].sort((a, b) => a - b)).toEqual(Array.from({ length: 64 }, (_, i) => i + 1));
    }
  });

  test('gates follow the wheel', () => {
    for (const { sunGate, gates } of CROSS_ENTRIES) {
      expect(gates.personalitySun).toBe(sunGate);
      expect(pos(gates.personalityEarth)).toBe((pos(sunGate) + 32) % 64);
      expect(pos(gates.designEarth)).toBe((pos(gates.designSun) + 32) % 64);
      const back = (pos(sunGate) - pos(gates.designSun) + 64) % 64;
      expect(back === 15 || back === 16).toBe(true);
    }
  });

  test('names match CROSS_NAMES and carry no angle brackets', () => {
    for (const e of CROSS_ENTRIES) {
      expect(e.name).toBe(CROSS_NAMES[crossKey(e.angle, e.sunGate)] ?? '');
      expect(e.name.length).toBeGreaterThan(0);
      expect(e.name).not.toMatch(/[<>]/);
    }
    expect(Object.keys(CROSS_NAMES)).toHaveLength(192);
  });

  test('lookup', () => {
    expect(crossEntry('Right Angle', 13)?.name).toBe('the Sphinx');
    expect(crossEntry('Right Angle', 13)?.gates).toEqual({
      personalitySun: 13,
      personalityEarth: 7,
      designSun: 1,
      designEarth: 2,
    });
    expect(crossEntry('Left Angle', 99)).toBeUndefined();
  });
});

describe('engine round trip', () => {
  // Seeded LCG so the sample is the same on every run.
  let seed = 20240607;
  const rnd = (): number => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const two = (n: number): string => String(n).padStart(2, '0');

  test('Sun and Earth gates always match; design gates mostly', () => {
    const total = 300;
    let designMatches = 0;
    for (let i = 0; i < total; i++) {
      const chart = computeChart({
        name: 'sample',
        date: `${1930 + Math.floor(rnd() * 96)}-${two(1 + Math.floor(rnd() * 12))}-${two(1 + Math.floor(rnd() * 28))}`,
        time: `${two(Math.floor(rnd() * 24))}:${two(Math.floor(rnd() * 60))}`,
        utcOffset: 0,
      });
      const g = chart.crossGates;
      const entry = crossEntry(crossAngleFor(chart.profile), g.personalitySun);
      if (!entry) throw new Error(`no entry for ${chart.profile} ${g.personalitySun}`);
      expect(entry.gates.personalityEarth).toBe(g.personalityEarth);
      if (entry.gates.designSun === g.designSun && entry.gates.designEarth === g.designEarth) {
        designMatches++;
      } else {
        // The only allowed difference: the design Sun is one gate off.
        const diff = (pos(entry.gates.designSun) - pos(g.designSun) + 64) % 64;
        expect([1, 63]).toContain(diff);
      }
    }
    // Measured: about 85.5% over 3,000 charts. Floor kept below that.
    expect(designMatches / total).toBeGreaterThan(0.75);
  });
});
