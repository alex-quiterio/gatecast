import { describe, expect, test } from 'bun:test';
import { CENTER_NAMES } from '@/types';
import { PLANET_NAMES } from '@/types';
import {
  ASSUMED_PAGE_BG,
  CENTER_TEXT_VARIABLE,
  CENTER_VARIABLE,
  DYNAMIC_VARIABLE,
  PALETTE_VARIABLES,
  PLANET_GLYPHS,
  contrastRatio,
  cssVar,
  paletteCss,
  paletteValue,
} from '@ui/palette';

const THEMES = ['dark', 'light'] as const;

describe('palette', () => {
  test('variables are unique, prefixed and complete for both themes', () => {
    const names = PALETTE_VARIABLES.map((v) => v.name);
    expect(new Set(names).size).toBe(names.length);
    for (const v of PALETTE_VARIABLES) {
      expect(v.name.startsWith('--hd-')).toBe(true);
      expect(v.dark.length).toBeGreaterThan(0);
      expect(v.light.length).toBeGreaterThan(0);
      expect(v.description.length).toBeGreaterThan(3);
    }
  });

  test('cssVar and paletteCss', () => {
    expect(cssVar('--hd-design')).toMatch(/^var\(--hd-design, #[0-9a-f]{6}\)$/);
    expect(paletteCss('light')).toContain('--hd-glow: 0.35;');
  });

  test('every planet has a glyph', () => {
    for (const planet of PLANET_NAMES) expect(PLANET_GLYPHS[planet].length).toBeGreaterThan(0);
  });

  for (const theme of THEMES) {
    describe(`contrast (${theme})`, () => {
      test('gate numbers on defined centers are at least 4.5:1', () => {
        for (const center of CENTER_NAMES) {
          const ratio = contrastRatio(
            paletteValue(CENTER_VARIABLE[center], theme),
            paletteValue(CENTER_TEXT_VARIABLE[center], theme),
          );
          expect(ratio).toBeGreaterThanOrEqual(4.5);
        }
      });
      test('numbers on open centers, dots and wheel cells', () => {
        const pairs: [Parameters<typeof paletteValue>[0], Parameters<typeof paletteValue>[0]][] = [
          ['--hd-center-open-fill', '--hd-center-open-text'],
          ['--hd-gate-dot', '--hd-gate-dot-text'],
          ['--hd-wheel-cell', '--hd-wheel-cell-text'],
          ['--hd-zodiac-fire', '--hd-zodiac-text'],
          ['--hd-zodiac-earth', '--hd-zodiac-text'],
          ['--hd-zodiac-air', '--hd-zodiac-text'],
          ['--hd-zodiac-water', '--hd-zodiac-text'],
        ];
        for (const [bg, fg] of pairs) {
          expect(
            contrastRatio(paletteValue(bg, theme), paletteValue(fg, theme)),
          ).toBeGreaterThanOrEqual(4.5);
        }
      });
      test('dynamics, people and activations are visible on the page (3:1)', () => {
        const page = ASSUMED_PAGE_BG[theme];
        const names = [
          ...Object.values(DYNAMIC_VARIABLE),
          '--hd-person-a',
          '--hd-person-b',
          '--hd-design',
          '--hd-hexagram',
          '--hd-hexagram-active',
        ] as const;
        for (const name of names) {
          expect(contrastRatio(paletteValue(name, theme), page)).toBeGreaterThanOrEqual(3);
        }
      });
      test('the four dynamic colours are distinct', () => {
        const values = Object.values(DYNAMIC_VARIABLE).map((n) => paletteValue(n, theme));
        expect(new Set(values).size).toBe(4);
      });
    });
  }
});
