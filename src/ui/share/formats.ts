import type { FormatId } from './types';

/** An exact card pixel size. */
export interface CardFormat {
  id: FormatId;
  label: string;
  width: number;
  height: number;
  /** Where it is used. */
  hint: string;
}

/** The four card formats, at their 1x pixel size (PNG is exported at 2x). */
export const FORMATS: readonly CardFormat[] = [
  { id: 'square', label: 'Square', width: 1080, height: 1080, hint: 'Feed posts' },
  { id: 'portrait', label: 'Portrait', width: 1080, height: 1350, hint: 'Feed posts, 4:5' },
  { id: 'story', label: 'Story', width: 1080, height: 1920, hint: 'Stories and reels' },
  { id: 'landscape', label: 'Landscape', width: 1200, height: 630, hint: 'Link preview' },
];

/** The format with this id. */
export function formatOf(id: FormatId): CardFormat {
  return FORMATS.find((f) => f.id === id) ?? (FORMATS[0] as CardFormat);
}

/** A rectangle in card pixels. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Largest rectangle with the given aspect ratio that fits `box`, centred in it. */
export function containRect(box: Rect, aspect: number): Rect {
  const w = Math.min(box.w, box.h * aspect);
  const h = w / aspect;
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h };
}
