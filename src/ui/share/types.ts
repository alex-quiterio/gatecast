import type { BirthInput, Chart, Comparison } from '@/types';

/** What a share card or report is about: one chart, or a comparison of two. */
export type ShareSubject =
  | { kind: 'chart'; chart: Chart; input: BirthInput; link: string }
  | {
      kind: 'compare';
      a: Chart;
      b: Chart;
      inputA: BirthInput;
      inputB: BirthInput;
      comparison: Comparison;
      link: string;
    };

/** Card output formats. */
export type FormatId = 'square' | 'portrait' | 'story' | 'landscape';

/** Card colour themes. */
export type CardThemeId = 'night' | 'paper' | 'ink';

/** The curated accent colours. */
export type AccentId = 'violet' | 'amber' | 'teal' | 'rose' | 'sky' | 'sage';

/** The hero graphic of a chart card. */
export type HeroKind = 'bodygraph' | 'wheel';

/** Paper sizes of the report. */
export type PaperId = 'a4' | 'letter';

/** Report colour themes: colour paper, or black and white ink-saving. */
export type ReportThemeId = 'paper' | 'ink';

/** Toggleable report sections. */
export type SectionId =
  'summary' | 'activations' | 'centers' | 'circuits' | 'lines' | 'wheel' | 'glossary';

/** Everything the user can set; persisted (without notes unless asked) in localStorage. */
export interface SharePrefs {
  format: FormatId;
  theme: CardThemeId;
  accent: AccentId;
  hero: HeroKind;
  /** The practitioner's name, printed as "Prepared by". */
  preparedBy: string;
  /** A website or contact line. */
  contact: string;
  /** A downscaled logo as a `data:image/...` URL, or empty. */
  logo: string;
  /** Replaces the chart's name on cards and in "Prepared for". */
  displayName: string;
  showName: boolean;
  showBirth: boolean;
  showQr: boolean;
  showWatermark: boolean;
  showCircuits: boolean;
  paper: PaperId;
  reportTheme: ReportThemeId;
  sections: Record<SectionId, boolean>;
  /** Free text printed on the last page of the report. */
  notes: string;
  /** Whether `notes` is saved on this device (off by default). */
  rememberNotes: boolean;
}

/** Section ids in document order. */
export const SECTION_IDS: readonly SectionId[] = [
  'summary',
  'activations',
  'centers',
  'circuits',
  'lines',
  'wheel',
  'glossary',
];
