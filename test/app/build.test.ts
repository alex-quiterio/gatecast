import { afterAll, describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const out = mkdtempSync(join(tmpdir(), 'gatecast-build-'));
afterAll(() => rmSync(out, { recursive: true, force: true }));

describe('build output', () => {
  test('contains the static site', async () => {
    const mod = (await import(join(import.meta.dir, '..', '..', 'scripts', 'build.ts'))) as {
      build: (dir: string) => Promise<unknown>;
    };
    await mod.build(out);
    for (const file of ['index.html', 'main.js', 'styles.css', '.nojekyll', '404.html']) {
      expect(existsSync(join(out, file))).toBe(true);
    }
    const html = readFileSync(join(out, 'index.html'), 'utf8');
    expect(html).toContain('./main.js');
    expect(html).not.toMatch(/(src|href)="\//);
    expect(readFileSync(join(out, 'main.js'), 'utf8').length).toBeGreaterThan(1000);
  }, 60_000);
});
