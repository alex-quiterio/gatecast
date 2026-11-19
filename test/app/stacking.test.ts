import { expect, test } from 'bun:test';

const css = await Bun.file(`${import.meta.dir}/../../src/styles.css`).text();

function block(selector: string): string {
  const start = css.indexOf(`\n${selector} {`);
  expect(start, `${selector} rule`).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf('}', start));
}

test('the route animation does not leave a stacking context behind', () => {
  // A filling opacity animation keeps the route a stacking context, which traps
  // every dialog rendered inside it below the app bar and the rail.
  const animation = block('.route');
  expect(animation).toContain('animation:');
  expect(animation).not.toMatch(/\b(both|forwards)\b/);
});

test('dialogs and toasts stack above the app chrome', () => {
  const z = (selector: string): number => Number(/z-index:\s*(\d+)/.exec(block(selector))?.[1]);
  expect(z('.dialog-backdrop')).toBeGreaterThan(z('.appbar'));
  expect(z('.dialog-backdrop')).toBeGreaterThan(z('.rail'));
  expect(z('.toast-region')).toBeGreaterThanOrEqual(z('.dialog-backdrop'));
});
