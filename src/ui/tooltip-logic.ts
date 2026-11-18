/** A rectangle in viewport coordinates. */
export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Where a tooltip goes. */
export interface TooltipPlacement {
  left: number;
  top: number;
  /** Which side of the anchor it ended up on. */
  side: 'below' | 'above';
}

/**
 * Position a tooltip next to an anchor so it stays inside the viewport: below
 * the anchor if it fits, otherwise above, clamped horizontally. Pure.
 *
 * @param anchor The element the tooltip describes.
 * @param size The tooltip's own size.
 * @param viewport The visible area.
 * @param margin Gap to the anchor and to the viewport edges.
 */
export function placeTooltip(
  anchor: Box,
  size: { width: number; height: number },
  viewport: { width: number; height: number },
  margin = 8,
): TooltipPlacement {
  let left = anchor.left + anchor.width / 2 - size.width / 2;
  left = Math.max(margin, Math.min(left, viewport.width - size.width - margin));
  let top = anchor.top + anchor.height + margin;
  let side: TooltipPlacement['side'] = 'below';
  if (top + size.height > viewport.height - margin) {
    top = anchor.top - size.height - margin;
    side = 'above';
  }
  top = Math.max(margin, top);
  return { left, top, side };
}
