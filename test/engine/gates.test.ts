import { describe, expect, test } from 'bun:test';
import { GATE_SIZE, GATE_WHEEL, LINE_SIZE, WHEEL_START_DEGREES } from '@engine/data';
import { gateAt } from '@engine';

describe('gate wheel', () => {
  test('has 64 unique gates covering 1..64', () => {
    expect(GATE_WHEEL).toHaveLength(64);
    expect(new Set(GATE_WHEEL).size).toBe(64);
    expect([...GATE_WHEEL].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 64 }, (_, i) => i + 1),
    );
  });

  test('gate 41 starts at 302 degrees', () => {
    expect(gateAt(302)).toEqual({ gate: 41, line: 1, color: 1, tone: 1 });
    expect(gateAt(302 + GATE_SIZE - 1e-6).gate).toBe(41);
    expect(gateAt(302 + GATE_SIZE).gate).toBe(19);
  });

  test('the wheel wraps around 0/360 degrees', () => {
    expect(gateAt(0).gate).toBe(GATE_WHEEL[Math.floor(58 / GATE_SIZE)] as number);
    expect(gateAt(301.999999).gate).toBe(60);
    expect(gateAt(360 + 302)).toEqual(gateAt(302));
    expect(gateAt(-58)).toEqual(gateAt(302));
  });

  test('every gate boundary maps to the next wheel gate with line 1', () => {
    GATE_WHEEL.forEach((gate, i) => {
      const start = WHEEL_START_DEGREES + i * GATE_SIZE;
      const at = gateAt(start + 1e-9);
      expect(at.gate).toBe(gate);
      expect(at.line).toBe(1);
    });
  });

  test('lines advance every LINE_SIZE degrees', () => {
    for (let line = 1; line <= 6; line++) {
      expect(gateAt(302 + (line - 1) * LINE_SIZE + 1e-9).line).toBe(line);
    }
  });

  test('line, color and tone are always within 1..6, including float edges', () => {
    for (let i = 0; i <= 360 * 64; i++) {
      const lon = i / 64 + (i % 7) * 1e-13;
      const { line, color, tone } = gateAt(lon);
      for (const v of [line, color, tone]) {
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(6);
      }
    }
    const nearTop = gateAt(302 - 1e-12);
    expect(nearTop).toMatchObject({ gate: 60, line: 6 });
    expect(nearTop.color).toBeLessThanOrEqual(6);
  });

  test('rejects non-finite longitudes', () => {
    expect(() => gateAt(Number.NaN)).toThrow(RangeError);
    expect(() => gateAt(Infinity)).toThrow(RangeError);
  });
});
