import type { ChannelInfo } from '@/types';

/** Theme circuits that group channels. */
export type Circuit = 'Individual' | 'Tribal' | 'Collective' | 'Integration';

/**
 * The streams (sub-circuits) a circuit divides into. Individual: Knowing and
 * Centering. Tribal: Ego and Defense. Collective: Logic and Abstract. The
 * Integration circuit (10-20, 10-57, 20-34, 34-57) has no streams.
 */
export type Stream = 'Knowing' | 'Centering' | 'Ego' | 'Defense' | 'Logic' | 'Abstract';

/** How a channel is powered: by the Sacral, by another motor into the Throat, or neither. */
export type ChannelType = 'Generated' | 'Projected' | 'Manifested';

export interface GateContent {
  readonly number: number;
  /** The standard Human Design gate name. */
  readonly name: string;
  /** The matching I Ching hexagram name (King Wen number equals gate number). */
  readonly iching: string;
  /** At most six words. */
  readonly keynote: string;
  readonly summary: string;
  readonly whenDefined?: string;
}

export interface ChannelContent {
  readonly name: string;
  readonly summary: string;
  readonly circuit: Circuit;
  /** Set for every channel except those of the Integration circuit. */
  readonly stream?: Stream;
  readonly channelType: ChannelType;
}

export interface CenterContent {
  readonly title: string;
  readonly motor: boolean;
  readonly function: string;
  readonly theme: string;
  readonly defined: string;
  readonly open: string;
  /** The question an open center tends to ask when it is not being itself. */
  readonly question: string;
}

export interface TypeContent {
  readonly tagline: string;
  readonly summary: string;
  readonly strategy: string;
  readonly notSelfTheme: string;
  readonly signature: string;
  readonly aura: string;
  /** Approximate share of the population, e.g. `~37%`. */
  readonly share: string;
  readonly advice: readonly [string, string, string];
}

export interface AuthorityContent {
  readonly title: string;
  readonly summary: string;
  readonly howToUse: string;
}

export interface ProfileContent {
  readonly name: string;
  readonly summary: string;
}

export interface LineContent {
  readonly name: string;
  readonly summary: string;
}

export interface DefinitionContent {
  readonly title: string;
  readonly summary: string;
}

export interface PlanetContent {
  readonly glyph: string;
  readonly label: string;
  readonly meaning: string;
}

export interface DynamicContent {
  readonly title: string;
  readonly summary: string;
  readonly example: string;
}

export interface GlossaryEntry {
  readonly term: string;
  readonly definition: string;
}

export interface Tip {
  readonly title: string;
  readonly body: string;
}

// ---------------------------------------------------------------------------
// Line meanings, incarnation crosses and circuits
// ---------------------------------------------------------------------------

/** What one line of one gate tends to mean (a gate has six lines). */
export interface GateLineContent {
  /** Two to five words, e.g. `Testing the ground`. */
  readonly title: string;
  /** One or two sentences, at most 170 characters, hedged ("tends to"). */
  readonly summary: string;
  /** What it tends to look like when this line is flowing: specific behaviors, at most 170 characters. */
  readonly flow?: string;
  /** What it can look like under pressure, framed as a pattern and never a flaw, at most 170 characters. */
  readonly stress?: string;
}

/** The six lines of a gate, index 0 is line 1. */
export type GateLines = readonly [
  GateLineContent,
  GateLineContent,
  GateLineContent,
  GateLineContent,
  GateLineContent,
  GateLineContent,
];

/** Line meanings keyed by gate number. Complete when it has all 64 gates. */
export type GateLinesTable = Partial<Record<number, GateLines>>;

/** The angle of an Incarnation Cross, set by the Profile. */
export type CrossAngle = 'Right Angle' | 'Juxtaposition' | 'Left Angle';

/** The four quarters of the wheel, each a 16-gate theme. */
export type Quarter = 'Initiation' | 'Civilization' | 'Duality' | 'Mutation';

/** The Incarnation Cross of a chart: its angle, quarter, name and four gates. */
export interface IncarnationCross {
  readonly angle: CrossAngle;
  /** The quarter of the personality Sun gate. */
  readonly quarter: Quarter;
  /** The traditional name (e.g. `the Sphinx`) when it is known and verified; otherwise `undefined`. */
  readonly name: string | undefined;
  /**
   * Display title: `Right Angle Cross of the Sphinx (13/7 | 1/2)` when the name
   * is known, `Right Angle Cross (13/7 | 1/2)` when it is not.
   */
  readonly title: string;
  readonly gates: {
    readonly personalitySun: number;
    readonly personalityEarth: number;
    readonly designSun: number;
    readonly designEarth: number;
  };
}

export interface CrossAngleContent {
  readonly title: string;
  readonly summary: string;
  /** The profiles that give this angle, e.g. `['1/3', '1/4', ...]`. */
  readonly profiles: readonly string[];
}

export interface QuarterContent {
  readonly title: string;
  /** A few words, e.g. `Purpose through mind`. */
  readonly theme: string;
  readonly summary: string;
  /** The 16 gates of this quarter. */
  readonly gates: readonly number[];
}

export interface CircuitContent {
  readonly title: string;
  readonly tagline: string;
  readonly summary: string;
  /** What living this circuit tends to look like, and its common stress. */
  readonly theme: string;
  readonly streams: readonly Stream[];
  /** How many of the 36 channels belong to it. */
  readonly channelCount: number;
  /** What it tends to look like when this circuit makes up most of a chart. */
  readonly strong?: string;
  /** What it tends to look like when a chart has none of this circuit (common, and not a lack). */
  readonly absent?: string;
  /** How people with this circuit tend to connect with others. */
  readonly relating?: string;
  /** Three small things to notice or try over a week, framed as experiments. */
  readonly experiments?: readonly string[];
}

export interface StreamContent {
  readonly title: string;
  readonly circuit: Circuit;
  readonly summary: string;
  /** What this stream tends to look like when it is strong in a chart. */
  readonly strong?: string;
  /** Its common stress, framed as a pattern and never a flaw. */
  readonly stress?: string;
}

/** How two people whose leading circuits are these tend to meet. */
export interface CircuitPairContent {
  readonly title: string;
  readonly summary: string;
}

/** The four gates of one Incarnation Cross, as listed in the standard tables. */
export interface CrossGateSet {
  readonly personalitySun: number;
  readonly personalityEarth: number;
  readonly designSun: number;
  readonly designEarth: number;
}

/** One of the 192 Incarnation Crosses. */
export interface CrossEntry {
  readonly angle: CrossAngle;
  /** The personality Sun gate (with the angle, this identifies the cross). */
  readonly sunGate: number;
  /** The traditional name, e.g. `the Sphinx`. */
  readonly name: string;
  readonly gates: CrossGateSet;
}

/** What one cross tends to mean. */
export interface CrossDescription {
  /** A short phrase, at most eight words, e.g. `Building lasting structure for others`. */
  readonly theme: string;
  /** Two or three sentences, at most 320 characters, hedged. */
  readonly summary: string;
}

/** One circuit's share of a chart's complete channels. */
export interface CircuitShare {
  readonly circuit: Circuit;
  readonly channels: readonly ChannelInfo[];
  /** `channels.length / totalChannels`, 0 when the chart has no channels. */
  readonly share: number;
}

/** One stream's share of a chart's complete channels. */
export interface StreamShare {
  readonly stream: Stream;
  readonly circuit: Circuit;
  readonly channels: readonly ChannelInfo[];
  readonly share: number;
}

/** How a chart's complete channels spread across circuits and streams. */
export interface CircuitBreakdown {
  readonly totalChannels: number;
  /** Always four entries, in the order Individual, Tribal, Collective, Integration. */
  readonly circuits: readonly CircuitShare[];
  /** Always six entries: Knowing, Centering, Ego, Defense, Logic, Abstract. */
  readonly streams: readonly StreamShare[];
  /** The circuit with the most channels; `undefined` with no channels or a tie for first. */
  readonly dominant: Circuit | undefined;
}
