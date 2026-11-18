import { describe, expect, test } from 'bun:test';
import type { CenterName } from '@/types';
import { CENTER_NAMES } from '@/types';
import { CENTER_GATES, CHANNEL_LIST, channelKey } from '@engine';
import {
  CENTER_SHAPES,
  CHANNEL_PATHS,
  GATE_POSITIONS,
  channelCurve,
  cubicPoint,
  distanceToSegment,
  pointInPolygon,
  splitCubic,
} from '@ui/geometry';

function distanceToPolygon(
  p: { x: number; y: number },
  poly: readonly { x: number; y: number }[],
): number {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    if (a && b) best = Math.min(best, distanceToSegment(p, a, b));
  }
  return best;
}

describe('gate positions', () => {
  test('cover all 64 gates exactly once', () => {
    const keys = Object.keys(GATE_POSITIONS)
      .map(Number)
      .sort((a, b) => a - b);
    expect(keys).toEqual(Array.from({ length: 64 }, (_, i) => i + 1));
  });

  test('every gate dot sits exactly on its own center outline', () => {
    for (const center of CENTER_NAMES) {
      for (const gate of CENTER_GATES[center]) {
        const p = GATE_POSITIONS[gate];
        expect(p).toBeDefined();
        if (!p) continue;
        expect(distanceToPolygon(p, CENTER_SHAPES[center])).toBeLessThan(0.01);
      }
    }
  });

  test('no two gate dots closer than 9 units', () => {
    const entries = Object.entries(GATE_POSITIONS);
    let min = Infinity;
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i]?.[1];
        const b = entries[j]?.[1];
        if (a && b) min = Math.min(min, Math.hypot(a.x - b.x, a.y - b.y));
      }
    }
    expect(min).toBeGreaterThanOrEqual(13);
  });

  test('every point stays inside the 400 x 600 viewBox', () => {
    for (const p of Object.values(GATE_POSITIONS)) {
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(400);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(600);
    }
  });
});

describe('channel paths', () => {
  test('exactly the 36 channels have a path, from gate to gate', () => {
    expect(Object.keys(CHANNEL_PATHS)).toHaveLength(36);
    for (const ch of CHANNEL_LIST) {
      const bez = CHANNEL_PATHS[channelKey(...ch.gates)];
      expect(bez).toBeDefined();
      if (!bez) continue;
      const start = GATE_POSITIONS[ch.gates[0]];
      const end = GATE_POSITIONS[ch.gates[1]];
      expect(bez.p0.x).toBe(start?.x ?? NaN);
      expect(bez.p0.y).toBe(start?.y ?? NaN);
      expect(bez.p3.x).toBe(end?.x ?? NaN);
      expect(bez.p3.y).toBe(end?.y ?? NaN);
    }
  });

  test('channelCurve throws for a non-channel', () => {
    expect(() => channelCurve(1, 2)).toThrow();
  });

  test('channels avoid the interior of centers other than their own', () => {
    const offenders: string[] = [];
    for (const ch of CHANNEL_LIST) {
      const bez = CHANNEL_PATHS[channelKey(...ch.gates)];
      if (!bez) continue;
      const own = new Set<CenterName>(ch.centers);
      for (let t = 0.1; t <= 0.9; t += 0.02) {
        const p = cubicPoint(bez, t);
        for (const center of CENTER_NAMES) {
          if (own.has(center)) continue;
          if (pointInPolygon(p, CENTER_SHAPES[center]))
            offenders.push(`${channelKey(...ch.gates)} in ${center}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  test('splitting at 0.5 gives two halves that join and match the curve', () => {
    for (const bez of Object.values(CHANNEL_PATHS)) {
      const [a, b] = splitCubic(bez, 0.5);
      expect(a.p0).toEqual(bez.p0);
      expect(b.p3).toEqual(bez.p3);
      expect(a.p3).toEqual(b.p0);
      const m = cubicPoint(bez, 0.5);
      expect(a.p3.x).toBeCloseTo(m.x, 6);
      expect(a.p3.y).toBeCloseTo(m.y, 6);
      const q = cubicPoint(bez, 0.25);
      const q2 = cubicPoint(a, 0.5);
      expect(q2.x).toBeCloseTo(q.x, 6);
      expect(q2.y).toBeCloseTo(q.y, 6);
    }
  });
});
