import type { GateLineContent, GateLinesTable } from '@content/schema';
import { GATE_LINES_01_16 } from './lines-01-16';
import { GATE_LINES_17_32 } from './lines-17-32';
import { GATE_LINES_33_48 } from './lines-33-48';
import { GATE_LINES_49_64 } from './lines-49-64';

/** What each of the six lines of each of the 64 gates tends to mean. */
export const GATE_LINES: GateLinesTable = {
  ...GATE_LINES_01_16,
  ...GATE_LINES_17_32,
  ...GATE_LINES_33_48,
  ...GATE_LINES_49_64,
};

/**
 * The meaning of one line of one gate (e.g. gate 36, line 6), or `undefined`
 * if the gate or line does not exist.
 */
export function lineMeaning(gate: number, line: number): GateLineContent | undefined {
  if (!Number.isInteger(line) || line < 1 || line > 6) return undefined;
  return GATE_LINES[gate]?.[line - 1];
}
