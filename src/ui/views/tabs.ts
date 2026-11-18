import { h } from '@ui/dom';

export interface TabItem {
  id: string;
  label: string;
}

/**
 * An accessible tab list (roving tabindex, arrow/Home/End keys). The caller
 * owns the panels: each should have `role="tabpanel"` and
 * `aria-labelledby="<prefix>-tab-<id>"`.
 */
export function createTabs(
  prefix: string,
  label: string,
  items: readonly TabItem[],
  initial: string,
  onSelect: (id: string) => void,
): { element: HTMLElement; select: (id: string) => void } {
  const buttons = new Map<string, HTMLButtonElement>();
  const select = (id: string, focus = false): void => {
    for (const [key, button] of buttons) {
      const active = key === id;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && focus) button.focus();
    }
    onSelect(id);
  };
  const element = h('div', {
    class: 'tabs',
    role: 'tablist',
    'aria-label': label,
    on: {
      keydown: (event) => {
        const ids = items.map((i) => i.id);
        const current = ids.findIndex((id) => buttons.get(id)?.tabIndex === 0);
        let next: number;
        if (event.key === 'ArrowRight') next = (current + 1) % ids.length;
        else if (event.key === 'ArrowLeft') next = (current - 1 + ids.length) % ids.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = ids.length - 1;
        else return;
        event.preventDefault();
        const id = ids[next];
        if (id !== undefined) select(id, true);
      },
    },
  });
  for (const item of items) {
    const button = h(
      'button',
      {
        type: 'button',
        role: 'tab',
        class: 'tab',
        id: `${prefix}-tab-${item.id}`,
        'aria-controls': `${prefix}-panel-${item.id}`,
        on: { click: () => select(item.id) },
      },
      item.label,
    );
    buttons.set(item.id, button);
    element.appendChild(button);
  }
  for (const [key, button] of buttons) {
    button.setAttribute('aria-selected', String(key === initial));
    button.tabIndex = key === initial ? 0 : -1;
  }
  return { element, select: (id) => select(id) };
}
