const SPECIAL: Record<string, string> = {
  ø: 'o',
  ß: 'ss',
  æ: 'ae',
  œ: 'oe',
  ł: 'l',
  đ: 'd',
  ð: 'd',
  þ: 'th',
  ı: 'i',
};
const SPECIAL_RE = /[øßæœłđðþı]/g;

/**
 * Fold text for matching: NFD, strip combining marks, lowercase, map letters
 * that do not decompose (ø ß æ œ ł đ), turn punctuation into spaces and
 * collapse whitespace.
 */
export function normalize(text: string): string {
  return foldChars(text).replace(/ +/g, ' ').trim();
}

function foldChars(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(SPECIAL_RE, (c) => SPECIAL[c] ?? c)
    .replace(/[^\p{L}\p{N}]/gu, ' ');
}

/**
 * Where `query` matches inside `text`, as `[start, end)` offsets into the
 * original text (accent- and case-insensitive). Falls back to the first query
 * word; `null` when nothing matches.
 */
export function matchRange(text: string, query: string): [number, number] | null {
  const q = normalize(query);
  if (!q) return null;
  let folded = '';
  const origin: number[] = [];
  let offset = 0;
  for (const ch of text) {
    const f = foldChars(ch);
    origin.push(...Array.from({ length: f.length }, () => offset));
    folded += f;
    offset += ch.length;
  }
  origin.push(offset);
  const first = q.split(' ')[0] ?? q;
  for (const needle of [q, first]) {
    const at = folded.indexOf(needle);
    if (at >= 0) {
      const start = origin[at];
      const end = origin[at + needle.length];
      if (start !== undefined && end !== undefined) return [start, end];
    }
  }
  return null;
}
