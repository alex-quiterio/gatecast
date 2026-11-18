import type { CenterName, Chart, GateSource } from '@/types';
import { CENTER_NAMES } from '@/types';
import { CHANNEL_LIST, centerOfGate, channelKey } from '@engine/data';
import {
  CENTER_SHAPES,
  CHANNEL_PATHS,
  GATE_POSITIONS,
  HEAD_ELLIPSE,
  SILHOUETTE_PATH,
  BODYGRAPH_VIEWBOX,
  centerCentroid,
  cubicPath,
  splitCubic,
} from './geometry';
import type { CubicBezier, Point } from './geometry';
import { CENTER_LABELS, CENTER_TEXT_VARIABLE, CENTER_VARIABLE, cssVar } from './palette';
import { el, escapeXml, fmt, svgRoot, textEl } from './svg';

/** Options for {@link renderBodygraph}. */
export interface BodygraphOptions {
  /** Draw gate numbers (default true). */
  showGateNumbers?: boolean;
  /** Prefix for every `id` in the SVG, so two SVGs can share a page (default `hd`). */
  idPrefix?: string;
}

const SOURCE_LABEL: Record<GateSource, string> = {
  personality: 'personality',
  design: 'design',
  both: 'personality and design',
};

/** Points string of a center outline. */
export function polygonPoints(center: CenterName): string {
  return CENTER_SHAPES[center].map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' ');
}

/** Subtle human silhouette behind the centers. */
export function silhouetteMarkup(): string {
  const fill = cssVar('--hd-body');
  const h = HEAD_ELLIPSE;
  return (
    `<g class="hd-body" aria-hidden="true" fill="${fill}">` +
    el('ellipse', { cx: h.cx, cy: h.cy, rx: h.rx, ry: h.ry }) +
    el('path', { d: SILHOUETTE_PATH }) +
    '</g>'
  );
}

/** Dark tracks for all 36 channels, drawn under the active bars. */
export function tracksMarkup(): string {
  const paths = CHANNEL_LIST.map((c) => {
    const bez = CHANNEL_PATHS[channelKey(...c.gates)];
    return bez ? el('path', { d: cubicPath(bez) }) : '';
  }).join('');
  return (
    `<g class="hd-channel-tracks" aria-hidden="true" fill="none" stroke="${cssVar('--hd-channel-track')}"` +
    ` stroke-width="9.5" stroke-linecap="butt">${paths}</g>`
  );
}

/** One half bar; `both` is red with an ivory core. */
function halfBar(c: CubicBezier, source: GateSource, width: number): string {
  const d = cubicPath(c);
  const design = cssVar('--hd-design');
  const ivory = cssVar('--hd-personality');
  if (source === 'personality') return el('path', { d, stroke: ivory, 'stroke-width': width });
  if (source === 'design') return el('path', { d, stroke: design, 'stroke-width': width });
  return (
    el('path', { d, stroke: design, 'stroke-width': width }) +
    el('path', { d, stroke: ivory, 'stroke-width': width * 0.38 })
  );
}

/** The two coloured halves of a channel, split at t = 0.5. */
export function channelBars(bez: CubicBezier, a: GateSource, b: GateSource, width = 6): string {
  const [first, second] = splitCubic(bez, 0.5);
  return halfBar(first, a, width) + halfBar(second, b, width);
}

/** Wrap a layer so it glows softly, honouring `--hd-glow` (0 hides it). */
export function glowLayer(glowId: string, inner: string, extra = ''): string {
  return (
    `<g class="hd-glow" aria-hidden="true" ${extra} filter="url(#${escapeXml(glowId)})"` +
    ` style="opacity:var(--hd-glow,0.9)" fill="none" stroke-linecap="butt">${inner}</g>`
  );
}

/** The state a center is drawn in. */
export type CenterState = 'defined' | 'open';

/** One center polygon with hooks. `newly` adds a dashed highlight (composite). */
export function centerMarkup(center: CenterName, state: CenterState, extraLabel = ''): string {
  const defined = state === 'defined';
  const fill = defined ? cssVar(CENTER_VARIABLE[center]) : cssVar('--hd-center-open-fill');
  const stroke = defined ? cssVar(CENTER_VARIABLE[center]) : cssVar('--hd-center-open-stroke');
  const label = `${CENTER_LABELS[center]} center, ${state}${extraLabel}`;
  return el('polygon', {
    class: `hd-center hd-center--${state}`,
    'data-center': center,
    'data-tip': `center:${center}`,
    tabindex: 0,
    focusable: 'true',
    role: 'graphics-symbol',
    'aria-label': label,
    points: polygonPoints(center),
    fill,
    stroke,
    'stroke-width': defined ? 5 : 2,
    'stroke-linejoin': 'round',
  });
}

/** Position of an inactive gate's number: nudged toward the center's middle. */
export function inwardPoint(gate: number): Point {
  const p = GATE_POSITIONS[gate];
  if (!p) throw new RangeError(`Unknown gate ${gate}`);
  const c = centerCentroid(centerOfGate(gate));
  const dx = c.x - p.x;
  const dy = c.y - p.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: p.x + (dx / len) * 9, y: p.y + (dy / len) * 9 };
}

/** Fill of the text drawn on a center. */
export function numberFill(center: CenterName, defined: boolean): string {
  return defined ? cssVar(CENTER_TEXT_VARIABLE[center]) : cssVar('--hd-center-open-text');
}

/** Number of an inactive gate (plain text, hover hook only). */
export function inactiveGateMarkup(gate: number, defined: boolean, showNumber: boolean): string {
  const center = centerOfGate(gate);
  const at = GATE_POSITIONS[gate];
  const inward = inwardPoint(gate);
  if (!at) return '';
  const label = `Gate ${gate}, inactive, ${CENTER_LABELS[center]} center, ${defined ? 'defined' : 'open'}`;
  return el(
    'g',
    {
      class: 'hd-gate hd-gate--inactive',
      'data-gate': gate,
      'data-tip': `gate:${gate}`,
      'aria-label': label,
    },
    el('circle', { cx: at.x, cy: at.y, r: 7, fill: 'transparent' }) +
      (showNumber
        ? textEl(
            {
              x: inward.x,
              y: inward.y,
              dy: '0.35em',
              'text-anchor': 'middle',
              'font-size': 6.6,
              'font-weight': 500,
              fill: numberFill(center, defined),
              'pointer-events': 'none',
            },
            String(gate),
          )
        : ''),
  );
}

/** Active gate dot ringed by its source (ivory personality, rose design, both = double ring). */
export function activeGateMarkup(
  gate: number,
  source: GateSource,
  defined: boolean,
  showNumber: boolean,
): string {
  const center = centerOfGate(gate);
  const at = GATE_POSITIONS[gate];
  if (!at) return '';
  const ivory = cssVar('--hd-personality');
  const design = cssVar('--hd-design');
  const label = `Gate ${gate}, active in ${SOURCE_LABEL[source]}, ${CENTER_LABELS[center]} center, ${defined ? 'defined' : 'open'}`;
  const dot = el('circle', {
    cx: at.x,
    cy: at.y,
    r: 6.4,
    fill: cssVar('--hd-gate-dot'),
    stroke: source === 'design' ? design : ivory,
    'stroke-width': 1.6,
  });
  const outer =
    source === 'both'
      ? el('circle', {
          cx: at.x,
          cy: at.y,
          r: 8.2,
          fill: 'none',
          stroke: design,
          'stroke-width': 1.6,
        })
      : '';
  const num = showNumber
    ? textEl(
        {
          x: at.x,
          y: at.y,
          dy: '0.35em',
          'text-anchor': 'middle',
          'font-size': 6.8,
          'font-weight': 700,
          fill: cssVar('--hd-gate-dot-text'),
          'pointer-events': 'none',
        },
        String(gate),
      )
    : '';
  return el(
    'g',
    {
      class: `hd-gate hd-gate--active hd-gate--${source}`,
      'data-gate': gate,
      'data-source': source,
      'data-tip': `gate:${gate}`,
      tabindex: 0,
      focusable: 'true',
      role: 'graphics-symbol',
      'aria-label': label,
    },
    outer + dot + num,
  );
}

/** Complete channels of a chart with the source of each end. */
function activeChannelBars(
  chart: Chart,
): { key: string; bez: CubicBezier; a: GateSource; b: GateSource }[] {
  const out: { key: string; bez: CubicBezier; a: GateSource; b: GateSource }[] = [];
  for (const ch of chart.channels) {
    const key = channelKey(...ch.gates);
    const bez = CHANNEL_PATHS[key];
    const a = chart.gateSources[ch.gates[0]];
    const b = chart.gateSources[ch.gates[1]];
    if (bez && a && b) out.push({ key, bez, a, b });
  }
  return out;
}

/** Summary sentence used as the `<title>` of a chart. */
export function chartSummary(chart: Chart): string {
  const centers = chart.definedCenters.map((c) => CENTER_LABELS[c]).join(', ') || 'none';
  const name = chart.input.name.trim();
  return (
    `${name ? `${name}: ` : ''}${chart.type}, ${chart.profile} profile, ${chart.authority} authority, ` +
    `${chart.definition}. Defined centers: ${centers}.`
  );
}

/** Inner markup of the BodyGraph (no root element); `glowId` names the root's glow filter. */
export function bodygraphMarkup(
  chart: Chart,
  options: { showGateNumbers?: boolean; glowId: string },
): string {
  const showNumbers = options.showGateNumbers ?? true;
  const defined = new Set<CenterName>(chart.definedCenters);
  const bars = activeChannelBars(chart);

  const glowCenters = [...defined]
    .map((c) => el('polygon', { points: polygonPoints(c), fill: cssVar(CENTER_VARIABLE[c]) }))
    .join('');
  const glowBars = bars.map((b) => channelBars(b.bez, b.a, b.b, 7)).join('');

  const channelGroups = bars
    .map((b) => {
      const info = CHANNEL_LIST.find((c) => channelKey(...c.gates) === b.key);
      const names = info
        ? `${CENTER_LABELS[info.centers[0]]} to ${CENTER_LABELS[info.centers[1]]}`
        : '';
      const label = `Channel ${b.key}, ${names}, gate ${b.key.split('-')[0]} ${SOURCE_LABEL[b.a]}, gate ${b.key.split('-')[1]} ${SOURCE_LABEL[b.b]}`;
      return el(
        'g',
        {
          class: 'hd-channel hd-channel--active',
          'data-channel': b.key,
          'data-tip': `channel:${b.key}`,
          tabindex: 0,
          focusable: 'true',
          role: 'graphics-symbol',
          'aria-label': label,
          fill: 'none',
          'stroke-linecap': 'butt',
        },
        el('path', { d: cubicPath(b.bez), stroke: 'transparent', 'stroke-width': 16 }) +
          channelBars(b.bez, b.a, b.b),
      );
    })
    .join('');

  const centers = CENTER_NAMES.map((c) =>
    centerMarkup(c, defined.has(c) ? 'defined' : 'open'),
  ).join('');

  const gates: string[] = [];
  for (let gate = 1; gate <= 64; gate++) {
    const isDefined = defined.has(centerOfGate(gate));
    const source = chart.gateSources[gate];
    gates.push(
      source
        ? activeGateMarkup(gate, source, isDefined, showNumbers)
        : inactiveGateMarkup(gate, isDefined, showNumbers),
    );
  }

  return (
    silhouetteMarkup() +
    tracksMarkup() +
    glowLayer(options.glowId, glowBars) +
    glowLayer(options.glowId, glowCenters, 'stroke="none"') +
    `<g class="hd-channels">${channelGroups}</g>` +
    `<g class="hd-centers">${centers}</g>` +
    `<g class="hd-gates">${gates.join('')}</g>`
  );
}

/**
 * Render the BodyGraph of one chart as a complete responsive `<svg>` string.
 * Personality is ivory, design rose red, both-sources red with an ivory core.
 */
export function renderBodygraph(chart: Chart, options: BodygraphOptions = {}): string {
  const idPrefix = options.idPrefix ?? 'hd';
  return svgRoot({
    viewBox: `0 0 ${BODYGRAPH_VIEWBOX.width} ${BODYGRAPH_VIEWBOX.height}`,
    className: 'hd-bodygraph',
    idPrefix,
    title: `BodyGraph. ${chartSummary(chart)}`,
    description:
      `Active channels: ${chart.channels.map((c) => c.gates.join('-')).join(', ') || 'none'}. ` +
      `Active gates: ${chart.activeGates.join(', ') || 'none'}.`,
    body: bodygraphMarkup(chart, {
      showGateNumbers: options.showGateNumbers,
      glowId: `${idPrefix}-glow`,
    }),
  });
}
