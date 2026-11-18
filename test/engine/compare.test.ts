import { describe, expect, test } from 'bun:test';
import { analyzeGates, compareCharts, determineAuthority, determineType } from '@engine';
import type { Chart } from '@/types';

/** Minimal chart carrying only what compareCharts reads. */
function fake(gates: number[]): Chart {
  const g = analyzeGates(gates);
  const type = determineType(g);
  return {
    activeGates: g.activeGates,
    definedCenters: g.definedCenters,
    openCenters: g.openCenters,
    channels: g.channels,
    components: g.components,
    hangingGates: g.hangingGates,
    type,
    authority: determineAuthority(g, type),
  } as unknown as Chart;
}

function kindOf(a: number[], b: number[], key: [number, number]) {
  return compareCharts(fake(a), fake(b)).channels.find(
    (c) => c.gates[0] === key[0] && c.gates[1] === key[1],
  );
}

describe('compareCharts', () => {
  test('electromagnetic: each has one gate, together they complete it', () => {
    expect(kindOf([20], [34], [20, 34])).toMatchObject({ kind: 'electromagnetic' });
    expect(kindOf([34], [20], [20, 34])?.owner).toBeUndefined();
  });

  test('same single gate in both is not a dynamic', () => {
    expect(kindOf([20], [20], [20, 34])).toBeUndefined();
  });

  test('companionship: both have the complete channel', () => {
    expect(kindOf([20, 34], [34, 20], [20, 34])).toMatchObject({ kind: 'companionship' });
  });

  test('dominance: one has it, the other has neither gate', () => {
    expect(kindOf([20, 34], [1], [20, 34])).toMatchObject({ kind: 'dominance', owner: 'a' });
    expect(kindOf([1], [20, 34], [20, 34])).toMatchObject({ kind: 'dominance', owner: 'b' });
  });

  test('compromise: one has it, the other has one gate', () => {
    expect(kindOf([20, 34], [34], [20, 34])).toMatchObject({ kind: 'compromise', owner: 'a' });
    expect(kindOf([20], [20, 34], [20, 34])).toMatchObject({ kind: 'compromise', owner: 'b' });
  });

  test('channels in no category are excluded', () => {
    expect(compareCharts(fake([1]), fake([2])).channels).toEqual([]);
  });

  test('composite, new centers and counts', () => {
    const c = compareCharts(fake([20, 34, 59]), fake([6, 20]));
    // 6-59 completes via electromagnetic; Solar Plexus becomes defined only in the composite.
    expect(c.compositeGates).toEqual([6, 20, 34, 59]);
    expect(c.compositeChannels.map((x) => x.gates)).toEqual([
      [6, 59],
      [20, 34],
    ]);
    expect(c.compositeDefinedCenters).toEqual(['Throat', 'SolarPlexus', 'Sacral']);
    expect(c.newlyDefinedCenters).toEqual(['SolarPlexus']);
    expect(c.compositeOpenCenters).toHaveLength(6);
    expect(c.counts).toEqual({ electromagnetic: 1, companionship: 0, dominance: 0, compromise: 1 });
    expect(c.channels.map((x) => x.kind)).toEqual(['electromagnetic', 'compromise']);
  });
});
