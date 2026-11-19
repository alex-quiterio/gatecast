import { expect, test } from 'bun:test';

const css = await Bun.file(`${import.meta.dir}/../../src/styles.css`).text();
const touch = await Bun.file(`${import.meta.dir}/../../src/styles/touch.css`).text();

/** The text of every `@media (query) { ... }` block in `source`, joined. */
function mediaBlock(query: string, source: string = css): string {
  const marker = `@media ${query} {`;
  const blocks: string[] = [];
  for (
    let start = source.indexOf(marker);
    start !== -1;
    start = source.indexOf(marker, start + 1)
  ) {
    blocks.push(source.slice(start, source.indexOf('\n}', start)));
  }
  expect(blocks.length, query).toBeGreaterThan(0);
  return blocks.join('\n');
}

test('the action bar buttons share one row on phones instead of overflowing', () => {
  const block = mediaBlock('(max-width: 1023px)');
  expect(block).toMatch(
    /\.result-bar > \.btn,\s*\.result-bar \.menu \{[^}]*flex: 1 1 0;[^}]*min-width: 0;/,
  );
  expect(block).toContain('.result-bar .btn-mine');
  expect(block).toMatch(/\.result-bar \.menu-list \{[^}]*max-width: calc\(100vw - 24px\)/);
});

test('on phones only the Export button keeps its label, and it takes the rest of the row', () => {
  const block = mediaBlock('(max-width: 439px)');
  expect(block).toMatch(/\.result-bar > \.btn:not\(\.btn-mine\) \{[^}]*flex: 0 0 52px/);
  expect(block).toContain('.result-bar > .btn:not(.btn-mine) span');
  // Hidden visually, not with display:none, so the buttons keep their accessible names.
  expect(block).not.toContain('display: none');
});

test('touch targets reach at least 40px for the controls added with the Library and share tools', () => {
  const block = mediaBlock('(max-width: 1023px), (pointer: coarse)', touch);
  for (const selector of [
    '.my-chart-chip',
    '.line-more summary',
    '.sh-toggle',
    '.sh-swatch',
    '.sh-field input',
  ]) {
    expect(block, selector).toContain(selector);
  }
  expect(block).toMatch(/\.sh-swatch \{[^}]*width: 44px;[^}]*height: 44px/);
});

test('the touch rules live in a file that sorts after every other component stylesheet', async () => {
  // The build concatenates src/styles/*.css alphabetically; the touch sizes must come last to win.
  const names = [...new Bun.Glob('*.css').scanSync(`${import.meta.dir}/../../src/styles`)].sort();
  expect(names.at(-1)).toBe('touch.css');
});

test('toasts clear the action bar as well as the tab bar when the action bar is on screen', () => {
  const block = mediaBlock('(max-width: 1023px)');
  expect(block).toContain(':root:has(.result-bar)');
  expect(block).toMatch(/--gc-bottom-offset:\s*calc\(var\(--gc-tabbar-h\) \+ \d+px\)/);
});

test('a long "my chart" name shrinks with an ellipsis instead of widening the Library', async () => {
  const mine = Bun.file(`${import.meta.dir}/../../src/styles/library-mine.css`);
  const source = await mine.text();
  // The grid and flex parents must be allowed below their content's width.
  expect(source).toMatch(
    /\.lib-mine-bar,\s*\.lib-layout,\s*\.lib-main,\s*\.lib-tools \{\s*min-width: 0;/,
  );
  expect(source).toMatch(/\.my-chart-chip \{[^}]*min-width: 0;[^}]*max-width: 100%;/);
  expect(source).toMatch(/\.fchip-mine \{[^}]*max-width: 100%;/);
  expect(source).toMatch(/\.fchip-name \{[^}]*text-overflow: ellipsis;/);
});
