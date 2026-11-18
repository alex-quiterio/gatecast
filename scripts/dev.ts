/**
 * Dev server: builds, serves dist/ on :3000 and rebuilds on changes.
 * The service worker registers on localhost only with `?sw=1` in the URL
 * (e.g. http://localhost:3000/?sw=1), so normal dev is never served from a cache.
 */
import { watch } from 'node:fs';
import { join, resolve } from 'node:path';
import { build } from './build';

const root = resolve(import.meta.dir, '..');
const dist = join(root, 'dist');
const port = Number(process.env['PORT'] ?? 3000);

async function safeBuild(): Promise<void> {
  try {
    await build(dist);
    console.warn(`[dev] built at ${new Date().toLocaleTimeString()}`);
  } catch (error) {
    console.error('[dev] build failed:', error instanceof Error ? error.message : error);
  }
}

await safeBuild();

let timer: ReturnType<typeof setTimeout> | undefined;
for (const dir of ['src', 'public']) {
  watch(join(root, dir), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => void safeBuild(), 150);
  });
}
watch(join(root, 'index.html'), () => {
  clearTimeout(timer);
  timer = setTimeout(() => void safeBuild(), 150);
});

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    const file = Bun.file(join(dist, path));
    if (!resolve(join(dist, path)).startsWith(dist) || !(await file.exists())) {
      return new Response('Not found', { status: 404 });
    }
    return new Response(file, { headers: { 'Cache-Control': 'no-store' } });
  },
});
console.warn(`[dev] http://localhost:${port}`);
