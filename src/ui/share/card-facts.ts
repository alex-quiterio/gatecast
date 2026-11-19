import type { BirthInput, Chart, DynamicKind } from '@/types';
import {
  AUTHORITIES,
  PROFILES,
  circuitBreakdown,
  circuitPairText,
  incarnationCross,
} from '@content';
import { circuitBars, comparisonSentence, dominantSentence } from '@ui/circuit-logic';
import { DYNAMIC_LABELS } from '@ui/composite';
import type { SharePrefs, ShareSubject } from './types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `1985-07-22` becomes `22 Jul 1985`; anything else is returned as is. */
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const month = m ? MONTHS[Number(m[2]) - 1] : undefined;
  return m && month ? `${Number(m[3])} ${month} ${m[1]}` : iso;
}

/** One line of birth details: `22 Jul 1985 · 18:05 · New York, United States`. */
export function birthLine(input: BirthInput): string {
  return [formatDate(input.date), input.time, input.place?.trim()].filter(Boolean).join(' · ');
}

/** A label and its value on a card. */
export interface FactRow {
  label: string;
  value: string;
}

/** What a card says about one person. */
export interface PersonFacts {
  name: string;
  type: string;
  strategy: string;
  profile: string;
  rows: FactRow[];
  birth: string;
  cross: string;
}

/** A circuit bar. */
export interface BarFact {
  label: string;
  count: number;
  percent: number;
}

/** Everything a card prints, as plain strings (before layout and privacy). */
export interface CardFacts {
  kind: 'chart' | 'compare';
  /** Title shown large: the name, or a neutral title when names are hidden. */
  title: string;
  /** Birth line(s); empty when hidden. */
  birth: string;
  people: PersonFacts[];
  bars: BarFact[];
  sentence: string;
  dynamics: { kind: DynamicKind; label: string; count: number }[];
  link: string;
  /** Whether the link carries birth data (it always does for a chart link). */
  linkHasBirthData: boolean;
}

function profileText(chart: Chart): string {
  const name = PROFILES[chart.profile]?.name;
  return name ? `${chart.profile} ${name}` : chart.profile;
}

function personFacts(chart: Chart, input: BirthInput, nameOverride = ''): PersonFacts {
  return {
    name: nameOverride.trim() || input.name.trim(),
    type: chart.type,
    strategy: chart.strategy,
    profile: profileText(chart),
    birth: birthLine(input),
    cross: incarnationCross(chart).title,
    rows: [
      { label: 'Strategy', value: chart.strategy },
      { label: 'Authority', value: AUTHORITIES[chart.authority]?.title ?? chart.authority },
      { label: 'Profile', value: profileText(chart) },
      { label: 'Definition', value: chart.definition },
    ],
  };
}

/**
 * Collect the strings of a card, applying the name and birth privacy options
 * (hidden values are never put in the result, so they cannot leak into the image).
 */
export function cardFacts(subject: ShareSubject, prefs: SharePrefs): CardFacts {
  if (subject.kind === 'chart') {
    const p = personFacts(subject.chart, subject.input, prefs.displayName);
    const breakdown = circuitBreakdown(subject.chart);
    return {
      kind: 'chart',
      title: prefs.showName && p.name ? p.name : 'Human Design chart',
      birth: prefs.showBirth ? p.birth : '',
      people: [p],
      bars: circuitBars(breakdown).map((b) => ({
        label: b.circuit,
        count: b.count,
        percent: b.percent,
      })),
      sentence: dominantSentence(breakdown),
      dynamics: [],
      link: subject.link,
      linkHasBirthData: true,
    };
  }
  const a = personFacts(subject.a, subject.inputA);
  const b = personFacts(subject.b, subject.inputB);
  const ba = circuitBreakdown(subject.a);
  const bb = circuitBreakdown(subject.b);
  const nameA = prefs.showName && a.name ? a.name : 'Person A';
  const nameB = prefs.showName && b.name ? b.name : 'Person B';
  const pair = circuitPairText(ba.dominant, bb.dominant);
  const sentence = comparisonSentence(nameA, ba, nameB, bb);
  const kinds: DynamicKind[] = ['electromagnetic', 'companionship', 'dominance', 'compromise'];
  return {
    kind: 'compare',
    title: `${nameA} & ${nameB}`,
    birth: '',
    people: [
      { ...a, name: nameA, birth: prefs.showBirth ? a.birth : '' },
      { ...b, name: nameB, birth: prefs.showBirth ? b.birth : '' },
    ],
    bars: [],
    sentence: pair ? `${sentence} ${pair.title}.` : sentence,
    dynamics: kinds.map((kind) => ({
      kind,
      label: DYNAMIC_LABELS[kind].label,
      count: subject.comparison.counts[kind],
    })),
    link: subject.link,
    linkHasBirthData: true,
  };
}

/** A file name for the exported card, without extension: `gatecast-sam-example-square`. */
export function cardFileName(facts: CardFacts, format: string, showName: boolean): string {
  const base = showName ? facts.title : facts.kind === 'compare' ? 'comparison' : 'chart';
  const slug = base
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `gatecast-${slug || 'chart'}-${format}`;
}
