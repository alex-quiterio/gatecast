import { useId } from 'preact/hooks';
import type { Chart } from '@/types';
import { CIRCUITS, STREAMS, circuitBreakdown } from '@content';
import type { Circuit, Stream } from '@content/schema';

function Note({ label, text }: { label: string; text: string | undefined }) {
  if (!text) return null;
  return (
    <div class="deep-note">
      <h5 class="deep-label">{label}</h5>
      <p class="fact-text">{text}</p>
    </div>
  );
}

/** A short checklist of experiments; the ticks are the reader's own, kept on the page only. */
function Experiments({ items }: { items: readonly string[] }) {
  const id = useId();
  if (items.length === 0) return null;
  return (
    <div class="deep-note">
      <h5 class="deep-label" id={`${id}-h`}>
        Try this week
      </h5>
      <ul class="checklist" aria-labelledby={`${id}-h`}>
        {items.map((text, i) => (
          <li key={text}>
            <label>
              <input type="checkbox" id={`${id}-${i}`} />
              <span>{text}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Props of {@link CircuitDeep}. */
export interface CircuitDeepProps {
  circuit: Circuit;
  /** A chart to compare against: shows "none of this circuit" when it has none. */
  chart?: Chart | undefined;
}

/**
 * The deeper copy of a circuit: what it looks like when it leads, what having
 * none of it can mean (only when the chart has none, or as reference without a
 * chart), how it relates, and three experiments. Every part is optional.
 */
export function CircuitDeep({ circuit, chart }: CircuitDeepProps) {
  const content = CIRCUITS[circuit];
  const count = chart
    ? (circuitBreakdown(chart).circuits.find((c) => c.circuit === circuit)?.channels.length ?? 0)
    : undefined;
  const showAbsent = Boolean(content.absent) && (count === undefined || count === 0);
  if (!content.strong && !showAbsent && !content.relating && !content.experiments?.length) {
    return null;
  }
  return (
    <div class="circuit-deep">
      <Note label="When it leads" text={content.strong} />
      {showAbsent ? (
        <div class="deep-note">
          <h5 class="deep-label">
            {count === 0 ? 'None of this circuit in your chart' : 'If a chart has none of it'}
          </h5>
          <p class="fact-text">{content.absent}</p>
        </div>
      ) : null}
      <Note label="In relationships" text={content.relating} />
      <Experiments items={content.experiments ?? []} />
    </div>
  );
}

/** What a stream looks like when strong and under pressure, when written. */
export function StreamDeep({ stream }: { stream: Stream }) {
  const content = STREAMS[stream];
  if (!content.strong && !content.stress) return null;
  return (
    <div class="circuit-deep stream-deep">
      <Note label="When it is strong" text={content.strong} />
      <Note label="Under pressure" text={content.stress} />
    </div>
  );
}
