import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { FIT, distance, zoomAt, type View } from '@ui/canvas-logic';
import { useMediaQuery } from '@ui/hooks';
import { Icon } from './icons';
import { TrustedHtml } from './trusted-html';

/** Props of {@link ChartCanvas}. */
export interface ChartCanvasProps {
  /** SVG markup from a renderer. */
  markup: string;
  /** Tooltip key of the selected item; it is highlighted on the drawing. */
  selected?: string | undefined;
  /**
   * Ids of channels to light up (`20-34`); every other channel on the drawing
   * is dimmed. Leave undefined for no focus.
   */
  focusChannels?: readonly string[] | undefined;
  /** Extra classes on the viewport (e.g. layer toggles). */
  class?: string;
  /** Extra toolbar content, shown before the zoom buttons. */
  toolbar?: ComponentChildren;
  /** Bumped by the parent to reset the view (a new chart, another tab). */
  resetKey?: string;
  /** `square` for the wheel; BodyGraphs are portrait. */
  shape?: 'portrait' | 'square';
}

const STEP = 1.25;

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

/**
 * The drawing area of the workspace: the SVG, zoom in/out/fit buttons, wheel
 * and pinch zoom, drag to pan. The drawing is an SVG string inserted once;
 * zoom and pan are CSS transforms on its wrapper.
 */
export function ChartCanvas({
  markup,
  selected,
  focusChannels,
  class: className = '',
  toolbar,
  resetKey,
  shape = 'portrait',
}: ChartCanvasProps) {
  const [view, setView] = useState<View>(FIT);
  const viewRef = useRef(view);
  viewRef.current = view;
  const port = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  const wide = useMediaQuery('(min-width: 1024px)');
  const zoomed = view.scale !== 1;

  useEffect(() => setView(FIT), [resetKey]);

  // Highlight the selected item on the drawing.
  useEffect(() => {
    const root = port.current;
    if (!root) return;
    for (const el of root.querySelectorAll('.is-selected')) el.classList.remove('is-selected');
    if (!selected) return;
    for (const el of root.querySelectorAll('[data-tip]')) {
      if (el.getAttribute('data-tip') === selected) el.classList.add('is-selected');
    }
  }, [selected, markup]);

  // Light up only the focused channels and dim the rest.
  useEffect(() => {
    const root = port.current;
    if (!root) return;
    const hits = focusChannels ? new Set(focusChannels.map((id) => `channel:${id}`)) : undefined;
    for (const el of root.querySelectorAll('[data-tip^="channel:"]')) {
      const hit = hits?.has(el.getAttribute('data-tip') ?? '') ?? false;
      el.classList.toggle('is-circuit-hit', hit);
      el.classList.toggle('is-circuit-dim', Boolean(hits) && !hit);
    }
  }, [focusChannels, markup]);

  const zoomBy = (factor: number, px = 0, py = 0): void =>
    setView((v) => zoomAt(v, factor, px, py));

  // Keyboard zoom while the canvas is on screen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (e.key === '+' || e.key === '=') zoomBy(STEP);
      else if (e.key === '-' || e.key === '_') zoomBy(1 / STEP);
      else if (e.key === '0') setView(FIT);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const centreOffset = (e: { clientX: number; clientY: number }): { x: number; y: number } => {
    const r = port.current?.getBoundingClientRect();
    return r
      ? { x: e.clientX - (r.left + r.width / 2), y: e.clientY - (r.top + r.height / 2) }
      : { x: 0, y: 0 };
  };

  const onWheel = (e: WheelEvent): void => {
    if (!(wide || e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const { x, y } = centreOffset(e);
    zoomBy(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), x, y);
  };

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const onPointerDown = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragged.current = false;
    let last = { x: e.clientX, y: e.clientY };
    let pinch = pointers.current.size === 2 ? gap() : 0;
    const move = (m: PointerEvent): void => {
      if (!pointers.current.has(m.pointerId)) return;
      pointers.current.set(m.pointerId, { x: m.clientX, y: m.clientY });
      if (pointers.current.size === 2) {
        const now = gap();
        if (pinch > 0) {
          const [a, b] = [...pointers.current.values()];
          if (a && b) {
            const c = centreOffset({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 });
            zoomBy(now / pinch, c.x, c.y);
          }
        }
        pinch = now;
        dragged.current = true;
        return;
      }
      const dx = m.clientX - last.x;
      const dy = m.clientY - last.y;
      if (!dragged.current && Math.hypot(m.clientX - e.clientX, m.clientY - e.clientY) < 5) return;
      dragged.current = true;
      last = { x: m.clientX, y: m.clientY };
      if (viewRef.current.scale !== 1) setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
    };
    const up = (u: PointerEvent): void => {
      pointers.current.delete(u.pointerId);
      if (pointers.current.size === 0) {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };
  const gap = (): number => {
    const [a, b] = [...pointers.current.values()];
    return a && b ? distance(a, b) : 0;
  };

  return (
    <div class="canvas">
      <div class="canvas-toolbar" role="toolbar" aria-label="Chart view">
        {toolbar}
        <span class="toolbar-spacer" />
        <button
          type="button"
          class="btn btn-icon btn-ghost"
          aria-label="Zoom out"
          onClick={() => zoomBy(1 / STEP)}
        >
          <Icon name="minus" />
        </button>
        <span class="zoom-level" aria-live="off">
          {Math.round(view.scale * 100)}%
        </span>
        <button
          type="button"
          class="btn btn-icon btn-ghost"
          aria-label="Zoom in"
          onClick={() => zoomBy(STEP)}
        >
          <Icon name="plus" />
        </button>
        <button
          type="button"
          class="btn btn-icon btn-ghost"
          aria-label="Fit to view (reset zoom)"
          disabled={!zoomed && view.x === 0 && view.y === 0}
          onClick={() => setView(FIT)}
        >
          <Icon name="fit" />
        </button>
      </div>
      <div
        class={`canvas-port shape-${shape} ${zoomed ? 'is-zoomed' : ''} ${focusChannels ? 'has-focus' : ''} ${className}`.trim()}
        ref={port}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onClickCapture={(e) => {
          if (dragged.current) {
            e.stopPropagation();
            e.preventDefault();
            dragged.current = false;
          }
        }}
      >
        <TrustedHtml
          class="canvas-content"
          markup={markup}
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
        />
      </div>
    </div>
  );
}
