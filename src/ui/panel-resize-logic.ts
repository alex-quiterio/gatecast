/** Storage key for the width of the left panel. */
export const LEFT_WIDTH_KEY = 'hd:v1:left-width';

/** Narrowest and widest the left panel may be, in CSS pixels. */
export const LEFT_MIN = 240;
export const LEFT_MAX = 560;

/** Pixels moved by an arrow key, and by an arrow key with Shift. */
export const STEP = 16;
export const BIG_STEP = 48;

/**
 * The widest the panel may be on a viewport this wide: never more than
 * `LEFT_MAX`, and never so wide that it crowds out the chart (45% of the
 * viewport at most), but always at least `LEFT_MIN`.
 */
export function maxWidthFor(viewportWidth: number): number {
  if (!Number.isFinite(viewportWidth)) return LEFT_MAX;
  return Math.max(LEFT_MIN, Math.min(LEFT_MAX, Math.floor(viewportWidth * 0.45)));
}

/** Keeps a width inside the allowed range, as a whole number of pixels. */
export function clampWidth(width: number, max: number = LEFT_MAX): number {
  if (!Number.isFinite(width)) return LEFT_MIN;
  return Math.round(Math.min(Math.max(width, LEFT_MIN), Math.max(LEFT_MIN, max)));
}

/** A saved width, or `undefined` if there is none or it is not a sane number. */
export function parseStoredWidth(raw: string | null): number | undefined {
  if (raw === null || !/^\d{2,4}$/.test(raw.trim())) return undefined;
  return clampWidth(Number(raw));
}

/**
 * The width a key press leads to, or `undefined` for keys that do nothing.
 * Arrows nudge (Shift for a bigger nudge), Home and End jump to the limits.
 * `ArrowRight` widens, because the handle sits on the panel's right edge.
 */
export function widthForKey(
  key: string,
  current: number,
  max: number,
  shift = false,
): number | undefined {
  const step = shift ? BIG_STEP : STEP;
  switch (key) {
    case 'ArrowRight':
    case 'ArrowUp':
      return clampWidth(current + step, max);
    case 'ArrowLeft':
    case 'ArrowDown':
      return clampWidth(current - step, max);
    case 'Home':
      return LEFT_MIN;
    case 'End':
      return clampWidth(max, max);
    default:
      return undefined;
  }
}

/** The width a drag leads to: where the pointer started, moved by `dx`. */
export function widthForDrag(startWidth: number, dx: number, max: number): number {
  return clampWidth(startWidth + dx, max);
}
