import { standaloneSvg, svgSize } from './chart-facts';

/** Resolve a CSS custom property on `<html>` (the current theme's value). */
export function themeVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name);
}

/** A theme-resolved, standalone SVG file body for renderer markup. */
export function exportSvg(markup: string): string {
  return standaloneSvg(markup, themeVar);
}

/**
 * Render renderer markup to a PNG using the current theme's colours.
 *
 * @param markup SVG string from a renderer.
 * @param scale Pixel multiplier on the SVG's own size.
 * @returns the PNG, or `undefined` when the browser cannot rasterise it.
 */
export async function exportPng(markup: string, scale = 2): Promise<Blob | undefined> {
  const svg = standaloneSvg(markup, themeVar, scale);
  const { width, height } = svgSize(markup);
  // A data: URL (not blob:) so the strict Content-Security-Policy allows the image.
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const image = new Image();
  const loaded = new Promise<boolean>((resolve) => {
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
  });
  image.src = url;
  if (!(await loaded)) return undefined;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? undefined), 'image/png'));
}

/** Save a blob as a file. */
export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
