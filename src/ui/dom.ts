/**
 * Tiny typed DOM helpers. Everything is built with `createElement` and
 * `textContent`; user data is never concatenated into markup.
 */

export type Child = Node | string | number | null | undefined | false | readonly Child[];

type Handler<E extends Event> = (event: E) => void;

export interface Props {
  class?: string;
  id?: string;
  text?: string;
  /** Event handlers by lower-case event name, e.g. `{ click: fn }`. */
  on?: { [K in keyof HTMLElementEventMap]?: Handler<HTMLElementEventMap[K]> };
  /** Dataset entries; keys are camelCase (`tip` becomes `data-tip`). */
  data?: Record<string, string | undefined>;
  /** Any other attribute: `false`/`undefined`/`null` removes it, `true` sets it empty. */
  [attribute: string]: unknown;
}

const RESERVED = new Set(['class', 'id', 'text', 'on', 'data']);

function append(parent: Node, child: Child): void {
  if (child === null || child === undefined || child === false) return;
  if (Array.isArray(child)) {
    for (const item of child as readonly Child[]) append(parent, item);
    return;
  }
  if (typeof child === 'string' || typeof child === 'number') {
    parent.appendChild(document.createTextNode(String(child)));
    return;
  }
  parent.appendChild(child as Node);
}

/**
 * Build an element. Strings and numbers become text nodes, never markup.
 *
 * @param tag HTML tag name.
 * @param props Attributes, `class`, `text`, `data` and `on` handlers.
 * @param children Nodes or text; falsy values are skipped and arrays are flattened.
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props | null = null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props) {
    if (props.class) el.className = props.class;
    if (props.id) el.id = props.id;
    if (props.text !== undefined) el.textContent = props.text;
    if (props.data) {
      for (const [key, value] of Object.entries(props.data)) {
        if (value !== undefined) el.dataset[key] = value;
      }
    }
    if (props.on) {
      for (const [name, handler] of Object.entries(props.on)) {
        if (handler) el.addEventListener(name, handler as EventListener);
      }
    }
    for (const [name, value] of Object.entries(props)) {
      if (RESERVED.has(name)) continue;
      if (value === false || value === undefined || value === null) continue;
      el.setAttribute(name, value === true ? '' : String(value));
    }
  }
  for (const child of children) append(el, child);
  return el;
}

/** Remove every child of `node`. */
export function clear(node: Node): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/** Replace the children of `node`. */
export function render(node: Node, ...children: Child[]): void {
  clear(node);
  for (const child of children) append(node, child);
}

/**
 * The single trusted `innerHTML` sink of the app. It only ever receives the
 * SVG/HTML strings produced by our own renderers (src/ui/bodygraph.ts and
 * friends), which escape every dynamic value. Never pass user input here.
 */
export function setTrustedHtml(node: Element, markup: string): void {
  node.innerHTML = markup;
}

/** `Array.prototype.find`-style helper: first ancestor (or self) carrying `[attr]`. */
export function closestWith(target: EventTarget | null, selector: string): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  const found = target.closest(selector);
  return found instanceof HTMLElement || found instanceof SVGElement
    ? (found as unknown as HTMLElement)
    : null;
}
