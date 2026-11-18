import { afterAll, describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const out = mkdtempSync(join(tmpdir(), 'gatecast-build-'));
afterAll(() => rmSync(out, { recursive: true, force: true }));

interface BuildModule {
  build: (dir: string) => Promise<{ version: string; precache: string[] }>;
  injectPwaTags: (html: string) => string;
}
const load = async (): Promise<BuildModule> =>
  (await import(join(import.meta.dir, '..', '..', 'scripts', 'build.ts'))) as BuildModule;

describe('build output', () => {
  test('contains the static site and the PWA files', async () => {
    const mod = await load();
    const result = await mod.build(out);
    for (const file of [
      'index.html',
      'main.js',
      'styles.css',
      '.nojekyll',
      '404.html',
      'sw.js',
      'manifest.webmanifest',
      'apple-touch-icon.png',
      'icons/icon-192.png',
      'icons/icon-512.png',
      'icons/icon-maskable-512.png',
    ]) {
      expect(existsSync(join(out, file))).toBe(true);
    }
    for (const page of ['index.html', '404.html']) {
      const html = readFileSync(join(out, page), 'utf8');
      expect(html).toContain('./main.js');
      expect(html).toContain('<link rel="manifest" href="./manifest.webmanifest"');
      expect(html).toContain('rel="apple-touch-icon"');
      expect(html).toContain('apple-mobile-web-app-status-bar-style');
      expect(html).not.toMatch(/(src|href)="\//);
    }
    expect(readFileSync(join(out, 'main.js'), 'utf8').length).toBeGreaterThan(1000);
    expect(readFileSync(join(out, 'styles.css'), 'utf8')).toContain('pwa-toast');

    const sw = readFileSync(join(out, 'sw.js'), 'utf8');
    expect(sw).toContain(`gatecast-precache-`);
    expect(sw).toContain(result.version);
    expect(sw).not.toContain('__GC_');
    // Precache list is exactly what is in dist, minus worker, maps and optional data.
    expect(result.precache).toContain('./index.html');
    expect(result.precache).toContain('./main.js');
    expect(result.precache).not.toContain('./sw.js');
    expect(result.precache.some((u) => u.endsWith('.map') || u.includes('places.json'))).toBe(
      false,
    );
    for (const url of result.precache) {
      if (url !== './') expect(existsSync(join(out, url.slice(2)))).toBe(true);
      expect(sw).toContain(JSON.stringify(url).slice(1, -1));
    }
  }, 60_000);

  test('PWA tag injection is idempotent', async () => {
    const { injectPwaTags } = await load();
    const html = '<html><head><title>x</title></head><body></body></html>';
    const once = injectPwaTags(html);
    expect(once).toContain('rel="manifest"');
    expect(injectPwaTags(once)).toBe(once);
  });
});
