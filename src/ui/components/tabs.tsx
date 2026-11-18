import { useEffect, useRef } from 'preact/hooks';

/** One tab. */
export interface TabItem {
  id: string;
  label: string;
}

/**
 * Index of the tab a key moves to, or `undefined` for keys that do nothing.
 * Wraps around at both ends.
 */
export function nextTabIndex(key: string, current: number, length: number): number | undefined {
  if (length <= 0) return undefined;
  if (key === 'ArrowRight') return (current + 1) % length;
  if (key === 'ArrowLeft') return (current - 1 + length) % length;
  if (key === 'Home') return 0;
  if (key === 'End') return length - 1;
  return undefined;
}

/** Props of {@link Tabs}. */
export interface TabsProps {
  /** Id prefix: tabs are `<prefix>-tab-<id>`, panels should be `<prefix>-panel-<id>`. */
  prefix: string;
  label: string;
  items: readonly TabItem[];
  value: string;
  onChange: (id: string) => void;
  class?: string;
}

/**
 * An accessible tab list (roving tabindex, arrow/Home/End keys). The caller
 * owns the panels: each should have `role="tabpanel"` and
 * `aria-labelledby="<prefix>-tab-<id>"`.
 */
export function Tabs({ prefix, label, items, value, onChange, class: className }: TabsProps) {
  const refs = useRef(new Map<string, HTMLButtonElement>());
  // A tab bar that scrolls must keep the chosen tab in view.
  useEffect(() => {
    refs.current.get(value)?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [value]);
  const onKeyDown = (event: KeyboardEvent): void => {
    const current = items.findIndex((i) => i.id === value);
    const next = nextTabIndex(event.key, current, items.length);
    if (next === undefined) return;
    event.preventDefault();
    const item = items[next];
    if (!item) return;
    onChange(item.id);
    refs.current.get(item.id)?.focus();
  };
  return (
    <div
      class={`tabs ${className ?? ''}`.trim()}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            class="tab"
            id={`${prefix}-tab-${item.id}`}
            aria-controls={`${prefix}-panel-${item.id}`}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            ref={(el) => {
              if (el) refs.current.set(item.id, el);
              else refs.current.delete(item.id);
            }}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
