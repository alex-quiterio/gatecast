import type { Chart } from '@/types';
import {
  CROSS_ANGLES,
  CROSS_ENTRIES,
  CROSS_NAMES,
  QUARTERS,
  crossDescription,
  crossEntry,
  incarnationCross,
  quarterOfGate,
} from '@content';
import type { CrossAngle, CrossGateSet, Quarter } from '@content/schema';

/** The three angles in display order. */
export const ANGLE_ORDER: readonly CrossAngle[] = ['Right Angle', 'Juxtaposition', 'Left Angle'];
/** The four quarters in display order. */
export const QUARTER_ORDER: readonly Quarter[] = [
  'Initiation',
  'Civilization',
  'Duality',
  'Mutation',
];

/** `Right Angle` becomes `right-angle`. */
export function angleSlug(angle: CrossAngle): string {
  return angle.toLowerCase().replace(/\s+/g, '-');
}

/** Inverse of {@link angleSlug}; `undefined` for anything else. */
export function angleFromSlug(slug: string): CrossAngle | undefined {
  return ANGLE_ORDER.find((a) => angleSlug(a) === slug);
}

/** `right-angle-13` for a named cross: angle slug and personality Sun gate. */
export function crossId(angle: CrossAngle, gate: number): string {
  return `${angleSlug(angle)}-${gate}`;
}

/** Split `right-angle-13` back into angle and gate. */
export function parseCrossId(id: string): { angle: CrossAngle; gate: number } | undefined {
  const m = /^([a-z-]+)-(\d{1,2})$/.exec(id);
  const angle = m?.[1] ? angleFromSlug(m[1]) : undefined;
  const gate = Number(m?.[2]);
  return angle && gate >= 1 && gate <= 64 ? { angle, gate } : undefined;
}

/** Library id of a quarter, `quarter-initiation`. */
export function quarterId(quarter: Quarter): string {
  return `quarter-${quarter.toLowerCase()}`;
}

/** Inverse of {@link quarterId}. */
export function quarterFromId(id: string): Quarter | undefined {
  return QUARTER_ORDER.find((q) => quarterId(q) === id);
}

/** One known cross name, ready to list. */
export interface CrossEntry {
  id: string;
  angle: CrossAngle;
  /** Personality Sun gate. */
  gate: number;
  /** Traditional name, e.g. `the Sphinx`. */
  name: string;
  quarter: Quarter;
  /** `Right Angle Cross of the Sphinx`. */
  title: string;
}

/** Every known cross name, grouped by angle and ordered by Sun gate. */
export function crossEntries(names: Readonly<Record<string, string>> = CROSS_NAMES): CrossEntry[] {
  const out: CrossEntry[] = [];
  for (const [key, name] of Object.entries(names)) {
    const bar = key.indexOf('|');
    const angle = ANGLE_ORDER.find((a) => a === key.slice(0, bar));
    const gate = Number(key.slice(bar + 1));
    const quarter = quarterOfGate(gate);
    if (!angle || !quarter || !name) continue;
    out.push({
      id: crossId(angle, gate),
      angle,
      gate,
      name,
      quarter,
      title: `${angle} Cross of ${name}`,
    });
  }
  return out.sort(
    (a, b) => ANGLE_ORDER.indexOf(a.angle) - ANGLE_ORDER.indexOf(b.angle) || a.gate - b.gate,
  );
}

/** Filter for {@link filterCrosses}. */
export interface CrossFilter {
  query?: string;
  angle?: CrossAngle | '';
  quarter?: Quarter | '';
}

/** Filter named crosses by free text (name, angle, quarter, gate), angle and quarter. */
export function filterCrosses(list: readonly CrossEntry[], filter: CrossFilter): CrossEntry[] {
  const words = (filter.query ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  return list.filter((e) => {
    if (filter.angle && e.angle !== filter.angle) return false;
    if (filter.quarter && e.quarter !== filter.quarter) return false;
    const hay = `${e.name} ${e.angle} ${e.quarter} ${e.gate} gate ${e.title}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

/** The reason a profile gives its angle: "Your Profile 5/1 gives a Left Angle cross." */
export function angleReason(profile: string, angle: CrossAngle): string {
  const also = CROSS_ANGLES[angle]?.profiles ?? [];
  const base = `Your Profile ${profile} gives a ${angle} cross.`;
  return also.length > 1 ? `${base} The same angle comes with ${also.join(', ')}.` : base;
}

/** One gate of a quarter's strip. */
export interface StripGate {
  gate: number;
  /** The chart's personality Sun gate. */
  sun: boolean;
  /** Any other gate of the chart's cross. */
  cross: boolean;
}

/** The 16 gates of a quarter in wheel order, flagging the chart's cross gates. */
export function quarterStrip(quarter: Quarter, chart: Chart | undefined): StripGate[] {
  const g = chart?.crossGates;
  const cross = g ? [g.personalitySun, g.personalityEarth, g.designSun, g.designEarth] : [];
  return (QUARTERS[quarter]?.gates ?? []).map((gate) => ({
    gate,
    sun: g?.personalitySun === gate,
    cross: cross.includes(gate),
  }));
}

/** Everything the cross card shows for a chart. */
export function crossFacts(chart: Chart): ReturnType<typeof incarnationCross> & {
  reason: string;
  /** One-line theme from the description, if one is written. */
  theme: string | undefined;
  /** Short description, if one is written. */
  summary: string | undefined;
} {
  const cross = incarnationCross(chart);
  const description = crossDescription(cross.angle, cross.gates.personalitySun);
  return {
    ...cross,
    reason: angleReason(chart.profile, cross.angle),
    theme: description?.theme || undefined,
    summary: description?.summary || undefined,
  };
}

/** The four gates of a cross in reading order, with the label of each role. */
export const GATE_ROLES: readonly (readonly [keyof CrossGateSet, string])[] = [
  ['personalitySun', 'Personality Sun'],
  ['personalityEarth', 'Personality Earth'],
  ['designSun', 'Design Sun'],
  ['designEarth', 'Design Earth'],
];

/** One cross of the library list: name, theme, quarter and all four gates. */
export interface CrossRow {
  id: string;
  angle: CrossAngle;
  /** Personality Sun gate. */
  gate: number;
  /** Traditional name, or an empty string when none is listed. */
  name: string;
  /** One-line theme, or an empty string. */
  theme: string;
  quarter: Quarter;
  gates: CrossGateSet;
  /** `Right Angle Cross of the Sphinx`, or `Right Angle Cross, Sun gate 13`. */
  title: string;
}

/** Display title of a cross. */
export function crossTitle(angle: CrossAngle, gate: number, name: string): string {
  return name ? `${angle} Cross of ${name}` : `${angle} Cross, Sun gate ${gate}`;
}

/** The four gates of a cross as a list (duplicates are kept: a gate can repeat). */
export function gatesOf(gates: CrossGateSet): number[] {
  return GATE_ROLES.map(([key]) => gates[key]);
}

/** All crosses of the table, by angle then Sun gate, with theme and gates. */
export function crossRows(entries: readonly CrossEntryLike[] = CROSS_ENTRIES): CrossRow[] {
  const out: CrossRow[] = [];
  for (const e of entries) {
    const quarter = quarterOfGate(e.sunGate);
    if (!quarter) continue;
    out.push({
      id: crossId(e.angle, e.sunGate),
      angle: e.angle,
      gate: e.sunGate,
      name: e.name,
      theme: crossDescription(e.angle, e.sunGate)?.theme ?? '',
      quarter,
      gates: e.gates,
      title: crossTitle(e.angle, e.sunGate, e.name),
    });
  }
  return out.sort(
    (a, b) => ANGLE_ORDER.indexOf(a.angle) - ANGLE_ORDER.indexOf(b.angle) || a.gate - b.gate,
  );
}

/** The slice of a cross table entry {@link crossRows} reads. */
export interface CrossEntryLike {
  angle: CrossAngle;
  sunGate: number;
  name: string;
  gates: CrossGateSet;
}

/** The table's gates for a chart's cross, and whether they differ from the chart's own. */
export function tableGatesFor(chart: Chart): { gates: CrossGateSet | undefined; differs: boolean } {
  const cross = incarnationCross(chart);
  const table = crossEntry(cross.angle, chart.crossGates.personalitySun)?.gates;
  if (!table) return { gates: undefined, differs: false };
  const own = chart.crossGates;
  const differs = GATE_ROLES.some(([key]) => own[key] !== table[key]);
  return { gates: table, differs };
}
