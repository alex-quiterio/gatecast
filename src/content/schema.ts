/** Theme circuits that group channels. */
export type Circuit = 'Individual' | 'Tribal' | 'Collective' | 'Integration';

/** The two streams of the Collective circuit. */
export type Stream = 'Logic' | 'Abstract';

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
  /** Only set for Collective channels. */
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
