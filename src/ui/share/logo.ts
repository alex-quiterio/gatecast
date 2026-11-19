/** Longest side of a stored logo, in px. */
export const LOGO_MAX_SIDE = 256;
/** Largest stored logo, in bytes of the data URL. */
export const LOGO_MAX_BYTES = 150 * 1024;

const DATA_IMAGE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

/** Whether a string is a data URL of a raster image small enough to store. */
export function isValidLogo(value: unknown): value is string {
  return typeof value === 'string' && value.length <= LOGO_MAX_BYTES && DATA_IMAGE.test(value);
}

/** The size a logo of `width` x `height` shrinks to so its longest side is at most `max`. */
export function fitLogoSize(
  width: number,
  height: number,
  max = LOGO_MAX_SIDE,
): { width: number; height: number } {
  if (!(width > 0) || !(height > 0)) return { width: 1, height: 1 };
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** Why a chosen file could not be used, or `undefined` when it is acceptable input. */
export function logoFileProblem(file: { type: string; size: number }): string | undefined {
  if (!/^image\/(png|jpeg|webp|gif|bmp)$/.test(file.type)) {
    return 'Choose a PNG, JPEG or WebP image.';
  }
  if (file.size > 8 * 1024 * 1024) return 'That image is too large (8 MB at most).';
  return undefined;
}

/**
 * Downscale an image file to at most {@link LOGO_MAX_SIDE} px and
 * {@link LOGO_MAX_BYTES}, returning a PNG (kept for transparency) or, when
 * that is too big, a JPEG/WebP at falling quality. Nothing leaves the browser.
 *
 * @returns the data URL, or an error message.
 */
export async function downscaleLogo(
  file: Blob,
): Promise<{ ok: true; dataUrl: string } | { ok: false; error: string }> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    const loaded = new Promise<boolean>((resolve) => {
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
    });
    image.src = url;
    if (!(await loaded)) return { ok: false, error: 'That file could not be read as an image.' };
    let side = LOGO_MAX_SIDE;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const size = fitLogoSize(image.naturalWidth, image.naturalHeight, side);
      const canvas = document.createElement('canvas');
      canvas.width = size.width;
      canvas.height = size.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { ok: false, error: 'This browser cannot resize images.' };
      ctx.drawImage(image, 0, 0, size.width, size.height);
      const png = canvas.toDataURL('image/png');
      if (isValidLogo(png)) return { ok: true, dataUrl: png };
      const webp = canvas.toDataURL('image/webp', 0.85);
      if (isValidLogo(webp)) return { ok: true, dataUrl: webp };
      const jpeg = canvas.toDataURL('image/jpeg', 0.8);
      if (isValidLogo(jpeg)) return { ok: true, dataUrl: jpeg };
      side = Math.round(side * 0.75);
    }
    return { ok: false, error: 'That image is too detailed to shrink under 150 KB.' };
  } finally {
    URL.revokeObjectURL(url);
  }
}
