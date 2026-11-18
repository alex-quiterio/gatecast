import { describe, expect, test } from 'bun:test';
import { CHANNEL_LIST, centerOfGate, computeChart } from '@engine';
import { renderBodygraph } from '@ui/bodygraph';
import { attributeValues, checkXml, countClass } from '@test/helpers/xml';
import { fakeChart, fullChart } from '@test/helpers/fake-chart';

const TIP = /^(gate:\d{1,2}|center:[A-Za-z]+|channel:\d{1,2}-\d{1,2}|planet:[A-Za-z]+)$/;

describe('renderBodygraph', () => {
  const chart = fakeChart({ personality: [20, 34, 57, 10], design: [34, 20, 51, 25] });
  const svg = renderBodygraph(chart);

  test('is a responsive, labelled, well-formed svg', () => {
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('viewBox="0 0 400 600"');
    expect(svg).toContain('role="img"');
    expect(svg).toMatch(/<title id="hd-title">[^<]*Generator[^<]*<\/title>/);
    expect(svg).not.toMatch(/<svg[^>]*\s(width|height)=/);
    const report = checkXml(svg);
    expect(report.errors).toEqual([]);
    expect(report.ids).toContain('hd-glow');
  });

  test('marks one element per active gate and defines one per defined center', () => {
    expect(countClass(svg, 'hd-gate--active')).toBe(chart.activeGates.length);
    expect(countClass(svg, 'hd-gate--inactive')).toBe(64 - chart.activeGates.length);
    expect(countClass(svg, 'hd-center--defined')).toBe(chart.definedCenters.length);
    expect(countClass(svg, 'hd-center--open')).toBe(chart.openCenters.length);
  });

  test('draws a bar group per complete channel, split in two halves', () => {
    expect(chart.channels.length).toBeGreaterThan(0);
    expect(countClass(svg, 'hd-channel--active')).toBe(chart.channels.length);
    const channelTips = attributeValues(svg, 'data-channel');
    expect(channelTips.sort()).toEqual(chart.channels.map((c) => c.gates.join('-')).sort());
  });

  test('personality, design and both are distinguishable', () => {
    expect(svg).toContain('hd-gate--both');
    expect(svg).toContain('hd-gate--personality');
    expect(svg).toContain('hd-gate--design');
    expect(svg).toContain(
      'aria-label="Gate 20, active in personality and design, Throat center, defined"',
    );
    expect(svg).toContain('aria-label="Gate 57, active in personality, Spleen center, defined"');
  });

  test('data-tip hooks are well formed and keyboard reachable', () => {
    const tips = attributeValues(svg, 'data-tip');
    expect(tips.length).toBeGreaterThan(70);
    for (const tip of tips) expect(tip).toMatch(TIP);
    expect(tips.filter((t) => t.startsWith('center:'))).toHaveLength(9);
    expect(tips.filter((t) => t.startsWith('gate:'))).toHaveLength(64);
    const focusable = [...svg.matchAll(/<[a-z]+ [^>]*tabindex="0"[^>]*>/g)].map((m) => m[0]);
    for (const tag of focusable) {
      expect(tag).toContain('focusable="true"');
      expect(tag).toContain('aria-label=');
      expect(tag).toContain('data-tip=');
    }
    expect(focusable.length).toBe(9 + chart.activeGates.length + chart.channels.length);
  });

  test('escapes hostile names everywhere', () => {
    const hostile = renderBodygraph(fakeChart({ name: '"><script>alert(1)</script>' }));
    expect(hostile).not.toContain('<script');
    expect(checkXml(hostile).ok).toBe(true);
  });

  test('idPrefix scopes every id; output is deterministic', () => {
    const a = renderBodygraph(chart, { idPrefix: 'one' });
    const b = renderBodygraph(chart, { idPrefix: 'two' });
    expect(checkXml(a).ids.every((id) => id.startsWith('one-'))).toBe(true);
    expect(a.replaceAll('one-', 'two-')).toBe(b);
    expect(renderBodygraph(chart)).toBe(svg);
  });

  test('showGateNumbers=false drops all numbers', () => {
    const bare = renderBodygraph(chart, { showGateNumbers: false });
    expect(bare).not.toContain('<text');
    expect(checkXml(bare).ok).toBe(true);
  });

  test('a fully defined chart draws all 36 channels', () => {
    const full = fullChart();
    expect(full.channels).toHaveLength(CHANNEL_LIST.length);
    const out = renderBodygraph(full);
    expect(countClass(out, 'hd-channel--active')).toBe(36);
    expect(countClass(out, 'hd-center--defined')).toBe(9);
    expect(centerOfGate(20)).toBe('Throat');
  });

  test('renders a real computed chart', () => {
    const real = computeChart({ name: 'Real', date: '1990-06-15', time: '14:30', utcOffset: 2 });
    const out = renderBodygraph(real);
    expect(checkXml(out).errors).toEqual([]);
    expect(countClass(out, 'hd-gate--active')).toBe(real.activeGates.length);
    expect(countClass(out, 'hd-channel--active')).toBe(real.channels.length);
  });
});
