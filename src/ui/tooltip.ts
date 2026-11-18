import { tipFor } from '@content';
import { h } from './dom';

const TIP_ID = 'hd-tooltip';
const MARGIN = 8;

/**
 * Install the accessible tooltip once for the whole document. Any element with
 * `data-tip="<key>"` shows `tipFor(key)` on hover, focus or tap. Escape,
 * scrolling or a click elsewhere closes it. Uses event delegation, so content
 * rendered later works without further wiring.
 *
 * @returns a function that removes the listeners.
 */
export function installTooltips(root: Document = document): () => void {
  const title = h('strong', { class: 'tip-title' });
  const body = h('span', { class: 'tip-body' });
  const tip = h(
    'div',
    { id: TIP_ID, class: 'tooltip', role: 'tooltip', hidden: true },
    title,
    body,
  );
  root.body.appendChild(tip);
  let current: Element | null = null;

  const hide = (): void => {
    if (current) {
      const describedBy = (current.getAttribute('aria-describedby') ?? '')
        .split(' ')
        .filter((id) => id && id !== TIP_ID)
        .join(' ');
      if (describedBy) current.setAttribute('aria-describedby', describedBy);
      else current.removeAttribute('aria-describedby');
    }
    current = null;
    tip.hidden = true;
  };

  const place = (target: Element): void => {
    const rect = target.getBoundingClientRect();
    const width = tip.offsetWidth;
    const height = tip.offsetHeight;
    const vw = root.documentElement.clientWidth;
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(MARGIN, Math.min(left, vw - width - MARGIN));
    let top = rect.bottom + MARGIN;
    if (top + height > window.innerHeight - MARGIN) top = rect.top - height - MARGIN;
    top = Math.max(MARGIN, top);
    tip.style.left = `${left + window.scrollX}px`;
    tip.style.top = `${top + window.scrollY}px`;
  };

  const show = (target: Element): void => {
    if (target === current) return;
    const key = target.getAttribute('data-tip');
    const content = key ? tipFor(key) : undefined;
    if (!content) return;
    hide();
    title.textContent = content.title;
    body.textContent = content.body;
    tip.hidden = false;
    current = target;
    const existing = target.getAttribute('aria-describedby');
    target.setAttribute('aria-describedby', existing ? `${existing} ${TIP_ID}` : TIP_ID);
    place(target);
  };

  const tipTarget = (event: Event): Element | null =>
    event.target instanceof Element ? event.target.closest('[data-tip]') : null;

  const listeners: [string, EventListener][] = [
    [
      'mouseover',
      (e) => {
        const t = tipTarget(e);
        if (t) show(t);
      },
    ],
    [
      'mouseout',
      (e) => {
        const t = tipTarget(e);
        if (t && t === current && !t.contains((e as MouseEvent).relatedTarget as Node | null))
          hide();
      },
    ],
    [
      'focusin',
      (e) => {
        const t = tipTarget(e);
        if (t) show(t);
      },
    ],
    [
      'focusout',
      (e) => {
        if (tipTarget(e)) hide();
      },
    ],
    [
      'click',
      (e) => {
        const t = tipTarget(e);
        if (t) show(t);
        else hide();
      },
    ],
    [
      'keydown',
      (e) => {
        if ((e as KeyboardEvent).key === 'Escape') hide();
      },
    ],
  ];
  for (const [name, fn] of listeners) root.addEventListener(name, fn);
  const onScroll = (): void => hide();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('hashchange', hide);

  return () => {
    for (const [name, fn] of listeners) root.removeEventListener(name, fn);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('hashchange', hide);
    tip.remove();
  };
}
