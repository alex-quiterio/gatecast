import { describe, expect, test } from 'bun:test';
import {
  CIRCUITS,
  CIRCUIT_ORDER,
  CIRCUIT_PAIRS,
  GLOSSARY,
  STREAMS,
  STREAM_ORDER,
  circuitPairKey,
  circuitPairText,
  tipFor,
  TIP_BODY_MAX,
} from '@content';

const BANNED =
  /cure|diagnos|disorder|therapy|medicat|\bmust\b|\balways\b|\bnever\b|destined|guarantee/i;
const within = (t: string | undefined, max: number): void => {
  expect(t).toBeDefined();
  expect((t as string).length).toBeGreaterThan(20);
  expect((t as string).length).toBeLessThanOrEqual(max);
};

const allStrings: string[] = [];

describe('circuit deep copy', () => {
  test('every circuit has strong, absent, relating and three experiments', () => {
    for (const c of CIRCUIT_ORDER) {
      const x = CIRCUITS[c];
      within(x.strong, 300);
      within(x.absent, 300);
      within(x.relating, 300);
      expect(x.experiments).toHaveLength(3);
      for (const e of x.experiments ?? []) within(e, 140);
      allStrings.push(x.strong ?? '', x.absent ?? '', x.relating ?? '', ...(x.experiments ?? []));
    }
  });

  test('every stream has strong and stress', () => {
    for (const s of STREAM_ORDER) {
      within(STREAMS[s].strong, 240);
      within(STREAMS[s].stress, 240);
      allStrings.push(STREAMS[s].strong ?? '', STREAMS[s].stress ?? '');
    }
  });
});

describe('circuit pairs', () => {
  test('all 10 pairs exist with limits', () => {
    expect(Object.keys(CIRCUIT_PAIRS)).toHaveLength(10);
    for (const a of CIRCUIT_ORDER)
      for (const b of CIRCUIT_ORDER) {
        const p = CIRCUIT_PAIRS[circuitPairKey(a, b)];
        expect(p).toBeDefined();
        const words = (p?.title ?? '').split(/\s+/).length;
        expect(words).toBeGreaterThanOrEqual(3);
        expect(words).toBeLessThanOrEqual(8);
        within(p?.summary, 320);
        expect(p?.summary.match(/[.!?](\s|$)/g)).toHaveLength(2);
      }
    for (const p of Object.values(CIRCUIT_PAIRS)) allStrings.push(p.title, p.summary);
  });

  test('symmetric, and undefined inputs return undefined', () => {
    for (const a of CIRCUIT_ORDER)
      for (const b of CIRCUIT_ORDER) expect(circuitPairText(a, b)).toBe(circuitPairText(b, a));
    expect(circuitPairText(undefined, 'Tribal')).toBeUndefined();
    expect(circuitPairText('Tribal', undefined)).toBeUndefined();
    expect(circuitPairText(undefined, undefined)).toBeUndefined();
  });

  test('tips resolve in any order and reject garbage', () => {
    const tip = tipFor('circuitpair:Individual+Tribal');
    expect(tip?.title).toBe('Individual + Tribal');
    expect(tipFor('circuitpair:tribal+individual')).toEqual(tip);
    for (const a of CIRCUIT_ORDER)
      for (const b of CIRCUIT_ORDER) {
        const t = tipFor(`circuitpair:${a}+${b}`);
        expect(t).toBeDefined();
        expect((t?.body ?? '').length).toBeLessThanOrEqual(TIP_BODY_MAX);
        expect(t?.body).not.toMatch(/[<>]/);
      }
    for (const bad of [
      'circuitpair:',
      'circuitpair:Tribal',
      'circuitpair:Tribal+Nope',
      'circuitpair:a+b+c',
    ])
      expect(tipFor(bad)).toBeUndefined();
  });
});

describe('new content hygiene', () => {
  test('no banned words, no duplicates, no angle brackets', () => {
    expect(allStrings.length).toBeGreaterThan(50);
    for (const s of allStrings) {
      expect(s).not.toMatch(BANNED);
      expect(s).not.toMatch(/[<>]/);
    }
    expect(new Set(allStrings).size).toBe(allStrings.length);
  });

  test('new glossary terms exist and are unique', () => {
    const terms = GLOSSARY.map((g) => g.term.toLowerCase());
    expect(new Set(terms).size).toBe(terms.length);
    for (const t of [
      'Knowing stream',
      'Centering stream',
      'Ego stream',
      'Defense stream',
      'Logic stream',
      'Abstract stream',
      'Leading circuit',
      'Circuit balance',
    ]) {
      expect(terms).toContain(t.toLowerCase());
      const tip = tipFor(`term:${t}`);
      expect(tip?.body.length).toBeLessThanOrEqual(TIP_BODY_MAX);
      const g = GLOSSARY.find((e) => e.term === t);
      expect(g?.definition).not.toMatch(BANNED);
    }
  });
});
