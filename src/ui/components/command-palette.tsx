import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { searchItems, type QuickItem } from '@ui/search-logic';
import { Dialog } from './dialog';
import { Icon } from './icons';

// Preact's typings demand a `list` attribute whenever an input has role=combobox.
const COMBOBOX: Record<string, string> = { role: 'combobox' };

/** Props of {@link CommandPalette}. */
export interface CommandPaletteProps {
  items: readonly QuickItem[];
  onGo: (hash: string) => void;
  onClose: () => void;
}

/**
 * Quick find: type to jump to any gate, channel, center, type, library item,
 * page or saved chart. Arrow keys move, Enter goes, Escape closes. A
 * full-screen sheet on phones.
 */
export function CommandPalette({ items, onGo, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const list = useRef<HTMLUListElement>(null);
  const results = useMemo(() => searchItems(items, query), [items, query]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [active]);

  const go = (item: QuickItem | undefined): void => {
    if (!item) return;
    onClose();
    onGo(item.hash);
  };
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]);
    }
  };

  let lastGroup = '';
  return (
    <Dialog title="Quick find" onClose={onClose} variant="sheet" class="palette">
      <div class="palette-input">
        <Icon name="search" />
        <input
          type="search"
          data-autofocus
          {...COMBOBOX}
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={results[active] ? `palette-item-${active}` : undefined}
          aria-label="Search gates, channels, centers, types and saved charts"
          placeholder="Jump to a gate, channel, center, type or saved chart"
          autocomplete="off"
          autocapitalize="off"
          spellcheck={false}
          enterkeyhint="go"
          value={query}
          onInput={(e) => setQuery(e.currentTarget.value)}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          class="btn btn-icon btn-ghost palette-close"
          aria-label="Close"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <ul class="palette-list" id="palette-list" role="listbox" aria-label="Results" ref={list}>
        {results.length === 0 ? (
          <li class="palette-empty">Nothing matches &ldquo;{query}&rdquo;.</li>
        ) : null}
        {results.map((item, i) => {
          const head = item.group !== lastGroup;
          lastGroup = item.group;
          return (
            <li key={`${item.group}-${item.hash}`} role="presentation">
              {head ? <div class="palette-group micro">{item.group}</div> : null}
              <div
                role="option"
                id={`palette-item-${i}`}
                aria-selected={i === active}
                class="palette-item"
                onMouseMove={() => setActive(i)}
                onClick={() => go(item)}
              >
                <span class="palette-label">{item.label}</span>
                {item.hint ? <span class="palette-hint">{item.hint}</span> : null}
              </div>
            </li>
          );
        })}
      </ul>
      <p class="palette-foot micro">
        <kbd>↑</kbd> <kbd>↓</kbd> move <kbd>Enter</kbd> open <kbd>Esc</kbd> close
      </p>
    </Dialog>
  );
}
