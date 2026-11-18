import type { ComponentChildren } from 'preact';
import type { Activation, Chart } from '@/types';
import {
  AUTHORITIES,
  CENTERS,
  CHANNELS,
  GATES,
  PLANETS,
  PROFILES,
  TYPES,
  incarnationCross,
} from '@content';
import { gateLineKey, selectionGate } from '@ui/selection-logic';
import { centerLabel, channelId, typeClass } from '@ui/views/common';
import { Chip, InfoButton } from './info-button';

function Fact({
  label,
  tip,
  children,
  wide = false,
  extra = '',
}: {
  label: string;
  tip: string;
  children: ComponentChildren;
  wide?: boolean;
  extra?: string;
}) {
  return (
    <div class={`kf ${wide ? 'kf-wide' : ''} ${extra}`.trim()}>
      <dt>
        <span class="micro">{label}</span>
        <InfoButton tip={tip} label={label} />
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

/** The compact "key facts" strip: Type, Strategy, Authority, Profile, Definition, Not-self, Cross. */
export function KeyFacts({ chart }: { chart: Chart }) {
  const cross = chart.crossGates;
  const named = incarnationCross(chart);
  const gate = (n: number) => (
    <Chip tip={`gate:${n}`} class="chip-mono">
      {n}
    </Chip>
  );
  return (
    <dl class="keyfacts" aria-label="Key facts">
      <Fact label="Type" tip={`type:${chart.type}`} wide extra={`kf-type ${typeClass(chart.type)}`}>
        <span class="type-name">{chart.type}</span>
        <span class="kf-sub">{TYPES[chart.type]?.tagline ?? ''}</span>
      </Fact>
      <Fact label="Strategy" tip="term:Strategy">
        {chart.strategy}
      </Fact>
      <Fact label="Authority" tip={`authority:${chart.authority}`}>
        {AUTHORITIES[chart.authority]?.title ?? chart.authority}
      </Fact>
      <Fact label="Profile" tip={`profile:${chart.profile}`}>
        <span class="mono">{chart.profile}</span>
        <span class="kf-sub">{PROFILES[chart.profile]?.name ?? ''}</span>
      </Fact>
      <Fact label="Definition" tip={`definition:${chart.definition}`}>
        {chart.definition}
      </Fact>
      <Fact label="Not-self theme" tip="term:Not-Self Theme" wide extra="kf-self">
        {chart.notSelfTheme}
      </Fact>
      <Fact label="Incarnation Cross" tip={`cross:${named.angle}`} wide extra="kf-cross">
        <span class="cross-title">{named.title}</span>
        <span class="cross">
          {gate(cross.personalitySun)}/{gate(cross.personalityEarth)}
          <span class="sep"> | </span>
          {gate(cross.designSun)}/{gate(cross.designEarth)}
        </span>
      </Fact>
    </dl>
  );
}

/** One activation table (Personality or Design). */
export function ActivationTable({
  title,
  source,
  rows,
  selected,
}: {
  title: string;
  source: 'personality' | 'design';
  rows: readonly Activation[];
  selected: string | undefined;
}) {
  return (
    <div class="table-wrap">
      <table class="data">
        <caption>
          <span class={`swatch swatch-${source}`} aria-hidden="true" />
          {title}
        </caption>
        <thead>
          <tr>
            <th scope="col">Planet</th>
            <th scope="col">G.L.C.T</th>
            <th scope="col">Gate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr
              key={a.planet}
              class={selectionGate(selected) === a.gate ? 'is-selected' : undefined}
            >
              <th scope="row">
                <Chip tip={`planet:${a.planet}`}>
                  <span aria-hidden="true">{PLANETS[a.planet]?.glyph ?? ''}</span>{' '}
                  {PLANETS[a.planet]?.label ?? a.planet}
                </Chip>
              </th>
              <td>
                <Chip
                  tip={gateLineKey(a.gate, a.line)}
                  class={`chip-mono chip-line${selected === gateLineKey(a.gate, a.line) ? ' is-on' : ''}`}
                >
                  {a.gate}.{a.line}
                </Chip>
                <span class="mono glc-rest" aria-label={`color ${a.color}, tone ${a.tone}`}>
                  .{a.color}.{a.tone}
                </span>
              </td>
              <td class="gate-cell">
                <Chip tip={`gate:${a.gate}`} class="chip-link">
                  {GATES[a.gate]?.name ?? `Gate ${a.gate}`}
                </Chip>
                <Chip tip={`center:${a.center}`} class="chip-quiet">
                  {centerLabel(a.center)}
                </Chip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Complete channels and hanging gates. */
export function ChannelsPanel({ chart, selected }: { chart: Chart; selected: string | undefined }) {
  return (
    <div class="stack">
      <div class="table-wrap">
        <table class="data">
          <caption>Channels ({chart.channels.length})</caption>
          <thead>
            <tr>
              <th scope="col">Channel</th>
              <th scope="col">Name</th>
            </tr>
          </thead>
          <tbody>
            {chart.channels.length === 0 ? (
              <tr>
                <td colSpan={2} class="empty-cell">
                  No complete channels: every center is open or reached only through hanging gates.
                </td>
              </tr>
            ) : (
              chart.channels.map((c) => {
                const id = channelId(c);
                const info = (
                  CHANNELS as Record<string, { name: string; circuit?: string } | undefined>
                )[id];
                return (
                  <tr key={id} class={selected === `channel:${id}` ? 'is-selected' : undefined}>
                    <th scope="row">
                      <Chip tip={`channel:${id}`} class="chip-mono">
                        {id}
                      </Chip>
                    </th>
                    <td>
                      <span class="gate-name">{info?.name ?? ''}</span>
                      <span class="cell-sub">
                        {centerLabel(c.centers[0])} to {centerLabel(c.centers[1])}
                        {info?.circuit ? ` · ${info.circuit}` : ''}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div class="table-wrap">
        <table class="data">
          <caption>
            Hanging gates ({chart.hangingGates.length})
            <span class="cap-sub">Active gates whose channel partner is not.</span>
          </caption>
          <tbody>
            {chart.hangingGates.length === 0 ? (
              <tr>
                <td class="empty-cell">None.</td>
              </tr>
            ) : (
              chart.hangingGates.map((g) => (
                <tr key={g} class={selected === `gate:${g}` ? 'is-selected' : undefined}>
                  <th scope="row">
                    <Chip tip={`gate:${g}`} class="chip-mono">
                      {g}
                    </Chip>
                  </th>
                  <td>{GATES[g]?.name ?? ''}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Defined and open centers with what each means. */
export function CentersPanel({ chart, selected }: { chart: Chart; selected: string | undefined }) {
  const rows = [
    ...chart.definedCenters.map((c) => ({ c, open: false })),
    ...chart.openCenters.map((c) => ({ c, open: true })),
  ];
  return (
    <div class="table-wrap">
      <table class="data">
        <caption>
          Centers ({chart.definedCenters.length} defined, {chart.openCenters.length} open)
        </caption>
        <thead>
          <tr>
            <th scope="col">Center</th>
            <th scope="col">State</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ c, open }) => (
            <tr key={c} class={selected === `center:${c}` ? 'is-selected' : undefined}>
              <th scope="row">
                <Chip tip={`center:${c}`} class={open ? 'chip-open' : 'chip-defined'}>
                  {centerLabel(c)}
                </Chip>
              </th>
              <td>
                <span class="gate-name">{open ? 'Open' : 'Defined'}</span>
                <span class="cell-sub">{CENTERS[c]?.theme ?? ''}</span>
                <span class="cell-sub cell-body">
                  {(open ? CENTERS[c]?.open : CENTERS[c]?.defined) ?? ''}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
