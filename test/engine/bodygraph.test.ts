import { describe, expect, test } from 'bun:test';
import {
  CENTER_GATES,
  CHANNEL_LIST,
  analyzeGates,
  centerOfGate,
  definitionName,
  determineAuthority,
  determineType,
  motorConnectedToThroat,
} from '@engine';
import { CENTER_NAMES } from '@/types';

function classify(gates: number[]) {
  const graph = analyzeGates(gates);
  const type = determineType(graph);
  return { graph, type, authority: determineAuthority(graph, type) };
}

describe('data integrity', () => {
  test('every gate belongs to exactly one center', () => {
    const all = CENTER_NAMES.flatMap((c) => [...CENTER_GATES[c]]);
    expect(all).toHaveLength(64);
    expect(new Set(all).size).toBe(64);
  });

  test('there are 36 channels and each one agrees with CENTER_GATES', () => {
    expect(CHANNEL_LIST).toHaveLength(36);
    for (const { gates, centers } of CHANNEL_LIST) {
      expect(gates[0]).toBeLessThan(gates[1]);
      expect(centerOfGate(gates[0])).toBe(centers[0]);
      expect(centerOfGate(gates[1])).toBe(centers[1]);
      expect(centers[0]).not.toBe(centers[1]);
    }
  });
});

describe('analyzeGates', () => {
  test('no gates means no definition', () => {
    const g = analyzeGates([]);
    expect(g.definedCenters).toEqual([]);
    expect(g.openCenters).toHaveLength(9);
    expect(g.components).toEqual([]);
    expect(definitionName(g.components.length)).toBe('No Definition');
  });

  test('deduplicates and sorts gates, and finds hanging gates', () => {
    const g = analyzeGates([34, 20, 20, 5, 1]);
    expect(g.activeGates).toEqual([1, 5, 20, 34]);
    expect(g.channels.map((c) => c.gates)).toEqual([[20, 34]]);
    expect(g.hangingGates).toEqual([1, 5]);
    expect(g.definedCenters).toEqual(['Throat', 'Sacral']);
  });

  test('a single gate defines nothing', () => {
    const g = analyzeGates([20]);
    expect(g.definedCenters).toEqual([]);
    expect(g.hangingGates).toEqual([20]);
  });

  test('connected channels form one component; disjoint ones split', () => {
    expect(analyzeGates([20, 34, 34, 59, 6]).components).toEqual([
      ['Throat', 'SolarPlexus', 'Sacral'],
    ]);
    const split = analyzeGates([64, 47, 20, 34]);
    expect(split.components).toEqual([
      ['Head', 'Ajna'],
      ['Throat', 'Sacral'],
    ]);
    expect(definitionName(split.components.length)).toBe('Split Definition');
  });

  test('definition names cap at Quadruple Split', () => {
    expect(definitionName(1)).toBe('Single Definition');
    expect(definitionName(3)).toBe('Triple Split Definition');
    expect(definitionName(4)).toBe('Quadruple Split Definition');
    expect(definitionName(5)).toBe('Quadruple Split Definition');
  });

  test('a gate shared by several channels is never hanging', () => {
    const g = analyzeGates([10, 20, 57]);
    expect(g.channels.map((c) => c.gates)).toEqual([
      [10, 20],
      [10, 57],
      [20, 57],
    ]);
    expect(g.hangingGates).toEqual([]);
  });
});

describe('type and authority', () => {
  test('Reflector has no defined centers and Lunar authority', () => {
    const r = classify([1, 2, 3]);
    expect(r.type).toBe('Reflector');
    expect(r.authority).toBe('Lunar');
  });

  test('Generator: Sacral defined, no motor to Throat', () => {
    const r = classify([5, 15]);
    expect(r.type).toBe('Generator');
    expect(r.authority).toBe('Sacral');
  });

  test('Manifesting Generator: Sacral connected to Throat', () => {
    const r = classify([20, 34]);
    expect(r.type).toBe('Manifesting Generator');
    expect(r.authority).toBe('Sacral');
    expect(motorConnectedToThroat(r.graph)).toBe(true);
  });

  test('Sacral and Throat defined but in separate components stays Generator', () => {
    const r = classify([5, 15, 16, 48]);
    expect(r.type).toBe('Generator');
  });

  test('Manifestor: motor to Throat, no Sacral; Emotional authority wins', () => {
    const r = classify([12, 22]);
    expect(r.type).toBe('Manifestor');
    expect(r.authority).toBe('Emotional');
    expect(classify([21, 45]).type).toBe('Manifestor');
    expect(classify([21, 45]).authority).toBe('Ego');
  });

  test('Projector: no Sacral, no motor on Throat', () => {
    const r = classify([16, 48]);
    expect(r.type).toBe('Projector');
    expect(r.authority).toBe('Splenic');
  });

  test('Projector with G only is Self-Projected', () => {
    expect(classify([1, 8]).authority).toBe('Self-Projected');
    expect(classify([1, 8]).type).toBe('Projector');
  });

  test('Projector with only Head, Ajna, Throat defined is Mental', () => {
    const r = classify([64, 47, 11, 56, 17, 62]);
    expect(r.type).toBe('Projector');
    expect(r.authority).toBe('Mental');
  });

  test('authority priority: Emotional > Sacral > Splenic > Ego > Self-Projected', () => {
    expect(classify([6, 59, 34, 57]).authority).toBe('Emotional');
    expect(classify([34, 57, 26, 44]).authority).toBe('Sacral');
    expect(classify([26, 44, 1, 8]).authority).toBe('Splenic');
    expect(classify([25, 51]).authority).toBe('Ego');
  });
});
