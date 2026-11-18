import { describe, expect, test } from 'bun:test';
import { PALETTE_VARIABLES } from '@ui/palette';

describe('styles.css', () => {
  test('defines every renderer palette variable for both themes', async () => {
    const css = await Bun.file(`${import.meta.dir}/../../src/styles.css`).text();
    const dark = css.slice(css.indexOf("data-theme='dark']", css.indexOf('7. BodyGraph')));
    const light = css.slice(css.indexOf("data-theme='light'] {", css.indexOf('7. BodyGraph')));
    for (const v of PALETTE_VARIABLES) {
      expect(dark).toContain(`${v.name}: ${v.dark};`);
      expect(light).toContain(`${v.name}: ${v.light};`);
    }
  });
});
