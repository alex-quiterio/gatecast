import { describe, expect, test } from 'bun:test';
import { GATES, GATE_LINES, lineMeaning } from '@content';

const entries = Object.entries(GATE_LINES).flatMap(([gate, lines]) =>
  (lines ?? []).map((line, index) => ({ gate: Number(gate), line: index + 1, ...line })),
);

describe('gate line meanings', () => {
  test('cover all 64 gates with exactly six lines each', () => {
    for (let gate = 1; gate <= 64; gate++) {
      expect(GATE_LINES[gate], `gate ${gate}`).toHaveLength(6);
    }
    expect(Object.keys(GATE_LINES)).toHaveLength(64);
    expect(entries).toHaveLength(384);
  });

  test('titles are two to five words and unique within a gate', () => {
    for (let gate = 1; gate <= 64; gate++) {
      const titles = (GATE_LINES[gate] ?? []).map((l) => l.title);
      for (const title of titles) {
        const words = title.trim().split(/\s+/).length;
        expect(words, `gate ${gate}: "${title}"`).toBeGreaterThanOrEqual(2);
        expect(words, `gate ${gate}: "${title}"`).toBeLessThanOrEqual(5);
      }
      expect(new Set(titles.map((t) => t.toLowerCase())).size, `gate ${gate}`).toBe(6);
    }
  });

  test('summaries fit the limits and are all different', () => {
    for (const e of entries) {
      expect(e.summary.length, `${e.gate}.${e.line}`).toBeGreaterThanOrEqual(20);
      expect(e.summary.length, `${e.gate}.${e.line}`).toBeLessThanOrEqual(170);
    }
    const summaries = entries.map((e) => e.summary.toLowerCase());
    expect(new Set(summaries).size).toBe(entries.length);
  });

  test('text hygiene: no markup, placeholders, cure claims or commands', () => {
    const text = (e: (typeof entries)[number]) => `${e.title} ${e.summary}`;
    for (const e of entries) {
      const t = text(e);
      expect(t, `${e.gate}.${e.line}`).not.toMatch(/[<>]/);
      expect(t, `${e.gate}.${e.line}`).not.toMatch(/todo|lorem|tbd|xxx/i);
      expect(t, `${e.gate}.${e.line}`).not.toMatch(
        /\bcure[sd]?\b|diagnos|disorder|therapy|medicat/i,
      );
      expect(t, `${e.gate}.${e.line}`).not.toMatch(/\byou must\b|\bwill always\b|\bdestined\b/i);
      expect(t, `${e.gate}.${e.line}`).not.toMatch(/\s{2,}|^\s|\s$/);
      expect(e.summary, `${e.gate}.${e.line}`).toMatch(/[.!?]$/);
    }
  });

  test('no sentence skeleton dominates: no three-word opening is more than 2% of the lines', () => {
    const counts = new Map<string, number>();
    for (const e of entries) {
      const opening = e.summary.toLowerCase().split(/\s+/).slice(0, 3).join(' ');
      counts.set(opening, (counts.get(opening) ?? 0) + 1);
    }
    const worst = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    // Line 5 is the line others project onto, so "Others may look..." is natural there.
    expect(worst?.[1] ?? 0, `most repeated opening: ${worst?.[0]}`).toBeLessThanOrEqual(
      Math.floor(entries.length * 0.02),
    );
  });

  test('every gate has a name to pair its lines with', () => {
    for (let gate = 1; gate <= 64; gate++) expect(GATES[gate]?.name).toBeTruthy();
  });

  test('lineMeaning finds a line, and rejects gates and lines that do not exist', () => {
    expect(lineMeaning(36, 6)).toEqual(GATE_LINES[36]?.[5]);
    expect(lineMeaning(1, 1)?.title).toBeTruthy();
    for (const [gate, line] of [
      [0, 1],
      [65, 1],
      [20, 0],
      [20, 7],
      [20, 1.5],
      [Number.NaN, 1],
    ] as const) {
      expect(lineMeaning(gate, line), `${gate}.${line}`).toBeUndefined();
    }
  });
});
