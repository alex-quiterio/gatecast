import type { Chart } from '@/types';
import { AUTHORITIES, GATES, PROFILES } from '@content';
import { activationLabel, centerLabel, describeBirth } from './views/common';

/** Name of the ephemeris the engine uses, shown in the status bar. */
export const EPHEMERIS_NAME = 'astronomy-engine 2.1';

/** Julian day number of an ISO 8601 UTC moment, or `NaN` for an invalid one. */
export function julianDay(iso: string): number {
  return Date.parse(iso) / 86_400_000 + 2_440_587.5;
}

/** `2000-01-01T12:00:00.000Z` becomes `2000-01-01 12:00:00 UTC`. */
export function formatUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toISOString().slice(0, 19).replace('T', ' ')} UTC`;
}

/** The numbers shown in the workspace status bar. */
export function auditFacts(chart: Chart): { label: string; value: string }[] {
  return [
    { label: 'Birth', value: formatUtc(chart.birthUtc) },
    { label: 'JD', value: julianDay(chart.birthUtc).toFixed(5) },
    { label: 'Design', value: formatUtc(chart.designUtc) },
    { label: 'Ephemeris', value: EPHEMERIS_NAME },
  ];
}

/** Plain-text summary of a chart, for "Copy summary". */
export function summaryText(chart: Chart): string {
  const cross = chart.crossGates;
  const lines = [
    `${chart.input.name || 'Chart'}`,
    describeBirth(chart.input),
    '',
    `Type: ${chart.type}`,
    `Strategy: ${chart.strategy}`,
    `Authority: ${AUTHORITIES[chart.authority]?.title ?? chart.authority}`,
    `Profile: ${chart.profile} ${PROFILES[chart.profile]?.name ?? ''}`.trimEnd(),
    `Definition: ${chart.definition}`,
    `Not-self theme: ${chart.notSelfTheme}`,
    `Incarnation Cross: ${cross.personalitySun}/${cross.personalityEarth} | ${cross.designSun}/${cross.designEarth}`,
    `Defined centers: ${chart.definedCenters.map(centerLabel).join(', ') || 'none'}`,
    `Open centers: ${chart.openCenters.map(centerLabel).join(', ') || 'none'}`,
    `Channels: ${chart.channels.map((c) => c.gates.join('-')).join(', ') || 'none'}`,
    '',
    'Personality: ' +
      chart.personality
        .map((a) => `${a.planet} ${activationLabel(a)} (${GATES[a.gate]?.name ?? ''})`)
        .join('; '),
    'Design: ' +
      chart.design
        .map((a) => `${a.planet} ${activationLabel(a)} (${GATES[a.gate]?.name ?? ''})`)
        .join('; '),
  ];
  return lines.join('\n');
}

/**
 * Replace every `var(--name, fallback)` in an SVG string with a concrete value
 * so the file renders the same outside the page. Unknown variables use their
 * fallback.
 *
 * @param svg SVG markup from one of the renderers.
 * @param lookup Resolves a custom property name (e.g. via `getComputedStyle`).
 */
export function resolveCssVars(svg: string, lookup: (name: string) => string): string {
  return svg.replace(/var\((--[\w-]+)\s*(?:,\s*([^)]*))?\)/g, (_all, name: string, fb?: string) => {
    const value = lookup(name).trim();
    return value || (fb ?? 'currentColor').trim();
  });
}

/** Read the `viewBox` width and height of an SVG string. */
export function svgSize(svg: string): { x: number; y: number; width: number; height: number } {
  const m = /viewBox="\s*([-\d.]+)[ ,]+([-\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)\s*"/.exec(svg);
  return {
    x: Number(m?.[1] ?? 0) || 0,
    y: Number(m?.[2] ?? 0) || 0,
    width: Number(m?.[3] ?? 0) || 800,
    height: Number(m?.[4] ?? 0) || 800,
  };
}

/**
 * Turn renderer markup into a standalone SVG file: concrete colours, explicit
 * size and an opaque background.
 */
export function standaloneSvg(svg: string, lookup: (name: string) => string, scale = 1): string {
  const { x, y, width, height } = svgSize(svg);
  const resolved = resolveCssVars(svg, lookup);
  const bg = lookup('--gc-canvas').trim() || '#ffffff';
  return resolved
    .replace(
      '<svg ',
      `<svg width="${Math.round(width * scale)}" height="${Math.round(height * scale)}" `,
    )
    .replace(
      /(<style>.*?<\/style>)/,
      `$1<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${bg}"/>`,
    );
}
