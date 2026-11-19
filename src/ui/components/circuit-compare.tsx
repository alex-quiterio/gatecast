import { useMemo } from 'preact/hooks';
import type { ChannelInfo, Chart } from '@/types';
import { circuitBreakdown, circuitPairText } from '@content';
import { comparisonSentence, dominantSentence } from '@ui/circuit-logic';
import { CircuitBarRows } from './circuits';

/** Props of {@link CircuitCompare}. */
export interface CircuitCompareProps {
  a: Chart;
  b: Chart;
  /** Complete channels of the composite (together). */
  composite: readonly ChannelInfo[];
}

/**
 * Compact circuit comparison for the Compare view: each person's circuit bars
 * and the composite's, with one plain sentence about who leans where.
 */
export function CircuitCompare({ a, b, composite }: CircuitCompareProps) {
  const nameA = a.input.name || 'Person A';
  const nameB = b.input.name || 'Person B';
  const { ba, bb, bc } = useMemo(
    () => ({
      ba: circuitBreakdown(a),
      bb: circuitBreakdown(b),
      bc: circuitBreakdown({ ...a, channels: [...composite] }),
    }),
    [a, b, composite],
  );
  const pair = ba.dominant && bb.dominant ? circuitPairText(ba.dominant, bb.dominant) : undefined;
  const columns = [
    { key: 'a', title: nameA, breakdown: ba },
    { key: 'b', title: nameB, breakdown: bb },
    { key: 'c', title: 'Together', breakdown: bc },
  ];
  return (
    <section class="circuit-compare" aria-labelledby="cc-title">
      <h3 class="micro" id="cc-title">
        Circuits
      </h3>
      <p class="cc-sentence">{comparisonSentence(nameA, ba, nameB, bb)}</p>
      <div class="cc-cols">
        {columns.map((c) => (
          <div key={c.key} class="cc-col">
            <h4>{c.title}</h4>
            <CircuitBarRows breakdown={c.breakdown} />
            <p class="muted small">{dominantSentence(c.breakdown)}</p>
          </div>
        ))}
      </div>
      {pair ? (
        <div class="cc-pair">
          <h4>{pair.title}</h4>
          <p>{pair.summary}</p>
        </div>
      ) : null}
    </section>
  );
}
