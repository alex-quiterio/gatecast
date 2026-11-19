import { CENTER_GATES, CHANNEL_LIST } from '@engine';
import {
  AUTHORITIES,
  CENTERS,
  CHANNELS,
  CIRCUITS,
  CROSS_ANGLES,
  GATES,
  PROFILES,
  QUARTERS,
  STREAMS,
  TYPES,
  crossAngleFor,
  crossEntry,
  incarnationCross,
  quarterOfGate,
} from '@content';
import type { AuthorityName, CenterName, Chart, ChartType } from '@/types';
import { CENTER_NAMES } from '@/types';
import { angleSlug, crossId, parseCrossId, quarterId } from './cross-logic';
import { libraryTargetFor } from './library-logic';
import { buildHash, type LibraryTab } from './router';
import { parseSelection } from './selection-logic';
import { centerLabel, channelId } from './views/common';

/** One chip of a "Related" row: where it goes and how it reads. */
export interface RelatedLink {
  /** Selection key, e.g. `gate:36`; the library resolves it to a tab and id. */
  tip: string;
  text: string;
}

/** A labelled row of related chips. */
export interface RelatedGroup {
  label: string;
  links: RelatedLink[];
}

/** The authorities each type can have (what the chart rules allow). */
export const AUTHORITIES_OF_TYPE: Readonly<Record<ChartType, readonly AuthorityName[]>> = {
  Generator: ['Emotional', 'Sacral', 'Splenic'],
  'Manifesting Generator': ['Emotional', 'Sacral', 'Splenic'],
  Manifestor: ['Emotional', 'Splenic', 'Ego'],
  Projector: ['Emotional', 'Splenic', 'Ego', 'Self-Projected', 'Mental'],
  Reflector: ['Lunar'],
};

function centerOfGate(gate: number): CenterName | undefined {
  return CENTER_NAMES.find((c) => CENTER_GATES[c]?.includes(gate));
}

function gateLink(gate: number): RelatedLink {
  return { tip: `gate:${gate}`, text: `${gate} ${GATES[gate]?.name ?? ''}`.trim() };
}

function centerLink(center: CenterName): RelatedLink {
  return { tip: `center:${center}`, text: CENTERS[center]?.title ?? centerLabel(center) };
}

function channelLink(id: string): RelatedLink {
  return { tip: `channel:${id}`, text: `${id} ${CHANNELS[id]?.name ?? ''}`.trim() };
}

function unique(links: RelatedLink[]): RelatedLink[] {
  const seen = new Set<string>();
  return links.filter((l) => !seen.has(l.tip) && seen.add(l.tip));
}

function circuitLinks(ids: readonly string[]): RelatedGroup[] {
  const circuits: RelatedLink[] = [];
  const streams: RelatedLink[] = [];
  for (const id of ids) {
    const c = CHANNELS[id];
    if (!c) continue;
    circuits.push({ tip: `circuit:${c.circuit}`, text: `${CIRCUITS[c.circuit].title} circuit` });
    if (c.stream)
      streams.push({ tip: `stream:${c.stream}`, text: `${STREAMS[c.stream].title} stream` });
  }
  return [
    { label: 'Circuit', links: unique(circuits) },
    { label: 'Stream', links: unique(streams) },
  ];
}

function channelsOfGate(gate: number): string[] {
  return Object.keys(CHANNELS).filter((id) => id.split('-').map(Number).includes(gate));
}

/**
 * The chips a library entry links to, in labelled rows: a gate to its center,
 * channels, partner gates, circuit and lines; a channel to its gates, centers,
 * circuit and stream; and so on. Groups with nothing in them are dropped.
 *
 * @param tab Library tab of the entry.
 * @param id Entry id within the tab.
 */
export function relatedFor(tab: LibraryTab, id: string): RelatedGroup[] {
  const groups: RelatedGroup[] = [];
  switch (tab) {
    case 'gate': {
      const gate = Number(id);
      const center = centerOfGate(gate);
      const channels = channelsOfGate(gate);
      const partners = channels.map((c) => Number(c.split('-').find((g) => Number(g) !== gate)));
      groups.push({ label: 'Center', links: center ? [centerLink(center)] : [] });
      groups.push({ label: 'Channels', links: channels.map(channelLink) });
      groups.push({ label: 'Partner gates', links: partners.map(gateLink) });
      groups.push(...circuitLinks(channels));
      groups.push({
        label: 'Lines',
        links: [1, 2, 3, 4, 5, 6].map((line) => ({
          tip: `gateline:${gate}.${line}`,
          text: `Line ${line}`,
        })),
      });
      break;
    }
    case 'channel': {
      const gates = id.split('-').map(Number);
      const info = CHANNEL_LIST.find((c) => channelId(c) === id);
      groups.push({ label: 'Gates', links: gates.map(gateLink) });
      groups.push({ label: 'Centers', links: (info?.centers ?? []).map(centerLink) });
      groups.push(...circuitLinks([id]));
      break;
    }
    case 'center': {
      const center = CENTER_NAMES.find((c) => c === id);
      if (!center) break;
      groups.push({ label: 'Gates', links: (CENTER_GATES[center] ?? []).map(gateLink) });
      groups.push({
        label: 'Channels',
        links: CHANNEL_LIST.filter((c) => c.centers.includes(center)).map((c) =>
          channelLink(channelId(c)),
        ),
      });
      break;
    }
    case 'type': {
      const options = (AUTHORITIES_OF_TYPE as Record<string, readonly AuthorityName[] | undefined>)[
        id
      ];
      groups.push({
        label: 'Authority options',
        links: (options ?? []).map((a) => ({ tip: `authority:${a}`, text: AUTHORITIES[a].title })),
      });
      break;
    }
    case 'authority': {
      const types = (Object.keys(TYPES) as ChartType[]).filter((t) =>
        AUTHORITIES_OF_TYPE[t].some((a) => a === id),
      );
      groups.push({
        label: 'Types that can have it',
        links: types.map((t) => ({ tip: `type:${t}`, text: t })),
      });
      break;
    }
    case 'profile': {
      const profile = PROFILES[id];
      if (!profile) break;
      groups.push({
        label: 'Cross angle',
        links: [{ tip: `cross:${crossAngleFor(id)}`, text: CROSS_ANGLES[crossAngleFor(id)].title }],
      });
      break;
    }
    case 'circuit': {
      if (id.startsWith('stream-')) {
        const stream = id.slice('stream-'.length);
        const content = (
          STREAMS as Record<string, (typeof STREAMS)[keyof typeof STREAMS] | undefined>
        )[stream];
        if (!content) break;
        groups.push({
          label: 'Circuit',
          links: [
            {
              tip: `circuit:${content.circuit}`,
              text: `${CIRCUITS[content.circuit].title} circuit`,
            },
          ],
        });
        groups.push({
          label: 'Channels',
          links: Object.keys(CHANNELS)
            .filter((c) => CHANNELS[c]?.stream === stream)
            .map(channelLink),
        });
        break;
      }
      const content = (
        CIRCUITS as Record<string, (typeof CIRCUITS)[keyof typeof CIRCUITS] | undefined>
      )[id];
      if (!content) break;
      groups.push({
        label: 'Streams',
        links: content.streams.map((s) => ({
          tip: `stream:${s}`,
          text: `${STREAMS[s].title} stream`,
        })),
      });
      groups.push({
        label: 'Channels',
        links: Object.keys(CHANNELS)
          .filter((c) => CHANNELS[c]?.circuit === id)
          .map(channelLink),
      });
      break;
    }
    case 'cross': {
      const parsed = parseCrossId(id);
      if (parsed) {
        const entry = crossEntry(parsed.angle, parsed.gate);
        const gates = entry
          ? [
              entry.gates.personalitySun,
              entry.gates.personalityEarth,
              entry.gates.designSun,
              entry.gates.designEarth,
            ]
          : [parsed.gate];
        groups.push({ label: 'Its four gates', links: unique(gates.map(gateLink)) });
        const quarter = quarterOfGate(parsed.gate);
        groups.push({
          label: 'Quarter',
          links: quarter ? [{ tip: `quarter:${quarter}`, text: QUARTERS[quarter].title }] : [],
        });
        groups.push({
          label: 'Angle',
          links: [{ tip: `cross:${parsed.angle}`, text: CROSS_ANGLES[parsed.angle].title }],
        });
      } else {
        const angle = (Object.keys(CROSS_ANGLES) as (keyof typeof CROSS_ANGLES)[]).find(
          (a) => angleSlug(a) === id,
        );
        if (angle) {
          groups.push({
            label: 'Profiles with this angle',
            links: CROSS_ANGLES[angle].profiles.map((p) => ({ tip: `profile:${p}`, text: p })),
          });
        }
        const quarter = (Object.keys(QUARTERS) as (keyof typeof QUARTERS)[]).find(
          (q) => quarterId(q) === id,
        );
        if (quarter) {
          groups.push({
            label: 'Its 16 gates',
            links: QUARTERS[quarter].gates.map(gateLink),
          });
        }
      }
      break;
    }
    case 'glossary':
      break;
  }
  return groups.filter((g) => g.links.length > 0);
}

/** A link from the chart's inspector into the library. */
export interface ReadMoreLink {
  text: string;
  /** Hash route, e.g. `#/library/gate/36`. */
  hash: string;
}

function readMore(tip: string, text: string): ReadMoreLink | undefined {
  const target = libraryTargetFor(tip);
  if (!target) return undefined;
  return { text, hash: buildHash({ name: 'library', ...target }) };
}

/**
 * "Read more in the Library" links for what is selected in the inspector (a
 * gate, channel, center, circuit, stream or cross), or, with nothing selected,
 * for the chart's type, authority, profile and cross.
 *
 * @param selected The inspector's selection key, if any.
 * @param chart The chart being read.
 */
export function readMoreLinks(selected: string | undefined, chart: Chart): ReadMoreLink[] {
  const links: (ReadMoreLink | undefined)[] = [];
  const sel = parseSelection(selected);
  if (sel?.kind === 'gate' || sel?.kind === 'gateline') {
    const center = centerOfGate(sel.gate);
    const line = sel.kind === 'gateline' ? sel.line : undefined;
    links.push(
      readMore(
        line ? `gateline:${sel.gate}.${line}` : `gate:${sel.gate}`,
        line ? `Gate ${sel.gate}, line ${line}` : `Gate ${sel.gate}`,
      ),
    );
    if (center) links.push(readMore(`center:${center}`, `${centerLabel(center)} center`));
  } else if (sel?.kind === 'channel') {
    links.push(readMore(`channel:${sel.id}`, `Channel ${sel.id}`));
    const c = CHANNELS[sel.id];
    if (c) links.push(readMore(`circuit:${c.circuit}`, `${c.circuit} circuit`));
  } else if (sel?.kind === 'circuit') {
    links.push(readMore(`circuit:${sel.circuit}`, `${sel.circuit} circuit`));
  } else if (sel?.kind === 'stream') {
    links.push(readMore(`stream:${sel.stream}`, `${sel.stream} stream`));
  } else if (sel?.kind === 'other' && selected) {
    const at = selected.indexOf(':');
    const family = selected.slice(0, at);
    const value = selected.slice(at + 1);
    if (family === 'center')
      links.push(readMore(selected, `${centerLabel(value as CenterName)} center`));
    else if (family === 'cross') links.push(readMore(selected, `${value} cross`));
    else if (family === 'quarter') links.push(readMore(selected, `${value} quarter`));
    else if (family === 'crossname') links.push(readMore(selected, 'This cross'));
    else links.push(readMore(selected, 'This entry'));
  }
  if (links.length === 0 || !selected) {
    links.length = 0;
    const cross = incarnationCross(chart);
    links.push(
      readMore(`type:${chart.type}`, `Type: ${chart.type}`),
      readMore(`authority:${chart.authority}`, `Authority: ${chart.authority}`),
      readMore(`profile:${chart.profile}`, `Profile ${chart.profile}`),
      readMore(
        `crossname:${crossId(cross.angle, cross.gates.personalitySun)}`,
        'Your Incarnation Cross',
      ),
    );
  }
  return links.filter((l): l is ReadMoreLink => l !== undefined);
}
