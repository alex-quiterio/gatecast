/**
 * Shared types: the contract between the engine, the content, the SVG
 * renderers and the app. Change them only together with every consumer.
 */

export const CENTER_NAMES = [
  'Head',
  'Ajna',
  'Throat',
  'G',
  'Heart',
  'Spleen',
  'SolarPlexus',
  'Sacral',
  'Root',
] as const;
export type CenterName = (typeof CENTER_NAMES)[number];

/** The 13 bodies of a Human Design chart, in chart order. */
export const PLANET_NAMES = [
  'Sun',
  'Earth',
  'Moon',
  'NorthNode',
  'SouthNode',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
] as const;
export type PlanetName = (typeof PLANET_NAMES)[number];

export type ChartType =
  'Generator' | 'Manifesting Generator' | 'Manifestor' | 'Projector' | 'Reflector';

export type AuthorityName =
  'Emotional' | 'Sacral' | 'Splenic' | 'Ego' | 'Self-Projected' | 'Mental' | 'Lunar';

export type DefinitionName =
  | 'No Definition'
  | 'Single Definition'
  | 'Split Definition'
  | 'Triple Split Definition'
  | 'Quadruple Split Definition';

/** Which of the two charts activates a gate. */
export type GateSource = 'personality' | 'design' | 'both';

/** What a person types into the form. */
export interface BirthInput {
  name: string;
  /** Local civil date, `YYYY-MM-DD`. */
  date: string;
  /** Local clock time, 24h `HH:MM`. */
  time: string;
  /** Offset from UTC in hours at the moment of birth, e.g. `1`, `-5`, `5.5`. */
  utcOffset: number;
  /** Optional IANA zone, kept only to show it back to the person. */
  timeZone?: string;
  /** Optional birth place as displayed, e.g. `Forlì, Italy`. Display only. */
  place?: string;
}

/** One planet's position on the gate wheel. */
export interface Activation {
  planet: PlanetName;
  /** Ecliptic longitude in degrees, 0 <= longitude < 360. */
  longitude: number;
  gate: number;
  /** 1..6 */
  line: number;
  /** 1..6 */
  color: number;
  /** 1..6 */
  tone: number;
  center: CenterName;
}

export interface ChannelInfo {
  /** Ascending, e.g. `[20, 34]`. */
  gates: [number, number];
  centers: [CenterName, CenterName];
}

export interface Chart {
  input: BirthInput;
  /** Birth moment in UTC, ISO 8601. */
  birthUtc: string;
  /** The Design moment (Sun 88 degrees earlier) in UTC, ISO 8601. */
  designUtc: string;
  /** Conscious activations, in `PLANET_NAMES` order. */
  personality: Activation[];
  /** Unconscious activations, in `PLANET_NAMES` order. */
  design: Activation[];

  type: ChartType;
  strategy: string;
  notSelfTheme: string;
  authority: AuthorityName;
  /** e.g. `5/1`: personality Sun line / design Sun line. */
  profile: string;
  definition: DefinitionName;
  /** Groups of connected defined centers. */
  components: CenterName[][];

  definedCenters: CenterName[];
  openCenters: CenterName[];
  /** Complete channels, sorted by lowest gate. */
  channels: ChannelInfo[];
  /** Every active gate, ascending. */
  activeGates: number[];
  /** Active gates that are not part of a complete channel, ascending. */
  hangingGates: number[];
  gateSources: Record<number, GateSource>;
  /** The four Sun/Earth gates that name the Incarnation Cross. */
  crossGates: {
    personalitySun: number;
    personalityEarth: number;
    designSun: number;
    designEarth: number;
  };
}

/** How two people's channels relate (the four relationship dynamics). */
export type DynamicKind = 'electromagnetic' | 'companionship' | 'dominance' | 'compromise';

export interface ComparedChannel extends ChannelInfo {
  kind: DynamicKind;
  /** For dominance and compromise: who has the complete channel. */
  owner?: 'a' | 'b';
}

export interface Comparison {
  /** Every channel that is complete for at least one person, or in the composite. */
  channels: ComparedChannel[];
  /** Centers defined in the composite of both charts. */
  compositeDefinedCenters: CenterName[];
  compositeOpenCenters: CenterName[];
  /** Defined in the composite but in neither person's own chart. */
  newlyDefinedCenters: CenterName[];
  /** Complete channels in the composite of both charts. */
  compositeChannels: ChannelInfo[];
  compositeGates: number[];
  counts: Record<DynamicKind, number>;
}
