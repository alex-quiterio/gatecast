import type { Activation, Chart, GateSource } from '@/types';
import { GATE_WHEEL, centerOfGate } from '@engine';
import { GATE_SIZE, WHEEL_START_DEGREES } from '@engine/data';
import { bodygraphMarkup, chartSummary } from './bodygraph';
import {
  CENTER_LABELS,
  CENTER_TEXT_VARIABLE,
  CENTER_VARIABLE,
  PLANET_GLYPHS,
  TEXT_PRESENTATION,
  ZODIAC_GLYPHS,
  cssVar,
} from './palette';
import { el, escapeXml, fmt, svgRoot, textEl } from './svg';

/*
 * Orientation: the classic natal-chart layout. Longitude 0 (0 degrees Aries)
 * is at 9 o'clock and longitude increases counter-clockwise, so Cancer sits at
 * the bottom, Libra at 3 o'clock and Capricorn at the top. A point at radius r
 * and longitude L is at (-r cos L, r sin L) in SVG coordinates (y down).
 */

/** Options for {@link renderWheel}. */
export interface WheelOptions {
  /** Prefix for every `id` in the SVG (default `hd`). */
  idPrefix?: string;
  /** Embed the BodyGraph in the middle of the wheel (default true). */
  includeBodygraph?: boolean;
}

const R = {
  zodiacIn: 326,
  zodiacOut: 360,
  gateIn: 366,
  gateOut: 410,
  gateText: 389,
  hexagram: 436,
  outer: 468,
};
const GLYPH_FONT = 'Apple Symbols,Noto Sans Symbols 2,Segoe UI Symbol,DejaVu Sans,sans-serif';
const BODY_SCALE = 0.72;
const MIN_GLYPH_DISTANCE = 25;

/** Point at radius `r` and ecliptic longitude `lon` (degrees). */
export function polar(r: number, lon: number): { x: number; y: number } {
  const a = (lon * Math.PI) / 180;
  return { x: -r * Math.cos(a), y: r * Math.sin(a) };
}

/** Annular sector from longitude a1 to a2 (a2 > a1, span under 180). */
export function sectorPath(r1: number, r2: number, a1: number, a2: number): string {
  const o1 = polar(r2, a1);
  const o2 = polar(r2, a2);
  const i2 = polar(r1, a2);
  const i1 = polar(r1, a1);
  const f = (p: { x: number; y: number }): string => `${fmt(p.x)} ${fmt(p.y)}`;
  return `M${f(o1)}A${r2} ${r2} 0 0 0 ${f(o2)}L${f(i2)}A${r1} ${r1} 0 0 1 ${f(i1)}Z`;
}

/** Longitude where a gate's span starts, from the wheel order. */
export function gateStartDegrees(gate: number): number {
  const index = GATE_WHEEL.indexOf(gate);
  if (index < 0) throw new RangeError(`Unknown gate ${gate}`);
  return (WHEEL_START_DEGREES + index * GATE_SIZE) % 360;
}

const ELEMENT_VARIABLE = [
  '--hd-zodiac-fire',
  '--hd-zodiac-earth',
  '--hd-zodiac-air',
  '--hd-zodiac-water',
] as const;

function zodiacRing(): string {
  const segments = ZODIAC_GLYPHS.map((glyph, i) => {
    const variable = ELEMENT_VARIABLE[i % 4] ?? '--hd-zodiac-fire';
    const mid = polar((R.zodiacIn + R.zodiacOut) / 2, i * 30 + 15);
    return (
      el('path', {
        class: 'hd-wheel-sign',
        d: sectorPath(R.zodiacIn, R.zodiacOut, i * 30 + 0.3, i * 30 + 29.7),
        fill: cssVar(variable),
        'fill-opacity': 0.92,
      }) +
      textEl(
        {
          x: mid.x,
          y: mid.y,
          dy: '0.35em',
          'text-anchor': 'middle',
          'font-size': 20,
          fill: cssVar('--hd-zodiac-text'),
        },
        glyph + TEXT_PRESENTATION,
      )
    );
  }).join('');
  return `<g class="hd-zodiac" aria-hidden="true" font-family="${GLYPH_FONT}">${segments}</g>`;
}

function sourceStrip(gate: number, source: GateSource): string {
  const a1 = gateStartDegrees(gate) + 0.2;
  const a2 = gateStartDegrees(gate) + GATE_SIZE - 0.2;
  const ivory = cssVar('--hd-personality');
  const design = cssVar('--hd-design');
  const strip = (r1: number, r2: number, fill: string): string =>
    el('path', { d: sectorPath(r1, r2, a1, a2), fill });
  if (source === 'personality') return strip(R.gateIn, R.gateIn + 4, ivory);
  if (source === 'design') return strip(R.gateIn, R.gateIn + 4, design);
  return strip(R.gateIn, R.gateIn + 2, ivory) + strip(R.gateIn + 2, R.gateIn + 4, design);
}

function gateCells(chart: Chart): { cells: string; glow: string; hexagrams: string } {
  let cells = '';
  let glow = '';
  let hexagrams = '';
  GATE_WHEEL.forEach((gate, index) => {
    const start = (WHEEL_START_DEGREES + index * GATE_SIZE) % 360;
    const source = chart.gateSources[gate];
    const center = centerOfGate(gate);
    const d = sectorPath(R.gateIn, R.gateOut, start + 0.2, start + GATE_SIZE - 0.2);
    const at = polar(R.gateText, start + GATE_SIZE / 2);
    const label = source
      ? `Gate ${gate}, active in ${source === 'both' ? 'personality and design' : source}, ${CENTER_LABELS[center]} center`
      : `Gate ${gate}, inactive, ${CENTER_LABELS[center]} center`;
    const fill = source ? cssVar(CENTER_VARIABLE[center]) : cssVar('--hd-wheel-cell');
    if (source) glow += el('path', { d, fill: cssVar(CENTER_VARIABLE[center]) });
    cells += el(
      'g',
      {
        class: `hd-wheel-gate hd-wheel-gate--${source ? 'active' : 'inactive'}`,
        'data-gate': gate,
        'data-tip': `gate:${gate}`,
        tabindex: source ? 0 : undefined,
        focusable: source ? 'true' : undefined,
        role: 'graphics-symbol',
        'aria-label': label,
      },
      el('path', { d, fill }) +
        (source ? sourceStrip(gate, source) : '') +
        textEl(
          {
            x: at.x,
            y: at.y,
            dy: '0.35em',
            'text-anchor': 'middle',
            'font-size': source ? 14 : 10.5,
            'font-weight': source ? 700 : 400,
            fill: source ? cssVar(CENTER_TEXT_VARIABLE[center]) : cssVar('--hd-wheel-cell-text'),
            'pointer-events': 'none',
          },
          String(gate),
        ),
    );
    const hex = polar(R.hexagram, start + GATE_SIZE / 2);
    const rotation = (Math.atan2(hex.x, -hex.y) * 180) / Math.PI;
    hexagrams += textEl(
      {
        transform: `translate(${fmt(hex.x)} ${fmt(hex.y)}) rotate(${fmt(rotation)})`,
        'text-anchor': 'middle',
        dy: '0.35em',
        'font-size': 27,
        fill: source ? cssVar('--hd-hexagram-active') : cssVar('--hd-hexagram'),
      },
      String.fromCodePoint(0x4dc0 + gate - 1) + TEXT_PRESENTATION,
    );
  });
  return { cells, glow, hexagrams };
}

interface PlacedGlyph {
  activation: Activation;
  side: 'personality' | 'design';
  x: number;
  y: number;
  radius: number;
}

/** Place the 26 planet glyphs, stepping inward when two would overlap. */
export function placePlanets(chart: Chart): PlacedGlyph[] {
  const items: { activation: Activation; side: 'personality' | 'design' }[] = [
    ...chart.personality.map((activation) => ({ activation, side: 'personality' as const })),
    ...chart.design.map((activation) => ({ activation, side: 'design' as const })),
  ].sort((a, b) => a.activation.longitude - b.activation.longitude);
  const placed: PlacedGlyph[] = [];
  for (const item of items) {
    const candidates = item.side === 'personality' ? [300, 274, 248, 222] : [272, 246, 220, 298];
    const clearance = (radius: number): number => {
      const p = polar(radius, item.activation.longitude);
      return placed.reduce((m, o) => Math.min(m, Math.hypot(o.x - p.x, o.y - p.y)), Infinity);
    };
    const chosen =
      candidates.find((radius) => clearance(radius) >= MIN_GLYPH_DISTANCE) ??
      candidates.reduce((best, radius) => (clearance(radius) > clearance(best) ? radius : best));
    const position = polar(chosen, item.activation.longitude);
    placed.push({ ...item, x: position.x, y: position.y, radius: chosen });
  }
  return placed;
}

function planetLayer(chart: Chart, idPrefix: string): string {
  const placed = placePlanets(chart);
  const rays = placed
    .map((g) => {
      const lon = g.activation.longitude;
      const a = polar(70, lon - 0.35);
      const b = polar(70, lon + 0.35);
      const c = polar(g.radius - 12, lon + 2.3);
      const d = polar(g.radius - 12, lon - 2.3);
      const points = [a, b, c, d].map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' ');
      return el('polygon', {
        class: 'hd-ray',
        points,
        fill: `url(#${idPrefix}-ray-${g.side})`,
      });
    })
    .join('');
  const glyphs = placed
    .map((g) => {
      const act = g.activation;
      const name = act.planet;
      const label = `${name}, ${g.side}, gate ${act.gate} line ${act.line}, ${CENTER_LABELS[act.center]} center`;
      return el(
        'g',
        {
          class: `hd-planet hd-planet--${g.side}`,
          'data-planet': name,
          'data-side': g.side,
          'data-tip': `planet:${name}`,
          tabindex: 0,
          focusable: 'true',
          role: 'graphics-symbol',
          'aria-label': label,
        },
        el('circle', { cx: g.x, cy: g.y, r: 13, fill: 'transparent' }) +
          textEl(
            {
              x: g.x,
              y: g.y,
              dy: '0.35em',
              'text-anchor': 'middle',
              'font-size': 22,
              fill: g.side === 'personality' ? cssVar('--hd-personality') : cssVar('--hd-design'),
              stroke: cssVar('--hd-body'),
              'stroke-width': 3,
              'paint-order': 'stroke',
              'pointer-events': 'none',
            },
            PLANET_GLYPHS[name] + TEXT_PRESENTATION,
          ),
      );
    })
    .join('');
  return (
    `<g class="hd-rays" aria-hidden="true" style="opacity:var(--hd-glow,0.9)">${rays}</g>` +
    `<g class="hd-planets" font-family="${GLYPH_FONT}">${glyphs}</g>`
  );
}

function rayGradients(idPrefix: string): string {
  const stops = (variable: 'personality' | 'design'): string => {
    const colour = cssVar(variable === 'personality' ? '--hd-personality' : '--hd-design');
    return (
      `<stop offset="0.2" stop-color="${colour}" stop-opacity="0"/>` +
      `<stop offset="1" stop-color="${colour}" stop-opacity="0.26"/>`
    );
  };
  const grad = (side: 'personality' | 'design'): string =>
    `<radialGradient id="${escapeXml(idPrefix)}-ray-${side}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="300">${stops(side)}</radialGradient>`;
  return grad('personality') + grad('design');
}

/**
 * Render the gate wheel for a chart: zodiac ring, 64 gate cells (active ones
 * boxed in their center colour), hexagram glyphs, 13 + 13 planet glyphs with
 * soft rays, and optionally the BodyGraph in the middle.
 */
export function renderWheel(chart: Chart, options: WheelOptions = {}): string {
  const idPrefix = options.idPrefix ?? 'hd';
  const { cells, glow, hexagrams } = gateCells(chart);
  const include = options.includeBodygraph ?? true;
  const s = BODY_SCALE;
  const body = include
    ? `<g class="hd-wheel-body" transform="translate(${fmt(-200 * s)} ${fmt(-300 * s)}) scale(${s})">` +
      bodygraphMarkup(chart, { glowId: `${idPrefix}-glow` }) +
      '</g>'
    : '';
  const inner =
    `<defs>${rayGradients(idPrefix)}</defs>` +
    el('circle', {
      class: 'hd-wheel-disc',
      r: R.zodiacIn - 2,
      fill: cssVar('--hd-wheel-cell'),
      'fill-opacity': 0.35,
      stroke: cssVar('--hd-wheel-line'),
      'aria-hidden': 'true',
    }) +
    el('circle', {
      r: R.outer,
      fill: 'none',
      stroke: cssVar('--hd-wheel-line'),
      'stroke-width': 1,
      'aria-hidden': 'true',
    }) +
    zodiacRing() +
    `<g class="hd-wheel-glow" aria-hidden="true" filter="url(#${escapeXml(idPrefix)}-glow)" style="opacity:var(--hd-glow,0.9)">${glow}</g>` +
    `<g class="hd-wheel-gates">${cells}</g>` +
    `<g class="hd-hexagrams" aria-hidden="true" font-family="${GLYPH_FONT}">${hexagrams}</g>` +
    body +
    planetLayer(chart, idPrefix);
  return svgRoot({
    viewBox: '-480 -480 960 960',
    className: 'hd-wheel',
    idPrefix,
    title: `Gate wheel. ${chartSummary(chart)}`,
    description:
      'Zodiac ring, the 64 gates in wheel order with active gates highlighted, ' +
      'and the thirteen personality and thirteen design planet positions.',
    body: inner,
  });
}
