import type { ComponentProps } from 'preact';

/** Props of {@link TrustedHtml}. */
export interface TrustedHtmlProps extends Omit<
  ComponentProps<'div'>,
  'dangerouslySetInnerHTML' | 'ref'
> {
  /** Markup from our own renderers (src/ui/bodygraph.ts and friends). */
  markup: string;
}

/**
 * The single place the app inserts raw markup. It only ever receives the SVG
 * strings produced by the renderers in src/ui (bodygraph, wheel, composite,
 * legend), which escape every dynamic value with `escapeXml`. Never pass user
 * input here.
 */
export function TrustedHtml({ markup, ...rest }: TrustedHtmlProps) {
  return <div {...rest} dangerouslySetInnerHTML={{ __html: markup }} />;
}
