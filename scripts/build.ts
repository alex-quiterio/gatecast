/**
 * Static build: bundles src/main.ts, copies index.html, styles and public/
 * into dist/. Fails loudly (non-zero exit) on any error.
 */
import { cp, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');

export interface BuildResult {
  outDir: string;
  files: { path: string; bytes: number }[];
}

/** Build the site into `outDir` (default `dist/`). Throws on failure. */
export async function build(outDir: string = join(root, 'dist')): Promise<BuildResult> {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const bundle = await Bun.build({
    entrypoints: [join(root, 'src/main.ts')],
    outdir: outDir,
    target: 'browser',
    minify: true,
    sourcemap: 'external',
    splitting: false,
    naming: { entry: 'main.js' },
  });
  if (!bundle.success) {
    for (const log of bundle.logs) console.error(String(log));
    throw new Error('Bundling failed');
  }

  const styles = await Bun.build({
    entrypoints: [join(root, 'src/styles.css')],
    outdir: outDir,
    minify: true,
    naming: { entry: 'styles.css' },
  });
  if (!styles.success) {
    for (const log of styles.logs) console.error(String(log));
    throw new Error('Stylesheet build failed');
  }

  const html = await Bun.file(join(root, 'index.html')).text();
  if (!html.includes('./main.js') || !html.includes('./styles.css')) {
    throw new Error('index.html must reference ./main.js and ./styles.css');
  }
  await writeFile(join(outDir, 'index.html'), html);
  await writeFile(join(outDir, '404.html'), html);
  await writeFile(join(outDir, '.nojekyll'), '');

  try {
    await cp(join(root, 'public'), outDir, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }

  const files: BuildResult['files'] = [];
  for (const path of ['index.html', 'main.js', 'main.js.map', 'styles.css', '404.html']) {
    const info = await stat(join(outDir, path)).catch(() => undefined);
    if (info) files.push({ path, bytes: info.size });
  }
  return { outDir, files };
}

if (import.meta.main) {
  try {
    const result = await build();
    for (const f of result.files)
      console.warn(`${f.path.padEnd(14)} ${(f.bytes / 1024).toFixed(1)} KiB`);
    console.warn(`Built to ${result.outDir}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
