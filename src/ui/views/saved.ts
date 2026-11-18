import type { BirthInput } from '@/types';
import { h, render } from '@ui/dom';
import type { PeopleStore } from '@ui/storage';
import { describeBirth } from './common';

/**
 * The list of saved people with Load and Delete buttons. Returns the element
 * and a `refresh` function to call after the store changes elsewhere.
 */
export function createSavedList(
  store: PeopleStore,
  actions: { loadLabel: string; onLoad: (input: BirthInput) => void },
): { element: HTMLElement; refresh: () => void } {
  const list = h('ul', { class: 'saved-list' });
  const status = h('p', { class: 'sr-only', 'aria-live': 'polite' });
  const element = h('div', { class: 'saved' }, h('h3', null, 'Saved on this device'), list, status);
  const refresh = (): void => {
    const people = store.list();
    element.hidden = people.length === 0;
    render(
      list,
      people.map((person) => {
        const label = person.input.name || 'Unnamed';
        return h(
          'li',
          null,
          h('span', { class: 'saved-name' }, label),
          h('span', { class: 'muted small' }, describeBirth(person.input)),
          h(
            'span',
            { class: 'saved-actions' },
            h(
              'button',
              {
                type: 'button',
                class: 'btn btn-small',
                'aria-label': `${actions.loadLabel} ${label}`,
                on: { click: () => actions.onLoad(person.input) },
              },
              actions.loadLabel,
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'btn btn-small btn-quiet',
                'aria-label': `Delete ${label}`,
                on: {
                  click: () => {
                    store.remove(person.id);
                    status.textContent = `Deleted ${label}.`;
                    refresh();
                  },
                },
              },
              'Delete',
            ),
          ),
        );
      }),
    );
  };
  refresh();
  return { element, refresh };
}
