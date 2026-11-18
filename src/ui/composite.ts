import type { CenterName, Chart, ComparedChannel, Comparison, DynamicKind } from '@/types';
import { CENTER_NAMES } from '@/types';
import { centerOfGate } from '@engine';
import {
  centerMarkup,
  chartSummary,
  glowLayer,
  inactiveGateMarkup,
  polygonPoints,
  silhouetteMarkup,
  tracksMarkup,
} from './bodygraph';
import { BODYGRAPH_VIEWBOX, CHANNEL_PATHS, GATE_POSITIONS, cubicPath } from './geometry';
import { CENTER_LABELS, CENTER_VARIABLE, DYNAMIC_DASH, DYNAMIC_VARIABLE, cssVar } from './palette';
import { el, escapeXml, svgRoot, textEl } from './svg';

/** Options for {@link renderComposite}. */
export interface CompositeOptions {
  /** Prefix for every `id` in the SVG (default `hd`). */
  idPrefix?: string;
  /** Draw the legend inside the SVG (default true). */
  legend?: boolean;
}

/** Human labels and one-line meaning of each dynamic. */
export const DYNAMIC_LABELS: Record<DynamicKind, { label: string; meaning: string }> = {
  electromagnetic: {
    label: 'Electromagnetic',
    meaning: 'each of you holds one gate: you complete it together',
  },
  companionship: { label: 'Companionship', meaning: 'you both have the whole channel' },
  dominance: {
    label: 'Dominance',
    meaning: 'one of you has the channel, the other has neither gate',
  },
  compromise: {
    label: 'Compromise',
    meaning: 'one of you has the channel, the other has one of its gates',
  },
};

const KINDS: readonly DynamicKind[] = [
  'electromagnetic',
  'companionship',
  'dominance',
  'compromise',
];
const LEGEND_TOP = 612;
const COMPOSITE_HEIGHT = 700;

function capOf(kind: DynamicKind): 'round' | 'butt' {
  return kind === 'dominance' ? 'round' : 'butt';
}

function channelBar(c: ComparedChannel): string {
  const bez = CHANNEL_PATHS[`${c.gates[0]}-${c.gates[1]}`];
  if (!bez) return '';
  const dash = DYNAMIC_DASH[c.kind];
  return el('path', {
    d: cubicPath(bez),
    stroke: cssVar(DYNAMIC_VARIABLE[c.kind]),
    'stroke-width': 6,
    'stroke-dasharray': dash,
    'stroke-linecap': capOf(c.kind),
  });
}

function channelGroup(c: ComparedChannel): string {
  const key = `${c.gates[0]}-${c.gates[1]}`;
  const bez = CHANNEL_PATHS[key];
  if (!bez) return '';
  const who = c.owner ? `, complete for person ${c.owner.toUpperCase()}` : '';
  const label = `Channel ${key}, ${CENTER_LABELS[c.centers[0]]} to ${CENTER_LABELS[c.centers[1]]}, ${DYNAMIC_LABELS[c.kind].label} dynamic${who}`;
  return el(
    'g',
    {
      class: `hd-channel hd-channel--${c.kind}`,
      'data-channel': key,
      'data-kind': c.kind,
      'data-owner': c.owner,
      'data-tip': `channel:${key}`,
      tabindex: 0,
      focusable: 'true',
      role: 'graphics-symbol',
      'aria-label': label,
      fill: 'none',
    },
    el('path', { d: cubicPath(bez), stroke: 'transparent', 'stroke-width': 16 }) + channelBar(c),
  );
}

/** Marker for who holds a gate: a circle ring for A, a square ring for B, both for shared. */
function personMarkers(x: number, y: number, a: boolean, b: boolean, r = 6.6): string {
  const dot = el('circle', { cx: x, cy: y, r, fill: cssVar('--hd-gate-dot') });
  const ringA = el('circle', {
    cx: x,
    cy: y,
    r,
    fill: 'none',
    stroke: cssVar('--hd-person-a'),
    'stroke-width': 1.8,
  });
  const half = r + 1.2;
  const ringB = el('rect', {
    x: x - half,
    y: y - half,
    width: half * 2,
    height: half * 2,
    rx: 2,
    fill: a || b ? 'none' : undefined,
    stroke: cssVar('--hd-person-b'),
    'stroke-width': 1.8,
  });
  return (
    (a ? dot : '') +
    (!a && b
      ? el('rect', {
          x: x - half,
          y: y - half,
          width: half * 2,
          height: half * 2,
          rx: 2,
          fill: cssVar('--hd-gate-dot'),
        })
      : '') +
    (a ? ringA : '') +
    (b ? ringB : '')
  );
}

function activeGate(
  gate: number,
  a: boolean,
  b: boolean,
  defined: boolean,
  nameA: string,
  nameB: string,
): string {
  const at = GATE_POSITIONS[gate];
  if (!at) return '';
  const who = a && b ? 'both people' : a ? nameA : nameB;
  const label = `Gate ${gate}, active in ${who}, ${CENTER_LABELS[centerOfGate(gate)]} center, ${defined ? 'defined' : 'open'} in the composite`;
  return el(
    'g',
    {
      class: `hd-gate hd-gate--active hd-gate--${a && b ? 'shared' : a ? 'a' : 'b'}`,
      'data-gate': gate,
      'data-person': a && b ? 'both' : a ? 'a' : 'b',
      'data-tip': `gate:${gate}`,
      tabindex: 0,
      focusable: 'true',
      role: 'graphics-symbol',
      'aria-label': label,
    },
    personMarkers(at.x, at.y, a, b) +
      textEl(
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
      ),
  );
}

function legendSwatch(kind: DynamicKind, x: number, y: number): string {
  return el('line', {
    x1: x,
    y1: y,
    x2: x + 34,
    y2: y,
    stroke: cssVar(DYNAMIC_VARIABLE[kind]),
    'stroke-width': 5,
    'stroke-dasharray': DYNAMIC_DASH[kind],
    'stroke-linecap': capOf(kind),
  });
}

function clip(name: string, fallback: string): string {
  const t = name.trim() || fallback;
  return t.length > 16 ? `${t.slice(0, 15)}…` : t;
}

function legendMarkup(nameA: string, nameB: string): string {
  const text = (x: number, y: number, s: string): string =>
    textEl(
      {
        x,
        y,
        dy: '0.35em',
        'font-size': 11,
        fill: cssVar('--hd-text'),
        'font-family': 'system-ui,sans-serif',
      },
      s,
    );
  const rows = KINDS.map((kind, i) => {
    const x = 18 + (i % 2) * 190;
    const y = LEGEND_TOP + 12 + Math.floor(i / 2) * 22;
    return legendSwatch(kind, x, y) + text(x + 42, y, DYNAMIC_LABELS[kind].label);
  }).join('');
  const py = LEGEND_TOP + 12 + 2 * 22 + 8;
  const persons =
    personMarkers(28, py, true, false, 6) +
    text(42, py, clip(nameA, 'Person A')) +
    personMarkers(124, py, false, true, 6) +
    text(138, py, clip(nameB, 'Person B')) +
    el('polygon', {
      points: `${20 + 190 - 4},${py - 6} ${20 + 190 + 14},${py - 6} ${20 + 190 + 14},${py + 6} ${20 + 190 - 4},${py + 6}`,
      fill: 'none',
      stroke: cssVar('--hd-text'),
      'stroke-width': 1.4,
      'stroke-dasharray': '3 2.5',
    }) +
    text(228, py, 'Newly defined');
  return `<g class="hd-legend" aria-hidden="true">${rows}${persons}</g>`;
}

/**
 * Render the composite BodyGraph of two charts. Channels are coloured by
 * dynamic and also differ by dash pattern (electromagnetic solid, companionship
 * dashed, dominance dotted, compromise dash-dot). Gates held by person A get a
 * circle ring, person B a square ring, shared gates both.
 */
export function renderComposite(
  a: Chart,
  b: Chart,
  comparison: Comparison,
  options: CompositeOptions = {},
): string {
  const idPrefix = options.idPrefix ?? 'hd';
  const showLegend = options.legend ?? true;
  const nameA = clip(a.input.name, 'Person A');
  const nameB = clip(b.input.name, 'Person B');
  const defined = new Set<CenterName>(comparison.compositeDefinedCenters);
  const newly = new Set<CenterName>(comparison.newlyDefinedCenters);
  const inA = new Set(a.activeGates);
  const inB = new Set(b.activeGates);

  const glowBars = comparison.channels
    .filter((c) => c.kind === 'electromagnetic')
    .map(channelBar)
    .join('');
  const glowCenters = [...defined]
    .map((c) => el('polygon', { points: polygonPoints(c), fill: cssVar(CENTER_VARIABLE[c]) }))
    .join('');
  const channels = comparison.channels.map(channelGroup).join('');
  const centers = CENTER_NAMES.map((c) =>
    centerMarkup(
      c,
      defined.has(c) ? 'defined' : 'open',
      newly.has(c) ? ', newly defined in the composite' : '',
    ),
  ).join('');
  const outlines = [...newly]
    .map((c) =>
      el('polygon', {
        class: 'hd-center-new',
        points: polygonPoints(c),
        fill: 'none',
        stroke: cssVar('--hd-text'),
        'stroke-width': 1.6,
        'stroke-dasharray': '4 3',
        'stroke-linejoin': 'round',
        'pointer-events': 'none',
        'aria-hidden': 'true',
      }),
    )
    .join('');

  const gates: string[] = [];
  for (let gate = 1; gate <= 64; gate++) {
    const isDefined = defined.has(centerOfGate(gate));
    const ga = inA.has(gate);
    const gb = inB.has(gate);
    gates.push(
      ga || gb
        ? activeGate(gate, ga, gb, isDefined, nameA, nameB)
        : inactiveGateMarkup(gate, isDefined, true),
    );
  }

  const counts = KINDS.map(
    (k) => `${comparison.counts[k]} ${DYNAMIC_LABELS[k].label.toLowerCase()}`,
  ).join(', ');
  const body =
    silhouetteMarkup() +
    tracksMarkup() +
    glowLayer(`${idPrefix}-glow`, glowBars) +
    glowLayer(`${idPrefix}-glow`, glowCenters, 'stroke="none"') +
    `<g class="hd-channels">${channels}</g>` +
    `<g class="hd-centers">${centers}${outlines}</g>` +
    `<g class="hd-gates">${gates.join('')}</g>` +
    (showLegend ? legendMarkup(a.input.name, b.input.name) : '');

  return svgRoot({
    viewBox: `0 0 ${BODYGRAPH_VIEWBOX.width} ${showLegend ? COMPOSITE_HEIGHT : BODYGRAPH_VIEWBOX.height}`,
    className: 'hd-composite',
    idPrefix,
    title: `Composite BodyGraph of ${a.input.name.trim() || 'person A'} and ${b.input.name.trim() || 'person B'}. Channels: ${counts}.`,
    description:
      `Person A: ${chartSummary(a)} Person B: ${chartSummary(b)} ` +
      `Composite defined centers: ${comparison.compositeDefinedCenters.map((c) => CENTER_LABELS[c]).join(', ') || 'none'}.`,
    body,
  });
}

/** The legend as an HTML fragment (a list with small SVG swatches) the app can render itself. */
export function compositeLegend(nameA = 'Person A', nameB = 'Person B'): string {
  const items = KINDS.map((kind) => {
    const dash = DYNAMIC_DASH[kind];
    const swatch =
      `<svg class="hd-legend__swatch" width="40" height="10" viewBox="0 0 40 10" aria-hidden="true" focusable="false">` +
      el('line', {
        x1: 3,
        y1: 5,
        x2: 37,
        y2: 5,
        stroke: cssVar(DYNAMIC_VARIABLE[kind]),
        'stroke-width': 5,
        'stroke-dasharray': dash,
        'stroke-linecap': capOf(kind),
      }) +
      '</svg>';
    const { label, meaning } = DYNAMIC_LABELS[kind];
    return `<li class="hd-legend__item hd-legend__item--${kind}">${swatch}<strong>${label}</strong> <span>${escapeXml(meaning)}</span></li>`;
  }).join('');
  const people =
    `<li class="hd-legend__item hd-legend__item--a">Circle ring: ${escapeXml(nameA)}</li>` +
    `<li class="hd-legend__item hd-legend__item--b">Square ring: ${escapeXml(nameB)}</li>`;
  return `<ul class="hd-legend">${items}${people}</ul>`;
}
