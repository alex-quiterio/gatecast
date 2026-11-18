import { describe, expect, test } from 'bun:test';
import { computeChart, gateAt } from '@engine';
import { LINE_SIZE, WHEEL_START_DEGREES, GATE_SIZE } from '@engine/data';
import type { Activation, AuthorityName, PlanetName } from '@/types';
import { PLANET_NAMES } from '@/types';
import reference from '@test/fixtures/swisseph-reference.json';

/**
 * Cross-check against the real Swiss Ephemeris (via the reference Ruby engine,
 * gem swe4r) for fictional birth moments from 1930 to 2025.
 *
 * Tolerances (degrees). Measured maximum deviations at the time of writing:
 * Sun 0.0005, Moon 0.0061, planets <= 0.005, true node 0.0072. The Design
 * moment inherits the Sun error (0.0005 deg is about 40 seconds of time).
 */
const TOLERANCE: Record<PlanetName, number> = {
  Sun: 0.002,
  Earth: 0.002,
  Moon: 0.01,
  NorthNode: 0.015,
  SouthNode: 0.015,
  Mercury: 0.01,
  Venus: 0.01,
  Mars: 0.01,
  Jupiter: 0.01,
  Saturn: 0.01,
  Uranus: 0.01,
  Neptune: 0.01,
  Pluto: 0.01,
};

const AUTHORITY: Record<string, AuthorityName> = {
  'Emotional (Solar Plexus)': 'Emotional',
  Sacral: 'Sacral',
  Splenic: 'Splenic',
  'Ego / Heart': 'Ego',
  'Self-Projected (G)': 'Self-Projected',
  Lunar: 'Lunar',
  'Mental / Environmental (no inner authority)': 'Mental',
};

function angularDiff(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180);
}

/** Distance (degrees) from a longitude to the nearest line boundary. */
function distanceToLineBoundary(longitude: number): number {
  const offset = (((longitude - WHEEL_START_DEGREES) % 360) + 360) % 360;
  const rem = offset % LINE_SIZE;
  return Math.min(rem, LINE_SIZE - rem);
}

/** Distance (degrees) from a longitude to the nearest gate boundary. */
function distanceToGateBoundary(longitude: number): number {
  const offset = (((longitude - WHEEL_START_DEGREES) % 360) + 360) % 360;
  const rem = offset % GATE_SIZE;
  return Math.min(rem, GATE_SIZE - rem);
}

const results = reference.map((ref) => {
  const chart = computeChart({
    name: '',
    date: ref.date,
    time: ref.time,
    utcOffset: ref.utcOffset,
  });
  return { ref, chart };
});

describe('Swiss Ephemeris cross-check', () => {
  test('fixture is large and varied enough', () => {
    expect(reference.length).toBeGreaterThanOrEqual(20);
    expect(new Set(reference.map((r) => r.utcOffset % 1 !== 0)).size).toBe(2);
    expect(reference.some((r) => r.utcOffset < 0)).toBe(true);
  });

  test('Design moment matches within one minute', () => {
    for (const { ref, chart } of results) {
      const refMs = (ref.designJd - 2440587.5) * 86_400_000;
      expect(Math.abs(Date.parse(chart.designUtc) - refMs)).toBeLessThan(60_000);
    }
  });

  test('longitudes agree within tolerance for every body', () => {
    for (const { ref, chart } of results) {
      for (const [set, acts] of [
        ['personality', chart.personality],
        ['design', chart.design],
      ] as const) {
        const refLongitudes: Record<string, number> = ref[set];
        expect(acts.map((a) => a.planet)).toEqual([...PLANET_NAMES]);
        for (const a of acts) {
          const expected = refLongitudes[a.planet];
          expect(expected).toBeDefined();
          expect(angularDiff(a.longitude, expected as number)).toBeLessThan(TOLERANCE[a.planet]);
        }
      }
    }
  });

  test('gates and lines agree except next to a boundary', () => {
    let compared = 0;
    let skipped = 0;
    for (const { ref, chart } of results) {
      for (const [set, acts] of [
        ['personality', chart.personality],
        ['design', chart.design],
      ] as [string, Activation[]][]) {
        const refLongitudes = (ref as unknown as Record<string, Record<string, number>>)[set] ?? {};
        for (const a of acts) {
          const lon = refLongitudes[a.planet] as number;
          const tol = TOLERANCE[a.planet];
          if (distanceToLineBoundary(lon) < tol) {
            skipped++;
            continue;
          }
          compared++;
          const expected = gateAt(lon);
          expect({ gate: a.gate, line: a.line }).toEqual({
            gate: expected.gate,
            line: expected.line,
          });
        }
      }
    }
    expect(compared + skipped).toBe(reference.length * 26);
    expect(skipped).toBeLessThan(reference.length * 26 * 0.04);
  });

  test('type, authority, profile and definition match when no body is near a boundary', () => {
    let compared = 0;
    for (const { ref, chart } of results) {
      const all = [
        ...Object.entries(ref.personality).map(([p, lon]) => ({ p, lon, line: p === 'Sun' })),
        ...Object.entries(ref.design).map(([p, lon]) => ({ p, lon, line: p === 'Sun' })),
      ];
      const affected = all.some(({ p, lon, line }) => {
        const tol = TOLERANCE[p as PlanetName];
        return distanceToGateBoundary(lon) < tol || (line && distanceToLineBoundary(lon) < tol);
      });
      if (affected) continue;
      compared++;
      expect(chart.type).toBe(ref.type as typeof chart.type);
      expect(chart.authority).toBe(AUTHORITY[ref.authority] as AuthorityName);
      expect(chart.profile).toBe(ref.profile);
      expect(chart.definition).toBe(ref.definition as typeof chart.definition);
    }
    expect(compared).toBeGreaterThanOrEqual(reference.length - 3);
  });
});
