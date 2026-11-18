import {
  COLOR_SIZE,
  GATE_SIZE,
  GATE_WHEEL,
  LINE_SIZE,
  TONE_SIZE,
  WHEEL_START_DEGREES,
} from './data';

/** A position on the gate wheel. */
export interface GatePosition {
  gate: number;
  /** 1..6 */
  line: number;
  /** 1..6 */
  color: number;
  /** 1..6 */
  tone: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Maps an ecliptic longitude (degrees, any real number) to its gate, line,
 * color and tone. The wheel starts at 302 degrees (gate 41); each gate spans
 * 5.625 degrees, each line 1/6 of that, each color 1/6 of a line and each
 * tone 1/6 of a color. Sub-divisions are clamped so floating point edges can
 * never produce a value outside 1..6.
 *
 * @throws RangeError when the longitude is not a finite number.
 */
export function gateAt(longitude: number): GatePosition {
  if (!Number.isFinite(longitude)) throw new RangeError(`Invalid longitude ${longitude}`);
  const offset = (((longitude - WHEEL_START_DEGREES) % 360) + 360) % 360;
  const index = clamp(Math.floor(offset / GATE_SIZE), 0, GATE_WHEEL.length - 1);
  const gate = GATE_WHEEL[index];
  if (gate === undefined) throw new RangeError(`No gate at index ${index}`);

  const withinGate = Math.max(0, offset - index * GATE_SIZE);
  const line = clamp(Math.floor(withinGate / LINE_SIZE) + 1, 1, 6);
  const withinLine = Math.max(0, withinGate - (line - 1) * LINE_SIZE);
  const color = clamp(Math.floor(withinLine / COLOR_SIZE) + 1, 1, 6);
  const withinColor = Math.max(0, withinLine - (color - 1) * COLOR_SIZE);
  const tone = clamp(Math.floor(withinColor / TONE_SIZE) + 1, 1, 6);
  return { gate, line, color, tone };
}
