import { describe, expect, test } from 'bun:test';
import { CENTER_NAMES, PLANET_NAMES } from '@/types';
import { CENTER_GATES, CHANNEL_LIST, MOTOR_CENTERS, channelKey } from '@engine/data';
import {
  AUTHORITIES,
  CENTERS,
  CHANNELS,
  DEFINITIONS,
  DISCLAIMER,
  DYNAMICS,
  GATES,
  GLOSSARY,
  HEXAGRAM_NAMES,
  LINES,
  PLANETS,
  PROFILES,
  TYPES,
  hexagramChar,
} from '@content';

/** Every string in the content, for text-hygiene checks. */
function allStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const v of value) allStrings(v, out);
  else if (value && typeof value === 'object')
    for (const v of Object.values(value)) allStrings(v, out);
  return out;
}

const nonEmpty = (s: unknown): boolean => typeof s === 'string' && s.trim().length > 0;

describe('gates', () => {
  test('all 64 gates are complete', () => {
    for (let n = 1; n <= 64; n++) {
      const g = GATES[n];
      expect(g).toBeDefined();
      expect(g?.number).toBe(n);
      expect(nonEmpty(g?.name)).toBe(true);
      expect(g?.iching).toBe(HEXAGRAM_NAMES[n - 1]);
      expect(nonEmpty(g?.summary)).toBe(true);
    }
    expect(Object.keys(GATES)).toHaveLength(64);
  });

  test('keynotes are at most six words', () => {
    for (const g of Object.values(GATES)) {
      const words = g.keynote.trim().split(/\s+/).length;
      expect(words).toBeGreaterThan(0);
      expect(words).toBeLessThanOrEqual(6);
    }
  });

  test('gate names are unique (the system does not repeat any)', () => {
    const names = Object.values(GATES).map((g) => g.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  test('every gate belongs to a center', () => {
    const all = Object.values(CENTER_GATES).flat();
    expect(new Set(all).size).toBe(64);
  });
});

describe('channels', () => {
  test('channels match CHANNEL_LIST exactly', () => {
    const expected = CHANNEL_LIST.map((c) => channelKey(...c.gates)).sort();
    expect(Object.keys(CHANNELS).sort()).toEqual(expected);
    expect(expected).toHaveLength(36);
  });

  test('every channel has complete fields', () => {
    for (const c of Object.values(CHANNELS)) {
      expect(nonEmpty(c.name)).toBe(true);
      expect(nonEmpty(c.summary)).toBe(true);
      expect(['Individual', 'Tribal', 'Collective', 'Integration']).toContain(c.circuit);
    }
  });

  test('stream is set for every channel except Integration', () => {
    for (const c of Object.values(CHANNELS)) {
      if (c.circuit === 'Integration') expect(c.stream).toBeUndefined();
      else expect(c.stream).toBeDefined();
    }
  });

  test('circuit counts match the system', () => {
    const count = (circuit: string): number =>
      Object.values(CHANNELS).filter((c) => c.circuit === circuit).length;
    expect(count('Individual')).toBe(11);
    expect(count('Tribal')).toBe(7);
    expect(count('Collective')).toBe(14);
    expect(count('Integration')).toBe(4);
  });

  test('channel type follows the centers it joins', () => {
    for (const info of CHANNEL_LIST) {
      const [a, b] = info.centers;
      const sacral = a === 'Sacral' || b === 'Sacral';
      const manifested =
        (a === 'Throat' && MOTOR_CENTERS.includes(b)) ||
        (b === 'Throat' && MOTOR_CENTERS.includes(a));
      const expected = sacral ? 'Generated' : manifested ? 'Manifested' : 'Projected';
      expect(CHANNELS[channelKey(...info.gates)]?.channelType).toBe(expected);
    }
  });

  test('well-known names', () => {
    expect(CHANNELS['20-34']?.name).toBe('Charisma');
    expect(CHANNELS['10-20']?.name).toBe('Awakening');
    expect(CHANNELS['10-34']?.name).toBe('Exploration');
    expect(CHANNELS['10-57']?.name).toBe('Perfected Form');
    expect(CHANNELS['20-57']?.name).toBe('The Brainwave');
    expect(CHANNELS['34-57']?.name).toBe('Power');
    expect(CHANNELS['21-45']?.name).toBe('Money');
    expect(GATES[20]?.name).toBe('The Now');
    expect(GATES[34]?.name).toBe('Power');
    expect(GATES[21]?.name).toBe('The Hunter/Huntress');
  });
});

describe('other tables', () => {
  test('centers', () => {
    expect(Object.keys(CENTERS).sort()).toEqual([...CENTER_NAMES].sort());
    for (const name of CENTER_NAMES) {
      const c = CENTERS[name];
      expect(c.motor).toBe(MOTOR_CENTERS.includes(name));
      for (const s of [c.title, c.function, c.theme, c.defined, c.open, c.question]) {
        expect(nonEmpty(s)).toBe(true);
      }
    }
  });

  test('types', () => {
    expect(Object.keys(TYPES)).toHaveLength(5);
    for (const t of Object.values(TYPES)) {
      for (const s of [t.tagline, t.summary, t.strategy, t.notSelfTheme, t.signature, t.aura]) {
        expect(nonEmpty(s)).toBe(true);
      }
      expect(t.share).toMatch(/^~\d+%$/);
      expect(t.advice).toHaveLength(3);
      for (const a of t.advice) expect(nonEmpty(a)).toBe(true);
    }
    const total = Object.values(TYPES).reduce((sum, t) => sum + Number(t.share.slice(1, -1)), 0);
    expect(total).toBe(100);
  });

  test('authorities', () => {
    expect(Object.keys(AUTHORITIES).sort()).toEqual([
      'Ego',
      'Emotional',
      'Lunar',
      'Mental',
      'Sacral',
      'Self-Projected',
      'Splenic',
    ]);
    for (const a of Object.values(AUTHORITIES)) {
      expect([a.title, a.summary, a.howToUse].every(nonEmpty)).toBe(true);
    }
    expect(AUTHORITIES.Mental.howToUse.toLowerCase()).toContain('trusted');
  });

  test('profiles', () => {
    const keys = [
      '1/3',
      '1/4',
      '2/4',
      '2/5',
      '3/5',
      '3/6',
      '4/6',
      '4/1',
      '5/1',
      '5/2',
      '6/2',
      '6/3',
    ];
    expect(Object.keys(PROFILES).sort()).toEqual([...keys].sort());
    for (const [key, p] of Object.entries(PROFILES)) {
      expect(nonEmpty(p.summary)).toBe(true);
      const [a, b] = key.split('/').map(Number);
      const lineName = (n: number | undefined): string | undefined =>
        n === 1 || n === 2 || n === 3 || n === 4 || n === 5 || n === 6 ? LINES[n].name : undefined;
      expect(p.name).toBe(`${lineName(a)} / ${lineName(b)}`);
    }
  });

  test('lines', () => {
    expect(Object.values(LINES).map((l) => l.name)).toEqual([
      'Investigator',
      'Hermit',
      'Martyr',
      'Opportunist',
      'Heretic',
      'Role Model',
    ]);
    for (const l of Object.values(LINES)) expect(nonEmpty(l.summary)).toBe(true);
  });

  test('definitions', () => {
    expect(Object.keys(DEFINITIONS)).toHaveLength(5);
    for (const d of Object.values(DEFINITIONS))
      expect([d.title, d.summary].every(nonEmpty)).toBe(true);
  });

  test('planets', () => {
    expect(Object.keys(PLANETS).sort()).toEqual([...PLANET_NAMES].sort());
    expect(PLANET_NAMES).toHaveLength(13);
    const glyphs = Object.values(PLANETS).map((p) => p.glyph);
    expect(new Set(glyphs).size).toBe(13);
    for (const p of Object.values(PLANETS))
      expect([p.glyph, p.label, p.meaning].every(nonEmpty)).toBe(true);
  });

  test('dynamics', () => {
    expect(Object.keys(DYNAMICS).sort()).toEqual([
      'companionship',
      'compromise',
      'dominance',
      'electromagnetic',
    ]);
    for (const d of Object.values(DYNAMICS)) {
      expect([d.title, d.summary, d.example].every(nonEmpty)).toBe(true);
    }
  });

  test('disclaimer is a few honest sentences', () => {
    const sentences = DISCLAIMER.split(/(?<=[.!?])\s+/);
    expect(sentences.length).toBeGreaterThanOrEqual(2);
    expect(sentences.length).toBeLessThanOrEqual(3);
    expect(DISCLAIMER.toLowerCase()).toContain('not medical');
  });
});

describe('glossary', () => {
  test('has at least 30 unique terms', () => {
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(30);
    const terms = GLOSSARY.map((g) => g.term.toLowerCase());
    expect(new Set(terms).size).toBe(terms.length);
    for (const g of GLOSSARY) expect([g.term, g.definition].every(nonEmpty)).toBe(true);
  });

  test('covers the required terms', () => {
    const terms = new Set(GLOSSARY.map((g) => g.term.toLowerCase()));
    for (const t of [
      'strategy',
      'authority',
      'aura',
      'not-self theme',
      'signature',
      'profile',
      'incarnation cross',
      'personality',
      'design',
      'gate',
      'line',
      'channel',
      'center',
      'defined',
      'hanging gate',
      'motor',
      'definition',
      'split',
      'variable',
      'conditioning',
      'deconditioning',
      'circuit',
      'electromagnetic',
    ]) {
      expect(terms.has(t)).toBe(true);
    }
  });
});

describe('hexagrams', () => {
  test('names', () => {
    expect(HEXAGRAM_NAMES).toHaveLength(64);
    expect(new Set(HEXAGRAM_NAMES).size).toBe(64);
  });

  test('hexagramChar', () => {
    expect(hexagramChar(1)).toBe('䷀');
    expect(hexagramChar(64)).toBe('䷿');
    expect(() => hexagramChar(0)).toThrow(RangeError);
    expect(() => hexagramChar(65)).toThrow(RangeError);
    expect(() => hexagramChar(1.5)).toThrow(RangeError);
    expect(() => hexagramChar(Number.NaN)).toThrow(RangeError);
  });
});

describe('text hygiene', () => {
  const strings = [
    ...allStrings(GATES),
    ...allStrings(CHANNELS),
    ...allStrings(CENTERS),
    ...allStrings(TYPES),
    ...allStrings(AUTHORITIES),
    ...allStrings(PROFILES),
    ...allStrings(LINES),
    ...allStrings(DEFINITIONS),
    ...allStrings(PLANETS),
    ...allStrings(DYNAMICS),
    ...allStrings(GLOSSARY),
    DISCLAIMER,
  ];

  test('no HTML angle brackets', () => {
    for (const s of strings) expect(/[<>]/.test(s)).toBe(false);
  });

  test('no placeholder text', () => {
    for (const s of strings) expect(/todo|fixme|lorem|ipsum|tbd/i.test(s)).toBe(false);
  });

  test('no stray whitespace or doubled spaces', () => {
    for (const s of strings) {
      expect(s).toBe(s.trim());
      expect(s.includes('  ')).toBe(false);
    }
  });

  test('no fortune-telling or cure claims', () => {
    for (const s of strings)
      expect(/\b(cures?|cured|will definitely|guarantee[sd]?)\b/i.test(s)).toBe(false);
  });
});
