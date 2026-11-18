import { useEffect, useRef, useState } from 'preact/hooks';
import {
  LEFT_MIN,
  clampWidth,
  maxWidthFor,
  widthForDrag,
  widthForKey,
} from '@ui/panel-resize-logic';

/** Props of {@link ResizeHandle}. */
export interface ResizeHandleProps {
  /** The width the user chose, or `undefined` while the stylesheet default applies. */
  width: number | undefined;
  /** Called with each new width while dragging or pressing keys. */
  onChange: (width: number) => void;
  /** Called when a drag ends or a key sets a width: the moment to save it. */
  onCommit: (width: number) => void;
  /** Go back to the default width (double-click, or Enter). */
  onReset: () => void;
  /** Accessible name, e.g. "Resize the birth data panel". */
  label: string;
}

/**
 * A draggable divider on the right edge of the left panel. It is a WAI-ARIA
 * window splitter: focusable, announces its value, and moves with the arrow
 * keys (Shift for bigger steps, Home and End for the limits). Double-click or
 * Enter restores the default width.
 */
export function ResizeHandle({ width, onChange, onCommit, onReset, label }: ResizeHandleProps) {
  const [dragging, setDragging] = useState(false);
  const [max, setMax] = useState(() => maxWidthFor(window.innerWidth));
  const [measured, setMeasured] = useState<number | undefined>(undefined);
  const handle = useRef<HTMLDivElement>(null);
  const start = useRef({ x: 0, width: LEFT_MIN });

  /** What the panel renders at right now, whether or not the user set it. */
  const actual = (): number =>
    clampWidth(handle.current?.parentElement?.getBoundingClientRect().width ?? LEFT_MIN, max);
  const shown = width ?? measured ?? LEFT_MIN;
  const latest = useRef(shown);
  latest.current = shown;

  useEffect(() => {
    const onResize = (): void => {
      setMax(maxWidthFor(window.innerWidth));
      setMeasured(actual());
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [width]);

  // Keep the page from selecting text or flickering the cursor mid-drag.
  useEffect(() => {
    document.body.classList.toggle('is-resizing', dragging);
    return () => document.body.classList.remove('is-resizing');
  }, [dragging]);

  const onPointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    start.current = { x: event.clientX, width: width ?? actual() };
    setDragging(true);
  };
  const onPointerMove = (event: PointerEvent): void => {
    if (!dragging) return;
    onChange(widthForDrag(start.current.width, event.clientX - start.current.x, max));
  };
  const endDrag = (): void => {
    if (!dragging) return;
    setDragging(false);
    onCommit(clampWidth(latest.current, max));
  };
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onReset();
      return;
    }
    const next = widthForKey(event.key, width ?? actual(), max, event.shiftKey);
    if (next === undefined) return;
    event.preventDefault();
    onChange(next);
    onCommit(next);
  };

  return (
    <div
      ref={handle}
      class={`resize-handle${dragging ? ' is-dragging' : ''}`}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuemin={LEFT_MIN}
      aria-valuemax={max}
      aria-valuenow={clampWidth(shown, max)}
      aria-valuetext={`${clampWidth(shown, max)} pixels wide`}
      title="Drag to resize. Double-click to reset."
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      onDblClick={onReset}
    />
  );
}
