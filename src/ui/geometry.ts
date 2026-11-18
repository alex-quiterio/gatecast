import type { CenterName } from '@/types';
import { CENTER_GATES, CHANNEL_LIST, channelKey } from '@engine/data';

/**
 * Hand-designed BodyGraph geometry in one 400 x 600 viewBox, centred on x = 200.
 * Centers are polygons, gate dots sit exactly on polygon edges, and each of the
 * 36 channels is a cubic bezier whose control points are tuned by hand so the
 * long ones swing around the other centers.
 */

export interface Point {
  x: number;
  y: number;
}

export interface CubicBezier {
  p0: Point;
  p1: Point;
  p2: Point;
  p3: Point;
}

export const BODYGRAPH_VIEWBOX = { width: 400, height: 600 } as const;

const pt = (x: number, y: number): Point => ({ x, y });
const mirrorX = (p: Point): Point => pt(400 - p.x, p.y);

/** The nine center outlines. */
export const CENTER_SHAPES: Record<CenterName, readonly Point[]> = {
  Head: [pt(200, 18), pt(236, 70), pt(164, 70)],
  Ajna: [pt(164, 86), pt(236, 86), pt(200, 142)],
  Throat: [pt(168, 164), pt(232, 164), pt(232, 216), pt(168, 216)],
  G: [pt(200, 252), pt(244, 296), pt(200, 340), pt(156, 296)],
  Heart: [pt(252, 312), pt(312, 342), pt(252, 372)],
  Spleen: [pt(262, 430), pt(338, 385), pt(338, 484)].map(mirrorX),
  SolarPlexus: [pt(262, 430), pt(338, 385), pt(338, 484)],
  Sacral: [pt(168, 396), pt(232, 396), pt(232, 456), pt(168, 456)],
  Root: [pt(168, 508), pt(232, 508), pt(232, 566), pt(168, 566)],
};

/** A point on edge `edge` (vertex i to vertex i + 1) at parameter t. */
function onEdge(center: CenterName, edge: number, t: number): Point {
  const poly = CENTER_SHAPES[center];
  const a = poly[edge % poly.length];
  const b = poly[(edge + 1) % poly.length];
  if (!a || !b) throw new RangeError(`Bad edge ${edge} on ${center}`);
  return pt(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
}

/** Parameter of the point with the given coordinate on an axis-aligned edge. */
function tAt(center: CenterName, edge: number, axis: 'x' | 'y', value: number): number {
  const poly = CENTER_SHAPES[center];
  const a = poly[edge % poly.length];
  const b = poly[(edge + 1) % poly.length];
  if (!a || !b) throw new RangeError(`Bad edge ${edge} on ${center}`);
  return (value - a[axis]) / (b[axis] - a[axis]);
}

type Placement = readonly [gate: number, edge: number, t: number];

const horizontal = (c: CenterName, edge: number, gate: number, x: number): Placement => [
  gate,
  edge,
  tAt(c, edge, 'x', x),
];
const vertical = (c: CenterName, edge: number, gate: number, y: number): Placement => [
  gate,
  edge,
  tAt(c, edge, 'y', y),
];

const PLACEMENTS: Record<CenterName, readonly Placement[]> = {
  Head: [
    horizontal('Head', 1, 64, 176),
    horizontal('Head', 1, 61, 200),
    horizontal('Head', 1, 63, 224),
  ],
  Ajna: [
    horizontal('Ajna', 0, 47, 176),
    horizontal('Ajna', 0, 24, 200),
    horizontal('Ajna', 0, 4, 224),
    [11, 1, 0.61],
    [17, 2, 0.39],
    [43, 1, 1],
  ],
  Throat: [
    horizontal('Throat', 0, 62, 182),
    horizontal('Throat', 0, 23, 200),
    horizontal('Throat', 0, 56, 218),
    vertical('Throat', 1, 35, 176),
    vertical('Throat', 1, 12, 190),
    vertical('Throat', 1, 45, 204),
    horizontal('Throat', 2, 33, 218),
    horizontal('Throat', 2, 8, 200),
    horizontal('Throat', 2, 31, 182),
    vertical('Throat', 3, 20, 204),
    vertical('Throat', 3, 16, 178),
  ],
  G: [
    [1, 0, 0],
    [13, 0, 0.38],
    [25, 0, 1],
    [46, 1, 0.62],
    [2, 1, 1],
    [15, 2, 0.38],
    [10, 2, 1],
    [7, 3, 0.62],
  ],
  Heart: [
    [21, 0, 0.38],
    [40, 1, 0.42],
    vertical('Heart', 2, 51, 332),
    vertical('Heart', 2, 26, 358),
  ],
  Spleen: [
    [50, 0, 0.15],
    [44, 0, 0.4],
    [57, 0, 0.65],
    [48, 0, 0.9],
    [18, 2, 0.2],
    [28, 2, 0.5],
    [32, 2, 0.8],
  ],
  SolarPlexus: [
    [6, 0, 0.15],
    [37, 0, 0.4],
    [22, 0, 0.65],
    [36, 0, 0.9],
    [30, 2, 0.2],
    [55, 2, 0.5],
    [49, 2, 0.8],
  ],
  Sacral: [
    horizontal('Sacral', 0, 5, 182),
    horizontal('Sacral', 0, 14, 200),
    horizontal('Sacral', 0, 29, 218),
    vertical('Sacral', 1, 59, 432),
    horizontal('Sacral', 2, 9, 218),
    horizontal('Sacral', 2, 3, 200),
    horizontal('Sacral', 2, 42, 182),
    vertical('Sacral', 3, 27, 438),
    vertical('Sacral', 3, 34, 408),
  ],
  Root: [
    horizontal('Root', 0, 53, 182),
    horizontal('Root', 0, 60, 200),
    horizontal('Root', 0, 52, 218),
    vertical('Root', 1, 19, 524),
    vertical('Root', 1, 39, 538),
    vertical('Root', 1, 41, 552),
    vertical('Root', 3, 58, 552),
    vertical('Root', 3, 38, 538),
    vertical('Root', 3, 54, 524),
  ],
};

function buildGatePositions(): Record<number, Point> {
  const out: Record<number, Point> = {};
  for (const center of Object.keys(PLACEMENTS) as CenterName[]) {
    for (const [gate, edge, t] of PLACEMENTS[center]) out[gate] = onEdge(center, edge, t);
  }
  return out;
}

/** Position of every gate's dot, exactly on its center's outline. */
export const GATE_POSITIONS: Record<number, Point> = buildGatePositions();

/** Centroid of a center, used to nudge inactive gate numbers inward. */
export function centerCentroid(center: CenterName): Point {
  const poly = CENTER_SHAPES[center];
  const n = poly.length;
  return pt(poly.reduce((s, p) => s + p.x, 0) / n, poly.reduce((s, p) => s + p.y, 0) / n);
}

function gatePoint(gate: number): Point {
  const p = GATE_POSITIONS[gate];
  if (!p) throw new RangeError(`No position for gate ${gate}`);
  return p;
}

/**
 * Build a channel curve from gate `from` to gate `to` with control points c1
 * (near `from`) and c2 (near `to`). The stored curve always runs from the
 * lower gate number to the higher one.
 */
function curve(from: number, to: number, c1: Point, c2: Point): [string, CubicBezier] {
  const a = gatePoint(from);
  const b = gatePoint(to);
  const forward: CubicBezier = { p0: a, p1: c1, p2: c2, p3: b };
  const bez: CubicBezier = from < to ? forward : { p0: b, p1: c2, p2: c1, p3: a };
  return [channelKey(from, to), bez];
}

/** A straight channel. */
function line(from: number, to: number): [string, CubicBezier] {
  const a = gatePoint(from);
  const b = gatePoint(to);
  return curve(
    from,
    to,
    pt(a.x + (b.x - a.x) / 3, a.y + (b.y - a.y) / 3),
    pt(a.x + ((b.x - a.x) * 2) / 3, a.y + ((b.y - a.y) * 2) / 3),
  );
}

/** Bezier path of every channel, keyed `20-34`, running from the lower gate to the higher. */
export const CHANNEL_PATHS: Record<string, CubicBezier> = Object.fromEntries([
  line(1, 8),
  line(2, 14),
  line(3, 60),
  line(4, 63),
  line(5, 15),
  curve(6, 59, pt(255, 425), pt(247, 432)),
  line(7, 31),
  line(9, 52),
  curve(10, 20, pt(128, 282), pt(136, 206)),
  curve(10, 34, pt(126, 312), pt(128, 408)),
  curve(10, 57, pt(122, 300), pt(96, 350)),
  line(11, 56),
  curve(12, 22, pt(340, 190), pt(342, 345)),
  line(13, 33),
  curve(16, 48, pt(92, 178), pt(46, 290)),
  line(17, 62),
  curve(18, 58, pt(84, 520), pt(100, 552)),
  curve(19, 49, pt(262, 524), pt(270, 480)),
  curve(20, 34, pt(96, 206), pt(104, 408)),
  curve(20, 57, pt(108, 206), pt(86, 330)),
  curve(21, 45, pt(300, 270), pt(285, 204)),
  line(23, 43),
  line(24, 61),
  curve(25, 51, pt(270, 298), pt(236, 332)),
  curve(26, 44, pt(190, 376), pt(130, 372)),
  line(27, 50),
  curve(28, 38, pt(108, 500), pt(118, 538)),
  line(29, 46),
  curve(30, 41, pt(320, 545), pt(290, 552)),
  curve(32, 54, pt(130, 480), pt(130, 524)),
  curve(34, 57, pt(140, 410), pt(115, 396)),
  curve(35, 36, pt(360, 176), pt(362, 335)),
  line(37, 40),
  curve(39, 55, pt(275, 538), pt(296, 510)),
  line(42, 53),
  line(47, 64),
]);

/** Point on a cubic at parameter t. */
export function cubicPoint(c: CubicBezier, t: number): Point {
  const u = 1 - t;
  const w0 = u * u * u;
  const w1 = 3 * u * u * t;
  const w2 = 3 * u * t * t;
  const w3 = t * t * t;
  return pt(
    w0 * c.p0.x + w1 * c.p1.x + w2 * c.p2.x + w3 * c.p3.x,
    w0 * c.p0.y + w1 * c.p1.y + w2 * c.p2.y + w3 * c.p3.y,
  );
}

const mid = (a: Point, b: Point, t: number): Point =>
  pt(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);

/** Split a cubic at t with de Casteljau; the two halves join exactly. */
export function splitCubic(c: CubicBezier, t = 0.5): [CubicBezier, CubicBezier] {
  const a = mid(c.p0, c.p1, t);
  const b = mid(c.p1, c.p2, t);
  const d = mid(c.p2, c.p3, t);
  const e = mid(a, b, t);
  const f = mid(b, d, t);
  const g = mid(e, f, t);
  return [
    { p0: c.p0, p1: a, p2: e, p3: g },
    { p0: g, p1: f, p2: d, p3: c.p3 },
  ];
}

/** SVG path data (`M x y C ...`) for a cubic. */
export function cubicPath(c: CubicBezier): string {
  const f = (p: Point): string => `${Math.round(p.x * 100) / 100} ${Math.round(p.y * 100) / 100}`;
  return `M${f(c.p0)}C${f(c.p1)} ${f(c.p2)} ${f(c.p3)}`;
}

/** The bezier of one channel; throws for an unknown pair. */
export function channelCurve(a: number, b: number): CubicBezier {
  const found = CHANNEL_PATHS[channelKey(a, b)];
  if (!found) throw new RangeError(`No channel ${a}-${b}`);
  return found;
}

/** Soft human silhouette drawn behind the centers. */
export const SILHOUETTE_PATH =
  'M176 112L176 150C176 176 108 178 76 214C46 250 40 330 44 420C46 500 40 560 80 592' +
  'L320 592C360 560 354 500 356 420C360 330 354 250 324 214C292 178 224 176 224 150L224 112Z';
export const HEAD_ELLIPSE = { cx: 200, cy: 60, rx: 56, ry: 62 } as const;

/** Whether a point lies inside a polygon (ray casting). */
export function pointInPolygon(p: Point, poly: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (!a || !b) continue;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

/** Distance from a point to a segment. */
export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** Sanity data for tests: gates per center as declared by the engine. */
export const DECLARED_CENTER_GATES = CENTER_GATES;
/** The channels the geometry must cover. */
export const REQUIRED_CHANNELS = CHANNEL_LIST;
