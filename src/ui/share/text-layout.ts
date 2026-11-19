/*
 * Deterministic text measuring and wrapping for SVG cards, where there is no
 * layout engine. Widths come from a per-character table (em fractions for a
 * Helvetica-like sans), slightly inflated so text never overflows when the
 * real font is wider.
 */

const NARROW = new Set("iIjl.,:;'|!`".split(''));
const SEMI_NARROW = new Set('ftr()[]{}-/\\"*'.split(''));
const WIDE = new Set('mwMW@%'.split(''));
const SPACE = ' ';

/** Safety margin applied to every estimate. */
const SAFETY = 1.05;

function isWideCodePoint(cp: number): boolean {
  return (
    (cp >= 0x1100 && cp <= 0x115f) ||
    (cp >= 0x2e80 && cp <= 0xa4cf) ||
    (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe30 && cp <= 0xfe6f) ||
    (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0x1f300 && cp <= 0x1faff)
  );
}

/** Width of one character in em. */
function charEm(ch: string): number {
  if (ch === SPACE) return 0.28;
  if (NARROW.has(ch)) return 0.26;
  if (SEMI_NARROW.has(ch)) return 0.36;
  if (WIDE.has(ch)) return ch === 'm' ? 0.86 : 0.9;
  const cp = ch.codePointAt(0) ?? 0;
  if (isWideCodePoint(cp)) return 1;
  if (ch >= '0' && ch <= '9') return 0.56;
  if (ch >= 'A' && ch <= 'Z') return 0.68;
  if (cp > 0x2ff && cp < 0x370) return 0; // combining marks
  return 0.54;
}

/**
 * Estimated rendered width of a single line in px.
 *
 * @param text The line.
 * @param fontSize Font size in px.
 * @param weight CSS font weight; 600 and up count as bold (about 7% wider).
 */
export function estimateTextWidth(text: string, fontSize: number, weight = 400, scale = 1): number {
  let em = 0;
  for (const ch of text) em += charEm(ch);
  return em * fontSize * (weight >= 600 ? 1.07 : 1) * SAFETY * scale;
}

/** Width multiplier for the serif stack, which runs wider than the sans table. */
export const SERIF_SCALE = 1.12;

/** A width function: text to px. */
export type Measure = (text: string) => number;

/** Options of {@link wrapText}. */
export interface WrapOptions {
  weight?: number;
  /** Multiplier on the estimated width (use {@link SERIF_SCALE} for serif text). */
  scale?: number;
  /** Cut off after this many lines, ending the last with an ellipsis. */
  maxLines?: number;
  /** Replace the built-in estimator (e.g. with canvas `measureText`). */
  measure?: Measure;
}

const ELLIPSIS = '…';

/** Shorten `text` to fit `maxWidth` on one line, ending with an ellipsis when cut. */
export function truncateToWidth(text: string, maxWidth: number, measure: Measure): string {
  if (measure(text) <= maxWidth) return text;
  const chars = Array.from(text);
  while (chars.length > 0 && measure(chars.join('').trimEnd() + ELLIPSIS) > maxWidth) chars.pop();
  return chars.length === 0 ? ELLIPSIS : chars.join('').trimEnd() + ELLIPSIS;
}

/** Split a word wider than a line into pieces that each fit. */
function breakWord(word: string, maxWidth: number, measure: Measure): string[] {
  const pieces: string[] = [];
  let current = '';
  for (const ch of word) {
    if (current && measure(current + ch) > maxWidth) {
      pieces.push(current);
      current = ch;
    } else current += ch;
  }
  if (current) pieces.push(current);
  return pieces;
}

/**
 * Wrap text into lines that each fit `maxWidth`. Breaks at spaces, splits
 * words that are wider than a line, collapses whitespace and, with
 * `maxLines`, truncates the last line with an ellipsis. Never returns a line
 * wider than `maxWidth` (by the measure used).
 *
 * @param text Source text; newlines count as spaces.
 * @param maxWidth Line width in px.
 * @param fontSize Font size in px.
 */
export function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  options: WrapOptions = {},
): string[] {
  const measure: Measure =
    options.measure ??
    ((t) => estimateTextWidth(t, fontSize, options.weight ?? 400, options.scale ?? 1));
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  const push = (): void => {
    if (current) lines.push(current);
    current = '';
  };
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measure(candidate) <= maxWidth) {
      current = candidate;
      continue;
    }
    push();
    if (measure(word) <= maxWidth) current = word;
    else {
      const pieces = breakWord(word, maxWidth, measure);
      current = pieces.pop() ?? '';
      lines.push(...pieces);
    }
  }
  push();
  const max = options.maxLines;
  if (max !== undefined && lines.length > max) {
    const kept = lines.slice(0, Math.max(1, max));
    const rest = lines.slice(kept.length).join(' ');
    const last = kept[kept.length - 1] ?? '';
    kept[kept.length - 1] = truncateToWidth(rest ? `${last} ${rest}` : last, maxWidth, measure);
    return kept;
  }
  return lines;
}

/**
 * The largest font size in `[min, max]` at which `text` fits `maxLines` lines
 * of `maxWidth`, or `min` when even that needs truncation.
 */
export function fitFontSize(
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number,
  maxLines: number,
  weight = 400,
  scale = 1,
): number {
  for (let size = maxSize; size > minSize; size -= 2) {
    const lines = wrapText(text, maxWidth, size, { weight, scale });
    if (lines.length <= maxLines) return size;
  }
  return minSize;
}
