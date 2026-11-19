/** Colours of the Gatecast mark. */
export interface MarkColors {
  tile: string;
  ringFrom: string;
  ringTo: string;
  inner: string;
  spine: string;
  centers: readonly [string, string, string, string, string, string];
}

/** The mark in colour, matching `public/logo.svg`. */
export const MARK_COLOR: MarkColors = {
  tile: '#14141f',
  ringFrom: '#a78bfa',
  ringTo: '#fbbf24',
  inner: '#2a2a3d',
  spine: '#3a3a52',
  centers: ['#f2d675', '#4fb3a0', '#a0694f', '#f2d675', '#e0525a', '#a0694f'],
};

/** The mark in black, white and greys, for ink-saving output. */
export const MARK_INK: MarkColors = {
  tile: '#111111',
  ringFrom: '#ffffff',
  ringTo: '#bbbbbb',
  inner: '#555555',
  spine: '#777777',
  centers: ['#ffffff', '#dddddd', '#bbbbbb', '#ffffff', '#dddddd', '#bbbbbb'],
};

/**
 * The Gatecast mark (a gate wheel with the nine centers) as an SVG group,
 * drawn at `size` px with its top-left at (`x`, `y`).
 *
 * @param id Unique suffix for the gradient id, so several marks can share a page.
 */
export function markSvg(
  x: number,
  y: number,
  size: number,
  colors: MarkColors,
  id: string,
): string {
  const c = colors.centers;
  const gid = `gc-ring-${id}`;
  return (
    `<g transform="translate(${x} ${y}) scale(${size / 128})" aria-hidden="true">` +
    `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${colors.ringFrom}"/><stop offset="1" stop-color="${colors.ringTo}"/>` +
    `</linearGradient></defs>` +
    `<rect width="128" height="128" rx="28" fill="${colors.tile}"/>` +
    `<circle cx="64" cy="64" r="54" fill="none" stroke="url(#${gid})" stroke-width="7" ` +
    `stroke-dasharray="2.3 2.998" transform="rotate(-90 64 64)"/>` +
    `<circle cx="64" cy="64" r="46" fill="none" stroke="${colors.inner}" stroke-width="1"/>` +
    `<rect x="63" y="24" width="2" height="86" fill="${colors.spine}"/>` +
    `<polygon points="64,23 74,39 54,39" fill="${c[0]}"/>` +
    `<polygon points="54,42 74,42 64,56" fill="${c[1]}"/>` +
    `<rect x="57" y="59" width="14" height="10" rx="1.5" fill="${c[2]}"/>` +
    `<polygon points="64,72 73,81.5 64,91 55,81.5" fill="${c[3]}"/>` +
    `<rect x="57" y="94" width="14" height="9" rx="1.5" fill="${c[4]}"/>` +
    `<rect x="57" y="105" width="14" height="6" rx="1.5" fill="${c[5]}"/>` +
    `</g>`
  );
}
