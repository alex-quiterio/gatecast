/**
 * Static build: bundles the app and the service worker, concatenates styles,
 * copies index.html and public/ into dist/, injects PWA tags and the precache
 * manifest. Fails loudly (non-zero exit) on any error.
 */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { buildPrecacheList, cacheVersion } from '@/sw-logic';

const root = resolve(import.meta.dir, '..');

/** Tags every HTML entry must carry (inserted only when missing). */
export const PWA_HEAD_TAGS: readonly { marker: string; tag: string }[] = [
  { marker: 'rel="manifest"', tag: '<link rel="manifest" href="./manifest.webmanifest" />' },
  {
    marker: 'rel="apple-touch-icon"',
    tag: '<link rel="apple-touch-icon" href="./apple-touch-icon.png" />',
  },
  {
    marker: 'name="apple-mobile-web-app-capable"',
    tag: '<meta name="apple-mobile-web-app-capable" content="yes" />',
  },
  {
    marker: 'name="mobile-web-app-capable"',
    tag: '<meta name="mobile-web-app-capable" content="yes" />',
  },
  {
    marker: 'name="apple-mobile-web-app-title"',
    tag: '<meta name="apple-mobile-web-app-title" content="Gatecast" />',
  },
  {
    marker: 'name="apple-mobile-web-app-status-bar-style"',
    tag: '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
  },
];

/** Insert the PWA head tags that `html` does not have yet (idempotent). */
export function injectPwaTags(html: string): string {
  const missing = PWA_HEAD_TAGS.filter((t) => !html.includes(t.marker)).map((t) => `    ${t.tag}`);
  if (missing.length === 0) return html;
  if (!html.includes('</head>')) throw new Error('HTML has no </head> to inject PWA tags into');
  return html.replace('</head>', `${missing.join('\n')}\n  </head>`);
}

export interface BuildResult {
  outDir: string;
  files: { path: string; bytes: number }[];
  /** Cache version injected into sw.js. */
  version: string;
  /** Precache URLs injected into sw.js. */
  precache: string[];
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

function fail(what: string, logs: readonly unknown[]): never {
  for (const log of logs) console.error(String(log));
  throw new Error(`${what} failed`);
}

/** Build the site into `outDir` (default `dist/`). Throws on failure. */
export async function build(outDir: string = join(root, 'dist')): Promise<BuildResult> {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const entry = ['src/main.tsx', 'src/main.ts']
    .map((p) => join(root, p))
    .find((p) => existsSync(p));
  if (!entry) throw new Error('No entry point: expected src/main.tsx or src/main.ts');
  const bundle = await Bun.build({
    entrypoints: [entry],
    outdir: outDir,
    target: 'browser',
    minify: true,
    sourcemap: 'external',
    splitting: false,
    naming: { entry: 'main.js' },
  });
  if (!bundle.success) fail('Bundling', bundle.logs);

  // styles.css first, then every src/styles/*.css sorted, as one minified sheet.
  const parts = [join(root, 'src/styles.css')];
  const stylesDir = join(root, 'src/styles');
  if (existsSync(stylesDir)) {
    const extra = (await readdir(stylesDir)).filter((f) => f.endsWith('.css')).sort();
    parts.push(...extra.map((f) => join(stylesDir, f)));
  }
  const stylesEntry = join(outDir, '.styles-entry.css');
  await writeFile(stylesEntry, parts.map((p) => `@import ${JSON.stringify(p)};`).join('\n'));
  const styles = await Bun.build({
    entrypoints: [stylesEntry],
    outdir: outDir,
    minify: true,
    naming: { entry: 'styles.css' },
  });
  await rm(stylesEntry, { force: true });
  if (!styles.success) fail('Stylesheet build', styles.logs);

  const html = await Bun.file(join(root, 'index.html')).text();
  if (!html.includes('./main.js') || !html.includes('./styles.css')) {
    throw new Error('index.html must reference ./main.js and ./styles.css');
  }
  const page = injectPwaTags(html);
  await writeFile(join(outDir, 'index.html'), page);
  await writeFile(join(outDir, '404.html'), page);
  await writeFile(join(outDir, '.nojekyll'), '');

  try {
    await cp(join(root, 'public'), outDir, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }

  // Precache list and version: everything emitted except sw.js, maps and big optional files.
  const emitted = (await walk(outDir)).map((f) => relative(outDir, f).split('\\').join('/'));
  const precache = buildPrecacheList(emitted);
  const entries = await Promise.all(
    precache
      .filter((u) => u !== './')
      .map(async (u) => ({
        path: u,
        hash: createHash('sha256')
          .update(await readFile(join(outDir, u.slice(2))))
          .digest('hex'),
      })),
  );
  const version = cacheVersion(entries);

  const sw = await Bun.build({
    entrypoints: [join(root, 'src/sw.ts')],
    outdir: outDir,
    target: 'browser',
    minify: true,
    splitting: false,
    naming: { entry: 'sw.js' },
    define: {
      __GC_PRECACHE__: JSON.stringify(precache),
      __GC_VERSION__: JSON.stringify(version),
    },
  });
  if (!sw.success) fail('Service worker build', sw.logs);

  const files: BuildResult['files'] = [];
  for (const path of (await walk(outDir)).map((f) => relative(outDir, f)).sort()) {
    if (path.startsWith('icons') || path.startsWith('screenshots')) continue;
    files.push({ path, bytes: (await stat(join(outDir, path))).size });
  }
  return { outDir, files, version, precache };
}

if (import.meta.main) {
  try {
    const result = await build();
    for (const f of result.files)
      console.warn(`${f.path.padEnd(24)} ${(f.bytes / 1024).toFixed(1)} KiB`);
    console.warn(`Precached ${result.precache.length} URLs, cache version ${result.version}`);
    console.warn(`Built to ${result.outDir}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
