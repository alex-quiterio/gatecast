import { CENTER_GATES } from '@engine';
import {
  AUTHORITIES,
  CENTERS,
  CHANNELS,
  CIRCUITS,
  CIRCUIT_ORDER,
  CROSS_ANGLES,
  GATES,
  GLOSSARY,
  PROFILES,
  QUARTERS,
  STREAMS,
  STREAM_ORDER,
  TYPES,
  lineMeaning,
} from '@content';
import type { CrossAngle, Quarter } from '@content/schema';
import { CENTER_NAMES, type CenterName, type Chart } from '@/types';
import {
  ANGLE_ORDER,
  QUARTER_ORDER,
  angleFromSlug,
  angleSlug,
  crossRows,
  gatesOf,
  parseCrossId,
  quarterFromId,
  quarterId,
} from './cross-logic';
import { mineIdSet } from './mine-logic';
import { parseSelection } from './selection-logic';
import type { LibraryTab } from './router';
import { centerLabel } from './views/common';

/** One row of the library (and of the quick-find index). */
export interface LibraryEntry {
  id: string;
  title: string;
  subtitle: string;
  /** Lower-case haystack for search. */
  haystack: string;
  /** Tooltip / detail key, e.g. `gate:20`. */
  tip: string;
  center?: CenterName;
  /** Sub-heading the entry is listed under (crosses and circuits). */
  group?: string;
  /** Angle of a cross entry, for filtering. */
  angle?: CrossAngle;
  /** Quarter of a cross or quarter entry, for filtering. */
  quarter?: Quarter;
  /** What a cross-tab entry is: an angle, a quarter or a named cross. */
  kind?: 'angle' | 'quarter' | 'cross';
  /** A named cross: its four gates (personality Sun, Earth, design Sun, Earth). */
  gates?: readonly number[];
  /** A named cross: the personality Sun gate. */
  sunGate?: number;
  /** A named cross: its one-line theme. */
  theme?: string;
  /** Short text after the title (quarter and Sun gate of a cross). */
  meta?: string;
}

/** Human labels of the library tabs. */
export const TAB_LABELS: Record<LibraryTab, string> = {
  gate: 'Gates',
  channel: 'Channels',
  center: 'Centers',
  type: 'Types',
  authority: 'Authorities',
  profile: 'Profiles',
  cross: 'Crosses',
  circuit: 'Circuits',
  glossary: 'Glossary',
};

function centerOfGateNumber(gate: number): CenterName | undefined {
  return CENTER_NAMES.find((c) => CENTER_GATES[c]?.includes(gate));
}

/** All entries of one library tab, in display order. */
export function entriesFor(tab: LibraryTab): LibraryEntry[] {
  switch (tab) {
    case 'gate':
      return Object.values(GATES)
        .sort((a, b) => a.number - b.number)
        .map((g) => {
          const center = centerOfGateNumber(g.number);
          return {
            id: String(g.number),
            title: `${g.number}. ${g.name}`,
            subtitle: g.keynote,
            haystack: `${g.number} ${g.name} ${g.keynote} ${g.iching}`.toLowerCase(),
            tip: `gate:${g.number}`,
            ...(center ? { center } : {}),
          };
        });
    case 'channel':
      return Object.entries(CHANNELS)
        .sort(([a], [b]) => Number(a.split('-')[0]) - Number(b.split('-')[0]) || a.localeCompare(b))
        .map(([id, c]) => ({
          id,
          title: `${id} ${c.name}`,
          subtitle: [c.circuit, c.stream].filter(Boolean).join(' · '),
          haystack: `${id} ${c.name} ${c.circuit ?? ''} ${c.stream ?? ''}`.toLowerCase(),
          tip: `channel:${id}`,
        }));
    case 'center':
      return CENTER_NAMES.map((c) => ({
        id: c,
        title: CENTERS[c]?.title ?? centerLabel(c),
        subtitle: CENTERS[c]?.theme ?? '',
        haystack: `${c} ${CENTERS[c]?.title ?? ''} ${CENTERS[c]?.theme ?? ''}`.toLowerCase(),
        tip: `center:${c}`,
      }));
    case 'type':
      return Object.entries(TYPES).map(([id, t]) => ({
        id,
        title: id,
        subtitle: t.tagline,
        haystack: `${id} ${t.tagline} ${t.strategy}`.toLowerCase(),
        tip: `type:${id}`,
      }));
    case 'authority':
      return Object.entries(AUTHORITIES).map(([id, a]) => ({
        id,
        title: a.title,
        subtitle: id,
        haystack: `${id} ${a.title} ${a.summary}`.toLowerCase(),
        tip: `authority:${id}`,
      }));
    case 'profile':
      return Object.entries(PROFILES).map(([id, p]) => ({
        id,
        title: `${id} · ${p.name}`,
        subtitle: '',
        haystack: `${id} ${p.name} ${p.summary}`.toLowerCase(),
        tip: `profile:${id}`,
      }));
    case 'cross':
      return crossTabEntries();
    case 'circuit':
      return circuitEntries();
    case 'glossary':
      return GLOSSARY.map((g) => ({
        id: g.term,
        title: g.term,
        subtitle: '',
        haystack: `${g.term} ${g.definition}`.toLowerCase(),
        tip: `term:${g.term}`,
      }));
  }
}

function circuitEntries(): LibraryEntry[] {
  const out: LibraryEntry[] = CIRCUIT_ORDER.map((c) => {
    const content = CIRCUITS[c];
    const streams = content.streams.join(' ');
    return {
      id: c,
      title: content.title,
      subtitle: content.tagline,
      haystack:
        `${c} ${content.title} ${content.tagline} ${content.summary} ${streams} circuit`.toLowerCase(),
      tip: `circuit:${c}`,
      group: 'Circuits',
    };
  });
  for (const stream of STREAM_ORDER) {
    const content = STREAMS[stream];
    out.push({
      id: `stream-${stream}`,
      title: `${content.title} stream`,
      subtitle: `${content.circuit} circuit`,
      haystack:
        `${stream} ${content.title} stream ${content.summary} ${content.circuit}`.toLowerCase(),
      tip: `stream:${stream}`,
      group: 'Streams',
    });
  }
  return out;
}

function crossTabEntries(): LibraryEntry[] {
  const out: LibraryEntry[] = [];
  for (const angle of ANGLE_ORDER) {
    const content = CROSS_ANGLES[angle];
    out.push({
      id: angleSlug(angle),
      title: `${content.title} cross`,
      subtitle: content.profiles.length ? `Profiles ${content.profiles.join(', ')}` : '',
      haystack:
        `${angle} angle cross ${content.summary} ${content.profiles.join(' ')}`.toLowerCase(),
      tip: `cross:${angle}`,
      group: 'Angles',
      angle,
      kind: 'angle',
    });
  }
  for (const quarter of QUARTER_ORDER) {
    const content = QUARTERS[quarter];
    out.push({
      id: quarterId(quarter),
      title: content.title,
      subtitle: content.theme,
      haystack:
        `${quarter} quarter ${content.title} ${content.theme} ${content.summary} ${content.gates.join(' ')}`.toLowerCase(),
      tip: `quarter:${quarter}`,
      group: 'Quarters',
      quarter,
      kind: 'quarter',
    });
  }
  for (const e of crossRows()) {
    const gates = gatesOf(e.gates);
    out.push({
      id: e.id,
      title: e.title,
      subtitle: e.theme,
      meta: `${QUARTERS[e.quarter].title} · Sun gate ${e.gate}`,
      haystack:
        `${e.title} ${e.name} ${e.theme} ${e.angle} ${e.quarter} ${e.gate} gate ${gates.join(' ')}`.toLowerCase(),
      tip: `crossname:${e.id}`,
      group: `${e.angle} crosses`,
      angle: e.angle,
      quarter: e.quarter,
      kind: 'cross',
      gates,
      sunGate: e.gate,
      theme: e.theme,
    });
  }
  return out;
}

/** Optional filters beyond the text query. */
export interface LibraryFacets {
  center?: CenterName | '';
  /** Cross tab: only this angle (its entry and its named crosses). */
  angle?: CrossAngle | '';
  /** Cross tab: only this quarter. */
  quarter?: Quarter | '';
  /** Only entries with these ids ("Mine"). */
  only?: ReadonlySet<string> | undefined;
}

/**
 * Filter entries by a free-text query and optional facets.
 *
 * @param entries Entries of one tab.
 * @param tab The tab the entries belong to (the center filter applies to gates only).
 * @param query Free text, matched case-insensitively against the haystack.
 * @param facets A center (a plain string is accepted for it), or several facets.
 */
export function filterEntries(
  entries: readonly LibraryEntry[],
  tab: LibraryTab,
  query: string,
  facets: CenterName | '' | LibraryFacets = '',
): LibraryEntry[] {
  const f: LibraryFacets = typeof facets === 'string' ? { center: facets } : facets;
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return entries.filter((e) => {
    if (!words.every((w) => e.haystack.includes(w))) return false;
    if (f.center && tab === 'gate' && e.center !== f.center) return false;
    if (f.only && !f.only.has(e.id)) return false;
    if (tab === 'cross') {
      if (f.angle && e.angle !== f.angle) return false;
      if (f.quarter && e.kind !== 'angle' && e.quarter !== f.quarter) return false;
      if (f.quarter && e.kind === 'angle') return false;
    }
    return true;
  });
}

/** Where a selection key lives in the library, for in-page links. */
export interface LibraryTarget {
  tab: LibraryTab;
  id: string;
  line?: number;
}

/** The library entry a tooltip/selection key points to, or `undefined`. */
export function libraryTargetFor(key: string): LibraryTarget | undefined {
  const s = parseSelection(key);
  if (s?.kind === 'gate') return { tab: 'gate', id: String(s.gate) };
  if (s?.kind === 'gateline') return { tab: 'gate', id: String(s.gate), line: s.line };
  if (s?.kind === 'channel') return { tab: 'channel', id: s.id };
  if (s?.kind === 'circuit') return { tab: 'circuit', id: s.circuit };
  if (s?.kind === 'stream') return { tab: 'circuit', id: `stream-${s.stream}` };
  const at = key.indexOf(':');
  const family = key.slice(0, at);
  const value = key.slice(at + 1);
  if (family === 'center' && (CENTER_NAMES as readonly string[]).includes(value)) {
    return { tab: 'center', id: value };
  }
  if (family === 'cross' && ANGLE_ORDER.some((a) => a === value)) {
    const angle = ANGLE_ORDER.find((a) => a === value);
    return angle ? { tab: 'cross', id: angleSlug(angle) } : undefined;
  }
  if (family === 'quarter' && QUARTER_ORDER.some((q) => q === value)) {
    const quarter = QUARTER_ORDER.find((q) => q === value);
    return quarter ? { tab: 'cross', id: quarterId(quarter) } : undefined;
  }
  if (family === 'crossname' && parseCrossId(value)) return { tab: 'cross', id: value };
  if (family === 'type' && Object.hasOwn(TYPES, value)) return { tab: 'type', id: value };
  if (family === 'authority' && Object.hasOwn(AUTHORITIES, value)) {
    return { tab: 'authority', id: value };
  }
  if (family === 'profile' && Object.hasOwn(PROFILES, value)) return { tab: 'profile', id: value };
  if (family === 'term' && GLOSSARY.some((g) => g.term === value)) {
    return { tab: 'glossary', id: value };
  }
  return undefined;
}

/**
 * Ids of the entries of `tab` that belong to a chart (gates it has, channels it
 * has complete, defined centers, its type, authority, profile, cross, angle and
 * quarter, circuits and streams it has channels in). Empty when there is no chart.
 */
export function mineIds(tab: LibraryTab, chart: Chart | undefined): ReadonlySet<string> {
  return mineIdSet(tab, chart);
}

/**
 * Move the chart's own cross to the top of the cross list under a "Your cross"
 * heading (it leaves its angle group, so it is never listed twice).
 *
 * @param entries Cross-tab entries, already filtered.
 * @param marks Marks of the cross tab for the chart.
 */
export function yourCrossFirst(
  entries: readonly LibraryEntry[],
  marks: ReadonlyMap<string, { text: string }>,
): LibraryEntry[] {
  const own = entries.find((e) => e.kind === 'cross' && marks.get(e.id)?.text === 'Your cross');
  if (!own) return [...entries];
  return [{ ...own, group: 'Your cross' }, ...entries.filter((e) => e !== own)];
}

/** Whether a library id of the cross tab names something real (angle, quarter or cross). */
export function isCrossId(id: string): boolean {
  return Boolean(angleFromSlug(id) ?? quarterFromId(id) ?? parseCrossId(id));
}

/** Whether a gate line has content (used to hide empty line lists). */
export function hasLineContent(gate: number): boolean {
  return lineMeaning(gate, 1) !== undefined;
}
