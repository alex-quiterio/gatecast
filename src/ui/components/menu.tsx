import { useEffect, useRef, useState } from 'preact/hooks';
import { useOutsideClick } from '@ui/hooks';
import { Icon, type IconName } from './icons';

/** One entry of a {@link Menu}. */
export interface MenuItem {
  id: string;
  label: string;
  icon?: IconName;
  /** Shortcut hint shown on the right, e.g. `S`. */
  hint?: string;
  disabled?: boolean;
  /** Makes the entry a radio item that is (or is not) the current choice. */
  checked?: boolean;
  /** Draws a divider above the entry. */
  separated?: boolean;
  onSelect: () => void;
}

/** Props of {@link Menu}. */
export interface MenuProps {
  label: string;
  icon?: IconName;
  items: readonly MenuItem[];
  class?: string;
  /** Text of the button when it should differ from the menu's accessible name. */
  buttonText?: string;
}

/**
 * A button that opens a menu of actions. Arrow keys move, Enter/Space choose,
 * Escape or an outside press closes and returns focus to the button.
 */
export function Menu({
  label,
  icon = 'download',
  items,
  class: className = '',
  buttonText,
}: MenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useOutsideClick(root, open, () => setOpen(false));
  useEffect(() => {
    if (open)
      root.current?.querySelector<HTMLElement>('[role^="menuitem"]:not([disabled])')?.focus();
  }, [open]);
  const onKeyDown = (e: KeyboardEvent): void => {
    if (!open) return;
    const nodes = [
      ...(root.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([disabled])') ?? []),
    ];
    const at = nodes.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
      button.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      nodes[(at + 1) % nodes.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      nodes[(at - 1 + nodes.length) % nodes.length]?.focus();
    } else if (e.key === 'Tab') setOpen(false);
  };
  return (
    <div class={`menu ${className}`.trim()} ref={root} onKeyDown={onKeyDown}>
      <button
        type="button"
        class="btn"
        ref={button}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Icon name={icon} /> <span>{buttonText ?? label}</span>
        <Icon name="chevron" size={12} />
      </button>
      {open ? (
        <div class="menu-list" role="menu" aria-label={label}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role={item.checked === undefined ? 'menuitem' : 'menuitemradio'}
              aria-checked={item.checked}
              class={`menu-item${item.separated ? ' is-separated' : ''}${item.checked ? ' is-checked' : ''}`}
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                button.current?.focus();
                item.onSelect();
              }}
            >
              {item.checked ? (
                <Icon name="check" />
              ) : item.icon ? (
                <Icon name={item.icon} />
              ) : (
                <span class="icon-gap" />
              )}
              <span>{item.label}</span>
              {item.hint ? <kbd>{item.hint}</kbd> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
