import type { ComponentChildren } from 'preact';

/** A small round "i" button carrying a tooltip key (and selecting it in the inspector). */
export function InfoButton({ tip, label }: { tip: string; label: string }) {
  return (
    <button type="button" class="info" data-tip={tip} aria-label={`About ${label}`}>
      <span aria-hidden="true">i</span>
    </button>
  );
}

/** A pill/tag button carrying a tooltip key. */
export function Chip({
  tip,
  children,
  class: className = '',
}: {
  tip: string;
  children: ComponentChildren;
  class?: string;
}) {
  return (
    <button type="button" class={`chip ${className}`.trim()} data-tip={tip}>
      {children}
    </button>
  );
}
