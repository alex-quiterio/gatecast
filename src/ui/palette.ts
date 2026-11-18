import type { CenterName, DynamicKind, PlanetName } from '@/types';

/** Planet glyphs (text presentation). */
export const PLANET_GLYPHS: Record<PlanetName, string> = {
  Sun: '☉',
  Earth: '⊕',
  Moon: '☽',
  NorthNode: '☊',
  SouthNode: '☋',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
};

/** Zodiac glyphs, Aries first. */
export const ZODIAC_GLYPHS: readonly string[] = [
  '♈',
  '♉',
  '♊',
  '♋',
  '♌',
  '♍',
  '♎',
  '♏',
  '♐',
  '♑',
  '♒',
  '♓',
];

/** Variation selector 15: ask for text (not emoji) presentation. */
export const TEXT_PRESENTATION = '︎';

/** Human readable center names. */
export const CENTER_LABELS: Record<CenterName, string> = {
  Head: 'Head',
  Ajna: 'Ajna',
  Throat: 'Throat',
  G: 'G',
  Heart: 'Heart',
  Spleen: 'Spleen',
  SolarPlexus: 'Solar Plexus',
  Sacral: 'Sacral',
  Root: 'Root',
};

/** One themable CSS custom property with defaults for both themes. */
export interface PaletteVariable {
  /** Full custom property name, e.g. `--hd-center-throat`. */
  name: string;
  /** Default on the night-sky (dark) theme. */
  dark: string;
  /** Default on the dawn/parchment (light) theme. */
  light: string;
  description: string;
}

/**
 * Every CSS custom property the renderers read. The app stylesheet may
 * override any of them per theme; the renderers always carry the dark value as
 * the inline `var()` fallback.
 */
export const PALETTE_VARIABLES = [
  { name: '--hd-center-head', dark: '#f2d675', light: '#f2d675', description: 'Head center fill' },
  { name: '--hd-center-ajna', dark: '#4fb3a0', light: '#4fb3a0', description: 'Ajna center fill' },
  { name: '--hd-center-throat', dark: '#a0694f', light: '#a0694f', description: 'Throat fill' },
  { name: '--hd-center-g', dark: '#f2d675', light: '#f2d675', description: 'G center fill' },
  { name: '--hd-center-heart', dark: '#e0525a', light: '#e0525a', description: 'Heart fill' },
  { name: '--hd-center-spleen', dark: '#a0694f', light: '#a0694f', description: 'Spleen fill' },
  {
    name: '--hd-center-solarplexus',
    dark: '#a0694f',
    light: '#a0694f',
    description: 'Solar Plexus fill',
  },
  { name: '--hd-center-sacral', dark: '#e0525a', light: '#e0525a', description: 'Sacral fill' },
  { name: '--hd-center-root', dark: '#a0694f', light: '#a0694f', description: 'Root fill' },
  {
    name: '--hd-on-center-dark',
    dark: '#14141f',
    light: '#14141f',
    description: 'Text on light/bright centers (Head, Ajna, G, Heart, Sacral)',
  },
  {
    name: '--hd-on-center-light',
    dark: '#ffffff',
    light: '#ffffff',
    description: 'Text on brown centers (Throat, Spleen, Solar Plexus, Root)',
  },
  {
    name: '--hd-center-open-fill',
    dark: '#1d1d2e',
    light: '#efe6d3',
    description: 'Fill of an open (undefined) center',
  },
  {
    name: '--hd-center-open-stroke',
    dark: '#4a4a68',
    light: '#a99a7e',
    description: 'Outline of an open center',
  },
  {
    name: '--hd-center-open-text',
    dark: '#cfd0e6',
    light: '#4a3f2e',
    description: 'Gate numbers on open centers',
  },
  { name: '--hd-body', dark: '#1b1b2b', light: '#e8dcc4', description: 'Body silhouette fill' },
  {
    name: '--hd-channel-track',
    dark: '#0f0f1a',
    light: '#b3a8bf',
    description: 'Inactive channel track (and under-layer of active bars)',
  },
  {
    name: '--hd-personality',
    dark: '#f3ead6',
    light: '#fffaf0',
    description: 'Personality (conscious) activations: pale ivory',
  },
  {
    name: '--hd-design',
    dark: '#e8566f',
    light: '#c93a55',
    description: 'Design (unconscious) activations: rose red',
  },
  { name: '--hd-gate-dot', dark: '#0d0d1a', light: '#2a2238', description: 'Active gate dot' },
  {
    name: '--hd-gate-dot-text',
    dark: '#ffffff',
    light: '#ffffff',
    description: 'Number on an active gate dot',
  },
  { name: '--hd-text', dark: '#e9e6f5', light: '#2a2238', description: 'Primary SVG text' },
  { name: '--hd-text-muted', dark: '#a29fc0', light: '#6b6280', description: 'Secondary SVG text' },
  { name: '--hd-focus', dark: '#a78bfa', light: '#6d4fd6', description: 'Keyboard focus ring' },
  {
    name: '--hd-glow',
    dark: '0.9',
    light: '0.35',
    description: 'Opacity of the soft glow layers; 0 disables glow',
  },
  { name: '--hd-zodiac-fire', dark: '#7a5a1c', light: '#e9c98b', description: 'Fire signs ring' },
  { name: '--hd-zodiac-earth', dark: '#3f6a45', light: '#b5d2a8', description: 'Earth signs ring' },
  { name: '--hd-zodiac-air', dark: '#5b4a8f', light: '#c9bdee', description: 'Air signs ring' },
  { name: '--hd-zodiac-water', dark: '#2f6b70', light: '#a6d3d0', description: 'Water signs ring' },
  {
    name: '--hd-zodiac-text',
    dark: '#f3ead6',
    light: '#2a2238',
    description: 'Zodiac glyphs on the ring',
  },
  { name: '--hd-wheel-cell', dark: '#1b1b2b', light: '#e8dcc4', description: 'Inactive gate cell' },
  {
    name: '--hd-wheel-cell-text',
    dark: '#b9b6d6',
    light: '#4a3f2e',
    description: 'Number in an inactive gate cell',
  },
  { name: '--hd-wheel-line', dark: '#3a3a55', light: '#b8a98c', description: 'Wheel hairlines' },
  { name: '--hd-hexagram', dark: '#6f6c95', light: '#7a6d58', description: 'Hexagram glyph' },
  {
    name: '--hd-hexagram-active',
    dark: '#f3ead6',
    light: '#2a2238',
    description: 'Hexagram of an active gate',
  },
  {
    name: '--hd-dyn-electromagnetic',
    dark: '#fbbf24',
    light: '#b7791f',
    description: 'Electromagnetic channels (solid)',
  },
  {
    name: '--hd-dyn-companionship',
    dark: '#5ab0ff',
    light: '#1f6fc4',
    description: 'Companionship channels (dashed)',
  },
  {
    name: '--hd-dyn-dominance',
    dark: '#ff7aa8',
    light: '#c2336f',
    description: 'Dominance channels (dotted)',
  },
  {
    name: '--hd-dyn-compromise',
    dark: '#4fd1a5',
    light: '#1b8a68',
    description: 'Compromise channels (dash-dot)',
  },
  {
    name: '--hd-person-a',
    dark: '#a78bfa',
    light: '#6d4fd6',
    description: 'Person A gates (circle marker)',
  },
  {
    name: '--hd-person-b',
    dark: '#f3ead6',
    light: '#2a2238',
    description: 'Person B gates (square marker)',
  },
] as const satisfies readonly PaletteVariable[];

export type PaletteName = (typeof PALETTE_VARIABLES)[number]['name'];

/** Page backgrounds the contrast checks assume for each theme. */
export const ASSUMED_PAGE_BG = { dark: '#0d0d1a', light: '#f6efe2' } as const;

/** `var(--hd-x, <dark fallback>)` for use in a presentation attribute. */
export function cssVar(name: PaletteName): string {
  const found = PALETTE_VARIABLES.find((v) => v.name === name);
  return `var(${name}, ${found?.dark ?? 'currentColor'})`;
}

/** CSS custom property declarations for one theme, ready to paste into a stylesheet. */
export function paletteCss(theme: 'dark' | 'light', selector = ':root'): string {
  const lines = PALETTE_VARIABLES.map((v) => `  ${v.name}: ${v[theme]};`);
  return `${selector} {\n${lines.join('\n')}\n}`;
}

/** The CSS variable holding each center's fill. */
export const CENTER_VARIABLE: Record<CenterName, PaletteName> = {
  Head: '--hd-center-head',
  Ajna: '--hd-center-ajna',
  Throat: '--hd-center-throat',
  G: '--hd-center-g',
  Heart: '--hd-center-heart',
  Spleen: '--hd-center-spleen',
  SolarPlexus: '--hd-center-solarplexus',
  Sacral: '--hd-center-sacral',
  Root: '--hd-center-root',
};

/** Which text colour sits on each center's fill. */
export const CENTER_TEXT_VARIABLE: Record<CenterName, PaletteName> = {
  Head: '--hd-on-center-dark',
  Ajna: '--hd-on-center-dark',
  Throat: '--hd-on-center-light',
  G: '--hd-on-center-dark',
  Heart: '--hd-on-center-dark',
  Spleen: '--hd-on-center-light',
  SolarPlexus: '--hd-on-center-light',
  Sacral: '--hd-on-center-dark',
  Root: '--hd-on-center-light',
};

/** Variable for each relationship dynamic. */
export const DYNAMIC_VARIABLE: Record<DynamicKind, PaletteName> = {
  electromagnetic: '--hd-dyn-electromagnetic',
  companionship: '--hd-dyn-companionship',
  dominance: '--hd-dyn-dominance',
  compromise: '--hd-dyn-compromise',
};

/** Dash pattern per dynamic so the kinds differ by more than hue. */
export const DYNAMIC_DASH: Record<DynamicKind, string | undefined> = {
  electromagnetic: undefined,
  companionship: '12 6',
  dominance: '0.1 8.5',
  compromise: '12 5 2 5',
};

/** Resolve a palette variable to its default hex for a theme. */
export function paletteValue(name: PaletteName, theme: 'dark' | 'light'): string {
  const found = PALETTE_VARIABLES.find((v) => v.name === name);
  return found ? found[theme] : '#000000';
}

function channelLuminance(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of a `#rrggbb` colour. */
export function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  return (
    0.2126 * channelLuminance((n >> 16) & 255) +
    0.7152 * channelLuminance((n >> 8) & 255) +
    0.0722 * channelLuminance(n & 255)
  );
}

/** WCAG contrast ratio between two `#rrggbb` colours (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
