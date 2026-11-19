import qrcode from 'qrcode-generator';

/** A QR code as a square matrix; `true` is a dark module. */
export type QrMatrix = boolean[][];

// Encode as UTF-8 (the library's default drops the high byte of non-ASCII text).
qrcode.stringToBytes = (s: string): number[] => Array.from(new TextEncoder().encode(s));

/**
 * Encode text as a QR matrix (byte mode, automatic version). Long share links
 * use error correction level L to keep the code small and so scannable; short
 * text uses M. Returns `undefined` when the text is too long for any version.
 */
export function qrMatrix(text: string): QrMatrix | undefined {
  const level = text.length > 120 ? 'L' : 'M';
  try {
    const qr = qrcode(0, level);
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    return Array.from({ length: n }, (_r, row) =>
      Array.from({ length: n }, (_c, col) => qr.isDark(row, col)),
    );
  } catch {
    return undefined;
  }
}

/** The dark modules as one SVG path in module units (runs of a row merged). */
export function qrPathData(matrix: QrMatrix): string {
  const parts: string[] = [];
  matrix.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x += 1;
        continue;
      }
      const start = x;
      while (x < row.length && row[x]) x += 1;
      parts.push(`M${start} ${y}h${x - start}v1h-${x - start}z`);
    }
  });
  return parts.join('');
}

/** Quiet zone around the code, in modules (the QR standard asks for 4). */
export const QR_QUIET_ZONE = 4;

/**
 * SVG for a scannable QR block: a light panel with the code in dark modules
 * and a 4-module quiet zone, `size` px square including the quiet zone.
 * Returns an empty string when the text cannot be encoded.
 */
export function qrSvg(
  text: string,
  x: number,
  y: number,
  size: number,
  colors: { dark: string; light: string },
  radius = 0,
): string {
  const matrix = qrMatrix(text);
  if (!matrix) return '';
  const total = matrix.length + QR_QUIET_ZONE * 2;
  const scale = size / total;
  return (
    `<g transform="translate(${x} ${y})">` +
    `<rect width="${size}" height="${size}" rx="${radius}" fill="${colors.light}"/>` +
    `<path transform="scale(${scale}) translate(${QR_QUIET_ZONE} ${QR_QUIET_ZONE})" ` +
    `d="${qrPathData(matrix)}" fill="${colors.dark}" shape-rendering="crispEdges"/></g>`
  );
}
