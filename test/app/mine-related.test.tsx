import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { fakeChart, fullChart } from '@test/helpers/fake-chart';
import { MyChartChip, chipItems, chipText } from '@ui/components/my-chart-chip';
import { Related } from '@ui/components/related';
import { AppContext, type AppContextValue } from '@ui/context';
import { entriesFor, filterEntries, yourCrossFirst } from '@ui/library-logic';
import {
  MY_CHART_KEY,
  mineIdSet,
  mineMarks,
  pinProps,
  readMyChartSetting,
  shortName,
  tabCount,
  writeMyChartSetting,
  type MyChartSetting,
} from '@ui/mine-logic';
import { readMoreLinks, relatedFor } from '@ui/related-logic';
import { LibraryView } from '@ui/views/library';
import type { StorageLike } from '@ui/storage';
import type { Chart } from '@/types';

function memory(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

const INPUT = { name: 'Ada', date: '1990-04-12', time: '14:30', utcOffset: 2 };

describe('my chart storage', () => {
  test('round trips, validates and defaults to auto', () => {
    const s = memory();
    expect(readMyChartSetting(s)).toEqual({ kind: 'auto' });
    writeMyChartSetting(s, { kind: 'chart', input: INPUT });
    expect(s.data.has(MY_CHART_KEY)).toBe(true);
    expect(readMyChartSetting(s)).toEqual({ kind: 'chart', input: INPUT });
    writeMyChartSetting(s, { kind: 'none' });
    expect(readMyChartSetting(s)).toEqual({ kind: 'none' });
    s.setItem(MY_CHART_KEY, 'garbage');
    expect(readMyChartSetting(s)).toEqual({ kind: 'auto' });
    writeMyChartSetting(s, { kind: 'auto' });
    expect(s.data.has(MY_CHART_KEY)).toBe(false);
    expect(readMyChartSetting(undefined)).toEqual({ kind: 'auto' });
  });
  test('pinProps toggles', () => {
    const calls: MyChartSetting[] = [];
    const p = pinProps({ kind: 'auto' }, (s) => calls.push(s));
    p.onPin({ id: 'x', input: INPUT });
    expect(calls[0]?.kind).toBe('chart');
  });
});

describe('mine marks', () => {
  const chart = fullChart();
  test('gates carry their lines and sides', () => {
    const marks = mineMarks('gate', chart);
    const gate = chart.activeGates[0] ?? 0;
    expect(marks.get(String(gate))?.text).toMatch(/^Your lines: |^In your chart/);
    expect(mineIdSet('gate', chart).size).toBe(chart.activeGates.length);
    expect(mineMarks('gate', undefined).size).toBe(0);
  });
  test('channels, centers, type, authority, profile, circuits', () => {
    const c = fakeChart();
    expect(mineMarks('channel', c).get('20-34')?.text).toBe('Complete');
    expect(mineMarks('center', c).size).toBe(9);
    expect(mineMarks('type', c).get(c.type)?.mine).toBe(true);
    expect(mineMarks('authority', c).has(c.authority)).toBe(true);
    expect(mineMarks('profile', c).get(c.profile)?.text).toContain('lines');
    expect(mineMarks('circuit', fullChart()).get('Collective')?.text).toMatch(
      /\d+ of \d+ channels/,
    );
    expect(mineMarks('glossary', c).size).toBe(0);
    expect(mineMarks('cross', c).size).toBe(3);
  });
  test('hanging channel is marked but not mine', () => {
    const c: Chart = { ...fakeChart(), channels: [], activeGates: [20], hangingGates: [20] };
    const mark = mineMarks('channel', c).get('20-34');
    expect(mark?.text).toBe('One gate only: 20');
    expect(mark?.mine).toBe(false);
  });
  test('tab counts', () => {
    const c = fullChart();
    expect(tabCount('gate', c)).toBe(c.activeGates.length);
    expect(tabCount('channel', c)).toBe(c.channels.length);
    expect(tabCount('type', c)).toBeUndefined();
    expect(tabCount('gate', undefined)).toBeUndefined();
  });
  test('Mine filter and your cross first', () => {
    const c = fullChart();
    const gates = entriesFor('gate');
    const only = filterEntries(gates, 'gate', '', { only: mineIdSet('gate', c) });
    expect(only).toHaveLength(c.activeGates.length);
    const list = yourCrossFirst(entriesFor('cross'), mineMarks('cross', c));
    expect(list[0]?.group).toBe('Your cross');
  });
});

describe('related logic', () => {
  test('gate, channel, center, type, circuit', () => {
    const gate = relatedFor('gate', '20');
    expect(gate.map((g) => g.label)).toContain('Channels');
    expect(gate.find((g) => g.label === 'Lines')?.links).toHaveLength(6);
    const ch = relatedFor('channel', '20-34');
    expect(ch.find((g) => g.label === 'Gates')?.links.map((l) => l.tip)).toEqual([
      'gate:20',
      'gate:34',
    ]);
    expect(ch.find((g) => g.label === 'Centers')?.links).toHaveLength(2);
    expect(
      relatedFor('center', 'Throat').find((g) => g.label === 'Gates')?.links.length,
    ).toBeGreaterThan(5);
    expect(relatedFor('type', 'Reflector')[0]?.links[0]?.tip).toBe('authority:Lunar');
    expect(relatedFor('circuit', 'Tribal').map((g) => g.label)).toEqual(['Streams', 'Channels']);
    expect(relatedFor('glossary', 'x')).toEqual([]);
  });
  test('read more links', () => {
    const c = fakeChart();
    expect(readMoreLinks('gate:20', c)[0]?.hash).toBe('#/library/gate/20');
    expect(readMoreLinks(undefined, c).length).toBeGreaterThanOrEqual(3);
  });
});

describe('components', () => {
  let host: HTMLDivElement;
  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });
  afterEach(() => {
    act(() => render(null, host));
    host.remove();
  });
  const noop = (): void => undefined;
  function ctx(
    chart: Chart | undefined,
    setting: MyChartSetting,
    choose = noop as AppContextValue['chooseMyChart'],
  ): AppContextValue {
    return {
      store: {} as AppContextValue['store'],
      people: [{ id: 'a', input: INPUT, savedAt: '' }],
      refreshPeople: noop,
      navigate: noop,
      replaceHash: noop,
      urlFor: (h) => h,
      hash: '',
      openSearch: noop,
      myChart: chart,
      myChartSetting: setting,
      chooseMyChart: choose,
      rememberChart: noop,
    };
  }
  test('long names shorten to initials and the last name; short ones stay', () => {
    expect(shortName('Isabella Maria Costa Ferreira')).toBe('I.M.C.Ferreira');
    expect(shortName('Ada Lovelace')).toBe('Ada Lovelace');
    expect(shortName('  Ada   Lovelace ')).toBe('Ada Lovelace');
    expect(shortName('Wolfeschlegelsteinhausen-Bergdorff')).toBe(
      'Wolfeschlegelsteinhausen-Bergdorff',
    );
    expect(shortName('Élodie Anne-Marie Dubois Lefèvre')).toBe('É.A.D.Lefèvre');
    expect(shortName('')).toBe('');
    expect(chipText({ kind: 'auto' }, fakeChart({ name: 'Isabella Maria Costa Ferreira' }))).toBe(
      'Marking entries for: I.M.C.Ferreira (change)',
    );
  });
  test('chip text and menu choose', () => {
    expect(chipText({ kind: 'auto' }, undefined)).toContain('No chart');
    expect(chipText({ kind: 'none' }, undefined)).toContain('nobody');
    const picked: MyChartSetting[] = [];
    act(() =>
      render(
        <AppContext.Provider
          value={ctx(fakeChart({ name: 'Ada' }), { kind: 'auto' }, (s) => picked.push(s))}
        >
          <MyChartChip />
        </AppContext.Provider>,
        host,
      ),
    );
    expect(host.textContent).toContain('Marking entries for: Ada (change)');
    act(() => host.querySelector<HTMLButtonElement>('.btn')?.click());
    const items = [...host.querySelectorAll<HTMLElement>('[role^="menuitem"]')];
    expect(items.length).toBe(
      chipItems([{ id: 'a', input: INPUT, savedAt: '' }], { kind: 'auto' }, noop, noop).length,
    );
    act(() => items.find((i) => i.textContent?.includes('None'))?.click());
    expect(picked[0]).toEqual({ kind: 'none' });
  });
  test('related chips render', () => {
    act(() => render(<Related tab="channel" id="20-34" />, host));
    expect(host.querySelectorAll('.related .chip').length).toBeGreaterThan(3);
  });
  test('library: badges, counts and Mine filter on each tab', () => {
    const chart = fullChart();
    for (const tab of [
      'gate',
      'channel',
      'center',
      'type',
      'authority',
      'profile',
      'cross',
      'circuit',
    ] as const) {
      act(() => render(null, host));
      act(() =>
        render(
          <AppContext.Provider value={ctx(chart, { kind: 'auto' })}>
            <LibraryView tab={tab} id={undefined} />
          </AppContext.Provider>,
          host,
        ),
      );
      expect(host.querySelector('.mine-badge')).not.toBeNull();
      const before = host.querySelectorAll('.lib-item').length;
      const filter = [...host.querySelectorAll<HTMLButtonElement>('.fchip')].find(
        (b) =>
          b.getAttribute('aria-pressed') === 'false' &&
          /Mine|Defined|Complete/.test(b.textContent ?? ''),
      );
      expect(filter).toBeDefined();
      act(() => filter?.click());
      expect(host.querySelectorAll('.lib-item').length).toBeLessThanOrEqual(before);
    }
    expect(host.querySelector('.tab-count')).not.toBeNull();
  });
});
