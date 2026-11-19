import type { ComponentChildren, VNode } from 'preact';
import { useEffect, useState } from 'preact/hooks';

/** Props of {@link Segmented}. */
export interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string; hint?: string }[];
  onChange: (value: T) => void;
  class?: string;
}

/** A radio group drawn as joined buttons; arrow keys move between options. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  class: className = '',
}: SegmentedProps<T>): VNode {
  const onKeyDown = (e: KeyboardEvent): void => {
    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0;
    if (!step) return;
    e.preventDefault();
    const at = options.findIndex((o) => o.value === value);
    const next = options[(at + step + options.length) % options.length];
    if (next) onChange(next.value);
  };
  return (
    <div
      class={`sh-seg ${className}`.trim()}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          tabIndex={o.value === value ? 0 : -1}
          class="sh-seg__btn"
          title={o.hint}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Props of {@link Toggle}. */
export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
  disabled?: boolean;
}

/** A labelled checkbox with an optional hint line. */
export function Toggle({ label, checked, onChange, hint, disabled }: ToggleProps): VNode {
  return (
    <label class="sh-toggle">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange((e.currentTarget as HTMLInputElement).checked)}
      />
      <span class="sh-toggle__text">
        <span>{label}</span>
        {hint ? <span class="sh-hint">{hint}</span> : null}
      </span>
    </label>
  );
}

/** Props of {@link TextField}. */
export interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  hint?: string;
  multiline?: boolean;
  autoComplete?: string;
}

/** A labelled single-line (or multi-line) text field. */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  hint,
  multiline,
  autoComplete = 'off',
}: TextFieldProps): VNode {
  const common = {
    value,
    placeholder,
    maxLength,
    autoComplete,
    onInput: (e: Event): void =>
      onChange((e.currentTarget as HTMLInputElement | HTMLTextAreaElement).value),
  };
  return (
    <label class="sh-field">
      <span class="sh-field__label">{label}</span>
      {multiline ? <textarea rows={4} {...common} /> : <input type="text" {...common} />}
      {hint ? <span class="sh-hint">{hint}</span> : null}
    </label>
  );
}

/** A titled group of controls. */
export function Group({ title, children }: { title: string; children: ComponentChildren }): VNode {
  return (
    <fieldset class="sh-group">
      <legend>{title}</legend>
      {children}
    </fieldset>
  );
}

/** `value`, updated only after it has been still for `delay` ms (keeps typing smooth). */
export function useDebounced<T>(value: T, delay = 160): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return settled;
}
