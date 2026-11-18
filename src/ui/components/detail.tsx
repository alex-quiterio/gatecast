import type { ComponentChildren } from 'preact';
import type {
  AuthorityName,
  CenterName,
  Chart,
  ChartType,
  DefinitionName,
  DynamicKind,
  PlanetName,
} from '@/types';
import {
  AUTHORITIES,
  CENTERS,
  CHANNELS,
  CIRCUITS,
  CROSS_ANGLES,
  CROSS_NAMES,
  DEFINITIONS,
  DYNAMICS,
  GATES,
  GLOSSARY,
  PLANETS,
  PROFILES,
  QUARTERS,
  STREAMS,
  TYPES,
  circuitBreakdown,
  incarnationCross,
  lineMeaning,
  quarterOfGate,
  tipFor,
} from '@content';
import type { CrossAngle, Quarter } from '@content/schema';
import { parseCrossId } from '@ui/cross-logic';
import { parseSelection } from '@ui/selection-logic';
import { centerLabel } from '@ui/views/common';
import { ChannelCircuit, CircuitDetailBody } from './circuits';
import { GateStrip } from './cross-card';
import { Chip } from './info-button';
import { LineList } from './lines';

function Fact({ label, text }: { label: string; text: string | undefined }) {
  if (!text) return null;
  return (
    <div class="fact">
      <dt>{label}</dt>
      <dd>{text}</dd>
    </div>
  );
}

function FactNode({ label, children }: { label: string; children: ComponentChildren }) {
  return (
    <div class="fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  lead,
  children,
  after,
}: {
  eyebrow: string;
  title: string;
  lead?: string | undefined;
  children?: ComponentChildren;
  after?: ComponentChildren;
}) {
  return (
    <article class="detail-body">
      <p class="eyebrow">{eyebrow}</p>
      <h3>{title}</h3>
      {lead ? <p class="lead">{lead}</p> : null}
      <dl class="facts">{children}</dl>
      {after}
    </article>
  );
}

/** Placeholder shown before anything is selected. */
export function EmptyDetail() {
  return (
    <p class="empty-hint">
      Select a gate, channel or center on the chart, or any underlined term, to read its full
      explanation here.
    </p>
  );
}

/** Props of {@link Detail}. */
export interface DetailProps {
  /** Same keys as `tipFor`: `gate:20`, `center:Throat`, ... */
  tipKey: string;
  /** Optional chart, to show how the item appears in it. */
  chart?: Chart | undefined;
}

/**
 * Full explanation for a tooltip key, built from the content module. Unknown
 * keys fall back to the tooltip text.
 */
export function Detail({ tipKey: key, chart }: DetailProps) {
  const at = key.indexOf(':');
  const kind = at >= 0 ? key.slice(0, at) : key;
  const value = at >= 0 ? key.slice(at + 1) : '';

  switch (kind) {
    case 'gate':
    case 'gateline': {
      const sel = parseSelection(key);
      const number = sel?.kind === 'gate' || sel?.kind === 'gateline' ? sel.gate : undefined;
      const line = sel?.kind === 'gateline' ? sel.line : undefined;
      const gate = number === undefined ? undefined : GATES[number];
      if (gate) {
        const source = chart?.gateSources[gate.number];
        const where =
          source === undefined
            ? undefined
            : source === 'both'
              ? 'Active in both your Personality and Design.'
              : `Active in your ${source === 'personality' ? 'Personality (conscious)' : 'Design (unconscious)'}.`;
        const meaning = line ? lineMeaning(gate.number, line) : undefined;
        return (
          <Panel
            eyebrow={`Gate ${gate.number}${line ? `.${line}` : ''} · ${gate.iching}`}
            title={gate.name}
            lead={gate.keynote}
            after={<LineList gate={gate.number} chart={chart} focusLine={line} />}
          >
            {line && meaning ? (
              <FactNode label={`Line ${line}`}>
                <b>{meaning.title}</b>
                <span class="fact-text">{meaning.summary}</span>
              </FactNode>
            ) : null}
            <Fact label="In depth" text={gate.summary} />
            <Fact label="When defined" text={gate.whenDefined} />
            <Fact label="In this chart" text={where} />
          </Panel>
        );
      }
      break;
    }
    case 'channel': {
      const channel = (
        CHANNELS as Record<string, (typeof CHANNELS)[keyof typeof CHANNELS] | undefined>
      )[value];
      if (channel) {
        const both = value.split('-').map((g) => GATES[Number(g)]?.name);
        const complete = chart?.channels.some((c) => `${c.gates[0]}-${c.gates[1]}` === value);
        return (
          <Panel eyebrow={`Channel ${value}`} title={channel.name} lead={channel.summary}>
            <FactNode label="Circuit">
              <ChannelCircuit channelKey={value} />
            </FactNode>
            <Fact label="Gates" text={both.filter(Boolean).join(' + ')} />
            <Fact
              label="In this chart"
              text={
                chart
                  ? complete
                    ? 'Complete (defined).'
                    : 'Not a complete channel here.'
                  : undefined
              }
            />
          </Panel>
        );
      }
      break;
    }
    case 'center': {
      const center = CENTERS[value as CenterName];
      if (center) {
        const state = chart
          ? chart.definedCenters.includes(value as CenterName)
            ? 'Defined in this chart.'
            : 'Open in this chart.'
          : undefined;
        return (
          <Panel eyebrow="Center" title={center.title} lead={center.function}>
            <Fact label="Theme" text={center.theme} />
            <Fact label="When defined" text={center.defined} />
            <Fact label="When open" text={center.open} />
            <Fact label="Question to ask" text={center.question} />
            <Fact label="In this chart" text={state} />
          </Panel>
        );
      }
      break;
    }
    case 'type': {
      const type = TYPES[value as ChartType];
      if (type) {
        return (
          <Panel eyebrow="Type" title={value} lead={type.tagline}>
            <Fact label="Overview" text={type.summary} />
            <Fact label="Strategy" text={type.strategy} />
            <Fact label="Not-self theme" text={type.notSelfTheme} />
            <Fact label="Signature" text={type.signature} />
            <Fact label="Aura" text={type.aura} />
            <Fact label="Sharing" text={type.share} />
            {type.advice.length ? (
              <div class="fact">
                <dt>Advice</dt>
                <dd>
                  <ul>
                    {type.advice.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : null}
          </Panel>
        );
      }
      break;
    }
    case 'authority': {
      const authority = AUTHORITIES[value as AuthorityName];
      if (authority) {
        return (
          <Panel eyebrow="Authority" title={authority.title} lead={authority.summary}>
            <Fact label="How to use it" text={authority.howToUse} />
          </Panel>
        );
      }
      break;
    }
    case 'profile': {
      const profile = PROFILES[value];
      if (profile)
        return (
          <Panel eyebrow="Profile" title={`${value} · ${profile.name}`} lead={profile.summary} />
        );
      break;
    }
    case 'definition': {
      const definition = DEFINITIONS[value as DefinitionName];
      if (definition)
        return <Panel eyebrow="Definition" title={definition.title} lead={definition.summary} />;
      break;
    }
    case 'planet': {
      const planet = PLANETS[value as PlanetName];
      if (planet)
        return (
          <Panel eyebrow="Planet" title={`${planet.glyph} ${planet.label}`} lead={planet.meaning} />
        );
      break;
    }
    case 'dynamic': {
      const dynamic = DYNAMICS[value as DynamicKind];
      if (dynamic) {
        return (
          <Panel eyebrow="Dynamic" title={dynamic.title} lead={dynamic.summary}>
            <Fact label="Example" text={dynamic.example} />
          </Panel>
        );
      }
      break;
    }
    case 'cross': {
      const angle = CROSS_ANGLES[value as CrossAngle] as
        (typeof CROSS_ANGLES)[CrossAngle] | undefined;
      if (angle) {
        const own = chart ? incarnationCross(chart) : undefined;
        return (
          <Panel
            eyebrow="Incarnation Cross angle"
            title={`${angle.title} cross`}
            lead={angle.summary}
          >
            <Fact label="Profiles" text={angle.profiles.join(', ')} />
            <Fact
              label="In this chart"
              text={
                own ? `Your cross is a ${own.angle} cross (Profile ${chart?.profile}).` : undefined
              }
            />
          </Panel>
        );
      }
      break;
    }
    case 'quarter': {
      const quarter = QUARTERS[value as Quarter] as (typeof QUARTERS)[Quarter] | undefined;
      if (quarter) {
        const own = chart ? incarnationCross(chart) : undefined;
        return (
          <Panel
            eyebrow="Quarter of the wheel"
            title={quarter.title}
            lead={quarter.theme || undefined}
            after={<GateStrip quarter={value as Quarter} chart={chart} />}
          >
            <Fact label="Overview" text={quarter.summary} />
            <Fact label="Gates" text={quarter.gates.join(', ')} />
            <Fact
              label="In this chart"
              text={
                own
                  ? own.quarter === value
                    ? 'Your personality Sun gate is in this quarter.'
                    : `Your personality Sun gate is in the ${QUARTERS[own.quarter].title}.`
                  : undefined
              }
            />
          </Panel>
        );
      }
      break;
    }
    case 'crossname': {
      const parsed = parseCrossId(value);
      const name = parsed ? CROSS_NAMES[`${parsed.angle}|${parsed.gate}`] : undefined;
      if (parsed) {
        const quarter = quarterOfGate(parsed.gate);
        const angle = CROSS_ANGLES[parsed.angle];
        return (
          <Panel
            eyebrow={`${parsed.angle} cross · Sun gate ${parsed.gate}`}
            title={name ? `${parsed.angle} Cross of ${name}` : `${parsed.angle} Cross`}
            lead={name ? undefined : 'No traditional name is listed for this cross yet.'}
          >
            <FactNode label="Angle">
              <Chip tip={`cross:${parsed.angle}`}>{angle.title}</Chip>
              {angle.summary ? <span class="fact-text">{angle.summary}</span> : null}
            </FactNode>
            <FactNode label="Quarter">
              {quarter ? <Chip tip={`quarter:${quarter}`}>{QUARTERS[quarter].title}</Chip> : null}
            </FactNode>
            <FactNode label="Personality Sun gate">
              <Chip tip={`gate:${parsed.gate}`} class="chip-mono">
                {parsed.gate}
              </Chip>{' '}
              <span class="gate-name">{GATES[parsed.gate]?.name ?? ''}</span>
            </FactNode>
            <Fact
              label="In this chart"
              text={
                chart &&
                incarnationCross(chart).angle === parsed.angle &&
                chart.crossGates.personalitySun === parsed.gate
                  ? 'This is your Incarnation Cross.'
                  : undefined
              }
            />
          </Panel>
        );
      }
      break;
    }
    case 'circuit':
    case 'stream': {
      const sel = parseSelection(key);
      const circuit =
        sel?.kind === 'circuit'
          ? sel.circuit
          : sel?.kind === 'stream'
            ? STREAMS[sel.stream].circuit
            : undefined;
      if (circuit) {
        const content = CIRCUITS[circuit];
        const stream = sel?.kind === 'stream' ? sel.stream : undefined;
        return (
          <Panel
            eyebrow={stream ? `${stream} stream · ${circuit} circuit` : 'Circuit'}
            title={stream ? `${STREAMS[stream].title} stream` : `${content.title} circuit`}
            lead={(stream ? STREAMS[stream].summary : content.tagline) || undefined}
            after={<CircuitDetailBody circuit={circuit} chart={chart} stream={stream} />}
          >
            {chart && stream ? (
              <Fact
                label="In this chart"
                text={`${circuitBreakdown(chart).streams.find((s) => s.stream === stream)?.channels.length ?? 0} complete channels in this stream.`}
              />
            ) : null}
          </Panel>
        );
      }
      break;
    }
    case 'term': {
      const entry = GLOSSARY.find((g) => g.term === value);
      if (entry) return <Panel eyebrow="Glossary" title={entry.term} lead={entry.definition} />;
      break;
    }
    default:
      break;
  }
  const tip = tipFor(key);
  if (tip) return <Panel eyebrow="Note" title={tip.title} lead={tip.body} />;
  return (
    <p class="empty-hint">
      No further detail for {kind === 'center' ? centerLabel(value as CenterName) : key}.
    </p>
  );
}
