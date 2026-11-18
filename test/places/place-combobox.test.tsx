import { afterEach, describe, expect, mock, test } from 'bun:test';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { useState } from 'preact/hooks';
import type { Place, PlaceIndex } from '@/places';
import { PlaceCombobox } from '@ui/components/place-combobox';
import { ZoneSelect } from '@ui/components/zone-select';
import { fixtureIndex } from './fixtures';

afterEach(() => {
  render(null, document.body);
  document.body.innerHTML = '';
});

interface Harness {
  selected: Place[];
  inputs: string[];
  input: () => HTMLInputElement;
}

function mount(loader: () => Promise<PlaceIndex>, start = ''): Harness {
  const selected: Place[] = [];
  const inputs: string[] = [];
  function App() {
    const [value, setValue] = useState(start);
    return (
      <PlaceCombobox
        id="bp"
        label="Birth place"
        value={value}
        invalid
        describedBy="bp-err"
        loadPlaces={loader}
        onInput={(t) => {
          inputs.push(t);
          setValue(t);
        }}
        onSelect={(p) => {
          selected.push(p);
          setValue(`${p.name}, ${p.country}`);
        }}
      />
    );
  }
  act(() => {
    render(<App />, document.body);
  });
  return {
    selected,
    inputs,
    input: () => {
      const el = document.getElementById('bp');
      if (!(el instanceof HTMLInputElement)) throw new Error('no input');
      return el;
    },
  };
}

const ok = () => Promise.resolve(fixtureIndex());
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

async function type(h: Harness, text: string): Promise<void> {
  const el = h.input();
  await act(async () => {
    el.focus();
    el.dispatchEvent(new Event('focus'));
  });
  await flush();
  await act(async () => {
    el.value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await flush();
}

async function key(h: Harness, k: string): Promise<void> {
  await act(async () => {
    h.input().dispatchEvent(
      new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }),
    );
  });
}

const options = () => [...document.querySelectorAll('[role="option"]')];

describe('PlaceCombobox', () => {
  test('ARIA wiring', async () => {
    const h = mount(ok);
    const el = h.input();
    expect(el.getAttribute('role')).toBe('combobox');
    expect(el.getAttribute('aria-autocomplete')).toBe('list');
    expect(el.getAttribute('aria-expanded')).toBe('false');
    expect(el.getAttribute('aria-invalid')).toBe('true');
    expect(el.getAttribute('aria-describedby')).toBe('bp-err');
    expect(el.getAttribute('autocomplete')).toBe('off');
    expect(el.getAttribute('enterkeyhint')).toBe('search');
    await type(h, 'rom');
    expect(el.getAttribute('aria-expanded')).toBe('true');
    expect(el.getAttribute('aria-controls')).toBe('bp-listbox');
    expect(document.getElementById('bp-listbox')?.getAttribute('role')).toBe('listbox');
    expect(el.getAttribute('aria-activedescendant')).toBe(options()[0]?.id ?? 'x');
    expect(document.querySelector('[role="status"]')?.textContent).toMatch(/places? found/);
  });

  test('typing shows results with matched part highlighted', async () => {
    const h = mount(ok);
    await type(h, 'forli');
    const first = options()[0];
    expect(first?.textContent).toContain('Forlì');
    expect(first?.textContent).toContain('Emilia-Romagna, Italy · Europe/Rome');
    expect(first?.querySelector('strong')?.textContent).toBe('Forlì');
  });

  test('arrows, Home/End and Enter select the right place', async () => {
    const h = mount(ok);
    await type(h, 'rom');
    expect(options().length).toBeGreaterThan(2);
    await key(h, 'ArrowDown');
    expect(options()[1]?.getAttribute('aria-selected')).toBe('true');
    await key(h, 'End');
    const lastIdx = options().length - 1;
    expect(options()[lastIdx]?.getAttribute('aria-selected')).toBe('true');
    await key(h, 'ArrowDown');
    expect(options()[0]?.getAttribute('aria-selected')).toBe('true');
    await key(h, 'ArrowUp');
    expect(options()[lastIdx]?.getAttribute('aria-selected')).toBe('true');
    await key(h, 'Home');
    await key(h, 'Enter');
    expect(h.selected).toHaveLength(1);
    expect(h.selected[0]?.name).toBe('Rome');
    expect(h.selected[0]?.timeZone).toBe('Europe/Rome');
    expect(h.input().value).toBe('Rome, Italy');
    expect(h.input().getAttribute('aria-expanded')).toBe('false');
  });

  test('click selects', async () => {
    const h = mount(ok);
    await type(h, 'venezia');
    const row = options()[0];
    await act(async () => {
      row?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(h.selected[0]?.name).toBe('Venice');
  });

  test('Escape closes, then clears; Tab selects nothing', async () => {
    const h = mount(ok);
    await type(h, 'rom');
    await key(h, 'Escape');
    expect(h.input().getAttribute('aria-expanded')).toBe('false');
    expect(h.input().value).toBe('rom');
    await key(h, 'Escape');
    expect(h.inputs.at(-1)).toBe('');
    expect(h.input().value).toBe('');
    await type(h, 'rom');
    await key(h, 'Tab');
    expect(h.selected).toHaveLength(0);
  });

  test('announces when nothing matches', async () => {
    const h = mount(ok);
    await type(h, 'zzzzzz');
    expect(options()).toHaveLength(0);
    expect(document.querySelector('[role="status"]')?.textContent).toBe('No places found');
  });

  test('shows a loading row on first focus', async () => {
    let release: (i: PlaceIndex) => void = () => undefined;
    const h = mount(() => new Promise<PlaceIndex>((r) => (release = r)));
    await act(async () => {
      h.input().dispatchEvent(new Event('focus'));
    });
    expect(document.body.textContent).toContain('Loading places…');
    await act(async () => {
      release(fixtureIndex());
    });
    await flush();
  });

  test('load failure shows a message and Retry recovers', async () => {
    const loader = mock<() => Promise<PlaceIndex>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(fixtureIndex());
    const h = mount(loader);
    await act(async () => {
      h.input().dispatchEvent(new Event('focus'));
    });
    await flush();
    expect(document.body.textContent).toContain('Places could not be loaded');
    expect(document.body.textContent).toContain('time zone');
    const retry = document.querySelector('.pc-retry');
    await act(async () => {
      retry?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flush();
    expect(loader).toHaveBeenCalledTimes(2);
    expect(document.querySelector('.pc-retry')).toBeNull();
    await type(h, 'rome');
    expect(options()[0]?.textContent).toContain('Rome');
  });
});

describe('ZoneSelect', () => {
  test('groups zones and keeps an unknown current value', () => {
    const changes: string[] = [];
    act(() => {
      render(
        <ZoneSelect
          id="tz"
          label="Time zone"
          value="Mars/Base"
          onChange={(z) => changes.push(z)}
        />,
        document.body,
      );
    });
    const select = document.getElementById('tz');
    expect(select?.querySelectorAll('optgroup').length).toBeGreaterThan(3);
    expect(select?.textContent).toContain('Mars/Base');
    expect(select?.textContent).toContain('Europe/Rome');
    expect(document.querySelector('label')?.getAttribute('for')).toBe('tz');
  });
});
