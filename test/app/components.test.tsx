import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import type { BirthInput } from '@/types';
import type { Place } from '@/places';
import { BirthForm } from '@ui/components/birth-form';
import { CommandPalette } from '@ui/components/command-palette';
import { Tabs } from '@ui/components/tabs';
import type { QuickItem } from '@ui/search-logic';

let host: HTMLDivElement;

beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
});
afterEach(() => {
  act(() => render(null, host));
  host.remove();
});

function type(el: HTMLInputElement, value: string): void {
  act(() => {
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

describe('Tabs', () => {
  const items = [
    { id: 'a', label: 'Alpha' },
    { id: 'b', label: 'Beta' },
    { id: 'c', label: 'Gamma' },
  ];

  test('marks the active tab and moves with the arrow, Home and End keys', () => {
    const changes: string[] = [];
    act(() =>
      render(
        <Tabs
          prefix="t"
          label="Letters"
          items={items}
          value="a"
          onChange={(id) => changes.push(id)}
        />,
        host,
      ),
    );
    const tabs = [...host.querySelectorAll<HTMLElement>('[role=tab]')];
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
    expect(tabs.map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);

    const list = host.querySelector('[role=tablist]');
    const press = (key: string): void => {
      act(() => {
        list?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      });
    };
    press('ArrowRight');
    press('End');
    press('ArrowLeft');
    press('x');
    expect(changes).toEqual(['b', 'c', 'c']);
  });
});

describe('CommandPalette', () => {
  const quick: QuickItem[] = [
    {
      group: 'Gates',
      label: 'Gate 20 · The Now',
      hint: 'Throat',
      hash: '#/library/gate/20',
      haystack: 'gate 20 the now throat',
    },
    { group: 'Pages', label: 'About', hint: '', hash: '#/about', haystack: 'about' },
  ];

  test('filters as you type and goes to the selected result on Enter', () => {
    const visited: string[] = [];
    let closed = 0;
    act(() =>
      render(
        <CommandPalette items={quick} onGo={(h) => visited.push(h)} onClose={() => closed++} />,
        host,
      ),
    );
    const input = host.querySelector<HTMLInputElement>('input');
    expect(input).not.toBeNull();
    if (!input) return;
    type(input, 'now');
    const options = host.querySelectorAll('[role=option]');
    expect(options).toHaveLength(1);
    expect(options[0]?.textContent).toContain('Gate 20');

    act(() => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      );
    });
    expect(visited).toEqual(['#/library/gate/20']);
    expect(closed).toBe(1);
  });
});

describe('BirthForm', () => {
  const venice: Place = {
    name: 'Venice',
    admin: 'Veneto',
    country: 'Italy',
    countryCode: 'IT',
    timeZone: 'Europe/Rome',
    population: 258685,
  };

  // A stand-in for the real place search: one button that "finds" Venice.
  const FakePlaceField = ({ id, onSelect }: { id: string; onSelect: (p: Place) => void }) => (
    <button type="button" id={id} data-testid="pick" onClick={() => onSelect(venice)}>
      pick
    </button>
  );

  function mount(onSubmit: (input: BirthInput) => void): HTMLFormElement {
    act(() =>
      render(
        <BirthForm
          idPrefix="f"
          submitLabel="Cast"
          onSubmit={onSubmit}
          PlaceField={FakePlaceField as never}
        />,
        host,
      ),
    );
    const form = host.querySelector('form');
    if (!form) throw new Error('no form');
    return form;
  }
  const submit = (form: HTMLFormElement): void => {
    act(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
  };
  const field = (id: string): HTMLInputElement => {
    const el = host.querySelector<HTMLInputElement>(`#${id}`);
    if (!el) throw new Error(`missing #${id}`);
    return el;
  };

  test('shows an error for each missing field and does not submit', () => {
    const calls: BirthInput[] = [];
    const form = mount((i) => calls.push(i));
    submit(form);
    expect(calls).toHaveLength(0);
    expect(host.querySelector('#f-date-error')?.textContent).toContain('Enter the date of birth');
    expect(host.querySelector('#f-time-error')?.textContent).toContain('Enter the time of birth');
    expect(host.querySelector('#f-timeZone-error')?.textContent).toContain('birth place');
    expect(field('f-date').getAttribute('aria-invalid')).toBe('true');
  });

  test('a chosen place supplies the zone, the offset and a display label', () => {
    const calls: BirthInput[] = [];
    const form = mount((i) => calls.push(i));
    type(field('f-name'), 'Test Person');
    type(field('f-date'), '1990-03-14');
    type(field('f-time'), '09:30');
    act(() => host.querySelector<HTMLElement>('[data-testid=pick]')?.click());
    submit(form);
    expect(calls).toEqual([
      {
        name: 'Test Person',
        date: '1990-03-14',
        time: '09:30',
        utcOffset: 1,
        timeZone: 'Europe/Rome',
        place: 'Venice, Italy',
      },
    ]);
  });

  test('a manual offset works without any place', () => {
    const calls: BirthInput[] = [];
    const form = mount((i) => calls.push(i));
    type(field('f-date'), '2000-07-01');
    type(field('f-time'), '23:15');
    act(() => {
      field('f-manual').click();
    });
    type(field('f-offset'), '5.5');
    submit(form);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.utcOffset).toBe(5.5);
    expect(calls[0]?.timeZone).toBeUndefined();
  });
});

describe('Tabs scrolling', () => {
  test('keeps the chosen tab in view when the tab bar scrolls', () => {
    const scrolled: (string | null)[] = [];
    const original = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = function (this: HTMLElement) {
      scrolled.push(this.textContent);
    };
    try {
      const items = [
        { id: 'a', label: 'Alpha' },
        { id: 'b', label: 'Beta' },
      ];
      const show = (value: string): void => {
        act(() => {
          render(
            <Tabs
              prefix="t"
              label="Letters"
              items={items}
              value={value}
              onChange={() => undefined}
            />,
            host,
          );
        });
      };
      show('a');
      show('b');
      expect(scrolled).toEqual(['Alpha', 'Beta']);
    } finally {
      HTMLElement.prototype.scrollIntoView = original;
    }
  });
});
