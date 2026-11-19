import { describe, expect, test } from 'bun:test';
import { buildCardSvg } from '@ui/share/card-svg';
import { cardFacts, cardFileName } from '@ui/share/card-facts';
import { FORMATS } from '@ui/share/formats';
import { defaultPrefs } from '@ui/share/prefs';
import { buildReportModel, longDate, shortDisclaimer } from '@ui/share/report-model';
import { THEME_IDS } from '@ui/share/themes';
import { HOSTILE, LONG_NAME, chartSubject, compareSubject } from './fixtures';

describe('card svg', () => {
  test('every format has its exact pixel size, in both templates', () => {
    for (const subject of [chartSubject(), compareSubject()]) {
      for (const f of FORMATS) {
        const r = buildCardSvg(subject, { ...defaultPrefs(), format: f.id, showQr: true });
        expect(r.width).toBe(f.width);
        expect(r.height).toBe(f.height);
        expect(r.svg).toContain(`width="${f.width}" height="${f.height}"`);
        expect(r.svg).toContain(`viewBox="0 0 ${f.width} ${f.height}"`);
      }
    }
  });
  test('is well formed with concrete colours and no external references', () => {
    for (const theme of THEME_IDS) {
      const { svg } = buildCardSvg(chartSubject(), {
        ...defaultPrefs(),
        theme,
        showQr: true,
        logo: 'data:image/png;base64,AAAA',
      });
      const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
      expect(doc.querySelector('parsererror')).toBeNull();
      expect(svg).not.toContain('var(--');
      expect(svg.replace(/xmlns="[^"]*"/g, '')).not.toMatch(/https?:/);
    }
  });
  test('hostile names are escaped everywhere', () => {
    const prefs = { ...defaultPrefs(), preparedBy: HOSTILE, contact: HOSTILE, showBirth: true };
    for (const subject of [chartSubject(HOSTILE), compareSubject()]) {
      const { svg } = buildCardSvg(subject, prefs);
      expect(svg).not.toContain('<script');
      expect(svg).toContain('&lt;script&gt;');
      expect(
        new DOMParser().parseFromString(svg, 'image/svg+xml').querySelector('parsererror'),
      ).toBeNull();
    }
  });
  test('a very long name wraps and stays inside the card', () => {
    const { svg } = buildCardSvg(chartSubject(LONG_NAME), {
      ...defaultPrefs(),
      format: 'landscape',
    });
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const titles = [...doc.querySelectorAll('text')].filter((t) =>
      /Maximiliana|Testington|…/.test(t.textContent ?? ''),
    );
    expect(titles.length).toBeGreaterThanOrEqual(1);
    expect(titles.length).toBeLessThanOrEqual(2);
  });
  test('privacy: hidden name and birth details never reach the image', () => {
    const { svg } = buildCardSvg(chartSubject(), {
      ...defaultPrefs(),
      showName: false,
      showBirth: false,
    });
    expect(svg).not.toContain('Sam Example');
    expect(svg).not.toContain('1985');
    expect(svg).not.toContain('New York');
    const shown = buildCardSvg(chartSubject(), { ...defaultPrefs(), showBirth: true }).svg;
    expect(shown).toContain('22 Jul 1985');
  });
  test('watermark and QR toggles', () => {
    const base = defaultPrefs();
    expect(buildCardSvg(chartSubject(), base).svg).toContain('Made with gatecast');
    expect(buildCardSvg(chartSubject(), { ...base, showWatermark: false }).svg).not.toContain(
      'Made with',
    );
    expect(buildCardSvg(chartSubject(), base).svg).not.toContain('crispEdges');
    expect(buildCardSvg(chartSubject(), { ...base, showQr: true }).svg).toContain('crispEdges');
  });
  test('facts and file names', () => {
    const f = cardFacts(compareSubject(), defaultPrefs());
    expect(f.kind).toBe('compare');
    expect(f.dynamics).toHaveLength(4);
    expect(cardFileName(cardFacts(chartSubject(), defaultPrefs()), 'square', true)).toBe(
      'gatecast-sam-example-square',
    );
    expect(cardFileName(cardFacts(chartSubject(), defaultPrefs()), 'story', false)).toBe(
      'gatecast-chart-story',
    );
  });
});

describe('report model', () => {
  const opts = { ...defaultPrefs(), showBirth: true };
  test('contains the expected data and never undefined text', () => {
    const m = buildReportModel(chartSubject(), opts, new Date(2026, 10, 19));
    expect(m.generated).toBe('19 November 2026');
    expect(m.people[0]?.personality).toHaveLength(13);
    expect(m.people[0]?.design).toHaveLength(13);
    expect(m.people[0]?.birth).toContain('1985');
    expect(JSON.stringify(m)).not.toContain('undefined');
    expect(m.people[0]?.lines.length).toBeGreaterThan(0);
  });
  test('birth details and sections follow the options', () => {
    const m = buildReportModel(chartSubject(), {
      ...opts,
      showBirth: false,
      sections: { ...opts.sections, lines: false },
    });
    expect(m.people[0]?.birth).toBe('');
    expect(m.sections).not.toContain('lines');
  });
  test('compare model and helpers', () => {
    const m = buildReportModel(compareSubject(), opts);
    expect(m.kind).toBe('compare');
    expect(m.compare?.counts).toHaveLength(4);
    expect(m.preparedFor).toContain('&');
    expect(longDate(new Date(2026, 0, 5))).toBe('5 January 2026');
    expect(shortDisclaimer('One. Two. Three.')).toBe('One.');
  });
});
