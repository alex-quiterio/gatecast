import { useEffect, useState } from 'preact/hooks';
import { CHANNEL_LIST } from '@engine';
import type { ChannelInfo, Chart } from '@/types';
import { CHANNELS, CIRCUITS, STREAMS, circuitBreakdown } from '@content';
import type { Circuit, CircuitBreakdown, Stream } from '@content/schema';
import { circuitBars, dominantSentence } from '@ui/circuit-logic';
import { parseSelection } from '@ui/selection-logic';
import { centerLabel, channelId } from '@ui/views/common';
import { CircuitDeep, StreamDeep } from './circuit-deep';
import { Icon } from './icons';
import { Chip } from './info-button';

type ChannelTable = Record<string, { name: string; circuit: Circuit; stream?: Stream } | undefined>;
const CHANNEL_TABLE: ChannelTable = CHANNELS;

function channelName(id: string): string {
  return CHANNEL_TABLE[id]?.name ?? '';
}

/** A circuit's name as a coloured, patterned swatch plus text (never colour alone). */
export function CircuitMark({ circuit }: { circuit: Circuit }) {
  return <span class="cmark" data-circuit={circuit} aria-hidden="true" />;
}

/** Props of {@link CircuitBarRows}. */
export interface CircuitBarRowsProps {
  breakdown: CircuitBreakdown;
  /** Circuit currently selected (its row is emphasised). */
  selected?: Circuit | undefined;
  /** Render each circuit name as a button that selects it (`data-tip="circuit:X"`). */
  interactive?: boolean;
}

/**
 * Four horizontal bars, one per circuit, each with its channel count and
 * percentage in words. Each bar has its own pattern so it reads without colour.
 */
export function CircuitBarRows({ breakdown, selected, interactive = false }: CircuitBarRowsProps) {
  const total = breakdown.totalChannels;
  return (
    <div class="cbars">
      {circuitBars(breakdown).map((row) => {
        const text = `${row.count} of ${total} ${total === 1 ? 'channel' : 'channels'}, ${row.percent} percent`;
        const label = (
          <>
            <CircuitMark circuit={row.circuit} />
            <span class="cbar-name">{row.circuit}</span>
          </>
        );
        return (
          <div
            key={row.circuit}
            class={`cbar${selected === row.circuit ? ' is-selected' : ''}`}
            data-circuit={row.circuit}
          >
            {interactive ? (
              <button
                type="button"
                class="cbar-pick"
                data-tip={`circuit:${row.circuit}`}
                aria-pressed={selected === row.circuit}
              >
                {label}
              </button>
            ) : (
              <span class="cbar-pick">{label}</span>
            )}
            <span class="cbar-track" role="img" aria-label={`${row.circuit}: ${text}`}>
              <span class="cbar-fill" style={{ width: `${row.percent}%` }} />
            </span>
            <span class="cbar-val" aria-hidden="true">
              <b>{row.count}</b> · {row.percent}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ChannelChips({
  channels,
  selected,
}: {
  channels: readonly ChannelInfo[];
  selected: string | undefined;
}) {
  if (channels.length === 0) return <p class="muted small">None in this chart.</p>;
  return (
    <ul class="channel-chips">
      {channels.map((c) => {
        const id = channelId(c);
        return (
          <li key={id}>
            <Chip
              tip={`channel:${id}`}
              class={`chip-mono${selected === `channel:${id}` ? ' is-on' : ''}`}
            >
              {id}
            </Chip>
            <span class="gate-name">{channelName(id)}</span>
          </li>
        );
      })}
    </ul>
  );
}

function CircuitBody({
  circuit,
  breakdown,
  selected,
  chart,
}: {
  circuit: Circuit;
  breakdown: CircuitBreakdown;
  selected: string | undefined;
  chart: Chart;
}) {
  const content = CIRCUITS[circuit];
  const share = breakdown.circuits.find((c) => c.circuit === circuit);
  const inStreams = new Set<string>();
  const streams = content.streams.map((stream) => {
    const sh = breakdown.streams.find((s) => s.stream === stream);
    for (const c of sh?.channels ?? []) inStreams.add(channelId(c));
    return { stream, channels: sh?.channels ?? [] };
  });
  const loose = (share?.channels ?? []).filter((c) => !inStreams.has(channelId(c)));
  return (
    <div class="circuit-body">
      {content.tagline ? <p class="circuit-tagline">{content.tagline}</p> : null}
      {content.summary ? <p class="fact-text">{content.summary}</p> : null}
      {content.theme ? <p class="fact-text muted">{content.theme}</p> : null}
      <CircuitDeep circuit={circuit} chart={chart} />
      {streams.map(({ stream, channels }) => {
        const s = STREAMS[stream];
        const sel = selected === `stream:${stream}`;
        return (
          <div key={stream} class={`stream${sel ? ' is-selected' : ''}`}>
            <button
              type="button"
              class="stream-pick"
              data-tip={`stream:${stream}`}
              aria-pressed={sel}
            >
              <b>{s.title}</b> stream
              <span class="muted">
                {' '}
                · {channels.length} {channels.length === 1 ? 'channel' : 'channels'}
              </span>
            </button>
            {s.summary ? <p class="fact-text small">{s.summary}</p> : null}
            <StreamDeep stream={stream} />
            <ChannelChips channels={channels} selected={selected} />
          </div>
        );
      })}
      {streams.length === 0 || loose.length > 0 ? (
        <div class="stream">
          {streams.length > 0 ? <p class="stream-pick plain">Other channels</p> : null}
          <ChannelChips channels={loose} selected={selected} />
        </div>
      ) : null}
    </div>
  );
}

/** Props of {@link CircuitsPanel}. */
export interface CircuitsPanelProps {
  chart: Chart;
  /** The inspector's selection key. */
  selected: string | undefined;
  /** Reset the circuit/stream highlight on the canvas. */
  onClear: () => void;
  /** Show the full explanation of the selected channel (Overview tab). */
  onOpenDetail?: (() => void) | undefined;
}

/**
 * The inspector's Circuits tab: bars per circuit, the dominant circuit in
 * words, and per circuit the streams and this chart's channels. Selecting a
 * circuit or stream (it sets the `circuit:` or `stream:` key) highlights only
 * its channels on the BodyGraph.
 */
export function CircuitsPanel({ chart, selected, onClear, onOpenDetail }: CircuitsPanelProps) {
  const breakdown = circuitBreakdown(chart);
  const sel = parseSelection(selected);
  const activeCircuit =
    sel?.kind === 'circuit'
      ? sel.circuit
      : sel?.kind === 'stream'
        ? STREAMS[sel.stream].circuit
        : undefined;
  const [open, setOpen] = useState<ReadonlySet<Circuit>>(
    () => new Set(activeCircuit ? [activeCircuit] : []),
  );
  useEffect(() => {
    if (activeCircuit) setOpen((o) => (o.has(activeCircuit) ? o : new Set([...o, activeCircuit])));
  }, [activeCircuit]);
  const toggle = (c: Circuit): void =>
    setOpen((o) => {
      const next = new Set(o);
      if (!next.delete(c)) next.add(c);
      return next;
    });
  const channelSel = sel?.kind === 'channel' ? sel.id : undefined;

  return (
    <div class="circuits">
      <header class="circuits-head">
        <p class="circuit-lead" aria-live="polite">
          {dominantSentence(breakdown)}
        </p>
        <p class="muted small">
          Circuits group the 36 channels by theme. Pick a circuit or stream to light up only its
          channels on the BodyGraph.
        </p>
        {activeCircuit ? (
          <button type="button" class="btn btn-sm btn-ghost" onClick={onClear}>
            <Icon name="close" size={12} /> Clear highlight
          </button>
        ) : null}
      </header>
      {breakdown.totalChannels === 0 ? (
        <p class="empty-hint">
          This chart has no complete channels, so every circuit is empty. Hanging gates do not count
          toward a circuit until their partner gate completes the channel.
        </p>
      ) : null}
      <ul class="circuit-list">
        {breakdown.circuits.map((share) => {
          const circuit = share.circuit;
          const isOpen = open.has(circuit);
          const row = circuitBars({ ...breakdown, circuits: [share] })[0];
          const picked = sel?.kind === 'circuit' && sel.circuit === circuit;
          const text = row
            ? `${row.count} of ${breakdown.totalChannels} channels, ${row.percent} percent`
            : '';
          return (
            <li
              key={circuit}
              class={`circuit-item${picked ? ' is-selected' : ''}${activeCircuit === circuit ? ' is-active' : ''}`}
              data-circuit={circuit}
            >
              <div class="circuit-head">
                <button
                  type="button"
                  class="circuit-pick"
                  data-tip={`circuit:${circuit}`}
                  aria-pressed={picked}
                >
                  <span class="circuit-line">
                    <CircuitMark circuit={circuit} />
                    <span class="cbar-name">{circuit}</span>
                    <span class="cbar-val">
                      <b>{row?.count ?? 0}</b> · {row?.percent ?? 0}%
                    </span>
                  </span>
                  <span class="cbar-track" role="img" aria-label={`${circuit}: ${text}`}>
                    <span class="cbar-fill" style={{ width: `${row?.percent ?? 0}%` }} />
                  </span>
                </button>
                <button
                  type="button"
                  class="circuit-toggle"
                  aria-expanded={isOpen}
                  aria-controls={`circuit-body-${circuit}`}
                  onClick={() => toggle(circuit)}
                >
                  <Icon name="chevron" size={14} class="icon chev" />
                  <span class="sr-only">
                    {isOpen ? 'Hide' : 'Show'} streams and channels of {circuit}
                  </span>
                </button>
              </div>
              {isOpen ? (
                <div id={`circuit-body-${circuit}`}>
                  <CircuitBody
                    circuit={circuit}
                    breakdown={breakdown}
                    selected={selected}
                    chart={chart}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {channelSel ? (
        <div class="circuit-channel">
          <p>
            <b>Channel {channelSel}</b> {channelName(channelSel)}
            {CHANNEL_TABLE[channelSel]
              ? ` · ${CHANNEL_TABLE[channelSel]?.circuit}${CHANNEL_TABLE[channelSel]?.stream ? `, ${CHANNEL_TABLE[channelSel]?.stream}` : ''}`
              : ''}
          </p>
          {onOpenDetail ? (
            <button type="button" class="btn btn-sm" onClick={onOpenDetail}>
              Read the full explanation
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Props of {@link CircuitDetailBody}. */
export interface CircuitDetailBodyProps {
  circuit: Circuit;
  /** A chart to mark and count against; omit for the plain reference. */
  chart?: Chart | undefined;
  /** The stream to emphasise, when the detail was opened from a stream key. */
  stream?: Stream | undefined;
}

/**
 * Reference detail of a circuit: tagline, summary, theme, then each stream with
 * every one of its channels (name, gates, centers). Channels the chart has
 * complete are marked.
 */
export function CircuitDetailBody({ circuit, chart, stream }: CircuitDetailBodyProps) {
  const content = CIRCUITS[circuit];
  const mine = new Set((chart?.channels ?? []).map(channelId));
  const entries = Object.entries(CHANNEL_TABLE).filter(([, c]) => c?.circuit === circuit);
  const groups: { key: string; title: string; summary: string; ids: string[] }[] = content.streams
    .map((s) => ({
      key: s,
      title: `${STREAMS[s].title} stream`,
      summary: STREAMS[s].summary,
      ids: entries.filter(([, c]) => c?.stream === s).map(([id]) => id),
    }))
    .filter((g) => g.ids.length > 0);
  const grouped = new Set(groups.flatMap((g) => g.ids));
  const rest = entries.map(([id]) => id).filter((id) => !grouped.has(id));
  if (rest.length > 0) {
    groups.push({
      key: 'rest',
      title: groups.length > 0 ? 'Other channels' : 'Channels',
      summary: '',
      ids: rest,
    });
  }
  const count = breakdownCount(chart, circuit);
  return (
    <div class="circuit-detail">
      {content.summary ? <p class="fact-text">{content.summary}</p> : null}
      {content.theme ? <p class="fact-text muted">{content.theme}</p> : null}
      {count ? <p class="fact-text">{count}</p> : null}
      <CircuitDeep circuit={circuit} chart={chart} />
      {groups.map((g) => (
        <section key={g.key} class={`stream${stream && g.key === stream ? ' is-selected' : ''}`}>
          <h4 class="stream-pick plain">{g.title}</h4>
          {g.summary ? <p class="fact-text small">{g.summary}</p> : null}
          {g.key !== 'rest' ? <StreamDeep stream={g.key as Stream} /> : null}
          <ul class="channel-rows">
            {g.ids.map((id) => {
              const ch = CHANNEL_TABLE[id];
              const [a = 0, b = 0] = id.split('-').map(Number);
              const centers = CHANNEL_LIST.find((c) => c.gates[0] === a && c.gates[1] === b);
              return (
                <li key={id} class={mine.has(id) ? 'is-mine' : undefined}>
                  <Chip tip={`channel:${id}`} class="chip-mono">
                    {a}-{b}
                  </Chip>
                  <span class="gate-name">{ch?.name ?? ''}</span>
                  {centers ? <span class="cell-sub">{centersText(centers)}</span> : null}
                  {mine.has(id) ? <span class="mine-badge">In your chart</span> : null}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function breakdownCount(chart: Chart | undefined, circuit: Circuit): string {
  if (!chart) return '';
  const b = circuitBreakdown(chart);
  const n = b.circuits.find((c) => c.circuit === circuit)?.channels.length ?? 0;
  if (b.totalChannels === 0) return 'This chart has no complete channels yet.';
  return `In this chart: ${n} of ${b.totalChannels} complete ${b.totalChannels === 1 ? 'channel' : 'channels'}${b.dominant === circuit ? ' (your dominant circuit)' : ''}.`;
}

/** Circuit and stream of one channel as badges with a one-line explanation. */
export function ChannelCircuit({ channelKey }: { channelKey: string }) {
  const ch = CHANNEL_TABLE[channelKey];
  if (!ch) return null;
  const stream = ch.stream;
  return (
    <div class="channel-circuit">
      <p>
        <Chip tip={`circuit:${ch.circuit}`} class="chip-circuit" key="c">
          <CircuitMark circuit={ch.circuit} />
          {ch.circuit} circuit
        </Chip>{' '}
        {stream ? (
          <Chip tip={`stream:${stream}`} class="chip-circuit">
            {stream} stream
          </Chip>
        ) : null}
      </p>
      {CIRCUITS[ch.circuit].tagline ? (
        <p class="fact-text small">{CIRCUITS[ch.circuit].tagline}</p>
      ) : null}
      {stream && STREAMS[stream].summary ? (
        <p class="fact-text small">{STREAMS[stream].summary}</p>
      ) : null}
    </div>
  );
}

/** Centers of a channel, for lists. */
export function centersText(c: ChannelInfo): string {
  return `${centerLabel(c.centers[0])} to ${centerLabel(c.centers[1])}`;
}
