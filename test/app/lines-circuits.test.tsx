import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { render } from 'preact';
import { useState } from 'preact/hooks';
import { act } from 'preact/test-utils';
import { fakeChart, fullChart } from '@test/helpers/fake-chart';
import { CircuitCompare } from '@ui/components/circuit-compare';
import { CircuitsPanel } from '@ui/components/circuits';
import { CrossCard } from '@ui/components/cross-card';
import { LineList } from '@ui/components/lines';
import { LibraryView } from '@ui/views/library';
import { AppContext, type AppContextValue } from '@ui/context';
import type { Chart } from '@/types';

let host: HTMLDivElement;
beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
});
afterEach(() => {
  act(() => render(null, host));
  host.remove();
});

function Harness({ chart, onKey }: { chart: Chart; onKey?: (k: string) => void }) {
  const [selected, setSelected] = useState<string | undefined>(undefined);
  return (
    <div
      onClick={(e) => {
        const key = (e.target as Element).closest('[data-tip]')?.getAttribute('data-tip');
        if (key) {
          setSelected(key);
          onKey?.(key);
        }
      }}
    >
      <CircuitsPanel chart={chart} selected={selected} onClear={() => setSelected(undefined)} />
    </div>
  );
}

describe('CircuitsPanel', () => {
  test('shows bars, the dominant sentence and expands streams', () => {
    act(() => render(<Harness chart={fullChart()} />, host));
    expect(host.querySelectorAll('.circuit-item')).toHaveLength(4);
    expect(host.querySelector('.circuit-lead')?.textContent).toMatch(/^Mostly Collective/);
    expect(host.querySelector('.cbar-track')?.getAttribute('aria-label')).toContain('Individual');
    const toggle = host.querySelector<HTMLButtonElement>('.circuit-toggle');
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    act(() => toggle?.click());
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelectorAll('.stream').length).toBeGreaterThan(0);
  });
  test('selecting a channel chip and clearing a circuit', () => {
    const keys: string[] = [];
    act(() => render(<Harness chart={fullChart()} onKey={(k) => keys.push(k)} />, host));
    act(() => host.querySelector<HTMLButtonElement>('[data-tip="circuit:Tribal"]')?.click());
    expect(host.querySelector('.circuit-item.is-selected')).not.toBeNull();
    act(() => host.querySelector<HTMLButtonElement>('.chip[data-tip^="channel:"]')?.click());
    expect(keys.at(-1)).toMatch(/^channel:/);
    act(() => host.querySelector<HTMLButtonElement>('[data-tip="stream:Ego"]')?.click());
    const clear = [...host.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Clear'),
    );
    act(() => clear?.click());
    expect(host.querySelector('.circuit-item.is-selected')).toBeNull();
  });
  test('empty chart says so', () => {
    act(() => render(<Harness chart={fakeChart({ personality: [1], design: [2] })} />, host));
    expect(host.querySelector('.circuit-lead')?.textContent).toBe('No complete channels yet');
    expect(host.querySelector('.empty-hint')).not.toBeNull();
  });
});

describe('LineList', () => {
  test('lists six lines and marks the chart lines', () => {
    const chart = fakeChart();
    const p = chart.personality[0];
    if (!p) throw new Error('fixture');
    act(() => render(<LineList gate={p.gate} chart={chart} focusLine={p.line} />, host));
    expect(host.querySelectorAll('.line-row')).toHaveLength(6);
    const mine = host.querySelectorAll('.line-row.is-mine');
    expect(mine.length).toBeGreaterThan(0);
    expect(mine[0]?.textContent).toContain('Your line');
    expect(host.querySelector('.line-row.is-focus')).not.toBeNull();
  });
  test('no marks without a chart', () => {
    act(() => render(<LineList gate={36} />, host));
    expect(host.querySelector('.is-mine')).toBeNull();
  });
});

describe('CrossCard', () => {
  test('shows title, angle reason, quarter strip and four gates', () => {
    const chart = fakeChart();
    act(() => render(<CrossCard chart={chart} />, host));
    expect(host.querySelector('h3')?.textContent).toContain('Cross');
    expect(host.textContent).toContain('Your Profile 1/3 gives a Right Angle cross');
    expect(host.querySelectorAll('.gate-strip li')).toHaveLength(16);
    expect(host.querySelectorAll('.cross-gates li')).toHaveLength(4);
  });
});

describe('CircuitCompare', () => {
  test('three columns and a sentence', () => {
    const a = fakeChart({ name: 'Ada' });
    const b = fullChart();
    act(() => render(<CircuitCompare a={a} b={b} composite={b.channels} />, host));
    expect(host.querySelectorAll('.cc-col')).toHaveLength(3);
    expect(host.querySelector('.cc-sentence')?.textContent).toContain('Ada');
  });
});

describe('Library tabs', () => {
  const noop = (): void => undefined;
  function ctx(myChart: Chart | undefined): AppContextValue {
    return {
      store: {} as AppContextValue['store'],
      people: [],
      refreshPeople: noop,
      navigate: noop,
      replaceHash: noop,
      urlFor: (h) => h,
      hash: '',
      openSearch: noop,
      myChart,
      myChartSetting: { kind: 'auto' },
      chooseMyChart: noop,
      rememberChart: noop,
    };
  }
  const mount = (tab: 'cross' | 'circuit' | 'gate', id?: string, chart?: Chart, line?: number) =>
    act(() =>
      render(
        <AppContext.Provider value={ctx(chart)}>
          <LibraryView tab={tab} id={id} line={line} />
        </AppContext.Provider>,
        host,
      ),
    );
  test('Crosses tab lists angles and quarters', () => {
    mount('cross');
    expect(host.textContent).toContain('Angles');
    expect(host.textContent).toContain('Quarters');
    expect(host.querySelectorAll('.lib-item').length).toBeGreaterThanOrEqual(7);
  });
  test('Circuits tab marks the dominant circuit for my chart', () => {
    mount('circuit', undefined, fullChart());
    expect(host.querySelectorAll('.lib-item')).toHaveLength(10);
    expect(host.textContent).toMatch(/\d of \d+ channels · leads/);
  });
  test('Gates tab shows badges only with a chart', () => {
    mount('gate');
    expect(host.querySelector('.mine-badge')).toBeNull();
    act(() => render(null, host));
    mount('gate', '20', fakeChart(), 3);
    expect(host.querySelector('.mine-badge')).not.toBeNull();
    expect(host.querySelectorAll('.line-row').length).toBe(6);
  });
});
