import { describe, expect, test } from 'bun:test';
import { GATE_WHEEL, computeChart } from '@engine';
import { PLANET_NAMES } from '@/types';
import { gateStartDegrees, placePlanets, polar, renderWheel } from '@ui/wheel';
import { PLANET_GLYPHS } from '@ui/palette';
import { attributeValues, checkXml, countClass } from '@test/helpers/xml';
import { fakeChart } from '@test/helpers/fake-chart';

describe('renderWheel', () => {
  const chart = fakeChart({ personality: [20, 34, 57, 10, 1, 25], design: [34, 20, 51, 8, 13] });
  const svg = renderWheel(chart);

  test('is well formed and responsive', () => {
    expect(checkXml(svg).errors).toEqual([]);
    expect(svg).toContain('viewBox="-480 -480 960 960"');
    expect(svg).toContain('role="img"');
  });

  test('has 64 gate cells in wheel order with the right active count', () => {
    expect(countClass(svg, 'hd-wheel-gate')).toBe(64);
    expect(countClass(svg, 'hd-wheel-gate--active')).toBe(chart.activeGates.length);
    const order = [...svg.matchAll(/class="hd-wheel-gate [^"]*" data-gate="(\d+)"/g)].map((m) =>
      Number(m[1]),
    );
    expect(order).toEqual([...GATE_WHEEL]);
  });

  test('has 13 personality and 13 design planet glyphs', () => {
    expect(countClass(svg, 'hd-planet')).toBe(26);
    expect(countClass(svg, 'hd-planet--personality')).toBe(13);
    expect(countClass(svg, 'hd-planet--design')).toBe(13);
    for (const planet of PLANET_NAMES) {
      expect(attributeValues(svg, 'data-tip').filter((t) => t === `planet:${planet}`)).toHaveLength(
        2,
      );
      expect(svg).toContain(PLANET_GLYPHS[planet]);
    }
  });

  test('draws 64 hexagrams, 12 zodiac signs, 26 rays', () => {
    expect(svg).toContain('䷀');
    expect(svg).toContain('䷿');
    expect(countClass(svg, 'hd-wheel-sign')).toBe(12);
    expect(countClass(svg, 'hd-ray')).toBe(26);
  });

  test('gate 41 starts at 302 degrees and spans exactly 5.625', () => {
    expect(gateStartDegrees(41)).toBe(302);
    expect(gateStartDegrees(19)).toBeCloseTo(307.625, 6);
    expect(gateStartDegrees(60)).toBeCloseTo(302 - 5.625, 6);
  });

  test('orientation: Aries at 9 o clock, Cancer at the bottom', () => {
    expect(polar(100, 0).x).toBeCloseTo(-100, 6);
    expect(polar(100, 90).y).toBeCloseTo(100, 6);
  });

  test('planet glyphs keep their distance', () => {
    const real = computeChart({ name: 'Real', date: '1990-06-15', time: '14:30', utcOffset: 2 });
    const placed = placePlanets(real);
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i];
        const b = placed[j];
        if (!a || !b) continue;
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(20);
      }
    }
  });

  test('the embedded bodygraph is optional and ids stay unique', () => {
    const bare = renderWheel(chart, { includeBodygraph: false, idPrefix: 'w' });
    expect(bare).not.toContain('hd-centers');
    expect(svg).toContain('hd-centers');
    expect(checkXml(bare).errors).toEqual([]);
    expect(checkXml(bare).ids.every((id) => id.startsWith('w-'))).toBe(true);
  });

  test('escapes hostile names', () => {
    const out = renderWheel(fakeChart({ name: '"><script>alert(1)</script>' }));
    expect(out).not.toContain('<script');
    expect(checkXml(out).ok).toBe(true);
  });
});
