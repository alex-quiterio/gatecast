/** Result of an output action, ready for a toast. */
export interface ActionResult {
  ok: boolean;
  message: string;
}

/** `data:` URL of an SVG string (allowed by the app's strict Content-Security-Policy, unlike `blob:`). */
export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Rasterise a standalone SVG (with `width`/`height`) to a PNG at `scale` x.
 * @returns the PNG, or `undefined` when the browser cannot draw it.
 */
export async function svgToPng(
  svg: string,
  width: number,
  height: number,
  scale = 2,
): Promise<Blob | undefined> {
  const image = new Image();
  const loaded = new Promise<boolean>((resolve) => {
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
  });
  image.src = svgDataUrl(svg);
  if (!(await loaded)) return undefined;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? undefined), 'image/png'));
}

/** Save a blob as a file download. */
export function saveBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** A text file as a blob with its MIME type. */
export function textBlob(text: string, mime: string): Blob {
  return new Blob([text], { type: mime });
}

/** Whether the browser can write an image to the clipboard. */
export function canCopyImage(): boolean {
  return (
    typeof ClipboardItem !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard?.write === 'function'
  );
}

/** Copy a PNG to the clipboard, or explain what to do instead. */
export async function copyImage(png: Blob): Promise<ActionResult> {
  if (!canCopyImage()) {
    return { ok: false, message: 'This browser cannot copy images. Use Download PNG instead.' };
  }
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
    return { ok: true, message: 'Image copied' };
  } catch {
    return { ok: false, message: 'Copying was blocked. Use Download PNG instead.' };
  }
}

/** Whether the share sheet can take this file. */
export function canShareFile(file: File): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  );
}

/** Open the system share sheet with the image, when the browser supports sharing files. */
export async function shareImage(
  png: Blob,
  filename: string,
  title: string,
): Promise<ActionResult> {
  const file = new File([png], filename, { type: 'image/png' });
  if (!canShareFile(file)) {
    return { ok: false, message: 'Sharing files is not supported here. Use Download PNG.' };
  }
  try {
    await navigator.share({ files: [file], title });
    return { ok: true, message: 'Shared' };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { ok: true, message: 'Share cancelled' };
    }
    return { ok: false, message: 'Sharing failed. Use Download PNG instead.' };
  }
}

/** Copy text; falls back to a hidden textarea. */
export async function copyTextSafe(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.setAttribute('aria-hidden', 'true');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let ok: boolean;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}
