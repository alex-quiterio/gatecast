import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { tipFor } from '@content';
import { placeTooltip, type Box } from '@ui/tooltip-logic';
import { Icon } from './icons';

const TIP_ID = 'hd-tooltip';

interface Active {
  anchor: Element;
  key: string;
  sheet: boolean;
}

/** Whether the primary input cannot hover (phones, tablets). */
export function isTouchPrimary(): boolean {
  try {
    return window.matchMedia('(hover: none)').matches;
  } catch {
    return false;
  }
}

function tipTarget(event: Event): Element | null {
  return event.target instanceof Element ? event.target.closest('[data-tip]') : null;
}

function boxOf(el: Element): Box {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

/**
 * The one tooltip for the whole document. Any element with
 * `data-tip="<key>"` shows `tipFor(key)`: on hover or focus with a pointer, as
 * a bottom sheet on touch (tap to open; tap outside, the close button or
 * Escape to close). Uses event delegation, so content rendered later works.
 */
export function TooltipHost() {
  const [active, setActive] = useState<Active | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const tip = useRef<HTMLDivElement>(null);
  const current = useRef<Active | null>(null);
  current.current = active;

  useEffect(() => {
    const open = (anchor: Element, sheet: boolean): void => {
      const key = anchor.getAttribute('data-tip');
      if (!key || !tipFor(key)) return;
      if (current.current?.anchor === anchor && current.current.sheet === sheet) return;
      setActive({ anchor, key, sheet });
    };
    const close = (): void => setActive(null);
    const on = (name: string, fn: (e: Event) => void): void => document.addEventListener(name, fn);
    const off = (name: string, fn: (e: Event) => void): void =>
      document.removeEventListener(name, fn);
    const over = (e: Event): void => {
      const t = tipTarget(e);
      if (t && !isTouchPrimary()) open(t, false);
    };
    const out = (e: Event): void => {
      const t = tipTarget(e);
      const to = (e as MouseEvent).relatedTarget;
      if (t && t === current.current?.anchor && !(to instanceof Node && t.contains(to))) close();
    };
    const focusIn = (e: Event): void => {
      const t = tipTarget(e);
      if (t && !isTouchPrimary()) open(t, false);
    };
    const focusOut = (e: Event): void => {
      if (tipTarget(e) && !current.current?.sheet) close();
    };
    const click = (e: Event): void => {
      const t = tipTarget(e);
      if (t) open(t, isTouchPrimary());
      else if (current.current && e.target instanceof Node) {
        // A tap outside the sheet closes it; the sheet's own clicks are handled by its buttons.
        if (!tip.current?.contains(e.target)) close();
      }
    };
    const key = (e: Event): void => {
      if ((e as KeyboardEvent).key === 'Escape') close();
    };
    const scroll = (): void => {
      if (current.current && !current.current.sheet) close();
    };
    const names: [string, (e: Event) => void][] = [
      ['mouseover', over],
      ['mouseout', out],
      ['focusin', focusIn],
      ['focusout', focusOut],
      ['click', click],
      ['keydown', key],
    ];
    for (const [n, f] of names) on(n, f);
    window.addEventListener('scroll', scroll, { passive: true, capture: true });
    window.addEventListener('hashchange', close);
    return () => {
      for (const [n, f] of names) off(n, f);
      window.removeEventListener('scroll', scroll, true);
      window.removeEventListener('hashchange', close);
    };
  }, []);

  // Position the popover once it has a size.
  useLayoutEffect(() => {
    if (!active || active.sheet || !tip.current) {
      setPos(null);
      return;
    }
    const placed = placeTooltip(
      boxOf(active.anchor),
      { width: tip.current.offsetWidth, height: tip.current.offsetHeight },
      { width: document.documentElement.clientWidth, height: window.innerHeight },
    );
    setPos({ left: placed.left, top: placed.top });
  }, [active]);

  // Wire aria-describedby on the anchor while open.
  useEffect(() => {
    if (!active) return;
    const el = active.anchor;
    const before = el.getAttribute('aria-describedby');
    el.setAttribute('aria-describedby', before ? `${before} ${TIP_ID}` : TIP_ID);
    return () => {
      const rest = (el.getAttribute('aria-describedby') ?? '')
        .split(' ')
        .filter((id) => id && id !== TIP_ID)
        .join(' ');
      if (rest) el.setAttribute('aria-describedby', rest);
      else el.removeAttribute('aria-describedby');
    };
  }, [active]);

  if (!active) return null;
  const content = tipFor(active.key);
  if (!content) return null;
  const more = (): void => {
    setActive(null);
    const inspector = document.getElementById('inspector');
    inspector?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  if (active.sheet) {
    return (
      <div class="sheet-backdrop">
        <div
          class="tooltip tooltip-sheet"
          id={TIP_ID}
          role="dialog"
          aria-label={content.title}
          ref={tip}
        >
          <div class="sheet-grip" aria-hidden="true" />
          <strong class="tip-title">{content.title}</strong>
          <span class="tip-body">{content.body}</span>
          <div class="sheet-actions">
            {document.getElementById('inspector') ? (
              <button type="button" class="btn btn-sm" onClick={more}>
                Full explanation
              </button>
            ) : null}
            <button type="button" class="btn btn-sm btn-ghost" onClick={() => setActive(null)}>
              <Icon name="close" size={14} /> Close
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      class="tooltip"
      id={TIP_ID}
      role="tooltip"
      ref={tip}
      style={pos ? { left: `${pos.left}px`, top: `${pos.top}px` } : { visibility: 'hidden' }}
    >
      <strong class="tip-title">{content.title}</strong>
      <span class="tip-body">{content.body}</span>
    </div>
  );
}
