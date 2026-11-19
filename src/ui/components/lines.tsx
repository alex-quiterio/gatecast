import { useEffect, useRef } from 'preact/hooks';
import type { Chart } from '@/types';
import { lineMeaning } from '@content';
import type { GateLineContent } from '@content/schema';
import { lineMarks, markCaption, type LineMark } from '@ui/selection-logic';

/** The "Your line" badge: source swatches (ivory for Personality, rose for Design) plus text. */
export function MineBadge({ mark }: { mark: LineMark }) {
  return (
    <span class="mine-badge" title={markCaption(mark)}>
      {mark.sources.map((s) => (
        <span key={s} class={`swatch swatch-${s}`} aria-hidden="true" />
      ))}
      <span>Your line</span>
      <span class="mine-planets">{markCaption(mark)}</span>
    </span>
  );
}

function isWide(): boolean {
  try {
    return window.matchMedia('(min-width: 768px)').matches;
  } catch {
    return true;
  }
}

/** One quiet, collapsible paragraph under a line: "When it flows" or "Under pressure". */
function LineMore({ label, text, open }: { label: string; text: string; open: boolean }) {
  const el = useRef<HTMLDetailsElement>(null);
  // Open by default on wide screens, closed on phones; the reader's toggling is never reset.
  useEffect(() => {
    if (open && el.current) el.current.open = true;
  }, [open]);
  return (
    <details class="line-more" ref={el}>
      <summary>{label}</summary>
      <p>{text}</p>
    </details>
  );
}

/**
 * The optional "When it flows" and "Under pressure" notes of a line. Quiet by
 * design: muted labels, no warning colours (a stress note is a pattern).
 */
export function LineExtras({
  meaning,
  open,
}: {
  meaning: GateLineContent | undefined;
  /** Force them open; by default they open on wide screens only. */
  open?: boolean;
}) {
  if (!meaning?.flow && !meaning?.stress) return null;
  const startOpen = open ?? isWide();
  return (
    <div class="line-extras">
      {meaning.flow ? (
        <LineMore label="When it flows" text={meaning.flow} open={startOpen} />
      ) : null}
      {meaning.stress ? (
        <LineMore label="Under pressure" text={meaning.stress} open={startOpen} />
      ) : null}
    </div>
  );
}

/** Props of {@link LineList}. */
export interface LineListProps {
  gate: number;
  /** The chart whose lines are marked "Your line"; omit for a plain list. */
  chart?: Chart | undefined;
  /** A line to emphasise (selected, or from a deep link). */
  focusLine?: number | undefined;
}

/**
 * The six lines of one gate with their titles and summaries. The lines the
 * chart has in this gate are marked ("Your line", personality and/or design).
 */
export function LineList({ gate, chart, focusLine }: LineListProps) {
  const marks = lineMarks(chart, gate);
  const list = useRef<HTMLOListElement>(null);
  const any = marks.some((m) => lineMeaning(gate, m.line));

  useEffect(() => {
    if (!focusLine) return;
    list.current
      ?.querySelector('.is-focus')
      ?.scrollIntoView?.({ block: 'nearest', behavior: 'auto' });
  }, [focusLine, gate]);

  if (!any) {
    return (
      <p class="muted small line-empty">
        Line meanings for this gate are not available yet. Each gate has six lines, numbered 1 to 6.
      </p>
    );
  }
  return (
    <section class="lines" aria-label={`The six lines of gate ${gate}`}>
      <h4 class="lines-title">The six lines</h4>
      <ol class="line-list" ref={list}>
        {marks.map((mark) => {
          const meaning = lineMeaning(gate, mark.line);
          const mine = mark.sources.length > 0;
          const cls = `line-row${mine ? ' is-mine' : ''}${focusLine === mark.line ? ' is-focus' : ''}`;
          return (
            <li key={mark.line} class={cls} id={`line-${gate}-${mark.line}`}>
              <span class="line-num" aria-hidden="true">
                {mark.line}
              </span>
              <div class="line-text">
                <p class="line-title">
                  <span class="sr-only">Line {mark.line}: </span>
                  {meaning?.title ?? `Line ${mark.line}`}
                  {mine ? <MineBadge mark={mark} /> : null}
                </p>
                {meaning ? <p class="line-summary">{meaning.summary}</p> : null}
                <LineExtras meaning={meaning} />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
