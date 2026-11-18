/** Pan and zoom state of the chart canvas. */
export interface View {
  scale: number;
  x: number;
  y: number;
}

/** The untouched view. */
export const FIT: View = { scale: 1, x: 0, y: 0 };

/** Smallest and largest zoom. */
export const MIN_SCALE = 0.6;
export const MAX_SCALE = 5;

/** Clamp a scale into the allowed range. */
export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/**
 * Zoom by `factor` keeping the point (`px`, `py`, relative to the viewport's
 * centre) fixed on screen. Returns {@link FIT} when the result is back at 1.
 */
export function zoomAt(view: View, factor: number, px = 0, py = 0): View {
  const scale = clampScale(view.scale * factor);
  const ratio = scale / view.scale;
  const next = { scale, x: px - (px - view.x) * ratio, y: py - (py - view.y) * ratio };
  return Math.abs(scale - 1) < 0.001 ? FIT : next;
}

/** Distance between two touch points. */
export function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
