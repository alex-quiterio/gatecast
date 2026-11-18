import { afterEach, beforeEach, expect, test } from 'bun:test';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { SavedList } from '@ui/components/saved-list';
import { encodePerson } from '@ui/share';
import type { BirthInput } from '@/types';
import type { SavedPerson } from '@ui/storage';

const LONG = 'Maximiliana Alexandrina Wilhelmina Example-Longsurname de Testington';
const input: BirthInput = { name: LONG, date: '1990-03-14', time: '09:30', utcOffset: 0 };
const person: SavedPerson = { id: encodePerson(input), input, savedAt: '2026-01-01T00:00:00Z' };

let host: HTMLDivElement;
beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
});
afterEach(() => {
  act(() => render(null, host));
  host.remove();
});

test('a long name keeps its full text in a title, so the ellipsis hides nothing', () => {
  act(() =>
    render(
      <SavedList
        people={[person]}
        activeId={undefined}
        loadLabel="Open"
        detailed={false}
        onOpen={() => undefined}
        onDelete={() => undefined}
      />,
      host,
    ),
  );
  const name = host.querySelector('.saved-name');
  expect(name?.textContent).toBe(LONG);
  expect(name?.getAttribute('title')).toBe(LONG);
});

test('the list lets rows shrink, so long names truncate instead of pushing the delete button away', async () => {
  const css = await Bun.file(`${import.meta.dir}/../../src/styles.css`).text();
  const block = (selector: string): string => {
    const start = css.indexOf(`\n${selector} {`);
    expect(start).toBeGreaterThan(-1);
    return css.slice(start, css.indexOf('}', start));
  };
  // A bare `1fr` grid column will not shrink below its content: it must be minmax(0, 1fr).
  expect(block('.saved-list')).toContain('grid-template-columns: minmax(0, 1fr)');
  expect(block('.saved-list li')).toContain('min-width: 0');
  expect(block('.saved-name')).toContain('text-overflow: ellipsis');
});
