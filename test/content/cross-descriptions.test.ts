import { describe, expect, test } from 'bun:test';
import { CROSS_DESCRIPTIONS, CROSS_ENTRIES, crossDescription, crossKey } from '@content';
import type { CrossAngle } from '@content/schema';

const ANGLES: CrossAngle[] = ['Right Angle', 'Juxtaposition', 'Left Angle'];
const rows = CROSS_ENTRIES.map((c) => ({
  ...c,
  key: crossKey(c.angle, c.sunGate),
  d: crossDescription(c.angle, c.sunGate),
}));
const words = (t: string): string[] => t.toLowerCase().match(/[a-z']+/g) ?? [];
const sentences = (t: string): number => (t.match(/[.!?](\s|$)/g) ?? []).length;

describe('cross descriptions', () => {
  test('exist for all 192 crosses and for nothing else', () => {
    expect(Object.keys(CROSS_DESCRIPTIONS)).toHaveLength(192);
    expect(new Set(Object.keys(CROSS_DESCRIPTIONS))).toEqual(new Set(rows.map((r) => r.key)));
    for (const r of rows) expect(r.d, r.key).toBeDefined();
  });

  test('theme is two to eight words, summary 80-320 characters in two or three sentences', () => {
    for (const r of rows) {
      const n = words(r.d?.theme ?? '').length;
      expect(n, `${r.key} theme "${r.d?.theme}"`).toBeGreaterThanOrEqual(2);
      expect(n, `${r.key} theme "${r.d?.theme}"`).toBeLessThanOrEqual(8);
      const s = r.d?.summary ?? '';
      expect(s.length, `${r.key} length`).toBeGreaterThanOrEqual(80);
      expect(s.length, `${r.key} length`).toBeLessThanOrEqual(320);
      expect(sentences(s), `${r.key} sentences`).toBeGreaterThanOrEqual(2);
      expect(sentences(s), `${r.key} sentences`).toBeLessThanOrEqual(3);
    }
  });

  test('text hygiene: no markup, placeholders, medical or deterministic language', () => {
    for (const r of rows) {
      for (const text of [r.d?.theme ?? '', r.d?.summary ?? '']) {
        expect(text, r.key).not.toMatch(/[<>]/);
        expect(text, r.key).not.toMatch(/todo|lorem|tbd|xxx/i);
        expect(text, r.key).not.toMatch(/\bcure[sd]?\b|diagnos|disorder|therap|medicat/i);
        expect(text, r.key).not.toMatch(
          /\b(must|always|never|destined|fate|fated|guarantee[sd]?)\b/i,
        );
        expect(text, r.key).not.toMatch(/\s{2,}|^\s|\s$/);
      }
    }
  });

  test('every summary and theme is different', () => {
    expect(new Set(rows.map((r) => r.d?.summary.toLowerCase())).size).toBe(192);
    expect(new Set(rows.map((r) => r.d?.theme.toLowerCase())).size).toBeGreaterThanOrEqual(185);
  });

  test('no sentence skeleton dominates', () => {
    const counts = new Map<string, number>();
    for (const r of rows) {
      const opening = words(r.d?.summary ?? '')
        .slice(0, 3)
        .join(' ');
      counts.set(opening, (counts.get(opening) ?? 0) + 1);
    }
    const worst = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    expect(worst?.[1] ?? 0, `most repeated opening "${worst?.[0]}"`).toBeLessThanOrEqual(8);
  });

  test('the three angles of one Sun gate read clearly differently', () => {
    const jaccard = (a: string, b: string): number => {
      const x = new Set(words(a));
      const y = new Set(words(b));
      const common = [...x].filter((w) => y.has(w)).length;
      return common / (x.size + y.size - common);
    };
    for (let gate = 1; gate <= 64; gate++) {
      const texts = ANGLES.map((a) => crossDescription(a, gate)?.summary ?? '');
      for (const [i, j] of [
        [0, 1],
        [0, 2],
        [1, 2],
      ] as const) {
        expect(
          jaccard(texts[i] ?? '', texts[j] ?? ''),
          `gate ${gate}: ${ANGLES[i]} vs ${ANGLES[j]}`,
        ).toBeLessThan(0.6);
      }
    }
  });

  test('written in the same third-person voice as the line texts', () => {
    for (const r of rows) {
      expect(r.d?.summary ?? '', r.key).not.toMatch(/\b(you|your|yours|yourself)\b/i);
    }
  });
});
