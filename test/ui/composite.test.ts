import { describe, expect, test } from 'bun:test';
import { compareCharts, computeChart } from '@engine';
import { DYNAMIC_DASH, DYNAMIC_VARIABLE } from '@ui/palette';
import { compositeLegend, renderComposite } from '@ui/composite';
import { attributeValues, checkXml, countClass } from '@test/helpers/xml';
import { fakeChart, fakeComparison } from '@test/helpers/fake-chart';

describe('renderComposite', () => {
  // A: 20-34 complete (shared with B), 10-57 complete (B has only 10), 1-8 only in A.
  const a = fakeChart({ name: 'Ana', personality: [20, 34, 10, 57, 1, 8], design: [20, 34] });
  const b = fakeChart({ name: 'Bo', personality: [20, 34, 10, 13, 33, 31, 7] });
  const comparison = fakeComparison(a, b);
  const svg = renderComposite(a, b, comparison);

  test('hand-built comparison covers every kind we assert on', () => {
    const kinds = new Set(comparison.channels.map((c) => c.kind));
    expect(kinds.has('companionship')).toBe(true);
    expect(kinds.has('compromise')).toBe(true);
    expect(kinds.has('dominance')).toBe(true);
  });

  test('is well formed with unique ids', () => {
    expect(checkXml(svg).errors).toEqual([]);
    expect(svg).toContain('role="img"');
  });

  test('colours each channel by its dynamic', () => {
    for (const c of comparison.channels) {
      const key = c.gates.join('-');
      const group = svg.match(
        new RegExp(
          `<g class="hd-channel hd-channel--${c.kind}"[^>]*data-channel="${key}"[\\s\\S]*?</g>`,
        ),
      );
      expect(group).not.toBeNull();
      expect(group?.[0]).toContain(DYNAMIC_VARIABLE[c.kind]);
    }
    expect(countClass(svg, 'hd-channel')).toBe(comparison.channels.length);
  });

  test('kinds are distinguishable by pattern, not only colour', () => {
    const dashes = Object.values(DYNAMIC_DASH);
    expect(new Set(dashes).size).toBe(4);
    expect(svg).toContain('stroke-dasharray="12 6"');
  });

  test('person A, person B and shared gates carry different markers', () => {
    expect(countClass(svg, 'hd-gate--a')).toBeGreaterThan(0);
    expect(countClass(svg, 'hd-gate--b')).toBeGreaterThan(0);
    expect(countClass(svg, 'hd-gate--shared')).toBeGreaterThan(0);
    const people = attributeValues(svg, 'data-person');
    expect(people.length).toBe(comparison.compositeGates.length);
  });

  test('includes an in-svg legend that can be switched off, and an html legend', () => {
    expect(svg).toContain('hd-legend');
    expect(svg).toContain('Electromagnetic');
    expect(renderComposite(a, b, comparison, { legend: false })).not.toContain('hd-legend');
    const html = compositeLegend('<Ana>', 'Bo');
    expect(html).toContain('&lt;Ana&gt;');
    expect(html).not.toContain('<Ana>');
    expect(checkXml(html).errors).toEqual([]);
  });

  test('escapes hostile names', () => {
    const evil = fakeChart({ name: '"><script>alert(1)</script>' });
    const out = renderComposite(evil, b, fakeComparison(evil, b));
    expect(out).not.toContain('<script');
    expect(checkXml(out).ok).toBe(true);
  });

  test('renders with the real engine', () => {
    const x = computeChart({ name: 'X', date: '1985-03-02', time: '08:15', utcOffset: 1 });
    const y = computeChart({ name: 'Y', date: '1992-11-20', time: '21:40', utcOffset: -5 });
    const cmp = compareCharts(x, y);
    const out = renderComposite(x, y, cmp);
    expect(checkXml(out).errors).toEqual([]);
    expect(countClass(out, 'hd-channel')).toBe(cmp.channels.length);
  });
});
