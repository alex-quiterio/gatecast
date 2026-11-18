/**
 * Tiny string-building helpers shared by the SVG renderers. No DOM is used,
 * so everything runs (and is tested) under plain bun.
 */

/** Escape text for use in XML/HTML text nodes and double or single quoted attributes. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Format a number with at most two decimals and no trailing zeros. */
export function fmt(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

export type AttrValue = string | number | boolean | undefined;

/** Serialise attributes. `undefined` and `false` are skipped, `true` becomes `name="true"`. */
export function attrs(values: Record<string, AttrValue>): string {
  let out = '';
  for (const [name, value] of Object.entries(values)) {
    if (value === undefined || value === false) continue;
    const text = typeof value === 'number' ? fmt(value) : String(value);
    out += ` ${name}="${escapeXml(text)}"`;
  }
  return out;
}

/** Build one element. Without children the element is self-closing. */
export function el(name: string, values: Record<string, AttrValue>, children?: string): string {
  return children === undefined
    ? `<${name}${attrs(values)}/>`
    : `<${name}${attrs(values)}>${children}</${name}>`;
}

/** Build a `<text>` element; `content` is escaped here. */
export function textEl(values: Record<string, AttrValue>, content: string): string {
  return el('text', values, escapeXml(content));
}

export interface SvgRootOptions {
  viewBox: string;
  className: string;
  idPrefix: string;
  title: string;
  description: string;
  body: string;
}

/** Scoped focus/hover rules; harmless when repeated because they are idempotent. */
const BASE_STYLE =
  '.hd-svg [tabindex]{outline:none;cursor:pointer}' +
  '.hd-svg [tabindex]:focus-visible{outline:2px solid var(--hd-focus,#a78bfa);outline-offset:2px}' +
  '.hd-svg [data-tip]:hover{filter:brightness(1.12)}';

/** The soft glow filter, defined once per SVG with a prefix-scoped id. */
export function glowDefs(idPrefix: string): string {
  return (
    `<filter id="${escapeXml(idPrefix)}-glow" x="-40%" y="-40%" width="180%" height="180%">` +
    '<feGaussianBlur stdDeviation="5"/></filter>'
  );
}

/** Wrap content in a responsive, accessible root `<svg>`. */
export function svgRoot(o: SvgRootOptions): string {
  const p = escapeXml(o.idPrefix);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${escapeXml(o.viewBox)}"` +
    ` class="hd-svg ${escapeXml(o.className)}" role="img" preserveAspectRatio="xMidYMid meet"` +
    ` aria-labelledby="${p}-title ${p}-desc" focusable="false">` +
    `<title id="${p}-title">${escapeXml(o.title)}</title>` +
    `<desc id="${p}-desc">${escapeXml(o.description)}</desc>` +
    `<style>${BASE_STYLE}</style>` +
    `<defs>${glowDefs(o.idPrefix)}</defs>` +
    `${o.body}</svg>`
  );
}
