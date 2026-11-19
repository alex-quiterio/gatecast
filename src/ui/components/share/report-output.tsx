import { render } from 'preact';
import { PAPERS } from '@ui/share/paper';
import { pageRule, reportCss } from '@ui/share/report-css';
import type { ReportModel } from '@ui/share/report-model';
import type { ShareSubject } from '@ui/share/types';
import { ReportPages } from './report-pages';

/** id of the offscreen element the report is rendered into for printing. */
export const PRINT_ROOT_ID = 'gc-print-root';

/** CSS class set on `<body>` while the report is being printed. */
export const PRINTING_CLASS = 'gc-printing';

const frame = (): Promise<void> => new Promise((resolve) => requestAnimationFrame(() => resolve()));

/** Wait until pagination stops changing (a few frames and the fonts). */
async function settle(container: HTMLElement): Promise<number> {
  await document.fonts?.ready;
  let last = -1;
  let stable = 0;
  for (let i = 0; i < 40 && stable < 3; i += 1) {
    await frame();
    const now = Number(container.querySelector('.rp-root')?.getAttribute('data-pages') ?? 0);
    stable = now === last && now > 0 ? stable + 1 : 0;
    last = now;
  }
  return Math.max(last, 0);
}

/** A file-name-safe slug of the report's subject. */
export function reportFileName(model: ReportModel, extension: string): string {
  const base = (model.preparedFor || 'chart')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `gatecast-report-${base || 'chart'}.${extension}`;
}

/** Mount the paginated report offscreen; call `dispose` to remove it. */
async function mountOffscreen(
  model: ReportModel,
  subject: ShareSubject,
  withPageRule: boolean,
): Promise<{ container: HTMLElement; pages: number; dispose: () => void }> {
  const container = document.createElement('div');
  container.id = PRINT_ROOT_ID;
  container.setAttribute('aria-hidden', 'true');
  document.body.appendChild(container);
  const style = document.createElement('style');
  style.textContent = (withPageRule ? pageRule(model.paper) : '') + reportCss();
  container.appendChild(style);
  const mount = document.createElement('div');
  container.appendChild(mount);
  render(<ReportPages model={model} subject={subject} />, mount);
  const pages = await settle(container);
  return {
    container,
    pages,
    dispose: () => {
      render(null, mount);
      container.remove();
    },
  };
}

/**
 * Print the report: render it into a dedicated print root, hide the rest of
 * the app with print CSS (`body.gc-printing`), open the print dialog and
 * restore everything afterwards. Works with or without the dialog open.
 *
 * @returns the number of pages printed, or 0 when printing is unavailable.
 */
export async function printReport(model: ReportModel, subject: ShareSubject): Promise<number> {
  if (typeof window.print !== 'function') return 0;
  const { pages, dispose } = await mountOffscreen(model, subject, true);
  const previousTitle = document.title;
  document.title = reportFileName(model, 'pdf').replace(/\.pdf$/, '');
  document.body.classList.add(PRINTING_CLASS);
  let restored = false;
  const restore = (): void => {
    if (restored) return;
    restored = true;
    window.removeEventListener('afterprint', restore);
    document.body.classList.remove(PRINTING_CLASS);
    document.title = previousTitle;
    dispose();
  };
  window.addEventListener('afterprint', restore);
  // Safety net for browsers that never fire `afterprint`.
  setTimeout(restore, 10 * 60 * 1000);
  try {
    window.print();
  } catch {
    restore();
    return 0;
  }
  return pages;
}

const FILE_CSS = `
html{background:#e9e7f0}
body{margin:0;padding:16px;background:#e9e7f0}
.rp-pages{align-items:center}
@media print{html,body{background:#fff;padding:0}.rp-pages{align-items:flex-start}}
`;

/** Strip the SVG namespace attribute: inline SVG in HTML does not need it. */
function stripNamespaces(html: string): string {
  return html.replace(/ xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '');
}

/** Escape text for use inside `<title>`. */
function escapeText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * The report as ONE self-contained HTML document: inline CSS and SVG, logo
 * and QR as inline data, no scripts and no external requests. It opens and
 * prints identically offline, on the chosen paper size.
 */
export async function buildReportHtml(model: ReportModel, subject: ShareSubject): Promise<string> {
  const { container, dispose } = await mountOffscreen(model, subject, false);
  try {
    const root = container.querySelector('.rp-root');
    const paper = PAPERS[model.paper];
    const title = `${model.title}${model.preparedFor ? ` - ${model.preparedFor}` : ''}`;
    // The offscreen measuring copy is not part of the file.
    const clone = root?.cloneNode(true) as Element | undefined;
    clone?.querySelector('.rp-measure')?.remove();
    const cleaned = clone?.outerHTML ?? '';
    return stripNamespaces(
      `<!doctype html>\n<html lang="en"><head><meta charset="utf-8">` +
        `<meta name="viewport" content="width=device-width,initial-scale=1">` +
        `<meta name="generator" content="Gatecast"><title>${escapeText(title)}</title>` +
        `<style>${pageRule(model.paper)}${reportCss()}${FILE_CSS}</style></head>` +
        `<body data-paper="${paper.id}">${cleaned}</body></html>\n`,
    );
  } finally {
    dispose();
  }
}
