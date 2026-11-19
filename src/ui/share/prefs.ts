import { ACCENT_IDS, THEME_IDS } from './themes';
import { isValidLogo } from './logo';
import { SECTION_IDS } from './types';
import type { FormatId, HeroKind, PaperId, ReportThemeId, SectionId, SharePrefs } from './types';

/** localStorage key of the saved options. */
export const SHARE_PREFS_KEY = 'hd:v1:share-prefs';

/** Longest text accepted for the name and contact fields. */
export const MAX_FIELD = 120;
/** Longest notes text. */
export const MAX_NOTES = 2000;

const FORMATS: readonly FormatId[] = ['square', 'portrait', 'story', 'landscape'];
const HEROES: readonly HeroKind[] = ['bodygraph', 'wheel'];
const PAPERS: readonly PaperId[] = ['a4', 'letter'];
const REPORT_THEMES: readonly ReportThemeId[] = ['paper', 'ink'];

/** Regions that print on US Letter. */
const LETTER_REGIONS = new Set(['US', 'CA', 'MX', 'CL', 'CO', 'VE', 'PH', 'CR', 'DO', 'GT', 'PA']);

/** The paper size a locale such as `en-US` usually prints on. */
export function paperForLocale(locale: string | undefined): PaperId {
  const region = /[-_]([A-Za-z]{2})\b/.exec(locale ?? '')?.[1]?.toUpperCase();
  return region && LETTER_REGIONS.has(region) ? 'letter' : 'a4';
}

/** Sections on by default. */
export const DEFAULT_SECTIONS: Readonly<Record<SectionId, boolean>> = {
  summary: true,
  activations: true,
  centers: true,
  circuits: true,
  lines: true,
  wheel: false,
  glossary: false,
};

/** The options a first-time user starts with. */
export function defaultPrefs(locale?: string): SharePrefs {
  return {
    format: 'square',
    theme: 'night',
    accent: 'violet',
    hero: 'bodygraph',
    preparedBy: '',
    contact: '',
    logo: '',
    displayName: '',
    showName: true,
    showBirth: false,
    showQr: false,
    showWatermark: true,
    showCircuits: true,
    paper: paperForLocale(
      locale ?? (typeof navigator === 'undefined' ? undefined : navigator.language),
    ),
    reportTheme: 'paper',
    sections: { ...DEFAULT_SECTIONS },
    notes: '',
    rememberNotes: false,
  };
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function text(value: unknown, max: number, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').slice(0, max);
}

function flag(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * Validate untrusted stored options field by field: anything of the wrong
 * type or outside its allowed set falls back to the default.
 */
export function sanitizePrefs(raw: unknown, locale?: string): SharePrefs {
  const d = defaultPrefs(locale);
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return d;
  const r = raw as Record<string, unknown>;
  const rawSections =
    typeof r.sections === 'object' && r.sections !== null
      ? (r.sections as Record<string, unknown>)
      : {};
  const sections = Object.fromEntries(
    SECTION_IDS.map((id) => [id, flag(rawSections[id], d.sections[id])]),
  ) as Record<SectionId, boolean>;
  const rememberNotes = flag(r.rememberNotes, false);
  return {
    format: oneOf(r.format, FORMATS, d.format),
    theme: oneOf(r.theme, THEME_IDS, d.theme),
    accent: oneOf(r.accent, ACCENT_IDS, d.accent),
    hero: oneOf(r.hero, HEROES, d.hero),
    preparedBy: text(r.preparedBy, MAX_FIELD, ''),
    contact: text(r.contact, MAX_FIELD, ''),
    logo: isValidLogo(r.logo) ? r.logo : '',
    displayName: text(r.displayName, MAX_FIELD, ''),
    showName: flag(r.showName, d.showName),
    showBirth: flag(r.showBirth, d.showBirth),
    showQr: flag(r.showQr, d.showQr),
    showWatermark: flag(r.showWatermark, d.showWatermark),
    showCircuits: flag(r.showCircuits, d.showCircuits),
    paper: oneOf(r.paper, PAPERS, d.paper),
    reportTheme: oneOf(r.reportTheme, REPORT_THEMES, d.reportTheme),
    sections,
    notes: rememberNotes ? text(r.notes, MAX_NOTES, '') : '',
    rememberNotes,
  };
}

/** Minimal storage surface, so tests can pass a fake. */
export type PrefsStorage = Pick<Storage, 'getItem' | 'setItem'>;

function defaultStorage(): PrefsStorage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

/** Read the saved options; corrupt, missing or blocked storage gives the defaults. */
export function loadPrefs(storage: PrefsStorage | undefined = defaultStorage()): SharePrefs {
  try {
    const raw = storage?.getItem(SHARE_PREFS_KEY);
    if (!raw) return defaultPrefs();
    return sanitizePrefs(JSON.parse(raw) as unknown);
  } catch {
    return defaultPrefs();
  }
}

/**
 * Save the options. Notes are written only when `rememberNotes` is on.
 * @returns `false` when storage is blocked or full.
 */
export function savePrefs(
  prefs: SharePrefs,
  storage: PrefsStorage | undefined = defaultStorage(),
): boolean {
  try {
    if (!storage) return false;
    const toSave = prefs.rememberNotes ? prefs : { ...prefs, notes: '' };
    storage.setItem(SHARE_PREFS_KEY, JSON.stringify(toSave));
    return true;
  } catch {
    return false;
  }
}

/** A named bundle of options. */
export interface Preset {
  id: string;
  label: string;
  hint: string;
  mode: 'card' | 'report';
  apply: (prefs: SharePrefs) => SharePrefs;
}

/** The one-click presets. */
export const PRESETS: readonly Preset[] = [
  {
    id: 'client-report',
    label: 'Client report',
    hint: 'Full document with every core section',
    mode: 'report',
    apply: (p) => ({
      ...p,
      reportTheme: 'paper',
      sections: { ...DEFAULT_SECTIONS, wheel: false, glossary: true },
      showBirth: true,
      showQr: false,
      showWatermark: p.showWatermark,
    }),
  },
  {
    id: 'social-square',
    label: 'Social post (square)',
    hint: '1080 x 1080, birth details hidden',
    mode: 'card',
    apply: (p) => ({ ...p, format: 'square', showBirth: false, showCircuits: true }),
  },
  {
    id: 'story',
    label: 'Story',
    hint: '1080 x 1920 for stories and reels',
    mode: 'card',
    apply: (p) => ({ ...p, format: 'story', showBirth: false, showCircuits: true }),
  },
  {
    id: 'link-preview',
    label: 'Link preview',
    hint: '1200 x 630 for link cards',
    mode: 'card',
    apply: (p) => ({ ...p, format: 'landscape', showBirth: false, showCircuits: false }),
  },
];
