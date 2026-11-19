/** What the paginator needs to know about one block of the document. */
export interface BlockMeta {
  /** Rendered height in px. */
  height: number;
  /** Keep this block on the same page as the next one (headings). */
  keepWithNext?: boolean;
  /** Start a new page before this block. */
  breakBefore?: boolean;
}

/**
 * Distribute blocks onto pages, in order, without splitting a block.
 * A run of `keepWithNext` blocks plus the block after it moves as one unit
 * when it fits on a page; a block taller than a page gets a page of its own.
 *
 * @param blocks Block sizes and rules.
 * @param pageHeight Content height of one page, same unit as the block heights.
 * @returns Block indices per page; never an empty page, and one empty list for no blocks.
 */
export function paginate(blocks: readonly BlockMeta[], pageHeight: number): number[][] {
  const pages: number[][] = [];
  let current: number[] = [];
  let used = 0;
  const flush = (): void => {
    if (current.length > 0) pages.push(current);
    current = [];
    used = 0;
  };
  let i = 0;
  while (i < blocks.length) {
    // Collect the unit starting at i.
    let end = i;
    while (end < blocks.length - 1 && blocks[end]?.keepWithNext) end += 1;
    let unit = blocks.slice(i, end + 1).reduce((s, b) => s + b.height, 0);
    let indices = Array.from({ length: end - i + 1 }, (_u, k) => i + k);
    if (unit > pageHeight && indices.length > 1) {
      // Too tall to keep together: place only the first block.
      indices = [i];
      unit = blocks[i]?.height ?? 0;
    }
    if (blocks[i]?.breakBefore) flush();
    if (used + unit > pageHeight && current.length > 0) flush();
    current.push(...indices);
    used += unit;
    i += indices.length;
  }
  flush();
  return pages.length > 0 ? pages : [[]];
}
