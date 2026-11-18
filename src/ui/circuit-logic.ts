import type { Circuit, CircuitBreakdown } from '@content/schema';

/** One horizontal bar of the circuit chart. */
export interface BarRow {
  circuit: Circuit;
  count: number;
  /** Whole percent of the chart's complete channels (0 to 100). */
  percent: number;
}

/** The four circuit bars of a breakdown, in display order. */
export function circuitBars(breakdown: CircuitBreakdown): BarRow[] {
  return breakdown.circuits.map((c) => ({
    circuit: c.circuit,
    count: c.channels.length,
    percent: Math.round(c.share * 100),
  }));
}

function channelsWord(n: number): string {
  return n === 1 ? 'channel' : 'channels';
}

/**
 * One plain sentence about which circuit leads: "Mostly Collective: 5 of 8
 * channels", "All 3 channels are Tribal", "Your only complete channel is in the
 * Individual circuit", "Evenly spread: ..." or "No complete channels yet".
 */
export function dominantSentence(breakdown: CircuitBreakdown): string {
  const total = breakdown.totalChannels;
  if (total === 0) return 'No complete channels yet';
  if (breakdown.dominant) {
    const count = breakdown.circuits.find((c) => c.circuit === breakdown.dominant)?.channels.length;
    if (total === 1) return `Your only complete channel is in the ${breakdown.dominant} circuit`;
    if (count === total) return `All ${total} channels are ${breakdown.dominant}`;
    return `Mostly ${breakdown.dominant}: ${count ?? 0} of ${total} ${channelsWord(total)}`;
  }
  const top = Math.max(...breakdown.circuits.map((c) => c.channels.length));
  const leaders = breakdown.circuits.filter((c) => c.channels.length === top);
  return `Evenly spread: ${leaders.map((c) => c.circuit).join(' and ')} tie with ${top} of ${total}`;
}

/** Short phrase for one person: `mostly Tribal`, `evenly spread` or `no complete channels`. */
export function leadPhrase(breakdown: CircuitBreakdown): string {
  if (breakdown.totalChannels === 0) return 'has no complete channels';
  return breakdown.dominant ? `is mostly ${breakdown.dominant}` : 'is evenly spread';
}

/** "Ada is mostly Individual, Bo is mostly Collective" in one sentence. */
export function comparisonSentence(
  nameA: string,
  a: CircuitBreakdown,
  nameB: string,
  b: CircuitBreakdown,
): string {
  if (a.dominant && a.dominant === b.dominant) {
    return `${nameA} and ${nameB} are both mostly ${a.dominant}.`;
  }
  return `${nameA} ${leadPhrase(a)}, ${nameB} ${leadPhrase(b)}.`;
}
