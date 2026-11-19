import { PALETTE_VARIABLES, contrastRatio, paletteValue } from '@ui/palette';
import type { PaletteName } from '@ui/palette';
import type { AccentId, CardThemeId, ReportThemeId } from './types';

/** System font stacks only: nothing is fetched. */
export const FONT_SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
/** Serif stack for names and headings. */
export const FONT_SERIF =
  "Georgia, 'Iowan Old Style', 'Palatino Linotype', 'Times New Roman', serif";

/** A card theme with every colour concrete (no CSS variables). */
export interface CardTheme {
  id: CardThemeId;
  label: string;
  /** Page background. */
  bg: string;
  /** Second stop of the background gradient. */
  bg2: string;
  /** Panels and chips. */
  surface: string;
  /** Body text. */
  text: string;
  /** Secondary text. */
  muted: string;
  /** Hairlines. */
  border: string;
  /** Accent used for labels and rules (checked for contrast on `bg`). */
  accent: string;
  /** QR modules and the panel behind them. */
  qrDark: string;
  qrLight: string;
  /** Which BodyGraph palette to resolve. */
  palette: 'dark' | 'light' | 'ink';
}

/** The curated accents, with a value tuned for each background. */
export const ACCENTS: Readonly<
  Record<AccentId, { label: string; night: string; paper: string; swatch: string }>
> = {
  violet: { label: 'Violet', night: '#b9a5ff', paper: '#5b3fd0', swatch: '#8f6ff0' },
  amber: { label: 'Amber', night: '#fbbf24', paper: '#8a5a00', swatch: '#fbbf24' },
  teal: { label: 'Teal', night: '#4fd1c5', paper: '#0f766e', swatch: '#14a89b' },
  rose: { label: 'Rose', night: '#ff8fa3', paper: '#b4234a', swatch: '#e8566f' },
  sky: { label: 'Sky', night: '#6cb6ff', paper: '#1d5fb4', swatch: '#3b8de0' },
  sage: { label: 'Sage', night: '#9ad18b', paper: '#2f6b2f', swatch: '#5fa052' },
};

/** Accent ids in display order. */
export const ACCENT_IDS = Object.keys(ACCENTS) as AccentId[];

/** Theme ids in display order. */
export const THEME_IDS: readonly CardThemeId[] = ['night', 'paper', 'ink'];

const BASE: Record<CardThemeId, Omit<CardTheme, 'accent'>> = {
  night: {
    id: 'night',
    label: 'Night',
    bg: '#0f1117',
    bg2: '#1b1733',
    surface: '#171a24',
    text: '#f1f2f8',
    muted: '#aab0c4',
    border: '#2e3448',
    qrDark: '#0f1117',
    qrLight: '#ffffff',
    palette: 'dark',
  },
  paper: {
    id: 'paper',
    label: 'Paper',
    bg: '#f7f1e4',
    bg2: '#efe6d2',
    surface: '#fffaf0',
    text: '#201b2e',
    muted: '#585068',
    border: '#d6c9ad',
    qrDark: '#201b2e',
    qrLight: '#ffffff',
    palette: 'light',
  },
  ink: {
    id: 'ink',
    label: 'Ink',
    bg: '#ffffff',
    bg2: '#ffffff',
    surface: '#ffffff',
    text: '#111111',
    muted: '#444444',
    border: '#8a8a8a',
    qrDark: '#000000',
    qrLight: '#ffffff',
    palette: 'ink',
  },
};

/** Resolve a card theme and accent to concrete colours. */
export function resolveTheme(id: CardThemeId, accent: AccentId): CardTheme {
  const base = BASE[id];
  const pick = ACCENTS[accent];
  const color = id === 'night' ? pick.night : id === 'paper' ? pick.paper : '#111111';
  return { ...base, accent: color };
}

/** Palette overrides for black and white output. Centers differ by fill and outline, not hue. */
const INK_OVERRIDES: Partial<Record<PaletteName, string>> = {
  '--hd-center-head': '#3a3a3a',
  '--hd-center-ajna': '#3a3a3a',
  '--hd-center-throat': '#3a3a3a',
  '--hd-center-g': '#3a3a3a',
  '--hd-center-heart': '#3a3a3a',
  '--hd-center-spleen': '#3a3a3a',
  '--hd-center-solarplexus': '#3a3a3a',
  '--hd-center-sacral': '#3a3a3a',
  '--hd-center-root': '#3a3a3a',
  '--hd-on-center-dark': '#ffffff',
  '--hd-on-center-light': '#ffffff',
  '--hd-center-open-fill': '#ffffff',
  '--hd-center-open-stroke': '#444444',
  '--hd-center-open-text': '#222222',
  '--hd-body': '#efefef',
  '--hd-channel-track': '#dadada',
  '--hd-personality': '#8c8c8c',
  '--hd-design': '#111111',
  '--hd-gate-dot': '#111111',
  '--hd-text': '#111111',
  '--hd-text-muted': '#444444',
  '--hd-zodiac-fire': '#e4e4e4',
  '--hd-zodiac-earth': '#cfcfcf',
  '--hd-zodiac-air': '#e4e4e4',
  '--hd-zodiac-water': '#cfcfcf',
  '--hd-zodiac-text': '#111111',
  '--hd-wheel-cell': '#efefef',
  '--hd-wheel-cell-text': '#333333',
  '--hd-wheel-line': '#9a9a9a',
  '--hd-hexagram': '#666666',
  '--hd-hexagram-active': '#111111',
  '--hd-dyn-electromagnetic': '#111111',
  '--hd-dyn-companionship': '#111111',
  '--hd-dyn-dominance': '#111111',
  '--hd-dyn-compromise': '#111111',
  '--hd-person-a': '#111111',
  '--hd-person-b': '#111111',
  '--hd-focus': '#111111',
};

/** The value of one palette variable for a palette flavour. */
export function paletteFor(name: PaletteName, flavour: 'dark' | 'light' | 'ink'): string {
  if (flavour === 'ink') return INK_OVERRIDES[name] ?? paletteValue(name, 'light');
  return paletteValue(name, flavour);
}

/** A `lookup(name)` for `resolveCssVars` that answers with this flavour's palette values. */
export function paletteLookup(flavour: 'dark' | 'light' | 'ink'): (name: string) => string {
  const known = new Set<string>(PALETTE_VARIABLES.map((v) => v.name));
  return (name) => (known.has(name) ? paletteFor(name as PaletteName, flavour) : '');
}

/** CSS declarations of the whole palette for one flavour (for the report). */
export function paletteDeclarations(flavour: 'dark' | 'light' | 'ink'): string {
  return PALETTE_VARIABLES.map((v) => `${v.name}:${paletteFor(v.name, flavour)};`).join('');
}

/** Report themes mapped to a palette flavour. */
export const REPORT_PALETTE: Record<ReportThemeId, 'light' | 'ink'> = {
  paper: 'light',
  ink: 'ink',
};

/** WCAG contrast of the theme's body text on its background. */
export function bodyContrast(theme: CardTheme): number {
  return contrastRatio(theme.text, theme.bg);
}
