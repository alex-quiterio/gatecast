/**
 * Remove the accessible `<title>`, `<desc>` and `aria-labelledby` of a renderer's
 * SVG. They quote the chart's saved name, which the user may have hidden or
 * replaced; the embedding card or report carries its own label.
 */
export function stripSvgMeta(svg: string): string {
  return svg
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/g, '')
    .replace(/<desc\b[^>]*>[\s\S]*?<\/desc>/g, '')
    .replace(/ aria-labelledby="[^"]*"/, '')
    .replace(' role="img"', ' aria-hidden="true"');
}
