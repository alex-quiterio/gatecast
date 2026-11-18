import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const publicDir = join(import.meta.dir, '..', '..', 'public');
interface Icon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}
interface Manifest {
  [key: string]: unknown;
  icons: Icon[];
  screenshots: (Icon & { form_factor: string })[];
  shortcuts: { name: string; url: string; icons?: Icon[] }[];
}
const manifest = JSON.parse(
  readFileSync(join(publicDir, 'manifest.webmanifest'), 'utf8'),
) as Manifest;

function pngSize(path: string): string {
  const b = readFileSync(path);
  expect(b.subarray(1, 4).toString()).toBe('PNG');
  return `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`;
}
const local = (src: string): string => join(publicDir, src.replace(/^\.\//, ''));

describe('manifest.webmanifest', () => {
  test('required fields', () => {
    expect(manifest['name']).toBe('Gatecast');
    expect(manifest['short_name']).toBe('Gatecast');
    expect(manifest['display']).toBe('standalone');
    for (const k of ['id', 'start_url', 'scope']) expect(manifest[k]).toBe('./');
    expect(manifest['background_color']).toBe('#0d0d1a');
    expect(manifest['theme_color']).toBe('#0d0d1a');
  });
  test('every URL is relative', () => {
    const urls = [
      manifest['id'],
      manifest['start_url'],
      manifest['scope'],
      ...manifest.icons.map((i) => i.src),
      ...manifest.screenshots.map((i) => i.src),
      ...manifest.shortcuts.flatMap((s) => [s.url, ...(s.icons ?? []).map((i) => i.src)]),
    ] as string[];
    for (const u of urls) expect(u.startsWith('./')).toBe(true);
  });
  test('icons exist with the stated dimensions, incl. a maskable one', () => {
    for (const icon of manifest.icons) {
      expect(existsSync(local(icon.src))).toBe(true);
      if (icon.type === 'image/png') expect(pngSize(local(icon.src))).toBe(icon.sizes);
    }
    expect(manifest.icons.some((i) => i.purpose === 'maskable' && i.sizes === '512x512')).toBe(
      true,
    );
    expect(manifest.icons.some((i) => i.sizes === '192x192')).toBe(true);
    expect(manifest.icons.some((i) => i.sizes === '512x512' && i.purpose === 'any')).toBe(true);
  });
  test('apple touch icon is 180x180', () => {
    expect(pngSize(join(publicDir, 'apple-touch-icon.png'))).toBe('180x180');
  });
  test('screenshots exist; the wide one is 1280x720', () => {
    for (const s of manifest.screenshots) expect(existsSync(local(s.src))).toBe(true);
    const wide = manifest.screenshots.find((s) => s.form_factor === 'wide');
    expect(wide?.sizes).toBe('1280x720');
    expect(manifest.screenshots.some((s) => s.form_factor === 'narrow')).toBe(true);
  });
  test('shortcuts', () => {
    expect(manifest.shortcuts.map((s) => s.url)).toEqual(['./#/compare', './#/library']);
  });
});
