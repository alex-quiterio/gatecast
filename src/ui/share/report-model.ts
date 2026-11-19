import type { BirthInput, Chart, ComparedChannel, Comparison, DynamicKind } from '@/types';
import {
  AUTHORITIES,
  CENTERS,
  CHANNELS,
  CIRCUITS,
  GATES,
  GLOSSARY,
  PROFILES,
  QUARTERS,
  TYPES,
  circuitBreakdown,
  circuitPairText,
  crossDescription,
  incarnationCross,
  lineMeaning,
} from '@content';
import type { GlossaryEntry } from '@content';
import { channelKey } from '@engine';
import { circuitBars, comparisonSentence, dominantSentence } from '@ui/circuit-logic';
import { DYNAMIC_LABELS } from '@ui/composite';
import { PLANET_GLYPHS, TEXT_PRESENTATION } from '@ui/palette';
import { activationLabel, centerLabel } from '@ui/views/common';
import { birthLine } from './card-facts';
import type { BarFact } from './card-facts';
import type { PaperId, ReportThemeId, SectionId, SharePrefs, ShareSubject } from './types';
import { SECTION_IDS } from './types';

/** One center with its one-line meaning. */
export interface CenterRow {
  id: string;
  label: string;
  state: 'Defined' | 'Open';
  /** What it tends to mean in this state. */
  text: string;
  motor: boolean;
}

/** One complete channel. */
export interface ChannelRow {
  id: string;
  name: string;
  circuit: string;
  stream: string;
  summary: string;
}

/** One planet's activation. */
export interface ActivationRow {
  planet: string;
  glyph: string;
  label: string;
  gate: number;
  gateName: string;
  lineTitle: string;
  center: string;
}

/** One gate.line the chart activates, with what is written about it. */
export interface LineEntry {
  key: string;
  gate: number;
  line: number;
  gateName: string;
  source: 'Personality' | 'Design' | 'Personality and Design';
  title: string;
  summary: string;
  flow?: string;
  stress?: string;
}

/** Everything the report prints about one person. */
export interface PersonModel {
  name: string;
  birth: string;
  type: string;
  tagline?: string;
  typeSummary?: string;
  strategy: string;
  notSelf: string;
  authority: string;
  authoritySummary?: string;
  profile: string;
  definition: string;
  cross: { title: string; angle: string; quarter: string; theme?: string; summary?: string };
  centers: CenterRow[];
  channels: ChannelRow[];
  hangingGates: number[];
  personality: ActivationRow[];
  design: ActivationRow[];
  bars: BarFact[];
  circuitSentence: string;
  dominant?: { title: string; summary: string };
  lines: LineEntry[];
}

/** The two-person part of a comparison report. */
export interface CompareModel {
  counts: { kind: DynamicKind; label: string; meaning: string; count: number }[];
  channels: { id: string; name: string; dynamic: string; owner: string }[];
  compositeDefined: string[];
  newlyDefined: string[];
  sentence: string;
  pairTitle?: string;
  pairSummary?: string;
}

/** The whole report as data. */
export interface ReportModel {
  kind: 'chart' | 'compare';
  title: string;
  preparedFor: string;
  preparedBy: string;
  contact: string;
  logo: string;
  generated: string;
  paper: PaperId;
  theme: ReportThemeId;
  sections: SectionId[];
  people: PersonModel[];
  compare?: CompareModel;
  glossary: GlossaryEntry[];
  link: string;
  showQr: boolean;
  watermark: boolean;
  notes: string;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** `19 November 2026`. */
export function longDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()] ?? ''} ${date.getFullYear()}`;
}

/** The first sentence of the shared disclaimer, for the page footer. */
export function shortDisclaimer(full: string): string {
  const end = full.indexOf('. ');
  return end > 0 ? full.slice(0, end + 1) : full;
}

function activationRows(chart: Chart, which: 'personality' | 'design'): ActivationRow[] {
  return chart[which].map((a) => ({
    planet:
      a.planet === 'NorthNode' ? 'North Node' : a.planet === 'SouthNode' ? 'South Node' : a.planet,
    glyph: `${PLANET_GLYPHS[a.planet]}${TEXT_PRESENTATION}`,
    label: activationLabel(a),
    gate: a.gate,
    gateName: GATES[a.gate]?.name ?? '',
    lineTitle: lineMeaning(a.gate, a.line)?.title ?? '',
    center: centerLabel(a.center),
  }));
}

function lineEntries(chart: Chart): LineEntry[] {
  const found = new Map<string, { gate: number; line: number; p: boolean; d: boolean }>();
  const add = (gate: number, line: number, which: 'p' | 'd'): void => {
    const key = `${gate}.${line}`;
    const entry = found.get(key) ?? { gate, line, p: false, d: false };
    entry[which] = true;
    found.set(key, entry);
  };
  chart.personality.forEach((a) => add(a.gate, a.line, 'p'));
  chart.design.forEach((a) => add(a.gate, a.line, 'd'));
  const entries: LineEntry[] = [];
  for (const e of [...found.values()].sort((a, b) => a.gate - b.gate || a.line - b.line)) {
    const meaning = lineMeaning(e.gate, e.line);
    if (!meaning?.title || !meaning.summary) continue;
    const entry: LineEntry = {
      key: `${e.gate}.${e.line}`,
      gate: e.gate,
      line: e.line,
      gateName: GATES[e.gate]?.name ?? '',
      source: e.p && e.d ? 'Personality and Design' : e.p ? 'Personality' : 'Design',
      title: meaning.title,
      summary: meaning.summary,
    };
    if (meaning.flow) entry.flow = meaning.flow;
    if (meaning.stress) entry.stress = meaning.stress;
    entries.push(entry);
  }
  return entries;
}

function personModel(
  chart: Chart,
  input: BirthInput,
  nameOverride: string,
  showBirth: boolean,
): PersonModel {
  const cross = incarnationCross(chart);
  const desc = crossDescription(cross.angle, cross.gates.personalitySun);
  const typeContent = TYPES[chart.type];
  const authority = AUTHORITIES[chart.authority];
  const breakdown = circuitBreakdown(chart);
  const dominant = breakdown.dominant ? CIRCUITS[breakdown.dominant] : undefined;
  const profileName = PROFILES[chart.profile]?.name;
  const centers: CenterRow[] = [
    ...chart.definedCenters.map((c) => ({ c, state: 'Defined' as const })),
    ...chart.openCenters.map((c) => ({ c, state: 'Open' as const })),
  ].map(({ c, state }) => ({
    id: c,
    label: centerLabel(c),
    state,
    text: (state === 'Defined' ? CENTERS[c]?.defined : CENTERS[c]?.open) ?? '',
    motor: CENTERS[c]?.motor ?? false,
  }));
  const person: PersonModel = {
    name: nameOverride.trim() || input.name.trim(),
    birth: showBirth ? birthLine(input) : '',
    type: chart.type,
    strategy: chart.strategy,
    notSelf: chart.notSelfTheme,
    authority: authority?.title ?? chart.authority,
    profile: profileName ? `${chart.profile} ${profileName}` : chart.profile,
    definition: chart.definition,
    cross: {
      title: cross.title,
      angle: cross.angle,
      quarter: QUARTERS[cross.quarter]?.title ?? cross.quarter,
    },
    centers,
    channels: chart.channels.map((c) => {
      const info = CHANNELS[channelKey(c.gates[0], c.gates[1])];
      return {
        id: `${c.gates[0]}-${c.gates[1]}`,
        name: info?.name ?? '',
        circuit: info?.circuit ?? '',
        stream: info?.stream ?? '',
        summary: info?.summary ?? '',
      };
    }),
    hangingGates: chart.hangingGates,
    personality: activationRows(chart, 'personality'),
    design: activationRows(chart, 'design'),
    bars: circuitBars(breakdown).map((b) => ({
      label: b.circuit,
      count: b.count,
      percent: b.percent,
    })),
    circuitSentence: dominantSentence(breakdown),
    lines: lineEntries(chart),
  };
  if (typeContent?.tagline) person.tagline = typeContent.tagline;
  if (typeContent?.summary) person.typeSummary = typeContent.summary;
  if (authority?.summary) person.authoritySummary = authority.summary;
  if (desc?.theme) person.cross.theme = desc.theme;
  if (desc?.summary) person.cross.summary = desc.summary;
  if (dominant) person.dominant = { title: dominant.title, summary: dominant.summary };
  return person;
}

function compareModel(
  subject: Extract<ShareSubject, { kind: 'compare' }>,
  nameA: string,
  nameB: string,
): CompareModel {
  const c: Comparison = subject.comparison;
  const kinds: DynamicKind[] = ['electromagnetic', 'companionship', 'dominance', 'compromise'];
  const ba = circuitBreakdown(subject.a);
  const bb = circuitBreakdown(subject.b);
  const pair = circuitPairText(ba.dominant, bb.dominant);
  const owner = (ch: ComparedChannel): string =>
    ch.owner === 'a' ? nameA : ch.owner === 'b' ? nameB : '';
  const model: CompareModel = {
    counts: kinds.map((kind) => ({
      kind,
      label: DYNAMIC_LABELS[kind].label,
      meaning: DYNAMIC_LABELS[kind].meaning,
      count: c.counts[kind],
    })),
    channels: c.channels.map((ch) => ({
      id: `${ch.gates[0]}-${ch.gates[1]}`,
      name: CHANNELS[channelKey(ch.gates[0], ch.gates[1])]?.name ?? '',
      dynamic: DYNAMIC_LABELS[ch.kind].label,
      owner: owner(ch),
    })),
    compositeDefined: c.compositeDefinedCenters.map(centerLabel),
    newlyDefined: c.newlyDefinedCenters.map(centerLabel),
    sentence: comparisonSentence(nameA, ba, nameB, bb),
  };
  if (pair) {
    model.pairTitle = pair.title;
    model.pairSummary = pair.summary;
  }
  return model;
}

/** Glossary entries for the terms a report of these people uses. */
export function usedGlossary(people: readonly PersonModel[], compare: boolean): GlossaryEntry[] {
  const used = new Set<string>([
    'strategy',
    'authority',
    'type',
    'not-self theme',
    'profile',
    'incarnation cross',
    'personality',
    'design',
    'gate',
    'line',
    'channel',
    'center',
    'defined',
    'open',
    'definition',
    'circuit',
    'motor',
    'aura',
    'signature',
    'quarter',
  ]);
  for (const p of people) {
    used.add(p.cross.angle.toLowerCase());
    if (p.hangingGates.length > 0) used.add('hanging gate');
    for (const b of p.bars) if (b.count > 0) used.add(`${b.label.toLowerCase()} circuit`);
  }
  if (compare) used.add('electromagnetic');
  return GLOSSARY.filter((e) => used.has(e.term.toLowerCase()));
}

/** Everything the options say about what to include, from the shared preferences. */
export type ReportOptions = Pick<
  SharePrefs,
  | 'paper'
  | 'reportTheme'
  | 'sections'
  | 'preparedBy'
  | 'contact'
  | 'logo'
  | 'displayName'
  | 'showBirth'
  | 'showQr'
  | 'showWatermark'
  | 'notes'
>;

/**
 * Build the report as plain data: no layout, nothing undefined. Optional
 * content that has not been written yet is left out.
 *
 * @param subject The chart or comparison.
 * @param options The user's choices (sections, privacy, practitioner details).
 * @param now The generation date.
 */
export function buildReportModel(
  subject: ShareSubject,
  options: ReportOptions,
  now: Date = new Date(),
): ReportModel {
  const sections = SECTION_IDS.filter((id) => options.sections[id]);
  const base = {
    preparedBy: options.preparedBy.trim(),
    contact: options.contact.trim(),
    logo: options.logo,
    generated: longDate(now),
    paper: options.paper,
    theme: options.reportTheme,
    sections,
    link: subject.link,
    showQr: options.showQr,
    watermark: options.showWatermark,
    notes: options.notes.trim(),
  };
  if (subject.kind === 'chart') {
    const person = personModel(
      subject.chart,
      subject.input,
      options.displayName,
      options.showBirth,
    );
    return {
      ...base,
      kind: 'chart',
      title: 'Human Design chart report',
      preparedFor: person.name,
      people: [person],
      glossary: usedGlossary([person], false),
    };
  }
  const a = personModel(subject.a, subject.inputA, '', options.showBirth);
  const b = personModel(subject.b, subject.inputB, '', options.showBirth);
  const nameA = a.name || 'Person A';
  const nameB = b.name || 'Person B';
  a.name = nameA;
  b.name = nameB;
  return {
    ...base,
    kind: 'compare',
    title: 'Human Design comparison report',
    preparedFor: options.displayName.trim() || `${nameA} & ${nameB}`,
    people: [a, b],
    compare: compareModel(subject, nameA, nameB),
    glossary: usedGlossary([a, b], true),
  };
}
