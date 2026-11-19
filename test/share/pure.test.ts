import { describe, expect, test } from 'bun:test';
import { contrastRatio } from '@ui/palette';
import { qrMatrix, qrPathData, qrSvg } from '@ui/share/qr';
import { estimateTextWidth, fitFontSize, truncateToWidth, wrapText } from '@ui/share/text-layout';
import { ACCENT_IDS, ACCENTS, THEME_IDS, resolveTheme } from '@ui/share/themes';
import { FORMATS, containRect } from '@ui/share/formats';
import { LOGO_MAX_BYTES, fitLogoSize, isValidLogo, logoFileProblem } from '@ui/share/logo';
import { paginate } from '@ui/share/paginate';
import {
  SHARE_PREFS_KEY,
  defaultPrefs,
  loadPrefs,
  paperForLocale,
  sanitizePrefs,
  savePrefs,
} from '@ui/share/prefs';
import { cardPrivacy } from '@ui/share/privacy';
import { LONG_NAME } from './fixtures';

describe('text layout', () => {
  test('wrapText keeps every line within the width', () => {
    for (const size of [20, 40, 64]) {
      const lines = wrapText(LONG_NAME, 400, size, { weight: 600 });
      expect(lines.length).toBeGreaterThan(1);
      for (const l of lines) expect(estimateTextWidth(l, size, 600)).toBeLessThanOrEqual(400);
    }
  });
  test('breaks words wider than a line and truncates with an ellipsis', () => {
    const lines = wrapText('Supercalifragilisticexpialidocious', 120, 24);
    expect(lines.length).toBeGreaterThan(1);
    const cut = wrapText(LONG_NAME, 300, 30, { maxLines: 2 });
    expect(cut).toHaveLength(2);
    expect(cut[1]?.endsWith('…')).toBe(true);
    expect(truncateToWidth('short', 500, (t) => t.length)).toBe('short');
  });
  test('empty text gives no lines; fitFontSize shrinks long names', () => {
    expect(wrapText('   ', 100, 20)).toEqual([]);
    expect(fitFontSize('Sam', 800, 60, 30, 1)).toBe(60);
    expect(fitFontSize(LONG_NAME, 400, 60, 30, 2, 600)).toBeLessThan(60);
  });
  test('a custom measure is honoured', () => {
    expect(wrapText('aa bb cc', 5, 10, { measure: (t) => t.length })).toEqual(['aa bb', 'cc']);
  });
});

describe('qr', () => {
  test('encodes a known string to a known size', () => {
    const m = qrMatrix('HELLO');
    expect(m?.length).toBe(21);
    expect(m?.every((r) => r.length === 21)).toBe(true);
    expect(m?.[0]?.slice(0, 7)).toEqual([true, true, true, true, true, true, true]);
  });
  test('long links use a larger version and render a path', () => {
    const m = qrMatrix(`https://example.test/${'a'.repeat(250)}`);
    expect(m && m.length).toBeGreaterThan(50);
    expect(qrPathData(m ?? [])).toStartWith('M');
    expect(qrSvg('hi', 0, 0, 100, { dark: '#000', light: '#fff' })).toContain('<path');
  });
  test('text beyond any version gives nothing', () => {
    expect(qrMatrix('x'.repeat(4000))).toBeUndefined();
    expect(qrSvg('x'.repeat(4000), 0, 0, 10, { dark: '#000', light: '#fff' })).toBe('');
  });
});

describe('themes', () => {
  test('body text and accents pass WCAG AA on every theme', () => {
    for (const id of THEME_IDS) {
      for (const accent of ACCENT_IDS) {
        const t = resolveTheme(id, accent);
        expect(contrastRatio(t.text, t.bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(t.muted, t.bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(t.accent, t.bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(t.qrDark, t.qrLight)).toBeGreaterThanOrEqual(7);
      }
    }
    expect(Object.keys(ACCENTS)).toHaveLength(ACCENT_IDS.length);
  });
});

describe('formats', () => {
  test('exact sizes', () => {
    expect(FORMATS.map((f) => `${f.id}:${f.width}x${f.height}`)).toEqual([
      'square:1080x1080',
      'portrait:1080x1350',
      'story:1080x1920',
      'landscape:1200x630',
    ]);
    const r = containRect({ x: 0, y: 0, w: 100, h: 100 }, 0.5);
    expect(r).toEqual({ x: 25, y: 0, w: 50, h: 100 });
  });
});

describe('logo', () => {
  test('size fitting and validation', () => {
    expect(fitLogoSize(1024, 512)).toEqual({ width: 256, height: 128 });
    expect(fitLogoSize(100, 50)).toEqual({ width: 100, height: 50 });
    expect(fitLogoSize(0, 0)).toEqual({ width: 1, height: 1 });
    expect(isValidLogo('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
    expect(isValidLogo('http://evil.test/x.png')).toBe(false);
    expect(isValidLogo('data:image/svg+xml;base64,AAAA')).toBe(false);
    expect(isValidLogo(`data:image/png;base64,${'A'.repeat(LOGO_MAX_BYTES)}`)).toBe(false);
    expect(logoFileProblem({ type: 'application/pdf', size: 10 })).toBeDefined();
    expect(logoFileProblem({ type: 'image/png', size: 10 })).toBeUndefined();
  });
});

describe('paginate', () => {
  test('fills pages without splitting and keeps headings with the next block', () => {
    const blocks = [
      { height: 40 },
      { height: 40 },
      { height: 10, keepWithNext: true },
      { height: 30 },
      { height: 20, breakBefore: true },
    ];
    expect(paginate(blocks, 100)).toEqual([[0, 1], [2, 3], [4]]);
    expect(paginate([], 100)).toEqual([[]]);
    expect(paginate([{ height: 500 }, { height: 5 }], 100)).toEqual([[0], [1]]);
  });
});

describe('prefs', () => {
  const store = (initial?: string) => {
    const data = new Map<string, string>(initial === undefined ? [] : [[SHARE_PREFS_KEY, initial]]);
    return {
      data,
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
    };
  };
  test('defaults, locale paper and round trip', () => {
    expect(paperForLocale('en-US')).toBe('letter');
    expect(paperForLocale('pt-PT')).toBe('a4');
    const s = store();
    const p = { ...defaultPrefs('en-GB'), preparedBy: 'Alex', theme: 'ink' as const };
    expect(savePrefs(p, s)).toBe(true);
    expect(loadPrefs(s)).toEqual(p);
  });
  test('corrupt, wrong-typed and blocked storage fall back safely', () => {
    expect(loadPrefs(store('{nope'))).toEqual(defaultPrefs());
    const bad = sanitizePrefs({
      format: 'huge',
      theme: 3,
      sections: { lines: 'x' },
      logo: 'http://x',
      preparedBy: 5,
    });
    expect(bad.format).toBe('square');
    expect(bad.sections.lines).toBe(true);
    expect(bad.logo).toBe('');
    expect(bad.preparedBy).toBe('');
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(loadPrefs(blocked)).toEqual(defaultPrefs());
    expect(savePrefs(defaultPrefs(), blocked)).toBe(false);
  });
  test('notes are saved only when the user asks', () => {
    const s = store();
    savePrefs({ ...defaultPrefs(), notes: 'secret' }, s);
    expect(s.data.get(SHARE_PREFS_KEY)).not.toContain('secret');
    savePrefs({ ...defaultPrefs(), notes: 'kept', rememberNotes: true }, s);
    expect(loadPrefs(s).notes).toBe('kept');
  });
  test('privacy note reflects the QR and birth toggles', () => {
    const base = defaultPrefs();
    expect(cardPrivacy(base).level).toBe('private');
    expect(cardPrivacy({ ...base, showBirth: true }).level).toBe('birth');
    expect(cardPrivacy({ ...base, showQr: true }).message).toContain('birth');
  });
});
