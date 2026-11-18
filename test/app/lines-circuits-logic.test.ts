import { describe, expect, test } from 'bun:test';
import { CHANNELS, circuitBreakdown } from '@content';
import { fakeChart, fullChart } from '@test/helpers/fake-chart';
import { circuitBars, comparisonSentence, dominantSentence } from '@ui/circuit-logic';
import {
  angleReason,
  angleSlug,
  crossEntries,
  filterCrosses,
  parseCrossId,
  quarterStrip,
} from '@ui/cross-logic';
import { entriesFor, filterEntries, libraryTargetFor, mineIds } from '@ui/library-logic';
import { buildHash, parseRoute } from '@ui/router';
import { buildQuickItems, searchItems } from '@ui/search-logic';
import {
  canvasKeyFor,
  channelsOfSelection,
  gateLineKey,
  lineMarks,
  parseSelection,
  selectionGate,
} from '@ui/selection-logic';

describe('selection keys', () => {
  test('parse every family', () => {
    expect(parseSelection('gate:20')).toEqual({ kind: 'gate', gate: 20 });
    expect(parseSelection(gateLineKey(36, 6))).toEqual({ kind: 'gateline', gate: 36, line: 6 });
    expect(parseSelection('gateline:36.7')).toEqual({ kind: 'other', key: 'gateline:36.7' });
    expect(parseSelection('circuit:Tribal')).toEqual({ kind: 'circuit', circuit: 'Tribal' });
    expect(parseSelection('circuit:Nope')?.kind).toBe('other');
    expect(parseSelection('stream:Ego')).toEqual({ kind: 'stream', stream: 'Ego' });
    expect(parseSelection(undefined)).toBeUndefined();
  });
  test('canvas key and gate of a line', () => {
    expect(selectionGate('gateline:36.6')).toBe(36);
    expect(canvasKeyFor('gateline:36.6')).toBe('gate:36');
    expect(canvasKeyFor('circuit:Tribal')).toBeUndefined();
    expect(canvasKeyFor('channel:20-34')).toBe('channel:20-34');
  });
  test('circuit selection lists only its channels', () => {
    const ids = channelsOfSelection('circuit:Integration') ?? [];
    expect(ids.length).toBe(
      Object.values(CHANNELS).filter((c) => c.circuit === 'Integration').length,
    );
    expect(ids.length).toBeGreaterThan(0);
    expect(channelsOfSelection('gate:3')).toBeUndefined();
    const all = (channelsOfSelection('circuit:Individual') ?? []).length;
    expect(all).toBeGreaterThan(0);
  });
});

describe('line marks', () => {
  test('mark personality and design lines separately', () => {
    const chart = fakeChart();
    const p = chart.personality[0];
    const d = chart.design[0];
    if (!p || !d) throw new Error('fixture');
    const marks = lineMarks(chart, p.gate);
    expect(marks).toHaveLength(6);
    expect(marks[p.line - 1]?.sources).toContain('personality');
    expect(lineMarks(undefined, 20).every((m) => m.sources.length === 0)).toBe(true);
    const dm = lineMarks(chart, d.gate)[d.line - 1];
    expect(dm?.sources).toContain('design');
    expect(dm?.planets.some((x) => x.startsWith('Design'))).toBe(true);
  });
});

describe('circuit math', () => {
  test('bars and sentences', () => {
    const full = circuitBreakdown(fullChart());
    const bars = circuitBars(full);
    expect(bars.map((b) => b.circuit)).toEqual([
      'Individual',
      'Tribal',
      'Collective',
      'Integration',
    ]);
    expect(bars.reduce((n, b) => n + b.count, 0)).toBe(full.totalChannels);
    expect(dominantSentence(full)).toMatch(/Mostly Collective: \d+ of 36 channels/);
    const none = circuitBreakdown(fakeChart({ personality: [1], design: [2] }));
    expect(none.totalChannels).toBe(0);
    expect(dominantSentence(none)).toBe('No complete channels yet');
    const only = circuitBreakdown(fakeChart({ personality: [12, 22], design: [] }));
    expect(dominantSentence(only)).toBe('Your only complete channel is in the Individual circuit');
    const allTribal = circuitBreakdown(fakeChart({ personality: [21, 45, 26, 44], design: [] }));
    expect(dominantSentence(allTribal)).toBe('All 2 channels are Tribal');
    expect(comparisonSentence('Ada', full, 'Bo', none)).toBe(
      'Ada is mostly Collective, Bo has no complete channels.',
    );
    expect(comparisonSentence('Ada', full, 'Bo', full)).toBe(
      'Ada and Bo are both mostly Collective.',
    );
  });
});

describe('crosses', () => {
  test('ids, reason and strip', () => {
    expect(parseCrossId('right-angle-13')).toEqual({ angle: 'Right Angle', gate: 13 });
    expect(parseCrossId('left-angle-99')).toBeUndefined();
    expect(parseCrossId('nonsense-4')).toBeUndefined();
    expect(angleSlug('Left Angle')).toBe('left-angle');
    expect(angleReason('5/1', 'Left Angle')).toContain('Profile 5/1 gives a Left Angle cross');
    const strip = quarterStrip('Initiation', fakeChart());
    expect(strip).toHaveLength(16);
  });
  test('filter and search over the known names', () => {
    const names = {
      'Right Angle|13': 'the Sphinx',
      'Left Angle|1': 'the Sphinx',
      'Juxtaposition|2': 'Driving',
    };
    const list = crossEntries(names);
    expect(list.map((e) => e.id)).toEqual(['right-angle-13', 'juxtaposition-2', 'left-angle-1']);
    expect(filterCrosses(list, { query: 'sphinx' })).toHaveLength(2);
    expect(filterCrosses(list, { query: 'sphinx', angle: 'Left Angle' })).toHaveLength(1);
    expect(filterCrosses(list, { quarter: 'Initiation' }).map((e) => e.gate)).toEqual([13]);
    expect(filterCrosses(list, { query: 'zzz' })).toHaveLength(0);
    expect(crossEntries({})).toEqual([]);
  });
});

describe('library additions', () => {
  test('cross and circuit tabs', () => {
    const cross = entriesFor('cross');
    expect(cross.filter((e) => e.kind === 'angle')).toHaveLength(3);
    expect(cross.filter((e) => e.kind === 'quarter')).toHaveLength(4);
    expect(entriesFor('circuit').map((e) => e.id)).toEqual([
      'Individual',
      'Tribal',
      'Collective',
      'Integration',
    ]);
    expect(
      filterEntries(cross, 'cross', '', { angle: 'Left Angle' }).every(
        (e) => e.kind !== 'quarter' || false,
      ),
    ).toBe(true);
  });
  test('targets for in-library links', () => {
    expect(libraryTargetFor('gateline:36.6')).toEqual({ tab: 'gate', id: '36', line: 6 });
    expect(libraryTargetFor('stream:Ego')).toEqual({ tab: 'circuit', id: 'Tribal' });
    expect(libraryTargetFor('channel:20-34')).toEqual({ tab: 'channel', id: '20-34' });
    expect(libraryTargetFor('cross:Left Angle')).toEqual({ tab: 'cross', id: 'left-angle' });
    expect(libraryTargetFor('quarter:Duality')).toEqual({ tab: 'cross', id: 'quarter-duality' });
    expect(libraryTargetFor('planet:Sun')).toBeUndefined();
  });
  test('my chart ids', () => {
    const chart = fakeChart();
    expect(mineIds('gate', chart).has('20')).toBe(true);
    expect(mineIds('gate', undefined).size).toBe(0);
    expect(mineIds('channel', chart).has('20-34')).toBe(true);
    expect(mineIds('cross', chart).has('right-angle')).toBe(true);
    const only = filterEntries(entriesFor('gate'), 'gate', '', { only: mineIds('gate', chart) });
    expect(only.length).toBe(chart.activeGates.length);
  });
});

describe('router and quick find', () => {
  test('line query param', () => {
    expect(parseRoute('#/library/gate/36?line=6')).toEqual({
      name: 'library',
      tab: 'gate',
      id: '36',
      line: 6,
    });
    expect(parseRoute('#/library/gate/36?line=9')).toEqual({
      name: 'library',
      tab: 'gate',
      id: '36',
    });
    expect(parseRoute('#/library/channel/20-34?line=2')).toEqual({
      name: 'library',
      tab: 'channel',
      id: '20-34',
    });
    expect(buildHash({ name: 'library', tab: 'gate', id: '36', line: 6 })).toBe(
      '#/library/gate/36?line=6',
    );
    expect(parseRoute('#/library/circuit/Tribal')).toEqual({
      name: 'library',
      tab: 'circuit',
      id: 'Tribal',
    });
    expect(parseRoute('#/library/cross/right-angle-13').name).toBe('library');
  });
  test('finds a line by number and by dotted number', () => {
    const items = buildQuickItems([]);
    for (const q of ['36.6', '36 6']) {
      const hit = searchItems(items, q)[0];
      expect(hit?.hash).toBe('#/library/gate/36?line=6');
    }
    expect(searchItems(items, 'tribal').some((i) => i.hash === '#/library/circuit/Tribal')).toBe(
      true,
    );
    expect(searchItems(items, 'ego stream').some((i) => i.group === 'Streams')).toBe(true);
    expect(searchItems(items, 'quarter of initiation').length).toBeGreaterThan(0);
  });
});
