import type { Chart, GateSource, PlanetName } from '@/types';
import { CHANNELS, CIRCUITS, STREAMS } from '@content';
import type { Circuit, Stream } from '@content/schema';

/** What a selection key (`gate:20`, `gateline:36.6`, `circuit:Tribal`, ...) points at. */
export type Selection =
  | { kind: 'gate'; gate: number }
  | { kind: 'gateline'; gate: number; line: number }
  | { kind: 'channel'; id: string }
  | { kind: 'circuit'; circuit: Circuit }
  | { kind: 'stream'; stream: Stream }
  | { kind: 'other'; key: string };

function isCircuit(value: string): value is Circuit {
  return Object.hasOwn(CIRCUITS, value);
}

function isStream(value: string): value is Stream {
  return Object.hasOwn(STREAMS, value);
}

/** Key of one line of one gate, e.g. `gateline:36.6`. */
export function gateLineKey(gate: number, line: number): string {
  return `gateline:${gate}.${line}`;
}

/** Split a selection key into what it points at. Total: never throws. */
export function parseSelection(key: string | undefined): Selection | undefined {
  if (!key) return undefined;
  const at = key.indexOf(':');
  if (at <= 0) return { kind: 'other', key };
  const family = key.slice(0, at);
  const value = key.slice(at + 1);
  if (family === 'gate' && /^\d{1,2}$/.test(value)) return { kind: 'gate', gate: Number(value) };
  if (family === 'gateline') {
    const m = /^(\d{1,2})\.([1-6])$/.exec(value);
    if (m?.[1] && m[2]) return { kind: 'gateline', gate: Number(m[1]), line: Number(m[2]) };
  }
  if (family === 'channel' && /^\d{1,2}-\d{1,2}$/.test(value))
    return { kind: 'channel', id: value };
  if (family === 'circuit' && isCircuit(value)) return { kind: 'circuit', circuit: value };
  if (family === 'stream' && isStream(value)) return { kind: 'stream', stream: value };
  return { kind: 'other', key };
}

/** The gate a key stands for on the drawing (`gate:20` and `gateline:20.3` both give 20). */
export function selectionGate(key: string | undefined): number | undefined {
  const s = parseSelection(key);
  return s?.kind === 'gate' || s?.kind === 'gateline' ? s.gate : undefined;
}

/** Whether a key selects a circuit or a stream (a "channel group" highlight). */
export function isGroupSelection(key: string | undefined): boolean {
  const s = parseSelection(key);
  return s?.kind === 'circuit' || s?.kind === 'stream';
}

/**
 * The key to highlight on the canvas: a line highlights its gate, a circuit or
 * stream highlights nothing by key (its channels are dimmed in instead).
 */
export function canvasKeyFor(key: string | undefined): string | undefined {
  const s = parseSelection(key);
  if (!s) return undefined;
  if (s.kind === 'gate' || s.kind === 'gateline') return `gate:${s.gate}`;
  if (s.kind === 'circuit' || s.kind === 'stream') return undefined;
  return key;
}

/**
 * Ids of every channel that belongs to the selected circuit or stream, or
 * `undefined` when the key is neither.
 */
export function channelsOfSelection(key: string | undefined): readonly string[] | undefined {
  const s = parseSelection(key);
  if (s?.kind !== 'circuit' && s?.kind !== 'stream') return undefined;
  return Object.entries(CHANNELS)
    .filter(([, c]) => (s.kind === 'circuit' ? c.circuit === s.circuit : c.stream === s.stream))
    .map(([id]) => id);
}

/** One of the six lines of a gate, with the way this chart has it (if it does). */
export interface LineMark {
  line: number;
  /** Which sides activate this line of the gate: empty when the chart does not have it. */
  sources: GateSource[];
  /** The planets behind it, e.g. `Personality Sun`. */
  planets: string[];
}

/**
 * The six lines of `gate` (always six entries) marked with the lines the chart
 * has there. Personality and design are separate: a chart can have line 3
 * conscious and line 5 unconscious in the same gate.
 */
export function lineMarks(chart: Chart | undefined, gate: number): LineMark[] {
  const marks: LineMark[] = [1, 2, 3, 4, 5, 6].map((line) => ({ line, sources: [], planets: [] }));
  if (!chart) return marks;
  const add = (side: 'personality' | 'design', planet: PlanetName, line: number): void => {
    const mark = marks[line - 1];
    if (!mark) return;
    if (!mark.sources.includes(side)) mark.sources.push(side);
    mark.planets.push(`${side === 'personality' ? 'Personality' : 'Design'} ${planet}`);
  };
  for (const a of chart.personality) if (a.gate === gate) add('personality', a.planet, a.line);
  for (const a of chart.design) if (a.gate === gate) add('design', a.planet, a.line);
  return marks;
}

/** Whether the mark is one of this chart's lines. */
export function isMine(mark: LineMark): boolean {
  return mark.sources.length > 0;
}

/** `Yours: Personality Sun, Design Moon` style caption, or an empty string. */
export function markCaption(mark: LineMark): string {
  return mark.planets.join(', ');
}
