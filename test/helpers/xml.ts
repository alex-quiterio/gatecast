/** A tiny well-formedness checker: balanced tags, quoted attributes, valid entities, unique ids. */
export interface XmlReport {
  ok: boolean;
  errors: string[];
  ids: string[];
  tags: Record<string, number>;
}

const TAG = /<(\/?)([A-Za-z][\w:-]*)((?:\s+[\w:-]+="[^"<]*")*)\s*(\/?)>/y;

export function checkXml(source: string): XmlReport {
  const errors: string[] = [];
  const stack: string[] = [];
  const ids: string[] = [];
  const tags: Record<string, number> = {};
  let i = 0;
  while (i < source.length) {
    const lt = source.indexOf('<', i);
    const text = source.slice(i, lt === -1 ? source.length : lt);
    if (/&(?!(amp|lt|gt|quot|#39|#\d+);)/.test(text))
      errors.push(`bad entity near ${text.slice(0, 30)}`);
    if (lt === -1) break;
    TAG.lastIndex = lt;
    const m = TAG.exec(source);
    if (!m) {
      errors.push(`bad tag at ${lt}: ${source.slice(lt, lt + 60)}`);
      break;
    }
    const [, closing, name = '', attributes = '', selfClosing] = m;
    tags[name] = (tags[name] ?? 0) + 1;
    for (const a of attributes.matchAll(/\sid="([^"]*)"/g)) ids.push(a[1] ?? '');
    for (const a of attributes.matchAll(/="([^"]*)"/g)) {
      if (/&(?!(amp|lt|gt|quot|#39|#\d+);)/.test(a[1] ?? ''))
        errors.push(`bad entity in attribute of ${name}`);
    }
    if (closing) {
      if (stack.pop() !== name) errors.push(`unbalanced </${name}> at ${lt}`);
    } else if (!selfClosing) stack.push(name);
    i = lt + m[0].length;
  }
  if (stack.length > 0) errors.push(`unclosed: ${stack.join(',')}`);
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) errors.push(`duplicate id ${id}`);
    seen.add(id);
  }
  return { ok: errors.length === 0, errors, ids, tags };
}

/** Values of an attribute across the whole document. */
export function attributeValues(source: string, attribute: string): string[] {
  return [...source.matchAll(new RegExp(`\\s${attribute}="([^"]*)"`, 'g'))].map((m) => m[1] ?? '');
}

/** Count elements whose class attribute contains the given class token. */
export function countClass(source: string, token: string): number {
  return [...source.matchAll(/\sclass="([^"]*)"/g)].filter((m) =>
    (m[1] ?? '').split(/\s+/).includes(token),
  ).length;
}
