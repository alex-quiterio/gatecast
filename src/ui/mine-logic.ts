import { CHANNELS, CIRCUITS, circuitBreakdown, incarnationCross } from '@content';
import { CENTER_NAMES, type BirthInput, type Chart } from '@/types';
import { angleSlug, crossId, quarterId } from './cross-logic';
import type { LibraryTab } from './router';
import { decodePerson, encodePerson } from './share';
import type { StorageLike } from './storage';
import { centerLabel } from './views/common';

/** Storage key of the chart the library marks entries for. */
export const MY_CHART_KEY = 'hd:v1:my-chart';

/**
 * Which chart "my chart" is: the most recently computed one (`auto`, the
 * default), nothing at all (`none`), or one the person picked (`chart`).
 */
export type MyChartSetting =
  { kind: 'auto' } | { kind: 'none' } | { kind: 'chart'; input: BirthInput };

const NONE = 'none';

/** Read the stored setting; anything missing or invalid reads as `auto`. Never throws. */
export function readMyChartSetting(storage: StorageLike | undefined): MyChartSetting {
  let raw: string | null;
  try {
    raw = storage?.getItem(MY_CHART_KEY) ?? null;
  } catch {
    return { kind: 'auto' };
  }
  if (!raw) return { kind: 'auto' };
  if (raw === NONE) return { kind: 'none' };
  const input = decodePerson(raw);
  return input ? { kind: 'chart', input } : { kind: 'auto' };
}

/** Persist the setting (`auto` clears it); failures are ignored. */
export function writeMyChartSetting(
  storage: StorageLike | undefined,
  setting: MyChartSetting,
): void {
  try {
    if (setting.kind === 'auto') storage?.removeItem(MY_CHART_KEY);
    else
      storage?.setItem(MY_CHART_KEY, setting.kind === 'none' ? NONE : encodePerson(setting.input));
  } catch {
    // Storage is blocked or full: the choice still applies for this visit.
  }
}

/** Names longer than this are shortened to initials where space is tight. */
export const SHORT_NAME_MAX = 18;

/**
 * A name that fits a chip: a long name keeps its last word and shortens the
 * others to initials, e.g. `Isabella Maria Costa Ferreira` becomes
 * `I.M.C.Ferreira`. Short and one-word names are returned unchanged.
 */
export function shortName(name: string, max: number = SHORT_NAME_MAX): string {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  const words = trimmed.split(' ');
  if (words.length < 2) return trimmed;
  const last = words.pop() as string;
  return `${words.map((w) => `${Array.from(w)[0]}.`).join('')}${last}`;
}

/** Whether two settings point at the same chart (by encoded input). */
export function sameInput(a: BirthInput | undefined, b: BirthInput | undefined): boolean {
  return Boolean(a && b && encodePerson(a) === encodePerson(b));
}

/** What the library says about one entry in relation to a chart. */
export interface MineMark {
  /** Short visible badge, e.g. `Your lines: 36.6 P, 36.2 D`. */
  text: string;
  /** Full sentence for assistive technology. */
  label: string;
  /** Whether the entry counts as "mine" for the Mine filter and the tab counts. */
  mine: boolean;
}

type Marks = Map<string, MineMark>;

function gateMarks(chart: Chart, marks: Marks): void {
  for (const gate of chart.activeGates) {
    const byLine = new Map<number, Set<'P' | 'D'>>();
    const add = (side: 'P' | 'D', line: number): void => {
      byLine.set(line, (byLine.get(line) ?? new Set()).add(side));
    };
    for (const a of chart.personality) if (a.gate === gate) add('P', a.line);
    for (const a of chart.design) if (a.gate === gate) add('D', a.line);
    const lines = [...byLine.entries()].sort(([x], [y]) => x - y);
    const text = lines
      .map(([line, sides]) => `${gate}.${line} ${[...sides].sort().reverse().join('+')}`)
      .join(', ');
    const spoken = lines
      .map(([line, sides]) => {
        const who = [...sides]
          .sort()
          .reverse()
          .map((s) => (s === 'P' ? 'Personality' : 'Design'))
          .join(' and ');
        return `${gate}.${line} ${who}`;
      })
      .join(', ');
    marks.set(String(gate), {
      text: lines.length ? `Your lines: ${text}` : 'In your chart',
      label: lines.length
        ? `Active in your chart. Your lines: ${spoken}.`
        : 'Active in your chart.',
      mine: true,
    });
  }
}

function channelMarks(chart: Chart, marks: Marks): void {
  const active = new Set(chart.activeGates);
  const complete = new Set(chart.channels.map((c) => `${c.gates[0]}-${c.gates[1]}`));
  for (const id of Object.keys(CHANNELS)) {
    if (complete.has(id)) {
      marks.set(id, { text: 'Complete', label: 'Complete (defined) in your chart.', mine: true });
      continue;
    }
    const [a = 0, b = 0] = id.split('-').map(Number);
    const has = [a, b].filter((g) => active.has(g));
    if (has.length === 1) {
      marks.set(id, {
        text: `One gate only: ${has[0]}`,
        label: `Only gate ${has[0]} of this channel is active in your chart, so it is not complete.`,
        mine: false,
      });
    }
  }
}

function circuitMarks(chart: Chart, marks: Marks): void {
  const breakdown = circuitBreakdown(chart);
  for (const share of breakdown.circuits) {
    const have = share.channels.length;
    const of = CIRCUITS[share.circuit].channelCount;
    const dominant = breakdown.dominant === share.circuit;
    const text = `${have} of ${of} channels${dominant ? ' · leads' : ''}`;
    marks.set(share.circuit, {
      text,
      label: `Your chart has ${have} of the ${of} channels of this circuit${dominant ? ', and it is your leading circuit' : ''}.`,
      mine: have > 0,
    });
  }
  for (const share of breakdown.streams) {
    const have = share.channels.length;
    const of = Object.values(CHANNELS).filter((c) => c.stream === share.stream).length;
    marks.set(`stream-${share.stream}`, {
      text: `${have} of ${of} channels`,
      label: `Your chart has ${have} of the ${of} channels of this stream.`,
      mine: have > 0,
    });
  }
}

/**
 * What every library entry of `tab` says about `chart`, keyed by entry id.
 * Entries that do not apply (or any entry when there is no chart) are absent.
 */
export function mineMarks(
  tab: LibraryTab,
  chart: Chart | undefined,
): ReadonlyMap<string, MineMark> {
  const marks: Marks = new Map();
  if (!chart) return marks;
  switch (tab) {
    case 'gate':
      gateMarks(chart, marks);
      break;
    case 'channel':
      channelMarks(chart, marks);
      break;
    case 'center':
      for (const c of CENTER_NAMES) {
        const defined = chart.definedCenters.includes(c);
        marks.set(c, {
          text: defined ? 'Defined' : 'Open',
          label: `${centerLabel(c)} is ${defined ? 'defined' : 'open'} in your chart.`,
          mine: defined,
        });
      }
      break;
    case 'type':
      marks.set(chart.type, {
        text: 'Your type',
        label: `Your type is ${chart.type}.`,
        mine: true,
      });
      break;
    case 'authority':
      marks.set(chart.authority, {
        text: 'Your authority',
        label: `Your authority is ${chart.authority}.`,
        mine: true,
      });
      break;
    case 'profile': {
      const [conscious = '', unconscious = ''] = chart.profile.split('/');
      marks.set(chart.profile, {
        text: `Your profile · lines ${conscious} and ${unconscious}`,
        label: `Your profile is ${chart.profile}: line ${conscious} in the Personality Sun, line ${unconscious} in the Design Sun.`,
        mine: true,
      });
      break;
    }
    case 'cross': {
      const cross = incarnationCross(chart);
      marks.set(angleSlug(cross.angle), {
        text: 'Your angle',
        label: `Your Incarnation Cross is a ${cross.angle} cross.`,
        mine: true,
      });
      marks.set(quarterId(cross.quarter), {
        text: 'Your quarter',
        label: `Your personality Sun gate is in the ${cross.quarter} quarter.`,
        mine: true,
      });
      marks.set(crossId(cross.angle, cross.gates.personalitySun), {
        text: 'Your cross',
        label: 'This is your Incarnation Cross.',
        mine: true,
      });
      break;
    }
    case 'circuit':
      circuitMarks(chart, marks);
      break;
    case 'glossary':
      break;
  }
  return marks;
}

/** Ids of the entries that count as "mine" (the Mine filter). */
export function mineIdSet(tab: LibraryTab, chart: Chart | undefined): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const [id, mark] of mineMarks(tab, chart)) if (mark.mine) ids.add(id);
  return ids;
}

/** How many entries of a tab are mine, for tab labels; `undefined` where a count says little. */
export function tabCount(tab: LibraryTab, chart: Chart | undefined): number | undefined {
  if (!chart) return undefined;
  if (tab === 'gate') return chart.activeGates.length;
  if (tab === 'channel') return chart.channels.length;
  if (tab === 'center') return chart.definedCenters.length;
  return undefined;
}

/** Spoken form of {@link tabCount}, e.g. `21 of your gates are active`. */
export function tabCountLabel(tab: LibraryTab, count: number): string {
  if (tab === 'gate') return `${count} active in your chart`;
  if (tab === 'channel') return `${count} complete in your chart`;
  return `${count} defined in your chart`;
}

/** The label of the Mine filter chip of a tab. */
export function mineFilterLabel(tab: LibraryTab): string {
  if (tab === 'center') return 'Defined';
  if (tab === 'channel') return 'Complete';
  return 'Mine';
}

/** Props that give a saved list its "use as my chart" stars. */
export function pinProps(
  setting: MyChartSetting,
  choose: (setting: MyChartSetting) => void,
): { myId: string | undefined; onPin: (person: { id: string; input: BirthInput }) => void } {
  const myId = setting.kind === 'chart' ? encodePerson(setting.input) : undefined;
  return {
    myId,
    // Pressing the star of the chart that is already mine lets go of it (back to automatic).
    onPin: (person) =>
      choose(person.id === myId ? { kind: 'auto' } : { kind: 'chart', input: person.input }),
  };
}
