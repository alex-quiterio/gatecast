import { describe, expect, test } from 'bun:test';
import type { Chart } from '@/types';
import { GATE_WHEEL } from '@engine/data';
import {
  CHANNELS,
  CIRCUITS,
  CIRCUIT_ORDER,
  CROSS_ANGLES,
  CROSS_NAMES,
  PROFILES,
  QUARTERS,
  STREAMS,
  STREAM_ORDER,
  circuitBreakdown,
  crossAngleFor,
  incarnationCross,
  quarterOfGate,
} from '@content';
import type { Circuit, Stream } from '@content';
import { fakeChart, fullChart } from '@test/helpers/fake-chart';

describe('streams', () => {
  const count = (s: Stream): number => Object.values(CHANNELS).filter((c) => c.stream === s).length;

  test('counts per stream', () => {
    expect(STREAM_ORDER.map(count)).toEqual([9, 2, 5, 2, 7, 7]);
  });

  test('circuit and stream agree', () => {
    for (const c of Object.values(CHANNELS)) {
      if (c.circuit === 'Integration') expect(c.stream).toBeUndefined();
      else expect(STREAMS[c.stream as Stream].circuit).toBe(c.circuit);
    }
  });

  test('known assignments', () => {
    expect(CHANNELS['20-57']?.stream).toBe('Knowing');
    expect(CHANNELS['10-34']?.stream).toBe('Centering');
    expect(CHANNELS['32-54']?.stream).toBe('Ego');
    expect(CHANNELS['27-50']?.stream).toBe('Defense');
    expect(CHANNELS['10-20']?.circuit).toBe('Integration');
  });

  test('circuit content matches reality', () => {
    let total = 0;
    for (const circuit of CIRCUIT_ORDER) {
      const n = Object.values(CHANNELS).filter((c) => c.circuit === circuit).length;
      expect(CIRCUITS[circuit].channelCount).toBe(n);
      total += n;
      const streams = STREAM_ORDER.filter((s) => STREAMS[s].circuit === circuit);
      expect([...CIRCUITS[circuit].streams]).toEqual(streams);
      for (const text of [
        CIRCUITS[circuit].tagline,
        CIRCUITS[circuit].summary,
        CIRCUITS[circuit].theme,
      ])
        expect(text.length).toBeGreaterThan(10);
    }
    expect(total).toBe(36);
    for (const s of STREAM_ORDER) expect(STREAMS[s].summary.length).toBeGreaterThan(10);
  });

  test('no angle brackets in copy', () => {
    const all = JSON.stringify([CIRCUITS, STREAMS, QUARTERS, CROSS_ANGLES]);
    expect(/[<>]/.test(all)).toBe(false);
  });
});

describe('quarters', () => {
  test('partition all 64 gates', () => {
    const all = Object.values(QUARTERS).flatMap((q) => [...q.gates]);
    expect(all).toHaveLength(64);
    expect(new Set(all).size).toBe(64);
    for (let g = 1; g <= 64; g++) expect(quarterOfGate(g)).toBeDefined();
    expect(quarterOfGate(0)).toBeUndefined();
    expect(quarterOfGate(65)).toBeUndefined();
  });

  test('each is a contiguous 16-gate arc of the wheel', () => {
    for (const q of Object.values(QUARTERS)) {
      expect(q.gates).toHaveLength(16);
      const idx = q.gates.map((g) => GATE_WHEEL.indexOf(g)).sort((a, b) => a - b);
      // contiguous on the circular wheel: at most the wrap-around breaks the run
      const wraps = idx.filter((v, i) => i < 15 && (idx[i + 1] as number) - v !== 1);
      expect(wraps.length <= 1).toBe(true);
    }
  });

  test('quarterOfGate', () => {
    expect(quarterOfGate(13)).toBe('Initiation');
    expect(quarterOfGate(2)).toBe('Civilization');
    expect(quarterOfGate(7)).toBe('Duality');
    expect(quarterOfGate(1)).toBe('Mutation');
  });
});

describe('angles', () => {
  test('all twelve profiles', () => {
    for (const p of ['1/3', '1/4', '2/4', '2/5', '3/5', '3/6'])
      expect(crossAngleFor(p)).toBe('Right Angle');
    expect(crossAngleFor('4/1')).toBe('Juxtaposition');
    for (const p of ['4/6', '5/1', '5/2', '6/2', '6/3'])
      expect(crossAngleFor(p)).toBe('Left Angle');
    for (const p of Object.keys(PROFILES)) expect(crossAngleFor(p)).toBeDefined();
  });
});

describe('CROSS_NAMES', () => {
  test('192 well-formed entries', () => {
    const keys = Object.keys(CROSS_NAMES);
    expect(keys).toHaveLength(192);
    for (const key of keys) {
      const m = /^(Right Angle|Juxtaposition|Left Angle)\|(\d+)$/.exec(key);
      expect(m).not.toBeNull();
      const gate = Number(m?.[2]);
      expect(gate >= 1 && gate <= 64).toBe(true);
      const name = CROSS_NAMES[key] as string;
      expect(name.trim().length).toBeGreaterThan(0);
      expect(/[<>]/.test(name)).toBe(false);
    }
  });

  test('known names', () => {
    expect(CROSS_NAMES['Right Angle|13']).toBe('the Sphinx');
    expect(CROSS_NAMES['Right Angle|2']).toBe('the Sphinx');
    expect(CROSS_NAMES['Left Angle|55']).toBe('Spirit');
    expect(CROSS_NAMES['Juxtaposition|1']).toBe('Self-Expression');
  });
});

function chartWith(profile: string, sun: number): Chart {
  const base = fakeChart();
  const idx = GATE_WHEEL.indexOf(sun);
  const at = (i: number): number => GATE_WHEEL[(i + 64) % 64] as number;
  return {
    ...base,
    profile,
    crossGates: {
      personalitySun: sun,
      personalityEarth: at(idx + 32),
      designSun: at(idx - 16),
      designEarth: at(idx + 16),
    },
  };
}

describe('incarnationCross', () => {
  test('named title', () => {
    const x = incarnationCross(chartWith('1/3', 13));
    expect(x.angle).toBe('Right Angle');
    expect(x.quarter).toBe('Initiation');
    expect(x.name).toBe('the Sphinx');
    expect(x.title).toBe('Right Angle Cross of the Sphinx (13/7 | 1/2)');
  });

  test('left angle and juxtaposition', () => {
    expect(incarnationCross(chartWith('5/1', 55)).title).toStartWith(
      'Left Angle Cross of Spirit (55/59 |',
    );
    expect(incarnationCross(chartWith('4/1', 1)).title).toStartWith(
      'Juxtaposition Cross of Self-Expression (1/2 |',
    );
  });

  test('every chart gate yields a named cross with engine-consistent gates', () => {
    for (const profile of ['1/3', '4/1', '5/1'])
      for (const g of GATE_WHEEL) {
        const x = incarnationCross(chartWith(profile, g));
        expect(x.name).toBeDefined();
        const d = x.gates;
        // design Sun is 15 or 16 gates before the personality Sun on the wheel
        const delta =
          (GATE_WHEEL.indexOf(d.personalitySun) - GATE_WHEEL.indexOf(d.designSun) + 64) % 64;
        expect(delta === 15 || delta === 16).toBe(true);
      }
  });

  test('falls back honestly without a name', () => {
    const base = chartWith('1/3', 13);
    const x = incarnationCross({ ...base, crossGates: { ...base.crossGates, personalitySun: 99 } });
    expect(x.name).toBeUndefined();
    expect(x.title).toStartWith('Right Angle Cross (99/');
  });
});

describe('circuitBreakdown', () => {
  test('shares sum to one and structure is fixed', () => {
    const b = circuitBreakdown(fullChart());
    expect(b.totalChannels).toBe(36);
    expect(b.circuits.map((c) => c.circuit)).toEqual([...CIRCUIT_ORDER]);
    expect(b.streams.map((s) => s.stream)).toEqual([...STREAM_ORDER]);
    expect(b.circuits.reduce((a, c) => a + c.share, 0)).toBeCloseTo(1);
    const sum = b.streams.reduce((a, s) => a + s.share, 0);
    expect(sum).toBeCloseTo(32 / 36);
    expect(b.dominant).toBe('Collective');
    expect(b.circuits.find((c) => c.circuit === 'Collective')?.channels).toHaveLength(14);
    for (const s of b.streams) expect(s.circuit).toBe(STREAMS[s.stream].circuit);
  });

  test('no channels', () => {
    const b = circuitBreakdown({ ...fakeChart(), channels: [] });
    expect(b.totalChannels).toBe(0);
    expect(b.dominant).toBeUndefined();
    expect(b.circuits.every((c) => c.share === 0)).toBe(true);
  });

  test('tie has no dominant, single leader does', () => {
    const full = fullChart();
    const pick = (circuit: Circuit, n: number) =>
      full.channels
        .filter((c) => CHANNELS[`${c.gates[0]}-${c.gates[1]}`]?.circuit === circuit)
        .slice(0, n);
    const tie = circuitBreakdown({
      ...full,
      channels: [...pick('Tribal', 2), ...pick('Individual', 2)],
    });
    expect(tie.dominant).toBeUndefined();
    const lead = circuitBreakdown({
      ...full,
      channels: [...pick('Tribal', 3), ...pick('Individual', 2)],
    });
    expect(lead.dominant).toBe('Tribal');
  });
});

describe('circuit deep fields (smoke)', () => {
  test('every circuit carries the new copy', () => {
    for (const c of CIRCUIT_ORDER) {
      expect(CIRCUITS[c].strong?.length).toBeGreaterThan(20);
      expect(CIRCUITS[c].experiments).toHaveLength(3);
    }
    for (const s of STREAM_ORDER) expect(STREAMS[s].stress?.length).toBeGreaterThan(20);
  });
});
