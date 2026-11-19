import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { ShareDialog } from '@ui/components/share/share-dialog';
import { buildReportHtml, reportFileName } from '@ui/components/share/report-output';
import { shareImage, canCopyImage, copyImage } from '@ui/share/raster';
import { SHARE_PREFS_KEY, defaultPrefs } from '@ui/share/prefs';
import { buildReportModel } from '@ui/share/report-model';
import { chartSubject, compareSubject } from './fixtures';

let host: HTMLDivElement;
beforeEach(() => {
  localStorage.clear();
  host = document.createElement('div');
  document.body.append(host);
});
afterEach(() => {
  act(() => render(null, host));
  host.remove();
});

const flush = async (ms = 250): Promise<void> => {
  await act(() => new Promise<void>((r) => setTimeout(r, ms)));
};
const button = (text: string): HTMLButtonElement => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.includes(text));
  if (!b) throw new Error(`no button ${text}`);
  return b;
};
const check = (label: string): HTMLInputElement => {
  const l = [...document.querySelectorAll('label')].find((x) => x.textContent?.includes(label));
  const i = l?.querySelector('input');
  if (!i) throw new Error(`no toggle ${label}`);
  return i;
};
const open = (mode: 'card' | 'report', compare = false): void => {
  act(() => {
    render(
      <ShareDialog
        mode={mode}
        subject={compare ? compareSubject() : chartSubject()}
        onClose={() => undefined}
      />,
      host,
    );
  });
};

describe('card mode', () => {
  test('opens as a labelled dialog with a live preview', () => {
    open('card');
    expect(document.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe(
      'Share card',
    );
    expect(document.querySelector('img.sh-card-img')?.getAttribute('src')).toContain(
      'data:image/svg+xml',
    );
  });
  test('controls change the preview and are remembered', async () => {
    open('card');
    const before = document.querySelector('img.sh-card-img')?.getAttribute('src');
    act(() => button('Story').click());
    await flush();
    const after = document.querySelector('img.sh-card-img');
    expect(after?.getAttribute('src')).not.toBe(before);
    expect(after?.getAttribute('width')).toBe('1080');
    expect(after?.getAttribute('height')).toBe('1920');
    expect(JSON.parse(localStorage.getItem(SHARE_PREFS_KEY) ?? '{}').format).toBe('story');
  });
  test('QR on shows the privacy warning and the hide-birth shortcut', () => {
    open('card');
    act(() => check('Birth details').click());
    act(() => check('QR code').click());
    expect(document.querySelector('.sh-privacy--link')?.textContent).toContain(
      'birth date, time and place',
    );
    act(() => button('Hide birth details in the image').click());
    expect(check('Birth details').checked).toBe(false);
  });
  test('Download SVG saves an image/svg+xml blob', () => {
    open('card');
    const made: Blob[] = [];
    const spy = spyOn(URL, 'createObjectURL').mockImplementation((b: Blob | MediaSource) => {
      made.push(b as Blob);
      return 'blob:x';
    });
    act(() => button('Download SVG').click());
    spy.mockRestore();
    expect(made[0]?.type).toBe('image/svg+xml');
  });
  test('compare subjects open the compare card without the graphic switch', () => {
    open('card', true);
    expect(document.body.textContent).not.toContain('Gate wheel');
  });
});

describe('report mode', () => {
  test('shows pages, and section toggles change the page count', async () => {
    open('report');
    await flush(500);
    const count = (): number => document.querySelectorAll('.sh-pages .rp-page').length;
    const full = count();
    expect(full).toBeGreaterThan(1);
    expect(document.querySelector('.sh-pages')?.textContent).toContain('Page 1 of');
    act(() => check('Your lines').click());
    await flush(600);
    expect(count()).toBeLessThan(full);
  });
  test('paper size is part of the page geometry', async () => {
    open('report');
    act(() => button('US Letter').click());
    await flush(500);
    expect(document.querySelector('.sh-pages .rp-root')?.getAttribute('style')).toContain(
      '215.9mm',
    );
  });
  test('notes are not stored unless remembered', async () => {
    open('report');
    const area = document.querySelector('textarea') as HTMLTextAreaElement;
    act(() => {
      area.value = 'private note';
      area.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await flush();
    expect(localStorage.getItem(SHARE_PREFS_KEY) ?? '').not.toContain('private note');
    act(() => check('Remember these notes').click());
    await flush();
    expect(localStorage.getItem(SHARE_PREFS_KEY)).toContain('private note');
  });
  test('the mode switch moves between card and report', () => {
    open('card');
    act(() => button('Report').click());
    expect(document.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe(
      'Print report',
    );
  });
});

describe('self-contained HTML export', () => {
  test('has the sections, no scripts and no external resources', async () => {
    const prefs = {
      ...defaultPrefs(),
      showQr: true,
      showBirth: true,
      preparedBy: 'Alex',
      notes: 'Hello notes',
      logo: 'data:image/png;base64,iVBORw0KGgo=',
      sections: {
        summary: true,
        activations: true,
        centers: true,
        circuits: true,
        lines: true,
        wheel: true,
        glossary: true,
      },
    };
    const model = buildReportModel(chartSubject(), prefs, new Date(2026, 10, 19));
    const html = await buildReportHtml(model, chartSubject());
    expect(html.startsWith('<!doctype html>')).toBe(true);
    for (const text of [
      'Activations',
      'Centers and channels',
      'Circuits',
      'Your lines',
      'Gate wheel',
      'Glossary',
      'Notes',
      'Prepared by Alex',
      'Page 1 of',
    ]) {
      expect(html).toContain(text);
    }
    expect(html).not.toMatch(/https?:/);
    expect(html).not.toContain('<script');
    expect(html).not.toContain('class="rp-measure"');
    expect(html).not.toContain('undefined');
    for (const m of html.matchAll(/\b(?:src|href)="([^"]*)"/g))
      expect(m[1]?.startsWith('data:') || m[1]?.startsWith('#')).toBe(true);
    expect(html).not.toMatch(/url\((?!#)/);
    expect(reportFileName(model, 'html')).toBe('gatecast-report-sam-example.html');
  });
  test('comparison report has the composite section', async () => {
    const model = buildReportModel(compareSubject(), defaultPrefs());
    const html = await buildReportHtml(model, compareSubject());
    expect(html).toContain('Composite');
    expect(html).toContain('Channels between you');
  });
});

describe('output fallbacks', () => {
  test('Share and Copy explain themselves when unsupported', async () => {
    const png = new Blob(['x'], { type: 'image/png' });
    const r = await shareImage(png, 'a.png', 'a');
    expect(r.ok).toBe(false);
    expect(r.message).toContain('Download PNG');
    if (!canCopyImage()) expect((await copyImage(png)).ok).toBe(false);
  });
});
